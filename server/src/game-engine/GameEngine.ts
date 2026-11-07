import { PlayerEntity, Vector3D } from '../models/types.js';

/**
 * Isolated Game Engine (Domain Logic Murni 3D).
 * Menjalankan tick simulasi dunia 3D, sanitasi pergerakan, dan combat math.
 */
export class GameEngine {
  private players: Map<string, PlayerEntity> = new Map();
  private readonly TICK_RATE_MS = 50; // 20 Ticks per detik (20Hz)
  private tickInterval: NodeJS.Timeout | null = null;
  private onStateBroadcast?: (state: any) => void;

  constructor(broadcastCallback?: (state: any) => void) {
    this.onStateBroadcast = broadcastCallback;
  }

  public start(): void {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => this.tick(), this.TICK_RATE_MS);
    console.log(`[GameEngine] Simulation tick loop running at 20Hz (${this.TICK_RATE_MS}ms).`);
  }

  public stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  public registerPlayer(id: string, name: string): PlayerEntity {
    const player: PlayerEntity = {
      id,
      name,
      position: { x: 0.0, y: 0.0, z: 2.0 },
      velocity: { x: 0.0, y: 0.0, z: 0.0 },
      facing: 0.0,
      state: 0,
      health: 150,
      maxHealth: 150,
      weaponId: 'iron_greatsword',
      armorId: 'iron_plate',
      lastActive: Date.now()
    };
    this.players.set(id, player);
    return player;
  }

  public unregisterPlayer(id: string): void {
    this.players.delete(id);
  }

  public getPlayer(id: string): PlayerEntity | undefined {
    return this.players.get(id);
  }

  public updatePlayerMovement(
    id: string,
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    facing: number,
    state: number
  ): void {
    const player = this.players.get(id);
    if (!player) return;

    // Server-Authoritative 3D Speed Check (Max 14.0 m/s untuk dash/buff)
    const MAX_SPEED_3D = 18.0;
    const speedSq = vx * vx + vz * vz;
    if (speedSq > MAX_SPEED_3D * MAX_SPEED_3D) {
      const mag = Math.sqrt(speedSq);
      vx = (vx / mag) * MAX_SPEED_3D;
      vz = (vz / mag) * MAX_SPEED_3D;
    }

    player.position.x = x;
    player.position.y = y;
    player.position.z = z;
    player.velocity.x = vx;
    player.velocity.y = vy;
    player.velocity.z = vz;
    player.facing = facing;
    player.state = state;
    player.lastActive = Date.now();
  }

  public updatePlayerEquipment(id: string, weaponId: string, armorId: string): void {
    const player = this.players.get(id);
    if (!player) return;
    player.weaponId = weaponId;
    player.armorId = armorId;
  }

  public handlePlayerAttack(id: string, weaponId: string, facing: number): { success: boolean } {
    const attacker = this.players.get(id);
    if (!attacker) return { success: false };

    attacker.weaponId = weaponId;
    attacker.facing = facing;
    return { success: true };
  }

  private tick(): void {
    if (this.players.size === 0) return;

    const entitiesSnapshot: any[] = [];
    for (const [id, player] of this.players.entries()) {
      entitiesSnapshot.push({
        id: player.id,
        name: player.name,
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        vx: player.velocity.x,
        vy: player.velocity.y,
        vz: player.velocity.z,
        facing: player.facing,
        state: player.state,
        hp: player.health,
        weapon: player.weaponId,
        armor: player.armorId
      });
    }

    if (this.onStateBroadcast) {
      this.onStateBroadcast({
        type: 'S2C_WORLD_STATE',
        data: { entities: entitiesSnapshot }
      });
    }
  }
}
