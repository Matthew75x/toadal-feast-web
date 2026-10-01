# GitHub Pages staging status

The repository has a public GitHub Pages staging endpoint:
<https://matthew75x.github.io/toadal-feast-web/>.

The deployment workflow is restricted to `staging/live-visual`:
- Pushes to `staging/live-visual` deploy the committed `dist/` export.
- Manual dispatch is permitted only when run against `staging/live-visual`.
- `main`, other branches, production DNS, and production deployment are out of scope and are not deployment targets.
- The Studio-generated staging pages are public but marked `noindex,nofollow`; this is not access control. The embedded Wicked Bites preview remains a separate package and was not changed for this website-only staging task.

The workflow does not render the Studio project. For each staging update, run the following from the repository root in PowerShell, replacing `<Studio-install-root>` with the installed TOADAL Studio directory:

```powershell
$repo = (Get-Location).Path
$env:TOADAL_PROJECT = Join-Path $repo 'studio-project\toadal-feast-website\project.json'
$env:TOADAL_PREVIEW = Join-Path $repo 'dist'
Push-Location '<Studio-install-root>'
npm run validate
if ($LASTEXITCODE -ne 0) { throw 'Studio validation failed.' }
npm run render
if ($LASTEXITCODE -ne 0) { throw 'Studio render failed.' }
Pop-Location
```

Then apply and verify the GitHub project-site base path:

```powershell
node scripts/wo001-pages-basepath.mjs dist /toadal-feast-web/
node scripts/verify-pages-basepath.mjs dist /toadal-feast-web/
```

Review and commit the resulting `dist/` together with the Studio source change on `staging/live-visual`; the Pages Action publishes those committed bytes. The verification command checks the required root pages and that internal root-absolute links use the GitHub project-site base path.

Production DNS remains untouched.
