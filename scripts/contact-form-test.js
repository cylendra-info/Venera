/** V5.12.2 local-only Netlify Forms contract and delivery-state QA. */
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'qa-screenshots', 'v5.12.2-form-delivery');
const PORT = 4182;
const BASE = `http://127.0.0.1:${PORT}`;
const FORM_NAME = 'venera-institutional-inquiry';
const FIELD_NAMES = ['form-name', 'bot-field', 'full_name', 'organization', 'job_title', 'email', 'category', 'message', 'privacy_consent'];
const CATEGORY_VALUES = ['strategic-partnership', 'investment-opportunity', 'joint-venture', 'government-institutional-collaboration', 'technology-partnership', 'general-inquiry'];

function readContact(lang, root = ROOT) {
  return fs.readFileSync(path.join(root, lang, 'contact.html'), 'utf8');
}

function valuesFor(html, pattern) {
  return [...html.matchAll(pattern)].map(match => match[1]);
}

function auditStaticMarkup(root = ROOT) {
  const output = {};
  for (const lang of ['en', 'ar']) {
    const html = readContact(lang, root);
    assert.match(html, /<form[^>]+name="venera-institutional-inquiry"[^>]+method="POST"[^>]+data-netlify="true"[^>]+netlify-honeypot="bot-field"/);
    assert.match(html, new RegExp(`action="/${lang}/contact"`), `${lang} form does not use its direct static route`);
    assert.match(html, /<input type="hidden" name="form-name" value="venera-institutional-inquiry">/);
    const fields = valuesFor(html, /\bname="([^"]+)"/g).filter(name => FIELD_NAMES.includes(name));
    assert.deepEqual([...new Set(fields)].sort(), [...FIELD_NAMES].sort(), `${lang} field schema mismatch`);
    const categories = valuesFor(html, /<option value="([^"]+)"/g).filter(Boolean);
    assert.deepEqual(categories, CATEGORY_VALUES, `${lang} category values mismatch`);
    for (const name of ['full_name', 'organization', 'email', 'category', 'message', 'privacy_consent']) {
      assert.match(html, new RegExp(`<[^>]+name="${name}"[^>]+required`), `${lang} ${name} must be required`);
    }
    assert.doesNotMatch(html, /name="job_title"[^>]+required/);
    assert.doesNotMatch(html, /type="file"/i);
    assert.match(html, /maxlength="120"/);
    assert.match(html, /maxlength="160"/);
    assert.match(html, /maxlength="254"/);
    assert.match(html, /maxlength="4000"/);
    assert.match(html, /data-invalid-message=/);
    assert.match(html, /data-too-short-message=/);
    assert.match(html, lang === 'en' ? /Minimum 20 characters\./ : /الحد الأدنى 20 حرفاً\./);
    assert.match(html, /Netlify/);
    assert.match(html, lang === 'en' ? /Do not submit confidential technical documents/ : /لا ترسل مستندات تقنية سرية/);
    output[lang] = { fields: FIELD_NAMES.length, categories: categories.length };
  }
  const enNames = [...new Set(valuesFor(readContact('en', root), /\bname="([^"]+)"/g).filter(name => FIELD_NAMES.includes(name)))].sort();
  const arNames = [...new Set(valuesFor(readContact('ar', root), /\bname="([^"]+)"/g).filter(name => FIELD_NAMES.includes(name)))].sort();
  assert.deepEqual(enNames, arNames, 'EN/AR form fields differ');
  return output;
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`${BASE}/en/contact.html`)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Local server did not start');
}

async function fillValidForm(page, { suffix = '', email = 'qa1@example.org', message = 'This is a controlled local QA inquiry with sufficient detail.', consent = true } = {}) {
  await page.locator('[name="full_name"]').fill(`Test Person${suffix}`);
  await page.locator('[name="organization"]').fill(`Test Organization${suffix}`);
  await page.locator('[name="job_title"]').fill('Director');
  await page.locator('[name="email"]').fill(email);
  await page.locator('[name="category"]').selectOption('strategic-partnership');
  await page.locator('[name="message"]').fill(message);
  if (consent) await page.locator('[name="privacy_consent"]').check();
}

