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

        if (page === "index.html" || page === "" || page === "index") {
            loadHomePageContent();
        } else if (page === "about.html" || page === "about") {
            loadAboutPageContent();
        } else if (page === "departments.html" || page === "departments") {
            loadDepartmentsPageContent();
        } else if (page === "events.html" || page === "events") {
            loadEventsPageContent();
        } else if (page === "council.html" || page === "council") {
            loadCouncilPageContent();
        } else if (page === "gallery.html" || page === "gallery") {
            loadGalleryPageContent();
        } else if (page === "contact.html" || page === "contact") {
            loadContactPageContent();
        } else if (page === "projects.html" || page === "projects") {
            loadProjectsPageContent();
        }
    } catch (err) {
        console.warn("Error running public CMS loader:", err);
    }
});

// Helper for fetching public collection data with live Firestore prioritization and caching
async function getPublicCollection(colName) {
    let localList = [];
    try {
        const raw = localStorage.getItem("vvisc_col_" + colName);
        if (raw) localList = JSON.parse(raw);
    } catch (e) {}

    try {
        const snapshot = await db.collection(colName).get();
        if (!snapshot.empty) {
            const fsList = [];
            snapshot.forEach(doc => {
                fsList.push({ id: doc.id, ...doc.data() });
            });
            // Live Firestore data is authoritative: update cache so all profiles and devices stay in sync
            try {
                localStorage.setItem("vvisc_col_" + colName, JSON.stringify(fsList));
            } catch (e) {}
            return fsList;
        }
    } catch (err) {
        console.info(`[CMS Fallback] Using local cache for ${colName}`);
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
            const data = doc.data();
            try {
                localStorage.setItem("vvisc_cms_" + docKey, JSON.stringify(data));
            } catch (e) {}
            return { ...fallbackData, ...localData, ...data };
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
        const ws = await getPublicContent("websiteSettings");
        const settings = { ...s, ...ws };

        // Footer copyright
        const copyEl = document.querySelector("footer .copyright, footer .vvisc-footer-copy");
        if (copyEl && (settings.copyrightText || settings.copyright)) {
            copyEl.textContent = settings.copyrightText || settings.copyright;
        }

        // SEO Title if default
        if (settings.siteName && document.title.includes("VVISC Technical Club")) {
            document.title = settings.siteName + " - VVIT IUCEE Chapter";
        }

        // Logos
        if (settings.logo) {
            document.querySelectorAll(".nav-logo, .sidebar-logo, .footer-logo").forEach(img => {
                if (img && !img.dataset.customized) {
                    img.src = getPublicImgSrc(settings.logo);
                    img.dataset.customized = "true";
                }
            });
        }

        // Favicon
        if (settings.favicon) {
            let fav = document.querySelector("link[rel='icon']");
            if (fav) {
                fav.href = getPublicImgSrc(settings.favicon);
            }
        }

        // Social Media Links
        if (settings.linkedin) {
            document.querySelectorAll("a[href*='linkedin.com'], a[aria-label='LinkedIn']").forEach(a => a.href = settings.linkedin);
        }
        if (settings.instagram) {
            document.querySelectorAll("a[href*='instagram.com'], a[aria-label='Instagram']").forEach(a => a.href = settings.instagram);
        }
        if (settings.github) {
            document.querySelectorAll("a[href*='github.com'], a[aria-label='GitHub']").forEach(a => a.href = settings.github);
        }
        if (settings.youtube) {
            document.querySelectorAll("a[href*='youtube.com'], a[aria-label='YouTube']").forEach(a => a.href = settings.youtube);
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
        if (h) {
            renderHomeDynamicContent(h);
        }

        // Real-time synchronization for Home Page content
        if (typeof db !== "undefined") {
            db.collection("websiteContent").doc("home").onSnapshot((doc) => {
                if (doc.exists) {
                    const liveHome = doc.data();
                    try {
                        localStorage.setItem("vvisc_cms_home", JSON.stringify(liveHome));
                    } catch (e) {}
                    renderHomeDynamicContent(liveHome);
                }
            }, (err) => {
                console.warn("Real-time home snapshot error:", err);
            });
        }

        // 2. Latest Updates Timeline from 'announcements' collection (synchronized with events.html)
        const noticeList = await getPublicCollection("announcements");
        renderHomeAnnouncementsTimeline(noticeList);

        // Real-time synchronization for announcements on Home Page
        if (typeof db !== "undefined") {
            db.collection("announcements").onSnapshot((snapshot) => {
                if (!snapshot.empty) {
                    const liveNotices = [];
                    snapshot.forEach(doc => liveNotices.push({ id: doc.id, ...doc.data() }));
                    try {
                        localStorage.setItem("vvisc_col_announcements", JSON.stringify(liveNotices));
                    } catch (e) {}
                    renderHomeAnnouncementsTimeline(liveNotices);
                } else {
                    try {
                        localStorage.setItem("vvisc_col_announcements", JSON.stringify([]));
                    } catch (e) {}
                    renderHomeAnnouncementsTimeline([]);
                }
            }, (err) => {
                console.warn("Real-time announcements snapshot error on home:", err);
            });
        }

    } catch (e) {
        console.warn("loadHomePageContent error:", e);
    }
}

function renderHomeDynamicContent(h) {
    if (!h) return;

    // 1. Hero Elements
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

    // 2. Stats Counter Elements (.impact-number & .stat-number)
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

    // 3. Event Highlights ("Don't Miss These")
    renderHomeHighlights(h);

    // 4. Our Achievements & Impact Section
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
}

function renderHomeHighlights(h) {
    if (!h) return;

    const hlEyebrow = document.getElementById("homeHighlightsEyebrow") || document.querySelector(".highlight-section .eyebrow");
    const hlTitle = document.getElementById("homeHighlightsTitle") || document.querySelector(".highlight-section h2");
    const hlSubtitle = document.getElementById("homeHighlightsSubtitle") || document.querySelector(".highlight-section .section-subtitle");

    if (hlEyebrow && h.highlightsEyebrow) hlEyebrow.textContent = h.highlightsEyebrow;
    if (hlTitle && h.highlightsTitle) hlTitle.textContent = h.highlightsTitle;
    if (hlSubtitle && h.highlightsSubtitle) hlSubtitle.textContent = h.highlightsSubtitle;

    // Dynamic Featured Event from events collection
    if (h.featuredEventId) {
        (async () => {
            try {
                let featEv = null;
                if (h.featuredEventId === "auto") {
                    const allEvs = await getPublicCollection("events");
                    const upcoming = allEvs.filter(e => e.active !== false);
                    if (upcoming.length > 0) featEv = upcoming[0];
                } else {
                    const evDoc = await db.collection("events").doc(h.featuredEventId).get();
                    if (evDoc.exists) featEv = { id: evDoc.id, ...evDoc.data() };
                }
                if (featEv) {
                    const card1 = document.getElementById("highlightCard1") || document.querySelectorAll(".highlight-grid .highlight-card")[0];
                    if (card1) {
                        const tagEl = card1.querySelector(".highlight-tag");
                        const h3El = card1.querySelector("h3");
                        const pEl = card1.querySelector("p");
                        const metaSpans = card1.querySelectorAll(".highlight-meta span");
                        if (tagEl) tagEl.textContent = featEv.category || "Flagship";
                        if (h3El) h3El.textContent = featEv.eventName || featEv.title || "";
                        if (pEl) pEl.textContent = featEv.shortDescription || featEv.description || "";
                        if (metaSpans && metaSpans.length >= 2) {
                            if (featEv.date) metaSpans[0].innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px; opacity:0.85;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(featEv.date)}`;
                            if (featEv.venue || featEv.location) metaSpans[1].innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px; opacity:0.85;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHtml(featEv.venue || featEv.location || "VVIT Campus")}`;
                        }
                    }
                }
            } catch (err) {
                console.warn("Featured event auto-load note:", err);
            }
        })();
    }

    // Render 3 Highlight Cards
    for (let i = 1; i <= 3; i++) {
        const cardEl = document.getElementById(`highlightCard${i}`) || document.querySelectorAll(".highlight-grid .highlight-card")[i - 1];
        if (!cardEl) continue;

        const tagVal = h[`highlight${i}Tag`];
        const titleVal = h[`highlight${i}Title`];
        const descVal = h[`highlight${i}Desc`];
        const dateVal = h[`highlight${i}Date`];
        const locVal = h[`highlight${i}Location`];
        const badgeVal = h[`highlight${i}Badge`]; // badge-flagship, badge-workshop, badge-symposium
        const linkVal = h[`highlight${i}Link`];

        if (tagVal !== undefined || titleVal !== undefined || descVal !== undefined) {
            const tagEl = cardEl.querySelector(".highlight-tag");
            const h3El = cardEl.querySelector("h3");
            const pEl = cardEl.querySelector("p");
            const metaSpans = cardEl.querySelectorAll(".highlight-meta span");
            const badgeEl = cardEl.querySelector(".highlight-badge");

            if (tagEl && tagVal) tagEl.textContent = tagVal;
            if (h3El && titleVal) h3El.textContent = titleVal;
            if (pEl && descVal) pEl.textContent = descVal;

            if (metaSpans && metaSpans.length >= 2) {
                if (dateVal) {
                    metaSpans[0].innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px; opacity:0.85;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(dateVal)}`;
                }
                if (locVal) {
                    metaSpans[1].innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px; opacity:0.85;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHtml(locVal)}`;
                }
            }

            if (badgeEl && badgeVal) {
                badgeEl.className = `highlight-badge ${badgeVal}`;
                if (badgeVal === "badge-flagship") {
                    badgeEl.innerHTML = `
                        <svg viewBox="0 0 24 24" width="30" height="30" fill="url(#gradLightning)" stroke="none">
                            <defs>
                                <linearGradient id="gradLightning" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#ffffff"/>
                                    <stop offset="100%" stop-color="#fff0e6"/>
                                </linearGradient>
                            </defs>
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
                        </svg>
                    `;
                } else if (badgeVal === "badge-workshop") {
                    badgeEl.innerHTML = `
                        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="4" y="4" width="16" height="16" rx="3" fill="rgba(255,255,255,0.2)"/>
                            <rect x="9" y="9" width="6" height="6" fill="#ffffff"/>
                            <line x1="9" y1="1" x2="9" y2="4"/>
                            <line x1="15" y1="1" x2="15" y2="4"/>
                            <line x1="9" y1="20" x2="9" y2="23"/>
                            <line x1="15" y1="20" x2="15" y2="23"/>
                            <line x1="20" y1="9" x2="23" y2="9"/>
                            <line x1="20" y1="15" x2="23" y2="15"/>
                            <line x1="1" y1="9" x2="4" y2="9"/>
                            <line x1="1" y1="15" x2="4" y2="15"/>
                        </svg>
                    `;
                } else if (badgeVal === "badge-symposium") {
                    badgeEl.innerHTML = `
                        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.2)"/>
                            <path d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9z"/>
                            <line x1="3" y1="12" x2="21" y2="12"/>
                        </svg>
                    `;
                }
            }

            if (linkVal) {
                cardEl.style.cursor = "pointer";
                cardEl.onclick = () => {
                    window.location.href = linkVal;
                };
            }
        }
    }
}

