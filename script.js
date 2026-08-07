// ============================================================
// Sri Subramaniar Alayam — Kiosk App Logic
// Supports three languages: en, bm, ta. Switching languages
// re-renders every screen's content, not just labels.
// ============================================================

let currentLang = "en";
function eventTitle(ev){ return (currentLang === "ta" && ev.title_ta) ? ev.title_ta : ev.title; }
function t(key){ return (UI[currentLang] && UI[currentLang][key]) || UI.en[key] || ""; }
function tf(obj, field){ return obj[field + "_" + currentLang] || obj[field + "_en"]; }

const ICONS = {
  about: `<path d="M4 21 V9 L12 3 L20 9 V21 M9 21 V14 H15 V21" stroke-linecap="round" stroke-linejoin="round"/>`,
  deities: `<circle cx="12" cy="8" r="3.4"/><path d="M6 21 C6 16 8.5 13.5 12 13.5 C15.5 13.5 18 16 18 21" stroke-linecap="round"/>`,
  calendar: `<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10 H20.5 M8 3 V6.5 M16 3 V6.5" stroke-linecap="round"/>`,
  timings: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5 V12 L15.2 14" stroke-linecap="round" stroke-linejoin="round"/>`,
  sevas: `<path d="M12 21 C7 17 3.5 13.8 3.5 9.9 C3.5 7.2 5.6 5 8.2 5 C9.8 5 11.1 5.8 12 7 C12.9 5.8 14.2 5 15.8 5 C18.4 5 20.5 7.2 20.5 9.9 C20.5 13.8 17 17 12 21 Z" stroke-linejoin="round"/>`
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
  timings:"navTimings", gallery:"navGallery", sevas:"navSevas", news:"navNews", contact:"navContact"
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
  document.getElementById("railMorningLabel").textContent = t("railMorning");
  document.getElementById("railEveningLabel").textContent = t("railEvening");

  crumb.textContent = t(CRUMB_KEY[currentScreen]) || t("navHome");

  document.getElementById("heroEyebrow").textContent = t("heroEyebrow");
  document.getElementById("heroTagline").textContent = t("heroTagline");
  document.getElementById("statEstablishedLabel").textContent = t("statEstablished");
  document.getElementById("statDevoteesLabel").textContent = t("statDevotees");
  document.getElementById("statEventsLabel").textContent = t("statEvents");
  document.getElementById("statCommunityLabel").textContent = t("statCommunity");
  document.getElementById("statCommunityValue").textContent = t("statCommunityValue");

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
  const iconMap = { about: ICONS.about, deities: ICONS.deities, calendar: ICONS.calendar, timings: ICONS.timings, sevas: ICONS.sevas };
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
      homeEvents.appendChild(el(`
        <div class="event-row">
          <div class="event-date"><b>${dayNum(e.iso)}</b><small>${monthAbbr(e.iso)}</small></div>
          <div><h4>${eventTitle(e)}</h4><p>${formatEventDate(e.iso)}</p></div>
        </div>
      `));
    });
}

function renderHomeAnnounce(){
  const homeAnnounce = document.getElementById("homeAnnounce");
  homeAnnounce.innerHTML = "";
  ANNOUNCEMENTS.slice(0,3).forEach(a=>{
    homeAnnounce.appendChild(el(`
      <div class="announce-row">
        <div class="announce-dot"></div>
        <div><h4>${tf(a,"title")}</h4><p>${tf(a,"desc")}</p></div>
      </div>
    `));
  });
}

// ============================================================
// ABOUT
// ============================================================
function renderAbout(){
  const aboutHistoryEl = document.getElementById("aboutHistory");
  aboutHistoryEl.innerHTML = "";
  (ABOUT["history_" + currentLang] || ABOUT.history_en).forEach(paragraph =>
    aboutHistoryEl.appendChild(el(`<p>${paragraph}</p>`))
  );
  document.getElementById("aboutVision").textContent = ABOUT["vision_" + currentLang] || ABOUT.vision_en;
  document.getElementById("aboutMission").textContent = ABOUT["mission_" + currentLang] || ABOUT.mission_en;

  const actWrap = document.getElementById("aboutActivities");
  actWrap.innerHTML = "";
  (ABOUT["activities_" + currentLang] || ABOUT.activities_en).forEach(a =>
    actWrap.appendChild(el(`<span class="pill-tag">${a}</span>`))
  );
}

