"""Browser verification against a production Vite preview, not a dev bundle."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright, expect

BASE = 'http://localhost:4173'
OUT = Path('artifacts')
OUT.mkdir(exist_ok=True)
WIDTHS = [360, 390, 640, 768, 880, 881, 1024, 1440, 1920]
SLUGS = ['hibiscus', 'collagen', 'moringa', 'sea-moss', 'bay-leaves', 'cinnamon', 'chia-seeds', 'ashwagandha']
report = {'widths': [], 'products': [], 'interactions': [], 'errors': [], 'failed_requests': []}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1440, 'height': 900})
    page = context.new_page()
    page.on('pageerror', lambda error: report['errors'].append(str(error)))
    page.on('response', lambda response: report['failed_requests'].append({'url': response.url, 'status': response.status}) if response.status >= 400 else None)
    page.goto(BASE, wait_until='networkidle')
    expect(page.get_by_role('heading', name='The hibiscus moment.')).to_be_visible()

    # The complete featured spread is one ingredient control, not two destinations.
    page.locator('.featured-product').click()
    expect(page.get_by_role('dialog', name='Hibiscus', exact=True)).to_be_visible()
    page.keyboard.press('Escape')
    expect(page.locator('.featured-product')).to_be_focused()
    for slug in SLUGS[1:]:
        card = page.locator(f'.product-grid .product-card[data-ingredient="{slug}"]')
        card.click()
        expect(page.locator('.quick-dialog')).to_be_visible()
        expect(page.locator('.quick-dialog h2')).to_have_text(slug.replace('-', ' ').title())
        page.keyboard.press('Escape')
        expect(card).to_be_focused()
    report['interactions'].append('Featured pair and seven cards open ingredient details and restore focus')
    page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
    page.wait_for_timeout(600)

    # The supplied expansion must materially change with page scroll, twice.
    initial = page.locator('.hero-expand .scroll-expand__frame').evaluate('(e) => getComputedStyle(e).clipPath')
    page.evaluate('window.scrollTo({top: 550, behavior:"instant"})')
    page.wait_for_timeout(900)
    expanded = page.locator('.hero-expand .scroll-expand__frame').evaluate('(e) => getComputedStyle(e).clipPath')
    assert initial != expanded, (initial, expanded)
    report['interactions'].append('Hero frame expands with scroll')
    page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
    page.wait_for_timeout(600)

    # Native quick view: keyboard dismissal returns focus to its trigger.
    trigger = page.get_by_role('button', name='Explore hibiscus')
    trigger.click()
    expect(page.get_by_role('dialog', name='Hibiscus')).to_be_visible()
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog', name='Hibiscus')).not_to_be_visible()
    expect(trigger).to_be_focused()
    trigger.click()
    page.get_by_role('button', name='Enquire about Hibiscus').click()
    expect(page.get_by_label('What caught your eye?')).to_have_value('hibiscus')
    expect(page.get_by_label('Your name', exact=True)).to_be_focused()
    report['interactions'].append('Quick view Escape/focus return and ingredient preselection')

    # Draft survives route changes; validation never falsely claims submission.
    page.get_by_label('Your name', exact=True).fill('Test Visitor')
    page.get_by_label('Email address', exact=True).fill('visitor@example.com')
    page.get_by_label('Your message', exact=True).fill('Please confirm product availability and format.')
    page.get_by_role('button', name='Prepare enquiry').click()
    expect(page.get_by_role('status').filter(has_text='This preview has not sent')).to_be_visible()
    assert 'Hibiscus' in page.get_by_label('Prepared enquiry', exact=True).input_value()
    page.locator('.desktop-nav').get_by_role('link', name='Collection', exact=True).click()
    page.locator('.product-card[data-ingredient="moringa"]').click()
    page.get_by_role('link', name='Discover the ingredient', exact=True).click()
    expect(page.get_by_role('heading', name='Moringa', exact=True)).to_be_visible()
    page.get_by_role('button', name='Enquire about Moringa').click()
    expect(page.get_by_label('What caught your eye?')).to_have_value('moringa')
    expect(page.get_by_label('Your name', exact=True)).to_have_value('Test Visitor')
    expect(page.get_by_label('Your message', exact=True)).to_have_value('Please confirm product availability and format.')
    report['interactions'].append('Product-to-enquiry retains draft and changes selected ingredient')

    # Accordion semantics and content.
    faq = page.get_by_role('button', name='How do I order?', exact=True)
    faq.click()
    expect(faq).to_have_attribute('aria-expanded', 'true')
    faq.click()
    expect(faq).to_have_attribute('aria-expanded', 'false')
    report['interactions'].append('FAQ opens and closes with correct expanded state')

    # Search filters to a real destination.
    page.get_by_role('button', name='Search the collection').click()
    page.get_by_role('searchbox', name='Search ingredients').fill('cinnamon')
    dialog = page.get_by_role('dialog', name='Find your everyday ritual')
    expect(dialog.get_by_role('link')).to_have_count(1)
    dialog.get_by_role('link').click()
    expect(page.get_by_role('heading', name='Cinnamon', exact=True)).to_be_visible()
    report['interactions'].append('Search filters and opens ingredient page')

    # Direct routes, gallery selection and no missing loaded imagery.
    for slug in SLUGS:
        page.goto(BASE + '/products/' + slug, wait_until='networkidle')
        expect(page.locator('main h1')).to_have_count(1)
        expect(page.get_by_role('button', name='View the ingredient')).to_be_visible()
        page.get_by_role('button', name='View the ingredient').click()
        expect(page.get_by_role('button', name='View the ingredient')).to_have_attribute('aria-pressed', 'true')
        page.wait_for_function("[...document.images].filter(i=>i.loading !== 'lazy' || i.getBoundingClientRect().top < innerHeight).every(i=>i.complete && i.naturalWidth>0)")
        for width in [360, 390, 768, 1280, 1920]:
            page.set_viewport_size({'width': width, 'height': 844 if width < 641 else 900})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Product overflow: {slug} at {width}'
        report['products'].append(slug)
    page.set_viewport_size({'width': 1440, 'height': 900})
    page.goto(BASE + '/products/hibiscus', wait_until='networkidle')
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / 'product-desktop.png'))

    # Full home traversal at requested widths, with exact 880/881 column switch.
    page.goto(BASE, wait_until='networkidle')
    for width in WIDTHS:
        page.set_viewport_size({'width': width, 'height': 844 if width < 641 else 900})
        page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
        page.wait_for_timeout(350)
        for selector in ['.hero-expand', '#collection', '.product-grid', '#rituals', '#story', '#faqs', '#contact', '.garden-expand', '.site-footer']:
            page.locator(selector).first.evaluate('(e)=>window.scrollTo({top:e.getBoundingClientRect().top+scrollY-112,behavior:"instant"})')
            page.wait_for_timeout(60)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}: {selector}'
        columns = page.locator('.product-grid').first.evaluate('(e)=>getComputedStyle(e).gridTemplateColumns.split(" ").length')
        assert columns == (2 if width <= 880 else 4), f'{width}: {columns} columns'
        pair = page.locator('.featured-pair').evaluate('(e)=>getComputedStyle(e).gridTemplateColumns.split(" ").length')
        assert pair == 2
        report['widths'].append({'width': width, 'overflow': False, 'columns': columns, 'feature_columns': pair})

    # Mobile modal navigation, focus containment and Escape.
    page.set_viewport_size({'width': 390, 'height': 844})
    menu = page.get_by_role('button', name='Open menu')
    menu.click()
    expect(page.get_by_role('dialog', name='Herby Health')).to_be_visible()
    for _ in range(8):
        page.keyboard.press('Tab')
        assert page.evaluate('document.activeElement.closest("dialog") !== null')
    page.keyboard.press('Escape')
    expect(menu).to_be_focused()
    menu.click()
    page.get_by_role('navigation', name='Mobile navigation').get_by_role('link', name='Collection', exact=True).click()
    expect(page.get_by_role('dialog', name='Herby Health')).not_to_be_visible()
    report['interactions'].append('Mobile menu focus trap, Escape/focus return and anchor navigation')

    # Closing image expansion also responds to scrolling.
    top = page.locator('.garden-expand').evaluate('(e)=>e.getBoundingClientRect().top+scrollY')
    page.evaluate('(top)=>window.scrollTo({top,behavior:"instant"})', top)
    page.wait_for_timeout(600)
    before = page.locator('.garden-expand .scroll-expand__frame').evaluate('(e)=>getComputedStyle(e).clipPath')
    page.evaluate('(top)=>window.scrollTo({top:top+500,behavior:"instant"})', top)
    page.wait_for_timeout(900)
    after = page.locator('.garden-expand .scroll-expand__frame').evaluate('(e)=>getComputedStyle(e).clipPath')
    assert before != after
    report['interactions'].append('Closing garden image expands with scroll')

    # Reduced motion leaves every hero action visible, with no long pinned track.
    page.emulate_media(reduced_motion='reduce')
    page.goto(BASE, wait_until='networkidle')
    expect(page.get_by_role('button', name='Explore hibiscus')).to_be_visible()
    assert page.locator('.hero-expand').evaluate('(e)=>Math.abs(e.clientHeight-innerHeight)<2')
    assert page.locator('.hero-expand .scroll-expand__frame').evaluate('(e)=>getComputedStyle(e).clipPath') == 'none'
    report['interactions'].append('Reduced motion keeps hero content reachable and removes expansion travel')
    page.emulate_media(reduced_motion='no-preference')

    # Capture the final design at useful section boundaries.
    for width, height, suffix in [(1440, 900, 'desktop'), (390, 844, 'mobile')]:
        page.set_viewport_size({'width': width, 'height': height})
        page.goto(BASE, wait_until='networkidle')
        page.screenshot(path=str(OUT / f'home-{suffix}.png'))
        for selector, filename in [('#collection', 'collection-intro'), ('.product-grid', 'ingredients'), ('#story', 'story'), ('.site-footer', 'footer')]:
            page.locator(selector).first.evaluate('(e)=>window.scrollTo({top:e.getBoundingClientRect().top+scrollY-104,behavior:"instant"})')
            page.wait_for_timeout(900)
            page.screenshot(path=str(OUT / f'{filename}-{suffix}.png'))

    page.goto(BASE + '/products/hibiscus', wait_until='networkidle')
    page.screenshot(path=str(OUT / 'product-mobile.png'))
    assert page.locator('body').evaluate('(e)=>!getComputedStyle(e).fontFamily.toLowerCase().includes("inter")')
    assert page.locator('h1').evaluate('(e)=>getComputedStyle(e).fontFamily.includes("Instrument Serif")')
    nojs = browser.new_context(java_script_enabled=False)
    static = nojs.new_page()
    for route, text in [('/', 'The hibiscus'), ('/products/hibiscus', 'Hibiscus'), ('/products/moringa', 'Moringa')]:
        static.goto(BASE + route, wait_until='load')
        expect(static.locator('h1')).to_contain_text(text)
    nojs.close()
    report['interactions'].append('Prerendered home and ingredient content works before JavaScript')

    assert not report['errors'], report['errors']
    assert not report['failed_requests'], report['failed_requests']
    (OUT / 'qa-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))
    browser.close()
