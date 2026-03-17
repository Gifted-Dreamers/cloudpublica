import Database from "better-sqlite3";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function openDb(path?: string): Database.Database {
  const dbPath = path ?? join(__dirname, "..", "data", "word.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function initSchema(db: Database.Database): void {
  // Note: db.exec() here is better-sqlite3's DDL method, NOT child_process
  db.exec(`
    CREATE TABLE IF NOT EXISTS names (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      felt_sense TEXT,
      definition TEXT,
      why_it_matters TEXT,
      source_year TEXT,
      source_author TEXT,
      domain TEXT,
      human_search_terms TEXT,
      agent_search_terms TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      author TEXT,
      year TEXT,
      source_type TEXT,
      url TEXT,
      description TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS rediscoveries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      observed_by TEXT,
      platform TEXT,
      description TEXT,
      maps_to_id TEXT,
      date_observed TEXT,
      evidence_url TEXT,
      notes TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS bridges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      from_name TEXT,
      to_name TEXT,
      relationship TEXT,
      description TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_names_domain ON names(domain);
    CREATE INDEX IF NOT EXISTS idx_rediscoveries_platform ON rediscoveries(platform);
  `);

  // FTS5 for full-text search on names
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS names_fts USING fts5(
      name, felt_sense, definition, why_it_matters,
      human_search_terms, agent_search_terms,
      content=names, content_rowid=rowid
    );
  `);
}

export function rebuildFts(db: Database.Database): void {
  db.exec("INSERT INTO names_fts(names_fts) VALUES('rebuild');");
}
