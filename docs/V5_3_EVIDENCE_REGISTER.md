# VENERA V5.3 — Evidence Register

Branch: feature/v5.3-portfolio-expansion  
Date: 2026-10-19

This register tracks what verifiable evidence exists, what is missing, and what is pending
owner approval for each project in the VENERA portfolio.

---

## Evidence Status Legend

| Symbol | Meaning |
|--------|---------|
| CONFIRMED | Independently verifiable or owner-authored and internally consistent |
| PENDING | Owner has stated this; awaiting external confirmation |
| MISSING | Not provided; needed before public display |
| N/A | Not applicable to this project type |

---

## Existing Projects

### Cylendra Labs

| Claim | Evidence Type | Status |
|-------|--------------|--------|
| labs.cylendra.com is live | Public URL | CONFIRMED |
| "Six interconnected platforms" | Owner-stated | PENDING external |
| Under active development | Owner-stated | PENDING external |
| Architecture description | Owner-authored | PENDING screenshot |
| Ali Hussein is architect/lead | Owner-stated | CONFIRMED (LinkedIn) |

**Missing to elevate card:** Screenshot of labs.cylendra.com, architecture diagram.

---

### VeneraSwap

| Claim | Evidence Type | Status |
|-------|--------------|--------|
| docs.veneraswap.com is accessible | Public URL | CONFIRMED |
| AMM protocol design | Public docs | CONFIRMED |
| Smart contract deployment | Claimed | MISSING — contract address needed |
| "Revival Assessment" status | Owner-stated | PENDING confirmation |
| EVM-compatible chain | Owner-stated | PENDING — which chain? |

**Missing to elevate card:** On-chain contract address, deployment chain name.

---

### PayNXS

| Claim | Evidence Type | Status |
|-------|--------------|--------|
| Published on app stores 2019–2020 | Owner-stated | PENDING — archive link needed |
| QR payment feature | Owner-stated | PENDING screenshot |
| Iraqi market focus | Owner-stated | CONFIRMED (plausible, consistent) |
| Did not reach wide commercial scale | Owner-stated | CONFIRMED (consistent with evidence gaps) |

**Missing to elevate card:** App store archive, single screenshot, or domain record.

---

### OrderNXS

| Claim | Evidence Type | Status |
|-------|--------------|--------|
| Third-party client engagement | Owner-stated | CONFIRMED (consistent framing) |
| Iraq delivery market | Owner-stated | CONFIRMED (plausible) |
| Engineering delivery completed | Owner-stated | CONFIRMED |
| Client identity | Withheld (acceptable) | N/A |

**Missing to elevate card:** Screenshot of UI, redacted client reference optional.

---

### ROIC

| Claim | Evidence Type | Status |
|-------|--------------|--------|
| Telegram bot interface | Owner-stated | PENDING — public bot link |
| ~100,000 community users | Owner-stated | MISSING independent audit |
| Discontinued before full launch | Owner-stated | CONFIRMED |
| Node.js/Python webhook stack | Owner-stated | CONFIRMED (technical) |

**Missing to elevate card:** Telegram @botname or archive evidence. 100k figure must NOT
be displayed until independently audited — this constraint is already enforced in
site-content.js statusVerification field.

---

### Nuxese Group

| Claim | Evidence Type | Status |
|-------|--------------|--------|
| Incorporated in Estonia 2020 | Owner-stated | PENDING — registry number needed |
| Explored MiCA/VASP licensing | Owner-stated | CONFIRMED (plausible for Estonia 2020) |
| Historical — not active licensing | Owner-stated | CONFIRMED |
| Cross-border corporate structuring | Owner-stated | CONFIRMED (generic) |

**Missing to elevate card:** Estonian Business Register entry number.

---

## New Projects — Evidence Update (V5.3.1)

Owner confirmed StylAI, StylAI Store, Max Hub, and Deyon App as operational software.

### StylAI (Consumer App) — CONFIRMED

| Claim | Evidence | Status |
|-------|----------|--------|
| Live on App Store | id6764330995 | CONFIRMED |
| Live on Google Play | com.stylai.app.customer | CONFIRMED |
| Venera Finance developer | Google Play developer page | CONFIRMED |
| Barber/salon booking feature set | App Store description | CONFIRMED |
| Active development | Version history (v1.1.3, multiple updates) | CONFIRMED |
| Developer name discrepancy | App Store lists "Safaa Ali", Play Store lists "Venera Finance" | NOTED — not a blocker |

**Portfolio card:** Added. **Detail page:** Created (en/stylai.html, ar/stylai.html).

---

### StylAI Store (Provider/Merchant App) — CONFIRMED

| Claim | Evidence | Status |
|-------|----------|--------|
| Live on Google Play | com.stylai.app.barber | CONFIRMED |
| Venera Finance developer | Google Play developer page | CONFIRMED |
| Barber management / appointment tool | App name "إدارة الحلاقين" = barber management | CONFIRMED |
| Two-sided marketplace counterpart | App pairs with com.stylai.app.customer | CONFIRMED |

**Portfolio card:** Added. **Detail page:** Created (en/stylai-store.html, ar/stylai-store.html).
**Note:** App Store listing not independently confirmed for this app; Google Play confirmed.

---

### Max Hub — OPERATIONAL (No Public Evidence Found)

Owner confirmed as operational. Web search and Google Play developer page (Venera Finance) returned no matching listing. No public URL found.

**Action required:** Owner to provide app store link, package ID, or deployed URL.
**Portfolio card:** NOT added until minimum evidence provided.

---

### Deyon App — OPERATIONAL (No Public Evidence Found)

Owner confirmed as operational. Web search returned no results. Not listed in Venera Finance Google Play developer page.

**Action required:** Owner to provide app store link, package ID, or deployed URL.
**Portfolio card:** NOT added until minimum evidence provided.

---

### DilMart Store — APPROVED FOR PORTFOLIO (2026-10-19)

Owner confirmed DilMart Store for portfolio inclusion (2026-10-19 confirmation).

| Claim | Evidence | Status |
|-------|----------|--------|
| Live on Google Play | com.dilmart.store (Venera Finance developer page) | CONFIRMED |
| GitHub repo exists | dilmart-info/Dilmart — React/Supabase, multi-vendor Iraqi e-commerce | CONFIRMED |
| Venera Finance publisher | Google Play developer listing | CONFIRMED |
| Product description | Iraqi multi-vendor e-commerce marketplace | CONFIRMED (GitHub) |

**Portfolio card:** APPROVED — blocked only on owner-provided description text + visual asset.
**Detail page:** NOT CREATED — awaiting owner description of scope and Venera role.
**Owner action:** Confirm product description (1–2 sentences), Venera role (builder / operator), and provide screenshot or logo.

---

### Remaining Projects (All Evidence Required)

| Project | Minimum Evidence Required |
|---------|--------------------------|
| AI-MOS | Description, status, any public URL or screenshot |
| Orchestrator AI | Description, status, any public URL or screenshot |
| Ali Executive Agent | Description, status, any public URL or screenshot |
| RevOS AI Revenue | Description, status, any public URL or screenshot |
| OrbitraAI | Description, status, any public URL or screenshot |
| WealthOS AI | Description, status, any public URL or screenshot |
