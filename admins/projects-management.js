// ===============================================================
// VVISC IUCEE - Technical Projects Management System
// Admin Dashboard Controller & Firebase Integration
// ===============================================================

let projectsList = [];
let editingGalleryImages = []; // Stores existing or added gallery image objects { url, path }
let selectedCoverFile = null;
let selectedGalleryFiles = [];

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
    initEventListeners();
    await loadProjects();
});

function initEventListeners() {
    // Search & Filter Listeners
    const searchInput = document.getElementById("adminSearchInput");
    const catFilter = document.getElementById("adminCategoryFilter");
    const statusFilter = document.getElementById("adminStatusFilter");

    if (searchInput) searchInput.addEventListener("input", renderProjectsTable);
    if (catFilter) catFilter.addEventListener("change", renderProjectsTable);
    if (statusFilter) statusFilter.addEventListener("change", renderProjectsTable);

    // Add Project Button -> Redirect to dedicated upload page
    const btnAdd = document.getElementById("btnAddNewProject");
    if (btnAdd) {
        btnAdd.addEventListener("click", function(e) {
            // Default link navigation to project-upload.html
        });
    }

    // Seed Button
    const btnSeed = document.getElementById("btnSeedProjects");
    if (btnSeed) btnSeed.addEventListener("click", seedDefaultProjects);

    // Modal Close & Cancel
    const modalClose = document.getElementById("modalCloseBtn");
    const btnCancel = document.getElementById("btnCancelModal");
    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (btnCancel) btnCancel.addEventListener("click", closeModal);

    // Custom Category Toggle
    const catSelect = document.getElementById("projInputCategory");
    const customCatField = document.getElementById("customCategoryField");
    if (catSelect && customCatField) {
        catSelect.addEventListener("change", function() {
            if (this.value === "Other") {
                customCatField.style.display = "block";
            } else {
                customCatField.style.display = "none";
            }
        });
    }

    // Cover Image File Selection & Preview
    const coverFileInput = document.getElementById("coverImageFile");
    const coverUrlInput = document.getElementById("coverImageUrl");
    const coverPreviewContainer = document.getElementById("coverPreviewContainer");
    const coverPreviewImg = document.getElementById("coverPreviewImg");

    if (coverFileInput) {
        coverFileInput.addEventListener("change", function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    alert("Selected file exceeds 10MB limit. Please select a smaller image.");
                    this.value = "";
                    return;
                }
                selectedCoverFile = file;
                const reader = new FileReader();
                reader.onload = function(evt) {
                    coverPreviewImg.src = evt.target.result;
                    coverPreviewContainer.style.display = "block";
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (coverUrlInput) {
        coverUrlInput.addEventListener("input", function(e) {
            const val = e.target.value.trim();
            if (val && !selectedCoverFile) {
                coverPreviewImg.src = val;
                coverPreviewContainer.style.display = "block";
            }
        });
    }

    // Gallery Files Selection
    const galleryFilesInput = document.getElementById("galleryFiles");
    if (galleryFilesInput) {
        galleryFilesInput.addEventListener("change", function(e) {
            const files = Array.from(e.target.files);
            selectedGalleryFiles.push(...files);
            renderGalleryPreviews();
        });
    }

    // Save as Draft Button in Form
    const btnDraft = document.getElementById("btnSaveDraft");
    if (btnDraft) {
        btnDraft.addEventListener("click", function(e) {
            e.preventDefault();
            document.getElementById("projInputStatus").value = "draft";
            handleProjectSubmit(e);
        });
    }

    // Form Submit
    const form = document.getElementById("projectForm");
    if (form) form.addEventListener("submit", handleProjectSubmit);
}

// -----------------------------------------------------------------
// Data Loading & Live Sync
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

        // Auto-seed if empty
        if (list.length === 0) {
            console.log("No projects found in database. Initializing seed data...");
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
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#ef4444;">Error accessing Firestore: ${escapeHtml(err.message)}</td></tr>`;
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

    if (totalEl) totalEl.textContent = total;
    if (pubEl) pubEl.textContent = pub;
    if (draftEl) draftEl.textContent = draft;
    if (archEl) archEl.textContent = arch;
}

// -----------------------------------------------------------------
// Table Rendering & Filters
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
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:35px; color:var(--text-color); opacity:0.7;">No projects match your filter criteria. Click "+ Add Project" to create one.</td></tr>`;
        return;
    }

    let html = "";
    filtered.forEach(p => {
        const coverImg = p.coverImageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80";
        
        let statusBadge = `<span class="proj-badge-pub">Published</span>`;
        if (p.status === "draft") {
            statusBadge = `<span class="proj-badge-draft">Draft</span>`;
        } else if (p.status === "archived") {
            statusBadge = `<span class="proj-badge-archived">Archived</span>`;
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
                    <div style="font-weight:600; color:var(--heading-color);">${escapeHtml(p.title)}</div>
                    <div style="font-size:0.78rem; color:var(--color-gold-highlight); font-family:var(--font-mono);">${escapeHtml(p.category || "General")}</div>
                </td>
                <td>
                    <div style="display:flex; flex-wrap:wrap; gap:4px; max-width:240px;">
                        ${techList.slice(0, 3).map(t => `<span style="background:rgba(197,168,128,0.1); border:1px solid rgba(197,168,128,0.25); color:var(--color-gold-accent); padding:2px 8px; border-radius:4px; font-size:0.75rem; font-family:var(--font-mono);">${escapeHtml(t)}</span>`).join("")}
                        ${techList.length > 3 ? `<span style="font-size:0.75rem; opacity:0.7;">+${techList.length - 3}</span>` : ""}
                    </div>
                </td>
                <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(authors)}">
                    ${escapeHtml(authors)}
                </td>
                <td>${statusBadge}</td>
                <td style="font-family:var(--font-mono); font-size:0.8rem; opacity:0.8;">${escapeHtml(dateStr)}</td>
                <td style="text-align:right; white-space:nowrap;">
                    <button class="secondary-btn" style="padding:6px 12px; font-size:0.8rem; margin-right:4px;" onclick="editProject('${escapeHtml(p.id)}')">✏️ Edit</button>
                    <button class="secondary-btn" style="padding:6px 10px; font-size:0.8rem; margin-right:4px;" onclick="togglePublish('${escapeHtml(p.id)}', '${escapeHtml(p.status || "published")}')" title="Quick toggle between published and draft">${p.status === "draft" ? "🚀 Publish" : "📝 Draft"}</button>
                    <a href="../project-details.html?id=${encodeURIComponent(p.id)}" target="_blank" class="secondary-btn" style="padding:6px 10px; font-size:0.8rem; text-decoration:none; margin-right:4px;" title="Preview project details in new tab">🔗</a>
                    <button class="secondary-btn" style="padding:6px 10px; font-size:0.8rem; color:#ef4444; border-color:rgba(239,68,68,0.3);" onclick="deleteProject('${escapeHtml(p.id)}', '${escapeHtml(p.title.replace(/'/g, "\\'"))}')" title="Delete innovation permanently">🗑️</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// -----------------------------------------------------------------
// Modal & Form Controller
// -----------------------------------------------------------------
function openAddModal() {
    document.getElementById("projectForm").reset();
    document.getElementById("editDocId").value = "";
    document.getElementById("modalTitle").textContent = "Add New Innovation Project";
    document.getElementById("btnSubmitProject").textContent = "Publish Project";
    document.getElementById("projInputStatus").value = "published";
    document.getElementById("coverPreviewContainer").style.display = "none";
    document.getElementById("customCategoryField").style.display = "none";
    
    selectedCoverFile = null;
    selectedGalleryFiles = [];
    editingGalleryImages = [];
    renderGalleryPreviews();

    document.getElementById("projectModal").classList.add("active");
    document.body.style.overflow = "hidden";
}

window.editProject = function(id) {
    window.location.href = `project-upload.html?id=${encodeURIComponent(id)}`;
};

function closeModal() {
    document.getElementById("projectModal").classList.remove("active");
    document.body.style.overflow = "";
}

function renderGalleryPreviews() {
    const strip = document.getElementById("galleryPreviewsStrip");
    if (!strip) return;

    let html = "";
    
    // Existing stored images
    editingGalleryImages.forEach((img, idx) => {
        const url = typeof img === "string" ? img : img.url;
        html += `
            <div class="gallery-preview-pill">
                <img src="${escapeHtml(url)}" alt="Existing image">
                <button type="button" class="gallery-preview-remove" onclick="removeExistingGalleryImage(${idx})">&times;</button>
            </div>
        `;
    });

    // Newly selected pending files
    selectedGalleryFiles.forEach((file, idx) => {
        const tempUrl = URL.createObjectURL(file);
        html += `
            <div class="gallery-preview-pill" style="border-color:#10b981;">
                <img src="${tempUrl}" alt="Pending upload">
                <button type="button" class="gallery-preview-remove" onclick="removePendingGalleryFile(${idx})">&times;</button>
            </div>
        `;
    });

    strip.innerHTML = html;
}

window.removeExistingGalleryImage = function(idx) {
    editingGalleryImages.splice(idx, 1);
    renderGalleryPreviews();
};

window.removePendingGalleryFile = function(idx) {
    selectedGalleryFiles.splice(idx, 1);
    renderGalleryPreviews();
};

// -----------------------------------------------------------------
// Storage Upload Utilities (projects/ID/cover & projects/ID/gallery)
// -----------------------------------------------------------------
async function uploadToStorage(file, folderPath) {
    // 1. Try Firebase Storage API
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
        console.warn("Storage API notice (switching to resilient fallback):", err);
    }

    // 2. High-efficiency local dataURL compression fallback
    const dataUrl = await compressImageToDataUrl(file);
    return { url: dataUrl, path: "" };
}

function compressImageToDataUrl(file, maxWidth = 1200, quality = 0.82) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let w = img.width;
                let h = img.height;
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
// Project Form Submission (Create or Update)
// -----------------------------------------------------------------
async function handleProjectSubmit(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById("btnSubmitProject");
    const originalText = btnSubmit.textContent;
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Saving to Cloud...";

    try {
        const docId = document.getElementById("editDocId").value.trim();
        const title = document.getElementById("projInputTitle").value.trim();
        
        let category = document.getElementById("projInputCategory").value;
        if (category === "Other") {
            const customVal = document.getElementById("projInputCustomCat").value.trim();
            category = customVal || "Other Innovations";
        }

        const shortDescription = document.getElementById("projInputShortDesc").value.trim();
        const description = document.getElementById("projInputFullDesc").value.trim();
        const problemStatement = document.getElementById("projInputProblem").value.trim();
        const solution = document.getElementById("projInputSolution").value.trim();
        
        const featuresRaw = document.getElementById("projInputFeatures").value;
        const features = featuresRaw.split("\n").map(f => f.trim()).filter(Boolean);

        const techRaw = document.getElementById("projInputTech").value;
        const technologies = techRaw.split(",").map(t => t.trim()).filter(Boolean);

        const teamRaw = document.getElementById("projInputTeam").value;
        const teamMembers = teamRaw.split(",").map(m => m.trim()).filter(Boolean);

        const githubUrl = document.getElementById("projInputGithub").value.trim();
        const demoUrl = document.getElementById("projInputDemo").value.trim();
        const documentationUrl = document.getElementById("projInputDocs").value.trim();
        const videoUrl = document.getElementById("projInputVideo").value.trim();
        const outcomes = document.getElementById("projInOutcomes").value.trim();
        const status = document.getElementById("projInputStatus").value;
        const featured = document.getElementById("projInputFeatured").checked;

        // Target target ID for Storage folder
        const stableId = docId || ("proj_" + Date.now());

        // Cover Image Handling
        let coverImageUrl = document.getElementById("coverImageUrl").value.trim();
        let coverImagePath = "";

        if (selectedCoverFile) {
            btnSubmit.textContent = "Uploading Cover Image...";
            const res = await uploadToStorage(selectedCoverFile, `projects/${stableId}/cover`);
            coverImageUrl = res.url;
            coverImagePath = res.path;
        }

        if (!coverImageUrl) {
            coverImageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";
        }

        // Gallery Images Handling
        let finalGalleryImages = [...editingGalleryImages];
        if (selectedGalleryFiles.length > 0) {
            btnSubmit.textContent = `Uploading ${selectedGalleryFiles.length} Gallery Files...`;
            for (const gFile of selectedGalleryFiles) {
                const gRes = await uploadToStorage(gFile, `projects/${stableId}/gallery`);
                finalGalleryImages.push({ url: gRes.url, path: gRes.path });
            }
        }

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
            status,
            featured,
            coverImageUrl,
            coverImagePath,
            galleryImages: finalGalleryImages,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (status === "published") {
            payload.publishedAt = firebase.firestore.FieldValue.serverTimestamp();
        }

        if (docId) {
            // Update existing
            await db.collection("projects").doc(docId).set(payload, { merge: true });
            if (window.CMS && typeof CMS.logAction === "function") {
                await CMS.logAction("projects", docId, "UPDATE", `Updated project: ${title} (${status})`);
            }
        } else {
            // Create new
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            payload.displayOrder = projectsList.length + 1;
            const newRef = await db.collection("projects").add(payload);
            if (window.CMS && typeof CMS.logAction === "function") {
                await CMS.logAction("projects", newRef.id, "CREATE", `Created new project: ${title} (${status})`);
            }
        }

        closeModal();
        await loadProjects();
        alert(docId ? "Project updated successfully!" : "New innovation project published!");
    } catch (err) {
        console.error("Error saving project:", err);
        alert("Failed to save project: " + err.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = originalText;
    }
}

// -----------------------------------------------------------------
// Quick Status Toggle & Archive
// -----------------------------------------------------------------
window.togglePublish = async function(id, currentStatus) {
    try {
        const nextStatus = (currentStatus === "published") ? "draft" : "published";
        const updateData = {
            status: nextStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (nextStatus === "published") {
            updateData.publishedAt = firebase.firestore.FieldValue.serverTimestamp();
        }

        await db.collection("projects").doc(id).update(updateData);
        if (window.CMS && typeof CMS.logAction === "function") {
            await CMS.logAction("projects", id, "STATUS_CHANGE", `Toggled project status to: ${nextStatus}`);
        }
        await loadProjects();
    } catch (err) {
        console.error("Error toggling status:", err);
        alert("Failed to change status: " + err.message);
    }
};

// -----------------------------------------------------------------
// Delete Project & Clean up Storage Images
// -----------------------------------------------------------------
window.deleteProject = async function(id, title) {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?\nAll engineering descriptions, specs, and storage files will be removed.`)) {
        return;
    }

    try {
        const project = projectsList.find(p => p.id === id);
        
        // Clean up Storage cover image if stored as storage path
        if (project && project.coverImagePath && firebase.storage) {
            try {
                await firebase.storage().ref().child(project.coverImagePath).delete();
            } catch (ignore) {}
        }

        // Clean up Storage gallery images
        if (project && Array.isArray(project.galleryImages) && firebase.storage) {
            for (const img of project.galleryImages) {
                if (img.path) {
                    try {
                        await firebase.storage().ref().child(img.path).delete();
                    } catch (ignore) {}
                }
            }
        }

        // Delete Firestore Record
        await db.collection("projects").doc(id).delete();
        if (window.CMS && typeof CMS.logAction === "function") {
            await CMS.logAction("projects", id, "DELETE", `Deleted project: ${title}`);
        }

        await loadProjects();
        alert(`"${title}" has been permanently deleted.`);
    } catch (err) {
        console.error("Error deleting project:", err);
        alert("Failed to delete project: " + err.message);
    }
};

// -----------------------------------------------------------------
// Seed Initial Curated Innovations
// -----------------------------------------------------------------
async function seedDefaultProjects() {
    if (!confirm("This will add the 6 curated VVISC innovation projects (AI Crop Diagnostic, Drone Mesh, IoT Microgrid, CampusHub, SentinelShield, and Warehouse Rover) to Cloud Firestore. Proceed?")) {
        return;
    }

    try {
        for (const item of DEFAULT_SEED_PROJECTS) {
            await db.collection("projects").add({
                ...item,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                publishedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        if (window.CMS && typeof CMS.logAction === "function") {
            await CMS.logAction("projects", "seed", "SEED", "Seeded 6 default innovation prototypes into Firestore");
        }
        await loadProjects();
        alert("Successfully seeded 6 innovation projects!");
    } catch (err) {
        console.error("Error seeding projects:", err);
        alert("Failed to seed projects: " + err.message);
    }
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
