// =========================================================
// Events & Workshops Management Logic (VVISC CMS)
// Handles Hero Event, Upcoming Events, Past Highlights,
// Impact Numbers, and Updates & Notices.
// =========================================================

let upcomingEventsList = [];
let pastEventsList = [];
let noticesList = [];
let currentActiveTab = "hero"; // 'hero', 'upcoming', 'past', 'impact', 'notices'
let currentEventOriginalImage = "";

const DEFAULT_FEATURED_HERO = {
    title: "RAG HACKATHON 2026",
    statusTag: "REGISTRATION OPEN",
    categoryTag: "FEATURED EVENT",
    description: "Creating new ideas and building it different. Join top engineering talent for 36 hours of rapid prototyping, AI workflows, and hardware innovations.",
    dateText: "30 July 2026",
    venueText: "VVITU SEMINAR HALL",
    teamFormat: "2 – 4 Members",
    prizePool: "₹50,000 Prize Pool",
    registerUrl: "#",
    posterImage: "assets/hackathon.png",
    countdownTitle: "⏱️ HACKATHON STARTS IN",
    targetDate: "2026-10-15T09:00"
};

const DEFAULT_UPCOMING_EVENTS = [
    {
        title: "VVISC Annual Hackathon",
        category: "HACKATHON",
        dateText: "Oct 15–17, 2026",
        description: "48-hour coding competition focused on AI, IoT, Robotics and Web Technologies.",
        venue: "VVIT Campus",
        teamFormat: "2-4 Members",
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

const DEFAULT_PAST_EVENTS = [
    {
        title: "AI / ML Bootcamp",
        tag: "AI BOOTCAMP",
        description: "Three days of hands-on Artificial Intelligence and Machine Learning.",
        stat1Value: "320+",
        stat1Label: "Participants",
        stat2Value: "12",
        stat2Label: "Sessions",
        galleryUrl: "gallery.html",
        displayOrder: 1,
        active: true
    },
    {
        title: "Annual Hackathon",
        tag: "HACKATHON",
        description: "48 hours of innovation where teams built real-world solutions.",
        stat1Value: "450+",
        stat1Label: "Participants",
        stat2Value: "90",
        stat2Label: "Teams",
        galleryUrl: "gallery.html",
        displayOrder: 2,
        active: true
    },
    {
        title: "Web Development Workshop",
        tag: "WORKSHOP",
        description: "HTML, CSS, JavaScript and Firebase workshop.",
        stat1Value: "180+",
        stat1Label: "Students",
        stat2Value: "8",
        stat2Label: "Projects",
        galleryUrl: "gallery.html",
        displayOrder: 3,
        active: true
    }
];

const DEFAULT_IMPACT_NUMBERS = {
    stat1Target: "85+",
    stat1Label: "Events Conducted",
    stat2Target: "5000+",
    stat2Label: "Participants",
    stat3Target: "120+",
    stat3Label: "Industry Speakers",
    stat4Target: "35+",
    stat4Label: "Hackathons & Workshops"
};

const DEFAULT_NOTICES = [
    {
        title: "New Website Launched!",
        category: "Updates",
        dateText: "Oct 01, 2026",
        description: "We are thrilled to announce the launch of our brand new, multi-page website. Explore our departments, gallery, and upcoming events seamlessly.",
        displayOrder: 1,
        active: true
    },
    {
        title: "Workshop Rescheduled",
        category: "Notices",
        dateText: "Sep 28, 2026",
        description: "Please note that the introductory AI/ML workshop originally scheduled for this Friday has been moved to October 5th. Venue remains the same.",
        displayOrder: 2,
        active: true
    },
    {
        title: "Hackathon Registrations Open",
        category: "Events",
        dateText: "Sep 20, 2026",
        description: "Registrations for the Annual Hackathon are now live! Form your teams of 2-4 and register before the early bird deadline.",
        displayOrder: 3,
        active: true
    }
];

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");

    setupTabNavigation();

    await loadFeaturedHero();
    await loadUpcomingEvents();
    await loadPastEvents();
    await loadImpactNumbers();
    await loadNotices();

    // Form Event Listeners
    const heroForm = document.getElementById("heroEventForm");
    const eventForm = document.getElementById("eventForm");
    const pastForm = document.getElementById("pastForm");
    const impactForm = document.getElementById("impactForm");
    const noticeForm = document.getElementById("noticeForm");

    const addItemBtn = document.getElementById("addItemBtn");

    if (addItemBtn) {
        addItemBtn.onclick = () => {
            if (currentActiveTab === "upcoming") openEventModal();
            else if (currentActiveTab === "past") openPastModal();
            else if (currentActiveTab === "notices") openNoticeModal();
        };
    }

    // Modal Close buttons
    document.querySelectorAll(".closeModalBtn, .cancelModalBtn").forEach(btn => {
        btn.onclick = () => {
            closeAllModals();
        };
    });

    if (heroForm) {
        heroForm.onsubmit = async (e) => {
            e.preventDefault();
            await saveFeaturedHero();
        };
    }

    if (eventForm) {
        eventForm.onsubmit = async (e) => {
            e.preventDefault();
            await saveUpcomingEvent();
        };
    }

    if (pastForm) {
        pastForm.onsubmit = async (e) => {
            e.preventDefault();
            await savePastEvent();
        };
    }

    if (impactForm) {
        impactForm.onsubmit = async (e) => {
            e.preventDefault();
            await saveImpactNumbers();
        };
    }

    if (noticeForm) {
        noticeForm.onsubmit = async (e) => {
            e.preventDefault();
            await saveNotice();
        };
    }

    // Hero image preview
    const heroFile = document.getElementById("heroImageFile");
    const heroUrl = document.getElementById("heroImageUrl");
    if (heroFile) {
        heroFile.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    document.getElementById("heroPreview").src = evt.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    if (heroUrl) {
        heroUrl.addEventListener("input", (e) => {
            if (e.target.value.trim()) {
                document.getElementById("heroPreview").src = getAdminImgSrc(e.target.value.trim());
            }
        });
    }
});

function getAdminImgSrc(src) {
    if (!src) return '../assets/nodp.png';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('../')) return src;
    return '../' + src;
}

