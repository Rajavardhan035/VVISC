// =========================================================
// Achievements Management Logic
// =========================================================

let achievementsList = [];

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");

    await loadAchievements();

    const addBtn = document.getElementById("addAchievementBtn");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const modal = document.getElementById("achievementModal");
    const form = document.getElementById("achievementForm");
    const fileInput = document.getElementById("achieveFile");
    const searchInput = document.getElementById("achieveSearch");
    const catFilter = document.getElementById("achieveCategoryFilter");

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
                    const preview = document.getElementById("imgPreview");
                    const wrap = document.getElementById("imgPreviewWrap");
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
            await saveAchievement();
        };
    }

    if (searchInput) searchInput.oninput = renderGrid;
    if (catFilter) catFilter.onchange = renderGrid;
});

async function loadAchievements() {
    try {
        achievementsList = await CMS.getCollection("achievements");
        if (!achievementsList || achievementsList.length === 0) {
            // Seed defaults
            achievementsList = [
                {
                    id: "ach-1",
                    title: "Smart India Hackathon 2025 — 1st Prize Winner",
                    category: "Hackathon",
                    badge: "1st Prize",
                    awardee: "Team NeuralPulse (VVISC Students)",
                    year: "2025-26",
                    description: "Awarded ₹1,00,000 for building an AI-powered smart agriculture diagnostic hardware & mobile ecosystem.",
                    image: "assets/nodp.png",
                    active: true,
                    displayOrder: 1
                },
                {
                    id: "ach-2",
                    title: "Patent Granted: IoT Water Contamination Edge Sensor",
                    category: "Patent",
                    badge: "Patent Granted",
                    awardee: "VVISC R&D Cell & Faculty Coordinators",
                    year: "2025-26",
                    description: "Published and granted utility model patent for real-time localized micro-contaminant detection.",
                    image: "assets/nodp.png",
                    active: true,
                    displayOrder: 2
                },
                {
                    id: "ach-3",
                    title: "IEEE International Conference Best Paper Award",
                    category: "Research",
                    badge: "Best Paper",
                    awardee: "K. Rajesh, V. Ananya",
                    year: "2024-25",
                    description: "Presented breakthrough research on federated learning optimization at the edge.",
                    image: "assets/nodp.png",
                    active: true,
                    displayOrder: 3
                }
            ];
        }
        renderGrid();
    } catch (e) {
        console.error("Error loading achievements:", e);
    }
}

