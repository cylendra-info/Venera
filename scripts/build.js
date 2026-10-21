/**
 * VENERA Technology — Master Static Site Compiler (V5)
 * Compiles all bilingual pages, project deep-dives, sitemap, and robots.txt
 */

const fs = require('fs');
const path = require('path');
const siteContent = require('../data/site-content.js');

const approvedUrlFile = path.resolve(__dirname, '..', 'deployment', 'netlify', 'public-site-url.txt');
const approvedFileUrl = fs.existsSync(approvedUrlFile) ? fs.readFileSync(approvedUrlFile, 'utf8').trim() : '';
const publicSiteUrl = (process.env.VENERA_PUBLIC_SITE_URL || approvedFileUrl || '').trim();
if (publicSiteUrl) {
  let parsed;
  try {
    parsed = new URL(publicSiteUrl);
  } catch {
    throw new Error('VENERA_PUBLIC_SITE_URL must be a valid absolute HTTPS URL');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new Error('VENERA_PUBLIC_SITE_URL must be an HTTPS origin without credentials, path, query, or fragment');
  }
  siteContent.meta.canonicalDomain = parsed.origin;
}

const ROOT_DIR = path.resolve(__dirname, '..');
const EN_DIR = path.join(ROOT_DIR, 'en');
const AR_DIR = path.join(ROOT_DIR, 'ar');

function publicPath(lang, slug) {
  return slug === 'index.html' ? `/${lang}/` : `/${lang}/${slug.replace(/\.html$/, '')}`;
}

if (!fs.existsSync(EN_DIR)) fs.mkdirSync(EN_DIR, { recursive: true });
if (!fs.existsSync(AR_DIR)) fs.mkdirSync(AR_DIR, { recursive: true });

// Helper: Common HTML Head Template
function renderHead({ lang, title, description, slug, extraMeta = '' }) {
  const isAr = lang === 'ar';
  const otherLang = isAr ? 'en' : 'ar';
  const domain = (siteContent.meta.canonicalDomain || '').replace(/\/$/, '');
  const hasDomain = domain.length > 0;

  const canonicalBlock = hasDomain
    ? `\n  <!-- Canonical & Multilingual Alternate -->\n  <link rel="canonical" href="${domain}${publicPath(lang, slug)}">\n  <link rel="alternate" hreflang="${lang}" href="${domain}${publicPath(lang, slug)}">\n  <link rel="alternate" hreflang="${otherLang}" href="${domain}${publicPath(otherLang, slug)}">\n  <link rel="alternate" hreflang="x-default" href="${domain}${publicPath('en', slug)}">`
    : `\n  <!-- Canonical and hreflang omitted: no verified production domain configured -->`;

  const ogUrl = hasDomain ? `<meta property="og:url" content="${domain}${publicPath(lang, slug)}">` : '';
  const socialImage = hasDomain ? `${domain}/assets/venera-logo-transparent.png` : '../assets/venera-logo-transparent.png';

  return `<!doctype html>
<html lang="${lang}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#040914">
  <title>${title} | ${siteContent.meta.brandName}</title>
  <meta name="description" content="${description}">
  ${canonicalBlock}

  <!-- Open Graph & Twitter Cards -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title} | ${siteContent.meta.brandName}">
  <meta property="og:description" content="${description}">
  ${ogUrl}
  <meta property="og:site_name" content="${siteContent.meta.brandName}">
  <meta property="og:image" content="${socialImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} | ${siteContent.meta.brandName}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${socialImage}">

  <!-- Favicon & Brand Icons -->
  <link rel="icon" type="image/png" href="../assets/favicon.png">
  <link rel="apple-touch-icon" href="../assets/favicon.png">

  <!-- Stylesheet -->
  <link rel="stylesheet" href="../assets/style.css">
  ${extraMeta}
</head>
<body>
`;
}

// Helper: Navigation Header
function renderHeader({ lang, currentSlug }) {
  const isAr = lang === 'ar';
  const navItems = siteContent.navigation[lang];
  const otherLang = isAr ? 'en' : 'ar';
  const otherLangLabel = isAr ? 'English' : 'العربية';
  const otherLangUrl = `../${otherLang}/${currentSlug}`;
  const projectDetailSlugs = new Set(siteContent.projects[lang].map(project => project.slug));

  const isActiveItem = (item) => {
    if (item.children) return item.children.some(isActiveItem);
    const itemSlug = path.basename(item.href);
    return (itemSlug === currentSlug) ||
      (currentSlug === 'index.html' && item.id === 'home') ||
      (currentSlug === 'about.html' && item.id === 'about') ||
      (currentSlug === 'company.html' && item.id === 'about') ||
      (currentSlug === 'projects.html' && item.id === 'projects') ||
      (currentSlug === 'work.html' && item.id === 'projects') ||
      (projectDetailSlugs.has(currentSlug) && item.id === 'projects');
  };

  const primaryItems = navItems.filter(i => i.primary !== false);
  const secondaryItems = navItems.filter(i => i.primary === false);

  const renderDropdown = ({ id, label, items }) => {
    const hasActive = items.some(isActiveItem);
    const menuId = `nav-${id}-menu`;
    const itemsHtml = items.map(item => {
      const active = isActiveItem(item);
      return `<a class="nav-dropdown-item${active ? ' active' : ''}" href="${path.basename(item.href)}" role="menuitem"${active ? ' aria-current="page"' : ''}>${item.label}</a>`;
    }).join('');
    return `
    <div class="nav-more nav-group nav-group-${id}${hasActive ? ' has-active' : ''}" data-nav-group="${id}">
      <button class="nav-more-btn" aria-haspopup="true" aria-expanded="false" aria-controls="${menuId}">
        ${label} <span class="nav-more-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="nav-dropdown" id="${menuId}" role="menu">
        ${itemsHtml}
      </div>
    </div>`;
  };

  const primaryHtml = primaryItems.map(item => {
    if (item.children) return renderDropdown({ id: item.id, label: item.label, items: item.children });
    const active = isActiveItem(item);
    return `<a class="${active ? 'active' : ''}" href="${path.basename(item.href)}"${active ? ' aria-current="page"' : ''}>${item.label}</a>`;
  }).join('');

  const moreLabel = isAr ? 'المزيد' : 'More';
  const moreDropdownHtml = secondaryItems.length > 0
    ? renderDropdown({ id: 'more', label: moreLabel, items: secondaryItems })
    : '';

  return `
  <header class="topnav">
    <div class="wrap navinner">
      <a class="brand" href="index.html" aria-label="${siteContent.meta.brandName} Home">
        <img src="../assets/venera-logo-white.png" alt="${siteContent.meta.brandName}" width="210" height="52" fetchpriority="high">
      </a>
      <button class="hamb" aria-label="${isAr ? 'فتح القائمة' : 'Toggle Navigation Menu'}" aria-expanded="false">☰</button>
      <nav class="links" aria-label="${isAr ? 'القائمة الرئيسية' : 'Primary Navigation'}">
        ${primaryHtml}
        ${moreDropdownHtml}
        <a class="lang-pill" href="${otherLangUrl}" hreflang="${otherLang}" lang="${otherLang}">${otherLangLabel}</a>
      </nav>
    </div>
  </header>
  <main id="main-content">
`;
}

const featuredFooterProjectIds = Object.freeze([
  'cylendra',
  'veneraswap',
  'stylai',
  'stylai-store',
  'dilmart',
  'muhasebos',
  'max-hub',
  'deyon'
]);

// Helper: Footer
function renderFooter({ lang }) {
  const isAr = lang === 'ar';
  const f = siteContent.footer[lang];
  const m = siteContent.meta;
  const projectsById = new Map(siteContent.projects[lang].map(project => [project.id, project]));
  const featuredProjectLinks = featuredFooterProjectIds.map(id => {
    const project = projectsById.get(id);
    if (!project) throw new Error(`Footer project not found for ${lang}: ${id}`);
    return `<li><a href="${project.slug}">${project.name}</a></li>`;
  }).join('\n            ');

  return `
  </main>
  <footer class="footer">
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="../assets/venera-logo-white.png" alt="${m.brandName}" width="190" height="47">
          <p>${f.brandDesc}</p>
          <div style="margin-top: 16px;">
            <a class="inline-link" href="${m.founderLinkedIn}" target="_blank" rel="noopener noreferrer">
              ${isAr ? 'الملف المهني للمؤسس على LinkedIn' : 'Founder LinkedIn Profile'} ↗
            </a>
          </div>
        </div>
        <div class="footer-col">
          <h4>${f.colNav}</h4>
          <ul>
            <li><a href="index.html">${isAr ? 'الرئيسية' : 'Home'}</a></li>
            <li><a href="about.html">${isAr ? 'عن فينيريا' : 'About VENERA'}</a></li>
            <li><a href="expertise.html">${isAr ? 'القدرات والخبرات' : 'Expertise & Capabilities'}</a></li>
            <li><a href="projects.html">${isAr ? 'المشاريع والمحفظة' : 'Projects & Portfolio'}</a></li>
            <li><a href="founder.html">${isAr ? 'المؤسس والقيادة' : 'Founder & Leadership'}</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>${f.colProjects}</h4>
          <ul>
            ${featuredProjectLinks}
          </ul>
        </div>
        <div class="footer-col">
          <h4>${f.colResearch}</h4>
          <ul>
            <li><a href="initiatives.html">${isAr ? 'المبادرات الوطنية' : 'National Initiatives'}</a></li>
            <li><a href="insights.html">${isAr ? 'البحوث والرؤى' : 'Research & Insights'}</a></li>
            <li><a href="contact.html">${isAr ? 'التواصل المؤسسي' : 'Institutional Inquiries'}</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <div>${f.copyright}</div>
        <div class="footer-disclaimer">${f.legalDisclaimer}</div>
      </div>
    </div>
  </footer>
  <script src="../assets/app.js" defer></script>
</body>
</html>
`;
}

