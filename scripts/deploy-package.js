/** Build a deterministic, audited Netlify manual-upload release. */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const RELEASE = path.join(ROOT, 'release');
const ZIP = path.join(RELEASE, 'VENERA-Netlify-Manual.zip');
const SHA_FILE = `${ZIP}.sha256`;
const MANIFEST = path.join(RELEASE, 'VENERA-Netlify-Manual.manifest.json');
const NETLIFY_SOURCE = path.join(ROOT, 'deployment', 'netlify');
const TEXT_EXTENSIONS = new Set(['.html', '.css', '.js', '.json', '.txt', '.xml', '']);
const ASSET_EXTENSIONS = new Set(['.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.geojson', '.txt']);
const ALLOWED_EXTERNAL_HOSTS = new Set(['veneratec.netlify.app', 'fonts.googleapis.com', 'fonts.gstatic.com', 'www.linkedin.com', 'labs.cylendra.com', 'docs.veneraswap.com', 'schema.org', 'github.com', 'www.naturalearthdata.com', 'www.w3.org', 'www.sitemaps.org']);

function fail(message) { throw new Error(message); }
function normalize(value) { return value.replaceAll('\\', '/'); }
function relative(file) { return normalize(path.relative(ROOT, file)); }
function distRelative(file) { return normalize(path.relative(DIST, file)); }
function inside(parent, target) {
  const rel = path.relative(parent, target);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}
