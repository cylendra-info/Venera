/**
 * VENERA Technology — Master Static Site Compiler (V5)
 * Compiles all bilingual pages, project deep-dives, sitemap, and robots.txt
 */

const fs = require('fs');
const path = require('path');
const siteContent = require('../data/site-content.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const EN_DIR = path.join(ROOT_DIR, 'en');
const AR_DIR = path.join(ROOT_DIR, 'ar');

if (!fs.existsSync(EN_DIR)) fs.mkdirSync(EN_DIR, { recursive: true });
if (!fs.existsSync(AR_DIR)) fs.mkdirSync(AR_DIR, { recursive: true });

// Helper: Common HTML Head Template
function renderHead({ lang, title, description, slug, extraMeta = '' }) {
  const isAr = lang === 'ar';
  const otherLang = isAr ? 'en' : 'ar';
  const canonicalUrl = `${siteContent.meta.canonicalDomain}/${lang}/${slug}`;
  const alternateUrl = `${siteContent.meta.canonicalDomain}/${otherLang}/${slug}`;

  return `<!doctype html>
<html lang="${lang}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#040914">
  <title>${title} | ${siteContent.meta.brandName}</title>
  <meta name="description" content="${description}">
  
  <!-- Canonical & Multilingual Alternate -->
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" hreflang="${lang}" href="${slug}">
  <link rel="alternate" hreflang="${otherLang}" href="../${otherLang}/${slug}">
  <link rel="alternate" hreflang="x-default" href="../en/${slug}">
  
  <!-- Open Graph & Twitter Cards -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title} | ${siteContent.meta.brandName}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="${siteContent.meta.brandName}">
  <meta property="og:image" content="../assets/venera-logo-transparent.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} | ${siteContent.meta.brandName}">
  <meta name="twitter:description" content="${description}">
  
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

  const navLinksHtml = navItems.map(item => {
    // Check if this is the active page
    const itemSlug = path.basename(item.href);
    const isActive = (itemSlug === currentSlug) || 
      (currentSlug === 'index.html' && item.id === 'home') ||
      (currentSlug === 'about.html' && item.id === 'about') ||
      (currentSlug === 'company.html' && item.id === 'about') ||
      (currentSlug === 'projects.html' && item.id === 'projects') ||
      (currentSlug === 'work.html' && item.id === 'projects') ||
      (['cylendra.html', 'veneraswap.html', 'paynxs.html', 'ordernxs.html', 'roic.html', 'nuxese.html'].includes(currentSlug) && item.id === 'projects');

    return `<a class="${isActive ? 'active' : ''}" href="${itemSlug}">${item.label}</a>`;
  }).join('');

  return `
  <header class="topnav">
    <div class="wrap navinner">
      <a class="brand" href="index.html" aria-label="${siteContent.meta.brandName} Home">
        <img src="../assets/venera-logo-white.png" alt="${siteContent.meta.brandName}" width="210" height="52" fetchpriority="high">
      </a>
      <button class="hamb" aria-label="${isAr ? 'فتح القائمة' : 'Toggle Navigation Menu'}" aria-expanded="false">☰</button>
      <nav class="links" aria-label="${isAr ? 'القائمة الرئيسية' : 'Primary Navigation'}">
        ${navLinksHtml}
        <a class="lang-pill" href="${otherLangUrl}" hreflang="${otherLang}" lang="${otherLang}">${otherLangLabel}</a>
      </nav>
    </div>
  </header>
  <main id="main-content">
`;
}

// Helper: Footer
function renderFooter({ lang }) {
  const isAr = lang === 'ar';
  const f = siteContent.footer[lang];
  const m = siteContent.meta;

  return `
  </main>
  <footer class="footer">
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="../assets/venera-logo-white.png" alt="${m.brandName}" width="190" height="47">
          <p>${f.brandDesc}</p>
          <div style="margin-top: 16px;">
            <a class="inline-link" href="https://www.linkedin.com/in/leader7701/" target="_blank" rel="noopener noreferrer">
              Founder LinkedIn Profile ↗
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
            <li><a href="cylendra.html">Cylendra Labs</a></li>
            <li><a href="veneraswap.html">VeneraSwap</a></li>
            <li><a href="paynxs.html">PayNXS</a></li>
            <li><a href="ordernxs.html">OrderNXS</a></li>
            <li><a href="roic.html">ROIC</a></li>
            <li><a href="nuxese.html">Nuxese Group</a></li>
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

  const featuredProjects = siteContent.projects[lang].slice(0, 3);
  const projectsHtml = featuredProjects.map(p => `
    <div class="card">
      <span class="status-badge ${p.statusClass}">${p.status}</span>
      <h3>${p.name}</h3>
      <p>${p.summary}</p>
      <div class="card-footer">
        <a class="inline-link" href="${p.slug}">
          ${isAr ? 'عرض تفاصيل المشروع ↗' : 'View Project Case Study ↗'}
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

    <!-- Institutional CTA -->
    <section class="section soft">
      <div class="wrap" style="text-align: center; max-width: 800px; margin: 0 auto;">
        <div class="eyebrow">${isAr ? 'حوار استراتيجي' : 'PARTNERSHIP & ADVISORY'}</div>
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
function buildProjectsPage(lang) {
  const isAr = lang === 'ar';
  const projects = siteContent.projects[lang];

  const head = renderHead({
    lang,
    title: isAr ? 'المشاريع والمحفظة التقنية' : 'Engineering Projects & Portfolio',
    description: isAr ? 'استعراض المنصات والأنظمة التقنية المطورة وقيد التطوير' : 'Detailed catalog of developed systems, platforms under development, and technical ventures.',
    slug: 'projects.html'
  });

  const header = renderHeader({ lang, currentSlug: 'projects.html' });

  const cardsHtml = projects.map(p => `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span class="status-badge ${p.statusClass}">${p.status}</span>
      </div>
      <h3>${p.name}</h3>
      <div style="font-size: 0.8125rem; color: var(--accent-cyan); font-weight: 600; margin-bottom: 12px;">${p.tagline}</div>
      <p>${p.summary}</p>
      <div class="card-footer">
        <a class="inline-link" href="${p.slug}">
          ${isAr ? 'قراءة دراسة المشروع الهندسية ↗' : 'Read Full Architecture Case Study ↗'}
        </a>
      </div>
    </div>
  `).join('');

  const body = `
    <section class="page-hero">
      <div class="wrap">
        <div class="eyebrow">${isAr ? 'محفظة الأعمال الهندسية' : 'PORTFOLIO & SYSTEM CATALOG'}</div>
        <h1>${isAr ? 'المشاريع والأنظمة التقنية' : 'Verified Engineering Work'}</h1>
        <p>${isAr ? 'محفظة موثقة تتسم بالشفافية، تميز بدقة بين المنتجات المنشورة، والتجارب قيد التطوير، والمشاريع المنفذة لأطراف خارجية.' : 'A transparent portfolio delineating commercial products built, platforms under active laboratory development, and third-party engineering deliveries.'}</p>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="cards-grid">
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

  const body = `
    <section class="page-hero">
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

    <section class="section">
      <div class="wrap detail-grid">
        <div class="detail-body">
          <div class="eyebrow">${isAr ? 'نظرة عامة على النظام' : 'SYSTEM OVERVIEW'}</div>
          <p>${project.overview}</p>

          <div class="card" style="margin: 32px 0;">
            <div class="eyebrow">${isAr ? 'المشكلة المعمارية والقطاعية' : 'THE ARCHITECTURAL PROBLEM'}</div>
            <p>${project.problemStatement}</p>
          </div>

          <div class="eyebrow">${isAr ? 'مفهوم الحل الهندسي' : 'SOLUTION CONCEPT'}</div>
          <p>${project.solutionConcept}</p>

          <div class="eyebrow" style="margin-top: 36px;">${isAr ? 'القدرات والميزات التقنية' : 'TECHNICAL CAPABILITIES'}</div>
          <ul class="detail-caps-list">
            ${capabilitiesHtml}
          </ul>

          <div class="eyebrow" style="margin-top: 36px;">${isAr ? 'الهندسة المعمارية للنظام' : 'ARCHITECTURE & STACK'}</div>
          <p>${project.architecture}</p>

          <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--line-dark);">
            <a class="btn" href="projects.html">${isAr ? '← استعراض مشاريع أخرى' : '← Explore More Projects'}</a>
            ${project.externalUrl ? `<a class="btn ghost" href="${project.externalUrl}" target="_blank" rel="noopener noreferrer" style="margin-inline-start: 12px;">${isAr ? 'زيارة الرابط الموثق ↗' : 'Visit Documentation / Site ↗'}</a>` : ''}
          </div>
        </div>

        <aside class="sidebar-box">
          <h3>${isAr ? 'بيانات وحالة المشروع' : 'Project Metadata'}</h3>
          
          <div class="sidebar-item">
            <strong>${isAr ? 'الحالة التشغيلية' : 'Operational Status'}</strong>
            <span><span class="status-badge ${project.statusClass}">${project.status}</span></span>
          </div>

          <div class="sidebar-item">
            <strong>${isAr ? 'دور المؤسس / الشركة' : 'Founder / Company Role'}</strong>
            <span>${project.role}</span>
          </div>

          <div class="sidebar-item">
            <strong>${isAr ? 'بيان التحقق والمصداقية' : 'Verification Note'}</strong>
            <span style="font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6;">${project.statusVerification}</span>
          </div>

          ${project.externalUrl ? `
          <div class="sidebar-item" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--line-dark);">
            <strong>${isAr ? 'المصدر والتوثيق العلني' : 'Public Verification Link'}</strong>
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
  const storyParagraphs = c.story.paragraphs.map(p => `<p style="color: var(--text-muted); font-size: 1.05rem; line-height: 1.85; margin-bottom: 18px;">${p}</p>`).join('');

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
    <!-- Executive Leadership Hero: Dark Navy + Globe + Formal Portrait -->
    <section class="hero" style="min-height: auto; padding: 80px 0 90px;">
      <div class="wrap founder-hero-grid">
        <div>
          <div class="eyebrow">${c.hero.eyebrow}</div>
          <h1 style="font-size: clamp(2.75rem, 5vw, 4.25rem); margin-bottom: 12px;">${c.hero.name}</h1>
          <div style="font-size: 1.25rem; color: var(--accent-cyan); font-weight: 600; margin-bottom: 20px;">${c.hero.title}</div>
          <p class="lead" style="max-width: 620px;">${c.hero.subtitle}</p>
          
          <div class="quote-card">
            <blockquote>"${c.hero.quote}"</blockquote>
            <cite>— ${c.hero.name}, ${isAr ? c.hero.currentRole : c.hero.currentRole}</cite>
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

        <div>
          <figure class="founder-portrait-hero">
            <img src="../assets/founder-executive.webp" alt="${c.hero.name} - ${c.hero.title}" width="1024" height="1536" fetchpriority="high">
            <figcaption class="founder-badge-overlay">
              <strong>${c.hero.name}</strong>
              <span>${isAr ? 'الصورة الرسمية · القيادة التقنية والتنفيذية' : 'EXECUTIVE PORTRAIT · FOUNDER & TECHNOLOGY DIRECTOR'}</span>
            </figcaption>
          </figure>
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
          <img src="../assets/founder-story.webp" alt="${c.hero.name} - ${c.story.title}" width="1024" height="1536">
          <figcaption style="padding: 16px 20px; font-size: 0.75rem; color: var(--text-dim); background: #ffffff;">
            ${isAr ? 'صورة المسيرة المهنية الشخصية · جذور الهندسة الميدانية' : 'PERSONAL JOURNEY · EARLY TECHNICAL ENABLEMENT'}
          </figcaption>
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
    slug: 'contact.html'
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

          <form id="institutional-contact-form" novalidate>
            <div class="form-group">
              <label for="contact-name">${c.form.fields.name} *</label>
              <input type="text" id="contact-name" class="form-control" required placeholder="${isAr ? 'مثال: د. أحمد المنصور' : 'e.g. Dr. Alexander Vance'}">
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="contact-org">${c.form.fields.org} *</label>
                <input type="text" id="contact-org" class="form-control" required placeholder="${isAr ? 'المؤسسة أو الهيئة' : 'Enterprise / Agency'}">
              </div>
              <div class="form-group">
                <label for="contact-role">${c.form.fields.role}</label>
                <input type="text" id="contact-role" class="form-control" placeholder="${isAr ? 'المسمى الوظيفي' : 'Director / Architect'}">
              </div>
            </div>

            <div class="form-group">
              <label for="contact-email">${c.form.fields.email} *</label>
              <input type="email" id="contact-email" class="form-control" required placeholder="contact@institution.org">
            </div>

            <div class="form-group">
              <label for="contact-category">${c.form.fields.category} *</label>
              <select id="contact-category" class="form-control" required>
                ${categoryOptions}
              </select>
            </div>

            <div class="form-group">
              <label for="contact-message">${c.form.fields.message} *</label>
              <textarea id="contact-message" class="form-control" required placeholder="${isAr ? 'يرجى تقديم وصف موجز لنطاق التعاون أو الاستفسار التقني...' : 'Provide brief context regarding your enterprise requirement or briefing request...'}"></textarea>
            </div>

            <button type="submit" class="btn" style="width: 100%; margin-top: 8px;">
              ${c.form.fields.submit} →
            </button>

            <div id="form-feedback" class="form-feedback"></div>

            <p style="font-size: 0.75rem; color: var(--text-dim); margin-top: 16px; text-align: center;">
              🔒 ${c.form.fields.privacyNote}
            </p>
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
  const baseUrl = siteContent.meta.canonicalDomain;
  const slugs = [
    'index.html',
    'about.html',
    'expertise.html',
    'projects.html',
    'cylendra.html',
    'veneraswap.html',
    'paynxs.html',
    'ordernxs.html',
    'roic.html',
    'nuxese.html',
    'initiatives.html',
    'founder.html',
    'insights.html',
    'contact.html'
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  slugs.forEach(slug => {
    xml += `  <url>
    <loc>${baseUrl}/en/${slug}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/${slug}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/ar/${slug}"/>
    <changefreq>weekly</changefreq>
    <priority>${slug === 'index.html' ? '1.0' : slug === 'founder.html' ? '0.9' : '0.8'}</priority>
  </url>
  <url>
    <loc>${baseUrl}/ar/${slug}</loc>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/ar/${slug}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/${slug}"/>
    <changefreq>weekly</changefreq>
    <priority>${slug === 'index.html' ? '1.0' : slug === 'founder.html' ? '0.9' : '0.8'}</priority>
  </url>
`;
  });

  xml += `</urlset>\n`;
  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), xml, 'utf8');
  console.log('✓ sitemap.xml generated');
}

