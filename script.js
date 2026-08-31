// ============================================================
// Sri Subramaniar Alayam — Kiosk App Logic
// Supports three languages: en, bm, ta. Switching languages
// re-renders every screen's content, not just labels.
// ============================================================

// SPLASH SCREEN — wired up FIRST, before anything else in this file
// runs. If a content edit (CMS, sheet, JSON) later causes a rendering
// error further down, the Enter button must still work so nobody
// gets permanently stuck on the splash screen because of a data
// problem elsewhere on the site.
(function setUpSplashScreenEarly(){
  const splash = document.getElementById("splashScreen");
  const enterBtn = document.getElementById("splashEnterBtn");
  if (!splash || !enterBtn) return;
  enterBtn.addEventListener("click", () => {
    splash.classList.add("splash-hide");
    if (typeof resetIdleTimer === "function") resetIdleTimer();
    setTimeout(() => { splash.style.display = "none"; }, 650);
    // Entering the site is "arriving at the home page" for the Home
    // Popup's once-per-visit trigger (see the HOME POPUP section
    // further down) — guarded since this early block runs before the
    // rest of the file, but the click itself can only happen after
    // the whole script has finished loading, so the function always
    // exists by the time a visitor actually clicks Enter.
    if (typeof homePopupOnVisitStart === "function") homePopupOnVisitStart();
  });
})();

let currentLang = "en";

// Bundled default for the notice ticker. Declared HERE, not in
// content-data.js, on purpose: content-data.js is regenerated from
// scratch by build.js on every Netlify deploy (it reads /content/*.json,
// which the ticker feature doesn't exist in) — anything hand-added
// there gets silently discarded on the next deploy. Putting it in
// script.js instead means it always exists, however content-data.js
// is built. This is only the fallback used if Supabase is unreachable
// or the site_ticker table hasn't been created yet — the CMS-edited
// version always takes priority once it loads (see loadLiveContent()).
const TICKER = {
  enabled: true,
  message_en: "⚠️ WEBSITE UNDER CONSTRUCTION: Information displayed is for testing/reference only and has not yet been reviewed or approved by the Temple Management Committee. Please do not treat it as official or final.",
  message_bm: "⚠️ LAMAN WEB DALAM PEMBINAAN: Maklumat yang dipaparkan adalah untuk tujuan ujian/rujukan sahaja dan belum disemak atau diluluskan oleh Jawatankuasa Pengurusan Kuil. Sila jangan anggap ia sebagai rasmi atau muktamad.",
  message_ta: "⚠️ இணையதளம் கட்டுமானத்தில் உள்ளது: இங்கு காட்டப்படும் தகவல்கள் சோதனை/குறிப்புக்காக மட்டுமே, மேலும் இது இன்னும் கோயில் நிர்வாகக் குழுவால் சரிபார்க்கப்படவோ அங்கீகரிக்கப்படவோ இல்லை. தயவுசெய்து இதை உத்தியோகபூர்வமானதாகவோ இறுதியானதாகவோ கருத வேண்டாம்."
};

// Bundled default for the Home Popup (editable from /cms.html's Home
// Popup tab). Declared HERE, not in content-data.js, for the exact same
// reason as TICKER above. Starts disabled on purpose — nothing should
// pop up for visitors until Ravi actually writes a message and turns
// it on from the CMS.
const POPUP = {
  enabled: false,
  title_en: "", title_bm: "", title_ta: "",
  message_en: "", message_bm: "", message_ta: "",
  image_url: "",
  link_target: "",
  // Claude's own translation, not reviewed by a Tamil/Malay speaker on
  // the committee — freely editable any time from the CMS's Home Popup
  // tab, same caveat as every other bundled default text in this file.
  link_label_en: "View", link_label_bm: "Lihat", link_label_ta: "பார்க்க"
};

// Bundled default for the Temple Committee screen. Declared HERE, not in
// content-data.js, for the exact same reason as TICKER above — this is
// only the offline fallback; the CMS-edited version (from the new
// committee_members table) always takes priority once it loads.
let COMMITTEE = {
  president: [
    { name_en: "Capt. Shamala Devi Muniandy", name_ta: "கேப்டன் ஷமளா தேவி முனியாண்டி", role_en: "President", role_bm: "Presiden", role_ta: "தலைவர்", subtitle_en: "", subtitle_bm: "", subtitle_ta: "", phone: "012-2487718" }
  ],
  vicePresident: [
    { name_en: "Mr. Balachandran Ramachandran", name_ta: "திரு. பாலச்சந்திரன் ராமச்சந்திரன்", role_en: "Vice President", role_bm: "Naib Presiden", role_ta: "துணைத் தலைவர்", subtitle_en: "", subtitle_bm: "", subtitle_ta: "", phone: "011-31559091" }
  ],
  officer: [
    { name_en: "Mr. Muniswaran Kalimuthu", name_ta: "திரு. முனீஸ்வரன் காளிமுத்து", role_en: "Secretary", role_bm: "Setiausaha", role_ta: "செயலாளர்", subtitle_en: "", subtitle_bm: "", subtitle_ta: "", phone: "012-5852978" },
    { name_en: "Mr. Ravivarman Abboo", name_ta: "திரு. ரவிவர்மன் அப்பு", role_en: "Asst. Secretary", role_bm: "Penolong Setiausaha", role_ta: "உதவி செயலாளர்", subtitle_en: "IT & Technology", subtitle_bm: "IT & Teknologi", subtitle_ta: "தகவல் தொழில்நுட்பம்", phone: "010-9482080" },
    { name_en: "Mdm. Kamaleswari Kaliaperumal", name_ta: "திருமதி. கமலேஸ்வரி காளியப்பெருமாள்", role_en: "Treasurer", role_bm: "Bendahari", role_ta: "பொருளாளர்", subtitle_en: "", subtitle_bm: "", subtitle_ta: "", phone: "016-3519068" },
    { name_en: "Mdm. Parimalah Krishnan", name_ta: "திருமதி. பரிமளா கிருஷ்ணன்", role_en: "Asst. Treasurer", role_bm: "Penolong Bendahari", role_ta: "உதவி பொருளாளர்", subtitle_en: "", subtitle_bm: "", subtitle_ta: "", phone: "016-8054722" }
  ],
  member: [
    { name_en: "Mdm. Jeya Devi Gunaratnam", name_ta: "திருமதி. ஜெயா தேவி குணரத்தினம்", role_en: "Committee Member", role_bm: "Ahli Jawatankuasa", role_ta: "குழு உறுப்பினர்", subtitle_en: "Supritendant & Rituals", subtitle_bm: "Penyelia & Upacara", subtitle_ta: "மேற்பார்வையாளர் & சடங்குகள்", phone: "012-2094421" },
    { name_en: "Mr. Mohan M. Raju", name_ta: "திரு. மோகன் எம். ராஜு", role_en: "Committee Member", role_bm: "Ahli Jawatankuasa", role_ta: "குழு உறுப்பினர்", subtitle_en: "Maintenance", subtitle_bm: "Penyelenggaraan", subtitle_ta: "பராமரிப்பு", phone: "016-8390184" },
    { name_en: "Mr. Pavithran Kunhappnair", name_ta: "திரு. பவித்திரன் குன்ஹப்நாயர்", role_en: "Committee Member", role_bm: "Ahli Jawatankuasa", role_ta: "குழு உறுப்பினர்", subtitle_en: "Inventory", subtitle_bm: "Inventori", subtitle_ta: "சரக்கு", phone: "013-8949509" },
    { name_en: "Mr. Navinkumar Sivakumar", name_ta: "திரு. நவீன்குமார் சிவகுமார்", role_en: "Committee Member", role_bm: "Ahli Jawatankuasa", role_ta: "குழு உறுப்பினர்", subtitle_en: "", subtitle_bm: "", subtitle_ta: "", phone: "019-2457724" },
    { name_en: "Mr. Sivaguru Subramaniam", name_ta: "திரு. சிவகுரு சுப்ரமணியம்", role_en: "Committee Member", role_bm: "Ahli Jawatankuasa", role_ta: "குழு உறுப்பினர்", subtitle_en: "", subtitle_bm: "", subtitle_ta: "", phone: "011-17841871" }
  ],
  auditor: [
    { name_en: "Mr. Batumalai Veruthasalam", name_ta: "திரு. பத்துமலை வேருதசலம்" },
    { name_en: "Major B. Shuras Batumalai (Rtd)", name_ta: "மேஜர் பி. ஷூரஸ் பத்துமலை (ஓய்வு)" }
  ],
  trustee: [
    { name_en: "Mr. Gunasekaran Rajangam", name_ta: "திரு. குணசேகரன் ராஜாங்கம்" },
    { name_en: "Mr. Kalaichelvan Govindaraja", name_ta: "திரு. கலைச்செல்வன் கோவிந்தராஜா" }
  ]
};

function eventTitle(ev){
  if (currentLang === "ta" && ev.title_ta) return ev.title_ta;
  if (currentLang === "bm" && ev.title_bm) return ev.title_bm;
  return ev.title;
}
function eventDesc(ev){
  if (currentLang === "ta" && ev.desc_ta) return ev.desc_ta;
  if (currentLang === "bm" && ev.desc_bm) return ev.desc_bm;
  return ev.desc || "";
}
// Extracts just the first sentence from a longer text, for preview lists.
// Returns the whole string unchanged if there's only one sentence.
function firstSentence(text){
  if (!text) return "";
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0] : text;
}
function t(key){ return (UI[currentLang] && UI[currentLang][key]) || UI.en[key] || ""; }
function tf(obj, field){ return obj[field + "_" + currentLang] || obj[field + "_en"]; }

const ICONS = {
  about: `<path d="M4 21 V9 L12 3 L20 9 V21 M9 21 V14 H15 V21" stroke-linecap="round" stroke-linejoin="round"/>`,
  deities: `<circle cx="12" cy="8" r="3.4"/><path d="M6 21 C6 16 8.5 13.5 12 13.5 C15.5 13.5 18 16 18 21" stroke-linecap="round"/>`,
  calendar: `<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10 H20.5 M8 3 V6.5 M16 3 V6.5" stroke-linecap="round"/>`,
  timings: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5 V12 L15.2 14" stroke-linecap="round" stroke-linejoin="round"/>`,
  sevas: `<path d="M12 21 C7 17 3.5 13.8 3.5 9.9 C3.5 7.2 5.6 5 8.2 5 C9.8 5 11.1 5.8 12 7 C12.9 5.8 14.2 5 15.8 5 C18.4 5 20.5 7.2 20.5 9.9 C20.5 13.8 17 17 12 21 Z" stroke-linejoin="round"/>`,
  prayers: `<path d="M12 3 C13 6 15 8 15 11 C15 13.5 13.5 15 12 15 C10.5 15 9 13.5 9 11 C9 8 11 6 12 3 Z" stroke-linejoin="round"/><path d="M6 19 C6 17 8.5 15.5 12 15.5 C15.5 15.5 18 17 18 19" stroke-linecap="round"/><path d="M4 19 H20" stroke-linecap="round"/>`,
  fridayAnnathanam: `<path d="M5 11 C5 16 8 20 12 20 C16 20 19 16 19 11" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 11 H20" stroke-linecap="round"/><path d="M9 11 V6.5 C9 5 10.5 4 12 4" stroke-linecap="round"/><circle cx="12" cy="3.3" r="0.9" fill="currentColor" stroke="none"/>`,
  membership: `<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="8.5" cy="12" r="2.1"/><path d="M5.3 16.3 C5.3 14.8 6.7 13.7 8.5 13.7 C10.3 13.7 11.7 14.8 11.7 16.3" stroke-linecap="round"/><path d="M13.8 10.3 H18.3 M13.8 13.3 H16.8" stroke-linecap="round"/>`,
  gallery: `<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.7"/><path d="M4 17.5 L9.5 12.5 L13 15.5 L16.5 12 L20.5 16" stroke-linecap="round" stroke-linejoin="round"/>`,
  committee: `<circle cx="12" cy="7.3" r="2.6"/><path d="M6.5 20 C6.5 16.3 8.9 14.3 12 14.3 C15.1 14.3 17.5 16.3 17.5 20" stroke-linecap="round"/><circle cx="5" cy="9.5" r="2"/><path d="M1.6 19 C1.6 16.3 3 14.7 5 14.7 C5.7 14.7 6.4 14.9 6.9 15.3" stroke-linecap="round"/><circle cx="19" cy="9.5" r="2"/><path d="M22.4 19 C22.4 16.3 21 14.7 19 14.7 C18.3 14.7 17.6 14.9 17.1 15.3" stroke-linecap="round"/>`
};

