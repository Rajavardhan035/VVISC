// =========================================================
// Media Asset Library Logic
// =========================================================

let mediaList = [];

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");

    await loadMedia();

    const searchInput = document.getElementById("mediaSearch");
    const typeFilter = document.getElementById("mediaTypeFilter");
    const uploadInput = document.getElementById("directUploadInput");

    if (searchInput) searchInput.oninput = renderGrid;
    if (typeFilter) typeFilter.onchange = renderGrid;

    if (uploadInput) {
        uploadInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                showToast("Uploading media asset...");
                try {
                    const url = await CMS.uploadFile(file, "media_library");
                    showToast("Asset uploaded successfully!");
                    uploadInput.value = "";
                    await loadMedia();
                } catch (err) {
                    console.error("Error uploading file:", err);
                    showToast("Upload failed: " + err.message, "error");
                }
            }
        };
    }
});

async function loadMedia() {
    try {
        const snapshot = await db.collection("media").orderBy("uploadedAt", "desc").get();
        mediaList = [];
        snapshot.forEach(doc => {
            mediaList.push({ id: doc.id, ...doc.data() });
        });
        renderGrid();
    } catch (e) {
        console.error("Error loading media:", e);
    }
}

function renderGrid() {
    const grid = document.getElementById("mediaGrid");
    if (!grid) return;

    const q = (document.getElementById("mediaSearch")?.value || "").toLowerCase().trim();
    const type = document.getElementById("mediaTypeFilter")?.value || "all";

    let filtered = mediaList;
    if (type === "image") {
        filtered = filtered.filter(m => (m.type || "").startsWith("image/") || (m.name || "").match(/\.(jpg|jpeg|png|webp|gif|svg)$/i));
    } else if (type === "pdf") {
        filtered = filtered.filter(m => (m.type || "").includes("pdf") || (m.name || "").endsWith(".pdf"));
    }

    if (q) {
        filtered = filtered.filter(m => (m.name || "").toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: var(--text-muted, #94a3b8);">
                No media assets found. Click "+ Upload New File" to add one.
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(m => {
        const isImg = (m.type || "").startsWith("image/") || (m.name || "").match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);
        const sizeKb = m.size ? `${(m.size / 1024).toFixed(0)} KB` : "N/A";
        const dateStr = m.uploadedAt ? CMS.formatDate(m.uploadedAt) : "";

        return `
            <div class="media-card" data-id="${CMS.escapeHtml(m.id)}">
                <div class="media-thumb-wrap">
                    ${isImg ? `
                        <img src="${CMS.escapeHtml(m.url)}" alt="${CMS.escapeHtml(m.name)}" class="media-thumb" loading="lazy" onerror="this.onerror=null; this.src='../assets/logo.png';">
                    ` : `
                        <span class="media-file-icon">📄</span>
                    `}
                </div>
                <div class="media-card-body">
                    <span class="media-card-name" title="${CMS.escapeHtml(m.name || 'file')}">${CMS.escapeHtml(m.name || "Untitled")}</span>
                    <span class="media-card-meta">${CMS.escapeHtml(sizeKb)} &bull; ${CMS.escapeHtml(dateStr)}</span>
                    <div style="display:flex; gap:6px; margin-top:auto;">
                        <button class="secondary-btn" style="flex:1; padding:6px; font-size:0.75rem;" onclick="copyMediaUrl('${CMS.escapeHtml(m.url)}')">
                            📋 Copy URL
                        </button>
                        <button class="secondary-btn" style="padding:6px 10px; font-size:0.75rem; color:#ef4444;" onclick="deleteMediaDoc('${CMS.escapeHtml(m.id)}')">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

window.copyMediaUrl = function(url) {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
        showToast("URL copied to clipboard!");
    }).catch(() => {
        prompt("Copy URL:", url);
    });
};

window.deleteMediaDoc = async function(id) {
    if (!confirm("Are you sure you want to remove this media record from the library?")) return;

    try {
        await db.collection("media").doc(id).delete();
        await CMS.logAudit("delete", "media", id, { deletedId: id });
        showToast("Media record deleted.");
        await loadMedia();
    } catch (e) {
        console.error("Error deleting media:", e);
        showToast("Delete failed: " + e.message, "error");
    }
};