function setupTabNavigation() {
    const tabHeroBtn = document.getElementById("tabHeroBtn");
    const tabUpcomingBtn = document.getElementById("tabUpcomingBtn");
    const tabPastBtn = document.getElementById("tabPastBtn");
    const tabImpactBtn = document.getElementById("tabImpactBtn");
    const tabNoticesBtn = document.getElementById("tabNoticesBtn");

    const heroSec = document.getElementById("heroSection");
    const upcomingSec = document.getElementById("upcomingSection");
    const pastSec = document.getElementById("pastSection");
    const impactSec = document.getElementById("impactSection");
    const noticesSec = document.getElementById("noticesSection");

    const addItemBtn = document.getElementById("addItemBtn");

    const tabs = [
        { btn: tabHeroBtn, sec: heroSec, id: "hero", hasAdd: false },
        { btn: tabUpcomingBtn, sec: upcomingSec, id: "upcoming", hasAdd: true, label: "+ Add Upcoming Event" },
        { btn: tabPastBtn, sec: pastSec, id: "past", hasAdd: true, label: "+ Add Past Highlight" },
        { btn: tabImpactBtn, sec: impactSec, id: "impact", hasAdd: false },
        { btn: tabNoticesBtn, sec: noticesSec, id: "notices", hasAdd: true, label: "+ Add Notice / Update" }
    ];

    tabs.forEach(t => {
        if (t.btn) {
            t.btn.onclick = () => {
                currentActiveTab = t.id;
                tabs.forEach(other => {
                    if (other.btn) other.btn.className = (other.id === t.id) ? "primary-btn" : "secondary-btn";
                    if (other.sec) other.sec.style.display = (other.id === t.id) ? "block" : "none";
                });

                if (t.hasAdd && addItemBtn) {
                    addItemBtn.textContent = t.label;
                    addItemBtn.style.display = "inline-block";
                } else if (addItemBtn) {
                    addItemBtn.style.display = "none";
                }

                if (t.id === "past") renderPastGrid();
                else if (t.id === "upcoming") renderUpcomingGrid();
                else if (t.id === "notices") renderNoticesGrid();
            };
        }
    });

    if (addItemBtn) addItemBtn.style.display = "none";
}

