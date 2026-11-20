"""Verify the botanical logo against a production preview (QA_URL overrides localhost)."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('QA_URL', 'http://localhost:4187')
ARTIFACTS = Path('artifacts/logo')
ARTIFACTS.mkdir(parents=True, exist_ok=True)


def visible_parts(page, selector):
    return page.locator(selector + ' [data-stem], ' + selector + ' [data-flower]').evaluate_all(
        '(els) => els.every(el => Number(getComputedStyle(el).opacity) === 1)')


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    errors = []
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
    page.goto(BASE + '/rituals', wait_until='networkidle')
    page.wait_for_function('Number(getComputedStyle(document.querySelector(".logo [data-flower]")).opacity) === 1')
    assert not visible_parts(page, '.footer-logo'), 'Footer waits for viewport entry'

    for selector in ['.logo', '.footer-logo']:
        page.locator(selector).scroll_into_view_if_needed()
        page.wait_for_function('(selector) => Number(getComputedStyle(document.querySelector(selector + " [data-flower]")).opacity) === 1', arg=selector)
        assert visible_parts(page, selector)
        resting = page.locator(selector + ' svg > g').get_attribute('style')
        page.locator(selector).hover()
        page.wait_for_timeout(250)
        assert page.locator(selector + ' svg > g').get_attribute('style') != resting, 'Hover sways'
        page.mouse.move(1100, 200)
        page.wait_for_timeout(1400)
        page.keyboard.press('Tab')
        page.locator(selector).focus()
        page.wait_for_timeout(250)
        assert 'rotate(' in page.locator(selector + ' svg > g').get_attribute('style'), 'Keyboard focus sways'
        assert page.locator(selector).evaluate('(el) => getComputedStyle(el).outlineStyle') != 'none'
        page.emulate_media(reduced_motion='reduce')
        page.wait_for_timeout(100)
        assert visible_parts(page, selector), 'Reduced motion restores all artwork'
        assert page.locator(selector + ' svg > g').evaluate('(el) => getComputedStyle(el).transform') == 'none'
        page.emulate_media(reduced_motion='no-preference')
        page.locator(selector).evaluate('(el) => el.blur()')
        page.mouse.move(1100, 200)
        page.wait_for_timeout(400)

    page.locator('.footer-logo').click()
    page.wait_for_url(BASE + '/')
    assert visible_parts(page, '.logo'), 'Navbar does not repeat on route navigation'

    # A real ten-second interval, independent footer hover and crest hover.
    wind_page = browser.new_page(viewport={'width': 1280, 'height': 900})
    wind_page.on('pageerror', lambda error: errors.append(str(error)))
    wind_page.goto(BASE + '/rituals', wait_until='networkidle')
    wind_page.mouse.move(1000, 150)
    entered_at = wind_page.evaluate('performance.now()')
    wind_page.locator('.footer-logo').scroll_into_view_if_needed()
    is_bending = '''() => {
      const el = document.querySelector('.footer-logo [data-breeze]');
      return Math.abs(new DOMMatrix(getComputedStyle(el).transform).b) > .005;
    }'''
    is_still = '''() => {
      return ['[data-breeze]', '[data-flower-wind]'].every(selector => {
        const el = document.querySelector('.footer-logo ' + selector);
        return new DOMMatrix(getComputedStyle(el).transform).b === 0;
      });
    }'''
    wind_page.wait_for_function(is_bending)
    wind_page.screenshot(path=str(ARTIFACTS / 'footer-wind.png'))
    wind_page.wait_for_timeout(1000)
    wind_page.wait_for_function(is_still)
    wind_page.wait_for_function(is_bending, timeout=12000)
    repeated_at = wind_page.evaluate('performance.now()')
    assert 9500 < repeated_at - entered_at < 12500, 'Automatic breeze repeats at ten seconds'
    wind_page.wait_for_timeout(1000)
    wind_page.wait_for_function(is_still)
    footer_box = wind_page.locator('footer').bounding_box()
    wind_page.mouse.move(1100, max(150, footer_box['y'] + 40))
    wind_page.wait_for_function(is_bending, timeout=1000)
    wind_page.wait_for_timeout(1000)
    wind_page.wait_for_function(is_still)
    wind_page.locator('.footer-logo').hover()
    wind_page.wait_for_function(is_bending, timeout=1000)
    wind_page.emulate_media(reduced_motion='reduce')
    wind_page.wait_for_function(is_still)
    assert visible_parts(wind_page, '.footer-logo')
    wind_page.emulate_media(reduced_motion='no-preference')
    wind_page.wait_for_function(is_bending)
    wind_page.evaluate('window.scrollTo({top: 0, behavior: "instant"})')
    wind_page.wait_for_function(is_still)
    wind_page.close()

    # Preference changes during a reveal must restore the complete emblem immediately.
    page.goto(BASE + '/faqs', wait_until='networkidle')
    page.locator('.footer-logo').scroll_into_view_if_needed()
    page.emulate_media(reduced_motion='reduce')
    page.wait_for_timeout(100)
    assert visible_parts(page, '.footer-logo')

    for width in [375, 768, 1280]:
        page.set_viewport_size({'width': width, 'height': 900})
        for route in ['/', '/collection', '/rituals', '/our-story', '/contact', '/faqs']:
            page.goto(BASE + route, wait_until='networkidle')
            assert page.locator('.logo').get_attribute('href') == '/'
            assert page.locator('.footer-logo').get_attribute('href') == '/'
            assert visible_parts(page, '.logo') and visible_parts(page, '.footer-logo')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow: {route} at {width}'
        page.screenshot(path=str(ARTIFACTS / f'navbar-{width}.png'))
        page.locator('.footer-logo').scroll_into_view_if_needed()
        page.screenshot(path=str(ARTIFACTS / f'footer-{width}.png'))

    static_page = browser.new_page(java_script_enabled=False)
    static_page.goto(BASE + '/rituals', wait_until='load')
    assert visible_parts(static_page, '.logo') and visible_parts(static_page, '.footer-logo')
    static_page.close()
    assert not errors, json.dumps(errors)
    print('PASS: viewport reveal, footer entry wind, footer-wide hover, crest hover, real 10-second breeze interval, offscreen reset, keyboard focus, home navigation, runtime reduced motion, no-JS artwork, 18 responsive route checks; no browser errors.')
    browser.close()
