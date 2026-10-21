# V5.12.2 Netlify Form Delivery Acceptance

## Confirmed diagnosis

The previous browser code treated every HTTP 2xx response as confirmed form delivery, displayed a green success message, and reset the form. A normal HTML page response therefore produced a false positive even though the response contained no evidence that Netlify stored the submission or sent its notification.

The live read-only inspection on 2026-10-22 confirmed that Netlify had detected both localized forms: the deployed HTML retained the hidden `form-name` value `venera-institutional-inquiry` after Netlify removed the build-time detection attributes. It also confirmed that the form action was `/`, while a GET to `/` was forcibly redirected to `/en/`. No production POST was made, so the exact server-side cause of the missing dashboard entry remains unverified.

## Corrected behavior

- English posts to `/en/contact`; Arabic posts to `/ar/contact`. Both routes returned HTTP 200 without a GET redirect during the live read-only check.
- The URL-encoded payload, shared form identity, field names, privacy consent, and honeypot are unchanged.
- A redirect is reported as unconfirmed delivery.
- An HTTP error and a network failure are reported separately.
- A 2xx HTML page response is reported as ambiguous.
- A non-HTML 2xx response is reported only as HTTP acceptance pending owner verification.
- Every transport outcome preserves the entered values. The browser never claims dashboard receipt or email delivery.

## Owner-controlled live acceptance

1. Manually upload the V5.12.2 ZIP and wait for the deploy to finish.
2. In Netlify, open **Forms** and confirm form detection is enabled and `venera-institutional-inquiry` remains listed under **Active forms**.
3. Open the deployed English or Arabic contact page in a private browser window.
4. Enter one clearly labeled, non-sensitive test inquiry. Do not include credentials, financial records, confidential documents, or personal data beyond the test contact details the owner elects to use.
5. Submit once and record the time, language, displayed status, request URL, final response URL, response status, and whether the request was redirected. Do not publish the payload.
6. In Netlify, open **Forms → venera-institutional-inquiry → Verified submissions** and look for the controlled inquiry.
7. Check the form's spam submissions as well. If it appears there, record that classification and review the honeypot/spam settings before changing source code.
8. Verify that the configured email recipient received the notification, including its spam or junk folder.
9. Record only the timestamp, dashboard result, spam result, and email result. Do not copy the inquiry contents into public QA artifacts.
10. Declare the form operational only when the inquiry is present in the Netlify dashboard. Treat email notification as a separate acceptance check.

If the request redirects, retain the browser evidence and review the deployed `_redirects` rules. If the request receives 2xx but never appears in verified or spam submissions, inspect the deploy's detected form schema, form usage limits, spam controls, and notification configuration in Netlify before another controlled test.
