# Sri Subramaniar Alayam — App (browser + tablet kiosk + installable mobile app)
 
One responsive site — same code, same deploy — that works as a fixed touchscreen kiosk, a browsable website, and an installable PWA on phones/tablets. Content is edited live through two password-protected admin pages, no code editing, no GitHub account, and no redeploy needed for day-to-day updates:

- **`/cms.html`** — Hero Banner, Home Tiles, About Temple, Deities, Pooja Timings, Sevas & Donations, News & Announcements, Gallery, Membership, and Contact Us
- **`/admin-prayers.html`** — Prayers & Registration and Friday Annathanam

Both read from and write to the same Supabase (Postgres) database, and both are gated by the same `ADMIN_PASSWORD`. Neither page is linked from the site's main navigation — bookmark the URLs.

> **History note:** earlier versions of this project were built around a Decap CMS at `/admin/` that committed changes to `/content/*.json` on GitHub, and — before that — around a public Google Sheet the site fetched directly in the browser. Neither is used any more. The Decap CMS was documented but never actually deployed; the Google Sheet integration has been fully replaced by `/cms.html` below. `/content/*.json` and the bundled `content-data.js` still exist and are still what `build.js` generates on every deploy, but they now serve only as an **offline fallback** shown if Supabase is ever unreachable — see "How content flows".

## How content flows
```
/cms.html or /admin-prayers.html  →  Netlify Function (password-checked)  →  Supabase (Postgres)
                                                                                    │
index.html  ←  netlify/functions/cms-content.js, prayers-list.js, etc.  ←─────────┘
   (falls back to the bundled content-data.js only if Supabase is unreachable)
```
Edits take effect on the live site immediately — there's no rebuild/redeploy step for content changes. `content-data.js` is still regenerated from `/content/*.json` on every deploy (via `build.js`, see `netlify.toml`), but that's now just the offline-fallback path; the CMS pages never write to those JSON files.

## Site CMS (`/cms.html`) — one-time setup

Everything below reuses the same Supabase project and `ADMIN_PASSWORD` as **Annual Prayers & Registration** (see that section further down) — if you've already set that up, skip to step 2.

**1. Create a free Supabase project** (skip if you already have one for Annual Prayers)
- Go to https://supabase.com → sign up (free tier is enough) → **New project**

**2. Create the CMS tables**
- Supabase dashboard → **SQL Editor** → **New query**
- Paste in the entire contents of `supabase/cms-schema.sql` → **Run** (this also creates a public `temple-media` Storage bucket for uploaded photos)
- New query again → paste in the entire contents of `supabase/cms-seed.sql` → **Run** — this loads your site's real current content (as of when this CMS was built) into the new tables, so `/cms.html` starts out populated instead of empty. Skip this step if you'd rather start from blank/default content.
- If you had already run `cms-schema.sql` **before** the Membership status/search-by-No. update, also run `supabase/cms-members-status-migration.sql` once — it adds the `status` column and a search index to the existing `members` table. If this is a brand-new install, `cms-schema.sql` already includes it, so this extra file is not needed.
- Same security model as `schema.sql`: Row Level Security is on for every table with no public policies — the browser can never read/write these tables directly, only the Netlify Functions below can, using the `service_role` key.

**3. Add/confirm environment variables in Netlify**
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — same values as Annual Prayers, from **Project Settings → API**
- `ADMIN_PASSWORD` — same one used for `/admin-prayers.html`
- Trigger a redeploy so the new functions (`cms-content.js`, `cms-crud.js`, `cms-upload-image.js`, `cms-members.js`, and the rewritten `check-membership.js`) pick up the variables

**4. Open it**
- Go to `https://your-site.netlify.app/cms.html`, log in with `ADMIN_PASSWORD`
- Ten tabs: **Hero Banner**, **Home Tiles**, **About**, **Deities**, **Pooja Timings**, **Sevas**, **Announcements**, **Gallery**, **Membership**, **Contact Us**
- Photo fields (Hero background, Deity photos, Gallery photos) resize/compress in your browser and upload straight to Supabase Storage — no separate image hosting needed
- **Membership tab** replaces the old private Google Sheet entirely: add/edit/delete members one at a time, or use **Bulk Import** to paste CSV (`Name,NRIC,Membership No.,Membership Type,Status` — Status column is optional, defaults to Active) — this is also how to migrate your existing Members sheet: open it, File → Download → CSV, open that file in a text editor, paste the contents in
- Each member has a **Status** dropdown: `Active` (green dot), `Not Active` (red dot), or `Pending for Annual renewal` (red dot, per how it was specified) — shown next to the member's name in the CMS table, and on the public Membership Status result
- NRIC is still stored per member (for your own records) but is **never sent to the public Membership Status page** — visitors now look themselves up by **Membership No.** instead, since NRIC is a sensitive government ID number

**5. Test it**
- Edit the Hero Banner eyebrow text → Save → reload the live site → the change should appear immediately
- Membership Status (public page) → enter a Membership No. you added in the Membership tab → should show that member's details and status

