from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on('console', lambda message: print(message.type, message.text) if message.type in ['error', 'warning'] else None)
    page.on('pageerror', lambda error: print(str(error)))
    page.goto('http://localhost:4173/products/hibiscus', wait_until='networkidle')
    page.wait_for_timeout(1000)
    print('URL', page.url)
    browser.close()
