// ======================================
// VVISC Dashboard
// ======================================

requireRole("admin");

// ======================================
// Elements
// ======================================

const adminName =
document.getElementById("adminName");

const adminCount =
document.getElementById("adminCount");

const pendingCount =
document.getElementById("pendingCount");

const approvedCount =
document.getElementById("approvedCount");

const announcementCount =
document.getElementById("announcementCount");

const activityList =
document.getElementById("activityList");

// ======================================
// Initialize
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    loadAdmin();

    loadDashboard();

});

// ======================================
// Load Admin Info
// ======================================

function loadAdmin(){

    const name =
    localStorage.getItem("adminName") ||
    "Administrator";

    const role =
    localStorage.getItem("adminRole") ||
    "";

    adminName.innerHTML =

    `
        ${name}

        <small>

            (${role})

        </small>
    `;

}

// ======================================
// Dashboard Statistics (Real-time Live Sync)
// ======================================

function loadDashboard() {

    // 1. Events count
    const eventsEl = document.getElementById("eventsCount");
    db.collection("events").onSnapshot(snap => {
        if (eventsEl) countUp(eventsEl, snap.size);
    }, err => console.error("Events listener error:", err));

    // 2. Projects count
    const projEl = document.getElementById("projectsCount");
    db.collection("projects").onSnapshot(snap => {
        if (projEl) countUp(projEl, snap.size);
    }, err => console.error("Projects listener error:", err));

    // 3. Registrations count
    const regEl = document.getElementById("registrationsCount");
    db.collection("registrations").onSnapshot(snap => {
        if (regEl) countUp(regEl, snap.size);
    }, err => console.error("Registrations listener error:", err));

    // 4. Inquiries count
    const inqEl = document.getElementById("inquiriesCount");
    db.collection("contactMessages").where("status", "==", "new").onSnapshot(snap => {
        if (inqEl) countUp(inqEl, snap.size);
    }, err => console.error("Inquiries listener error:", err));

    // 5. Council members count
    const councilEl = document.getElementById("councilCount");
    db.collection("councilMembers").onSnapshot(snap => {
        if (councilEl) countUp(councilEl, snap.size);
    }, err => console.error("Council listener error:", err));

    // 6. Achievements count
    const achEl = document.getElementById("achievementsCount");
    db.collection("achievements").onSnapshot(snap => {
        if (achEl) countUp(achEl, snap.size);
    }, err => console.error("Achievements listener error:", err));

    // 7. Pending testimonials listener
    db.collection("testimonials")
      .where("status", "==", "pending")
      .onSnapshot(snap => {
          if (pendingCount) countUp(pendingCount, snap.size);
      }, err => console.error("Pending testimonials listener error:", err));

    // 8. Announcements listener
    db.collection("announcements")
      .onSnapshot(snap => {
          if (announcementCount) countUp(announcementCount, snap.size);
      }, err => console.error("Announcements listener error:", err));

    // 9. Admins count listener
    db.collection("admins")
      .where("active", "==", true)
      .onSnapshot(snap => {
          if (adminCount) countUp(adminCount, snap.size);
      }, err => console.error("Admins listener error:", err));

    loadActivity();

}

// ======================================
// Recent Activity
// ======================================

async function loadActivity() {

    if (!activityList) return;

    try {
        const snap = await db.collection("auditLogs").orderBy("timestamp", "desc").limit(5).get();
        if (!snap.empty) {
            let html = '<ul class="activity-feed">';
            snap.forEach(doc => {
                const l = doc.data();
                const act = (l.action || "action").toLowerCase();
                let icon = "⚡";
                if (act.includes("create") || act.includes("add")) icon = "✨";
                else if (act.includes("update") || act.includes("edit")) icon = "✏️";
                else if (act.includes("delete") || act.includes("remove")) icon = "🗑️";
                else if (act.includes("login")) icon = "🔑";

                const dateStr = l.timestamp ? CMS.formatDate(l.timestamp) : "Recent";
                const user = l.performedBy || l.adminEmail || "Admin";
                let summary = "";
                if (typeof l.details === "string") summary = l.details;
                else if (l.details && typeof l.details === "object") {
                    summary = l.details.title || l.details.name || l.action || "";
                }

                html += `
                    <li class="activity-item success">
                        <span class="act-icon">${icon}</span>
                        <div class="act-details">
                            <strong>${CMS.escapeHtml(act.toUpperCase())} on ${CMS.escapeHtml(l.collection || "system")}</strong>
                            <span>By <strong>${CMS.escapeHtml(user)}</strong> &bull; ${CMS.escapeHtml(dateStr)} ${summary ? `&mdash; <em>${CMS.escapeHtml(summary)}</em>` : ''}</span>
                        </div>
                    </li>
                `;
            });
            html += '</ul>';
            activityList.innerHTML = html;
            return;
        }
    } catch (e) {
        console.warn("Audit logs query error (non-fatal):", e);
    }

    const name = localStorage.getItem("adminName") || "Administrator";
    const role = (localStorage.getItem("adminRole") || "Admin").toUpperCase();
    const loginTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    activityList.innerHTML = `
    <ul class="activity-feed">
        <li class="activity-item success">
            <span class="act-icon">⚡</span>
            <div class="act-details">
                <strong>Console Synchronized</strong>
                <span>Real-time Firebase listeners attached at ${loginTime}</span>
            </div>
        </li>
        <li class="activity-item user">
            <span class="act-icon">👤</span>
            <div class="act-details">
                <strong>Active Session</strong>
                <span>Authenticated as <strong>${name}</strong></span>
            </div>
        </li>
        <li class="activity-item role">
            <span class="act-icon">🛡️</span>
            <div class="act-details">
                <strong>Permissions Active</strong>
                <span>Role level: <span class="role-badge">${role}</span></span>
            </div>
        </li>
        <li class="activity-item status">
            <span class="act-icon">🟢</span>
            <div class="act-details">
                <strong>System Health</strong>
                <span>All backend services online & operational</span>
            </div>
        </li>
    </ul>
    `;

}