function renderGrid() {
    const grid = document.getElementById("achievementsGrid");
    if (!grid) return;

    const q = (document.getElementById("achieveSearch")?.value || "").toLowerCase().trim();
    const cat = document.getElementById("achieveCategoryFilter")?.value || "all";

    let filtered = achievementsList.filter(a => a.active !== false);
    if (cat !== "all") {
        filtered = filtered.filter(a => (a.category || "").toLowerCase() === cat.toLowerCase());
    }
    if (q) {
        filtered = filtered.filter(a => {
            return (a.title || "").toLowerCase().includes(q) ||
                   (a.awardee || "").toLowerCase().includes(q) ||
                   (a.description || "").toLowerCase().includes(q);
        });
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted, #94a3b8);">
                No achievements found. Click "+ Add Achievement" to create one.
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(a => {
        const imgSrc = a.image || "assets/nodp.png";
        return `
            <div class="achieve-card" data-id="${CMS.escapeHtml(a.id)}">
                <div class="achieve-img-wrap">
                    <img src="${CMS.escapeHtml(imgSrc)}" alt="${CMS.escapeHtml(a.title)}" class="achieve-img" onerror="this.src='assets/nodp.png'">
                    <span style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); color:#eab308; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">
                        ${CMS.escapeHtml(a.badge || a.category || "Award")}
                    </span>
                </div>
                <div class="achieve-body">
                    <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:4px;">
                        ${CMS.escapeHtml(a.year || "")} &bull; ${CMS.escapeHtml(a.category || "")}
                    </div>
                    <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:6px; color:#fff; line-height:1.3;">
                        ${CMS.escapeHtml(a.title)}
                    </h3>
                    <p style="font-size:0.85rem; color:#94a3b8; line-height:1.5; margin-bottom:12px; flex:1;">
                        ${CMS.escapeHtml(a.description || "")}
                    </p>
                    <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:14px;">
                        Recipient: <strong>${CMS.escapeHtml(a.awardee || "VVISC Team")}</strong>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px solid rgba(255,255,255,0.08); padding-top:12px;">
                        <button class="secondary-btn" style="padding:6px 12px; font-size:0.8rem;" onclick="openModal('${CMS.escapeHtml(a.id)}')">Edit</button>
                        <button class="secondary-btn" style="padding:6px 10px; font-size:0.8rem; color:#ef4444;" onclick="deleteAchievement('${CMS.escapeHtml(a.id)}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function openModal(id = null) {
    const modal = document.getElementById("achievementModal");
    const form = document.getElementById("achievementForm");
    const title = document.getElementById("modalTitle");
    const wrap = document.getElementById("imgPreviewWrap");
    if (form) form.reset();
    if (wrap) wrap.style.display = "none";

    if (id) {
        const item = achievementsList.find(a => a.id === id);
        if (item) {
            title.textContent = "Edit Achievement";
            document.getElementById("achieveDocId").value = item.id;
            document.getElementById("achieveTitle").value = item.title || "";
            document.getElementById("achieveCategory").value = item.category || "Hackathon";
            document.getElementById("achieveBadge").value = item.badge || "";
            document.getElementById("achieveAwardee").value = item.awardee || "";
            document.getElementById("achieveYear").value = item.year || "2025-26";
            document.getElementById("achieveDesc").value = item.description || "";
            document.getElementById("achieveImgUrl").value = item.image || "";

            if (item.image) {
                const preview = document.getElementById("imgPreview");
                if (preview) preview.src = item.image;
                if (wrap) wrap.style.display = "block";
            }
        }
    } else {
        title.textContent = "Add Achievement";
        document.getElementById("achieveDocId").value = "";
    }

    if (modal) modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("achievementModal");
    if (modal) modal.style.display = "none";
}

async function saveAchievement() {
    const docId = document.getElementById("achieveDocId").value;
    const saveBtn = document.getElementById("saveAchieveBtn");
    const file = document.getElementById("achieveFile")?.files[0];
    let imageUrl = document.getElementById("achieveImgUrl").value;

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
    }

    try {
        if (file) {
            imageUrl = await CMS.uploadImage(file, "achievements");
        }

        const data = {
            title: document.getElementById("achieveTitle").value.trim(),
            category: document.getElementById("achieveCategory").value,
            badge: document.getElementById("achieveBadge").value.trim(),
            awardee: document.getElementById("achieveAwardee").value.trim(),
            year: document.getElementById("achieveYear").value.trim(),
            description: document.getElementById("achieveDesc").value.trim(),
            image: imageUrl || "assets/nodp.png",
            active: true
        };

        if (docId) {
            await CMS.saveDocument("achievements", docId, data);
            showToast("Achievement updated!");
        } else {
            data.displayOrder = achievementsList.length + 1;
            const newDoc = await db.collection("achievements").add({
                ...data,
                createdAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
            });
            await CMS.logAudit("create", "achievements", newDoc.id, { title: data.title });
            showToast("Achievement added!");
        }

        closeModal();
        await loadAchievements();
    } catch (err) {
        console.error("Error saving achievement:", err);
        showToast("Error saving: " + err.message, "error");
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Achievement";
        }
    }
}

window.deleteAchievement = async function(docId) {
    if (!confirm("Are you sure you want to delete this achievement?")) return;

    try {
        await CMS.deleteDocument("achievements", docId);
        showToast("Achievement deleted.");
        await loadAchievements();
    } catch (err) {
        console.error("Error deleting achievement:", err);
        showToast("Error deleting: " + err.message, "error");
    }
};
