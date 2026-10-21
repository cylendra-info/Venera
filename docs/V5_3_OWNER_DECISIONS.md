# VENERA V5.3 — Owner Decisions Required

Branch: feature/v5.3-portfolio-expansion  
Date: 2026-10-19

Items require explicit owner decision before implementation. Nothing here was done speculatively.

---

## Decision 1 — New Project Evidence Packages (updated 2026-10-19)

### RESOLVED — StylAI, StylAI Store
Cards and detail pages live. Evidence: App Store + Google Play (Venera Finance).

### RESOLVED — DilMart Store inclusion approved
Owner approved DilMart for portfolio (2026-10-19). Google Play + GitHub evidence confirmed.
**Still needed before card creation:** description (1–2 sentences) + visual asset (screenshot or logo) + confirm Venera role (builder / operator).

### OPEN — Max Hub
Operational confirmed by owner. No public evidence found.
**Required:** any of app store URL, package ID, deployed URL, local repo path, demo, screenshot.
Minimum for card: one-sentence description + one visual asset.

### OPEN — Deyon App
Same status as Max Hub.
**Required:** same as Max Hub above.

### OPEN — AI Projects (6 products)
No evidence found. Internal inventory stubs created.
**Required per product:** description, implementation status, any evidence (URL / repo / demo / screenshot), category confirmation, Venera role.

Products: AI-MOS, Orchestrator AI, Ali Executive Agent, RevOS AI Revenue, OrbitraAI, WealthOS AI.

---

## Decision 2 — VeneraSwap Contract Details

PENDING. Provide:
- EVM chain name
- Deployed contract address (if shareable)
- Confirm or update "Revival Assessment" status

---

## Decision 3 — PayNXS Historical Evidence

PENDING. Any of:
- App store archive link
- Screenshot of app UI
- Domain record or archived press mention

---

## Decision 4 — ROIC Telegram Link

PENDING. Provide @botname if publicly accessible, or confirm should stay as discontinued.

---

## Decision 5 — Nuxese Estonia Registration

PENDING. Provide Estonian Business Register entry number.

---

## Decision 6 — Founder Quote Attribution (RESOLVED in V5.3)

ACTION TAKEN: The `<cite>` line ("— Ali Hussein, Founder & Technology Director,
Venera Finance LTD") has been removed. Quote now appears as unattributed company
philosophy.

To reinstate: Owner must confirm in writing. Then add `<cite>` back in `buildFounderPage()`.

---

## Decision 7 — AI Category Filter Button Visibility

CSS classes and `data-category="ai"` are fully implemented. The filter button is NOT
rendered because no AI project has confirmed evidence.

To activate: Add at least one AI project to site-content.js, then add `ai` back to the
filter tabs in `buildProjectsPage()` in build.js.
