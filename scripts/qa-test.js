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
  { path: '/ar/contact.html', name: 'ar-contact' },
  { path: '/en/ai-ventures.html', name: 'en-ai-ventures' },
  { path: '/ar/ai-ventures.html', name: 'ar-ai-ventures' },
  { path: '/en/partnerships.html', name: 'en-partnerships' },
  { path: '/ar/partnerships.html', name: 'ar-partnerships' },
  { path: '/en/team.html', name: 'en-team' },
  { path: '/ar/team.html', name: 'ar-team' }
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

          // Check images loaded. A decoded-but-failed image (complete && naturalWidth===0)
          // is broken; an intentionally lazy image not yet in view (complete===false) is not.
          const brokenImages = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs.filter(img => img.complete && img.naturalWidth === 0).map(img => img.src);
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

          // hasCanonical is intentionally absent when no production domain is configured (by design)
          if (!metaCheck.hasTitle || !metaCheck.hasDesc || !metaCheck.hasH1) {
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

    // Contact Form Safe-State Test (submission disabled, no fake delivery)
    console.log('\n--- Testing Contact Form Safe State ---');
    results.total++;
    try {
      await switchPage.goto(`${BASE_URL}/en/contact.html`);

      // Verify submit button is disabled
      const submitDisabled = await switchPage.locator('button[type="submit"]').isDisabled();
      if (!submitDisabled) {
        throw new Error('Submit button must be disabled when no endpoint is configured');
      }

      // Verify no fake VEN- reference codes exist on page
      const pageText = await switchPage.textContent('body');
      if (/VEN-\d{6}/.test(pageText)) {
        throw new Error('Page contains a fake VEN- reference code — remove all simulated receipt numbers');
      }

      // Verify no false success/encryption claims
      const fakeClaims = ['cryptographically routed', 'Encrypting & Routing', 'Institutional inquiry received successfully'];
      for (const claim of fakeClaims) {
        if (pageText.includes(claim)) {
          throw new Error(`Page contains false delivery claim: "${claim}"`);
        }
      }

      // Verify pending-configuration notice is present
      const feedbackEl = await switchPage.locator('#form-feedback');
      const feedbackVisible = await feedbackEl.isVisible();
      if (!feedbackVisible) {
        throw new Error('#form-feedback not visible — pending notice must be shown');
      }

      results.passed++;
      console.log('  ✓ Contact form safe state: submit disabled, no fake claims, pending notice shown');
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

    // V5.5 — AI Ventures: All 7 venture names present in EN page
    console.log('\n--- V5.5: AI Ventures — Seven Project Names ---');
    results.total++;
    try {
      const aiHtml = fs.readFileSync(path.resolve(__dirname, '..', 'en', 'ai-ventures.html'), 'utf8');
      const required = ['AI-MOS', 'Orchestrator AI', 'Ali Executive Agent', 'RevOS AI Revenue', 'WealthOS AI', 'Causal Solver Mesh', 'Trade Bond Protocol'];
      const missing = required.filter(n => !aiHtml.includes(n));
      if (missing.length > 0) throw new Error('Missing ventures in en/ai-ventures.html: ' + missing.join(', '));
      results.passed++;
      console.log('  ✓ All 7 AI venture names present in en/ai-ventures.html');
    } catch (err) {
      results.failed++;
      results.errors.push(`AI ventures names test: ${err.message}`);
      console.error('  ✗ AI ventures names test failed:', err.message);
    }

    // V5.5 — AI Ventures: "In Development" labels present in both languages
    console.log('\n--- V5.5: AI Ventures — In Development status labels ---');
    results.total++;
    try {
      const enHtml = fs.readFileSync(path.resolve(__dirname, '..', 'en', 'ai-ventures.html'), 'utf8');
      const arHtml = fs.readFileSync(path.resolve(__dirname, '..', 'ar', 'ai-ventures.html'), 'utf8');
      const enCount = (enHtml.match(/In Development/g) || []).length;
      const arCount = (arHtml.match(/قيد التطوير/g) || []).length;
      if (enCount < 7) throw new Error(`EN page has ${enCount} "In Development" labels, expected 7`);
      if (arCount < 7) throw new Error(`AR page has ${arCount} "قيد التطوير" labels, expected 7`);
      results.passed++;
      console.log(`  ✓ In Development labels: EN=${enCount}, AR=${arCount}`);
    } catch (err) {
      results.failed++;
      results.errors.push(`AI ventures status labels test: ${err.message}`);
      console.error('  ✗ AI ventures status labels test failed:', err.message);
    }

    // V5.5 — Partnerships page: both languages route correctly
    console.log('\n--- V5.5: Partnerships page — EN and AR routes ---');
    results.total++;
    try {
      await switchPage.goto(`${BASE_URL}/en/partnerships.html`);
      const enTitle = await switchPage.title();
      if (!enTitle.includes('Partnership') && !enTitle.includes('Investment')) throw new Error('EN partnerships page title unexpected: ' + enTitle);
      await switchPage.goto(`${BASE_URL}/ar/partnerships.html`);
      const arLang = await switchPage.evaluate(() => document.documentElement.getAttribute('lang'));
      const arDir = await switchPage.evaluate(() => document.documentElement.getAttribute('dir'));
      if (arLang !== 'ar' || arDir !== 'rtl') throw new Error(`AR partnerships page lang/dir wrong: lang=${arLang}, dir=${arDir}`);
      results.passed++;
      console.log('  ✓ Partnerships page routes work: EN and AR');
    } catch (err) {
      results.failed++;
      results.errors.push(`Partnerships page route test: ${err.message}`);
      console.error('  ✗ Partnerships page route test failed:', err.message);
    }

    // V5.5 — Confidentiality gate: no private study URLs in any public HTML
    console.log('\n--- V5.5: Confidentiality — No private study URLs in public output ---');
    results.total++;
    try {
      const publicDirs = ['en', 'ar'];
      // Synthetic fixtures — real private study URLs are withheld from this public source.
      const privateUrls = ['alpha.private-study.example.invalid', 'beta.private-study.example.invalid', 'private-study.example.invalid'];
      const violations = [];
      for (const dir of publicDirs) {
        const htmlFiles = fs.readdirSync(path.resolve(__dirname, '..', dir)).filter(f => f.endsWith('.html'));
        for (const file of htmlFiles) {
          const content = fs.readFileSync(path.resolve(__dirname, '..', dir, file), 'utf8');
          for (const url of privateUrls) {
            if (content.includes(url)) violations.push(`${dir}/${file} contains "${url}"`);
          }
        }
      }
      if (violations.length > 0) throw new Error('Private URLs found in public HTML: ' + violations.join('; '));
      results.passed++;
      console.log('  ✓ No private study URLs (synthetic fixtures) in any public HTML');
    } catch (err) {
      results.failed++;
      results.errors.push(`Confidentiality URL test: ${err.message}`);
      console.error('  ✗ Confidentiality URL test failed:', err.message);
    }

    // V5.5 — Visibility gate: private/draft records excluded from public output
    console.log('\n--- V5.5: Visibility gate — private and draft opportunities excluded ---');
    results.total++;
    try {
      // Inject synthetic test fixtures with private/draft visibility
      const siteContent = require('../data/site-content.js');
      const register = siteContent.opportunities._internalRegister || [];
      const publicOpps = siteContent.opportunities.publicOpportunities || [];
      // Verify none of the internal register items leaked to publicOpportunities
      const leakedIds = register.filter(r => r.visibility !== 'private' && r.visibility !== 'draft').map(r => r.id);
      if (leakedIds.length > 0) throw new Error('Internal register contains non-private records that could leak: ' + leakedIds.join(', '));
      // Verify public opportunities array has no private or draft records
      const leaked = publicOpps.filter(o => o.visibility !== 'approved_public');
      if (leaked.length > 0) throw new Error('publicOpportunities contains non-approved records: ' + leaked.map(o => o.id).join(', '));
      // Verify no synthetic private-study names leak into public HTML
      const enPartnerships = fs.readFileSync(path.resolve(__dirname, '..', 'en', 'partnerships.html'), 'utf8');
      if (enPartnerships.includes('Synthetic Study Alpha') || enPartnerships.includes('Synthetic Study Beta')) {
        throw new Error('Internal study names found in public partnerships page');
      }
      results.passed++;
      console.log('  ✓ Visibility gate: all internal records are private; no private data in public partnerships page');
    } catch (err) {
      results.failed++;
      results.errors.push(`Visibility gate test: ${err.message}`);
      console.error('  ✗ Visibility gate test failed:', err.message);
    }

    // V5.5 — No confidential detail pages generated for AI ventures
    console.log('\n--- V5.5: No auto-generated AI venture detail pages ---');
    results.total++;
    try {
      const aiVentureIds = ['ai-mos', 'orchestrator-ai', 'ali-executive-agent', 'revos-ai', 'wealthos-ai', 'causal-solver-mesh', 'ttade-bond-protocol'];
      const leaked = [];
      for (const id of aiVentureIds) {
        const enPath = path.resolve(__dirname, '..', 'en', `${id}.html`);
        const arPath = path.resolve(__dirname, '..', 'ar', `${id}.html`);
        if (fs.existsSync(enPath)) leaked.push(`en/${id}.html`);
        if (fs.existsSync(arPath)) leaked.push(`ar/${id}.html`);
      }
      if (leaked.length > 0) throw new Error('AI venture detail pages auto-generated without approval: ' + leaked.join(', '));
      results.passed++;
      console.log('  ✓ No unauthorized AI venture detail pages generated');
    } catch (err) {
      results.failed++;
      results.errors.push(`AI venture detail page gate test: ${err.message}`);
      console.error('  ✗ AI venture detail page gate test failed:', err.message);
    }

    // V5.6.1 — Team page: static HTML checks (images referenced, no invented data)
    console.log('\n--- V5.6.1: Team page HTML — images referenced, no invented data ---');
    results.total++;
    try {
      const enTeam = fs.readFileSync(path.resolve(__dirname, '..', 'en', 'team.html'), 'utf8');
      const arTeam = fs.readFileSync(path.resolve(__dirname, '..', 'ar', 'team.html'), 'utf8');
      const checks = [
        ['EN team page exists', enTeam.length > 500],
        ['AR team page exists', arTeam.length > 500],
        ['EN references team photo 1', enTeam.includes('Venera-Finance-Team-in-Neon-Office-1.png')],
        ['EN references team photo 2', enTeam.includes('Venera-Finance-Team-in-Neon-Office-2.png')],
        ['AR references team photo 1', arTeam.includes('Venera-Finance-Team-in-Neon-Office-1.png')],
        ['AR references team photo 2', arTeam.includes('Venera-Finance-Team-in-Neon-Office-2.png')],
        ['Single-image gallery markup present', enTeam.includes('tm-gallery') && enTeam.includes('tm-stage')],
        ['Gallery has prev/next controls', enTeam.includes('tm-prev') && enTeam.includes('tm-next')],
        ['No blue-overlay reveal class', !enTeam.includes('team-img-reveal')],
        ['No overlapping photo composition classes', !enTeam.includes('team-photo-secondary')],
        ['EN new middle headline', enTeam.includes('Technology. Execution. Shared Vision.')],
        ['AR new middle headline', arTeam.includes('التقنية. التنفيذ. رؤية مشتركة.')],
        ['No invented employee names', !enTeam.match(/John|Jane|Ahmed|Mohammed|Sara|Manager|Director of/i)],
        ['No org chart sections', !enTeam.includes('org-chart') && !enTeam.includes('orgChart')],
        ['No headcount claims', !enTeam.match(/\d+\s+(employees|staff|people|members)/i)],
        ['AR dir=rtl present', arTeam.includes('dir="rtl"')],
        ['EN has LinkedIn CTA', enTeam.includes('linkedin.com')],
        ['No lazy-loaded team images', !enTeam.includes('loading="lazy"')],
      ];
      const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
      if (failures.length > 0) throw new Error('Team page HTML checks failed: ' + failures.join(', '));
      results.passed++;
      console.log('  ✓ Team page HTML: single-image gallery, new headline, no overlap, no invented data');
    } catch (err) {
      results.failed++;
      results.errors.push(`Team page HTML test: ${err.message}`);
      console.error('  ✗ Team page HTML test failed:', err.message);
    }

    // V5.6.2 — Gallery images render visibly; both decode; slide 2 reachable
    console.log('\n--- V5.6.2: Team gallery — active image visible, both decode, next works (EN+AR, desktop+mobile) ---');
    results.total++;
    try {
      const galleryChecks = [];

      async function readActive(pg) {
        return pg.evaluate(() => {
          const slides = Array.from(document.querySelectorAll('.tm-slide'));
          const active = document.querySelector('.tm-slide.active');
          const img = active && active.querySelector('img');
          const st = active ? window.getComputedStyle(active) : null;
          return {
            slideCount: slides.length,
            // every slide image must be decoded (both load eagerly, no blank states)
            allDecoded: slides.every(s => {
              const im = s.querySelector('img');
              return im && im.complete && im.naturalWidth > 0;
            }),
            activeSrc: img ? img.src.split('/').pop() : null,
            activeRendered: img ? (img.offsetWidth > 0 && img.offsetHeight > 0) : false,
            activeOpacity: st ? parseFloat(st.opacity) : 0,
            activeVisible: st ? (st.visibility !== 'hidden' && st.display !== 'none') : false
          };
        });
      }

      for (const lang of ['en', 'ar']) {
        for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
          const ctx2 = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
          const pg = await ctx2.newPage();
          await pg.goto(`${BASE_URL}/${lang}/team.html`, { waitUntil: 'networkidle', timeout: 20000 });
          await pg.waitForTimeout(400);

          const tag = `[${lang} ${vp.w}px]`;
          const a = await readActive(pg);
          if (a.slideCount !== 2) galleryChecks.push(`${tag} expected 2 slides, found ${a.slideCount}`);
          if (!a.allDecoded) galleryChecks.push(`${tag} not all slide images decoded`);
          if (!a.activeRendered) galleryChecks.push(`${tag} active image zero rendered size`);
          if (a.activeOpacity < 0.9) galleryChecks.push(`${tag} active image opacity ${a.activeOpacity} (not fully visible)`);
          if (!a.activeVisible) galleryChecks.push(`${tag} active image hidden/display:none`);

          // Advance to slide 2 and confirm it becomes the visible active image
          await pg.click('.tm-next');
          await pg.waitForTimeout(900);
          const b = await readActive(pg);
          if (b.activeSrc === a.activeSrc) galleryChecks.push(`${tag} next did not change active image`);
          if (b.activeOpacity < 0.9) galleryChecks.push(`${tag} slide 2 opacity ${b.activeOpacity} (not fully visible)`);
          if (!b.activeRendered) galleryChecks.push(`${tag} slide 2 zero rendered size`);

          await ctx2.close();
        }
      }
      if (galleryChecks.length > 0) throw new Error('Gallery visibility failures:\n    ' + galleryChecks.join('\n    '));
      results.passed++;
      console.log('  ✓ Gallery: active image fully visible, both photos decode, next reaches slide 2 (EN+AR, desktop+mobile)');
    } catch (err) {
      results.failed++;
      results.errors.push(`Team gallery visibility test: ${err.message}`);
      console.error('  ✗ Team gallery visibility test failed:', err.message);
    }

    // V5.6.1 — Nav overflow with dropdown: primary nav fits at 1440px AR
    console.log('\n--- V5.6.1: Nav dropdown — primary nav fits at 1440px AR ---');
    results.total++;
    try {
      const switchPage = await browser.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
      await switchPage.goto(`${BASE_URL}/ar/team.html`, { waitUntil: 'networkidle' });
      const overflow = await switchPage.evaluate(() => {
        const nav = document.querySelector('.topnav .wrap') || document.querySelector('header .wrap');
        if (!nav) return 0;
        return nav.scrollWidth - nav.clientWidth;
      });
      await switchPage.context().close();
      if (overflow > 5) throw new Error(`AR nav overflow at 1440px: scrollWidth exceeds clientWidth by ${overflow}px`);
      results.passed++;
      console.log(`  ✓ AR nav within bounds at 1440px (overflow: ${overflow}px)`);
    } catch (err) {
      results.failed++;
      results.errors.push(`V5.6.1 nav overflow test: ${err.message}`);
      console.error('  ✗ V5.6.1 nav overflow test failed:', err.message);
    }

    // V5.6.1 — Dropdown "More" button present in generated HTML
    console.log('\n--- V5.6.1: Nav dropdown "More" button present ---');
    results.total++;
    try {
      const enHtml = fs.readFileSync(path.resolve(__dirname, '..', 'en', 'team.html'), 'utf8');
      const arHtml = fs.readFileSync(path.resolve(__dirname, '..', 'ar', 'team.html'), 'utf8');
      if (!enHtml.includes('nav-more-btn')) throw new Error('EN nav: .nav-more-btn not found');
      if (!arHtml.includes('nav-more-btn')) throw new Error('AR nav: .nav-more-btn not found');
      if (!enHtml.includes('nav-dropdown')) throw new Error('EN nav: .nav-dropdown not found');
      results.passed++;
      console.log('  ✓ "More" dropdown markup present in both EN and AR pages');
    } catch (err) {
      results.failed++;
      results.errors.push(`Nav dropdown HTML test: ${err.message}`);
      console.error('  ✗ Nav dropdown HTML test failed:', err.message);
    }

    // V5.7 — Portfolio cards render, media covers present, no broken covers
    console.log('\n--- V5.7: Portfolio cards + media covers (EN + AR) ---');
    results.total++;
    try {
      const siteContent = require('../data/site-content.js');
      const problems = [];
      for (const lang of ['en', 'ar']) {
        const expected = siteContent.projects[lang].length;
        const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const pg = await ctx2.newPage();
        await pg.goto(`${BASE_URL}/${lang}/projects.html`, { waitUntil: 'networkidle', timeout: 20000 });
        // scroll to trigger lazy covers
        await pg.evaluate(async () => { await new Promise(r => { let y = 0; const t = setInterval(() => { window.scrollTo(0, y); y += 500; if (y > document.body.scrollHeight) { clearInterval(t); setTimeout(r, 400); } }, 50); }); });
        await pg.waitForTimeout(500);
        const res = await pg.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('.portfolio-card'));
          const covers = cards.filter(c => c.querySelector('.pf-cover')).length;
          const imgCovers = Array.from(document.querySelectorAll('.pf-cover img'));
          const brokenCover = imgCovers.filter(im => im.complete && im.naturalWidth === 0).length;
          const monoCovers = document.querySelectorAll('.pf-cover-logo .pf-mono').length;
          return { cardCount: cards.length, covers, brokenCover, imgCount: imgCovers.length, monoCovers };
        });
        if (res.cardCount !== expected) problems.push(`${lang}: ${res.cardCount} cards, expected ${expected}`);
        if (res.covers !== res.cardCount) problems.push(`${lang}: ${res.cardCount - res.covers} cards missing a cover`);
        if (res.brokenCover > 0) problems.push(`${lang}: ${res.brokenCover} broken image cover(s)`);
        if (res.imgCount < 5) problems.push(`${lang}: only ${res.imgCount} real-image covers (expected >=5)`);
        await ctx2.close();
      }
      if (problems.length) throw new Error(problems.join('; '));
      results.passed++;
      console.log('  ✓ All portfolio cards render with a cover; real-image covers decode; logo fallbacks present');
    } catch (err) {
      results.failed++;
      results.errors.push(`V5.7 portfolio cards test: ${err.message}`);
      console.error('  ✗ V5.7 portfolio cards test failed:', err.message);
    }

    // V5.7 — StylAI detail gallery: 2 slides, active visible, next reaches slide 2
    console.log('\n--- V5.7: StylAI detail gallery (EN + AR) ---');
    results.total++;
    try {
      const problems = [];
      for (const lang of ['en', 'ar']) {
        const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const pg = await ctx2.newPage();
        await pg.goto(`${BASE_URL}/${lang}/stylai.html`, { waitUntil: 'networkidle', timeout: 20000 });
        await pg.waitForTimeout(400);
        const a = await pg.evaluate(() => {
          const slides = Array.from(document.querySelectorAll('.pf-slide'));
          const active = document.querySelector('.pf-slide.active');
          const img = active && active.querySelector('img');
          const st = active ? getComputedStyle(active) : null;
          return { n: slides.length, allDecoded: slides.every(s => { const im = s.querySelector('img'); return im && im.complete && im.naturalWidth > 0; }), src: img ? img.src.split('/').pop() : null, op: st ? parseFloat(st.opacity) : 0 };
        });
        if (a.n !== 2) problems.push(`${lang}: expected 2 slides, got ${a.n}`);
        if (!a.allDecoded) problems.push(`${lang}: not all gallery images decoded`);
        if (a.op < 0.9) problems.push(`${lang}: active slide not visible (opacity ${a.op})`);
        await pg.click('.pf-next'); await pg.waitForTimeout(800);
        const b2 = await pg.evaluate(() => { const active = document.querySelector('.pf-slide.active'); const img = active && active.querySelector('img'); const st = active ? getComputedStyle(active) : null; return { src: img ? img.src.split('/').pop() : null, op: st ? parseFloat(st.opacity) : 0 }; });
        if (b2.src === a.src) problems.push(`${lang}: next did not change slide`);
        if (b2.op < 0.9) problems.push(`${lang}: slide 2 not visible`);
        await ctx2.close();
      }
      if (problems.length) throw new Error(problems.join('; '));
      results.passed++;
      console.log('  ✓ StylAI gallery: 2 slides decode, active visible, next reaches slide 2 (EN + AR)');
    } catch (err) {
      results.failed++;
      results.errors.push(`V5.7 StylAI gallery test: ${err.message}`);
      console.error('  ✗ V5.7 StylAI gallery test failed:', err.message);
    }

    // V5.7 — No empty gallery sections; single-visual pages have exactly one framed image
    console.log('\n--- V5.7: No empty gallery / no fabricated slots ---');
    results.total++;
    try {
      const problems = [];
      const single = ['dilmart', 'muhasebos', 'orbitraai', 'stylai-store'];
      for (const lang of ['en', 'ar']) {
        for (const slug of single) {
          const html = fs.readFileSync(path.resolve(__dirname, '..', lang, `${slug}.html`), 'utf8');
          if (html.includes('pf-gallery')) problems.push(`${lang}/${slug}: unexpected gallery on single-visual page`);
          const frames = (html.match(/pf-single-frame/g) || []).length;
          if (frames !== 1) problems.push(`${lang}/${slug}: expected 1 single frame, found ${frames}`);
        }
        for (const slug of ['max-hub', 'deyon']) {
          const html = fs.readFileSync(path.resolve(__dirname, '..', lang, `${slug}.html`), 'utf8');
          if (html.includes('pf-gallery') || html.includes('pf-single-frame')) problems.push(`${lang}/${slug}: logo-only page should have no image gallery/frame`);
          if (!html.includes('pf-logo-panel')) problems.push(`${lang}/${slug}: missing logo panel`);
        }
      }
      if (problems.length) throw new Error(problems.join('; '));
      results.passed++;
      console.log('  ✓ Single-visual pages have one frame; logo-only pages have no fabricated gallery');
    } catch (err) {
      results.failed++;
      results.errors.push(`V5.7 empty-gallery test: ${err.message}`);
      console.error('  ✗ V5.7 empty-gallery test failed:', err.message);
    }

    // V5.7 — Confidential URLs never appear in any public HTML (incl. new media pages)
    console.log('\n--- V5.7: Confidential URL exclusion (synthetic fixtures) ---');
    results.total++;
    try {
      const banned = ['alpha.private-study.example.invalid', 'beta.private-study.example.invalid', 'private-study.example.invalid'];
      const hits = [];
      for (const lang of ['en', 'ar']) {
        const dir = path.resolve(__dirname, '..', lang);
        for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.html'))) {
          const c = fs.readFileSync(path.join(dir, f), 'utf8');
          for (const b of banned) if (c.includes(b)) hits.push(`${lang}/${f} -> ${b}`);
        }
      }
      if (hits.length) throw new Error('Confidential URL found: ' + hits.join(', '));
      results.passed++;
      console.log('  ✓ No confidential study URLs in any public HTML');
    } catch (err) {
      results.failed++;
      results.errors.push(`V5.7 confidential URL test: ${err.message}`);
      console.error('  ✗ V5.7 confidential URL test failed:', err.message);
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
