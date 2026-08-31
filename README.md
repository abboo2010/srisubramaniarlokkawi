# Sri Subramaniar Alayam — App (browser + tablet kiosk + installable mobile app)
 
One responsive site — same code, same deploy — that works as a fixed touchscreen kiosk, a browsable website, and an installable PWA on phones/tablets. Content is edited live through two password-protected admin pages, no code editing, no GitHub account, and no redeploy needed for day-to-day updates:

- **`/cms.html`** — Hero Banner, Home Tiles, About Temple, Deities, Pooja Timings, Sevas & Donations, News & Announcements, Gallery, Membership, Contact Us, Notice Ticker, Home Popup, Push Notifications, and Admin Users
- **`/admin-prayers.html`** — Prayers & Registration and Friday Annathanam

Both read from and write to the same Supabase (Postgres) database. Each committee member logs in with their own **username and password** rather than one shared password — see "Individual Admin Logins" below. Neither page is linked from the site's main navigation — bookmark the URLs.

> **History note:** earlier versions of this project were built around a Decap CMS at `/admin/` that committed changes to `/content/*.json` on GitHub, and — before that — around a public Google Sheet the site fetched directly in the browser. Neither is used any more. The Decap CMS was documented but never actually deployed; the Google Sheet integration has been fully replaced by `/cms.html` below. `/content/*.json` and the bundled `content-data.js` still exist and are still what `build.js` generates on every deploy, but they now serve only as an **offline fallback** shown if Supabase is ever unreachable — see "How content flows".

## How content flows
```
/cms.html or /admin-prayers.html  →  Netlify Function (password-checked)  →  Supabase (Postgres)
                                                                                    │
index.html  ←  netlify/functions/cms-content.js, prayers-list.js, etc.  ←─────────┘
   (falls back to the bundled content-data.js only if Supabase is unreachable)
```
Edits take effect on the live site immediately — there's no rebuild/redeploy step for content changes. `content-data.js` is still regenerated from `/content/*.json` on every deploy (via `build.js`, see `netlify.toml`), but that's now just the offline-fallback path; the CMS pages never write to those JSON files.

## Individual Admin Logins — one-time setup

`/cms.html` and `/admin-prayers.html` used to share one password (`ADMIN_PASSWORD`) — anyone with it could do anything on either page, and there was no way to tell committee members apart or take away just one person's access. Now every committee member logs in with their own **username and password**, and you (as the **master account**) control exactly what each person can reach:

- **Content** (`/cms.html`) and **Prayers & Bookings** (`/admin-prayers.html`) are independent — grant either, both, or neither.
- A **master account** (like yours) can always reach everything, plus a new **Admin Users** tab (in `/cms.html`) to add committee members, change what they can access, reset a forgotten password, or remove a login — the system won't let you accidentally remove the last master account, so you can never lock yourself out.
- Turning off someone's access (or the whole account) takes effect immediately — they're logged out on their very next click, not whenever they'd otherwise be logged out.

**1. Add the new database table**
- Supabase dashboard → **SQL Editor** → **New query** → paste in the entire contents of `supabase/add-admin-users.sql` → **Run**. No data to seed — the very first login creates your master account automatically (step 3 below).
- If setting up Supabase fresh (running `schema.sql` for the first time), it already includes this table, so this migration isn't needed in that case.

