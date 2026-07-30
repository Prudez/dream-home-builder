import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorShape, ERROR_CODES } from '../shared/contract.js';
import { validateEnv } from './lib/env.js';
import sessionsRouter from './routes/sessions.js';
import eventsRouter from './routes/events.js';
import catalogRouter from './routes/catalog.js';
import designsRouter from './routes/designs.js';
import leadsRouter from './routes/leads.js';
import salesRouter from './routes/sales.js';

validateEnv();

const app = express();
const PORT = process.env.PORT || 4000;

// The dev client origin plus the real embed origins. ALLOWED_ORIGINS
// (comma-separated) overrides this list entirely when set, so a single env
// var covers both "just add bluefalconreal.com" and "lock dev out of prod".
const DEFAULT_ALLOWED_ORIGINS = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'https://bluefalconreal.com',
  'https://www.bluefalconreal.com',
];
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : DEFAULT_ALLOWED_ORIGINS;

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header (curl, server-to-server, same-origin) — allow.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      const err = new Error(`Origin ${origin} is not allowed`);
      err.code = 'CORS_NOT_ALLOWED';
      callback(err);
    },
  })
);
app.use(express.json({ limit: '50kb' }));

// In-memory store (no Redis in this stack) — fine for a single-instance
// Node process. Applied only to routers that accept writes; GET-only
// routers (catalog, sales) are read traffic, not abuse surface.
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    res.status(429).json(errorShape(ERROR_CODES.RATE_LIMITED, 'Too many requests — try again shortly'));
  },
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/sessions', writeLimiter, sessionsRouter);
app.use('/api/events', writeLimiter, eventsRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/designs', writeLimiter, designsRouter);
app.use('/api/leads', writeLimiter, leadsRouter);
app.use('/api/sales', salesRouter);

app.use((req, res) => {
  res.status(404).json(errorShape(ERROR_CODES.NOT_FOUND, 'Not found'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.code === 'CORS_NOT_ALLOWED') {
    return res.status(403).json(errorShape(ERROR_CODES.FORBIDDEN, 'Origin not allowed'));
  }
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json(errorShape(ERROR_CODES.VALIDATION_ERROR, 'Payload too large'));
  }
  console.error(err);
  res.status(500).json(errorShape(ERROR_CODES.INTERNAL_ERROR, 'Internal server error'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
