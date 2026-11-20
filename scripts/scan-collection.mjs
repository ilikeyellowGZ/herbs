import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const bundle = await build({
  stdin: { contents: `import { instrument } from 'react-scan/lite'; window.__collectionRenders = []; instrument({ recordChangeDescriptions: true, includeFiberIdentity: true, onEvent(event) { window.__collectionRenders.push(event); } });`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'browser', format: 'iife',
});
const browser = await chromium.launch({ channel: process.env.QA_BROWSER || (process.platform === 'win32' ? 'msedge' : 'chrome'), headless: true });
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.addInitScript({ content: bundle.outputFiles[0].text });
  const page = await context.newPage();
  await page.goto((process.env.QA_URL || 'http://localhost:4173') + '/collection');
  await page.getByRole('searchbox', { name: 'Search ingredients' }).waitFor();
  await page.getByRole('button', { name: 'Teas & infusions' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.catalogue-card').length === 1);
  await page.getByRole('button', { name: 'Get to know Hibiscus', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('dialog').getByRole('button', { name: 'How to use', exact: true }).click();
  const events = await page.evaluate(() => window.__collectionRenders);
  const commits = events.filter(event => event.kind === 'commit');
  assert.ok(commits.length > 0, 'React Scan attached and captured actual commits');
  assert.equal(commits.filter(event => event.didError).length, 0, 'No render commit errors');
  const summary = { commits: commits.length, profilingStatus: events.filter(event => event.kind === 'profiling-hooks-status'), note: 'Commit instrumentation only. The installed Lite API does not classify unnecessary renders; a production React build may not expose component profiling hooks.' };
  await mkdir('artifacts/collection', { recursive: true });
  await writeFile('artifacts/collection/react-scan.json', JSON.stringify({ summary, events }, null, 2));
  console.log(JSON.stringify(summary));
} finally { await browser.close(); }
