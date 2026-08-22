// ============================================================
// build.js — regenerates content-data.js from the /content/*.json
// files that the CMS (Decap) edits.
//
// Runs automatically on every Netlify deploy (see netlify.toml).
// You never need to run this by hand — saving in the CMS commits
// to /content, which triggers this build, which produces the
// content-data.js the live site actually loads.
// ============================================================
const fs = require("fs");
const path = require("path");

const CONTENT_DIR = path.join(__dirname, "content");

function readJSON(name) {
  const file = path.join(CONTENT_DIR, `${name}.json`);
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

const deities = readJSON("deities").items;
const events = readJSON("events").items;
const announcements = readJSON("announcements").items;
const sevas = readJSON("sevas").items;
const gallery = readJSON("gallery").items;
const about = readJSON("about");
const contact = readJSON("contact");
const templeInfo = readJSON("temple-info");
const poojaTimings = readJSON("pooja-timings");
const annualPrayers = readJSON("annual-prayers").items;
const caterers = readJSON("caterers").items;

const { donationAccount, ...contactRest } = contact;

const out = `// ============================================================
// AUTO-GENERATED FILE — do not edit by hand.
// Produced by build.js from the /content/*.json files, which are
// what the CMS at /admin actually edits. Every deploy regenerates
// this file fresh from that content.
// ============================================================

const TEMPLE_INFO = ${JSON.stringify(templeInfo, null, 2)};

const ABOUT = ${JSON.stringify(about, null, 2)};

const DEITIES = ${JSON.stringify(deities, null, 2)};

const POOJA_NAME = ${JSON.stringify(
  Object.fromEntries(poojaTimings.poojaNames.map(p => [p.key, { bm: p.bm, ta: p.ta }])),
  null, 2
)};
function poojaName(name){ return (POOJA_NAME[name] && POOJA_NAME[name][currentLang]) || name; }

const POOJA_TIMINGS_TODAY = ${JSON.stringify(poojaTimings.today, null, 2)};

const POOJA_TIMINGS_WEEKLY = ${JSON.stringify(poojaTimings.weekly, null, 2)};

const EVENTS = ${JSON.stringify(events, null, 2)};

const ANNOUNCEMENTS = ${JSON.stringify(announcements, null, 2)};

const SEVAS = ${JSON.stringify(sevas, null, 2)};

const GALLERY = ${JSON.stringify(gallery, null, 2)};

const ANNUAL_PRAYERS = ${JSON.stringify(annualPrayers, null, 2)};

const CATERERS = ${JSON.stringify(caterers, null, 2)};

const CONTACT = ${JSON.stringify(contactRest, null, 2)};

const DONATION_ACCOUNT = ${JSON.stringify(donationAccount, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, "content-data.js"), out);
console.log("✓ content-data.js generated from /content");
