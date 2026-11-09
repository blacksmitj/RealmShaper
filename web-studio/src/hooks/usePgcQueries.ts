import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  checkServerHealth,
  uploadPgcAsset,
  fetchCreatorAssets,
  fetchAssetDownloadUrl,
  type PgcKind,
  type UploadAssetParams,
} from '../lib/pgcService';

export const PGC_QUERY_KEYS = {
  health: ['server', 'health'] as const,
  assets: (kind?: PgcKind) => ['pgc', 'assets', kind ?? 'all'] as const,
  assetDownload: (assetId: string) => ['pgc', 'download', assetId] as const,
};

/**
 * Hook untuk memonitor ketersediaan Fastify, PostgreSQL, dan RustFS secara otomatis.
 */
export function useServerHealth() {
  return useQuery({
    queryKey: PGC_QUERY_KEYS.health,
    queryFn: checkServerHealth,
    refetchInterval: 10000,
    staleTime: 8000,
  });
}

/**
 * Hook untuk mengambil daftar karya PGC milik kreator saat ini.
 */
export function useCreatorAssets(kind?: PgcKind) {
  return useQuery({
    queryKey: PGC_QUERY_KEYS.assets(kind),
    queryFn: () => fetchCreatorAssets(kind),
    staleTime: 30000,
  });
}

/**
 * Hook mutation untuk direct upload ke RustFS dan persist ke PostgreSQL.
 * Otomatis invalidasi cache query agar daftar aset langsung terupdate.
 */
export function usePublishAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UploadAssetParams) => uploadPgcAsset(params),
    onSuccess: (_, variables) => {
      // Refresh list aset kreator
      queryClient.invalidateQueries({ queryKey: PGC_QUERY_KEYS.assets(variables.kind) });
      queryClient.invalidateQueries({ queryKey: PGC_QUERY_KEYS.assets() });
    },
  });
}

/**
 * Helper untuk mengambil download URL presigned dari RustFS.
 */
export function useAssetDownload(assetId: string | null) {
  return useQuery({
    queryKey: PGC_QUERY_KEYS.assetDownload(assetId ?? ''),
    queryFn: () => (assetId ? fetchAssetDownloadUrl(assetId) : null),
    enabled: !!assetId,
  });
}