function renderHomeAnnouncementsTimeline(noticeList) {
    const timeline = document.getElementById("homeUpdatesTimeline") || document.querySelector(".timeline");
    if (!timeline) return;

    const activeNotices = (noticeList || []).filter(n => n.active !== false);
    activeNotices.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));

    if (activeNotices.length === 0) {
        timeline.innerHTML = `
            <div style="text-align:center; padding:30px 20px; opacity:0.75; font-size:0.95rem;">
                <p>No recent updates posted. Check back soon!</p>
            </div>
        `;
        return;
    }

    timeline.innerHTML = "";
    activeNotices.forEach((n, idx) => {
        const isLeft = idx % 2 === 0;
        const sideClass = isLeft ? "timeline-left reveal-left" : "timeline-right reveal-right";
        const delayClass = `delay-${Math.min((idx + 2) * 100, 500)}`;

        const card = document.createElement("div");
        card.className = `timeline-item ${sideClass} ${delayClass} visible`;

        const cat = (n.category || "Updates");
        let catStyle = "color: var(--accent-color); font-weight: 700;";
        let cardBorderAccent = "";
        if (cat.toLowerCase() === "notices") {
            catStyle = "color: #d9534f; font-weight: 700;";
            cardBorderAccent = "border-left: 3px solid #d9534f;";
        } else if (cat.toLowerCase() === "events") {
            catStyle = "color: #5cb85c; font-weight: 700;";
            cardBorderAccent = "border-left: 3px solid #5cb85c;";
        }

        const dateStr = n.dateText ? (n.dateText.toLowerCase().startsWith("posted") ? n.dateText : `Posted on ${n.dateText}`) : "";

        card.innerHTML = `
            <div class="timeline-content" style="${cardBorderAccent}">
                <div class="announcement-meta" style="margin-bottom: 8px;">
                    <span class="category" style="${catStyle}">${escapeHtml(cat)}</span>
                    ${dateStr ? `<span class="date" style="font-size: 0.85rem; color: var(--accent-color);">${escapeHtml(dateStr)}</span>` : ""}
                </div>
                <h3 style="margin-bottom: 8px; font-size: 1.15rem; font-family: var(--font-heading);">${escapeHtml(n.title)}</h3>
                <p style="margin: 0; line-height: 1.6;">${escapeHtml(n.description || "")}</p>
            </div>
        `;
        timeline.appendChild(card);
    });
}

