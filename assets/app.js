/**
 * VENERA Technology — Master Client Application Script (V5)
 * Sovereign Tech Interactive Visuals, Navigation & Form Utilities
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initNavDropdown();
  initDigitalGlobe();
  initContactForm();
  initInsightsModal();
  initPortfolioFilters();
  initTeamGallery();
  initProjectGalleries();
});

/* --------------------------------------------------------------------------
   Project Detail Galleries (V5.7) — one image at a time, crossfade,
   prev/next, dots, keyboard, touch-swipe, RTL-aware. Supports multiple.
   -------------------------------------------------------------------------- */
function initProjectGalleries() {
  const roots = document.querySelectorAll('.pf-gallery');
  if (!roots.length) return;
  const isRtl = document.documentElement.dir === 'rtl';

  roots.forEach(root => {
    const slides = Array.from(root.querySelectorAll('.pf-slide'));
    const dots = Array.from(root.querySelectorAll('.pf-dot'));
    const prev = root.querySelector('.pf-prev');
    const next = root.querySelector('.pf-next');
    const counter = root.querySelector('.pf-counter .current');
    const caption = root.querySelector('.pf-cap');
    if (slides.length < 2) return;

    let i = 0;
    const caps = slides.map(s => s.getAttribute('data-cap') || '');

    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('active', k === i));
      dots.forEach((d, k) => {
        d.classList.toggle('active', k === i);
        d.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      if (counter) counter.textContent = String(i + 1);
      if (caption) caption.textContent = caps[i];
    }

    if (prev) prev.addEventListener('click', () => show(i - 1));
    if (next) next.addEventListener('click', () => show(i + 1));
    dots.forEach((d, k) => d.addEventListener('click', () => show(k)));

    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(isRtl ? i - 1 : i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(isRtl ? i + 1 : i - 1); }
    });

    let x0 = null;
    const stage = root.querySelector('.pf-stage');
    if (stage) {
      stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) {
          const forward = isRtl ? dx > 0 : dx < 0;
          show(forward ? i + 1 : i - 1);
        }
        x0 = null;
      }, { passive: true });
    }

    show(0);
  });
}

/* --------------------------------------------------------------------------
   Team Page Gallery — one image at a time, crossfade, prev/next, dots,
   keyboard, touch-swipe. No libraries. Content stays visible without JS.
   -------------------------------------------------------------------------- */
