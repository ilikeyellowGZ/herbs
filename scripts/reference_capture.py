import json
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path('artifacts')
out.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    result = {}
    for name, url in [('flamingo-garden', 'https://flamingoestate.com/collections/farm-garden'), ('seed-product', 'https://seed.com/daily-multivitamin')]:
        try:
            page.goto(url, wait_until='domcontentloaded', timeout=30000)
            page.wait_for_timeout(2000)
            result[name] = page.evaluate('''() => [...document.querySelectorAll('h1,h2,header,main,a')].filter(e => e.getBoundingClientRect().width && e.getBoundingClientRect().height).slice(0,50).map(e => { const s = getComputedStyle(e); return {tag:e.tagName,text:e.textContent.trim().slice(0,100),font:s.fontFamily,size:s.fontSize,color:s.color,background:s.backgroundColor,spacing:s.padding,transition:s.transition}; })''')
            page.screenshot(path=str(out / f'{name}-reference.png'))
        except Exception as error:
            result[name] = str(error).splitlines()[0]
    (out / 'reference-runtime.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps({k: len(v) if isinstance(v, list) else v for k, v in result.items()}))
    browser.close()
