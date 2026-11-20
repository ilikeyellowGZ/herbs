import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { open, unlink } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { fail } from './validation.mjs';

const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.pdf': 'application/pdf', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.txt': 'text/plain' };
export function uploads(dataDir) {
  return multer({ storage: multer.diskStorage({ destination: join(dataDir, 'uploads'), filename: (_req, _file, cb) => cb(null, randomUUID()) }), limits: { files: 5, fileSize: 10 * 1024 * 1024, fields: 8, fieldSize: 16000, parts: 13 }, fileFilter: (_req, file, cb) => {
    const expected = mimeTypes[extname(file.originalname).toLowerCase()];
    if (!expected || (file.mimetype && file.mimetype !== expected && file.mimetype !== 'application/octet-stream')) return cb(new Error('Choose a supported image, PDF, Word document or text file.'));
    cb(null, true);
  } }).array('files', 5);
}
export async function validateFiles(files) {
  for (const file of files) {
    const handle = await open(file.path, 'r');
    const buffer = Buffer.alloc(512);
    let bytesRead;
    try { ({ bytesRead } = await handle.read(buffer, 0, 512, 0)); } finally { await handle.close(); }
    const b = buffer.subarray(0, bytesRead), extension = extname(file.originalname).toLowerCase();
    const signature = b.subarray(0, 16).toString('hex');
    const valid = file.size > 0 && (
      (['.jpg', '.jpeg'].includes(extension) && signature.startsWith('ffd8ff')) ||
      (extension === '.png' && signature.startsWith('89504e470d0a1a0a')) ||
      (extension === '.gif' && /^GIF8[79]a/.test(b.toString('ascii', 0, 6))) ||
      (extension === '.webp' && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') ||
      (extension === '.avif' && b.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(b.toString('ascii', 8, 32))) ||
      (extension === '.pdf' && b.toString('ascii', 0, 5) === '%PDF-') ||
      (extension === '.doc' && signature.startsWith('d0cf11e0a1b11ae1')) ||
      (extension === '.docx' && signature.startsWith('504b0304')) ||
      (extension === '.txt' && !b.includes(0) && !b.some(byte => byte < 9 || (byte > 13 && byte < 32)))
    );
    if (!valid) fail('A selected file is empty or its content does not match its file type.');
    file.safeName = basename(file.originalname.replaceAll('\\', '/')).replace(/[\r\n\x00-\x1f]/g, '').slice(0, 180) || 'attachment';
    file.safeMime = mimeTypes[extension];
  }
}
export async function cleanFiles(files = []) { await Promise.all(files.map(file => unlink(file.path).catch(() => {}))); }
