// =========================================================
// VVISC Authentication & Authorization Engine
// Strict Firebase Auth & Role-Based Security
// =========================================================

const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({
    prompt: "select_account"
});

// Helper to escape HTML characters
function escapeAuthHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =========================================================
// Google Sign-In for Admin Console Access
// =========================================================
async function loginWithGoogle() {
    const googleBtn = document.getElementById("googleLoginBtn");
    const alertBox = document.getElementById("loginAlert");

    if (alertBox) {
        alertBox.style.display = "none";
        alertBox.innerHTML = "";
    }

    let originalBtnHtml = "";
    if (googleBtn) {
        originalBtnHtml = googleBtn.innerHTML;
        googleBtn.disabled = true;
        googleBtn.innerHTML = `
            <span style="display:inline-flex; align-items:center; gap:8px;">
                <span class="live-dot" style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#D4AF37; animation:pulse 1s infinite;"></span>
                Authenticating with Google...
            </span>
        `;
    }

    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        if (!user) {
            throw new Error("No user profile returned from Google Sign-In.");
        }

        const userEmail = (user.email || "").trim().toLowerCase();
        const userName = user.displayName || userEmail.split("@")[0];

        // -----------------------------------------------------
        // STRICT AUTHORIZATION CHECK
        // User MUST already exist and be active in Firestore 'admins'
        // NEVER auto-provision unauthorized Google users as admins.
        // -----------------------------------------------------
        let authorizedAdmin = null;
        let adminDocId = null;

        // 1. First check by Firebase Auth UID
        try {
            const uidDoc = await db.collection("admins").doc(user.uid).get();
            if (uidDoc.exists) {
                const data = uidDoc.data();
                if (data && data.active !== false) {
                    authorizedAdmin = data;
                    adminDocId = uidDoc.id;
                }
            }
        } catch (e) {
            console.warn("UID lookup notice:", e);
        }

        // 2. If not keyed by UID yet, check if pre-authorized by Email
        if (!authorizedAdmin) {
            try {
                const emailQuery = await db.collection("admins")
                    .where("email", "==", userEmail)
                    .get();

                emailQuery.forEach(doc => {
                    const data = doc.data();
                    if (data && data.active !== false) {
                        authorizedAdmin = data;
                        adminDocId = doc.id;
                    }
                });

                // If found by pre-authorized email, bind/link UID doc for Firestore rules
                if (authorizedAdmin) {
                    try {
                        const linkedData = {
                            ...authorizedAdmin,
                            uid: user.uid,
                            name: authorizedAdmin.name || userName,
                            email: userEmail,
                            active: true,
                            lastLogin: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                        };
                        await db.collection("admins").doc(user.uid).set(linkedData, { merge: true });
                        adminDocId = user.uid;
                        authorizedAdmin = linkedData;
                    } catch (linkErr) {
                        console.warn("Could not bind UID doc:", linkErr);
                    }
                }
            } catch (e) {
                console.warn("Email lookup notice:", e);
            }
        }

        // 3. UNAUTHORIZED CHECK: If not authorized, reject immediately!
        if (!authorizedAdmin) {
            await auth.signOut();
            clearAdminLocalStorage();

            if (alertBox) {
                alertBox.style.display = "block";
                alertBox.innerHTML = `
                    <div style="font-weight:600; margin-bottom:4px;">❌ Access Denied: Unauthorized Account</div>
                    <div>The Google account <strong>${escapeAuthHtml(userEmail)}</strong> is not authorized to access the VVISC Admin Console.</div>
                    <div style="margin-top:6px; font-size:0.8rem; opacity:0.85;">Only pre-authorized faculty coordinators and council leads can log in. Contact a Superadmin to request authorization.</div>
                `;
            } else {
                alert(`Access Denied: The account ${userEmail} is not authorized to access the VVISC Admin Console.`);
            }

            if (googleBtn) {
                googleBtn.disabled = false;
                googleBtn.innerHTML = originalBtnHtml;
            }
            return;
        }

        // 4. AUTHORIZED: Record verified session
        const verifiedRole = (authorizedAdmin.role || "admin").toLowerCase();
        const verifiedName = authorizedAdmin.name || userName;

        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminName", verifiedName);
        localStorage.setItem("adminEmail", userEmail);
        localStorage.setItem("adminRole", verifiedRole);
        localStorage.setItem("adminDocId", adminDocId || user.uid);

        // Update in-memory state
        window.CURRENT_ADMIN = {
            uid: user.uid,
            email: userEmail,
            name: verifiedName,
            role: verifiedRole,
            docId: adminDocId
        };

        if (googleBtn) {
            googleBtn.innerHTML = `<span>✓ Authorized. Redirecting...</span>`;
        }

        updateNavbar(verifiedName);
        window.location.replace("/admins/dashboard.html");

    } catch (err) {
        console.error("loginWithGoogle Error:", err);
        if (alertBox) {
            alertBox.style.display = "block";
            alertBox.innerHTML = `<div><strong>Error:</strong> ${escapeAuthHtml(err.message || "Failed to sign in with Google.")}</div>`;
        } else {
            alert("Google Sign-In Error: " + err.message);
        }

        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = originalBtnHtml;
        }
    }
}

