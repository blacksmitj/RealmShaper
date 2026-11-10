import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq, desc } from 'drizzle-orm';
import type { Database } from '../models/db.js';
import { accounts, mapDrafts } from '../models/schema.js';

const saveDraftBody = z.object({
  guest_id: z.string().regex(/^[0-9a-fA-F-]{16,64}$/),
  map_id: z.string().min(1).max(64),
  map_name: z.string().min(1).max(128),
  map_data: z.record(z.string(), z.any())
});

export async function registerMapDraftRoutes(app: FastifyInstance, db: Database): Promise<void> {
  // 1. Simpan atau perbarui (upsert) draft map
  app.post('/api/maps/drafts', async (req, reply) => {
    const parsed = saveDraftBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const { guest_id, map_id, map_name, map_data } = parsed.data;

    // Pastikan akun guest terdaftar
    const [account] = await db
      .insert(accounts)
      .values({ guestId: guest_id })
      .onConflictDoUpdate({ target: accounts.guestId, set: { lastLoginAt: new Date() } })
      .returning();

    const [saved] = await db
      .insert(mapDrafts)
      .values({
        ownerAccountId: account.id,
        mapId: map_id,
        mapName: map_name,
        mapData: map_data
      })
      .onConflictDoUpdate({
        target: [mapDrafts.ownerAccountId, mapDrafts.mapId],
        set: {
          mapName: map_name,
          mapData: map_data,
          updatedAt: new Date()
        }
      })
      .returning();

    return {
      id: saved.id,
      map_id: saved.mapId,
      map_name: saved.mapName,
      updated_at: saved.updatedAt
    };
  });

  // 2. Ambil list semua draft map milik creator (summary)
  app.get<{ Querystring: { guest_id: string } }>('/api/maps/drafts', async (req, reply) => {
    const { guest_id } = req.query;
    if (!guest_id) {
      return reply.code(400).send({ error: 'guest_id is required' });
    }

    const rows = await db
      .select({
        id: mapDrafts.id,
        map_id: mapDrafts.mapId,
        map_name: mapDrafts.mapName,
        created_at: mapDrafts.createdAt,
        updated_at: mapDrafts.updatedAt,
        width: mapDrafts.mapData,
        theme: mapDrafts.mapData
      })
      .from(mapDrafts)
      .innerJoin(accounts, eq(accounts.id, mapDrafts.ownerAccountId))
      .where(eq(accounts.guestId, guest_id))
      .orderBy(desc(mapDrafts.updatedAt));

    const result = rows.map((r) => {
      const data = r.width as Record<string, any>;
      return {
        id: r.id,
        map_id: r.map_id,
        map_name: r.map_name,
        width: data?.width ?? 20,
        height: data?.height ?? 20,
        theme: data?.theme ?? 'dungeon',
        created_at: r.created_at,
        updated_at: r.updated_at
      };
    });

    return result;
  });

  // 3. Ambil detail data lengkap 1 draft map
  app.get<{ Params: { id: string }; Querystring: { guest_id: string } }>('/api/maps/drafts/:id', async (req, reply) => {
    const { id } = req.params;
    const { guest_id } = req.query;
    if (!guest_id) {
      return reply.code(400).send({ error: 'guest_id is required' });
    }

    const rows = await db
      .select({
        id: mapDrafts.id,
        map_id: mapDrafts.mapId,
        map_name: mapDrafts.mapName,
        map_data: mapDrafts.mapData,
        created_at: mapDrafts.createdAt,
        updated_at: mapDrafts.updatedAt
      })
      .from(mapDrafts)
      .innerJoin(accounts, eq(accounts.id, mapDrafts.ownerAccountId))
      .where(and(eq(mapDrafts.id, id), eq(accounts.guestId, guest_id)))
      .limit(1);

    const draft = rows[0];
    if (!draft) {
      return reply.code(404).send({ error: 'draft_not_found' });
    }

    return draft;
  });

  // 4. Hapus draft map
  app.delete<{ Params: { id: string }; Querystring: { guest_id: string } }>('/api/maps/drafts/:id', async (req, reply) => {
    const { id } = req.params;
    const { guest_id } = req.query;
    if (!guest_id) {
      return reply.code(400).send({ error: 'guest_id is required' });
    }

    const rows = await db
      .select({ id: mapDrafts.id })
      .from(mapDrafts)
      .innerJoin(accounts, eq(accounts.id, mapDrafts.ownerAccountId))
      .where(and(eq(mapDrafts.id, id), eq(accounts.guestId, guest_id)))
      .limit(1);

    const draft = rows[0];
    if (!draft) {
      return reply.code(404).send({ error: 'draft_not_found' });
    }

    await db.delete(mapDrafts).where(eq(mapDrafts.id, id));
    return { success: true, id };
  });
}

