// =========================================================
// VVISC Public Website Loader — Dynamic Firestore Renderer
// Updates public page content dynamically from Firebase
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof db === "undefined") {
        console.warn("Firestore 'db' not initialized. Skipping public CMS loader.");
        return;
    }

    try {
        const page = window.location.pathname.split("/").pop().toLowerCase() || "index.html";

        // Load Global Website Settings on every page (Logo/Title/Socials/Footer)
        loadGlobalSettings();

        if (page === "index.html" || page === "") {
            loadHomePageContent();
        } else if (page === "about.html") {
            loadAboutPageContent();
        } else if (page === "departments.html") {
            loadDepartmentsPageContent();
        } else if (page === "events.html") {
            loadEventsPageContent();
        } else if (page === "council.html") {
            loadCouncilPageContent();
        } else if (page === "gallery.html") {
            loadGalleryPageContent();
        } else if (page === "contact.html") {
            loadContactPageContent();
        }
    } catch (err) {
        console.warn("Error running public CMS loader:", err);
    }
});

// Helper for fetching public collection data with localStorage fallback
async function getPublicCollection(colName) {
    let localList = [];
    let localMap = new Map();
    try {
        const raw = localStorage.getItem("vvisc_col_" + colName);
        if (raw) {
            localList = JSON.parse(raw);
            localList.forEach(item => {
                if (item.id) localMap.set(item.id, item);
                if (item.slug) localMap.set(item.slug, item);
            });
        }
    } catch (e) {}

    try {
        const snapshot = await db.collection(colName).get();
        if (!snapshot.empty) {
            const fsList = [];
            snapshot.forEach(doc => {
                const fsData = { id: doc.id, ...doc.data() };
                const localItem = localMap.get(doc.id) || localMap.get(fsData.slug);
                if (localItem) {
                    fsList.push({ ...fsData, ...localItem });
                    localMap.delete(doc.id);
                    if (fsData.slug) localMap.delete(fsData.slug);
                } else {
                    fsList.push(fsData);
                }
            });
            // Include remaining local items
            localMap.forEach(item => {
                if (!fsList.some(f => f.id === item.id || (f.slug && f.slug === item.slug))) {
                    fsList.push(item);
                }
            });
            if (fsList.length > 0) return fsList;
        }
    } catch (err) {
        console.info(`[CMS Fallback] Using local/default list for ${colName}`);
    }
    return localList;
}

// Helper for fetching single doc data with localStorage fallback
async function getPublicContent(docKey, fallbackData = {}) {
    let localData = {};
    try {
        const raw = localStorage.getItem("vvisc_cms_" + docKey);
        if (raw) localData = JSON.parse(raw);
    } catch (e) {}

    try {
        const doc = await db.collection("websiteContent").doc(docKey).get();
        if (doc.exists) {
            return { ...fallbackData, ...doc.data(), ...localData };
        }
    } catch (err) {
        console.info(`[CMS Fallback] Using local/default content for ${docKey}`);
    }
    return { ...fallbackData, ...localData };
}

// --------------------------------------------------
// Global Settings Loader
// --------------------------------------------------
async function loadGlobalSettings() {
    try {
        const s = await getPublicContent("settings");

        // Footer copyright
        const copyEl = document.querySelector("footer .copyright, footer p");
        if (copyEl && s.copyrightText) {
            copyEl.textContent = s.copyrightText;
        }

        // SEO Title if default
        if (s.siteName && document.title.includes("VVISC Technical Club")) {
            document.title = s.siteName + " - VVIT IUCEE Chapter";
        }
    } catch (e) {
        console.warn("loadGlobalSettings error:", e);
    }
}

