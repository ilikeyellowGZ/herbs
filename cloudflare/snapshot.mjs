import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function snapshotDatabase(db, dataDir) {
  const ignored = new Set(['sessions', 'rate_limits', 'deployment_meta', 'attachment_chunks']);
  const names = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all().map(row => row.name).filter(name => !ignored.has(name));
  const tables = names.map(name => {
    if (!/^[a-z_]+$/.test(name)) throw new Error('Unsupported database table name.');
    const columns = db.prepare(`PRAGMA table_info(${name})`).all().map(column => column.name);
    const rows = db.prepare(`SELECT * FROM ${name}`).all().map(row => columns.map(column => row[column]));
    return { name, columns, rows };
  });
  const files = [];
  for (const file of db.prepare('SELECT path FROM attachments').all()) {
    if (!/^[a-f0-9-]+$/.test(file.path)) throw new Error('Unsupported private attachment key.');
    files.push({ key: file.path, base64: (await readFile(join(dataDir, 'uploads', file.path))).toString('base64') });
  }
  return { version: 1, tables, files };
}