// --------------------------------------------------
// 1. Featured Hero Event
// --------------------------------------------------
async function loadFeaturedHero() {
    const hero = await CMS.getContent("eventsHero", DEFAULT_FEATURED_HERO);

    document.getElementById("heroTitle").value = hero.title || "";
    document.getElementById("heroStatusTag").value = hero.statusTag || "REGISTRATION OPEN";
    document.getElementById("heroCategoryTag").value = hero.categoryTag || "FEATURED EVENT";
    document.getElementById("heroDescription").value = hero.description || "";
    document.getElementById("heroDateText").value = hero.dateText || "";
    document.getElementById("heroVenueText").value = hero.venueText || "";
    document.getElementById("heroTeamFormat").value = hero.teamFormat || "";
    document.getElementById("heroPrizePool").value = hero.prizePool || "";
    document.getElementById("heroRegisterUrl").value = hero.registerUrl || "";
    document.getElementById("heroCountdownTitle").value = hero.countdownTitle || "⏱️ HACKATHON STARTS IN";
    document.getElementById("heroTargetDate").value = hero.targetDate || "2026-10-15T09:00";
    document.getElementById("heroImageUrl").value = hero.posterImage || "";
    document.getElementById("heroPreview").src = getAdminImgSrc(hero.posterImage || "assets/hackathon.png");
}

async function saveFeaturedHero() {
    const heroFile = document.getElementById("heroImageFile");
    let posterImage = document.getElementById("heroImageUrl").value.trim();

    if (heroFile && heroFile.files && heroFile.files[0]) {
        try {
            showToast("Processing poster image...");
            posterImage = await CMS.uploadImage(heroFile.files[0], "events");
        } catch (e) {
            console.warn("Hero image upload notice:", e);
        }
    }

    const payload = {
        title: document.getElementById("heroTitle").value.trim(),
        statusTag: document.getElementById("heroStatusTag").value.trim(),
        categoryTag: document.getElementById("heroCategoryTag").value.trim(),
        description: document.getElementById("heroDescription").value.trim(),
        dateText: document.getElementById("heroDateText").value.trim(),
        venueText: document.getElementById("heroVenueText").value.trim(),
        teamFormat: document.getElementById("heroTeamFormat").value.trim(),
        prizePool: document.getElementById("heroPrizePool").value.trim(),
        registerUrl: document.getElementById("heroRegisterUrl").value.trim(),
        countdownTitle: document.getElementById("heroCountdownTitle").value.trim(),
        targetDate: document.getElementById("heroTargetDate").value,
        posterImage: posterImage || "assets/hackathon.png"
    };

    try {
        await CMS.saveContent("eventsHero", payload);
        showToast("✓ Featured Hero Event saved successfully!");
        await loadFeaturedHero();
    } catch (err) {
        showToast("Error saving featured event: " + err.message, "error");
    }
}

// --------------------------------------------------
// 2. Upcoming Events
// --------------------------------------------------
async function loadUpcomingEvents() {
    upcomingEventsList = await CMS.getCollection("events", { orderBy: "displayOrder", orderDirection: "asc" });

    if (!upcomingEventsList || upcomingEventsList.length === 0) {
        for (const evt of DEFAULT_UPCOMING_EVENTS) {
            await CMS.saveDoc("events", null, evt);
        }
        upcomingEventsList = await CMS.getCollection("events", { orderBy: "displayOrder", orderDirection: "asc" });
    }

    upcomingEventsList.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));
    renderUpcomingGrid();
}

