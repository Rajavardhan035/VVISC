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
        aboutDescription: "VVISC IUCEE Student Chapter provides a vibrant platform for technology enthusiasts to collaborate on real-world projects, attend technical workshops, hackathons, and industry mentorship sessions.",

        highlightsEyebrow: "Don't Miss These",
        highlightsTitle: "Event Highlights",
        highlightsSubtitle: "The moments worth circling on your calendar.",

        highlight1Tag: "Flagship",
        highlight1Badge: "badge-flagship",
        highlight1Title: "Spring Hackathon",
        highlight1Desc: "48 hours. One idea. Real impact. Our biggest build event of the year.",
        highlight1Date: "Oct 15",
        highlight1Location: "Main Auditorium",
        highlight1Link: "events.html",

        highlight2Tag: "Workshop",
        highlight2Badge: "badge-workshop",
        highlight2Title: "AI/ML Bootcamp",
        highlight2Desc: "Hands-on neural networks and computer vision, taught by our top performers.",
        highlight2Date: "Nov 02",
        highlight2Location: "Lab Block C",
        highlight2Link: "events.html",

        highlight3Tag: "Symposium",
        highlight3Badge: "badge-symposium",
        highlight3Title: "Tech Symposium",
        highlight3Desc: "Guest speakers, live demos, and networking with industry alumni.",
        highlight3Date: "Dec 10",
        highlight3Location: "Seminar Hall",
        highlight3Link: "events.html"
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

    // Event Highlights
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined ? val : "";
    };

    setVal("highlightsEyebrow", data.highlightsEyebrow);
    setVal("highlightsTitle", data.highlightsTitle);
    setVal("highlightsSubtitle", data.highlightsSubtitle);

    // Populate Featured Event Select from live events collection
    const featSelect = document.getElementById("featuredEventSelect");
    if (featSelect) {
        try {
            const eventsList = await CMS.getCollection("events");
            eventsList.forEach(ev => {
                const opt = document.createElement("option");
                opt.value = ev.id;
                opt.textContent = `${ev.eventName || ev.title || "Untitled"} (${ev.date || "TBD"})`;
                featSelect.appendChild(opt);
            });

            featSelect.value = data.featuredEventId || "";

            featSelect.addEventListener("change", () => {
                const selectedId = featSelect.value;
                if (!selectedId) return;
                if (selectedId === "auto") {
                    setVal("highlight1Tag", "Flagship");
                    setVal("highlight1Title", "Next Upcoming Event");
                    setVal("highlight1Desc", "Auto-synced from latest active event in database.");
                    setVal("highlight1Link", "events.html");
                    return;
                }
                const found = eventsList.find(e => e.id === selectedId);
                if (found) {
                    setVal("highlight1Tag", found.category || "Flagship");
                    setVal("highlight1Title", found.eventName || found.title || "");
                    setVal("highlight1Desc", found.shortDescription || found.description || "");
                    setVal("highlight1Date", found.date || "");
                    setVal("highlight1Location", found.venue || found.location || "VVIT Campus");
                    setVal("highlight1Link", found.registrationLink || "events.html");
                }
            });
        } catch (e) {
            console.warn("Could not load events dropdown:", e);
        }
    }

    for (let i = 1; i <= 3; i++) {
        setVal(`highlight${i}Tag`, data[`highlight${i}Tag`]);
        setVal(`highlight${i}Badge`, data[`highlight${i}Badge`]);
        setVal(`highlight${i}Title`, data[`highlight${i}Title`]);
        setVal(`highlight${i}Desc`, data[`highlight${i}Desc`]);
        setVal(`highlight${i}Date`, data[`highlight${i}Date`]);
        setVal(`highlight${i}Location`, data[`highlight${i}Location`]);
        setVal(`highlight${i}Link`, data[`highlight${i}Link`]);
    }

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
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
    };

    const payload = {
        heroTitle: getVal("heroTitle"),
        heroSubtitle: getVal("heroSubtitle"),
        heroDescription: getVal("heroDescription"),
        ctaPrimaryText: getVal("ctaPrimaryText"),
        ctaPrimaryLink: getVal("ctaPrimaryLink"),
        ctaSecondaryText: getVal("ctaSecondaryText"),
        ctaSecondaryLink: getVal("ctaSecondaryLink"),
        statMembers: getVal("statMembers"),
        statEvents: getVal("statEvents"),
        statDepts: getVal("statDepts"),
        statReach: getVal("statReach"),

        highlightsEyebrow: getVal("highlightsEyebrow"),
        highlightsTitle: getVal("highlightsTitle"),
        highlightsSubtitle: getVal("highlightsSubtitle"),
        featuredEventId: getVal("featuredEventSelect"),

        highlight1Tag: getVal("highlight1Tag"),
        highlight1Badge: getVal("highlight1Badge"),
        highlight1Title: getVal("highlight1Title"),
        highlight1Desc: getVal("highlight1Desc"),
        highlight1Date: getVal("highlight1Date"),
        highlight1Location: getVal("highlight1Location"),
        highlight1Link: getVal("highlight1Link"),

        highlight2Tag: getVal("highlight2Tag"),
        highlight2Badge: getVal("highlight2Badge"),
        highlight2Title: getVal("highlight2Title"),
        highlight2Desc: getVal("highlight2Desc"),
        highlight2Date: getVal("highlight2Date"),
        highlight2Location: getVal("highlight2Location"),
        highlight2Link: getVal("highlight2Link"),

        highlight3Tag: getVal("highlight3Tag"),
        highlight3Badge: getVal("highlight3Badge"),
        highlight3Title: getVal("highlight3Title"),
        highlight3Desc: getVal("highlight3Desc"),
        highlight3Date: getVal("highlight3Date"),
        highlight3Location: getVal("highlight3Location"),
        highlight3Link: getVal("highlight3Link"),

        impactEyebrow: getVal("impactEyebrow"),
        impactTitle1: getVal("impactTitle1"),
        impactTitle2: getVal("impactTitle2"),
        impactDescription: getVal("impactDescription"),
        impactCtaText: getVal("impactCtaText"),
        impactCtaLink: getVal("impactCtaLink"),

        aboutTitle: getVal("aboutTitle"),
        aboutDescription: getVal("aboutDescription")
    };

    for (let i = 1; i <= 6; i++) {
        payload[`card${i}Number`] = getVal(`card${i}Number`);
        payload[`card${i}Title`] = getVal(`card${i}Title`);
        payload[`card${i}Eyebrow`] = getVal(`card${i}Eyebrow`);
        payload[`card${i}Desc`] = getVal(`card${i}Desc`);
    }

    try {
        await CMS.saveContent("home", payload);
        showToast("Home Page content saved successfully!");
    } catch (err) {
        showToast("Failed to save Home Page content: " + err.message, "error");
    }
}
