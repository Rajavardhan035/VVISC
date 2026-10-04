// =========================================================
// Partners & Collaborations Management Logic
// =========================================================

let partnersList = [];

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");

    await loadPartners();

    const addBtn = document.getElementById("addPartnerBtn");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const modal = document.getElementById("partnerModal");
    const form = document.getElementById("partnerForm");
    const fileInput = document.getElementById("partnerLogoFile");

    if (addBtn) addBtn.onclick = () => openModal();
    if (closeBtn) closeBtn.onclick = () => closeModal();
    if (cancelBtn) cancelBtn.onclick = () => closeModal();
    if (modal) {
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    }

    if (fileInput) {
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const preview = document.getElementById("logoPreview");
                    const wrap = document.getElementById("logoPreviewWrap");
                    if (preview && wrap) {
                        preview.src = evt.target.result;
                        wrap.style.display = "block";
                    }
                };
                reader.readAsDataURL(file);
            }
        };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            await savePartner();
        };
    }
});

async function loadPartners() {
    try {
        partnersList = await CMS.getCollection("partners");
        if (!partnersList || partnersList.length === 0) {
            partnersList = [
                {
                    id: "part-1",
                    name: "IUCEE Global",
                    category: "Academic Partner",
                    websiteUrl: "https://iucee.org",
                    description: "Indo Universal Collaboration for Engineering Education & international curriculum alignment.",
                    logo: "assets/logo.png",
                    active: true,
                    displayOrder: 1
                },
                {
                    id: "part-2",
                    name: "AWS Educate",
                    category: "Cloud & Tech Partner",
                    websiteUrl: "https://aws.amazon.com/education/awseducate/",
                    description: "Cloud computing credits, certification curriculum, and hands-on laboratory resources.",
                    logo: "assets/logo.png",
                    active: true,
                    displayOrder: 2
                }
            ];
        }
        renderGrid();
    } catch (e) {
        console.error("Error loading partners:", e);
    }
}

function renderGrid() {
    const grid = document.getElementById("partnersGrid");
    if (!grid) return;

    const filtered = partnersList.filter(p => p.active !== false);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted, #94a3b8);">
                No partners found. Click "+ Add Partner" to create one.
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const logoSrc = p.logo || "assets/logo.png";
        return `
            <div class="partner-card" data-id="${CMS.escapeHtml(p.id)}">
                <div class="partner-logo-box">
                    <img src="${CMS.escapeHtml(logoSrc)}" alt="${CMS.escapeHtml(p.name)}" class="partner-logo" onerror="this.src='assets/logo.png'">
                </div>
                <span style="font-size:0.75rem; color:#60a5fa; font-weight:600; margin-bottom:4px;">
                    ${CMS.escapeHtml(p.category || "Partner")}
                </span>
                <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:8px; color:#fff;">
                    ${CMS.escapeHtml(p.name)}
                </h3>
                <p style="font-size:0.85rem; color:#94a3b8; line-height:1.5; margin-bottom:14px; flex:1;">
                    ${CMS.escapeHtml(p.description || "")}
                </p>
                ${p.websiteUrl ? `
                    <a href="${CMS.escapeHtml(p.websiteUrl)}" target="_blank" rel="noopener noreferrer" style="font-size:0.8rem; color:var(--accent-color,#6366f1); text-decoration:none; margin-bottom:14px; display:inline-flex; align-items:center; gap:4px;">
                        Visit Website &nearr;
                    </a>
                ` : ''}
                <div style="display:flex; justify-content:center; gap:8px; width:100%; border-top:1px solid rgba(255,255,255,0.08); padding-top:12px;">
                    <button class="secondary-btn" style="padding:6px 12px; font-size:0.8rem;" onclick="openModal('${CMS.escapeHtml(p.id)}')">Edit</button>
                    <button class="secondary-btn" style="padding:6px 10px; font-size:0.8rem; color:#ef4444;" onclick="deletePartner('${CMS.escapeHtml(p.id)}')">Delete</button>
                </div>
            </div>
        `;
    }).join("");
}

function openModal(id = null) {
    const modal = document.getElementById("partnerModal");
    const form = document.getElementById("partnerForm");
    const title = document.getElementById("modalTitle");
    const wrap = document.getElementById("logoPreviewWrap");
    if (form) form.reset();
    if (wrap) wrap.style.display = "none";

    if (id) {
        const item = partnersList.find(p => p.id === id);
        if (item) {
            title.textContent = "Edit Partner";
            document.getElementById("partnerDocId").value = item.id;
            document.getElementById("partnerName").value = item.name || "";
            document.getElementById("partnerCategory").value = item.category || "Academic Partner";
            document.getElementById("partnerUrl").value = item.websiteUrl || "";
            document.getElementById("partnerDesc").value = item.description || "";
            document.getElementById("partnerLogoUrl").value = item.logo || "";

            if (item.logo) {
                const preview = document.getElementById("logoPreview");
                if (preview) preview.src = item.logo;
                if (wrap) wrap.style.display = "block";
            }
        }
    } else {
        title.textContent = "Add Partner";
        document.getElementById("partnerDocId").value = "";
    }

    if (modal) modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("partnerModal");
    if (modal) modal.style.display = "none";
}

async function savePartner() {
    const docId = document.getElementById("partnerDocId").value;
    const saveBtn = document.getElementById("savePartnerBtn");
    const file = document.getElementById("partnerLogoFile")?.files[0];
    let logoUrl = document.getElementById("partnerLogoUrl").value;

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
    }

    try {
        if (file) {
            logoUrl = await CMS.uploadImage(file, "partners");
        }

        const data = {
            name: document.getElementById("partnerName").value.trim(),
            category: document.getElementById("partnerCategory").value,
            websiteUrl: document.getElementById("partnerUrl").value.trim(),
            description: document.getElementById("partnerDesc").value.trim(),
            logo: logoUrl || "assets/logo.png",
            active: true
        };

        if (docId) {
            await CMS.saveDocument("partners", docId, data);
            showToast("Partner updated!");
        } else {
            data.displayOrder = partnersList.length + 1;
            const newDoc = await db.collection("partners").add({
                ...data,
                createdAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
            });
            await CMS.logAudit("create", "partners", newDoc.id, { name: data.name });
            showToast("Partner added!");
        }

        closeModal();
        await loadPartners();
    } catch (err) {
        console.error("Error saving partner:", err);
        showToast("Error saving: " + err.message, "error");
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Partner";
        }
    }
}

window.deletePartner = async function(docId) {
    if (!confirm("Are you sure you want to remove this partner?")) return;

    try {
        await CMS.deleteDocument("partners", docId);
        showToast("Partner removed.");
        await loadPartners();
    } catch (err) {
        console.error("Error deleting partner:", err);
        showToast("Error deleting: " + err.message, "error");
    }
};
