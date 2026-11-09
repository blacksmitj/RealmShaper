import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, closeDb } from './db.js';

await migrate(db, { migrationsFolder: './drizzle' });
console.log('[DB] Migrations applied.');
await closeDb();

