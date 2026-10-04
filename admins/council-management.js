// =========================================================
// Council & Team Management Logic (Isolated Image State Fix)
// =========================================================

let councilList = [];
let currentMemberOriginalImage = "";

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
        name: "Rajavardhan P",
        memberType: "Student Leader",
        role: "Digital Infrastructure Co-ordinator",
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

    const searchInput = document.getElementById("searchCouncilInput");
    if (searchInput) {
        searchInput.addEventListener("input", () => renderCouncilGrid());
    }

    const yearSelect = document.getElementById("councilYearFilterSelect");
    if (yearSelect) {
        yearSelect.addEventListener("change", () => renderCouncilGrid());
    }

    await loadCouncilMembers();
    setupRealtimeCouncilListener();
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

    const searchInput = document.getElementById("searchCouncilInput");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const yearSelect = document.getElementById("councilYearFilterSelect");
    const termFilter = yearSelect ? yearSelect.value : "all";

    const filtered = councilList.filter(m => {
        // Exclude placeholder member if present
        if (m.name && m.name.toLowerCase().includes("member 2")) return false;

        // Year filter
        if (termFilter !== "all") {
            const memberYear = m.councilYear || "2025-26";
            if (memberYear !== termFilter) return false;
        }

        // Search query
        if (query) {
            const name = (m.name || "").toLowerCase();
            const role = (m.role || "").toLowerCase();
            const dept = (m.department || "").toLowerCase();
            if (!name.includes(query) && !role.includes(query) && !dept.includes(query)) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="card" style="grid-column:1/-1; padding:30px; text-align:center;">No council members match the selected term or search criteria. Click "+ Add Council Member" to add team members.</div>`;
        return;
    }

    filtered.forEach(m => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "padding:20px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; position:relative;";

        const activeStatus = m.active !== false;

        card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:6px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:12px; background:rgba(199,107,60,0.15); color:var(--accent-color);">${escapeHtml(m.memberType || "Student Leader")}</span>
                        <span style="font-size:0.75rem; background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:10px; opacity:0.85;">Term ${escapeHtml(m.councilYear || "2025-26")}</span>
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

    if (member) {
        title.textContent = "Edit Council Member";
        currentMemberOriginalImage = member.profileImage || "";

        document.getElementById("memberDocId").value = member.id;
        document.getElementById("memberName").value = member.name || "";
        document.getElementById("memberType").value = member.memberType || "Student Leader";
        document.getElementById("memberRole").value = member.role || "";
        document.getElementById("memberDept").value = member.department || "";
        document.getElementById("memberDesc").value = member.description || "";
        document.getElementById("memberImageUrl").value = member.profileImage || "";
        document.getElementById("memberEmail").value = member.email || "";
        document.getElementById("memberLinkedin").value = member.linkedin || "";
        document.getElementById("memberGithub").value = member.github || "";
        document.getElementById("memberOrder").value = member.displayOrder || 1;
        document.getElementById("memberCouncilYear").value = member.councilYear || "2025-26";
        document.getElementById("memberActive").checked = member.active !== false;

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

    const fileInput = document.getElementById("memberImageFile");
    const typedUrl = document.getElementById("memberImageUrl").value.trim();
    let finalProfileImage = "";

    // 1. If user adjusted and cropped the image, upload that high-res adjusted blob
    if (adjustedImageBlob) {
        try {
            showToast("Uploading adjusted profile photo...");
            const adjustedFile = new File([adjustedImageBlob], `council_profile_${Date.now()}.jpg`, { type: "image/jpeg" });
            finalProfileImage = await CMS.uploadImage(adjustedFile, "council");
        } catch (e) {
            console.warn("Upload adjusted image notice, falling back to dataUrl:", e);
            if (adjustedImageDataUrl) finalProfileImage = adjustedImageDataUrl;
        }
    } else if (fileInput && fileInput.files && fileInput.files[0]) {
        // 2. User picked raw file without opening adjust studio
        try {
            showToast("Processing profile image...");
            finalProfileImage = await CMS.uploadImage(fileInput.files[0], "council");
        } catch (e) {
            console.warn("Image upload notice:", e);
        }
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

    const payload = {
        name,
        memberType: document.getElementById("memberType").value,
        role: document.getElementById("memberRole").value.trim(),
        department: document.getElementById("memberDept").value.trim(),
        description: document.getElementById("memberDesc").value.trim(),
        profileImage: finalProfileImage,
        email: document.getElementById("memberEmail").value.trim(),
        linkedin: document.getElementById("memberLinkedin").value.trim(),
        github: document.getElementById("memberGithub").value.trim(),
        displayOrder: parseInt(document.getElementById("memberOrder").value) || 1,
        councilYear: document.getElementById("memberCouncilYear").value.trim() || "2025-26",
        active: document.getElementById("memberActive").checked
    };

    try {
        await CMS.saveDoc("councilMembers", docId, payload);
        showToast(`\u2713 Council member "${name}" saved to Cloud! Visible across all devices.`);
        closeModal();
        await loadCouncilMembers();
    } catch (err) {
        showToast("Error saving council member: " + err.message, "error");
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

async function deleteMember(id) {
    if (confirm("Are you sure you want to delete this council member?")) {
        try {
            await CMS.deleteDoc("councilMembers", id);
            showToast("Council member deleted successfully.");
            await loadCouncilMembers();
        } catch (err) {
            showToast("Failed to delete member.", "error");
        }
    }
}

function escapeHtml(str) {
    return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
