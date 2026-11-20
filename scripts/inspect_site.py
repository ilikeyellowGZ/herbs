from pathlib import Path
import json
from playwright.sync_api import sync_playwright

OUT = Path('artifacts')
OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://localhost:4173', wait_until='networkidle')
    page.screenshot(path=str(OUT / 'home-desktop.png'))
    page.locator('#collection').scroll_into_view_if_needed()
    page.wait_for_timeout(1100)
    page.screenshot(path=str(OUT / 'collection-desktop.png'))
    page.goto('http://localhost:4173/products/hibiscus', wait_until='networkidle')
    page.wait_for_timeout(600)
    page.screenshot(path=str(OUT / 'product-desktop.png'))
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto('http://localhost:4173', wait_until='networkidle')
    page.screenshot(path=str(OUT / 'home-mobile.png'))
    page.locator('#collection').scroll_into_view_if_needed()
    page.wait_for_timeout(1100)
    page.screenshot(path=str(OUT / 'collection-mobile.png'))
    print(json.dumps({"page_errors": errors, "title": page.title(), "images": page.locator('img').count()}))
    browser.close()
