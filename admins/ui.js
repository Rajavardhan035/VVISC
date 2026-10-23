// ==========================================
// VVISC Admin Console — Shared UI Helpers
// Icons, toast, live clock, count-up, mobile nav
// ==========================================

const ICONS = {
    dashboard: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17.6l-6.1 3.4 1.5-6.8-5.2-4.7 6.9-.7z"/></svg>',
    megaphone: '<svg viewBox="0 0 24 24"><path d="M3 10v4a1 1 0 0 0 1 1h2l4 4V5L6 9H4a1 1 0 0 0-1 1z"/><path d="M15 8a4 4 0 0 1 0 8"/><path d="M18 5a8 8 0 0 1 0 14"/></svg>',
    users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16.5 5.5A3.5 3.5 0 0 1 17 12.4"/><path d="M15 14.2c3.2.4 5.5 2.4 6 5.8"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V19.6a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1H2.4a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H8.5a1.7 1.7 0 0 0 1-1.56V2.4a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V8.5a1.7 1.7 0 0 0 1.56 1h.13a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    folderKanban: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M8 10v4"/><path d="M12 10v2"/><path d="M16 10v6"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4"/><path d="M12 19.1v2.4"/><path d="M4.6 4.6l1.7 1.7"/><path d="M17.7 17.7l1.7 1.7"/><path d="M2.5 12h2.4"/><path d="M19.1 12h2.4"/><path d="M4.6 19.4l1.7-1.7"/><path d="M17.7 6.3l1.7-1.7"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/></svg>'
};

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-icon]").forEach(el => {
        const key = el.getAttribute("data-icon");
        if (ICONS[key]) el.innerHTML = ICONS[key];
    });
    initMobileNav();
    initClock();
    applySavedPreferences();
});

// ==========================================
// Console preferences (set from Settings,
// applied on every admin page)
// ==========================================

function applyThemeClasses(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    if (document.body) {
        if (mode === "light") {
            document.body.classList.add("light-mode");
            document.body.classList.remove("dark-mode");
        } else {
            document.body.classList.add("dark-mode");
            document.body.classList.remove("light-mode");
        }
    }
}

function applySavedPreferences() {
    if (localStorage.getItem("vviscReduceMotion") === "true") {
        document.body.classList.add("reduce-motion");
    }

    if (localStorage.getItem("vviscShowClock") === "false") {
        document.querySelectorAll(".console-clock").forEach(el => {
            el.style.display = "none";
        });
    }

    // Default to light mode for all admin pages
    const theme = localStorage.getItem("vviscTheme") || "light";
    const accent = localStorage.getItem("vviscAccent") || "copper";

    applyThemeClasses(theme);
    document.documentElement.setAttribute("data-accent", accent);

    // Left = Sun = Light Mode (unchecked), Right = Moon = Dark Mode (checked)
    document.querySelectorAll(".theme-switch-input").forEach(el => {
        el.checked = (theme === "dark");
    });

    document.querySelectorAll(".accent-swatch").forEach(el => {
        el.classList.toggle("selected", el.dataset.accent === accent);
    });

    document.querySelectorAll(".theme-switch-input").forEach(el => {
        el.addEventListener("change", (e) => {
            setTheme(e.target.checked ? "dark" : "light");
        });
    });

    document.querySelectorAll(".accent-swatch").forEach(el => {
        el.addEventListener("click", () => {
            setAccent(el.dataset.accent);
        });
    });
}

// ==========================================
// Theme + Accent setters — shared across
// every admin page (sidebar switch + the
// mirrored controls on the Settings page)
// ==========================================

function setTheme(mode) {
    applyThemeClasses(mode);
    localStorage.setItem("vviscTheme", mode);

    document.querySelectorAll(".theme-switch-input").forEach(el => {
        el.checked = (mode === "dark");
    });
}

function setAccent(accent) {
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("vviscAccent", accent);

    document.querySelectorAll(".accent-swatch").forEach(el => {
        el.classList.toggle("selected", el.dataset.accent === accent);
    });

    showToast("Accent color updated.");
}

// ==========================================
// Toast
// ==========================================

