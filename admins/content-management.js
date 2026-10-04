// =========================================================
// Content Management Dashboard logic
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");

    // Initialize Auto Seed check if empty
    await CMS.seedInitialCMSData(false);

    loadCardStats();

    const seedBtn = document.getElementById("seedDataBtn");
    if (seedBtn) {
        seedBtn.addEventListener("click", async () => {
            if (confirm("Reset/re-seed initial website content to default values?")) {
                const success = await CMS.seedInitialCMSData(true);
                if (success) {
                    showToast("Initial website content successfully seeded!");
                    loadCardStats();
                } else {
                    showToast("Failed to seed initial data.", "error");
                }
            }
        });
    }
});

async function loadCardStats() {
    // 1. Departments Count
    try {
        const depts = await CMS.getCollection("departments");
        const el = document.getElementById("deptCount");
        if (el) el.textContent = `${depts.length} Departments`;
    } catch (e) {}

    // 2. Council Members Count
    try {
        const members = await CMS.getCollection("councilMembers");
        const el = document.getElementById("councilCount");
        if (el) el.textContent = `${members.length} Members`;
    } catch (e) {}

    // 3. Events Count
    try {
        const events = await CMS.getCollection("events");
        const el = document.getElementById("eventsCount");
        if (el) el.textContent = `${events.length} Events`;
    } catch (e) {}

    // 4. Gallery Photos Count
    try {
        const photos = await CMS.getCollection("gallery");
        const el = document.getElementById("galleryCount");
        if (el) el.textContent = `${photos.length} Photos`;
    } catch (e) {}

    // 5. Projects Count
    try {
        const projects = await CMS.getCollection("projects");
        const el = document.getElementById("projectsCount");
        if (el) el.textContent = `${projects.length} Projects`;
    } catch (e) {}

    // 6. Inquiries Count
    try {
        const msgs = await db.collection("contactMessages").where("status", "==", "new").get();
        const el = document.getElementById("inquiriesCount");
        if (el) el.textContent = `${msgs.size} New Inquiries`;
    } catch (e) {}

    // 7. Registrations Count
    try {
        const regs = await db.collection("registrations").get();
        const el = document.getElementById("registrationsCount");
        if (el) el.textContent = `${regs.size} Registrations`;
    } catch (e) {}

    // 8. Check Timestamps for Single Docs
    updateDocTime("home", "homeUpdated");
    updateDocTime("about", "aboutUpdated");
    updateDocTime("contact", "contactUpdated");
    updateDocTime("settings", "settingsUpdated");
}

async function updateDocTime(docKey, targetId) {
    try {
        const doc = await db.collection("websiteContent").doc(docKey).get();
        const el = document.getElementById(targetId);
        if (el) {
            if (doc.exists && doc.data().updatedAt) {
                const t = doc.data().updatedAt;
                const d = t.toDate ? t.toDate() : new Date(t);
                el.textContent = `Updated ${timeAgo(d)}`;
            } else {
                el.textContent = "Ready to Edit";
            }
        }
    } catch (e) {}
}
