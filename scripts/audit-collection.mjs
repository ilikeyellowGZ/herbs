import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import { mkdir, writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: process.env.QA_BROWSER || (process.platform === 'win32' ? 'msedge' : 'chrome'), headless: true, args: ['--remote-debugging-port=9499'] });
const url = (process.env.QA_URL || 'http://localhost:4173') + '/collection';
const repeats = Number(process.argv[2] || 3);
const summary = [];
await mkdir('artifacts/collection', { recursive: true });
try {
  for (const preset of ['mobile', 'desktop']) {
    const runs = [];
    for (let run = 1; run <= repeats; run++) {
      const result = await lighthouse(url, { port: 9499, logLevel: 'error', output: 'json' }, {
        extends: 'lighthouse:default', settings: {
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], formFactor: preset,
          ...(preset === 'desktop' ? { screenEmulation: { mobile: false, width: 1280, height: 900, deviceScaleFactor: 1 }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } : {}),
        },
      });
      const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)]));
      const failures = Object.values(result.lhr.audits).filter(audit => audit.score !== null && audit.score < 1).map(audit => ({ id: audit.id, value: audit.displayValue }));
      runs.push(scores);
      console.log(JSON.stringify({ preset, run, scores, failures }));
      await writeFile(`artifacts/collection/lighthouse-${preset}-${run}.json`, result.report);
    }
    const median = Object.fromEntries(Object.keys(runs[0]).map(key => [key, runs.map(run => run[key]).sort((a, b) => a - b)[Math.floor(runs.length / 2)]]));
    summary.push({ preset, median });
  }
  await writeFile('artifacts/collection/audit-summary.json', JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ summary }));
} finally { await browser.close(); }
