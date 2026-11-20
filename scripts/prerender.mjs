import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { products } from '../src/data/catalogue.mjs';

const { render } = await import(pathToFileURL(resolve('dist-server/entry-server.js')).href);
const template = await readFile('dist/index.html', 'utf8');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
for (const route of ['/', ...products.map(product => `/products/${product.slug}`)]) {
  const content = await render(route);
  let html = template.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
  const product = products.find(product => route === `/products/${product.slug}`);
  if (product) {
    html = html.replace(/<title>.*?<\/title>/, `<title>${product.name} — Herby Health</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escape(product.description)}" />`)
      .replace(/\s*<link rel="preload" as="image"[^>]*>/, '');
  }
  const directory = join('dist', route);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), html);
  // Support both directory-index hosts and extensionless .html resolution.
  if (route !== '/') await writeFile(join('dist', `${route}.html`), html);
  console.log(`Pre-rendered ${route}`);
}
// Only delete the known build-temporary folder, after verifying its location.
const temporary = resolve('dist-server');
if (temporary !== join(process.cwd(), 'dist-server')) throw new Error('Unexpected build-temporary directory');
await rm(temporary, { recursive: true, force: true });
