// ===============================================================
// VVISC IUCEE - Unified Events & Historical Archive Controller
// Admin Dashboard Controller & Firebase Integration
// Manages Upcoming Events, Completed Historical Events,
// About Timeline Milestones, Hero Event, Impact & Notices.
// ===============================================================

let allEventsList = [];
let noticesList = [];
let currentActiveTab = "all"; // 'all', 'hero', 'impact', 'notices'
let editingEventId = null;
let currentEventPoster = "";
let currentGalleryImages = []; // Array of strings or { url, caption }
let pendingGalleryFiles = []; // Array of File objects

// Default Verified Historical and Upcoming Events
const VERIFIED_DEFAULT_EVENTS = [
    {
        id: "vvisc-founded-2024",
        title: "VVISC IUCEE Student Chapter Founded",
        category: "OTHER",
        eventType: "Establishment",
        status: "completed",
        dateText: "August 2024",
        startDate: "2024-08-01",
        endDate: "2024-08-01",
        year: "2024",
        venue: "VVIT Campus",
        shortDescription: "Official charter and launch of the VVISC IUCEE Student Chapter at Vasireddy Venkatadri Institute of Technology.",
        description: "VVISC IUCEE Student Chapter was officially chartered to bridge academic engineering coursework with hands-on technical innovation, research publications, and national collegiate hackathons under the guidance of IUCEE faculty mentors.",
        posterImage: "assets/logo.png",
        galleryImages: ["assets/1.png", "assets/2.png"],
        participantsCount: "120+",
        collegesCount: "1",
        teamDetails: "Founding Executive Council & Faculty Advisors",
        awards: "Official IUCEE Chapter Accreditation",
        highlights: "Charter ceremony, election of founding student council, definition of the 4 Pillars (Innovation, Research, Leadership, Community).",
        isMilestone: true,
        milestoneYear: "2024",
        milestoneIcon: "👥",
        milestoneTitle: "Chapter Founded",
        displayOrder: 1,
        active: true
    },
    {
        id: "ai-ml-bootcamp-2024",
        title: "Hands-on AI & Machine Learning Bootcamp",
        category: "WORKSHOP",
        eventType: "Workshop",
        status: "completed",
        dateText: "August 12–14, 2024",
        startDate: "2024-08-12",
        endDate: "2024-08-14",
        year: "2024",
        venue: "VVIT Seminar Hall & AI Lab",
        shortDescription: "Three-day intensive engineering workshop on Machine Learning, Neural Networks, and PyTorch model deployment.",
        description: "An intensive 3-day technical bootcamp empowering undergraduate engineers with fundamental and applied machine learning capabilities. Students built and deployed end-to-end computer vision and NLP models using Python, Scikit-Learn, and PyTorch on GPU workstations.",
        posterImage: "assets/Ai-bootcamp.png",
        galleryImages: ["assets/3.jpeg", "assets/4.png"],
        participantsCount: "320+",
        collegesCount: "4",
        teamDetails: "AI & ML Department Leads",
        awards: "Best Student Prototype: Edge Leaf Disease Classifier",
        highlights: "12 Interactive coding sessions, 320+ certified attendees, real-time dataset exploration.",
        isMilestone: true,
        milestoneYear: "2024",
        milestoneIcon: "🤖",
        milestoneTitle: "AI & ML Bootcamp",
        displayOrder: 2,
        active: true
    },
    {
        id: "web-dev-workshop-2024",
        title: "Full-Stack Web Development & Cloud Workshop",
        category: "WORKSHOP",
        eventType: "Workshop",
        status: "completed",
        dateText: "September 20–22, 2024",
        startDate: "2024-09-20",
        endDate: "2024-09-22",
        year: "2024",
        venue: "Central Computer Center",
        shortDescription: "Hands-on training building progressive web applications with modern JavaScript ES6+, cloud backends, and Firebase.",
        description: "A collaborative technical workshop focused on modern full-stack web architecture. Students learned responsive design systems, asynchronous state management, and real-time cloud data pipelines with Firebase Firestore and Authentication.",
        posterImage: "assets/5.png",
        galleryImages: ["assets/6.png", "assets/7.png"],
        participantsCount: "180+",
        collegesCount: "2",
        teamDetails: "Web & Cloud Computing Team",
        highlights: "8 Production-grade web projects deployed live to custom subdomains.",
        isMilestone: false,
        displayOrder: 3,
        active: true
    },
    {
        id: "annual-hackathon-2025",
        title: "VVISC Annual Innovation Hackathon 2025",
        category: "HACKATHON",
        eventType: "Hackathon",
        status: "completed",
        dateText: "February 15–17, 2025",
        startDate: "2025-02-15",
        endDate: "2025-02-17",
        year: "2025",
        venue: "VVIT Innovation Complex & Central Library",
        shortDescription: "48-hour multidisciplinary student hackathon focused on Smart Agriculture, Autonomous Systems, and IoT Microgrids.",
        description: "The flagship innovation competition of the VVISC student chapter. 90 multidisciplinary student teams competed over 48 continuous hours to engineer working hardware-software prototypes solving pressing regional challenges in agriculture, energy, and robotics.",
        posterImage: "assets/hackathon.png",
        galleryImages: ["assets/8.png", "assets/9.png", "assets/10.png"],
        participantsCount: "450+",
        collegesCount: "12",
        teamDetails: "VVISC Core Committee & Jury Board",
        awards: "1st Prize: KrishiNet AI & AeroSwarm Teams; ₹50,000 Total Grants",
        highlights: "48 hours non-stop prototyping, 90 working prototypes, 12 jury evaluations from industry.",
        isMilestone: true,
        milestoneYear: "2025",
        milestoneIcon: "🏆",
        milestoneTitle: "Annual Hackathon 2025",
        displayOrder: 4,
        active: true
    },
    {
        id: "rag-hackathon-2026",
        title: "RAG HACKATHON 2026",
        category: "HACKATHON",
        eventType: "Hackathon",
        status: "upcoming",
        dateText: "30 July 2026",
        startDate: "2026-07-30",
        endDate: "2026-07-31",
        year: "2026",
        venue: "VVITU SEMINAR HALL",
        shortDescription: "Creating new ideas and building it different. 36 hours of rapid prototyping, AI workflows, and hardware innovations.",
        description: "VVISC's upcoming high-intensity hackathon centered on Retrieval-Augmented Generation, Agentic Workflows, and Edge AI. Top engineering talent gathers for 36 hours of collaborative innovation with industry mentors.",
        posterImage: "assets/hackathon.png",
        galleryImages: [],
        teamFormat: "2 – 4 Members",
        seatsText: "Registration Open",
        progressPct: 65,
        registerUrl: "#",
        featured: true,
        isMilestone: true,
        milestoneYear: "2026",
        milestoneIcon: "🚀",
        milestoneTitle: "RAG Hackathon & AI Labs",
        displayOrder: 5,
        active: true
    },
    {
        id: "annual-hackathon-2026",
        title: "VVISC Annual Hackathon 2026",
        category: "HACKATHON",
        eventType: "Hackathon",
        status: "upcoming",
        dateText: "Oct 15–17, 2026",
        startDate: "2026-10-15",
        endDate: "2026-10-17",
        year: "2026",
        venue: "VVIT Campus",
        shortDescription: "48-hour coding competition focused on AI, IoT, Robotics and Web Technologies.",
        description: "Annual regional hackathon uniting collegiate engineering chapters for a 48-hour sprint in robotics, decentralized systems, and smart city infrastructure.",
        posterImage: "assets/announcements/default.jpg",
        galleryImages: [],
        teamFormat: "2-4 Members",
        seatsText: "78 / 150",
        progressPct: 52,
        registerUrl: "#",
        isMilestone: false,
        displayOrder: 6,
        active: true
    },
    {
        id: "ai-bootcamp-2026",
        title: "AI & Generative Systems Bootcamp",
        category: "WORKSHOP",
        eventType: "Workshop",
        status: "upcoming",
        dateText: "Nov 5, 2026",
        startDate: "2026-11-05",
        endDate: "2026-11-05",
        year: "2026",
        venue: "Seminar Hall",
        shortDescription: "Hands-on training on Machine Learning, Deep Learning, and Generative AI pipelines.",
        description: "Comprehensive one-day deep-dive into transformer architectures, local LLM quantization, and multi-modal vision systems.",
        posterImage: "assets/Ai-bootcamp.png",
        galleryImages: [],
        teamFormat: "Individual",
        seatsText: "45 / 80",
        progressPct: 44,
        registerUrl: "#",
        isMilestone: false,
        displayOrder: 7,
        active: true
    },
    {
        id: "tech-summit-2026",
        title: "Industry Tech Summit 2026",
        category: "SEMINAR",
        eventType: "Seminar",
        status: "upcoming",
        dateText: "Dec 10, 2026",
        startDate: "2026-12-10",
        endDate: "2026-12-10",
        year: "2026",
        venue: "Campus Auditorium",
        shortDescription: "Meet industry leaders, collegiate startup founders, and research fellows.",
        description: "Symposium bridging academia and deep-tech startups. Features keynotes on quantum computing, renewable microgrids, and tech patents.",
        posterImage: "assets/Ai-summit.png",
        galleryImages: [],
        teamFormat: "Open For All",
        seatsText: "150 / 300",
        progressPct: 50,
        registerUrl: "#",
        isMilestone: false,
        displayOrder: 8,
        active: true
    }
];

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