// ============================================================
// DEITIES
// ============================================================
function renderDeities(){
  const deityGrid = document.getElementById("deityGrid");
  deityGrid.innerHTML = "";
  DEITIES.forEach(d=>{
    deityGrid.appendChild(el(`
      <div class="deity-card">
        <div class="deity-figure"><img src="${d.image}" alt="${tf(d,"name")}" loading="lazy" /></div>
        <div class="deity-body">
          <h3>${tf(d,"name")}</h3>
          <div class="deity-role">${tf(d,"role")}</div>
          <p>${tf(d,"description")}</p>
        </div>
      </div>
    `));
  });
}

// ============================================================
// EVENT CALENDAR (Google-Calendar-style month grid)
// ============================================================
const eventsByDate = {};
EVENTS.forEach(e=>{ (eventsByDate[e.iso] = eventsByDate[e.iso] || []).push(e); });

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
      chip.addEventListener("click", ()=>showEventDetail(ev));
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
    calendarList.appendChild(el(`
      <div class="event-row" id="ev-${e.iso}-${e.title.replace(/\s+/g,"")}">
        <div class="event-date"><b>${dayNum(e.iso)}</b><small>${monthAbbr(e.iso)}</small></div>
        <div><h4>${eventTitle(e)}</h4><p>${formatEventDate(e.iso)}</p></div>
      </div>
    `));
  });
}

function showEventDetail(ev){
  const detail = document.getElementById("calendarEventDetail");
  detail.querySelectorAll(".event-row.highlighted").forEach(r=>r.classList.remove("highlighted"));
  const row = document.getElementById("ev-" + ev.iso + "-" + ev.title.replace(/\s+/g,""));
  if(row){
    row.classList.add("highlighted");
    row.scrollIntoView({behavior:"smooth", block:"center"});
  }
}

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
  document.getElementById("donateNowBtn").textContent = tf(SEVAS[3], "cta");
}

document.getElementById("donateNowBtn").addEventListener("click", ()=>
  openQrModal(tf(SEVAS[3],"name"), tf(SEVAS[3],"price"))
);

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
// NEWS
// ============================================================
function renderNews(){
  const newsList = document.getElementById("newsList");
  newsList.innerHTML = "";
  ANNOUNCEMENTS.forEach(a=>{
    newsList.appendChild(el(`
      <div class="announce-row">
        <div class="announce-dot"></div>
        <div><h4>${tf(a,"title")}</h4><p>${tf(a,"desc")}</p></div>
      </div>
    `));
  });
}

// ============================================================
// CONTACT
// ============================================================
function renderContact(){
  const contactDetails = document.getElementById("contactDetails");
  contactDetails.innerHTML = `
    <h3>${t("getInTouch")}</h3>
    <div class="contact-row">
      <div class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21 C12 21 5 14.5 5 9.8 C5 6.3 7.7 4 11 4 C11.4 4 11.7 4 12 4.1 C12.3 4 12.6 4 13 4 C16.3 4 19 6.3 19 9.8 C19 14.5 12 21 12 21 Z"/><circle cx="12" cy="9.5" r="2.2"/></svg></div>
      <div><b>${CONTACT.orgName}</b><span>${t("regNoLabel")}: ${CONTACT.registrationNo}</span><span>${CONTACT.address}</span></div>
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
function renderAll(){
  renderStaticText();
  renderHomeTiles();
  renderHomeTimings();
  renderHomeEvents();
  renderHomeAnnounce();
  renderAbout();
  renderDeities();
  renderCalendarWeekdays();
  renderCalendarGrid();
  renderTimingTabs();
  renderTimingList();
  renderGallery();
  renderSevas();
  renderNews();
  renderContact();
  tickClock();
}

renderAll();
goTo("home");

// ---------- Splash / welcome screen ----------
const splashScreen = document.getElementById("splashScreen");
document.getElementById("splashEnterBtn").addEventListener("click", ()=>{
  splashScreen.classList.add("splash-hide");
  resetIdleTimer();
  setTimeout(()=>{ splashScreen.style.display = "none"; }, 650);
});

// ---------- PWA: register service worker (enables install + offline) ----------
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}
