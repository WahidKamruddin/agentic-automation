import Database from "better-sqlite3";

const db: Database.Database = new Database("automation.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS task_runs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    duration_ms INTEGER,
    error TEXT
  )
`);

export default db;