// =========================================================
// Council & Team Management Logic (Isolated Image State Fix)
// =========================================================

let councilList = [];
let departmentList = [];
let currentMemberOriginalImage = "";
let currentAssignDept = null;
let unsubscribeDeptsListener = null;

const DEFAULT_DEPTS = [
    {
        name: "Research & Development",
        slug: "rnd",
        icon: "🧪",
        tag: "Innovation Hub",
        shortDescription: "Innovation & Research",
        description: "The R&D Department transforms ideas into innovative projects, research papers and prototypes while encouraging students to explore emerging technologies.",
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
        displayOrder: 7,
        active: true
    }
];

// State for Profile Pic Adjustment Studio
let adjustedImageBlob = null;
let adjustedImageDataUrl = null;
let currentAdjustImg = null;
let adjustScale = 1.0;
let adjustPanX = 0;
let adjustPanY = 0;
let adjustRotation = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let currentGuideMode = "circle";


// =========================================================
// Firebase Storage & Photo Management Helpers
// =========================================================
async function uploadCouncilPhoto(file, onProgress) {
    if (!file) return { url: null, path: null };

    // 1. Try Firebase Storage directly with progress tracking
    if (typeof firebase !== "undefined" && firebase.storage && typeof firebase.storage === "function") {
        try {
            const storageRef = firebase.storage().ref();
            const cleanName = (file.name || "profile.jpg").replace(/[^a-zA-Z0-9.-]/g, "_");
            const storagePath = `council/${Date.now()}_${cleanName}`;
            const fileRef = storageRef.child(storagePath);
            const uploadTask = fileRef.put(file, { contentType: file.type || "image/jpeg" });

            const url = await new Promise((resolve, reject) => {
                uploadTask.on("state_changed",
                    (snapshot) => {
                        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        if (typeof onProgress === "function") onProgress(progress);
                    },
                    (error) => reject(error),
                    async () => {
                        try {
                            const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
                            resolve(downloadUrl);
                        } catch (err) {
                            reject(err);
                        }
                    }
                );
            });

            if (typeof CMS !== "undefined" && CMS.recordMediaUpload) {
                CMS.recordMediaUpload({
                    url: url,
                    fileName: file.name || "profile.jpg",
                    folder: "council",
                    size: file.size || 0,
                    mimeType: file.type || "image/jpeg"
                });
            }

            return { url, path: storagePath };
        } catch (err) {
            console.warn("Storage upload task notice, falling back to CMS.uploadImage:", err);
        }
    }

    // 2. Fallback to CMS.uploadImage (auto-compression dataURL)
    const fallbackUrl = await CMS.uploadImage(file, "council");
    return { url: fallbackUrl, path: null };
}

async function deleteStoragePhoto(photoPath) {
    if (!photoPath || typeof photoPath !== "string") return;
    if (!photoPath.startsWith("council/") && !photoPath.startsWith("council-members/")) return;
    if (typeof firebase !== "undefined" && firebase.storage && typeof firebase.storage === "function") {
        try {
            await firebase.storage().ref(photoPath).delete();
            console.log("Deleted previous photo from Storage:", photoPath);
        } catch (e) {
            console.warn("Notice deleting old storage photo (may be already removed):", e.message || e);
        }
    }
}

const DEFAULT_COUNCIL_MEMBERS = [
    {
        name: "Dr. Naveen Ravela",
        memberType: "Chief Faculty",
        role: "Chief Faculty Coordinator",
        department: "Mech Department",
        description: "Passionate educator dedicated to mentoring students in innovation, research and leadership.",
        profileImage: "assets/council/faculty/chief.jpg",
        email: "faculty@vvit.net",
        linkedin: "#",
        github: "#",
        displayOrder: 1,
        active: true
    },
    {
        name: "Dr. Faculty Member 1",
        memberType: "Faculty Coordinator",
        role: "Faculty Coordinator",
        department: "Computer Science",
        description: "Mentoring student technical teams and research projects.",
        profileImage: "assets/council/faculty/faculty1.jpg",
        email: "faculty1@vvit.net",
        linkedin: "#",
        github: "",
        displayOrder: 2,
        active: true
    },
    {
        name: "Dr. Faculty Member 2",
        memberType: "Faculty Coordinator",
        role: "Faculty Coordinator",
        department: "Information Technology",
        description: "Guiding workshops and innovation activities.",
        profileImage: "assets/council/faculty/faculty2.jpg",
        email: "faculty2@vvit.net",
        linkedin: "#",
        github: "",
        displayOrder: 3,
        active: true
    },
    {
        name: "Dr. Faculty Member 3",
        memberType: "Faculty Coordinator",
        role: "Faculty Coordinator",
        department: "Electronics & Communication",
        description: "Supporting leadership and student development.",
        profileImage: "assets/council/faculty/faculty3.jpg",
        email: "faculty3@vvit.net",
        linkedin: "#",
        github: "",
        displayOrder: 4,
        active: true
    },
    {
        name: "Soniya K",
        memberType: "Student Leader",
        role: "President",
        department: "Executive Council",
        description: "Leads the entire council, coordinates departments and represents VVISC.",
        profileImage: "assets/nodp.png",
        email: "president@vvisc.net",
        linkedin: "#",
        github: "#",
        displayOrder: 5,
        active: true
    },
    {
        name: "Yeshitha B",
        memberType: "Student Leader",
        role: "Vice President",
        department: "Executive Council",
        description: "Supports the President, oversees departments and manages council operations.",
        profileImage: "assets/nodp.png",
        email: "vp@vvisc.net",
        linkedin: "#",
        github: "#",
        displayOrder: 6,
        active: true
    },
    {
        name: "Abid Sk",
        memberType: "Student Leader",
        role: "Secretary",
        department: "Executive Council",
        description: "Maintains records, meeting minutes and official documentation.",
        profileImage: "assets/nodp.png",
        email: "secretary@vvisc.net",
        linkedin: "#",
        github: "#",
        displayOrder: 7,
        active: true
    },
    {
        name: "Lalith B",
        memberType: "Student Leader",
        role: "Treasurer",
        department: "Executive Council",
        description: "Manages finances, sponsorship budgets and expenditures.",
        profileImage: "assets/nodp.png",
        email: "treasurer@vvisc.net",
        linkedin: "#",
        github: "#",
        displayOrder: 8,
        active: true
    },
    {
        name: "Harshitha Ch",
        memberType: "Student Leader",
        role: "Research & Development Co-ordinator",
        department: "Research & Development",
        description: "Oversees research and development initiatives, coordinates projects and ensures alignment with organizational goals.",
        profileImage: "assets/nodp.png",
        email: "rnd@vvisc.net",
        linkedin: "#",
        github: "#",
        displayOrder: 9,
        active: true
    },
    {
        name: "Rajavardhan Perugu",
        studentId: "23BQ5A6135",
        branch: "AIM",
        contactInfo: "8466994645",
        phone: "8466994645",
        memberType: "Student Leader",
        role: "DI Coordinator",
        leadershipRole: "coordinator",
        department: "Digital Infrastructure",
        description: "Manages digital infrastructure, including networks, servers, and IT systems.",
        profileImage: "assets/nodp.png",
        email: "digital@vvisc.net",
        linkedin: "#",
        github: "#",
        displayOrder: 10,
        active: true
    },
    {
        name: "Navya",
        studentId: "24BQ1A42",
        branch: "AIM",
        memberType: "Student Leader",
        role: "Associate Coordinator",
        leadershipRole: "associate_coordinator",
        department: "Digital Infrastructure",
        description: "Assists the Digital Infrastructure Coordinator in managing portals and platforms.",
        profileImage: "assets/nodp.png",
        email: "navya@vvisc.net",
        linkedin: "#",
        github: "#",
        displayOrder: 11,
        active: true
    },
    {
        name: "K. S. Vivek",
        studentId: "23BQ1A05",
        branch: "CSE",
        memberType: "Council Member",
        role: "Team Member",
        leadershipRole: "member",
        department: "Digital Infrastructure",
        description: "Technical team contributor for digital systems and operations.",
        profileImage: "assets/nodp.png",
        email: "vivek@vvisc.net",
        linkedin: "#",
        github: "#",
        displayOrder: 12,
        active: true
    },

    {
        name: "Harika K",
        memberType: "Student Leader",
        role: "Public Relations Co-ordinator",
        department: "Public Relations",
        description: "Manages public relations, media outreach, and communication strategies to enhance the organization's image.",
        profileImage: "assets/nodp.png",
        email: "pr@vvisc.net",
        linkedin: "#",
        github: "#",
        displayOrder: 11,
        active: true
    },
    {
        name: "Praveena B",
        memberType: "Student Leader",
        role: "Operations Co-ordinator",
        department: "Operations",
        description: "Manages operations, logistics, and ensures smooth execution of events and activities.",
        profileImage: "assets/nodp.png",
        email: "operations@vvisc.net",
        linkedin: "#",
        github: "#",
        displayOrder: 12,
        active: true
    },
    {
        name: "Nishitha M",
        memberType: "Student Leader",
        role: "Strategic Planning & Content Development Co-ordinator",
        department: "Strategic Planning",
        description: "Manages strategic planning and content development for the organization.",
        profileImage: "assets/nodp.png",
        email: "strategy@vvisc.net",
        linkedin: "#",
        github: "#",
        displayOrder: 13,
        active: true
    },
    {
        name: "Abhishek B",
        memberType: "Student Leader",
        role: "Media & Visual Arts Co-ordinator",
        department: "Media & Visual Arts",
        description: "Manages public relations, media outreach, and communication strategies to enhance the organization's image.",
        profileImage: "assets/nodp.png",
        email: "media@vvisc.net",
        linkedin: "#",
        github: "#",
        displayOrder: 14,
        active: true
    }
];