**2. Add one new environment variable in Netlify**
- `ADMIN_JWT_SECRET` — a long random string used to sign login sessions (anything long and random works — e.g. generate one at https://www.uuidgenerator.net/ twice and paste them together, or run `openssl rand -hex 32` if you have a terminal handy). Keep `ADMIN_PASSWORD` too — it's still needed for your very first login below, and it's harmless to leave it in place after that.
- Trigger a redeploy so the new/updated functions pick up the variable.

**3. Your first login (one-time)**
- Go to either `/cms.html` or `/admin-prayers.html`. The login screen now asks for a **username** as well as a password.
- Type any username you want (e.g. `ravi`) and your existing `ADMIN_PASSWORD` as the password, then log in.
- This one-time-only login creates your account as the **master** account, with full access to everything — nothing else to do. Every login after this first one must be a real username + password from the Admin Users tab; `ADMIN_PASSWORD` is never checked again.

**4. Add the committee**
- In `/cms.html`, open the new **Admin Users** tab (only visible to a master account) → **+ Add Admin User** → pick a username and password for them, and tick Content / Prayers & Bookings / Master as appropriate → Save. Give them the username + password directly (in person, or however you'd normally share a password) — there's no email step.

**5. Test it**
- Log out (close the tab or clear it) and log back in with your master username/password — should work as before.
- Create a test committee login with just Content access → log in with it on `/admin-prayers.html` → should be refused with a clear message, but should work fine on `/cms.html`.
- From the Admin Users tab, try removing master status from your own (only) master account — should be refused, since the site can never be left with zero masters.

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
- `ADMIN_PASSWORD` and `ADMIN_JWT_SECRET` — see "Individual Admin Logins" above; `ADMIN_PASSWORD` is only used for your very first login
- Trigger a redeploy so the new functions (`cms-content.js`, `cms-crud.js`, `cms-upload-image.js`, `cms-members.js`, and the rewritten `check-membership.js`) pick up the variables

**4. Open it**
- Go to `https://your-site.netlify.app/cms.html` and log in (see "Individual Admin Logins" above for your first login)
- Tabs: **Hero Banner**, **Home Tiles**, **About**, **Committee**, **Deities**, **Pooja Timings**, **Sevas**, **Announcements**, **Gallery**, **Membership**, **Contact Us**, **Ticker**, **Home Popup**, **Push Notifications**
- Photo fields (Hero background, Deity photos, Gallery photos) resize/compress in your browser and upload straight to Supabase Storage — no separate image hosting needed
- **Membership tab** replaces the old private Google Sheet entirely: add/edit/delete members one at a time, or use **Bulk Import** to paste CSV (`Name,NRIC,Membership No.,Membership Type,Status` — Status column is optional, defaults to Active) — this is also how to migrate your existing Members sheet: open it, File → Download → CSV, open that file in a text editor, paste the contents in
- Each member has a **Status** dropdown: `Active` (green dot), `Not Active` (red dot), or `Pending for Annual renewal` (red dot, per how it was specified) — shown next to the member's name in the CMS table, and on the public Membership Status result
- NRIC is still stored per member (for your own records) but is **never sent to the public Membership Status page** — visitors now look themselves up by **Membership No.** instead, since NRIC is a sensitive government ID number

**5. Test it**
- Edit the Hero Banner eyebrow text → Save → reload the live site → the change should appear immediately
- Membership Status (public page) → enter a Membership No. you added in the Membership tab → should show that member's details and status

## Temple Committee — one-time setup

A new **"Temple Committee"** nav item sits right under **About Temple** on the public site, showing the President/Vice President, Officers (Secretary/Treasurer-style roles), Committee Members, Internal Auditors, and Trustees — editable from `/cms.html`'s new **Committee** tab.

**1. Add the new database table (and load the real committee list)**
- Supabase dashboard → **SQL Editor** → **New query** → paste in the entire contents of `supabase/add-committee.sql` → **Run** — this both creates the table and seeds it with the committee list from your org-chart image (names, roles, portfolios, phone numbers). Safe to re-run — it won't create duplicates.
- If setting up Supabase fresh (running `cms-schema.sql` + `cms-seed.sql` for the first time rather than as an existing install), those two files already include the `committee_members` table and the same seed data, so `add-committee.sql` isn't needed in that case.

**1b. If you already ran `add-committee.sql` before 2026-08-30** — run `supabase/add-committee-name-translations.sql` once too. Names originally weren't translated (so they stayed in English/Latin script even when the site was switched to Tamil); this adds a proper Tamil-script name for each of the 15 committee members, matching how Deity names already work. Safe to re-run, never overwrites a name you've since edited in the CMS.

**2. Nothing else to configure** — no new environment variables, reuses the same `ADMIN_PASSWORD`.

**3. Test it**
- Open the site → **Temple Committee** (below About Temple) → should show the org chart with everyone from the image
- Switch the language to Tamil → every name should now switch to Tamil script too, not just the role/portfolio labels
- In `/cms.html`'s **Committee** tab, edit someone's phone number → Save → reload the live site → the change should appear immediately
- Malay uses the same Name (English/Malay) field as English — Malay/Tamil role and portfolio titles, and the Tamil names, are Claude's own translation/transliteration, not reviewed by a Tamil/Malay speaker on the committee — edit them any time from the same tab if the committee wants different wording

## Page Headings & Menu Labels — one-time setup

Two new tabs in `/cms.html` — **Page Headings** and **Menu Labels** — make the site's chrome text editable without a code change:

- **Page Headings**: the title + subtitle shown at the top of each screen (e.g. "Temple Management Committee" / "Meet the committee members serving..."). One row per screen.
- **Menu Labels**: the text next to each icon in the side menu (e.g. "Temple Committee", "Pooja Timings"). One row per menu item, including Home.

Both are fixed lists — every row already exists (seeded below), so you only ever click **Edit**, never Add or Delete. Malay/Tamil fields fall back to the English text on the live site if left blank.

**1. Add the two new database tables (and seed today's live text)**
- Supabase dashboard → **SQL Editor** → **New query** → paste in the entire contents of `supabase/add-page-headings-and-menu-labels.sql` → **Run** — this creates both tables and seeds every row with the exact text the site already shows, so running it changes nothing until you actually edit something. Safe to re-run — it never overwrites an edit you've already made.
- If setting up Supabase fresh (running `cms-schema.sql` + `cms-seed.sql` for the first time), those two files already include both tables and the same seed data, so this migration isn't needed in that case.

**2. Nothing else to configure** — no new environment variables, reuses the same `ADMIN_PASSWORD`.

**3. Test it**
- In `/cms.html` → **Page Headings** tab, edit any screen's Heading/Subtitle in English, Malay, or Tamil → Save → reload the live site (switch language too) → the change should appear immediately
- In `/cms.html` → **Menu Labels** tab, do the same for a side-menu item's wording
- If a heading or menu item ever looks wrong on the live site (including the current Malay/Tamil wording, which is Claude's own translation and hasn't been reviewed by a Malay/Tamil speaker on the committee), this is now where to fix it — no code delivery needed.

## Home Popup — one-time setup

A popup can now show once to each visitor right when they enter the site (after tapping **Enter** on the splash screen) — a welcome message, a one-off notice, an event reminder, a festival poster, whatever's needed. It can include a photo and a button that jumps straight to any page on the site (Sevas, Gallery, Prayers & Registration, etc.). They close it with the **×** button, by tapping outside it, or by tapping the photo/button (which also navigates them where the link points). It then stays closed for the rest of that visit. Fully editable from `/cms.html`'s new **Home Popup** tab — starts **off** and empty, so nothing appears on the site until you turn it on.

**1. Add the new database table**
- Supabase dashboard → **SQL Editor** → **New query** → paste in the entire contents of `supabase/add-site-popup.sql` → **Run** — creates the table (title/message/photo/link, all optional except the on/off switch), seeded off and blank. Safe to re-run — never overwrites anything you've since edited in the CMS.
- If setting up Supabase fresh (running `cms-schema.sql` for the first time), it already includes this table, so this migration isn't needed in that case.
- **Already ran an earlier version of `add-site-popup.sql`** (before the Photo/Link fields existed)? Run `supabase/add-site-popup-image-link.sql` once instead — it just adds the two new columns to your existing table, without touching anything you've already written.

**2. Nothing else to configure** — no new environment variables, reuses the same login.

**3. Test it**
- In `/cms.html` → **Home Popup** tab, tick **Enabled**, write a Message (Title is optional), Save
- Reload the live site (or open it in a new private/incognito window) → tap **Enter** on the splash screen → the popup should appear
- Close it (× button or tap outside) → keep browsing → the popup should not reappear until you reload/reopen the site
- Optional: upload a **Popup Photo** (same auto-resize-in-browser upload as Hero Banner/Deities/Gallery — pick a file, it uploads itself) and pick a page under **Goes To** (e.g. "Sevas & Donations") — the popup then shows a button (customizable text, defaults to "View") that jumps straight there, and tapping the photo does the same
- Leave **Goes To** on "— No link —" for a plain informational popup with no button
- Untick **Enabled** and Save any time to turn it off again without losing what you wrote

## Push Notifications — one-time setup

Visitors can tap the bell icon in the top bar (next to EN/BM/Tamil) to turn on notifications for that device. From the **Push Notifications** tab in `/cms.html`, type a title and message and press Send — every device currently subscribed gets it right away. This is a free browser feature (the "Web Push" standard) — it doesn't need a paid Supabase or Netlify plan, and there's no per-notification cost or limit from either of them.

**1. Add the new database table**
- Supabase dashboard → **SQL Editor** → **New query** → paste in the entire contents of `supabase/add-push-notifications.sql` → **Run**

**2. Add three new environment variables in Netlify**
- `VAPID_PUBLIC_KEY` = `BE1CchgL8b29u88JqWShwxoMmz1NBI37bXL25dE1bZr6WLaxmpkyUKKLBD2rKJrkq5281niBV5KwB02lcC6HlEg`
- `VAPID_PRIVATE_KEY` = `ykPvIxOSK-VHCZg69zpXboUUuql-gVM7HmwLg6b-QGs`
- `VAPID_SUBJECT` = `mailto:` followed by an email address the browser vendors (Apple/Google/Mozilla) can contact if something's ever wrong with how the site sends notifications — this is never shown to visitors, e.g. `mailto:temple@example.com`

These two keys are a matched pair generated specifically for this site — treat `VAPID_PRIVATE_KEY` like a password (Netlify environment variables are already private, so just don't share it elsewhere). If it's ever leaked, generate a fresh pair (any "web-push VAPID key generator" works) and update both this variable and `VAPID_PUBLIC_KEY` in Netlify **and** the matching `VAPID_PUBLIC_KEY` constant near the top of the Push Notifications section in `script.js` — the public key must match in both places or new subscriptions will fail.

- Trigger a redeploy so the new functions (`push-subscribe.js`, `cms-push-send.js`) pick up the variables

**3. Test it**
- On your own phone or laptop, open the live site and tap the bell icon → allow notifications when the browser asks
- In `/cms.html` → **Push Notifications** tab, it should show "1 device(s) currently subscribed" (or more, if others already opted in)
- Send a test notification → it should arrive within a few seconds, even if the site's tab/app isn't open — tapping it opens the site

**Good to know:**
- **Android phones/tablets and desktop browsers (Chrome, Edge, Firefox)** can turn notifications on directly from the site, no install needed.
- **iPhone/iPad (Safari)** requires the visitor to first "Add to Home Screen" — only after that will the bell icon work. This is an Apple platform rule (since iOS 16.4), not something this app can bypass. The Push Notifications tab in the CMS shows this reminder.
- A device stops receiving notifications if the visitor turns the bell off, uninstalls the app, clears their browser data, or (rarely) the push service reports the subscription as gone — in every case it's removed from the subscriber count automatically, no cleanup needed on your end.
- No visitor's name, phone number, or any personal detail is ever collected by this feature — only an anonymous per-device subscription used to deliver the notification.

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
  - `ADMIN_PASSWORD` and `ADMIN_JWT_SECRET` — see "Individual Admin Logins" near the top of this README; `ADMIN_PASSWORD` is only used for your very first login, reuse the existing one if you already set this for another feature
- Trigger a redeploy (Netlify → Deploys → Trigger deploy) so the functions pick up the new variables
- Note: `PRAYERS_SHEET_ID` / `PRAYERS_SHEET_TAB` and the old Bookings Google Sheet are no longer used by this feature and can be left alone or removed

**5. Managing everything — `/admin-prayers.html`**
- Go to `https://your-site.netlify.app/admin-prayers.html` and log in (see "Individual Admin Logins" near the top of this README for your first login)
- **Bookings tab:** filter/search every Ubayakarar, Annathanam, and Participant registration; mark one **Confirmed** once payment or the arrangement is verified, or **Cancelled** to automatically free that slot back up for someone else; **Print** or **Export CSV** the current filtered list
- **Schedule tab:** view, add, edit, or delete any pooja's date, fees, sponsor names, open/closed status, participant settings, notes, and **Category** (Annual / Monthly / Special — see below) — changes take effect on the live site immediately, no redeploy needed. Deleting a pooja is blocked if it already has bookings recorded, to protect the temple's records. The same tab also manages the Annathanam caterer directory. **Print** or **Export CSV** the schedule here too.
- This page is not linked from the site's main navigation (committee-only, matches the pattern of other admin tooling in this project) — bookmark the URL

**Pooja Categories (Annual / Monthly / Special)** — added per the temple treasurer's request. Every pooja belongs to one of three schedules:
- **Annual Prayers/Poojas** — the original schedule; every existing pooja is automatically in this category, nothing moves on its own.
- **Monthly Prayers/Poojas** — for recurring monthly events.
- **Special Prayers/Poojas** — for one-off special events.

Set a pooja's category from its **Category** dropdown in the Add/Edit Pooja form (Schedule tab) — the same "Ref #, Date, Name" area at the top. On the public site, Prayers & Registration now shows three tabs (Annual / Monthly / Special) above the existing Upcoming/Completed/All filter — visitors pick a schedule first, then narrow by status within it, same as before. If this is a fresh install, `schema.sql` already includes the `category` column — nothing extra to run. If you already had the Annual Prayers tables set up before this update, run `supabase/add-prayer-categories.sql` once in the Supabase SQL Editor (safe to re-run; every existing pooja becomes "Annual" automatically).

Under **Monthly** and **Special**, a second row of tabs appears automatically to split poojas by their recurring identity (e.g. Bairavar / Shasthi / Pournami) whenever a category has more than one in it — since these repeat every month, this keeps the schedule from turning into one long mixed pile of similarly-named cards. Tapping **Monthly Prayers/Poojas** shows these tabs with one of them already selected (the first alphabetically) and its poojas already showing below — tapping a different one (e.g. Bairavar) narrows the grid down to just that pooja's own occurrences (all its months, under whatever status filter — Upcoming/Completed/All — is picked), same as tapping Annual/Monthly/Special itself narrows to a whole schedule. Same behavior under **Special**.

Annual keeps its original flat list, no sub-tabs (its events are mostly one-off and unique by name, so splitting wouldn't help there).

**Pooja Type field (what groups the sub-tabs)** — a **Pooja Type** field appears in the Add/Edit Pooja form (Schedule tab) whenever Category is set to Monthly or Special (hidden for Annual, which has no sub-tabs). This is what decides which sub-tab a pooja lands on — set it to `Bairavar` on every month's Bairavar pooja and they all land on the same "Bairavar" tab on the public site, no matter what each occurrence is named or dated. Start typing and existing types already in use for that category show up as suggestions, so recurring poojas stay spelled consistently — or type a brand-new one (e.g. `Pournami`) to create that sub-tab on the spot, no code change needed. Leaving it blank falls back to using the pooja's own Name as its type, so a pooja never silently disappears from the tab list. The Schedule tab's toolbar also gets a **Pooja Type** filter (next to the Category filter, shown once Monthly or Special is picked) and its own column in the table, so you can find and manage all of one recurring pooja's entries at a glance — and adding another month's occurrence for any type is the same **+ Add Pooja** button as always, just with this field filled in to match.

If this is a fresh install, `schema.sql` already includes the `pooja_type` column — nothing extra to run. If you already had the Prayer Categories feature set up before this update, run `supabase/add-prayer-pooja-type.sql` once in the Supabase SQL Editor — it adds the column and auto-fills Pooja Type for every existing Monthly/Special pooja by reading it out of that pooja's current name (so your existing ~15+ entries don't need retyping by hand), then leaves any pooja you've since set by hand untouched. Safe to re-run.

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