// --------------------------------------------------------------------------
// Page Builders
// --------------------------------------------------------------------------

// 1. Homepage
function buildHomePage(lang) {
  const isAr = lang === 'ar';
  const c = siteContent.home[lang];
  const m = siteContent.meta;

  const jsonLd = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "${m.brandName}",
    "legalName": "${m.legalName}",
    "foundingDate": "${m.establishedYear}",
    "founder": {
      "@type": "Person",
      "name": "${m.founderName}",
      "jobTitle": "${isAr ? m.founderTitle.ar : m.founderTitle.en}",
      "sameAs": ["${m.founderLinkedIn}"]
    },
    "description": "${c.hero.subtitle}"
  }
  </script>
  `;

  const head = renderHead({
    lang,
    title: isAr ? 'هندسة أنظمة الغد' : 'Engineering the Systems of Tomorrow',
    description: c.hero.subtitle,
    slug: 'index.html',
    extraMeta: jsonLd
  });

  const header = renderHeader({ lang, currentSlug: 'index.html' });

  const statsHtml = c.hero.stats.map(s => `
    <div class="stat-item">
      <strong>${s.value}</strong>
      <span>${s.label}</span>
      <small>${s.note}</small>
    </div>
  `).join('');

  const introPointsHtml = c.intro.points.map(p => `
    <div class="card">
      <h3>${p.title}</h3>
      <p>${p.desc}</p>
    </div>
  `).join('');

  const featuredIds = ['stylai', 'dilmart', 'muhasebos', 'orbitraai', 'cylendra', 'max-hub'];
  const featuredProjects = featuredIds.map(id => siteContent.projects[lang].find(p => p.id === id)).filter(Boolean);
  const projectsHtml = featuredProjects.map(p => `
    <div class="card">
      <span class="status-badge ${p.statusClass}">${p.status}</span>
      <h3>${p.name}</h3>
      <p>${p.summary}</p>
      <div class="card-footer">
        <a class="inline-link" href="${p.slug}">
          ${isAr ? 'استكشف المنصة ↗' : 'Explore Platform ↗'}
        </a>
      </div>
    </div>
  `).join('');

  const caps = siteContent.expertise[lang].areas;
  const capsHtml = caps.map(area => `
    <div class="cap-box">
      <div class="cap-num">${area.num}</div>
      <h3>${area.title}</h3>
      <p>${area.desc}</p>
    </div>
  `).join('');

  const approachHtml = c.approach.items.map(item => `
    <div class="cap-box" style="background: rgba(12, 27, 51, 0.7);">
      <div class="cap-num">${item.num}</div>
      <h3>${item.title}</h3>
      <p>${item.desc}</p>
    </div>
  `).join('');

  const body = `
    <!-- Hero Section with Canvas 3D Connected Digital Globe -->
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow">${c.hero.badge}</div>
          <h1>${c.hero.title}<br><em>${c.hero.titleHighlight}</em></h1>
          <p class="lead">${c.hero.subtitle}</p>
          <div class="actions">
            <a class="btn" href="expertise.html">${c.hero.ctaPrimary} →</a>
            <a class="btn ghost" href="projects.html">${c.hero.ctaSecondary} ↗</a>
          </div>
          <div class="stats-row">
            ${statsHtml}
          </div>
        </div>
        <div class="globe-container">
          <canvas class="globe-canvas" aria-label="${isAr ? 'نموذج ثلاثي الأبعاد تفاعلي للكرة الأرضية وشبكات الأنظمة' : 'Interactive 3D Connected Digital Globe visual'}"></canvas>
        </div>
      </div>
    </section>

    <!-- Institutional Introduction -->
    <section class="section">
      <div class="wrap">
        <div class="sect-head">
          <div class="eyebrow">${c.intro.eyebrow}</div>
          <h2>${c.intro.title}</h2>
          <p class="lead">${c.intro.lead}</p>
        </div>
        <div class="cards-grid">
          ${introPointsHtml}
        </div>
      </div>
    </section>

    <!-- Capabilities Preview -->
    <section class="section dark">
      <div class="wrap">
        <div class="sect-head split">
          <div>
            <div class="eyebrow">${c.capabilitiesPreview.eyebrow}</div>
            <h2>${c.capabilitiesPreview.title}</h2>
            <p class="lead">${c.capabilitiesPreview.lead}</p>
          </div>
          <div>
            <a class="btn ghost" href="expertise.html">${c.capabilitiesPreview.viewAll} →</a>
          </div>
        </div>
        <div class="caps-grid">
          ${capsHtml}
        </div>
      </div>
    </section>

    <!-- Selected Projects Preview -->
    <section class="section">
      <div class="wrap">
        <div class="sect-head split">
          <div>
            <div class="eyebrow">${c.projectsPreview.eyebrow}</div>
            <h2>${c.projectsPreview.title}</h2>
            <p class="lead">${c.projectsPreview.lead}</p>
          </div>
          <div>
            <a class="btn ghost" href="projects.html">${c.projectsPreview.viewAll} →</a>
          </div>
        </div>
        <div class="cards-grid">
          ${projectsHtml}
        </div>
      </div>
    </section>

    <!-- Founder Introduction -->
    <section class="section dark">
      <div class="wrap">
        <div class="founder-intro-grid">
          <div>
            <div class="eyebrow">${isAr ? 'المؤسس والقيادة' : 'FOUNDER & LEADERSHIP'}</div>
            <h2>${isAr ? 'علي حسين — مهندس أنظمة وريادي تقني' : 'Ali Hussein — Systems Architect & Technology Entrepreneur'}</h2>
            <p class="lead">${isAr ? 'مسيرة مهنية بدأت عام 2004 من مركز تقنية ميداني في العراق، تطورت عبر عقدين إلى هندسة منصات مؤسسية وأطر بنية تحتية رقمية سيادية.' : 'A professional journey that began in 2004 at a grassroots internet center in Iraq, evolving through two decades into enterprise platform engineering and sovereign digital infrastructure.'}</p>
            <a class="btn" href="founder.html" style="margin-top: 32px;">${isAr ? 'استعراض السيرة الكاملة →' : 'Explore Founder Profile →'}</a>
          </div>
          <figure class="founder-intro-portrait">
            <img src="../assets/founder-executive.webp" alt="Ali Hussein - Founder &amp; Technology Director" width="1024" height="1536">
          </figure>
        </div>
      </div>
    </section>

    <!-- Strategic Systems & Initiatives Banner -->
    <section class="section dark">
      <div class="wrap">
        <div class="sect-head">
          <div class="eyebrow">${c.initiativesPreview.eyebrow}</div>
          <h2>${c.initiativesPreview.title}</h2>
          <p class="lead">${c.initiativesPreview.lead}</p>
        </div>
        <div class="actions" style="margin-top: 24px;">
          <a class="btn" href="initiatives.html">${c.initiativesPreview.cta} ↗</a>
        </div>
      </div>
    </section>

    <!-- Engineering Approach -->
    <section class="section">
      <div class="wrap">
        <div class="sect-head">
          <div class="eyebrow">${c.approach.eyebrow}</div>
          <h2>${c.approach.title}</h2>
          <p class="lead">${c.approach.lead}</p>
        </div>
        <div class="caps-grid">
          ${approachHtml}
        </div>
      </div>
    </section>

    <!-- Strategic Partnerships -->
    <section class="section dark" id="partnerships">
      <div class="wrap">
        <div class="sect-head">
          <div class="eyebrow">${c.partnerships.eyebrow}</div>
          <h2>${c.partnerships.title}</h2>
          <p class="lead">${c.partnerships.lead}</p>
        </div>
        <div class="caps-grid" style="margin-top: 40px;">
          ${c.partnerships.models.map(m => `
            <div class="cap-item">
              <div class="cap-title">${m.title}</div>
              <p>${m.desc}</p>
            </div>
          `).join('')}
        </div>
        <div style="margin-top: 40px; text-align: center;">
          <a class="btn" href="contact.html">${c.partnerships.cta} →</a>
          <p style="margin-top: 16px; font-size: 0.875rem; color: var(--text-muted);">${c.partnerships.note}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section soft">
      <div class="wrap" style="text-align: center; max-width: 800px; margin: 0 auto;">
        <div class="eyebrow">${isAr ? 'ابدأ المحادثة' : 'START THE CONVERSATION'}</div>
        <h2 style="color: var(--text-soft-main);">${c.ctaBanner.title}</h2>
        <p class="lead" style="color: var(--text-soft-muted); margin: 16px auto 32px;">${c.ctaBanner.desc}</p>
        <a class="btn" href="contact.html">${c.ctaBanner.btn} →</a>
      </div>
    </section>
  `;

  return head + header + body + renderFooter({ lang });
}

// 2. About Page
function buildAboutPage(lang) {
  const isAr = lang === 'ar';
  const c = siteContent.about[lang];

  const head = renderHead({
    lang,
    title: isAr ? 'عن الشركة والهوية المؤسسية' : 'About VENERA Technology & Corporate Governance',
    description: c.hero.lead,
    slug: 'about.html'
  });

  const header = renderHeader({ lang, currentSlug: 'about.html' });

  const bodyHtml = c.identity.body.map(p => `<p class="lead" style="margin-bottom: 16px;">${p}</p>`).join('');
  const detailsHtml = c.identity.details.map(d => `
    <div class="cap-box" style="padding: 16px;">
      <div style="font-size: 0.75rem; color: var(--accent-cyan); text-transform: uppercase;">${d.label}</div>
      <strong style="color: #ffffff; font-size: 1rem; display: block; margin-top: 4px;">${d.val}</strong>
    </div>
  `).join('');

  const principlesHtml = c.principles.map(p => `
    <div class="card">
      <h3>${p.title}</h3>
      <p>${p.desc}</p>
    </div>
  `).join('');

  const body = `
    <section class="page-hero">
      <div class="wrap">
        <div class="eyebrow">${c.hero.eyebrow}</div>
        <h1>${c.hero.title}</h1>
        <p>${c.hero.lead}</p>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="sect-head">
          <div class="eyebrow">${c.identity.eyebrow}</div>
          <h2>${c.identity.title}</h2>
        </div>
        <div style="max-width: 900px; margin-bottom: 40px;">
          ${bodyHtml}
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
          ${detailsHtml}
        </div>
      </div>
    </section>

    <section class="section dark">
      <div class="wrap">
        <div class="mission-vision-grid">
          <div class="cap-box" style="padding: 36px;">
            <div class="eyebrow">${isAr ? 'الرسالة' : 'MISSION'}</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 16px;">${c.missionVision.mission.title}</h3>
            <p style="font-size: 1rem; line-height: 1.8;">${c.missionVision.mission.text}</p>
          </div>
          <div class="cap-box" style="padding: 36px;">
            <div class="eyebrow">${isAr ? 'الرؤية' : 'VISION'}</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 16px;">${c.missionVision.vision.title}</h3>
            <p style="font-size: 1rem; line-height: 1.8;">${c.missionVision.vision.text}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="sect-head">
          <div class="eyebrow">${isAr ? 'المبادئ الحاكمة' : 'OPERATING PRINCIPLES'}</div>
          <h2>${isAr ? 'مبادئ التميز المؤسسي' : 'Institutional Operating Principles'}</h2>
        </div>
        <div class="cards-grid">
          ${principlesHtml}
        </div>
      </div>
    </section>
  `;

  return head + header + body + renderFooter({ lang });
}

// 3. Expertise Page
function buildExpertisePage(lang) {
  const isAr = lang === 'ar';
  const c = siteContent.expertise[lang];

  const head = renderHead({
    lang,
    title: isAr ? 'القدرات والخبرات الهندسية' : 'Engineering Capabilities & Technical Disciplines',
    description: c.hero.lead,
    slug: 'expertise.html'
  });

  const header = renderHeader({ lang, currentSlug: 'expertise.html' });

  const areasHtml = c.areas.map(area => {
    const listHtml = area.capabilities.map(cap => `<li>${cap}</li>`).join('');
    return `
      <div class="card" style="padding: 40px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span class="cap-num" style="margin: 0;">${area.num}</span>
          <span class="status-badge status-dev">${area.tag}</span>
        </div>
        <h3>${area.title}</h3>
        <p style="margin-bottom: 24px;">${area.desc}</p>
        <ul class="detail-caps-list">
          ${listHtml}
        </ul>
      </div>
    `;
  }).join('');

  const stackHtml = c.techStack.categories.map(cat => `
    <div class="cap-box">
      <div class="eyebrow" style="margin-bottom: 8px;">${cat.name}</div>
      <strong style="color: #ffffff; font-size: 0.95rem; display: block; line-height: 1.6;">${cat.stack}</strong>
    </div>
  `).join('');

  const body = `
    <section class="page-hero">
      <div class="wrap">
        <div class="eyebrow">${c.hero.eyebrow}</div>
        <h1>${c.hero.title}</h1>
        <p>${c.hero.lead}</p>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="expertise-grid">
          ${areasHtml}
        </div>
      </div>
    </section>

    <section class="section dark">
      <div class="wrap">
        <div class="sect-head">
          <div class="eyebrow">${isAr ? 'المكدس البرمجي' : 'TECHNOLOGY STACK'}</div>
          <h2>${c.techStack.title}</h2>
          <p class="lead">${c.techStack.lead}</p>
        </div>
        <div class="caps-grid">
          ${stackHtml}
        </div>
      </div>
    </section>
  `;

  return head + header + body + renderFooter({ lang });
}

// 4. Projects Portfolio Catalog Page
// V5.7.1 — explicit portfolio display order (applied to EN + AR identically)
const PROJECT_ORDER = [
  'stylai', 'dilmart', 'stylai-store', 'muhasebos', 'orbitraai',
  'max-hub', 'deyon', 'cylendra', 'veneraswap', 'paynxs',
  'ordernxs', 'roic', 'nuxese'
];
function orderProjects(list) {
  const rank = id => { const i = PROJECT_ORDER.indexOf(id); return i === -1 ? 999 : i; };
  return [...list].sort((a, b) => rank(a.id) - rank(b.id));
}

function buildProjectsPage(lang) {
  const isAr = lang === 'ar';
  const projects = orderProjects(siteContent.projects[lang]);

  const head = renderHead({
    lang,
    title: isAr ? 'مشاريعنا ومنصاتنا' : 'Ventures & Platforms',
    description: isAr ? 'مشاريع VENERA Technology التقنية: منصات نشطة ومنتجات مطوّرة وتقنيات ذكية' : 'VENERA Technology ventures and platforms: active products, developed systems, and intelligent technologies.',
    slug: 'projects.html'
  });

  const header = renderHeader({ lang, currentSlug: 'projects.html' });

  const categoryMeta = {
    all:      { en: 'All Ventures',                              ar: 'جميع المشاريع' },
    trading:  { en: 'Trading & Wealth Technologies',             ar: 'تقنيات التداول والثروة' },
    commerce: { en: 'Ventures & Consumer Platforms',             ar: 'المشاريع ومنصات المستهلك' },
    bizops:   { en: 'Business Technologies',                     ar: 'تقنيات الأعمال' },
    heritage: { en: 'Engineering Heritage',                      ar: 'الإرث الهندسي' }
  };

  const filterTabs = ['all', 'trading', 'commerce', 'bizops', 'heritage'].map(cat => `
    <button class="portfolio-filter-btn${cat === 'all' ? ' active' : ''}" data-filter="${cat}" aria-pressed="${cat === 'all'}">
      ${categoryMeta[cat][lang]}
    </button>
  `).join('');

  const cardsHtml = projects.map(p => {
    const media = siteContent.projectMedia[p.id] || { type: 'logo', mono: p.name.trim().charAt(0) };
    const catTag = categoryMeta[p.category] ? categoryMeta[p.category][lang] : '';
    let cover;
    if (media.type === 'logo') {
      cover = `<div class="pf-cover pf-cover-logo">
          <span class="pf-cover-status status-badge ${p.statusClass}">${p.status}</span>
          <span class="pf-mono" aria-hidden="true">${media.mono}</span>
        </div>`;
    } else {
      cover = `<div class="pf-cover">
          <span class="pf-cover-status status-badge ${p.statusClass}">${p.status}</span>
          <img src="../assets/${media.cover}" alt="${p.name} ${isAr ? 'واجهة المنتج' : 'product interface'}" loading="lazy" decoding="async">
        </div>`;
    }
    return `
    <div class="card portfolio-card pf-card" data-category="${p.category || 'heritage'}">
      ${cover}
      <div class="pf-card-body">
        <div class="pf-card-top">
          <h3>${p.name}</h3>
          <span class="portfolio-cat-tag portfolio-cat-${p.category || 'heritage'}">${catTag}</span>
        </div>
        <div class="pf-card-tag">${p.tagline}</div>
        <p>${p.summary}</p>
        <div class="card-footer">
          <a class="inline-link" href="${p.slug}">${isAr ? 'عرض المشروع ↗' : 'View project ↗'}</a>
        </div>
      </div>
    </div>`;
  }).join('');

  const body = `
    <section class="page-hero">
      <div class="wrap">
        <div class="eyebrow">${isAr ? 'مشاريعنا ومنصاتنا' : 'OUR VENTURES & PLATFORMS'}</div>
        <h1>${isAr ? 'المشاريع والمنصات' : 'Ventures & Platforms'}</h1>
        <p>${isAr ? 'محفظة متنوعة من المشاريع الرقمية والمنصات الذكية والحلول التقنية في التجارة الإلكترونية وإدارة الأعمال والتقنيات المالية والابتكار.' : 'A portfolio of digital ventures, intelligent platforms, and technology solutions spanning commerce, business operations, financial technology, and emerging markets.'}</p>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="portfolio-filters" role="group" aria-label="${isAr ? 'تصفية المشاريع حسب الفئة' : 'Filter projects by category'}">
          ${filterTabs}
        </div>
        <div class="cards-grid" id="portfolio-grid">
          ${cardsHtml}
        </div>
      </div>
    </section>
  `;

  return head + header + body + renderFooter({ lang });
}

// 5. Individual Project Case Study
function buildProjectDetailPage(lang, project) {
  const isAr = lang === 'ar';

  const head = renderHead({
    lang,
    title: `${project.name} | ${project.tagline}`,
    description: project.summary,
    slug: project.slug
  });

  const header = renderHeader({ lang, currentSlug: project.slug });

  const capabilitiesHtml = project.capabilities.map(cap => `<li>${cap}</li>`).join('');

  const projectId = project.slug.replace('.html', '');

  // V5.7 — genuine product visual block (gallery / single / logo). Only
  // rendered when media exists; never a fabricated or empty placeholder.
  const media = siteContent.projectMedia[projectId];
  let visualHtml = '';
  if (media && media.type === 'gallery') {
    const slides = media.gallery.map((g, i) => `
            <figure class="pf-slide${i === 0 ? ' active' : ''}" data-cap="${g.cap[lang]}">
              <img src="../assets/${g.img}" alt="${project.name} — ${g.cap[lang]}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async">
            </figure>`).join('');
    const dots = media.gallery.map((g, i) => `<button class="pf-dot${i === 0 ? ' active' : ''}" type="button" role="tab" aria-selected="${i === 0 ? 'true' : 'false'}" aria-label="${(isAr ? 'صورة ' : 'Image ') + (i + 1)}"></button>`).join('');
    const prevGlyph = isAr ? '&#8250;' : '&#8249;';
    const nextGlyph = isAr ? '&#8249;' : '&#8250;';
    visualHtml = `
    <section class="pf-visual-section">
      <div class="wrap">
        <div class="pf-gallery" role="group" aria-roledescription="carousel" aria-label="${project.name}" tabindex="0">
          <div class="pf-stage">
            ${slides}
            <button class="pf-gbtn pf-prev" type="button" aria-label="${isAr ? 'الصورة السابقة' : 'Previous image'}">${prevGlyph}</button>
            <button class="pf-gbtn pf-next" type="button" aria-label="${isAr ? 'الصورة التالية' : 'Next image'}">${nextGlyph}</button>
          </div>
          <div class="pf-foot">
            <span class="pf-cap" aria-live="polite">${media.gallery[0].cap[lang]}</span>
            <div class="pf-dots" role="tablist" aria-label="${isAr ? 'اختر الصورة' : 'Choose image'}">${dots}</div>
            <span class="pf-counter" aria-hidden="true"><span class="current">1</span> / ${media.gallery.length}</span>
          </div>
        </div>
      </div>
    </section>`;
  } else if (media && media.type === 'single') {
    visualHtml = `
    <section class="pf-visual-section">
      <div class="wrap">
        <figure class="pf-single">
          <div class="pf-single-frame"><img src="../assets/${media.cover}" alt="${project.name} — ${media.cap[lang]}" loading="eager" decoding="async"></div>
          <figcaption class="pf-single-cap">${media.cap[lang]}</figcaption>
        </figure>
      </div>
    </section>`;
  } else if (media && media.type === 'logo') {
    visualHtml = `
    <section class="pf-visual-section">
      <div class="wrap">
        <div class="pf-logo-panel">
          <span class="pf-logo-mono" aria-hidden="true">${media.mono}</span>
          <span class="pf-logo-name">${project.name}</span>
        </div>
      </div>
    </section>`;
  }

  const body = `
    <section class="page-hero" data-project="${projectId}">
      <div class="wrap">
        <div style="margin-bottom: 12px;">
          <a class="inline-link" href="projects.html" style="font-size: 0.8125rem;">
            ${isAr ? '← العودة لكافة المشاريع' : '← Back to Projects Portfolio'}
          </a>
        </div>
        <span class="status-badge ${project.statusClass}" style="margin-bottom: 14px;">${project.status}</span>
        <h1>${project.name}</h1>
        <p>${project.tagline}</p>
      </div>
    </section>
    ${visualHtml}

    <section class="section">
      <div class="wrap detail-grid">
        <div class="detail-body">
          <div class="eyebrow">${isAr ? 'نظرة عامة' : 'OVERVIEW'}</div>
          <p>${project.overview}</p>

          <div class="eyebrow" style="margin-top: 36px;">${isAr ? 'القيمة والأثر' : 'BUSINESS VALUE'}</div>
          <p>${project.solutionConcept}</p>

          <div class="eyebrow" style="margin-top: 36px;">${isAr ? 'قدرات مختارة' : 'SELECTED CAPABILITIES'}</div>
          <ul class="detail-caps-list">
            ${capabilitiesHtml}
          </ul>

          <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--line-dark);">
            <a class="btn" href="projects.html">${isAr ? '← استعراض مشاريع أخرى' : '← Explore More Projects'}</a>
            ${project.externalUrl ? `<a class="btn ghost" href="${project.externalUrl}" target="_blank" rel="noopener noreferrer" style="margin-inline-start: 12px;">${isAr ? 'زيارة الرابط الرسمي ↗' : 'Visit Official Site ↗'}</a>` : ''}
          </div>
        </div>

        <aside class="sidebar-box">
          <h3>${isAr ? 'عن المشروع' : 'About This Project'}</h3>

          <div class="sidebar-item">
            <strong>${isAr ? 'الحالة' : 'Status'}</strong>
            <span><span class="status-badge ${project.statusClass}">${project.status}</span></span>
          </div>

          <div class="sidebar-item">
            <strong>${isAr ? 'الدور' : 'Role'}</strong>
            <span>${project.role}</span>
          </div>

          ${project.externalUrl ? `
          <div class="sidebar-item" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--line-dark);">
            <strong>${isAr ? 'الرابط الرسمي' : 'Official Link'}</strong>
            <a class="inline-link" href="${project.externalUrl}" target="_blank" rel="noopener noreferrer">${project.externalUrl} ↗</a>
          </div>
          ` : ''}
        </aside>
      </div>
    </section>
  `;

  return head + header + body + renderFooter({ lang });
}

// 6. Strategic National Initiatives Page
function buildInitiativesPage(lang) {
  const isAr = lang === 'ar';
  const c = siteContent.initiatives[lang];

  const head = renderHead({
    lang,
    title: isAr ? 'المبادرات الرقمية والأطر الاستراتيجية' : 'Strategic National Infrastructure Frameworks',
    description: c.hero.lead,
    slug: 'initiatives.html'
  });

  const header = renderHeader({ lang, currentSlug: 'initiatives.html' });

  const itemsHtml = c.items.map(item => {
    const detailsList = item.details.map(d => `<li>${d}</li>`).join('');
    return `
      <div class="card" style="padding: 36px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <span class="status-badge status-dev">${item.tag}</span>
          <span class="init-type">${item.type}</span>
        </div>
        <h3 style="font-size: 1.5rem; margin-bottom: 12px;">${item.name}</h3>
        <p style="font-size: 1rem; line-height: 1.75; margin-bottom: 20px;">${item.summary}</p>
        <div class="eyebrow" style="font-size: 0.6875rem;">${isAr ? 'محاور التصميم المعماري' : 'ARCHITECTURAL PILLARS'}</div>
        <ul class="detail-caps-list">
          ${detailsList}
        </ul>
      </div>
    `;
  }).join('');

  const body = `
    <section class="page-hero">
      <div class="wrap">
        <div class="eyebrow">${c.hero.eyebrow}</div>
        <h1>${c.hero.title}</h1>
        <p>${c.hero.lead}</p>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="notice-box" style="margin-top: 0; margin-bottom: 40px;">
          <strong>${isAr ? 'تنويه حوكمة صارم:' : 'Institutional Governance Notice:'}</strong> ${c.disclaimer}
        </div>
        <div>
          ${itemsHtml}
        </div>
      </div>
    </section>
  `;

  return head + header + body + renderFooter({ lang });
}

// 7. Founder Page (High Priority Visual Composition)
function buildFounderPage(lang) {
  const isAr = lang === 'ar';
  const c = siteContent.founder[lang];
  const m = siteContent.meta;

  const jsonLd = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "${m.founderName}",
    "jobTitle": "${isAr ? m.founderTitle.ar : m.founderTitle.en}",
    "worksFor": {
      "@type": "Organization",
      "name": "${m.legalName}"
    },
    "sameAs": ["${m.founderLinkedIn}"],
    "description": "${c.hero.subtitle}"
  }
  </script>
  `;

  const head = renderHead({
    lang,
    title: `${c.hero.name} | ${c.hero.title}`,
    description: c.hero.subtitle,
    slug: 'founder.html',
    extraMeta: jsonLd
  });

  const header = renderHeader({ lang, currentSlug: 'founder.html' });

  const bioParagraphs = c.biography.paragraphs.map(p => `<p class="lead" style="margin-bottom: 20px;">${p}</p>`).join('');
  const storyParagraphs = c.story.paragraphs.map(p => `<p style="color: #334155; font-size: 1.0625rem; line-height: 1.9; margin-bottom: 22px;">${p}</p>`).join('');

  const timelineHtml = c.timeline.map(t => `
    <div class="milestone">
      <div class="milestone-period">${t.period}</div>
      <h3>${t.title}</h3>
      <p>${t.desc}</p>
    </div>
  `).join('');

  const disciplinesHtml = c.disciplines.map(d => `
    <div class="cap-box">
      <div class="eyebrow" style="margin-bottom: 6px;">${d.label}</div>
      <strong style="color: #ffffff; font-size: 0.9375rem; display: block; line-height: 1.6;">${d.val}</strong>
    </div>
  `).join('');

  const body = `
    <!-- Executive Leadership Hero: Dark Navy + Network Grid + Formal Portrait -->
    <section class="founder-hero-section">
      <div class="wrap founder-hero-grid">
        <div>
          <div class="eyebrow">${c.hero.eyebrow}</div>
          <h1 style="font-size: clamp(2.75rem, 5vw, 4.25rem); margin-bottom: 12px;">${c.hero.name}</h1>
          <div style="font-size: 1.25rem; color: var(--accent-cyan); font-weight: 600; margin-bottom: 20px;">${c.hero.title}</div>
          <p class="lead" style="max-width: 620px;">${c.hero.subtitle}</p>
          
          <div class="quote-card">
            <blockquote>"${c.hero.quote}"</blockquote>
          </div>

          <div class="actions">
            <a class="btn" href="${c.hero.linkedIn}" target="_blank" rel="noopener noreferrer">
              ${isAr ? 'الملف المهني على LinkedIn ↗' : 'Connect on LinkedIn ↗'}
            </a>
            <a class="btn ghost" href="#career-timeline">
              ${isAr ? 'استعراض المحطات المهنية ↓' : 'View Career Timeline ↓'}
            </a>
          </div>
        </div>

        <div class="founder-visual-col">
          <div class="founder-cinematic-wrap">
            <!-- Digital globe network — decorative, aria-hidden -->
            <svg class="founder-globe-svg" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <!-- Globe outline -->
              <circle cx="210" cy="210" r="175" stroke="rgba(56,189,248,0.13)" stroke-width="1"/>
              <!-- Equator -->
              <ellipse cx="210" cy="210" rx="175" ry="52" stroke="rgba(56,189,248,0.10)" stroke-width="0.8"/>
              <!-- Upper latitude -->
              <ellipse cx="210" cy="150" rx="138" ry="40" stroke="rgba(56,189,248,0.08)" stroke-width="0.8"/>
              <!-- Lower latitude -->
              <ellipse cx="210" cy="270" rx="138" ry="40" stroke="rgba(56,189,248,0.07)" stroke-width="0.8"/>
              <!-- Primary meridian -->
              <ellipse cx="210" cy="210" rx="52" ry="175" stroke="rgba(56,189,248,0.08)" stroke-width="0.8"/>
              <!-- Secondary meridian -->
              <ellipse cx="210" cy="210" rx="130" ry="175" stroke="rgba(37,99,235,0.06)" stroke-width="0.8"/>
              <!-- Network nodes -->
              <circle cx="210" cy="35" r="3.5" fill="rgba(56,189,248,0.55)"/>
              <circle cx="210" cy="385" r="2.5" fill="rgba(56,189,248,0.35)"/>
              <circle cx="383" cy="150" r="3" fill="rgba(37,99,235,0.6)"/>
              <circle cx="37" cy="270" r="2.5" fill="rgba(56,189,248,0.35)"/>
              <circle cx="385" cy="210" r="3.5" fill="rgba(56,189,248,0.5)"/>
              <circle cx="35" cy="210" r="2" fill="rgba(56,189,248,0.25)"/>
              <circle cx="330" cy="110" r="2" fill="rgba(56,189,248,0.4)"/>
              <!-- Network connection lines -->
              <line x1="210" y1="35" x2="383" y2="150" stroke="rgba(56,189,248,0.14)" stroke-width="0.8" stroke-dasharray="4,5"/>
              <line x1="383" y1="150" x2="385" y2="210" stroke="rgba(37,99,235,0.10)" stroke-width="0.8" stroke-dasharray="3,6"/>
              <line x1="210" y1="35" x2="330" y2="110" stroke="rgba(56,189,248,0.10)" stroke-width="0.8" stroke-dasharray="3,5"/>
              <!-- Subtle glow dot at top pole -->
              <circle cx="210" cy="35" r="7" fill="rgba(56,189,248,0.08)"/>
              <circle cx="385" cy="210" r="8" fill="rgba(37,99,235,0.07)"/>
            </svg>
            <!-- Transparent founder image — blends with dark navy via screen mode -->
            <img class="founder-transparent-img" src="../assets/founder-Ali.png" alt="${c.hero.name}" fetchpriority="high">
          </div>
        </div>
      </div>
    </section>

    <!-- Biography & Institutional Background -->
    <section class="section">
      <div class="wrap">
        <div class="sect-head">
          <div class="eyebrow">${c.biography.eyebrow}</div>
          <h2>${c.biography.title}</h2>
        </div>
        <div style="max-width: 920px;">
          ${bioParagraphs}
        </div>
      </div>
    </section>

    <!-- Structured Career Timeline (Accurate 6 Stages) -->
    <section class="section dark" id="career-timeline">
      <div class="wrap">
        <div class="sect-head">
          <div class="eyebrow">${isAr ? 'المسار الزمني الموثق' : 'VERIFIED CAREER MILESTONES'}</div>
          <h2>${isAr ? 'محطات المسيرة المهنية (2004 – 2026)' : 'Professional Evolution (2004 – 2026)'}</h2>
          <p class="lead">${isAr ? 'تسلسل زمني يوثق الانتقال المنظومي من البدايات الميدانية لخدمات الإنترنت إلى ريادة الأعمال التقنية وبناء الأنظمة المؤسسية.' : 'Documenting the disciplined evolution from grassroots internet enablement to enterprise technology leadership and sovereign systems.'}</p>
        </div>
        <div class="timeline">
          ${timelineHtml}
        </div>
      </div>
    </section>

    <!-- Storytelling Section with Cinematic Portrait -->
    <section class="section soft">
      <div class="wrap story-split">
        <figure class="story-portrait">
          <img src="../assets/founder-story.webp" alt="${c.hero.name}" width="1024" height="1536">
        </figure>

        <div>
          <div class="eyebrow" style="color: var(--accent-blue);">${c.story.eyebrow}</div>
          <h2 style="color: var(--text-soft-main); margin-bottom: 24px;">${c.story.title}</h2>
          <div>
            ${storyParagraphs}
          </div>
        </div>
      </div>
    </section>

    <!-- Core Engineering Disciplines -->
    <section class="section">
      <div class="wrap">
        <div class="sect-head">
          <div class="eyebrow">${isAr ? 'مجالات الخبرة المتخصصة' : 'CORE DISCIPLINES'}</div>
          <h2>${isAr ? 'تخصصات القيادة المعمارية' : 'Architectural & Strategic Focus'}</h2>
        </div>
        <div class="caps-grid">
          ${disciplinesHtml}
        </div>
      </div>
    </section>
  `;

  return head + header + body + renderFooter({ lang });
}