// Document Ready Initialization
document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");

    setupTabNavigation();
    initEventListeners();

    await loadAllEvents();
    await loadFeaturedHero();
    await loadImpactNumbers();
    await loadNotices();
});

// -----------------------------------------------------------------
// 1. Navigation & Event Listeners
// -----------------------------------------------------------------
function setupTabNavigation() {
    const tabAllEventsBtn = document.getElementById("tabAllEventsBtn");
    const tabHeroBtn = document.getElementById("tabHeroBtn");
    const tabImpactBtn = document.getElementById("tabImpactBtn");
    const tabNoticesBtn = document.getElementById("tabNoticesBtn");

    const allEventsSec = document.getElementById("allEventsSection");
    const heroSec = document.getElementById("heroSection");
    const impactSec = document.getElementById("impactSection");
    const noticesSec = document.getElementById("noticesSection");

    const tabs = [
        { btn: tabAllEventsBtn, sec: allEventsSec, id: "all" },
        { btn: tabHeroBtn, sec: heroSec, id: "hero" },
        { btn: tabImpactBtn, sec: impactSec, id: "impact" },
        { btn: tabNoticesBtn, sec: noticesSec, id: "notices" }
    ];

    tabs.forEach(t => {
        if (t.btn) {
            t.btn.onclick = () => {
                currentActiveTab = t.id;
                tabs.forEach(other => {
                    if (other.btn) other.btn.className = (other.id === t.id) ? "primary-btn" : "secondary-btn";
                    if (other.sec) other.sec.style.display = (other.id === t.id) ? "block" : "none";
                });
            };
        }
    });
}

