// =========================================================
// Event Registrations Management Desk logic
// =========================================================

let allRegistrations = [];
let allEventsMap = {};

document.addEventListener("DOMContentLoaded", async () => {
    requireRole(["moderator", "admin", "superadmin"]);

    await loadEventDropdown();
    await loadRegistrations();

    // Search and filter listeners
    const searchInput = document.getElementById("regSearchInput");
    const eventFilter = document.getElementById("regEventFilter");
    const statusFilter = document.getElementById("regStatusFilter");
    const refreshBtn = document.getElementById("refreshBtn");
    const exportBtn = document.getElementById("exportCsvBtn");

    if (searchInput) searchInput.addEventListener("input", renderTable);
    if (eventFilter) eventFilter.addEventListener("change", renderTable);
    if (statusFilter) statusFilter.addEventListener("change", renderTable);
    if (refreshBtn) refreshBtn.addEventListener("click", loadRegistrations);
    if (exportBtn) exportBtn.addEventListener("click", exportToCsv);
});

async function loadEventDropdown() {
    try {
        const events = await CMS.getCollection("events");
        const select = document.getElementById("regEventFilter");
        if (!select) return;

        events.forEach(evt => {
            allEventsMap[evt.id] = evt.title;
            const opt = document.createElement("option");
            opt.value = evt.id;
            opt.textContent = evt.title;
            select.appendChild(opt);
        });
    } catch (e) {
        console.warn("Error loading events for dropdown:", e);
    }
}

async function loadRegistrations() {
    const tbody = document.getElementById("registrationsTableBody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted, #94a3b8);">Loading participant records...</td></tr>`;
    }

    try {
        const snapshot = await db.collection("registrations").orderBy("createdAt", "desc").get();
        allRegistrations = [];
        snapshot.forEach(doc => {
            allRegistrations.push({ id: doc.id, ...doc.data() });
        });
        updateStats();
        renderTable();
    } catch (err) {
        console.error("Error loading registrations:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#ef4444;">Failed to load registrations: ${CMS.escapeHtml(err.message)}</td></tr>`;
        }
    }
}

function updateStats() {
    const totalEl = document.getElementById("statTotal");
    const attendedEl = document.getElementById("statAttended");
    const pendingEl = document.getElementById("statPending");

    const total = allRegistrations.length;
    const attended = allRegistrations.filter(r => r.attended === true).length;
    const pending = total - attended;

    if (totalEl) totalEl.textContent = total;
    if (attendedEl) attendedEl.textContent = attended;
    if (pendingEl) pendingEl.textContent = pending;
}

