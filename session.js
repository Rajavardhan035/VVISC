// =========================================================
// VVISC Admin Session Manager
// Real-time Firestore Authorization Verification
// =========================================================

(function() {
    const currentPath = (window.location.pathname || "").toLowerCase();
    const isInAdmins = currentPath.includes("/admins/") || currentPath.includes("/admins") || currentPath.endsWith("/admins");

    // Memory store for verified admin state
    window.CURRENT_ADMIN = null;
    window.CURRENT_ADMIN_ROLE = null;

    // Helper: Is current user authenticated with verified admin status
    window.isAdminSessionVerified = function() {
        return window.CURRENT_ADMIN && window.CURRENT_ADMIN.active !== false;
    };

    window.getAdminRole = function() {
        if (window.CURRENT_ADMIN) {
            return (window.CURRENT_ADMIN.role || "admin").toLowerCase();
        }
        return (localStorage.getItem("adminRole") || "").toLowerCase();
    };

    window.isSuperAdmin = function() {
        return window.getAdminRole() === "superadmin";
    };

    window.isAdmin = function() {
        const r = window.getAdminRole();
        return r === "admin" || r === "superadmin";
    };

    window.isContentEditor = function() {
        const r = window.getAdminRole();
        return r === "content_editor" || r === "admin" || r === "superadmin";
    };

    window.isModerator = function() {
        const r = window.getAdminRole();
        return r === "moderator" || r === "admin" || r === "superadmin";
    };

    // Firebase Auth State Listener
    auth.onAuthStateChanged(async (user) => {
        // 1. If not on an admin page, route protection is not needed
        if (!isInAdmins) {
            if ((currentPath.includes("login.html") || currentPath.endsWith("/login")) && user) {
                // If on login page and already authenticated, check if authorized admin before redirecting
                try {
                    const snap = await db.collection("admins").doc(user.uid).get();
                    if (snap.exists && snap.data().active !== false) {
                        window.location.replace("/admins/dashboard.html");
                    }
                } catch (e) {}
            }
            return;
        }

        // 2. On an admin page and user is NOT logged in: redirect to login
        if (!user) {
            localStorage.removeItem("adminLoggedIn");
            localStorage.removeItem("adminRole");
            localStorage.removeItem("adminEmail");
            localStorage.removeItem("adminName");
            localStorage.removeItem("adminDocId");
            window.location.replace("/login.html?error=unauthorized");
            return;
        }

        // 3. User is signed in with Firebase Auth. Verify active admin record in Firestore.
        try {
            const userEmail = (user.email || "").trim().toLowerCase();
            let adminDoc = null;
            let adminId = user.uid;

            // Direct UID lookup
            const uidDoc = await db.collection("admins").doc(user.uid).get();
            if (uidDoc.exists && uidDoc.data().active !== false) {
                adminDoc = uidDoc.data();
                adminId = uidDoc.id;
            }

            // Fallback: check email query if UID doc hasn't been set yet
            if (!adminDoc) {
                const emailQuery = await db.collection("admins")
                    .where("email", "==", userEmail)
                    .get();

                emailQuery.forEach(doc => {
                    const d = doc.data();
                    if (d && d.active !== false) {
                        adminDoc = d;
                        adminId = doc.id;
                    }
                });

                // Link UID for direct Firestore security rules
                if (adminDoc) {
                    try {
                        await db.collection("admins").doc(user.uid).set({
                            ...adminDoc,
                            uid: user.uid,
                            active: true
                        }, { merge: true });
                        adminId = user.uid;
                    } catch (e) {}
                }
            }

            // 4. If NOT verified as an active admin, revoke session & deny access
            if (!adminDoc || adminDoc.active === false) {
                console.warn("Unauthorized access attempt by:", userEmail);
                await auth.signOut();
                localStorage.removeItem("adminLoggedIn");
                localStorage.removeItem("adminRole");
                localStorage.removeItem("adminEmail");
                localStorage.removeItem("adminName");
                localStorage.removeItem("adminDocId");
                window.location.replace("/login.html?error=unauthorized");
                return;
            }

            // 5. Authorized Admin: Set verified state
            const verifiedRole = (adminDoc.role || "admin").toLowerCase();
            const verifiedName = adminDoc.name || user.displayName || userEmail.split("@")[0];

            window.CURRENT_ADMIN = {
                uid: user.uid,
                email: userEmail,
                name: verifiedName,
                role: verifiedRole,
                active: true,
                docId: adminId
            };
            window.CURRENT_ADMIN_ROLE = verifiedRole;

            localStorage.setItem("adminLoggedIn", "true");
            localStorage.setItem("adminRole", verifiedRole);
            localStorage.setItem("adminEmail", userEmail);
            localStorage.setItem("adminName", verifiedName);
            localStorage.setItem("adminDocId", adminId);

            // Update topbar display name if present
            const adminNameEl = document.getElementById("adminName");
            if (adminNameEl) {
                adminNameEl.textContent = verifiedName;
            }

            // Dispatch event for admin pages
            window.dispatchEvent(new CustomEvent("vvisc:admin-verified", {
                detail: window.CURRENT_ADMIN
            }));

        } catch (err) {
            console.error("Session verification error:", err);
            // On network error, allow cached session temporarily, but warn
            if (localStorage.getItem("adminLoggedIn") !== "true") {
                window.location.replace("/login.html?error=unauthorized");
            }
        }
    });
})();