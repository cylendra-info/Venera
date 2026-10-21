/** Browser and archive-boundary QA against the generated dist/ directory. */
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const MANIFEST = path.join(ROOT, 'release', 'VENERA-Netlify-Manual.manifest.json');
const OUTPUT = path.join(ROOT, 'qa-screenshots', 'v5.11-netlify-update');
const PORT = 8094;
const BASE = `http://localhost:${PORT}`;
process.env.STATIC_ROOT = DIST;
process.env.PORT = String(PORT);
const server = require('./serve.js');

async function run() {
  assert(fs.existsSync(MANIFEST), 'Run npm run package:netlify first');
  fs.mkdirSync(OUTPUT, { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const htmlFiles = manifest.files.filter(file => /^(?:en|ar)\/[^/]+\.html$/.test(file.path));
  assert.equal(htmlFiles.length, 52, 'expected 26 generated pages per language');
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(DIST, ...file.path.split('/')), 'utf8');
    const [language, pageName] = file.path.split('/');
    const expected = language === 'ar'
      ? '© 2020–2026 Venera Finance LTD · VENERA Technology. جميع الحقوق محفوظة.'
      : '© 2020–2026 Venera Finance LTD · VENERA Technology. All Rights Reserved.';
    assert.equal(html.split(expected).length - 1, 1, `${file.path} does not contain exactly one approved copyright`);
    assert(!html.includes('© 2026 Venera Finance LTD'), `${file.path} retains the old standalone year`);
    const canonicalPage = pageName === 'company.html' ? 'about.html' : pageName === 'work.html' ? 'projects.html' : pageName;
    const canonicalPath = canonicalPage === 'index.html' ? `/${language}/` : `/${language}/${canonicalPage.replace(/\.html$/, '')}`;
    const otherLanguage = language === 'ar' ? 'en' : 'ar';
    const otherPath = canonicalPage === 'index.html' ? `/${otherLanguage}/` : `/${otherLanguage}/${canonicalPage.replace(/\.html$/, '')}`;
    const publicOrigin = 'https://veneratec.netlify.app';
    assert(html.includes(`<link rel="canonical" href="${publicOrigin}${canonicalPath}">`), `${file.path} canonical mismatch`);
    assert(html.includes(`<link rel="alternate" hreflang="${language}" href="${publicOrigin}${canonicalPath}">`), `${file.path} self hreflang mismatch`);
    assert(html.includes(`<link rel="alternate" hreflang="${otherLanguage}" href="${publicOrigin}${otherPath}">`), `${file.path} alternate hreflang mismatch`);
    const englishPath = canonicalPage === 'index.html' ? '/en/' : `/en/${canonicalPage.replace(/\.html$/, '')}`;
    assert(html.includes(`<link rel="alternate" hreflang="x-default" href="${publicOrigin}${englishPath}">`), `${file.path} x-default mismatch`);
    assert(html.includes(`<meta property="og:url" content="${publicOrigin}${canonicalPath}">`), `${file.path} og:url mismatch`);
    assert(html.includes(`<meta property="og:image" content="${publicOrigin}/assets/venera-logo-transparent.png">`), `${file.path} og:image mismatch`);
    assert(!html.includes('veneratech.com'), `${file.path} contains the unapproved domain`);
  }
  const result = { filesRequested: 0, pages: {}, interactions: {}, seo: {}, securityHeaders: {}, screenshots: [], consoleErrors: [], localRequestFailures: [] };
  await new Promise(resolve => server.listen(PORT, resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const requestContext = await browser.newContext();
    const request = requestContext.request;
    for (const file of manifest.files) {
      const response = await request.get(`${BASE}/${file.path}`);
      assert.equal(response.status(), 200, `${file.path} returned ${response.status()}`);
      result.filesRequested++;
    }
    const missing = await request.get(`${BASE}/definitely-missing-venera-page`);
    assert.equal(missing.status(), 404, 'unknown route did not return HTTP 404');
    assert((await missing.text()).includes('الصفحة المطلوبة غير متاحة'), 'custom bilingual 404 was not served');
    assert.equal((await request.get(`${BASE}/deployment-manifest.json`)).status(), 404, 'release manifest must not be public');
    const homeResponse = await request.get(`${BASE}/en/index.html`);
    for (const header of ['content-security-policy', 'x-content-type-options', 'referrer-policy', 'x-frame-options', 'permissions-policy']) {
      assert(homeResponse.headers()[header], `missing ${header}`);
      result.securityHeaders[header] = homeResponse.headers()[header];
    }
    assert(!homeResponse.headers()['strict-transport-security'], 'HSTS must remain disabled before domain validation');
    const redirects = fs.readFileSync(path.join(DIST, '_redirects'), 'utf8');
    assert(redirects.includes('/  /ar/  302!  Language=ar'));
    assert(redirects.includes('/  /en/  302!'));
    await requestContext.close();

    for (const target of [
      { key: 'en-desktop', lang: 'en', viewport: { width: 1440, height: 900 }, mobile: false },
      { key: 'ar-desktop', lang: 'ar', viewport: { width: 1440, height: 900 }, mobile: false },
      { key: 'en-mobile', lang: 'en', viewport: { width: 390, height: 844 }, mobile: true },
      { key: 'ar-mobile', lang: 'ar', viewport: { width: 390, height: 844 }, mobile: true }
    ]) {
      const context = await browser.newContext({ viewport: target.viewport, isMobile: target.mobile, hasTouch: target.mobile, deviceScaleFactor: target.mobile ? 3 : 1 });
      const page = await context.newPage();
      page.on('pageerror', error => result.consoleErrors.push(`${target.key}: ${error.message}`));
      page.on('requestfailed', requestItem => { if (requestItem.url().startsWith(BASE)) result.localRequestFailures.push(`${target.key}: ${requestItem.url()}`); });
      const response = await page.goto(`${BASE}/${target.lang}/index.html?still&rotation=0.45`, { waitUntil: 'networkidle', timeout: 30000 });
      assert.equal(response.status(), 200);
      await page.waitForFunction(() => window.digitalEarth?.state().frames > 0);
      const state = await page.evaluate(() => window.digitalEarth.state());
      const images = await page.locator('img').evaluateAll(items => items.map(item => ({ src: item.getAttribute('src'), complete: item.complete, width: item.naturalWidth })));
      assert(images.every(image => image.complete && image.width > 0), `${target.key} contains a broken image`);
      assert.equal(await page.locator('html').getAttribute('dir'), target.lang === 'ar' ? 'rtl' : 'ltr');
      const name = `${target.key}.png`;
      await page.screenshot({ path: path.join(OUTPUT, name), fullPage: false, scale: 'css' });
      result.screenshots.push(name);
      result.pages[target.key] = { status: response.status(), globeFrames: state.frames, effectiveDpr: state.dpr, images: images.length };
      await context.close();
    }

    const interactionContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const interactionPage = await interactionContext.newPage();
    await interactionPage.goto(`${BASE}/en/founder.html`, { waitUntil: 'networkidle' });
    await interactionPage.click('.lang-pill');
    await interactionPage.waitForURL('**/ar/founder.html');
    assert.equal(await interactionPage.locator('html').getAttribute('dir'), 'rtl');
    result.interactions.languageSwitch = true;

    await interactionPage.goto(`${BASE}/en/stylai.html`, { waitUntil: 'networkidle' });
    const stylaiBefore = await interactionPage.locator('.pf-slide.active img').getAttribute('src');
    await interactionPage.click('.pf-next');
    await interactionPage.waitForTimeout(700);
    assert.notEqual(await interactionPage.locator('.pf-slide.active img').getAttribute('src'), stylaiBefore);
    result.interactions.stylaiGallery = true;

    await interactionPage.goto(`${BASE}/ar/team.html`, { waitUntil: 'networkidle' });
    const teamBefore = await interactionPage.locator('.tm-slide.active img').getAttribute('src');
    await interactionPage.click('.tm-next');
    await interactionPage.waitForTimeout(700);
    assert.notEqual(await interactionPage.locator('.tm-slide.active img').getAttribute('src'), teamBefore);
    result.interactions.teamGallery = true;

    await interactionPage.goto(`${BASE}/en/index.html?still`, { waitUntil: 'networkidle' });
    const rootState = await interactionPage.evaluate(() => window.digitalEarth.state());
    const canvas = interactionPage.locator('.globe-canvas');
    const box = await canvas.boundingBox();
    await interactionPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await interactionPage.mouse.down();
    await interactionPage.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 6 });
    await interactionPage.mouse.up();
    assert.notEqual((await interactionPage.evaluate(() => window.digitalEarth.state())).rotY, rootState.rotY);
    result.interactions.globeMouseDrag = true;

    const seoState = await interactionPage.evaluate(() => ({
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      hreflang: Object.fromEntries(Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map(link => [link.hreflang, link.href])),
      ogUrl: document.querySelector('meta[property="og:url"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      twitterImage: document.querySelector('meta[name="twitter:image"]')?.content
    }));
    const publicOrigin = 'https://veneratec.netlify.app';
    assert.equal(seoState.canonical, `${publicOrigin}/en/`);
    assert.deepEqual(seoState.hreflang, { en: `${publicOrigin}/en/`, ar: `${publicOrigin}/ar/`, 'x-default': `${publicOrigin}/en/` });
    assert.equal(seoState.ogUrl, `${publicOrigin}/en/`);
    assert.equal(seoState.ogImage, `${publicOrigin}/assets/venera-logo-transparent.png`);
    assert.equal(seoState.twitterImage, seoState.ogImage);
    const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
    const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    assert.equal(sitemapLocations.length, 48);
    assert(sitemapLocations.every(url => url.startsWith(`${publicOrigin}/`) && !url.endsWith('.html')));
    assert(!sitemap.includes('company') && !sitemap.includes('/work'));
    assert(fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8').includes(`Sitemap: ${publicOrigin}/sitemap.xml`));
    result.seo = { publicOrigin, canonical: seoState.canonical, sitemapLocations: sitemapLocations.length, robotsSitemap: true, absoluteSocialImage: true };
    await interactionPage.goto(`${BASE}/en/contact.html`, { waitUntil: 'networkidle' });
    const deployedForm = interactionPage.locator('#institutional-contact-form');
    assert.equal(await deployedForm.getAttribute('name'), 'venera-institutional-inquiry');
    assert.equal(await deployedForm.getAttribute('method'), 'POST');
    assert.equal(await deployedForm.getAttribute('data-netlify'), 'true');
    assert.equal(await interactionPage.locator('input[name="form-name"]').getAttribute('value'), 'venera-institutional-inquiry');
    assert.equal(await interactionPage.locator('input[name="privacy_consent"]').isChecked(), false);
    assert.equal(await deployedForm.locator('button[type="submit"]').isEnabled(), true);
    result.interactions.contactFormActiveMarkup = true;
    await interactionContext.close();

    const reducedContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${BASE}/en/index.html`, { waitUntil: 'networkidle' });
    await reducedPage.waitForFunction(() => window.digitalEarth?.state().frames > 0);
    const reducedBefore = await reducedPage.evaluate(() => window.digitalEarth.state());
    await reducedPage.waitForTimeout(250);
    const reducedAfter = await reducedPage.evaluate(() => window.digitalEarth.state());
    assert.equal(reducedAfter.frames, reducedBefore.frames);
    assert.equal(reducedAfter.rotY, reducedBefore.rotY);
    result.interactions.reducedMotion = true;
    await reducedContext.close();

    assert.deepEqual(result.consoleErrors, [], 'page errors occurred');
    assert.deepEqual(result.localRequestFailures, [], 'local requests failed');
    fs.writeFileSync(path.join(OUTPUT, 'dist-qa-results.json'), `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