// Clear all admin tokens from localStorage
function clearAdminLocalStorage() {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminDocId");
    window.CURRENT_ADMIN = null;
}

// =========================================================
// Navbar Auth Helpers
// =========================================================
function getAuthElements() {
    return {
        login: document.getElementById("loginBtn") || document.querySelector(".nav-login-btn"),
        mobileLogin: document.getElementById("mobileLoginBtn") || document.querySelector(".mobile-login-btn"),
        menu: document.getElementById("userMenu") || document.querySelector(".user-menu"),
        btn: document.getElementById("userBtn") || document.querySelector(".user-btn"),
        dropdown: document.getElementById("dropdownMenu") || document.querySelector(".dropdown-menu"),
        name: document.getElementById("userName") || document.querySelector("#userName"),
        logout: document.getElementById("logoutBtn") || document.querySelector("#logoutBtn")
    };
}

function attachUserDropdownEvents() {
    const el = getAuthElements();
    if (el.btn && el.dropdown && !el.btn.hasAttribute("data-bound")) {
        el.btn.setAttribute("data-bound", "true");
        el.btn.onclick = (e) => {
            e.stopPropagation();
            el.dropdown.classList.toggle("show");
        };
    }
    if (el.logout && !el.logout.hasAttribute("data-bound")) {
        el.logout.setAttribute("data-bound", "true");
        el.logout.onclick = logout;
    }
}

function updateNavbar(name) {
    const el = getAuthElements();

    if (el.login) {
        el.login.classList.add("hidden");
        el.login.style.setProperty("display", "none", "important");
    }

    if (el.mobileLogin) {
        el.mobileLogin.classList.add("hidden");
        el.mobileLogin.style.setProperty("display", "none", "important");
    }

    if (el.menu) {
        el.menu.classList.remove("hidden");
        el.menu.style.setProperty("display", "inline-flex", "important");
    }

    if (el.name) {
        el.name.innerText = name;
    }

    attachUserDropdownEvents();

    // Provide mobile menu options
    const mobileMenu = document.querySelector(".mobile-menu");
    if (mobileMenu) {
        let adminContainer = document.getElementById("mobileAdminMenu");
        if (!adminContainer) {
            adminContainer = document.createElement("div");
            adminContainer.id = "mobileAdminMenu";
            adminContainer.className = "mobile-admin-menu";

            const isInAdmins = window.location.pathname.includes("/admins/");
            const dashHref = isInAdmins ? "dashboard.html" : "admins/dashboard.html";

            adminContainer.innerHTML = `
                <div class="mobile-admin-badge">
                    <span>Admin: <strong>${escapeAuthHtml(name)}</strong></span>
                </div>
                <a href="${dashHref}" class="mobile-menu-admin-btn">📊 Admin Dashboard</a>
                <button type="button" id="mobileLogoutBtn" class="mobile-menu-logout-btn">🚪 Logout</button>
            `;
            mobileMenu.appendChild(adminContainer);

            const mobileLogout = document.getElementById("mobileLogoutBtn");
            if (mobileLogout) {
                mobileLogout.addEventListener("click", (e) => {
                    e.preventDefault();
                    logout();
                });
            }
        } else {
            const badge = adminContainer.querySelector(".mobile-admin-badge strong");
            if (badge) badge.innerText = name;
        }
    }
}

