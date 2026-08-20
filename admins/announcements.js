// ==========================================
// VVISC Announcements & Past Events
// Both Admin and Super Admin can create,
// edit and delete on this page — it's a
// shared content-management surface.
// ==========================================

requireRole("admin");

// ==========================================
// Tabs
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll("#announcementTabs .tab-btn").forEach(btn => {

        btn.addEventListener("click", () => {

            document.querySelectorAll("#announcementTabs .tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById("tab-" + btn.dataset.tab).classList.add("active");

        });

    });

    loadAnnouncements();
    loadPastEvents();

});

function escapeHtml(str) {
    const div = document.createElement("div");
    div.innerText = str || "";
    return div.innerHTML;
}

// ==========================================================================
// ANNOUNCEMENTS
// ==========================================================================

const announcementList = document.getElementById("announcementList");
const totalAnnouncements = document.getElementById("totalAnnouncements");
const highPriorityCount = document.getElementById("highPriorityCount");
const eventCount = document.getElementById("eventCount");

const searchBox = document.getElementById("searchAnnouncement");
const addAnnouncementBtn = document.getElementById("addAnnouncementBtn");

const modal = document.getElementById("announcementModal");
const modalTitle = document.getElementById("announcementModalTitle");
const closeModalBtn = document.getElementById("closeAnnouncementModal");
const cancelModalBtn = document.getElementById("cancelAnnouncementModal");
const saveBtn = document.getElementById("saveAnnouncement");

const titleInput = document.getElementById("announcementTitleInput");
const categoryInput = document.getElementById("announcementCategoryInput");
const descriptionInput = document.getElementById("announcementDescriptionInput");
const dateInput = document.getElementById("announcementDateInput");
const timeInput = document.getElementById("announcementTimeInput");
const locationInput = document.getElementById("announcementLocationInput");
const linkInput = document.getElementById("announcementLinkInput");
const imageInput = document.getElementById("announcementImageInput");
const statusInput = document.getElementById("announcementStatusInput");

let announcements = [];
let searchText = "";
let editingId = null;
let unsubscribeAnnouncements = null;

searchBox.addEventListener("input", () => {
    searchText = searchBox.value.trim().toLowerCase();
    renderAnnouncements();
});

addAnnouncementBtn.addEventListener("click", () => openModal());
closeModalBtn.addEventListener("click", closeModal);
cancelModalBtn.addEventListener("click", closeModal);
saveBtn.addEventListener("click", saveAnnouncement);

function loadAnnouncements() {

    if (unsubscribeAnnouncements) unsubscribeAnnouncements();

    unsubscribeAnnouncements = db.collection("announcements")
        .orderBy("createdAt", "desc")
        .onSnapshot(snapshot => {

            announcements = [];
            snapshot.forEach(doc => announcements.push({ id: doc.id, ...doc.data() }));
            renderAnnouncements();

        }, error => {
            console.error(error);
            showToast("Unable to load announcements.", "error");
        });

}

function renderAnnouncements() {

    announcementList.innerHTML = "";

    let high = 0, events = 0, shown = 0;

    announcements.forEach(item => {

        const category = (item.category || "general").toLowerCase();

        if (category === "high") high++;
        if (category === "event") events++;

        const matches =
            (item.title || "").toLowerCase().includes(searchText) ||
            (item.description || "").toLowerCase().includes(searchText);

        if (!matches) return;

        shown++;
        announcementList.insertAdjacentHTML("beforeend", announcementCard(item));

    });

    countUp(totalAnnouncements, announcements.length);
    countUp(highPriorityCount, high);
    countUp(eventCount, events);

    if (shown === 0) {
        announcementList.innerHTML = `
            <div class="empty-card">
                No announcements ${searchText ? "match your search" : "yet"}. Click "+ New Announcement" to post one.
            </div>
        `;
    }

}

function announcementCard(item) {

    const category = (item.category || "general").toLowerCase();
    const label = category === "high" ? "High Priority" : category === "event" ? "Event" : "General";
    const posted = item.createdAt && item.createdAt.toDate ? timeAgo(item.createdAt.toDate()) : "just now";
    const hidden = item.status === "hidden";

    return `

<div class="announcement-item">

    <div class="announcement-main">

        <div class="announcement-head">
            <h4>${escapeHtml(item.title || "Untitled")}</h4>
            <span class="tag-pill ${category}">${label}</span>
            ${hidden ? '<span class="tag-pill" style="opacity:.7;">Hidden</span>' : ""}
        </div>

        <div class="announcement-body">${escapeHtml(item.description || "")}</div>

        ${
            category === "event" && item.eventDate
            ? `<div class="announcement-meta">📅 ${escapeHtml(item.eventDate)}${item.eventTime ? " · " + escapeHtml(item.eventTime) : ""}${item.location ? " · 📍 " + escapeHtml(item.location) : ""}</div>`
            : ""
        }

        <div class="announcement-meta">
            Posted ${posted}${item.createdBy ? " by " + escapeHtml(item.createdBy) : ""}
        </div>

    </div>

    <div class="announcement-actions">
        <button class="edit-btn" onclick="editAnnouncement('${item.id}')">Edit</button>
        <button class="delete-btn" onclick="deleteAnnouncement('${item.id}')">Delete</button>
    </div>

</div>

`;

}

