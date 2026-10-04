// =========================================================
// Resources & Files Management Logic
// =========================================================

let resourcesList = [];

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");

    await loadResources();

    const addBtn = document.getElementById("addResourceBtn");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const modal = document.getElementById("resourceModal");
    const form = document.getElementById("resourceForm");
    const searchInput = document.getElementById("resSearch");
    const fileInput = document.getElementById("resFile");

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
                const ext = file.name.split(".").pop().toUpperCase();
                document.getElementById("resFileType").value = ext;
                const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
                document.getElementById("resFileSize").value = `${sizeMb} MB`;
            }
        };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            await saveResource();
        };
    }

    if (searchInput) searchInput.oninput = renderTable;
});

async function loadResources() {
    try {
        resourcesList = await CMS.getCollection("resources");
        if (!resourcesList || resourcesList.length === 0) {
            resourcesList = [
                {
                    id: "res-1",
                    title: "VVISC Hackathon Rulebook & Guidelines 2026",
                    category: "Guidelines & Rules",
                    fileType: "PDF",
                    fileSize: "1.8 MB",
                    fileUrl: "assets/sample.pdf",
                    downloadCount: 142,
                    description: "Official evaluation metrics, team formation guidelines, and code of conduct.",
                    active: true,
                    displayOrder: 1
                },
                {
                    id: "res-2",
                    title: "IoT Starter Kit & ESP32 Firmware Template",
                    category: "Software Kit",
                    fileType: "ZIP",
                    fileSize: "4.5 MB",
                    fileUrl: "assets/sample.zip",
                    downloadCount: 88,
                    description: "Sample sketches, pinout diagrams, and MQTT broker configuration files.",
                    active: true,
                    displayOrder: 2
                }
            ];
        }
        renderTable();
    } catch (e) {
        console.error("Error loading resources:", e);
    }
}

function renderTable() {
    const tbody = document.getElementById("resourcesTableBody");
    if (!tbody) return;

    const q = (document.getElementById("resSearch")?.value || "").toLowerCase().trim();

    let filtered = resourcesList.filter(r => r.active !== false);
    if (q) {
        filtered = filtered.filter(r => {
            return (r.title || "").toLowerCase().includes(q) ||
                   (r.category || "").toLowerCase().includes(q) ||
                   (r.description || "").toLowerCase().includes(q);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted, #94a3b8);">
                    No resources found. Click "+ Upload Resource" to add one.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(r => {
        const fileUrl = r.fileUrl || "#";
        return `
            <tr data-id="${CMS.escapeHtml(r.id)}">
                <td>
                    <strong style="color:#fff; display:block;">${CMS.escapeHtml(r.title)}</strong>
                    <span style="font-size:0.8rem; color:#94a3b8;">${CMS.escapeHtml(r.description || "")}</span>
                </td>
                <td>
                    <span style="font-size:0.85rem; color:#60a5fa;">${CMS.escapeHtml(r.category || "General")}</span>
                </td>
                <td>
                    <code style="font-family:'JetBrains Mono', monospace; font-size:0.75rem; background:rgba(255,255,255,0.08); padding:3px 6px; border-radius:4px;">
                        ${CMS.escapeHtml(r.fileType || "FILE")}
                    </code>
                </td>
                <td style="color:#cbd5e1; font-size:0.85rem;">
                    ${CMS.escapeHtml(r.fileSize || "N/A")}
                </td>
                <td style="color:#22c55e; font-weight:600; font-size:0.85rem;">
                    ${r.downloadCount || 0}
                </td>
                <td style="color:#94a3b8; font-size:0.8rem;">
                    ${r.createdAt ? CMS.formatDate(r.createdAt) : "Recent"}
                </td>
                <td>
                    <div style="display:flex; gap:6px;">
                        ${fileUrl !== "#" ? `
                            <a href="${CMS.escapeHtml(fileUrl)}" target="_blank" rel="noopener noreferrer" class="secondary-btn" style="padding:5px 10px; font-size:0.8rem; text-decoration:none;" title="Download">
                                ⬇️
                            </a>
                        ` : ''}
                        <button class="secondary-btn" style="padding:5px 10px; font-size:0.8rem;" onclick="openModal('${CMS.escapeHtml(r.id)}')">Edit</button>
                        <button class="secondary-btn" style="padding:5px 10px; font-size:0.8rem; color:#ef4444;" onclick="deleteResource('${CMS.escapeHtml(r.id)}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function openModal(id = null) {
    const modal = document.getElementById("resourceModal");
    const form = document.getElementById("resourceForm");
    const title = document.getElementById("modalTitle");
    if (form) form.reset();

    if (id) {
        const item = resourcesList.find(r => r.id === id);
        if (item) {
            title.textContent = "Edit Resource";
            document.getElementById("resDocId").value = item.id;
            document.getElementById("resTitle").value = item.title || "";
            document.getElementById("resCategory").value = item.category || "Guidelines & Rules";
            document.getElementById("resFileType").value = item.fileType || "";
            document.getElementById("resFileSize").value = item.fileSize || "";
            document.getElementById("resFileUrl").value = item.fileUrl || "";
            document.getElementById("resDesc").value = item.description || "";
            document.getElementById("resExternalUrl").value = (item.fileUrl && item.fileUrl.startsWith("http")) ? item.fileUrl : "";
        }
    } else {
        title.textContent = "Upload Resource";
        document.getElementById("resDocId").value = "";
    }

    if (modal) modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("resourceModal");
    if (modal) modal.style.display = "none";
}

async function saveResource() {
    const docId = document.getElementById("resDocId").value;
    const saveBtn = document.getElementById("saveResourceBtn");
    const file = document.getElementById("resFile")?.files[0];
    let fileUrl = document.getElementById("resFileUrl").value;
    const extUrl = document.getElementById("resExternalUrl").value.trim();

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Uploading...";
    }

    try {
        if (file) {
            fileUrl = await CMS.uploadFile(file, "resources");
        } else if (extUrl) {
            fileUrl = extUrl;
        }

        const data = {
            title: document.getElementById("resTitle").value.trim(),
            category: document.getElementById("resCategory").value,
            fileType: document.getElementById("resFileType").value.trim().toUpperCase() || "PDF",
            fileSize: document.getElementById("resFileSize").value.trim() || (file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : "N/A"),
            description: document.getElementById("resDesc").value.trim(),
            fileUrl: fileUrl || "",
            downloadCount: 0,
            active: true
        };

        if (docId) {
            delete data.downloadCount; // keep existing count
            await CMS.saveDocument("resources", docId, data);
            showToast("Resource updated!");
        } else {
            data.displayOrder = resourcesList.length + 1;
            const newDoc = await db.collection("resources").add({
                ...data,
                createdAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
            });
            await CMS.logAudit("create", "resources", newDoc.id, { title: data.title });
            showToast("Resource uploaded!");
        }

        closeModal();
        await loadResources();
    } catch (err) {
        console.error("Error saving resource:", err);
        showToast("Error saving: " + err.message, "error");
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Resource";
        }
    }
}

window.deleteResource = async function(docId) {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
        await CMS.deleteDocument("resources", docId);
        showToast("Resource deleted.");
        await loadResources();
    } catch (err) {
        console.error("Error deleting resource:", err);
        showToast("Error deleting: " + err.message, "error");
    }
};
