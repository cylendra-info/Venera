/**
 * VENERA V5.8 production Digital Earth verification.
 * Runs against the generated EN/AR pages and the bundled production assets.
 */
'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const server = require('./serve.js');

const PORT = 8092;
const BASE_URL = `http://localhost:${PORT}`;
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'qa-screenshots', 'digital-earth-v58');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function waitForGlobe(page) {
  await page.waitForFunction(() => window.digitalEarth?.state().frames > 0);
  await page.waitForTimeout(80);
}

async function openHome(page, lang, query = '') {
  const response = await page.goto(`${BASE_URL}/${lang}/index.html${query}`, {
    waitUntil: 'networkidle',
    timeout: 20000
  });
  assert.equal(response.status(), 200, `${lang} homepage did not return 200`);
  await waitForGlobe(page);
}

async function captureProductionScreenshots(browser, result) {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();

  for (const lang of ['en', 'ar']) {
    await openHome(page, lang, '?still&rotation=0.45');
    const name = `${lang}-homepage-desktop-1440x900.png`;
    await page.screenshot({ path: path.join(OUTPUT_DIR, name) });
    result.screenshots.push(name);
  }

  const views = [
    ['globe-europe-africa.png', 0.45],
    ['globe-asia.png', -1.8],
    ['globe-americas.png', 1.35]
  ];
  await openHome(page, 'en', '?still');
  for (const [name, yaw] of views) {
    await page.evaluate(value => window.digitalEarth.view(value), yaw);
    await page.waitForTimeout(80);
    await page.locator('.globe-canvas').screenshot({ path: path.join(OUTPUT_DIR, name) });
    result.screenshots.push(name);
  }
  await desktop.close();

  for (const lang of ['en', 'ar']) {
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobile.newPage();
    await openHome(mobilePage, lang, '?still&rotation=0.45');
    await mobilePage.locator('.globe-canvas').scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(80);
    const name = `${lang}-homepage-mobile-390x844.png`;
    await mobilePage.screenshot({ scale: 'css', path: path.join(OUTPUT_DIR, name) });
    result.screenshots.push(name);
    await mobile.close();
  }
}

async function verifyVisualMatch(browser, result) {
  const prototypePath = path.join(ROOT, 'design-prototypes', 'digital-earth-v58', 'index.html');
  if (!fs.existsSync(prototypePath)) {
    result.checks.approvedPrototypePixelMatch = 'not run: development prototype excluded from public snapshot';
    return;
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const production = await context.newPage();
  const prototype = await context.newPage();
  await openHome(production, 'en', '?still&rotation=0.45');
  const prototypeResponse = await prototype.goto(
    `${BASE_URL}/design-prototypes/digital-earth-v58/index.html?still&rotation=0.45`,
    { waitUntil: 'networkidle', timeout: 20000 }
  );
  assert.equal(prototypeResponse.status(), 200, 'approved prototype did not return 200');
  await waitForGlobe(prototype);
  const productionCanvas = await production.locator('.globe-canvas').evaluate(canvas => canvas.toDataURL());
  const prototypeCanvas = await prototype.locator('.globe-canvas').evaluate(canvas => canvas.toDataURL());
  assert.equal(productionCanvas, prototypeCanvas, 'production globe differs from approved prototype');
  result.checks.approvedPrototypePixelMatch = true;
  await context.close();
}

async function verifyGeometryAndMouse(browser, result) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await openHome(page, 'en', '?still&rotation=0.45');

  const geometry = await page.evaluate(() => {
    const samples = [[0, 0], [0, 180], [51.5, -0.12], [1.35, 103.82], [-34, -58]];
    return samples.map(([lat, lon]) => ({ lat, lon, ...window.digitalEarth.project(lat, lon) }));
  });
  for (const point of geometry) {
    assert.equal(point.visible, point.z >= 0, `hemisphere visibility mismatch for ${point.lat},${point.lon}`);
  }
  result.checks.hemisphereVisibility = true;

  let maxAttachmentError = 0;
  let attachmentSamples = 0;
  for (const [yaw, pitch] of [[0.45, 0.25], [-1.8, 0.25], [-Math.PI, 0.25], [0.45, -0.6]]) {
    await page.evaluate(([y, p]) => window.digitalEarth.view(y, p), [yaw, pitch]);
    await page.waitForTimeout(50);
    const check = await page.evaluate(() => {
      const radius = Math.min(
        document.querySelector('.globe-canvas').getBoundingClientRect().width,
        document.querySelector('.globe-canvas').getBoundingClientRect().height
      ) * 0.42;
      let max = 0;
      let count = 0;
      for (const [lat, lon] of [[51.5, -0.12], [33.31, 44.36], [1.35, 103.82], [-34, -58], [40, 140], [-25, 135]]) {
        const projected = window.digitalEarth.project(lat, lon);
        if (projected.z < radius * 0.35) continue;
        const surface = window.digitalEarth.surfaceCoordinate(projected.x, projected.y);
        assertSurface(surface);
        const lonError = Math.abs(((surface.lon - lon + 540) % 360) - 180);
        max = Math.max(max, Math.abs(surface.lat - lat), lonError);
        count++;
      }
      return { max, count };

      function assertSurface(surface) {
        if (!surface) throw new Error('visible projected point is missing from geographic surface');
      }
    });
    maxAttachmentError = Math.max(maxAttachmentError, check.max);
    attachmentSamples += check.count;
  }
  assert(maxAttachmentError < 2, `geography drift exceeded raster precision: ${maxAttachmentError}°`);
  result.checks.geographyAttachmentMaxDegrees = maxAttachmentError;
  result.checks.geographyAttachmentSamples = attachmentSamples;

  await page.evaluate(() => window.digitalEarth.view(0.45));
  const box = await page.locator('.globe-canvas').boundingBox();
  const before = await page.evaluate(() => window.digitalEarth.state().rotY);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(80);
  const mouseDelta = (await page.evaluate(() => window.digitalEarth.state().rotY)) - before;
  assert(Math.abs(mouseDelta - 0.5) < 0.001, `mouse drag delta was ${mouseDelta}`);
  result.checks.mouseDragRadians = mouseDelta;
  await context.close();
}

