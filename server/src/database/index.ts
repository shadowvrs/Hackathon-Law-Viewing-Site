import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, writeFile } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use an absolute path so the DB file is always found relative to this
// source file, regardless of which directory the server process is started from.
const storagePath = path.resolve(__dirname, '../../database.sqlite');

const db = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: true, // set to console.log to see SQL queries
});

/**
 * Authenticate the connection and sync all models (creates tables if they
 * don't already exist). Call this once at server startup before accepting
 * requests.
 */
export async function initDB(): Promise<void> {
  console.log("Connected to:", storagePath)
  await db.authenticate();
  // Import models here so they register themselves against the sequelize
  // instance before sync() is called.
  await import('../models/User.js');
  await db.sync({ alter: false }); // use { force: true } only in dev to wipe & recreate
  console.log('SQLite database connected and synced.');
}

export default db;
