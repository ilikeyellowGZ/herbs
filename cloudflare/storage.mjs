import { randomUUID } from 'node:crypto';

// Match the small synchronous interface consumed by the shared business rules.
export function createSqlAdapter(storage) {
  return {
    exec: sql => storage.sql.exec(sql),
    prepare(sql) {
      return {
        get: (...bindings) => storage.sql.exec(sql, ...bindings).toArray()[0],
        all: (...bindings) => storage.sql.exec(sql, ...bindings).toArray(),
        run: (...bindings) => { storage.sql.exec(sql, ...bindings).toArray(); },
      };
    },
    transactionSync: callback => storage.transactionSync(callback),
    close() {},
  };
}

// Keep each BLOB well below the Durable Object's per-row size limit.
const chunkSize = 256 * 1024;
export function createPrivateFiles(db) {
  db.exec('CREATE TABLE IF NOT EXISTS attachment_chunks (file_key TEXT NOT NULL, position INTEGER NOT NULL, bytes BLOB NOT NULL, PRIMARY KEY(file_key,position))');
  return {
    persist(files) {
      const insert = db.prepare('INSERT INTO attachment_chunks (file_key,position,bytes) VALUES (?,?,?)');
      for (const file of files) {
        file.filename ||= randomUUID();
        for (let offset = 0; offset < file.buffer.length; offset += chunkSize) {
          const chunk = file.buffer.subarray(offset, offset + chunkSize);
          insert.run(file.filename, offset / chunkSize, chunk);
        }
      }
    },
    read(key) {
      const chunks = db.prepare('SELECT bytes FROM attachment_chunks WHERE file_key=? ORDER BY position').all(key);
      return chunks.length ? Buffer.concat(chunks.map(row => Buffer.from(row.bytes))) : null;
    },
    remove(files) {
      for (const file of files) db.prepare('DELETE FROM attachment_chunks WHERE file_key=?').run(file.filename);
    },
  };
}
