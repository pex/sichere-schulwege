import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    image_url TEXT,
    vision_image_url TEXT,
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

function seedProblems() {
  const count = db.prepare('SELECT COUNT(*) as count FROM problems').get() as { count: number };
  if (count.count > 0) return;

  const insert = db.prepare(`
    INSERT INTO problems (title, description, location_name, latitude, longitude, is_approved)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  insert.run(
    'Fehlender Zebrastreifen Krieterstraße',
    'An der Kreuzung Krieterstraße / Rotenhäuser Straße fehlt ein gesicherter Übergang. Kinder müssen die stark befahrene Straße ohne jede Querungshilfe überqueren.',
    'Kreuzung Krieterstraße / Rotenhäuser Straße',
    53.4922,
    10.0132
  );

  insert.run(
    'Zugeparkter Gehweg Rahmwerder Straße',
    'Regelmäßig parken Autos auf dem Gehweg vor der Schule. Kinder mit Ranzen müssen auf die Fahrbahn ausweichen.',
    'Rahmwerder Straße, Höhe Elbinselschule',
    53.4935,
    10.0078
  );

  insert.run(
    'Unübersichtliche Bushaltestelle Veringstraße',
    'Die Bushaltestelle ist schlecht beleuchtet und hat keinen sicheren Zugang vom Gehweg. Besonders im Winter ist die Situation gefährlich.',
    'Bushaltestelle Veringstraße',
    53.4912,
    9.9989
  );
}

seedProblems();

export interface Problem {
  id: number;
  title: string;
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  vision_image_url: string | null;
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
  image_url?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO problems (title, description, location_name, latitude, longitude, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.title,
    data.description,
    data.location_name,
    data.latitude,
    data.longitude,
    data.image_url || null
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