function initEventListeners() {
    // Open Add Modal button
    const btnOpenAdd = document.getElementById("btnOpenAddEvent");
    if (btnOpenAdd) btnOpenAdd.addEventListener("click", () => openEventModal(null));

    // Restore Seed Button
    const btnSeed = document.getElementById("btnSeedDefaultEvents");
    if (btnSeed) btnSeed.addEventListener("click", seedDefaultVerifiedEvents);

    // Filter & Search listeners
    const searchInput = document.getElementById("eventSearchInput");
    const statusFilter = document.getElementById("eventStatusFilter");
    const catFilter = document.getElementById("eventCategoryFilter");

    if (searchInput) searchInput.addEventListener("input", renderEventsTable);
    if (statusFilter) statusFilter.addEventListener("change", renderEventsTable);
    if (catFilter) catFilter.addEventListener("change", renderEventsTable);

    // Modal Close Buttons
    document.querySelectorAll(".closeModalBtn, .cancelModalBtn").forEach(btn => {
        btn.onclick = closeAllModals;
    });

    // Milestone Checkbox toggle
    const milestoneChk = document.getElementById("eventIsMilestone");
    const milestoneRow = document.getElementById("milestoneInputsRow");
    if (milestoneChk && milestoneRow) {
        milestoneChk.addEventListener("change", function() {
            milestoneRow.style.display = this.checked ? "grid" : "none";
        });
    }

    // Lifecycle Status Change: Toggle Upcoming-specific fields
    const statusSelect = document.getElementById("eventStatus");
    const upcomingBlock = document.getElementById("upcomingFieldsBlock");
    if (statusSelect && upcomingBlock) {
        statusSelect.addEventListener("change", function() {
            if (this.value === "completed") {
                upcomingBlock.style.opacity = "0.75";
            } else {
                upcomingBlock.style.opacity = "1";
            }
        });
    }

    // Cover image file preview
    const posterFile = document.getElementById("eventImageFile");
    const posterUrl = document.getElementById("eventImageUrl");
    const posterPreview = document.getElementById("eventImagePreview");
    if (posterFile) {
        posterFile.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    if (posterPreview) posterPreview.src = evt.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    if (posterUrl) {
        posterUrl.addEventListener("input", (e) => {
            if (posterPreview && e.target.value.trim()) {
                posterPreview.src = getAdminImgSrc(e.target.value.trim());
            }
        });
    }

    // Gallery URL Add Button
    const btnAddGalUrl = document.getElementById("btnAddGalleryUrl");
    const galUrlInput = document.getElementById("galleryUrlInput");
    if (btnAddGalUrl && galUrlInput) {
        btnAddGalUrl.addEventListener("click", () => {
            const val = galUrlInput.value.trim();
            if (val) {
                currentGalleryImages.push(val);
                galUrlInput.value = "";
                renderGalleryPreviews();
            }
        });
    }

    // Gallery Files Input
    const galFilesInput = document.getElementById("galleryFilesInput");
    if (galFilesInput) {
        galFilesInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                for (let i = 0; i < e.target.files.length; i++) {
                    pendingGalleryFiles.push(e.target.files[i]);
                }
                renderGalleryPreviews();
            }
        });
    }

    // Event Form Submit (Add/Edit)
    const eventForm = document.getElementById("eventForm");
    if (eventForm) {
        eventForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await saveEvent(false);
        });
    }

    // Save As Draft Button
    const btnDraft = document.getElementById("btnSaveAsDraft");
    if (btnDraft) {
        btnDraft.addEventListener("click", async () => {
            document.getElementById("eventStatus").value = "draft";
            await saveEvent(true);
        });
    }

    // Other forms
    const heroForm = document.getElementById("heroEventForm");
    if (heroForm) {
        heroForm.onsubmit = async (e) => {
            e.preventDefault();
            await saveFeaturedHero();
        };
    }

    const impactForm = document.getElementById("impactForm");
    if (impactForm) {
        impactForm.onsubmit = async (e) => {
            e.preventDefault();
            await saveImpactNumbers();
        };
    }

    const noticeForm = document.getElementById("noticeForm");
    if (noticeForm) {
        noticeForm.onsubmit = async (e) => {
            e.preventDefault();
            await saveNotice();
        };
    }

    const btnAddNotice = document.getElementById("btnAddNoticeBtn");
    if (btnAddNotice) {
        btnAddNotice.addEventListener("click", () => openNoticeModal(null));
    }
}

