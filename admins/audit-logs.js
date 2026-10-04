// =========================================================
// Audit Trail & Security Logs Logic
// =========================================================

let logsList = [];

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");

    await loadAuditLogs();

    const searchInput = document.getElementById("logSearch");
    const actionFilter = document.getElementById("logActionFilter");
    const refreshBtn = document.getElementById("refreshLogsBtn");

    if (searchInput) searchInput.oninput = renderTable;
    if (actionFilter) actionFilter.onchange = renderTable;
    if (refreshBtn) refreshBtn.onclick = loadAuditLogs;
});

async function loadAuditLogs() {
    const tbody = document.getElementById("auditTableBody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted, #94a3b8);">Loading audit log stream...</td></tr>`;
    }

    try {
        const snapshot = await db.collection("auditLogs").orderBy("timestamp", "desc").limit(150).get();
        logsList = [];
        snapshot.forEach(doc => {
            logsList.push({ id: doc.id, ...doc.data() });
        });
        renderTable();
    } catch (err) {
        console.error("Error loading audit logs:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#ef4444;">Failed to load audit logs: ${CMS.escapeHtml(err.message)}</td></tr>`;
        }
    }
}

function renderTable() {
    const tbody = document.getElementById("auditTableBody");
    if (!tbody) return;

    const q = (document.getElementById("logSearch")?.value || "").toLowerCase().trim();
    const actionType = document.getElementById("logActionFilter")?.value || "all";

    let filtered = logsList;
    if (actionType !== "all") {
        filtered = filtered.filter(l => (l.action || "").toLowerCase().includes(actionType));
    }
    if (q) {
        filtered = filtered.filter(l => {
            const user = (l.performedBy || l.adminEmail || "").toLowerCase();
            const col = (l.collection || "").toLowerCase();
            const target = (l.targetId || "").toLowerCase();
            const details = typeof l.details === "string" ? l.details.toLowerCase() : JSON.stringify(l.details || "").toLowerCase();
            return user.includes(q) || col.includes(q) || target.includes(q) || details.includes(q);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted, #94a3b8);">
                    No audit log records found matching search filters.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(log => {
        const act = (log.action || "action").toLowerCase();
        let actClass = "action-update";
        if (act.includes("create") || act.includes("add") || act.includes("seed")) actClass = "action-create";
        else if (act.includes("delete") || act.includes("remove")) actClass = "action-delete";
        else if (act.includes("login")) actClass = "action-login";

        const dateStr = log.timestamp ? CMS.formatDate(log.timestamp) : "Recent";
        const adminUser = log.performedBy || log.adminEmail || "Admin User";
        
        let detailsSummary = "";
        if (typeof log.details === "string") {
            detailsSummary = log.details;
        } else if (log.details && typeof log.details === "object") {
            try {
                detailsSummary = JSON.stringify(log.details);
            } catch (e) {
                detailsSummary = "Object data";
            }
        }

        return `
            <tr>
                <td style="color:#94a3b8; font-size:0.8rem; white-space:nowrap;">
                    ${CMS.escapeHtml(dateStr)}
                </td>
                <td>
                    <strong style="color:#fff; font-size:0.85rem;">${CMS.escapeHtml(adminUser)}</strong>
                </td>
                <td>
                    <span class="action-badge ${actClass}">${CMS.escapeHtml(act.toUpperCase())}</span>
                </td>
                <td>
                    <code style="font-family:'JetBrains Mono', monospace; font-size:0.8rem; color:#60a5fa;">
                        ${CMS.escapeHtml(log.collection || "system")}
                    </code>
                </td>
                <td>
                    <code style="font-family:'JetBrains Mono', monospace; font-size:0.75rem; color:#94a3b8;">
                        ${CMS.escapeHtml((log.targetId || "").substring(0, 16))}
                    </code>
                </td>
                <td>
                    <div style="font-size:0.82rem; color:#cbd5e1; max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${CMS.escapeHtml(detailsSummary)}">
                        ${CMS.escapeHtml(detailsSummary || "Success")}
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}
