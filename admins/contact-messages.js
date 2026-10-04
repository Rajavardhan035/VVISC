// =========================================================
// Contact Messages Admin Management
// Real-time Firestore sync, filtering, replying & status transitions
// =========================================================

let allMessages = [];
let currentFilter = "all";
let searchQuery = "";
let selectedMessage = null;

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("moderator");
    initContactMessagesListener();
    setupEventListeners();
});

function initContactMessagesListener() {
    const loadingEl = document.getElementById("loadingIndicator");
    const emptyEl = document.getElementById("emptyIndicator");
    const listEl = document.getElementById("messagesList");

    if (typeof db === "undefined") {
        loadingEl.textContent = "Firestore database not available.";
        return;
    }

    db.collection("contactMessages")
        .onSnapshot((snapshot) => {
            allMessages = [];
            snapshot.forEach((doc) => {
                allMessages.push({ id: doc.id, ...doc.data() });
            });

            // Sort newest first
            allMessages.sort((a, b) => {
                const dateA = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()) : 0;
                const dateB = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()) : 0;
                return dateB - dateA;
            });

            loadingEl.style.display = "none";
            updateStats();
            renderMessages();
        }, (err) => {
            console.error("Error loading contact messages:", err);
            loadingEl.textContent = "Failed to load messages: " + err.message;
        });
}

function updateStats() {
    const newCount = allMessages.filter(m => !m.status || m.status === "new").length;
    const inProgressCount = allMessages.filter(m => m.status === "in_progress").length;
    const resolvedCount = allMessages.filter(m => m.status === "resolved").length;

    const elNew = document.getElementById("newCount");
    const elInProg = document.getElementById("inProgressCount");
    const elRes = document.getElementById("resolvedCount");
    const elTot = document.getElementById("totalCount");

    if (elNew) elNew.textContent = newCount;
    if (elInProg) elInProg.textContent = inProgressCount;
    if (elRes) elRes.textContent = resolvedCount;
    if (elTot) elTot.textContent = allMessages.length;
}

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById("searchInquiry");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderMessages();
        });
    }

    // Filter Buttons
    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            renderMessages();
        });
    });

    // Modal Close
    const closeBtn = document.getElementById("closeModalBtn");
    const modal = document.getElementById("messageModal");
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => modal.style.display = "none");
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.style.display = "none";
        });
    }

    // Status Buttons inside Modal
    const btnInProg = document.getElementById("btnSetInProgress");
    if (btnInProg) {
        btnInProg.addEventListener("click", () => updateMessageStatus(selectedMessage?.id, "in_progress"));
    }

    const btnResolved = document.getElementById("btnSetResolved");
    if (btnResolved) {
        btnResolved.addEventListener("click", () => updateMessageStatus(selectedMessage?.id, "resolved"));
    }
}

function renderMessages() {
    const listEl = document.getElementById("messagesList");
    const emptyEl = document.getElementById("emptyIndicator");
    if (!listEl) return;

    let filtered = allMessages.filter(msg => {
        // Status filter
        if (currentFilter === "new" && msg.status && msg.status !== "new") return false;
        if (currentFilter === "in_progress" && msg.status !== "in_progress") return false;
        if (currentFilter === "resolved" && msg.status !== "resolved") return false;

        // Search query
        if (searchQuery) {
            const name = (msg.name || "").toLowerCase();
            const email = (msg.email || "").toLowerCase();
            const subject = (msg.subject || "").toLowerCase();
            const body = (msg.message || "").toLowerCase();
            if (!name.includes(searchQuery) && !email.includes(searchQuery) && !subject.includes(searchQuery) && !body.includes(searchQuery)) {
                return false;
            }
        }
        return true;
    });

    if (filtered.length === 0) {
        listEl.style.display = "none";
        emptyEl.style.display = "block";
        return;
    }

    emptyEl.style.display = "none";
    listEl.style.display = "grid";
    listEl.innerHTML = "";

    filtered.forEach(msg => {
        const item = document.createElement("div");
        item.className = "inquiry-card";
        item.style.cssText = `
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            transition: border-color 0.2s;
        `;

        const status = msg.status || "new";
        let statusBadge = `<span style="font-size:0.75rem; padding:3px 8px; border-radius:6px; background:rgba(230,126,34,0.15); color:#e67e22; font-weight:600;">NEW</span>`;
        if (status === "in_progress") {
            statusBadge = `<span style="font-size:0.75rem; padding:3px 8px; border-radius:6px; background:rgba(52,152,219,0.15); color:#3498db; font-weight:600;">IN PROGRESS</span>`;
        } else if (status === "resolved") {
            statusBadge = `<span style="font-size:0.75rem; padding:3px 8px; border-radius:6px; background:rgba(46,204,113,0.15); color:#2ecc71; font-weight:600;">RESOLVED</span>`;
        }

        const dateStr = formatTimestamp(msg.createdAt);

        item.innerHTML = `
            <div style="flex:1; min-width:0;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
                    <strong style="font-size:1rem; color:var(--text-primary);">${escapeHtml(msg.name || "Anonymous")}</strong>
                    <span style="font-size:0.8rem; color:var(--text-secondary);">&lt;${escapeHtml(msg.email || "")}&gt;</span>
                    ${statusBadge}
                </div>
                <div style="font-weight:600; font-size:0.9rem; margin-bottom:4px; color:var(--text-primary);">
                    ${escapeHtml(msg.subject || "General Inquiry")}
                </div>
                <div style="font-size:0.85rem; color:var(--text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:650px;">
                    ${escapeHtml(msg.message || "")}
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:6px;">
                    Received: ${dateStr}
                </div>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <button class="view-btn secondary-btn" style="padding:6px 12px; font-size:0.8rem; border-radius:6px; cursor:pointer;">View</button>
                <button class="delete-btn secondary-btn" style="padding:6px 10px; font-size:0.8rem; border-radius:6px; color:#e74c3c; cursor:pointer;" title="Delete">🗑</button>
            </div>
        `;

        item.querySelector(".view-btn").addEventListener("click", () => openMessageModal(msg));
        item.querySelector(".delete-btn").addEventListener("click", () => confirmDeleteMessage(msg.id));

        listEl.appendChild(item);
    });
}

