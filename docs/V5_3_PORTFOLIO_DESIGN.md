# VENERA V5.3 — Portfolio Design Specification

Branch: feature/v5.3-portfolio-expansion  
Date: 2026-10-19

---

## Category System

Four categories are defined. Three are active in V5.3 (verified projects exist).
The `ai` category is CSS/JS-ready but the filter button is hidden until at least
one AI project has confirmed evidence.

| Category ID | Display Label (EN) | Display Label (AR) | Color Token |
|-------------|-------------------|-------------------|-------------|
| `fintech` | FinTech & Trading | التقنية المالية والتداول | #10b981 (emerald) |
| `commerce` | Commerce & Consumer | التجارة والمستهلك | #f59e0b (amber) |
| `heritage` | Engineering Heritage | الإرث الهندسي | #8b5cf6 (violet) |
| `ai` | AI & Autonomous Systems | الذكاء الاصطناعي والأنظمة المستقلة | #38bdf8 (cyan) |

---

## Filter Interaction

- Filter buttons rendered in `<div class="portfolio-filters">` above cards grid.
- Each button has `data-filter="<category>"` and `aria-pressed` state.
- JS in `assets/app.js` `initPortfolioFilters()` handles clicks.
- Cards hidden via `.portfolio-card.hidden { display: none }`.
- "All Projects" button is active by default.
- Filter state is not persisted — each page load resets to "All".

---

## Card Design Changes (V5.3)

Each project card now includes:
- `data-category` attribute on `.portfolio-card` (used by JS filter)
- Category tag pill (`.portfolio-cat-tag`) with semantic color, top-right
- Existing status badge retained top-left

No fabricated screenshots, metrics, or external links were added.

---

## CSS Added (assets/style.css)

```
.portfolio-filters            flexbox filter button row
.portfolio-filter-btn         individual filter button (pill style)
.portfolio-filter-btn.active  active state (accent-blue fill)
.portfolio-card.hidden        hidden card state
.portfolio-cat-tag            category label pill on card
.portfolio-cat-fintech        emerald color scheme
.portfolio-cat-commerce       amber color scheme
.portfolio-cat-heritage       violet color scheme
.portfolio-cat-ai             cyan color scheme (prepared for future use)
```

---

## What Was NOT Built (Evidence Gate)

- No detail pages for new candidate projects
- No placeholder cards for new projects
- No fabricated metrics, screenshots, or descriptions
- The `ai` filter button is NOT rendered (no AI project with confirmed evidence exists)

---

## Future Expansion Path

When owner provides evidence for a new project:
1. Add project object to `data/site-content.js` with all required fields + `category`
2. Run `node scripts/build.js`
3. Project card appears automatically with correct category filter
4. Add detail page only if evidence justifies a full case study
5. Update `docs/V5_3_EVIDENCE_REGISTER.md` to reflect confirmed evidence
