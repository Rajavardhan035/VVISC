// =========================================================
// Gallery Management Logic
// =========================================================

let galleryList = [];

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");
    await loadGallery();

    const addBtn = document.getElementById("addPhotoBtn");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelModalBtn");
    const form = document.getElementById("galleryForm");
    const fileInput = document.getElementById("photoFile");
    const urlInput = document.getElementById("photoUrl");

    if (addBtn) addBtn.onclick = () => openGalleryModal();
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
            if (e.target.value.trim()) showPreview(e.target.value.trim());
        });
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            await savePhoto();
        };
    }
});

async function loadGallery() {
    galleryList = await CMS.getCollection("gallery", { orderBy: "displayOrder", orderDirection: "asc" });
    renderGalleryGrid();
}

function renderGalleryGrid() {
    const container = document.getElementById("galleryListContainer");
    if (!container) return;
    container.innerHTML = "";

    if (galleryList.length === 0) {
        container.innerHTML = `<div class="card" style="grid-column:1/-1; padding:30px; text-align:center;">No gallery photos found. Click "+ Upload Photo" to add images.</div>`;
        return;
    }

    galleryList.forEach(g => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "padding:16px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between;";

        const activeStatus = g.active !== false;

        card.innerHTML = `
            <div>
                <div style="position:relative; margin-bottom:10px;">
                    <img src="${g.imageUrl || '../assets/1.png'}" style="width:100%; height:160px; object-fit:cover; border-radius:8px;" onerror="this.onerror=null; this.src='../assets/1.png';">
                    <span style="position:absolute; top:8px; left:8px; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:600; background:rgba(0,0,0,0.7); color:#fff;">${escapeHtml(g.category || "Event")}</span>
                    <span style="position:absolute; top:8px; right:8px; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:600; background:${activeStatus ? 'rgba(34, 197, 94, 0.85)' : 'rgba(239, 68, 68, 0.85)'}; color:#fff;">
                        ${activeStatus ? 'Active' : 'Disabled'}
                    </span>
                </div>
                <h3 style="font-size:1rem; margin-bottom:4px;">${escapeHtml(g.title)}</h3>
                ${g.description ? `<p style="font-size:0.82rem; opacity:0.8; margin-bottom:8px; line-height:1.3;">${escapeHtml(g.description)}</p>` : ""}
            </div>
            
            <div style="display:flex; gap:8px; margin-top:12px; border-top:1px solid var(--border-color); padding-top:10px;">
                <button type="button" onclick="editPhoto('${g.id}')" class="secondary-btn" style="flex:1; padding:6px; font-size:0.8rem;">Edit</button>
                <button type="button" onclick="togglePhotoStatus('${g.id}', ${!activeStatus})" class="secondary-btn" style="padding:6px 12px; font-size:0.8rem;">
                    ${activeStatus ? 'Disable' : 'Enable'}
                </button>
                <button type="button" onclick="deletePhoto('${g.id}')" style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:none; padding:6px 12px; border-radius:6px; font-size:0.8rem; cursor:pointer;">Delete</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openGalleryModal(g = null) {
    const modal = document.getElementById("galleryModal");
    const title = document.getElementById("modalTitle");
    if (!modal) return;

    if (g) {
        title.textContent = "Edit Photo";
        document.getElementById("photoDocId").value = g.id;
        document.getElementById("photoTitle").value = g.title || "";
        document.getElementById("photoCategory").value = g.category || "Event";
        document.getElementById("photoDesc").value = g.description || "";
        document.getElementById("photoEventName").value = g.eventName || "";
        document.getElementById("photoDate").value = g.date || "";
        document.getElementById("photoUrl").value = g.imageUrl || "";
        document.getElementById("photoOrder").value = g.displayOrder || 1;
        document.getElementById("photoActive").checked = g.active !== false;
        if (g.imageUrl) showPreview(g.imageUrl);
    } else {
        title.textContent = "Upload Photo";
        document.getElementById("galleryForm").reset();
        document.getElementById("photoDocId").value = "";
        document.getElementById("photoActive").checked = true;
        document.getElementById("photoOrder").value = galleryList.length + 1;
        document.getElementById("imagePreviewWrap").style.display = "none";
    }

    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("galleryModal");
    if (modal) modal.style.display = "none";
}

function showPreview(url) {
    const wrap = document.getElementById("imagePreviewWrap");
    const img = document.getElementById("imagePreview");
    if (wrap && img) {
        img.src = url;
        wrap.style.display = "block";
    }
}

async function savePhoto() {
    const docId = document.getElementById("photoDocId").value;
    const title = document.getElementById("photoTitle").value.trim();
    const fileInput = document.getElementById("photoFile");
    let imageUrl = document.getElementById("photoUrl").value.trim();

    if (fileInput && fileInput.files[0]) {
        try {
            showToast("Uploading image...");
            imageUrl = await CMS.uploadImage(fileInput.files[0], "gallery");
        } catch (e) {
            showToast("Image upload error: " + e.message, "warning");
        }
    }

    if (!imageUrl) {
        showToast("Please select an image file or provide an image URL.", "warning");
        return;
    }

    const payload = {
        title,
        category: document.getElementById("photoCategory").value.trim() || "Event",
        description: document.getElementById("photoDesc").value.trim(),
        eventName: document.getElementById("photoEventName").value.trim(),
        date: document.getElementById("photoDate").value,
        imageUrl,
        displayOrder: parseInt(document.getElementById("photoOrder").value) || 1,
        active: document.getElementById("photoActive").checked
    };

    try {
        await CMS.saveDoc("gallery", docId, payload);
        showToast(`Photo "${title}" saved successfully!`);
        closeModal();
        await loadGallery();
    } catch (err) {
        showToast("Error saving photo: " + err.message, "error");
    }
}

function editPhoto(id) {
    const g = galleryList.find(item => item.id === id);
    if (g) openGalleryModal(g);
}

async function togglePhotoStatus(id, newStatus) {
    try {
        await CMS.saveDoc("gallery", id, { active: newStatus });
        showToast("Photo status updated.");
        await loadGallery();
    } catch (err) {
        showToast("Status update failed.", "error");
    }
}

async function deletePhoto(id) {
    if (confirm("Are you sure you want to delete this photo?")) {
        try {
            await CMS.deleteDoc("gallery", id);
            showToast("Photo deleted successfully.");
            await loadGallery();
        } catch (err) {
            showToast("Failed to delete photo.", "error");
        }
    }
}

function escapeHtml(str) {
    return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