function getAdminImgSrc(src) {
    if (!src) return '../assets/nodp.png';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('../')) return src;
    return '../' + src;
}

function closeAllModals() {
    const modals = ["eventModal", "noticeModal"];
    modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}

// -----------------------------------------------------------------
// 2. Data Loading & Unified Migration
// -----------------------------------------------------------------
async function loadAllEvents() {
    try {
        let events = await CMS.getCollection("events");

        // Migrate any legacy pastEvents collection docs if present
        let legacyPast = await CMS.getCollection("pastEvents");
        if (Array.isArray(legacyPast) && legacyPast.length > 0) {
            legacyPast.forEach(p => {
                const exists = events.some(e => e.id === p.id || (e.title && e.title.toLowerCase() === (p.title || "").toLowerCase()));
                if (!exists) {
                    events.push({
                        ...p,
                        status: "completed",
                        dateText: p.dateText || "Completed Milestone",
                        category: p.tag || p.category || "HACKATHON"
                    });
                }
            });
        }

        // Auto-seed default verified events if collection is completely empty
        if (!events || events.length === 0) {
            console.log("Empty events collection. Seeding verified historical events...");
            for (const item of VERIFIED_DEFAULT_EVENTS) {
                const docId = item.id;
                await CMS.saveDoc("events", docId, item);
                events.push({ id: docId, ...item });
            }
        }

        allEventsList = events;
        updateKpiStats();
        renderEventsTable();
    } catch (err) {
        console.error("Error loading events from Firestore:", err);
        allEventsList = VERIFIED_DEFAULT_EVENTS;
        updateKpiStats();
        renderEventsTable();
    }
}

function updateKpiStats() {
    const totalEl = document.getElementById("statTotalEvents");
    const upcomingEl = document.getElementById("statUpcomingEvents");
    const completedEl = document.getElementById("statCompletedEvents");
    const milestoneEl = document.getElementById("statMilestones");

    const total = allEventsList.length;
    const upcoming = allEventsList.filter(e => e.status === "upcoming" || (!e.status && e.active !== false)).length;
    const completed = allEventsList.filter(e => e.status === "completed").length;
    const milestones = allEventsList.filter(e => e.isMilestone === true).length;

    if (totalEl) totalEl.textContent = total;
    if (upcomingEl) upcomingEl.textContent = upcoming;
    if (completedEl) completedEl.textContent = completed;
    if (milestoneEl) milestoneEl.textContent = milestones;
}

