// =========================================================
// Gallery Management Logic — Photos, Albums & Section Titles
// =========================================================

let galleryList = [];
let galleryTitles = {};

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");

    // Initialize tabs
    initTabs();

    // Load initial data
    await Promise.all([
        loadGallery(),
        loadTitles()
    ]);

    // Modal buttons
    const addBtn = document.getElementById("addPhotoBtn");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelModalBtn");
    const form = document.getElementById("galleryForm");
    const titlesForm = document.getElementById("galleryTitlesForm");
    const fileInput = document.getElementById("photoFile");
    const urlInput = document.getElementById("photoUrl");
    const searchInput = document.getElementById("gallerySearchInput");

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

    if (titlesForm) {
        titlesForm.onsubmit = async (e) => {
            e.preventDefault();
            await saveTitles();
        };
    }

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            renderGalleryGrid(e.target.value.trim().toLowerCase());
        });
    }
});

// --------------------------------------------------
// Tab Navigation
// --------------------------------------------------
function initTabs() {
    const tabPhotosBtn = document.getElementById("tabPhotosBtn");
    const tabTitlesBtn = document.getElementById("tabTitlesBtn");
    const photosSection = document.getElementById("photosSection");
    const titlesSection = document.getElementById("titlesSection");
    const addPhotoBtn = document.getElementById("addPhotoBtn");

    if (tabPhotosBtn && tabTitlesBtn) {
        tabPhotosBtn.onclick = () => {
            tabPhotosBtn.className = "primary-btn";
            tabTitlesBtn.className = "secondary-btn";
            if (photosSection) photosSection.style.display = "block";
            if (titlesSection) titlesSection.style.display = "none";
            if (addPhotoBtn) addPhotoBtn.style.display = "inline-block";
        };

        tabTitlesBtn.onclick = () => {
            tabTitlesBtn.className = "primary-btn";
            tabPhotosBtn.className = "secondary-btn";
            if (photosSection) photosSection.style.display = "none";
            if (titlesSection) titlesSection.style.display = "block";
            if (addPhotoBtn) addPhotoBtn.style.display = "none";
        };
    }
}

// --------------------------------------------------
// Photos Grid & CRUD
// --------------------------------------------------
async function loadGallery() {
    galleryList = await CMS.getCollection("gallery", { orderBy: "displayOrder", orderDirection: "asc" });
    renderGalleryGrid();
}

