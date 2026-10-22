// ===============================================================
// VVISC IUCEE - Unified Project Management System
// Admin Dashboard Controller & Firebase Integration
// Overview Stats + Management Table + On-Page Add/Edit Form
// ===============================================================

let projectsList = [];
let editingDocId = null;
let selectedCoverFile = null;
let existingCoverUrl = "";
let existingCoverPath = "";
let existingGalleryImages = []; // Array of { url, path } or string
let pendingGalleryFiles = []; // Array of File objects

const DEFAULT_SEED_PROJECTS = [
    {
        title: "KrishiNet: Edge AI Crop Health Diagnostics",
        category: "AI & Machine Learning",
        shortDescription: "Autonomous edge computer vision system deployed on low-cost drones for real-time crop disease diagnosis, pesticide recommendation, and yield projection.",
        description: "KrishiNet bridges agricultural agronomy and edge artificial intelligence. Built for smallholder farmers across rural India, the platform analyzes multispectral leaf imagery captured by handheld devices or autonomous UAVs, instantly classifying 40+ fungal and bacterial leaf pathologies offline with 96.4% precision.",
        problemStatement: "Rural agriculturalists face delayed crop disease diagnosis that leads to excessive crop loss (up to 35% annually) and indiscriminate chemical pesticide usage that degrades soil health and increases operational expenses.",
        solution: "An ultra-quantized lightweight convolutional neural network (MobileNetV3 backbone) optimized with TensorRT to execute directly on a Raspberry Pi 4 edge module attached to a drone. Farmers receive audio-visual alerts in vernacular Telugu and English with tailored organic remedies.",
        features: [
            "Sub-50ms inference latency running directly on-device without active internet connectivity.",
            "Multi-disease classification covering Paddy, Cotton, Chili, and Maize cultivars.",
            "Autonomous waypoint tracking integration with ArduPilot drone flight controllers.",
            "Cloud telemetry synchronization whenever Wi-Fi or cellular connectivity is restored."
        ],
        technologies: ["PyTorch", "OpenCV", "TensorRT", "Raspberry Pi 4", "Flutter", "Python"],
        teamMembers: ["Sai Vardhan (Lead AI Engineer)", "Harika R. (Hardware Lead)", "Kiran Kumar (Agronomy Researcher)"],
        githubUrl: "https://github.com",
        demoUrl: "https://vvisc-iucee.web.app",
        documentationUrl: "https://github.com",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        coverImageUrl: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1200&q=80",
        coverImagePath: "",
        galleryImages: [
            { url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80", path: "" },
            { url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80", path: "" }
        ],
        outcomes: "Validated across 12 agricultural plots in Guntur district with 94.2% diagnostic accuracy. Awarded 1st place in Smart Agriculture category at the IUCEE Regional Hackathon 2025.",
        status: "published",
        featured: true,
        displayOrder: 1
    },
    {
        title: "AeroSwarm: Autonomous Decentralized Drone Mesh",
        category: "Robotics",
        shortDescription: "Decentralized UAV swarm architecture using custom peer-to-peer radio frequency meshes for disaster search, obstacle avoidance, and perimeter surveillance.",
        description: "AeroSwarm demonstrates resilient decentralized swarm coordination for emergency search-and-rescue. Eliminating single-point-of-failure ground control stations, every drone dynamically elects cluster heads, distributes search grid zones, and relays high-bandwidth thermal telemetry across multi-hop RF packet radios.",
        problemStatement: "In severe flood and earthquake scenarios, cellular towers and terrestrial infrastructure fail, leaving conventional remote-controlled drones incapable of operating beyond visual line of sight.",
        solution: "A consensus-driven Flocking Algorithm running atop ROS 2 (Robot Operating System). Thermal infrared sensor streams are aggregated collaboratively, triangulating human heat signatures under foliage.",
        features: [
            "Decentralized ad-hoc 868MHz mesh network supporting up to 16 autonomous units.",
            "Dynamic leader election with failover in under 200 milliseconds.",
            "Coordinated spatial coverage planning avoiding mutual drone collision envelopes.",
            "Live thermal human-detection bounding box streaming."
        ],
        technologies: ["ROS 2", "C++", "Gazebo", "PX4 Autopilot", "Python", "LiDAR"],
        teamMembers: ["Ravi Teja (Robotics Lead)", "M. Anusha (Control Systems)", "Suresh V. (RF Communications)"],
        githubUrl: "https://github.com",
        demoUrl: "",
        documentationUrl: "https://github.com",
        videoUrl: "",
        coverImageUrl: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1200&q=80",
        coverImagePath: "",
        galleryImages: [
            { url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80", path: "" },
            { url: "https://images.unsplash.com/photo-1516542076529-1ea3854896f2?auto=format&fit=crop&w=800&q=80", path: "" }
        ],
        outcomes: "Successfully deployed in mock disaster search drill, discovering 3 simulated targets in under 8 minutes across a 2-kilometer radius.",
        status: "published",
        featured: true,
        displayOrder: 2
    },
    {
        title: "GridSense: Smart Campus IoT Energy Microgrid",
        category: "IoT",
        shortDescription: "Microgrid energy telemetry and load-balancing hardware integrating bidirectional smart meters, LoRaWAN transmitters, and cloud forecasting dashboards.",
        description: "GridSense transforms university campus electrical substations into an autonomous smart grid. Custom edge measurement nodes capture real-time voltage sags, power factors, and departmental kilowatt-hour consumption, dispatching battery storage reserves during peak load windows.",
        problemStatement: "Educational campuses suffer heavy electricity demand surges during midday hours with inefficient energy allocation, high utility bills, and zero granular visibility into departmental waste.",
        solution: "A low-power hardware sensor network communicating over long-range LoRaWAN gateways to an influx time-series engine with machine learning models forecasting hour-ahead cooling loads.",
        features: [
            "Sub-second phase synchronization across 18 campus electrical panels.",
            "LoRaWAN range coverage exceeding 4 kilometers without line-of-sight constraints.",
            "Automated capacitor bank toggling to maintain >0.98 power factor.",
            "Real-time administrative anomaly alert web dashboard."
        ],
        technologies: ["ESP32", "LoRaWAN", "MQTT", "TimeScaleDB", "Node.js", "Grafana"],
        teamMembers: ["V. Bhavani (Embedded Engineer)", "T. Praneeth (Hardware Dev)"],
        githubUrl: "https://github.com",
        demoUrl: "",
        coverImageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
        coverImagePath: "",
        galleryImages: [],
        outcomes: "Achieved an estimated 14% monthly electrical cost reduction during summer laboratory operations across Block A and Block B.",
        status: "published",
        featured: false,
        displayOrder: 3
    },
    {
        title: "VVISC CampusHub: Engineering Knowledge Mesh",
        category: "Web Development",
        shortDescription: "Ultra-fast progressive web app connecting university student innovators with project mentors, patent guidance, and interactive hackathon project submissions.",
        description: "An open collaborative portal engineered from the ground up for VVISC student chapters. Students register ideas, match with faculty research advisors, browse open-source student repositories, and submit technical papers for collegiate symposium review.",
        problemStatement: "Student research projects remain siloed across individual student hard drives and private groups, leading to duplicated technical efforts and lost intellectual property.",
        solution: "A high-performance modern web application utilizing serverless Firestore databases, instant fuzzy search indexing, and real-time activity channels.",
        features: [
            "Decentralized project discovery directory with tag-based search.",
            "Mentor review workflows with inline feedback annotations.",
            "Automated PDF abstract extraction and citation generation.",
            "Light/Dark theme support with responsive mobile-first architecture."
        ],
        technologies: ["JavaScript ES6+", "Firestore", "Firebase Storage", "Cloud Functions", "PWA"],
        teamMembers: ["VVISC Web Team", "Akash Sharma (Full-Stack Dev)"],
        githubUrl: "https://github.com",
        demoUrl: "https://vvisc-iucee.web.app",
        coverImageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
        coverImagePath: "",
        galleryImages: [],
        outcomes: "Adopted by 500+ active student chapter members with 99.9% uptime and sub-second page loads.",
        status: "published",
        featured: true,
        displayOrder: 4
    },
    {
        title: "SentinelShield: Zero-Trust Adaptive Network Sentinel",
        category: "Cybersecurity",
        shortDescription: "Lightweight network anomaly detection framework powered by unsupervised autoencoders to identify stealth lateral movement and zero-day packet anomalies.",
        description: "SentinelShield passively inspects internal enterprise local area networks for anomalous protocol traffic. By reconstructing baseline packet metadata through deep autoencoders, it highlights malicious command-and-control beacons and ARP cache poisoning in real time without decrypting user payloads.",
        problemStatement: "Traditional signature-based antivirus and intrusion detection tools fail against polymorphic malware, internal compromised credentials, and zero-day threat actors.",
        solution: "An unsupervised neural network scoring packet header sequences with sliding entropy windows, alerting security administrators before ransomware payloads execute.",
        features: [
            "Zero payload decryption requirement preserving user privacy and compliance.",
            "Real-time packet capture processing up to 10 Gbps line rates.",
            "Automated firewall block rule generation through eBPF linux kernel hooks.",
            "Integration with standard SIEM and Syslog monitoring tools."
        ],
        technologies: ["Python", "Scapy", "Snort", "Docker", "FastAPI", "PyTorch"],
        teamMembers: ["Deepak N. (Security Researcher)", "Sneha Priya (Security Analyst)"],
        githubUrl: "https://github.com",
        demoUrl: "",
        coverImageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
        coverImagePath: "",
        galleryImages: [],
        outcomes: "Recognized with Best Research Paper Award at the International Conference on Applied Cyber Defense 2025.",
        status: "published",
        featured: false,
        displayOrder: 5
    },
    {
        title: "RoboLogix: Automated Guided Warehouse Rover",
        category: "Robotics",
        shortDescription: "SLAM-guided differential drive logistics robot engineered for automated indoor material transit with LiDAR mapping and ultrasonic safety curtains.",
        description: "An autonomous industrial mobile robot platform engineered for internal component delivery across engineering labs. Features simultaneous localization and mapping (SLAM), dynamic re-routing around human obstacles, and auto-docking inductive battery recharging.",
        problemStatement: "Manual material handling between hardware fabrication workshops and testing labs incurs labor overhead and safety hazards in heavy machinery environments.",
        solution: "Differential-drive robot chassis equipped with 360-degree 2D LiDAR, ultrasonic safety bumper rings, and high-torque brushless DC motors controlled via CAN bus.",
        features: [
            "Real-time 2D Hector SLAM mapping with +/- 2cm positional repeatability.",
            "Dynamic path planning with costmap inflation for human pedestrian avoidance.",
            "Autonomous battery voltage monitoring with auto-docking return-to-base routine.",
            "Payload capacity of 45 kilograms with low-center-of-gravity steel chassis."
        ],
        technologies: ["SLAM", "LiDAR", "Arduino Mega", "Python", "ROS", "OpenCV"],
        teamMembers: ["G. Rohith (Hardware Architect)", "B. Sumanth (Firmware Dev)", "K. Divya (CAD Modeling)"],
        githubUrl: "https://github.com",
        demoUrl: "",
        coverImageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
        coverImagePath: "",
        galleryImages: [],
        outcomes: "Operational across VVIT Mechanical and Robotics laboratories, logging over 120km of autonomous material transport.",
        status: "published",
        featured: false,
        displayOrder: 6
    }
];

// Document Ready Initialization
document.addEventListener("DOMContentLoaded", async function() {
    initAuthCheck();
    initEventListeners();
    await loadProjects();
    checkUrlParams();
});

// -----------------------------------------------------------------
// 1. Authentication & Security Check
// -----------------------------------------------------------------
function initAuthCheck() {
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (!user) {
                if (!sessionStorage.getItem("adminToken") && !localStorage.getItem("adminUser")) {
                    console.warn("Unauthenticated admin access attempt to project-management.html");
                    window.location.href = "../login.html";
                }
            } else {
                console.log("Admin authenticated for project management:", user.email);
            }
        });
    }
}

