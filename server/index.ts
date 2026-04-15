import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getDb, closeDb } from './services/storage.js';
import proxyRouter from './routes/proxy.js';
import dashboardRouter from './routes/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env from the current working directory first, then from the project root
dotenv.config();
// In development, the root is one level up from server/. In production (dist), it is three levels up from server/dist/server/
const isDist = path.basename(path.dirname(__dirname)) === 'dist';
const projectRoot = isDist ? path.resolve(__dirname, '../../../') : path.resolve(__dirname, '../');
dotenv.config({ path: path.join(projectRoot, '.env') });

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
  const clientDist = path.resolve(projectRoot, 'client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('/*path', (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    console.warn(`Warning: Static files directory not found at ${clientDist}`);
  }
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