function renderTable() {
    const tbody = document.getElementById("registrationsTableBody");
    if (!tbody) return;

    const search = (document.getElementById("regSearchInput")?.value || "").toLowerCase().trim();
    const selectedEvent = document.getElementById("regEventFilter")?.value || "all";
    const selectedStatus = document.getElementById("regStatusFilter")?.value || "all";

    let filtered = allRegistrations.filter(r => {
        // Event filter
        if (selectedEvent !== "all" && r.eventId !== selectedEvent) return false;

        // Status filter
        if (selectedStatus === "attended" && !r.attended) return false;
        if (selectedStatus === "pending" && r.attended) return false;

        // Search filter
        if (search) {
            const name = (r.name || "").toLowerCase();
            const email = (r.email || "").toLowerCase();
            const roll = (r.rollNumber || "").toLowerCase();
            const phone = (r.phone || "").toLowerCase();
            const evt = (r.eventTitle || "").toLowerCase();
            return name.includes(search) || email.includes(search) || roll.includes(search) || phone.includes(search) || evt.includes(search);
        }

        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:40px; color:var(--text-muted, #94a3b8);">
                    No participant registrations found matching criteria.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(r => {
        const isAttended = r.attended === true;
        const statusBadge = isAttended
            ? `<span class="status-pill status-attended">✓ Attended</span>`
            : `<span class="status-pill status-absent">Pending</span>`;

        const dateStr = r.createdAt ? CMS.formatDate(r.createdAt) : "N/A";
        const eventName = r.eventTitle || allEventsMap[r.eventId] || "VVISC Event";

        return `
            <tr data-id="${CMS.escapeHtml(r.id)}">
                <td>
                    <strong style="color:var(--text-color, #fff); display:block;">${CMS.escapeHtml(r.name || "Anonymous")}</strong>
                </td>
                <td>
                    <code style="font-family:'JetBrains Mono', monospace; font-size:0.8rem; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px;">${CMS.escapeHtml(r.rollNumber || "N/A")}</code>
                </td>
                <td>
                    <div style="font-size:0.82rem;">
                        <a href="mailto:${CMS.escapeHtml(r.email)}" style="color:var(--accent-color, #6366f1); text-decoration:none;">${CMS.escapeHtml(r.email || "")}</a>
                        ${r.phone ? `<div style="color:var(--text-muted, #94a3b8); margin-top:2px;">📞 ${CMS.escapeHtml(r.phone)}</div>` : ''}
                    </div>
                </td>
                <td>
                    <span style="font-size:0.85rem;">${CMS.escapeHtml(r.department || "General")} &bull; ${CMS.escapeHtml(r.yearOfStudy || "")}</span>
                </td>
                <td>
                    <span style="font-weight:600; font-size:0.85rem;">${CMS.escapeHtml(eventName)}</span>
                </td>
                <td style="color:var(--text-muted, #94a3b8); font-size:0.8rem;">
                    ${CMS.escapeHtml(dateStr)}
                </td>
                <td>
                    ${statusBadge}
                </td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="toggle-btn" onclick="toggleAttendance('${CMS.escapeHtml(r.id)}', ${!isAttended})">
                            ${isAttended ? 'Mark Absent' : 'Mark Present'}
                        </button>
                        <button class="toggle-btn" style="color:#ef4444; border-color:rgba(239,68,68,0.3);" onclick="deleteRegistration('${CMS.escapeHtml(r.id)}')">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

window.toggleAttendance = async function(docId, newStatus) {
    try {
        await db.collection("registrations").doc(docId).update({
            attended: newStatus,
            attendedAt: newStatus ? (firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()) : null
        });

        const target = allRegistrations.find(r => r.id === docId);
        if (target) {
            target.attended = newStatus;
        }

        await CMS.logAudit("toggle_attendance", "registrations", docId, {
            status: newStatus ? "attended" : "pending",
            studentName: target ? target.name : "Unknown"
        });

        showToast(`Attendance marked as ${newStatus ? 'Present' : 'Pending'}`);
        updateStats();
        renderTable();
    } catch (err) {
        console.error("Error updating attendance:", err);
        showToast("Failed to update attendance: " + err.message, "error");
    }
};

window.deleteRegistration = async function(docId) {
    if (!confirm("Are you sure you want to remove this registration record?")) return;

    try {
        await db.collection("registrations").doc(docId).delete();
        allRegistrations = allRegistrations.filter(r => r.id !== docId);

        await CMS.logAudit("delete", "registrations", docId, {
            deletedId: docId
        });

        showToast("Registration removed.");
        updateStats();
        renderTable();
    } catch (err) {
        console.error("Error deleting registration:", err);
        showToast("Failed to delete record: " + err.message, "error");
    }
};

function exportToCsv() {
    if (!allRegistrations || allRegistrations.length === 0) {
        showToast("No registrations available to export.", "error");
        return;
    }

    const headers = ["Name", "Roll Number", "Email", "Phone", "Department", "Year of Study", "Event Title", "Attended", "Registration Date"];
    const rows = allRegistrations.map(r => {
        const dateStr = r.createdAt ? CMS.formatDate(r.createdAt) : "";
        const evt = r.eventTitle || allEventsMap[r.eventId] || "VVISC Event";
        return [
            `"${(r.name || "").replace(/"/g, '""')}"`,
            `"${(r.rollNumber || "").replace(/"/g, '""')}"`,
            `"${(r.email || "").replace(/"/g, '""')}"`,
            `"${(r.phone || "").replace(/"/g, '""')}"`,
            `"${(r.department || "").replace(/"/g, '""')}"`,
            `"${(r.yearOfStudy || "").replace(/"/g, '""')}"`,
            `"${evt.replace(/"/g, '""')}"`,
            r.attended ? "YES" : "NO",
            `"${dateStr}"`
        ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vvisc-registrations-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV roster successfully exported!");
}