// --------------------------------------------------
// 1. Home Page Loader (index.html)
// --------------------------------------------------
async function loadHomePageContent() {
    try {
        const h = await getPublicContent("home");
        if (!h.heroTitle && !h.statMembers) return;

        // Hero Elements
        const heroTitle = document.querySelector(".hero-title, .hero h1");
        const heroDesc = document.querySelector(".hero-description, .hero p");
        const ctaPrimary = document.querySelector(".hero-buttons .primary-btn, .hero-cta");

        if (heroTitle && h.heroTitle) {
            heroTitle.innerHTML = `${escapeHtml(h.heroTitle)} <span class="logo-accent">${escapeHtml(h.heroSubtitle || "")}</span>`;
        }
        if (heroDesc && h.heroDescription) {
            heroDesc.textContent = h.heroDescription;
        }
        if (ctaPrimary && h.ctaPrimaryText) {
            ctaPrimary.textContent = h.ctaPrimaryText;
            if (h.ctaPrimaryLink) ctaPrimary.href = h.ctaPrimaryLink;
        }

        // Stats Counter Elements (.impact-number & .stat-number)
        const impactNumbers = document.querySelectorAll(".impact-number, .stat-number, .stat-item h2");
        if (impactNumbers.length >= 4) {
            if (h.statEvents && impactNumbers[0]) {
                impactNumbers[0].textContent = h.statEvents;
                impactNumbers[0].setAttribute("data-target", parseInt(h.statEvents) || 25);
            }
            if (h.statMembers && impactNumbers[1]) {
                impactNumbers[1].textContent = h.statMembers;
                impactNumbers[1].setAttribute("data-target", parseInt(h.statMembers) || 500);
            }
            if (h.statDepts && impactNumbers[2]) {
                impactNumbers[2].textContent = h.statDepts;
                impactNumbers[2].setAttribute("data-target", parseInt(h.statDepts) || 6);
            }
            if (h.statReach && impactNumbers[3]) {
                impactNumbers[3].textContent = h.statReach;
                impactNumbers[3].setAttribute("data-target", parseInt(h.statReach) || 1000);
            }
        }

        // Also update any direct stat elements by ID if present
        const elMembers = document.getElementById("statMembers");
        const elEvents = document.getElementById("statEvents");
        const elDepts = document.getElementById("statDepts");
        const elReach = document.getElementById("statReach");

        if (elMembers && h.statMembers) elMembers.textContent = h.statMembers;
        if (elEvents && h.statEvents) elEvents.textContent = h.statEvents;
        if (elDepts && h.statDepts) elDepts.textContent = h.statDepts;
        if (elReach && h.statReach) elReach.textContent = h.statReach;

        // ==============================================
        // OUR ACHIEVEMENTS & IMPACT SECTION RENDERER
        // ==============================================
        const impactSub = document.querySelector(".impact-subtitle");
        const impactMainTitle = document.querySelector(".impact-main-title");
        const impactDesc = document.querySelector(".impact-description");
        const impactCtaBtn = document.querySelector(".explore-impact-btn");

        if (impactSub && h.impactEyebrow) impactSub.textContent = h.impactEyebrow;
        if (impactMainTitle && (h.impactTitle1 || h.impactTitle2)) {
            impactMainTitle.innerHTML = `${escapeHtml(h.impactTitle1 || "")}<br><span class="gradient-text">${escapeHtml(h.impactTitle2 || "")}</span>`;
        }
        if (impactDesc && h.impactDescription) impactDesc.textContent = h.impactDescription;
        if (impactCtaBtn) {
            if (h.impactCtaText) {
                const btnSpan = impactCtaBtn.querySelector("span");
                if (btnSpan) btnSpan.textContent = h.impactCtaText;
            }
            if (h.impactCtaLink) impactCtaBtn.href = h.impactCtaLink;
        }

        // Render 6 Impact Cards
        const impactCards = document.querySelectorAll(".tilted-impact-card");
        impactCards.forEach((card, idx) => {
            const i = idx + 1;
            if (h[`card${i}Number`] || h[`card${i}Title`]) {
                const eyebrowEl = card.querySelector(".card-eyebrow");
                const numEl = card.querySelector(".impact-number");
                const titleEl = card.querySelector("h3");
                const descEl = card.querySelector("p");

                if (eyebrowEl && h[`card${i}Eyebrow`]) eyebrowEl.textContent = h[`card${i}Eyebrow`];
                if (numEl && h[`card${i}Number`]) {
                    numEl.textContent = h[`card${i}Number`];
                    numEl.setAttribute("data-target", parseInt(h[`card${i}Number`]) || 0);
                }
                if (titleEl && h[`card${i}Title`]) titleEl.textContent = h[`card${i}Title`];
                if (descEl && h[`card${i}Desc`]) descEl.textContent = h[`card${i}Desc`];
            }
        });

    } catch (e) {
        console.warn("loadHomePageContent error:", e);
    }
}

