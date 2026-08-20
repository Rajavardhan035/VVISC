// =========================================================
// About Page Content Editor Logic
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
                title: "New Milestone",
                description: "Milestone description details...",
                active: true
            });
            renderTimelineRows();
        });
    }
});

async function loadAboutData() {
    const data = await CMS.getContent("about", {
        introTitle: "Pioneering Innovation at VVIT",
        introText: "VVISC (VVC IUCEE Student Chapter) is a premier student organization committed to enhancing technical education, engineering mindset, and hands-on project development.",
        visionText: "To create an inclusive ecosystem of innovation where every student transforms academic knowledge into practical technological solutions for real-world impact.",
        missionText: "Empower students through skill-building workshops, industry mentorship, collaborative hackathons, and interdisciplinary research initiatives.",
        timeline: [
            { year: "2024", title: "Chapter Inception", description: "VVISC established under the IUCEE umbrella at VVIT.", active: true },
            { year: "2025", title: "National Recognition", description: "Hosted national-level hackathons and regional technical symposiums.", active: true }
        ]
    });

    document.getElementById("introTitle").value = data.introTitle || "";
    document.getElementById("introText").value = data.introText || "";
    document.getElementById("visionText").value = data.visionText || "";
    document.getElementById("missionText").value = data.missionText || "";

    timelineItems = Array.isArray(data.timeline) ? data.timeline : [];
    renderTimelineRows();
}

function renderTimelineRows() {
    const container = document.getElementById("timelineContainer");
    if (!container) return;
    container.innerHTML = "";

    timelineItems.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "card";
        row.style.cssText = "padding:16px; border:1px solid var(--border-color); border-radius:8px; display:grid; grid-template-columns: 100px 1fr 2fr auto; gap:12px; align-items:center;";

        row.innerHTML = `
            <div>
                <label style="font-size:0.75rem; opacity:0.7; display:block;">Year</label>
                <input type="text" value="${escapeAttr(item.year)}" onchange="timelineItems[${index}].year = this.value" style="width:100%; padding:6px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit;">
            </div>
            <div>
                <label style="font-size:0.75rem; opacity:0.7; display:block;">Title</label>
                <input type="text" value="${escapeAttr(item.title)}" onchange="timelineItems[${index}].title = this.value" style="width:100%; padding:6px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit;">
            </div>
            <div>
                <label style="font-size:0.75rem; opacity:0.7; display:block;">Description</label>
                <input type="text" value="${escapeAttr(item.description)}" onchange="timelineItems[${index}].description = this.value" style="width:100%; padding:6px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit;">
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <button type="button" onclick="removeTimelineItem(${index})" style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">Delete</button>
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
        introTitle: document.getElementById("introTitle").value.trim(),
        introText: document.getElementById("introText").value.trim(),
        visionText: document.getElementById("visionText").value.trim(),
        missionText: document.getElementById("missionText").value.trim(),
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
