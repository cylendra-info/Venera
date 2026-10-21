# VENERA Technology V5.1 — Content Gaps Register

Date: 2026-10-19

---

## CG-01: Production Domain Not Set (BLOCKING)

`data/site-content.js` `canonicalDomain` is empty. Owner must set a verified owned domain and rebuild to activate canonical, hreflang, og:url, and sitemap.

---

## CG-02: Contact Form Endpoint Missing (BLOCKING)

Form is disabled with LinkedIn fallback. Owner must configure a verified delivery endpoint. See V5_1_FIXES.md Fix 1 for specification.

---

## CG-03: Globe Reduced-Motion (Non-blocking)

No `prefers-reduced-motion` check in globe animation. Add `window.matchMedia('(prefers-reduced-motion: reduce)')` check to stop rotation and show static nodes.

---

## CG-04: Insights Articles Attribution (Non-blocking)

Articles are internally authored analyses. Existing labelling is acceptable. Owner to confirm no article implies independent peer-review.

---

## CG-05: Nuxese Group / Estonia Entity Status (Non-blocking)

Described as incorporated 2020 for EU exploration. Owner to confirm whether still active or dissolved. Current wording acceptable if entity is dormant.

---

## CG-06: VeneraSwap Protocol Status (Non-blocking)

Described as proof-of-concept architecture. Owner to confirm no live protocol, no user funds, no regulatory approval implied.

---

## CG-07: VENERA Technology Trademark (Owner decision)

Noted as subject to final trademark clearance. Owner must clear before public marketing or legal instruments.
