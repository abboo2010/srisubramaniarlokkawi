# Sri Subramaniar Alayam — App (browser + tablet kiosk + installable mobile app)

One responsive site — same code, same deploy — that works as a fixed touchscreen kiosk, a browsable website, and an installable PWA on phones/tablets. Content is edited through a proper admin dashboard (Decap CMS), no code editing needed for day-to-day updates.

## ⚠️ Deployment changed — read this first
Earlier versions of this app were deployed by dragging the folder onto Netlify. **The CMS requires a different setup**: it needs a real GitHub repo connected to Netlify, because saving in the CMS commits the change to that repo, which is what triggers Netlify to rebuild and republish. Drag-and-drop deploys have no repo to commit to, so the CMS won't work with that method anymore.

## One-time setup (you need to do this — I can't do it for you, it needs your own accounts)

**1. Push this folder to a new GitHub repo**
- Create a new repo on github.com (can be private)
- Push everything in this `temple-kiosk` folder to it (a plain `git init` / `git add .` / `git commit` / `git push` from this folder works, or use GitHub Desktop if you prefer a GUI)

**2. Connect that repo to Netlify**
- In Netlify: **Add new site → Import an existing project → GitHub** → pick the repo
- Build settings should auto-detect from `netlify.toml` (Build command: `node build.js`, Publish directory: `.`) — confirm and deploy

**3. Enable Netlify Identity + Git Gateway** (this is what lets committee members log in to the CMS)
- In your Netlify site dashboard: **Site configuration → Identity → Enable Identity**
- Under Identity settings, set **Registration → Invite only** (so random people can't sign up)
- Still under Identity: **Services → Git Gateway → Enable Git Gateway**

**4. Invite whoever should be able to edit content**
- **Site configuration → Identity → Invite users** → enter their email
- They'll get an email to set a password — that's their CMS login

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

