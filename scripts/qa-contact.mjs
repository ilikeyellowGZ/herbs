import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const executablePath = execFileSync('python', ['-c', 'from playwright.sync_api import sync_playwright\np = sync_playwright().start()\nprint(p.chromium.executable_path)\np.stop()'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ executablePath, headless: true });
const base = process.env.QA_URL || 'http://localhost:4181';
const errors = [];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPa0AAAAASUVORK5CYII=', 'base64');
await mkdir('artifacts/contact', { recursive: true });
try {
  for (const width of [320, 375, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/contact`, { waitUntil: 'networkidle' });
    await page.locator('.contact-hero img').evaluate(image => image.decode());
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('main h1').count(), 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No page overflow at ${width}`);
    assert.equal(await page.locator('input[type=file]').isVisible(), false);
    await page.screenshot({ path: `artifacts/contact/contact-${width}.png`, fullPage: true });
    await page.getByRole('link', { name: 'Let’s talk', exact: true }).click();
    await page.waitForURL('**/contact#contact');
    await page.getByRole('button', { name: 'Choose files', exact: true }).focus();
    const picker = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Choose files', exact: true }).press('Enter');
    await (await picker).setFiles([
      { name: 'garden.png', mimeType: 'image/png', buffer: png },
      { name: 'brief.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\npreview') },
    ]);
    assert.equal(await page.locator('.attachment-list li').count(), 2);
    await page.locator('.attachment-preview img').evaluate(image => image.decode());
    await page.getByRole('button', { name: 'Remove brief.pdf', exact: true }).click();
    assert.equal(await page.locator('.attachment-list li').count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Choose files', exact: true }).evaluate(button => button === document.activeElement), true);
    await page.locator('input[type=file]').setInputFiles({ name: 'script.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
    assert.match(await page.locator('.attachment-feedback').innerText(), /choose a JPG/);
    assert.equal(await page.locator('.attachment-list li').count(), 1);
    await page.locator('.attachment-dropzone').evaluate(element => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File(['A new idea'], 'notes.txt', { type: 'text/plain' }));
      element.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));
    });
    assert.equal(await page.locator('.attachment-list li').count(), 2);
    await page.getByLabel('First name', { exact: true }).fill('Ada');
    await page.getByLabel('Surname', { exact: true }).fill('Lovelace');
    await page.getByLabel('Email address', { exact: true }).fill('ada@example.com');
    await page.getByLabel('Phone number', { exact: true }).fill('+27 00 000 0000');
    await page.getByLabel('Your message', { exact: true }).fill('I have an idea for a botanical ritual.');
    await page.getByRole('button', { name: 'Prepare message', exact: true }).click();
    const prepared = page.getByRole('textbox', { name: 'Prepared message', exact: true });
    assert.match(await prepared.inputValue(), /garden.png/);
    assert.match(await prepared.inputValue(), /not uploaded/);
    assert.match(await page.locator('.form-status').innerText(), /No message or files have been sent/);
    await page.getByRole('button', { name: 'Remove notes.txt', exact: true }).click();
    assert.equal(await prepared.count(), 0, 'Attachment changes invalidate prepared output');
    await page.screenshot({ path: `artifacts/contact/contact-attachment-${width}.png`, fullPage: true });
    await page.locator('.contact-faq-note a').click();
    await page.waitForURL('**/faqs');
    await page.locator('footer').getByRole('link', { name: 'Say hello', exact: true }).click();
    await page.waitForURL('**/contact');
    await page.getByLabel('First name', { exact: true }).waitFor();
    assert.equal(await page.getByLabel('First name', { exact: true }).inputValue(), 'Ada');
    assert.equal(await page.locator('.attachment-list li').count(), 1, 'Files survive route navigation');
    await page.locator('.attachment-preview img').evaluate(image => image.decode());
    console.log(`Contact layout, picker, previews, removal, invalid files, drop, preparation and route persistence passed at ${width}px.`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