function buildRobots() {
  const content = `User-agent: *
Allow: /
Sitemap: ${siteContent.meta.canonicalDomain}/sitemap.xml
`;
  fs.writeFileSync(path.join(ROOT_DIR, 'robots.txt'), content, 'utf8');
  console.log('✓ robots.txt generated');
}

// Root index.html redirect with language detection
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

    // 1. Home
    fs.writeFileSync(path.join(dir, 'index.html'), buildHomePage(lang), 'utf8');
    
    // 2. About & alias company.html
    const aboutHtml = buildAboutPage(lang);
    fs.writeFileSync(path.join(dir, 'about.html'), aboutHtml, 'utf8');
    fs.writeFileSync(path.join(dir, 'company.html'), aboutHtml, 'utf8');

    // 3. Expertise
    fs.writeFileSync(path.join(dir, 'expertise.html'), buildExpertisePage(lang), 'utf8');

    // 4. Projects & alias work.html
    const projectsHtml = buildProjectsPage(lang);
    fs.writeFileSync(path.join(dir, 'projects.html'), projectsHtml, 'utf8');
    fs.writeFileSync(path.join(dir, 'work.html'), projectsHtml, 'utf8');

    // 5. Project Detail Pages (all 6)
    siteContent.projects[lang].forEach(p => {
      fs.writeFileSync(path.join(dir, p.slug), buildProjectDetailPage(lang, p), 'utf8');
    });

    // 6. Strategic Initiatives
    fs.writeFileSync(path.join(dir, 'initiatives.html'), buildInitiativesPage(lang), 'utf8');

    // 7. Founder Page
    fs.writeFileSync(path.join(dir, 'founder.html'), buildFounderPage(lang), 'utf8');

    // 8. Research & Insights
    fs.writeFileSync(path.join(dir, 'insights.html'), buildInsightsPage(lang), 'utf8');

    // 9. Contact
    fs.writeFileSync(path.join(dir, 'contact.html'), buildContactPage(lang), 'utf8');

    console.log(`✓ Compiled complete ${lang.toUpperCase()} page set (15 HTML files)`);
  });

  buildSitemap();
  buildRobots();
  buildRootIndex();

  console.log('========================================================');
  console.log('✓ Compilation Finished Successfully!');
  console.log('========================================================');
}

compileSite();