function renderGalleryGrid(searchQuery = "") {
    const container = document.getElementById("galleryListContainer");
    const countBadge = document.getElementById("galleryCountBadge");
    if (!container) return;
    container.innerHTML = "";

    let filtered = galleryList;
    if (searchQuery) {
        filtered = galleryList.filter(g =>
            (g.title || "").toLowerCase().includes(searchQuery) ||
            (g.category || "").toLowerCase().includes(searchQuery) ||
            (g.description || "").toLowerCase().includes(searchQuery)
        );
    }

    if (countBadge) {
        countBadge.textContent = `${galleryList.length} Photo${galleryList.length === 1 ? '' : 's'} (${galleryList.filter(g => g.active !== false).length} Active)`;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; border-radius: 12px;">
                <div style="font-size: 2.2rem; margin-bottom: 10px;">📸</div>
                <h3 style="font-size: 1.1rem; margin-bottom: 6px;">No Gallery Photos Found</h3>
                <p style="font-size: 0.85rem; opacity: 0.75; margin-bottom: 16px;">
                    ${searchQuery ? "No photos match your search filter." : "Your gallery collection is empty. Click '+ Upload Photo' to add photos to gallery.html."}
                </p>
                ${!searchQuery ? `<button onclick="openGalleryModal()" class="primary-btn" style="padding: 8px 18px; border-radius: 6px;">+ Upload First Photo</button>` : ""}
            </div>
        `;
        return;
    }

    filtered.forEach(g => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "padding:16px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between;";

        const activeStatus = g.active !== false;
        const imgUrl = g.imageUrl || g.image || "../assets/1.png";

        card.innerHTML = `
            <div>
                <div style="position:relative; margin-bottom:10px;">
                    <img src="${imgUrl}" style="width:100%; height:160px; object-fit:cover; border-radius:8px; background:var(--surface);" onerror="this.onerror=null; this.src='../assets/logo.png';">
                    <span style="position:absolute; top:8px; left:8px; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:600; background:rgba(0,0,0,0.7); color:#fff; backdrop-filter:blur(4px);">
                        ${escapeHtml(g.category || "Event")}
                    </span>
                    <span style="position:absolute; top:8px; right:8px; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:600; background:${activeStatus ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'}; color:#fff;">
                        ${activeStatus ? 'Active' : 'Disabled'}
                    </span>
                </div>
                <h3 style="font-size:1rem; margin-bottom:4px; font-family:var(--font-heading);">${escapeHtml(g.title || "Untitled Photo")}</h3>
                ${g.description ? `<p style="font-size:0.82rem; opacity:0.8; margin-bottom:8px; line-height:1.4;">${escapeHtml(g.description)}</p>` : ""}
                ${g.eventName || g.date ? `<div style="font-size:0.75rem; opacity:0.65; margin-bottom:4px;">${escapeHtml(g.eventName || "")} ${g.date ? `&bull; ${g.date}` : ""}</div>` : ""}
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
    const form = document.getElementById("galleryForm");
    if (!modal) return;

    if (g) {
        title.textContent = "Edit Photo / Album";
        document.getElementById("photoDocId").value = g.id || "";
        document.getElementById("photoTitle").value = g.title || "";
        document.getElementById("photoCategory").value = g.category || "Hackathons";
        document.getElementById("photoDesc").value = g.description || "";
        document.getElementById("photoEventName").value = g.eventName || "";
        document.getElementById("photoDate").value = g.date || "";
        document.getElementById("photoUrl").value = g.imageUrl || g.image || "";
        document.getElementById("photoOrder").value = g.displayOrder || 1;
        document.getElementById("photoActive").checked = g.active !== false;

        const previewImg = g.imageUrl || g.image;
        if (previewImg) showPreview(previewImg);
    } else {
        title.textContent = "Upload Photo / Album";
        if (form) form.reset();
        document.getElementById("photoDocId").value = "";
        document.getElementById("photoActive").checked = true;
        document.getElementById("photoOrder").value = (galleryList.length + 1);
        hidePreview();
    }

    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("galleryModal");
    if (modal) modal.style.display = "none";
    hidePreview();
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
    if (wrap) wrap.style.display = "none";
}

async function savePhoto() {
    const submitBtn = document.getElementById("savePhotoSubmitBtn");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";
    }

    try {
        const docId = document.getElementById("photoDocId").value;
        const fileInput = document.getElementById("photoFile");
        const urlInput = document.getElementById("photoUrl");

        let imageUrl = urlInput ? urlInput.value.trim() : "";

        // If file selected, upload or compress safely
        if (fileInput && fileInput.files && fileInput.files[0]) {
            try {
                if (typeof showToast === "function") showToast("Processing photo upload...", "info");
                imageUrl = await CMS.uploadImage(fileInput.files[0], "gallery");
            } catch (err) {
                console.warn("Photo upload warning:", err);
            }
        }

        if (!imageUrl) {
            if (typeof showToast === "function") {
                showToast("Please select an image file or provide an image URL.", "warning");
            } else {
                alert("Please select an image file or provide an image URL.");
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Save Photo";
            }
            return;
        }

        const payload = {
            title: document.getElementById("photoTitle").value.trim(),
            category: document.getElementById("photoCategory").value.trim() || "General",
            description: document.getElementById("photoDesc").value.trim(),
            eventName: document.getElementById("photoEventName").value.trim(),
            date: document.getElementById("photoDate").value,
            imageUrl: imageUrl,
            image: imageUrl, // Double-map for compatibility
            displayOrder: parseInt(document.getElementById("photoOrder").value) || 1,
            active: document.getElementById("photoActive").checked,
            updatedAt: new Date().toISOString()
        };

        await CMS.saveDoc("gallery", docId || null, payload);

        if (typeof showToast === "function") {
            showToast(docId ? "Photo updated successfully!" : "Photo added to gallery!");
        }

        closeModal();
        await loadGallery();
    } catch (err) {
        console.error("Save photo error:", err);
        if (typeof showToast === "function") {
            showToast("Failed to save photo: " + (err.message || err), "error");
        } else {
            alert("Failed to save photo: " + (err.message || err));
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Save Photo";
        }
    }
}

function editPhoto(id) {
    const item = galleryList.find(g => g.id === id);
    if (item) openGalleryModal(item);
}

async function togglePhotoStatus(id, newStatus) {
    try {
        await CMS.saveDoc("gallery", id, { active: newStatus });
        if (typeof showToast === "function") showToast("Photo status updated.");
        await loadGallery();
    } catch (err) {
        console.error("Toggle photo status error:", err);
        if (typeof showToast === "function") showToast("Failed to update status: " + err.message, "error");
    }
}