const PANEL_COLORS = ["#711821", "#8f202b", "#c1531f", "#3e7c52", "#2b1b12", "#8e4a9e", "#3e7c8c", "#b5651d"];
const GALLERY_ICON = `<rect x="4" y="4" width="16" height="16" rx="2" stroke="#fff" stroke-width="1.4" fill="none"/><circle cx="9" cy="9" r="1.6" stroke="#fff" stroke-width="1.3" fill="none"/><path d="M5 16 L9.5 11.5 L13 14.5 L16 11.5 L19 15" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

function el(html){
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// ---------- Navigation ----------
const screens = document.querySelectorAll(".screen");
const railBtns = document.querySelectorAll(".rail-btn");
const crumb = document.getElementById("crumb");
const CRUMB_KEY = {
  home:"navHome", about:"navAbout", committee:"navCommittee", deities:"navDeities", calendar:"navCalendar",
  timings:"navTimings", gallery:"navGallery", sevas:"navSevas", prayers:"navPrayers",
  fridayAnnathanam:"navFridayAnnathanam", news:"navNews",
  membership:"navMembership", contact:"navContact"
};
let currentScreen = "home";

function goTo(name){
  currentScreen = name;
  // Entering the Gallery screen always starts back at the top level
  // (Categories) — otherwise a visitor who drilled into a Folder,
  // wandered to another screen, and came back would land wherever
  // they left off, which reads as broken rather than intentional.
  if (name === "gallery"){ resetGalleryView(); renderGallery(); }
  screens.forEach(s => s.classList.toggle("active", s.id === "screen-" + name));
  railBtns.forEach(b => b.classList.toggle("active", b.dataset.screen === name));
  crumb.textContent = t(CRUMB_KEY[name]) || t("navHome");
  document.getElementById("screenWrap").scrollTop = 0;
  closeMobileNav();
  resetIdleTimer();
}

railBtns.forEach(b => b.addEventListener("click", () => goTo(b.dataset.screen)));
document.querySelectorAll("[data-goto]").forEach(b =>
  b.addEventListener("click", () => goTo(b.dataset.goto))
);

// ---------- Mobile nav drawer ----------
const railEl = document.querySelector(".rail");
const railBackdrop = document.getElementById("railBackdrop");
const hamburgerBtn = document.getElementById("hamburgerBtn");
function openMobileNav(){ railEl.classList.add("open"); railBackdrop.classList.add("show"); }
function closeMobileNav(){ railEl.classList.remove("open"); railBackdrop.classList.remove("show"); }
hamburgerBtn.addEventListener("click", openMobileNav);
railBackdrop.addEventListener("click", closeMobileNav);

// ---------- Language switching ----------
document.querySelectorAll(".lang-pill button").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".lang-pill button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentLang = btn.dataset.lang;
    document.documentElement.lang = currentLang;
    renderAll();
  });
});

// ---------- Clock ----------
const CLOCK_LOCALE = { en: "en-MY", bm: "ms-MY", ta: "ta-MY" };
function tickClock(){
  const now = new Date();
  const locale = CLOCK_LOCALE[currentLang] || "en-MY";
  document.getElementById("clockTime").textContent = now.toLocaleTimeString(locale, { hour:"2-digit", minute:"2-digit" });
  document.getElementById("clockDate").textContent = now.toLocaleDateString(locale, { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
}
tickClock();
setInterval(tickClock, 1000 * 15);

// ---------- Idle timer (kiosk returns Home after inactivity) ----------
let idleTimer, idleWarnTimer;
const IDLE_MS = 90000;
function resetIdleTimer(){
  clearTimeout(idleTimer);
  clearTimeout(idleWarnTimer);
  document.getElementById("idleBadge").classList.remove("show");
  idleTimer = setTimeout(()=>{
    document.getElementById("idleBadge").classList.add("show");
    idleWarnTimer = setTimeout(()=>{ goTo("home"); }, 2500);
  }, IDLE_MS);
}
["click","touchstart","mousemove"].forEach(evt =>
  document.addEventListener(evt, resetIdleTimer, { passive:true })
);
resetIdleTimer();

// ============================================================
// STATIC TEXT (nav, headings, buttons, labels)
// ============================================================
function renderStaticText(){
  document.querySelectorAll("[data-i18n]").forEach(elmt=>{
    elmt.textContent = t(elmt.dataset.i18n);
  });

  document.getElementById("railHoursTitle").textContent = t("railHoursTitle");
  document.getElementById("railBrandTitle").innerHTML = t("railBrandLine1") + "<br/>" + t("railBrandLine2");
  document.getElementById("railBrandLoc").textContent = t("railBrandLoc");
  document.getElementById("railMorningLabel").textContent = t("railMorning");
  document.getElementById("railEveningLabel").textContent = t("railEvening");

  crumb.textContent = t(CRUMB_KEY[currentScreen]) || t("navHome");

  document.getElementById("heroEyebrow").textContent = t("heroEyebrow");
  document.getElementById("heroTitleLine1").textContent = t("heroTitleLine1");
  document.getElementById("heroTitleLine2").textContent = t("heroTitleLine2");
  document.getElementById("heroBtnEvents").textContent = t("heroBtnEvents");
  document.getElementById("heroBtnTimings").textContent = t("heroBtnTimings");
  document.getElementById("statEstablishedLabel").textContent = t("statEstablished");
  document.getElementById("statDevoteesLabel").textContent = t("statDevotees");
  document.getElementById("statEventsLabel").textContent = t("statEvents");

  document.getElementById("panelTodayTimingsLabel").textContent = t("panelTodayTimings");
  document.getElementById("panelUpcomingEventsLabel").textContent = t("panelUpcomingEvents");
  document.getElementById("panelNewsAnnouncementsLabel").textContent = t("panelNewsAnnouncements");
  document.getElementById("btnViewFullTimings").textContent = t("btnViewFullTimings");
  document.getElementById("btnViewFullCalendar").textContent = t("btnViewFullCalendar");
  document.getElementById("btnNewsAnnouncements").textContent = t("btnNewsAnnouncements");

  document.getElementById("velBlessingText").textContent = t("velBlessing");
  document.getElementById("velBlessingDescText").textContent = t("velBlessingDesc");

  document.getElementById("aboutHeadingText").textContent = t("aboutHeading");
  document.getElementById("aboutSubText").textContent = t("aboutSub");
  document.getElementById("aboutHistoryTitleText").textContent = t("aboutHistoryTitle");
  document.getElementById("aboutVisionTitleText").textContent = t("aboutVisionTitle");
  document.getElementById("aboutMissionTitleText").textContent = t("aboutMissionTitle");
  document.getElementById("aboutActivitiesTitleText").textContent = t("aboutActivitiesTitle");

  document.getElementById("committeeHeadingText").textContent = t("committeeHeading");
  document.getElementById("committeeSubText").textContent = t("committeeSub");
  document.getElementById("committeeOfficersLabelText").textContent = t("committeeOfficersLabel");
  document.getElementById("committeeMembersLabelText").textContent = t("committeeMembersLabel");
  document.getElementById("committeeAuditorsLabelText").textContent = t("committeeAuditorsLabel");
  document.getElementById("committeeTrusteesLabelText").textContent = t("committeeTrusteesLabel");

  document.getElementById("deitiesHeadingText").textContent = t("deitiesHeading");
  document.getElementById("deitiesSubText").textContent = t("deitiesSub");

  document.getElementById("calendarHeadingText").textContent = t("calendarHeading");
  document.getElementById("calendarSubText").textContent = t("calendarSub");
  document.getElementById("calToday").textContent = t("calToday");

  document.getElementById("timingsHeadingText").textContent = t("timingsHeading");
  document.getElementById("timingsSubText").textContent = t("timingsSub");

  document.getElementById("galleryHeadingText").textContent = t("galleryHeading");
  document.getElementById("gallerySubText").textContent = t("gallerySub");
  document.getElementById("galleryBackLabel").textContent = t("galleryBack");

  document.getElementById("sevasHeadingText").textContent = t("sevasHeading");
  document.getElementById("sevasSubText").textContent = t("sevasSub");
  document.getElementById("donateBannerTitleText").textContent = t("donateBannerTitle");
  document.getElementById("donateBannerDescText").textContent = t("donateBannerDesc");

  document.getElementById("newsHeadingText").textContent = t("newsHeading");
  document.getElementById("newsSubText").textContent = t("newsSub");

  document.getElementById("membershipHeadingText").textContent = t("membershipHeading");
  document.getElementById("membershipSubText").textContent = t("membershipSub");
  document.getElementById("membershipInputLabel").textContent = t("membershipInputLabel");
  document.getElementById("membershipNoInput").placeholder = t("membershipPlaceholder");
  document.getElementById("membershipCheckBtnText").textContent = t("membershipCheckBtn");
  document.getElementById("membershipHintText").textContent = t("membershipHint");
  document.getElementById("membershipResultNameLabel").textContent = t("membershipResultName");
  document.getElementById("membershipResultNoLabel").textContent = t("membershipResultNo");
  document.getElementById("membershipResultTypeLabel").textContent = t("membershipResultType");
  document.getElementById("membershipResultStatusLabel").textContent = t("membershipResultStatus");
  document.getElementById("membershipPrintBtnText").textContent = t("membershipPrintBtn");

  document.getElementById("contactHeadingText").textContent = t("contactHeading");
  document.getElementById("contactSubText").textContent = t("contactSub");
  document.getElementById("enquiriesTitleText").textContent = t("enquiriesTitle");
  document.getElementById("whatsappCaptionText").textContent = t("whatsappCaption");

  document.getElementById("qrEyebrowText").textContent = t("qrScanToPay");
  document.getElementById("qrNoteText").textContent = t("qrNote");

  document.getElementById("idleBadgeText").textContent = t("idleReturning");
}

// ============================================================
// HOME
// ============================================================
function renderHomeTiles(){
  const tileGrid = document.getElementById("homeTiles");
  tileGrid.innerHTML = "";
  const iconMap = { about: ICONS.about, committee: ICONS.committee, deities: ICONS.deities, calendar: ICONS.calendar, timings: ICONS.timings, sevas: ICONS.sevas, prayers: ICONS.prayers, fridayAnnathanam: ICONS.fridayAnnathanam, membership: ICONS.membership, gallery: ICONS.gallery };
  TILE_META.forEach(tItem=>{
    // "icon" picks the artwork and "destination" picks the screen it opens —
    // separate fields (both editable in /cms.html's Home Tiles tab) so a
    // tile's icon and its link no longer have to be the same fixed key.
    // Falls back to the "about" icon if an unrecognized icon key ever
    // reaches here, so a tile never renders with a missing icon.
    const icon = iconMap[tItem.icon] || iconMap.about;
    const dest = tItem.destination || tItem.key;
    const btn = el(`
      <button class="tile" data-goto="${dest}">
        <div class="tile-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${icon}</svg></div>
        <h3>${tItem.title[currentLang]}</h3>
        <p>${tItem.desc[currentLang]}</p>
      </button>
    `);
    btn.addEventListener("click", ()=>goTo(dest));
    tileGrid.appendChild(btn);
  });
}

function renderHomeTimings(){
  const homeTimings = document.getElementById("homeTimings");
  homeTimings.innerHTML = "";
  POOJA_TIMINGS_TODAY.slice(0,5).forEach(p=>{
    homeTimings.appendChild(el(`<div class="list-row"><b>${poojaName(p.name)}</b><span>${p.time}</span></div>`));
  });
}

const today = new Date();
const todayIso = today.toISOString().slice(0,10);

function renderHomeEvents(){
  const homeEvents = document.getElementById("homeEvents");
  homeEvents.innerHTML = "";
  getCalendarEvents().sort((a,b)=> a.iso.localeCompare(b.iso))
    .filter(e => e.iso >= todayIso)
    .slice(0,3)
    .forEach(e=>{
      const row = el(`
        <div class="event-row">
          <div class="event-date"><b>${dayNum(e.iso)}</b><small>${monthAbbr(e.iso)}</small></div>
          <div><h4>${eventTitle(e)}</h4><p>${formatEventDate(e.iso)}</p></div>
        </div>
      `);
      row.addEventListener("click", () => openEventModal(e));
      homeEvents.appendChild(row);
    });
}

function renderHomeAnnounce(){
  const homeAnnounce = document.getElementById("homeAnnounce");
  homeAnnounce.innerHTML = "";
  ANNOUNCEMENTS.slice(0,3).forEach(a=>{
    const row = el(`
      <div class="announce-row">
        <div class="announce-dot"></div>
        <div><h4>${tf(a,"title")}</h4><p>${firstSentence(tf(a,"desc"))}</p></div>
      </div>
    `);
    row.addEventListener("click", () => openAnnounceModal(a));
    homeAnnounce.appendChild(row);
  });
}

// ============================================================
// ABOUT
// ============================================================
function renderAbout(){
  const aboutHistoryEl = document.getElementById("aboutHistory");
  aboutHistoryEl.innerHTML = "";
  (ABOUT["history_" + currentLang] || ABOUT.history_en).forEach(item =>
    aboutHistoryEl.appendChild(el(`<p>${(item && item.paragraph) || item}</p>`))
  );
  document.getElementById("aboutVision").textContent = ABOUT["vision_" + currentLang] || ABOUT.vision_en;
  document.getElementById("aboutMission").textContent = ABOUT["mission_" + currentLang] || ABOUT.mission_en;

  const actWrap = document.getElementById("aboutActivities");
  actWrap.innerHTML = "";
  (ABOUT["activities_" + currentLang] || ABOUT.activities_en).forEach(item =>
    actWrap.appendChild(el(`<span class="pill-tag">${(item && item.activity) || item}</span>`))
  );
}

// ============================================================
// TEMPLE COMMITTEE
// ============================================================
// A person card used for President/Vice President/Officers/Members —
// a gold initials-circle stands in for a photo (none were supplied),
// name, role, and an optional portfolio subtitle/phone.
function committeePersonCard(m, cardClass){
  const name = tf(m, "name");
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const subtitle = tf(m, "subtitle");
  return `
    <div class="${cardClass}">
      <div class="committee-avatar">${initial}</div>
      <div class="committee-person-info">
        <div class="committee-role">${tf(m,"role")}</div>
        <div class="committee-name">${name}</div>
        ${subtitle ? `<div class="committee-subtitle">${subtitle}</div>` : ""}
        ${m.phone ? `<div class="committee-phone">${m.phone}</div>` : ""}
      </div>
    </div>
  `;
}
function committeeListRow(m){
  return `<li>${tf(m, "name")}</li>`;
}
function renderCommittee(){
  const leadWrap = document.getElementById("committeeLeadership");
  leadWrap.innerHTML =
    COMMITTEE.president.map(m => committeePersonCard(m, "committee-lead-card")).join("") +
    COMMITTEE.vicePresident.map(m => committeePersonCard(m, "committee-lead-card")).join("");

  document.getElementById("committeeOfficers").innerHTML =
    COMMITTEE.officer.map(m => committeePersonCard(m, "committee-officer-card")).join("");

  document.getElementById("committeeMembers").innerHTML =
    COMMITTEE.member.map(m => committeePersonCard(m, "committee-member-card")).join("");

  const auditorsWrap = document.getElementById("committeeAuditors");
  const trusteesWrap = document.getElementById("committeeTrustees");
  auditorsWrap.innerHTML = COMMITTEE.auditor.map(committeeListRow).join("");
  trusteesWrap.innerHTML = COMMITTEE.trustee.map(committeeListRow).join("");

  // If a section ends up with nobody in it (e.g. a fresh CMS setup with
  // no Auditors added yet), hide the whole card instead of showing an
  // empty heading with a blank list underneath.
  document.getElementById("committeeAuditorsCard").style.display = COMMITTEE.auditor.length ? "" : "none";
  document.getElementById("committeeTrusteesCard").style.display = COMMITTEE.trustee.length ? "" : "none";
  document.getElementById("committeeOfficersRow").style.display = COMMITTEE.officer.length ? "" : "none";
  document.getElementById("committeeMemberGrid").style.display = COMMITTEE.member.length ? "" : "none";
}

// ============================================================
// DEITIES
// ============================================================
function renderDeities(){
  const deityGrid = document.getElementById("deityGrid");
  deityGrid.innerHTML = "";
  DEITIES.forEach(d=>{
    const card = el(`
      <div class="deity-card">
        <div class="deity-figure"><img src="${d.image}" alt="${tf(d,"name")}" loading="lazy" /></div>
        <div class="deity-body">
          <h3>${tf(d,"name")}</h3>
          <div class="deity-role">${tf(d,"role")}</div>
          <p>${tf(d,"description")}</p>
        </div>
      </div>
    `);
    card.addEventListener("click", () => openDeityModal(d));
    deityGrid.appendChild(card);
  });
}

const deityOverlay = document.getElementById("deityOverlay");
function openDeityModal(d){
  document.getElementById("deityModalImg").src = d.image;
  document.getElementById("deityModalImg").alt = tf(d, "name");
  document.getElementById("deityModalName").textContent = tf(d, "name");
  document.getElementById("deityModalRole").textContent = tf(d, "role");
  document.getElementById("deityModalDesc").textContent = tf(d, "description");
  deityOverlay.classList.add("show");
}
function closeDeityModal(){ deityOverlay.classList.remove("show"); }
document.getElementById("deityModalClose").addEventListener("click", closeDeityModal);
deityOverlay.addEventListener("click", (e)=>{ if(e.target === deityOverlay) closeDeityModal(); });

// ============================================================
// EVENT CALENDAR (Google-Calendar-style month grid)
// ============================================================
// The calendar's sole data source is Annual Prayers (ANNUAL_PRAYERS, from
// Supabase) — added/edited once in admin-prayers.html's Schedule tab,
// visible on both the Prayers & Registration page and here. The old
// Events Google Sheet is deliberately no longer read for this (see
// loadLiveContent()), so the same festival can never show up twice from
// two different sources.
function prayerToCalendarEvent(p){
  // Pooja names in ANNUAL_PRAYERS aren't translated per-language (same
  // pattern the prayer cards themselves already use), so reuse the one
  // name across en/bm/ta here too.
  return {
    iso: p.date,
    title: p.name, title_bm: p.name, title_ta: p.name,
    desc: p.notes || "", desc_bm: p.notes || "", desc_ta: p.notes || "",
    isPrayer: true, prayerId: p.id
  };
}
function getCalendarEvents(){
  return (typeof ANNUAL_PRAYERS !== "undefined" ? ANNUAL_PRAYERS : []).map(prayerToCalendarEvent);
}

// eventsByDate is rebuilt on every render (not built once at load) — this
// matters because ANNUAL_PRAYERS gets replaced with fresh data from
// Supabase after the page has already loaded, and this lookup needs to
// stay in sync with whatever it currently holds.
function buildEventsByDate(){
  const map = {};
  getCalendarEvents().forEach(e => { (map[e.iso] = map[e.iso] || []).push(e); });
  return map;
}

const MONTH_NAMES = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  bm: ["Januari","Februari","Mac","April","Mei","Jun","Julai","Ogos","September","Oktober","November","Disember"],
  ta: ["ஜனவரி","பிப்ரவரி","மார்ச்","ஏப்ரல்","மே","ஜூன்","ஜூலை","ஆகஸ்ட்","செப்டம்பர்","அக்டோபர்","நவம்பர்","டிசம்பர்"]
};
const WEEKDAY_LABELS = {
  en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  bm: ["Ahd","Isn","Sel","Rab","Kha","Jum","Sab"],
  ta: ["ஞாயி","திங்","செவ்","புத","வியா","வெள்","சனி"]
};
const WEEKDAY_FULL = {
  en: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  bm: ["Ahad","Isnin","Selasa","Rabu","Khamis","Jumaat","Sabtu"],
  ta: ["ஞாயிறு","திங்கள்","செவ்வாய்","புதன்","வியாழன்","வெள்ளி","சனி"]
};
const MONTH_ABBR = {
  en: ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],
  bm: ["JAN","FEB","MAC","APR","MEI","JUN","JUL","OGO","SEP","OKT","NOV","DIS"],
  ta: ["ஜன","பிப்","மார்","ஏப்","மே","ஜூன்","ஜூலை","ஆக","செப்","அக்","நவ","டிச"]
};
function dayNum(iso){ return iso.split("-")[2]; }
function monthAbbr(iso){
  const m = Number(iso.split("-")[1]) - 1;
  return (MONTH_ABBR[currentLang] || MONTH_ABBR.en)[m];
}
function formatEventDate(iso){
  const [y,m,d] = iso.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  const weekdays = WEEKDAY_FULL[currentLang] || WEEKDAY_FULL.en;
  const months = MONTH_NAMES[currentLang] || MONTH_NAMES.en;
  return `${weekdays[dt.getDay()]}, ${String(d).padStart(2,"0")} ${months[m-1]} ${y}`;
}

let calMonth = today.getMonth();
let calYear = today.getFullYear();

function isoOf(y,m,d){ return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }

function renderCalendarWeekdays(){
  const calWeekdays = document.getElementById("calWeekdays");
  calWeekdays.innerHTML = "";
  (WEEKDAY_LABELS[currentLang] || WEEKDAY_LABELS.en).forEach(w => calWeekdays.appendChild(el(`<div>${w}</div>`)));
}

function renderCalendarGrid(){
  const grid = document.getElementById("calGrid");
  grid.innerHTML = "";
  const eventsByDate = buildEventsByDate();
  const monthNames = MONTH_NAMES[currentLang] || MONTH_NAMES.en;
  document.getElementById("calMonthLabel").textContent = `${monthNames[calMonth]} ${calYear}`;

  const firstOfMonth = new Date(calYear, calMonth, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  for(let i=0;i<totalCells;i++){
    let cellDay, cellMonth, cellYear, otherMonth = false;
    if(i < startOffset){
      cellDay = daysInPrevMonth - startOffset + i + 1;
      cellMonth = calMonth - 1; cellYear = calYear;
      if(cellMonth < 0){ cellMonth = 11; cellYear--; }
      otherMonth = true;
    } else if(i >= startOffset + daysInMonth){
      cellDay = i - startOffset - daysInMonth + 1;
      cellMonth = calMonth + 1; cellYear = calYear;
      if(cellMonth > 11){ cellMonth = 0; cellYear++; }
      otherMonth = true;
    } else {
      cellDay = i - startOffset + 1;
      cellMonth = calMonth; cellYear = calYear;
    }

    const iso = isoOf(cellYear, cellMonth, cellDay);
    const isToday = iso === todayIso;
    const dayEvents = eventsByDate[iso] || [];

    const cell = el(`<div class="cal-cell${otherMonth ? " other-month" : ""}${isToday ? " today" : ""}">
      <div class="cal-day-num">${cellDay}</div>
    </div>`);

    dayEvents.slice(0,2).forEach(ev=>{
      const chip = el(`<button class="cal-event-chip" title="${eventTitle(ev)}">${eventTitle(ev)}</button>`);
      chip.addEventListener("click", ()=>openEventModal(ev));
      cell.appendChild(chip);
    });
    if(dayEvents.length > 2){
      cell.appendChild(el(`<div class="cal-more">+${dayEvents.length-2}</div>`));
    }
    grid.appendChild(cell);
  }

  renderMonthEventList();
}

function renderMonthEventList(){
  const calendarList = document.getElementById("calendarList");
  calendarList.innerHTML = "";
  const monthNames = MONTH_NAMES[currentLang] || MONTH_NAMES.en;
  document.getElementById("calendarListHeading").textContent = `${monthNames[calMonth]} ${calYear} ${t("calEventsSuffix")}`;

  const monthPrefix = `${calYear}-${String(calMonth+1).padStart(2,"0")}`;
  const monthEvents = getCalendarEvents().filter(e => e.iso.startsWith(monthPrefix)).sort((a,b)=> a.iso.localeCompare(b.iso));

  if(monthEvents.length === 0){
    calendarList.appendChild(el(`<p style="font-size:13px;color:var(--ink-600);margin:0;">${t("calNoEvents")}</p>`));
    return;
  }

  monthEvents.forEach(e=>{
    const row = el(`
      <div class="event-row">
        <div class="event-date"><b>${dayNum(e.iso)}</b><small>${monthAbbr(e.iso)}</small></div>
        <div><h4>${eventTitle(e)}</h4><p>${formatEventDate(e.iso)}</p></div>
      </div>
    `);
    row.addEventListener("click", () => openEventModal(e));
    calendarList.appendChild(row);
  });
}

const eventOverlay = document.getElementById("eventOverlay");
function openEventModal(e){
  // Calendar entries derived from Annual Prayers carry much richer detail
  // (Ubayakarar/Annathanam/Participant status, fees) than a plain calendar
  // event — open the existing Prayer modal for those instead of the plain
  // one, using the live ANNUAL_PRAYERS record so it's always up to date.
  if (e.isPrayer){
    const livePrayer = (typeof ANNUAL_PRAYERS !== "undefined" ? ANNUAL_PRAYERS : []).find(p => p.id === e.prayerId);
    if (livePrayer){ openPrayerModal(livePrayer); return; }
  }
  document.getElementById("eventModalDay").textContent = dayNum(e.iso);
  document.getElementById("eventModalMonth").textContent = monthAbbr(e.iso);
  document.getElementById("eventModalTitle").textContent = eventTitle(e);
  document.getElementById("eventModalDate").textContent = formatEventDate(e.iso);
  const descEl = document.getElementById("eventModalDesc");
  const desc = eventDesc(e);
  descEl.textContent = desc;
  descEl.style.display = desc ? "block" : "none";
  eventOverlay.classList.add("show");
}
function closeEventModal(){ eventOverlay.classList.remove("show"); }
document.getElementById("eventModalClose").addEventListener("click", closeEventModal);
eventOverlay.addEventListener("click", (ev)=>{ if(ev.target === eventOverlay) closeEventModal(); });

document.getElementById("calPrev").addEventListener("click", ()=>{
  calMonth--; if(calMonth < 0){ calMonth = 11; calYear--; }
  renderCalendarGrid();
});
document.getElementById("calNext").addEventListener("click", ()=>{
  calMonth++; if(calMonth > 11){ calMonth = 0; calYear++; }
  renderCalendarGrid();
});
document.getElementById("calToday").addEventListener("click", ()=>{
  calMonth = today.getMonth(); calYear = today.getFullYear();
  renderCalendarGrid();
});

// ============================================================
// POOJA TIMINGS (tabbed)
// ============================================================
const TIMING_TAB_KEYS = ["daily", "friday", "fullMoon"];
const TIMING_TAB_UIKEY = { daily: "timingTabDaily", friday: "timingTabFriday", fullMoon: "timingTabFullMoon" };
let currentTimingTab = "daily";

function renderTimingTabs(){
  const timingTabs = document.getElementById("timingTabs");
  timingTabs.innerHTML = "";
  TIMING_TAB_KEYS.forEach(key=>{
    const btn = el(`<button class="tab-btn${key===currentTimingTab ? " active" : ""}" data-key="${key}">${t(TIMING_TAB_UIKEY[key])}</button>`);
    btn.addEventListener("click", ()=>{ currentTimingTab = key; renderTimingTabs(); renderTimingList(); });
    timingTabs.appendChild(btn);
  });
}

function renderTimingList(){
  const timingList = document.getElementById("timingList");
  timingList.innerHTML = "";
  POOJA_TIMINGS_WEEKLY[currentTimingTab].forEach(p=>{
    timingList.appendChild(el(`<div class="list-row"><b>${poojaName(p.name)}</b><span>${p.time}</span></div>`));
  });
}

// ============================================================
// GALLERY (Category > Folder > Photo, browsed by drilling down)
// ============================================================
let galleryView = "categories"; // "categories" | "folders" | "photos"
let galleryActiveCategory = null;
let galleryActiveFolder = null;

function resetGalleryView(){
  galleryView = "categories";
  galleryActiveCategory = null;
  galleryActiveFolder = null;
}

// A Category/Folder's cover image: whatever was explicitly set via
// the CMS's "Cover Photo" field wins; otherwise fall back to its
// first photo (so browsing still feels like a photo gallery), and
// finally to nothing, which renders as the colored placeholder + icon.
function resolveCoverUrl(entity, firstPhoto){
  if (entity && entity.cover) return entity.cover;
  if (firstPhoto) return firstPhoto.thumbnail || firstPhoto.image;
  return "";
}

// Shared tile for a Category or a Folder card.
function galleryTile(coverUrl, name, colorIndex, onClick){
  const media = coverUrl
    ? `<img class="gallery-photo" src="${coverUrl}" alt="${name}" loading="lazy" />`
    : `<div class="gallery-ph" style="background:${PANEL_COLORS[colorIndex % PANEL_COLORS.length]}"><svg viewBox="0 0 24 24" fill="none">${GALLERY_ICON}</svg></div>`;
  const tile = el(`
    <div class="gallery-item gallery-tile">
      ${media}
      <div class="gallery-cap"><b>${name}</b></div>
    </div>
  `);
  tile.addEventListener("click", onClick);
  return tile;
}

function renderGallery(){
  const galleryGrid = document.getElementById("galleryGrid");
  const backBtn = document.getElementById("galleryBackBtn");
  const crumbEl = document.getElementById("galleryCrumbText");
  galleryGrid.innerHTML = "";

  if (galleryView === "categories"){
    backBtn.style.display = "none";
    crumbEl.textContent = t("galleryHeading");
    if (!GALLERY.length){
      galleryGrid.appendChild(el(`<div class="gallery-empty">${t("galleryEmpty")}</div>`));
      return;
    }
    GALLERY.forEach((c,i)=>{
      const folders = c.folders || [];
      const firstPhoto = folders.length ? (folders[0].photos || [])[0] : null;
      galleryGrid.appendChild(galleryTile(resolveCoverUrl(c, firstPhoto), tf(c,"name"), i, ()=>{
        galleryView = "folders"; galleryActiveCategory = c;
        renderGallery();
      }));
    });
    return;
  }

  if (galleryView === "folders"){
    backBtn.style.display = "";
    crumbEl.textContent = tf(galleryActiveCategory, "name");
    const folders = galleryActiveCategory.folders || [];
    if (!folders.length){
      galleryGrid.appendChild(el(`<div class="gallery-empty">${t("galleryFoldersEmpty")}</div>`));
      return;
    }
    folders.forEach((f,i)=>{
      const firstPhoto = (f.photos || [])[0];
      galleryGrid.appendChild(galleryTile(resolveCoverUrl(f, firstPhoto), tf(f,"name"), i, ()=>{
        galleryView = "photos"; galleryActiveFolder = f;
        renderGallery();
      }));
    });
    return;
  }

  // galleryView === "photos"
  backBtn.style.display = "";
  crumbEl.textContent = `${tf(galleryActiveCategory,"name")} / ${tf(galleryActiveFolder,"name")}`;
  const photos = galleryActiveFolder.photos || [];
  if (!photos.length){
    galleryGrid.appendChild(el(`<div class="gallery-empty">${t("galleryPhotosEmpty")}</div>`));
    return;
  }
  photos.forEach((p,i)=>{
    const thumb = p.thumbnail || p.image;
    const media = thumb
      ? `<img class="gallery-photo" src="${thumb}" alt="${tf(p,"label")}" loading="lazy" />`
      : `<div class="gallery-ph" style="background:${PANEL_COLORS[i % PANEL_COLORS.length]}"><svg viewBox="0 0 24 24" fill="none">${GALLERY_ICON}</svg></div>`;
    const item = el(`
      <div class="gallery-item">
        ${media}
        <div class="gallery-cap"><b>${tf(p,"label")}</b></div>
      </div>
    `);
    item.addEventListener("click", ()=> openGalleryLightbox(p));
    galleryGrid.appendChild(item);
  });
}

document.getElementById("galleryBackBtn").addEventListener("click", ()=>{
  if (galleryView === "photos"){ galleryView = "folders"; galleryActiveFolder = null; }
  else if (galleryView === "folders"){ galleryView = "categories"; galleryActiveCategory = null; }
  renderGallery();
});

const galleryOverlay = document.getElementById("galleryOverlay");
function openGalleryLightbox(p){
  const full = p.image || p.thumbnail || "";
  document.getElementById("galleryModalImg").src = full;
  document.getElementById("galleryModalImg").alt = tf(p, "label");
  document.getElementById("galleryModalCaption").textContent = tf(p, "label");
  galleryOverlay.classList.add("show");
}
function closeGalleryLightbox(){ galleryOverlay.classList.remove("show"); }
document.getElementById("galleryModalClose").addEventListener("click", closeGalleryLightbox);
galleryOverlay.addEventListener("click", (e)=>{ if (e.target === galleryOverlay) closeGalleryLightbox(); });

// ============================================================
// SEVAS & QR MODAL
// ============================================================
function renderSevas(){
  const sevaGrid = document.getElementById("sevaGrid");
  sevaGrid.innerHTML = "";
  SEVAS.forEach(s=>{
    const card = el(`
      <div class="seva-card">
        <h3 style="font-family:var(--font-display);font-size:15px;color:var(--ink-900);margin:0;">${tf(s,"name")}</h3>
        <div class="seva-price">${tf(s,"price")}</div>
        <p style="font-size:12px;color:var(--ink-600);margin:0;line-height:1.5;">${tf(s,"desc")}</p>
        <button class="seva-btn">${tf(s,"cta")}</button>
      </div>
    `);
    card.querySelector(".seva-btn").addEventListener("click", ()=> openQrModal(tf(s,"name"), tf(s,"price")));
    sevaGrid.appendChild(card);
  });
  // "Donate Now" always refers to whichever seva is listed last — by
  // convention that's the general/catch-all donation option — rather than
  // a fixed position, so this stays correct even if rows are added/reordered.
  document.getElementById("donateNowBtn").textContent = tf(SEVAS[SEVAS.length - 1], "cta");
}

document.getElementById("donateNowBtn").addEventListener("click", ()=>{
  const lastSeva = SEVAS[SEVAS.length - 1];
  openQrModal(tf(lastSeva,"name"), tf(lastSeva,"price"));
});

const qrOverlay = document.getElementById("qrOverlay");
function openQrModal(title, amount){
  document.getElementById("qrTitle").textContent = title;
  document.getElementById("qrAmount").textContent = amount;
  document.getElementById("qrCodeBox").innerHTML = `<img src="assets/qr-duitnow.jpg" alt="DuitNow QR code" />`;
  document.getElementById("qrAccount").innerHTML = `
    <div><span>${t("qrAccountName")}</span><span>${DONATION_ACCOUNT.accountName}</span></div>
    <div><span>${t("qrBank")}</span><span>${DONATION_ACCOUNT.bank}</span></div>
    <div><span>${t("qrAccountNo")}</span><span>${DONATION_ACCOUNT.accountNumber}</span></div>
  `;
  qrOverlay.classList.add("show");
}
function closeQrModal(){ qrOverlay.classList.remove("show"); }
document.getElementById("qrClose").addEventListener("click", closeQrModal);
qrOverlay.addEventListener("click", (e)=>{ if(e.target === qrOverlay) closeQrModal(); });

// ============================================================
// ANNUAL PRAYERS & REGISTRATION
// ============================================================
// The schedule (ANNUAL_PRAYERS/CATERERS, from content-data.js) is
// bundled at build time as an offline fallback. fetchPrayersFromDb()
// below replaces its contents with the live rows from Supabase on
// load — the same "bundled default, live data overlays it" pattern
// used elsewhere in this file (see loadLiveContent()/EVENTS). Once
// live data has loaded, ubayakararOpen/annathanamOpen/sponsor names
// on each prayer already reflect every confirmed site registration
// (the register_prayer() Postgres function updates them atomically),
// so no separate "is this taken" overlay is needed here any more.
let PRAYER_PARTICIPANTS = {}; // { [prayerId]: [{name, participantCount}] }
let PRAYER_SPONSOR_BOOKINGS = {}; // { [prayerId]: { ubayakarar: {reference, status}, annathanam: {reference, status} } }

function prayerIsOver(p){
  if (p.statusOverride === "completed") return true;
  if (p.statusOverride === "upcoming") return false;
  return p.date < todayIso;
}
function prayerRoleTaken(p, role){
  return role === "ubayakarar" ? !p.ubayakararOpen : !p.annathanamOpen;
}
function prayerRoleSponsorDisplay(p, role){
  return (role === "ubayakarar" ? p.ubayakararSponsor : p.annathanamSponsor) || null;
}
function formatPrayerDate(iso){ return formatEventDate(iso); }

// Category is the temple treasurer's split of the schedule into three
// separate lists — Annual, Monthly, and Special — layered on top of the
// existing Upcoming/Completed/All status filter below, not replacing it:
// picking a category narrows the grid to that schedule, then the status
// tabs still narrow further within it. Every pooja that predates this
// feature defaults to "annual" (see prayers-list.js), so nothing already
// on the site moves or disappears just from this shipping.
const PRAYER_CATEGORY_KEYS = ["annual", "monthly", "special"];
const PRAYER_CATEGORY_UIKEY = { annual: "prayersCategoryAnnual", monthly: "prayersCategoryMonthly", special: "prayersCategorySpecial" };
let currentPrayerCategory = "annual";

function renderPrayerCategoryTabs(){
  const wrap = document.getElementById("prayersCategoryTabs");
  if (!wrap) return;
  wrap.innerHTML = "";
  PRAYER_CATEGORY_KEYS.forEach(key=>{
    const btn = el(`<button class="tab-btn${key===currentPrayerCategory ? " active" : ""}" data-key="${key}">${t(PRAYER_CATEGORY_UIKEY[key])}</button>`);
    btn.addEventListener("click", ()=>{
      currentPrayerCategory = key;
      // Switching category starts a fresh pooja-type selection — a "Shasthi"
      // filter picked while looking at Monthly shouldn't silently carry over
      // and hide everything if you then tap Special. renderPrayerTypeTabs()
      // (called right below) resolves null to the new category's first type.
      currentPrayerType = null;
      renderPrayerCategoryTabs();
      renderPrayerTypeTabs();
      renderPrayerGrid();
    });
    wrap.appendChild(btn);
  });
}

// Pooja-type sub-tabs, shown only under Monthly/Special. Monthly and Special
// poojas repeat under the same name every cycle (Bairavar, Shasthi, Pournami,
// and "more to come" per the treasurer) — tapping Monthly shows those names
// as tabs, one of them already selected, and the grid shows only that one
// type's poojas — exactly the same drill-down shape as the Annual/Monthly/
// Special tabs above it, just one level deeper. Tabs are generated
// automatically from whatever distinct pooja names already exist in that
// category, not a fixed/hardcoded list, so a brand-new pooja type gets its
// own tab the moment it's added in /admin-prayers.html — no code change or
// redeploy needed to keep this current. null means "no specific type
// selected" — true on Annual (no tabs at all) and on a category with 0 or 1
// distinct names (nothing to pick between); renderPrayerTypeTabs() below is
// what turns null into a real selection whenever there's more than one name
// to choose from.
let currentPrayerType = null;

// A pooja's recurring identity — "Bairavar", "Shasthi", "Pournami" — is what
// the Monthly/Special sub-tabs group and filter on, so every month's
// Bairavar pooja lands on the same tab regardless of which month it's for.
// This now comes straight from the admin-set `poojaType` field (set in
// /admin-prayers.html's Add/Edit form, stored in the `prayers.pooja_type`
// column) rather than being guessed from the pooja's display name — an
// earlier version of this tried to derive it by parsing the name (stripping
// "(Month Year)", "Monthly"/"Special", "Pooja"/"Prayer"), which worked for
// the naming pattern seen at the time but is exactly the kind of guesswork
// that breaks the moment a pooja is named differently. `poojaType` is
// authoritative now; a raw, un-set `p.name` is only a last-resort fallback
// (e.g. a pooja saved before this field existed and not yet re-saved).
function prayerTypeLabel(p){
  return (p.poojaType || "").trim() || (p.name || "").trim();
}

function renderPrayerTypeTabs(){
  const wrap = document.getElementById("prayersTypeTabs");
  if (!wrap) return;
  wrap.innerHTML = "";

  if (currentPrayerCategory === "annual"){
    // Annual already has many one-off, mostly-unique event names — splitting
    // those into name-tabs wouldn't help (it'd just be a wall of tabs), so
    // this row stays hidden there and Annual keeps its existing flat list.
    wrap.style.display = "none";
    currentPrayerType = null;
    return;
  }

  const list = (typeof ANNUAL_PRAYERS !== "undefined" ? ANNUAL_PRAYERS : []);
  const seen = new Set();
  const names = [];
  list.forEach(p=>{
    if ((p.category || "annual") !== currentPrayerCategory) return;
    const name = prayerTypeLabel(p);
    if (!name || seen.has(name)) return;
    seen.add(name);
    names.push(name);
  });
  names.sort((a,b)=> a.localeCompare(b));

  // Nothing to split yet (no poojas, or only one distinct name in this
  // category) — a single tab next to nothing else to pick doesn't add any
  // way to actually narrow things down, so the row stays hidden and the
  // grid below just shows everything in the category (which, with 0 or 1
  // names, is the same thing "picking a tab" would show anyway).
  if (names.length <= 1){
    wrap.style.display = "none";
    currentPrayerType = null;
    return;
  }

  // Landing on Monthly/Special (or the previously-picked type having
  // disappeared — renamed/deleted in the admin, or a live-content refresh)
  // always resolves to a real, specific pooja type — the first one
  // alphabetically — never to an empty grid or a merged "everything at
  // once" view. Tapping Monthly shows Bairavar/Shasthi/Pournami as tabs,
  // with one of them already selected and its own poojas already showing,
  // exactly like the Annual/Monthly/Special tabs above it work.
  if (!currentPrayerType || !seen.has(currentPrayerType)){
    currentPrayerType = names[0];
  }

  wrap.style.display = "";
  names.forEach(name=>{
    const btn = el(`<button class="tab-btn${name===currentPrayerType ? " active" : ""}" data-key="${name}">${name}</button>`);
    btn.addEventListener("click", ()=>{ currentPrayerType = name; renderPrayerTypeTabs(); renderPrayerGrid(); });
    wrap.appendChild(btn);
  });
}

const PRAYER_FILTER_KEYS = ["upcoming", "over", "all"];
const PRAYER_FILTER_UIKEY = { upcoming: "prayersFilterUpcoming", over: "prayersFilterOver", all: "prayersFilterAll" };
let currentPrayerFilter = "upcoming";

function renderPrayerFilterTabs(){
  const wrap = document.getElementById("prayersFilterTabs");
  if (!wrap) return;
  wrap.innerHTML = "";
  PRAYER_FILTER_KEYS.forEach(key=>{
    const btn = el(`<button class="tab-btn${key===currentPrayerFilter ? " active" : ""}" data-key="${key}">${t(PRAYER_FILTER_UIKEY[key])}</button>`);
    btn.addEventListener("click", ()=>{ currentPrayerFilter = key; renderPrayerFilterTabs(); renderPrayerGrid(); });
    wrap.appendChild(btn);
  });
}

function buildPrayerCard(p){
  const over = prayerIsOver(p);
  const ubayakararTaken = prayerRoleTaken(p, "ubayakarar");
  const annathanamTaken = prayerRoleTaken(p, "annathanam");
  // Same sponsor lookup the pooja detail popup already uses (prayerRoleRow
  // below) — showing it here too means a devotee can see who's already
  // sponsoring a pooja without needing to open it first.
  const ubayakararSponsor = prayerRoleSponsorDisplay(p, "ubayakarar");
  const annathanamSponsor = prayerRoleSponsorDisplay(p, "annathanam");
  // Payment/confirmation status pills — same booking lookup and Paid
  // logic the popup already uses for the Ubayam Fee row (see
  // openPrayerModal below), just surfaced here too so a devotee doesn't
  // have to open the card to see it. Annathanam never collects payment
  // (the sponsor pays the caterer directly), so it gets a
  // Confirmed/Not Confirmed status instead of a paid/unpaid one.
  const ubayakararBooking = (PRAYER_SPONSOR_BOOKINGS[p.id] || {}).ubayakarar;
  const ubayakararPaid = ubayakararBooking && (ubayakararBooking.status === "Confirmed" || ubayakararBooking.status === "Paid/Confirmed");
  const ubayakararPaidPillHtml = ubayakararBooking
    ? `<span class="prayer-role-pill ${ubayakararPaid ? "paid" : "unpaid"}">${ubayakararPaid ? t("prayersPaidBadge") : t("prayersNotPaidBadge")}</span>`
    : "";
  const annathanamBooking = (PRAYER_SPONSOR_BOOKINGS[p.id] || {}).annathanam;
  const annathanamConfirmed = annathanamBooking && annathanamBooking.status === "Confirmed";
  const annathanamStatusPillHtml = annathanamBooking
    ? `<span class="prayer-role-pill ${annathanamConfirmed ? "paid" : "unpaid"}">${annathanamConfirmed ? t("prayersConfirmedBadge") : t("prayersNotConfirmedBadge")}</span>`
    : "";
  const feeText = p.ubayamFee != null ? `RM ${p.ubayamFee.toLocaleString()}` : t("prayersAsArranged");
  const card = el(`
    <div class="prayer-card">
      <div class="prayer-card-date"><b>${dayNum(p.date)}</b><small>${monthAbbr(p.date)}</small></div>
      <div class="prayer-card-body">
        <div class="prayer-card-top">
          <h4>${p.name}</h4>
          <span class="prayer-status-pill ${over ? "over" : "upcoming"}">${over ? t("prayersStatusOver") : t("prayersStatusUpcoming")}</span>
        </div>
        <div class="prayer-card-fee">${feeText}</div>
        <div class="prayer-card-pills">
          <div class="prayer-role-block">
            <span class="prayer-role-pill ${ubayakararTaken ? "taken" : "open"}">${t("prayersUbayakararLabel")}: ${ubayakararTaken ? t("prayersTakenBadge") : t("prayersOpenBadge")}</span>
            ${ubayakararSponsor ? `<span class="prayer-role-sponsor">${ubayakararSponsor}</span>` : ""}
            ${ubayakararPaidPillHtml}
          </div>
          <div class="prayer-role-block">
            <span class="prayer-role-pill ${annathanamTaken ? "taken" : "open"}">${t("prayersAnnathanamLabel")}: ${annathanamTaken ? t("prayersTakenBadge") : t("prayersOpenBadge")}</span>
            ${annathanamSponsor ? `<span class="prayer-role-sponsor">${annathanamSponsor}</span>` : ""}
            ${annathanamStatusPillHtml}
          </div>
          ${p.participantsEnabled ? `<span class="prayer-role-pill ${over ? "taken" : "open"}">${t("prayersParticipantLabel")}${over ? ": " + t("prayersClosedBadge") : ""}</span>` : ""}
        </div>
      </div>
    </div>
  `);
  card.addEventListener("click", ()=>openPrayerModal(p));
  return card;
}

function renderPrayerGrid(){
  const grid = document.getElementById("prayerGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const list = (typeof ANNUAL_PRAYERS !== "undefined" ? ANNUAL_PRAYERS : []).slice().sort((a,b)=> a.date.localeCompare(b.date));
  const byCategoryAndStatus = list.filter(p=>{
    if ((p.category || "annual") !== currentPrayerCategory) return false;
    const over = prayerIsOver(p);
    if (currentPrayerFilter === "upcoming") return !over;
    if (currentPrayerFilter === "over") return over;
    return true;
  });

  // currentPrayerType is null on Annual and on any category with 0-1 pooja
  // names (nothing to narrow down); otherwise it's always a real selected
  // name (renderPrayerTypeTabs() guarantees that), so this grid only ever
  // shows one specific pooja's own occurrences at a time under Monthly/
  // Special — never a merged view of every type at once.
  const filtered = byCategoryAndStatus.filter(p =>
    !currentPrayerType || prayerTypeLabel(p) === currentPrayerType
  );

  if (!filtered.length){
    grid.appendChild(el(`<p style="font-size:13px;color:var(--ink-600);margin:0;grid-column:1/-1;">${t("calNoEvents")}</p>`));
    return;
  }

  filtered.forEach(p => grid.appendChild(buildPrayerCard(p)));
}

const prayerOverlay = document.getElementById("prayerOverlay");
let currentPrayerModal = null;
let currentPrayerFormRole = null;

function prayerRoleRow(p, role){
  const label = role === "ubayakarar" ? t("prayersUbayakararLabel") : t("prayersAnnathanamLabel");
  const taken = prayerRoleTaken(p, role);
  const sponsor = prayerRoleSponsorDisplay(p, role);
  const booking = (PRAYER_SPONSOR_BOOKINGS[p.id] || {})[role];
  const refHtml = booking ? `<span class="prayer-modal-row-ref">${t("prayersSuccessRef")}: ${booking.reference}</span>` : "";
  return `
    <div class="prayer-modal-row">
      <span class="prayer-modal-row-label">${label}</span>
      <span class="prayer-role-pill ${taken ? "taken" : "open"}">${taken ? t("prayersTakenBadge") : t("prayersOpenBadge")}</span>
      ${sponsor ? `<span class="prayer-modal-row-sponsor">${sponsor}</span>` : ""}
      ${refHtml}
    </div>
  `;
}

function openPrayerModal(p){
  currentPrayerModal = p;
  showPrayerDetailView();
  const over = prayerIsOver(p);

  const badgeEl = document.getElementById("prayerModalStatusBadge");
  badgeEl.textContent = over ? t("prayersStatusOver") : t("prayersStatusUpcoming");
  badgeEl.className = "prayer-modal-badge " + (over ? "over" : "upcoming");
  document.getElementById("prayerModalTitle").textContent = p.name;
  document.getElementById("prayerModalDate").textContent = formatPrayerDate(p.date);

  let rowsHtml = prayerRoleRow(p, "ubayakarar") + prayerRoleRow(p, "annathanam");
  if (p.ubayamFee != null){
    // The Ubayam Fee is what the Ubayakarar booking actually pays for, so
    // its paid/not-paid status (and reference) is shown right here rather
    // than duplicated on the Ubayakarar row above. Annathanam never gets
    // this — it's reserve-only and the site never collects payment for it.
    const booking = (PRAYER_SPONSOR_BOOKINGS[p.id] || {}).ubayakarar;
    // "Paid/Confirmed" is the admin dashboard's status once a payment is
    // actually received; plain "Confirmed" is kept for a slot the
    // committee has confirmed without that meaning money changed hands.
    // Either one shows this devotee-facing badge as Paid — "Confirmed"
    // alone here almost always means paid in practice, and there's no
    // separate public-facing state for "confirmed but somehow not paid."
    const isPaid = booking && (booking.status === "Confirmed" || booking.status === "Paid/Confirmed");
    const paidPillHtml = booking
      ? `<span class="prayer-role-pill ${isPaid ? "paid" : "unpaid"}">${isPaid ? t("prayersPaidBadge") : t("prayersNotPaidBadge")}</span>`
      : "";
    const feeRefHtml = booking ? `<span class="prayer-modal-row-ref">${t("prayersSuccessRef")}: ${booking.reference}</span>` : "";
    rowsHtml += `<div class="prayer-modal-row"><span class="prayer-modal-row-label">${t("prayersFeeLabel")}</span>${paidPillHtml}<span class="prayer-modal-row-sponsor">RM ${p.ubayamFee.toLocaleString()}</span>${feeRefHtml}</div>`;
  }
  if (p.participantsEnabled){
    // The fee text below is purely "what it costs" (or "Open" as a no-fee
    // placeholder) — it is NOT a registration-availability indicator. Once
    // the event is over, replace it with the Closed badge so this row can
    // never be misread as "still open for registration" (the actual
    // register button is separately hidden below via `if (!over)`).
    const feeText = over
      ? t("prayersClosedBadge")
      : (p.participantFee ? `RM ${p.participantFee} ${t("prayersPerPersonLabel")}` : t("prayersOpenBadge"));
    rowsHtml += `<div class="prayer-modal-row"><span class="prayer-modal-row-label">${t("prayersParticipantLabel")}</span><span class="prayer-modal-row-sponsor">${feeText}</span></div>`;
  }
  document.getElementById("prayerModalRows").innerHTML = rowsHtml;

  const notesEl = document.getElementById("prayerModalNotes");
  notesEl.textContent = p.notes || "";
  notesEl.style.display = p.notes ? "block" : "none";

  const participantsWrap = document.getElementById("prayerModalParticipants");
  if (over && p.participantsEnabled){
    const regs = PRAYER_PARTICIPANTS[p.id] || [];
    const listEl = document.getElementById("prayerParticipantsList");
    listEl.innerHTML = regs.length
      ? regs.map(r=>`<div class="list-row"><b>${r.name}</b><span>${r.participantCount && r.participantCount > 1 ? "×" + r.participantCount : ""}</span></div>`).join("")
      : `<p style="font-size:13px;color:var(--ink-600);margin:0;">${t("prayersNoParticipants")}</p>`;
    participantsWrap.style.display = "block";
  } else {
    participantsWrap.style.display = "none";
  }

  const actionsEl = document.getElementById("prayerModalActions");
  actionsEl.innerHTML = "";
  if (!over){
    if (!prayerRoleTaken(p, "ubayakarar")){
      const btn = el(`<button class="prayer-btn-solid">${t("prayersRegisterBtn")} — ${t("prayersUbayakararLabel")}</button>`);
      btn.addEventListener("click", ()=>showPrayerForm(p, "ubayakarar"));
      actionsEl.appendChild(btn);
    }
    if (!prayerRoleTaken(p, "annathanam")){
      const btn = el(`<button class="prayer-btn-solid">${t("prayersRegisterBtn")} — ${t("prayersAnnathanamLabel")}</button>`);
      btn.addEventListener("click", ()=>showPrayerForm(p, "annathanam"));
      actionsEl.appendChild(btn);
    }
    if (p.participantsEnabled){
      const btn = el(`<button class="prayer-btn-solid">${t("prayersRegisterBtn")} — ${t("prayersParticipantLabel")}</button>`);
      btn.addEventListener("click", ()=>showPrayerForm(p, "participant"));
      actionsEl.appendChild(btn);
    }
  }

  prayerOverlay.classList.add("show");
}

function showPrayerDetailView(){
  document.getElementById("prayerDetailView").style.display = "block";
  document.getElementById("prayerFormView").style.display = "none";
  document.getElementById("prayerSuccessView").style.display = "none";
}

function showPrayerForm(p, role){
  currentPrayerFormRole = role;
  document.getElementById("prayerDetailView").style.display = "none";
  document.getElementById("prayerSuccessView").style.display = "none";
  document.getElementById("prayerFormView").style.display = "block";

  const titleKey = role === "ubayakarar" ? "prayersModalUbayakararTitle" : role === "annathanam" ? "prayersModalAnnathanamTitle" : "prayersModalParticipantTitle";
  document.getElementById("prayerFormTitle").textContent = t(titleKey) + " — " + p.name;
  document.getElementById("prayerFormNameLabel").textContent = t("prayersFormName");
  document.getElementById("prayerFormPhoneLabel").textContent = t("prayersFormPhone");
  document.getElementById("prayerFormParticipantCountLabel").textContent = t("prayersFormParticipantCount");
  document.getElementById("prayerFormParticipantCountHint").textContent = t("prayersFormParticipantCountHint");
  document.getElementById("prayerFormNotesLabel").textContent = t("prayersFormNotes");
  document.getElementById("prayerFormSubmitBtnText").textContent = t("prayersFormSubmit");
  document.getElementById("prayerFormCancelBtn").textContent = t("prayersFormCancel");
  document.getElementById("prayerFormName").value = "";
  document.getElementById("prayerFormPhone").value = "";
  document.getElementById("prayerFormParticipantCount").value = "1";
  document.getElementById("prayerFormNotes").value = "";
  document.getElementById("prayerFormWebsite").value = "";
  document.getElementById("prayerFormError").style.display = "none";
  document.getElementById("prayerFormParticipantCountWrap").style.display = role === "participant" ? "block" : "none";
}

document.getElementById("prayerFormCancelBtn").addEventListener("click", ()=>{
  if (currentPrayerModal) openPrayerModal(currentPrayerModal);
});
document.getElementById("prayerFormSubmitBtn").addEventListener("click", submitPrayerForm);

async function submitPrayerForm(){
  const p = currentPrayerModal;
  const role = currentPrayerFormRole;
  if (!p || !role) return;

  const name = document.getElementById("prayerFormName").value.trim();
  const phone = document.getElementById("prayerFormPhone").value.trim();
  const participantCount = parseInt(document.getElementById("prayerFormParticipantCount").value, 10) || 1;
  const notes = document.getElementById("prayerFormNotes").value.trim();
  const errorEl = document.getElementById("prayerFormError");

  // Honeypot — a hidden field a real devotee never sees or fills (see
  // .hp-field in style.css). If it has a value, something auto-filled
  // it, so quietly treat this the same as an incomplete form rather
  // than sending the request at all.
  if (document.getElementById("prayerFormWebsite").value.trim()){
    errorEl.textContent = t("prayersErrorGeneric");
    errorEl.style.display = "block";
    return;
  }

  if (!name || !phone){
    errorEl.textContent = t("prayersErrorGeneric");
    errorEl.style.display = "block";
    return;
  }

  const submitBtn = document.getElementById("prayerFormSubmitBtn");
  submitBtn.disabled = true;
  const originalLabel = document.getElementById("prayerFormSubmitBtnText").textContent;
  document.getElementById("prayerFormSubmitBtnText").textContent = t("prayersFormSubmitting");
  errorEl.style.display = "none";

  try {
    const res = await fetch("/.netlify/functions/register-prayer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prayerId: p.id, role, name, phone, participantCount, notes })
    });
    const data = await res.json();
    if (!res.ok){
      errorEl.textContent = data.error || t("prayersErrorGeneric");
      errorEl.style.display = "block";
      return;
    }
    // Reflect the new booking locally right away, so the grid/modal
    // shows it as taken immediately rather than waiting on the next
    // full refresh — mirrors exactly what register_prayer() just did
    // server-side. p is the live object inside ANNUAL_PRAYERS, so this
    // mutation is picked up by every render that reads that array.
    if (role === "ubayakarar"){ p.ubayakararOpen = false; p.ubayakararSponsor = name; }
    else if (role === "annathanam"){ p.annathanamOpen = false; p.annathanamSponsor = name; }
    else if (role === "participant"){
      if (!PRAYER_PARTICIPANTS[p.id]) PRAYER_PARTICIPANTS[p.id] = [];
      PRAYER_PARTICIPANTS[p.id].push({ name, participantCount });
    }
    // Also reflect it in PRAYER_SPONSOR_BOOKINGS — same reasoning as above —
    // so the card's/popup's Paid/Not Paid (or Confirmed/Not Confirmed) pill
    // and reference number appear immediately too, not just the Taken pill,
    // without waiting on the next full page load.
    if (role === "ubayakarar" || role === "annathanam"){
      if (!PRAYER_SPONSOR_BOOKINGS[p.id]) PRAYER_SPONSOR_BOOKINGS[p.id] = {};
      PRAYER_SPONSOR_BOOKINGS[p.id][role] = { reference: data.reference, status: data.status };
    }
    // data.fee (when present) is the PER-PERSON rate register_prayer() looked up —
    // showPrayerSuccess needs the headcount too so a group registration shows the
    // correct total amount due, not just the per-person rate.
    data.participantCount = participantCount;
    showPrayerSuccess(role, data);
    renderPrayerGrid();
  } catch (err){
    console.warn("Prayer registration failed:", err);
    errorEl.textContent = t("prayersErrorGeneric");
    errorEl.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    document.getElementById("prayerFormSubmitBtnText").textContent = originalLabel;
  }
}

function showPrayerSuccess(role, data){
  document.getElementById("prayerFormView").style.display = "none";
  document.getElementById("prayerSuccessView").style.display = "block";
  document.getElementById("prayerSuccessTitleText").textContent = t("prayersSuccessTitle");
  document.getElementById("prayerSuccessRef").textContent = t("prayersSuccessRef") + ": " + data.reference;

  let msgKey = "prayersSuccessAnnathanam";
  if (role === "ubayakarar") msgKey = "prayersSuccessUbayakarar";
  else if (role === "participant") msgKey = data.fee ? "prayersSuccessParticipantPaid" : "prayersSuccessParticipantFree";
  document.getElementById("prayerSuccessMessage").textContent = t(msgKey);

  // Ubayakarar (always) and a paid Participant slot need the devotee to pay
  // via bank transfer/DuitNow, same as Sevas & Donations — show that QR
  // right here instead of sending them hunting for it elsewhere.
  // Annathanam is reserve-only (paid to the caterer directly), so it never
  // shows this block.
  const needsPayment = role === "ubayakarar" || (role === "participant" && data.fee);
  const qrBlock = document.getElementById("prayerSuccessQr");
  if (needsPayment){
    document.getElementById("prayerSuccessQrEyebrow").textContent = t("qrScanToPay");
    document.getElementById("prayerSuccessQrNote").textContent = t("qrNote");
    const amountEl = document.getElementById("prayerSuccessQrAmount");
    if (data.fee){
      // For a group/family participant registration, data.fee is the PER-PERSON
      // rate — show the total the group owes, with the per-person rate spelled
      // out too so it's clear how the total was worked out.
      const count = role === "participant" ? Math.max(1, data.participantCount || 1) : 1;
      const total = data.fee * count;
      amountEl.textContent = count > 1 ? `RM ${total} (RM ${data.fee} × ${count} ${t("prayersPaxLabel")})` : "RM " + data.fee;
      amountEl.style.display = "block";
    } else {
      amountEl.style.display = "none"; // fee "as arranged" — no fixed figure to show
    }
    document.getElementById("prayerSuccessQrAccount").innerHTML = `
      <div><span>${t("qrAccountName")}</span><span>${DONATION_ACCOUNT.accountName}</span></div>
      <div><span>${t("qrBank")}</span><span>${DONATION_ACCOUNT.bank}</span></div>
      <div><span>${t("qrAccountNo")}</span><span>${DONATION_ACCOUNT.accountNumber}</span></div>
    `;
    qrBlock.style.display = "block";
  } else {
    qrBlock.style.display = "none";
  }
}

document.getElementById("prayerSuccessCloseBtn").addEventListener("click", closePrayerModal);
function closePrayerModal(){
  prayerOverlay.classList.remove("show");
  currentPrayerModal = null;
  currentPrayerFormRole = null;
}
document.getElementById("prayerModalClose").addEventListener("click", closePrayerModal);
prayerOverlay.addEventListener("click", (e)=>{ if(e.target === prayerOverlay) closePrayerModal(); });

function renderCaterers(){
  const wrap = document.getElementById("caterersList");
  if (!wrap) return;
  wrap.innerHTML = "";
  (typeof CATERERS !== "undefined" ? CATERERS : []).forEach(c=>{
    wrap.appendChild(el(`
      <div class="contact-row">
        <div><b>${c.name}</b><span>${[c.contact, c.phone].filter(Boolean).join(" · ")}</span></div>
      </div>
    `));
  });
}

function renderPrayers(){
  document.getElementById("prayersHeadingText").textContent = t("prayersHeading");
  document.getElementById("prayersSubText").textContent = t("prayersSub");
  document.getElementById("prayersCaterersHeadingText").textContent = t("prayersCaterersHeading");
  document.getElementById("prayersCaterersSubText").textContent = t("prayersCaterersSub");
  document.getElementById("prayerParticipantsHeadingText").textContent = t("prayersParticipantsHeading");
  renderPrayerCategoryTabs();
  renderPrayerTypeTabs();
  renderPrayerFilterTabs();
  renderPrayerGrid();
  renderCaterers();
}

function fetchPrayersFromDb(){
  fetch("/.netlify/functions/prayers-list", { cache: "no-store" })
    .then(res => res.ok ? res.json() : { configured: false })
    .then(data => {
      if (!data.configured || !data.prayers) return; // not set up yet — bundled fallback content stays as-is
      if (typeof ANNUAL_PRAYERS !== "undefined"){ ANNUAL_PRAYERS.length = 0; data.prayers.forEach(p => ANNUAL_PRAYERS.push(p)); }
      if (typeof CATERERS !== "undefined" && data.caterers){ CATERERS.length = 0; data.caterers.forEach(c => CATERERS.push(c)); }
      PRAYER_PARTICIPANTS = data.participants || {};
      PRAYER_SPONSOR_BOOKINGS = data.sponsorBookings || {};
      renderPrayers();
      // Event Calendar and Home's "Upcoming Events" widget both read from
      // Annual Prayers now (see getCalendarEvents()) — refresh them here too.
      safeRender("calendarGrid", renderCalendarGrid);
      safeRender("homeEvents", renderHomeEvents);
      if (currentPrayerModal) openPrayerModal(currentPrayerModal);
    })
    .catch(err => console.warn("Could not load the live Annual Prayers schedule — showing bundled data only:", err));
}

// ============================================================
// FRIDAY ANNATHANAM SPONSORSHIP (public)
// A dedicated weekly schedule — RM 250 sponsors the temple's
// Annathanam meal for one Friday — deliberately kept separate from
// Annual Prayers/Bookings above (see
// supabase/friday-annathanam-function.sql for why). Loaded from
// friday-annathanam-list.js, which never includes sponsor phone
// numbers (see that file's header comment), and self-registered via
// register-friday-annathanam.js, which race-safely locks and claims
// the row server-side — the same pattern register_prayer() already
// uses above. There is no bundled/offline fallback for this data
// (unlike ANNUAL_PRAYERS) — it only ever comes from the live database.
// ============================================================
let FRIDAY_ANNATHANAM_WEEKS = []; // [{date, fee, sponsorName, skipReason}]
let currentFridayAnnathanam = null; // the {date, fee, ...} row currently being sponsored in the modal

function fridayAnnathanamStatus(w){
  if (w.skipReason) return "skipped";
  if (w.sponsorName) return "sponsored";
  return "open";
}

// Friday Annathanam is shown as the same card-grid format as the Annual
// Prayers & Registration screen (.prayer-grid / .prayer-card, reused as-is
// — no new CSS needed) instead of a plain scrolling list, plus a matching
// Upcoming/Completed/All filter row (reusing the exact same filter keys
// and UI strings prayersFilterUpcoming/Over/All already use). Unlike
// Prayers, Friday Annathanam only ever has ONE sponsorable role (there's
// no separate Ubayakarar), so each card shows a single role pill instead
// of the two-role-block layout buildPrayerCard() uses.
const FRIDAY_FILTER_KEYS = ["upcoming", "over", "all"];
let currentFridayFilter = "upcoming";

function renderFridayAnnathanamFilterTabs(){
  const wrap = document.getElementById("fridayAnnathanamFilterTabs");
  if (!wrap) return;
  wrap.innerHTML = "";
  FRIDAY_FILTER_KEYS.forEach(key=>{
    const btn = el(`<button class="tab-btn${key===currentFridayFilter ? " active" : ""}" data-key="${key}">${t(PRAYER_FILTER_UIKEY[key])}</button>`);
    btn.addEventListener("click", ()=>{ currentFridayFilter = key; renderFridayAnnathanamFilterTabs(); renderFridayAnnathanamGrid(); });
    wrap.appendChild(btn);
  });
}

function buildFridayAnnathanamCard(w){
  const over = w.date < todayIso; // a past Friday can't be sponsored any more — register-friday-annathanam.js's own DATE_OVER check would reject it anyway
  const status = fridayAnnathanamStatus(w);
  const skipped = status === "skipped";
  const taken = status === "sponsored";
  const feeText = w.fee != null ? `RM ${w.fee.toLocaleString()}` : t("prayersAsArranged");
  const pillHtml = skipped
    ? `<span class="prayer-role-pill taken">${t("fridayAnnathanamSkippedBadge")}</span>`
    : `<span class="prayer-role-pill ${taken ? "taken" : "open"}">${t("prayersAnnathanamLabel")}: ${taken ? t("prayersTakenBadge") : t("prayersOpenBadge")}</span>`;
  // Paid/Not Paid — same pill + strings the Prayers & Registration
  // screen already uses for an Ubayakarar sponsorship's payment status
  // (see buildPrayerCard() above). Only shown once a sponsor has taken
  // the slot; an open or skipped week has no payment to report on.
  const paidPillHtml = taken
    ? `<span class="prayer-role-pill ${w.paid ? "paid" : "unpaid"}">${w.paid ? t("prayersPaidBadge") : t("prayersNotPaidBadge")}</span>`
    : "";
  const card = el(`
    <div class="prayer-card">
      <div class="prayer-card-date"><b>${dayNum(w.date)}</b><small>${monthAbbr(w.date)}</small></div>
      <div class="prayer-card-body">
        <div class="prayer-card-top">
          <h4>${t("navFridayAnnathanam")}</h4>
          <span class="prayer-status-pill ${over ? "over" : "upcoming"}">${over ? t("prayersStatusOver") : t("prayersStatusUpcoming")}</span>
        </div>
        <div class="prayer-card-fee">${feeText}</div>
        <div class="prayer-card-pills">
          <div class="prayer-role-block">
            ${pillHtml}
            ${w.sponsorName ? `<span class="prayer-role-sponsor">${w.sponsorName}</span>` : ""}
            ${paidPillHtml}
          </div>
        </div>
      </div>
    </div>
  `);
  if (status === "open" && !over){
    const btn = el(`<button class="prayer-btn-ghost" style="flex-basis:100%;margin-top:10px;padding:8px 14px;font-size:12px;">${t("fridayAnnathanamSponsorBtn")}</button>`);
    btn.addEventListener("click", (e)=>{ e.stopPropagation(); openFridayAnnathanamForm(w); });
    card.querySelector(".prayer-card-body").appendChild(btn);
  }
  return card;
}

function renderFridayAnnathanamGrid(){
  const grid = document.getElementById("fridayAnnathanamGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const list = FRIDAY_ANNATHANAM_WEEKS.slice().sort((a,b)=>a.date.localeCompare(b.date));
  const filtered = list.filter(w=>{
    const over = w.date < todayIso;
    if (currentFridayFilter === "upcoming") return !over;
    if (currentFridayFilter === "over") return over;
    return true;
  });

  if (!filtered.length){
    grid.appendChild(el(`<p style="font-size:13px;color:var(--ink-600);margin:0;grid-column:1/-1;">${t("fridayAnnathanamNoUpcoming")}</p>`));
    return;
  }

  filtered.forEach(w => grid.appendChild(buildFridayAnnathanamCard(w)));
}

function renderFridayAnnathanam(){
  if (!document.getElementById("fridayAnnathanamGrid")) return;
  document.getElementById("fridayAnnathanamHeadingText").textContent = t("fridayAnnathanamHeading");
  document.getElementById("fridayAnnathanamSubText").textContent = t("fridayAnnathanamSub");
  renderFridayAnnathanamFilterTabs();
  renderFridayAnnathanamGrid();
}

const fridayAnnathanamOverlay = document.getElementById("fridayAnnathanamOverlay");

function openFridayAnnathanamForm(w){
  currentFridayAnnathanam = w;
  document.getElementById("fridayAnnathanamFormView").style.display = "block";
  document.getElementById("fridayAnnathanamSuccessView").style.display = "none";
  document.getElementById("fridayAnnathanamFormTitle").textContent = t("fridayAnnathanamModalTitle") + " — " + formatPrayerDate(w.date);
  document.getElementById("fridayAnnathanamFormNameLabel").textContent = t("prayersFormName");
  document.getElementById("fridayAnnathanamFormPhoneLabel").textContent = t("prayersFormPhone");
  document.getElementById("fridayAnnathanamFormSubmitBtnText").textContent = t("prayersFormSubmit");
  document.getElementById("fridayAnnathanamFormCancelBtn").textContent = t("prayersFormCancel");
  document.getElementById("fridayAnnathanamFormName").value = "";
  document.getElementById("fridayAnnathanamFormPhone").value = "";
  document.getElementById("fridayAnnathanamFormWebsite").value = "";
  document.getElementById("fridayAnnathanamFormError").style.display = "none";
  fridayAnnathanamOverlay.classList.add("show");
}

function closeFridayAnnathanamModal(){
  fridayAnnathanamOverlay.classList.remove("show");
  currentFridayAnnathanam = null;
}
document.getElementById("fridayAnnathanamModalClose").addEventListener("click", closeFridayAnnathanamModal);
document.getElementById("fridayAnnathanamFormCancelBtn").addEventListener("click", closeFridayAnnathanamModal);
document.getElementById("fridayAnnathanamSuccessCloseBtn").addEventListener("click", closeFridayAnnathanamModal);
fridayAnnathanamOverlay.addEventListener("click", (e)=>{ if (e.target === fridayAnnathanamOverlay) closeFridayAnnathanamModal(); });
document.getElementById("fridayAnnathanamFormSubmitBtn").addEventListener("click", submitFridayAnnathanamForm);

async function submitFridayAnnathanamForm(){
  const w = currentFridayAnnathanam;
  if (!w) return;

  const name = document.getElementById("fridayAnnathanamFormName").value.trim();
  const phone = document.getElementById("fridayAnnathanamFormPhone").value.trim();
  const errorEl = document.getElementById("fridayAnnathanamFormError");

  // Honeypot — see the matching comment in submitPrayerForm() above.
  if (document.getElementById("fridayAnnathanamFormWebsite").value.trim()){
    errorEl.textContent = t("prayersErrorGeneric");
    errorEl.style.display = "block";
    return;
  }

  if (!name || !phone){
    errorEl.textContent = t("prayersErrorGeneric");
    errorEl.style.display = "block";
    return;
  }

  const submitBtn = document.getElementById("fridayAnnathanamFormSubmitBtn");
  submitBtn.disabled = true;
  const originalLabel = document.getElementById("fridayAnnathanamFormSubmitBtnText").textContent;
  document.getElementById("fridayAnnathanamFormSubmitBtnText").textContent = t("prayersFormSubmitting");
  errorEl.style.display = "none";

  try {
    const res = await fetch("/.netlify/functions/register-friday-annathanam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: w.date, name, phone })
    });
    const data = await res.json();
    if (!res.ok){
      errorEl.textContent = data.error || t("prayersErrorGeneric");
      errorEl.style.display = "block";
      return;
    }
    // Reflect the new sponsorship locally right away, same pattern as
    // submitPrayerForm() above — w is the live object inside
    // FRIDAY_ANNATHANAM_WEEKS, so this mutation is picked up immediately
    // by renderFridayAnnathanam() without waiting on a full page reload.
    w.sponsorName = name;
    showFridayAnnathanamSuccess(data);
    renderFridayAnnathanam();
  } catch (err){
    console.warn("Friday Annathanam registration failed:", err);
    errorEl.textContent = t("prayersErrorGeneric");
    errorEl.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    document.getElementById("fridayAnnathanamFormSubmitBtnText").textContent = originalLabel;
  }
}

function showFridayAnnathanamSuccess(data){
  document.getElementById("fridayAnnathanamFormView").style.display = "none";
  document.getElementById("fridayAnnathanamSuccessView").style.display = "block";
  document.getElementById("fridayAnnathanamSuccessTitleText").textContent = t("prayersSuccessTitle");
  document.getElementById("fridayAnnathanamSuccessRef").textContent = t("prayersSuccessRef") + ": " + data.reference;
  document.getElementById("fridayAnnathanamSuccessMessage").textContent = t("fridayAnnathanamSuccessMessage");
  // Friday Annathanam always collects RM 250 directly (unlike the annual
  // poojas' reserve-only Annathanam role), so this QR block is always
  // shown here — no conditional the way showPrayerSuccess() needs one.
  document.getElementById("fridayAnnathanamSuccessQrEyebrow").textContent = t("qrScanToPay");
  document.getElementById("fridayAnnathanamSuccessQrNote").textContent = t("qrNote");
  document.getElementById("fridayAnnathanamSuccessQrAmount").textContent = "RM " + (data.fee != null ? data.fee : 250);
  document.getElementById("fridayAnnathanamSuccessQrAccount").innerHTML = `
    <div><span>${t("qrAccountName")}</span><span>${DONATION_ACCOUNT.accountName}</span></div>
    <div><span>${t("qrBank")}</span><span>${DONATION_ACCOUNT.bank}</span></div>
    <div><span>${t("qrAccountNo")}</span><span>${DONATION_ACCOUNT.accountNumber}</span></div>
  `;
}

function fetchFridayAnnathanamFromDb(){
  fetch("/.netlify/functions/friday-annathanam-list", { cache: "no-store" })
    .then(res => res.ok ? res.json() : { configured: false })
    .then(data => {
      if (!data.configured || !data.weeks) return; // not set up yet — section stays empty until the SQL migration runs
      FRIDAY_ANNATHANAM_WEEKS = data.weeks;
      renderFridayAnnathanam();
    })
    .catch(err => console.warn("Could not load the live Friday Annathanam schedule:", err));
}

// ============================================================
// NEWS
// ============================================================
function renderNews(){
  const newsList = document.getElementById("newsList");
  newsList.innerHTML = "";
  ANNOUNCEMENTS.forEach(a=>{
    const fullDesc = tf(a,"desc");
    const preview = firstSentence(fullDesc);
    const hasMore = preview.trim() !== fullDesc.trim();
    const row = el(`
      <div class="announce-row">
        <div class="announce-dot"></div>
        <div>
          <h4>${tf(a,"title")}</h4>
          <p>${preview}${hasMore ? ` <span class="announce-more-btn">${t("readMoreBtn")}</span>` : ""}</p>
        </div>
      </div>
    `);
    row.addEventListener("click", () => openAnnounceModal(a));
    newsList.appendChild(row);
  });
}

const announceOverlay = document.getElementById("announceOverlay");
function openAnnounceModal(a){
  document.getElementById("announceModalTitle").textContent = tf(a,"title");
  document.getElementById("announceModalDesc").textContent = tf(a,"desc");
  announceOverlay.classList.add("show");
}
function closeAnnounceModal(){ announceOverlay.classList.remove("show"); }
document.getElementById("announceModalClose").addEventListener("click", closeAnnounceModal);
announceOverlay.addEventListener("click", (ev)=>{ if(ev.target === announceOverlay) closeAnnounceModal(); });

// ============================================================
// CONTACT
// ============================================================
function renderContact(){
  const contactDetails = document.getElementById("contactDetails");
  contactDetails.innerHTML = `
    <h3>${t("getInTouch")}</h3>
    <div class="contact-row">
      <div class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21 C12 21 5 14.5 5 9.8 C5 6.3 7.7 4 11 4 C11.4 4 11.7 4 12 4.1 C12.3 4 12.6 4 13 4 C16.3 4 19 6.3 19 9.8 C19 14.5 12 21 12 21 Z"/><circle cx="12" cy="9.5" r="2.2"/></svg></div>
      <div><b>${CONTACT.orgName}</b><span>${t("regNoLabel")}: ${CONTACT.registrationNo}</span><span>${CONTACT["address_" + currentLang] || CONTACT.address}</span></div>
    </div>
    <div class="contact-row">
      <div class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5 C4 14 10 20 19 20 L19 16.5 L15 15 L13 17 C10.5 15.5 8.5 13.5 7 11 L9 9 L7.5 5 Z" stroke-linejoin="round"/></svg></div>
      <div><b>${t("phoneLabel")}</b><span>${CONTACT.phone}</span></div>
    </div>
    <div class="contact-row">
      <div class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 6.5 L12 13 L20 6.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div><b>${t("emailLabel")}</b><span>${CONTACT.email}</span></div>
    </div>
    <div class="contact-row">
      <div class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 9.5 h.01 M12 9.5 h.01 M15.5 9.5 h.01" stroke-linecap="round"/></svg></div>
      <div><b>${t("followLabel")}</b><span>${CONTACT.social.join(" · ")}</span></div>
    </div>
  `;
  document.getElementById("whatsappNumber").textContent = "+" + CONTACT.whatsappNumber;
}

// ============================================================
// MASTER RENDER
// ============================================================
// Each section renders independently — if one section's content
// (from the CMS or a live sheet) is in an unexpected shape and
// throws, that error is caught and logged, and every other
// section still renders normally instead of the whole page
// silently breaking.
function safeRender(name, fn){
  try { fn(); }
  catch (err) { console.error(`[render] "${name}" failed — that section may be blank, but the rest of the site is unaffected:`, err); }
}

// ============================================================
// NOTICE TICKER (editable from /cms.html's Ticker tab)
// ============================================================
function renderTicker(){
  const bar = document.getElementById("siteTicker");
  if (!TICKER.enabled){ bar.style.display = "none"; return; }
  bar.style.display = "";
  const msg = tf(TICKER, "message");
  document.getElementById("siteTickerItem1").textContent = msg;
  document.getElementById("siteTickerItem2").textContent = msg;
}

// ============================================================
// HOME POPUP (editable from /cms.html's Home Popup tab)
//
// Shows once per visit, right when a visitor enters the site (the
// splash "Enter" button click — see setUpSplashScreenEarly() above),
// not every time they navigate back to Home. Two triggers feed into
// the same maybeShowHomePopup() check because of a timing race: a
// visitor can click Enter before the live CMS content has finished
// loading, so homePopupOnVisitStart() (called on Enter) and the
// "popup" safeApply block in loadLiveContent() (called once live
// data arrives) both attempt the show — whichever happens second is
// the one that actually opens it, guarded by homePopupShown so it
// only ever opens once.
// ============================================================
let homePopupVisitStarted = false;
let homePopupShown = false;
const homePopupOverlay = document.getElementById("homePopupOverlay");
const homePopupImage = document.getElementById("homePopupImage");
const homePopupLinkBtn = document.getElementById("homePopupLinkBtn");

function homePopupOnVisitStart(){
  homePopupVisitStarted = true;
  maybeShowHomePopup();
}

// Shared by the link button and the (optional) clickable image — both
// navigate to whatever screen the CMS's Link field is set to, closing
// the popup first so the visitor lands on a clean screen underneath.
function homePopupNavigate(){
  closeHomePopup();
  if (VALID_SCREENS.includes(POPUP.link_target)) goTo(POPUP.link_target);
}

function maybeShowHomePopup(){
  if (!homePopupVisitStarted || homePopupShown || !POPUP.enabled) return;
  const title = tf(POPUP, "title");
  const message = tf(POPUP, "message");
  const image = POPUP.image_url || "";
  if (!title && !message && !image) return; // nothing to show even if enabled

  document.getElementById("homePopupTitle").textContent = title;
  document.getElementById("homePopupMessage").textContent = message;

  if (image){
    homePopupImage.src = image;
    homePopupImage.hidden = false;
  } else {
    homePopupImage.hidden = true;
    homePopupImage.removeAttribute("src");
  }

  // A link only takes effect when it points at a real, known screen —
  // guards against a stale/renamed screen key left over in the CMS.
  const hasLink = VALID_SCREENS.includes(POPUP.link_target);
  homePopupLinkBtn.hidden = !hasLink;
  homePopupImage.classList.toggle("home-popup-image-linked", hasLink && !!image);
  if (hasLink) homePopupLinkBtn.textContent = tf(POPUP, "link_label") || "View";

  homePopupOverlay.classList.add("show");
  homePopupShown = true;
}
function closeHomePopup(){ homePopupOverlay.classList.remove("show"); }
document.getElementById("homePopupClose").addEventListener("click", closeHomePopup);
homePopupOverlay.addEventListener("click", (ev) => { if (ev.target === homePopupOverlay) closeHomePopup(); });
homePopupLinkBtn.addEventListener("click", homePopupNavigate);
homePopupImage.addEventListener("click", () => { if (VALID_SCREENS.includes(POPUP.link_target)) homePopupNavigate(); });

function renderAll(){
  safeRender("staticText", renderStaticText);
  safeRender("ticker", renderTicker);
  safeRender("homeTiles", renderHomeTiles);
  safeRender("homeTimings", renderHomeTimings);
  safeRender("homeEvents", renderHomeEvents);
  safeRender("homeAnnounce", renderHomeAnnounce);
  safeRender("about", renderAbout);
  safeRender("committee", renderCommittee);
  safeRender("deities", renderDeities);
  safeRender("calendarWeekdays", renderCalendarWeekdays);
  safeRender("calendarGrid", renderCalendarGrid);
  safeRender("timingTabs", renderTimingTabs);
  safeRender("timingList", renderTimingList);
  safeRender("gallery", renderGallery);
  safeRender("sevas", renderSevas);
  safeRender("prayers", renderPrayers);
  safeRender("fridayAnnathanam", renderFridayAnnathanam);
  safeRender("news", renderNews);
  safeRender("contact", renderContact);
  safeRender("clock", tickClock);
}

renderAll();
goTo("home");

// ---------- PWA: register service worker (enables install + offline) ----------
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}

// ============================================================
// LIVE CONTENT FROM THE SITE CMS (netlify/functions/cms-content.js)
// ============================================================
// Replaces the old client-side Google Sheets fetch (10 separate sheet
// tabs) with one request to the CMS backend, which reads Supabase —
// the same tables /cms.html edits. Safe if Supabase isn't configured
// yet or unreachable: cms-content.js returns { configured:false } and
// the site just keeps using the bundled content, exactly as before.
// Seed per-language address fields from the bundled content, so the
// contact card has something to show even before any live content
// arrives (and as the fallback for any language left blank in a row).
if (!CONTACT.address_en) CONTACT.address_en = CONTACT.address;
if (!CONTACT.address_bm) CONTACT.address_bm = CONTACT.address;
if (!CONTACT.address_ta) CONTACT.address_ta = CONTACT.address;

// Converts a normal Google Drive "share" link (any common format) into a
// URL that actually works in an <img src="">. Kept as a defensive
// fallback in case a photo URL is ever set by hand in the Supabase Table
// Editor rather than uploaded through /cms.html (which always stores a
// direct Supabase Storage URL already). If the input doesn't look like a
// Drive link, it's returned as-is.
function driveImageUrl(link){
  if (!link) return "";
  const match = link.match(/[-\w]{25,}/); // Drive file IDs are long alphanumeric tokens
  if (match && link.includes("drive.google.com")) {
    return `https://lh3.googleusercontent.com/d/${match[0]}=w800`;
  }
  return link;
}