function initTeamGallery() {
  const root = document.querySelector('.tm-gallery');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('.tm-slide'));
  const dots = Array.from(root.querySelectorAll('.tm-dot'));
  const prev = root.querySelector('.tm-prev');
  const next = root.querySelector('.tm-next');
  const counter = root.querySelector('.tm-counter .current');
  const caption = root.querySelector('.tm-caption');
  if (slides.length < 2) return;

  let i = 0;
  const captions = slides.map(s => s.getAttribute('data-caption') || '');

  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    dots.forEach((d, k) => {
      d.classList.toggle('active', k === i);
      d.setAttribute('aria-selected', k === i ? 'true' : 'false');
    });
    if (counter) counter.textContent = String(i + 1);
    if (caption) caption.textContent = captions[i];
  }

  if (prev) prev.addEventListener('click', () => show(i - 1));
  if (next) next.addEventListener('click', () => show(i + 1));
  dots.forEach((d, k) => d.addEventListener('click', () => show(k)));

  const isRtl = document.documentElement.dir === 'rtl';
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(isRtl ? i - 1 : i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(isRtl ? i + 1 : i - 1); }
  });

  let x0 = null;
  const stage = root.querySelector('.tm-stage');
  if (stage) {
    stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) {
        const forward = isRtl ? dx > 0 : dx < 0;
        show(forward ? i + 1 : i - 1);
      }
      x0 = null;
    }, { passive: true });
  }

  show(0);
}

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
    if (!isOpen) {
      nav.querySelectorAll('.nav-more.open').forEach(group => {
        group.classList.remove('open');
        group.querySelector('.nav-more-btn')?.setAttribute('aria-expanded', 'false');
      });
    }
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
async function initDigitalGlobe() {
  const canvas = document.querySelector('.globe-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = motionQuery.matches;
  const metrics = { frames: 0, totalMs: 0, maxMs: 0 };
  let lastTime = 0, lastDraw = 0;
  let frozen = new URLSearchParams(location.search).has('still');
  // Natural Earth 1:110m land. Public domain. Parsed/rasterized once, never per frame.
  const geography = await fetch('/assets/geography/ne_110m_land.geojson').then(r => {
    if (!r.ok) throw new Error('Land data unavailable');
    return r.json();
  });
  const texture = document.createElement('canvas');
  texture.width = 2048; texture.height = 1024;
  const map = texture.getContext('2d', { willReadFrequently: true });
  map.fillStyle = '#0a1931'; map.fillRect(0, 0, 2048, 1024);
  // Source polygons are already split at ±180. Fill all rings with evenodd,
  // including Antarctica's polar closure. Never connect separate polygons.
  map.fillStyle = '#153c5b'; map.strokeStyle = '#4587a3'; map.lineWidth = 1.65;
  for (const feature of geography.features) {
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const polygon of polygons) {
      map.beginPath();
      for (const ring of polygon) {
        ring.forEach(([lon,lat],i) => {
          const x=(lon+180)/360*2048, y=(90-lat)/180*1024;
          if(i) map.lineTo(x,y); else map.moveTo(x,y);
        });
        map.closePath();
      }
      map.fill('evenodd');
      // Do not illuminate artificial source cut edges at the date line/pole.
      map.beginPath();
      for (const ring of polygon) for(let i=1;i<ring.length;i++) {
        const a=ring[i-1],b=ring[i];
        if ((Math.abs(a[0])>179.99 && Math.abs(b[0])>179.99) || Math.abs(a[0]-b[0])>180 || a[1]<=-89.99 || b[1]<=-89.99) continue;
        map.moveTo((a[0]+180)/360*2048,(90-a[1])/180*1024);
        map.lineTo((b[0]+180)/360*2048,(90-b[1])/180*1024);
      }
      map.stroke();
    }
  }
  const texels = map.getImageData(0,0,2048,1024).data;
  const surface = document.createElement('canvas');
  const surfaceCtx = surface.getContext('2d');
  let pixels, samples, lookup, cachedPitch = NaN;
  function prepareSurface() {
    const size = Math.min(440, Math.round(radius * 2 * Math.min(dpr,1.5)));
    surface.width = surface.height = size;
    pixels = surfaceCtx.createImageData(size,size);
    const list=[];
    for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
      const nx=(x+.5)/size*2-1, ny=1-(y+.5)/size*2, q=1-nx*nx-ny*ny;
      if(q<0) continue;
      const z=Math.sqrt(q);
      list.push((y*size+x)*4,nx,ny,z,.52+.48*Math.max(0, -.35*nx+.32*ny+.88*z));
    }
    samples = new Float32Array(list);
    lookup = new Float32Array(list.length); cachedPitch = NaN;
  }
  function drawGeography(cx,cy,r) {
    const c=Math.cos(rotX),s=Math.sin(rotX),out=pixels.data;
    const yaw=((rotY % (Math.PI*2))+Math.PI*2)%(Math.PI*2);
    // Pitch changes only during vertical drag. Cache inverse projection then;
    // auto-rotation becomes a wrapped texture-column offset with no per-pixel trig.
    if(cachedPitch !== rotX) {
      for(let i=0;i<samples.length;i+=5) {
        const x=samples[i+1],y=samples[i+2],z=samples[i+3];
        const lat=Math.asin(Math.max(-1,Math.min(1,y*c+z*s)));
        lookup[i+1]=(Math.atan2(x,z*c-y*s)+Math.PI)/(Math.PI*2)*2048;
        lookup[i+2]=Math.min(1023,Math.max(0,(.5-lat/Math.PI)*1024));
      }
      cachedPitch=rotX;
    }
    const offset=yaw/(Math.PI*2)*2048;
    for(let i=0;i<samples.length;i+=5) {
      const index=samples[i]; let u=lookup[i+1]-offset;
      if(u<0) u+=2048; else if(u>=2048) u-=2048;
      const v=lookup[i+2],tx=Math.floor(u),ty=Math.floor(v),fx=u-tx,fy=v-ty;
      const nextX=(tx+1)%2048,nextY=Math.min(1023,ty+1);
      const a=(ty*2048+tx)*4,b=(ty*2048+nextX)*4,c=(nextY*2048+tx)*4,d=(nextY*2048+nextX)*4;
      const light=samples[i+4];
      for(let ch=0;ch<3;ch++) out[index+ch]=((texels[a+ch]*(1-fx)+texels[b+ch]*fx)*(1-fy)+(texels[c+ch]*(1-fx)+texels[d+ch]*fx)*fy)*light;
      out[index+3]=255;
    }
    surfaceCtx.putImageData(pixels,0,0);
    ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,r-.3*dpr,0,Math.PI*2); ctx.clip();
    ctx.drawImage(surface,cx-r,cy-r,r*2,r*2); ctx.restore();
  }

  let width, height, dpr, radius;
  let rotX = 0.25;
  let rotY = Number(new URLSearchParams(location.search).get('rotation') || .45);
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let animId = null;
  let isVisible = true;

  // Key infrastructural nodes (lat, lon in degrees)
  // Illustrative technology infrastructure nodes — not representative of offices or operational locations
  const nodes = [
    { lat: 53.9, lon: 27.56, label: "Node-A", color: "#38bdf8" },
    { lat: 33.31, lon: 44.36, label: "Node-B", color: "#60a5fa" },
    { lat: 51.5, lon: -0.12, label: "Node-C", color: "#93c5fd" },
    { lat: 1.35, lon: 103.82, label: "Node-D", color: "#38bdf8" },
    { lat: 40.71, lon: -74.0, label: "Node-E", color: "#60a5fa" },
    { lat: 25.2, lon: 55.27, label: "Node-F", color: "#38bdf8" },
    { lat: 35.68, lon: 139.69, label: "Node-G", color: "#93c5fd" },
    { lat: 50.11, lon: 8.68, label: "Node-H", color: "#60a5fa" },
    { lat: 59.43, lon: 24.75, label: "Node-I", color: "#7dd3fc" }
  ];

  // Data transmission arcs connecting nodes
  const arcs = [
    [0, 1], // A-B
    [0, 2], // A-C
    [1, 5], // B-F
    [5, 3], // F-D
    [2, 4], // C-E
    [3, 6], // D-G
    [0, 7], // A-H
    [0, 8]  // A-I
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    radius = Math.min(width, height) * 0.42;
    prepareSurface();
    wake();
  }

  window.addEventListener('resize', resize);
  resize();

  // Unified mouse/touch/pen capture; prevent browser panning only on the globe.
  canvas.style.touchAction = 'none';
  let activePointer = null;
  canvas.addEventListener('pointerdown', e => {
    if(activePointer !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    activePointer=e.pointerId; isDragging=true;
    prevMouseX=e.clientX; prevMouseY=e.clientY;
    canvas.setPointerCapture(e.pointerId); wake();
  });
  canvas.addEventListener('pointermove', e => {
    if(e.pointerId !== activePointer) return;
    rotY+=(e.clientX-prevMouseX)*.005;
    rotX=Math.max(-Math.PI/2.2,Math.min(Math.PI/2.2,rotX+(e.clientY-prevMouseY)*.005));
    prevMouseX=e.clientX; prevMouseY=e.clientY; wake();
  });
  function release(e) {
    if(e.pointerId !== activePointer) return;
    activePointer=null;isDragging=false;wake();
  }
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);

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
      visible: zRot >= 0
    };
  }

  let arcProgress = 0;

  function render(time = performance.now()) {
    animId = null;
    if (!isVisible || document.hidden) return;
    if (!prefersReducedMotion && !frozen && time-lastDraw < 32) { wake(); return; }
    const start=performance.now();
    const dt=lastTime ? Math.min(50,time-lastTime) : 16.667;
    lastTime=time; lastDraw=time;

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

    drawGeography(cx, cy, scaledR);

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
    if (!prefersReducedMotion && !frozen) arcProgress = (arcProgress + dt * 0.00048) % 1;
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
        let pen=false;
        for(let step=0;step<=40;step++) {
          const u=step/40,v=1-u, z=v*v*p1.z+2*v*u*pMid.z+u*u*p2.z;
          const x=v*v*p1.x+2*v*u*pMid.x+u*u*p2.x;
          const y=v*v*p1.y+2*v*u*pMid.y+u*u*p2.y;
          if(z>=0) { if(pen) ctx.lineTo(x,y); else ctx.moveTo(x,y); pen=true; } else pen=false;
        }
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
        if ((1-t)*(1-t)*p1.z+2*(1-t)*t*pMid.z+t*t*p2.z >= 0) ctx.arc(qx, qy, 1.5 * dpr, 0, Math.PI * 2);
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
        ctx.arc(p.x, p.y, 2.4 * dpr, 0, Math.PI * 2);
        ctx.fill();

      }
    });

    // Auto-spin if not dragging and not reduced-motion
    if (!isDragging && !prefersReducedMotion && !frozen) {
      rotY += dt * 0.000096;
    }

    const elapsed=performance.now()-start;
    metrics.frames++; metrics.totalMs+=elapsed; metrics.maxMs=Math.max(metrics.maxMs,elapsed);
    if(!prefersReducedMotion && !frozen) wake();
  }
  function wake() {
    if (isVisible && !document.hidden && animId === null) animId=requestAnimationFrame(render);
  }
  function suspend() {
    if(animId !== null) cancelAnimationFrame(animId);
    animId=null; lastTime=0; lastDraw=0;
  }
  const observer = new IntersectionObserver(([entry]) => {
    isVisible=entry.isIntersecting;
    if(isVisible) wake(); else suspend();
  }, {threshold: .1});
  observer.observe(canvas);
  document.addEventListener('visibilitychange', () => { if(document.hidden) suspend(); else wake(); });
  motionQuery.addEventListener('change', e => { prefersReducedMotion=e.matches; suspend(); wake(); });
  // Read-only diagnostics support deterministic visual regression and draw-cost checks.
  window.digitalEarth = {
    state: () => ({rotX,rotY,isVisible,hidden:document.hidden,reduced:prefersReducedMotion,pending:animId!==null,...metrics,meanMs:metrics.totalMs/Math.max(1,metrics.frames),surfaceSize:surface.width,dpr}),
    view: (yaw,pitch=.25) => {rotY=yaw;rotX=pitch;frozen=true;suspend();wake();},
    play: () => {frozen=false;suspend();wake();},
    project: (lat,lon) => project(lat,lon,radius),
    surfaceCoordinate: (px,py) => {
      const sx=Math.floor((px/dpr-width/2+radius)/(radius*2)*surface.width);
      const sy=Math.floor((py/dpr-height/2+radius)/(radius*2)*surface.height);
      const index=(sy*surface.width+sx)*4;
      for(let i=0;i<samples.length;i+=5) if(samples[i]===index) return {
        lon: ((lookup[i+1]/2048*360-180-rotY*180/Math.PI+540)%360+360)%360-180,
        lat:90-lookup[i+2]/1024*180
      };
      return null;
    }
  };
  wake();
}

