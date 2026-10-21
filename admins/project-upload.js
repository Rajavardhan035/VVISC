// ===============================================================
// VVISC IUCEE - Dedicated Project Upload & Edit Controller
// Admin Dashboard Controller & Firebase Integration
// ===============================================================

let editDocId = null;
let selectedCoverFile = null;
let existingCoverUrl = "";
let existingCoverPath = "";
let existingGalleryImages = []; // Array of { url, path } or string
let pendingGalleryFiles = []; // Array of File objects

document.addEventListener("DOMContentLoaded", async function() {
    initAuthCheck();
    initEventListeners();
    await checkUrlForEditMode();
});

// -----------------------------------------------------------------
// 1. Authentication & Security Check
// -----------------------------------------------------------------
function initAuthCheck() {
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (!user) {
                // If no active Firebase auth user and no verified admin session
                if (!sessionStorage.getItem("adminToken") && !localStorage.getItem("adminUser")) {
                    console.warn("Unauthenticated admin access attempt to project-upload.html");
                    window.location.href = "../login.html";
                }
            } else {
                console.log("Admin authenticated for project upload:", user.email);
            }
        });
    }
}

// -----------------------------------------------------------------
// 2. Initialize Event Listeners
// -----------------------------------------------------------------
function initEventListeners() {
    // Category Change (Toggle custom category input)
    const catSelect = document.getElementById("projCategory");
    const customCatGroup = document.getElementById("customCategoryGroup");
    const customCatInput = document.getElementById("projCustomCategory");

    if (catSelect && customCatGroup) {
        catSelect.addEventListener("change", function() {
            if (this.value === "Other") {
                customCatGroup.style.display = "block";
                if (customCatInput) customCatInput.required = true;
            } else {
                customCatGroup.style.display = "none";
                if (customCatInput) {
                    customCatInput.required = false;
                    customCatInput.value = "";
                }
            }
        });
    }

    // Cover Image Dropzone & File Input
    const coverDropzone = document.getElementById("coverDropzone");
    const coverFileInput = document.getElementById("coverFileInput");
    const coverUrlInput = document.getElementById("coverUrlInput");
    const btnApplyCoverUrl = document.getElementById("btnApplyCoverUrl");
    const btnRemoveCover = document.getElementById("btnRemoveCover");

    if (coverDropzone && coverFileInput) {
        coverDropzone.addEventListener("click", () => coverFileInput.click());

        // Drag & Drop
        ["dragenter", "dragover"].forEach(eventName => {
            coverDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                coverDropzone.classList.add("dragover");
            }, false);
        });

        ["dragleave", "drop"].forEach(eventName => {
            coverDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                coverDropzone.classList.remove("dragover");
            }, false);
        });

        coverDropzone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length > 0) {
                handleCoverFileSelection(dt.files[0]);
            }
        });

        coverFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleCoverFileSelection(e.target.files[0]);
            }
        });
    }

    if (btnApplyCoverUrl && coverUrlInput) {
        btnApplyCoverUrl.addEventListener("click", () => {
            applyDirectCoverUrl(coverUrlInput.value.trim());
        });
        coverUrlInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                applyDirectCoverUrl(coverUrlInput.value.trim());
            }
        });
    }

    if (btnRemoveCover) {
        btnRemoveCover.addEventListener("click", removeCoverImage);
    }

    // Gallery Dropzone & Multi-file Input
    const galleryDropzone = document.getElementById("galleryDropzone");
    const galleryFileInput = document.getElementById("galleryFileInput");

    if (galleryDropzone && galleryFileInput) {
        galleryDropzone.addEventListener("click", () => galleryFileInput.click());

        ["dragenter", "dragover"].forEach(eventName => {
            galleryDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                galleryDropzone.classList.add("dragover");
            }, false);
        });

        ["dragleave", "drop"].forEach(eventName => {
            galleryDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                galleryDropzone.classList.remove("dragover");
            }, false);
        });

        galleryDropzone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length > 0) {
                handleGalleryFilesSelection(Array.from(dt.files));
            }
        });

        galleryFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleGalleryFilesSelection(Array.from(e.target.files));
            }
        });
    }

    // Dynamic Feature Bullet Builder
    const btnAddFeature = document.getElementById("btnAddFeatureRow");
    if (btnAddFeature) {
        btnAddFeature.addEventListener("click", () => addFeatureRow(""));
    }

    // Tech Stack Chips Live Preview
    const techInput = document.getElementById("projTechInput");
    if (techInput) {
        techInput.addEventListener("input", updateTechChipsPreview);
    }

    // Save as Draft Button
    const btnSaveDraft = document.getElementById("btnSaveDraft");
    if (btnSaveDraft) {
        btnSaveDraft.addEventListener("click", (e) => {
            e.preventDefault();
            submitProjectForm("draft");
        });
    }

    // Main Form Submit (Publish)
    const uploadForm = document.getElementById("projectUploadForm");
    if (uploadForm) {
        uploadForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const statusVal = document.getElementById("projStatus")?.value || "published";
            submitProjectForm(statusVal);
        });
    }
}