function renderUpcomingGrid() {
    const container = document.getElementById("upcomingListContainer");
    if (!container) return;
    container.innerHTML = "";

    if (upcomingEventsList.length === 0) {
        container.innerHTML = `<div class="card" style="grid-column:1/-1; padding:30px; text-align:center;">No upcoming events found. Click "+ Add Upcoming Event" to create one.</div>`;
        return;
    }

    upcomingEventsList.forEach(evt => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "padding:20px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between;";
        const activeStatus = evt.active !== false;

        card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                    <span style="font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:12px; background:rgba(199,107,60,0.15); color:var(--accent-color);">${escapeHtml(evt.category || "HACKATHON")}</span>
                    <span style="padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:600; background:${activeStatus ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color:${activeStatus ? '#22c55e' : '#ef4444'};">
                        ${activeStatus ? 'Active' : 'Disabled'}
                    </span>
                </div>
                <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
                    <img src="${getAdminImgSrc(evt.posterImage)}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;" onerror="this.onerror=null; this.src='../assets/nodp.png';">
                    <div>
                        <h3 style="font-size:1.05rem; margin-bottom:2px;">${escapeHtml(evt.title)}</h3>
                        <p style="font-size:0.8rem; color:var(--accent-color); font-weight:600;">📅 ${escapeHtml(evt.dateText || "")}</p>
                    </div>
                </div>
                <p style="font-size:0.85rem; opacity:0.8; line-height:1.4; margin-bottom:10px;">${escapeHtml(evt.description || "")}</p>
            </div>
            
            <div style="display:flex; gap:8px; border-top:1px solid var(--border-color); padding-top:12px;">
                <button type="button" onclick="editEvent('${evt.id}')" class="secondary-btn" style="flex:1; padding:6px; font-size:0.8rem;">Edit</button>
                <button type="button" onclick="deleteEvent('${evt.id}')" style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:none; padding:6px 12px; border-radius:6px; font-size:0.8rem; cursor:pointer;">Delete</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openEventModal(evt = null) {
    const modal = document.getElementById("eventModal");
    if (!modal) return;

    if (evt) {
        document.getElementById("modalTitle").textContent = "Edit Upcoming Event";
        currentEventOriginalImage = evt.posterImage || "";
        document.getElementById("eventDocId").value = evt.id;
        document.getElementById("eventTitleInput").value = evt.title || "";
        document.getElementById("eventCategory").value = evt.category || "HACKATHON";
        document.getElementById("eventDateText").value = evt.dateText || "";
        document.getElementById("eventVenue").value = evt.venue || "";
        document.getElementById("eventDescriptionInput").value = evt.description || "";
        document.getElementById("eventTeamFormat").value = evt.teamFormat || "";
        document.getElementById("eventSeatsText").value = evt.seatsText || "";
        document.getElementById("eventProgressPct").value = evt.progressPct || 50;
        document.getElementById("eventRegisterUrl").value = evt.registerUrl || "";
        document.getElementById("eventImageUrl").value = evt.posterImage || "";
        document.getElementById("eventOrder").value = evt.displayOrder || 1;
        document.getElementById("eventActive").checked = evt.active !== false;
    } else {
        document.getElementById("modalTitle").textContent = "Add Upcoming Event";
        currentEventOriginalImage = "";
        document.getElementById("eventForm").reset();
        document.getElementById("eventDocId").value = "";
        document.getElementById("eventActive").checked = true;
        const maxOrder = Math.max(0, ...upcomingEventsList.map(e => parseInt(e.displayOrder) || 0));
        document.getElementById("eventOrder").value = maxOrder + 1;
    }

    modal.style.display = "flex";
}

async function saveUpcomingEvent() {
    const docId = document.getElementById("eventDocId").value;
    const title = document.getElementById("eventTitleInput").value.trim();
    if (!title) {
        showToast("Please enter the event title.", "warning");
        return;
    }

    const fileInput = document.getElementById("eventImageFile");
    const typedUrl = document.getElementById("eventImageUrl").value.trim();
    let finalPosterImage = "";

    if (fileInput && fileInput.files && fileInput.files[0]) {
        try {
            showToast("Processing poster image...");
            finalPosterImage = await CMS.uploadImage(fileInput.files[0], "events");
        } catch (e) {}
    }

    if (!finalPosterImage && typedUrl) finalPosterImage = typedUrl;
    if (!finalPosterImage && currentEventOriginalImage) finalPosterImage = currentEventOriginalImage;
    if (!finalPosterImage) finalPosterImage = "assets/announcements/default.jpg";

    const payload = {
        title,
        category: document.getElementById("eventCategory").value,
        dateText: document.getElementById("eventDateText").value.trim(),
        venue: document.getElementById("eventVenue").value.trim(),
        description: document.getElementById("eventDescriptionInput").value.trim(),
        teamFormat: document.getElementById("eventTeamFormat").value.trim(),
        seatsText: document.getElementById("eventSeatsText").value.trim(),
        progressPct: parseInt(document.getElementById("eventProgressPct").value) || 50,
        registerUrl: document.getElementById("eventRegisterUrl").value.trim(),
        posterImage: finalPosterImage,
        displayOrder: parseInt(document.getElementById("eventOrder").value) || 1,
        active: document.getElementById("eventActive").checked
    };

    try {
        await CMS.saveDoc("events", docId, payload);
        showToast(`✓ Event "${title}" saved successfully!`);
        closeAllModals();
        await loadUpcomingEvents();
    } catch (err) {
        showToast("Error saving event: " + err.message, "error");
    }
}

function editEvent(id) {
    const evt = upcomingEventsList.find(e => e.id === id);
    if (evt) openEventModal(evt);
}

async function deleteEvent(id) {
    if (confirm("Are you sure you want to delete this event?")) {
        try {
            await CMS.deleteDoc("events", id);
            showToast("Event deleted successfully.");
            await loadUpcomingEvents();
        } catch (err) {
            showToast("Failed to delete event.", "error");
        }
    }
}

// --------------------------------------------------
// 3. Past Event Highlights
// --------------------------------------------------
async function loadPastEvents() {
    let rawList = await CMS.getCollection("pastEvents", { orderBy: "displayOrder", orderDirection: "asc" });

    if (!rawList || rawList.length === 0) {
        rawList = DEFAULT_PAST_EVENTS;
    }

    // Display ALL items so admin can manage/delete any stale or duplicate document
    pastEventsList = rawList;

    pastEventsList.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));
    renderPastGrid();
}

