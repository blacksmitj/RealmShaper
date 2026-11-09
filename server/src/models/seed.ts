import { db, closeDb } from './db.js';
import { itemTemplates } from './schema.js';

await db
  .insert(itemTemplates)
  .values([
    { id: 'iron_greatsword', name: 'Iron Greatsword', slot: 'weapon', baseStats: { atk: 12 } },
    { id: 'iron_plate', name: 'Iron Plate', slot: 'armor', baseStats: { def: 8 } }
  ])
  .onConflictDoNothing();

console.log('[DB] Seed complete.');
await closeDb();

