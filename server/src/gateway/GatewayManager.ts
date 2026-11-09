import crypto from 'node:crypto';
import type { WebSocket } from 'ws';
import { GameEngine } from '../game-engine/GameEngine.js';
import type { CharacterRepository } from '../game-engine/ports/CharacterRepository.js';

interface ClientSession {
  playerId: string;
  socket: WebSocket;
  authenticated: boolean;
}

const GUEST_ID_RE = /^[0-9a-fA-F-]{16,64}$/;

/**
 * Gateway Manager: menerima socket dari @fastify/websocket, meneruskan paket ke GameEngine,
 * dan mengorkestrasi persistence karakter (load saat auth, autosave, save saat disconnect).
 */
export class GatewayManager {
  private sessions: Map<string, ClientSession> = new Map();
  private gameEngine: GameEngine;
  private autosaveTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly characterRepo: CharacterRepository,
    private readonly autosaveIntervalMs: number
  ) {
    this.gameEngine = new GameEngine((packet: any) => this.broadcast(packet));
    this.gameEngine.start();
    this.autosaveTimer = setInterval(() => void this.saveAll(), this.autosaveIntervalMs);
  }

  public handleConnection(socket: WebSocket): void {
    const playerId = 'player_' + crypto.randomBytes(4).toString('hex');
    this.sessions.set(playerId, { playerId, socket, authenticated: false });
    console.log(`[Gateway] Client connected: ${playerId} (Total active: ${this.sessions.size})`);

    socket.on('message', (raw) => {
      try {
        const packet = JSON.parse(raw.toString());
        void this.processPacket(playerId, packet, socket);
      } catch (e) {
        console.error(`[Gateway] JSON parse error:`, e);
      }
    });

    socket.on('close', () => void this.handleDisconnect(playerId));
    socket.on('error', () => socket.terminate());
  }

  public async shutdown(): Promise<void> {
    if (this.autosaveTimer) clearInterval(this.autosaveTimer);
    this.gameEngine.stop();
    await this.saveAll();
    for (const s of this.sessions.values()) s.socket.close(1001, 'server_shutdown');
  }

  private async handleDisconnect(playerId: string): Promise<void> {
    const session = this.sessions.get(playerId);
    this.sessions.delete(playerId);
    if (session?.authenticated) {
      const snap = this.gameEngine.snapshotPlayer(playerId);
      if (snap) {
        try {
          await this.characterRepo.saveMany([snap]);
        } catch (e) {
          console.error(`[Gateway] Save on disconnect failed for ${playerId}:`, e);
        }
      }
    }
    this.gameEngine.unregisterPlayer(playerId);
    console.log(`[Gateway] Client disconnected: ${playerId} (Remaining: ${this.sessions.size})`);
    this.broadcast({ type: 'S2C_ENTITY_DESPAWN', data: { id: playerId } });
  }

  private async saveAll(): Promise<void> {
    const snaps = this.gameEngine.snapshotAll();
    if (snaps.length === 0) return;
    try {
      await this.characterRepo.saveMany(snaps);
    } catch (e) {
      console.error('[Gateway] Autosave failed:', e);
    }
  }

  private async processPacket(playerId: string, packet: any, socket: WebSocket): Promise<void> {
    const type = packet.type;
    const data = packet.data || {};
    const session = this.sessions.get(playerId);
    if (!session) return;

    if (type === 'C2S_AUTH') {
      if (session.authenticated) return;
      const guestId = String(data.guest_id ?? '');
      if (!GUEST_ID_RE.test(guestId)) {
        this.sendPacket(socket, { type: 'S2C_AUTH_FAILED', data: { reason: 'invalid_guest_id' } });
        return;
      }
      let snapshot;
      try {
        snapshot = await this.characterRepo.loadOrCreate(guestId, 'Traveler');
      } catch (e) {
        console.error('[Gateway] Character load failed:', e);
        this.sendPacket(socket, { type: 'S2C_AUTH_FAILED', data: { reason: 'server_error' } });
        return;
      }
      if (!this.sessions.has(playerId)) return; // disconnected while loading

      session.authenticated = true;
      const player = this.gameEngine.registerPlayer(playerId, snapshot);
      this.sendPacket(socket, {
        type: 'S2C_AUTH_SUCCESS',
        data: {
          player_id: playerId,
          name: player.name,
          x: player.position.x,
          y: player.position.y,
          z: player.position.z,
          facing: player.facing,
          hp: player.health,
          max_hp: player.maxHealth
        }
      });
      this.broadcast(
        {
          type: 'S2C_ENTITY_SPAWN',
          data: {
            id: player.id,
            name: player.name,
            x: player.position.x,
            y: player.position.y,
            z: player.position.z,
            facing: player.facing,
            weapon: player.weaponId,
            armor: player.armorId
          }
        },
        playerId
      );
      return;
    }

    if (!session.authenticated) return;

    switch (type) {
      case 'C2S_MOVE': {
        this.gameEngine.updatePlayerMovement(
          playerId,
          data.x || 0.0,
          data.y || 0.0,
          data.z || 0.0,
          data.vx || 0.0,
          data.vy || 0.0,
          data.vz || 0.0,
          data.facing || 0.0,
          data.state || 0
        );
        break;
      }

      case 'C2S_ATTACK': {
        this.gameEngine.handlePlayerAttack(playerId, data.weapon_id, data.facing || 0.0);
        this.broadcast(
          {
            type: 'S2C_PLAYER_ATTACK',
            data: { attacker_id: playerId, weapon_id: data.weapon_id, facing: data.facing || 0.0 }
          },
          playerId
        );
        break;
      }

      case 'C2S_EQUIPMENT': {
        this.gameEngine.updatePlayerEquipment(playerId, data.weapon_id, data.armor_id);
        this.broadcast(
          {
            type: 'S2C_EQUIPMENT_CHANGE',
            data: { entity_id: playerId, weapon_id: data.weapon_id, armor_id: data.armor_id }
          },
          playerId
        );
        break;
      }
    }
  }

  public broadcast(packet: any, ignorePlayerId?: string): void {
    const msg = JSON.stringify(packet);
    for (const [id, session] of this.sessions.entries()) {
      if (ignorePlayerId && id === ignorePlayerId) continue;
      if (!session.authenticated) continue;
      if (session.socket.readyState === session.socket.OPEN) session.socket.send(msg);
    }
  }

  private sendPacket(socket: WebSocket, packet: any): void {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(packet));
  }
}
