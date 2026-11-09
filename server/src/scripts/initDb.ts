/**
 * One-time setup script: creates the SQLite database file and all tables.
 *
 * Run this BEFORE `yarn dev` / `npm run dev` for the first time:
 *
 *   yarn db:init
 *   # or
 *   npm run db:init
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from '../database/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the same path that database/index.ts uses so we're guaranteed
// to create the file in the right place (server/database.sqlite).
// __dirname here = server/src/scripts  →  ../../  = server/
const dbPath = path.resolve(__dirname, '../../database.sqlite');

// Explicitly create the file if it doesn't exist yet.
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
  console.log(`📁 Created database file at: ${dbPath}`);
} else {
  console.log(`📁 Database file already exists at: ${dbPath}`);
}

await initDB();
console.log('✅ Database initialised successfully.');
process.exit(0);
