# VENERA manual Netlify deployment guide

This release uses manual uploads only. Do not connect the repository, enable continuous deployment, or configure automatic publishing.

## Manual publication or update

1. Confirm the release SHA-256 before upload:

   ```powershell
   Get-FileHash D:\venera_site\release\VENERA-Netlify-Manual.zip -Algorithm SHA256
   ```

2. Open the Netlify dashboard and sign in to the intended owner account.
3. For the existing site, open **Deploys** and choose the manual deploy area. For a first publication, choose **Add new project**, then **Deploy manually**.
4. Upload `D:\venera_site\dist\` in the manual deploy area. The archive at `D:\venera_site\release\VENERA-Netlify-Manual.zip` contains the same files at its root; if the dashboard does not accept ZIP files in its deploy area, extract it and upload the extracted folder.
5. Do not connect GitHub or enable automatic builds.
6. Do not upload `VENERA-Netlify-Manual.manifest.json` or its checksum sidecar as site content; they are owner-side release evidence.
7. Record the Netlify deploy identifier and complete `docs/V5_11_RELEASE_CHECKLIST.md` before accepting the update.

## Approved public URL

The approved origin is stored in `deployment/netlify/public-site-url.txt` as `https://veneratec.netlify.app`. Normal local builds now generate the approved canonical, `hreflang`, Open Graph, sitemap, and robots URLs without requiring a Netlify environment variable.

`VENERA_PUBLIC_SITE_URL` remains an explicit local override for a future owner-approved origin:

```powershell
$env:VENERA_PUBLIC_SITE_URL = 'https://OWNER-APPROVED-ORIGIN.example'
npm run build
npm run test:qa
npm run package:netlify
npm run test:dist
Remove-Item Env:VENERA_PUBLIC_SITE_URL
```

The override accepts an HTTPS origin only: no credentials, path, query, or fragment. Review the regenerated canonical, `hreflang`, social URL, sitemap, and robots entries before changing the approved source-controlled URL.

## Netlify settings

- Publish directory: the uploaded folder itself; its root must contain `index.html`, `_headers`, `_redirects`, `404.html`, `en/`, `ar/`, and `assets/`.
- Build command: none for manual deployment.
- Git integration: disabled.
- Pretty URLs: the current live site has this Netlify post-processing feature enabled. Keep it enabled for V5.11; canonical and sitemap URLs use `/en/`, `/ar/`, and extensionless page paths.
- Forms and Functions: leave disabled. The institutional inquiry form remains intentionally unavailable until an owner-approved endpoint exists.
- HSTS: do not add it to `_headers`. Netlify currently supplies HSTS on its own `netlify.app` hostname.

## Future updates

1. Edit and review the website locally.
2. Run `npm run build`, `npm run test:qa`, `npm run test:globe`, `npm run package:netlify`, and `npm run test:dist`.
3. Verify the ZIP checksum, external manifest, and release checklist.
4. Open the existing Netlify site's **Deploys** page.
5. Manually upload the new `dist` folder, or the extracted release ZIP if required by the dashboard.
6. Perform the post-deployment checklist.
7. Record the local Git SHA, ZIP SHA-256, deployment date, Netlify deploy identifier, and reviewer.