function showToast(message, type = "success") {
    const old = document.querySelector(".toast");
    if (old) old.remove();

    const icons = {
        success: '\u2713 ',
        error: '\u2715 ',
        warning: '\u26A0 ',
        info: '\u2139 '
    };

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}` + (type === "error" ? " error" : "");
    toast.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span><span class="toast-msg">${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// ==========================================
// Count-up animation for stat numbers
// ==========================================

function countUp(el, target) {
    if (!el) return;
    target = Number(target) || 0;
    const start = 0;
    const duration = 850;
    const startTime = performance.now();

    function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4); // Quartic ease out
        const current = Math.round(start + (target - start) * eased);
        el.innerText = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(tick);
        else el.innerText = target.toLocaleString();
    }
    requestAnimationFrame(tick);
}

// ==========================================
// Live clock
// ==========================================

function initClock() {
    const el = document.getElementById("consoleClock");
    if (!el) return;

    function update() {
        const now = new Date();
        el.innerText = now.toLocaleString("en-US", {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }
    update();
    setInterval(update, 1000);
}

// ==========================================
// Mobile sidebar toggle
// ==========================================

function initMobileNav() {
    const toggle = document.getElementById("navToggle");
    const sidebar = document.querySelector(".sidebar");

    if (!toggle || !sidebar) return;

    // Deduplicate any multiple overlay elements and ensure exactly one overlay on body
    const allOverlays = document.querySelectorAll(".sidebar-overlay, #sidebarOverlay");
    for (let i = 1; i < allOverlays.length; i++) {
        allOverlays[i].remove();
    }

    let overlay = document.querySelector(".sidebar-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "sidebarOverlay";
        overlay.className = "sidebar-overlay";
        document.body.appendChild(overlay);
    }

    // Move sidebar and overlay directly under body to guarantee they are never trapped in a container's stacking context
    if (sidebar.parentElement && sidebar.parentElement !== document.body) {
        document.body.appendChild(sidebar);
    }
    if (overlay.parentElement && overlay.parentElement !== document.body) {
        document.body.appendChild(overlay);
    }

    // Inject topbar header for mobile view if not present
    let bar = document.querySelector(".admin-mobile-bar");
    if (!bar) {
        bar = document.createElement("div");
        bar.className = "admin-mobile-bar";
        bar.innerHTML = `
            <div class="admin-mobile-brand">
                <img src="../assets/logo.png" alt="VVISC logo" class="admin-mobile-logo">
                <span class="admin-mobile-title">VVISC <span class="admin-mobile-accent">Admin</span></span>
            </div>
        `;
        document.body.prepend(bar);
        bar.appendChild(toggle);
    }

    function updateToggleState(isOpen) {
        if (isOpen) {
            sidebar.classList.add("open");
            overlay.classList.add("show");
            document.body.classList.add("menu-open");
            toggle.setAttribute("aria-expanded", "true");
            toggle.innerHTML = '<span class="admin-toggle-close" style="font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;">&times;</span>';
        } else {
            sidebar.classList.remove("open");
            overlay.classList.remove("show");
            document.body.classList.remove("menu-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>';
        }
    }

    toggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = sidebar.classList.contains("open");
        updateToggleState(!isOpen);
    });

    overlay.addEventListener("click", () => {
        updateToggleState(false);
    });

    // Automatically detect and mark active nav link
    const currentFile = window.location.pathname.split("/").pop() || "dashboard.html";
    sidebar.querySelectorAll("nav a").forEach(a => {
        const href = a.getAttribute("href");
        const isExact = href === currentFile || (currentFile === "project-management.html" && href === "project-management.html");
        const isContentSub = href === "content-management.html" &&
            (currentFile === "about-management.html" ||
             currentFile === "contact-management.html" ||
             currentFile === "council-management.html" ||
             currentFile === "departments-management.html" ||
             currentFile === "gallery-management.html" ||
             currentFile === "home-management.html" ||
             currentFile === "achievements-management.html" ||
             currentFile === "partners-management.html" ||
             currentFile === "resources-management.html");

        if (isExact || isContentSub) {
            a.classList.add("active");
        } else {
            a.classList.remove("active");
        }
    });

    // Handle mobile link clicks cleanly (guarantees iOS Safari & Android navigation)
    sidebar.querySelectorAll("nav a").forEach(a => {
        a.addEventListener("click", (e) => {
            const href = a.getAttribute("href");
            if (!href || href === "#") {
                e.preventDefault();
                updateToggleState(false);
                return;
            }

            // If user tapped the page they are already on, simply close the drawer
            if (href === currentFile) {
                e.preventDefault();
                updateToggleState(false);
                return;
            }

            // When navigating to another page, navigate directly via window.location.href
            // Do NOT hide the sidebar synchronously beforehand, which can cause iOS Safari to abort navigation
            e.preventDefault();
            e.stopPropagation();
            window.location.href = href;
        });
    });
}

// ==========================================
// Relative time helper
// ==========================================

function timeAgo(date) {
    if (!date) return "";
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const map = [
        ["year", 31536000], ["month", 2592000], ["week", 604800],
        ["day", 86400], ["hour", 3600], ["minute", 60]
    ];
    for (const [label, secs] of map) {
        const val = Math.floor(seconds / secs);
        if (val >= 1) return `${val} ${label}${val > 1 ? "s" : ""} ago`;
    }
    return "just now";
}