let unsubscribeCouncilListener = null;

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");
    initAdjustModal();

    // Tab Switching
    const tabMembersBtn = document.getElementById("tabMembersBtn");
    const tabDeptsBtn = document.getElementById("tabDeptsBtn");
    const tabMembersView = document.getElementById("tabMembersView");
    const tabDeptsView = document.getElementById("tabDeptsView");

    if (tabMembersBtn && tabDeptsBtn && tabMembersView && tabDeptsView) {
        tabMembersBtn.onclick = () => {
            tabMembersBtn.className = "primary-btn";
            tabDeptsBtn.className = "secondary-btn";
            tabMembersView.style.display = "block";
            tabDeptsView.style.display = "none";
        };

        tabDeptsBtn.onclick = () => {
            tabDeptsBtn.className = "primary-btn";
            tabMembersBtn.className = "secondary-btn";
            tabDeptsView.style.display = "block";
            tabMembersView.style.display = "none";
            renderDeptsGrid();
        };
    }

    // Member Modal Triggers
    const addBtn = document.getElementById("addMemberBtn");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelModalBtn");
    const form = document.getElementById("councilForm");
    const fileInput = document.getElementById("memberImageFile");
    const urlInput = document.getElementById("memberImageUrl");
    const syncCloudBtn = document.getElementById("syncCloudBtn");

    if (addBtn) addBtn.onclick = () => openCouncilModal();
    if (closeBtn) closeBtn.onclick = () => closeModal();
    if (cancelBtn) cancelBtn.onclick = () => closeModal();
    if (syncCloudBtn) {
        syncCloudBtn.onclick = () => checkAndAutoSyncLocalToCloud(true);
    }

    // Department Modal Triggers
    const addDeptTopBtn = document.getElementById("addDeptTopBtn");
    const addNewDeptBtn = document.getElementById("addNewDeptBtn");
    const closeDeptBtn = document.getElementById("closeDeptModalBtn");
    const cancelDeptBtn = document.getElementById("cancelDeptModalBtn");
    const deptForm = document.getElementById("deptForm");

    if (addDeptTopBtn) addDeptTopBtn.onclick = () => openDeptModal();
    if (addNewDeptBtn) addNewDeptBtn.onclick = () => openDeptModal();
    if (closeDeptBtn) closeDeptBtn.onclick = () => closeDeptModal();
    if (cancelDeptBtn) cancelDeptBtn.onclick = () => closeDeptModal();

    if (deptForm) {
        deptForm.onsubmit = async (e) => {
            e.preventDefault();
            await saveDept();
        };
    }

    // Leadership Assignment Modal Triggers
    const closeAssignBtn = document.getElementById("closeAssignModalBtn");
    const cancelAssignBtn = document.getElementById("cancelAssignModalBtn");
    const assignForm = document.getElementById("assignLeadershipForm");
    const coordSelect = document.getElementById("assignCoordinatorSelect");
    const assocSelect = document.getElementById("assignAssociateSelect");

    if (closeAssignBtn) closeAssignBtn.onclick = () => closeAssignModal();
    if (cancelAssignBtn) cancelAssignBtn.onclick = () => closeAssignModal();

    const checkAssignConflict = () => {
        const cVal = coordSelect ? coordSelect.value : "";
        const aVal = assocSelect ? assocSelect.value : "";
        const alertBox = document.getElementById("assignConflictAlert");
        const saveBtn = document.getElementById("saveLeadershipBtn");
        if (cVal && aVal && cVal === aVal) {
            if (alertBox) alertBox.style.display = "block";
            if (saveBtn) saveBtn.disabled = true;
        } else {
            if (alertBox) alertBox.style.display = "none";
            if (saveBtn) saveBtn.disabled = false;
        }
    };

    if (coordSelect) coordSelect.addEventListener("change", checkAssignConflict);
    if (assocSelect) assocSelect.addEventListener("change", checkAssignConflict);

    if (assignForm) {
        assignForm.onsubmit = async (e) => {
            e.preventDefault();
            await saveLeadershipAssignment();
        };
    }

    // Profile photo upload and preview
    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const dataUrl = evt.target.result;
                    showPreview(dataUrl);
                    openAdjustStudio(dataUrl);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (urlInput) {
        urlInput.addEventListener("input", (e) => {
            const val = e.target.value.trim();
            if (val) {
                showPreview(val);
            } else if (currentMemberOriginalImage) {
                showPreview(getAdminImgSrc(currentMemberOriginalImage));
            } else {
                hidePreview();
            }
        });
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            await saveCouncilMember();
        };
    }

    // Member Filters
    const searchInput = document.getElementById("searchCouncilInput");
    if (searchInput) {
        searchInput.addEventListener("input", () => renderCouncilGrid());
    }

    const yearSelect = document.getElementById("councilYearFilterSelect");
    if (yearSelect) {
        yearSelect.addEventListener("change", () => renderCouncilGrid());
    }

    const deptSelect = document.getElementById("councilDeptFilterSelect");
    if (deptSelect) {
        deptSelect.addEventListener("change", () => renderCouncilGrid());
    }

    const statusSelect = document.getElementById("councilStatusFilterSelect");
    
    const roleSelect = document.getElementById("councilRoleFilterSelect");
    if (roleSelect) {
        roleSelect.addEventListener("change", () => renderCouncilGrid());
    }

    // Delete Member Confirmation Modal Triggers
    const cancelDeleteBtn = document.getElementById("cancelDeleteMemberBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteMemberBtn");
    const deleteModal = document.getElementById("deleteMemberModal");

    if (cancelDeleteBtn) cancelDeleteBtn.onclick = closeDeleteMemberModal;
    if (confirmDeleteBtn) confirmDeleteBtn.onclick = confirmDeleteMember;
    if (deleteModal) {
        deleteModal.onclick = (e) => {
            if (e.target === deleteModal) closeDeleteMemberModal();
        };
    }

    if (statusSelect) {
        statusSelect.addEventListener("change", () => renderCouncilGrid());
    }

    // Initial Data Load
    await Promise.all([loadCouncilMembers(), loadDepartments()]);
    setupRealtimeCouncilListener();
    setupRealtimeDeptsListener();
});

function getAdminImgSrc(src) {
    if (!src) return '../assets/nodp.png';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('../')) return src;
    return '../' + src;
}

async function loadCouncilMembers() {
    try {
        councilList = await CMS.getCollection("councilMembers", { orderBy: "displayOrder", orderDirection: "asc" });

        // Auto-detect and push any local profile photos or edits to Cloud Firestore
        await checkAndAutoSyncLocalToCloud(false);

        councilList.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));
        renderCouncilGrid();
        updateCloudStatusUI();
    } catch (err) {
        console.error("loadCouncilMembers error:", err);
    }
}

async function checkAndAutoSyncLocalToCloud(isManual = false) {
    let localList = [];
    try {
        const raw = localStorage.getItem("vvisc_col_councilMembers");
        if (raw) localList = JSON.parse(raw);
    } catch (e) {}

    // Check what is in Firestore cloud right now
    let cloudDocs = [];
    try {
        if (typeof db !== "undefined") {
            const cloudSnap = await db.collection("councilMembers").get();
            cloudSnap.forEach(d => cloudDocs.push({ id: d.id, ...d.data() }));
        }
    } catch (err) {
        console.warn("Could not query Firestore for cloud sync check:", err);
    }

    // If both local and cloud are empty, seed default council members
    if ((!localList || localList.length === 0) && cloudDocs.length === 0) {
        console.log("Seeding default council members to Cloud Firestore...");
        for (const member of DEFAULT_COUNCIL_MEMBERS) {
            await CMS.saveDoc("councilMembers", null, member);
        }
        councilList = await CMS.getCollection("councilMembers", { orderBy: "displayOrder", orderDirection: "asc" });
        renderCouncilGrid();
        updateCloudStatusUI();
        return;
    }

    // Check if local storage has custom images or edits
    const hasCustomLocalData = localList.some(m => 
        (m.profileImage && (m.profileImage.startsWith("data:") || m.profileImage.startsWith("http") || m.profileImage.includes("council"))) ||
        (m.id && m.id.startsWith("local_")) ||
        (m.name && !m.name.includes("Dr. Faculty Name") && !m.name.includes("Dr. Faculty Member"))
    );

    const cloudEmpty = cloudDocs.length === 0;
    const localHasMore = localList.length > cloudDocs.length;
    const shouldSync = isManual || cloudEmpty || (hasCustomLocalData && (localHasMore || cloudEmpty));

    if (shouldSync && localList.length > 0) {
        const syncBtn = document.getElementById("syncCloudBtn");
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.innerHTML = "<span>\u23F3</span> Syncing to Cloud...";
        }
        showToast("\u2601\uFE0F Pushing council members & profile photos to Cloud Firestore...", "info");

        let syncedCount = 0;
        for (const member of localList) {
            let photo = member.profileImage || "assets/nodp.png";
            // Compress large base64 data URLs to prevent Firestore document size limit issues
            if (photo.startsWith("data:image/")) {
                photo = await CMS.compressDataUrl(photo, 460, 0.78);
            }

            const cleanPayload = {
                name: member.name || "Council Member",
                memberType: member.memberType || "Student Leader",
                role: member.role || "Coordinator",
                department: member.department || "",
                description: member.description || "",
                profileImage: photo,
                email: member.email || "",
                linkedin: member.linkedin || "",
                github: member.github || "",
                displayOrder: parseInt(member.displayOrder) || 1,
                active: member.active !== false
            };

            const targetId = (member.id && !member.id.startsWith("local_")) ? member.id : null;
            const savedId = await CMS.saveDoc("councilMembers", targetId, cleanPayload);
            member.id = savedId;
            member.profileImage = photo;
            syncedCount++;
        }

        try {
            localStorage.setItem("vvisc_col_councilMembers", JSON.stringify(localList));
        } catch (e) {}

        // Reload collection from Firestore
        councilList = await CMS.getCollection("councilMembers", { orderBy: "displayOrder", orderDirection: "asc" });
        renderCouncilGrid();
        updateCloudStatusUI();

        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = "<span>\u{1F504}</span> Push / Sync to Cloud";
        }

        showToast(`\u2713 ${syncedCount} council members & photos synced to Cloud Firestore! Visible across all profiles.`, "success");
    } else {
        updateCloudStatusUI();
    }
}

