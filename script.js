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
  prayers: `<path d="M12 3 C13 6 15 8 15 11 C15 13.5 13.5 15 12 15 C10.5 15 9 13.5 9 11 C9 8 11 6 12 3 Z" stroke-linejoin="round"/><path d="M6 19 C6 17 8.5 15.5 12 15.5 C15.5 15.5 18 17 18 19" stroke-linecap="round"/><path d="M4 19 H20" stroke-linecap="round"/>`
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
  timings:"navTimings", gallery:"navGallery", sevas:"navSevas", prayers:"navPrayers", news:"navNews",
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
  document.getElementById("membershipNricInput").placeholder = t("membershipPlaceholder");
  document.getElementById("membershipCheckBtnText").textContent = t("membershipCheckBtn");
  document.getElementById("membershipHintText").textContent = t("membershipHint");
  document.getElementById("membershipResultNameLabel").textContent = t("membershipResultName");
  document.getElementById("membershipResultNricLabel").textContent = t("membershipResultNric");
  document.getElementById("membershipResultNoLabel").textContent = t("membershipResultNo");
  document.getElementById("membershipResultTypeLabel").textContent = t("membershipResultType");

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
  const iconMap = { about: ICONS.about, deities: ICONS.deities, calendar: ICONS.calendar, timings: ICONS.timings, sevas: ICONS.sevas, prayers: ICONS.prayers };
  TILE_META.forEach(tItem=>{
    const btn = el(`
      <button class="tile" data-goto="${tItem.key}">
        <div class="tile-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${iconMap[tItem.key]}</svg></div>
        <h3>${tItem.title[currentLang]}</h3>
        <p>${tItem.desc[currentLang]}</p>
      </button>
    `);
    btn.addEventListener("click", ()=>goTo(tItem.key));
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
  EVENTS.slice().sort((a,b)=> a.iso.localeCompare(b.iso))
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
// eventsByDate is rebuilt on every render (not built once at load) — this
// matters because EVENTS gets replaced with fresh data from the Google
// Sheet after the page has already loaded, and this lookup needs to stay
// in sync with whatever EVENTS currently holds.
function buildEventsByDate(){
  const map = {};
  EVENTS.forEach(e => { (map[e.iso] = map[e.iso] || []).push(e); });
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
  const monthEvents = EVENTS.filter(e => e.iso.startsWith(monthPrefix)).sort((a,b)=> a.iso.localeCompare(b.iso));

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
    galleryGrid.appendChild(el(`
      <div class="gallery-item">
        <div class="gallery-ph" style="background:${PANEL_COLORS[i % PANEL_COLORS.length]}">
          <svg viewBox="0 0 24 24" fill="none">${GALLERY_ICON}</svg>
        </div>
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
            <span class="prayer-role-pill ${ubayakararTaken ? "taken" : "open"}">${t("prayersUbayakararLabel")}: ${ubayakararTaken ? t("prayersTakenBadge") : t("prayersOpenBadge")}</span>
            <span class="prayer-role-pill ${annathanamTaken ? "taken" : "open"}">${t("prayersAnnathanamLabel")}: ${annathanamTaken ? t("prayersTakenBadge") : t("prayersOpenBadge")}</span>
            ${p.participantsEnabled ? `<span class="prayer-role-pill open">${t("prayersParticipantLabel")}</span>` : ""}
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
  return `
    <div class="prayer-modal-row">
      <span class="prayer-modal-row-label">${label}</span>
      <span class="prayer-role-pill ${taken ? "taken" : "open"}">${taken ? t("prayersTakenBadge") : t("prayersOpenBadge")}</span>
      ${sponsor ? `<span class="prayer-modal-row-sponsor">${sponsor}</span>` : ""}
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
    rowsHtml += `<div class="prayer-modal-row"><span class="prayer-modal-row-label">${t("prayersFeeLabel")}</span><span class="prayer-modal-row-sponsor">RM ${p.ubayamFee.toLocaleString()}</span></div>`;
  }
  if (p.participantsEnabled){
    const feeText = p.participantFee ? `RM ${p.participantFee} ${t("prayersPerPersonLabel")}` : t("prayersOpenBadge");
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
      amountEl.textContent = "RM " + data.fee;
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
      renderPrayers();
      if (currentPrayerModal) openPrayerModal(currentPrayerModal);
    })
    .catch(err => console.warn("Could not load the live Annual Prayers schedule — showing bundled data only:", err));
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
// LIVE CONTENT FROM A GOOGLE SHEET (optional — safe if unset)
// ============================================================
// Fill in SHEET_ID once the Sheet exists and its sharing is set to
// "Anyone with the link — Viewer". Until then this is a no-op and the
// site just uses the bundled content, exactly as before.
// Seed per-language address fields from the bundled content, so the
// contact card has something to show even before any live sheet data
// arrives (and as the fallback for any language left blank in the sheet).
if (!CONTACT.address_en) CONTACT.address_en = CONTACT.address;
if (!CONTACT.address_bm) CONTACT.address_bm = CONTACT.address;
if (!CONTACT.address_ta) CONTACT.address_ta = CONTACT.address;

const SHEET_ID = "18_VoVU1CGM8uRhxcRJP_LSUCDRuc-GDrmefMj3debMg";

// Snapshot of the bundled deity photos/colors, keyed by English name, taken
// before any live sheet data overwrites DEITIES. Used so that leaving the
// "Photo Link" cell blank in the sheet means "keep using the current photo"
// instead of showing a broken image.
const BUNDLED_DEITIES_BY_NAME = {};
DEITIES.forEach(d => { BUNDLED_DEITIES_BY_NAME[d.name_en] = d; });

// Converts a normal Google Drive "share" link (any common format) into a
// URL that actually works in an <img src="">. If the input doesn't look
// like a Drive link, it's returned as-is (so a direct image URL from
// anywhere else still works too).
function driveImageUrl(link){
  if (!link) return "";
  const match = link.match(/[-\w]{25,}/); // Drive file IDs are long alphanumeric tokens
  if (match && link.includes("drive.google.com")) {
    return `https://lh3.googleusercontent.com/d/${match[0]}=w800`;
  }
  return link;
}

function sheetCsvUrl(tabName){
  // A cache-busting timestamp param, since Google's gviz CSV export can
  // otherwise serve a stale cached response for several minutes after a
  // sheet edit, and the browser's own fetch cache can do the same.
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&_=${Date.now()}`;
}

// The name-based gviz/tq endpoint above has been observed to serve a
// stubbornly stale cached response for the HeroBanner tab specifically,
// even minutes after edits and even with cache-busting. The gid-based
// export endpoint below has proven reliable for it, so HeroBanner uses
// this instead. (Find a tab's gid in its URL: .../edit#gid=XXXXXXX)
const TAB_GID = { HeroBanner: "171468680", Contact: "877259840" };

function sheetCsvUrlByGid(gid){
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}&_=${Date.now()}`;
}

function fetchSheetTab(tabName){
  const url = TAB_GID[tabName] ? sheetCsvUrlByGid(TAB_GID[tabName]) : sheetCsvUrl(tabName);
  return fetch(url, { cache: "no-store" })
    .then(res => { if(!res.ok) throw new Error("HTTP " + res.status); return res.text(); })
    .then(text => new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        // Trims stray leading/trailing spaces in column headers (e.g. a
        // header typed as "English " instead of "English"), since a
        // mismatched key silently breaks every lookup for that column
        // with no visible error.
        transformHeader: (h) => h.trim(),
        complete: (results) => resolve(results.data),
        error: reject
      });
    }))
    .catch(err => {
      // A problem with ONE tab (wrong name, doesn't exist yet, etc.) must
      // never take down the others — resolve to "no rows" instead of
      // rejecting, so every other tab still updates normally.
      console.warn(`Could not load the "${tabName}" sheet tab — that section will keep its current content:`, err);
      return [];
    });
}