const VALID_SCREENS = ["home","about","committee","deities","calendar","timings","gallery","sevas","prayers","fridayAnnathanam","news","membership","contact"];

// Applies one section of the live CMS payload, isolated in its own
// try/catch. A problem with any single field (a field that's missing,
// a global that isn't defined the way this function expects, etc.)
// must never stop the OTHER sections from being applied, and must
// never stop the trailing renderAll() from running — that was a real
// bug here once already (see the ticker section below).
function safeApply(name, fn){
  try { fn(); }
  catch (err) { console.error(`[loadLiveContent] applying "${name}" failed — that section keeps its bundled/previous content, but everything else still updates:`, err); }
}

function loadLiveContent(){
  return fetch("/.netlify/functions/cms-content", { cache: "no-store" })
    .then(res => { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(data => {
      if (!data || !data.configured) return; // not set up yet — keep bundled content

      safeApply("heroBanner", () => {
        if (!data.heroBanner) return;
        const hb = data.heroBanner;
        const setText = (key, val) => { if (val && val.en){ UI.en[key] = val.en; UI.bm[key] = val.bm || val.en; UI.ta[key] = val.ta || val.en; } };
        setText("heroEyebrow", hb.eyebrow);
        setText("heroTitleLine1", hb.titleLine1);
        setText("heroTitleLine2", hb.titleLine2);
        setText("statEstablished", hb.establishedLabel);
        setText("statDevotees", hb.devoteesLabel);
        setText("statEvents", hb.annualEventsLabel);
        setText("heroBtnEvents", hb.upcomingEventsLabel);
        setText("heroBtnTimings", hb.poojaTimingsLabel);
        if (hb.establishedValue) document.getElementById("statEstablishedValue").textContent = hb.establishedValue;
        if (hb.devoteesValue) document.getElementById("statDevoteesValue").textContent = hb.devoteesValue;
        if (hb.annualEventsValue) document.getElementById("statEventsValue").textContent = hb.annualEventsValue;
        if (VALID_SCREENS.includes(hb.upcomingEventsLink)) document.getElementById("heroBtnEvents").setAttribute("data-goto", hb.upcomingEventsLink);
        if (VALID_SCREENS.includes(hb.poojaTimingsLink)) document.getElementById("heroBtnTimings").setAttribute("data-goto", hb.poojaTimingsLink);
        if (hb.imageUrl){
          const heroEl = document.getElementById("heroSection");
          if (heroEl) heroEl.style.setProperty("--hero-img", `url('${hb.imageUrl.replace(/'/g, "\\'")}')`);
        }
      });

      safeApply("navTiles", () => {
        if (!Array.isArray(data.navTiles) || !data.navTiles.length) return;
        TILE_META.length = 0;
        data.navTiles.forEach(t => TILE_META.push(t));
      });

      safeApply("about", () => {
        if (!data.about) return;
        Object.assign(ABOUT, data.about);
      });

      safeApply("deities", () => {
        if (!Array.isArray(data.deities) || !data.deities.length) return;
        DEITIES.length = 0;
        data.deities.forEach(d => { d.image = driveImageUrl(d.image); DEITIES.push(d); });
      });

      safeApply("poojaTimings", () => {
        if (!data.poojaTimings) return;
        const pt = data.poojaTimings;
        if (pt.today && pt.today.length){ POOJA_TIMINGS_TODAY.length = 0; pt.today.forEach(x => POOJA_TIMINGS_TODAY.push(x)); }
        if (pt.weekly){
          if (pt.weekly.daily && pt.weekly.daily.length) POOJA_TIMINGS_WEEKLY.daily = pt.weekly.daily;
          if (pt.weekly.friday && pt.weekly.friday.length) POOJA_TIMINGS_WEEKLY.friday = pt.weekly.friday;
          if (pt.weekly.fullMoon && pt.weekly.fullMoon.length) POOJA_TIMINGS_WEEKLY.fullMoon = pt.weekly.fullMoon;
        }
        if (pt.poojaNames) Object.assign(POOJA_NAME, pt.poojaNames);
      });

      safeApply("sevas", () => {
        if (!Array.isArray(data.sevas) || !data.sevas.length) return;
        SEVAS.length = 0;
        data.sevas.forEach(s => SEVAS.push(s));
      });

      safeApply("announcements", () => {
        if (!Array.isArray(data.announcements) || !data.announcements.length) return;
        ANNOUNCEMENTS.length = 0;
        data.announcements.forEach(a => ANNOUNCEMENTS.push(a));
      });

      safeApply("gallery", () => {
        if (!Array.isArray(data.gallery) || !data.gallery.length) return;
        GALLERY.length = 0;
        data.gallery.forEach(g => GALLERY.push(g));
      });

      safeApply("contact", () => {
        if (!data.contact) return;
        const c = data.contact;
        if (c.orgName) CONTACT.orgName = c.orgName;
        if (c.registrationNo) CONTACT.registrationNo = c.registrationNo;
        if (c.phone) CONTACT.phone = c.phone;
        if (c.email) CONTACT.email = c.email;
        if (c.whatsappNumber) CONTACT.whatsappNumber = c.whatsappNumber;
        if (c.social && c.social.length) CONTACT.social = c.social;
        if (c.address_en){
          CONTACT.address_en = c.address_en;
          CONTACT.address_bm = c.address_bm || c.address_en;
          CONTACT.address_ta = c.address_ta || c.address_en;
        }
        const setContactText = (key, val) => { if (val && val.en){ UI.en[key] = val.en; UI.bm[key] = val.bm || val.en; UI.ta[key] = val.ta || val.en; } };
        setContactText("enquiriesTitle", c.enquiriesHeading);
        setContactText("whatsappCaption", c.whatsappCaption);
        if (c.donationAccount){
          if (c.donationAccount.accountName) DONATION_ACCOUNT.accountName = c.donationAccount.accountName;
          if (c.donationAccount.bank) DONATION_ACCOUNT.bank = c.donationAccount.bank;
          if (c.donationAccount.accountNumber) DONATION_ACCOUNT.accountNumber = c.donationAccount.accountNumber;
        }
      });

      safeApply("ticker", () => {
        if (!data.ticker) return;
        TICKER.enabled = !!data.ticker.enabled;
        if (data.ticker.message_en) TICKER.message_en = data.ticker.message_en;
        TICKER.message_bm = data.ticker.message_bm || "";
        TICKER.message_ta = data.ticker.message_ta || "";
      });

      safeApply("popup", () => {
        // null means the site_popup table doesn't exist yet
        // (add-site-popup.sql not run) or Supabase is unreachable —
        // keep the bundled (disabled) POPUP default in that case.
        if (!data.popup) return;
        POPUP.enabled = !!data.popup.enabled;
        POPUP.title_en = data.popup.title_en || "";
        POPUP.title_bm = data.popup.title_bm || "";
        POPUP.title_ta = data.popup.title_ta || "";
        POPUP.message_en = data.popup.message_en || "";
        POPUP.message_bm = data.popup.message_bm || "";
        POPUP.message_ta = data.popup.message_ta || "";
        POPUP.image_url = data.popup.image_url || "";
        POPUP.link_target = data.popup.link_target || "";
        // A blank link_label from the CMS still falls back to "View"
        // at render time in maybeShowHomePopup(), so the button never
        // shows empty text just because Ravi set a Link but hasn't
        // typed a custom button label yet.
        POPUP.link_label_en = data.popup.link_label_en || "";
        POPUP.link_label_bm = data.popup.link_label_bm || "";
        POPUP.link_label_ta = data.popup.link_label_ta || "";
        // Covers the race where a visitor clicked Enter before this
        // fetch resolved — see the HOME POPUP section above.
        maybeShowHomePopup();
      });

      safeApply("committee", () => {
        // null means the committee_members table doesn't exist yet
        // (add-committee.sql not run) or Supabase is unreachable —
        // keep the bundled COMMITTEE default in that case. Once the
        // table exists, its content (even if some tiers are empty)
        // is treated as the source of truth, same as about/contact.
        if (!data.committee) return;
        COMMITTEE = data.committee;
      });

      safeApply("pageHeadings", () => {
        // null means the page_headings table doesn't exist yet
        // (add-page-headings.sql not run) or Supabase is unreachable —
        // every screen just keeps showing its bundled heading/subtitle
        // from data.js in that case, same as before this feature
        // existed. Reuses the exact same UI[lang][key] strings every
        // screen's own render already reads via t() — no per-screen
        // render function needed, same trick heroBanner uses above.
        if (!data.pageHeadings) return;
        data.pageHeadings.forEach(row => {
          const key = row.screen_key;
          if (!key) return;
          const headingKey = key + "Heading", subKey = key + "Sub";
          if (UI.en[headingKey] === undefined) return; // unknown screen_key — ignore defensively
          if (row.heading_en) {
            UI.en[headingKey] = row.heading_en;
            UI.bm[headingKey] = row.heading_bm || row.heading_en;
            UI.ta[headingKey] = row.heading_ta || row.heading_en;
          }
          if (row.sub_en) {
            UI.en[subKey] = row.sub_en;
            UI.bm[subKey] = row.sub_bm || row.sub_en;
            UI.ta[subKey] = row.sub_ta || row.sub_en;
          }
        });
      });

      safeApply("menuLabels", () => {
        // null means the menu_labels table doesn't exist yet
        // (add-page-headings-and-menu-labels.sql not run) or Supabase
        // is unreachable — every side-menu item just keeps showing its
        // bundled label from data.js in that case. Same trick as
        // pageHeadings above: mutates UI[lang]["nav"+Key] directly, and
        // the existing [data-i18n] loop in renderStaticText() picks it
        // up automatically — no per-item render code needed.
        if (!data.menuLabels) return;
        data.menuLabels.forEach(row => {
          const key = row.screen_key;
          if (!key) return;
          const navKey = "nav" + key.charAt(0).toUpperCase() + key.slice(1);
          if (UI.en[navKey] === undefined) return; // unknown screen_key — ignore defensively
          if (row.label_en) {
            UI.en[navKey] = row.label_en;
            UI.bm[navKey] = row.label_bm || row.label_en;
            UI.ta[navKey] = row.label_ta || row.label_en;
          }
        });
      });

      renderAll();
    })
    .catch(err => {
      console.warn("Could not load live CMS content — using bundled content instead:", err);
    });
}

loadLiveContent();
fetchPrayersFromDb();
fetchFridayAnnathanamFromDb();

// ============================================================
// KEEP AN ALREADY-OPEN PAGE IN SYNC WITH THE CMS
// ============================================================
// loadLiveContent() above only ever ran once, right when the page
// first opened — a device that's freshly opened or reloaded always
// gets the latest CMS content (see the "no-store" fetch above), but
// one that's just sitting open would not, until someone reloaded it.
// That matters most for a kiosk tablet mounted somewhere and left
// running for hours or days.
//
// This applies equally to every device — a phone or tablet browser,
// or the installed PWA "app" — since they all run this exact same
// script.js; there's no separate native app build to update.
//
// Two triggers, both reusing loadLiveContent() itself so this can
// never drift from what a fresh page load already does correctly:
//   1. a periodic re-check every few minutes, and
//   2. an immediate re-check whenever the page becomes visible again
//      — the screen wakes up, the browser tab is switched back to, or
//      the app is brought back to the foreground. This is the one
//      that matters most for a kiosk whose screen has been asleep.
//
// A visitor who's mid-way through a Prayer/Friday Annathanam booking
// form is unaffected — that form lives in its own popup, which this
// never touches; only the underlying lists/content refresh under it.
const LIVE_CONTENT_REFRESH_MS = 3 * 60 * 1000; // 3 minutes — adjust if needed
let liveContentRefreshInFlight = false;
function refreshLiveContentIfIdle(){
  if (liveContentRefreshInFlight) return;
  liveContentRefreshInFlight = true;
  Promise.resolve(loadLiveContent()).finally(() => { liveContentRefreshInFlight = false; });
}
setInterval(refreshLiveContentIfIdle, LIVE_CONTENT_REFRESH_MS);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshLiveContentIfIdle();
});

