import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createSqlAdapter, createPrivateFiles } from '../cloudflare/storage.mjs';
import { transaction } from '../server/database.mjs';

function storageFixture() {
  const sqlite = new DatabaseSync(':memory:');
  const storage = {
    sql: { exec(sql, ...bindings) {
      const statement = sqlite.prepare(sql);
      const rows = statement.columns().length ? statement.all(...bindings) : (statement.run(...bindings), []);
      return { toArray: () => rows };
    } },
    transactionSync(callback) {
      sqlite.exec('BEGIN');
      try { const result = callback(); sqlite.exec('COMMIT'); return result; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  return { sqlite, db: createSqlAdapter(storage) };
}

test('durable adapter preserves bindings, missing rows and transaction rollback', () => {
  const { sqlite, db } = storageFixture();
  try {
    db.exec('CREATE TABLE stock (slug TEXT PRIMARY KEY, quantity INTEGER)');
    db.prepare('INSERT INTO stock VALUES (?,?)').run('hibiscus', 3);
    assert.equal(db.prepare('SELECT quantity FROM stock WHERE slug=?').get('hibiscus').quantity, 3);
    assert.equal(db.prepare('SELECT quantity FROM stock WHERE slug=?').get('missing'), undefined);
    assert.throws(() => transaction(db, () => {
      db.prepare('UPDATE stock SET quantity=quantity-? WHERE slug=?').run(2, 'hibiscus');
      throw new Error('cancel');
    }), /cancel/);
    assert.equal(db.prepare('SELECT quantity FROM stock').get().quantity, 3);
    assert.equal(transaction(db, () => { db.prepare('UPDATE stock SET quantity=1').run(); return 'committed'; }), 'committed');
    assert.equal(db.prepare('SELECT quantity FROM stock').get().quantity, 1);
  } finally { sqlite.close(); }
});

test('private files roundtrip multiple bounded chunks and roll back with enquiry metadata', () => {
  const { sqlite, db } = storageFixture();
  try {
    const files = createPrivateFiles(db);
    const content = Buffer.alloc(700000, 37);
    const file = { filename: 'random-private-key', buffer: content, size: content.length };
    files.persist([file]);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM attachment_chunks').get().count, 3);
    assert.deepEqual(Buffer.from(files.read(file.filename)), content);
    assert.throws(() => transaction(db, () => { files.persist([{ ...file, filename: 'rolled-back' }]); throw new Error('rejected enquiry'); }), /rejected enquiry/);
    assert.equal(files.read('rolled-back'), null);
    files.remove([file]);
    assert.equal(files.read(file.filename), null);
  } finally { sqlite.close(); }
});
