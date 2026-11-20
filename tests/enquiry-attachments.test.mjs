import test from 'node:test';
import assert from 'node:assert/strict';
import { selectAttachments } from '../src/data/enquiry-attachments.mjs';

const file = (name, type = 'image/png', size = 100) => ({ name, type, size, lastModified: 1 });

test('accepts supported images and documents, including files with no OS MIME type', () => {
  const files = [file('garden.png'), file('brief.pdf', 'application/pdf'), file('notes.docx', '')];
  assert.deepEqual(selectAttachments([], files), { files, errors: [] });
});

test('rejects unsupported, empty, oversized and mismatched files without discarding valid selections', () => {
  const existing = file('garden.png');
  const result = selectAttachments([existing], [file('script.svg', 'image/svg+xml'), file('empty.png', 'image/png', 0), file('large.jpg', 'image/jpeg', 10 * 1024 * 1024 + 1), file('fake.png', 'text/html')]);
  assert.deepEqual(result.files, [existing]);
  assert.equal(result.errors.length, 4);
  assert.match(result.errors.join(' '), /10 MB/);
});

test('caps a mixed batch at five files and reports the rejected extra', () => {
  const files = Array.from({ length: 6 }, (_, index) => file(`${index}.png`));
  const result = selectAttachments([], files);
  assert.deepEqual(result.files, files.slice(0, 5));
  assert.match(result.errors.join(' '), /5 files/);
});

test('ignores repeat selections and accepts the maximum file size', () => {
  const first = file('garden.png');
  const largest = file('large.png', 'image/png', 10 * 1024 * 1024);
  assert.deepEqual(selectAttachments([first], [first, largest]), { files: [first, largest], errors: [] });
});