// ============================================================
// PUSH NOTIFICATIONS — bell button in the top bar
// ============================================================
// Lets a visitor opt in on their own device to receive push
// notifications the temple sends from the "Push Notifications" tab
// in /cms.html (e.g. "Special pooja today at 6pm"). Nothing is sent
// automatically — this only wires up the subscribe/unsubscribe side.
//
// This public key is safe to ship in the page source — it's how the
// browser proves to Apple/Google/Mozilla's push service which app is
// asking to send notifications; it's not a secret. The matching
// private key lives only in the cms-push-send.js Netlify Function's
// environment variables, never in this file.
const VAPID_PUBLIC_KEY = "BE1CchgL8b29u88JqWShwxoMmz1NBI37bXL25dE1bZr6WLaxmpkyUKKLBD2rKJrkq5281niBV5KwB02lcC6HlEg";

function urlBase64ToUint8Array(base64String){
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

const notifBellBtn = document.getElementById("notifBellBtn");
const pushSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
  && location.protocol !== "file:";

function setBellState(state){
  // state: "off" | "on" | "denied" | "busy"
  if (!notifBellBtn) return;
  notifBellBtn.classList.toggle("active", state === "on");
  notifBellBtn.classList.toggle("denied", state === "denied");
  notifBellBtn.disabled = state === "busy";
  const titles = {
    off: "Turn on notifications for temple updates",
    on: "Notifications are on — tap to turn off",
    denied: "Notifications are blocked — enable them in your browser's site settings",
    busy: "Please wait…"
  };
  notifBellBtn.title = titles[state] || titles.off;
  notifBellBtn.setAttribute("aria-label", titles[state] || titles.off);
}

async function refreshBellState(){
  if (!pushSupported || !notifBellBtn) return;
  if (Notification.permission === "denied"){ setBellState("denied"); return; }
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setBellState(sub ? "on" : "off");
  } catch (err){
    setBellState("off");
  }
}

