import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
