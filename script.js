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
  });
})();

let currentLang = "en";
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
  fridayAnnathanam: `<path d="M5 11 C5 16 8 20 12 20 C16 20 19 16 19 11" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 11 H20" stroke-linecap="round"/><path d="M9 11 V6.5 C9 5 10.5 4 12 4" stroke-linecap="round"/><circle cx="12" cy="3.3" r="0.9" fill="currentColor" stroke="none"/>`
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
  home:"navHome", about:"navAbout", deities:"navDeities", calendar:"navCalendar",
  timings:"navTimings", gallery:"navGallery", sevas:"navSevas", prayers:"navPrayers",
  fridayAnnathanam:"navFridayAnnathanam", news:"navNews",
  membership:"navMembership", contact:"navContact"
};
let currentScreen = "home";

function goTo(name){
  currentScreen = name;
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

  document.getElementById("deitiesHeadingText").textContent = t("deitiesHeading");
  document.getElementById("deitiesSubText").textContent = t("deitiesSub");

  document.getElementById("calendarHeadingText").textContent = t("calendarHeading");
  document.getElementById("calendarSubText").textContent = t("calendarSub");
  document.getElementById("calToday").textContent = t("calToday");

  document.getElementById("timingsHeadingText").textContent = t("timingsHeading");
  document.getElementById("timingsSubText").textContent = t("timingsSub");

  document.getElementById("galleryHeadingText").textContent = t("galleryHeading");
  document.getElementById("gallerySubText").textContent = t("gallerySub");

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
  const iconMap = { about: ICONS.about, deities: ICONS.deities, calendar: ICONS.calendar, timings: ICONS.timings, sevas: ICONS.sevas, prayers: ICONS.prayers, fridayAnnathanam: ICONS.fridayAnnathanam };
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
// GALLERY
// ============================================================
function renderGallery(){
  const galleryGrid = document.getElementById("galleryGrid");
  galleryGrid.innerHTML = "";
  GALLERY.forEach((g,i)=>{
    // Photos uploaded through /cms.html's Gallery tab show as a real
    // <img>; any entry with no photo yet still falls back to the
    // colored placeholder + icon (so an empty gallery never looks broken).
    const photo = g.image
      ? `<img class="gallery-photo" src="${g.image}" alt="${tf(g,"label")}" loading="lazy" />`
      : `<div class="gallery-ph" style="background:${PANEL_COLORS[i % PANEL_COLORS.length]}"><svg viewBox="0 0 24 24" fill="none">${GALLERY_ICON}</svg></div>`;
    galleryGrid.appendChild(el(`
      <div class="gallery-item">
        ${photo}
        <div class="gallery-cap"><b>${tf(g,"label")}</b><span>${tf(g,"category")}</span></div>
      </div>
    `));
  });
}

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

function renderPrayerGrid(){
  const grid = document.getElementById("prayerGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const list = (typeof ANNUAL_PRAYERS !== "undefined" ? ANNUAL_PRAYERS : []).slice().sort((a,b)=> a.date.localeCompare(b.date));
  const filtered = list.filter(p=>{
    const over = prayerIsOver(p);
    if (currentPrayerFilter === "upcoming") return !over;
    if (currentPrayerFilter === "over") return over;
    return true;
  });

  if (!filtered.length){
    grid.appendChild(el(`<p style="font-size:13px;color:var(--ink-600);margin:0;grid-column:1/-1;">${t("calNoEvents")}</p>`));
    return;
  }

  filtered.forEach(p=>{
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
    grid.appendChild(card);
  });
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

function renderFridayAnnathanam(){
  const wrap = document.getElementById("fridayAnnathanamList");
  if (!wrap) return;
  document.getElementById("fridayAnnathanamHeadingText").textContent = t("fridayAnnathanamHeading");
  document.getElementById("fridayAnnathanamSubText").textContent = t("fridayAnnathanamSub");
  wrap.innerHTML = "";

  // Only today-forward Fridays are shown — a past Friday isn't orderable
  // any more (register-friday-annathanam.js's DATE_OVER check would
  // reject it anyway), so there's no reason to clutter the public list
  // with it. The admin tab is where the full history stays visible.
  const upcoming = FRIDAY_ANNATHANAM_WEEKS
    .filter(w => w.date >= todayIso)
    .sort((a,b)=>a.date.localeCompare(b.date));

  if (!upcoming.length){
    wrap.appendChild(el(`<p style="font-size:13px;color:var(--ink-600);margin:0;">${t("fridayAnnathanamNoUpcoming")}</p>`));
    return;
  }

  upcoming.forEach(w => {
    const status = fridayAnnathanamStatus(w);
    const pillClass = status === "open" ? "open" : "taken";
    const badgeKey = status === "open" ? "fridayAnnathanamOpenBadge" : status === "sponsored" ? "fridayAnnathanamSponsoredBadge" : "fridayAnnathanamSkippedBadge";
    // Same compact day-number/month-abbreviation date badge used on the
    // Prayers & Registration pooja cards (.prayer-card-date), instead of
    // a plain text date — keeps the date style consistent across both
    // screens.
    const row = el(`
      <div class="prayer-modal-row">
        <div class="prayer-card-date"><b>${dayNum(w.date)}</b><small>${monthAbbr(w.date)}</small></div>
        <span class="prayer-role-pill ${pillClass}">${t(badgeKey)}</span>
        ${w.sponsorName ? `<span class="prayer-modal-row-sponsor">${w.sponsorName}</span>` : ""}
      </div>
    `);
    if (status === "open"){
      const btn = el(`<button class="prayer-btn-ghost" style="flex-basis:100%;margin-top:6px;padding:8px 14px;font-size:12px;">${t("fridayAnnathanamSponsorBtn")}</button>`);
      btn.addEventListener("click", ()=>openFridayAnnathanamForm(w));
      row.appendChild(btn);
    }
    wrap.appendChild(row);
  });
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

function renderAll(){
  safeRender("staticText", renderStaticText);
  safeRender("homeTiles", renderHomeTiles);
  safeRender("homeTimings", renderHomeTimings);
  safeRender("homeEvents", renderHomeEvents);
  safeRender("homeAnnounce", renderHomeAnnounce);
  safeRender("about", renderAbout);
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

const VALID_SCREENS = ["home","about","deities","calendar","timings","gallery","sevas","prayers","fridayAnnathanam","news","membership","contact"];

function loadLiveContent(){
  fetch("/.netlify/functions/cms-content", { cache: "no-store" })
    .then(res => { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(data => {
      if (!data || !data.configured) return; // not set up yet — keep bundled content

      if (data.heroBanner){
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
      }

      if (Array.isArray(data.navTiles) && data.navTiles.length){
        TILE_META.length = 0;
        data.navTiles.forEach(t => TILE_META.push(t));
      }

      if (data.about){
        Object.assign(ABOUT, data.about);
      }

      if (Array.isArray(data.deities) && data.deities.length){
        DEITIES.length = 0;
        data.deities.forEach(d => { d.image = driveImageUrl(d.image); DEITIES.push(d); });
      }

      if (data.poojaTimings){
        const pt = data.poojaTimings;
        if (pt.today && pt.today.length){ POOJA_TIMINGS_TODAY.length = 0; pt.today.forEach(x => POOJA_TIMINGS_TODAY.push(x)); }
        if (pt.weekly){
          if (pt.weekly.daily && pt.weekly.daily.length) POOJA_TIMINGS_WEEKLY.daily = pt.weekly.daily;
          if (pt.weekly.friday && pt.weekly.friday.length) POOJA_TIMINGS_WEEKLY.friday = pt.weekly.friday;
          if (pt.weekly.fullMoon && pt.weekly.fullMoon.length) POOJA_TIMINGS_WEEKLY.fullMoon = pt.weekly.fullMoon;
        }
        if (pt.poojaNames) Object.assign(POOJA_NAME, pt.poojaNames);
      }

      if (Array.isArray(data.sevas) && data.sevas.length){
        SEVAS.length = 0;
        data.sevas.forEach(s => SEVAS.push(s));
      }

      if (Array.isArray(data.announcements) && data.announcements.length){
        ANNOUNCEMENTS.length = 0;
        data.announcements.forEach(a => ANNOUNCEMENTS.push(a));
      }

      if (Array.isArray(data.gallery) && data.gallery.length){
        GALLERY.length = 0;
        data.gallery.forEach(g => GALLERY.push(g));
      }

      if (data.contact){
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
      }

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
