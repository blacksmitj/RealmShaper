import { eq } from 'drizzle-orm';
import type { Database } from '../db.js';
import { accounts, characters, type CharacterRow } from '../schema.js';
import type { CharacterRepository, CharacterSnapshot } from '../../game-engine/ports/CharacterRepository.js';

export class DrizzleCharacterRepository implements CharacterRepository {
  constructor(private readonly db: Database) {}

  public async loadOrCreate(guestId: string, defaultName: string): Promise<CharacterSnapshot> {
    return this.db.transaction(async (tx) => {
      const [account] = await tx
        .insert(accounts)
        .values({ guestId })
        .onConflictDoUpdate({ target: accounts.guestId, set: { lastLoginAt: new Date() } })
        .returning();

      const existing = await tx.select().from(characters).where(eq(characters.accountId, account.id)).limit(1);
      if (existing.length > 0) return toSnapshot(existing[0]);

      // Nama default dibuat unik dengan suffix dari account id.
      const [created] = await tx
        .insert(characters)
        .values({ accountId: account.id, name: `${defaultName}_${account.id.slice(0, 6)}` })
        .returning();
      return toSnapshot(created);
    });
  }

  public async saveMany(snapshots: CharacterSnapshot[]): Promise<void> {
    if (snapshots.length === 0) return;
    await this.db.transaction(async (tx) => {
      for (const s of snapshots) {
        await tx
          .update(characters)
          .set({
            hp: s.hp,
            maxHp: s.maxHp,
            mapId: s.mapId,
            posX: s.position.x,
            posY: s.position.y,
            posZ: s.position.z,
            facing: s.facing
          })
          .where(eq(characters.id, s.characterId));
      }
    });
  }
}

function toSnapshot(row: CharacterRow): CharacterSnapshot {
  return {
    characterId: row.id,
    name: row.name,
    hp: row.hp,
    maxHp: row.maxHp,
    mapId: row.mapId,
    position: { x: row.posX, y: row.posY, z: row.posZ },
    facing: row.facing
  };
}

