import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { env } from './config/env.js';
import { db, pingDb, closeDb } from './models/db.js';
import { DrizzleCharacterRepository } from './models/repositories/DrizzleCharacterRepository.js';
import { StorageService } from './storage/StorageService.js';
import { GatewayManager } from './gateway/GatewayManager.js';
import { registerPgcRoutes } from './api/pgc.js';
import { registerMapDraftRoutes } from './api/mapDrafts.js';

const app = Fastify({ logger: { level: 'info' } });
const storage = new StorageService();

if (!(await pingDb())) {
  console.error('[Boot] Cannot connect to PostgreSQL. Check DATABASE_URL.');
  process.exit(1);
}
await storage.ensureBucket();

const gateway = new GatewayManager(new DrizzleCharacterRepository(db), env.AUTOSAVE_INTERVAL_MS);

await app.register(cors, { origin: true });
await app.register(websocket);

app.get('/health', async () => {
  const [dbOk, storageOk] = await Promise.all([pingDb(), storage.ping()]);
  return {
    status: dbOk && storageOk ? 'ok' : 'degraded',
    server: 'RealmShaper Online Game Server',
    version: '0.2.0',
    db: dbOk ? 'ok' : 'down',
    storage: storageOk ? 'ok' : 'down'
  };
});

app.get('/ws', { websocket: true }, (socket) => gateway.handleConnection(socket));

await registerPgcRoutes(app, db, storage);
await registerMapDraftRoutes(app, db);

const shutdown = async (signal: string): Promise<void> => {
  app.log.info(`[Boot] ${signal} received, shutting down...`);
  await gateway.shutdown();
  await app.close();
  await closeDb();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ port: env.PORT, host: env.HOST });
console.log(` WebSocket Gateway: ws://127.0.0.1:${env.PORT}/ws`);
console.log(` Health Check     : http://127.0.0.1:${env.PORT}/health`);