// --------------------------------------------------
// 2. About Page Loader (about.html)
// --------------------------------------------------
async function loadAboutPageContent() {
    try {
        const a = await getPublicContent("about");

        // 1. Introduction
        const introTitle = document.querySelector(".about-left h2, .about-intro h2, .about-hero h1");
        const introText = document.querySelector(".about-left p, .about-intro p, .about-hero p");
        if (introTitle && a.introTitle) {
            introTitle.innerHTML = escapeHtml(a.introTitle).replace(/^(\w+)/, "<span>$1</span>");
        }
        if (introText && a.introText) introText.textContent = a.introText;

        // 2. Vision & Mission Cards
        const aboutCards = document.querySelectorAll(".about-right .about-card");
        if (aboutCards.length >= 2) {
            const missionCardP = aboutCards[0].querySelector("p");
            const visionCardP = aboutCards[1].querySelector("p");
            if (missionCardP && a.missionText) missionCardP.textContent = a.missionText;
            if (visionCardP && a.visionText) visionCardP.textContent = a.visionText;
        }

        // 3. 4 Pillar Feature Cards
        const featureCards = document.querySelectorAll(".feature-grid .feature-card");
        if (featureCards.length >= 4) {
            for (let i = 1; i <= 4; i++) {
                const card = featureCards[i - 1];
                const titleVal = a[`feat${i}Title`];
                const descVal = a[`feat${i}Desc`];
                if (titleVal && card.querySelector("h4")) card.querySelector("h4").textContent = titleVal;
                if (descVal && card.querySelector("p")) card.querySelector("p").textContent = descVal;
            }
        }

        // 4. Journey Heading
        const journeyH2 = document.querySelector(".journey-heading h2");
        const journeyP = document.querySelector(".journey-heading p");
        if (journeyH2 && a.journeyTitle) {
            const parts = a.journeyTitle.split(" ");
            if (parts.length > 1) {
                const last = parts.pop();
                journeyH2.innerHTML = `${escapeHtml(parts.join(" "))} <span>${escapeHtml(last)}</span>`;
            } else {
                journeyH2.textContent = a.journeyTitle;
            }
        }
        if (journeyP && a.journeySubtitle) journeyP.textContent = a.journeySubtitle;

        // 5. Journey Timeline in .journey-wrapper
        if (Array.isArray(a.timeline) && a.timeline.length > 0) {
            const journeyWrapper = document.querySelector(".journey-wrapper");
            if (journeyWrapper) {
                const activeItems = a.timeline.filter(item => item.active !== false);
                activeItems.sort((x, y) => (parseInt(x.order) || 999) - (parseInt(y.order) || 999));

                let html = `<div class="timeline-line"><div class="timeline-progress"></div></div>`;
                activeItems.forEach((item, idx) => {
                    const isFuture = (item.year || "").toLowerCase().includes("future");
                    const cardClass = isFuture ? "timeline-card future-card" : "timeline-card";
                    html += `
                        <div class="timeline-step reveal-about">
                            <div class="timeline-icon">${escapeHtml(item.icon || "🚀")}</div>
                            <div class="timeline-dot"></div>
                            <div class="${cardClass}">
                                <span class="timeline-year">${escapeHtml(item.year || "")}</span>
                                <h3>${escapeHtml(item.title || "")}</h3>
                                <p>${escapeHtml(item.description || "")}</p>
                            </div>
                        </div>
                    `;
                    if (idx < activeItems.length - 1) {
                        html += `<div class="timeline-connector"></div>`;
                    }
                });
                journeyWrapper.innerHTML = html;
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
                        <h3>Responsibilities</h3>
                        <ul>${objectivesHtml}</ul>
                    </div>` : ""}
                    ${activitiesHtml ? `
                    <div>
                        <h3>Skills</h3>
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

        // 4. Load Dynamic "Meet The Team" Section
        try {
            const team = await getPublicContent("departmentsTeam");
            if (team) {
                const teamTitleEl = document.getElementById("deptTeamTitle");
                if (teamTitleEl && team.teamTitle) teamTitleEl.textContent = team.teamTitle;

                // Faculty Coordinator
                const facultyNameEl = document.getElementById("deptFacultyName");
                const facultyRoleEl = document.getElementById("deptFacultyRole");
                const facultyDescEl = document.getElementById("deptFacultyDesc");
                const facultyImgEl = document.getElementById("deptFacultyImg");

                if (facultyNameEl && team.facultyName) facultyNameEl.textContent = team.facultyName;
                if (facultyRoleEl && team.facultyRole) facultyRoleEl.textContent = team.facultyRole;
                if (facultyDescEl && team.facultyDesc) facultyDescEl.textContent = team.facultyDesc;
                if (facultyImgEl && team.facultyImage) facultyImgEl.src = team.facultyImage;

                // Student Coordinator
                const studentNameEl = document.getElementById("deptStudentName");
                const studentRoleEl = document.getElementById("deptStudentRole");
                const studentDescEl = document.getElementById("deptStudentDesc");
                const studentImgEl = document.getElementById("deptStudentImg");

                if (studentNameEl && team.studentName) studentNameEl.textContent = team.studentName;
                if (studentRoleEl && team.studentRole) studentRoleEl.textContent = team.studentRole;
                if (studentDescEl && team.studentDesc) studentDescEl.textContent = team.studentDesc;
                if (studentImgEl && team.studentImage) studentImgEl.src = team.studentImage;
            }
        } catch (teamErr) {
            console.warn("Meet The Team dynamic load notice:", teamErr);
        }

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
            if (registerBtn) {
                if (!hero.registerUrl || hero.registerUrl === "#" || hero.registerUrl.trim() === "") {
                    registerBtn.removeAttribute("target");
                    registerBtn.href = "#";
                    registerBtn.onclick = (e) => {
                        e.preventDefault();
                        if (typeof window.openEventRegisterModal === "function") {
                            window.openEventRegisterModal(hero.id || "featured-hero", hero.title || "Featured Event");
                        }
                    };
                } else {
                    registerBtn.href = hero.registerUrl;
                }
            }
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
                const hasExtLink = evt.registerUrl && evt.registerUrl !== "#" && evt.registerUrl.startsWith("http");

                const btnHtml = hasExtLink
                    ? `<a href="${escapeHtml(evt.registerUrl)}" target="_blank" class="event-btn btn-glow">
                            <span>Register Now</span>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>`
                    : `<button type="button" class="event-btn btn-glow" style="cursor:pointer;" onclick="window.openEventRegisterModal('${escapeHtml(evt.id || '')}', '${escapeHtml(evt.title)}')">
                            <span>Register Now</span>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </button>`;

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
                        ${btnHtml}
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
        renderEventsAnnouncementsFeed(noticeList);

        // Real-time synchronization for announcements on Events Page
        if (typeof db !== "undefined") {
            db.collection("announcements").onSnapshot((snapshot) => {
                if (!snapshot.empty) {
                    const liveNotices = [];
                    snapshot.forEach(doc => liveNotices.push({ id: doc.id, ...doc.data() }));
                    try {
                        localStorage.setItem("vvisc_col_announcements", JSON.stringify(liveNotices));
                    } catch (e) {}
                    renderEventsAnnouncementsFeed(liveNotices);
                } else {
                    renderEventsAnnouncementsFeed([]);
                }
            }, (err) => {
                console.warn("Real-time announcements snapshot error on events:", err);
            });
        }

        // 6. Internal Event Registration Modal Handling
        window.openEventRegisterModal = function(id, title) {
            const modal = document.getElementById("eventRegisterModal");
            const idInput = document.getElementById("regEventId");
            const titleInput = document.getElementById("regEventTitle");
            const alertEl = document.getElementById("regStatusAlert");
            if (idInput) idInput.value = id || "general";
            if (titleInput) titleInput.value = title || "VVISC Event";
            if (alertEl) alertEl.style.display = "none";
            if (modal) modal.style.display = "flex";
        };

        const closeBtn = document.getElementById("closeRegModal");
        const regModal = document.getElementById("eventRegisterModal");
        if (closeBtn && regModal) {
            closeBtn.onclick = () => { regModal.style.display = "none"; };
            regModal.onclick = (e) => { if (e.target === regModal) regModal.style.display = "none"; };
        }

        const regForm = document.getElementById("eventRegistrationForm");
        if (regForm && !regForm.dataset.bound) {
            regForm.dataset.bound = "true";
            regForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById("regSubmitBtn");
                const alertEl = document.getElementById("regStatusAlert");
                const eventId = document.getElementById("regEventId").value;
                const eventTitle = document.getElementById("regEventTitle").value;
                const name = document.getElementById("regStudentName").value.trim();
                const email = document.getElementById("regStudentEmail").value.trim();
                const rollNumber = document.getElementById("regRollNumber").value.trim();
                const phone = document.getElementById("regPhone").value.trim();
                const department = document.getElementById("regBranch").value;
                const yearOfStudy = document.getElementById("regYear").value;

                if (!name || !email || !rollNumber) {
                    alert("Please fill in all required fields.");
                    return;
                }

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = "Reserving Seat...";
                }

                try {
                    await db.collection("registrations").add({
                        eventId: eventId || "general",
                        eventTitle: eventTitle || "VVISC Event",
                        name: name.substring(0, 100),
                        email: email.substring(0, 150),
                        rollNumber: rollNumber.substring(0, 50),
                        phone: phone.substring(0, 20),
                        department: department,
                        yearOfStudy: yearOfStudy,
                        status: "registered",
                        attended: false,
                        createdAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                    });

                    regForm.reset();
                    if (alertEl) {
                        alertEl.style.display = "block";
                        alertEl.style.background = "rgba(46, 204, 113, 0.15)";
                        alertEl.style.border = "1px solid rgba(46, 204, 113, 0.4)";
                        alertEl.style.color = "#2ecc71";
                        alertEl.innerHTML = `<strong>✓ Registration Confirmed!</strong><br>Your seat for <em>${escapeHtml(eventTitle)}</em> has been reserved. A confirmation ticket has been logged for Roll No: <strong>${escapeHtml(rollNumber)}</strong>.`;
                    }
                } catch (err) {
                    console.error("Error submitting registration:", err);
                    if (alertEl) {
                        alertEl.style.display = "block";
                        alertEl.style.background = "rgba(231, 76, 60, 0.15)";
                        alertEl.style.border = "1px solid rgba(231, 76, 60, 0.4)";
                        alertEl.style.color = "#e74c3c";
                        alertEl.textContent = "Registration failed: " + (err.message || "Please check your network and try again.");
                    }
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Complete Registration →";
                    }
                }
            });
        }

    } catch (e) {
        console.warn("loadEventsPageContent error:", e);
    }
}