// --------------------------------------------------
// 2. About Page Loader (about.html)
// --------------------------------------------------
async function loadAboutPageContent() {
    try {
        const a = await getPublicContent("about");

        // Introduction
        const introTitle = document.querySelector(".about-intro h2, .about-hero h1");
        const introText = document.querySelector(".about-intro p, .about-hero p");
        if (introTitle && a.introTitle) introTitle.textContent = a.introTitle;
        if (introText && a.introText) introText.textContent = a.introText;

        // Vision & Mission
        const visionText = document.querySelector("#visionText, .vision-card p");
        const missionText = document.querySelector("#missionText, .mission-card p");
        if (visionText && a.visionText) visionText.textContent = a.visionText;
        if (missionText && a.missionText) missionText.textContent = a.missionText;

        // Timeline Items
        if (Array.isArray(a.timeline) && a.timeline.length > 0) {
            const timelineContainer = document.querySelector(".timeline-track, .history-timeline");
            if (timelineContainer) {
                timelineContainer.innerHTML = "";
                a.timeline.filter(item => item.active !== false).forEach(item => {
                    const el = document.createElement("div");
                    el.className = "timeline-item reveal-up";
                    el.innerHTML = `
                        <div class="timeline-year">${escapeHtml(item.year)}</div>
                        <div class="timeline-content">
                            <h3>${escapeHtml(item.title)}</h3>
                            <p>${escapeHtml(item.description)}</p>
                        </div>
                    `;
                    timelineContainer.appendChild(el);
                });
            }
        }
    } catch (e) {
        console.warn("loadAboutPageContent error:", e);
    }
}

// --------------------------------------------------
// 3. Departments Page Loader (departments.html)
// --------------------------------------------------
async function loadDepartmentsPageContent() {
    try {
        let depts = await getPublicCollection("departments");
        depts = depts.filter(d => d.active !== false);
        depts.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));

        if (!depts || depts.length === 0) return;

        const navContainer = document.querySelector(".department-navigation");
        const panelContainer = document.querySelector(".department-panel");
        if (!navContainer || !panelContainer) return;

        navContainer.innerHTML = "";
        panelContainer.innerHTML = "";

        let isFirst = true;

        depts.forEach(d => {
            const deptId = d.slug || d.id;

            // 1. Create Nav Button
            const btn = document.createElement("button");
            btn.className = `department-btn${isFirst ? " active" : ""}`;
            btn.setAttribute("data-department", deptId);
            btn.innerHTML = `
                <div class="dept-icon">${d.icon || "🧪"}</div>
                <div class="dept-text">
                    <h3>${escapeHtml(d.name)}</h3>
                    <span>${escapeHtml(d.shortDescription || "")}</span>
                </div>
            `;
            navContainer.appendChild(btn);

            // 2. Create Content Panel
            const contentDiv = document.createElement("div");
            contentDiv.className = `department-content${isFirst ? " active" : ""}`;
            contentDiv.id = deptId;

            const objectivesHtml = Array.isArray(d.objectives)
                ? d.objectives.map(o => `<li>${escapeHtml(o)}</li>`).join("")
                : (d.objectives ? `<li>${escapeHtml(d.objectives)}</li>` : "");

            const activitiesHtml = Array.isArray(d.activities)
                ? d.activities.map(a => `<span>${escapeHtml(a)}</span>`).join("")
                : (d.activities ? `<span>${escapeHtml(d.activities)}</span>` : "");

            contentDiv.innerHTML = `
                <span class="department-tag">${escapeHtml(d.tag || d.shortDescription || "Core Department")}</span>
                <h2>${escapeHtml(d.name)}</h2>
                <p>${escapeHtml(d.description || "")}</p>
                
                <div class="department-info">
                    ${objectivesHtml ? `
                    <div>
                        <h4>Responsibilities</h4>
                        <ul>${objectivesHtml}</ul>
                    </div>` : ""}
                    ${activitiesHtml ? `
                    <div>
                        <h4>Skills</h4>
                        <div class="skill-tags">${activitiesHtml}</div>
                    </div>` : ""}
                </div>

                <div class="department-stats">
                    <div>
                        <h3>${escapeHtml(d.stat1Val || "40+")}</h3>
                        <span>${escapeHtml(d.stat1Lbl || "Members")}</span>
                    </div>
                    <div>
                        <h3>${escapeHtml(d.stat2Val || "15+")}</h3>
                        <span>${escapeHtml(d.stat2Lbl || "Projects")}</span>
                    </div>
                    <div>
                        <h3>${escapeHtml(d.stat3Val || "20+")}</h3>
                        <span>${escapeHtml(d.stat3Lbl || "Workshops")}</span>
                    </div>
                </div>

                <div class="department-navigation-buttons">
                    <button class="prev-department">← Previous</button>
                    <button class="next-department">Next →</button>
                </div>
            `;

            panelContainer.appendChild(contentDiv);
            isFirst = false;
        });

        // Re-attach Tab Switch Listeners
        const deptBtns = navContainer.querySelectorAll(".department-btn");
        deptBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const targetId = btn.getAttribute("data-department");
                deptBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                const panels = panelContainer.querySelectorAll(".department-content");
                panels.forEach(p => p.classList.remove("active"));
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) targetPanel.classList.add("active");
            });
        });

        // Re-attach Next & Previous Department Switchers
        const deptOrder = depts.map(d => d.slug || d.id);

        const nextBtns = panelContainer.querySelectorAll(".next-department");
        nextBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const current = panelContainer.querySelector(".department-content.active");
                if (!current) return;
                const currIdx = deptOrder.indexOf(current.id);
                const nextIdx = (currIdx + 1) % deptOrder.length;
                const targetBtn = navContainer.querySelector(`.department-btn[data-department="${deptOrder[nextIdx]}"]`);
                if (targetBtn) targetBtn.click();
            });
        });

        const prevBtns = panelContainer.querySelectorAll(".prev-department");
        prevBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const current = panelContainer.querySelector(".department-content.active");
                if (!current) return;
                const currIdx = deptOrder.indexOf(current.id);
                const prevIdx = (currIdx - 1 + deptOrder.length) % deptOrder.length;
                const targetBtn = navContainer.querySelector(`.department-btn[data-department="${deptOrder[prevIdx]}"]`);
                if (targetBtn) targetBtn.click();
            });
        });

    } catch (e) {
        console.warn("loadDepartmentsPageContent error:", e);
    }
}

