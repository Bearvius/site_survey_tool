import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';
import dayjs from 'dayjs';
import { settingsService } from './services/settingsService';
import { measurementService } from './services/measurementService';
import { router as apiRouter } from './api/router';

// __dirname available under CommonJS via ts-node-dev

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRouter);

// Serve static client build if exists (production)
app.use(express.static(path.join(__dirname, '../../client/dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/live' });

wss.on('connection', (ws: WebSocket) => {
  const unsub = measurementService.subscribe((sample) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(sample));
    }
  });
  ws.on('close', unsub);
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
settingsService.load();
server.listen(PORT, () => {
  console.log(`[${dayjs().format()}] Server listening on :${PORT}`);
});
