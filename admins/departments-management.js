// =========================================================
// Department Management Logic (Website Alignment)
// =========================================================

let departmentList = [];

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");
    await loadDepartments();

    // Modal Triggers
    const addBtn = document.getElementById("addDeptBtn");
    const modal = document.getElementById("deptModal");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelModalBtn");
    const form = document.getElementById("deptForm");

    if (addBtn) addBtn.onclick = () => openDeptModal();
    if (closeBtn) closeBtn.onclick = () => closeModal();
    if (cancelBtn) cancelBtn.onclick = () => closeModal();

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            await saveDepartment();
        };
    }
});

const DEFAULT_DEPTS = [
    {
        name: "Research & Development",
        slug: "rnd",
        icon: "🧪",
        tag: "Innovation Hub",
        shortDescription: "Innovation & Research",
        description: "The R&D Department transforms ideas into innovative projects, research papers and prototypes while encouraging students to explore emerging technologies.",
        objectives: ["Research Papers", "Innovation Projects", "Patent Ideas", "Prototype Development"],
        activities: ["Innovation", "Research", "AI", "IoT", "Robotics"],
        stat1Val: "28+", stat1Lbl: "Researchers",
        stat2Val: "18+", stat2Lbl: "Projects",
        stat3Val: "12+", stat3Lbl: "Papers",
        displayOrder: 1,
        active: true
    },
    {
        name: "Digital Infrastructure",
        slug: "digital",
        icon: "💻",
        tag: "Core Department",
        shortDescription: "Technology & Systems",
        description: "The Technical Department develops software, websites, applications and innovative technical solutions for VVISC activities.",
        objectives: ["Website Development", "Software Projects", "Hackathon Support", "Technical Workshops"],
        activities: ["Python", "Java", "Web", "Cloud", "AI"],
        stat1Val: "40+", stat1Lbl: "Members",
        stat2Val: "15+", stat2Lbl: "Projects",
        stat3Val: "20+", stat3Lbl: "Workshops",
        displayOrder: 2,
        active: true
    },
    {
        name: "Public Relations",
        slug: "pr",
        icon: "📢",
        tag: "Outreach Wing",
        shortDescription: "Branding & Outreach",
        description: "Handles external communications, industry partnerships, campus outreach, and media representation.",
        objectives: ["Media Communications", "Industry Outreach", "Sponsorships"],
        activities: ["Public Speaking", "Networking", "Marketing"],
        stat1Val: "35+", stat1Lbl: "Partners",
        stat2Val: "50+", stat2Lbl: "Campaigns",
        stat3Val: "15+", stat3Lbl: "Sponsors",
        displayOrder: 3,
        active: true
    },
    {
        name: "Operations",
        slug: "operations",
        icon: "⚙️",
        tag: "Management Wing",
        shortDescription: "Execution & Management",
        description: "Ensures seamless execution of events, logistics, venue scheduling, and team coordination.",
        objectives: ["Event Execution", "Logistics", "Venue Management"],
        activities: ["Leadership", "Planning", "Management"],
        stat1Val: "30+", stat1Lbl: "Volunteers",
        stat2Val: "25+", stat2Lbl: "Events",
        stat3Val: "100%", stat3Lbl: "Execution",
        displayOrder: 4,
        active: true
    },
    {
        name: "Strategic Planning",
        slug: "strategy",
        icon: "📈",
        tag: "Strategy Wing",
        shortDescription: "Content Development",
        description: "Formulates long-term roadmaps, curriculum outlines, content strategies, and growth metrics for VVISC.",
        objectives: ["Roadmap Creation", "Content Strategy", "Performance Analytics"],
        activities: ["Strategy", "Content", "Analytics"],
        stat1Val: "10+", stat1Lbl: "Roadmaps",
        stat2Val: "50+", stat2Lbl: "Articles",
        stat3Val: "5+", stat3Lbl: "Chapters",
        displayOrder: 5,
        active: true
    },
    {
        name: "Social Media & Visual Arts",
        slug: "social",
        icon: "🎨",
        tag: "Creative Wing",
        shortDescription: "Creative Design",
        description: "Drives visual identity, graphic design, social media campaigns, video production, and creative storytelling.",
        objectives: ["Graphic Design", "Video Editing", "Social Media Management"],
        activities: ["Photoshop", "Figma", "Video Editing"],
        stat1Val: "100+", stat1Lbl: "Posters",
        stat2Val: "50k+", stat2Lbl: "Views",
        stat3Val: "25+", stat3Lbl: "Reels",
        displayOrder: 6,
        active: true
    },
    {
        name: "Finance Team",
        slug: "finance",
        icon: "💰",
        tag: "Finance Wing",
        shortDescription: "Budget & Accounts",
        description: "Manages budget allocations, sponsorship accounting, auditing, and financial transparency for all VVISC initiatives.",
        objectives: ["Budget Allocation", "Financial Accounting", "Sponsorship Tracking"],
        activities: ["Accounting", "Budgeting", "Finance"],
        stat1Val: "₹5L+", stat1Lbl: "Budget Managed",
        stat2Val: "100%", stat2Lbl: "Audit Score",
        stat3Val: "15+", stat3Lbl: "Sponsors",
        displayOrder: 7,
        active: true
    }
];

