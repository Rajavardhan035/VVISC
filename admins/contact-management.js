// =========================================================
// Contact Page Content Editor Logic
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");
    await loadContactData();

    const saveBtn = document.getElementById("saveContactBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await saveContactData();
        });
    }
});

async function loadContactData() {
    const data = await CMS.getContent("contact", {
        heading: "Get in Touch with VVISC",
        description: "Have questions about events, department memberships, or collaborations? Reach out to our core team.",
        email: "vvisc@vvit.net",
        phone: "+91 98765 43210",
        address: "VVIT Campus, Nambur, Guntur, Andhra Pradesh, 522508",
        officeHours: "Monday - Saturday: 9:00 AM - 5:00 PM",
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3829.345!2d80.523!3d16.354!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1",
        socialLinkedin: "https://linkedin.com",
        socialGithub: "https://github.com",
        socialInstagram: "https://instagram.com",
        socialTwitter: "https://twitter.com"
    });

    document.getElementById("contactHeading").value = data.heading || "";
    document.getElementById("contactDescription").value = data.description || "";
    document.getElementById("contactEmailInput").value = data.email || "";
    document.getElementById("contactPhoneInput").value = data.phone || "";
    document.getElementById("contactAddressInput").value = data.address || "";
    document.getElementById("contactOfficeHours").value = data.officeHours || "";
    document.getElementById("contactMapEmbedUrl").value = data.mapEmbedUrl || "";
    document.getElementById("socialLinkedin").value = data.socialLinkedin || "";
    document.getElementById("socialGithub").value = data.socialGithub || "";
    document.getElementById("socialInstagram").value = data.socialInstagram || "";
    document.getElementById("socialTwitter").value = data.socialTwitter || "";
}

async function saveContactData() {
    const payload = {
        heading: document.getElementById("contactHeading").value.trim(),
        description: document.getElementById("contactDescription").value.trim(),
        email: document.getElementById("contactEmailInput").value.trim(),
        phone: document.getElementById("contactPhoneInput").value.trim(),
        address: document.getElementById("contactAddressInput").value.trim(),
        officeHours: document.getElementById("contactOfficeHours").value.trim(),
        mapEmbedUrl: document.getElementById("contactMapEmbedUrl").value.trim(),
        socialLinkedin: document.getElementById("socialLinkedin").value.trim(),
        socialGithub: document.getElementById("socialGithub").value.trim(),
        socialInstagram: document.getElementById("socialInstagram").value.trim(),
        socialTwitter: document.getElementById("socialTwitter").value.trim()
    };

    try {
        await CMS.saveContent("contact", payload);
        showToast("Contact Page content saved successfully!");
    } catch (err) {
        showToast("Failed to save Contact Page content: " + err.message, "error");
    }
}