function resetNavbar() {
    const el = getAuthElements();

    if (el.login) {
        el.login.classList.remove("hidden");
        el.login.style.removeProperty("display");
    }

    if (el.mobileLogin) {
        el.mobileLogin.classList.remove("hidden");
        el.mobileLogin.style.removeProperty("display");
    }

    if (el.menu) {
        el.menu.classList.add("hidden");
        el.menu.style.setProperty("display", "none", "important");
    }

    const adminContainer = document.getElementById("mobileAdminMenu");
    if (adminContainer) {
        adminContainer.remove();
    }
}

// =========================================================
// Logout
// =========================================================
async function logout() {
    try {
        await auth.signOut();
    } catch (e) {
        console.warn("Sign out warning:", e);
    }
    clearAdminLocalStorage();
    resetNavbar();
    window.location.replace("/login.html");
}

// =========================================================
// Auto-Check Auth State on Page Load
// =========================================================
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        clearAdminLocalStorage();
        resetNavbar();
        return;
    }

    const userEmail = (user.email || "").trim().toLowerCase();
    const fallbackName = user.displayName || userEmail.split("@")[0];

    try {
        // Verify against Firestore
        let authorizedAdmin = null;

        // 1. Direct doc lookup by UID
        const uidDoc = await db.collection("admins").doc(user.uid).get();
        if (uidDoc.exists && uidDoc.data().active !== false) {
            authorizedAdmin = uidDoc.data();
        }

        // 2. Query by email if UID not yet set
        if (!authorizedAdmin) {
            const snap = await db.collection("admins").where("email", "==", userEmail).get();
            snap.forEach(d => {
                if (d.data().active !== false) {
                    authorizedAdmin = d.data();
                }
            });
        }

        if (authorizedAdmin) {
            const role = (authorizedAdmin.role || "admin").toLowerCase();
            const name = authorizedAdmin.name || fallbackName;

            localStorage.setItem("adminLoggedIn", "true");
            localStorage.setItem("adminName", name);
            localStorage.setItem("adminEmail", userEmail);
            localStorage.setItem("adminRole", role);

            window.CURRENT_ADMIN = {
                uid: user.uid,
                email: userEmail,
                name: name,
                role: role
            };

            updateNavbar(name);
        } else {
            // Signed in with Google, but NOT an admin
            clearAdminLocalStorage();
            resetNavbar();
        }
    } catch (e) {
        console.warn("Navbar auth verification error:", e);
    }
});

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("googleLoginBtn");
    if (btn) btn.onclick = loginWithGoogle;

    // Check URL parameters for errors
    if (window.location.search.includes("error=unauthorized")) {
        const alertBox = document.getElementById("loginAlert");
        if (alertBox) {
            alertBox.style.display = "block";
            alertBox.innerHTML = `<strong>Session Expired or Unauthorized:</strong> Please log in with an authorized administrator account.`;
        }
    }
});

// Close dropdown when clicking outside
window.addEventListener("click", function(e) {
    const el = getAuthElements();
    if (!el.menu || !el.dropdown) return;
    if (!el.menu.contains(e.target)) {
        el.dropdown.classList.remove("show");
    }
});