function renderPastGrid() {
    const container = document.getElementById("pastListContainer");
    if (!container) return;
    container.innerHTML = "";

    if (pastEventsList.length === 0) {
        container.innerHTML = `<div class="card" style="grid-column:1/-1; padding:30px; text-align:center;">No past event highlights found. Click "+ Add Past Highlight" to create one.</div>`;
        return;
    }

    pastEventsList.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "padding:20px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between;";
        const activeStatus = item.active !== false;
        const itemId = item.id || ("past_idx_" + index);

        card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                    <span style="font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:12px; background:rgba(99, 102, 241, 0.15); color:#6366f1;">${escapeHtml(item.tag || "HIGHLIGHT")}</span>
                    <span style="padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:600; background:${activeStatus ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color:${activeStatus ? '#22c55e' : '#ef4444'};">
                        ${activeStatus ? 'Active' : 'Disabled'}
                    </span>
                </div>
                <h3 style="font-size:1.1rem; margin-bottom:6px;">${escapeHtml(item.title)}</h3>
                <p style="font-size:0.85rem; opacity:0.8; line-height:1.4; margin-bottom:12px;">${escapeHtml(item.description || "")}</p>
                <div style="display:flex; gap:16px; font-size:0.8rem; background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; margin-bottom:12px;">
                    <div><strong>${escapeHtml(item.stat1Value || "")}</strong> ${escapeHtml(item.stat1Label || "")}</div>
                    <div><strong>${escapeHtml(item.stat2Value || "")}</strong> ${escapeHtml(item.stat2Label || "")}</div>
                </div>
            </div>

            <div style="display:flex; gap:8px; border-top:1px solid var(--border-color); padding-top:12px;">
                <button type="button" onclick="editPastEvent('${itemId}')" class="secondary-btn" style="flex:1; padding:6px; font-size:0.8rem;">Edit</button>
                <button type="button" onclick="deletePastEvent('${itemId}')" style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:none; padding:6px 12px; border-radius:6px; font-size:0.8rem; cursor:pointer;">Delete</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openPastModal(item = null) {
    const modal = document.getElementById("pastModal");
    if (!modal) return;

    if (item) {
        document.getElementById("pastModalTitle").textContent = "Edit Past Event Highlight";
        document.getElementById("pastDocId").value = item.id || "";
        document.getElementById("pastTitleInput").value = item.title || "";
        document.getElementById("pastTagInput").value = item.tag || "";
        document.getElementById("pastDescriptionInput").value = item.description || "";
        document.getElementById("pastStat1Val").value = item.stat1Value || "";
        document.getElementById("pastStat1Lbl").value = item.stat1Label || "";
        document.getElementById("pastStat2Val").value = item.stat2Value || "";
        document.getElementById("pastStat2Lbl").value = item.stat2Label || "";
        document.getElementById("pastGalleryUrl").value = item.galleryUrl || "gallery.html";
        document.getElementById("pastOrder").value = item.displayOrder || 1;
        document.getElementById("pastActive").checked = item.active !== false;
    } else {
        document.getElementById("pastModalTitle").textContent = "Add Past Event Highlight";
        document.getElementById("pastForm").reset();
        document.getElementById("pastDocId").value = "";
        document.getElementById("pastGalleryUrl").value = "gallery.html";
        document.getElementById("pastActive").checked = true;
        const maxOrder = Math.max(0, ...pastEventsList.map(e => parseInt(e.displayOrder) || 0));
        document.getElementById("pastOrder").value = maxOrder + 1;
    }

    modal.style.display = "flex";
}

