import http from 'node:http';
import crypto from 'node:crypto';
import { GameEngine } from '../game-engine/GameEngine.js';

interface ClientSession {
  playerId: string;
  socket: any;
}

/**
 * Gateway Manager menggunakan built-in Node.js HTTP & Raw WebSocket RFC 6455 framing.
 * Mendukung protokol 3D C2S/S2C secara native.
 */
export class GatewayManager {
  private sessions: Map<string, ClientSession> = new Map();
  private gameEngine: GameEngine;

  constructor() {
    this.gameEngine = new GameEngine((packet: any) => this.broadcast(packet));
    this.gameEngine.start();
  }

  public handleUpgrade(req: http.IncomingMessage, socket: any): void {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`
    ];

    socket.write(headers.join('\r\n') + '\r\n\r\n');

    const playerId = 'player_' + Math.random().toString(36).substr(2, 6);
    this.sessions.set(playerId, { playerId, socket });

    console.log(`[Gateway] Client connected: ${playerId} (Total active: ${this.sessions.size})`);

    socket.on('data', (buffer: Buffer) => {
      this.decodeFrames(buffer, (msg: string) => {
        try {
          const packet = JSON.parse(msg);
          this.processPacket(playerId, packet, socket);
        } catch (e) {
          console.error(`[Gateway] JSON parse error:`, e);
        }
      });
    });

    socket.on('close', () => {
      this.sessions.delete(playerId);
      this.gameEngine.unregisterPlayer(playerId);
      console.log(`[Gateway] Client disconnected: ${playerId} (Remaining: ${this.sessions.size})`);
      this.broadcast({
        type: 'S2C_ENTITY_DESPAWN',
        data: { id: playerId }
      });
    });

    socket.on('error', () => {
      socket.destroy();
    });
  }

  private processPacket(playerId: string, packet: any, socket: any): void {
    const type = packet.type;
    const data = packet.data || {};

    switch (type) {
      case 'C2S_AUTH': {
        const player = this.gameEngine.registerPlayer(playerId, `Traveler_${playerId.substr(7)}`);
        this.sendPacket(socket, {
          type: 'S2C_AUTH_SUCCESS',
          data: { player_id: playerId, name: player.name }
        });

        this.broadcast({
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
        }, playerId);
        break;
      }

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
        this.broadcast({
          type: 'S2C_PLAYER_ATTACK',
          data: {
            attacker_id: playerId,
            weapon_id: data.weapon_id,
            facing: data.facing || 0.0
          }
        }, playerId);
        break;
      }

      case 'C2S_EQUIPMENT': {
        this.gameEngine.updatePlayerEquipment(playerId, data.weapon_id, data.armor_id);
        this.broadcast({
          type: 'S2C_EQUIPMENT_CHANGE',
          data: {
            entity_id: playerId,
            weapon_id: data.weapon_id,
            armor_id: data.armor_id
          }
        }, playerId);
        break;
      }
    }
  }

  public broadcast(packet: any, ignorePlayerId?: string): void {
    for (const [id, session] of this.sessions.entries()) {
      if (ignorePlayerId && id === ignorePlayerId) continue;
      this.sendPacket(session.socket, packet);
    }
  }

  private sendPacket(socket: any, packet: any): void {
    try {
      const msg = JSON.stringify(packet);
      const frame = this.encodeFrame(msg);
      socket.write(frame);
    } catch {
      // Ignored
    }
  }

  private encodeFrame(message: string): Buffer {
    const payload = Buffer.from(message, 'utf8');
    const length = payload.length;

    let header: Buffer;
    if (length < 126) {
      header = Buffer.from([0x81, length]);
    } else if (length <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }
    return Buffer.concat([header, payload]);
  }

  private decodeFrames(buffer: Buffer, onMessage: (msg: string) => void): void {
    if (buffer.length < 2) return;
    const secondByte = buffer[1];
    const isMasked = (secondByte & 0x80) !== 0;
    let payloadLength = secondByte & 0x7f;
    let offset = 2;

    if (payloadLength === 126) {
      if (buffer.length < 4) return;
      payloadLength = buffer.readUInt16BE(2);
      offset = 4;
    } else if (payloadLength === 127) {
      if (buffer.length < 10) return;
      payloadLength = Number(buffer.readBigUInt64BE(2));
      offset = 10;
    }

    let maskKey: Buffer | null = null;
    if (isMasked) {
      if (buffer.length < offset + 4) return;
      maskKey = buffer.subarray(offset, offset + 4);
      offset += 4;
    }

    if (buffer.length < offset + payloadLength) return;
    const payload = buffer.subarray(offset, offset + payloadLength);
    if (isMasked && maskKey) {
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= maskKey[i % 4];
      }
    }

    const message = payload.toString('utf8');
    onMessage(message);
  }
}