/* --------------------------------------------------------------------------
   3. Institutional Contact Form Handling
   Netlify detects the static form during deployment. This enhancement submits
   the same form schema without navigating away from the localized page.
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.querySelector('#institutional-contact-form');
  if (!form) return;

  const feedback = document.querySelector('#form-feedback');
  const submitBtn = form.querySelector('button[type="submit"]');
  if (!submitBtn || !feedback) return;
  const defaultButtonText = submitBtn.textContent;
  let pending = false;

  const showFeedback = (kind, message, focus = true) => {
    feedback.className = `form-feedback ${kind}`;
    feedback.textContent = message;
    if (focus) feedback.focus({ preventScroll: true });
  };

  const validatedFields = Array.from(form.elements).filter(field => field.id && (
    field.dataset.requiredMessage || field.dataset.invalidMessage || field.dataset.tooShortMessage
  ));

  const fieldError = (field) => document.querySelector(`#${field.id}-error`);
  const clearFieldError = (field) => {
    field.removeAttribute('aria-invalid');
    const error = fieldError(field);
    if (error) error.textContent = '';
  };
  const validationMessage = (field) => {
    if (field.validity.valueMissing) return field.dataset.requiredMessage;
    if (field.validity.typeMismatch) return field.dataset.invalidMessage;
    if (field.validity.tooShort) return field.dataset.tooShortMessage;
    return field.dataset.invalidMessage || field.dataset.requiredMessage || '';
  };
  const validateFields = () => {
    let firstInvalid = null;
    for (const field of validatedFields) {
      if (field.checkValidity()) {
        clearFieldError(field);
        continue;
      }
      field.setAttribute('aria-invalid', 'true');
      const error = fieldError(field);
      if (error) error.textContent = validationMessage(field);
      if (!firstInvalid) firstInvalid = field;
    }
    if (!firstInvalid) return true;
    showFeedback('error', form.dataset.validationMessage, false);
    firstInvalid.focus();
    return false;
  };

  for (const field of validatedFields) {
    const eventName = field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input';
    field.addEventListener(eventName, () => {
      if (field.checkValidity()) {
        clearFieldError(field);
        if (validatedFields.every(item => item.checkValidity())) {
          feedback.className = 'form-feedback';
          feedback.textContent = '';
        }
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (pending) return;

    if (!validateFields()) return;

    pending = true;
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.textContent = form.dataset.submittingMessage;
    feedback.className = 'form-feedback';
    feedback.textContent = '';

    try {
      const body = new URLSearchParams(new FormData(form));
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });
      if (!response.ok) {
        showFeedback('error', form.dataset.rejectedMessage);
        return;
      }

      // A 2xx response only confirms HTTP transport. Netlify Forms does not
      // provide browser-side proof that the submission reached its dashboard
      // or triggered an email notification, so preserve the entered values.
      if (response.redirected) {
        showFeedback('error', form.dataset.redirectedMessage);
        return;
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.toLowerCase().includes('text/html')) {
        showFeedback('info', form.dataset.htmlResponseMessage);
        return;
      }
      showFeedback('info', form.dataset.acceptedMessage);
    } catch (error) {
      showFeedback('error', form.dataset.networkFailureMessage);
    } finally {
      pending = false;
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = defaultButtonText;
    }
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
/* --------------------------------------------------------------------------
   Global navigation dropdown groups
   -------------------------------------------------------------------------- */