function renderEventsAnnouncementsFeed(noticeList) {
    if (!noticeList || noticeList.length === 0) return;
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
        // Initial render from local cache or Firestore
        const members = await getPublicCollection("councilMembers");
        if (members && members.length > 0) {
            renderCouncilDOM(members);
        }

        // Real-time Firestore sync: Any modification made in ANY profile or device updates live instantly!
        if (typeof db !== "undefined") {
            db.collection("councilMembers").onSnapshot((snapshot) => {
                if (!snapshot.empty) {
                    const liveMembers = [];
                    snapshot.forEach(doc => {
                        liveMembers.push({ id: doc.id, ...doc.data() });
                    });
                    try {
                        localStorage.setItem("vvisc_col_councilMembers", JSON.stringify(liveMembers));
                    } catch (e) {}
                    renderCouncilDOM(liveMembers);
                }
            }, (err) => {
                console.warn("Real-time council snapshot notice:", err);
            });
        }
    } catch (e) {
        console.warn("loadCouncilPageContent error:", e);
    }
}

function renderCouncilDOM(members) {
    const activeMembers = members.filter(m => {
        if (m.active === false) return false;
        // Purge dummy placeholder records
        if (m.name && (m.name.toLowerCase().includes("member 2") || m.name === "Dr. Faculty Name")) return false;
        return true;
    });
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
                        ${chiefMember.linkedin ? `<a href="${escapeHtml(chiefMember.linkedin)}" target="_blank" rel="noopener" class="btn-linkedin">LinkedIn →</a>` : ""}
                        ${chiefMember.github ? `<a href="${escapeHtml(chiefMember.github)}" target="_blank" rel="noopener" class="btn-profile">View Profile</a>` : ""}
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
                    ${m.email ? `
                    <div class="member-email-wrap">
                        <a href="mailto:${escapeHtml(m.email)}" class="member-email-link" title="Email ${escapeHtml(m.name)}">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <span>${escapeHtml(m.email)}</span>
                        </a>
                    </div>
                    ` : ""}
                    <p>${escapeHtml(m.description || "")}</p>
                    ${m.linkedin ? `<a href="${escapeHtml(m.linkedin)}" target="_blank" rel="noopener" class="member-btn">View Profile →</a>` : ""}
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
                ${m.email ? `
                <div class="member-email-wrap">
                    <a href="mailto:${escapeHtml(m.email)}" class="member-email-link" title="Email ${escapeHtml(m.name)}">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span>${escapeHtml(m.email)}</span>
                    </a>
                </div>
                ` : ""}
                <p>${escapeHtml(m.description || "")}</p>
                <div class="role-buttons">
                    ${m.linkedin ? `<a href="${escapeHtml(m.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ""}
                    ${m.github ? `<a href="${escapeHtml(m.github)}" target="_blank" rel="noopener">GitHub</a>` : ""}
                </div>
            `;
            roleGrid.appendChild(card);
        });
    }
}

// --------------------------------------------------
// 5. Gallery Page Loader (gallery.html)
// --------------------------------------------------
async function loadGalleryPageContent() {
    try {
        // 1. Initial render from cache or Firestore
        const titles = await getPublicContent("gallery");
        renderGalleryTitles(titles);

        const items = await getPublicCollection("gallery");
        renderGalleryContent(items);

        // 2. Real-time Firestore sync: updates reflect immediately
        if (typeof db !== "undefined") {
            db.collection("gallery").onSnapshot((snapshot) => {
                if (!snapshot.empty) {
                    const liveItems = [];
                    snapshot.forEach(doc => liveItems.push({ id: doc.id, ...doc.data() }));
                    try {
                        localStorage.setItem("vvisc_col_gallery", JSON.stringify(liveItems));
                    } catch (e) {}
                    renderGalleryContent(liveItems);
                } else {
                    try {
                        localStorage.setItem("vvisc_col_gallery", JSON.stringify([]));
                    } catch (e) {}
                    renderGalleryContent([]);
                }
            }, (err) => {
                console.warn("Real-time gallery snapshot error:", err);
            });

            db.collection("websiteContent").doc("gallery").onSnapshot((doc) => {
                if (doc.exists) {
                    const liveTitles = doc.data();
                    try {
                        localStorage.setItem("vvisc_cms_gallery", JSON.stringify(liveTitles));
                    } catch (e) {}
                    renderGalleryTitles(liveTitles);
                }
            }, (err) => {
                console.warn("Real-time gallery titles snapshot error:", err);
            });
        }
    } catch (e) {
        console.warn("loadGalleryPageContent error:", e);
    }
}

