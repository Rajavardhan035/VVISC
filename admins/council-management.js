// =========================================================
// Council & Team Management Logic (Isolated Image State Fix)
// =========================================================

let councilList = [];
let currentMemberOriginalImage = "";

const DEFAULT_COUNCIL_MEMBERS = [
    {
        name: "Dr. Faculty Name",
        memberType: "Chief Faculty",
        role: "Chief Faculty Coordinator",
        department: "AI & ML Department",
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

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");
    await loadCouncilMembers();

    const addBtn = document.getElementById("addMemberBtn");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelModalBtn");
    const form = document.getElementById("councilForm");
    const fileInput = document.getElementById("memberImageFile");
    const urlInput = document.getElementById("memberImageUrl");

    if (addBtn) addBtn.onclick = () => openCouncilModal();
    if (closeBtn) closeBtn.onclick = () => closeModal();
    if (cancelBtn) cancelBtn.onclick = () => closeModal();

    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => showPreview(evt.target.result);
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
});

function getAdminImgSrc(src) {
    if (!src) return '../assets/nodp.png';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('../')) return src;
    return '../' + src;
}

async function loadCouncilMembers() {
    councilList = await CMS.getCollection("councilMembers", { orderBy: "displayOrder", orderDirection: "asc" });

    // Auto Seed default council members if collection is empty
    if (!councilList || councilList.length === 0) {
        for (const member of DEFAULT_COUNCIL_MEMBERS) {
            await CMS.saveDoc("councilMembers", null, member);
        }
        councilList = await CMS.getCollection("councilMembers", { orderBy: "displayOrder", orderDirection: "asc" });
    }

    councilList.sort((a, b) => (parseInt(a.displayOrder) || 999) - (parseInt(b.displayOrder) || 999));
    renderCouncilGrid();
}

function renderCouncilGrid() {
    const container = document.getElementById("councilListContainer");
    if (!container) return;
    container.innerHTML = "";

    if (councilList.length === 0) {
        container.innerHTML = `<div class="card" style="grid-column:1/-1; padding:30px; text-align:center;">No council members found. Click "+ Add Council Member" to add team members.</div>`;
        return;
    }

    councilList.forEach(m => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "padding:20px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; position:relative;";

        const activeStatus = m.active !== false;

        card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:12px; background:rgba(199,107,60,0.15); color:var(--accent-color);">${escapeHtml(m.memberType || "Student Leader")}</span>
                        <span style="font-size:0.75rem; opacity:0.7;">Order #${m.displayOrder || 1}</span>
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
                ${m.department ? `<p style="font-size:0.8rem; opacity:0.7; margin-bottom:6px;">🏢 ${escapeHtml(m.department)}</p>` : ""}
                ${m.email ? `<p style="font-size:0.8rem; opacity:0.7; margin-bottom:8px;">📧 ${escapeHtml(m.email)}</p>` : ""}
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
        document.getElementById("memberActive").checked = member.active !== false;

        if (member.profileImage) {
            showPreview(getAdminImgSrc(member.profileImage));
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
}

function showPreview(url) {
    const wrap = document.getElementById("imagePreviewWrap");
    const img = document.getElementById("imagePreview");
    if (wrap && img) {
        img.src = url;
        wrap.style.display = "block";
    }
}

function hidePreview() {
    const wrap = document.getElementById("imagePreviewWrap");
    const img = document.getElementById("imagePreview");
    if (wrap && img) {
        img.src = "";
        wrap.style.display = "none";
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

    // 1. If user picked a NEW file, process THAT file exclusively
    if (fileInput && fileInput.files && fileInput.files[0]) {
        try {
            showToast("Processing profile image...");
            finalProfileImage = await CMS.uploadImage(fileInput.files[0], "council");
        } catch (e) {
            console.warn("Image upload notice:", e);
        }
    }

    // 2. Else if user typed an explicit URL, use that
    if (!finalProfileImage && typedUrl) {
        finalProfileImage = typedUrl;
    }

    // 3. Else if editing an existing member, preserve THAT member's original image
    if (!finalProfileImage && currentMemberOriginalImage) {
        finalProfileImage = currentMemberOriginalImage;
    }

    // 4. Default fallback image
    if (!finalProfileImage) {
        finalProfileImage = "assets/nodp.png";
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
        active: document.getElementById("memberActive").checked
    };

    try {
        await CMS.saveDoc("councilMembers", docId, payload);
        showToast(`✓ Council member "${name}" saved successfully!`);
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