// -----------------------------------------------------------------
// 2. Initialize Event Listeners
// -----------------------------------------------------------------
function initEventListeners() {
    // Search & Filter Listeners
    const searchInput = document.getElementById("adminSearchInput");
    const catFilter = document.getElementById("adminCategoryFilter");
    const statusFilter = document.getElementById("adminStatusFilter");

    if (searchInput) searchInput.addEventListener("input", renderProjectsTable);
    if (catFilter) catFilter.addEventListener("change", renderProjectsTable);
    if (statusFilter) statusFilter.addEventListener("change", renderProjectsTable);

    // Open Add Form Button in Topbar
    const btnOpenAdd = document.getElementById("btnOpenAddForm");
    if (btnOpenAdd) btnOpenAdd.addEventListener("click", openAddModal);

    // Seed Sample Projects Button
    const btnSeed = document.getElementById("btnSeedProjects");
    if (btnSeed) btnSeed.addEventListener("click", seedDefaultProjects);

    // Modal Close Buttons
    const btnCloseModal = document.getElementById("btnModalClose");
    const btnCancelForm = document.getElementById("btnCancelForm");
    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
    if (btnCancelForm) btnCancelForm.addEventListener("click", closeModal);

    // Category Select: Toggle Custom Category Input
    const catSelect = document.getElementById("projCategory");
    const customCatGroup = document.getElementById("customCategoryGroup");
    const customCatInput = document.getElementById("projCustomCategory");

    if (catSelect && customCatGroup) {
        catSelect.addEventListener("change", function() {
            if (this.value === "Other") {
                customCatGroup.style.display = "block";
                if (customCatInput) customCatInput.required = true;
            } else {
                customCatGroup.style.display = "none";
                if (customCatInput) {
                    customCatInput.required = false;
                    customCatInput.value = "";
                }
            }
        });
    }

    // Cover Image Dropzone & File Input
    const coverDropzone = document.getElementById("coverDropzone");
    const coverFileInput = document.getElementById("coverFileInput");
    const coverUrlInput = document.getElementById("coverUrlInput");
    const btnApplyCoverUrl = document.getElementById("btnApplyCoverUrl");
    const btnRemoveCover = document.getElementById("btnRemoveCover");

    if (coverDropzone && coverFileInput) {
        coverDropzone.addEventListener("click", () => coverFileInput.click());

        ["dragenter", "dragover"].forEach(eventName => {
            coverDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                coverDropzone.classList.add("dragover");
            }, false);
        });

        ["dragleave", "drop"].forEach(eventName => {
            coverDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                coverDropzone.classList.remove("dragover");
            }, false);
        });

        coverDropzone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length > 0) {
                handleCoverFileSelection(dt.files[0]);
            }
        });

        coverFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleCoverFileSelection(e.target.files[0]);
            }
        });
    }

    if (btnApplyCoverUrl && coverUrlInput) {
        btnApplyCoverUrl.addEventListener("click", () => {
            applyDirectCoverUrl(coverUrlInput.value.trim());
        });
        coverUrlInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                applyDirectCoverUrl(coverUrlInput.value.trim());
            }
        });
    }

    if (btnRemoveCover) {
        btnRemoveCover.addEventListener("click", removeCoverImage);
    }

    // Gallery Dropzone & Multi-file Input
    const galleryDropzone = document.getElementById("galleryDropzone");
    const galleryFileInput = document.getElementById("galleryFileInput");

    if (galleryDropzone && galleryFileInput) {
        galleryDropzone.addEventListener("click", () => galleryFileInput.click());

        ["dragenter", "dragover"].forEach(eventName => {
            galleryDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                galleryDropzone.classList.add("dragover");
            }, false);
        });

        ["dragleave", "drop"].forEach(eventName => {
            galleryDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                galleryDropzone.classList.remove("dragover");
            }, false);
        });

        galleryDropzone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length > 0) {
                handleGalleryFilesSelection(Array.from(dt.files));
            }
        });

        galleryFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleGalleryFilesSelection(Array.from(e.target.files));
            }
        });
    }

    // Dynamic Feature Bullets Builder
    const btnAddFeature = document.getElementById("btnAddFeatureRow");
    if (btnAddFeature) {
        btnAddFeature.addEventListener("click", () => addFeatureRow(""));
    }

    // Tech Stack Chips Live Preview
    const techInput = document.getElementById("projTechInput");
    if (techInput) {
        techInput.addEventListener("input", updateTechChipsPreview);
    }

    // Save as Draft Button in Form Dock
    const btnSaveDraft = document.getElementById("btnSaveDraft");
    if (btnSaveDraft) {
        btnSaveDraft.addEventListener("click", (e) => {
            e.preventDefault();
            submitProjectForm("draft");
        });
    }

    // Form Submission (Publish or Update)
    const projectForm = document.getElementById("projectEditorForm");
    if (projectForm) {
        projectForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const statusVal = document.getElementById("projStatus")?.value || "published";
            submitProjectForm(statusVal);
        });
    }
}