// -----------------------------------------------------------------
// 3. Render Events Table
// -----------------------------------------------------------------
function renderEventsTable() {
    const tbody = document.getElementById("eventsTableBody");
    if (!tbody) return;

    const query = (document.getElementById("eventSearchInput")?.value || "").toLowerCase().trim();
    const statusFilter = document.getElementById("eventStatusFilter")?.value || "all";
    const catFilter = document.getElementById("eventCategoryFilter")?.value || "all";

    const filtered = allEventsList.filter(e => {
        const itemStatus = (e.status || "upcoming").toLowerCase();
        if (statusFilter !== "all" && itemStatus !== statusFilter.toLowerCase()) return false;

        const itemCat = (e.category || "OTHER").toUpperCase();
        if (catFilter !== "all" && itemCat !== catFilter.toUpperCase()) return false;

        if (query) {
            const titleMatch = (e.title || "").toLowerCase().includes(query);
            const descMatch = (e.description || e.shortDescription || "").toLowerCase().includes(query);
            const venueMatch = (e.venue || "").toLowerCase().includes(query);
            const awardsMatch = (e.awards || "").toLowerCase().includes(query);
            return titleMatch || descMatch || venueMatch || awardsMatch;
        }
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:35px; color:var(--text-faint);">
                    <div style="font-size:1.6rem; margin-bottom:6px;">🔍</div>
                    <div style="font-weight:600; margin-bottom:4px;">No matching events or milestones found</div>
                    <p style="font-size:0.8rem; opacity:0.75; margin:0 0 12px;">Try clearing search keywords or changing the status filter.</p>
                    <button type="button" class="secondary-btn" onclick="document.getElementById('eventSearchInput').value=''; document.getElementById('eventStatusFilter').value='all'; document.getElementById('eventCategoryFilter').value='all'; renderEventsTable();" style="padding:6px 14px; font-size:0.8rem;">Reset Filters</button>
                </td>
            </tr>
        `;
        return;
    }

    // Sort: Upcoming first by order, completed descending by year/order
    filtered.sort((a, b) => {
        if (a.status === "upcoming" && b.status !== "upcoming") return -1;
        if (a.status !== "upcoming" && b.status === "upcoming") return 1;
        const yearA = parseInt(a.year) || (a.startDate ? parseInt(a.startDate.substring(0,4)) : 0);
        const yearB = parseInt(b.year) || (b.startDate ? parseInt(b.startDate.substring(0,4)) : 0);
        if (yearB !== yearA) return yearB - yearA;
        return (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999);
    });

    let html = "";
    filtered.forEach(e => {
        const poster = e.posterImage || e.coverImageUrl || "assets/nodp.png";
        const status = e.status || "upcoming";
        
        let statusBadge = `<span class="badge-status badge-upcoming">● Upcoming</span>`;
        if (status === "completed") {
            statusBadge = `<span class="badge-status badge-completed">✓ Completed</span>`;
        } else if (status === "draft") {
            statusBadge = `<span class="badge-status badge-draft">📝 Draft</span>`;
        } else if (status === "archived") {
            statusBadge = `<span class="badge-status badge-archived">📦 Archived</span>`;
        }

        const milestoneBadge = e.isMilestone
            ? `<span class="badge-milestone" title="Featured in About Timeline">⏳ ${escapeHtml(e.milestoneYear || e.year || "Milestone")}</span>`
            : `<span style="font-size:0.75rem; color:var(--text-faint);">-</span>`;

        let impactDetails = [];
        if (e.participantsCount) impactDetails.push(`👥 ${escapeHtml(e.participantsCount)}`);
        if (e.collegesCount) impactDetails.push(`🏛️ ${escapeHtml(e.collegesCount)} clgs`);
        if (e.awards) impactDetails.push(`🏆 ${escapeHtml(e.awards)}`);

        const impactText = impactDetails.length > 0
            ? `<div style="font-size:0.78rem; color:var(--text); line-height:1.3;">${impactDetails.join("<br>")}</div>`
            : `<span style="font-size:0.75rem; color:var(--text-faint);">Standard Event</span>`;

        const dateDisplay = e.dateText || (e.startDate ? e.startDate : "TBA");

        html += `
            <tr>
                <td>
                    <img src="${getAdminImgSrc(poster)}" alt="Poster" style="width:52px; height:52px; border-radius:8px; object-fit:cover; border:1px solid var(--border-color);" onerror="this.onerror=null; this.src='../assets/nodp.png';">
                </td>
                <td>
                    <div style="font-weight:700; color:var(--text); line-height:1.3;">${escapeHtml(e.title)}</div>
                    <div style="font-size:0.76rem; color:var(--accent-color); font-weight:600; margin-top:2px;">
                        ${escapeHtml(e.category || "HACKATHON")} ${e.venue ? `&bull; 📍 ${escapeHtml(e.venue)}` : ""}
                    </div>
                </td>
                <td>
                    <div style="font-size:0.84rem; font-weight:600;">${escapeHtml(dateDisplay)}</div>
                    ${e.year ? `<div style="font-size:0.75rem; color:var(--text-faint); font-family:var(--font-mono);">${escapeHtml(e.year)}</div>` : ""}
                </td>
                <td>${statusBadge}</td>
                <td>${impactText}</td>
                <td>${milestoneBadge}</td>
                <td style="text-align:right; white-space:nowrap;">
                    <button type="button" class="secondary-btn" style="padding:6px 12px; font-size:0.8rem; margin-right:4px;" onclick="editEvent('${escapeHtml(e.id)}')">✏️ Edit</button>
                    <button type="button" class="secondary-btn" style="padding:6px 10px; font-size:0.8rem; margin-right:4px;" onclick="toggleEventLifecycle('${escapeHtml(e.id)}')" title="Toggle between Upcoming and Completed">
                        ${status === 'completed' ? '🚀 Set Upcoming' : '✓ Mark Done'}
                    </button>
                    <a href="../events.html" target="_blank" class="secondary-btn" style="padding:6px 10px; font-size:0.8rem; text-decoration:none; margin-right:4px;" title="View Live">🔗</a>
                    <button type="button" style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.3); padding:6px 10px; border-radius:6px; font-size:0.8rem; cursor:pointer;" onclick="deleteEvent('${escapeHtml(e.id)}', '${escapeHtml(e.title.replace(/'/g, "\\'"))}')" title="Delete event">🗑️</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// -----------------------------------------------------------------
