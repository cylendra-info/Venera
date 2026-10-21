/** V5.11 read-only acceptance audit for the owner-approved Netlify preview. */
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const BASE = (process.env.VENERA_LIVE_URL || 'https://veneratec.netlify.app').replace(/\/$/, '');
const OUTPUT = path.join(ROOT, 'qa-screenshots', 'v5.11-live-acceptance');
fs.mkdirSync(OUTPUT, { recursive: true });

async function run() {
  const result = {
    url: BASE,
    auditedAt: new Date().toISOString(),
    routes: {},
    privatePaths: {},
    headers: {},
    redirects: {},
    interactions: {},
    responsive: {},
    liveSeo: {},
    netlifyInjectedUi: {},
    fontRequests: [],
    consoleErrors: [],
    failedRequests: [],
    screenshots: []
  };
  const browser = await chromium.launch({ headless: true });
  try {
    const requestContext = await browser.newContext();
    const request = requestContext.request;
    for (const language of ['en', 'ar']) {
      for (const file of fs.readdirSync(path.join(ROOT, language)).filter(name => name.endsWith('.html')).sort()) {
        const route = `/${language}/${file}`;
        const response = await request.get(`${BASE}${route}`);
        result.routes[route] = response.status();
        assert.equal(response.status(), 200, `${route} returned ${response.status()}`);
      }
    }
    for (const [name, language] of [['english', 'en-US,en;q=0.9'], ['arabic', 'ar-IQ,ar;q=0.9,en;q=0.5']]) {
      const response = await request.get(`${BASE}/`, { headers: { 'Accept-Language': language }, maxRedirects: 0 });
      result.redirects[name] = { status: response.status(), location: response.headers().location };
      assert.equal(response.status(), 302);
      const validLocations = name === 'arabic' ? ['/ar/index.html', '/ar/'] : ['/en/index.html', '/en/'];
      assert(validLocations.includes(response.headers().location));
    }
    const missing = await request.get(`${BASE}/definitely-missing-venera-page`);
    assert.equal(missing.status(), 404);
    assert((await missing.text()).includes('الصفحة المطلوبة غير متاحة'));
    result.routes['/definitely-missing-venera-page'] = 404;
    for (const privatePath of ['/data/site-content.js', '/docs/', '/scripts/build.js', '/deployment-manifest.json', '/investor-study.pdf']) {
      const response = await request.get(`${BASE}${privatePath}`);
      result.privatePaths[privatePath] = response.status();
    }
    const home = await request.get(`${BASE}/en/index.html`);
    const headers = home.headers();
    for (const name of ['content-security-policy', 'x-content-type-options', 'referrer-policy', 'x-frame-options', 'permissions-policy', 'strict-transport-security', 'cache-control']) result.headers[name] = headers[name] || null;
    const asset = await request.get(`${BASE}/assets/app.js`);
    result.headers.assetCacheControl = asset.headers()['cache-control'] || null;
    result.headers.https = new URL(home.url()).protocol === 'https:';
    await requestContext.close();

    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await desktop.newPage();
    page.on('pageerror', error => result.consoleErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
    page.on('requestfailed', requestItem => result.failedRequests.push(`${requestItem.failure()?.errorText}: ${requestItem.url()}`));
    page.on('response', response => { if (response.url().includes('fonts.google')) result.fontRequests.push({ url: response.url(), status: response.status() }); });
    await page.goto(`${BASE}/en/index.html`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForFunction(() => window.digitalEarth?.state().frames > 0);
    result.liveSeo = await page.evaluate(() => ({
      canonical: document.querySelector('link[rel="canonical"]')?.href || null,
      ogUrl: document.querySelector('meta[property="og:url"]')?.content || null,
      hreflangAlternates: document.querySelectorAll('link[rel="alternate"][hreflang]').length
    }));
    result.netlifyInjectedUi.desktop = await page.evaluate(() => ({
      poweredByFrame: document.querySelectorAll('iframe#nl-badge-frame[title="Powered by Netlify"]').length,
      visible: Boolean(document.querySelector('iframe#nl-badge-frame')?.getBoundingClientRect().width)
    }));

    const projectButton = page.locator('[data-nav-group="projects-menu"] .nav-more-btn');
    await projectButton.click();
    assert.equal(await projectButton.getAttribute('aria-expanded'), 'true');
    assert(await page.locator('[data-nav-group="projects-menu"] .nav-dropdown').isVisible());
    await page.keyboard.press('Escape');
    assert.equal(await projectButton.getAttribute('aria-expanded'), 'false');
    const moreButton = page.locator('[data-nav-group="more"] .nav-more-btn');
    await moreButton.focus();
    await page.keyboard.press('Enter');
    assert.equal(await moreButton.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await moreButton.getAttribute('aria-expanded'), 'false');
    await moreButton.press('Space');
    assert.equal(await moreButton.getAttribute('aria-expanded'), 'true');
    await page.locator('main').click({ position: { x: 10, y: 10 } });
    assert.equal(await moreButton.getAttribute('aria-expanded'), 'false');
    result.interactions.desktopNavigation = true;
    result.interactions.keyboardDropdowns = true;

    const startRotation = await page.evaluate(() => window.digitalEarth.state().rotY);
    await page.waitForTimeout(350);
    const autoRotation = await page.evaluate(() => window.digitalEarth.state().rotY);
    assert(autoRotation > startRotation);
    const globe = page.locator('.globe-canvas');
    const box = await globe.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    assert.notEqual(await page.evaluate(() => window.digitalEarth.state().rotY), autoRotation);
    result.interactions.digitalEarthAutoRotation = true;
    result.interactions.digitalEarthMouse = true;

    await page.goto(`${BASE}/en/projects.html`, { waitUntil: 'networkidle' });
    const allCards = await page.locator('.portfolio-card').count();
    await page.locator('.portfolio-filter-btn[data-filter="trading"]').click();
    const visibleCards = await page.locator('.portfolio-card:not(.hidden)').count();
    assert(visibleCards > 0 && visibleCards < allCards);
    result.interactions.portfolioFilters = { total: allCards, tradingVisible: visibleCards };

    await page.goto(`${BASE}/en/stylai.html`, { waitUntil: 'networkidle' });
    const stylaiBefore = await page.locator('.pf-slide.active img').getAttribute('src');
    await page.locator('.pf-next').click();
    await page.waitForTimeout(700);
    assert.notEqual(await page.locator('.pf-slide.active img').getAttribute('src'), stylaiBefore);
    result.interactions.stylaiGallery = true;

    await page.goto(`${BASE}/ar/team.html`, { waitUntil: 'networkidle' });
    const teamBefore = await page.locator('.tm-slide.active img').getAttribute('src');
    await page.locator('.tm-next').click();
    await page.waitForTimeout(700);
    assert.notEqual(await page.locator('.tm-slide.active img').getAttribute('src'), teamBefore);
    result.interactions.teamGallery = true;

    await page.goto(`${BASE}/en/founder.html`, { waitUntil: 'networkidle' });
    const languageHref = await page.locator('.lang-pill').getAttribute('href');
    assert(languageHref && ['/ar/founder.html', '/ar/founder'].includes(new URL(languageHref, page.url()).pathname));
    await Promise.all([
      page.waitForURL(url => url.pathname === '/ar/founder.html' || url.pathname === '/ar/founder'),
      page.locator('.lang-pill').click()
    ]);
    assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
    result.interactions.languageSwitch = true;

    for (const language of ['en', 'ar']) {
      await page.goto(`${BASE}/${language}/index.html?still&rotation=0.45`, { waitUntil: 'networkidle' });
      const name = `${language}-live-desktop-1440x900.png`;
      await page.screenshot({ path: path.join(OUTPUT, name) });
      result.screenshots.push(name);
      result.responsive[`${language}Desktop`] = { direction: await page.locator('html').getAttribute('dir'), bodyWidth: await page.evaluate(() => document.body.scrollWidth), viewportWidth: 1440 };
    }
    await desktop.close();

    for (const language of ['en', 'ar']) {
      const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
      const mobilePage = await mobile.newPage();
      await mobilePage.goto(`${BASE}/${language}/index.html?still&rotation=0.45`, { waitUntil: 'networkidle', timeout: 30000 });
      await mobilePage.locator('.hamb').click();
      assert(await mobilePage.locator('.links').isVisible());
      const mobileProjects = mobilePage.locator('[data-nav-group="projects-menu"] .nav-more-btn');
      await mobileProjects.click();
      assert.equal(await mobileProjects.getAttribute('aria-expanded'), 'true');
      result.netlifyInjectedUi[`${language}Mobile`] = await mobilePage.evaluate(() => ({
        poweredByFrame: document.querySelectorAll('iframe#nl-badge-frame[title="Powered by Netlify"]').length,
        visible: Boolean(document.querySelector('iframe#nl-badge-frame')?.getBoundingClientRect().width)
      }));
      const name = `${language}-live-mobile-menu-390x844.png`;
      await mobilePage.screenshot({ path: path.join(OUTPUT, name), scale: 'css' });
      result.screenshots.push(name);
      const widths = await mobilePage.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
      assert(widths.body <= widths.viewport + 1, `${language} mobile horizontal overflow`);
      result.responsive[`${language}Mobile`] = widths;
      await mobile.close();
    }
    assert.deepEqual(result.consoleErrors, []);
    assert.deepEqual(result.failedRequests, []);
    fs.writeFileSync(path.join(OUTPUT, 'live-acceptance.json'), `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