async function loadDepartments() {
    departmentList = await CMS.getCollection("departments");
    
    // Auto Seed default departments if list is empty
    if (!departmentList || departmentList.length === 0) {
        for (const dept of DEFAULT_DEPTS) {
            await CMS.saveDoc("departments", null, dept);
        }
        departmentList = await CMS.getCollection("departments");
    }

    departmentList.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));
    renderDepartments();
}

function renderDepartments() {
    const container = document.getElementById("deptListContainer");
    if (!container) return;
    container.innerHTML = "";

    if (departmentList.length === 0) {
        container.innerHTML = `<div class="card" style="grid-column:1/-1; padding:30px; text-align:center;">No departments found. Click "+ Add Department" to create one.</div>`;
        return;
    }

    departmentList.forEach((dept, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "padding:20px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; position:relative;";

        const activeStatus = dept.active !== false;

        card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.6rem;">${dept.icon || "🧪"}</span>
                        <span style="padding:2px 8px; border-radius:12px; font-size:0.7rem; font-weight:700; background:rgba(199,107,60,0.15); color:var(--accent-color);">
                            Order #${dept.displayOrder || (index + 1)}
                        </span>
                    </div>
                    <span style="padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:600; background:${activeStatus ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color:${activeStatus ? '#22c55e' : '#ef4444'};">
                        ${activeStatus ? 'Active' : 'Disabled'}
                    </span>
                </div>
                <h3 style="font-size:1.15rem; margin-bottom:4px;">${escapeHtml(dept.name)}</h3>
                <p style="font-size:0.8rem; color:var(--accent-color); font-weight:600; margin-bottom:6px;">🏷️ ${escapeHtml(dept.tag || "Department")} | ${escapeHtml(dept.shortDescription || "")}</p>
                <p style="font-size:0.85rem; opacity:0.8; line-height:1.4; margin-bottom:12px;">${escapeHtml(dept.description || "")}</p>
                
                <div style="display:flex; gap:10px; font-size:0.75rem; opacity:0.85; margin-bottom:12px; background:rgba(255,255,255,0.03); padding:8px; border-radius:6px;">
                    <span>📊 ${escapeHtml(dept.stat1Val || "40+")} ${escapeHtml(dept.stat1Lbl || "Members")}</span>
                    <span>📈 ${escapeHtml(dept.stat2Val || "15+")} ${escapeHtml(dept.stat2Lbl || "Projects")}</span>
                </div>
            </div>
            
            <div style="display:flex; gap:8px; border-top:1px solid var(--border-color); padding-top:12px;">
                <button type="button" onclick="editDept('${dept.id}')" class="secondary-btn" style="flex:1; padding:6px; font-size:0.8rem;">Edit</button>
                <button type="button" onclick="toggleDeptStatus('${dept.id}', ${!activeStatus})" class="secondary-btn" style="padding:6px 12px; font-size:0.8rem;">
                    ${activeStatus ? 'Disable' : 'Enable'}
                </button>
                <button type="button" onclick="deleteDept('${dept.id}')" style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:none; padding:6px 12px; border-radius:6px; font-size:0.8rem; cursor:pointer;">Delete</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openDeptModal(dept = null) {
    const modal = document.getElementById("deptModal");
    const title = document.getElementById("modalTitle");
    if (!modal) return;

    if (dept) {
        title.textContent = "Edit Department";
        document.getElementById("deptDocId").value = dept.id;
        document.getElementById("deptName").value = dept.name || "";
        document.getElementById("deptSlug").value = dept.slug || "";
        document.getElementById("deptIcon").value = dept.icon || "🧪";
        document.getElementById("deptTag").value = dept.tag || "";
        document.getElementById("deptShortDesc").value = dept.shortDescription || "";
        document.getElementById("deptDescription").value = dept.description || "";
        document.getElementById("deptObjectives").value = Array.isArray(dept.objectives) ? dept.objectives.join(", ") : "";
        document.getElementById("deptActivities").value = Array.isArray(dept.activities) ? dept.activities.join(", ") : "";
        
        document.getElementById("stat1Val").value = dept.stat1Val || "40+";
        document.getElementById("stat1Lbl").value = dept.stat1Lbl || "Members";
        document.getElementById("stat2Val").value = dept.stat2Val || "15+";
        document.getElementById("stat2Lbl").value = dept.stat2Lbl || "Projects";
        document.getElementById("stat3Val").value = dept.stat3Val || "20+";
        document.getElementById("stat3Lbl").value = dept.stat3Lbl || "Workshops";

        document.getElementById("deptOrder").value = dept.displayOrder || 1;
        document.getElementById("deptActive").checked = dept.active !== false;
    } else {
        title.textContent = "Add Department";
        document.getElementById("deptForm").reset();
        document.getElementById("deptDocId").value = "";
        document.getElementById("deptActive").checked = true;

        const maxOrder = Math.max(0, ...departmentList.map(d => parseInt(d.displayOrder) || 0));
        document.getElementById("deptOrder").value = maxOrder + 1;
    }

    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("deptModal");
    if (modal) modal.style.display = "none";
}

async function saveDepartment() {
    const docId = document.getElementById("deptDocId").value;
    const name = document.getElementById("deptName").value.trim();
    const slug = document.getElementById("deptSlug").value.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    const payload = {
        name,
        slug,
        icon: document.getElementById("deptIcon").value.trim() || "🧪",
        tag: document.getElementById("deptTag").value.trim() || "Core Department",
        shortDescription: document.getElementById("deptShortDesc").value.trim(),
        description: document.getElementById("deptDescription").value.trim(),
        objectives: document.getElementById("deptObjectives").value.split(",").map(s => s.trim()).filter(Boolean),
        activities: document.getElementById("deptActivities").value.split(",").map(s => s.trim()).filter(Boolean),
        stat1Val: document.getElementById("stat1Val").value.trim() || "40+",
        stat1Lbl: document.getElementById("stat1Lbl").value.trim() || "Members",
        stat2Val: document.getElementById("stat2Val").value.trim() || "15+",
        stat2Lbl: document.getElementById("stat2Lbl").value.trim() || "Projects",
        stat3Val: document.getElementById("stat3Val").value.trim() || "20+",
        stat3Lbl: document.getElementById("stat3Lbl").value.trim() || "Workshops",
        displayOrder: parseInt(document.getElementById("deptOrder").value) || 1,
        active: document.getElementById("deptActive").checked
    };

    try {
        await CMS.saveDoc("departments", docId, payload);
        showToast(`Department "${name}" saved successfully!`);
        closeModal();
        await loadDepartments();
    } catch (err) {
        showToast("Error saving department: " + err.message, "error");
    }
}

function editDept(id) {
    const dept = departmentList.find(d => d.id === id);
    if (dept) openDeptModal(dept);
}

async function toggleDeptStatus(id, newStatus) {
    try {
        await CMS.saveDoc("departments", id, { active: newStatus });
        showToast(`Department status updated.`);
        await loadDepartments();
    } catch (err) {
        showToast("Status update failed.", "error");
    }
}

async function deleteDept(id) {
    if (confirm("Are you sure you want to delete this department?")) {
        try {
            await CMS.deleteDoc("departments", id);
            showToast("Department deleted successfully.");
            await loadDepartments();
        } catch (err) {
            showToast("Failed to delete department.", "error");
        }
    }
}

function escapeHtml(str) {
    return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