// 4. Modal Open & Edit
// -----------------------------------------------------------------
function openEventModal(eventItem = null) {
    const modal = document.getElementById("eventModal");
    const form = document.getElementById("eventForm");
    if (!modal || !form) return;

    form.reset();
    editingEventId = eventItem ? eventItem.id : null;
    currentGalleryImages = [];
    pendingGalleryFiles = [];

    const previewImg = document.getElementById("eventImagePreview");
    const milestoneChk = document.getElementById("eventIsMilestone");
    const milestoneRow = document.getElementById("milestoneInputsRow");

    if (eventItem) {
        document.getElementById("modalTitle").textContent = "✏️ Edit Event: " + eventItem.title;
        document.getElementById("eventDocId").value = eventItem.id;
        document.getElementById("eventTitleInput").value = eventItem.title || "";
        document.getElementById("eventCategory").value = (eventItem.category || "HACKATHON").toUpperCase();
        document.getElementById("eventStatus").value = eventItem.status || "upcoming";
        document.getElementById("eventDateText").value = eventItem.dateText || "";
        document.getElementById("eventStartDate").value = eventItem.startDate || "";
        document.getElementById("eventEndDate").value = eventItem.endDate || "";
        document.getElementById("eventVenue").value = eventItem.venue || "";
        document.getElementById("eventShortDescription").value = eventItem.shortDescription || "";
        document.getElementById("eventDescriptionInput").value = eventItem.description || "";
        
        currentEventPoster = eventItem.posterImage || eventItem.coverImageUrl || "";
        document.getElementById("eventImageUrl").value = currentEventPoster;
        if (previewImg) previewImg.src = getAdminImgSrc(currentEventPoster);

        // Gallery
        if (Array.isArray(eventItem.galleryImages)) {
            currentGalleryImages = [...eventItem.galleryImages];
        } else if (typeof eventItem.galleryImages === "string" && eventItem.galleryImages.trim()) {
            currentGalleryImages = [eventItem.galleryImages];
        }

        // Verified Metrics
        document.getElementById("eventParticipantsCount").value = eventItem.participantsCount || "";
        document.getElementById("eventCollegesCount").value = eventItem.collegesCount || "";
        document.getElementById("eventTeamDetails").value = eventItem.teamDetails || "";
        document.getElementById("eventAwards").value = eventItem.awards || "";
        document.getElementById("eventHighlights").value = eventItem.highlights || "";

        // Upcoming registration
        document.getElementById("eventTeamFormat").value = eventItem.teamFormat || "";
        document.getElementById("eventSeatsText").value = eventItem.seatsText || "";
        document.getElementById("eventProgressPct").value = eventItem.progressPct || 50;
        document.getElementById("eventRegisterUrl").value = eventItem.registerUrl || "";

        // Milestone
        const isMilestone = !!eventItem.isMilestone;
        if (milestoneChk) milestoneChk.checked = isMilestone;
        if (milestoneRow) milestoneRow.style.display = isMilestone ? "grid" : "none";
        document.getElementById("eventMilestoneYear").value = eventItem.milestoneYear || eventItem.year || "";
        document.getElementById("eventMilestoneIcon").value = eventItem.milestoneIcon || "🏆";
        document.getElementById("eventMilestoneTitle").value = eventItem.milestoneTitle || "";

        document.getElementById("eventOrder").value = eventItem.displayOrder || 1;
        document.getElementById("eventActive").checked = eventItem.active !== false;

        document.getElementById("btnSubmitEvent").textContent = "Update & Save Event";
    } else {
        document.getElementById("modalTitle").textContent = "🚀 Add Event / Historical Milestone";
        document.getElementById("eventDocId").value = "";
        currentEventPoster = "";
        if (previewImg) previewImg.src = "../assets/nodp.png";

        if (milestoneChk) milestoneChk.checked = false;
        if (milestoneRow) milestoneRow.style.display = "none";
        document.getElementById("eventMilestoneIcon").value = "🏆";
        document.getElementById("eventProgressPct").value = 50;

        const maxOrder = Math.max(0, ...allEventsList.map(e => parseInt(e.displayOrder) || 0));
        document.getElementById("eventOrder").value = maxOrder + 1;
        document.getElementById("eventActive").checked = true;
        document.getElementById("btnSubmitEvent").textContent = "Publish Event";
    }

    renderGalleryPreviews();
    modal.style.display = "flex";
}

function renderGalleryPreviews() {
    const container = document.getElementById("galleryPreviewContainer");
    if (!container) return;
    container.innerHTML = "";

    currentGalleryImages.forEach((item, idx) => {
        const url = typeof item === "string" ? item : (item.url || "");
        if (!url) return;
        const div = document.createElement("div");
        div.className = "gallery-thumb-item";
        div.innerHTML = `
            <img src="${getAdminImgSrc(url)}" alt="Gallery image">
            <button type="button" class="btn-remove-thumb" onclick="removeGalleryImage(${idx})" title="Remove photo">&times;</button>
        `;
        container.appendChild(div);
    });

    pendingGalleryFiles.forEach((file, idx) => {
        const tempUrl = URL.createObjectURL(file);
        const div = document.createElement("div");
        div.className = "gallery-thumb-item";
        div.style.borderColor = "#10b981";
        div.innerHTML = `
            <img src="${tempUrl}" alt="Pending upload">
            <button type="button" class="btn-remove-thumb" onclick="removePendingGalleryFile(${idx})" title="Remove photo">&times;</button>
        `;
        container.appendChild(div);
    });
}

window.removeGalleryImage = function(idx) {
    currentGalleryImages.splice(idx, 1);
    renderGalleryPreviews();
};

