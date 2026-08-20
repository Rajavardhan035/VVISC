// ======================================
// VVISC Admin Management
// ======================================

requireRole("superadmin");

// ======================================
// Elements
// ======================================

const adminsGrid = document.getElementById("adminsGrid");

const totalAdmins = document.getElementById("totalAdmins");
const superAdmins = document.getElementById("superAdmins");
const activeAdmins = document.getElementById("activeAdmins");

const searchInput = document.getElementById("searchAdmin");

const addAdminBtn = document.getElementById("addAdminBtn");

const modal = document.getElementById("adminModal");

const closeModalBtn = document.getElementById("closeModal");

const cancelModalBtn = document.getElementById("cancelModal");

const saveAdminBtn = document.getElementById("saveAdmin");

let admins = [];
let searchText = "";

// ======================================
// Initialize
// ======================================

loadAdmins();

searchInput.addEventListener("input", () => {

    searchText = searchInput.value.toLowerCase();

    renderAdmins();

});

addAdminBtn.addEventListener("click", () => {

    modal.classList.add("show");

});

closeModalBtn.addEventListener("click", closeModal);

cancelModalBtn.addEventListener("click", closeModal);

saveAdminBtn.addEventListener("click", saveAdmin);

// ======================================
// Load Admin Requests
// ======================================

// ======================================
// Load Admin Requests (Local + Firestore Sync)
// ======================================

