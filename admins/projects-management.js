// =========================================================
// Technical Projects Management — Real-time Firestore Sync
// =========================================================

let projectsList = [];
let unsubscribeProjects = null;

const DEFAULT_PROJECTS = [
    {
        title: "Autonomous Campus Delivery Rover",
        departmentId: "rnd",
        departmentName: "Research & Development",
        status: "Featured",
        year: "2025-26",
        shortDescription: "Self-navigating GPS & LiDAR delivery rover designed to transport materials between lab blocks.",
        description: "The Autonomous Campus Delivery Rover utilizes ROS2, SLAM algorithms, and depth cameras for real-time obstacle avoidance and path planning across campus corridors. Engineered by the R&D hardware division.",
        technologies: "ROS2, Python, LiDAR, C++, Raspberry Pi",
        teamMembers: "Harshitha Ch, Naveen R, Team R&D",
        githubUrl: "https://github.com/vvisc",
        demoUrl: "#",
        imageUrl: "assets/4.png",
        featured: true,
        active: true,
        displayOrder: 1
    },
    {
        title: "VVISC Central Cloud Portal & CMS",
        departmentId: "digital",
        departmentName: "Digital Infrastructure",
        status: "Completed",
        year: "2025-26",
        shortDescription: "High-performance dynamic web architecture and role-secured admin portal for chapter operations.",
        description: "Modern, lightweight, edge-optimized platform providing complete dynamic CMS controls, real-time Firestore synchronization, audit trails, and student registration pipelines.",
        technologies: "HTML5, Vanilla JS, Firebase Firestore, Cloud Storage",
        teamMembers: "Rajavardhan P, Tech Leads",
        githubUrl: "https://github.com/vvisc",
        demoUrl: "https://vvisc-iucee.web.app",
        imageUrl: "assets/1.png",
        featured: true,
        active: true,
        displayOrder: 2
    },
    {
        title: "Smart Campus Energy Monitoring Grid",
        departmentId: "rnd",
        departmentName: "Research & Development",
        status: "Ongoing",
        year: "2025-26",
        shortDescription: "IoT sensor grid tracking power consumption across college laboratories in real-time.",
        description: "Custom ESP32 microcontrollers deployed across engineering blocks stream wattage, voltage fluctuation, and temperature telemetry to an analytics dashboard to minimize carbon footprint.",
        technologies: "ESP32, MQTT, Node.js, TimescaleDB, Chart.js",
        teamMembers: "Student Innovators, Faculty Advisors",
        githubUrl: "https://github.com/vvisc",
        demoUrl: "#",
        imageUrl: "assets/2.png",
        featured: false,
        active: true,
        displayOrder: 3
    }
];

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("content_editor");
    setupEventListeners();
    await loadProjects();
    initRealtimeProjects();
});

function setupEventListeners() {
    const addBtn = document.getElementById("addProjectBtn");
    const closeBtn = document.getElementById("closeProjectModalBtn");
    const cancelBtn = document.getElementById("cancelProjectBtn");
    const form = document.getElementById("projectForm");
    const fileInput = document.getElementById("projectImageFile");
    const searchInput = document.getElementById("searchProject");
    const deptFilter = document.getElementById("filterDepartment");
    const statusFilter = document.getElementById("filterStatus");

    if (addBtn) addBtn.onclick = () => openProjectModal();
    if (closeBtn) closeBtn.onclick = closeProjectModal;
    if (cancelBtn) cancelBtn.onclick = closeProjectModal;

    if (searchInput) searchInput.addEventListener("input", renderProjects);
    if (deptFilter) deptFilter.addEventListener("change", renderProjects);
    if (statusFilter) statusFilter.addEventListener("change", renderProjects);

    if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            showToast("Uploading project image...");
            try {
                const url = await CMS.uploadImage(file, "projects");
                if (url) {
                    document.getElementById("projectImageUrl").value = url;
                    showToast("Cover photo uploaded!");
                }
            } catch (err) {
                showToast("Upload failed: " + err.message, "error");
            }
        });
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            await saveProject();
        };
    }
}

async function loadProjects() {
    try {
        let list = await CMS.getCollection("projects", { orderBy: "displayOrder", orderDirection: "asc" });
        if (!list || list.length === 0) {
            // Seed defaults
            console.log("Seeding initial projects dataset...");
            for (const p of DEFAULT_PROJECTS) {
                await CMS.saveDoc("projects", null, p);
            }
            list = await CMS.getCollection("projects", { orderBy: "displayOrder", orderDirection: "asc" });
        }
        projectsList = list;
        updateStats();
        renderProjects();
    } catch (err) {
        console.error("Error loading projects:", err);
    }
}

