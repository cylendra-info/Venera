/**
 * VENERA Technology — Comprehensive Automated QA Test Suite (V5)
 * Powered by Playwright
 * Tests Viewports: 1440x900, 1024x768, 390x844
 */

const { chromium } = require('playwright');
const server = require('./serve.js');
const path = require('path');
const fs = require('fs');

const PORT = 8089;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOTS_DIR = path.resolve(__dirname, '..', 'qa-screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'tablet-1024x768', width: 1024, height: 768 },
  { name: 'mobile-390x844', width: 390, height: 844 }
];

const PAGES_TO_TEST = [
  { path: '/en/index.html', name: 'en-home' },
  { path: '/ar/index.html', name: 'ar-home' },
  { path: '/en/about.html', name: 'en-about' },
  { path: '/ar/about.html', name: 'ar-about' },
  { path: '/en/expertise.html', name: 'en-expertise' },
  { path: '/ar/expertise.html', name: 'ar-expertise' },
  { path: '/en/projects.html', name: 'en-projects' },
  { path: '/ar/projects.html', name: 'ar-projects' },
  { path: '/en/cylendra.html', name: 'en-project-cylendra' },
  { path: '/ar/cylendra.html', name: 'ar-project-cylendra' },
  { path: '/en/veneraswap.html', name: 'en-project-veneraswap' },
  { path: '/ar/veneraswap.html', name: 'ar-project-veneraswap' },
  { path: '/en/initiatives.html', name: 'en-initiatives' },
  { path: '/ar/initiatives.html', name: 'ar-initiatives' },
  { path: '/en/founder.html', name: 'en-founder' },
  { path: '/ar/founder.html', name: 'ar-founder' },
  { path: '/en/insights.html', name: 'en-insights' },
  { path: '/ar/insights.html', name: 'ar-insights' },
  { path: '/en/contact.html', name: 'en-contact' },
  { path: '/ar/contact.html', name: 'ar-contact' }
];

