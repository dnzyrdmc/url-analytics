-- Referans şema: uygulama açılışında IF NOT EXISTS ile oluşturulur.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS links(id TEXT PRIMARY KEY,owner TEXT REFERENCES users(id),code TEXT UNIQUE,target TEXT,enabled INTEGER DEFAULT 1,expires TEXT);
 CREATE TABLE IF NOT EXISTS clicks(id INTEGER PRIMARY KEY,link TEXT REFERENCES links(id),at TEXT);CREATE INDEX IF NOT EXISTS clicks_by_link ON clicks(link,at);