async function subscribeToPush(){
  setBellState("busy");
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted"){
      setBellState(permission === "denied" ? "denied" : "off");
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub){
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }
    await fetch("/.netlify/functions/push-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON())
    });
    setBellState("on");
  } catch (err){
    console.error("Push subscribe failed:", err);
    setBellState("off");
  }
}

async function unsubscribeFromPush(){
  setBellState("busy");
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub){
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      fetch("/.netlify/functions/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsubscribe", endpoint })
      }).catch(() => {});
    }
    setBellState("off");
  } catch (err){
    console.error("Push unsubscribe failed:", err);
    setBellState("off");
  }
}

if (notifBellBtn){
  if (!pushSupported){
    notifBellBtn.style.display = "none";
  } else {
    notifBellBtn.addEventListener("click", () => {
      if (notifBellBtn.classList.contains("denied")){
        alert("Notifications are blocked for this site. Enable them in your browser's site settings, then tap this bell again.");
        return;
      }
      if (notifBellBtn.classList.contains("active")) unsubscribeFromPush();
      else subscribeToPush();
    });
    window.addEventListener("load", refreshBellState);
  }
}

// ============================================================
// MEMBERSHIP STATUS CHECK
// Looks up a member by Membership No. via a secure server-side
// function (netlify/functions/check-membership.js). The full member
// list is never sent to the browser — only the single matched
// record (or a not-found result) for the Membership No. the visitor
// typed in. Switched from NRIC to Membership No. as the public
// search key since NRIC is a sensitive government ID number.
// ============================================================
const membershipNoInput = document.getElementById("membershipNoInput");
const membershipCheckBtn = document.getElementById("membershipCheckBtn");
const membershipErrorText = document.getElementById("membershipErrorText");
const membershipResult = document.getElementById("membershipResult");
const MEMBERSHIP_STATUS_KEYS = {
  "active": "membershipStatusActive",
  "not active": "membershipStatusNotActive",
  "pending for annual renewal": "membershipStatusPending"
};

