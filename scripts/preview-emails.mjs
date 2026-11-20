import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { emailPreviewBrand, emailPreviewPayload, emailTypes, renderEmail } from '../server/email-templates.mjs';

const output = new URL('../artifacts/emails/', import.meta.url);
await mkdir(output, { recursive: true });
const rows = [];

function encodedBody(value) {
  return Buffer.from(value.replace(/\r?\n/g, '\r\n')).toString('base64').match(/.{1,76}/g).join('\r\n');
}

for (const type of emailTypes) {
  const { subject, html, text } = renderEmail(type, emailPreviewPayload(type), emailPreviewBrand);
  const boundary = 'Herby-preview-' + type;
  const message = [
    'From: Herby Health <hello@herby.example>',
    'To: ' + (type.startsWith('owner-') ? 'owner@herby.example' : 'alex@customer.example'),
    'Reply-To: hello@herby.example',
    'Subject: =?UTF-8?B?' + Buffer.from(subject).toString('base64') + '?=',
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' + boundary + '"', '',
    '--' + boundary, 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '', encodedBody(text),
    '--' + boundary, 'Content-Type: text/html; charset=utf-8', 'Content-Transfer-Encoding: base64', '', encodedBody(html),
    '--' + boundary + '--', '',
  ].join('\r\n');
  await Promise.all([
    writeFile(new URL(type + '.html', output), html),
    writeFile(new URL(type + '.txt', output), text),
    writeFile(new URL(type + '.eml', output), message),
  ]);
  const title = subject.split(' · ')[0];
  rows.push(`<li><a href="${type}.html">${title}</a><span><a href="${type}.txt" aria-label="${title}, plain text">Text</a><a href="${type}.eml" aria-label="${title}, email file">EML</a></span></li>`);
}

const gallery = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email previews · Herby Health</title>
<style>*{box-sizing:border-box}body{margin:0;background:#eff2e9;color:#45523e;font:16px/1.5 Arial,sans-serif}main{max-width:760px;margin:auto;padding:48px 24px}header{padding-bottom:24px}h1{font:normal clamp(36px,6vw,52px)/1.1 Georgia,serif;margin:12px 0}h2{font:normal 26px/1.2 Georgia,serif;margin:32px 0 12px}p{margin:0}ul{padding:0;margin:0;background:#fcfbf6}li{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #d6dbcf;padding:0 12px}li span{display:flex}a{display:inline-block;color:inherit;padding:12px 8px;text-underline-offset:4px}li span a{font-size:14px}</style></head>
<body><main><header><p>Herby Health</p><h1>Transactional emails</h1><p>Fictional orders and enquiries for local review.</p></header><h2>Customer messages</h2><ul>${rows.slice(0, emailTypes.indexOf('owner-order')).join('')}</ul><h2>Owner notifications</h2><ul>${rows.slice(emailTypes.indexOf('owner-order')).join('')}</ul></main></body></html>`;
await writeFile(new URL('index.html', output), gallery);
console.log(`${emailTypes.length} email previews written to ${fileURLToPath(new URL('index.html', output))}`);