function openMessageModal(msg) {
    selectedMessage = msg;
    const modal = document.getElementById("messageModal");
    if (!modal) return;

    document.getElementById("modalSubject").textContent = msg.subject || "General Inquiry";
    document.getElementById("modalSender").textContent = msg.name || "Anonymous";
    
    const emailLink = document.getElementById("modalEmailLink");
    emailLink.textContent = msg.email || "";
    emailLink.href = "mailto:" + (msg.email || "") + "?subject=" + encodeURIComponent("Re: " + (msg.subject || "VVISC Inquiry"));

    document.getElementById("modalDate").textContent = formatTimestamp(msg.createdAt);
    document.getElementById("modalBody").textContent = msg.message || "";

    const statusBadge = document.getElementById("modalStatusBadge");
    const status = msg.status || "new";
    statusBadge.textContent = status.toUpperCase().replace("_", " ");
    if (status === "resolved") {
        statusBadge.style.background = "rgba(46,204,113,0.15)";
        statusBadge.style.color = "#2ecc71";
    } else if (status === "in_progress") {
        statusBadge.style.background = "rgba(52,152,219,0.15)";
        statusBadge.style.color = "#3498db";
    } else {
        statusBadge.style.background = "rgba(230,126,34,0.15)";
        statusBadge.style.color = "#e67e22";
    }

    const replyBtn = document.getElementById("btnReplyMail");
    if (replyBtn) {
        replyBtn.href = "mailto:" + (msg.email || "") + "?subject=" + encodeURIComponent("Re: " + (msg.subject || "VVISC Inquiry"));
    }

    modal.style.display = "flex";
}

async function updateMessageStatus(id, newStatus) {
    if (!id) return;
    try {
        await db.collection("contactMessages").doc(id).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
        });

        if (CMS && CMS.logAudit) {
            CMS.logAudit("UPDATE", "contactMessages", id, `Updated message status to ${newStatus}`);
        }

        showToast(`Message marked as ${newStatus.replace("_", " ")}!`);
        const modal = document.getElementById("messageModal");
        if (modal) modal.style.display = "none";
    } catch (err) {
        showToast("Error updating status: " + err.message, "error");
    }
}

async function confirmDeleteMessage(id) {
    if (!confirm("Are you sure you want to permanently delete this contact inquiry?")) return;

    try {
        await db.collection("contactMessages").doc(id).delete();
        if (CMS && CMS.logAudit) {
            CMS.logAudit("DELETE", "contactMessages", id, "Deleted contact inquiry");
        }
        showToast("Contact inquiry deleted.");
    } catch (err) {
        showToast("Delete failed: " + err.message, "error");
    }
}

function formatTimestamp(ts) {
    if (!ts) return "Just now";
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch (e) {
        return "Unknown date";
    }
}

function escapeHtml(str) {
    return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
