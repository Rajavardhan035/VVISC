// =========================================================
// Website Settings Logic — Production CMS
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");
    await loadSettingsData();

    // Image Upload Handlers
    setupImageUploader("logoFileInput", "logoUrlInput", "branding");
    setupImageUploader("darkLogoFileInput", "darkLogoUrlInput", "branding");
    setupImageUploader("faviconFileInput", "faviconUrlInput", "branding");

    const saveBtn = document.getElementById("saveSettingsBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await saveSettingsData();
        });
    }
});

function setupImageUploader(fileInputId, urlInputId, folder) {
    const fileInput = document.getElementById(fileInputId);
    const urlInput = document.getElementById(urlInputId);
    if (!fileInput || !urlInput) return;

    fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showToast("Uploading asset...", "info");
        try {
            const url = await CMS.uploadImage(file, folder);
            if (url) {
                urlInput.value = url;
                showToast("Asset uploaded and optimized!");
            }
        } catch (err) {
            showToast("Upload failed: " + err.message, "error");
        }
    });
}

async function loadSettingsData() {
    // Check settings doc
    let data = await CMS.getContent("settings", {});
    // Merge websiteSettings if present
    const wsData = await CMS.getContent("websiteSettings", {});
    data = { ...data, ...wsData };

    // Fallbacks
    const defaults = {
        siteName: "VVISC Technical Club",
        tagline: "Innovate, Build & Transform",
        logo: "assets/logo.png",
        darkLogo: "assets/logo.png",
        favicon: "assets/logo.png",
        footerLogo: "assets/logo.png",
        copyright: "© 2026 VVISC Technical Club. All rights reserved.",
        copyrightText: "© 2026 VVISC Technical Club. All rights reserved.",
        academicYear: "2025-2026",
        currentCouncilYear: "2025-26",
        officialEmail: "vvisc@vvit.edu.in",
        phone: "+91 98765 43210",
        address: "VVIT Campus, Namburu, Guntur, AP, 522508",
        officeHours: "Monday - Friday: 9:00 AM – 5:00 PM",
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3829.345!2d80.523!3d16.354!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1",
        linkedin: "https://linkedin.com/company/vvisc",
        instagram: "https://instagram.com/vvisc_vvit",
        github: "https://github.com/vvisc",
        youtube: "https://youtube.com/@vvisc",
        whatsapp: "",
        defaultSeoTitle: "VVISC Technical Club - VVIT IUCEE Chapter",
        defaultSeoDescription: "Official website of VVISC IUCEE Student Chapter at VVIT."
    };

    const finalData = { ...defaults, ...data };

    // Populate Fields
    setVal("siteNameInput", finalData.siteName);
    setVal("siteTagline", finalData.tagline);
    setVal("logoUrlInput", finalData.logo);
    setVal("darkLogoUrlInput", finalData.darkLogo);
    setVal("faviconUrlInput", finalData.favicon);
    setVal("copyrightTextInput", finalData.copyrightText || finalData.copyright);
    setVal("academicYearInput", finalData.academicYear);
    setVal("currentCouncilYearInput", finalData.currentCouncilYear);
    setVal("officialEmailInput", finalData.officialEmail || finalData.contactEmail);
    setVal("phoneInput", finalData.phone);
    setVal("addressInput", finalData.address);
    setVal("officeHoursInput", finalData.officeHours);
    setVal("mapEmbedUrlInput", finalData.mapEmbedUrl);
    setVal("linkedinInput", finalData.linkedin || finalData.socialLinkedin);
    setVal("instagramInput", finalData.instagram || finalData.socialInstagram);
    setVal("githubInput", finalData.github || finalData.socialGithub);
    setVal("youtubeInput", finalData.youtube || finalData.socialYoutube);
    setVal("whatsappInput", finalData.whatsapp || finalData.socialWhatsapp);
    setVal("defaultSeoTitle", finalData.defaultSeoTitle);
    setVal("defaultSeoDescription", finalData.defaultSeoDescription);
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

async function saveSettingsData() {
    const payload = {
        siteName: getVal("siteNameInput"),
        tagline: getVal("siteTagline"),
        logo: getVal("logoUrlInput"),
        darkLogo: getVal("darkLogoUrlInput"),
        favicon: getVal("faviconUrlInput"),
        footerLogo: getVal("logoUrlInput"),
        copyright: getVal("copyrightTextInput"),
        copyrightText: getVal("copyrightTextInput"),
        academicYear: getVal("academicYearInput"),
        currentCouncilYear: getVal("currentCouncilYearInput"),
        officialEmail: getVal("officialEmailInput"),
        contactEmail: getVal("officialEmailInput"),
        phone: getVal("phoneInput"),
        address: getVal("addressInput"),
        officeHours: getVal("officeHoursInput"),
        mapEmbedUrl: getVal("mapEmbedUrlInput"),
        linkedin: getVal("linkedinInput"),
        instagram: getVal("instagramInput"),
        github: getVal("githubInput"),
        youtube: getVal("youtubeInput"),
        whatsapp: getVal("whatsappInput"),
        defaultSeoTitle: getVal("defaultSeoTitle"),
        defaultSeoDescription: getVal("defaultSeoDescription")
    };

    try {
        // Save to both settings and websiteSettings for total cross-compatibility
        await CMS.saveContent("settings", payload);
        await CMS.saveContent("websiteSettings", payload);
        showToast("Website settings saved successfully to Firestore cloud!");
    } catch (err) {
        showToast("Failed to save settings: " + err.message, "error");
    }
}
