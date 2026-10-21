# V5.12 Netlify Forms activation guide

The release package contains one bilingual static Netlify form named `venera-institutional-inquiry`. English and Arabic use the same stored field names and category values. The website performs a same-origin URL-encoded `POST`; it does not use a custom backend.

The form is **ready for owner activation, but live delivery is not yet verified**. A successful local mock or HTTP response cannot prove that Netlify recorded a production submission.

## Owner activation

1. Sign in to the owner-approved Netlify account and open the existing `veneratec` site.
2. Open **Forms**. If form detection is disabled, enable automatic form detection for this site.
3. Open **Deploys** and manually upload `release/VENERA-Netlify-Manual.zip`. Do not connect a Git repository or create a new site.
4. Wait for the deploy to finish, then confirm that Netlify lists a form named `venera-institutional-inquiry`.
5. Configure form-submission notifications using an email address explicitly approved by the owner. Do not invent or infer an address.
6. Open both `/en/contact` and `/ar/contact` and confirm that the form, privacy consent, warning, and localized category labels render correctly.
7. Send one controlled inquiry using non-sensitive test information. Do not attach or paste confidential documents, credentials, or financial records.
8. Confirm the controlled inquiry appears in the Netlify Forms dashboard under `venera-institutional-inquiry`.
9. Confirm the configured notification arrives at the owner-approved address, including checking its spam folder.
10. Repeat a visual and submission check from a mobile browser and review Netlify's spam classification.

Only after steps 7–9 succeed should the live form be described as operational.

## If detection or recording fails

- Do not display or communicate a successful-delivery claim.
- Verify that the uploaded ZIP root contains `en/contact.html`, `ar/contact.html`, and `assets/contact-form.css` rather than an extra parent directory.
- Verify the detected form name is exactly `venera-institutional-inquiry` and form detection is enabled.
- Fix the cause and create a new manual package. If the public form is misleading while troubleshooting, publish a known-safe package with the form disabled until a corrected package passes the dashboard test.
- Do not send repeated production probes containing real personal or confidential information.

## Stored schema

- `full_name` — required, maximum 120 characters
- `organization` — required, maximum 160 characters
- `job_title` — optional, maximum 120 characters
- `email` — required email, maximum 254 characters
- `category` — required, one of six stable values
- `message` — required, 20–4,000 characters
- `privacy_consent` — required and unchecked by default
- `bot-field` — honeypot

Netlify is identified in both localized privacy notices as the submission-processing provider. Deletion requests are directed to the existing contact page or the verified founder LinkedIn route until the owner approves a dedicated privacy address.
