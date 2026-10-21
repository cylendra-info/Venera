/**
 * VENERA Technology — Deployment Package Builder
 * Assembles a clean dist/ directory containing only public-facing files.
 * Excludes: source scripts, QA screenshots, internal docs, git metadata,
 * node_modules, and any stale build artifacts.
 *
 * Usage: node scripts/deploy-package.js
 * Prerequisites: run `node scripts/build.js` first.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Top-level files required in every deployment package
const INCLUDE_FILES = [
  'index.html',
  'robots.txt',
];

// sitemap.xml included only if present (requires verified canonicalDomain)
const INCLUDE_IF_PRESENT = [
  'sitemap.xml',
];

// Directories copied wholesale (with per-dir filtering)
const INCLUDE_DIRS = [
  'en',
  'ar',
  'assets',
  'data',
];

// Extensions allowed inside assets/ — blocks accidental source-file inclusion
const ALLOWED_ASSET_EXTENSIONS = new Set([
  '.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg',
  '.ico', '.woff', '.woff2', '.ttf', '.otf',
]);

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest, filterFn) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d, filterFn);
    } else if (!filterFn || filterFn(entry.name)) {
      copyFile(s, d);
    }
  }
}

function assetsFilter(name) {
  return ALLOWED_ASSET_EXTENSIONS.has(path.extname(name).toLowerCase());
}

// Remove existing dist/
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
  console.log('✓ Cleared existing dist/');
}
fs.mkdirSync(DIST, { recursive: true });

// Copy required top-level files
let failed = false;
for (const file of INCLUDE_FILES) {
  const src = path.join(ROOT, file);
  if (!fs.existsSync(src)) {
    console.error(`✗ Required file missing: ${file}`);
    failed = true;
    continue;
  }
  copyFile(src, path.join(DIST, file));
  console.log(`  ✓ ${file}`);
}
if (failed) process.exit(1);

// Copy optional files
for (const file of INCLUDE_IF_PRESENT) {
  const src = path.join(ROOT, file);
  if (fs.existsSync(src)) {
    copyFile(src, path.join(DIST, file));
    console.log(`  ✓ ${file} (present)`);
  } else {
    console.log(`  — ${file} absent (canonicalDomain not configured — correct)`);
  }
}

// Copy directories
for (const dir of INCLUDE_DIRS) {
  const src = path.join(ROOT, dir);
  if (!fs.existsSync(src)) {
    console.error(`✗ Required directory missing: ${dir}/`);
    process.exit(1);
  }
  const filter = dir === 'assets' ? assetsFilter : null;
  copyDir(src, path.join(DIST, dir), filter);
  console.log(`  ✓ ${dir}/`);
}

// Domain audit — no unapproved domains in dist/ HTML
console.log('\n--- Domain audit of dist/ ---');
let domainViolations = 0;
function auditDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { auditDir(full); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const content = fs.readFileSync(full, 'utf8');
    if (content.includes('veneratech.com')) {
      console.error(`  ✗ DOMAIN VIOLATION: veneratech.com found in ${path.relative(DIST, full)}`);
      domainViolations++;
    }
  }
}
auditDir(DIST);
if (domainViolations === 0) {
  console.log('  ✓ No unapproved domains in dist/ HTML');
} else {
  console.error(`  ✗ ${domainViolations} domain violation(s) found — fix before deployment`);
  process.exit(1);
}

// Print manifest
console.log('\n--- Deployment manifest ---');
function printManifest(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    if (e.isDirectory()) {
      const items = fs.readdirSync(path.join(dir, e.name), { recursive: true }).length;
      console.log(`  ${e.name}/ (${items} items)`);
    } else {
      const bytes = fs.statSync(path.join(dir, e.name)).size;
      console.log(`  ${e.name} (${(bytes / 1024).toFixed(1)} KB)`);
    }
  }
}
printManifest(DIST);
console.log('\n✓ dist/ package ready');
