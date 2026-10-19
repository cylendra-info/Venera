/**
 * VENERA Technology — Master Client Application Script (V5)
 * Sovereign Tech Interactive Visuals, Navigation & Form Utilities
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initDigitalGlobe();
  initContactForm();
  initInsightsModal();
});

/* --------------------------------------------------------------------------
   1. Mobile Navigation & Accessibility
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const hamb = document.querySelector('.hamb');
  const nav = document.querySelector('.links');
  if (!hamb || !nav) return;

  function toggleNav(state) {
    const isOpen = state !== undefined ? state : !nav.classList.contains('open');
    nav.classList.toggle('open', isOpen);
    hamb.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    hamb.innerHTML = isOpen ? '✕' : '☰';
  }

  hamb.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNav();
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !hamb.contains(e.target)) {
      toggleNav(false);
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      toggleNav(false);
      hamb.focus();
    }
  });

  // Close on navigation link click
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        toggleNav(false);
      }
    });
  });
}

/* --------------------------------------------------------------------------
   2. Interactive 3D Connected Digital Globe (Canvas)
   -------------------------------------------------------------------------- */
function initDigitalGlobe() {
  const canvas = document.querySelector('.globe-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, dpr, radius;
  let rotX = 0.25;
  let rotY = 0;
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let animId = null;
  let isVisible = true;

  // Key infrastructural nodes (lat, lon in degrees)
  // Representing global tech & sovereign nodes (Minsk, Baghdad, London, Singapore, New York, Dubai, Tokyo, Frankfurt)
  const nodes = [
    { lat: 53.9, lon: 27.56, label: "Minsk (HQ)", color: "#38bdf8" },
    { lat: 33.31, lon: 44.36, label: "Baghdad", color: "#60a5fa" },
    { lat: 51.5, lon: -0.12, label: "London", color: "#93c5fd" },
    { lat: 1.35, lon: 103.82, label: "Singapore", color: "#38bdf8" },
    { lat: 40.71, lon: -74.0, label: "New York", color: "#60a5fa" },
    { lat: 25.2, lon: 55.27, label: "Dubai", color: "#38bdf8" },
    { lat: 35.68, lon: 139.69, label: "Tokyo", color: "#93c5fd" },
    { lat: 50.11, lon: 8.68, label: "Frankfurt", color: "#60a5fa" },
    { lat: 59.43, lon: 24.75, label: "Tallinn", color: "#7dd3fc" }
  ];

  // Data transmission arcs connecting nodes
  const arcs = [
    [0, 1], // Minsk - Baghdad
    [0, 2], // Minsk - London
    [1, 5], // Baghdad - Dubai
    [5, 3], // Dubai - Singapore
    [2, 4], // London - New York
    [3, 6], // Singapore - Tokyo
    [0, 7], // Minsk - Frankfurt
    [0, 8]  // Minsk - Tallinn
  ];

  function resize() {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    radius = Math.min(width, height) * 0.42;
  }

  window.addEventListener('resize', resize);
  resize();

  // Mouse / Touch interaction
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevMouseX;
    const dy = e.clientY - prevMouseY;
    rotY += dx * 0.005;
    rotX += dy * 0.005;
    rotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotX));
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch handlers
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - prevMouseX;
    const dy = e.touches[0].clientY - prevMouseY;
    rotY += dx * 0.005;
    rotX += dy * 0.005;
    rotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotX));
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Projection math
  function project(latDeg, lonDeg, r) {
    const lat = (latDeg * Math.PI) / 180;
    const lon = (lonDeg * Math.PI) / 180 + rotY;
    const x3d = r * Math.cos(lat) * Math.sin(lon);
    const y3d = r * Math.sin(lat);
    const z3d = r * Math.cos(lat) * Math.cos(lon);

    // Rotate around X axis (pitch)
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const yRot = y3d * cosX - z3d * sinX;
    const zRot = y3d * sinX + z3d * cosX;

    const cx = (width * dpr) / 2;
    const cy = (height * dpr) / 2;

    return {
      x: cx + x3d * dpr,
      y: cy - yRot * dpr,
      z: zRot,
      visible: zRot > -r * 0.1
    };
  }

  let arcProgress = 0;

  function render() {
    if (!isVisible) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scaledR = radius * dpr;

    // Atmospheric Glow
    const glowGrad = ctx.createRadialGradient(cx, cy, scaledR * 0.7, cx, cy, scaledR * 1.25);
    glowGrad.addColorStop(0, "rgba(37, 99, 235, 0.15)");
    glowGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.06)");
    glowGrad.addColorStop(1, "rgba(4, 9, 20, 0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, scaledR * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // Globe Core Background
    const coreGrad = ctx.createRadialGradient(cx - scaledR * 0.3, cy - scaledR * 0.3, scaledR * 0.1, cx, cy, scaledR);
    coreGrad.addColorStop(0, "#0c234a");
    coreGrad.addColorStop(0.7, "#061326");
    coreGrad.addColorStop(1, "#030814");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, scaledR, 0, Math.PI * 2);
    ctx.fill();

    // Outer Rim
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // Draw Latitude Rings
    ctx.lineWidth = 0.8 * dpr;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let first = true;
      for (let lon = 0; lon <= 360; lon += 6) {
        const p = project(lat, lon, radius);
        if (p.visible) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.08 + (p.z / radius) * 0.12})`;
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }

    // Draw Longitude Rings
    for (let lon = 0; lon < 360; lon += 30) {
      ctx.beginPath();
      let first = true;
      for (let lat = -80; lat <= 80; lat += 5) {
        const p = project(lat, lon, radius);
        if (p.visible) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.08 + (p.z / radius) * 0.12})`;
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }

    // Draw Great-Circle Arcs
    arcProgress = (arcProgress + 0.008) % 1;
    arcs.forEach(([i1, i2]) => {
      const n1 = nodes[i1];
      const n2 = nodes[i2];
      const p1 = project(n1.lat, n1.lon, radius);
      const p2 = project(n2.lat, n2.lon, radius);

      if (p1.visible || p2.visible) {
        // Interpolate mid-arc elevation
        const midLat = (n1.lat + n2.lat) / 2;
        const midLon = (n1.lon + n2.lon) / 2;
        const pMid = project(midLat, midLon, radius * 1.15);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(pMid.x, pMid.y, p2.x, p2.y);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.22)";
        ctx.lineWidth = 1.2 * dpr;
        ctx.stroke();

        // Pulsing data packet
        const t = (arcProgress + (i1 * 0.13)) % 1;
        const qx = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * pMid.x + t * t * p2.x;
        const qy = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * pMid.y + t * t * p2.y;

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 8 * dpr;
        ctx.beginPath();
        ctx.arc(qx, qy, 2 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Draw Infrastructure Nodes
    nodes.forEach((n) => {
      const p = project(n.lat, n.lon, radius);
      if (p.visible) {
        const alpha = Math.max(0.2, (p.z / radius) + 0.3);

        // Halo
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 * dpr, 0, Math.PI * 2);
        ctx.fill();

        // Center point
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();

        // Label on front-facing nodes
        if (p.z > radius * 0.2) {
          ctx.font = `${10 * dpr}px var(--font-en, sans-serif)`;
          ctx.fillStyle = `rgba(241, 245, 249, ${alpha})`;
          ctx.fillText(n.label, p.x + 8 * dpr, p.y + 3 * dpr);
        }
      }
    });

    // Auto-spin if not dragging and not reduced-motion
    if (!isDragging && !prefersReducedMotion) {
      rotY += 0.0016;
    }

    animId = requestAnimationFrame(render);
  }

  // IntersectionObserver to pause when offscreen
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !animId) {
        render();
      }
    });
  }, { threshold: 0.1 });

  observer.observe(canvas);
  render();
}