function renderGalleryTitles(t) {
    if (!t) return;

    // 1. Hero Section
    const heroTag = document.getElementById("galleryHeroTag");
    const heroHeading = document.getElementById("galleryHeroHeading");
    const heroSubtitle = document.getElementById("galleryHeroSubtitle");
    if (heroTag && t.heroTag) heroTag.textContent = t.heroTag;
    if (heroHeading && (t.heroTitle || t.heroHighlight)) {
        heroHeading.innerHTML = `${escapeHtml(t.heroTitle || "Every Event")} <span>${escapeHtml(t.heroHighlight || "Creates a Story.")}</span>`;
    }
    if (heroSubtitle && t.heroSubtitle) heroSubtitle.textContent = t.heroSubtitle;

    // 2. Featured Albums Section
    const albumsTag = document.getElementById("galleryAlbumsTag");
    const albumsHeading = document.getElementById("galleryAlbumsHeading");
    const albumsSubtitle = document.getElementById("galleryAlbumsSubtitle");
    if (albumsTag && t.albumsTag) albumsTag.textContent = t.albumsTag;
    if (albumsHeading && (t.albumsTitle || t.albumsHighlight)) {
        albumsHeading.innerHTML = `${escapeHtml(t.albumsTitle || "Explore Our")} <span>${escapeHtml(t.albumsHighlight || "Memories")}</span>`;
    }
    if (albumsSubtitle && t.albumsSubtitle) albumsSubtitle.textContent = t.albumsSubtitle;

    // 3. Photo Collection Section
    const photosTag = document.getElementById("galleryPhotosTag");
    const photosHeading = document.getElementById("galleryPhotosHeading");
    const photosSubtitle = document.getElementById("galleryPhotosSubtitle");
    if (photosTag && t.photosTag) photosTag.textContent = t.photosTag;
    if (photosHeading && (t.photosTitle || t.photosHighlight)) {
        photosHeading.innerHTML = `${escapeHtml(t.photosTitle || "Moments We")} <span>${escapeHtml(t.photosHighlight || "Captured")}</span>`;
    }
    if (photosSubtitle && t.photosSubtitle) photosSubtitle.textContent = t.photosSubtitle;

    // 4. Statistics Counters
    const statPhotosEl = document.getElementById("statPhotosCount");
    const statEventsEl = document.getElementById("statEventsCount");
    const statPartEl = document.getElementById("statParticipantsCount");
    const statMemEl = document.getElementById("statMemoriesCount");

    if (statPhotosEl && t.statPhotos !== undefined) {
        const val = parseInt(t.statPhotos) || 2500;
        statPhotosEl.setAttribute("data-target", val);
        statPhotosEl.textContent = val;
    }
    if (statEventsEl && t.statEvents !== undefined) {
        const val = parseInt(t.statEvents) || 85;
        statEventsEl.setAttribute("data-target", val);
        statEventsEl.textContent = val;
    }
    if (statPartEl && t.statParticipants !== undefined) {
        const val = parseInt(t.statParticipants) || 5000;
        statPartEl.setAttribute("data-target", val);
        statPartEl.textContent = val;
    }
    if (statMemEl && t.statMemories !== undefined) {
        statMemEl.textContent = t.statMemories;
        const numOnly = parseInt(t.statMemories) || 120;
        statMemEl.setAttribute("data-target", numOnly);
    }
}

function renderGalleryContent(items) {
    const albumGrid = document.getElementById("galleryAlbumGrid");
    const filterContainer = document.getElementById("galleryCategoryFilter");
    const masonryGrid = document.getElementById("galleryMasonry");
    const carouselContainer = document.getElementById("galleryCarousel3d");
    const showcaseSection = document.getElementById("photoShowcaseSection");

    const activeItems = (items || []).filter(i => i.active !== false);
    activeItems.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));

    // Handle 0 active items: Clean empty states, no hardcoded fake images
    if (activeItems.length === 0) {
        if (showcaseSection) showcaseSection.style.display = "none";

        if (albumGrid) {
            albumGrid.innerHTML = `
                <div class="gallery-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; border: 1px dashed var(--border-color, rgba(255,255,255,0.15)); border-radius: 16px; background: rgba(0,0,0,0.02);">
                    <div style="font-size: 2.8rem; margin-bottom: 10px;">📂</div>
                    <h3 style="font-size: 1.2rem; margin-bottom: 6px;">No Albums Published Yet</h3>
                    <p style="font-size: 0.9rem; opacity: 0.75; margin: 0; max-width: 480px; margin: 0 auto;">
                        Photos and albums will appear here as soon as they are uploaded in the Admin Management Console.
                    </p>
                </div>
            `;
        }

        if (filterContainer) {
            filterContainer.innerHTML = `<button class="gallery-filter-btn active" data-category="all">All (0)</button>`;
        }

        if (masonryGrid) {
            masonryGrid.innerHTML = `
                <div class="gallery-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; border: 1px dashed var(--border-color, rgba(255,255,255,0.15)); border-radius: 16px; background: rgba(0,0,0,0.02);">
                    <div style="font-size: 3rem; margin-bottom: 12px;">📸</div>
                    <h3 style="font-size: 1.25rem; margin-bottom: 6px;">No Moments Captured Yet</h3>
                    <p style="font-size: 0.9rem; opacity: 0.75; margin: 0; max-width: 480px; margin: 0 auto;">
                        Check back soon! New photos uploaded in Admin Management will appear right here.
                    </p>
                </div>
            `;
        }
        return;
    }

    // 1. Render 3D Photo Showcase
    if (showcaseSection) showcaseSection.style.display = "";
    if (carouselContainer) {
        carouselContainer.innerHTML = "";
        const maxCarouselSlots = 8;
        for (let i = 0; i < maxCarouselSlots; i++) {
            const item = activeItems[i % activeItems.length];
            const span = document.createElement("span");
            span.style.setProperty("--i", i + 1);
            const img = document.createElement("img");
            img.src = escapeHtml(item.imageUrl || item.image || "assets/logo.png");
            img.alt = escapeHtml(item.title || `VVISC Moment ${i + 1}`);
            img.onerror = function() { this.src = "assets/logo.png"; };
            span.appendChild(img);
            carouselContainer.appendChild(span);
        }
    }

    // 2. Group Active Photos by Category for Featured Albums
    const categoryMap = new Map();
    activeItems.forEach(item => {
        const cat = (item.category || "Events").trim();
        if (!categoryMap.has(cat)) {
            categoryMap.set(cat, []);
        }
        categoryMap.get(cat).push(item);
    });

    if (albumGrid) {
        albumGrid.innerHTML = "";
        let delayIndex = 0;
        categoryMap.forEach((photos, catName) => {
            const coverPhoto = photos[0];
            const coverSrc = coverPhoto.imageUrl || coverPhoto.image || "assets/AI-Bootcamp.png";
            const delayClass = delayIndex > 0 ? ` delay-${Math.min(delayIndex * 100, 500)}` : "";
            delayIndex++;

            const card = document.createElement("div");
            card.className = `album-card reveal-up${delayClass}`;
            card.setAttribute("data-album-category", catName);
            card.style.cursor = "pointer";
            card.innerHTML = `
                <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(catName)}" onerror="this.onerror=null; this.src='assets/logo.png';">
                <div class="album-overlay">
                    <span>${escapeHtml(catName)}</span>
                    <h3>${escapeHtml(catName)}</h3>
                    <p>${photos.length} Photo${photos.length === 1 ? '' : 's'}</p>
                    <a href="#photoGallery" class="open-album-btn" data-category="${escapeHtml(catName)}">
                        Open Album →
                    </a>
                </div>
            `;

            // Clicking card or link activates that filter and scrolls down
            card.onclick = (e) => {
                const targetCat = catName.toLowerCase();
                filterMasonryGallery(targetCat);
                if (filterContainer) {
                    const filterBtns = filterContainer.querySelectorAll(".gallery-filter-btn");
                    filterBtns.forEach(btn => {
                        const btnCat = (btn.getAttribute("data-category") || "").toLowerCase();
                        btn.classList.toggle("active", btnCat === targetCat);
                    });
                }
                const photoGalleryEl = document.getElementById("photoGallery");
                if (photoGalleryEl) {
                    photoGalleryEl.scrollIntoView({ behavior: "smooth" });
                }
            };

            albumGrid.appendChild(card);
        });
    }

    // 3. Render Category Filter Buttons
    if (filterContainer) {
        filterContainer.innerHTML = "";
        const allBtn = document.createElement("button");
        allBtn.className = "gallery-filter-btn active";
        allBtn.setAttribute("data-category", "all");
        allBtn.textContent = `All (${activeItems.length})`;
        allBtn.onclick = () => {
            filterContainer.querySelectorAll(".gallery-filter-btn").forEach(b => b.classList.remove("active"));
            allBtn.classList.add("active");
            filterMasonryGallery("all");
        };
        filterContainer.appendChild(allBtn);

        categoryMap.forEach((photos, catName) => {
            const btn = document.createElement("button");
            btn.className = "gallery-filter-btn";
            btn.setAttribute("data-category", catName.toLowerCase());
            btn.textContent = `${catName} (${photos.length})`;
            btn.onclick = () => {
                filterContainer.querySelectorAll(".gallery-filter-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                filterMasonryGallery(catName.toLowerCase());
            };
            filterContainer.appendChild(btn);
        });
    }

    // 4. Render Masonry Gallery Items
    if (masonryGrid) {
        masonryGrid.innerHTML = "";
        const sizeClasses = ["large", "", "tall", "", "wide", "", "tall", ""];

        activeItems.forEach((item, idx) => {
            const sizeClass = sizeClasses[idx % sizeClasses.length];
            const card = document.createElement("div");
            card.className = `gallery-item ${sizeClass}`.trim();
            const cat = (item.category || "").toLowerCase();
            card.setAttribute("data-category", cat);

            const imgSrc = escapeHtml(item.imageUrl || item.image || "assets/logo.png");
            const title = escapeHtml(item.title || "VVISC Moment");
            const caption = escapeHtml(item.description || item.caption || "");

            card.innerHTML = `
                <img src="${imgSrc}" alt="${title}" onerror="this.onerror=null; this.src='assets/logo.png';">
                <div class="gallery-overlay">
                    <h3>${title}</h3>
                    ${caption ? `<p style="font-size:0.85rem; opacity:0.85; margin-bottom:6px;">${caption}</p>` : ""}
                    <span>View Photo</span>
                </div>
            `;

            masonryGrid.appendChild(card);
        });

        // 5. Initialize Dynamic Lightbox for Dynamic Items
        setupDynamicGalleryLightbox();
    }
}

