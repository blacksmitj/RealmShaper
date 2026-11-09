import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../models/db.js';
import { accounts, pgcAssets } from '../models/schema.js';
import { StorageError, type StorageService } from '../storage/StorageService.js';

const createUploadBody = z.object({
  guest_id: z.string().regex(/^[0-9a-fA-F-]{16,64}$/),
  kind: z.enum(['texture', 'map', 'weapon', 'armor', 'monster']),
  content_type: z.string().min(3),
  size: z.number().int().positive()
});

const completeBody = z.object({ guest_id: z.string() });

export async function registerPgcRoutes(app: FastifyInstance, db: Database, storage: StorageService): Promise<void> {
  // 1. Minta presigned PUT URL
  app.post('/pgc/uploads', async (req, reply) => {
    const parsed = createUploadBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { guest_id, kind, content_type, size } = parsed.data;

    try {
      storage.validateUpload(kind, content_type, size);
    } catch (e) {
      if (e instanceof StorageError) return reply.code(400).send({ error: e.message });
      throw e;
    }

    // Buat/ambil akun guest secara transparan jika belum terdaftar
    const [account] = await db
      .insert(accounts)
      .values({ guestId: guest_id })
      .onConflictDoUpdate({ target: accounts.guestId, set: { lastLoginAt: new Date() } })
      .returning();

    const assetId = crypto.randomUUID();
    const objectKey = storage.pendingKey(kind, assetId);
    await db.insert(pgcAssets).values({
      id: assetId,
      ownerAccountId: account.id,
      kind,
      objectKey,
      contentType: content_type,
      sizeBytes: size
    });

    const uploadUrl = await storage.createUploadUrl(objectKey, content_type, size);
    return { asset_id: assetId, upload_url: uploadUrl, method: 'PUT', headers: { 'Content-Type': content_type } };
  });

  // 2. Konfirmasi upload selesai -> server verifikasi objek di RustFS
  app.post<{ Params: { id: string } }>('/pgc/uploads/:id/complete', async (req, reply) => {
    const parsed = completeBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body' });

    const rows = await db
      .select({ asset: pgcAssets })
      .from(pgcAssets)
      .innerJoin(accounts, eq(accounts.id, pgcAssets.ownerAccountId))
      .where(and(eq(pgcAssets.id, req.params.id), eq(accounts.guestId, parsed.data.guest_id)))
      .limit(1);
    const asset = rows[0]?.asset;
    if (!asset) return reply.code(404).send({ error: 'asset_not_found' });
    if (asset.status !== 'pending_upload') return reply.code(409).send({ error: `already_${asset.status}` });

    const ok = await storage.verifyUpload(asset.objectKey, asset.contentType, asset.sizeBytes);
    if (!ok) return reply.code(422).send({ error: 'upload_not_verified' });

    await db.update(pgcAssets).set({ status: 'uploaded' }).where(eq(pgcAssets.id, asset.id));
    return { asset_id: asset.id, status: 'uploaded' };
  });

  // 3. List assets milik creator / public approved assets
  app.get<{ Querystring: { guest_id?: string; kind?: string } }>('/pgc/assets', async (req) => {
    const { guest_id, kind } = req.query;

    const baseQuery = db
      .select({
        id: pgcAssets.id,
        kind: pgcAssets.kind,
        status: pgcAssets.status,
        sizeBytes: pgcAssets.sizeBytes,
        contentType: pgcAssets.contentType,
        createdAt: pgcAssets.createdAt,
      })
      .from(pgcAssets)
      .innerJoin(accounts, eq(accounts.id, pgcAssets.ownerAccountId));

    if (guest_id) {
      const conditions = [eq(accounts.guestId, guest_id)];
      if (kind) {
        conditions.push(eq(pgcAssets.kind, kind as any));
      }
      return baseQuery.where(and(...conditions)).orderBy(pgcAssets.createdAt);
    }

    // Default: return approved public assets
    const conditions = [eq(pgcAssets.status, 'approved')];
    if (kind) {
      conditions.push(eq(pgcAssets.kind, kind as any));
    }
    return baseQuery.where(and(...conditions)).orderBy(pgcAssets.createdAt);
  });

  // 4. Download asset yang sudah di-upload (creator) atau approved (public)
  app.get<{ Params: { id: string } }>('/pgc/assets/:id', async (req, reply) => {
    const [asset] = await db.select().from(pgcAssets).where(eq(pgcAssets.id, req.params.id)).limit(1);
    if (!asset || (asset.status !== 'approved' && asset.status !== 'uploaded')) {
      return reply.code(404).send({ error: 'asset_not_found' });
    }
    return { asset_id: asset.id, kind: asset.kind, download_url: await storage.createDownloadUrl(asset.objectKey) };
  });
}