async function verifyTouch(browser, result) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  await openHome(page, 'ar', '?still&rotation=0.45');
  await page.locator('.globe-canvas').scrollIntoViewIfNeeded();
  const box = await page.locator('.globe-canvas').boundingBox();
  const session = await context.newCDPSession(page);
  const before = await page.evaluate(() => window.digitalEarth.state().rotY);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let step = 1; step <= 5; step++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + 60 * step / 5, y }]
    });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(80);
  const touchDelta = (await page.evaluate(() => window.digitalEarth.state().rotY)) - before;
  assert(Math.abs(touchDelta - 0.3) < 0.02, `touch drag delta was ${touchDelta}`);
  result.checks.touchDragRadians = touchDelta;
  await context.close();
}

async function verifyMotionAndVisibility(browser, result) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await openHome(page, 'en');
  const startYaw = await page.evaluate(() => window.digitalEarth.state().rotY);
  await page.waitForTimeout(300);
  assert((await page.evaluate(() => window.digitalEarth.state().rotY)) > startYaw, 'auto-rotation did not advance');
  result.checks.autoRotation = true;

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(180);
  const offscreen = await page.evaluate(() => window.digitalEarth.state());
  await page.waitForTimeout(250);
  const offscreenLater = await page.evaluate(() => window.digitalEarth.state());
  assert.equal(offscreenLater.frames, offscreen.frames, 'offscreen globe continued rendering');
  assert.equal(offscreen.pending, false, 'offscreen globe retained a pending frame');
  result.checks.offscreenPause = true;

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  assert((await page.evaluate(() => window.digitalEarth.state().frames)) > offscreen.frames, 'globe did not resume on reentry');
  result.checks.viewportResume = true;

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden = await page.evaluate(() => window.digitalEarth.state());
  await page.waitForTimeout(220);
  assert.equal((await page.evaluate(() => window.digitalEarth.state().frames)), hidden.frames, 'hidden tab continued rendering');
  assert.equal(hidden.pending, false, 'hidden tab retained a pending frame');
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(220);
  assert((await page.evaluate(() => window.digitalEarth.state().frames)) > hidden.frames, 'visible tab did not resume');
  result.checks.hiddenPauseResume = 'passed with injected visibility state/event';
  await context.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  const reducedPage = await reducedContext.newPage();
  await openHome(reducedPage, 'ar');
  const reduced = await reducedPage.evaluate(() => window.digitalEarth.state());
  await reducedPage.waitForTimeout(250);
  const reducedLater = await reducedPage.evaluate(() => window.digitalEarth.state());
  assert.equal(reducedLater.frames, reduced.frames, 'reduced-motion globe continued rendering');
  assert.equal(reducedLater.rotY, reduced.rotY, 'reduced-motion globe continued rotating');
  assert.equal(reduced.pending, false, 'reduced-motion globe retained a pending frame');
  result.checks.reducedMotion = true;
  await reducedContext.close();
}