// --------------------------------------------------
// 3b. Events Page Loader (events.html)
// --------------------------------------------------
const DEFAULT_UPCOMING_EVENTS_PUBLIC = [
    {
        title: "VVISC Annual Hackathon",
        category: "HACKATHON",
        dateText: "Oct 15–17, 2026",
        description: "48-hour coding competition focused on AI, IoT, Robotics and Web Technologies.",
        venue: "VVIT Campus",
        teamFormat: "2–4 Members",
        seatsText: "78 / 150",
        progressPct: 52,
        posterImage: "assets/announcements/default.jpg",
        registerUrl: "#",
        displayOrder: 1,
        active: true
    },
    {
        title: "AI Bootcamp",
        category: "WORKSHOP",
        dateText: "Nov 5, 2026",
        description: "Hands-on training on Machine Learning, Deep Learning and Generative AI.",
        venue: "Seminar Hall",
        teamFormat: "Individual",
        seatsText: "45 / 80",
        progressPct: 44,
        posterImage: "assets/Ai-bootcamp.png",
        registerUrl: "#",
        displayOrder: 2,
        active: true
    },
    {
        title: "Industry Tech Summit",
        category: "SEMINAR",
        dateText: "Dec 10, 2026",
        description: "Meet industry experts, startup founders and researchers.",
        venue: "Auditorium",
        teamFormat: "Open For All",
        seatsText: "150 / 300",
        progressPct: 50,
        posterImage: "assets/Ai-summit.png",
        registerUrl: "#",
        displayOrder: 3,
        active: true
    }
];