async function runQA() {
  console.log('========================================================');
  console.log('VENERA Technology V5 — Starting Automated QA Test Suite');
  console.log('========================================================');

  // Start HTTP server
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✓ Test HTTP server active on ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    screenshots: []
  };

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1
      });
      const page = await context.newPage();

      // Collect console errors
      const pageErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          pageErrors.push(msg.text());
        }
      });
      page.on('pageerror', err => {
        pageErrors.push(err.message);
      });

      for (const p of PAGES_TO_TEST) {
        results.total++;
        const targetUrl = `${BASE_URL}${p.path}`;
        try {
          const resp = await page.goto(targetUrl, { waitUntil: 'load' });
          if (!resp || resp.status() !== 200) {
            throw new Error(`HTTP status: ${resp ? resp.status() : 'null'}`);
          }

          // Check horizontal overflow
          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
          });
          if (hasOverflow) {
            throw new Error(`Horizontal overflow detected! scrollWidth > innerWidth`);
          }

          // Check images loaded
          const brokenImages = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
          });
          if (brokenImages.length > 0) {
            throw new Error(`Broken image detected: ${brokenImages.join(', ')}`);
          }

          // Verify critical meta tags
          const metaCheck = await page.evaluate(() => {
            const title = document.title;
            const desc = document.querySelector('meta[name="description"]')?.content;
            const canonical = document.querySelector('link[rel="canonical"]')?.href;
            const h1 = document.querySelector('h1')?.textContent;
            return { hasTitle: !!title, hasDesc: !!desc, hasCanonical: !!canonical, hasH1: !!h1 };
          });

          if (!metaCheck.hasTitle || !metaCheck.hasDesc || !metaCheck.hasCanonical || !metaCheck.hasH1) {
            throw new Error(`Missing metadata or H1: ${JSON.stringify(metaCheck)}`);
          }

          // Capture screenshot for key pages
          const shotName = `${p.name}-${vp.name}.png`;
          const shotPath = path.join(SCREENSHOTS_DIR, shotName);
          await page.screenshot({ path: shotPath, fullPage: false });
          results.screenshots.push(shotName);

          results.passed++;
          process.stdout.write(`  ✓ ${p.name.padEnd(25)} passed\n`);
        } catch (err) {
          results.failed++;
          const errMsg = `[${vp.name}] ${p.path}: ${err.message}`;
          results.errors.push(errMsg);
          console.error(`  ✗ ${p.name.padEnd(25)} FAILED: ${err.message}`);
        }
      }

      // Interaction Test: Mobile Nav (only on mobile viewport)
      if (vp.width <= 768) {
        console.log('  Testing Mobile Hamburger Interaction...');
        results.total++;
        try {
          await page.goto(`${BASE_URL}/en/index.html`);
          const hamb = page.locator('.hamb');
          await hamb.click();
          const isOpen = await page.evaluate(() => document.querySelector('.links')?.classList.contains('open'));
          if (!isOpen) throw new Error('Mobile menu did not open upon clicking hamburger button');
          await hamb.click();
          const isClosed = await page.evaluate(() => !document.querySelector('.links')?.classList.contains('open'));
          if (!isClosed) throw new Error('Mobile menu did not close upon clicking close button');
          results.passed++;
          console.log('  ✓ Mobile menu open/close interaction passed');
        } catch (err) {
          results.failed++;
          results.errors.push(`Mobile nav test: ${err.message}`);
          console.error('  ✗ Mobile nav test failed:', err.message);
        }
      }

      await context.close();
    }

    // Interactive Language Switching Test
    console.log('\n--- Testing Language Switching & Cross-Linking ---');
    const switchContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const switchPage = await switchContext.newPage();

    results.total++;
    try {
      await switchPage.goto(`${BASE_URL}/en/founder.html`);
      const langPill = switchPage.locator('.lang-pill');
      const href = await langPill.getAttribute('href');
      if (href !== '../ar/founder.html') {
        throw new Error(`Expected language link to be '../ar/founder.html', got '${href}'`);
      }
      await langPill.click();
      await switchPage.waitForURL('**/ar/founder.html');
      const arDir = await switchPage.evaluate(() => document.documentElement.getAttribute('dir'));
      const arLang = await switchPage.evaluate(() => document.documentElement.getAttribute('lang'));
      if (arDir !== 'rtl' || arLang !== 'ar') {
        throw new Error(`Arabic page dir or lang incorrect: dir=${arDir}, lang=${arLang}`);
      }
      results.passed++;
      console.log('  ✓ Language switching from /en/founder.html to /ar/founder.html passed (dir=rtl, lang=ar verified)');
    } catch (err) {
      results.failed++;
      results.errors.push(`Language switch test: ${err.message}`);
      console.error('  ✗ Language switch test failed:', err.message);
    }

    // Interactive Contact Form Test
    console.log('\n--- Testing Interactive Contact Form ---');
    results.total++;
    try {
      await switchPage.goto(`${BASE_URL}/en/contact.html`);
      await switchPage.fill('#contact-name', 'Alexander Vance');
      await switchPage.fill('#contact-org', 'Sovereign Digital Systems Advisory');
      await switchPage.fill('#contact-role', 'Managing Director');
      await switchPage.fill('#contact-email', 'vance@sovereignsystems.org');
      await switchPage.selectOption('#contact-category', 'strategic-systems');
      await switchPage.fill('#contact-message', 'Requesting an institutional briefing regarding national digital trust infrastructure.');
      await switchPage.click('button[type="submit"]');

      await switchPage.waitForSelector('#form-feedback.success', { timeout: 3000 });
      const feedbackText = await switchPage.textContent('#form-feedback');
      if (!feedbackText.includes('VEN-')) {
        throw new Error(`Expected confirmation with reference code 'VEN-', got: ${feedbackText}`);
      }
      results.passed++;
      console.log('  ✓ Contact form encrypted dispatch and reference receipt passed');
    } catch (err) {
      results.failed++;
      results.errors.push(`Contact form test: ${err.message}`);
      console.error('  ✗ Contact form test failed:', err.message);
    }

    // Interactive Insights Reader Modal Test
    console.log('\n--- Testing Research & Insights Reader Modal ---');
    results.total++;
    try {
      await switchPage.goto(`${BASE_URL}/en/insights.html`);
      const readBtn = switchPage.locator('.read-insight-btn').first();
      await readBtn.click();
      await switchPage.waitForSelector('#insight-modal[style*="display: block"]', { timeout: 2000 });
      const modalText = await switchPage.textContent('#modal-content-area');
      if (!modalText || modalText.length < 100) {
        throw new Error('Modal opened but content is missing or too brief');
      }
      // Close modal
      await switchPage.click('#close-modal-btn');
      await switchPage.waitForSelector('#insight-modal', { state: 'hidden', timeout: 2000 });
      results.passed++;
      console.log('  ✓ Insights reader modal open/close test passed');
    } catch (err) {
      results.failed++;
      results.errors.push(`Insights modal test: ${err.message}`);
      console.error('  ✗ Insights modal test failed:', err.message);
    }

    await switchContext.close();
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n========================================================');
  console.log(`QA TEST SUMMARY: ${results.passed}/${results.total} PASSED (${results.failed} failed)`);
  console.log(`Screenshots saved: ${results.screenshots.length} in qa-screenshots/`);
  console.log('========================================================');

  if (results.failed > 0) {
    console.error('FAILED TESTS:');
    results.errors.forEach(e => console.error(' - ' + e));
    process.exit(1);
  } else {
    console.log('🎉 ALL QUALITY ASSURANCE CHECKS PASSED WITH 100% SUCCESS!');
  }
}

runQA();
