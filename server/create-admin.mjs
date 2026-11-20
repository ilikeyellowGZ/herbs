import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { openDatabase } from './database.mjs';
import { createOwner } from './auth.mjs';

// Credentials are read interactively or from server-only environment variables.
const rl = createInterface({ input: stdin, output: stdout });
const db = openDatabase(process.env.DATA_DIR || '.local');
try {
  const email = process.env.ADMIN_EMAIL || await rl.question('Owner email: ');
  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    stdout.write('Owner password (12–128 characters; hidden): ');
    // readline's output is muted for the password, including typed characters.
    const originalWrite = rl._writeToOutput.bind(rl);
    rl._writeToOutput = () => {};
    password = await rl.question(''); rl._writeToOutput = originalWrite; stdout.write('\n');
  }
  await createOwner(db, email, password, { replace: process.argv.includes('--reset') });
  console.log('Owner account is ready. Open /admin to sign in. Use --reset to replace an existing password and revoke its sessions.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { rl.close(); db.close(); }