// 8. Research & Insights Page (New in V5!)
function buildInsightsPage(lang) {
  const isAr = lang === 'ar';
  const c = siteContent.insights[lang];

  const head = renderHead({
    lang,
    title: isAr ? 'البحوث والرؤى الهندسية' : 'Research, Perspectives & Thought Leadership',
    description: c.hero.lead,
    slug: 'insights.html'
  });

  const header = renderHeader({ lang, currentSlug: 'insights.html' });

  const articlesHtml = c.articles.map(article => {
    return `
      <article class="insight-card">
        <div class="insight-meta">
          <span class="insight-category">${article.category}</span>
          <span>•</span>
          <span>${article.date}</span>
          <span>•</span>
          <span>${article.readTime}</span>
        </div>
        <h3>${article.title}</h3>
        <p>${article.summary}</p>
        <div style="margin-top: auto;">
          <button class="btn ghost read-insight-btn" data-article-id="${article.id}" style="width: auto; padding: 8px 18px; font-size: 0.8125rem;">
            ${isAr ? 'قراءة التحليل المعماري الكامل ↗' : 'Read Full Architectural Briefing ↗'}
          </button>
        </div>

        <!-- Hidden full content for reader modal -->
        <div id="article-full-${article.id}" style="display: none;">
          <div style="margin-bottom: 20px;">
            <span class="status-badge status-dev">${article.category}</span>
            <span style="font-size: 0.8125rem; color: var(--text-dim); margin-inline-start: 12px;">${article.date} · ${article.readTime}</span>
          </div>
          <h2 style="font-size: 1.85rem; color: #ffffff; line-height: 1.3; margin-bottom: 16px;">${article.title}</h2>
          <div style="font-size: 0.875rem; color: var(--accent-cyan); font-weight: 600; margin-bottom: 28px;">${article.author}</div>
          <div style="color: var(--text-light); font-size: 1.0625rem; line-height: 1.85;">
            ${article.content.map(p => `<p style="margin-bottom: 20px;">${p}</p>`).join('')}
          </div>
        </div>
      </article>
    `;
  }).join('');

  const body = `
    <section class="page-hero">
      <div class="wrap">
        <div class="eyebrow">${c.hero.eyebrow}</div>
        <h1>${c.hero.title}</h1>
        <p>${c.hero.lead}</p>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="insights-grid">
          ${articlesHtml}
        </div>
      </div>
    </section>
  `;

  return head + header + body + renderFooter({ lang });
}

