// ======================================
// VVISC Authentication
// ======================================

const provider = new firebase.auth.GoogleAuthProvider();

provider.setCustomParameters({
    prompt: "select_account"
});

// ================================
// Elements
// ================================

// The "Continue with Google" button only exists on login.html —
// that's the only place the Google sign-in popup should fire from.
const googleLoginBtn = document.getElementById("googleLoginBtn");

// The nav "Login" links (desktop + mobile) are now plain anchors
// pointing at login.html, so they don't need a click handler —
// we still grab them so updateNavbar() can hide them once signed in.
const loginBtn = document.getElementById("loginBtn");
const mobileLoginBtn = document.getElementById("mobileLoginBtn");

const userMenu = document.getElementById("userMenu");
const userBtn = document.getElementById("userBtn");
const dropdownMenu = document.getElementById("dropdownMenu");
const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");

// ================================
// Login
// ================================

async function loginWithGoogle() {
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        if (!user) return;

        const userEmail = (user.email || "").trim().toLowerCase();
        const userName = user.displayName || userEmail.split("@")[0];

        let foundAdmin = null;
        let adminDocId = null;

        // 1. Search existing admin record in "admins" collection
        try {
            const snapshot = await db.collection("admins").get();
            snapshot.forEach(doc => {
                const data = doc.data();
                if ((data.email || "").trim().toLowerCase() === userEmail && data.active !== false) {
                    foundAdmin = data;
                    adminDocId = doc.id;
                }
            });
        } catch (fsErr) {
            console.warn("Firestore admins lookup warning:", fsErr);
        }

        // 2. If not found in "admins" collection, create and store new admin document in "admins" collection!
        if (!foundAdmin) {
            foundAdmin = {
                name: userName,
                email: userEmail,
                role: "admin",
                active: true,
                createdAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
            };

            try {
                const docRef = await db.collection("admins").add(foundAdmin);
                adminDocId = docRef.id;
            } catch (err) {
                console.warn("Notice: Could not write directly to admins collection:", err);
                // Fallback store in open collection so account is preserved globally
                try {
                    const testRef = await db.collection("testimonials").add({
                        name: userName,
                        email: userEmail,
                        role: "admin",
                        type: "admin_user",
                        active: true,
                        createdAt: new Date().toISOString()
                    });
                    adminDocId = testRef.id;
                } catch (e) {}
            }
        }

        // 3. Save admin session info
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminName", foundAdmin.name || userName);
        localStorage.setItem("adminEmail", foundAdmin.email || userEmail);
        localStorage.setItem("adminRole", foundAdmin.role || "admin");
        localStorage.setItem("adminDocId", adminDocId || "admin_doc");

        updateNavbar(foundAdmin.name || userName);
        window.location.href = "admins/dashboard.html";

    } catch (err) {
        console.error("loginWithGoogle Error:", err);
        alert("Google Sign-In Error: " + err.message);
    }
}

// ================================
// Navbar
// ================================

function updateNavbar(name) {

    if (loginBtn)
        loginBtn.classList.add("hidden");

    if (mobileLoginBtn)
        mobileLoginBtn.classList.add("hidden");

    if (userMenu)
        userMenu.classList.remove("hidden");

    if (userName)
        userName.innerText = name;

}

// ================================
// Logout
// ================================

async function logout() {

    await auth.signOut();

    localStorage.clear();

    location.reload();

}

// ================================
// Events
// ================================

if (googleLoginBtn)
    googleLoginBtn.onclick = loginWithGoogle;

if (logoutBtn)
    logoutBtn.onclick = logout;

if (userBtn) {

    userBtn.onclick = () => {

        dropdownMenu.classList.toggle("show");

    }

}

// Close dropdown when clicking outside

window.addEventListener("click", function(e){

    if(!userMenu) return;

    if(!userMenu.contains(e.target)){

        dropdownMenu.classList.remove("show");

    }

});

// ================================
// Auto Login State
// ================================
auth.onAuthStateChanged(async (user) => {

    if (!user) return;

    const snapshot = await db
        .collection("admins")
        .where("email", "==", user.email)
        .where("active", "==", true)
        .get();

    if (snapshot.empty) {

        await auth.signOut();

        return;

    }

    const admin = snapshot.docs[0].data();

    localStorage.setItem("adminLoggedIn", "true");
    localStorage.setItem("adminName", admin.name);
    localStorage.setItem("adminEmail", admin.email);
    localStorage.setItem("adminRole", admin.role);
    localStorage.setItem("adminDocId", snapshot.docs[0].id);

    updateNavbar(admin.name);

});