function filterMasonryGallery(category) {
    const masonryGrid = document.getElementById("galleryMasonry");
    if (!masonryGrid) return;
    const items = masonryGrid.querySelectorAll(".gallery-item");
    const target = (category || "all").toLowerCase();

    items.forEach(item => {
        const itemCat = (item.getAttribute("data-category") || "").toLowerCase();
        if (target === "all" || itemCat === target || itemCat.includes(target) || target.includes(itemCat)) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    });
}

function setupDynamicGalleryLightbox() {
    const lightbox = document.getElementById("galleryLightbox");
    const lightboxImage = document.getElementById("lightboxImage");
    const closeBtn = document.querySelector(".lightbox-close");
    const nextBtn = document.querySelector(".lightbox-next");
    const prevBtn = document.querySelector(".lightbox-prev");

    if (!lightbox || !lightboxImage) return;

    let currentIndex = 0;
    let visibleItems = [];

    function updateVisibleItems() {
        const masonryGrid = document.getElementById("galleryMasonry");
        if (!masonryGrid) return [];
        return Array.from(masonryGrid.querySelectorAll(".gallery-item")).filter(
            item => item.style.display !== "none"
        );
    }

    function showLightboxImage(idx) {
        visibleItems = updateVisibleItems();
        if (visibleItems.length === 0) return;
        currentIndex = (idx + visibleItems.length) % visibleItems.length;
        const img = visibleItems[currentIndex].querySelector("img");
        if (img) {
            lightboxImage.src = img.src;
            lightboxImage.alt = img.alt || "VVISC Gallery Photo";
            lightbox.classList.add("active");
        }
    }

    const masonryGrid = document.getElementById("galleryMasonry");
    if (masonryGrid) {
        const items = masonryGrid.querySelectorAll(".gallery-item");
        items.forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                visibleItems = updateVisibleItems();
                const clickedIndex = visibleItems.indexOf(item);
                showLightboxImage(clickedIndex >= 0 ? clickedIndex : 0);
            };
        });
    }

    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            lightbox.classList.remove("active");
        };
    }

    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            showLightboxImage(currentIndex + 1);
        };
    }

    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            showLightboxImage(currentIndex - 1);
        };
    }

    lightbox.onclick = (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove("active");
        }
    };

    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("active")) return;
        if (e.key === "Escape") lightbox.classList.remove("active");
        if (e.key === "ArrowRight") showLightboxImage(currentIndex + 1);
        if (e.key === "ArrowLeft") showLightboxImage(currentIndex - 1);
    });
}