function setupRealtimeCouncilListener() {
    if (typeof db === "undefined") return;
    try {
        if (unsubscribeCouncilListener) {
            unsubscribeCouncilListener();
        }
        unsubscribeCouncilListener = db.collection("councilMembers").onSnapshot((snapshot) => {
            if (snapshot.empty) return;
            const liveList = [];
            snapshot.forEach(doc => {
                liveList.push({ id: doc.id, ...doc.data() });
            });
            liveList.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));
            councilList = liveList;
            try {
                localStorage.setItem("vvisc_col_councilMembers", JSON.stringify(liveList));
            } catch (e) {}
            renderCouncilGrid();
            updateCloudStatusUI();
        }, (err) => {
            console.warn("Real-time council listener notice:", err);
        });
    } catch (e) {
        console.warn("Failed to attach real-time listener:", e);
    }
}

function updateCloudStatusUI() {
    const statusText = document.getElementById("cloudStatusText");
    const statusSub = document.getElementById("cloudStatusSub");
    const icon = document.getElementById("cloudStatusIcon");
    const pulse = document.getElementById("syncPulseBadge");
    if (!statusText) return;

    const count = councilList.length;
    if (count > 0) {
        if (icon) icon.textContent = "\u{1F7E2}";
        if (pulse) {
            pulse.style.background = "#22c55e";
            pulse.style.boxShadow = "0 0 8px #22c55e";
        }
        statusText.textContent = `Cloud Database: Live (${count} Members Synced)`;
        statusText.style.color = "#22c55e";
        if (statusSub) statusSub.textContent = "All updates save directly to Cloud Firestore. Changes are instantly visible across all browsers, mobile devices, and council.html.";
    } else {
        if (icon) icon.textContent = "\u{1F7E1}";
        if (pulse) {
            pulse.style.background = "#eab308";
            pulse.style.boxShadow = "0 0 8px #eab308";
        }
        statusText.textContent = "Cloud Database: Ready to Sync";
        statusText.style.color = "#eab308";
        if (statusSub) statusSub.textContent = "Click 'Push / Sync to Cloud' to upload any local photos and council data to Google Cloud Firestore.";
    }
}