// -----------------------------------------------------------------
// 3. Edit Mode Detection & Population
// -----------------------------------------------------------------
async function checkUrlForEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    if (!id) {
        // Create Mode - initialize with 1 empty feature bullet and empty chips
        ensureAtLeastOneFeatureRow();
        updateTechChipsPreview();
        return;
    }

    editDocId = id;
    document.getElementById("editDocId").value = id;

    // Update Header and Breadcrumbs to reflect editing
    const pageTitle = document.getElementById("pageTitle");
    const pageSub = document.getElementById("pageSub");
    const breadcrumb = document.getElementById("breadcrumbCurrent");
    const btnPublish = document.getElementById("btnPublishProject");

    if (pageTitle) pageTitle.textContent = "✏️ Edit Innovation Project";
    if (pageSub) pageSub.textContent = "Modify technical architecture, schematics, and external repository links.";
    if (breadcrumb) breadcrumb.textContent = "Edit Project";
    if (btnPublish) {
        btnPublish.innerHTML = `
            <span>Update &amp; Save Project</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
    }

    setSaveIndicator("Loading project data...", "var(--accent-light)");

    try {
        let docData = null;
        if (window.db) {
            const snap = await db.collection("projects").doc(id).get();
            if (snap.exists) {
                docData = snap.data();
            }
        }

        // Fallback to local CMS cache if Firestore read fails
        if (!docData && window.CMS && typeof CMS.getCollection === "function") {
            const localList = await CMS.getCollection("projects");
            docData = localList.find(p => p.id === id);
        }

        if (!docData) {
            showAlert("error", `Could not find project with ID "${id}". It may have been deleted.`);
            setSaveIndicator("Project not found", "#ef4444");
            return;
        }

        populateFormWithProject(docData);
        setSaveIndicator("Editing existing project", "var(--text-faint)");
    } catch (err) {
        console.error("Error loading project for edit:", err);
        showAlert("error", "Failed to retrieve project details: " + err.message);
        setSaveIndicator("Error loading project", "#ef4444");
    }
}

function populateFormWithProject(p) {
    // Core Fields
    document.getElementById("projTitle").value = p.title || "";
    
    // Category Handling
    const catSelect = document.getElementById("projCategory");
    const customCatGroup = document.getElementById("customCategoryGroup");
    const customCatInput = document.getElementById("projCustomCategory");
    const standardCategories = [
        "AI & Machine Learning",
        "Robotics",
        "Web Development",
        "IoT",
        "Cybersecurity",
        "Data Science",
        "Mobile Development"
    ];

    if (standardCategories.includes(p.category)) {
        catSelect.value = p.category;
        customCatGroup.style.display = "none";
    } else {
        catSelect.value = "Other";
        customCatGroup.style.display = "block";
        if (customCatInput) {
            customCatInput.value = p.category || "";
            customCatInput.required = true;
        }
    }

    document.getElementById("projShortDesc").value = p.shortDescription || "";
    document.getElementById("projStatus").value = p.status || "published";
    document.getElementById("projFeatured").checked = !!p.featured;

    // Cover Image
    if (p.coverImageUrl) {
        existingCoverUrl = p.coverImageUrl;
        existingCoverPath = p.coverImagePath || "";
        document.getElementById("coverUrlInput").value = p.coverImageUrl;
        const previewImg = document.getElementById("coverPreviewImg");
        const previewContainer = document.getElementById("coverPreviewContainer");
        previewImg.src = p.coverImageUrl;
        previewContainer.style.display = "block";
    }

    // Gallery Images
    if (Array.isArray(p.galleryImages)) {
        existingGalleryImages = [...p.galleryImages];
    } else {
        existingGalleryImages = [];
    }
    renderGalleryPreviews();

    // Deep-dive & Architecture
    document.getElementById("projFullDesc").value = p.description || "";
    document.getElementById("projProblem").value = p.problemStatement || "";
    document.getElementById("projSolution").value = p.solution || "";

    // Features List
    const featContainer = document.getElementById("featuresListContainer");
    if (featContainer) {
        featContainer.innerHTML = "";
        let features = [];
        if (Array.isArray(p.features)) {
            features = p.features;
        } else if (typeof p.features === "string" && p.features.trim()) {
            features = p.features.split("\n").map(f => f.trim()).filter(Boolean);
        }

        if (features.length > 0) {
            features.forEach(f => addFeatureRow(f));
        } else {
            ensureAtLeastOneFeatureRow();
        }
    }

    document.getElementById("projOutcomes").value = p.outcomes || "";

    // Tech Stack & Team
    const techInput = document.getElementById("projTechInput");
    if (Array.isArray(p.technologies)) {
        techInput.value = p.technologies.join(", ");
    } else {
        techInput.value = p.technologies || "";
    }
    updateTechChipsPreview();

    const teamInput = document.getElementById("projTeamInput");
    if (Array.isArray(p.teamMembers)) {
        teamInput.value = p.teamMembers.join(", ");
    } else {
        teamInput.value = p.teamMembers || "";
    }

    // Repositories & External Links
    document.getElementById("projGithub").value = p.githubUrl || "";
    document.getElementById("projDemo").value = p.demoUrl || "";
    document.getElementById("projDocs").value = p.documentationUrl || "";
    document.getElementById("projVideo").value = p.videoUrl || "";
}

// -----------------------------------------------------------------
// 4. Cover Image Controller
// -----------------------------------------------------------------
function handleCoverFileSelection(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showAlert("error", "Selected file is not an image. Please select a PNG, JPG, or WEBP photo.");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showAlert("error", "Image size exceeds 10MB limit. Please upload an image under 10MB.");
        return;
    }

    selectedCoverFile = file;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const previewImg = document.getElementById("coverPreviewImg");
        const previewContainer = document.getElementById("coverPreviewContainer");
        previewImg.src = evt.target.result;
        previewContainer.style.display = "block";
        document.getElementById("coverUrlInput").value = "";
    };
    reader.readAsDataURL(file);
}

function applyDirectCoverUrl(url) {
    if (!url) {
        showAlert("error", "Please enter a valid image URL.");
        return;
    }
    selectedCoverFile = null;
    existingCoverUrl = url;
    const previewImg = document.getElementById("coverPreviewImg");
    const previewContainer = document.getElementById("coverPreviewContainer");
    previewImg.src = url;
    previewContainer.style.display = "block";
}

function removeCoverImage() {
    selectedCoverFile = null;
    existingCoverUrl = "";
    existingCoverPath = "";
    const fileInput = document.getElementById("coverFileInput");
    if (fileInput) fileInput.value = "";
    const urlInput = document.getElementById("coverUrlInput");
    if (urlInput) urlInput.value = "";
    const previewContainer = document.getElementById("coverPreviewContainer");
    if (previewContainer) previewContainer.style.display = "none";
}

// -----------------------------------------------------------------
// 5. Gallery Images Controller
// -----------------------------------------------------------------
function handleGalleryFilesSelection(files) {
    if (!files || files.length === 0) return;

    for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        if (f.size > 10 * 1024 * 1024) {
            showAlert("error", `File "${f.name}" exceeds 10MB and was skipped.`);
            continue;
        }
        pendingGalleryFiles.push(f);
    }
    renderGalleryPreviews();
}

function renderGalleryPreviews() {
    const strip = document.getElementById("galleryPreviewsStrip");
    if (!strip) return;

    let html = "";

    // Render Existing Stored Images
    existingGalleryImages.forEach((img, idx) => {
        const url = typeof img === "string" ? img : (img.url || "");
        if (!url) return;
        html += `
            <div class="gallery-thumbnail-card">
                <img src="${escapeHtml(url)}" alt="Existing screenshot" onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80'">
                <button type="button" class="btn-remove-thumb" onclick="removeExistingGalleryImage(${idx})" title="Remove screenshot">&times;</button>
                <div class="gallery-thumb-tag">Saved</div>
            </div>
        `;
    });

    // Render Pending Upload Files
    pendingGalleryFiles.forEach((file, idx) => {
        const tempUrl = URL.createObjectURL(file);
        html += `
            <div class="gallery-thumbnail-card" style="border-color:#10b981;">
                <img src="${tempUrl}" alt="Pending upload">
                <button type="button" class="btn-remove-thumb" onclick="removePendingGalleryFile(${idx})" title="Remove screenshot">&times;</button>
                <div class="gallery-thumb-tag" style="background:#10b981;">Pending</div>
            </div>
        `;
    });

    strip.innerHTML = html;
}

window.removeExistingGalleryImage = function(idx) {
    existingGalleryImages.splice(idx, 1);
    renderGalleryPreviews();
};

window.removePendingGalleryFile = function(idx) {
    pendingGalleryFiles.splice(idx, 1);
    renderGalleryPreviews();
};

// -----------------------------------------------------------------
// 6. Dynamic Feature Bullets Builder
// -----------------------------------------------------------------
function addFeatureRow(text = "") {
    const container = document.getElementById("featuresListContainer");
    if (!container) return;

    const row = document.createElement("div");
    row.className = "feature-item-row";
    row.innerHTML = `
        <input type="text" class="form-input feature-item-input" placeholder="e.g. Sub-50ms inference latency running directly on-device without internet" value="${escapeHtml(text)}">
        <button type="button" class="btn-remove-row" onclick="removeFeatureRow(this)" title="Remove item">&times;</button>
    `;
    container.appendChild(row);

    const input = row.querySelector("input");
    if (input && !text) input.focus();
}

window.removeFeatureRow = function(btn) {
    const row = btn.closest(".feature-item-row");
    if (!row) return;

    const container = document.getElementById("featuresListContainer");
    if (container.children.length > 1) {
        row.remove();
    } else {
        // If it's the only row, just clear its input
        const input = row.querySelector("input");
        if (input) input.value = "";
    }
};

function ensureAtLeastOneFeatureRow() {
    const container = document.getElementById("featuresListContainer");
    if (container && container.children.length === 0) {
        addFeatureRow("");
    }
}

// -----------------------------------------------------------------
// 7. Tech Stack Chips Live Preview
// -----------------------------------------------------------------
function updateTechChipsPreview() {
    const input = document.getElementById("projTechInput");
    const container = document.getElementById("techChipsPreview");
    if (!input || !container) return;

    const raw = input.value;
    const tags = raw.split(",").map(t => t.trim()).filter(Boolean);

    if (tags.length === 0) {
        container.innerHTML = `<span style="font-size:0.75rem; color:var(--text-faint); font-family:var(--font-mono); opacity:0.6;">Chips preview will appear here as you type...</span>`;
        return;
    }

    container.innerHTML = tags.map(tag => `
        <span class="tech-chip">
            <span>${escapeHtml(tag)}</span>
        </span>
    `).join("");
}

// -----------------------------------------------------------------
// 8. Storage Upload & Resilient Compression
// -----------------------------------------------------------------
async function uploadToStorage(file, folderPath) {
    // 1. Try Native Firebase Storage API
    try {
        if (firebase.storage && typeof firebase.storage === "function") {
            const storageRef = firebase.storage().ref();
            const cleanName = (file.name || "img.webp").replace(/[^a-zA-Z0-9.-]/g, "_");
            const fullPath = `${folderPath}/${Date.now()}_${cleanName}`;
            const fileRef = storageRef.child(fullPath);

            const uploadTask = fileRef.put(file);
            const snapshot = await uploadTask;
            const downloadUrl = await snapshot.ref.getDownloadURL();
            return { url: downloadUrl, path: fullPath };
        }
    } catch (err) {
        console.warn("Storage API notice (switching to resilient compressed fallback):", err);
    }

    // 2. High-efficiency local dataURL compression fallback (< 120KB webp)
    const dataUrl = await compressImageToDataUrl(file, 1200, 0.82);
    return { url: dataUrl, path: "" };
}

function compressImageToDataUrl(file, maxWidth = 1200, quality = 0.82) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let w = img.naturalWidth || img.width;
                let h = img.naturalHeight || img.height;
                if (w > maxWidth) {
                    h = Math.round((h * maxWidth) / w);
                    w = maxWidth;
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/webp", quality));
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve("https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80");
        reader.readAsDataURL(file);
    });
}

// -----------------------------------------------------------------
// 9. Form Submission & Firestore Commit
// -----------------------------------------------------------------
async function submitProjectForm(targetStatus = "published") {
    const btnPublish = document.getElementById("btnPublishProject");
    const btnDraft = document.getElementById("btnSaveDraft");

    // Gather Basic Inputs
    const title = document.getElementById("projTitle").value.trim();
    let category = document.getElementById("projCategory").value;
    if (category === "Other") {
        const customVal = document.getElementById("projCustomCategory")?.value.trim();
        category = customVal || "Other Innovations";
    }

    const shortDescription = document.getElementById("projShortDesc").value.trim();
    const featured = document.getElementById("projFeatured").checked;

    // Validation
    if (!title) {
        showAlert("error", "Project Title is required.");
        document.getElementById("projTitle").focus();
        return;
    }

    if (!shortDescription) {
        showAlert("error", "Short Summary / Tagline is required.");
        document.getElementById("projShortDesc").focus();
        return;
    }

    // Cover Image Check
    const directCoverUrl = document.getElementById("coverUrlInput").value.trim();
    const hasCover = selectedCoverFile || directCoverUrl || existingCoverUrl;
    if (!hasCover) {
        showAlert("error", "Please provide a primary cover image (either upload a file or specify an image URL).");
        document.getElementById("coverDropzone").scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    // UI Busy State
    btnPublish.disabled = true;
    btnDraft.disabled = true;
    setSaveIndicator("Uploading assets & writing to Cloud...", "var(--accent)");

    try {
        const stableId = editDocId || ("proj_" + Date.now());

        // 1. Process Cover Image
        let coverImageUrl = directCoverUrl || existingCoverUrl;
        let coverImagePath = existingCoverPath;

        if (selectedCoverFile) {
            setSaveIndicator("Uploading primary cover photo...", "var(--accent-light)");
            const coverRes = await uploadToStorage(selectedCoverFile, `projects/${stableId}/cover`);
            coverImageUrl = coverRes.url;
            coverImagePath = coverRes.path;
        }

        if (!coverImageUrl) {
            coverImageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";
        }

        // 2. Process Gallery Images
        let finalGalleryImages = [...existingGalleryImages];
        if (pendingGalleryFiles.length > 0) {
            setSaveIndicator(`Uploading ${pendingGalleryFiles.length} gallery screenshots...`, "var(--accent-light)");
            for (let i = 0; i < pendingGalleryFiles.length; i++) {
                const gFile = pendingGalleryFiles[i];
                const gRes = await uploadToStorage(gFile, `projects/${stableId}/gallery`);
                finalGalleryImages.push({ url: gRes.url, path: gRes.path });
            }
        }

        // 3. Collect Technical Deep-Dive Fields
        const description = document.getElementById("projFullDesc").value.trim();
        const problemStatement = document.getElementById("projProblem").value.trim();
        const solution = document.getElementById("projSolution").value.trim();
        const outcomes = document.getElementById("projOutcomes").value.trim();

        // Features Array
        const featureInputs = document.querySelectorAll(".feature-item-input");
        const features = Array.from(featureInputs)
            .map(input => input.value.trim())
            .filter(Boolean);

        // Tech Stack Array
        const techRaw = document.getElementById("projTechInput").value;
        const technologies = techRaw.split(",").map(t => t.trim()).filter(Boolean);

        // Contributors Array
        const teamRaw = document.getElementById("projTeamInput").value;
        const teamMembers = teamRaw.split(",").map(m => m.trim()).filter(Boolean);

        // Repositories & External Links
        const githubUrl = document.getElementById("projGithub").value.trim();
        const demoUrl = document.getElementById("projDemo").value.trim();
        const documentationUrl = document.getElementById("projDocs").value.trim();
        const videoUrl = document.getElementById("projVideo").value.trim();

        // 4. Assemble Payload
        const payload = {
            title,
            category,
            shortDescription,
            description,
            problemStatement,
            solution,
            features,
            technologies,
            teamMembers,
            githubUrl,
            demoUrl,
            documentationUrl,
            videoUrl,
            outcomes,
            status: targetStatus,
            featured,
            coverImageUrl,
            coverImagePath,
            galleryImages: finalGalleryImages,
            updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
        };

        if (targetStatus === "published") {
            payload.publishedAt = firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
        }

        let savedDocId = editDocId;

        // 5. Commit to Firestore Cloud
        if (editDocId) {
            // Update Existing Doc
            if (window.CMS && typeof CMS.saveDoc === "function") {
                await CMS.saveDoc("projects", editDocId, payload);
            } else if (window.db) {
                await db.collection("projects").doc(editDocId).set(payload, { merge: true });
            }
        } else {
            // Create New Doc
            payload.createdAt = firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
            payload.displayOrder = 1;

            if (window.CMS && typeof CMS.saveDoc === "function") {
                savedDocId = await CMS.saveDoc("projects", null, payload);
            } else if (window.db) {
                const newDocRef = await db.collection("projects").add(payload);
                savedDocId = newDocRef.id;
            }
        }

        // 6. Record Audit Log
        if (window.CMS && typeof CMS.logAudit === "function") {
            await CMS.logAudit(
                editDocId ? "UPDATE" : "CREATE",
                "projects",
                savedDocId,
                `${editDocId ? "Updated" : "Uploaded"} project "${title}" with status [${targetStatus}]`
            );
        }

        setSaveIndicator("Saved successfully!", "#10b981");

        // 7. Show Success Modal
        showSuccessModal(savedDocId, title, targetStatus);

    } catch (err) {
        console.error("Error saving project:", err);
        showAlert("error", "Error saving project: " + err.message);
        setSaveIndicator("Failed to save", "#ef4444");
    } finally {
        btnPublish.disabled = false;
        btnDraft.disabled = false;
    }
}

// -----------------------------------------------------------------
// 10. Success Modal & Feedback
// -----------------------------------------------------------------
function showSuccessModal(docId, title, status) {
    const modal = document.getElementById("successModal");
    const msg = document.getElementById("successModalMessage");
    const btnViewLive = document.getElementById("btnModalViewLive");
    const btnUploadAnother = document.getElementById("btnModalUploadAnother");

    if (msg) {
        if (status === "published") {
            msg.innerHTML = `<strong>${escapeHtml(title)}</strong> has been published and is now live on the public Technical Projects showcase.`;
        } else {
            msg.innerHTML = `<strong>${escapeHtml(title)}</strong> has been securely saved as a <strong>draft</strong>. It can be previewed or published anytime.`;
        }
    }

    if (btnViewLive) {
        btnViewLive.href = `../project-details.html?id=${encodeURIComponent(docId)}`;
    }

    if (btnUploadAnother) {
        btnUploadAnother.onclick = function() {
            window.location.href = "project-upload.html";
        };
    }

    if (modal) {
        modal.classList.add("active");
    }
}

function setSaveIndicator(text, color) {
    const el = document.getElementById("saveStatusIndicator");
    if (el) {
        el.textContent = text;
        if (color) el.style.color = color;
    }
}

function showAlert(type, message) {
    const alertBox = document.getElementById("statusAlert");
    if (!alertBox) {
        alert(message);
        return;
    }

    alertBox.style.display = "flex";
    if (type === "error") {
        alertBox.style.background = "rgba(239, 68, 68, 0.15)";
        alertBox.style.border = "1px solid rgba(239, 68, 68, 0.4)";
        alertBox.style.color = "#f87171";
        alertBox.innerHTML = `<span>⚠️ ${escapeHtml(message)}</span>`;
    } else {
        alertBox.style.background = "rgba(16, 185, 129, 0.15)";
        alertBox.style.border = "1px solid rgba(16, 185, 129, 0.4)";
        alertBox.style.color = "#34d399";
        alertBox.innerHTML = `<span>✓ ${escapeHtml(message)}</span>`;
    }

    alertBox.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