/* --------------------------------------------------------------------------
   3. Institutional Contact Form Handling
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.querySelector('#institutional-contact-form');
  if (!form) return;

  const feedback = document.querySelector('#form-feedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = document.documentElement.lang === 'ar' ? 'جارٍ التحقق وتشفير الإرسال...' : 'Encrypting & Routing Inquiry...';

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;

      const refNumber = 'VEN-' + Math.floor(100000 + Math.random() * 900000);
      const isArabic = document.documentElement.lang === 'ar';

      if (feedback) {
        feedback.className = 'form-feedback success';
        feedback.innerHTML = isArabic
          ? `<strong>تم استلام طلبكم المؤسسي بنجاح.</strong><br>الرقم المرجعي للاستفسار: <code>${refNumber}</code>.<br>سيتم توجيه المراسلة للقيادة الهندسية المختصة في أقرب وقت.`
          : `<strong>Institutional inquiry received successfully.</strong><br>Inquiry Reference ID: <code>${refNumber}</code>.<br>Your communication has been cryptographically routed to our systems engineering practice.`;
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      form.reset();
    }, 1200);
  });
}

/* --------------------------------------------------------------------------
   4. Research & Insights Full-Article Reader Modal
   -------------------------------------------------------------------------- */
function initInsightsModal() {
  const triggers = document.querySelectorAll('.read-insight-btn');
  if (!triggers.length) return;

  // Create modal element if not present
  let modal = document.querySelector('#insight-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'insight-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.style.cssText = `
      display: none;
      position: fixed;
      inset: 0;
      z-index: 2000;
      background: rgba(2, 6, 16, 0.85);
      backdrop-filter: blur(16px);
      overflow-y: auto;
      padding: 40px 20px;
    `;
    modal.innerHTML = `
      <div class="insight-modal-box" style="
        max-width: 800px;
        margin: 40px auto;
        background: #09172b;
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 12px;
        padding: 40px;
        position: relative;
        box-shadow: 0 25px 60px rgba(0,0,0,0.8);
      ">
        <button id="close-modal-btn" aria-label="Close" style="
          position: absolute;
          top: 20px;
          right: 20px;
          color: #94a3b8;
          font-size: 1.5rem;
          padding: 8px 12px;
          border-radius: 6px;
        ">✕</button>
        <div id="modal-content-area"></div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#close-modal-btn');
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  triggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const articleId = btn.getAttribute('data-article-id');
      const container = document.querySelector(`#article-full-${articleId}`);
      if (container && modal) {
        modal.querySelector('#modal-content-area').innerHTML = container.innerHTML;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
      }
    });
  });
}