function renderCouncilGrid() {
    const container = document.getElementById("councilListContainer");
    if (!container) return;
    container.innerHTML = "";

    const countBadge = document.getElementById("tabMembersCount");
    if (countBadge) countBadge.textContent = councilList.length;

    const searchInput = document.getElementById("searchCouncilInput");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const yearSelect = document.getElementById("councilYearFilterSelect");
    const termFilter = yearSelect ? yearSelect.value : "all";
    const deptSelect = document.getElementById("councilDeptFilterSelect");
    const deptFilter = deptSelect ? deptSelect.value : "all";
    const statusSelect = document.getElementById("councilStatusFilterSelect");
    const statusFilter = statusSelect ? statusSelect.value : "all";
    const roleSelect = document.getElementById("councilRoleFilterSelect");
    const roleFilter = roleSelect ? roleSelect.value : "all";

    const filtered = councilList.filter(m => {
        // Exclude dummy placeholder member if present
        if (m.name && m.name.toLowerCase().includes("member 2")) return false;

        // Status filter
        const isActive = (m.active !== false && m.isActive !== false);
        if (statusFilter === "active" && !isActive) return false;
        if (statusFilter === "inactive" && isActive) return false;

        // Role filter
        if (roleFilter !== "all") {
            const lRole = (m.leadershipRole || "").toLowerCase();
            const r = (m.role || "").toLowerCase();
            const mType = (m.memberType || "").toLowerCase();
            if (roleFilter === "coordinator") {
                if (lRole !== "coordinator" && !(r.includes("co-ordinator") && !r.includes("associate")) && !r.includes("lead")) return false;
            } else if (roleFilter === "associate_coordinator") {
                if (lRole !== "associate_coordinator" && !r.includes("associate")) return false;
            } else if (roleFilter === "executive") {
                if (lRole !== "executive" && !(r.includes("president") || r.includes("secretary") || r.includes("treasurer") || mType.includes("executive"))) return false;
            } else if (roleFilter === "faculty") {
                if (mType !== "faculty coordinator" && mType !== "chief faculty" && !mType.includes("faculty") && !(m.department && m.department.toLowerCase().includes("faculty"))) return false;
            } else if (roleFilter === "member") {
                const isLead = lRole === "coordinator" || lRole === "associate_coordinator" || lRole === "executive" || r.includes("co-ordinator") || r.includes("president") || r.includes("secretary") || r.includes("treasurer") || mType.includes("faculty");
                if (isLead) return false;
            }
        }

        // Year filter
        if (termFilter !== "all") {
            const memberYear = m.councilYear || "2025-26";
            if (memberYear !== termFilter) return false;
        }

        // Department filter
        if (deptFilter !== "all") {
            const mDept = (m.department || "").toLowerCase();
            const filterLow = deptFilter.toLowerCase();
            if (filterLow === "rnd" && !(mDept.includes("research") || mDept.includes("r&d") || mDept.includes("rnd"))) return false;
            else if (filterLow === "digital" && !(mDept.includes("digital") || mDept.includes("infra") || mDept.includes("tech"))) return false;
            else if (filterLow === "pr" && !(mDept.includes("public") || mDept.includes("pr"))) return false;
            else if (filterLow === "operations" && !mDept.includes("operation")) return false;
            else if (filterLow === "strategy" && !(mDept.includes("strateg") || mDept.includes("content"))) return false;
            else if (filterLow === "social" && !(mDept.includes("social") || mDept.includes("visual") || mDept.includes("media"))) return false;
            else if (filterLow === "finance" && !(mDept.includes("finance") || mDept.includes("budget") || mDept.includes("treasur"))) return false;
            else if (filterLow === "executive" && !(mDept.includes("executive") || mDept.includes("presid") || mDept.includes("secretar"))) return false;
            else if (filterLow === "faculty" && !(mDept.includes("faculty") || mDept.includes("mentor") || (m.memberType && m.memberType.includes("Faculty")))) return false;
            else if (!mDept.includes(filterLow)) return false;
        }

        // Search query
        if (query) {
            const name = (m.name || m.fullName || "").toLowerCase();
            const role = (m.role || "").toLowerCase();
            const dept = (m.department || m.departmentName || "").toLowerCase();
            const studentId = (m.studentId || m.rollNo || "").toLowerCase();
            const branch = (m.branch || m.branchCode || "").toLowerCase();
            if (!name.includes(query) && !role.includes(query) && !dept.includes(query) && !studentId.includes(query) && !branch.includes(query)) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="card" style="grid-column:1/-1; padding:30px; text-align:center;">No council members match the selected filter criteria. Click "+ Add Council Member" to add team members.</div>`;
        return;
    }

    filtered.forEach(m => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "padding:20px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; position:relative;";

        const activeStatus = m.active !== false;
        const lRole = (m.leadershipRole || "").toLowerCase();
        let leadershipBadge = "";
        if (lRole === "coordinator" || (m.role && m.role.toLowerCase().includes("co-ordinator") && !m.role.toLowerCase().includes("associate"))) {
            leadershipBadge = `<span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:10px; background:rgba(200,155,53,0.18); color:#C89B35; border:1px solid rgba(200,155,53,0.35);">★ Coordinator</span>`;
        } else if (lRole === "associate_coordinator" || (m.role && m.role.toLowerCase().includes("associate"))) {
            leadershipBadge = `<span style="font-size:0.72rem; font-weight:600; padding:2px 8px; border-radius:10px; background:rgba(16,40,32,0.12); color:var(--text-color); border:1px solid var(--border-color);">Associate Coord</span>`;
        } else if (lRole === "executive") {
            leadershipBadge = `<span style="font-size:0.72rem; font-weight:600; padding:2px 8px; border-radius:10px; background:rgba(99,102,241,0.15); color:#6366f1;">Executive</span>`;
        }

        card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:6px;">
                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                        <span style="font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:12px; background:rgba(199,107,60,0.15); color:var(--accent-color);">${escapeHtml(m.memberType || "Student Leader")}</span>
                        ${leadershipBadge}
                        <span style="font-size:0.75rem; background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:10px; opacity:0.85;">Term ${escapeHtml(m.councilYear || "2025-26")}</span>
                        ${(m.studentId || m.rollNo) ? `<span style="font-size:0.75rem; background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:10px; opacity:0.9; font-family:monospace; color:var(--accent-color);">ID: ${escapeHtml(m.studentId || m.rollNo)}</span>` : ""}
                        ${(m.branch || m.branchCode) ? `<span style="font-size:0.75rem; background:rgba(34,197,94,0.12); color:#22c55e; border:1px solid rgba(34,197,94,0.25); padding:2px 8px; border-radius:10px; font-weight:700;">${escapeHtml(m.branch || m.branchCode)}</span>` : ""}
                        <span style="font-size:0.75rem; opacity:0.7;">#${m.displayOrder || 1}</span>
                    </div>
                    <span style="padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:600; background:${activeStatus ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color:${activeStatus ? '#22c55e' : '#ef4444'};">
                        ${activeStatus ? 'Active' : 'Disabled'}
                    </span>
                </div>
                <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
                    <img src="${getAdminImgSrc(m.profileImage)}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid var(--accent-color);" onerror="this.onerror=null; this.src='../assets/nodp.png';">
                    <div>
                        <h3 style="font-size:1.05rem; margin-bottom:2px;">${escapeHtml(m.name)}</h3>
                        <p style="font-size:0.8rem; color:var(--accent-color); font-weight:600;">${escapeHtml(m.role)}</p>
                    </div>
                </div>
                ${m.department ? `<p style="font-size:0.8rem; opacity:0.7; margin-bottom:6px;">&#x1F3E2; ${escapeHtml(m.department)}</p>` : ""}
                ${m.email ? `<p style="font-size:0.8rem; opacity:0.7; margin-bottom:8px;">&#x1F4E7; ${escapeHtml(m.email)}</p>` : ""}
                ${m.description ? `<p style="font-size:0.82rem; opacity:0.85; margin-bottom:12px; line-height:1.3;">${escapeHtml(m.description)}</p>` : ""}
            </div>
            
            <div style="display:flex; gap:8px; margin-top:15px; border-top:1px solid var(--border-color); padding-top:12px;">
                <button type="button" onclick="editMember('${m.id}')" class="secondary-btn" style="flex:1; padding:6px; font-size:0.8rem;">Edit</button>
                <button type="button" onclick="toggleMemberStatus('${m.id}', ${!activeStatus})" class="secondary-btn" style="padding:6px 12px; font-size:0.8rem;">
                    ${activeStatus ? 'Disable' : 'Enable'}
                </button>
                <button type="button" onclick="deleteMember('${m.id}')" style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:none; padding:6px 12px; border-radius:6px; font-size:0.8rem; cursor:pointer;">Delete</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openCouncilModal(member = null) {
    const modal = document.getElementById("councilModal");
    const title = document.getElementById("modalTitle");
    if (!modal) return;

    // Reset file input and preview DOM elements completely before populating
    const fileInput = document.getElementById("memberImageFile");
    if (fileInput) fileInput.value = "";
    hidePreview();
    adjustedImageBlob = null;
    adjustedImageDataUrl = null;
    const progressWrap = document.getElementById("memberUploadProgressWrap");
    if (progressWrap) progressWrap.style.display = "none";

    if (member) {
        title.textContent = "Edit Council Member";
        currentMemberOriginalImage = member.profileImage || "";

        document.getElementById("memberDocId").value = member.id;
        document.getElementById("memberName").value = member.name || member.fullName || "";
        if (document.getElementById("memberStudentId")) {
            document.getElementById("memberStudentId").value = member.studentId || member.rollNo || "";
        }
        if (document.getElementById("memberBranch")) {
            document.getElementById("memberBranch").value = member.branch || member.branchCode || "";
        }
        document.getElementById("memberType").value = member.memberType || "Student Leader";
        document.getElementById("memberRole").value = member.role || "";
        document.getElementById("memberDept").value = member.department || member.departmentName || "Research & Development";
        if (document.getElementById("memberLeadershipRole")) {
            document.getElementById("memberLeadershipRole").value = member.leadershipRole || "member";
        }
        document.getElementById("memberDesc").value = member.description || member.bio || "";
        document.getElementById("memberImageUrl").value = member.profileImage || member.photoURL || "";
        if (document.getElementById("memberPhotoPath")) {
            document.getElementById("memberPhotoPath").value = member.photoPath || "";
        }
        document.getElementById("memberEmail").value = member.email || "";
        if (document.getElementById("memberContact")) {
            document.getElementById("memberContact").value = member.contactInfo || member.phone || "";
        }
        document.getElementById("memberLinkedin").value = member.linkedin || member.linkedinURL || "";
        document.getElementById("memberGithub").value = member.github || member.githubURL || "";
        document.getElementById("memberOrder").value = member.displayOrder || member.order || 1;
        document.getElementById("memberCouncilYear").value = member.councilYear || "2025-26";
        document.getElementById("memberActive").checked = (member.active !== false && member.isActive !== false);

        if (member.profileImage) {
            showPreview(getAdminImgSrc(member.profileImage));
            const badge = document.getElementById("cropStatusBadge");
            if (badge) {
                badge.textContent = "Current Photo";
                badge.style.background = "rgba(197, 168, 128, 0.2)";
                badge.style.color = "var(--accent-color)";
            }
        }
    } else {
        title.textContent = "Add Council Member";
        currentMemberOriginalImage = "";
        document.getElementById("councilForm").reset();
        document.getElementById("memberDocId").value = "";
        document.getElementById("memberActive").checked = true;

        const maxOrder = Math.max(0, ...councilList.map(m => parseInt(m.displayOrder) || 0));
        document.getElementById("memberOrder").value = maxOrder + 1;
    }

    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("councilModal");
    if (modal) modal.style.display = "none";
    
    // Clear state
    const form = document.getElementById("councilForm");
    if (form) form.reset();
    const fileInput = document.getElementById("memberImageFile");
    if (fileInput) fileInput.value = "";
    hidePreview();
    currentMemberOriginalImage = "";
    adjustedImageBlob = null;
    adjustedImageDataUrl = null;
    closeAdjustStudio();
}

function showPreview(url) {
    const wrap = document.getElementById("imagePreviewWrap");
    const img = document.getElementById("imagePreview");
    const openBtn = document.getElementById("openAdjustModalBtn");
    if (wrap && img) {
        img.src = url;
        wrap.style.display = "flex";
    }
    if (openBtn) {
        openBtn.style.display = "inline-flex";
    }
}

function hidePreview() {
    const wrap = document.getElementById("imagePreviewWrap");
    const img = document.getElementById("imagePreview");
    const openBtn = document.getElementById("openAdjustModalBtn");
    if (wrap && img) {
        img.src = "";
        wrap.style.display = "none";
    }
    if (openBtn) {
        openBtn.style.display = "none";
    }
    const badge = document.getElementById("cropStatusBadge");
    if (badge) {
        badge.textContent = "Photo Ready";
        badge.style.background = "rgba(34, 197, 94, 0.15)";
        badge.style.color = "#22c55e";
    }
}

// =========================================================
// Profile Pic Adjustment Studio Logic
// =========================================================
function initAdjustModal() {
    const closeBtn = document.getElementById("closeAdjustModalBtn");
    const cancelBtn = document.getElementById("cancelAdjustBtn");
    const applyBtn = document.getElementById("applyAdjustBtn");
    const openBtn = document.getElementById("openAdjustModalBtn");
    const reopenBtn = document.getElementById("reopenAdjustBtn");

    const zoomSlider = document.getElementById("zoomSlider");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const panXSlider = document.getElementById("panXSlider");
    const panYSlider = document.getElementById("panYSlider");
    const rotateLeftBtn = document.getElementById("rotateLeftBtn");
    const rotateRightBtn = document.getElementById("rotateRightBtn");
    const resetBtn = document.getElementById("resetAdjustBtn");
    const guideCircleBtn = document.getElementById("guideCircleBtn");
    const guideSquareBtn = document.getElementById("guideSquareBtn");
    const viewport = document.getElementById("cropperViewport");

    if (closeBtn) closeBtn.onclick = closeAdjustStudio;
    if (cancelBtn) cancelBtn.onclick = closeAdjustStudio;
    if (openBtn) openBtn.onclick = () => openAdjustStudioFromCurrentPreview();
    if (reopenBtn) reopenBtn.onclick = () => openAdjustStudioFromCurrentPreview();
    if (applyBtn) applyBtn.onclick = applyAdjustment;

    if (zoomSlider) {
        zoomSlider.addEventListener("input", (e) => {
            adjustScale = parseFloat(e.target.value) || 1.0;
            updateZoomLabel();
            renderCropCanvas();
        });
    }
    if (zoomInBtn) {
        zoomInBtn.onclick = () => {
            adjustScale = Math.min(3.0, Math.round((adjustScale + 0.1) * 100) / 100);
            if (zoomSlider) zoomSlider.value = adjustScale;
            updateZoomLabel();
            renderCropCanvas();
        };
    }
    if (zoomOutBtn) {
        zoomOutBtn.onclick = () => {
            adjustScale = Math.max(0.8, Math.round((adjustScale - 0.1) * 100) / 100);
            if (zoomSlider) zoomSlider.value = adjustScale;
            updateZoomLabel();
            renderCropCanvas();
        };
    }

    if (panXSlider) {
        panXSlider.addEventListener("input", (e) => {
            adjustPanX = parseInt(e.target.value) || 0;
            const lbl = document.getElementById("panXLabel");
            if (lbl) lbl.textContent = adjustPanX;
            renderCropCanvas();
        });
    }
    if (panYSlider) {
        panYSlider.addEventListener("input", (e) => {
            adjustPanY = parseInt(e.target.value) || 0;
            const lbl = document.getElementById("panYLabel");
            if (lbl) lbl.textContent = adjustPanY;
            renderCropCanvas();
        });
    }

    if (rotateLeftBtn) {
        rotateLeftBtn.onclick = () => {
            adjustRotation = (adjustRotation - 90) % 360;
            renderCropCanvas();
        };
    }
    if (rotateRightBtn) {
        rotateRightBtn.onclick = () => {
            adjustRotation = (adjustRotation + 90) % 360;
            renderCropCanvas();
        };
    }

    if (resetBtn) {
        resetBtn.onclick = () => {
            adjustScale = 1.0;
            adjustPanX = 0;
            adjustPanY = 0;
            adjustRotation = 0;
            if (zoomSlider) zoomSlider.value = 1.0;
            if (panXSlider) panXSlider.value = 0;
            if (panYSlider) panYSlider.value = 0;
            updateZoomLabel();
            updatePanSliders();
            renderCropCanvas();
        };
    }

    if (guideCircleBtn && guideSquareBtn) {
        guideCircleBtn.onclick = () => {
            currentGuideMode = "circle";
            const overlay = document.getElementById("cropGuideOverlay");
            if (overlay) overlay.style.borderRadius = "50%";
            guideCircleBtn.style.background = "var(--accent-color)";
            guideCircleBtn.style.color = "#fff";
            guideSquareBtn.style.background = "transparent";
            guideSquareBtn.style.color = "inherit";
        };
        guideSquareBtn.onclick = () => {
            currentGuideMode = "square";
            const overlay = document.getElementById("cropGuideOverlay");
            if (overlay) overlay.style.borderRadius = "12px";
            guideSquareBtn.style.background = "var(--accent-color)";
            guideSquareBtn.style.color = "#fff";
            guideCircleBtn.style.background = "transparent";
            guideCircleBtn.style.color = "inherit";
        };
    }

    // Interactive Dragging on Viewport
    if (viewport) {
        const onDragStart = (clientX, clientY) => {
            isDragging = true;
            dragStartX = clientX - adjustPanX;
            dragStartY = clientY - adjustPanY;
            viewport.style.cursor = "grabbing";
        };
        const onDragMove = (clientX, clientY) => {
            if (!isDragging) return;
            adjustPanX = clientX - dragStartX;
            adjustPanY = clientY - dragStartY;
            adjustPanX = Math.max(-150, Math.min(150, adjustPanX));
            adjustPanY = Math.max(-150, Math.min(150, adjustPanY));
            updatePanSliders();
            renderCropCanvas();
        };
        const onDragEnd = () => {
            if (isDragging) {
                isDragging = false;
                viewport.style.cursor = "grab";
            }
        };

        viewport.addEventListener("mousedown", (e) => onDragStart(e.clientX, e.clientY));
        window.addEventListener("mousemove", (e) => onDragMove(e.clientX, e.clientY));
        window.addEventListener("mouseup", onDragEnd);

        // Touch support for mobile/tablets
        viewport.addEventListener("touchstart", (e) => {
            if (e.touches && e.touches[0]) {
                onDragStart(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });
        window.addEventListener("touchmove", (e) => {
            if (e.touches && e.touches[0]) {
                onDragMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });
        window.addEventListener("touchend", onDragEnd);

        // Wheel Zoom
        viewport.addEventListener("wheel", (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            adjustScale = Math.max(0.8, Math.min(3.0, Math.round((adjustScale + delta) * 100) / 100));
            if (zoomSlider) zoomSlider.value = adjustScale;
            updateZoomLabel();
            renderCropCanvas();
        }, { passive: false });
    }
}

function updateZoomLabel() {
    const lbl = document.getElementById("zoomValLabel");
    if (lbl) lbl.textContent = Math.round(adjustScale * 100) + "%";
}

function updatePanSliders() {
    const sX = document.getElementById("panXSlider");
    const sY = document.getElementById("panYSlider");
    const lX = document.getElementById("panXLabel");
    const lY = document.getElementById("panYLabel");
    if (sX) sX.value = Math.round(adjustPanX);
    if (sY) sY.value = Math.round(adjustPanY);
    if (lX) lX.textContent = Math.round(adjustPanX);
    if (lY) lY.textContent = Math.round(adjustPanY);
}

function openAdjustStudioFromCurrentPreview() {
    const imgEl = document.getElementById("imagePreview");
    if (imgEl && imgEl.src && imgEl.src !== window.location.href) {
        openAdjustStudio(imgEl.src);
    } else if (currentMemberOriginalImage) {
        openAdjustStudio(getAdminImgSrc(currentMemberOriginalImage));
    } else {
        const urlInput = document.getElementById("memberImageUrl");
        if (urlInput && urlInput.value.trim()) {
            openAdjustStudio(urlInput.value.trim());
        } else {
            showToast("Please select a file or paste an image URL first.", "warning");
        }
    }
}

function openAdjustStudio(src) {
    const modal = document.getElementById("imageAdjustModal");
    if (!modal) return;

    showToast("Opening Photo Adjustment Studio...");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        currentAdjustImg = img;
        adjustScale = 1.0;
        adjustPanX = 0;
        adjustPanY = 0;
        adjustRotation = 0;
        updateZoomLabel();
        updatePanSliders();
        const zSlider = document.getElementById("zoomSlider");
        if (zSlider) zSlider.value = 1.0;

        renderCropCanvas();
        modal.style.display = "flex";
    };
    img.onerror = () => {
        // Fallback without crossOrigin
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
            currentAdjustImg = fallbackImg;
            adjustScale = 1.0;
            adjustPanX = 0;
            adjustPanY = 0;
            adjustRotation = 0;
            updateZoomLabel();
            updatePanSliders();
            renderCropCanvas();
            modal.style.display = "flex";
        };
        fallbackImg.onerror = () => {
            showToast("Failed to load image for adjustment. Please check image format.", "error");
        };
        fallbackImg.src = src;
    };
    img.src = src;
}

function closeAdjustStudio() {
    const modal = document.getElementById("imageAdjustModal");
    if (modal) modal.style.display = "none";
}

function renderCropCanvas() {
    if (!currentAdjustImg) return;
    const canvas = document.getElementById("cropCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 300, 300);
    ctx.save();

    // 1. Center of viewport + user pan offset
    ctx.translate(150 + adjustPanX, 150 + adjustPanY);

    // 2. Rotate
    ctx.rotate((adjustRotation * Math.PI) / 180);

    // 3. Scale
    ctx.scale(adjustScale, adjustScale);

    // 4. Draw image centered
    const iw = currentAdjustImg.naturalWidth || currentAdjustImg.width || 300;
    const ih = currentAdjustImg.naturalHeight || currentAdjustImg.height || 300;
    const baseSize = 260;
    let drawW, drawH;
    if (iw >= ih) {
        drawH = baseSize;
        drawW = (iw / ih) * baseSize;
    } else {
        drawW = baseSize;
        drawH = (ih / iw) * baseSize;
    }

    ctx.drawImage(currentAdjustImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Update real-time live preview thumbnails
    try {
        const thumbUrl = canvas.toDataURL("image/jpeg", 0.7);
        const liveCircle = document.getElementById("livePreviewCircle");
        const liveRect = document.getElementById("livePreviewRect");
        if (liveCircle) liveCircle.src = thumbUrl;
        if (liveRect) liveRect.src = thumbUrl;
    } catch (e) {}
}

function applyAdjustment() {
    if (!currentAdjustImg) {
        closeAdjustStudio();
        return;
    }

    // High resolution 600x600 export for crisp display
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 600;
    exportCanvas.height = 600;
    const eCtx = exportCanvas.getContext("2d");

    eCtx.fillStyle = "#ffffff";
    eCtx.fillRect(0, 0, 600, 600);
    eCtx.save();

    eCtx.translate(300 + adjustPanX * 2, 300 + adjustPanY * 2);
    eCtx.rotate((adjustRotation * Math.PI) / 180);
    eCtx.scale(adjustScale * 2, adjustScale * 2);

    const iw = currentAdjustImg.naturalWidth || currentAdjustImg.width || 300;
    const ih = currentAdjustImg.naturalHeight || currentAdjustImg.height || 300;
    const baseSize = 260;
    let drawW, drawH;
    if (iw >= ih) {
        drawH = baseSize;
        drawW = (iw / ih) * baseSize;
    } else {
        drawW = baseSize;
        drawH = (ih / iw) * baseSize;
    }

    eCtx.drawImage(currentAdjustImg, -drawW / 2, -drawH / 2, drawW, drawH);
    eCtx.restore();

    try {
        exportCanvas.toBlob((blob) => {
            if (blob) {
                adjustedImageBlob = blob;
            }
            adjustedImageDataUrl = exportCanvas.toDataURL("image/jpeg", 0.92);
            showPreview(adjustedImageDataUrl);

            const badge = document.getElementById("cropStatusBadge");
            if (badge) {
                badge.textContent = "\u2713 Adjusted & Cropped";
                badge.style.background = "rgba(34, 197, 94, 0.2)";
                badge.style.color = "#22c55e";
            }
            closeAdjustStudio();
            showToast("\u2713 Photo adjusted and cropped successfully!");
        }, "image/jpeg", 0.92);
    } catch (err) {
        console.warn("Canvas toBlob error:", err);
        try {
            adjustedImageDataUrl = exportCanvas.toDataURL("image/jpeg", 0.92);
            showPreview(adjustedImageDataUrl);
            closeAdjustStudio();
            showToast("\u2713 Photo adjustment applied!");
        } catch (e) {
            closeAdjustStudio();
        }
    }
}

async function saveCouncilMember() {
    const docId = document.getElementById("memberDocId").value;
    const name = document.getElementById("memberName").value.trim();
    if (!name) {
        showToast("Please enter the member's full name.", "warning");
        return;
    }

    const studentId = document.getElementById("memberStudentId") ? document.getElementById("memberStudentId").value.trim() : "";
    const branch = document.getElementById("memberBranch") ? document.getElementById("memberBranch").value.trim().toUpperCase() : "";
    const contactInfo = document.getElementById("memberContact") ? document.getElementById("memberContact").value.trim() : "";
    const existingPhotoPath = document.getElementById("memberPhotoPath") ? document.getElementById("memberPhotoPath").value.trim() : "";

    const fileInput = document.getElementById("memberImageFile");
    const typedUrl = document.getElementById("memberImageUrl").value.trim();
    const progressWrap = document.getElementById("memberUploadProgressWrap");
    const progressBar = document.getElementById("memberUploadProgressBar");
    const progressLabel = document.getElementById("memberUploadProgressLabel");

    let finalProfileImage = "";
    let finalPhotoPath = existingPhotoPath;
    let newlyUploaded = false;

    const setProgress = (pct) => {
        if (progressWrap) progressWrap.style.display = "block";
        if (progressBar) progressBar.style.width = pct + "%";
        if (progressLabel) progressLabel.textContent = `Uploading photo... ${pct}%`;
    };

    try {
        // 1. If user adjusted and cropped the image, upload that high-res adjusted blob
        if (adjustedImageBlob) {
            setProgress(15);
            showToast("Uploading adjusted profile photo to Storage...");
            const cleanName = name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
            const adjustedFile = new File([adjustedImageBlob], `council_${cleanName}_${Date.now()}.jpg`, { type: "image/jpeg" });
            const uploadRes = await uploadCouncilPhoto(adjustedFile, setProgress);
            finalProfileImage = uploadRes.url;
            finalPhotoPath = uploadRes.path || finalPhotoPath;
            newlyUploaded = true;
        } else if (fileInput && fileInput.files && fileInput.files[0]) {
            // 2. User picked raw file without opening adjust studio
            setProgress(15);
            showToast("Uploading profile photo to Storage...");
            const uploadRes = await uploadCouncilPhoto(fileInput.files[0], setProgress);
            finalProfileImage = uploadRes.url;
            finalPhotoPath = uploadRes.path || finalPhotoPath;
            newlyUploaded = true;
        }

        // 3. Else if user typed an explicit URL, use that
        if (!finalProfileImage && typedUrl) {
            finalProfileImage = typedUrl;
        }

        // 4. Else if editing an existing member, preserve THAT member's original image
        if (!finalProfileImage && currentMemberOriginalImage) {
            finalProfileImage = currentMemberOriginalImage;
        }

        // 5. Default fallback image
        if (!finalProfileImage) {
            finalProfileImage = "assets/nodp.png";
        } else if (finalProfileImage.startsWith("data:image/")) {
            finalProfileImage = await CMS.compressDataUrl(finalProfileImage, 460, 0.78);
        }

        // If a new photo was uploaded and there was a previous storage photo, clean up old photo
        if (newlyUploaded && existingPhotoPath && finalPhotoPath !== existingPhotoPath) {
            deleteStoragePhoto(existingPhotoPath);
        }

        const role = document.getElementById("memberRole").value.trim();
        const dept = document.getElementById("memberDept").value.trim();
        const leadershipRole = document.getElementById("memberLeadershipRole") ? document.getElementById("memberLeadershipRole").value : "member";

        // Prevent accidental duplicate active Coordinators in the same department
        if (leadershipRole === "coordinator") {
            const existingCoord = councilList.find(m => 
                m.id !== docId && 
                m.active !== false && 
                (m.department || "").toLowerCase().trim() === dept.toLowerCase().trim() &&
                ((m.leadershipRole || "").toLowerCase() === "coordinator" || ((m.role || "").toLowerCase().includes("coordinator") && !(m.role || "").toLowerCase().includes("associate")))
            );
            if (existingCoord) {
                const proceed = confirm(`${existingCoord.name} is currently the active Coordinator of ${dept}. Do you want to replace them as Coordinator?`);
                if (!proceed) return;
                // Gracefully demote previous coordinator to member
                await CMS.saveDoc("councilMembers", existingCoord.id, { leadershipRole: "member" });
            }
        }
        const memberType = document.getElementById("memberType").value;
        const description = document.getElementById("memberDesc").value.trim();
        const email = document.getElementById("memberEmail").value.trim();
        const linkedin = document.getElementById("memberLinkedin").value.trim();
        const github = document.getElementById("memberGithub").value.trim();
        const displayOrder = parseInt(document.getElementById("memberOrder").value) || 1;
        const councilYear = document.getElementById("memberCouncilYear").value.trim() || "2025-26";
        const isActive = document.getElementById("memberActive").checked;

        // Construct dual-property payload for 100% backward & forward compatibility
        const payload = {
            name: name,
            fullName: name,
            studentId: studentId,
            rollNo: studentId,
            branch: branch,
            branchCode: branch,
            memberType: memberType,
            role: role,
            department: dept,
            departmentName: dept,
            leadershipRole: leadershipRole,
            description: description,
            bio: description,
            profileImage: finalProfileImage,
            photoURL: finalProfileImage,
            photoPath: finalPhotoPath,
            email: email,
            contactInfo: contactInfo,
            phone: contactInfo,
            linkedin: linkedin,
            linkedinURL: linkedin,
            github: github,
            githubURL: github,
            displayOrder: displayOrder,
            order: displayOrder,
            councilYear: councilYear,
            active: isActive,
            isActive: isActive,
            updatedAt: (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue) 
                ? firebase.firestore.FieldValue.serverTimestamp() 
                : new Date().toISOString()
        };

        await CMS.saveDoc("councilMembers", docId || null, payload);
        showToast(`✓ Council member "${name}" saved successfully to Cloud!`);
        closeModal();
        await loadCouncilMembers();
    } catch (err) {
        console.error("saveCouncilMember error:", err);
        showToast("Error saving council member: " + err.message, "error");
    } finally {
        if (progressWrap) progressWrap.style.display = "none";
    }
}

function editMember(id) {
    const member = councilList.find(m => m.id === id);
    if (member) openCouncilModal(member);
}

async function toggleMemberStatus(id, newStatus) {
    try {
        await CMS.saveDoc("councilMembers", id, { active: newStatus });
        showToast("Member status updated.");
        await loadCouncilMembers();
    } catch (err) {
        showToast("Status update failed.", "error");
    }
}

let pendingDeleteMemberId = null;

function deleteMember(id) {
    const member = councilList.find(m => m.id === id);
    if (!member) return;
    pendingDeleteMemberId = id;
    const targetName = document.getElementById("deleteMemberTargetName");
    if (targetName) targetName.textContent = member.name || member.fullName || "this member";
    const modal = document.getElementById("deleteMemberModal");
    if (modal) modal.style.display = "flex";
}

function closeDeleteMemberModal() {
    const modal = document.getElementById("deleteMemberModal");
    if (modal) modal.style.display = "none";
    pendingDeleteMemberId = null;
}

async function confirmDeleteMember() {
    if (!pendingDeleteMemberId) return;
    const id = pendingDeleteMemberId;
    const member = councilList.find(m => m.id === id);
    closeDeleteMemberModal();

    try {
        if (member && member.photoPath) {
            await deleteStoragePhoto(member.photoPath);
        }
        await CMS.deleteDoc("councilMembers", id);
        showToast("✓ Council member deleted successfully.", "success");
        await loadCouncilMembers();
    } catch (err) {
        console.error("deleteMember error:", err);
        showToast("Failed to delete member: " + err.message, "error");
    }
}

// =========================================================
// Department & Leadership Management Logic
// =========================================================
async function loadDepartments() {
    try {
        departmentList = await CMS.getCollection("departments");
        
        // Auto Seed default departments if list is empty
        if (!departmentList || departmentList.length === 0) {
            for (const dept of DEFAULT_DEPTS) {
                await CMS.saveDoc("departments", null, dept);
            }
            departmentList = await CMS.getCollection("departments");
        }

        departmentList.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));
        
        const deptsCountBadge = document.getElementById("tabDeptsCount");
        if (deptsCountBadge) deptsCountBadge.textContent = departmentList.length;

        renderDeptsGrid();
    } catch (err) {
        console.error("loadDepartments error:", err);
    }
}

function setupRealtimeDeptsListener() {
    if (typeof db === "undefined") return;
    try {
        if (unsubscribeDeptsListener) unsubscribeDeptsListener();
        unsubscribeDeptsListener = db.collection("departments").onSnapshot((snapshot) => {
            if (snapshot.empty) return;
            const liveDepts = [];
            snapshot.forEach(doc => {
                liveDepts.push({ id: doc.id, ...doc.data() });
            });
            liveDepts.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));
            departmentList = liveDepts;
            const deptsCountBadge = document.getElementById("tabDeptsCount");
            if (deptsCountBadge) deptsCountBadge.textContent = departmentList.length;
            renderDeptsGrid();
        }, (err) => {
            console.warn("Real-time departments listener notice:", err);
        });
    } catch (e) {
        console.warn("setupRealtimeDeptsListener error:", e);
    }
}

function getMemberInitialsText(name) {
    if (!name || typeof name !== "string") return "--";
    const clean = name.replace(/^Dr\.\s*/i, "").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "--";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function countAssignedDeptMembers(dept) {
    if (!dept) return 0;
    const slug = (dept.slug || dept.id || "").toLowerCase();
    const name = (dept.name || "").toLowerCase();
    return councilList.filter(m => {
        if (m.active === false) return false;
        if (m.departmentId && dept.id && String(m.departmentId) === String(dept.id)) return true;
        const d = (m.department || "").toLowerCase();
        if (slug && d === slug) return true;
        if (name && d === name) return true;
        if (slug === "rnd" && (d.includes("r&d") || d.includes("research"))) return true;
        if (slug === "digital" && (d.includes("digital") || d.includes("infra") || d.includes("tech"))) return true;
        if (slug === "pr" && (d.includes("public relations") || d.includes("pr"))) return true;
        if (slug === "operations" && d.includes("operation")) return true;
        if (slug === "strategy" && (d.includes("strateg") || d.includes("content"))) return true;
        if (slug === "social" && (d.includes("social") || d.includes("visual") || d.includes("media"))) return true;
        if (slug === "finance" && (d.includes("finance") || d.includes("budget") || d.includes("treasurer"))) return true;
        return false;
    }).length;
}

function findCoordinatorForDept(dept) {
    if (dept.coordinatorId) {
        const found = councilList.find(m => m.id === dept.coordinatorId);
        if (found) return found;
    }
    if (dept.coordinatorName) {
        const found = councilList.find(m => m.name && m.name.toLowerCase() === dept.coordinatorName.toLowerCase());
        if (found) return found;
    }
    // Fallback: search members assigned to this department
    const slug = (dept.slug || "").toLowerCase();
    return councilList.find(m => {
        if (m.active === false) return false;
        const d = (m.department || "").toLowerCase();
        const role = (m.role || "").toLowerCase();
        const lRole = (m.leadershipRole || "").toLowerCase();
        const matchesDept = (slug === "rnd" && d.includes("research")) ||
                            (slug === "digital" && d.includes("digital")) ||
                            (slug === "pr" && d.includes("public")) ||
                            (slug === "operations" && d.includes("operation")) ||
                            (slug === "strategy" && d.includes("strateg")) ||
                            (slug === "social" && d.includes("visual")) ||
                            (slug === "finance" && (d.includes("finance") || d.includes("treasurer")));
        return matchesDept && (lRole === "coordinator" || (role.includes("co-ordinator") || role.includes("coordinator")) && !role.includes("associate"));
    });
}

function findAssociateForDept(dept, coordinator) {
    if (dept.associateCoordinatorId) {
        const found = councilList.find(m => m.id === dept.associateCoordinatorId);
        if (found) return found;
    }
    if (dept.associateCoordinatorName) {
        const found = councilList.find(m => m.name && m.name.toLowerCase() === dept.associateCoordinatorName.toLowerCase());
        if (found) return found;
    }
    const slug = (dept.slug || "").toLowerCase();
    return councilList.find(m => {
        if (m.active === false || m === coordinator) return false;
        const d = (m.department || "").toLowerCase();
        const role = (m.role || "").toLowerCase();
        const lRole = (m.leadershipRole || "").toLowerCase();
        const matchesDept = (slug === "rnd" && d.includes("research")) ||
                            (slug === "digital" && d.includes("digital")) ||
                            (slug === "pr" && d.includes("public")) ||
                            (slug === "operations" && d.includes("operation")) ||
                            (slug === "strategy" && d.includes("strateg")) ||
                            (slug === "social" && d.includes("visual")) ||
                            (slug === "finance" && d.includes("finance"));
        return matchesDept && (lRole === "associate_coordinator" || role.includes("associate"));
    });
}

function renderDeptsGrid() {
    const container = document.getElementById("deptsListContainer");
    if (!container) return;
    container.innerHTML = "";

    if (departmentList.length === 0) {
        container.innerHTML = `<div class="card" style="grid-column:1/-1; padding:30px; text-align:center;">No departments found. Click "+ Create New Department" to add one.</div>`;
        return;
    }

    departmentList.forEach(dept => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "padding:22px; border-radius:14px; display:flex; flex-direction:column; justify-content:space-between; position:relative; border:1px solid var(--border-color);";

        const activeStatus = dept.active !== false;
        const assignedCount = countAssignedDeptMembers(dept);
        const coordinator = findCoordinatorForDept(dept);
        const associate = findAssociateForDept(dept, coordinator);

        // Coordinator snippet
        let coordSnippet = "";
        if (coordinator) {
            const hasImg = coordinator.profileImage && coordinator.profileImage !== "assets/nodp.png";
            coordSnippet = `
                <div style="display:flex; align-items:center; gap:10px; background:rgba(200, 155, 53, 0.08); padding:10px 12px; border-radius:10px; border:1px solid rgba(200, 155, 53, 0.25);">
                    ${hasImg ? `
                        <img src="${getAdminImgSrc(coordinator.profileImage)}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:1.5px solid #C89B35;" onerror="this.onerror=null; this.src='../assets/nodp.png';">
                    ` : `
                        <div style="width:38px; height:38px; border-radius:50%; background:#102820; color:#C89B35; border:1.5px solid #C89B35; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem;">
                            ${getMemberInitialsText(coordinator.name)}
                        </div>
                    `}
                    <div style="flex:1; min-width:0;">
                        <span style="font-size:0.7rem; font-weight:700; color:#C89B35; text-transform:uppercase; letter-spacing:0.06em;">★ Coordinator</span>
                        <h4 style="margin:2px 0 0; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(coordinator.name)}</h4>
                        <p style="margin:0; font-size:0.75rem; opacity:0.75; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(coordinator.role || "Coordinator")}</p>
                    </div>
                </div>
            `;
        } else {
            coordSnippet = `
                <div style="display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.02); padding:10px 12px; border-radius:10px; border:1px dashed var(--border-color);">
                    <div style="width:38px; height:38px; border-radius:50%; background:rgba(0,0,0,0.05); display:flex; align-items:center; justify-content:center; font-size:0.85rem; color:var(--text-secondary);">--</div>
                    <div>
                        <span style="font-size:0.7rem; font-weight:700; opacity:0.6; text-transform:uppercase;">Coordinator</span>
                        <h4 style="margin:2px 0 0; font-size:0.9rem; font-weight:500; font-style:italic; opacity:0.75;">Position not assigned</h4>
                    </div>
                </div>
            `;
        }

        // Associate snippet
        let assocSnippet = "";
        if (associate) {
            const hasImg = associate.profileImage && associate.profileImage !== "assets/nodp.png";
            assocSnippet = `
                <div style="display:flex; align-items:center; gap:10px; background:rgba(16, 40, 32, 0.05); padding:10px 12px; border-radius:10px; border:1px solid rgba(16, 40, 32, 0.15);">
                    ${hasImg ? `
                        <img src="${getAdminImgSrc(associate.profileImage)}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:1.5px solid var(--border-color);" onerror="this.onerror=null; this.src='../assets/nodp.png';">
                    ` : `
                        <div style="width:38px; height:38px; border-radius:50%; background:#102820; color:#EAE5DA; border:1.5px solid var(--border-color); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem;">
                            ${getMemberInitialsText(associate.name)}
                        </div>
                    `}
                    <div style="flex:1; min-width:0;">
                        <span style="font-size:0.7rem; font-weight:700; opacity:0.8; text-transform:uppercase; letter-spacing:0.06em;">Associate Coordinator</span>
                        <h4 style="margin:2px 0 0; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(associate.name)}</h4>
                        <p style="margin:0; font-size:0.75rem; opacity:0.75; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(associate.role || "Associate Coordinator")}</p>
                    </div>
                </div>
            `;
        } else {
            assocSnippet = `
                <div style="display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.02); padding:10px 12px; border-radius:10px; border:1px dashed var(--border-color);">
                    <div style="width:38px; height:38px; border-radius:50%; background:rgba(0,0,0,0.05); display:flex; align-items:center; justify-content:center; font-size:0.85rem; color:var(--text-secondary);">--</div>
                    <div>
                        <span style="font-size:0.7rem; font-weight:700; opacity:0.6; text-transform:uppercase;">Associate Coordinator</span>
                        <h4 style="margin:2px 0 0; font-size:0.9rem; font-weight:500; font-style:italic; opacity:0.75;">Position not assigned</h4>
                    </div>
                </div>
            `;
        }

        card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.8rem;">${dept.icon || "🏛️"}</span>
                        <div>
                            <span style="font-size:0.72rem; font-weight:700; text-transform:uppercase; color:var(--accent-color);">${escapeHtml(dept.tag || "Department")}</span>
                            <h3 style="margin:0; font-size:1.15rem;">${escapeHtml(dept.name)}</h3>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:0.75rem; background:rgba(200,155,53,0.12); color:#C89B35; font-weight:700; padding:3px 10px; border-radius:20px; border:1px solid rgba(200,155,53,0.25);">
                            ${assignedCount} Member${assignedCount === 1 ? "" : "s"}
                        </span>
                        <span style="padding:3px 8px; border-radius:12px; font-size:0.72rem; font-weight:600; background:${activeStatus ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color:${activeStatus ? '#22c55e' : '#ef4444'};">
                            ${activeStatus ? 'Active' : 'Disabled'}
                        </span>
                    </div>
                </div>

                <p style="font-size:0.84rem; opacity:0.85; line-height:1.4; margin-bottom:16px;">
                    ${escapeHtml(dept.description || dept.shortDescription || "")}
                </p>

                <div style="display:grid; gap:10px; margin-bottom:14px;">
                    ${coordSnippet}
                    ${assocSnippet}
                </div>
            </div>

            <div style="display:flex; gap:8px; margin-top:14px; border-top:1px solid var(--border-color); padding-top:12px; flex-wrap:wrap;">
                <button type="button" onclick="openAssignLeadershipModal('${dept.id || dept.slug}')" class="primary-btn" style="flex:1; min-width:130px; padding:7px 12px; font-size:0.82rem; font-weight:600; display:flex; align-items:center; justify-content:center; gap:6px;">
                    <span>⚡</span> Assign Leadership
                </button>
                <button type="button" onclick="openDeptModalById('${dept.id || dept.slug}')" class="secondary-btn" style="padding:7px 12px; font-size:0.82rem;">
                    ✏️ Edit Details
                </button>
                <button type="button" onclick="toggleDeptStatus('${dept.id || dept.slug}', ${!activeStatus})" class="secondary-btn" style="padding:7px 10px; font-size:0.82rem;">
                    ${activeStatus ? 'Disable' : 'Enable'}
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

function openAssignLeadershipModal(deptId) {
    const dept = departmentList.find(d => (d.id === deptId || d.slug === deptId));
    if (!dept) {
        showToast("Department not found.", "warning");
        return;
    }
    currentAssignDept = dept;

    const modal = document.getElementById("assignLeadershipModal");
    const title = document.getElementById("assignModalTitle");
    const subtitle = document.getElementById("assignDeptSubtitle");
    const deptIdInput = document.getElementById("assignDeptId");
    const coordSelect = document.getElementById("assignCoordinatorSelect");
    const assocSelect = document.getElementById("assignAssociateSelect");
    const alertBox = document.getElementById("assignConflictAlert");
    const saveBtn = document.getElementById("saveLeadershipBtn");

    if (!modal || !coordSelect || !assocSelect) return;

    if (title) title.textContent = `Assign Leadership: ${dept.name}`;
    if (subtitle) subtitle.textContent = `Department ID: ${dept.slug || dept.id} • Current roster: ${countAssignedDeptMembers(dept)} members`;
    if (deptIdInput) deptIdInput.value = dept.id || dept.slug;
    if (alertBox) alertBox.style.display = "none";
    if (saveBtn) saveBtn.disabled = false;

    // Filter active members for dropdown selection
    const activeMembers = councilList.filter(m => m.active !== false && !m.name.includes("member 2"));
    activeMembers.sort((a, b) => a.name.localeCompare(b.name));

    // Identify current selections
    const currentCoord = findCoordinatorForDept(dept);
    const currentAssoc = findAssociateForDept(dept, currentCoord);

    // Build Coordinator options
    let coordOptions = `<option value="">(None - Position not assigned)</option>`;
    activeMembers.forEach(m => {
        const isSelected = (currentCoord && m.id === currentCoord.id) || (m.name === dept.coordinatorName);
        coordOptions += `<option value="${m.id}" ${isSelected ? "selected" : ""}>${escapeHtml(m.name)} (${escapeHtml(m.role || m.department || 'Member')})</option>`;
    });
    coordSelect.innerHTML = coordOptions;

    // Build Associate Coordinator options
    let assocOptions = `<option value="">(None - Position not assigned)</option>`;
    activeMembers.forEach(m => {
        const isSelected = (currentAssoc && m.id === currentAssoc.id) || (m.name === dept.associateCoordinatorName);
        assocOptions += `<option value="${m.id}" ${isSelected ? "selected" : ""}>${escapeHtml(m.name)} (${escapeHtml(m.role || m.department || 'Member')})</option>`;
    });
    assocSelect.innerHTML = assocOptions;

    modal.style.display = "flex";
}

function closeAssignModal() {
    const modal = document.getElementById("assignLeadershipModal");
    if (modal) modal.style.display = "none";
    currentAssignDept = null;
}

async function saveLeadershipAssignment() {
    if (!currentAssignDept) return;
    const deptId = document.getElementById("assignDeptId").value;
    const coordId = document.getElementById("assignCoordinatorSelect").value;
    const assocId = document.getElementById("assignAssociateSelect").value;
    const alertBox = document.getElementById("assignConflictAlert");

    // Prevent selecting the same person for both roles
    if (coordId && assocId && coordId === assocId) {
        if (alertBox) alertBox.style.display = "block";
        showToast("Role conflict: Same member chosen for Coordinator and Associate Coordinator.", "warning");
        return;
    }

    const coordinatorMember = councilList.find(m => m.id === coordId);
    const associateMember = councilList.find(m => m.id === assocId);

    const updatePayload = {
        coordinatorId: coordId || "",
        coordinatorName: coordinatorMember ? coordinatorMember.name : "",
        associateCoordinatorId: assocId || "",
        associateCoordinatorName: associateMember ? associateMember.name : ""
    };

    try {
        const targetDeptId = (currentAssignDept.id && !currentAssignDept.id.startsWith("local_")) ? currentAssignDept.id : null;
        await CMS.saveDoc("departments", targetDeptId, updatePayload);

        // Update members leadershipRole in councilMembers collection
        if (coordinatorMember) {
            await CMS.saveDoc("councilMembers", coordinatorMember.id, {
                leadershipRole: "coordinator",
                department: currentAssignDept.name
            });
        }
        if (associateMember) {
            await CMS.saveDoc("councilMembers", associateMember.id, {
                leadershipRole: "associate_coordinator",
                department: currentAssignDept.name
            });
        }

        showToast(`\u2713 Leadership assigned for ${currentAssignDept.name}! Updates visible on live Council page.`);
        closeAssignModal();
        await Promise.all([loadDepartments(), loadCouncilMembers()]);
    } catch (err) {
        showToast("Failed to save leadership assignment: " + err.message, "error");
    }
}

function openDeptModalById(deptId) {
    const dept = departmentList.find(d => (d.id === deptId || d.slug === deptId));
    openDeptModal(dept);
}

function openDeptModal(dept = null) {
    const modal = document.getElementById("deptModal");
    const title = document.getElementById("deptModalTitle");
    if (!modal) return;

    if (dept) {
        if (title) title.textContent = "Edit Department";
        document.getElementById("deptDocId").value = dept.id || "";
        document.getElementById("deptName").value = dept.name || "";
        document.getElementById("deptSlug").value = dept.slug || "";
        document.getElementById("deptIcon").value = dept.icon || "🧪";
        document.getElementById("deptTag").value = dept.tag || "";
        document.getElementById("deptShortDesc").value = dept.shortDescription || "";
        document.getElementById("deptFullDesc").value = dept.description || "";
        document.getElementById("deptOrder").value = dept.displayOrder || 1;
        document.getElementById("deptActive").checked = dept.active !== false;
    } else {
        if (title) title.textContent = "Create New Department";
        document.getElementById("deptForm").reset();
        document.getElementById("deptDocId").value = "";
        document.getElementById("deptActive").checked = true;
        const maxOrder = Math.max(0, ...departmentList.map(d => parseInt(d.displayOrder) || 0));
        document.getElementById("deptOrder").value = maxOrder + 1;
    }

    modal.style.display = "flex";
}

function closeDeptModal() {
    const modal = document.getElementById("deptModal");
    if (modal) modal.style.display = "none";
    const form = document.getElementById("deptForm");
    if (form) form.reset();
}

async function saveDept() {
    const docId = document.getElementById("deptDocId").value;
    const name = document.getElementById("deptName").value.trim();
    const slug = document.getElementById("deptSlug").value.trim().toLowerCase();

    if (!name || !slug) {
        showToast("Please enter department name and slug identifier.", "warning");
        return;
    }

    const payload = {
        name,
        slug,
        icon: document.getElementById("deptIcon").value.trim() || "🏛️",
        tag: document.getElementById("deptTag").value.trim() || "Department",
        shortDescription: document.getElementById("deptShortDesc").value.trim(),
        description: document.getElementById("deptFullDesc").value.trim(),
        displayOrder: parseInt(document.getElementById("deptOrder").value) || 1,
        active: document.getElementById("deptActive").checked
    };

    try {
        await CMS.saveDoc("departments", docId || null, payload);
        showToast(`\u2713 Department "${name}" saved to Cloud Firestore!`);
        closeDeptModal();
        await loadDepartments();
    } catch (err) {
        showToast("Error saving department: " + err.message, "error");
    }
}

async function toggleDeptStatus(id, newStatus) {
    try {
        await CMS.saveDoc("departments", id, { active: newStatus });
        showToast("Department status updated.");
        await loadDepartments();
    } catch (err) {
        showToast("Status update failed.", "error");
    }
}

async function deleteDept(id) {
    if (confirm("Are you sure you want to delete this department? Consider using Disable instead to preserve historical records.")) {
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

// Expose functions globally for inline onclick handlers
window.openCouncilModal = openCouncilModal;
window.closeModal = closeModal;
window.editMember = editMember;
window.deleteMember = deleteMember;
window.closeDeleteMemberModal = closeDeleteMemberModal;
window.confirmDeleteMember = confirmDeleteMember;
window.toggleMemberStatus = toggleMemberStatus;
window.openAssignLeadershipModal = openAssignLeadershipModal;
window.closeAssignModal = closeAssignModal;
window.openDeptModalById = openDeptModalById;
window.openDeptModal = openDeptModal;
window.closeDeptModal = closeDeptModal;
window.toggleDeptStatus = toggleDeptStatus;
window.deleteDept = deleteDept;