// --------------------------------------------------
// 6. Contact Page Loader (contact.html)
// --------------------------------------------------
async function loadContactPageContent() {
    try {
        const c = await getPublicContent("contact");
        const s = await getPublicContent("settings");
        const ws = await getPublicContent("websiteSettings");
        const merged = { ...s, ...ws, ...c };

        const email = merged.officialEmail || merged.email || merged.contactEmail;
        const phone = merged.phone;
        const address = merged.address;
        const officeHours = merged.officeHours;
        const mapUrl = merged.mapEmbedUrl;

        // Contact info cards
        const cards = document.querySelectorAll(".contact-grid .contact-card");
        if (cards && cards.length >= 4) {
            if (address && cards[0].querySelector("p")) cards[0].querySelector("p").innerHTML = escapeHtml(address).replace(/\n/g, "<br>");
            if (email && cards[1].querySelector("p")) cards[1].querySelector("p").innerHTML = `<a href="mailto:${escapeHtml(email)}" style="color:inherit; text-decoration:none;">${escapeHtml(email)}</a>`;
            if (phone && cards[2].querySelector("p")) cards[2].querySelector("p").innerHTML = `<a href="tel:${escapeHtml(phone)}" style="color:inherit; text-decoration:none;">${escapeHtml(phone)}</a>`;
            if (officeHours && cards[3].querySelector("p")) cards[3].querySelector("p").innerHTML = escapeHtml(officeHours).replace(/\n/g, "<br>");
        }

        const mapIframe = document.querySelector(".map-container iframe, iframe[src*='maps']");
        if (mapIframe && mapUrl) mapIframe.src = mapUrl;

        // Bind Contact Form Submission to contactMessages collection
        const contactForm = document.getElementById("contactForm") || document.querySelector(".contact-form");
        if (contactForm && !contactForm.dataset.bound) {
            contactForm.dataset.bound = "true";
            contactForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById("contactSubmitBtn") || contactForm.querySelector("button[type='submit'], .send-btn");
                const statusEl = document.getElementById("contactFormStatus");
                
                const nameInput = document.getElementById("contactName") || contactForm.querySelector("input[type='text']");
                const emailInput = document.getElementById("contactEmail") || contactForm.querySelector("input[type='email']");
                const subjectInput = document.getElementById("contactSubject");
                const messageInput = document.getElementById("contactMessage") || contactForm.querySelector("textarea");

                const name = (nameInput ? nameInput.value : "").trim();
                const emailVal = (emailInput ? emailInput.value : "").trim();
                const subject = (subjectInput ? subjectInput.value : "General Inquiry").trim() || "General Inquiry";
                const message = (messageInput ? messageInput.value : "").trim();

                if (!name || !emailVal || !message) {
                    alert("Please fill in your name, email, and message.");
                    return;
                }

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = "Sending...";
                }

                const payload = {
                    name: name.substring(0, 100),
                    email: emailVal.substring(0, 150),
                    subject: subject.substring(0, 200),
                    message: message.substring(0, 5000),
                    status: "new",
                    createdAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                };

                try {
                    await db.collection("contactMessages").add(payload);
                    contactForm.reset();
                    if (statusEl) {
                        statusEl.style.display = "block";
                        statusEl.style.background = "rgba(46, 204, 113, 0.15)";
                        statusEl.style.border = "1px solid rgba(46, 204, 113, 0.4)";
                        statusEl.style.color = "#2ecc71";
                        statusEl.textContent = "✓ Thank you! Your message has been sent to the VVISC team. We will respond to your email soon.";
                    } else {
                        alert("Thank you! Your message has been sent successfully.");
                    }
                } catch (err) {
                    console.error("Error submitting contact form:", err);
                    if (statusEl) {
                        statusEl.style.display = "block";
                        statusEl.style.background = "rgba(231, 76, 60, 0.15)";
                        statusEl.style.border = "1px solid rgba(231, 76, 60, 0.4)";
                        statusEl.style.color = "#e74c3c";
                        statusEl.textContent = "Submission failed: " + (err.message || "Please check your network and try again.");
                    } else {
                        alert("Failed to send message: " + err.message);
                    }
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Send Message →";
                    }
                }
            });
        }
    } catch (e) {
        console.warn("loadContactPageContent error:", e);
    }
}

