// =========================================================
// About Page Content Editor Logic — Production CMS
// Enhanced with Verified Event & Timeline Milestone Sync
// =========================================================

let timelineItems = [];
let allEventsList = [];

document.addEventListener("DOMContentLoaded", async () => {
    requireRole("admin");
    await Promise.all([
        loadAboutData(),
        loadAllEventsForMilestones()
    ]);

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
                description: "Describe the significance and impact of this milestone...",
                linkedEventId: "",
                statValue: "",
                statLabel: "",
                imageUrl: "",
                order: timelineItems.length + 1,
                active: true
            });
            renderTimelineRows();
        });
    }
});

async function loadAllEventsForMilestones() {
    try {
        const events = await CMS.getCollection("events");
        allEventsList = Array.isArray(events) ? events : [];
        allEventsList.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
        renderTimelineRows(); // Re-render with dropdown options loaded
    } catch (e) {
        console.warn("Could not load events for milestone dropdown:", e);
    }
}

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
            {
                year: "2024",
                icon: "👥",
                title: "Chapter Founded",
                description: "VVISC IUCEE Student Chapter was officially established to create an innovation-driven student community.",
                linkedEventId: "vvisc-founded-2024",
                statValue: "120+",
                statLabel: "Founding Engineers",
                imageUrl: "assets/logo.png",
                order: 1,
                active: true
            },
            {
                year: "2024",
                icon: "⚡",
                title: "Applied AI & ML Bootcamps",
                description: "Hands-on immersion in computer vision, deep learning pipelines, and model deployment.",
                linkedEventId: "ai-ml-bootcamp-2024",
                statValue: "300+",
                statLabel: "Students Certified",
                imageUrl: "assets/Ai-bootcamp.png",
                order: 2,
                active: true
            },
            {
                year: "2025",
                icon: "🏆",
                title: "Annual Innovation Hackathon",
                description: "48-hour multidisciplinary student hackathon solving pressing challenges in agriculture, robotics, and energy.",
                linkedEventId: "annual-hackathon-2025",
                statValue: "450+",
                statLabel: "Participants (12 Colleges)",
                imageUrl: "assets/hackathon.png",
                order: 3,
                active: true
            },
            {
                year: "2026",
                icon: "🚀",
                title: "Autonomous R&D & Edge AI Labs",
                description: "Expanded research and development divisions across AI, IoT, Robotics and Web Architecture.",
                linkedEventId: "rag-hackathon-2026",
                statValue: "15+",
                statLabel: "Active Prototypes",
                imageUrl: "assets/Ai-summit.png",
                order: 4,
                active: true
            },
            {
                year: "Future",
                icon: "🌐",
                title: "Global Innovation Ecosystem",
                description: "Connecting campus engineers with global technological leaders and research publications.",
                linkedEventId: "",
                statValue: "Global",
                statLabel: "IUCEE Network",
                imageUrl: "",
                order: 5,
                active: true
            }
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

    let tList = Array.isArray(data.timeline) ? data.timeline : [];
    const isLegacyPlaceholder = (item) => {
        if (!item || !item.title) return true;
        const t = item.title.toLowerCase().trim();
        return t === "chapter inception" || t === "national recognition" || t === "global expansion" || t === "new chapter milestone";
    };

    if (!tList.some(item => !isLegacyPlaceholder(item))) {
        tList = [
            {
                year: "2024",
                icon: "👥",
                title: "Chapter Founded",
                description: "VVISC IUCEE Student Chapter was officially established under IUCEE at VVIT to create an inclusive, innovation-driven student engineering ecosystem.",
                linkedEventId: "vvisc-founded-2024",
                statValue: "120+",
                statLabel: "Founding Engineers",
                imageUrl: "assets/logo.png",
                order: 1,
                active: true
            },
            {
                year: "2024",
                icon: "⚡",
                title: "Applied AI & ML Bootcamps",
                description: "3-day intensive hands-on immersion in computer vision, deep learning pipelines, and production model deployment.",
                linkedEventId: "ai-ml-bootcamp-2024",
                statValue: "300+",
                statLabel: "Students Certified",
                imageUrl: "assets/Ai-bootcamp.png",
                order: 2,
                active: true
            },
            {
                year: "2025",
                icon: "🏆",
                title: "Annual Innovation Hackathon",
                description: "48-hour multidisciplinary student hackathon tackling pressing challenges in agriculture, robotics, and energy across 12 engineering colleges.",
                linkedEventId: "annual-hackathon-2025",
                statValue: "450+",
                statLabel: "Participants (12 Colleges)",
                imageUrl: "assets/hackathon.png",
                order: 3,
                active: true
            },
            {
                year: "2026",
                icon: "🚀",
                title: "Autonomous R&D & Edge AI Labs",
                description: "Expanded student research divisions and project incubators centered on Retrieval-Augmented Generation, Agentic Workflows, and Edge AI systems.",
                linkedEventId: "rag-hackathon-2026",
                statValue: "15+",
                statLabel: "Active Prototypes",
                imageUrl: "assets/Ai-summit.png",
                order: 4,
                active: true
            },
            {
                year: "Future",
                icon: "🌐",
                title: "Global Innovation Ecosystem",
                description: "Expanding collaborative student exchange, global research publications, and nationwide technical impact under the IUCEE umbrella.",
                linkedEventId: "",
                statValue: "Global",
                statLabel: "IUCEE Network",
                imageUrl: "",
                order: 5,
                active: true
            }
        ];
    } else {
        tList = tList.filter(item => !isLegacyPlaceholder(item));
        if (tList.length === 0) {
            tList = [
                {
                    year: "2024",
                    icon: "👥",
                    title: "Chapter Founded",
                    description: "VVISC IUCEE Student Chapter was officially established under IUCEE at VVIT to create an inclusive, innovation-driven student engineering ecosystem.",
                    linkedEventId: "vvisc-founded-2024",
                    statValue: "120+",
                    statLabel: "Founding Engineers",
                    imageUrl: "assets/logo.png",
                    order: 1,
                    active: true
                },
                {
                    year: "2024",
                    icon: "⚡",
                    title: "Applied AI & ML Bootcamps",
                    description: "3-day intensive hands-on immersion in computer vision, deep learning pipelines, and production model deployment.",
                    linkedEventId: "ai-ml-bootcamp-2024",
                    statValue: "300+",
                    statLabel: "Students Certified",
                    imageUrl: "assets/Ai-bootcamp.png",
                    order: 2,
                    active: true
                },
                {
                    year: "2025",
                    icon: "🏆",
                    title: "Annual Innovation Hackathon",
                    description: "48-hour multidisciplinary student hackathon tackling pressing challenges in agriculture, robotics, and energy across 12 engineering colleges.",
                    linkedEventId: "annual-hackathon-2025",
                    statValue: "450+",
                    statLabel: "Participants (12 Colleges)",
                    imageUrl: "assets/hackathon.png",
                    order: 3,
                    active: true
                },
                {
                    year: "2026",
                    icon: "🚀",
                    title: "Autonomous R&D & Edge AI Labs",
                    description: "Expanded student research divisions and project incubators centered on Retrieval-Augmented Generation, Agentic Workflows, and Edge AI systems.",
                    linkedEventId: "rag-hackathon-2026",
                    statValue: "15+",
                    statLabel: "Active Prototypes",
                    imageUrl: "assets/Ai-summit.png",
                    order: 4,
                    active: true
                },
                {
                    year: "Future",
                    icon: "🌐",
                    title: "Global Innovation Ecosystem",
                    description: "Expanding collaborative student exchange, global research publications, and nationwide technical impact under the IUCEE umbrella.",
                    linkedEventId: "",
                    statValue: "Global",
                    statLabel: "IUCEE Network",
                    imageUrl: "",
                    order: 5,
                    active: true
                }
            ];
        }
    }

    timelineItems = tList;
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
        container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-secondary); font-size:0.9rem; border:1px dashed var(--border-color); border-radius:8px;">No milestones configured yet. Click "+ Add Milestone" above to create one.</div>`;
        return;
    }

    timelineItems.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "card";
        row.style.cssText = "padding:18px; border:1px solid var(--border-color); border-radius:10px; margin-bottom:14px; background:var(--card-bg, #ffffff);";

        const isActive = item.active !== false;

        // Build Event Options
        let eventOptionsHtml = `<option value="">-- No Linked Event (Custom / Chapter Milestone) --</option>`;
        allEventsList.forEach(ev => {
            const isSelected = item.linkedEventId === ev.id ? "selected" : "";
            const statusLabel = ev.status ? `[${ev.status.toUpperCase()}]` : "";
            const yearLabel = ev.year ? `(${ev.year})` : "";
            eventOptionsHtml += `<option value="${escapeAttr(ev.id)}" ${isSelected}>${escapeHtml(ev.title)} ${yearLabel} ${statusLabel}</option>`;
        });

        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="background:var(--accent-color, #c89b35); color:#ffffff; font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:4px;">#${index + 1}</span>
                    <strong style="font-size:0.95rem; color:inherit;">${escapeHtml(item.title || "Milestone")} (${escapeHtml(item.year || "Year")})</strong>
                </div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <button type="button" onclick="moveTimelineItem(${index}, -1)" ${index === 0 ? "disabled" : ""} style="background:none; border:1px solid var(--border-color); padding:4px 8px; border-radius:4px; cursor:pointer;" title="Move Up">▲</button>
                    <button type="button" onclick="moveTimelineItem(${index}, 1)" ${index === timelineItems.length - 1 ? "disabled" : ""} style="background:none; border:1px solid var(--border-color); padding:4px 8px; border-radius:4px; cursor:pointer;" title="Move Down">▼</button>
                    <button type="button" onclick="removeTimelineItem(${index})" style="background:rgba(239, 68, 68, 0.15); color:#ef4444; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-weight:bold;" title="Delete Milestone">🗑 Remove</button>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr; gap:12px; margin-bottom:12px;">
                <div style="background:rgba(200, 155, 53, 0.08); padding:10px 14px; border-radius:8px; border:1px solid rgba(200, 155, 53, 0.25);">
                    <label style="font-size:0.8rem; font-weight:600; display:block; margin-bottom:4px; color:var(--text-color);">🔗 Linked Historical Event (Populates Modal & Verified Stats)</label>
                    <select onchange="onMilestoneEventChange(${index}, this.value)" style="width:100%; padding:8px 10px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit; font-size:0.85rem; font-weight:500;">
                        ${eventOptionsHtml}
                    </select>
                    <small style="font-size:0.72rem; color:var(--text-secondary); display:block; margin-top:4px;">Selecting an event automatically links the milestone to its verified data, metrics, and event detail modal.</small>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 90px 70px 1.5fr 1fr; gap:10px; margin-bottom:10px;">
                <div>
                    <label style="font-size:0.75rem; font-weight:600; opacity:0.8; display:block; margin-bottom:4px;">Year / Epoch</label>
                    <input type="text" value="${escapeAttr(item.year || "")}" onchange="timelineItems[${index}].year = this.value" placeholder="2025" style="width:100%; padding:8px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit; font-size:0.85rem;">
                </div>
                <div>
                    <label style="font-size:0.75rem; font-weight:600; opacity:0.8; display:block; margin-bottom:4px;">Icon</label>
                    <input type="text" value="${escapeAttr(item.icon || "🏆")}" onchange="timelineItems[${index}].icon = this.value" style="width:100%; padding:8px; text-align:center; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit; font-size:0.85rem;">
                </div>
                <div>
                    <label style="font-size:0.75rem; font-weight:600; opacity:0.8; display:block; margin-bottom:4px;">Milestone Title</label>
                    <input type="text" value="${escapeAttr(item.title || "")}" onchange="timelineItems[${index}].title = this.value" placeholder="e.g. Annual Hackathon 2025" style="width:100%; padding:8px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit; font-size:0.85rem;">
                </div>
                <div>
                    <label style="font-size:0.75rem; font-weight:600; opacity:0.8; display:block; margin-bottom:4px;">Image / Poster URL</label>
                    <input type="text" value="${escapeAttr(item.imageUrl || "")}" onchange="timelineItems[${index}].imageUrl = this.value" placeholder="assets/hackathon.png" style="width:100%; padding:8px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit; font-size:0.85rem;">
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1.2fr 1fr 1fr 90px; gap:10px; margin-bottom:8px;">
                <div>
                    <label style="font-size:0.75rem; font-weight:600; opacity:0.8; display:block; margin-bottom:4px;">Description</label>
                    <textarea rows="2" onchange="timelineItems[${index}].description = this.value" style="width:100%; padding:8px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit; font-size:0.85rem; font-family:inherit;">${escapeHtml(item.description || "")}</textarea>
                </div>
                <div>
                    <label style="font-size:0.75rem; font-weight:600; opacity:0.8; display:block; margin-bottom:4px;">Verified Stat (Optional)</label>
                    <input type="text" value="${escapeAttr(item.statValue || "")}" onchange="timelineItems[${index}].statValue = this.value" placeholder="e.g. 450+ or 1st Prize" style="width:100%; padding:8px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit; font-size:0.85rem;">
                    <small style="font-size:0.7rem; color:var(--text-secondary);">Leave blank if unverified</small>
                </div>
                <div>
                    <label style="font-size:0.75rem; font-weight:600; opacity:0.8; display:block; margin-bottom:4px;">Stat Label (Optional)</label>
                    <input type="text" value="${escapeAttr(item.statLabel || "")}" onchange="timelineItems[${index}].statLabel = this.value" placeholder="e.g. Participants" style="width:100%; padding:8px; border-radius:6px; background:var(--input-bg); border:1px solid var(--border-color); color:inherit; font-size:0.85rem;">
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
                    <label style="font-size:0.75rem; font-weight:600; opacity:0.8; display:block; margin-bottom:4px;">Active</label>
                    <input type="checkbox" ${isActive ? "checked" : ""} onchange="timelineItems[${index}].active = this.checked" style="width:18px; height:18px; cursor:pointer;">
                </div>
            </div>
        `;
        container.appendChild(row);
    });
}

window.onMilestoneEventChange = function(index, eventId) {
    timelineItems[index].linkedEventId = eventId;
    if (!eventId) {
        renderTimelineRows();
        return;
    }

    const ev = allEventsList.find(e => e.id === eventId);
    if (!ev) return;

    // Suggest/auto-fill empty or placeholder fields from event
    if (!timelineItems[index].title || timelineItems[index].title === "New Chapter Milestone") {
        timelineItems[index].title = ev.milestoneTitle || ev.title;
    }
    if (!timelineItems[index].year || timelineItems[index].year === new Date().getFullYear().toString()) {
        timelineItems[index].year = ev.milestoneYear || ev.year || (ev.startDate ? ev.startDate.substring(0, 4) : "2025");
    }
    if (!timelineItems[index].description || timelineItems[index].description.includes("Milestone description")) {
        timelineItems[index].description = ev.shortDescription || ev.description || "";
    }
    if (!timelineItems[index].statValue && ev.participantsCount) {
        timelineItems[index].statValue = ev.participantsCount;
        timelineItems[index].statLabel = "Participants";
    } else if (!timelineItems[index].statValue && ev.awards) {
        timelineItems[index].statValue = "Award";
        timelineItems[index].statLabel = ev.awards;
    }
    if (!timelineItems[index].imageUrl && (ev.posterImage || ev.coverImageUrl)) {
        timelineItems[index].imageUrl = ev.posterImage || ev.coverImageUrl;
    }
    if (!timelineItems[index].icon || timelineItems[index].icon === "🚀") {
        timelineItems[index].icon = ev.milestoneIcon || (ev.category === "HACKATHON" ? "🏆" : "⚡");
    }

    renderTimelineRows();
};

window.moveTimelineItem = function(index, direction) {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= timelineItems.length) return;
    const temp = timelineItems[index];
    timelineItems[index] = timelineItems[newIdx];
    timelineItems[newIdx] = temp;
    
    // Update order property
    timelineItems.forEach((item, idx) => item.order = idx + 1);
    renderTimelineRows();
};

window.removeTimelineItem = function(index) {
    if (confirm("Are you sure you want to remove this milestone from the timeline?")) {
        timelineItems.splice(index, 1);
        timelineItems.forEach((item, idx) => item.order = idx + 1);
        renderTimelineRows();
    }
};

async function saveAboutData() {
    timelineItems.forEach((item, idx) => {
        item.order = idx + 1;
    });

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
        timeline: timelineItems,
        updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    try {
        await CMS.saveContent("about", payload);
        showToast("✓ About Page content and Journey Timeline saved successfully!");
    } catch (err) {
        showToast("Failed to save About Page content: " + err.message, "error");
    }
}

function escapeAttr(str) {
    return (str || "").toString().replace(/"/g, "&quot;");
}

function escapeHtml(str) {
    return (str || "").toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
