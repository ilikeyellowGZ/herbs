import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const executablePath = execFileSync('python', ['-c', 'from playwright.sync_api import sync_playwright\nwith sync_playwright() as p:\n print(p.chromium.executable_path)'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ executablePath, headless: true, args: ['--remote-debugging-port=9498'] });
await mkdir('artifacts', { recursive: true });
const repeats = Number(process.argv[2] || 1);
const results = [];
try {
  for (const route of ['/', '/products/hibiscus']) {
    for (const preset of ['mobile', 'desktop']) {
      const context = await browser.newContext({ viewport: preset === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto('http://localhost:4173' + route, { waitUntil: 'networkidle' });
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      console.log(JSON.stringify({ route, preset, axeViolations: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })) }));
      await context.close();
      for (let run = 1; run <= repeats; run++) {
        const result = await lighthouse('http://localhost:4173' + route, { port: 9498, logLevel: 'error', output: 'json' }, {
          extends: 'lighthouse:default', settings: {
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
            formFactor: preset,
            ...(preset === 'desktop' ? { screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1 }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } : {}),
          },
        });
        const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)]));
        const failures = Object.values(result.lhr.audits).filter(a => a.score !== null && a.score < 1).map(a => ({ id: a.id, title: a.title, score: a.score, displayValue: a.displayValue, details: a.details?.items?.slice(0, 4) }));
        results.push({ route, preset, run, scores, failures });
        await writeFile(`artifacts/lighthouse-${route === '/' ? 'home' : 'product'}-${preset}-${run}.json`, result.report);
        console.log(JSON.stringify({ route, preset, run, scores, failedAudits: failures.map(f => ({ id: f.id, displayValue: f.displayValue })) }));
      }
    }
  }
  await writeFile('artifacts/audit-results.json', JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
