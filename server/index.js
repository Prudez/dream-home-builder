import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorShape, ERROR_CODES } from '../shared/contract.js';
import sessionsRouter from './routes/sessions.js';
import eventsRouter from './routes/events.js';
import catalogRouter from './routes/catalog.js';
import designsRouter from './routes/designs.js';
import leadsRouter from './routes/leads.js';
import salesRouter from './routes/sales.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/sessions', sessionsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/designs', designsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/sales', salesRouter);

app.use((req, res) => {
  res.status(404).json(errorShape(ERROR_CODES.NOT_FOUND, 'Not found'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json(errorShape(ERROR_CODES.INTERNAL_ERROR, 'Internal server error'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
