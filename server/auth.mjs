import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { activity, transaction } from './database.mjs';
const scrypt = promisify(scryptCallback);
export const digest = value => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  const [salt, stored] = encoded.split(':');
  const key = await scrypt(password, salt, 64);
  return timingSafeEqual(key, Buffer.from(stored, 'hex'));
}
export async function createOwner(db, email, password, { replace = false } = {}) {
  email = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Enter a valid owner email.');
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new Error('Use a password of 12–128 characters.');
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (existing && !replace) return;
  const hash = await hashPassword(password);
  if (existing) transaction(db, () => { db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, existing.id); db.prepare('DELETE FROM sessions WHERE user_id=?').run(existing.id); });
  else db.prepare('INSERT INTO users (id,email,password_hash,created_at) VALUES (?,?,?,?)').run(randomUUID(), email, hash, new Date().toISOString());
  activity(db, email, existing ? 'Reset owner password' : 'Created owner account', 'Owner access');
}
export function readSession(db, req) {
  const match = /(?:^|;\s*)hh_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '');
  if (!match) return null;
  return db.prepare('SELECT sessions.*, users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?').get(digest(match[1]), Date.now()) || null;
}
export function issueSession(db, user, res, secure) {
  const token = randomBytes(32).toString('hex'), csrf = randomBytes(32).toString('hex');
  db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
  db.prepare('INSERT INTO sessions (token_hash,user_id,csrf,expires_at) VALUES (?,?,?,?)').run(digest(token), user.id, csrf, Date.now() + 8 * 60 * 60 * 1000);
  res.cookie('hh_session', token, { httpOnly: true, sameSite: 'strict', secure, maxAge: 8 * 60 * 60 * 1000, path: '/' });
  return csrf;
}