function openModal(item) {

    editingId = item ? item.id : null;
    modalTitle.innerText = item ? "Edit Announcement" : "New Announcement";

    titleInput.value = item ? item.title || "" : "";
    categoryInput.value = item ? item.category || "general" : "general";
    descriptionInput.value = item ? item.description || "" : "";
    dateInput.value = item ? item.eventDate || "" : "";
    timeInput.value = item ? item.eventTime || "" : "";
    locationInput.value = item ? item.location || "" : "";
    linkInput.value = item ? item.registrationLink || "" : "";
    imageInput.value = item ? item.image || "" : "";
    statusInput.value = item ? item.status || "active" : "active";

    modal.classList.add("show");

}

function closeModal() {
    modal.classList.remove("show");
    editingId = null;
}

function editAnnouncement(id) {
    const item = announcements.find(a => a.id === id);
    if (item) openModal(item);
}

async function saveAnnouncement() {

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const category = categoryInput.value;
    const eventDate = dateInput.value;
    const eventTime = timeInput.value;
    const location = locationInput.value.trim();
    const registrationLink = linkInput.value.trim();
    const image = imageInput.value.trim();
    const status = statusInput.value;

    if (!title || !description) {
        showToast("Title and description are required.", "error");
        return;
    }

    saveBtn.disabled = true;
    saveBtn.innerText = "Saving...";

    try {

        const data = {
            title, description, category,
            eventDate, eventTime, location, registrationLink, image, status,
            createdBy: localStorage.getItem("adminName") || "Admin",
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editingId) {

            await db.collection("announcements").doc(editingId).update(data);
            showToast("Announcement updated.");

        } else {

            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("announcements").add(data);
            showToast("Announcement published.");

        }

        closeModal();

    } catch (error) {

        console.error(error);
        showToast(error.message || "Unable to save announcement.", "error");

    } finally {

        saveBtn.disabled = false;
        saveBtn.innerText = "Publish";

    }

}

async function deleteAnnouncement(id) {

    if (!confirm("Delete this announcement permanently?")) return;

    try {
        await db.collection("announcements").doc(id).delete();
        showToast("Announcement deleted.");
    } catch (error) {
        console.error(error);
        showToast(error.message || "Unable to delete announcement.", "error");
    }

}

// ==========================================================================
// PAST EVENTS
// ==========================================================================

const pastEventList = document.getElementById("pastEventList");
const pastEventCountEl = document.getElementById("pastEventCount");
const searchPastEventBox = document.getElementById("searchPastEvent");
const addPastEventBtn = document.getElementById("addPastEventBtn");

const pastEventModal = document.getElementById("pastEventModal");
const pastEventModalTitle = document.getElementById("pastEventModalTitle");
const closePastEventModalBtn = document.getElementById("closePastEventModal");
const cancelPastEventModalBtn = document.getElementById("cancelPastEventModal");
const savePastEventBtn = document.getElementById("savePastEvent");

const peTitleInput = document.getElementById("pastEventTitleInput");
const peTagInput = document.getElementById("pastEventTagInput");
const peTintInput = document.getElementById("pastEventTintInput");
const peDescriptionInput = document.getElementById("pastEventDescriptionInput");
const peStat1ValueInput = document.getElementById("pastEventStat1ValueInput");
const peStat1LabelInput = document.getElementById("pastEventStat1LabelInput");
const peStat2ValueInput = document.getElementById("pastEventStat2ValueInput");
const peStat2LabelInput = document.getElementById("pastEventStat2LabelInput");
const peLinkInput = document.getElementById("pastEventLinkInput");

let pastEvents = [];
let pastEventSearchText = "";
let editingPastEventId = null;
let unsubscribePastEvents = null;

searchPastEventBox.addEventListener("input", () => {
    pastEventSearchText = searchPastEventBox.value.trim().toLowerCase();
    renderPastEvents();
});

addPastEventBtn.addEventListener("click", () => openPastEventModal());
closePastEventModalBtn.addEventListener("click", closePastEventModal);
cancelPastEventModalBtn.addEventListener("click", closePastEventModal);
savePastEventBtn.addEventListener("click", savePastEvent);

function loadPastEvents() {

    if (unsubscribePastEvents) unsubscribePastEvents();

    unsubscribePastEvents = db.collection("pastEvents")
        .orderBy("createdAt", "desc")
        .onSnapshot(snapshot => {

            pastEvents = [];
            snapshot.forEach(doc => pastEvents.push({ id: doc.id, ...doc.data() }));
            renderPastEvents();

        }, error => {
            console.error(error);
            showToast("Unable to load past events.", "error");
        });

}

