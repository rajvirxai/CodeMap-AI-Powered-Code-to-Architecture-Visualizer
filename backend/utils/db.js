const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log('🔌 Connected to SQLite database successfully.');
  }
});

// Initialize table on startup
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS analyses (
      folderId TEXT PRIMARY KEY,
      repoTree TEXT NOT NULL,
      architecture TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating analyses table:', err.message);
    } else {
      console.log('📊 Analyses table created or already exists.');
    }
  });
});

module.exports = db;
