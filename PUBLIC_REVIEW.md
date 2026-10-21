# VENERA Technology V5.12.2 Public Review Snapshot

This branch is a sanitized source snapshot prepared for independent code review. It contains the complete static-site generator, bilingual generated pages, public assets, Canvas Digital Earth implementation, contact-form integration, QA scripts, and Netlify manual packaging configuration.

## Build and test

```text
npm ci
npm run build
npm run test:qa
npm run test:globe
npm run test:contact
npm run package:netlify
npm run test:dist
```

The contact-form test intercepts and mocks every submission request. It does not send production inquiries.

## Publication boundary

The public snapshot deliberately excludes:

- development screenshots and visual prototypes;
- generated `dist/`, release ZIPs, and dependency folders;
- environment files, browser profiles, sessions, and local databases;
- internal planning documents and private opportunity records;
- real inquiry payloads or contact-form submissions.

The private-record visibility regression uses synthetic `.invalid` fixtures. Those fixtures exist only in source tests and are blocked from generated deployment output.

The branch was prepared as a snapshot on the established public-review lineage. It does not inherit the private development commits used to assemble the production website.

## Snapshot verification

- locked dependency install: passed, 0 reported vulnerabilities;
- bilingual build: passed, 18 English and 18 Arabic pages;
- browser QA: 100/100 passed;
- contact-form suite: passed with every POST mocked and 0 live submissions;
- Digital Earth production geometry, drag, touch, visibility, reduced-motion, asset and packaging checks: passed;
- approved-prototype pixel comparison: not run because the development prototype is intentionally excluded;
- Netlify package: passed, 78 files, SHA-256 `31a10464983cc74d107e2772b528a6a4c9a64e92b0db26708133fb723e1e3fc3`;
- packaged `dist/` browser, route, SEO, gallery, globe and security-header checks: passed.