if (membershipNoInput){
  membershipNoInput.addEventListener("input", () => {
    hideMembershipError();
    hideMembershipResult();
  });
  membershipNoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkMembership();
  });
}
if (membershipCheckBtn) membershipCheckBtn.addEventListener("click", checkMembership);
const membershipPrintBtn = document.getElementById("membershipPrintBtn");
if (membershipPrintBtn) membershipPrintBtn.addEventListener("click", () => window.print());

function hideMembershipError(){ membershipErrorText.style.display = "none"; }
function showMembershipError(key){
  membershipErrorText.textContent = t(key);
  membershipErrorText.style.display = "block";
}
function hideMembershipResult(){ membershipResult.style.display = "none"; }

async function checkMembership(){
  const membershipNo = membershipNoInput.value.trim();
  hideMembershipError();
  hideMembershipResult();

  if (!membershipNo){
    showMembershipError("membershipInvalidFormat");
    return;
  }

  membershipCheckBtn.disabled = true;
  const originalLabel = document.getElementById("membershipCheckBtnText").textContent;
  document.getElementById("membershipCheckBtnText").textContent = t("membershipChecking");

  try {
    const res = await fetch(`/.netlify/functions/check-membership?membershipNo=${encodeURIComponent(membershipNo)}`);
    if (res.status === 404){
      showMembershipError("membershipNotFound");
    } else if (!res.ok){
      showMembershipError("membershipError");
    } else {
      const data = await res.json();
      document.getElementById("membershipResultName").textContent = data.name || "";
      document.getElementById("membershipResultNo").textContent = data.membershipNo || membershipNo;
      const typeKey = (data.membershipType || "").trim().toLowerCase() === "life" ? "membershipTypeLife" : "membershipTypeOrdinary";
      document.getElementById("membershipResultType").textContent = t(typeKey);
      const statusRaw = (data.status || "Active").trim().toLowerCase();
      const statusKey = MEMBERSHIP_STATUS_KEYS[statusRaw] || "membershipStatusActive";
      document.getElementById("membershipResultStatusText").textContent = t(statusKey);
      const dot = document.getElementById("membershipResultStatusDot");
      dot.classList.remove("dot-green", "dot-red");
      dot.classList.add(statusRaw === "active" ? "dot-green" : "dot-red");
      membershipResult.style.display = "block";
    }
  } catch (err){
    console.warn("Membership check failed:", err);
    showMembershipError("membershipError");
  } finally {
    membershipCheckBtn.disabled = false;
    document.getElementById("membershipCheckBtnText").textContent = originalLabel;
  }
}
