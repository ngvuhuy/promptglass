import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Metrics, RequestMode, StoredRequest } from '../../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db: Database.Database | null = null;

export function getDb(dbPath?: string): Database.Database {
  if (db) return db;
  const defaultPath = path.resolve(__dirname, '../data/promptglass.db');
  const resolvedPath = dbPath ?? process.env.DB_PATH ?? defaultPath;
  const dir = path.dirname(resolvedPath);

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(resolvedPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    initSchema(db);
    return db;
  } catch (error) {
    console.error(`Failed to initialize database with error ${error}`);
    throw error;
  }
}

function initSchema(db: Database.Database) {
  const setup = db.transaction(() => {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL CHECK(mode IN ('chat', 'observe', 'benchmark')),
      created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      context_hash TEXT,
      request_body TEXT,
      response_body TEXT,
      metrics TEXT
    );
  `).run();

    db.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `).run();
  });

  setup();
}

export function saveRequest(
  mode: RequestMode,
  requestBody: any,
  responseBody?: any,
  metrics?: Metrics,
  contextHash?: string
): number {
  const db = getDb();
  const info = db.prepare(`
    INSERT INTO requests (mode, request_body, response_body, metrics, context_hash)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    mode,
    JSON.stringify(requestBody),
    responseBody ? JSON.stringify(responseBody) : null,
    metrics ? JSON.stringify(metrics) : null,
    contextHash || null
  );
  return info.lastInsertRowid as number;
}

export function updateRequest(
  id: number,
  responseBody: any,
  metrics?: Metrics
) {
  const db = getDb();
  if (metrics) {
    db.prepare(`
      UPDATE requests 
      SET response_body = ?, metrics = ?
      WHERE id = ?
    `).run(
      JSON.stringify(responseBody),
      JSON.stringify(metrics),
      id
    );
  } else {
    db.prepare(`
      UPDATE requests 
      SET response_body = ?
      WHERE id = ?
    `).run(
      JSON.stringify(responseBody),
      id
    );
  }
}

export function getRequests(limit = 50, offset = 0): StoredRequest[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM requests ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as any[];

  return rows.map(row => ({
    id: row.id,
    mode: row.mode,
    createdAt: row.created_at,
    contextHash: row.context_hash,
    requestBody: JSON.parse(row.request_body),
    responseBody: row.response_body ? JSON.parse(row.response_body) : undefined,
    metrics: row.metrics ? JSON.parse(row.metrics) : undefined,
  }));
}

export function getRequestById(id: number): StoredRequest | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as any;
  if (!row) return null;

  return {
    id: row.id,
    mode: row.mode,
    createdAt: row.created_at,
    contextHash: row.context_hash,
    requestBody: JSON.parse(row.request_body),
    responseBody: row.response_body ? JSON.parse(row.response_body) : undefined,
    metrics: row.metrics ? JSON.parse(row.metrics) : undefined,
  };
}

export function saveSetting(key: string, value: string) {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row ? row.value : null;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
