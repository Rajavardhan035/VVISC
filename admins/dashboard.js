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

    // 1. Admins count listener
    db.collection("admins")
      .where("active", "==", true)
      .onSnapshot(snap => {
          if (adminCount) countUp(adminCount, snap.size);
      }, err => console.error("Admins listener error:", err));

    // 2. Pending testimonials listener
    db.collection("testimonials")
      .where("status", "==", "pending")
      .onSnapshot(snap => {
          if (pendingCount) countUp(pendingCount, snap.size);
      }, err => console.error("Pending testimonials listener error:", err));

    // 3. Approved testimonials listener
    db.collection("testimonials")
      .where("status", "==", "approved")
      .onSnapshot(snap => {
          if (approvedCount) countUp(approvedCount, snap.size);
      }, err => console.error("Approved testimonials listener error:", err));

    // 4. Announcements listener
    db.collection("announcements")
      .onSnapshot(snap => {
          if (announcementCount) countUp(announcementCount, snap.size);
      }, err => console.error("Announcements listener error:", err));

    loadActivity();

}

// ======================================
// Recent Activity
// ======================================

function loadActivity() {

    if (!activityList) return;

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