async function savePastEvent() {
    const docId = document.getElementById("pastDocId").value;
    const title = document.getElementById("pastTitleInput").value.trim();
    if (!title) {
        showToast("Please enter the title.", "warning");
        return;
    }

    const payload = {
        title,
        tag: document.getElementById("pastTagInput").value.trim(),
        description: document.getElementById("pastDescriptionInput").value.trim(),
        stat1Value: document.getElementById("pastStat1Val").value.trim(),
        stat1Label: document.getElementById("pastStat1Lbl").value.trim(),
        stat2Value: document.getElementById("pastStat2Val").value.trim(),
        stat2Label: document.getElementById("pastStat2Lbl").value.trim(),
        galleryUrl: document.getElementById("pastGalleryUrl").value.trim(),
        displayOrder: parseInt(document.getElementById("pastOrder").value) || 1,
        active: document.getElementById("pastActive").checked
    };

    try {
        await CMS.saveDoc("pastEvents", docId, payload);
        showToast(`✓ Past Highlight "${title}" saved successfully!`);
        closeAllModals();
        await loadPastEvents();
    } catch (err) {
        showToast("Error saving past highlight: " + err.message, "error");
    }
}

function editPastEvent(id) {
    const item = pastEventsList.find(e => e.id === id || ("past_idx_" + pastEventsList.indexOf(e)) === id);
    if (item) openPastModal(item);
}

async function deletePastEvent(id) {
    const item = pastEventsList.find(e => e.id === id || ("past_idx_" + pastEventsList.indexOf(e)) === id);
    const itemTitle = item ? item.title : "this highlight";
    if (confirm(`Are you sure you want to delete "${itemTitle}"?`)) {
        try {
            if (item && item.id && !item.id.startsWith("past_idx_")) {
                await CMS.deleteDoc("pastEvents", item.id);
            }
            
            // Filter out this exact item
            pastEventsList = pastEventsList.filter(p => p !== item);
            
            // Save updated collection to local storage
            try {
                localStorage.setItem("vvisc_col_pastEvents", JSON.stringify(pastEventsList));
            } catch (e) {}

            showToast("Highlight deleted.");
            renderPastGrid();
        } catch (err) {
            showToast("Delete failed: " + err.message, "error");
        }
    }
}

// --------------------------------------------------
// 4. Impact Numbers
// --------------------------------------------------
async function loadImpactNumbers() {
    const impact = await CMS.getContent("eventsImpact", DEFAULT_IMPACT_NUMBERS);

    document.getElementById("stat1Target").value = impact.stat1Target || "85+";
    document.getElementById("stat1Label").value = impact.stat1Label || "Events Conducted";

    document.getElementById("stat2Target").value = impact.stat2Target || "5000+";
    document.getElementById("stat2Label").value = impact.stat2Label || "Participants";

    document.getElementById("stat3Target").value = impact.stat3Target || "120+";
    document.getElementById("stat3Label").value = impact.stat3Label || "Industry Speakers";

    document.getElementById("stat4Target").value = impact.stat4Target || "35+";
    document.getElementById("stat4Label").value = impact.stat4Label || "Hackathons & Workshops";
}

async function saveImpactNumbers() {
    const payload = {
        stat1Target: document.getElementById("stat1Target").value.trim(),
        stat1Label: document.getElementById("stat1Label").value.trim(),
        stat2Target: document.getElementById("stat2Target").value.trim(),
        stat2Label: document.getElementById("stat2Label").value.trim(),
        stat3Target: document.getElementById("stat3Target").value.trim(),
        stat3Label: document.getElementById("stat3Label").value.trim(),
        stat4Target: document.getElementById("stat4Target").value.trim(),
        stat4Label: document.getElementById("stat4Label").value.trim()
    };

    try {
        await CMS.saveContent("eventsImpact", payload);
        showToast("✓ VVISC Impact Numbers saved successfully!");
        await loadImpactNumbers();
    } catch (err) {
        showToast("Error saving impact numbers: " + err.message, "error");
    }
}

// --------------------------------------------------
// 5. Updates & Notices Feed
// --------------------------------------------------
async function loadNotices() {
    noticesList = await CMS.getCollection("announcements", { orderBy: "displayOrder", orderDirection: "asc" });

    if (!noticesList || noticesList.length === 0) {
        for (const item of DEFAULT_NOTICES) {
            await CMS.saveDoc("announcements", null, item);
        }
        noticesList = await CMS.getCollection("announcements", { orderBy: "displayOrder", orderDirection: "asc" });
    }

    noticesList.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));
    renderNoticesGrid();
}

