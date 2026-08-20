// ======================================
// VVISC Permissions System
// ======================================

// -------------------------------
// Login
// -------------------------------

function isLoggedIn() {

    return localStorage.getItem("adminLoggedIn") === "true";

}

// -------------------------------
// Current Role
// -------------------------------

function getRole() {

    return (
        localStorage.getItem("adminRole") || ""
    ).toLowerCase();

}

// -------------------------------
// Admin
// -------------------------------

function isAdmin() {

    return getRole() === "admin"
        || getRole() === "superadmin";

}

// -------------------------------
// Super Admin
// -------------------------------

function isSuperAdmin() {

    return getRole() === "superadmin";

}

// -------------------------------
// Route Protection
// -------------------------------

function requireRole(requiredRole) {

    if (!isLoggedIn()) {

        window.location.href = "../login.html";

        return;

    }

    if (
        requiredRole === "superadmin"
        && !isSuperAdmin()
    ) {

        alert("Access Denied.");

        window.location.href = "dashboard.html";

        return;

    }

    if (
        requiredRole === "admin"
        && !isAdmin()
    ) {

        alert("Access Denied.");

        window.location.href = "../login.html";

        return;

    }

}

// -------------------------------
// Hide Super Admin Menu
// -------------------------------

document.addEventListener("DOMContentLoaded", () => {

    if (!isSuperAdmin()) {

        // Admin Management is superadmin-only.
        // Settings stays visible to every admin — it now
        // contains a shared Profile tab, with a separate
        // System tab that only renders for superadmins.
        const adminsMenu =
            document.getElementById("adminsMenu");

        if (adminsMenu)
            adminsMenu.style.display = "none";

    }

    // Reflect role in the sidebar chip, if present.
    const chip = document.getElementById("roleChip");

    if (chip) {

        const role = isSuperAdmin() ? "Super Admin" : "Admin";

        chip.querySelector(".chip-label").innerText = role;

        if (isSuperAdmin())
            chip.classList.add("is-super");

    }

});