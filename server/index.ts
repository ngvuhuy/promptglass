import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb, closeDb } from './services/storage.js';

dotenv.config({ path: '../.env' });

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  getDb();
});

function shutdown() {
  console.log('Shutting down...');
  closeDb();
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
