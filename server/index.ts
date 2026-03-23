import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb, closeDb } from './services/storage.js';
import proxyRouter from './routes/proxy.js';
import dashboardRouter from './routes/dashboard.js';

dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/v1', proxyRouter);
app.use('/api', dashboardRouter);

// Serve React App in production
if (process.env.NODE_ENV === 'production') {
  // In dist folder, it will be server/dist/index.js, so we need to go up two levels
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

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
