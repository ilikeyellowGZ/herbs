import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { products } from '../src/data/catalogue.mjs';

export const defaults = { businessName: 'Herby Health', email: '', phone: '', address: '', instagram: '', courierFee: 7500, freeDelivery: 65000, collectionEnabled: true };
export function openDatabase(dataDir) {
  const directory = resolve(dataDir);
  mkdirSync(directory, { recursive: true });
  mkdirSync(join(directory, 'uploads'), { recursive: true });
  const db = new DatabaseSync(join(directory, 'herby.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS products (slug TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL, price INTEGER NOT NULL CHECK(price>=0), pack_size TEXT NOT NULL, form TEXT NOT NULL, stock INTEGER CHECK(stock IS NULL OR stock>=0), active INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, idempotency_key TEXT NOT NULL UNIQUE, request_hash TEXT NOT NULL, customer TEXT NOT NULL, method TEXT NOT NULL, items TEXT NOT NULL, subtotal INTEGER NOT NULL, shipping INTEGER NOT NULL, total INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', payment TEXT NOT NULL DEFAULT 'unpaid', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS enquiries (id TEXT PRIMARY KEY, reference TEXT NOT NULL, name TEXT NOT NULL, surname TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS attachments (id TEXT PRIMARY KEY, enquiry_id TEXT NOT NULL REFERENCES enquiries(id), name TEXT NOT NULL, path TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, resets_at INTEGER NOT NULL);
    PRAGMA user_version=1;`);
  const insert = db.prepare('INSERT OR IGNORE INTO products (slug,name,category,description,price,pack_size,form,stock,active,updated_at) VALUES (?,?,?,?,?,?,?,NULL,1,?)');
  for (const p of products) insert.run(p.slug, p.name, p.category, p.description, Math.round(p.price * 100), p.packSize, p.form, new Date().toISOString());
  db.prepare('INSERT OR IGNORE INTO settings (id,value) VALUES (1,?)').run(JSON.stringify(defaults));
  return db;
}
export const getSettings = db => ({ ...defaults, ...JSON.parse(db.prepare('SELECT value FROM settings WHERE id=1').get().value) });
export const mapProduct = p => ({ slug: p.slug, name: p.name, category: p.category, description: p.description, price: p.price / 100, packSize: p.pack_size, form: p.form, stock: p.stock, active: Boolean(p.active), updatedAt: p.updated_at });
export const mapOrder = o => ({ id: o.id, reference: o.reference, details: JSON.parse(o.customer), method: o.method, items: JSON.parse(o.items), subtotal: o.subtotal, shipping: o.shipping, total: o.total, status: o.status, payment: o.payment, notes: o.notes, createdAt: o.created_at, updatedAt: o.updated_at });
export function activity(db, actor, action, target) { db.prepare('INSERT INTO activity (actor,action,target,created_at) VALUES (?,?,?,?)').run(actor, action, target, new Date().toISOString()); }
export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = fn(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
