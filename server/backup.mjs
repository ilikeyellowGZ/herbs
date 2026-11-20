import { backup } from 'node:sqlite';
import { mkdir, cp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { openDatabase } from './database.mjs';
const dataDir = resolve(process.env.DATA_DIR || '.local');
const target = join(dataDir, 'backups', new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-'));
await mkdir(target, { recursive: true });
const db = openDatabase(dataDir);
try {
  await backup(db, join(target, 'herby.sqlite'));
  await cp(join(dataDir, 'uploads'), join(target, 'uploads'), { recursive: true });
  console.log(`Backup saved to ${target}. Keep this directory private; it contains customer information.`);
} finally { db.close(); }
