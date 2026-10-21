# VENERA Technology V5.1 — Applied Fixes

Branch: `v5.1-hardening`
Starting commit: `44c94e3971201d1f11876d72b4535e0155e0a4f7`
Date: 2026-10-19

---

## Fix 1 — P0: Fake Contact Form Submission Removed

**File:** `assets/app.js` — `initContactForm()`

**Root cause:** Used `setTimeout()` to simulate a 1.2-second delay, then displayed a randomly generated `VEN-XXXXXX` reference number claiming the message was "cryptographically routed to our systems engineering practice." No actual network request was performed.

**Change:** Submit button disabled on page load. `#form-feedback` immediately shows a pending-configuration notice in EN and AR. Any submit event is intercepted with no submission, no fake success, no reference codes. LinkedIn profile linked as verified alternative contact.

**Future integration:** Integrate a verified delivery endpoint (Formspree, Netlify Forms, or custom backend). POST via `fetch()`, await genuine 2xx response before any success message, handle errors explicitly, never generate reference IDs client-side.

---

## Fix 2 — P0: Unverified Domain Removed

**Files:** `data/site-content.js`, `scripts/build.js`

**Root cause:** `canonicalDomain: "https://veneratech.com"` had no documented owner verification. Used for canonical, hreflang, og:url, sitemap, robots. Hreflang URLs were also relative (invalid per spec).

**Changes:**
- `canonicalDomain` set to `""` with deployment instruction comment.
- `renderHead()` only emits canonical/hreflang/og:url when domain is non-empty.
- `buildSitemap()` skips with warning when no domain.
- `buildRobots()` comments out Sitemap line when no domain.
- When domain is present, hreflang URLs are now absolute.

**To activate:** Set `canonicalDomain` to verified owner-controlled URL and rebuild.

---

## Fix 3 — P1: Globe Node Labels Degeographicized

**File:** `assets/app.js`

**Root cause:** Nine nodes labeled Minsk HQ, Baghdad, London, etc. implied office presence or infrastructure.

**Change:** Labels replaced with `Node-A` through `Node-I`. Edge comments updated. Coordinates unchanged.

---

## Fix 4 — P1: CSS Info State Added

**File:** `assets/style.css`

**Root cause:** `.form-feedback.info` had no display rule — notice was invisible.

**Change:** Added `.form-feedback.info { display: block; }` with blue-tint styling matching existing palette.

---

## Fix 5 — P1: QA Suite Corrected

**File:** `scripts/qa-test.js`

**Changes:**
- Removed `hasCanonical` from required assertions.
- Contact form test updated: asserts submit disabled, no VEN- codes, no false claims, pending notice visible.

---

## Files Modified

| File | Summary |
|------|---------|
| `assets/app.js` | Remove fake form; neutral globe labels |
| `assets/style.css` | Add `.form-feedback.info` |
| `data/site-content.js` | Clear unverified domain |
| `scripts/build.js` | Domain-conditional SEO output; absolute hreflang |
| `scripts/qa-test.js` | Fix canonical assertion; update form test |
| `en/*.html`, `ar/*.html` | Regenerated (canonical block updated) |
| `robots.txt` | Sitemap line commented when no domain |