## Annual Prayers & Registration — one-time setup

The site has a "Prayers & Registration" page listing every pooja/festival from the temple's annual schedule. For each one, devotees can see (and register for) up to three things:

- **Ubayakarar** — the Ubayam/pooja sponsor
- **Annathanam Sponsor** — the meal sponsor for that day. This is reserve-only: the site never collects payment for it, it just records who has claimed the slot. The devotee still arranges and pays the caterer directly — the page also lists the temple's regular caterers for that.
- **Participant** — for the poojas where individual participation is separate from sponsorship (e.g. Guru Peyarchi at RM 31/person), open while `participantsEnabled` is true for that entry.

A pooja is labelled **Upcoming** or **Completed** automatically, based on today's date vs. the pooja's date. Once a pooja is marked Completed, its recorded Ubayakarar, Annathanam sponsor, and (if applicable) full participant list stay visible — the temple's permanent record of who took part.

**The schedule and every registration now live in a real database (Supabase/Postgres)**, not a spreadsheet. This is what makes double-booking impossible even if two devotees submit the same Ubayakarar slot within the same second — the database locks the row and only lets one succeed — and it's what lets the committee view, edit, and print/export everything from `/admin-prayers.html` instead of opening a spreadsheet.

`content/annual-prayers.json` and `content/caterers.json` still exist in the repo, but only as a **fallback shown if the database is ever unreachable**. Once you complete the setup below, editing those files no longer changes anything on the live site — all day-to-day changes (new sponsor, reopening a slot, adding next year's dates, correcting a name) go through the admin page's **Schedule** tab instead.

**You need to do the following once — I can't create third-party accounts on your behalf:**

**1. Create a free Supabase project**
- Go to https://supabase.com → sign up (free tier is enough for this) → **New project**
- Pick any name/region, set a database password (you won't need it day-to-day — Supabase's own dashboard login is what you'll use), and wait ~2 minutes for it to provision

**2. Create the tables and functions**
- In the Supabase dashboard, open **SQL Editor** → **New query**
- Paste in the entire contents of `supabase/schema.sql` from this repo → **Run**
- New query again → paste in the entire contents of `supabase/seed.sql` → **Run** — this loads the same 2026 schedule and caterer list you sent, so you start with real data already in place
- (`schema.sql` locks the tables down with Row Level Security and no public policies — the browser can never read or write the database directly, only the site's server-side functions can, using the service key from step 3)

**3. Get your API credentials**
- In the Supabase dashboard: **Project Settings → API**
- Copy the **Project URL** and the **`service_role`** secret key (not the `anon` key — that one is intentionally not used anywhere in this project)

**4. Add environment variables in Netlify**
- Netlify dashboard → your site → **Project configuration → Environment variables → Add a variable**:
  - `SUPABASE_URL` — the Project URL from step 3
  - `SUPABASE_SERVICE_ROLE_KEY` — the `service_role` key from step 3
  - `ADMIN_PASSWORD` — a password of your choice for the committee's admin page (see below) — reuse the existing one if you already set this for another feature
- Trigger a redeploy (Netlify → Deploys → Trigger deploy) so the functions pick up the new variables
- Note: `PRAYERS_SHEET_ID` / `PRAYERS_SHEET_TAB` and the old Bookings Google Sheet are no longer used by this feature and can be left alone or removed

**5. Managing everything — `/admin-prayers.html`**
- Go to `https://your-site.netlify.app/admin-prayers.html`, log in with `ADMIN_PASSWORD`
- **Bookings tab:** filter/search every Ubayakarar, Annathanam, and Participant registration; mark one **Confirmed** once payment or the arrangement is verified, or **Cancelled** to automatically free that slot back up for someone else; **Print** or **Export CSV** the current filtered list
- **Schedule tab:** view, add, edit, or delete any pooja's date, fees, sponsor names, open/closed status, participant settings, and notes — changes take effect on the live site immediately, no redeploy needed. Deleting a pooja is blocked if it already has bookings recorded, to protect the temple's records. The same tab also manages the Annathanam caterer directory. **Print** or **Export CSV** the schedule here too.
- This page is not linked from the site's main navigation (committee-only, matches the pattern of other admin tooling in this project) — bookmark the URL

**6. Test it**
- Go to your site → Prayers & Registration → open a pooja that's still open → Register as Ubayakarar → submit with a test name/phone
- Refresh the Prayers & Registration page — that slot should now show as Reserved to every visitor, not just you
- Check `/admin-prayers.html` → Bookings tab shows the new registration; try the Schedule tab to edit a pooja's notes and confirm it updates live

## What's NOT in the CMS
Fixed interface chrome — the icon artwork itself (`ICONS` in `script.js`), the list of valid destination screens, and generic UI strings not tied to any one section (e.g. "Loading…", validation messages) — stays in `script.js`/`data.js` as developer-owned config. Everything the committee actually needs to update regularly is in `/cms.html` or `/admin-prayers.html` now, including the Home Tiles themselves (title, description, icon choice, and which screen each one opens).

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

