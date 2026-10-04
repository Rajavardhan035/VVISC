// =========================================================
// About Page Content Editor Logic — Production CMS
// =========================================================

let timelineItems = [];

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");
    await loadAboutData();

    const saveBtn = document.getElementById("saveAboutBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await saveAboutData();
        });
    }

    const addBtn = document.getElementById("addTimelineBtn");
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            timelineItems.push({
                year: new Date().getFullYear().toString(),
                icon: "🚀",
                title: "New Chapter Milestone",
                description: "Milestone description details...",
                order: timelineItems.length + 1,
                active: true
            });
            renderTimelineRows();
        });
    }
});

async function loadAboutData() {
    const data = await CMS.getContent("about", {
        introTitle: "WHO WE ARE",
        introText: "VVISC (VVIT IUCEE Student Chapter) is a premier student organization committed to enhancing technical education, engineering mindset, and hands-on project development.",
        visionText: "To create an inclusive ecosystem of innovation where every student transforms academic knowledge into practical technological solutions for real-world impact.",
        missionText: "To empower students through innovation, engineering excellence, research and real-world problem solving.",
        
        feat1Title: "Innovation",
        feat1Desc: "Building practical solutions through emerging technologies.",
        feat2Title: "Research",
        feat2Desc: "Encouraging students to publish, experiment and innovate.",
        feat3Title: "Leadership",
        feat3Desc: "Developing communication, teamwork and management skills.",
        feat4Title: "Community",
        feat4Desc: "Connecting students, mentors, alumni and industry experts.",

        journeyTitle: "Growing Through Innovation",
        journeySubtitle: "Every milestone reflects our commitment to innovation, leadership, research and building future-ready engineers.",

        timeline: [
            { year: "2024", icon: "👥", title: "Chapter Founded", description: "VVISC IUCEE Student Chapter was officially established to create an innovation-driven student community.", order: 1, active: true },
            { year: "2025", icon: "🏆", title: "First Major Hackathon", description: "Hosted national-level student hackathons and innovation challenges with massive participation.", order: 2, active: true },
            { year: "2026", icon: "🚀", title: "R&D Labs Expansion", description: "Expanded research and development divisions across AI, IoT, Robotics and Web Architecture.", order: 3, active: true },
            { year: "Future", icon: "🌐", title: "Global Ecosystem", description: "Connecting campus engineers with global technological leaders and research publications.", order: 4, active: true }
        ]
    });

    setVal("introTitle", data.introTitle);
    setVal("introText", data.introText);
    setVal("visionText", data.visionText);
    setVal("missionText", data.missionText);

    setVal("feat1Title", data.feat1Title || "Innovation");
    setVal("feat1Desc", data.feat1Desc || "Building practical solutions through emerging technologies.");
    setVal("feat2Title", data.feat2Title || "Research");
    setVal("feat2Desc", data.feat2Desc || "Encouraging students to publish, experiment and innovate.");
    setVal("feat3Title", data.feat3Title || "Leadership");
    setVal("feat3Desc", data.feat3Desc || "Developing communication, teamwork and management skills.");
    setVal("feat4Title", data.feat4Title || "Community");
    setVal("feat4Desc", data.feat4Desc || "Connecting students, mentors, alumni and industry experts.");

    setVal("journeyTitle", data.journeyTitle || "Growing Through Innovation");
    setVal("journeySubtitle", data.journeySubtitle || "Every milestone reflects our commitment to innovation, leadership, research and building future-ready engineers.");

    timelineItems = Array.isArray(data.timeline) ? data.timeline : [];
    renderTimelineRows();
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

function renderTimelineRows() {
    const container = document.getElementById("timelineContainer");
    if (!container) return;
    container.innerHTML = "";

    if (timelineItems.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:0.9rem;">No milestones configured. Click "+ Add Milestone" above.</div>`;
        return;
    }

    timelineItems.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "card";
        row.style.cssText = "padding:16px; border:1px solid var(--border-color); border-radius:8px; display:grid; grid-template-columns: 80px 60px 1.5fr 2fr 70px auto; gap:10px; align-items:center;";

        const isActive = item.active !== false;

        row.innerHTML = `
            <div>
                <label style="font-size:0.7rem; opacity:0.7; display:block;">Year</label>
                <input type="text" value="${escapeAttr(item.year || "")}" onchange="timelineItems[${index}].year = this.value" style="width:100%; padding:6px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit; font-size:0.85rem;">
            </div>
            <div>
                <label style="font-size:0.7rem; opacity:0.7; display:block;">Icon</label>
                <input type="text" value="${escapeAttr(item.icon || "🚀")}" onchange="timelineItems[${index}].icon = this.value" style="width:100%; padding:6px; text-align:center; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit; font-size:0.85rem;">
            </div>
            <div>
                <label style="font-size:0.7rem; opacity:0.7; display:block;">Title</label>
                <input type="text" value="${escapeAttr(item.title || "")}" onchange="timelineItems[${index}].title = this.value" style="width:100%; padding:6px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit; font-size:0.85rem;">
            </div>
            <div>
                <label style="font-size:0.7rem; opacity:0.7; display:block;">Description</label>
                <input type="text" value="${escapeAttr(item.description || "")}" onchange="timelineItems[${index}].description = this.value" style="width:100%; padding:6px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit; font-size:0.85rem;">
            </div>
            <div style="text-align:center;">
                <label style="font-size:0.7rem; opacity:0.7; display:block;">Active</label>
                <input type="checkbox" ${isActive ? "checked" : ""} onchange="timelineItems[${index}].active = this.checked" style="margin-top:4px;">
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <button type="button" onclick="removeTimelineItem(${index})" style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:none; padding:8px 10px; border-radius:6px; cursor:pointer;" title="Delete">🗑</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function removeTimelineItem(index) {
    timelineItems.splice(index, 1);
    renderTimelineRows();
}

async function saveAboutData() {
    const payload = {
        introTitle: getVal("introTitle"),
        introText: getVal("introText"),
        visionText: getVal("visionText"),
        missionText: getVal("missionText"),
        feat1Title: getVal("feat1Title"),
        feat1Desc: getVal("feat1Desc"),
        feat2Title: getVal("feat2Title"),
        feat2Desc: getVal("feat2Desc"),
        feat3Title: getVal("feat3Title"),
        feat3Desc: getVal("feat3Desc"),
        feat4Title: getVal("feat4Title"),
        feat4Desc: getVal("feat4Desc"),
        journeyTitle: getVal("journeyTitle"),
        journeySubtitle: getVal("journeySubtitle"),
        timeline: timelineItems
    };

    try {
        await CMS.saveContent("about", payload);
        showToast("About Page content saved successfully!");
    } catch (err) {
        showToast("Failed to save About Page content: " + err.message, "error");
    }
}

function escapeAttr(str) {
    return (str || "").replace(/"/g, "&quot;");
}
