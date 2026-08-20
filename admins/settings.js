// ==========================================
// VVISC Settings
// Profile + Preferences: every admin
// System: superadmin only
// ==========================================

requireRole("admin");

// ==========================================
// Tabs
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    if (isSuperAdmin()) {
        document.getElementById("systemTabBtn").style.display = "inline-block";
        loadSystemOverview();
        loadSiteSettings();
    }

    loadProfile();
    loadPreferences();

    document.querySelectorAll(".tab-btn").forEach(btn => {

        btn.addEventListener("click", () => {

            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById("tab-" + btn.dataset.tab).classList.add("active");

        });

    });

});

// ==========================================
// Profile
// ==========================================

function loadProfile() {

    document.getElementById("profileNameField").value = localStorage.getItem("adminName") || "";
    document.getElementById("profileEmailField").value = localStorage.getItem("adminEmail") || "";

    const role = (localStorage.getItem("adminRole") || "").toLowerCase();
    document.getElementById("profileRoleField").value =
        role === "superadmin" ? "Super Admin" : "Admin";

}

document.getElementById("changePasswordBtn").addEventListener("click", async () => {

    const btn = document.getElementById("changePasswordBtn");

    const current = document.getElementById("currentPasswordField").value;
    const next = document.getElementById("newPasswordField").value;
    const confirmVal = document.getElementById("confirmPasswordField").value;

    if (!current || !next || !confirmVal) {
        showToast("Please fill in all password fields.", "error");
        return;
    }

    if (next.length < 6) {
        showToast("New password must be at least 6 characters.", "error");
        return;
    }

    if (next !== confirmVal) {
        showToast("New passwords don't match.", "error");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Updating...";

    try {

        const user = auth.currentUser;

        const credential = firebase.auth.EmailAuthProvider.credential(user.email, current);

        await user.reauthenticateWithCredential(credential);

        await user.updatePassword(next);

        showToast("Password updated successfully.");

        document.getElementById("currentPasswordField").value = "";
        document.getElementById("newPasswordField").value = "";
        document.getElementById("confirmPasswordField").value = "";

    }

    catch (error) {

        console.error(error);

        const message = error.code === "auth/wrong-password"
            ? "Current password is incorrect."
            : (error.message || "Unable to update password.");

        showToast(message, "error");

    }

    finally {

        btn.disabled = false;
        btn.innerText = "Update Password";

    }

});

// ==========================================
// Preferences (stored per-browser, applied
// across the console via ui.js)
// ==========================================

function loadPreferences() {

    const reduceMotion = localStorage.getItem("vviscReduceMotion") === "true";
    const showClock = localStorage.getItem("vviscShowClock") !== "false";

    document.getElementById("reduceMotionToggle").checked = reduceMotion;
    document.getElementById("showClockToggle").checked = showClock;

}

document.getElementById("reduceMotionToggle").addEventListener("change", (e) => {

    localStorage.setItem("vviscReduceMotion", e.target.checked);
    document.body.classList.toggle("reduce-motion", e.target.checked);
    showToast(e.target.checked ? "Motion reduced." : "Motion restored.");

});

document.getElementById("showClockToggle").addEventListener("change", (e) => {

    localStorage.setItem("vviscShowClock", e.target.checked);

    document.querySelectorAll(".console-clock").forEach(el => {
        el.style.display = e.target.checked ? "flex" : "none";
    });

    showToast(e.target.checked ? "Live clock shown." : "Live clock hidden.");

});

// ==========================================
// System Overview (Super Admin)
// ==========================================

async function loadSystemOverview() {

    try {

        const admins = await db.collection("admins").where("active", "==", true).get();
        countUp(document.getElementById("sysAdminCount"), admins.size);

        const pending = await db.collection("testimonials").where("status", "==", "pending").get();
        countUp(document.getElementById("sysPendingCount"), pending.size);

        const announcementsSnap = await db.collection("announcements").get();
        countUp(document.getElementById("sysAnnouncementCount"), announcementsSnap.size);

    } catch (error) {
        console.error(error);
    }

}

// ==========================================
// Site Settings (Super Admin) — settings/site
// ==========================================

const maintenanceToggle = document.getElementById("maintenanceToggle");
const acceptTestimonialsToggle = document.getElementById("acceptTestimonialsToggle");

let siteSettingsLoaded = false;

function loadSiteSettings() {

    db.collection("settings").doc("site").onSnapshot(doc => {

        const data = doc.exists ? doc.data() : {};

        siteSettingsLoaded = false;

        maintenanceToggle.checked = !!data.maintenanceMode;
        acceptTestimonialsToggle.checked = data.acceptTestimonials !== false;

        siteSettingsLoaded = true;

    }, error => {

        console.error(error);

    });

}

async function updateSiteSetting(field, value) {

    if (!siteSettingsLoaded) return;

    try {

        await db.collection("settings").doc("site").set({
            [field]: value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: localStorage.getItem("adminName") || "Super Admin"
        }, { merge: true });

        showToast("Site setting saved.");

    } catch (error) {

        console.error(error);
        showToast(error.message, "error");

    }

}

maintenanceToggle.addEventListener("change", (e) => {
    updateSiteSetting("maintenanceMode", e.target.checked);
});

acceptTestimonialsToggle.addEventListener("change", (e) => {
    updateSiteSetting("acceptTestimonials", e.target.checked);
});

// ==========================================
// Danger Zone
// ==========================================

document.getElementById("clearCacheBtn").addEventListener("click", () => {

    if (!confirm("This clears cached session data on this browser and reloads the page. Continue?")) return;

    const preserved = {
        reduceMotion: localStorage.getItem("vviscReduceMotion"),
        showClock: localStorage.getItem("vviscShowClock")
    };

    localStorage.clear();

    if (preserved.reduceMotion !== null) localStorage.setItem("vviscReduceMotion", preserved.reduceMotion);
    if (preserved.showClock !== null) localStorage.setItem("vviscShowClock", preserved.showClock);

    location.reload();

});