async function loadEventsPageContent() {
    try {
        // 1. Featured Hero Banner
        const hero = await getPublicContent("eventsHero");
        if (hero && hero.title) {
            const titleEl = document.getElementById("eventTitle");
            const descEl = document.getElementById("eventDescription");
            const statusEl = document.getElementById("registrationStatus");
            const categoryEl = document.querySelector(".event-category-chip");
            const dateEl = document.getElementById("eventDate");
            const locEl = document.getElementById("eventLocation");
            const teamEl = document.getElementById("eventTeamFormat");
            const prizeEl = document.getElementById("eventPrizePool");
            const registerBtn = document.getElementById("registerBtn");
            const posterImg = document.getElementById("eventPoster");
            const countTitle = document.getElementById("countdownTitle");
            const countGrid = document.querySelector(".countdown-grid");

            if (titleEl && hero.title) titleEl.textContent = hero.title;
            if (descEl && hero.description) descEl.textContent = hero.description;
            if (statusEl && hero.statusTag) {
                statusEl.innerHTML = `<span class="badge-dot"></span> ${escapeHtml(hero.statusTag)}`;
            }
            if (categoryEl && hero.categoryTag) categoryEl.textContent = hero.categoryTag;
            if (dateEl && hero.dateText) dateEl.textContent = hero.dateText;
            if (locEl && hero.venueText) locEl.textContent = hero.venueText;
            if (teamEl && hero.teamFormat) teamEl.textContent = hero.teamFormat;
            if (prizeEl && hero.prizePool) prizeEl.textContent = hero.prizePool;
            if (registerBtn && hero.registerUrl) registerBtn.href = hero.registerUrl;
            if (posterImg && hero.posterImage) posterImg.src = getPublicImgSrc(hero.posterImage);
            if (countTitle && hero.countdownTitle) countTitle.textContent = hero.countdownTitle;
            
            const targetIso = hero.targetDate || "2026-10-15T09:00:00";
            if (countGrid) countGrid.setAttribute("data-countdown-target", targetIso);
        }

        // 2. Upcoming Events Grid
        let upcomingList = await getPublicCollection("events");
        if (!upcomingList || upcomingList.length === 0) {
            upcomingList = DEFAULT_UPCOMING_EVENTS_PUBLIC;
        }

        const activeList = upcomingList.filter(e => e.active !== false);
        activeList.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));

        const grid = document.querySelector(".premium-event-grid");
        if (grid && activeList.length > 0) {
            grid.innerHTML = "";
            activeList.forEach(evt => {
                const card = document.createElement("div");
                card.className = "premium-event-card reveal-up visible";
                const catBadge = (evt.category || "HACKATHON").toUpperCase();
                card.setAttribute("data-category", catBadge.toLowerCase());

                const categoryClass = catBadge === "WORKSHOP" ? " workshop" : (catBadge === "SEMINAR" ? " seminar" : "");

                card.innerHTML = `
                    <div class="event-image${categoryClass}">
                        <img src="${escapeHtml(getPublicImgSrc(evt.posterImage))}" alt="${escapeHtml(evt.title)}" onerror="this.onerror=null; this.src='assets/nodp.png';">
                        <span class="event-badge">${escapeHtml(catBadge)}</span>
                    </div>
                    <div class="event-content">
                        <div class="event-date">📅 ${escapeHtml(evt.dateText || "")}</div>
                        <h3>${escapeHtml(evt.title)}</h3>
                        <p>${escapeHtml(evt.description || "")}</p>
                        <div class="event-info">
                            <span>📍 ${escapeHtml(evt.venue || "VVIT Campus")}</span>
                            <span>👥 ${escapeHtml(evt.teamFormat || "Teams")}</span>
                        </div>
                        <div class="seat-progress">
                            <div class="seat-header">
                                <span>Seats Left</span>
                                <span>${escapeHtml(evt.seatsText || "Open")}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width:${evt.progressPct || 50}%;"></div>
                            </div>
                        </div>
                        <a href="${escapeHtml(evt.registerUrl || "#")}" target="_blank" class="event-btn btn-glow">
                            <span>Register Now</span>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                    </div>
                `;
                grid.appendChild(card);
            });

            setupCategoryFilters(grid);
        }

        // 3. Past Event Highlights Grid
        let pastList = await getPublicCollection("pastEvents");
        if (pastList && pastList.length > 0) {
            const seenPast = new Set();
            const activePast = [];

            pastList.filter(p => p.active !== false).forEach(item => {
                const key = (item.title || "").trim().toLowerCase();
                if (key && !seenPast.has(key)) {
                    seenPast.add(key);
                    activePast.push(item);
                } else if (!key && item.id && !seenPast.has(item.id)) {
                    seenPast.add(item.id);
                    activePast.push(item);
                }
            });

            activePast.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));
            const pastGrid = document.getElementById("pastEventGrid");
            if (pastGrid && activePast.length > 0) {
                pastGrid.innerHTML = "";
                activePast.forEach(item => {
                    const card = document.createElement("div");
                    card.className = "past-event-card reveal-up visible";
                    const tag = (item.tag || "HIGHLIGHT").toUpperCase();
                    let tintClass = "";
                    if (tag.includes("HACKATHON")) tintClass = " hackathon";
                    else if (tag.includes("WORKSHOP")) tintClass = " workshop";

                    card.innerHTML = `
                        <div class="past-image${tintClass}">
                            <span>${escapeHtml(tag)}</span>
                        </div>
                        <div class="past-content">
                            <h3>${escapeHtml(item.title)}</h3>
                            <p>${escapeHtml(item.description || "")}</p>
                            <div class="past-stats">
                                <div>
                                    <h4>${escapeHtml(item.stat1Value || "")}</h4>
                                    <span>${escapeHtml(item.stat1Label || "")}</span>
                                </div>
                                <div>
                                    <h4>${escapeHtml(item.stat2Value || "")}</h4>
                                    <span>${escapeHtml(item.stat2Label || "")}</span>
                                </div>
                            </div>
                            <a href="${escapeHtml(item.galleryUrl || "gallery.html")}" class="past-btn">View Gallery →</a>
                        </div>
                    `;
                    pastGrid.appendChild(card);
                });
            }
        }

        // 4. VVISC Impact Numbers
        const impact = await getPublicContent("eventsImpact");
        if (impact) {
            const statCards = document.querySelectorAll(".event-stats-section .stat-card");
            if (statCards.length >= 4) {
                if (impact.stat1Target) {
                    const num1 = statCards[0].querySelector(".counter");
                    const lbl1 = statCards[0].querySelector("span");
                    if (num1) {
                        const val = impact.stat1Target;
                        const numOnly = parseInt(val) || 85;
                        num1.dataset.cmsValue = val;
                        num1.dataset.target = numOnly;
                        num1.setAttribute("data-target", numOnly);
                        num1.textContent = val;
                    }
                    if (lbl1 && impact.stat1Label) lbl1.textContent = impact.stat1Label;
                }
                if (impact.stat2Target) {
                    const num2 = statCards[1].querySelector(".counter");
                    const lbl2 = statCards[1].querySelector("span");
                    if (num2) {
                        const val = impact.stat2Target;
                        const numOnly = parseInt(val) || 5000;
                        num2.dataset.cmsValue = val;
                        num2.dataset.target = numOnly;
                        num2.setAttribute("data-target", numOnly);
                        num2.textContent = val;
                    }
                    if (lbl2 && impact.stat2Label) lbl2.textContent = impact.stat2Label;
                }
                if (impact.stat3Target) {
                    const num3 = statCards[2].querySelector(".counter");
                    const lbl3 = statCards[2].querySelector("span");
                    if (num3) {
                        const val = impact.stat3Target;
                        const numOnly = parseInt(val) || 120;
                        num3.dataset.cmsValue = val;
                        num3.dataset.target = numOnly;
                        num3.setAttribute("data-target", numOnly);
                        num3.textContent = val;
                    }
                    if (lbl3 && impact.stat3Label) lbl3.textContent = impact.stat3Label;
                }
                if (impact.stat4Target) {
                    const num4 = statCards[3].querySelector(".counter");
                    const lbl4 = statCards[3].querySelector("span");
                    if (num4) {
                        const val = impact.stat4Target;
                        const numOnly = parseInt(val) || 35;
                        num4.dataset.cmsValue = val;
                        num4.dataset.target = numOnly;
                        num4.setAttribute("data-target", numOnly);
                        num4.textContent = val;
                    }
                    if (lbl4 && impact.stat4Label) lbl4.textContent = impact.stat4Label;
                }
            }
        }

        // 5. Updates & Notices Feed
        let noticeList = await getPublicCollection("announcements");
        if (noticeList && noticeList.length > 0) {
            const activeNotices = noticeList.filter(n => n.active !== false);
            activeNotices.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));

            const feedContainer = document.querySelector(".announcement-list");
            if (feedContainer && activeNotices.length > 0) {
                feedContainer.innerHTML = "";
                activeNotices.forEach(n => {
                    const card = document.createElement("div");
                    card.className = "announcement-card reveal-up visible";
                    const cat = (n.category || "Updates");
                    let borderStyle = "";
                    let catStyle = "";
                    if (cat.toLowerCase() === "notices") {
                        borderStyle = " border-left-color: #d9534f;";
                        catStyle = ' style="color: #d9534f;"';
                    } else if (cat.toLowerCase() === "events") {
                        borderStyle = " border-left-color: #5cb85c;";
                        catStyle = ' style="color: #5cb85c;"';
                    }

                    if (borderStyle) card.setAttribute("style", borderStyle.trim());

                    card.innerHTML = `
                        <div class="announcement-meta">
                            <span class="category"${catStyle}>${escapeHtml(cat)}</span>
                            <span class="date">${escapeHtml(n.dateText || "")}</span>
                        </div>
                        <h3>${escapeHtml(n.title)}</h3>
                        <p>${escapeHtml(n.description || "")}</p>
                    `;
                    feedContainer.appendChild(card);
                });

                setupNoticeFeedFilters();
            }
        }

    } catch (e) {
        console.warn("loadEventsPageContent error:", e);
    }
}

