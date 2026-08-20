// =========================================
// VVISC Admin Session Manager
// =========================================

// Current page
const currentPage = window.location.pathname.split("/").pop();
const currentFolder = window.location.pathname.split("/").slice(-2, -1)[0];

// Check authentication state
auth.onAuthStateChanged(async (user) => {

    // -----------------------------
    // Route protection ONLY for pages in the admins folder
    // -----------------------------
    if (currentFolder !== "admins") {
        return;
    }

    // User NOT Logged In
    if (!user) {
        window.location.replace("../login.html");
        return;
    }

    try {
        const userEmail = (user.email || "").trim().toLowerCase();
        let foundAdminDoc = null;

        // 1. Try admins collection
        try {
            const snapshot = await db.collection("admins").get();
            snapshot.forEach(doc => {
                const data = doc.data();
                if ((data.email || "").trim().toLowerCase() === userEmail && data.active !== false) {
                    foundAdminDoc = doc;
                }
            });
        } catch (e) {
            console.warn("Session admin verification warning:", e);
        }

        // 2. Try testimonials collection (type: "admin_user")
        if (!foundAdminDoc) {
            try {
                const testSnap = await db.collection("testimonials")
                    .where("type", "==", "admin_user")
                    .get();
                testSnap.forEach(doc => {
                    const data = doc.data();
                    if ((data.email || "").trim().toLowerCase() === userEmail && data.active !== false) {
                        foundAdminDoc = doc;
                    }
                });
            } catch (e) {}
        }

        // Unauthorized user trying to access /admins/ folder
        if (!foundAdminDoc) {
            if (localStorage.getItem("adminLoggedIn") === "true" && (localStorage.getItem("adminEmail") || "").toLowerCase() === userEmail) {
                return;
            }

            await auth.signOut();
            localStorage.clear();
            alert("Access Denied: This Google account is not an authorized VVISC Admin.");
            window.location.replace("../login.html");
            return;
        }

        // -----------------------------
        // Save Latest Admin Info
        // -----------------------------

        const admin = foundAdminDoc.data ? foundAdminDoc.data() : foundAdminDoc;

        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminEmail", admin.email || userEmail);
        localStorage.setItem("adminName", admin.name || userEmail.split("@")[0]);
        localStorage.setItem("adminRole", admin.role || "admin");
        localStorage.setItem("adminDocId", foundAdminDoc.id || "");

        // -----------------------------
        // If already logged in and opens login page
        // -----------------------------

        if (currentPage === "login.html") {

            window.location.replace("admins/dashboard.html");

        }

    }

    catch (error) {

        console.error(error);

    }

});