export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const types = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', avif: 'image/avif', pdf: 'application/pdf',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
};
export const ATTACHMENT_ACCEPT = Object.keys(types).map(extension => `.${extension}`).join(',');

/** Client-side selection limits only; a future upload endpoint must validate files again. */
export function selectAttachments(current, incoming) {
  const files = [...current];
  const errors = [];
  for (const file of incoming) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!Object.hasOwn(types, extension) || (file.type && file.type !== types[extension])) {
      errors.push(`${file.name}: choose a JPG, PNG, WebP, GIF, AVIF, PDF, Word or text file.`);
    } else if (!file.size || file.size > MAX_ATTACHMENT_BYTES) {
      errors.push(`${file.name}: choose a non-empty file up to 10 MB.`);
    } else if (files.some(existing => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)) {
      continue;
    } else if (files.length >= MAX_ATTACHMENTS) {
      errors.push(`${file.name}: you can attach up to 5 files. Remove one to add another.`);
    } else {
      files.push(file);
    }
  }
  return { files, errors };
}
