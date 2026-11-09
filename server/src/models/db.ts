import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { env } from '../config/env.js';
import * as schema from './schema.js';

const client = postgres(env.DATABASE_URL, { max: 10 });

export const db = drizzle(client, { schema });
export type Database = typeof db;

export async function pingDb(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

export async function closeDb(): Promise<void> {
  await client.end({ timeout: 5 });
}