function renderNoticesGrid() {
    const container = document.getElementById("noticesListContainer");
    if (!container) return;
    container.innerHTML = "";

    if (noticesList.length === 0) {
        container.innerHTML = `<div class="card" style="grid-column:1/-1; padding:30px; text-align:center;">No notices found. Click "+ Add Notice / Update" to create one.</div>`;
        return;
    }

    noticesList.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "padding:20px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between;";
        const activeStatus = item.active !== false;

        card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                    <span style="font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:12px; background:rgba(236, 72, 153, 0.15); color:#ec4899;">${escapeHtml(item.category || "Updates")}</span>
                    <span style="padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:600; background:${activeStatus ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color:${activeStatus ? '#22c55e' : '#ef4444'};">
                        ${activeStatus ? 'Active' : 'Disabled'}
                    </span>
                </div>
                <h3 style="font-size:1.05rem; margin-bottom:4px;">${escapeHtml(item.title)}</h3>
                <p style="font-size:0.78rem; color:var(--accent-color); font-weight:600; margin-bottom:8px;">📅 ${escapeHtml(item.dateText || "")}</p>
                <p style="font-size:0.85rem; opacity:0.8; line-height:1.4; margin-bottom:12px;">${escapeHtml(item.description || "")}</p>
            </div>

            <div style="display:flex; gap:8px; border-top:1px solid var(--border-color); padding-top:12px;">
                <button type="button" onclick="editNotice('${item.id}')" class="secondary-btn" style="flex:1; padding:6px; font-size:0.8rem;">Edit</button>
                <button type="button" onclick="deleteNotice('${item.id}')" style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:none; padding:6px 12px; border-radius:6px; font-size:0.8rem; cursor:pointer;">Delete</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openNoticeModal(item = null) {
    const modal = document.getElementById("noticeModal");
    if (!modal) return;

    if (item) {
        document.getElementById("noticeModalTitle").textContent = "Edit Notice / Update";
        document.getElementById("noticeDocId").value = item.id;
        document.getElementById("noticeTitleInput").value = item.title || "";
        document.getElementById("noticeCategory").value = item.category || "Updates";
        document.getElementById("noticeDateText").value = item.dateText || "";
        document.getElementById("noticeDescriptionInput").value = item.description || "";
        document.getElementById("noticeOrder").value = item.displayOrder || 1;
        document.getElementById("noticeActive").checked = item.active !== false;
    } else {
        document.getElementById("noticeModalTitle").textContent = "Add Notice / Update";
        document.getElementById("noticeForm").reset();
        document.getElementById("noticeDocId").value = "";
        document.getElementById("noticeActive").checked = true;
        const maxOrder = Math.max(0, ...noticesList.map(e => parseInt(e.displayOrder) || 0));
        document.getElementById("noticeOrder").value = maxOrder + 1;
    }

    modal.style.display = "flex";
}

async function saveNotice() {
    const docId = document.getElementById("noticeDocId").value;
    const title = document.getElementById("noticeTitleInput").value.trim();
    if (!title) {
        showToast("Please enter notice title.", "warning");
        return;
    }

    const payload = {
        title,
        category: document.getElementById("noticeCategory").value,
        dateText: document.getElementById("noticeDateText").value.trim(),
        description: document.getElementById("noticeDescriptionInput").value.trim(),
        displayOrder: parseInt(document.getElementById("noticeOrder").value) || 1,
        active: document.getElementById("noticeActive").checked
    };

    try {
        await CMS.saveDoc("announcements", docId, payload);
        showToast(`✓ Notice "${title}" saved successfully!`);
        closeAllModals();
        await loadNotices();
    } catch (err) {
        showToast("Error saving notice: " + err.message, "error");
    }
}

function editNotice(id) {
    const item = noticesList.find(e => e.id === id);
    if (item) openNoticeModal(item);
}

async function deleteNotice(id) {
    if (confirm("Are you sure you want to delete this notice?")) {
        try {
            await CMS.deleteDoc("announcements", id);
            showToast("Notice deleted.");
            await loadNotices();
        } catch (err) {
            showToast("Delete failed.", "error");
        }
    }
}

function closeAllModals() {
    ["eventModal", "pastModal", "noticeModal"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}

function escapeHtml(str) {
    return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