function safeRemove(target, parent) {
  if (!inside(parent, target) || target === parent) fail(`Refusing to remove unsafe path: ${target}`);
  fs.rmSync(target, { recursive: true, force: true });
}
function copyFile(source, destination) {
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) fail(`Required source file is missing: ${relative(source)}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
function copyHtmlDirectory(name) {
  const source = path.join(ROOT, name);
  const files = fs.readdirSync(source).filter(file => file.endsWith('.html')).sort();
  if (!files.length) fail(`No generated HTML found in ${name}/`);
  for (const file of files) copyFile(path.join(source, file), path.join(DIST, name, file));
}
function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }

function collectAssetReferences() {
  const queue = [path.join(ROOT, 'index.html'), ...walk(path.join(ROOT, 'en')), ...walk(path.join(ROOT, 'ar'))]
    .filter(file => file.endsWith('.html'));
  const assets = new Set();
  const scanned = new Set();
  while (queue.length) {
    const source = queue.shift();
    if (scanned.has(source)) continue;
    scanned.add(source);
    const content = fs.readFileSync(source, 'utf8');
    for (const match of content.matchAll(/(?:\.\.\/|\/)?assets\/([A-Za-z0-9_./-]+)/g)) {
      const asset = match[1].replace(/[?#].*$/, '');
      if (asset.includes('..')) fail(`Unsafe asset reference in ${relative(source)}: ${asset}`);
      if (!ASSET_EXTENSIONS.has(path.extname(asset).toLowerCase())) fail(`Unapproved asset type referenced: assets/${asset}`);
      if (assets.has(asset)) continue;
      assets.add(asset);
      const assetSource = path.join(ROOT, 'assets', ...asset.split('/'));
      if (!fs.existsSync(assetSource)) fail(`Referenced asset is missing: assets/${asset}`);
      if (['.css', '.js'].includes(path.extname(asset).toLowerCase())) queue.push(assetSource);
    }
  }
  if (assets.has('geography/ne_110m_land.geojson')) {
    assets.add('geography/NATURAL_EARTH_LICENSE.txt');
    assets.add('geography/SOURCE.txt');
  }
  return [...assets].sort();
}

function exactCaseExists(file) {
  if (!inside(DIST, file) || !fs.existsSync(file)) return false;
  let current = DIST;
  for (const part of path.relative(DIST, file).split(path.sep)) {
    if (!fs.readdirSync(current).includes(part)) return false;
    current = path.join(current, part);
  }
  return true;
}
function resolveLocalReference(source, value) {
  const clean = value.split('#')[0].split('?')[0];
  if (!clean || clean.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(clean)) return null;
  const decoded = decodeURI(clean);
  const target = decoded.startsWith('/') ? path.resolve(DIST, `.${decoded}`) : path.resolve(path.dirname(source), decoded);
  return target.endsWith(path.sep) ? path.join(target, 'index.html') : target;
}
function auditReferences() {
  const failures = [];
  for (const file of walk(DIST)) {
    const ext = path.extname(file).toLowerCase();
    if (!['.html', '.css', '.js'].includes(ext)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const refs = [];
    if (ext === '.html') for (const match of content.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) refs.push(match[1]);
    if (ext === '.css') for (const match of content.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) refs.push(match[1]);
    if (ext === '.js') for (const match of content.matchAll(/["'](\/assets\/[^"']+)["']/g)) refs.push(match[1]);
    for (const ref of refs) {
      const target = resolveLocalReference(file, ref);
      if (target && (!inside(DIST, target) || !exactCaseExists(target) || !fs.statSync(target).isFile())) failures.push(`${distRelative(file)} -> ${ref}`);
    }
  }
  if (failures.length) fail(`Broken or case-mismatched local references:\n${failures.map(item => `  ${item}`).join('\n')}`);
}

function auditPublicBoundary() {
  const forbiddenSegments = new Set(['.git', '.github', 'data', 'docs', 'scripts', 'design-prototypes', 'qa-screenshots', 'test-results', 'node_modules', 'deployment']);
  const forbiddenNames = new Set(['.env', 'site-content.js', 'build.js', 'qa-test.js', 'deploy-package.js']);
  const blockedFragments = ['_internalRegister', ['private-study', 'example', 'invalid'].join('.')];
  const violations = [];
  for (const file of walk(DIST)) {
    const rel = distRelative(file);
    const parts = rel.split('/');
    if (parts.some(part => forbiddenSegments.has(part)) || forbiddenNames.has(parts.at(-1)) || /(?:^|\/)\.env(?:\.|$)/.test(rel) || /\.map$/i.test(rel) || /\.md$/i.test(rel)) violations.push(`forbidden path: ${rel}`);
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const fragment of blockedFragments) if (content.includes(fragment)) violations.push(`confidential marker in ${rel}`);
    for (const match of content.matchAll(/https?:\/\/[^\s;"'<>)}]+/g)) {
      let host;
      try { host = new URL(match[0]).hostname.toLowerCase(); } catch { violations.push(`invalid external URL in ${rel}: ${match[0]}`); continue; }
      if (!ALLOWED_EXTERNAL_HOSTS.has(host)) violations.push(`unapproved external host ${host} in ${rel}`);
    }
  }
  if (violations.length) fail(`Public-boundary audit failed:\n${violations.map(item => `  ${item}`).join('\n')}`);
}

function validateNetlifyConfig() {
  const redirects = fs.readFileSync(path.join(DIST, '_redirects'), 'utf8');
  if (/\/\*\s+\/index\.html\s+200/.test(redirects)) fail('SPA catch-all redirect is forbidden');
  const headers = fs.readFileSync(path.join(DIST, '_headers'), 'utf8');
  for (const required of ['Content-Security-Policy:', 'X-Content-Type-Options:', 'Referrer-Policy:', 'X-Frame-Options:', 'Permissions-Policy:']) if (!headers.includes(required)) fail(`_headers is missing ${required}`);
  if (!/connect-src\s+'self'/.test(headers) || !/form-action\s+'self'/.test(headers)) fail('CSP must permit same-origin Netlify form submission');
  if (/Strict-Transport-Security:/i.test(headers)) fail('HSTS must not be enabled before production-domain validation');
}

function validateContactForms() {
  const fieldNames = ['form-name', 'bot-field', 'full_name', 'organization', 'job_title', 'email', 'category', 'message', 'privacy_consent'];
  const schemas = [];
  for (const lang of ['en', 'ar']) {
    const file = path.join(DIST, lang, 'contact.html');
    const html = fs.readFileSync(file, 'utf8');
    if (!/<form[^>]+name="venera-institutional-inquiry"[^>]+method="POST"[^>]+data-netlify="true"[^>]+netlify-honeypot="bot-field"/.test(html)) fail(`${lang}/contact.html is missing Netlify form detection markup`);
    if (!new RegExp(`action="/${lang}/contact"`).test(html)) fail(`${lang}/contact.html must post to its direct, non-root static route`);
    if (!/<input type="hidden" name="form-name" value="venera-institutional-inquiry">/.test(html)) fail(`${lang}/contact.html has an invalid hidden form-name`);
    for (const state of ['accepted', 'html-response', 'redirected', 'rejected', 'network-failure']) {
      if (!html.includes(`data-${state}-message=`)) fail(`${lang}/contact.html is missing truthful delivery state: ${state}`);
    }
    if (/accepted for processing|تم قبول استفسارك للمعالجة/.test(html)) fail(`${lang}/contact.html contains an unverified delivery claim`);
    for (const marker of ['data-required-message=', 'data-invalid-message=', 'data-too-short-message=', 'form-field-error']) {
      if (!html.includes(marker)) fail(`${lang}/contact.html is missing field-specific validation markup: ${marker}`);
    }
    const names = [...html.matchAll(/\bname="([^"]+)"/g)].map(match => match[1]).filter(name => fieldNames.includes(name));
    const schema = [...new Set(names)].sort();
    if (schema.length !== fieldNames.length || fieldNames.some(name => !schema.includes(name))) fail(`${lang}/contact.html has an incomplete form schema`);
    if (/type="file"/i.test(html)) fail(`${lang}/contact.html must not include file upload fields`);
    schemas.push(schema.join('|'));
  }
  if (schemas[0] !== schemas[1]) fail('English and Arabic contact form schemas differ');
}

function buildManifest() {
  const files = walk(DIST).map(file => {
    const body = fs.readFileSync(file);
    return { path: distRelative(file), bytes: body.length, sha256: sha256(body) };
  });
  const manifest = {
    format: 'venera-netlify-manual-v2',
    entrypoints: ['index.html', 'en/index.html', 'ar/index.html', '404.html'],
    canonicalDomainConfigured: fs.existsSync(path.join(DIST, 'sitemap.xml')),
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    files
  };
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function makeZip(files) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(distRelative(file), 'utf8');
    const body = fs.readFileSync(file);
    const compressed = zlib.deflateRawSync(body, { level: 9 });
    const crc = crc32(body);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10); local.writeUInt16LE(33, 12); local.writeUInt32LE(crc, 14); local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(body.length, 22); local.writeUInt16LE(name.length, 26);
    locals.push(local, name, compressed);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12); central.writeUInt16LE(33, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(compressed.length, 20); central.writeUInt32LE(body.length, 24); central.writeUInt16LE(name.length, 28); central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += local.length + name.length + compressed.length;
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

function run() {
  safeRemove(DIST, ROOT);
  fs.mkdirSync(DIST, { recursive: true });
  copyFile(path.join(ROOT, 'index.html'), path.join(DIST, 'index.html'));
  copyFile(path.join(ROOT, 'robots.txt'), path.join(DIST, 'robots.txt'));
  const sitemap = path.join(ROOT, 'sitemap.xml');
  if (fs.existsSync(sitemap)) copyFile(sitemap, path.join(DIST, 'sitemap.xml'));
  copyHtmlDirectory('en');
  copyHtmlDirectory('ar');
  for (const asset of collectAssetReferences()) copyFile(path.join(ROOT, 'assets', ...asset.split('/')), path.join(DIST, 'assets', ...asset.split('/')));
  for (const file of ['_headers', '_redirects', '404.html']) copyFile(path.join(NETLIFY_SOURCE, file), path.join(DIST, file));
  auditReferences();
  auditPublicBoundary();
  validateNetlifyConfig();
  validateContactForms();
  fs.mkdirSync(RELEASE, { recursive: true });
  safeRemove(ZIP, RELEASE);
  safeRemove(SHA_FILE, RELEASE);
  safeRemove(MANIFEST, RELEASE);
  const manifest = buildManifest();
  const zipBody = makeZip(walk(DIST));
  fs.writeFileSync(ZIP, zipBody);
  const zipHash = sha256(zipBody);
  fs.writeFileSync(SHA_FILE, `${zipHash}  ${path.basename(ZIP)}\n`);
  console.log(JSON.stringify({ dist: DIST, zip: ZIP, manifest: MANIFEST, sha256: zipHash, files: manifest.fileCount, bytes: zipBody.length, canonicalDomainConfigured: manifest.canonicalDomainConfigured }, null, 2));
}

try { run(); } catch (error) { console.error(`Deployment package failed: ${error.message}`); process.exitCode = 1; }