function setupNoticeFeedFilters() {
    const filterBar = document.querySelector('.filter-bar');
    if (!filterBar) return;

    const filterInput = filterBar.querySelector('.filter-input');
    const filterBtns = filterBar.querySelectorAll('.filter-btn');

    let activeCategory = 'All';
    filterBtns.forEach(btn => {
        if (btn.classList.contains('active')) activeCategory = btn.textContent.trim();
    });

    const applyNoticeFilters = () => {
        const cards = document.querySelectorAll('.announcement-list .announcement-card');
        const query = (filterInput ? filterInput.value : '').trim().toLowerCase();

        cards.forEach(card => {
            const categoryEl = card.querySelector('.category');
            const cardCategory = categoryEl ? categoryEl.textContent.trim().toLowerCase() : '';
            const cardText = card.textContent.toLowerCase();

            const targetCat = activeCategory.trim().toLowerCase();
            const matchesCategory = targetCat === 'all' || cardCategory === targetCat;
            const matchesQuery = !query || cardText.includes(query);

            if (matchesCategory && matchesQuery) {
                card.style.display = 'block';
                card.classList.remove('is-filtered-out');
            } else {
                card.style.display = 'none';
                card.classList.add('is-filtered-out');
            }
        });
    };

    filterBtns.forEach(btn => {
        btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.textContent.trim();
            applyNoticeFilters();
        };
    });

    if (filterInput) {
        filterInput.oninput = applyNoticeFilters;
    }

    applyNoticeFilters();
}

