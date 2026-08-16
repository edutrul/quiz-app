import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let dbPath = process.env.DB_PATH;
if (!dbPath) {
  const dataDir = join(__dirname, '..', 'data');
  mkdirSync(dataDir, { recursive: true });
  dbPath = join(dataDir, 'quiz.db');
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = readFileSync(join(__dirname, '..', 'schema.sql'), 'utf8');
db.exec(schema);

export default db;
