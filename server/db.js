import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'promptify.db');
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

sqlite3.verbose();
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Initialize separated database schemas
db.serialize(() => {
  // 1. Participant Details Collection / Table
  db.run(`
    CREATE TABLE IF NOT EXISTS participants (
      participant_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      college_name TEXT NOT NULL,
      department TEXT NOT NULL,
      year_of_study TEXT NOT NULL,
      email TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // 2. Image Submission Collection / Table
  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      submission_id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      image_original_name TEXT,
      ai_tool TEXT NOT NULL DEFAULT 'Other AI Tool',
      prompt TEXT NOT NULL,
      concept TEXT NOT NULL,
      uploaded_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Submitted',
      FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE
    )
  `);

  // Schema Migration Guard: Ensure ai_tool column exists in case db was created prior
  db.all('PRAGMA table_info(submissions)', (err, rows) => {
    if (rows && !rows.some((r) => r.name === 'ai_tool')) {
      db.run("ALTER TABLE submissions ADD COLUMN ai_tool TEXT DEFAULT 'Other AI Tool'", (alterErr) => {
        if (alterErr) console.error('Error adding ai_tool column:', alterErr);
        else console.log('Successfully added ai_tool column to submissions table.');
      });
    }
  });
});

export default db;