function setupCategoryFilters(grid) {
    const filterBtns = document.querySelectorAll(".event-filter .filter-btn");
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filterText = btn.textContent.trim().toLowerCase();
            const cards = grid.querySelectorAll(".premium-event-card");

            cards.forEach(card => {
                const cat = card.getAttribute("data-category") || "";
                if (filterText === "all" || cat.includes(filterText.slice(0, -1)) || cat === filterText) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });
}

// --------------------------------------------------
// 4. Council Page Loader (council.html)
// --------------------------------------------------
async function loadCouncilPageContent() {
    try {
        const members = await getPublicCollection("councilMembers");
        if (!members || members.length === 0) return;

        const activeMembers = members.filter(m => m.active !== false);
        activeMembers.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));

        // 1. Render Chief Faculty Coordinator
        const chiefContainer = document.querySelector(".chief-faculty");
        const chiefMember = activeMembers.find(m => m.memberType === "Chief Faculty" || (m.role && m.role.toLowerCase().includes("chief")));
        if (chiefContainer && chiefMember) {
            chiefContainer.innerHTML = `
                <div class="faculty-card chief-card">
                    <div class="faculty-image">
                        <img src="${escapeHtml(getPublicImgSrc(chiefMember.profileImage))}" alt="${escapeHtml(chiefMember.name)}" onerror="this.onerror=null; this.src='assets/nodp.png';">
                    </div>
                    <div class="faculty-content">
                        <span class="faculty-badge">${escapeHtml(chiefMember.role || "Chief Faculty Coordinator")}</span>
                        <h3>${escapeHtml(chiefMember.name)}</h3>
                        <p>${escapeHtml(chiefMember.description || "")}</p>
                        <div class="faculty-info">
                            ${chiefMember.email ? `<span>📧 ${escapeHtml(chiefMember.email)}</span>` : ""}
                            ${chiefMember.department ? `<span>🏢 ${escapeHtml(chiefMember.department)}</span>` : ""}
                        </div>
                        <div class="faculty-buttons">
                            ${chiefMember.linkedin ? `<a href="${escapeHtml(chiefMember.linkedin)}" class="btn-linkedin">LinkedIn →</a>` : ""}
                            ${chiefMember.github ? `<a href="${escapeHtml(chiefMember.github)}" class="btn-profile">View Profile</a>` : ""}
                        </div>
                    </div>
                </div>
            `;
        }

        // 2. Render Faculty Members Grid
        const facultyGrid = document.querySelector(".faculty-members-grid");
        const facultyList = activeMembers.filter(m => m.memberType === "Faculty Coordinator" && m !== chiefMember);
        if (facultyGrid && facultyList.length > 0) {
            facultyGrid.innerHTML = "";
            facultyList.forEach(m => {
                const card = document.createElement("div");
                card.className = "faculty-member-card";
                card.innerHTML = `
                    <div class="faculty-member-image">
                        <img src="${escapeHtml(getPublicImgSrc(m.profileImage))}" alt="${escapeHtml(m.name)}" onerror="this.onerror=null; this.src='assets/nodp.png';">
                    </div>
                    <div class="faculty-member-content">
                        <span class="member-role">${escapeHtml(m.role || "Faculty Coordinator")}</span>
                        <h3>${escapeHtml(m.name)}</h3>
                        <p>${escapeHtml(m.description || "")}</p>
                        ${m.linkedin ? `<a href="${escapeHtml(m.linkedin)}" class="member-btn">View Profile →</a>` : ""}
                    </div>
                `;
                facultyGrid.appendChild(card);
            });
        }

        // 3. Render Student Leaders / Council Roles Grid
        const roleGrid = document.querySelector(".role-grid");
        const studentList = activeMembers.filter(m => m.memberType === "Student Leader" || (!m.memberType.includes("Faculty") && m !== chiefMember));
        if (roleGrid && studentList.length > 0) {
            roleGrid.innerHTML = "";
            studentList.forEach(m => {
                const card = document.createElement("div");
                card.className = "role-card";
                card.innerHTML = `
                    <div class="role-avatar">
                        <img src="${escapeHtml(getPublicImgSrc(m.profileImage))}" alt="${escapeHtml(m.name)}" onerror="this.onerror=null; this.src='assets/nodp.png';">
                    </div>
                    <span class="role-badge">${escapeHtml(m.role || "Council Member")}</span>
                    <h3>${escapeHtml(m.name)}</h3>
                    <p>${escapeHtml(m.description || "")}</p>
                    <div class="role-buttons">
                        ${m.linkedin ? `<a href="${escapeHtml(m.linkedin)}">LinkedIn</a>` : ""}
                        ${m.github ? `<a href="${escapeHtml(m.github)}">GitHub</a>` : ""}
                    </div>
                `;
                roleGrid.appendChild(card);
            });
        }

    } catch (e) {
        console.warn("loadCouncilPageContent error:", e);
    }
}