// -----------------------------------------------------------------
// 3. Data Loading & Live Sync
// -----------------------------------------------------------------
async function loadProjects() {
    try {
        let list = [];
        if (window.db) {
            const snapshot = await db.collection("projects").get();
            snapshot.forEach(doc => {
                list.push({ id: doc.id, ...doc.data() });
            });
        }

        // Auto-seed if collection is completely empty
        if (list.length === 0) {
            console.log("No projects found in database. Initializing default seed data...");
            for (const item of DEFAULT_SEED_PROJECTS) {
                const docRef = await db.collection("projects").add({
                    ...item,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    publishedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                list.push({ id: docRef.id, ...item });
            }
        }

        projectsList = list;
        updateStats();
        renderProjectsTable();
    } catch (err) {
        console.error("Error loading projects from Firestore:", err);
        const tbody = document.getElementById("projectsTableBody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:35px; color:#ef4444;">Error accessing Firestore: ${escapeHtml(err.message)}</td></tr>`;
        }
    }
}

function updateStats() {
    const totalEl = document.getElementById("statTotalProjects");
    const pubEl = document.getElementById("statPublishedProjects");
    const draftEl = document.getElementById("statDraftProjects");
    const archEl = document.getElementById("statArchivedProjects");

    const total = projectsList.length;
    const pub = projectsList.filter(p => p.status === "published").length;
    const draft = projectsList.filter(p => p.status === "draft").length;
    const arch = projectsList.filter(p => p.status === "archived").length;

    if (window.countUp) {
        if (totalEl) countUp(totalEl, total);
        if (pubEl) countUp(pubEl, pub);
        if (draftEl) countUp(draftEl, draft);
        if (archEl) countUp(archEl, arch);
    } else {
        if (totalEl) totalEl.textContent = total;
        if (pubEl) pubEl.textContent = pub;
        if (draftEl) draftEl.textContent = draft;
        if (archEl) archEl.textContent = arch;
    }
}

// -----------------------------------------------------------------
// 4. Table Rendering & Client Filters
// -----------------------------------------------------------------
function renderProjectsTable() {
    const tbody = document.getElementById("projectsTableBody");
    if (!tbody) return;

    const query = (document.getElementById("adminSearchInput")?.value || "").toLowerCase().trim();
    const cat = document.getElementById("adminCategoryFilter")?.value || "all";
    const status = document.getElementById("adminStatusFilter")?.value || "all";

    const filtered = projectsList.filter(p => {
        if (cat !== "all" && (p.category || "").toLowerCase() !== cat.toLowerCase()) return false;
        if (status !== "all" && (p.status || "published").toLowerCase() !== status.toLowerCase()) return false;

        if (query) {
            const titleMatch = (p.title || "").toLowerCase().includes(query);
            const descMatch = (p.shortDescription || p.description || "").toLowerCase().includes(query);
            const catMatch = (p.category || "").toLowerCase().includes(query);
            
            let techMatch = false;
            if (Array.isArray(p.technologies)) {
                techMatch = p.technologies.some(t => t.toLowerCase().includes(query));
            } else if (typeof p.technologies === "string") {
                techMatch = p.technologies.toLowerCase().includes(query);
            }

            let memberMatch = false;
            if (Array.isArray(p.teamMembers)) {
                memberMatch = p.teamMembers.some(m => m.toLowerCase().includes(query));
            } else if (typeof p.teamMembers === "string") {
                memberMatch = p.teamMembers.toLowerCase().includes(query);
            }

            return titleMatch || descMatch || catMatch || techMatch || memberMatch;
        }
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:40px; color:var(--text-dim);">
                    <div style="font-size:1.8rem; margin-bottom:8px;">🔍</div>
                    <div style="font-size:1.05rem; font-weight:600; color:var(--text); margin-bottom:4px;">No matching innovations found</div>
                    <p style="font-size:0.85rem; color:var(--text-faint); margin:0 0 16px;">Try adjusting your search keywords or clearing filters.</p>
                    <button type="button" class="secondary-btn" onclick="resetFilters()" style="padding:8px 16px; font-size:0.85rem;">Clear All Filters</button>
                </td>
            </tr>
        `;
        return;
    }

    let html = "";
    filtered.forEach(p => {
        const coverImg = p.coverImageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80";
        
        let statusBadge = `<span class="proj-badge-pub">● Published</span>`;
        if (p.status === "draft") {
            statusBadge = `<span class="proj-badge-draft">● Draft</span>`;
        } else if (p.status === "archived") {
            statusBadge = `<span class="proj-badge-archived">● Archived</span>`;
        }

        let techList = [];
        if (Array.isArray(p.technologies)) {
            techList = p.technologies;
        } else if (typeof p.technologies === "string" && p.technologies.trim()) {
            techList = p.technologies.split(",").map(t => t.trim());
        }

        let authors = "VVISC Team";
        if (Array.isArray(p.teamMembers) && p.teamMembers.length > 0) {
            authors = p.teamMembers.join(", ");
        } else if (typeof p.teamMembers === "string" && p.teamMembers.trim()) {
            authors = p.teamMembers;
        }

        let dateStr = "Recent";
        if (p.updatedAt && p.updatedAt.seconds) {
            dateStr = new Date(p.updatedAt.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        } else if (p.publishedAt && p.publishedAt.seconds) {
            dateStr = new Date(p.publishedAt.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }

        html += `
            <tr>
                <td>
                    <img src="${escapeHtml(coverImg)}" alt="Thumbnail" class="thumb-preview-box" onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80'">
                </td>
                <td>
                    <div style="font-weight:600; color:var(--text); line-height:1.3;">${escapeHtml(p.title)}</div>
                    <div style="font-size:0.78rem; color:var(--accent-light, #F09D6B); font-family:var(--font-mono); margin-top:2px;">${escapeHtml(p.category || "General")}</div>
                </td>
                <td>
                    <div style="display:flex; flex-wrap:wrap; gap:4px; max-width:240px;">
                        ${techList.slice(0, 3).map(t => `<span style="background:rgba(199,107,60,0.12); border:1px solid rgba(199,107,60,0.25); color:var(--copper-light,#F09D6B); padding:2px 8px; border-radius:4px; font-size:0.74rem; font-family:var(--font-mono);">${escapeHtml(t)}</span>`).join("")}
                        ${techList.length > 3 ? `<span style="font-size:0.75rem; color:var(--text-faint);">+${techList.length - 3}</span>` : ""}
                    </div>
                </td>
                <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-dim);" title="${escapeHtml(authors)}">
                    ${escapeHtml(authors)}
                </td>
                <td>${statusBadge}</td>
                <td style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-faint);">${escapeHtml(dateStr)}</td>
                <td style="text-align:right; white-space:nowrap;">
                    <button class="secondary-btn" style="padding:6px 12px; font-size:0.8rem; margin-right:4px;" onclick="editProject('${escapeHtml(p.id)}')">✏️ Edit</button>
                    <button class="secondary-btn" style="padding:6px 10px; font-size:0.8rem; margin-right:4px;" onclick="togglePublish('${escapeHtml(p.id)}', '${escapeHtml(p.status || "published")}')" title="Quick toggle between published and draft">${p.status === "draft" ? "🚀 Publish" : "📝 Draft"}</button>
                    <button class="secondary-btn" style="padding:6px 10px; font-size:0.8rem; margin-right:4px;" onclick="toggleArchive('${escapeHtml(p.id)}', '${escapeHtml(p.status || "published")}')" title="Archive / Unarchive">${p.status === "archived" ? "📦 Unarchive" : "📦"}</button>
                    <a href="../project-details.html?id=${encodeURIComponent(p.id)}" target="_blank" class="secondary-btn" style="padding:6px 10px; font-size:0.8rem; text-decoration:none; margin-right:4px;" title="Preview project details in new tab">🔗</a>
                    <button class="secondary-btn" style="padding:6px 10px; font-size:0.8rem; color:#ef4444; border-color:rgba(239,68,68,0.3);" onclick="deleteProject('${escapeHtml(p.id)}', '${escapeHtml(p.title.replace(/'/g, "\\'"))}')" title="Delete innovation permanently">🗑️</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

window.resetFilters = function() {
    const searchInput = document.getElementById("adminSearchInput");
    const catFilter = document.getElementById("adminCategoryFilter");
    const statusFilter = document.getElementById("adminStatusFilter");
    if (searchInput) searchInput.value = "";
    if (catFilter) catFilter.value = "all";
    if (statusFilter) statusFilter.value = "all";
    renderProjectsTable();
};

// -----------------------------------------------------------------
// 5. On-Page Add / Edit Form Modal Controller
// -----------------------------------------------------------------
function openAddModal() {
    editingDocId = null;
    const form = document.getElementById("projectEditorForm");
    if (form) form.reset();

    document.getElementById("editDocId").value = "";
    document.getElementById("formModalTitle").textContent = "🚀 Add New Innovation Project";
    document.getElementById("formModalSub").textContent = "Provide technical architecture, prototypes, schematics, and repository URLs.";
    document.getElementById("btnSubmitProjectText").textContent = "Publish Project";
    document.getElementById("projStatus").value = "published";
    document.getElementById("customCategoryGroup").style.display = "none";
    
    // Clear image states
    selectedCoverFile = null;
    existingCoverUrl = "";
    existingCoverPath = "";
    existingGalleryImages = [];
    pendingGalleryFiles = [];

    const previewContainer = document.getElementById("coverPreviewContainer");
    if (previewContainer) previewContainer.style.display = "none";

    renderGalleryPreviews();
    ensureAtLeastOneFeatureRow();
    updateTechChipsPreview();
    setFormIndicator("Ready", "var(--text-faint)");

    // Show modal
    const modal = document.getElementById("projectFormModal");
    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

window.editProject = function(id) {
    const project = projectsList.find(p => p.id === id);
    if (!project) return;

    editingDocId = id;
    const form = document.getElementById("projectEditorForm");
    if (form) form.reset();

    document.getElementById("editDocId").value = id;
    document.getElementById("formModalTitle").textContent = "✏️ Edit Project: " + project.title;
    document.getElementById("formModalSub").textContent = "Modify technical architecture, schematics, and external repository links.";
    document.getElementById("btnSubmitProjectText").textContent = "Update & Save";

    // Core identification
    document.getElementById("projTitle").value = project.title || "";
    
    const catSelect = document.getElementById("projCategory");
    const customCatGroup = document.getElementById("customCategoryGroup");
    const customCatInput = document.getElementById("projCustomCategory");
    const standardCategories = [
        "AI & Machine Learning",
        "Robotics",
        "Web Development",
        "IoT",
        "Cybersecurity",
        "Data Science",
        "Mobile Development"
    ];

    if (standardCategories.includes(project.category)) {
        catSelect.value = project.category;
        customCatGroup.style.display = "none";
    } else {
        catSelect.value = "Other";
        customCatGroup.style.display = "block";
        if (customCatInput) {
            customCatInput.value = project.category || "";
            customCatInput.required = true;
        }
    }

    document.getElementById("projShortDesc").value = project.shortDescription || "";
    document.getElementById("projStatus").value = project.status || "published";
    document.getElementById("projFeatured").checked = !!project.featured;

    // Cover Image
    selectedCoverFile = null;
    existingCoverUrl = project.coverImageUrl || "";
    existingCoverPath = project.coverImagePath || "";
    document.getElementById("coverUrlInput").value = project.coverImageUrl || "";

    const previewContainer = document.getElementById("coverPreviewContainer");
    const previewImg = document.getElementById("coverPreviewImg");
    if (project.coverImageUrl) {
        previewImg.src = project.coverImageUrl;
        previewContainer.style.display = "block";
    } else {
        previewContainer.style.display = "none";
    }

    // Gallery Images
    existingGalleryImages = Array.isArray(project.galleryImages) ? [...project.galleryImages] : [];
    pendingGalleryFiles = [];
    renderGalleryPreviews();

    // Narrative & Deep-dive
    document.getElementById("projFullDesc").value = project.description || "";
    document.getElementById("projProblem").value = project.problemStatement || "";
    document.getElementById("projSolution").value = project.solution || "";

    // Dynamic Features
    const featContainer = document.getElementById("featuresListContainer");
    if (featContainer) {
        featContainer.innerHTML = "";
        let features = [];
        if (Array.isArray(project.features)) {
            features = project.features;
        } else if (typeof project.features === "string" && project.features.trim()) {
            features = project.features.split("\n").map(f => f.trim()).filter(Boolean);
        }

        if (features.length > 0) {
            features.forEach(f => addFeatureRow(f));
        } else {
            ensureAtLeastOneFeatureRow();
        }
    }

    document.getElementById("projOutcomes").value = project.outcomes || "";

    // Tech Stack & Team
    const techInput = document.getElementById("projTechInput");
    if (Array.isArray(project.technologies)) {
        techInput.value = project.technologies.join(", ");
    } else {
        techInput.value = project.technologies || "";
    }
    updateTechChipsPreview();

    const teamInput = document.getElementById("projTeamInput");
    if (Array.isArray(project.teamMembers)) {
        teamInput.value = project.teamMembers.join(", ");
    } else {
        teamInput.value = project.teamMembers || "";
    }

    // External Links
    document.getElementById("projGithub").value = project.githubUrl || "";
    document.getElementById("projDemo").value = project.demoUrl || "";
    document.getElementById("projDocs").value = project.documentationUrl || "";
    document.getElementById("projVideo").value = project.videoUrl || "";

    setFormIndicator("Editing project", "var(--text-faint)");

    // Show modal
    const modal = document.getElementById("projectFormModal");
    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
};

function closeModal() {
    const modal = document.getElementById("projectFormModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}

// -----------------------------------------------------------------
// 6. Cover & Gallery Images Handlers
// -----------------------------------------------------------------
function handleCoverFileSelection(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showAlert("error", "Selected file is not an image. Please select a PNG, JPG, or WEBP photo.");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showAlert("error", "Image size exceeds 10MB limit. Please upload an image under 10MB.");
        return;
    }

    selectedCoverFile = file;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const previewImg = document.getElementById("coverPreviewImg");
        const previewContainer = document.getElementById("coverPreviewContainer");
        previewImg.src = evt.target.result;
        previewContainer.style.display = "block";
        document.getElementById("coverUrlInput").value = "";
    };
    reader.readAsDataURL(file);
}

function applyDirectCoverUrl(url) {
    if (!url) {
        showAlert("error", "Please enter a valid image URL.");
        return;
    }
    selectedCoverFile = null;
    existingCoverUrl = url;
    const previewImg = document.getElementById("coverPreviewImg");
    const previewContainer = document.getElementById("coverPreviewContainer");
    previewImg.src = url;
    previewContainer.style.display = "block";
}

function removeCoverImage() {
    selectedCoverFile = null;
    existingCoverUrl = "";
    existingCoverPath = "";
    const fileInput = document.getElementById("coverFileInput");
    if (fileInput) fileInput.value = "";
    const urlInput = document.getElementById("coverUrlInput");
    if (urlInput) urlInput.value = "";
    const previewContainer = document.getElementById("coverPreviewContainer");
    if (previewContainer) previewContainer.style.display = "none";
}

function handleGalleryFilesSelection(files) {
    if (!files || files.length === 0) return;

    for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        if (f.size > 10 * 1024 * 1024) {
            showAlert("error", `File "${f.name}" exceeds 10MB and was skipped.`);
            continue;
        }
        pendingGalleryFiles.push(f);
    }
    renderGalleryPreviews();
}

function renderGalleryPreviews() {
    const strip = document.getElementById("galleryPreviewsStrip");
    if (!strip) return;

    let html = "";

    existingGalleryImages.forEach((img, idx) => {
        const url = typeof img === "string" ? img : (img.url || "");
        if (!url) return;
        html += `
            <div class="gallery-thumbnail-card">
                <img src="${escapeHtml(url)}" alt="Existing screenshot" onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80'">
                <button type="button" class="btn-remove-thumb" onclick="removeExistingGalleryImage(${idx})" title="Remove screenshot">&times;</button>
                <div class="gallery-thumb-tag">Saved</div>
            </div>
        `;
    });

    pendingGalleryFiles.forEach((file, idx) => {
        const tempUrl = URL.createObjectURL(file);
        html += `
            <div class="gallery-thumbnail-card" style="border-color:#10b981;">
                <img src="${tempUrl}" alt="Pending upload">
                <button type="button" class="btn-remove-thumb" onclick="removePendingGalleryFile(${idx})" title="Remove screenshot">&times;</button>
                <div class="gallery-thumb-tag" style="background:#10b981;">Pending</div>
            </div>
        `;
    });

    strip.innerHTML = html;
}

window.removeExistingGalleryImage = function(idx) {
    existingGalleryImages.splice(idx, 1);
    renderGalleryPreviews();
};

window.removePendingGalleryFile = function(idx) {
    pendingGalleryFiles.splice(idx, 1);
    renderGalleryPreviews();
};

// -----------------------------------------------------------------
// 7. Dynamic Feature Bullets & Tech Chips
// -----------------------------------------------------------------
function addFeatureRow(text = "") {
    const container = document.getElementById("featuresListContainer");
    if (!container) return;

    const row = document.createElement("div");
    row.className = "feature-item-row";
    row.innerHTML = `
        <input type="text" class="form-input feature-item-input" placeholder="e.g. Sub-50ms inference latency running directly on-device without internet" value="${escapeHtml(text)}">
        <button type="button" class="btn-remove-row" onclick="removeFeatureRow(this)" title="Remove item">&times;</button>
    `;
    container.appendChild(row);

    const input = row.querySelector("input");
    if (input && !text) input.focus();
}

window.removeFeatureRow = function(btn) {
    const row = btn.closest(".feature-item-row");
    if (!row) return;

    const container = document.getElementById("featuresListContainer");
    if (container.children.length > 1) {
        row.remove();
    } else {
        const input = row.querySelector("input");
        if (input) input.value = "";
    }
};

function ensureAtLeastOneFeatureRow() {
    const container = document.getElementById("featuresListContainer");
    if (container && container.children.length === 0) {
        addFeatureRow("");
    }
}

function updateTechChipsPreview() {
    const input = document.getElementById("projTechInput");
    const container = document.getElementById("techChipsPreview");
    if (!input || !container) return;

    const raw = input.value;
    const tags = raw.split(",").map(t => t.trim()).filter(Boolean);

    if (tags.length === 0) {
        container.innerHTML = `<span style="font-size:0.75rem; color:var(--text-faint); font-family:var(--font-mono); opacity:0.6;">Chips preview will appear here as you type...</span>`;
        return;
    }

    container.innerHTML = tags.map(tag => `
        <span class="tech-chip">
            <span>${escapeHtml(tag)}</span>
        </span>
    `).join("");
}

// -----------------------------------------------------------------
// 8. Storage Upload & Resilient Compression
// -----------------------------------------------------------------
async function uploadToStorage(file, folderPath) {
    // 1. Try Native Firebase Storage API
    try {
        if (firebase.storage && typeof firebase.storage === "function") {
            const storageRef = firebase.storage().ref();
            const cleanName = (file.name || "img.webp").replace(/[^a-zA-Z0-9.-]/g, "_");
            const fullPath = `${folderPath}/${Date.now()}_${cleanName}`;
            const fileRef = storageRef.child(fullPath);

            const uploadTask = fileRef.put(file);
            const snapshot = await uploadTask;
            const downloadUrl = await snapshot.ref.getDownloadURL();
            return { url: downloadUrl, path: fullPath };
        }
    } catch (err) {
        console.warn("Storage API notice (switching to resilient compressed fallback):", err);
    }

    // 2. High-efficiency local dataURL compression fallback (< 120KB webp)
    const dataUrl = await compressImageToDataUrl(file, 1200, 0.82);
    return { url: dataUrl, path: "" };
}

function compressImageToDataUrl(file, maxWidth = 1200, quality = 0.82) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let w = img.naturalWidth || img.width;
                let h = img.naturalHeight || img.height;
                if (w > maxWidth) {
                    h = Math.round((h * maxWidth) / w);
                    w = maxWidth;
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/webp", quality));
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve("https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80");
        reader.readAsDataURL(file);
    });
}

// -----------------------------------------------------------------
// 9. Form Submission (Create or Update)
// -----------------------------------------------------------------
async function submitProjectForm(targetStatus = "published") {
    const btnSubmit = document.getElementById("btnSubmitProject");
    const btnDraft = document.getElementById("btnSaveDraft");

    const title = document.getElementById("projTitle").value.trim();
    let category = document.getElementById("projCategory").value;
    if (category === "Other") {
        const customVal = document.getElementById("projCustomCategory")?.value.trim();
        category = customVal || "Other Innovations";
    }

    const shortDescription = document.getElementById("projShortDesc").value.trim();
    const featured = document.getElementById("projFeatured").checked;

    if (!title) {
        showAlert("error", "Project Title is required.");
        document.getElementById("projTitle").focus();
        return;
    }

    if (!shortDescription) {
        showAlert("error", "Short Summary / Tagline is required.");
        document.getElementById("projShortDesc").focus();
        return;
    }

    const directCoverUrl = document.getElementById("coverUrlInput").value.trim();
    const hasCover = selectedCoverFile || directCoverUrl || existingCoverUrl;
    if (!hasCover) {
        showAlert("error", "Please provide a primary cover image (either upload a file or specify an image URL).");
        document.getElementById("coverDropzone").scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    btnSubmit.disabled = true;
    btnDraft.disabled = true;
    setFormIndicator("Uploading assets & writing to Cloud...", "var(--accent, #C76B3C)");

    try {
        const stableId = editingDocId || ("proj_" + Date.now());

        // Process Cover Image
        let coverImageUrl = directCoverUrl || existingCoverUrl;
        let coverImagePath = existingCoverPath;

        if (selectedCoverFile) {
            setFormIndicator("Uploading primary cover photo...", "var(--accent-light, #F09D6B)");
            const coverRes = await uploadToStorage(selectedCoverFile, `projects/${stableId}/cover`);
            coverImageUrl = coverRes.url;
            coverImagePath = coverRes.path;
        }

        if (!coverImageUrl) {
            coverImageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";
        }

        // Process Gallery Images
        let finalGalleryImages = [...existingGalleryImages];
        if (pendingGalleryFiles.length > 0) {
            setFormIndicator(`Uploading ${pendingGalleryFiles.length} gallery screenshots...`, "var(--accent-light, #F09D6B)");
            for (let i = 0; i < pendingGalleryFiles.length; i++) {
                const gFile = pendingGalleryFiles[i];
                const gRes = await uploadToStorage(gFile, `projects/${stableId}/gallery`);
                finalGalleryImages.push({ url: gRes.url, path: gRes.path });
            }
        }

        // Deep-dive fields
        const description = document.getElementById("projFullDesc").value.trim();
        const problemStatement = document.getElementById("projProblem").value.trim();
        const solution = document.getElementById("projSolution").value.trim();
        const outcomes = document.getElementById("projOutcomes").value.trim();

        // Features Array
        const featureInputs = document.querySelectorAll(".feature-item-input");
        const features = Array.from(featureInputs)
            .map(input => input.value.trim())
            .filter(Boolean);

        // Tech Stack Array
        const techRaw = document.getElementById("projTechInput").value;
        const technologies = techRaw.split(",").map(t => t.trim()).filter(Boolean);

        // Contributors Array
        const teamRaw = document.getElementById("projTeamInput").value;
        const teamMembers = teamRaw.split(",").map(m => m.trim()).filter(Boolean);

        // Repositories & External Links
        const githubUrl = document.getElementById("projGithub").value.trim();
        const demoUrl = document.getElementById("projDemo").value.trim();
        const documentationUrl = document.getElementById("projDocs").value.trim();
        const videoUrl = document.getElementById("projVideo").value.trim();

        const payload = {
            title,
            category,
            shortDescription,
            description,
            problemStatement,
            solution,
            features,
            technologies,
            teamMembers,
            githubUrl,
            demoUrl,
            documentationUrl,
            videoUrl,
            outcomes,
            status: targetStatus,
            featured,
            coverImageUrl,
            coverImagePath,
            galleryImages: finalGalleryImages,
            updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
        };

        if (targetStatus === "published") {
            payload.publishedAt = firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
        }

        let savedDocId = editingDocId;

        if (editingDocId) {
            // Update Existing Doc
            if (window.CMS && typeof CMS.saveDoc === "function") {
                await CMS.saveDoc("projects", editingDocId, payload);
            } else if (window.db) {
                await db.collection("projects").doc(editingDocId).set(payload, { merge: true });
            }

            // Update in-memory list
            const idx = projectsList.findIndex(p => p.id === editingDocId);
            if (idx >= 0) {
                projectsList[idx] = { ...projectsList[idx], ...payload, id: editingDocId };
            }
        } else {
            // Create New Doc
            payload.createdAt = firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
            payload.displayOrder = projectsList.length + 1;

            if (window.CMS && typeof CMS.saveDoc === "function") {
                savedDocId = await CMS.saveDoc("projects", null, payload);
            } else if (window.db) {
                const newDocRef = await db.collection("projects").add(payload);
                savedDocId = newDocRef.id;
            }

            projectsList.unshift({ id: savedDocId, ...payload });
        }

        // Record Audit Log
        if (window.CMS && typeof CMS.logAudit === "function") {
            await CMS.logAudit(
                editingDocId ? "UPDATE" : "CREATE",
                "projects",
                savedDocId,
                `${editingDocId ? "Updated" : "Uploaded"} project "${title}" with status [${targetStatus}]`
            );
        }

        updateStats();
        renderProjectsTable();
        closeModal();

        if (window.showToast) {
            showToast(`Project "${title}" successfully saved!`, "success");
        } else {
            showAlert("success", `Project "${title}" successfully saved!`);
        }

    } catch (err) {
        console.error("Error saving project:", err);
        showAlert("error", "Error saving project: " + err.message);
        setFormIndicator("Failed to save", "#ef4444");
    } finally {
        btnSubmit.disabled = false;
        btnDraft.disabled = false;
    }
}

// -----------------------------------------------------------------
// 10. Quick Actions (Toggle Publish, Archive, Delete)
// -----------------------------------------------------------------
window.togglePublish = async function(id, currentStatus) {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    try {
        const payload = {
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
        };
        if (newStatus === "published") {
            payload.publishedAt = firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
        }

        await db.collection("projects").doc(id).set(payload, { merge: true });

        const p = projectsList.find(item => item.id === id);
        if (p) p.status = newStatus;

        if (window.CMS && typeof CMS.logAudit === "function") {
            await CMS.logAudit("UPDATE", "projects", id, `Changed project status to [${newStatus}]`);
        }

        updateStats();
        renderProjectsTable();
        if (window.showToast) showToast(`Project status changed to ${newStatus}.`, "info");
    } catch (err) {
        console.error("Error toggling publish status:", err);
        alert("Failed to update status: " + err.message);
    }
};

window.toggleArchive = async function(id, currentStatus) {
    const newStatus = currentStatus === "archived" ? "draft" : "archived";
    try {
        const payload = {
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
        };

        await db.collection("projects").doc(id).set(payload, { merge: true });

        const p = projectsList.find(item => item.id === id);
        if (p) p.status = newStatus;

        if (window.CMS && typeof CMS.logAudit === "function") {
            await CMS.logAudit("UPDATE", "projects", id, `Changed project status to [${newStatus}]`);
        }

        updateStats();
        renderProjectsTable();
        if (window.showToast) showToast(`Project status updated to ${newStatus}.`, "info");
    } catch (err) {
        console.error("Error toggling archive status:", err);
        alert("Failed to archive project: " + err.message);
    }
};

window.deleteProject = async function(id, title) {
    const confirmed = confirm(`Are you sure you want to permanently delete "${title}"?\n\nThis will remove the project from both the admin management console and the public website.`);
    if (!confirmed) return;

    try {
        await db.collection("projects").doc(id).delete();

        if (window.CMS && typeof CMS.logAudit === "function") {
            await CMS.logAudit("DELETE", "projects", id, `Deleted project "${title}"`);
        }

        projectsList = projectsList.filter(p => p.id !== id);
        updateStats();
        renderProjectsTable();

        if (window.showToast) showToast(`Project "${title}" was deleted.`, "warning");
    } catch (err) {
        console.error("Error deleting project:", err);
        alert("Failed to delete project: " + err.message);
    }
};

async function seedDefaultProjects() {
    const confirmed = confirm("Seed 6 standard VVISC student innovations into Cloud Firestore?\n\nExisting projects will NOT be overwritten.");
    if (!confirmed) return;

    try {
        let addedCount = 0;
        for (const item of DEFAULT_SEED_PROJECTS) {
            const exists = projectsList.some(p => p.title.toLowerCase() === item.title.toLowerCase());
            if (!exists) {
                const docRef = await db.collection("projects").add({
                    ...item,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    publishedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                projectsList.push({ id: docRef.id, ...item });
                addedCount++;
            }
        }

        updateStats();
        renderProjectsTable();
        if (window.showToast) showToast(`Seeded ${addedCount} sample projects into Firestore!`, "success");
    } catch (err) {
        console.error("Error seeding projects:", err);
        alert("Failed to seed projects: " + err.message);
    }
}

// -----------------------------------------------------------------
// 11. URL Parameters Handling (?action=add or ?id=PROJECT_ID)
// -----------------------------------------------------------------
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");
    const editId = urlParams.get("id");

    if (action === "add" || action === "upload") {
        setTimeout(openAddModal, 200);
    } else if (editId) {
        setTimeout(() => editProject(editId), 300);
    }
}

// -----------------------------------------------------------------
// 12. UI Feedback Helpers
// -----------------------------------------------------------------
function setFormIndicator(text, color) {
    const el = document.getElementById("formStatusIndicator");
    if (el) {
        el.textContent = text;
        if (color) el.style.color = color;
    }
}

function showAlert(type, message) {
    const alertBox = document.getElementById("statusAlert");
    if (!alertBox) {
        alert(message);
        return;
    }

    alertBox.style.display = "flex";
    if (type === "error") {
        alertBox.style.background = "rgba(239, 68, 68, 0.15)";
        alertBox.style.border = "1px solid rgba(239, 68, 68, 0.4)";
        alertBox.style.color = "#f87171";
        alertBox.innerHTML = `<span>⚠️ ${escapeHtml(message)}</span>`;
    } else {
        alertBox.style.background = "rgba(16, 185, 129, 0.15)";
        alertBox.style.border = "1px solid rgba(16, 185, 129, 0.4)";
        alertBox.style.color = "#34d399";
        alertBox.innerHTML = `<span>✓ ${escapeHtml(message)}</span>`;
    }

    alertBox.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
