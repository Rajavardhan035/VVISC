// =========================================================
// Home Page Content Editor Logic
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");
    loadHomeData();

    const saveBtn = document.getElementById("saveHomeBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await saveHomeData();
        });
    }
});

async function loadHomeData() {
    const data = await CMS.getContent("home", {
        heroTitle: "VVISC Technical Club",
        heroSubtitle: "IUCEE Student Chapter",
        heroDescription: "Innovate, Build, and Transform with us. Bridging academic excellence with cutting-edge engineering skills.",
        ctaPrimaryText: "Explore Events",
        ctaPrimaryLink: "events.html",
        ctaSecondaryText: "Join Community",
        ctaSecondaryLink: "contact.html",
        statMembers: "500+",
        statEvents: "50+",
        statDepts: "6",
        statReach: "1000+",

        impactEyebrow: "● OUR ACHIEVEMENTS",
        impactTitle1: "Building Innovation,",
        impactTitle2: "Creating Impact",
        impactDescription: "Every workshop, hackathon, and collaboration strengthens the innovation ecosystem of VVISC IUCEE Student Chapter. Discover what drives our learning and development.",
        impactCtaText: "Explore Achievements",
        impactCtaLink: "events.html",

        card1Eyebrow: "Events & Hackathons", card1Number: "50+", card1Title: "Events Organized", card1Desc: "National Hackathons, Workshops, Guest Lectures and Technical Meetups.",
        card2Eyebrow: "Volunteers & Leads", card2Number: "40+", card2Title: "Active Volunteers", card2Desc: "Passionate students leading technical communities and organizing events.",
        card3Eyebrow: "Achievements & Awards", card3Number: "20+", card3Title: "National Wins", card3Desc: "National level competitions, hackathon wins and prestige awards.",
        card4Eyebrow: "Research & Papers", card4Number: "30+", card4Title: "Research Papers", card4Desc: "Research papers, innovation projects and publications by VVISC members.",
        card5Eyebrow: "Student Community", card5Number: "500+", card5Title: "Community Members", card5Desc: "Connected student chapters, engineering innovators & mentors.",
        card6Eyebrow: "Industry Mentorship", card6Number: "15+", card6Title: "Expert Mentors", card6Desc: "Hands-on guidance and expert sessions from top tech industry leaders.",

        aboutTitle: "Empowering Next-Gen Engineers",
        aboutDescription: "VVISC IUCEE Student Chapter provides a vibrant platform for technology enthusiasts to collaborate on real-world projects, attend technical workshops, hackathons, and industry mentorship sessions."
    });

    document.getElementById("heroTitle").value = data.heroTitle || "";
    document.getElementById("heroSubtitle").value = data.heroSubtitle || "";
    document.getElementById("heroDescription").value = data.heroDescription || "";
    document.getElementById("ctaPrimaryText").value = data.ctaPrimaryText || "";
    document.getElementById("ctaPrimaryLink").value = data.ctaPrimaryLink || "";
    document.getElementById("ctaSecondaryText").value = data.ctaSecondaryText || "";
    document.getElementById("ctaSecondaryLink").value = data.ctaSecondaryLink || "";
    document.getElementById("statMembers").value = data.statMembers || "";
    document.getElementById("statEvents").value = data.statEvents || "";
    document.getElementById("statDepts").value = data.statDepts || "";
    document.getElementById("statReach").value = data.statReach || "";

    document.getElementById("impactEyebrow").value = data.impactEyebrow || "";
    document.getElementById("impactTitle1").value = data.impactTitle1 || "";
    document.getElementById("impactTitle2").value = data.impactTitle2 || "";
    document.getElementById("impactDescription").value = data.impactDescription || "";
    document.getElementById("impactCtaText").value = data.impactCtaText || "";
    document.getElementById("impactCtaLink").value = data.impactCtaLink || "";

    for (let i = 1; i <= 6; i++) {
        document.getElementById(`card${i}Number`).value = data[`card${i}Number`] || "";
        document.getElementById(`card${i}Title`).value = data[`card${i}Title`] || "";
        document.getElementById(`card${i}Eyebrow`).value = data[`card${i}Eyebrow`] || "";
        document.getElementById(`card${i}Desc`).value = data[`card${i}Desc`] || "";
    }

    document.getElementById("aboutTitle").value = data.aboutTitle || "";
    document.getElementById("aboutDescription").value = data.aboutDescription || "";
}

async function saveHomeData() {
    const payload = {
        heroTitle: document.getElementById("heroTitle").value.trim(),
        heroSubtitle: document.getElementById("heroSubtitle").value.trim(),
        heroDescription: document.getElementById("heroDescription").value.trim(),
        ctaPrimaryText: document.getElementById("ctaPrimaryText").value.trim(),
        ctaPrimaryLink: document.getElementById("ctaPrimaryLink").value.trim(),
        ctaSecondaryText: document.getElementById("ctaSecondaryText").value.trim(),
        ctaSecondaryLink: document.getElementById("ctaSecondaryLink").value.trim(),
        statMembers: document.getElementById("statMembers").value.trim(),
        statEvents: document.getElementById("statEvents").value.trim(),
        statDepts: document.getElementById("statDepts").value.trim(),
        statReach: document.getElementById("statReach").value.trim(),

        impactEyebrow: document.getElementById("impactEyebrow").value.trim(),
        impactTitle1: document.getElementById("impactTitle1").value.trim(),
        impactTitle2: document.getElementById("impactTitle2").value.trim(),
        impactDescription: document.getElementById("impactDescription").value.trim(),
        impactCtaText: document.getElementById("impactCtaText").value.trim(),
        impactCtaLink: document.getElementById("impactCtaLink").value.trim(),

        aboutTitle: document.getElementById("aboutTitle").value.trim(),
        aboutDescription: document.getElementById("aboutDescription").value.trim()
    };

    for (let i = 1; i <= 6; i++) {
        payload[`card${i}Number`] = document.getElementById(`card${i}Number`).value.trim();
        payload[`card${i}Title`] = document.getElementById(`card${i}Title`).value.trim();
        payload[`card${i}Eyebrow`] = document.getElementById(`card${i}Eyebrow`).value.trim();
        payload[`card${i}Desc`] = document.getElementById(`card${i}Desc`).value.trim();
    }

    try {
        await CMS.saveContent("home", payload);
        showToast("Home Page content saved successfully!");
    } catch (err) {
        showToast("Failed to save Home Page content: " + err.message, "error");
    }
}
