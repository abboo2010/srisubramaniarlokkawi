# Sri Subramaniar Alayam — App (browser + tablet kiosk + installable mobile app)
 
One responsive site — same code, same deploy — that works as a fixed touchscreen kiosk, a browsable website, and an installable PWA on phones/tablets. Content is edited through a proper admin dashboard (Decap CMS), no code editing needed for day-to-day updates.

## ⚠️ Deployment changed — read this first
Earlier versions of this app were deployed by dragging the folder onto Netlify. **The CMS requires a different setup**: it needs a real GitHub repo connected to Netlify, because saving in the CMS commits the change to that repo, which is what triggers Netlify to rebuild and republish. Drag-and-drop deploys have no repo to commit to, so the CMS won't work with that method anymore.

## One-time setup (you need to do this — I can't do it for you, it needs your own accounts)

Steps 1–2 (push to GitHub, connect to Netlify) are done for your site already. What's left is turning on login access for the CMS.

**Note on login method:** Netlify Identity (their old built-in login system) has been unreliable for newly created projects, so this CMS is configured to use **GitHub login** instead — simpler, and not affected by that issue. The trade-off: whoever edits content needs their own free GitHub account and to be added as a collaborator on the repo.

**3. Register a GitHub OAuth App**
- Go to https://github.com/settings/developers → **OAuth Apps → New OAuth App**
- Application name: anything (e.g. "Temple CMS")
- Homepage URL: `https://srisubramaniarlokkawi.netlify.app`
- **Authorization callback URL** (must be exact): `https://api.netlify.com/auth/done`
- Register → copy the **Client ID** → click **Generate a new client secret** → copy that too

**4. Add those to Netlify**
- Netlify dashboard → your site → **Project configuration → Access & security → OAuth**
- Under **Authentication Providers** → **Install provider** → choose **GitHub**
- Paste in the Client ID and Client Secret from step 3 → Save

**5. Give committee members access**
- On GitHub: go to the repo (`github.com/abboo2010/srisubramaniarlokkawi`) → **Settings → Collaborators** → **Add people** → enter their GitHub username or email
- They need to accept the invite (check their email/GitHub notifications)

**6. Open the CMS**
- Go to `https://srisubramaniarlokkawi.netlify.app/admin/`
- Click **Login with GitHub** → authorize → you're in

**5. Open the CMS**
- Go to `https://your-site.netlify.app/admin/`
- Log in with the invited email — you'll see the full dashboard: Deities, Event Calendar, Pooja Timings, News & Announcements, Sevas & Donations, Gallery, About the Temple, Contact & Bank Details, Temple Info
- Edit anything, hit **Publish** — Netlify rebuilds automatically and the live site updates in ~1 minute

## How content flows
```
CMS edit → commits JSON to /content/*.json on GitHub
         → Netlify runs `node build.js`
         → build.js reads /content/*.json → generates content-data.js
         → site publishes with the new content-data.js
```
You never touch `content-data.js` directly — it's regenerated fresh on every save. If you ever need to edit content without the CMS (e.g. bulk changes), edit the files in `/content/*.json` directly and push — same result.

## Membership Status check — one-time setup

The site has a "Membership Status" page where a visitor types their NRIC (`XXXXXX-XX-XXXX`) and sees their Name / NRIC / Membership No. / Membership Type. This is deliberately **not** built like the sheet-sync used elsewhere in this app — NRIC numbers are sensitive, so the full member list is never sent to visitors' browsers. Instead, a secure server-side function (`netlify/functions/check-membership.js`) looks up one NRIC at a time in a **separate, restricted** Google Sheet and returns only that one match.

**You need to do the following once — I can't do this part for you, it needs your own Google account:**

**1. Create the membership Google Sheet**
- Make a new, separate Google Sheet (do **not** reuse the "subramaniar" sheet)
- First row = headers, exactly: `Name`, `NRIC`, `Membership No.`, `Membership Type`
- Membership Type values should be exactly `Life` or `Ordinary`
- NRIC values should be in `XXXXXX-XX-XXXX` format
- Name the tab `Members` (or note your own tab name for step 5)
- **Do not** set sharing to "Anyone with the link" — leave it private. Access is granted only to the service account below.

**2. Create a Google Cloud service account**
- Go to https://console.cloud.google.com/ → create a project (or use an existing one)
- **APIs & Services → Library** → search "Google Sheets API" → **Enable**
- **APIs & Services → Credentials** → **Create Credentials → Service account** → give it any name (e.g. "temple-membership-check") → Create
- Open the new service account → **Keys** tab → **Add Key → Create new key → JSON** → this downloads a `.json` file — keep it safe, don't commit it to GitHub

**3. Share the Sheet with the service account**
- Open the downloaded JSON file, copy the `client_email` value (looks like `something@your-project.iam.gserviceaccount.com`)
- In your membership Google Sheet, click **Share** → paste that email → set to **Viewer** → Send/Share

**4. Add environment variables in Netlify**
- Netlify dashboard → your site → **Project configuration → Environment variables → Add a variable**, add all four:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the `client_email` from the JSON file
  - `GOOGLE_PRIVATE_KEY` — the `private_key` value from the JSON file (paste the whole thing, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
  - `MEMBERSHIP_SHEET_ID` — the long ID from the sheet's URL, e.g. in `https://docs.google.com/spreadsheets/d/THIS_PART/edit`, copy `THIS_PART`
  - `MEMBERSHIP_SHEET_TAB` — the tab name from step 1 (skip this variable entirely if you named it `Members`, since that's the default)
- Trigger a redeploy (Netlify → Deploys → Trigger deploy) so the function picks up the new variables

**5. Test it**
- Go to your site → Membership Status → enter an NRIC that exists in your sheet → should show the member's details
- Enter one that doesn't exist → should show "No membership record was found"

## What's NOT in the CMS
Interface text (nav labels, button text, section headings) and the home-screen tile blurbs stay in `data.js` as developer-owned config — they rarely change and aren't really "temple content." Everything the committee actually needs to update regularly (festival dates, announcements, sevas, deity info, photos, contact details) is in the CMS.

## Installing as a mobile app (PWA)
Once deployed:
- **Android (Chrome):** open the site → menu (⋮) → "Install app"
- **iPhone/iPad (Safari):** open the site → Share button → "Add to Home Screen" (this is iOS's only mechanism — it still installs as a real standalone app, just under a different button label)

Works offline after the first visit. If you change core files (not content — content updates work immediately) and want installed phones to pick up the change right away, bump `CACHE_NAME` in `service-worker.js`.

## Responsive layout
Same site adapts from the wide kiosk layout (left nav rail) down to phone width (nav becomes a slide-in ☰ drawer). Breakpoints are in `style.css` under "MOBILE / PHONE LAYOUT."

## Running it on the physical kiosk touch screen
Open the live Netlify URL in the browser's fullscreen/kiosk mode (e.g. Chrome `--kiosk https://your-site.netlify.app`). The idle timer (90s, in `script.js` as `IDLE_MS`) auto-returns to Home after inactivity.

## Local preview without any of the above
Just open `index.html` directly in a browser — `content-data.js` is already included pre-built in this folder, so you'll see real content. You just won't be able to install as a PWA or use the CMS from a local file (both need real HTTPS hosting).

