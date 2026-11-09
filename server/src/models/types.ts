export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlayerEntity {
  id: string;
  characterId: string;
  name: string;
  mapId: string;
  position: Vector3D;
  velocity: Vector3D;
  facing: number;
  state: number;
  health: number;
  maxHealth: number;
  weaponId: string;
  armorId: string;
  lastActive: number;
}

export interface ClientMovePacket3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  facing: number;
  state: number;
}

export interface ClientAttackPacket3D {
  weapon_id: string;
  facing: number;
}

export interface ClientEquipmentPacket {
  weapon_id: string;
  armor_id: string;
}
