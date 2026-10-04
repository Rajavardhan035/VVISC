// =========================================================
// VVISC Role-Based Permissions System
// Enforces 4 Roles: superadmin, admin, content_editor, moderator
// =========================================================

function getVerifiedRole() {
    if (typeof window.getAdminRole === "function") {
        return window.getAdminRole();
    }
    return (localStorage.getItem("adminRole") || "").toLowerCase();
}

function isSuperAdmin() {
    return getVerifiedRole() === "superadmin";
}

function isAdmin() {
    const r = getVerifiedRole();
    return r === "admin" || r === "superadmin";
}

function isContentEditor() {
    const r = getVerifiedRole();
    return r === "content_editor" || r === "admin" || r === "superadmin";
}

function isModerator() {
    const r = getVerifiedRole();
    return r === "moderator" || r === "admin" || r === "superadmin";
}

function hasPermission(required) {
    const r = getVerifiedRole();
    if (!r) return false;
    if (r === "superadmin") return true;

    if (Array.isArray(required)) {
        return required.some(req => hasPermission(req));
    }

    switch (required) {
        case "superadmin":
            return r === "superadmin";
        case "admin":
            return r === "admin" || r === "superadmin";
        case "content_editor":
            return r === "content_editor" || r === "admin" || r === "superadmin";
        case "moderator":
            return r === "moderator" || r === "admin" || r === "superadmin";
        default:
            return false;
    }
}

// Route Protection function called on page load
function requireRole(allowedRoles) {
    const role = getVerifiedRole();

    // Not logged in or no role found
    if (!role) {
        window.location.replace("/login.html?error=unauthorized");
        return;
    }

    const permitted = hasPermission(allowedRoles);
    if (!permitted) {
        console.warn(`Access denied for role '${role}' to section requiring '${JSON.stringify(allowedRoles)}'`);
        window.location.replace("/admins/dashboard.html?error=permission_denied");
    }
}

// Automatically configure Admin Console UI & Sidebar based on verified role
function applyRoleUiPermissions() {
    const role = getVerifiedRole();
    if (!role) return;

    // 1. Reflect role in sidebar chip
    const chip = document.getElementById("roleChip");
    if (chip) {
        const label = chip.querySelector(".chip-label");
        let displayRole = "Admin";
        if (role === "superadmin") displayRole = "Super Admin";
        else if (role === "content_editor") displayRole = "Content Editor";
        else if (role === "moderator") displayRole = "Moderator";

        if (label) label.innerText = displayRole;
        if (role === "superadmin") chip.classList.add("is-super");
        else chip.classList.remove("is-super");
    }

    // 2. Hide Admins menu for non-superadmins
    const adminsMenu = document.getElementById("adminsMenu");
    if (adminsMenu && !isSuperAdmin()) {
        adminsMenu.style.display = "none";
    }

    // 3. For Content Editors: hide Testimonials, Messages, Registrations
    if (role === "content_editor") {
        const testMenu = document.getElementById("testimonialsMenu");
        if (testMenu) testMenu.style.display = "none";
        const msgMenu = document.getElementById("messagesMenu");
        if (msgMenu) msgMenu.style.display = "none";
        const regMenu = document.getElementById("registrationsMenu");
        if (regMenu) regMenu.style.display = "none";
    }

    // 4. For Moderators: hide Main Content Management & Settings
    if (role === "moderator") {
        const contentMenu = document.getElementById("contentMenu");
        if (contentMenu) contentMenu.style.display = "none";
        const settingsMenu = document.getElementById("settingsMenu");
        if (settingsMenu) settingsMenu.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", applyRoleUiPermissions);
window.addEventListener("vvisc:admin-verified", applyRoleUiPermissions);