function renderPastEvents() {

    pastEventList.innerHTML = "";

    let shown = 0;

    pastEvents.forEach(item => {

        const matches =
            (item.title || "").toLowerCase().includes(pastEventSearchText) ||
            (item.description || "").toLowerCase().includes(pastEventSearchText);

        if (!matches) return;

        shown++;
        pastEventList.insertAdjacentHTML("beforeend", pastEventCard(item));

    });

    countUp(pastEventCountEl, pastEvents.length);

    if (shown === 0) {
        pastEventList.innerHTML = `
            <div class="empty-card">
                No past events ${pastEventSearchText ? "match your search" : "yet"}. Click "+ Add Past Event" — it'll appear on the public Events page right away.
            </div>
        `;
    }

}

function pastEventCard(item) {

    return `

<div class="admin-card">

    <div class="admin-top">
        <div class="admin-info">
            <div class="admin-avatar">${escapeHtml((item.tag || item.title || "E").charAt(0))}</div>
            <div>
                <div class="admin-name">${escapeHtml(item.title || "Untitled Event")}</div>
                <div class="admin-email">${escapeHtml(item.tag || "")}</div>
            </div>
        </div>
    </div>

    <p style="color:var(--text-dim); font-size:13.5px; line-height:1.55; margin-bottom:14px;">
        ${escapeHtml(item.description || "")}
    </p>

    <div class="admin-status" style="display:flex; gap:18px;">
        <span><strong>${escapeHtml(item.stat1Value || "—")}</strong> ${escapeHtml(item.stat1Label || "")}</span>
        <span><strong>${escapeHtml(item.stat2Value || "—")}</strong> ${escapeHtml(item.stat2Label || "")}</span>
    </div>

    <div class="admin-actions">
        <button class="edit-btn" onclick="editPastEvent('${item.id}')">Edit</button>
        <button class="delete-btn" onclick="deletePastEvent('${item.id}')">Delete</button>
    </div>

</div>

`;

}

function openPastEventModal(item) {

    editingPastEventId = item ? item.id : null;
    pastEventModalTitle.innerText = item ? "Edit Past Event" : "Add Past Event";

    peTitleInput.value = item ? item.title || "" : "";
    peTagInput.value = item ? item.tag || "" : "";
    peTintInput.value = item ? item.tint || "default" : "default";
    peDescriptionInput.value = item ? item.description || "" : "";
    peStat1ValueInput.value = item ? item.stat1Value || "" : "";
    peStat1LabelInput.value = item ? item.stat1Label || "" : "";
    peStat2ValueInput.value = item ? item.stat2Value || "" : "";
    peStat2LabelInput.value = item ? item.stat2Label || "" : "";
    peLinkInput.value = item ? item.galleryLink || "" : "";

    pastEventModal.classList.add("show");

}

function closePastEventModal() {
    pastEventModal.classList.remove("show");
    editingPastEventId = null;
}

function editPastEvent(id) {
    const item = pastEvents.find(e => e.id === id);
    if (item) openPastEventModal(item);
}

async function savePastEvent() {

    const title = peTitleInput.value.trim();
    const description = peDescriptionInput.value.trim();

    if (!title || !description) {
        showToast("Title and description are required.", "error");
        return;
    }

    savePastEventBtn.disabled = true;
    savePastEventBtn.innerText = "Saving...";

    try {

        const data = {
            title,
            tag: peTagInput.value.trim() || title.toUpperCase(),
            tint: peTintInput.value,
            description,
            stat1Value: peStat1ValueInput.value.trim(),
            stat1Label: peStat1LabelInput.value.trim(),
            stat2Value: peStat2ValueInput.value.trim(),
            stat2Label: peStat2LabelInput.value.trim(),
            galleryLink: peLinkInput.value.trim() || "gallery.html",
            createdBy: localStorage.getItem("adminName") || "Admin",
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editingPastEventId) {

            await db.collection("pastEvents").doc(editingPastEventId).update(data);
            showToast("Past event updated.");

        } else {

            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("pastEvents").add(data);
            showToast("Past event added to the Events page.");

        }

        closePastEventModal();

    } catch (error) {

        console.error(error);
        showToast(error.message || "Unable to save past event.", "error");

    } finally {

        savePastEventBtn.disabled = false;
        savePastEventBtn.innerText = "Save Event";

    }

}

async function deletePastEvent(id) {

    if (!confirm("Delete this past event permanently?")) return;

    try {
        await db.collection("pastEvents").doc(id).delete();
        showToast("Past event deleted.");
    } catch (error) {
        console.error(error);
        showToast(error.message || "Unable to delete past event.", "error");
    }

}

// ==========================================================================
// Cleanup
// ==========================================================================

window.addEventListener("beforeunload", () => {
    if (unsubscribeAnnouncements) unsubscribeAnnouncements();
    if (unsubscribePastEvents) unsubscribePastEvents();
});