// 9. Contact Page
function buildContactPage(lang) {
  const isAr = lang === 'ar';
  const c = siteContent.contact[lang];

  const head = renderHead({
    lang,
    title: isAr ? 'التواصل المؤسسي وبوابة الاستفسارات' : 'Institutional Contact & Technical Inquiries',
    description: c.hero.lead,
    slug: 'contact.html',
    extraMeta: '<link rel="stylesheet" href="../assets/contact-form.css">'
  });

  const header = renderHeader({ lang, currentSlug: 'contact.html' });

  const channelsHtml = c.channels.map(ch => `
    <div class="channel-card">
      <h3>${ch.title}</h3>
      <p>${ch.desc}</p>
      <a class="inline-link" href="${ch.linkUrl}" ${ch.linkUrl.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${ch.linkText}</a>
    </div>
  `).join('');

  const categoryOptions = c.form.categories.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
  const formMessages = Object.entries(c.form.status)
    .map(([key, value]) => `data-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}-message="${value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`)
    .join(' ');
  const validationAttr = (name, value) => value ? ` data-${name}="${value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"` : '';
  const formAction = `/${lang}/contact`;

  const body = `
    <section class="page-hero">
      <div class="wrap">
        <div class="eyebrow">${c.hero.eyebrow}</div>
        <h1>${c.hero.title}</h1>
        <p>${c.hero.lead}</p>
      </div>
    </section>

    <section class="section">
      <div class="wrap contact-grid">
        <div class="contact-channels">
          <div class="eyebrow">${isAr ? 'قنوات التواصل المؤسسية' : 'INSTITUTIONAL CHANNELS'}</div>
          ${channelsHtml}
        </div>

        <div class="contact-form-box" id="inquiry-form">
          <div class="eyebrow">${isAr ? 'بوابة التوجيه التقني' : 'SYSTEMS ENGAGEMENT'}</div>
          <h2 style="font-size: 1.75rem; color: #ffffff; margin-bottom: 8px;">${c.form.title}</h2>
          <p style="color: var(--text-muted); font-size: 0.9375rem; margin-bottom: 28px;">${c.form.subtitle}</p>

          <form id="institutional-contact-form" name="venera-institutional-inquiry" method="POST" action="${formAction}" data-netlify="true" netlify-honeypot="bot-field" ${formMessages} novalidate>
            <input type="hidden" name="form-name" value="venera-institutional-inquiry">
            <p class="form-honeypot" aria-hidden="true">
              <label>${c.form.fields.honeypot}<input name="bot-field" type="text" tabindex="-1" autocomplete="off"></label>
            </p>

            <div class="form-group">
              <label for="contact-name">${c.form.fields.name} *</label>
              <input type="text" id="contact-name" name="full_name" class="form-control" required minlength="2" maxlength="120" autocomplete="name" aria-describedby="contact-name-error"${validationAttr('required-message', c.form.validation.fullNameRequired)}${validationAttr('too-short-message', c.form.validation.fullNameTooShort)} placeholder="${isAr ? 'مثال: د. أحمد المنصور' : 'e.g. Dr. Alexander Vance'}">
              <p class="form-field-error" id="contact-name-error"></p>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="contact-org">${c.form.fields.org} *</label>
                <input type="text" id="contact-org" name="organization" class="form-control" required minlength="2" maxlength="160" autocomplete="organization" aria-describedby="contact-org-error"${validationAttr('required-message', c.form.validation.organizationRequired)}${validationAttr('too-short-message', c.form.validation.organizationTooShort)} placeholder="${isAr ? 'المؤسسة أو الشركة' : 'Enterprise / Agency'}">
                <p class="form-field-error" id="contact-org-error"></p>
              </div>
              <div class="form-group">
                <label for="contact-role">${c.form.fields.role}</label>
                <input type="text" id="contact-role" name="job_title" class="form-control" maxlength="120" autocomplete="organization-title" placeholder="${isAr ? 'المسمى الوظيفي' : 'Director / Architect'}">
              </div>
            </div>

            <div class="form-group">
              <label for="contact-email">${c.form.fields.email} *</label>
              <input type="email" id="contact-email" name="email" class="form-control" required maxlength="254" autocomplete="email" inputmode="email" aria-describedby="contact-email-error"${validationAttr('required-message', c.form.validation.emailRequired)}${validationAttr('invalid-message', c.form.validation.emailInvalid)} placeholder="contact@institution.org">
              <p class="form-field-error" id="contact-email-error"></p>
            </div>

            <div class="form-group">
              <label for="contact-category">${c.form.fields.category} *</label>
              <select id="contact-category" name="category" class="form-control" required aria-describedby="contact-category-error"${validationAttr('required-message', c.form.validation.categoryRequired)}>
                <option value="" selected disabled>${c.form.fields.selectCategory}</option>
                ${categoryOptions}
              </select>
              <p class="form-field-error" id="contact-category-error"></p>
            </div>

            <div class="form-group">
              <label for="contact-message">${c.form.fields.message} *</label>
              <textarea id="contact-message" name="message" class="form-control" required minlength="20" maxlength="4000" aria-describedby="contact-message-hint contact-message-error"${validationAttr('required-message', c.form.validation.messageRequired)}${validationAttr('too-short-message', c.form.validation.messageTooShort)} placeholder="${isAr ? 'يرجى تقديم وصف موجز لنطاق التعاون أو الاستفسار...' : 'Provide brief context regarding your inquiry or proposed collaboration...'}"></textarea>
              <p class="form-field-hint" id="contact-message-hint">${c.form.validation.messageHint}</p>
              <p class="form-field-error" id="contact-message-error"></p>
            </div>

            <div class="form-consent">
              <input type="checkbox" id="contact-consent" name="privacy_consent" value="consented" required aria-describedby="contact-consent-error"${validationAttr('required-message', c.form.validation.consentRequired)}>
              <label for="contact-consent">${c.form.fields.consent} *</label>
            </div>
            <p class="form-field-error form-consent-error" id="contact-consent-error"></p>

            <p class="form-privacy-notice">${c.form.fields.privacyNote}</p>
            <p class="form-sensitive-warning"><strong>${isAr ? 'تنبيه:' : 'Important:'}</strong> ${c.form.fields.sensitiveWarning}</p>

            <button type="submit" class="btn" style="width: 100%; margin-top: 8px;">
              ${c.form.fields.submit} →
            </button>

            <div id="form-feedback" class="form-feedback" role="status" aria-live="polite" tabindex="-1"></div>
          </form>
        </div>
      </div>
    </section>
  `;

  return head + header + body + renderFooter({ lang });
}

