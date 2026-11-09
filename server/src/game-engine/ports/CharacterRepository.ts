import { Vector3D } from '../../models/types.js';

/** Snapshot state karakter yang dipersist. Pure domain type — tanpa dependensi DB. */
export interface CharacterSnapshot {
  characterId: string;
  name: string;
  hp: number;
  maxHp: number;
  mapId: string;
  position: Vector3D;
  facing: number;
}

/** Port persistence; implementasi konkret (Drizzle) berada di models/repositories. */
export interface CharacterRepository {
  loadOrCreate(guestId: string, defaultName: string): Promise<CharacterSnapshot>;
  saveMany(snapshots: CharacterSnapshot[]): Promise<void>;
}

