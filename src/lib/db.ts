import Database from 'better-sqlite3';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data BLOB NOT NULL,
    mime_type TEXT NOT NULL,
    filename TEXT,
    width INTEGER,
    height INTEGER,
    size INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    image_id INTEGER REFERENCES images(id),
    vision_image_id INTEGER REFERENCES images(id),
    is_approved INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL REFERENCES problems(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    comment TEXT NOT NULL,
    is_approved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// --- Image helpers ---

export interface Image {
  id: number;
  data: Buffer;
  mime_type: string;
  filename: string | null;
  width: number | null;
  height: number | null;
  size: number;
  created_at: string;
}

export function insertImage(data: Buffer, mimeType: string, filename?: string): number {
  const meta = sharp(data).metadata();
  // sharp.metadata() is async but we need sync — use sharp's internal sync approach
  // For seed data we'll pass width/height manually; for runtime we pre-compute
  const stmt = db.prepare(`
    INSERT INTO images (data, mime_type, filename, size)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(data, mimeType, filename || null, data.length);
  return result.lastInsertRowid as number;
}

export async function insertImageAsync(data: Buffer, mimeType: string, filename?: string): Promise<number> {
  const meta = await sharp(data).metadata();
  const stmt = db.prepare(`
    INSERT INTO images (data, mime_type, filename, width, height, size)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(data, mimeType, filename || null, meta.width || null, meta.height || null, data.length);
  return result.lastInsertRowid as number;
}

export function getImageById(id: number): Image | undefined {
  return db.prepare('SELECT * FROM images WHERE id = ?').get(id) as Image | undefined;
}

// --- Problem types & queries ---

export interface Problem {
  id: number;
  title: string;
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  image_id: number | null;
  vision_image_id: number | null;
  is_approved: number;
  is_featured: number;
  created_at: string;
}

export interface Comment {
  id: number;
  problem_id: number;
  name: string;
  email: string;
  comment: string;
  is_approved: number;
  created_at: string;
}

export function getApprovedProblems(): Problem[] {
  return db.prepare('SELECT * FROM problems WHERE is_approved = 1 ORDER BY created_at DESC').all() as Problem[];
}

export function getProblemById(id: number): Problem | undefined {
  return db.prepare('SELECT * FROM problems WHERE id = ? AND is_approved = 1').get(id) as Problem | undefined;
}

export function createProblem(data: {
  title: string;
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  image_id?: number;
}) {
  const stmt = db.prepare(`
    INSERT INTO problems (title, description, location_name, latitude, longitude, image_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.title,
    data.description,
    data.location_name,
    data.latitude,
    data.longitude,
    data.image_id || null
  );
}

export function getApprovedComments(problemId: number): Comment[] {
  return db.prepare('SELECT * FROM comments WHERE problem_id = ? AND is_approved = 1 ORDER BY created_at ASC').all(problemId) as Comment[];
}

export function createComment(data: {
  problem_id: number;
  name: string;
  email: string;
  comment: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO comments (problem_id, name, email, comment)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(data.problem_id, data.name, data.email, data.comment);
}

// --- Seed data ---

function seedProblems() {
  const count = db.prepare('SELECT COUNT(*) as count FROM problems').get() as { count: number };
  if (count.count > 0) return;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const seedDir = path.join(__dirname, 'seed-images');

  function loadSeedImage(filename: string): number {
    const filePath = path.join(seedDir, filename);
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'image/webp';
    return insertImage(data, mimeType, filename);
  }

  const krieterImageId = loadSeedImage('krieterstrasse-elterntaxis.jpg');
  const ngd1ImageId = loadSeedImage('ngd-vorher.jpg');
  const ngd2ImageId = loadSeedImage('ngd-nachher.jpg');

  const insertProblem = db.prepare(`
    INSERT INTO problems (title, description, location_name, latitude, longitude, image_id, vision_image_id, is_approved)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertProblem.run(
    'Fehlender Radweg am Niedergeorgswerder Deich',
    'Die offizielle Radroute 23 am Niedergeorgswerder Deich hat keinen gekennzeichneten Radweg. Für Radfahrende – insbesondere Kinder – ist die Situation gefährlich.',
    'Niedergeorgswerder Deich',
    53.4912,
    9.9989,
    ngd1ImageId,
    ngd2ImageId
  );

  insertProblem.run(
    'Zugeparkter Gehweg Rahmwerder Straße',
    'Regelmäßig parken Autos auf dem Gehweg vor der Schule. Kinder mit Ranzen müssen auf die Fahrbahn ausweichen.',
    'Rahmwerder Straße, Höhe Elbinselschule',
    53.4922,
    10.0132,
    krieterImageId,
    null
  );

  insertProblem.run(
    'Fehlender Zebrastreifen Krieterstraße',
    'An der Kreuzung Krieterstraße fehlt ein gesicherter Übergang. Kinder müssen die stark befahrene Straße ohne jede Querungshilfe überqueren.',
    'Krieterstraße, Höhe Elbinselschule',
    53.4935,
    10.0078,
    krieterImageId,
    null
  );
}

seedProblems();
