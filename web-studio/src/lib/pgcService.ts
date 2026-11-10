export type PgcKind = 'texture' | 'map' | 'weapon' | 'armor' | 'monster' | 'prop';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Mengambil atau membuat persistent guest ID untuk Web Studio creator di browser localStorage.
 */
export function getOrCreateCreatorGuestId(): string {
  const STORAGE_KEY = 'realmshaper_creator_guest_id';
  let guestId = localStorage.getItem(STORAGE_KEY);
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, guestId);
  }
  return guestId;
}

export interface PgcAssetItem {
  id: string;
  kind: PgcKind;
  status: 'pending_upload' | 'uploaded' | 'approved' | 'rejected';
  sizeBytes: number;
  contentType: string;
  createdAt: string;
}

export interface UploadAssetParams {
  kind: PgcKind;
  contentType: string;
  data: Blob | string;
}

export interface UploadResult {
  assetId: string;
  status: 'uploaded';
}

/**
 * Mengambil daftar aset yang dibuat oleh creator ini dari server.
 */
export async function fetchCreatorAssets(kind?: PgcKind): Promise<PgcAssetItem[]> {
  const guestId = getOrCreateCreatorGuestId();
  const params = new URLSearchParams({ guest_id: guestId });
  if (kind) params.append('kind', kind);

  const res = await fetch(`${API_BASE}/pgc/assets?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch assets (${res.status})`);
  }
  return res.json();
}

/**
 * Mengambil presigned download URL dari server/RustFS.
 */
export async function fetchAssetDownloadUrl(assetId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/pgc/assets/${assetId}`);
  if (!res.ok) {
    throw new Error(`Failed to get asset download url (${res.status})`);
  }
  const data = await res.json();
  return data.download_url;
}

/**
 * 2-step presigned direct upload flow:
 * 1. POST /pgc/uploads -> minta presigned S3 PUT URL & buat record pending di DB
 * 2. PUT file langsung ke RustFS S3 endpoint
 * 3. POST /pgc/uploads/:id/complete -> server verifikasi file & ubah status ke 'uploaded'
 */
export async function uploadPgcAsset({
  kind,
  contentType,
  data,
}: UploadAssetParams): Promise<UploadResult> {
  const guestId = getOrCreateCreatorGuestId();
  const blob = typeof data === 'string' ? new Blob([data], { type: contentType }) : data;
  const size = blob.size;

  // 1. Request presigned URL
  const initRes = await fetch(`${API_BASE}/pgc/uploads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guest_id: guestId,
      kind,
      content_type: contentType,
      size,
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.error || `Failed to initiate upload (${initRes.status})`);
  }

  const { asset_id, upload_url } = await initRes.json();

  // 2. Direct PUT ke RustFS
  const s3Res = await fetch(upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });

  if (!s3Res.ok) {
    throw new Error(`Failed to upload to RustFS storage (${s3Res.status})`);
  }

  // 3. Complete & verifikasi di backend
  const completeRes = await fetch(`${API_BASE}/pgc/uploads/${asset_id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guest_id: guestId }),
  });

  if (!completeRes.ok) {
    const err = await completeRes.json().catch(() => ({}));
    throw new Error(err.error || `Failed to verify upload (${completeRes.status})`);
  }

  return {
    assetId: asset_id,
    status: 'uploaded',
  };
}

/**
 * Cek status backend & storage RustFS
 */
export async function checkServerHealth(): Promise<{
  online: boolean;
  db: boolean;
  storage: boolean;
}> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { online: false, db: false, storage: false };
    const data = await res.json();
    return {
      online: data.status === 'ok' || data.status === 'degraded',
      db: data.db === 'ok',
      storage: data.storage === 'ok',
    };
  } catch {
    return { online: false, db: false, storage: false };
  }
}

export interface MapDraftSummary {
  id: string;
  map_id: string;
  map_name: string;
  width: number;
  height: number;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface MapDraftDetail {
  id: string;
  map_id: string;
  map_name: string;
  map_data: any;
  created_at: string;
  updated_at: string;
}

/**
 * Mengambil daftar ringkasan draft map milik pengguna saat ini
 */
export async function fetchMapDrafts(): Promise<MapDraftSummary[]> {
  const guestId = getOrCreateCreatorGuestId();
  const res = await fetch(`${API_BASE}/api/maps/drafts?guest_id=${encodeURIComponent(guestId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch map drafts (${res.status})`);
  }
  return res.json();
}

/**
 * Mengambil 1 detail draft map lengkap
 */
export async function fetchMapDraftDetail(id: string): Promise<MapDraftDetail> {
  const guestId = getOrCreateCreatorGuestId();
  const res = await fetch(`${API_BASE}/api/maps/drafts/${encodeURIComponent(id)}?guest_id=${encodeURIComponent(guestId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch map draft detail (${res.status})`);
  }
  return res.json();
}

/**
 * Menyimpan / memperbarui (upsert) draft map ke database
 */
export async function saveMapDraft(mapId: string, mapName: string, mapData: any): Promise<{ id: string; map_id: string; map_name: string; updated_at: string }> {
  const guestId = getOrCreateCreatorGuestId();
  const res = await fetch(`${API_BASE}/api/maps/drafts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guest_id: guestId,
      map_id: mapId,
      map_name: mapName,
      map_data: mapData,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to save map draft (${res.status})`);
  }
  return res.json();
}

/**
 * Menghapus draft map dari database
 */
export async function deleteMapDraft(id: string): Promise<{ success: boolean; id: string }> {
  const guestId = getOrCreateCreatorGuestId();
  const res = await fetch(`${API_BASE}/api/maps/drafts/${encodeURIComponent(id)}?guest_id=${encodeURIComponent(guestId)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`Failed to delete map draft (${res.status})`);
  }
  return res.json();
}

