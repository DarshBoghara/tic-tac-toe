require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { registerSocketHandlers } = require('./sockets/socketHandlers');
const { getRoomStats } = require('./game/roomManager');

// ─── Environment ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`[server] Starting in ${NODE_ENV} mode`);
console.log(`[server] Allowed origin: ${CLIENT_ORIGIN}`);

// Helper to determine allowed origin
function isOriginAllowed(origin) {
  if (!origin || CLIENT_ORIGIN === '*' || CLIENT_ORIGIN === '') return true;
  const allowed = CLIENT_ORIGIN.split(',').map((o) => o.trim());
  return allowed.includes(origin);
}

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// CORS for HTTP routes
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    methods: ['GET'],
    credentials: false,
  })
);

app.use(express.json({ limit: '10kb' }));

// HTTP rate limiting
const httpLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use(httpLimiter);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60_000,
  pingInterval: 25_000,
  transports: ['websocket', 'polling'],
});

registerSocketHandlers(io);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Tic-Tac-Toe Battle Backend',
    status: 'running',
    health: '/health',
  });
});

// Health check (used by Render and monitoring tools)
app.get('/health', (req, res) => {
  const stats = getRoomStats();
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    rooms: stats,
  });
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[http] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[server] Listening on port ${PORT}`);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`[server] Received ${signal}. Shutting down gracefully...`);
  httpServer.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, httpServer, io };