function loadLiveContent(){
  if (!SHEET_ID) return;

  Promise.all([
    fetchSheetTab("Events"),
    fetchSheetTab("Announcements"),
    fetchSheetTab("PoojaTimings"),
    fetchSheetTab("PoojaNames"),
    fetchSheetTab("Sevas"),
    fetchSheetTab("Deities"),
    fetchSheetTab("AboutInfo"),
    fetchSheetTab("AboutHistory"),
    fetchSheetTab("AboutActivities"),
    fetchSheetTab("HeroBanner"),
    fetchSheetTab("Contact")
  ]).then(([eventsRows, annRows, timingsRows, namesRows, sevasRows, deitiesRows, aboutInfoRows, aboutHistoryRows, aboutActivitiesRows, heroRows, contactRows]) => {

    if (eventsRows.length){
      const fresh = eventsRows
        .map(r => ({
          iso: (r["Date (YYYY-MM-DD)"] || "").trim(),
          title: (r["Title"] || "").trim(),
          title_bm: (r["Title (Malay)"] || "").trim(),
          title_ta: (r["Title (Tamil)"] || "").trim(),
          desc: (r["Description"] || "").trim(),
          desc_bm: (r["Description (Malay)"] || "").trim(),
          desc_ta: (r["Description (Tamil)"] || "").trim()
        }))
        .filter(e => e.iso && e.title);
      if (fresh.length){ EVENTS.length = 0; fresh.forEach(e => EVENTS.push(e)); }
    }

    if (annRows.length){
      const fresh = annRows.map(r => ({
        title_en: r["Title (English)"] || "", title_bm: r["Title (Malay)"] || "", title_ta: r["Title (Tamil)"] || "",
        desc_en: r["Description (English)"] || "", desc_bm: r["Description (Malay)"] || "", desc_ta: r["Description (Tamil)"] || ""
      })).filter(a => a.title_en);
      if (fresh.length){ ANNOUNCEMENTS.length = 0; fresh.forEach(a => ANNOUNCEMENTS.push(a)); }
    }

    if (timingsRows.length){
      const byList = { today: [], daily: [], friday: [], fullMoon: [] };
      timingsRows.forEach(r => {
        const list = (r["List (today / daily / friday / fullMoon)"] || "").trim();
        const name = (r["Pooja Name"] || "").trim();
        const time = (r["Time"] || "").trim();
        if (byList[list] && name && time) byList[list].push({ name, time });
      });
      if (byList.today.length){ POOJA_TIMINGS_TODAY.length = 0; byList.today.forEach(x => POOJA_TIMINGS_TODAY.push(x)); }
      if (byList.daily.length) POOJA_TIMINGS_WEEKLY.daily = byList.daily;
      if (byList.friday.length) POOJA_TIMINGS_WEEKLY.friday = byList.friday;
      if (byList.fullMoon.length) POOJA_TIMINGS_WEEKLY.fullMoon = byList.fullMoon;
    }

    if (namesRows.length){
      namesRows.forEach(r => {
        const key = (r["Key (must match Pooja Name above)"] || "").trim();
        if (key) POOJA_NAME[key] = { bm: r["Malay"] || "", ta: r["Tamil"] || "" };
      });
    }

    if (sevasRows.length){
      const fresh = sevasRows.map(r => ({
        name_en: r["Name (EN)"] || "", name_bm: r["Name (BM)"] || "", name_ta: r["Name (TA)"] || "",
        price_en: r["Price (EN)"] || "", price_bm: r["Price (BM)"] || "", price_ta: r["Price (TA)"] || "",
        desc_en: r["Description (EN)"] || "", desc_bm: r["Description (BM)"] || "", desc_ta: r["Description (TA)"] || "",
        cta_en: r["Button Text (EN)"] || "", cta_bm: r["Button Text (BM)"] || "", cta_ta: r["Button Text (TA)"] || ""
      })).filter(s => s.name_en);
      if (fresh.length){ SEVAS.length = 0; fresh.forEach(s => SEVAS.push(s)); }
    }

    if (deitiesRows.length){
      const fresh = deitiesRows.map(r => {
        const name_en = (r["Name (EN)"] || "").trim();
        const bundled = BUNDLED_DEITIES_BY_NAME[name_en];
        const photoInput = (r["Photo Link (leave blank to keep current photo)"] || "").trim();
        return {
          name_en,
          name_bm: r["Name (BM)"] || "",
          name_ta: r["Name (TA)"] || "",
          role_en: r["Role (EN)"] || "",
          role_bm: r["Role (BM)"] || "",
          role_ta: r["Role (TA)"] || "",
          description_en: r["Description (EN)"] || "",
          description_bm: r["Description (BM)"] || "",
          description_ta: r["Description (TA)"] || "",
          color: bundled ? bundled.color : "#711821",
          image: photoInput ? driveImageUrl(photoInput) : (bundled ? bundled.image : "")
        };
      }).filter(d => d.name_en);
      if (fresh.length){ DEITIES.length = 0; fresh.forEach(d => DEITIES.push(d)); }
    }

    if (aboutInfoRows.length){
      aboutInfoRows.forEach(r => {
        const field = (r["Field (Vision / Mission)"] || "").trim().toLowerCase();
        const en = (r["English"] || "").trim();
        const bm = (r["Malay"] || "").trim();
        const ta = (r["Tamil"] || "").trim();
        if (field === "vision" && en){ ABOUT.vision_en = en; ABOUT.vision_bm = bm || en; ABOUT.vision_ta = ta || en; }
        if (field === "mission" && en){ ABOUT.mission_en = en; ABOUT.mission_bm = bm || en; ABOUT.mission_ta = ta || en; }
      });
    }

    if (aboutHistoryRows.length){
      const en = aboutHistoryRows.map(r => (r["Paragraph (EN)"] || "").trim()).filter(Boolean);
      const bm = aboutHistoryRows.map(r => (r["Paragraph (BM)"] || "").trim()).filter(Boolean);
      const ta = aboutHistoryRows.map(r => (r["Paragraph (TA)"] || "").trim()).filter(Boolean);
      if (en.length){
        ABOUT.history_en = en;
        ABOUT.history_bm = bm.length === en.length ? bm : en;
        ABOUT.history_ta = ta.length === en.length ? ta : en;
      }
    }

    if (aboutActivitiesRows.length){
      const en = aboutActivitiesRows.map(r => (r["Activity (EN)"] || "").trim()).filter(Boolean);
      const bm = aboutActivitiesRows.map(r => (r["Activity (BM)"] || "").trim()).filter(Boolean);
      const ta = aboutActivitiesRows.map(r => (r["Activity (TA)"] || "").trim()).filter(Boolean);
      if (en.length){
        ABOUT.activities_en = en;
        ABOUT.activities_bm = bm.length === en.length ? bm : en;
        ABOUT.activities_ta = ta.length === en.length ? ta : en;
      }
    }

    // HeroBanner tab: one row per field, columns Field / English / Malay / Tamil.
    // Text fields (Eyebrow, Title Line 1, Title Line 2) are per-language.
    // Number fields (Established Year, Devotees, Annual Events) use the
    // English column only, since digits don't change across languages.
    if (heroRows.length){
      const byField = {};
      heroRows.forEach(r => {
        const field = (r["Field"] || "").trim();
        if (field) byField[field] = { en: (r["English"] || "").trim(), bm: (r["Malay"] || "").trim(), ta: (r["Tamil"] || "").trim() };
      });
      const setText = (field, key) => {
        const row = byField[field];
        if (row && row.en){
          UI.en[key] = row.en;
          UI.bm[key] = row.bm || row.en;
          UI.ta[key] = row.ta || row.en;
        }
      };
      setText("Eyebrow", "heroEyebrow");
      setText("Title Line 1", "heroTitleLine1");
      setText("Title Line 2", "heroTitleLine2");
      setText("Established Label", "statEstablished");
      setText("Devotees Label", "statDevotees");
      setText("Annual Events Label", "statEvents");
      setText("Upcoming Events Label", "heroBtnEvents");
      setText("Pooja Timings Label", "heroBtnTimings");

      // Button destinations: which internal screen each hero button opens.
      // Valid values: home, about, deities, calendar, timings, gallery,
      // sevas, news, membership, contact. Falls back to the current
      // destination if the sheet cell is blank or not one of these.
      const VALID_SCREENS = ["home","about","deities","calendar","timings","gallery","sevas","news","membership","contact"];
      const setLink = (field, elId) => {
        const row = byField[field];
        const dest = row && row.en ? row.en.trim().toLowerCase() : "";
        if (VALID_SCREENS.includes(dest)) document.getElementById(elId).setAttribute("data-goto", dest);
      };
      setLink("Upcoming Events Link", "heroBtnEvents");
      setLink("Pooja Timings Link", "heroBtnTimings");

      const setNumber = (field, elId) => {
        const row = byField[field];
        if (row && row.en) document.getElementById(elId).textContent = row.en;
      };
      setNumber("Established Year", "statEstablishedValue");
      setNumber("Devotees", "statDevoteesValue");
      setNumber("Annual Events", "statEventsValue");
    }

    // Contact tab: one row per field. orgName/registrationNo/phone/email/
    // whatsappNumber/social are the same regardless of language (English
    // column only). Address is translated per language since it's the one
    // field that genuinely differs — falls back to English if a language
    // cell is left blank.
    if (contactRows.length){
      const byContactField = {};
      contactRows.forEach(r => {
        const field = (r["Field"] || "").trim();
        if (field) byContactField[field] = { en: (r["English"] || "").trim(), bm: (r["Malay"] || "").trim(), ta: (r["Tamil"] || "").trim() };
      });
      const plain = (field) => byContactField[field] && byContactField[field].en;

      if (plain("Organisation Name")) CONTACT.orgName = plain("Organisation Name");
      if (plain("Registration No")) CONTACT.registrationNo = plain("Registration No");
      if (plain("Phone")) CONTACT.phone = plain("Phone");
      if (plain("Email")) CONTACT.email = plain("Email");
      if (plain("WhatsApp Number")) CONTACT.whatsappNumber = plain("WhatsApp Number");
      if (plain("Social Links")) CONTACT.social = plain("Social Links").split(",").map(s => s.trim()).filter(Boolean);

      const addrRow = byContactField["Address"];
      if (addrRow && addrRow.en){
        CONTACT.address_en = addrRow.en;
        CONTACT.address_bm = addrRow.bm || addrRow.en;
        CONTACT.address_ta = addrRow.ta || addrRow.en;
      }

      // Enquiries card: heading, caption, and the WhatsApp number shown
      // there. Heading/caption are per-language; the number itself is
      // the same regardless of language, sourced from the field above.
      const setContactText = (field, key) => {
        const row = byContactField[field];
        if (row && row.en){
          UI.en[key] = row.en;
          UI.bm[key] = row.bm || row.en;
          UI.ta[key] = row.ta || row.en;
        }
      };
      setContactText("Enquiries Heading", "enquiriesTitle");
      setContactText("Enquiries Caption", "whatsappCaption");
    }

    renderAll();
  }).catch(err => {
    console.warn("Could not load live sheet content — using bundled content instead:", err);
  });
}