// --------------------------------------------------
// 8. Projects Page Loader (projects.html)
// --------------------------------------------------
async function loadProjectsPageContent() {
    try {
        const grid = document.getElementById("projectsGrid");
        const searchInput = document.getElementById("projectSearch");
        const pills = document.querySelectorAll("#projectFilterPills .pill-btn");
        const modal = document.getElementById("projectDetailModal");
        const modalContent = document.getElementById("modalContent");
        const closeModalBtn = document.getElementById("closeProjectModal");

        if (!grid) return;

        let projects = await getPublicCollection("projects");

        // High quality fallback data if collection is not yet populated
        if (!projects || projects.length === 0) {
            projects = [
                {
                    id: "p1",
                    title: "Autonomous Campus Navigation Robot",
                    category: "Robotics & IoT",
                    shortDescription: "A self-driving robotic rover utilizing LiDAR SLAM and ultrasonic obstacle avoidance for autonomous campus delivery.",
                    fullDescription: "Built by the robotics team, this prototype utilizes ROS2, 2D LiDAR, and computer vision on an NVIDIA Jetson platform to map buildings and deliver logistics packages autonomously without GPS dependency.",
                    technologies: ["ROS2", "Python", "LiDAR SLAM", "Jetson Nano", "C++"],
                    status: "Completed",
                    leadName: "K. Rajesh",
                    teamMembers: "K. Rajesh, V. Karthik, S. Meghana",
                    githubUrl: "https://github.com/",
                    liveDemoUrl: "",
                    image: "assets/nodp.png",
                    active: true
                },
                {
                    id: "p2",
                    title: "Smart Attendance & RFID Edge System",
                    category: "Digital Infrastructure",
                    shortDescription: "Ultra-fast contact-free attendance logger with real-time biometric and cloud sync for campus auditoriums.",
                    fullDescription: "Designed for high-throughput entry logging during technical conferences and seminars. Integrates ESP32 microcontroller arrays with low-latency Firebase RTDB sync and automated attendance PDF reporting.",
                    technologies: ["ESP32", "Firebase", "Node.js", "C++", "Next.js"],
                    status: "In Progress",
                    leadName: "P. Sai",
                    teamMembers: "P. Sai, N. Tarun, D. Harika",
                    githubUrl: "https://github.com/",
                    liveDemoUrl: "https://vvisc-iucee.web.app",
                    image: "assets/nodp.png",
                    active: true
                },
                {
                    id: "p3",
                    title: "AI Crop Disease Diagnostic Engine",
                    category: "AI & Data Science",
                    shortDescription: "Deep learning vision system detecting 24+ crop leaf pathogens from smartphone camera captures.",
                    fullDescription: "An AI/ML initiative aimed at regional farmers. Utilizes a fine-tuned MobileNetV3 model trained on 50,000+ agricultural plant pathology images with offline inference capability on progressive web apps.",
                    technologies: ["TensorFlow", "Python", "OpenCV", "FastAPI", "React"],
                    status: "Completed",
                    leadName: "M. Teja",
                    teamMembers: "M. Teja, B. Sravani, J. Aditya",
                    githubUrl: "https://github.com/",
                    liveDemoUrl: "",
                    image: "assets/nodp.png",
                    active: true
                },
                {
                    id: "p4",
                    title: "IUCEE Global Collaboration Portal",
                    category: "Web & App",
                    shortDescription: "Unified digital hub facilitating cross-chapter project tracking, peer code review, and mentor office hours.",
                    fullDescription: "Full-stack cloud-native portal engineered by the web division to bridge student chapters across international universities, integrating real-time chat, project repositories, and event registries.",
                    technologies: ["HTML5", "CSS3", "JavaScript", "Firebase", "WebSockets"],
                    status: "In Progress",
                    leadName: "V. Ananya",
                    teamMembers: "V. Ananya, L. Nitin, R. Praveen",
                    githubUrl: "https://github.com/",
                    liveDemoUrl: "https://vvisc-iucee.web.app",
                    image: "assets/nodp.png",
                    active: true
                },
                {
                    id: "p5",
                    title: "Renewable Microgrid IoT Monitoring",
                    category: "R&D",
                    shortDescription: "Solar and wind energy generation metrics collector with predictive anomaly alerts.",
                    fullDescription: "An ongoing green-tech project capturing PV inverter telemetry, ambient temperature, and power dissipation curves to forecast efficiency drops and battery degradation patterns using edge sensors.",
                    technologies: ["IoT", "Arduino", "MQTT", "Grafana", "Python"],
                    status: "Upcoming",
                    leadName: "B. Tharun",
                    teamMembers: "B. Tharun, G. Kavya",
                    githubUrl: "https://github.com/",
                    liveDemoUrl: "",
                    image: "assets/nodp.png",
                    active: true
                }
            ];
        }

        let activeCategory = "all";
        let searchQuery = "";

        function getStatusClass(status) {
            const s = (status || "").toLowerCase();
            if (s.includes("complete")) return "status-completed";
            if (s.includes("progress")) return "status-in-progress";
            return "status-upcoming";
        }

        function renderProjects() {
            let filtered = projects.filter(p => p.active !== false);

            if (activeCategory !== "all") {
                filtered = filtered.filter(p => {
                    const cat = (p.category || "").toLowerCase();
                    const target = activeCategory.toLowerCase();
                    return cat.includes(target) || target.includes(cat);
                });
            }

            if (searchQuery.trim() !== "") {
                const q = searchQuery.toLowerCase().trim();
                filtered = filtered.filter(p => {
                    const title = (p.title || "").toLowerCase();
                    const desc = (p.shortDescription || p.fullDescription || "").toLowerCase();
                    const lead = (p.leadName || "").toLowerCase();
                    const tech = Array.isArray(p.technologies) ? p.technologies.join(" ").toLowerCase() : (p.technologies || "").toLowerCase();
                    return title.includes(q) || desc.includes(q) || lead.includes(q) || tech.includes(q);
                });
            }

            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--card-bg, rgba(255,255,255,0.03)); border: 1px dashed var(--border-color, rgba(255,255,255,0.1)); border-radius: 16px;">
                        <span style="font-size: 2.5rem; display: block; margin-bottom: 12px;">🔍</span>
                        <h3 style="font-size: 1.2rem; margin-bottom: 6px;">No projects found</h3>
                        <p style="color: var(--text-muted, #94a3b8); font-size: 0.9rem;">Try adjusting your filter or search keywords.</p>
                    </div>
                `;
                return;
            }

            grid.innerHTML = filtered.map(p => {
                const techList = Array.isArray(p.technologies)
                    ? p.technologies
                    : (typeof p.technologies === "string" ? p.technologies.split(",").map(t => t.trim()).filter(Boolean) : []);

                const techBadges = techList.slice(0, 4).map(t => `<span class="tech-chip">${escapeHtml(t)}</span>`).join("");
                const statusClass = getStatusClass(p.status);
                const imgSrc = getPublicImgSrc(p.image);

                return `
                    <div class="project-card reveal-up" data-id="${escapeHtml(p.id)}">
                        <div class="project-thumb-wrap">
                            <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.title)}" class="project-thumb" loading="lazy" onerror="this.src='assets/nodp.png'">
                            <div class="project-badge-bar">
                                <span class="project-tag">${escapeHtml(p.category || "Technical")}</span>
                                <span class="project-status ${statusClass}">${escapeHtml(p.status || "Active")}</span>
                            </div>
                        </div>
                        <div class="project-body">
                            <h3 class="project-title">${escapeHtml(p.title)}</h3>
                            <p class="project-desc">${escapeHtml(p.shortDescription || p.fullDescription || "")}</p>
                            
                            <div class="project-tech-chips">
                                ${techBadges}
                            </div>

                            <div class="project-footer">
                                <div class="project-lead">
                                    Lead: <strong>${escapeHtml(p.leadName || "VVISC Team")}</strong>
                                </div>
                                <div class="project-actions">
                                    <button class="btn-detail" onclick="window.openProjectModal('${escapeHtml(p.id)}')">Details</button>
                                    ${p.githubUrl ? `
                                        <a href="${escapeHtml(p.githubUrl)}" target="_blank" rel="noopener noreferrer" class="icon-link" title="Source Code" aria-label="GitHub">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                                        </a>` : ''}
                                    ${p.liveDemoUrl ? `
                                        <a href="${escapeHtml(p.liveDemoUrl)}" target="_blank" rel="noopener noreferrer" class="icon-link" title="Live Preview" aria-label="Demo">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                        </a>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");
        }

        // Global opener for project detail modal
        window.openProjectModal = function(projectId) {
            const p = projects.find(item => item.id === projectId);
            if (!p || !modal || !modalContent) return;

            const techList = Array.isArray(p.technologies)
                ? p.technologies
                : (typeof p.technologies === "string" ? p.technologies.split(",").map(t => t.trim()).filter(Boolean) : []);

            const techBadges = techList.map(t => `<span class="tech-chip" style="font-size:0.8rem; padding:4px 10px;">${escapeHtml(t)}</span>`).join("");
            const imgSrc = getPublicImgSrc(p.image);
            const statusClass = getStatusClass(p.status);

            modalContent.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; padding-right: 30px;">
                        <span class="project-tag">${escapeHtml(p.category || "Technical Project")}</span>
                        <span class="project-status ${statusClass}">${escapeHtml(p.status || "Active")}</span>
                    </div>
                    <h2 style="font-size: 1.6rem; font-weight: 800; line-height: 1.3; margin-bottom: 12px; color: var(--text-color, #fff);">${escapeHtml(p.title)}</h2>
                    ${p.image && p.image !== 'assets/nodp.png' ? `
                        <div style="width:100%; height:220px; border-radius:12px; overflow:hidden; margin-bottom:16px;">
                            <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.title)}" style="width:100%; height:100%; object-fit:cover;">
                        </div>
                    ` : ''}
                    <div style="color: var(--text-muted, #94a3b8); font-size: 0.95rem; line-height: 1.7; margin-bottom: 20px;">
                        ${escapeHtml(p.fullDescription || p.shortDescription || "No detailed description provided.")}
                    </div>

                    <div style="margin-bottom: 18px;">
                        <h4 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted, #94a3b8); margin-bottom: 8px;">Technologies &amp; Tools</h4>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">${techBadges || '<span style="color:#888;">N/A</span>'}</div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; background:rgba(255,255,255,0.04); padding:14px; border-radius:12px; border:1px solid var(--border-color, rgba(255,255,255,0.08)); margin-bottom: 24px;">
                        <div>
                            <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted,#94a3b8); display:block;">Project Lead</span>
                            <strong style="color:var(--text-color,#fff); font-size:0.9rem;">${escapeHtml(p.leadName || "VVISC Team")}</strong>
                        </div>
                        <div>
                            <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted,#94a3b8); display:block;">Team Members</span>
                            <span style="color:var(--text-color,#fff); font-size:0.85rem;">${escapeHtml(p.teamMembers || "VVISC Members")}</span>
                        </div>
                    </div>

                    <div style="display:flex; gap:12px; justify-content:flex-end;">
                        ${p.githubUrl ? `
                            <a href="${escapeHtml(p.githubUrl)}" target="_blank" rel="noopener noreferrer" class="primary-btn" style="text-decoration:none; padding:10px 18px; border-radius:8px; display:inline-flex; align-items:center; gap:8px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                                GitHub Repo
                            </a>
                        ` : ''}
                        ${p.liveDemoUrl ? `
                            <a href="${escapeHtml(p.liveDemoUrl)}" target="_blank" rel="noopener noreferrer" class="secondary-btn" style="text-decoration:none; padding:10px 18px; border-radius:8px; display:inline-flex; align-items:center; gap:8px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                Live Demo
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
            modal.style.display = "flex";
        };

        if (closeModalBtn) {
            closeModalBtn.addEventListener("click", () => {
                modal.style.display = "none";
            });
        }
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) modal.style.display = "none";
            });
        }

        // Search listener
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                searchQuery = e.target.value;
                renderProjects();
            });
        }

        // Pill button listeners
        pills.forEach(pill => {
            pill.addEventListener("click", () => {
                pills.forEach(p => p.classList.remove("active"));
                pill.classList.add("active");
                activeCategory = pill.getAttribute("data-category") || "all";
                renderProjects();
            });
        });

        // Initial render
        renderProjects();
    } catch (e) {
        console.warn("loadProjectsPageContent error:", e);
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
