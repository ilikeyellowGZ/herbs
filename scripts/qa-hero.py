"""Check the screenshot-led garden hero and its handoff into ScrollExpand."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path('artifacts/hero')
OUT.mkdir(parents=True, exist_ok=True)
report = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    for width, height in [(375, 812), (768, 1024), (1280, 900), (1905, 946)]:
        page.set_viewport_size({'width': width, 'height': height})
        page.goto('http://localhost:4173', wait_until='networkidle')
        expect(page.locator('h1')).to_contain_text('A little closer to nature.')
        expect(page.locator('.site-header')).to_have_class('site-header header-light header-editorial')
        media = page.locator('.hero-expand img')
        assert 'garden-aerial-' in media.evaluate('(e)=>e.currentSrc')
        assert media.evaluate('(e)=>e.complete && e.naturalWidth > 0')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        initial = media.bounding_box()
        expected_width = min(1200, width - (40 if width <= 400 else 48))
        assert abs(initial['width'] - expected_width) < 2, initial
        assert abs(initial['height'] / initial['width'] - 941 / 1672) < .01
        frame = page.locator('.hero-expand .scroll-expand__frame')
        initial_clip = frame.evaluate('(e)=>getComputedStyle(e).clipPath')
        page.screenshot(path=str(OUT / f'initial-{width}.png'))
        top = page.locator('.hero-expand').evaluate('(e)=>e.getBoundingClientRect().top+scrollY')
        for progress in [.5, 1]:
            page.evaluate('(y)=>window.scrollTo({top:y,behavior:"instant"})', top + height * .65 * progress)
            page.wait_for_timeout(1000)
            assert frame.evaluate('(e)=>getComputedStyle(e).clipPath') != initial_clip
            assert media.bounding_box()['width'] > initial['width']
            page.screenshot(path=str(OUT / f'scroll-{progress}-{width}.png'))
        expect(page.locator('.hero-full-copy')).to_be_visible()
        assert float(page.locator('.hero-expand .scroll-expand__overlay').evaluate('(e)=>getComputedStyle(e).opacity')) > .99
        page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
        page.wait_for_timeout(1000)
        assert abs(media.bounding_box()['width'] - initial['width']) < 2
        expect(page.locator('h1')).to_be_in_viewport()
        page.get_by_role('button', name='Explore hibiscus').focus()
        expect(page.get_by_role('button', name='Explore hibiscus')).to_be_focused()
        page.emulate_media(reduced_motion='reduce')
        page.wait_for_timeout(250)
        assert page.locator('.hero-expand').evaluate('(e)=>Math.abs(e.clientHeight-e.clientWidth*941/1672)<2')
        assert frame.evaluate('(e)=>getComputedStyle(e).clipPath') == 'none'
        assert media.bounding_box()['width'] == width
        expect(page.get_by_role('button', name='Explore hibiscus')).to_be_visible()
        page.screenshot(path=str(OUT / f'reduced-{width}.png'))
        page.emulate_media(reduced_motion='no-preference')
        report.append({'width': width, 'initial_photo': 'native aspect ratio', 'expansion': 'passed', 'reverse_scroll': 'passed', 'reduced_motion': 'passed', 'overflow': False})
    assert not errors, errors
    (OUT / 'report.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    browser.close()