// --------------------------------------------------------------------------
// Sitemap & Robots
// --------------------------------------------------------------------------
function buildSitemap() {
  const baseUrl = (siteContent.meta.canonicalDomain || '').replace(/\/$/, '');
  const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
  if (!baseUrl) {
    // Deterministic: no domain = no sitemap.xml on disk (remove stale file if present)
    if (fs.existsSync(sitemapPath)) {
      fs.unlinkSync(sitemapPath);
      console.log('⚠ sitemap.xml removed: canonicalDomain not configured');
    } else {
      console.log('⚠ sitemap.xml absent: canonicalDomain not configured');
    }
    return;
  }
  const slugs = [
    'index.html', 'about.html', 'founder.html', 'expertise.html',
    'projects.html', 'ai-ventures.html', 'partnerships.html', 'initiatives.html',
    'team.html', 'insights.html', 'contact.html', 'cylendra.html',
    'veneraswap.html', 'stylai.html', 'stylai-store.html', 'dilmart.html',
    'muhasebos.html', 'max-hub.html', 'deyon.html', 'paynxs.html',
    'ordernxs.html', 'roic.html', 'nuxese.html', 'orbitraai.html'
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  slugs.forEach(slug => {
    const priority = slug === 'index.html' ? '1.0' : slug === 'founder.html' ? '0.9' : '0.8';
    xml += `  <url>\n    <loc>${baseUrl}${publicPath('en', slug)}</loc>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${publicPath('en', slug)}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}${publicPath('ar', slug)}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${publicPath('en', slug)}"/>\n`;
    xml += `    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}${publicPath('ar', slug)}</loc>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}${publicPath('ar', slug)}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${publicPath('en', slug)}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${publicPath('en', slug)}"/>\n`;
    xml += `    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
  });

  xml += '</urlset>\n';
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log('✓ sitemap.xml generated');
}

// 11. AI Ventures & Emerging Technologies Page
function buildAIVenturesPage(lang) {
  const isAr = lang === 'ar';
  const p = siteContent.aiPage[lang];

  const head = renderHead({
    lang,
    title: p.title,
    description: p.metaDesc,
    slug: 'ai-ventures.html'
  });

  const header = renderHeader({ lang, currentSlug: 'ai-ventures.html' });

  // Filter to approved_public only — private/draft never rendered
  const ventures = (siteContent.aiVentures[lang] || []).filter(v => v.visibility === 'approved_public');

  const cardsHtml = ventures.map(v => `
    <div class="ai-venture-card">
      <div class="ai-venture-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="10" stroke="var(--accent-blue)" stroke-width="1.5" opacity="0.6"/>
          <circle cx="16" cy="16" r="4" fill="var(--accent-blue)" opacity="0.8"/>
          <line x1="16" y1="2" x2="16" y2="8" stroke="var(--accent-cyan)" stroke-width="1.5"/>
          <line x1="16" y1="24" x2="16" y2="30" stroke="var(--accent-cyan)" stroke-width="1.5"/>
          <line x1="2" y1="16" x2="8" y2="16" stroke="var(--accent-cyan)" stroke-width="1.5"/>
          <line x1="24" y1="16" x2="30" y2="16" stroke="var(--accent-cyan)" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="ai-venture-content">
        <div class="ai-venture-meta">
          <span class="ai-category-tag">${v.techCategory}</span>
          <span class="status-badge ${v.statusClass}">${v.status}</span>
        </div>
        <h3 class="ai-venture-name">${v.name}</h3>
        <p class="ai-venture-tagline">${v.tagline}</p>
        <p class="ai-venture-summary">${v.summary}</p>
      </div>
    </div>
  `).join('');

  const body = `
    <section class="page-hero ai-ventures-hero">
      <div class="wrap">
        <div class="eyebrow">${p.eyebrow}</div>
        <h1>${p.title}</h1>
        <p>${p.heroDesc}</p>
      </div>
    </section>

    <section class="section ai-ventures-section">
      <div class="wrap">
        <div class="ai-ventures-grid">
          ${cardsHtml}
        </div>
        <div class="ai-ventures-notice">
          <p>${isAr ? 'هذه مشاريع قيد التطوير. لا تمثل منتجات تجارية مطلقة ما لم يُشار إلى ذلك. يخضع الإفصاح عن التفاصيل الاستراتيجية والمعمارية للمراجعة والموافقة.' : 'These are ventures in active development. They do not represent commercially launched products unless otherwise indicated. Strategic and architectural details are disclosed through a reviewed qualification process.'}</p>
        </div>
      </div>
    </section>
  `;

  return head + header + body + renderFooter({ lang });
}

// 12. Strategic Investment & Venture Partnerships Page
function buildOpportunitiesPage(lang) {
  const isAr = lang === 'ar';
  const c = siteContent.opportunities.pageContent[lang];
  const founderLinkedIn = siteContent.meta.founderLinkedIn;

  // Only approved_public opportunities rendered — filter happens here
  const publicOpps = (siteContent.opportunities.publicOpportunities || []).filter(o => o.visibility === 'approved_public');

  const head = renderHead({
    lang,
    title: c.title,
    description: c.metaDesc,
    slug: 'partnerships.html'
  });

  const header = renderHeader({ lang, currentSlug: 'partnerships.html' });

  const partnershipModelsHtml = c.partnershipModels.map(m => `
    <div class="partnership-model-card">
      <h4>${m.title}</h4>
      <p>${m.desc}</p>
    </div>
  `).join('');

  const journeyHtml = c.journeySteps.map(s => `
    <div class="journey-step">
      <div class="journey-step-number">${s.step}</div>
      <div class="journey-step-content">
        <h4>${s.title}</h4>
        <p>${s.desc}</p>
      </div>
    </div>
  `).join('');

  const audienceHtml = c.audienceItems.map(item => `<li>${item}</li>`).join('');

  // Opportunities catalog — shown only if approved_public records exist
  const catalogSection = publicOpps.length > 0
    ? `<section class="section">
        <div class="wrap">
          <div class="eyebrow">${isAr ? 'فرص الشراكة المتاحة' : 'AVAILABLE PARTNERSHIP OPPORTUNITIES'}</div>
          <div class="cards-grid">
            ${publicOpps.map(o => `
              <div class="card">
                <h3>${isAr ? o.titleAr : o.titleEn}</h3>
                <p>${isAr ? o.shortDescAr : o.shortDescEn}</p>
                <div style="margin-top:12px; font-size:0.8125rem; color:var(--text-muted);">
                  ${isAr ? o.sectorAr : o.sectorEn} · ${isAr ? o.targetGeographyAr : o.targetGeographyEn}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`
    : `<section class="section">
        <div class="wrap">
          <div class="no-public-listing">
            <div class="no-listing-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="12" width="32" height="28" rx="3" stroke="var(--accent-blue)" stroke-width="1.5" opacity="0.6"/>
                <line x1="16" y1="22" x2="32" y2="22" stroke="var(--accent-cyan)" stroke-width="1.5"/>
                <line x1="16" y1="28" x2="26" y2="28" stroke="var(--accent-cyan)" stroke-width="1.5" opacity="0.6"/>
                <circle cx="36" cy="10" r="6" fill="var(--accent-blue)" opacity="0.15" stroke="var(--accent-blue)" stroke-width="1.5"/>
                <line x1="36" y1="7" x2="36" y2="13" stroke="var(--accent-blue)" stroke-width="1.5"/>
                <line x1="33" y1="10" x2="39" y2="10" stroke="var(--accent-blue)" stroke-width="1.5"/>
              </svg>
            </div>
            <p class="no-listing-primary">${c.noPublicListingMsg}</p>
            <p class="no-listing-secondary">${c.noPublicListingSubMsg}</p>
          </div>
        </div>
      </section>`;

  const body = `
    <section class="page-hero opportunities-hero">
      <div class="wrap">
        <div class="eyebrow">${c.eyebrow}</div>
        <h1>${c.title}</h1>
        <p class="hero-tagline">${c.tagline}</p>
        <p>${c.heroDesc}</p>
      </div>
    </section>

    ${catalogSection}

    <section class="section">
      <div class="wrap">
        <div class="two-col-section">
          <div>
            <div class="eyebrow">${c.audienceTitle.toUpperCase()}</div>
            <ul class="audience-list">
              ${audienceHtml}
            </ul>
          </div>
          <div>
            <div class="eyebrow">${c.partnershipsTitle.toUpperCase()}</div>
            <p style="color:var(--text-secondary); margin-bottom:24px;">${c.partnershipsDesc}</p>
            <div class="partnership-models-grid">
              ${partnershipModelsHtml}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="wrap">
        <div class="eyebrow">${c.journeyTitle.toUpperCase()}</div>
        <div class="journey-steps">
          ${journeyHtml}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="cta-block">
          <h2>${c.ctaTitle}</h2>
          <p>${c.ctaDesc}</p>
          <a href="${founderLinkedIn}" target="_blank" rel="noopener noreferrer" class="btn-primary">${c.ctaLinkedIn} ↗</a>
        </div>
        <div class="legal-disclaimer" style="margin-top:48px;">
          <p>${c.disclaimer}</p>
        </div>
      </div>
    </section>
  `;

  return head + header + body + renderFooter({ lang });
}

// 13. Team Page
function buildTeamPage(lang) {
  const isAr = lang === 'ar';
  const c = siteContent.team[lang];
  const founderLinkedIn = siteContent.meta.founderLinkedIn;

  // Exact filenames — confirmed present in assets/
  const img1 = '../assets/Venera-Finance-Team-in-Neon-Office-1.png';
  const img2 = '../assets/Venera-Finance-Team-in-Neon-Office-2.png';

  const head = renderHead({
    lang,
    title: c.title,
    description: c.metaDesc,
    slug: 'team.html'
  });

  const header = renderHeader({ lang, currentSlug: 'team.html' });

  const prevLabel = isAr ? 'الصورة السابقة' : 'Previous photograph';
  const nextLabel = isAr ? 'الصورة التالية' : 'Next photograph';
  // In RTL the glyphs visually reverse: prev points right, next points left.
  const prevGlyph = isAr ? '&#8250;' : '&#8249;';
  const nextGlyph = isAr ? '&#8249;' : '&#8250;';

  const principlesHtml = c.principles.map((p, i) => `
          <div class="tm-point">
            <span class="tm-idx">${isAr ? ['٠١', '٠٢', '٠٣'][i] : ['01', '02', '03'][i]}</span>
            <div>
              <h3>${p.label}</h3>
              <p>${p.desc}</p>
            </div>
          </div>`).join('');

  const body = `
    <!-- SECTION A: PEOPLE BEHIND VENERA + GALLERY -->
    <section class="tm-hero">
      <div class="wrap">
        <header class="tm-hero-head">
          <div class="eyebrow">${c.eyebrow}</div>
          <h1 class="tm-hero-title">${c.title}</h1>
          <p class="tm-hero-desc">${c.heroDesc}</p>
        </header>

        <div class="tm-gallery" role="group" aria-roledescription="carousel"
             aria-label="${isAr ? 'صور فريق VENERA' : 'VENERA team photographs'}" tabindex="0">
          <div class="tm-stage">
            <figure class="tm-slide active" data-caption="${c.caption1}">
              <img src="${img1}"
                   alt="${isAr ? 'فريق VENERA في المكتب أسفل شعار الشركة' : 'The VENERA team gathered in the office beneath the company emblem'}"
                   loading="eager" fetchpriority="high" decoding="async" width="1120" height="700">
            </figure>
            <figure class="tm-slide" data-caption="${c.caption2}">
              <img src="${img2}"
                   alt="${isAr ? 'فريق VENERA حول المكتب في بيئة العمل' : 'The VENERA team around the desk in the workspace'}"
                   loading="eager" decoding="async" width="1120" height="700">
            </figure>
            <div class="tm-vignette" aria-hidden="true"></div>
            <button class="tm-gbtn tm-prev" type="button" aria-label="${prevLabel}">${prevGlyph}</button>
            <button class="tm-gbtn tm-next" type="button" aria-label="${nextLabel}">${nextGlyph}</button>
          </div>
          <div class="tm-foot">
            <span class="tm-caption" aria-live="polite">${c.caption1}</span>
            <div class="tm-dots" role="tablist" aria-label="${isAr ? 'اختر الصورة' : 'Choose photograph'}">
              <button class="tm-dot active" type="button" role="tab" aria-selected="true" aria-label="${isAr ? 'الصورة 1' : 'Photograph 1'}"></button>
              <button class="tm-dot" type="button" role="tab" aria-selected="false" aria-label="${isAr ? 'الصورة 2' : 'Photograph 2'}"></button>
            </div>
            <span class="tm-counter" aria-hidden="true"><span class="current">1</span> / 2</span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION B: PEOPLE, TECHNOLOGY & COLLABORATION -->
    <section class="tm-collab">
      <div class="wrap">
        <div class="tm-collab-grid">
          <div class="tm-collab-left">
            <div class="eyebrow">${c.collabEyebrow}</div>
            <h2 class="tm-collab-title">${c.collabTitle}</h2>
          </div>
          <div class="tm-collab-right">
            <p class="tm-lede">${c.collabLede}</p>
            <div class="tm-points">
              ${principlesHtml}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION C: STRATEGIC COLLABORATION CTA -->
    <section class="tm-cta">
      <div class="wrap">
        <div class="tm-cta-inner">
          <div class="eyebrow">${c.ctaEyebrow}</div>
          <h2 class="tm-cta-title">${c.ctaTitle}</h2>
          <p class="tm-cta-desc">${c.ctaDesc}</p>
          <a href="${founderLinkedIn}" target="_blank" rel="noopener noreferrer" class="btn">${c.ctaLabel} ↗</a>
        </div>
      </div>
    </section>
  `;

  return head + header + body + renderFooter({ lang });
}

function buildRobots() {
  const baseUrl = (siteContent.meta.canonicalDomain || '').replace(/\/$/, '');
  const sitemapLine = baseUrl ? `Sitemap: ${baseUrl}/sitemap.xml\n` : '# Sitemap: configure canonicalDomain to enable\n';
  const robotsContent = `User-agent: *\nAllow: /\n${sitemapLine}`;
  fs.writeFileSync(path.join(ROOT_DIR, 'robots.txt'), robotsContent, 'utf8');
  console.log('✓ robots.txt generated');

}
function buildRootIndex() {
  const content = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>VENERA Technology</title>
  <meta name="robots" content="noindex, follow">
  <script>
    (function() {
      var lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
      var target = lang.indexOf('ar') === 0 ? 'ar/index.html' : 'en/index.html';
      window.location.replace(target);
    })();
  </script>
  <meta http-equiv="refresh" content="0; url=en/index.html">
</head>
<body style="background:#040914;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Redirecting to <a href="en/index.html" style="color:#38bdf8;">VENERA Technology</a>...</p>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), content, 'utf8');
  console.log('✓ root index.html generated');
}

// --------------------------------------------------------------------------
// Main Build Execution
// --------------------------------------------------------------------------
function compileSite() {
  console.log('========================================================');
  console.log('VENERA Technology V5 — Compiling Bilingual Corporate Site');
  console.log('========================================================');

  ['en', 'ar'].forEach(lang => {
    const dir = lang === 'en' ? EN_DIR : AR_DIR;

    fs.writeFileSync(path.join(dir, 'index.html'), buildHomePage(lang), 'utf8');

    const aboutHtml = buildAboutPage(lang);
    fs.writeFileSync(path.join(dir, 'about.html'), aboutHtml, 'utf8');
    fs.writeFileSync(path.join(dir, 'company.html'), aboutHtml, 'utf8');

    fs.writeFileSync(path.join(dir, 'expertise.html'), buildExpertisePage(lang), 'utf8');

    const projectsHtml = buildProjectsPage(lang);
    fs.writeFileSync(path.join(dir, 'projects.html'), projectsHtml, 'utf8');
    fs.writeFileSync(path.join(dir, 'work.html'), projectsHtml, 'utf8');

    siteContent.projects[lang].forEach(p => {
      fs.writeFileSync(path.join(dir, p.slug), buildProjectDetailPage(lang, p), 'utf8');
    });

    fs.writeFileSync(path.join(dir, 'initiatives.html'), buildInitiativesPage(lang), 'utf8');
    fs.writeFileSync(path.join(dir, 'ai-ventures.html'), buildAIVenturesPage(lang), 'utf8');
    fs.writeFileSync(path.join(dir, 'partnerships.html'), buildOpportunitiesPage(lang), 'utf8');
    fs.writeFileSync(path.join(dir, 'team.html'), buildTeamPage(lang), 'utf8');
    fs.writeFileSync(path.join(dir, 'founder.html'), buildFounderPage(lang), 'utf8');
    fs.writeFileSync(path.join(dir, 'insights.html'), buildInsightsPage(lang), 'utf8');
    fs.writeFileSync(path.join(dir, 'contact.html'), buildContactPage(lang), 'utf8');

    console.log(`✓ Compiled complete ${lang.toUpperCase()} page set (18 HTML files)`);
  });

  buildSitemap();
  buildRobots();
  buildRootIndex();

  console.log('========================================================');
  console.log('✓ Compilation Finished Successfully!');
  console.log('========================================================');
}

compileSite();
