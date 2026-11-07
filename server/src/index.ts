import http from 'node:http';
import { GatewayManager } from './gateway/GatewayManager.js';

const PORT = 8080;
const HOST = '0.0.0.0';

const gateway = new GatewayManager();

const server = http.createServer((req, res) => {
  // CORS & Health check
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: 'RealmShaper Online Game Server', version: '0.1.0' }));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// Upgrade HTTP Connection ke WebSocket untuk klien Godot
server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws') {
    gateway.handleUpgrade(req, socket);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(` RealmShaper: Online - Game Server Running`);
  console.log(` WebSocket Gateway: ws://127.0.0.1:${PORT}/ws`);
  console.log(` Health Check     : http://127.0.0.1:${PORT}/health`);
  console.log(`=======================================================`);
});
