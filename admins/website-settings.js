// =========================================================
// Website Settings Logic
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");
    await loadSettingsData();

    const saveBtn = document.getElementById("saveSettingsBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await saveSettingsData();
        });
    }
});

async function loadSettingsData() {
    const data = await CMS.getContent("settings", {
        siteName: "VVISC Technical Club",
        tagline: "Innovate, Build & Transform",
        copyrightText: "© 2026 VVISC Technical Club. All rights reserved.",
        defaultSeoTitle: "VVISC Technical Club - VVIT IUCEE Chapter",
        defaultSeoDescription: "Official website of VVISC IUCEE Student Chapter at VVIT."
    });

    document.getElementById("siteNameInput").value = data.siteName || "";
    document.getElementById("siteTagline").value = data.tagline || "";
    document.getElementById("copyrightTextInput").value = data.copyrightText || "";
    document.getElementById("defaultSeoTitle").value = data.defaultSeoTitle || "";
    document.getElementById("defaultSeoDescription").value = data.defaultSeoDescription || "";
}

async function saveSettingsData() {
    const payload = {
        siteName: document.getElementById("siteNameInput").value.trim(),
        tagline: document.getElementById("siteTagline").value.trim(),
        copyrightText: document.getElementById("copyrightTextInput").value.trim(),
        defaultSeoTitle: document.getElementById("defaultSeoTitle").value.trim(),
        defaultSeoDescription: document.getElementById("defaultSeoDescription").value.trim()
    };

    try {
        await CMS.saveContent("settings", payload);
        showToast("Website settings saved successfully!");
    } catch (err) {
        showToast("Failed to save settings: " + err.message, "error");
    }
}