async function interactionAudit(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en/contact.html`, { waitUntil: 'networkidle' });
  let postCount = 0;
  let submittedBody = '';
  let submittedContentType = '';

  await page.route(`${BASE}/en/contact`, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    postCount++;
    submittedBody = route.request().postData() || '';
    submittedContentType = route.request().headers()['content-type'] || '';
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.fulfill({ status: 202, contentType: 'text/plain', body: 'accepted' });
  });

  await page.locator('button[type="submit"]').click();
  assert.equal(postCount, 0, 'invalid form sent a request');
  assert(await page.locator('#form-feedback.error').isVisible(), 'required-field feedback missing');
  assert.equal(await page.evaluate(() => document.activeElement?.name), 'full_name', 'first empty required field was not focused');
  assert.equal(await page.locator('#contact-name-error').textContent(), 'Enter your full name.');
  assert.equal(await page.locator('#contact-email-error').textContent(), 'Enter an email address.');
  assert.equal(await page.locator('#contact-message-error').textContent(), 'Describe your inquiry.');
  assert.equal(await page.locator('#contact-consent-error').textContent(), 'Confirm privacy consent before submitting.');

  await page.reload({ waitUntil: 'networkidle' });
  await fillValidForm(page, { email: 'invalid-email' });
  await page.locator('button[type="submit"]').click();
  assert.equal(postCount, 0, 'invalid email sent a request');
  assert.equal(await page.evaluate(() => document.activeElement?.name), 'email', 'invalid email was not focused');
  assert.match(await page.locator('#contact-email-error').textContent(), /valid email address/);
  assert.equal(await page.locator('[name="full_name"]').inputValue(), 'Test Person', 'validation failure cleared input');

  const acceptedEmails = ['person@gmail.com', 'person@outlook.com', 'person@company.example'];
  const emailResults = {};
  for (const email of acceptedEmails) {
    await page.locator('[name="email"]').fill(email);
    emailResults[email] = await page.locator('[name="email"]').evaluate(field => field.checkValidity());
  }
  assert(Object.values(emailResults).every(Boolean), 'a syntactically valid email provider was rejected');

  await page.reload({ waitUntil: 'networkidle' });
  await fillValidForm(page, { email: 'person@gmail.com', message: 'hi' });
  await page.locator('button[type="submit"]').click();
  assert.equal(postCount, 0, 'short message sent a request');
  assert.equal(await page.evaluate(() => document.activeElement?.name), 'message', 'short message was not focused');
  assert.match(await page.locator('#contact-message-error').textContent(), /at least 20 characters/);
  assert.equal(await page.locator('[name="message"]').inputValue(), 'hi', 'short message was not preserved');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUTPUT, 'en-short-message-validation-1440x900.png'), fullPage: true });

  await page.reload({ waitUntil: 'networkidle' });
  await fillValidForm(page, { email: 'person@outlook.com', consent: false });
  await page.locator('button[type="submit"]').click();
  assert.equal(postCount, 0, 'unchecked consent sent a request');
  assert.equal(await page.evaluate(() => document.activeElement?.name), 'privacy_consent', 'unchecked consent was not focused');
  assert.match(await page.locator('#contact-consent-error').textContent(), /privacy consent/);

  await page.reload({ waitUntil: 'networkidle' });
  await fillValidForm(page, { email: 'qa1@example.org' });
  const honeypot = page.locator('[name="bot-field"]');
  assert.equal(await honeypot.getAttribute('required'), null, 'honeypot must not be required');
  assert.equal(await honeypot.evaluate(field => field.checkValidity()), true, 'empty honeypot invalidated the form');
  await honeypot.fill('synthetic-trap-value');

  await page.evaluate(() => {
    const form = document.querySelector('#institutional-contact-form');
    form.requestSubmit();
    form.requestSubmit();
  });
  await page.waitForFunction(() => document.querySelector('button[type="submit"]').getAttribute('aria-busy') === 'true');
  assert.equal(await page.locator('button[type="submit"]').isDisabled(), true, 'button not disabled while pending');
  assert.equal((await page.locator('button[type="submit"]').textContent()).trim(), 'Submitting securely…', 'loading message missing');
  await page.waitForSelector('#form-feedback.info');
  assert.equal(postCount, 1, 'duplicate submissions were not prevented');
  assert.match(submittedContentType, /^application\/x-www-form-urlencoded\b/, 'incorrect request content type');
  const params = new URLSearchParams(submittedBody);
  assert.equal(params.get('form-name'), FORM_NAME);
  assert.equal(params.get('full_name'), 'Test Person');
  assert.equal(params.get('organization'), 'Test Organization');
  assert.equal(params.get('job_title'), 'Director');
  assert.equal(params.get('email'), 'qa1@example.org');
  assert.equal(params.get('category'), 'strategic-partnership');
  assert.equal(params.get('privacy_consent'), 'consented');
  assert.equal(params.get('bot-field'), 'synthetic-trap-value');
  assert.equal(await page.locator('[name="full_name"]').inputValue(), 'Test Person', '2xx response cleared user input');
  assert.equal(await page.locator('[name="privacy_consent"]').isChecked(), true, '2xx response cleared consent');
  assert.match(await page.locator('#form-feedback').textContent(), /dashboard receipt and email delivery are still awaiting owner verification/i);
  assert.match((await page.locator('button[type="submit"]').textContent()).trim(), /^Submit Institutional Inquiry/, 'submit label was not restored');

  await page.unroute(`${BASE}/en/contact`);
  await page.route(`${BASE}/en/contact`, route => route.request().method() === 'POST'
    ? route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Ordinary page</title>' })
    : route.continue());
  await fillValidForm(page, { suffix: ' HTML', email: 'html@example.org' });
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('#form-feedback')?.textContent.includes('page response'));
  assert(await page.locator('#form-feedback.info').isVisible(), 'unexpected HTML was not classified as ambiguous');
  assert.equal(await page.locator('[name="full_name"]').inputValue(), 'Test Person HTML', 'HTML response cleared user input');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUTPUT, 'en-html-response-pending-1440x900.png'), fullPage: true });

  await page.unroute(`${BASE}/en/contact`);
  await page.route(`${BASE}/en/contact`, route => route.request().method() === 'POST'
    ? route.fulfill({ status: 422, contentType: 'text/plain', body: 'rejected' })
    : route.continue());
  await fillValidForm(page, { suffix: ' Rejected', email: 'rejected@example.org' });
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('#form-feedback')?.textContent.includes('rejected'));
  assert(await page.locator('#form-feedback.error').isVisible(), 'HTTP rejection feedback missing');
  assert.equal(await page.locator('[name="full_name"]').inputValue(), 'Test Person Rejected', 'HTTP rejection cleared user input');

  await page.unroute(`${BASE}/en/contact`);
  await page.route(`${BASE}/en/contact`, route => route.request().method() === 'POST'
    ? route.abort('failed')
    : route.continue());
  await fillValidForm(page, { suffix: ' Failure', email: 'failure@example.org' });
  await page.locator('button[type="submit"]').click();
  await page.waitForSelector('#form-feedback.error');
  assert.equal(await page.locator('[name="full_name"]').inputValue(), 'Test Person Failure', 'failed submission cleared user input');
  assert.equal(await page.locator('button[type="submit"]').isEnabled(), true, 'button remained disabled after failure');

  await page.unroute(`${BASE}/en/contact`);
  await page.route(`${BASE}/en/contact`, route => route.request().method() === 'POST'
    ? route.fulfill({ status: 302, headers: { location: `${BASE}/en/contact.html` }, body: '' })
    : route.continue());
  await fillValidForm(page, { suffix: ' Redirected', email: 'redirected@example.org' });
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('#form-feedback')?.textContent.includes('redirected'));
  assert(await page.locator('#form-feedback.error').isVisible(), 'redirect feedback missing');
  assert.equal(await page.locator('[name="full_name"]').inputValue(), 'Test Person Redirected', 'redirect cleared user input');

  const bodyText = await page.locator('body').innerText();
  assert(!/VEN-\d{6}|pending secure endpoint|received successfully|cryptographically routed/i.test(bodyText), 'fake or obsolete delivery claim detected');
  await context.close();
  return {
    emptyRequiredFields: true,
    invalidEmailSyntax: true,
    acceptedEmails: emailResults,
    shortMessage: true,
    uncheckedConsent: true,
    focusFirstInvalid: true,
    honeypot: true,
    duplicatePrevention: true,
    encodedBody: true,
    acceptedHttpPreservesInput: true,
    unexpectedHtmlPreservesInput: true,
    httpRejectionPreservesInput: true,
    networkFailurePreservesInput: true,
    redirectDetectionPreservesInput: true
  };
}

async function responsiveAudit(browser) {
  const shots = [];
  for (const lang of ['en', 'ar']) {
    for (const target of [{ name: 'desktop-1440x900', width: 1440, height: 900 }, { name: 'mobile-390x844', width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport: { width: target.width, height: target.height }, isMobile: target.width < 600, hasTouch: target.width < 600 });
      const page = await context.newPage();
      await page.goto(`${BASE}/${lang}/contact.html`, { waitUntil: 'networkidle' });
      if (lang === 'ar' && target.width === 390) {
        await fillValidForm(page, { email: 'person@outlook.com', consent: false });
        await page.locator('button[type="submit"]').click();
        assert.match(await page.locator('#contact-consent-error').textContent(), /الموافقة على الخصوصية/);
      }
      await page.locator('#inquiry-form').scrollIntoViewIfNeeded();
      const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
      assert(dimensions.body <= dimensions.viewport + 1, `${lang} ${target.name} horizontal overflow`);
      const file = `${lang}-contact-${target.name}.png`;
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(OUTPUT, file), fullPage: true });
      shots.push(file);
      await context.close();
    }
  }
  return shots;
}

(async () => {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const staticMarkup = auditStaticMarkup();
  const server = spawn(process.execPath, ['scripts/serve.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  try {
    await waitForServer();
    const browser = await chromium.launch({ headless: true });
    try {
      const interactions = await interactionAudit(browser);
      const screenshots = await responsiveAudit(browser);
      const result = { formName: FORM_NAME, staticMarkup, interactions, screenshots: [...screenshots, 'en-short-message-validation-1440x900.png', 'en-html-response-pending-1440x900.png'], actualSubmissionsSent: 0 };
      fs.writeFileSync(path.join(OUTPUT, 'contact-form-results.json'), `${JSON.stringify(result, null, 2)}\n`);
      console.log(JSON.stringify(result, null, 2));
    } finally { await browser.close(); }
  } finally {
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