loadLiveContent();
fetchPrayersFromDb();

// ============================================================
// MEMBERSHIP STATUS CHECK
// Looks up a member by NRIC via a secure server-side function
// (netlify/functions/check-membership.js). The full member list
// is never sent to the browser — only the single matched record
// (or a not-found result) for the NRIC the visitor typed in.
// ============================================================
const NRIC_PATTERN = /^\d{6}-\d{2}-\d{4}$/;
const membershipNricInput = document.getElementById("membershipNricInput");
const membershipCheckBtn = document.getElementById("membershipCheckBtn");
const membershipErrorText = document.getElementById("membershipErrorText");
const membershipResult = document.getElementById("membershipResult");

// Auto-insert dashes as the visitor types digits, so the field
// always ends up formatted as XXXXXX-XX-XXXX without them needing
// to type the dashes themselves.
function formatNric(raw){
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  let out = digits.slice(0, 6);
  if (digits.length > 6) out += "-" + digits.slice(6, 8);
  if (digits.length > 8) out += "-" + digits.slice(8, 12);
  return out;
}

if (membershipNricInput){
  membershipNricInput.addEventListener("input", () => {
    const pos = membershipNricInput.selectionStart;
    const before = membershipNricInput.value;
    membershipNricInput.value = formatNric(before);
    // Keep the cursor roughly in place after reformatting.
    const diff = membershipNricInput.value.length - before.length;
    membershipNricInput.setSelectionRange(pos + diff, pos + diff);
    hideMembershipError();
    hideMembershipResult();
  });
  membershipNricInput.addEventListener("keydown", (e) => {
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
  const nric = membershipNricInput.value.trim();
  hideMembershipError();
  hideMembershipResult();

  if (!NRIC_PATTERN.test(nric)){
    showMembershipError("membershipInvalidFormat");
    return;
  }

  membershipCheckBtn.disabled = true;
  const originalLabel = document.getElementById("membershipCheckBtnText").textContent;
  document.getElementById("membershipCheckBtnText").textContent = t("membershipChecking");

  try {
    const res = await fetch(`/.netlify/functions/check-membership?nric=${encodeURIComponent(nric)}`);
    if (res.status === 404){
      showMembershipError("membershipNotFound");
    } else if (!res.ok){
      showMembershipError("membershipError");
    } else {
      const data = await res.json();
      document.getElementById("membershipResultName").textContent = data.name || "";
      document.getElementById("membershipResultNric").textContent = data.nric || nric;
      document.getElementById("membershipResultNo").textContent = data.membershipNo || "";
      const typeKey = (data.membershipType || "").trim().toLowerCase() === "life" ? "membershipTypeLife" : "membershipTypeOrdinary";
      document.getElementById("membershipResultType").textContent = t(typeKey);
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