function getLocalAdminRequests() {
    try {
        const raw = localStorage.getItem("vvisc_admin_requests");
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveLocalAdminRequests(arr) {
    localStorage.setItem("vvisc_admin_requests", JSON.stringify(arr));
}

function loadAdminRequests() {
    const requestsGrid = document.getElementById("requestsGrid");
    if (!requestsGrid) return;

    const localReqs = getLocalAdminRequests().filter(r => r.status === "pending" || r.status === "pending_admin_request");

    try {
        // Query testimonials collection where type == "admin_request"
        db.collection("testimonials")
            .where("type", "==", "admin_request")
            .where("status", "==", "pending_admin_request")
            .onSnapshot(snapshot => {
                const fsReqs = [];
                snapshot.forEach(doc => {
                    fsReqs.push({
                        id: doc.id,
                        ...doc.data(),
                        isFirestore: true
                    });
                });

                const emailMap = new Map();
                localReqs.forEach(r => emailMap.set(r.email.toLowerCase(), r));
                fsReqs.forEach(r => emailMap.set(r.email.toLowerCase(), r));

                adminRequests = Array.from(emailMap.values());
                renderAdminRequests();
            }, err => {
                console.warn("Firestore listener warning:", err);
                adminRequests = localReqs;
                renderAdminRequests();
            });
    } catch (e) {
        adminRequests = localReqs;
        renderAdminRequests();
    }
}

function renderAdminRequests() {
    const requestsGrid = document.getElementById("requestsGrid");
    const pendingRequestsElem = document.getElementById("pendingRequests");
    const requestsCountBadge = document.getElementById("requestsCountBadge");

    if (!requestsGrid) return;

    requestsGrid.innerHTML = "";

    if (pendingRequestsElem) countUp(pendingRequestsElem, adminRequests.length);
    if (requestsCountBadge) requestsCountBadge.innerText = `${adminRequests.length} Pending`;

    if (adminRequests.length === 0) {
        requestsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; padding: 32px; text-align: center; background: var(--container-bg, #1A1612); border-radius: 20px; border: 1px dashed var(--border-color, rgba(255,255,255,0.15));">
                <p style="opacity: 0.75; font-size: 1rem; margin: 0;">✨ No pending admin requests. New requests submitted via "Create Account" will appear here for approval.</p>
            </div>`;
        return;
    }

    adminRequests.forEach(req => {
        const initial = (req.name || "A").charAt(0).toUpperCase();
        const roleLabel = (req.role || "admin").toLowerCase() === "superadmin" ? "Super Admin" : "Admin";

        const cardHtml = `
        <div class="admin-card request-card" style="border-left: 4px solid var(--accent-color, #C76B3C); background: var(--container-bg, #1A1612); padding: 24px; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1);">
            <div class="admin-top" style="display: flex; align-items: center; justify-content: space-between;">
                <div class="admin-info" style="display: flex; align-items: center; gap: 14px;">
                    <div class="admin-avatar" style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #C76B3C, #E48B56); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 700;">
                        ${initial}
                    </div>
                    <div>
                        <div class="admin-name" style="font-size: 1.1rem; font-weight: 700; color: var(--heading-color, #FFF);">${req.name || "New Applicant"}</div>
                        <div class="admin-email" style="font-size: 0.88rem; opacity: 0.75; color: var(--text-color, #D0C5BA);">${req.email || "No email"}</div>
                    </div>
                </div>
                <span class="role-badge" style="background: rgba(199, 107, 60, 0.15); color: var(--accent-color, #C76B3C); padding: 4px 12px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">
                    ${roleLabel} Request
                </span>
            </div>
            <div class="admin-actions" style="margin-top: 20px; display: flex; gap: 12px;">
                <button onclick="approveAdminRequest('${req.id}', '${req.name ? req.name.replace(/'/g, "\\'") : ''}', '${req.email ? req.email.replace(/'/g, "\\'") : ''}', '${req.role}')" class="approve-btn" style="flex: 1; padding: 11px 16px; border: none; border-radius: 12px; background: linear-gradient(135deg, #2e7d32, #43a047); color: white; font-weight: 700; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 4px 12px rgba(46,125,50,0.3);">
                    ✓ Approve Access
                </button>
                <button onclick="rejectAdminRequest('${req.id}', '${req.email ? req.email.replace(/'/g, "\\'") : ''}')" class="reject-btn" style="flex: 1; padding: 11px 16px; border: 1px solid rgba(239,83,80,0.4); border-radius: 12px; background: rgba(211,47,47,0.12); color: #ef5350; font-weight: 700; cursor: pointer; transition: all 0.25s ease;">
                    ✕ Reject
                </button>
            </div>
        </div>`;

        requestsGrid.insertAdjacentHTML("beforeend", cardHtml);
    });
}

async function approveAdminRequest(reqId, name, email, role) {
    if (!confirm(`Approve admin access for ${name} (${email})?`)) return;

    const lowerEmail = (email || "").trim().toLowerCase();

    try {
        // 1. Add to active admins collection in Firestore
        try {
            await db.collection("admins").add({
                name: name,
                email: lowerEmail,
                role: role || "admin",
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            console.warn("Admins collection write warning:", e);
        }

        // 2. Also save to open testimonials collection with type admin_user for universal device access
        try {
            await db.collection("testimonials").add({
                name: name,
                email: lowerEmail,
                role: role || "admin",
                type: "admin_user",
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            console.warn("Testimonials admin user save warning:", e);
        }

        // 3. Update local storage status
        const localReqs = getLocalAdminRequests().map(r => {
            if (r.id === reqId || (lowerEmail && r.email.toLowerCase() === lowerEmail)) {
                return { ...r, status: "approved" };
            }
            return r;
        });
        saveLocalAdminRequests(localReqs);

        // Store in local approved admins array for same-browser instant access
        let approvedAdmins = JSON.parse(localStorage.getItem("vvisc_approved_admins") || "[]");
        approvedAdmins.push({ name: name, email: lowerEmail, role: role || "admin", active: true });
        localStorage.setItem("vvisc_approved_admins", JSON.stringify(approvedAdmins));

        // 4. Update Firestore request doc status if available
        try {
            if (reqId && !reqId.startsWith("req_")) {
                await db.collection("testimonials").doc(reqId).update({
                    status: "approved_admin_request",
                    approvedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (fsErr) {
            console.warn("Firestore update skipped:", fsErr);
        }

        alert(`🎉 Admin access approved for ${name} (${lowerEmail})!\n\nThey can now log in to the Admin Console from any device using Google Sign-In.`);
        loadAdminRequests();
    } catch (err) {
        console.error("Error approving admin request:", err);
        alert("Failed to approve admin: " + err.message);
    }
}

async function rejectAdminRequest(reqId, email) {
    if (!confirm("Reject this admin request?")) return;

    try {
        const localReqs = getLocalAdminRequests().map(r => {
            if (r.id === reqId || (email && r.email.toLowerCase() === email.toLowerCase())) {
                return { ...r, status: "rejected" };
            }
            return r;
        });
        saveLocalAdminRequests(localReqs);

        try {
            if (reqId && !reqId.startsWith("req_")) {
                await db.collection("testimonials").doc(reqId).update({
                    status: "rejected_admin_request",
                    rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (fsErr) {
            console.warn("Firestore update skipped or restricted:", fsErr);
        }

        alert("Request rejected.");
        loadAdminRequests();
    } catch (err) {
        console.error("Error rejecting admin request:", err);
        alert("Failed to reject request: " + err.message);
    }
}

// ======================================
// Modal
// ======================================

function closeModal() {

    modal.classList.remove("show");

    document.getElementById("adminNameInput").value = "";

    document.getElementById("adminEmailInput").value = "";

    document.getElementById("adminPasswordInput").value = "";

    document.getElementById("adminRoleInput").value = "admin";

}

// ======================================
// Load Admins
// ======================================

function loadAdmins() {

    db.collection("admins")
    .orderBy("name")
    .onSnapshot(snapshot => {

        admins = [];

        snapshot.forEach(doc => {

            admins.push({

                id: doc.id,

                ...doc.data()

            });

        });

        renderAdmins();

    });

}

// ======================================
// Render Admins
// ======================================

function renderAdmins() {

    adminsGrid.innerHTML = "";

    let total = 0;
    let active = 0;
    let superCount = 0;

    admins.forEach(admin => {

        total++;

        if (admin.active)
            active++;

        if ((admin.role || "").toLowerCase() === "superadmin")
            superCount++;

        const matches =

            (admin.name || "")
            .toLowerCase()
            .includes(searchText)

            ||

            (admin.email || "")
            .toLowerCase()
            .includes(searchText);

        if (!matches)
            return;

        adminsGrid.insertAdjacentHTML(

            "beforeend",

            adminCard(admin)

        );

    });

    countUp(totalAdmins, total);

    countUp(activeAdmins, active);

    countUp(superAdmins, superCount);

}

// ======================================
// Card
// ======================================

function adminCard(admin) {

    const isCurrent =
        admin.email === localStorage.getItem("adminEmail");

    const isSuper =
        (admin.role || "").toLowerCase() === "superadmin";

    return `

<div class="admin-card">

    <div class="admin-top">

        <div class="admin-info">

            <div class="admin-avatar">

                ${admin.name.charAt(0).toUpperCase()}

            </div>

            <div>

                <div class="admin-name">

                    ${admin.name}

                </div>

                <div class="admin-email">

                    ${admin.email}

                </div>

            </div>

        </div>

        <div class="${
            isSuper
            ? "super-badge"
            : "admin-badge"
        }">

            ${
                isSuper
                ? "👑 Super Admin"
                : "🛡 Admin"
            }

        </div>

    </div>

    <div class="admin-status">

        ${
            admin.active

            ?

            '<span class="active-status">🟢 Active</span>'

            :

            '<span class="inactive-status">🔴 Inactive</span>'

        }

    </div>

    <div class="admin-actions">

        ${
            isCurrent

            ?

            `

            <button class="protected-btn">

                Protected

            </button>

            `

            :

            `

            <button
                class="toggle-btn"
                onclick="toggleAdmin('${admin.id}',${admin.active})">

                ${
                    admin.active
                    ? "Disable"
                    : "Enable"
                }

            </button>

            <button
                class="delete-btn"
                onclick="deleteAdmin('${admin.id}')">

                Delete

            </button>

            `

        }

    </div>

</div>

`;

}

// ======================================
// Save (Create) Admin
// ======================================
//
// Creating a Firebase Auth user with the client SDK signs
// you in as that new user, which would kick the current
// superadmin out of their own session. To avoid that, the
// new account is created on a throwaway secondary Firebase
// app instance, then immediately signed out there, leaving
// the superadmin's real session untouched.

async function saveAdmin() {

    const name = document.getElementById("adminNameInput").value.trim();
    const email = document.getElementById("adminEmailInput").value.trim();
    const password = document.getElementById("adminPasswordInput").value;
    const role = document.getElementById("adminRoleInput").value;

    if (!name || !email || !password) {
        showToast("Please fill in name, email and password.", "error");
        return;
    }

    if (password.length < 6) {
        showToast("Password must be at least 6 characters.", "error");
        return;
    }

    saveAdminBtn.disabled = true;
    saveAdminBtn.innerText = "Saving...";

    const tempAppName = "vvisc-admin-creator-" + Date.now();
    const tempApp = firebase.initializeApp(firebase.app().options, tempAppName);
    const tempAuth = tempApp.auth();

    try {

        const credential =
            await tempAuth.createUserWithEmailAndPassword(email, password);

        await db.collection("admins").doc(credential.user.uid).set({

            name,
            email,
            role,
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: localStorage.getItem("adminName") || "Super Admin"

        });

        await tempAuth.signOut();

        showToast(`${name} added as ${role === "superadmin" ? "Super Admin" : "Admin"}.`);

        closeModal();

    }

    catch (error) {

        console.error(error);
        showToast(error.message || "Unable to create admin.", "error");

    }

    finally {

        saveAdminBtn.disabled = false;
        saveAdminBtn.innerText = "Save Admin";

        try { await tempApp.delete(); } catch (e) { /* no-op */ }

    }

}

// ======================================
// Toggle
// ======================================

async function toggleAdmin(id, status) {

    try {

        await db
        .collection("admins")
        .doc(id)
        .update({

            active: !status

        });

        showToast(!status ? "Admin enabled." : "Admin disabled.");

    }

    catch (error) {

        console.error(error);

        showToast(error.message, "error");

    }

}

// ======================================
// Delete
// ======================================

async function deleteAdmin(id) {

    if (!confirm("Delete this admin permanently?"))
        return;

    try {

        await db
        .collection("admins")
        .doc(id)
        .delete();

        showToast("Admin removed.");

    }

    catch (error) {

        console.error(error);

        showToast(error.message, "error");

    }

}
