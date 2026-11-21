import { randomBytes } from 'node:crypto';
import { backup } from 'node:sqlite';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { openDatabase } from '../server/database.mjs';
import { createOwner } from '../server/auth.mjs';
import { snapshotDatabase } from '../cloudflare/snapshot.mjs';

const origin = 'https://herbs.service-heyywebb.workers.dev';
if (!process.argv.includes('--prepare-only')) {
  const existing = await fetch(`${origin}/api/auth/session`, { signal: AbortSignal.timeout(10000) }).then(response => response.json()).catch(() => null);
  if (existing?.configured) throw new Error('The live store is already configured. Use npm run cf:deploy for updates; setup never replaces live data.');
}
const dataDir = resolve(process.env.DATA_DIR || '.local');
const exportDir = join(dataDir, 'cloudflare');
await mkdir(exportDir, { recursive: true, mode: 0o700 });

function runWrangler(args, input) {
  return new Promise((done, reject) => {
    const child = spawn(process.execPath, [resolve('node_modules/wrangler/bin/wrangler.js'), ...args], {
      stdio: [input ? 'pipe' : 'ignore', 'inherit', 'inherit'], windowsHide: true,
    });
    if (input) child.stdin.end(input + '\n');
    child.on('error', reject);
    child.on('exit', code => code === 0 ? done() : reject(new Error(`Wrangler ${args[0]} failed (${code}).`)));
  });
}

const db = openDatabase(dataDir);
let snapshot;
try {
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  await backup(db, join(exportDir, `before-migration-${timestamp}.sqlite`));
  if (!db.prepare('SELECT id FROM users LIMIT 1').get()) {
    const email = process.env.CLOUDFLARE_OWNER_EMAIL || 'service.heyywebb@gmail.com';
    const password = randomBytes(24).toString('base64url');
    await createOwner(db, email, password);
    const loginFile = join(dataDir, 'cloudflare-owner-login.txt');
    await writeFile(loginFile, `Herby Health owner access\n\nDashboard: ${origin}/admin\nEmail: ${email}\nPassword: ${password}\n\nKeep this file private. This account also works with the local database.\n`, { mode: 0o600, flag: 'wx' });
    console.log(`Owner credentials saved privately to ${loginFile}`);
  }
  snapshot = await snapshotDatabase(db, dataDir);
  await writeFile(join(exportDir, `migration-${timestamp}.json`), JSON.stringify(snapshot), { mode: 0o600 });
} finally { db.close(); }

if (process.argv.includes('--prepare-only')) {
  console.log('Private migration snapshot and backup are ready. No remote changes made.');
} else {
  const token = randomBytes(32).toString('hex');
  await runWrangler(['secret', 'put', 'MIGRATION_TOKEN'], token);
  let imported = false;
  try {
    await runWrangler(['deploy']);
    const response = await fetch(`${origin}/__setup/import`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot), signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error(`Private store import failed (${response.status}). The snapshot remains private on this computer.`);
    imported = true;
    console.log('Store data and private attachments migrated successfully.');
  } finally {
    await runWrangler(['secret', 'delete', 'MIGRATION_TOKEN'], 'y');
  }
  if (imported) console.log(`Live website: ${origin}\nOwner dashboard: ${origin}/admin`);
}