window.removePendingGalleryFile = function(idx) {
    pendingGalleryFiles.splice(idx, 1);
    renderGalleryPreviews();
};

window.editEvent = function(id) {
    const item = allEventsList.find(e => e.id === id);
    if (item) openEventModal(item);
};

// -----------------------------------------------------------------
// 5. Save Event (Add or Update)
// -----------------------------------------------------------------
async function saveEvent(isDraft = false) {
    const title = document.getElementById("eventTitleInput").value.trim();
    if (!title) {
        showToast("Please enter an event title.", "warning");
        return;
    }

    const dateText = document.getElementById("eventDateText").value.trim();
    if (!dateText) {
        showToast("Please enter a date text for display.", "warning");
        return;
    }

    const statusVal = isDraft ? "draft" : document.getElementById("eventStatus").value;
    const category = document.getElementById("eventCategory").value;
    const startDate = document.getElementById("eventStartDate").value;
    const endDate = document.getElementById("eventEndDate").value;
    const venue = document.getElementById("eventVenue").value.trim();
    const shortDescription = document.getElementById("eventShortDescription").value.trim();
    const description = document.getElementById("eventDescriptionInput").value.trim();

    // Poster Image
    const posterFileInput = document.getElementById("eventImageFile");
    const typedPosterUrl = document.getElementById("eventImageUrl").value.trim();
    let finalPoster = typedPosterUrl || currentEventPoster || "assets/announcements/default.jpg";

    if (posterFileInput && posterFileInput.files && posterFileInput.files[0]) {
        try {
            showToast("Uploading poster image...");
            finalPoster = await CMS.uploadImage(posterFileInput.files[0], "events");
        } catch (e) {
            console.warn("Poster upload notice:", e);
        }
    }

    // Process Gallery Images
    let finalGallery = [...currentGalleryImages];
    if (pendingGalleryFiles.length > 0) {
        showToast(`Uploading ${pendingGalleryFiles.length} gallery photos...`);
        for (const file of pendingGalleryFiles) {
            try {
                const gUrl = await CMS.uploadImage(file, "events/gallery");
                if (gUrl) finalGallery.push(gUrl);
            } catch (e) {
                console.warn("Gallery photo upload notice:", e);
            }
        }
    }

    // Verified Metrics
    const participantsCount = document.getElementById("eventParticipantsCount").value.trim() || null;
    const collegesCount = document.getElementById("eventCollegesCount").value.trim() || null;
    const teamDetails = document.getElementById("eventTeamDetails").value.trim() || null;
    const awards = document.getElementById("eventAwards").value.trim() || null;
    const highlights = document.getElementById("eventHighlights").value.trim() || null;

    // Upcoming fields
    const teamFormat = document.getElementById("eventTeamFormat").value.trim();
    const seatsText = document.getElementById("eventSeatsText").value.trim();
    const progressPct = parseInt(document.getElementById("eventProgressPct").value) || 50;
    const registerUrl = document.getElementById("eventRegisterUrl").value.trim() || "#";

    // Milestone settings
    const isMilestone = document.getElementById("eventIsMilestone").checked;
    const milestoneYear = document.getElementById("eventMilestoneYear").value.trim();
    const milestoneIcon = document.getElementById("eventMilestoneIcon").value.trim() || "🏆";
    const milestoneTitle = document.getElementById("eventMilestoneTitle").value.trim();

    // Calculate Year
    let calculatedYear = milestoneYear;
    if (!calculatedYear && startDate) {
        calculatedYear = startDate.substring(0, 4);
    }
    if (!calculatedYear && dateText) {
        const m = dateText.match(/\b(20\d{2})\b/);
        if (m) calculatedYear = m[1];
    }
    if (!calculatedYear) calculatedYear = new Date().getFullYear().toString();

    const displayOrder = parseInt(document.getElementById("eventOrder").value) || 1;
    const active = document.getElementById("eventActive").checked;

    const payload = {
        title,
        category,
        status: statusVal,
        dateText,
        startDate: startDate || null,
        endDate: endDate || null,
        year: calculatedYear,
        venue,
        shortDescription,
        description,
        posterImage: finalPoster,
        coverImageUrl: finalPoster,
        galleryImages: finalGallery,
        participantsCount,
        collegesCount,
        teamDetails,
        awards,
        highlights,
        teamFormat,
        seatsText,
        progressPct,
        registerUrl,
        isMilestone,
        milestoneYear: milestoneYear || calculatedYear,
        milestoneIcon,
        milestoneTitle: milestoneTitle || title,
        displayOrder,
        active,
        updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    try {
        let savedDocId = editingEventId;
        if (editingEventId) {
            await CMS.saveDoc("events", editingEventId, payload);
            const idx = allEventsList.findIndex(e => e.id === editingEventId);
            if (idx >= 0) allEventsList[idx] = { ...allEventsList[idx], ...payload, id: editingEventId };
            showToast(`✓ Event "${title}" updated successfully!`);
        } else {
            payload.createdAt = firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
            savedDocId = await CMS.saveDoc("events", null, payload);
            allEventsList.unshift({ id: savedDocId, ...payload });
            showToast(`✓ Event "${title}" published successfully!`);
        }

        // If marked as milestone, sync to About Timeline
        if (isMilestone) {
            await syncMilestoneToAbout(savedDocId, payload);
        }

        updateKpiStats();
        renderEventsTable();
        closeAllModals();
    } catch (err) {
        showToast("Error saving event: " + err.message, "error");
    }
}

// -----------------------------------------------------------------
// 6. Quick Status Toggle & Delete
// -----------------------------------------------------------------
window.toggleEventLifecycle = async function(id) {
    const item = allEventsList.find(e => e.id === id);
    if (!item) return;

    const newStatus = (item.status === "completed") ? "upcoming" : "completed";
    try {
        await CMS.saveDoc("events", id, { status: newStatus });
        item.status = newStatus;
        showToast(`Event marked as ${newStatus}!`);
        updateKpiStats();
        renderEventsTable();
    } catch (err) {
        showToast("Failed to update status: " + err.message, "error");
    }
};

window.deleteEvent = async function(id, title) {
    if (confirm(`Are you sure you want to permanently delete "${title}"?`)) {
        try {
            await CMS.deleteDoc("events", id);
            allEventsList = allEventsList.filter(e => e.id !== id);
            showToast(`Event "${title}" deleted.`);
            updateKpiStats();
            renderEventsTable();
        } catch (err) {
            showToast("Failed to delete event: " + err.message, "error");
        }
    }
};

async function seedDefaultVerifiedEvents() {
    if (!confirm("This will restore the standard verified VVISC hackathons and milestones to the database. Continue?")) {
        return;
    }
    try {
        showToast("Restoring verified events and milestones...");
        for (const item of VERIFIED_DEFAULT_EVENTS) {
            await CMS.saveDoc("events", item.id, item);
        }
        await loadAllEvents();
        showToast("✓ Verified events successfully restored!");
    } catch (err) {
        showToast("Seeding failed: " + err.message, "error");
    }
}

// -----------------------------------------------------------------
// 7. Synchronize Event Milestone to About Timeline
// -----------------------------------------------------------------
async function syncMilestoneToAbout(eventId, eventData) {
    try {
        const aboutData = await CMS.getContent("about", { timeline: [] });
        let timeline = Array.isArray(aboutData.timeline) ? [...aboutData.timeline] : [];

        const existingIdx = timeline.findIndex(m => m.linkedEventId === eventId);
        const milestoneItem = {
            year: eventData.milestoneYear || eventData.year || "Milestone",
            title: eventData.milestoneTitle || eventData.title,
            description: eventData.shortDescription || eventData.description || "",
            icon: eventData.milestoneIcon || "🏆",
            imageUrl: eventData.posterImage || "",
            linkedEventId: eventId,
            statValue: eventData.participantsCount || (eventData.awards ? "1st Prize" : ""),
            statLabel: eventData.participantsCount ? "Participants" : (eventData.awards ? "Award" : ""),
            order: eventData.displayOrder || (timeline.length + 1),
            active: eventData.active !== false
        };

        if (existingIdx >= 0) {
            timeline[existingIdx] = { ...timeline[existingIdx], ...milestoneItem };
        } else {
            timeline.push(milestoneItem);
        }

        // Sort by year / order
        timeline.sort((a, b) => (parseInt(a.year) || 9999) - (parseInt(b.year) || 9999));
        await CMS.saveContent("about", { timeline });
        console.log(`Synced event "${eventData.title}" to About timeline.`);
    } catch (e) {
        console.warn("Milestone sync warning:", e);
    }
}

// -----------------------------------------------------------------
// 8. Featured Hero Event
// -----------------------------------------------------------------
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

// -----------------------------------------------------------------
// 9. Impact Numbers
// -----------------------------------------------------------------
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

// -----------------------------------------------------------------
// 10. Updates & Notices Feed
// -----------------------------------------------------------------
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
            
            <div style="display:flex; gap:8px; border-top:1px solid var(--border-color); padding-top:10px;">
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
        document.getElementById("noticeDateText").value = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
        const maxOrder = Math.max(0, ...noticesList.map(n => parseInt(n.displayOrder) || 0));
        document.getElementById("noticeOrder").value = maxOrder + 1;
        document.getElementById("noticeActive").checked = true;
    }

    modal.style.display = "flex";
}

async function saveNotice() {
    const docId = document.getElementById("noticeDocId").value;
    const title = document.getElementById("noticeTitleInput").value.trim();
    if (!title) {
        showToast("Please enter the notice title.", "warning");
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

window.editNotice = function(id) {
    const item = noticesList.find(n => n.id === id);
    if (item) openNoticeModal(item);
};

window.deleteNotice = async function(id) {
    if (confirm("Are you sure you want to delete this notice?")) {
        try {
            await CMS.deleteDoc("announcements", id);
            showToast("Notice deleted.");
            await loadNotices();
        } catch (err) {
            showToast("Failed to delete notice.", "error");
        }
    }
};

function escapeHtml(str) {
    return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