function initRealtimeProjects() {
    if (typeof db === "undefined") return;
    try {
        if (unsubscribeProjects) unsubscribeProjects();
        unsubscribeProjects = db.collection("projects").onSnapshot((snapshot) => {
            if (snapshot.empty) return;
            const liveList = [];
            snapshot.forEach(doc => liveList.push({ id: doc.id, ...doc.data() }));
            liveList.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));
            projectsList = liveList;
            try {
                localStorage.setItem("vvisc_col_projects", JSON.stringify(liveList));
            } catch (e) {}
            updateStats();
            renderProjects();
        }, (err) => {
            console.warn("Real-time projects notice:", err);
        });
    } catch (e) {}
}

function updateStats() {
    const totalEl = document.getElementById("totalProjectsCount");
    const featEl = document.getElementById("featuredProjectsCount");
    const activeEl = document.getElementById("activeProjectsCount");

    if (totalEl) totalEl.textContent = projectsList.length;
    if (featEl) featEl.textContent = projectsList.filter(p => p.featured === true).length;
    if (activeEl) activeEl.textContent = projectsList.filter(p => p.active !== false).length;
}

function renderProjects() {
    const grid = document.getElementById("projectsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const searchVal = (document.getElementById("searchProject")?.value || "").toLowerCase().trim();
    const deptVal = document.getElementById("filterDepartment")?.value || "all";
    const statusVal = document.getElementById("filterStatus")?.value || "all";

    const filtered = projectsList.filter(p => {
        if (deptVal !== "all" && p.departmentId !== deptVal) return false;
        if (statusVal !== "all" && p.status !== statusVal) return false;
        if (searchVal) {
            const t = (p.title || "").toLowerCase();
            const d = (p.description || "").toLowerCase();
            const tech = (p.technologies || "").toLowerCase();
            const team = (p.teamMembers || "").toLowerCase();
            if (!t.includes(searchVal) && !d.includes(searchVal) && !tech.includes(searchVal) && !team.includes(searchVal)) {
                return false;
            }
        }
        return true;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="card" style="grid-column:1/-1; padding:35px; text-align:center; color:var(--text-secondary);">No projects match your filter criteria. Click "+ Add Project" to create one.</div>`;
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "padding:20px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden;";

        const imgUrl = getAdminImgSrc(p.imageUrl || "assets/1.png");
        const status = p.status || "Completed";
        let statusBadge = `<span style="font-size:0.75rem; padding:2px 8px; border-radius:12px; background:rgba(46,204,113,0.15); color:#2ecc71; font-weight:600;">${escapeHtml(status)}</span>`;
        if (status === "Ongoing") {
            statusBadge = `<span style="font-size:0.75rem; padding:2px 8px; border-radius:12px; background:rgba(52,152,219,0.15); color:#3498db; font-weight:600;">Ongoing</span>`;
        } else if (status === "Featured") {
            statusBadge = `<span style="font-size:0.75rem; padding:2px 8px; border-radius:12px; background:rgba(230,126,34,0.15); color:#e67e22; font-weight:600;">Featured</span>`;
        }

        const techTags = (p.technologies || "").split(",").map(t => t.trim()).filter(Boolean).slice(0, 3)
            .map(t => `<span style="font-size:0.72rem; padding:2px 6px; border-radius:4px; background:var(--input-bg); border:1px solid var(--border-color);">${escapeHtml(t)}</span>`).join(" ");

        card.innerHTML = `
            <div>
                <div style="height:140px; border-radius:8px; overflow:hidden; margin-bottom:14px; position:relative; background:#111;">
                    <img src="${imgUrl}" alt="${escapeHtml(p.title)}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='../assets/1.png';">
                    ${p.featured ? `<span style="position:absolute; top:8px; right:8px; font-size:0.7rem; font-weight:700; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); color:var(--accent-color); padding:3px 8px; border-radius:6px; border:1px solid var(--accent-color);">★ Spotlight</span>` : ""}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:0.75rem; color:var(--accent-color); font-weight:700; text-transform:uppercase;">${escapeHtml(p.departmentName || p.departmentId || "Tech")}</span>
                    ${statusBadge}
                </div>

                <h3 style="font-size:1.1rem; margin-bottom:6px; line-height:1.3;">${escapeHtml(p.title)}</h3>
                <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5; margin-bottom:12px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                    ${escapeHtml(p.shortDescription || p.description || "")}
                </p>

                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px;">
                    ${techTags}
                </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:12px; margin-top:8px;">
                <div style="display:flex; gap:8px;">
                    ${p.githubUrl ? `<a href="${escapeHtml(p.githubUrl)}" target="_blank" rel="noopener" style="font-size:0.8rem; color:inherit; text-decoration:none;" title="GitHub">💻 Code</a>` : ""}
                    ${p.demoUrl && p.demoUrl !== "#" ? `<a href="${escapeHtml(p.demoUrl)}" target="_blank" rel="noopener" style="font-size:0.8rem; color:var(--accent-color); text-decoration:none;" title="Live Demo">🔗 Demo</a>` : ""}
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="edit-btn secondary-btn" style="padding:6px 12px; font-size:0.8rem; border-radius:6px; cursor:pointer;">Edit</button>
                    <button class="delete-btn secondary-btn" style="padding:6px 10px; font-size:0.8rem; border-radius:6px; color:#e74c3c; cursor:pointer;" title="Delete">🗑</button>
                </div>
            </div>
        `;

        card.querySelector(".edit-btn").addEventListener("click", () => openProjectModal(p));
        card.querySelector(".delete-btn").addEventListener("click", () => deleteProject(p.id));

        grid.appendChild(card);
    });
}

function openProjectModal(project = null) {
    const modal = document.getElementById("projectModal");
    const title = document.getElementById("projectModalTitle");
    const form = document.getElementById("projectForm");
    if (!modal || !form) return;

    form.reset();

    if (project) {
        title.textContent = "Edit Project";
        document.getElementById("projectId").value = project.id;
        document.getElementById("projectTitle").value = project.title || "";
        document.getElementById("projectStatus").value = project.status || "Completed";
        document.getElementById("projectDept").value = project.departmentId || "rnd";
        document.getElementById("projectYear").value = project.year || "2025-26";
        document.getElementById("projectShortDesc").value = project.shortDescription || "";
        document.getElementById("projectFullDesc").value = project.description || "";
        document.getElementById("projectTech").value = project.technologies || "";
        document.getElementById("projectTeam").value = project.teamMembers || "";
        document.getElementById("projectGithub").value = project.githubUrl || "";
        document.getElementById("projectDemo").value = project.demoUrl || "";
        document.getElementById("projectImageUrl").value = project.imageUrl || "";
        document.getElementById("projectFeatured").checked = project.featured === true;
        document.getElementById("projectActive").checked = project.active !== false;
    } else {
        title.textContent = "Add New Project";
        document.getElementById("projectId").value = "";
        document.getElementById("projectYear").value = "2025-26";
        document.getElementById("projectActive").checked = true;
    }

    modal.style.display = "flex";
}

function closeProjectModal() {
    const modal = document.getElementById("projectModal");
    if (modal) modal.style.display = "none";
}

async function saveProject() {
    const docId = document.getElementById("projectId").value;
    const title = document.getElementById("projectTitle").value.trim();
    if (!title) {
        showToast("Please enter a project title.", "warning");
        return;
    }

    const deptSelect = document.getElementById("projectDept");
    const deptId = deptSelect.value;
    const deptName = deptSelect.options[deptSelect.selectedIndex]?.text || deptId;

    const payload = {
        title,
        status: document.getElementById("projectStatus").value,
        departmentId: deptId,
        departmentName: deptName,
        year: document.getElementById("projectYear").value.trim() || "2025-26",
        shortDescription: document.getElementById("projectShortDesc").value.trim(),
        description: document.getElementById("projectFullDesc").value.trim(),
        technologies: document.getElementById("projectTech").value.trim(),
        teamMembers: document.getElementById("projectTeam").value.trim(),
        githubUrl: document.getElementById("projectGithub").value.trim(),
        demoUrl: document.getElementById("projectDemo").value.trim(),
        imageUrl: document.getElementById("projectImageUrl").value.trim() || "assets/1.png",
        featured: document.getElementById("projectFeatured").checked,
        active: document.getElementById("projectActive").checked,
        displayOrder: 1
    };

    try {
        await CMS.saveDoc("projects", docId, payload);
        showToast(`Project "${title}" saved successfully!`);
        closeProjectModal();
        await loadProjects();
    } catch (err) {
        showToast("Error saving project: " + err.message, "error");
    }
}

async function deleteProject(id) {
    if (!confirm("Are you sure you want to permanently delete this project?")) return;
    try {
        await CMS.deleteDoc("projects", id);
        showToast("Project deleted.");
        await loadProjects();
    } catch (err) {
        showToast("Error deleting project: " + err.message, "error");
    }
}

function getAdminImgSrc(src) {
    if (!src) return "../assets/1.png";
    if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) return src;
    if (src.startsWith("../")) return src;
    return "../" + src;
}

function escapeHtml(str) {
    return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