async function measurePerformance(browser, result) {
  for (const target of [
    { name: 'desktop', options: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', options: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } }
  ]) {
    const context = await browser.newContext(target.options);
    const page = await context.newPage();
    await openHome(page, 'en', '?still');
    if (target.name === 'mobile') await page.locator('.globe-canvas').scrollIntoViewIfNeeded();
    await page.evaluate(() => window.digitalEarth.play());
    const start = await page.evaluate(() => window.digitalEarth.state());
    await page.waitForTimeout(2000);
    const end = await page.evaluate(() => window.digitalEarth.state());
    const draws = end.frames - start.frames;
    assert(draws > 0, `${target.name} performance sample rendered no frames`);
    result.performance[target.name] = {
      sampleMilliseconds: 2000,
      renderedDraws: draws,
      averageDrawMilliseconds: (end.totalMs - start.totalMs) / draws,
      maximumObservedDrawMilliseconds: end.maxMs,
      effectiveDpr: end.dpr,
      surfacePixels: `${end.surfaceSize}x${end.surfaceSize}`
    };
    await context.close();
  }
}

async function run() {
  const result = {
    environment: 'Playwright Chromium; Windows host; mobile viewport and touch emulation, not physical hardware',
    checks: {},
    performance: {},
    screenshots: [],
    consoleErrors: [],
    failedResponses: [],
    requestFailures: [],
    thirdPartyNetworkFailures: []
  };
  await new Promise(resolve => server.listen(PORT, resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const monitor = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const monitorPage = await monitor.newPage();
    monitorPage.on('pageerror', error => result.consoleErrors.push(error.message));
    monitorPage.on('console', message => {
      if (message.type() === 'error') result.consoleErrors.push(message.text());
    });
    monitorPage.on('response', response => {
      if (response.status() >= 400) result.failedResponses.push(`${response.status()} ${response.url()}`);
    });
    monitorPage.on('requestfailed', request => {
      result.requestFailures.push(`${request.failure()?.errorText || 'request failed'} ${request.url()}`);
    });
    await openHome(monitorPage, 'en', '?still');
    await openHome(monitorPage, 'ar', '?still');
    const assetResponse = await monitorPage.request.get(`${BASE_URL}/assets/geography/ne_110m_land.geojson`);
    assert.equal(assetResponse.status(), 200, 'bundled geographic asset did not return 200');
    assert.equal((await assetResponse.json()).type, 'FeatureCollection', 'geographic asset is not GeoJSON');
    await monitor.close();

    const geographyPath = path.join(ROOT, 'assets', 'geography', 'ne_110m_land.geojson');
    result.geographicAsset = {
      bytes: fs.statSync(geographyPath).size,
      sha256: crypto.createHash('sha256').update(fs.readFileSync(geographyPath)).digest('hex')
    };
    assert.equal(result.geographicAsset.sha256, '9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9');

    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'deploy-package.js')], {
      cwd: ROOT,
      stdio: 'pipe'
    });
    const packagedGeography = path.join(ROOT, 'dist', 'assets', 'geography', 'ne_110m_land.geojson');
    const packagedLicense = path.join(ROOT, 'dist', 'assets', 'geography', 'NATURAL_EARTH_LICENSE.txt');
    const packagedSource = path.join(ROOT, 'dist', 'assets', 'geography', 'SOURCE.txt');
    assert(fs.existsSync(packagedGeography), 'deployment package omitted geographic data');
    assert(fs.existsSync(packagedLicense), 'deployment package omitted geographic license');
    assert(fs.existsSync(packagedSource), 'deployment package omitted geographic source record');
    const packagedHash = crypto.createHash('sha256').update(fs.readFileSync(packagedGeography)).digest('hex');
    assert.equal(packagedHash, result.geographicAsset.sha256, 'packaged geographic data differs from source asset');
    result.deploymentPackage = {
      geographicAssetIncluded: true,
      licenseIncluded: true,
      sourceRecordIncluded: true,
      sha256: packagedHash
    };

    await captureProductionScreenshots(browser, result);
    await verifyVisualMatch(browser, result);
    await verifyGeometryAndMouse(browser, result);
    await verifyTouch(browser, result);
    await verifyMotionAndVisibility(browser, result);
    await measurePerformance(browser, result);
    result.thirdPartyNetworkFailures = result.requestFailures.filter(item => !item.includes(BASE_URL));
    const localRequestFailures = result.requestFailures.filter(item => item.includes(BASE_URL));
    const actionableConsoleErrors = result.consoleErrors.filter(item => !item.includes('ERR_NETWORK_ACCESS_DENIED'));
    assert.deepEqual(actionableConsoleErrors, [], 'browser console/page errors were emitted');
    assert.deepEqual(localRequestFailures, [], 'local production requests failed');
    assert.deepEqual(result.failedResponses, [], '4xx/5xx responses were observed');

    fs.writeFileSync(path.join(OUTPUT_DIR, 'production-verification.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