async function deletePhoto(id) {
    if (!confirm("Are you sure you want to delete this photo from the gallery?")) return;
    try {
        await CMS.deleteDoc("gallery", id);
        if (typeof showToast === "function") showToast("Photo deleted successfully.");
        await loadGallery();
    } catch (err) {
        console.error("Delete photo error:", err);
        if (typeof showToast === "function") showToast("Failed to delete photo: " + err.message, "error");
    }
}

// --------------------------------------------------
// Page & Section Titles Management
// --------------------------------------------------
async function loadTitles() {
    try {
        galleryTitles = await CMS.getContent("gallery", {
            heroTag: "📸 VVISC MEMORIES",
            heroTitle: "Every Event",
            heroHighlight: "Creates a Story.",
            heroSubtitle: "Explore unforgettable moments from hackathons, workshops, seminars, competitions, industrial visits, celebrations and every milestone of the VVISC journey.",
            albumsTag: "📂 EVENT ALBUMS",
            albumsTitle: "Explore Our",
            albumsHighlight: "Memories",
            albumsSubtitle: "Browse photographs from our flagship events, workshops, competitions and student activities.",
            photosTag: "📸 PHOTO COLLECTION",
            photosTitle: "Moments We",
            photosHighlight: "Captured",
            photosSubtitle: "Every photograph reflects learning, teamwork, innovation and unforgettable memories.",
            statPhotos: 2500,
            statEvents: 85,
            statParticipants: 5000,
            statMemories: "100%"
        });

        // Populate Form
        setVal("heroTag", galleryTitles.heroTag);
        setVal("heroTitle", galleryTitles.heroTitle);
        setVal("heroHighlight", galleryTitles.heroHighlight);
        setVal("heroSubtitle", galleryTitles.heroSubtitle);

        setVal("albumsTag", galleryTitles.albumsTag);
        setVal("albumsTitle", galleryTitles.albumsTitle);
        setVal("albumsHighlight", galleryTitles.albumsHighlight);
        setVal("albumsSubtitle", galleryTitles.albumsSubtitle);

        setVal("photosTag", galleryTitles.photosTag);
        setVal("photosTitle", galleryTitles.photosTitle);
        setVal("photosHighlight", galleryTitles.photosHighlight);
        setVal("photosSubtitle", galleryTitles.photosSubtitle);

        setVal("statPhotos", galleryTitles.statPhotos);
        setVal("statEvents", galleryTitles.statEvents);
        setVal("statParticipants", galleryTitles.statParticipants);
        setVal("statMemories", galleryTitles.statMemories);

    } catch (err) {
        console.warn("Load gallery titles error:", err);
    }
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
}

async function saveTitles() {
    const saveBtn = document.getElementById("saveTitlesBtn");
    const indicator = document.getElementById("titlesSavedIndicator");

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
    }

    const payload = {
        heroTag: document.getElementById("heroTag").value.trim(),
        heroTitle: document.getElementById("heroTitle").value.trim(),
        heroHighlight: document.getElementById("heroHighlight").value.trim(),
        heroSubtitle: document.getElementById("heroSubtitle").value.trim(),

        albumsTag: document.getElementById("albumsTag").value.trim(),
        albumsTitle: document.getElementById("albumsTitle").value.trim(),
        albumsHighlight: document.getElementById("albumsHighlight").value.trim(),
        albumsSubtitle: document.getElementById("albumsSubtitle").value.trim(),

        photosTag: document.getElementById("photosTag").value.trim(),
        photosTitle: document.getElementById("photosTitle").value.trim(),
        photosHighlight: document.getElementById("photosHighlight").value.trim(),
        photosSubtitle: document.getElementById("photosSubtitle").value.trim(),

        statPhotos: parseInt(document.getElementById("statPhotos").value) || 2500,
        statEvents: parseInt(document.getElementById("statEvents").value) || 85,
        statParticipants: parseInt(document.getElementById("statParticipants").value) || 5000,
        statMemories: document.getElementById("statMemories").value.trim() || "100%"
    };

    try {
        await CMS.saveContent("gallery", payload);
        galleryTitles = payload;

        if (indicator) {
            indicator.style.display = "inline";
            setTimeout(() => {
                indicator.style.display = "none";
            }, 3500);
        }
    } catch (err) {
        console.error("Save gallery titles error:", err);
        alert("Failed to save titles: " + (err.message || err));
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "💾 Save Section Titles";
        }
    }
}

// --------------------------------------------------
// Utility helpers
// --------------------------------------------------
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Global window exposure for inline event handlers
window.openGalleryModal = openGalleryModal;
window.closeModal = closeModal;
window.editPhoto = editPhoto;
window.togglePhotoStatus = togglePhotoStatus;
window.deletePhoto = deletePhoto;
window.savePhoto = savePhoto;
window.saveTitles = saveTitles;