function initNavDropdown() {
  const moreContainers = Array.from(document.querySelectorAll('.nav-more'));
  if (!moreContainers.length) return;

  moreContainers.forEach(container => {
    const btn = container.querySelector('.nav-more-btn');
    if (!btn) return;

    function toggle(open) {
      const isOpen = open !== undefined ? open : !container.classList.contains('open');
      if (isOpen) {
        moreContainers.forEach(other => {
          if (other === container) return;
          other.classList.remove('open');
          other.querySelector('.nav-more-btn')?.setAttribute('aria-expanded', 'false');
        });
      }
      container.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    // Native buttons activate through Enter and Space. Escape closes and
    // returns focus to the controlling button from anywhere in the menu.
    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !container.classList.contains('open')) return;
      e.preventDefault();
      toggle(false);
      btn.focus();
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) toggle(false);
    });

  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    moreContainers.forEach(container => {
      if (!container.classList.contains('open')) return;
      container.classList.remove('open');
      const btn = container.querySelector('.nav-more-btn');
      btn?.setAttribute('aria-expanded', 'false');
      btn?.focus();
    });
  });
}

/* --------------------------------------------------------------------------
   Portfolio Category Filter (V5.3)
   -------------------------------------------------------------------------- */
function initPortfolioFilters() {
  const btns = document.querySelectorAll('.portfolio-filter-btn');
  const cards = document.querySelectorAll('.portfolio-card');
  if (!btns.length || !cards.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}