// --------------------------------------------------
// 5. Gallery Page Loader (gallery.html)
// --------------------------------------------------
async function loadGalleryPageContent() {
    try {
        const items = await getPublicCollection("gallery");
        if (!items || items.length === 0) return;

        const activeItems = items.filter(i => i.active !== false);
        activeItems.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));

        const grid = document.querySelector(".gallery-grid");
        if (!grid) return;

        grid.innerHTML = "";
        activeItems.forEach(item => {
            const el = document.createElement("div");
            el.className = `gallery-item reveal-scale ${escapeHtml(item.category || "events")}`;
            el.innerHTML = `
                <img src="${escapeHtml(item.image || 'assets/logo.png')}" alt="${escapeHtml(item.title)}" onerror="this.onerror=null; this.src='assets/logo.png';">
                <div class="gallery-overlay">
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.caption || "")}</p>
                </div>
            `;
            grid.appendChild(el);
        });
    } catch (e) {
        console.warn("loadGalleryPageContent error:", e);
    }
}

// --------------------------------------------------
// 6. Contact Page Loader (contact.html)
// --------------------------------------------------
async function loadContactPageContent() {
    try {
        const c = await getPublicContent("contact");

        const emailEl = document.querySelector(".contact-info .email, a[href^='mailto:']");
        const phoneEl = document.querySelector(".contact-info .phone, a[href^='tel:']");
        const addressEl = document.querySelector(".contact-info .address");
        const mapIframe = document.querySelector(".map-container iframe, iframe[src*='maps']");

        if (emailEl && c.email) {
            emailEl.textContent = c.email;
            emailEl.href = "mailto:" + c.email;
        }
        if (phoneEl && c.phone) {
            phoneEl.textContent = c.phone;
            phoneEl.href = "tel:" + c.phone;
        }
        if (addressEl && c.address) addressEl.textContent = c.address;
        if (mapIframe && c.mapEmbedUrl) mapIframe.src = c.mapEmbedUrl;
    } catch (e) {
        console.warn("loadContactPageContent error:", e);
    }
}

// Helper: Escape HTML
function escapeHtml(str) {
    return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getPublicImgSrc(src) {
    if (!src) return 'assets/nodp.png';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('../')) return src.substring(3);
    return src;
}
