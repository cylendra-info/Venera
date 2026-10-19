# VENERA Technology — Corporate Website V5 (Sovereign Tech)

[![Build & QA Status](https://img.shields.io/badge/QA%20Suite-64%2F64%20PASSED-brightgreen)](QA_REPORT.md)
[![Architecture](https://img.shields.io/badge/Architecture-Sovereign%20Tech-blue)](PROJECT_ARCHITECTURE.md)
[![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20AR%20(RTL)-blueviolet)](README.md)
[![Legal Entity](https://img.shields.io/badge/Legal%20Entity-Venera%20Finance%20LTD-09172b)](CONTENT_VERIFICATION.md)

Welcome to the official production codebase for **VENERA Technology** (Corporate Website V5).

VENERA Technology is presented as an international technology engineering company specializing in enterprise platforms, applied artificial intelligence, digital transformation, and strategic digital systems.

---

## Brand & Corporate Facts

- **Brand Name:** VENERA Technology
- **Legal Entity:** Venera Finance LTD (Republic of Belarus, Established 2020)
- **Founder & Technology Director:** Ali Hussein (Technology journey beginning in 2004)
- **Brand Positioning:** Digital Engineering • Artificial Intelligence • Strategic Systems
- **Main Tagline:** *Engineering the Systems of Tomorrow* (Arabic: *هندسة أنظمة الغد*)
- **Founder LinkedIn:** [https://www.linkedin.com/in/leader7701/](https://www.linkedin.com/in/leader7701/)

---

## Architectural Highlights

1. **True Multipage Bilingual Structure:**
   - Full routing support for English (`/en/`) and Arabic (`/ar/`) with strict RTL formatting (`dir="rtl"`, Tajawal typography, mirrored navigation).
   - Seamless language switching preserving the exact corresponding page.
2. **Interactive 3D Connected Digital Globe:**
   - Lightweight, hardware-accelerated Canvas rendering of an illuminated global telemetry network with pulsing infrastructure hubs (Minsk HQ, Baghdad, London, Frankfurt, Tallinn, Dubai, Singapore, New York).
   - Touch/drag interactive rotation with ambient auto-spin and automatic `prefers-reduced-motion` compliance.
3. **High-Priority Founder Page:**
   - Prominently displays founder **Ali Hussein** with official title **Founder & Technology Director**.
   - Executive portrait (`founder-executive.webp`) in the dark navy sovereign hero alongside illuminated quotes and LinkedIn connection.
   - Cinematic portrait (`founder-story.webp`) in the grassroots engineering narrative.
   - 6-stage verified career timeline (2004–2008, 2011 onward, 2013 Acesse, 2015 onward, 2020 onward, Current period).
4. **Transparent Project Portfolio:**
   - Dedicated case study deep-dives for **Cylendra Labs**, **VeneraSwap**, **PayNXS**, **OrderNXS**, **ROIC**, and **Nuxese Group**.
   - Explicit status badges: `Under Development — Labs`, `Developed / Historical`, `Third-Party Project`, `Historical Venture`.
5. **Strategic National Initiatives:**
   - Institutional briefing presentation for Madhmun National Trust Network, Inter-Agency Governance, IraqNav Spatial Systems, Energy Grid Modernization, and Regulated Digital Assets.
   - Strict governance disclaimers ensuring no false government contract claims.
6. **Research & Insights:**
   - 4 in-depth architectural and policy articles with reading times and an interactive in-page reading modal.
7. **Pristine Brand Assets:**
   - Extracted clean, uncropped standalone V-symbol for favicon (`assets/favicon.png`) and branding (`assets/venera-v-symbol.png`).
   - Dark-header brand logo (`assets/venera-logo-white.png`) preserving original metallic electric-blue circuitry and brushed steel without destructive CSS filters.

---

## Project Structure

```
d:\venera_site\
├── assets\
│   ├── app.js                         # 3D Globe Canvas, Mobile Nav, Form & Modal JS
│   ├── style.css                      # Master Sovereign Tech Stylesheet (RTL/LTR)
│   ├── favicon.png                    # Pristine standalone V-symbol favicon
│   ├── venera-v-symbol.png            # High-res standalone V-symbol asset
│   ├── venera-logo-transparent.png    # Original master logo
│   ├── venera-logo-white.png          # Dark-header logo (metallic V + crisp white text)
│   ├── founder-executive.webp         # Executive formal suit portrait of Ali Hussein
│   └── founder-story.webp             # Cinematic cap portrait of Ali Hussein
├── data\
│   └── site-content.js                # Single Source of Truth content dictionary (EN & AR)
├── en\                                # English Static Page Set (15 HTML files)
│   ├── index.html                     # Homepage
│   ├── about.html / company.html      # About & Corporate Governance
│   ├── expertise.html                 # Capabilities & Technology Stack
│   ├── projects.html / work.html      # Project Portfolio Catalog
│   ├── cylendra.html                  # Cylendra Labs Case Study
│   ├── veneraswap.html                # VeneraSwap AMM Case Study
│   ├── paynxs.html                    # PayNXS Digital Payments Case Study
│   ├── ordernxs.html                  # OrderNXS Logistics Case Study
│   ├── roic.html                      # ROIC Telegram Utility Case Study
│   ├── nuxese.html                    # Nuxese Group Corporate Case Study
│   ├── initiatives.html               # Strategic National Initiatives
│   ├── founder.html                   # Founder Page (Ali Hussein)
│   ├── insights.html                  # Research & Insights
│   └── contact.html                   # Institutional Contact & Inquiries
├── ar\                                # Arabic Static Page Set (15 HTML files)
│   └── [Equivalent localized RTL pages]
├── scripts\
│   ├── build.js                       # Static site compiler
│   ├── serve.js                       # High-performance local HTTP server
│   └── qa-test.js                     # Playwright automated test suite (64 assertions)
├── qa-screenshots\                    # 60 full-resolution test screenshots (1440px, 1024px, 390px)
├── index.html                         # Root redirect with browser language detection
├── sitemap.xml                        # Full multilingual XML sitemap
├── robots.txt                         # Search engine crawler directives
├── package.json                       # Node / NPM configuration
├── PROJECT_ARCHITECTURE.md            # Technical Architecture & Route Matrix
├── CONTENT_VERIFICATION.md            # Due Diligence Register (Tier 1, 2, 3)
├── QA_REPORT.md                       # Comprehensive Test Report (100% Passed)
└── NEXT_STEPS.md                      # Pre-Launch Checklist & Deployment Guide
```

---

## Local Execution Instructions

### 1. Build Static Pages
Compile all 30 HTML files, sitemap, and robots.txt from the content dictionary:
```bash
npm run build
# or: node scripts/build.js
```

### 2. Run Local Development Server
Start the local HTTP server on port 8080:
```bash
npm run serve
# or: node scripts/serve.js
```
Open [http://localhost:8080](http://localhost:8080) in your browser. Alternatively, run with Python:
```bash
python -m http.server 8000
```

### 3. Run Automated Quality Assurance Suite
Execute the full Playwright browser test suite across 3 viewports (1440x900, 1024x768, 390x844):
```bash
npm run test:qa
# or: node scripts/qa-test.js
```

---

## Governance & Verification

All public claims conform to the [Content Verification Register](CONTENT_VERIFICATION.md). No client names, governmental endorsements, financial metrics, team headcounts, or certification badges are fabricated.
