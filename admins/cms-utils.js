// =========================================================
// VVISC CMS - Centralized Utility Library
// Firestore CRUD, Image Upload, Data Seeder & Helpers
// =========================================================

const CMS = {
    // --------------------------------------------------
    // 1. Single Document Methods (websiteContent collection)
    // --------------------------------------------------
    async getContent(docKey, fallbackData = {}) {
        let localData = {};
        try {
            const raw = localStorage.getItem("vvisc_cms_" + docKey);
            if (raw) localData = JSON.parse(raw);
        } catch (e) {}

        try {
            const doc = await db.collection("websiteContent").doc(docKey).get();
            if (doc.exists) {
                const cloudData = doc.data();
                try {
                    localStorage.setItem("vvisc_cms_" + docKey, JSON.stringify(cloudData));
                } catch (e) {}
                return { ...fallbackData, ...localData, ...cloudData };
            }
        } catch (err) {
            console.warn(`CMS getContent warning for ${docKey}:`, err);
        }
        return { ...fallbackData, ...localData };
    },

    async saveContent(docKey, data, options = {}) {
        const adminEmail = localStorage.getItem("adminEmail") || (firebase.auth().currentUser && firebase.auth().currentUser.email) || "admin@vvisc.net";
        const adminName = localStorage.getItem("adminName") || (firebase.auth().currentUser && firebase.auth().currentUser.displayName) || "Admin";

        const payload = {
            ...data,
            updatedAt: new Date().toISOString(),
            updatedBy: adminEmail
        };

        try {
            localStorage.setItem("vvisc_cms_" + docKey, JSON.stringify(payload));
        } catch (e) {}

        try {
            const fsPayload = {
                ...payload,
                updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
            };
            await db.collection("websiteContent").doc(docKey).set(fsPayload, { merge: true });

            // Create revision snapshot
            if (options.createRevision !== false) {
                this.saveRevision("websiteContent", docKey, data);
            }

            // Record audit log
            this.logAudit("UPDATE", "websiteContent", docKey, `Updated page content for ${docKey}`, {
                fields: Object.keys(data)
            });
        } catch (err) {
            console.warn(`Firestore saveContent permission notice for ${docKey} (saved locally):`, err);
        }
        return true;
    },

    // --------------------------------------------------
    // 2. Collection Methods (departments, council, etc.)
    // --------------------------------------------------
    async getCollection(colName, options = {}) {
        let localList = [];
        try {
            const raw = localStorage.getItem("vvisc_col_" + colName);
            if (raw) localList = JSON.parse(raw);
        } catch (e) {}

        try {
            let ref = db.collection(colName);
            if (options.whereActive) {
                ref = ref.where("active", "==", true);
            }
            const snapshot = await ref.get();
            const results = [];
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    results.push({ id: doc.id, ...doc.data() });
                });

                // Update local storage cache with live cloud data
                try {
                    localStorage.setItem("vvisc_col_" + colName, JSON.stringify(results));
                } catch (e) {}

                if (options.orderBy) {
                    const key = options.orderBy;
                    const dir = options.orderDirection === "desc" ? -1 : 1;
                    results.sort((a, b) => {
                        const valA = a[key] !== undefined ? a[key] : 999;
                        const valB = b[key] !== undefined ? b[key] : 999;
                        if (valA < valB) return -1 * dir;
                        if (valA > valB) return 1 * dir;
                        return 0;
                    });
                }

                return results;
            }
        } catch (err) {
            console.warn(`CMS getCollection error for ${colName}:`, err);
        }

        if (options.orderBy && localList.length > 0) {
            const key = options.orderBy;
            const dir = options.orderDirection === "desc" ? -1 : 1;
            localList.sort((a, b) => {
                const valA = a[key] !== undefined ? a[key] : 999;
                const valB = b[key] !== undefined ? b[key] : 999;
                if (valA < valB) return -1 * dir;
                if (valA > valB) return 1 * dir;
                return 0;
            });
        }

        return localList;
    },

    async saveDoc(colName, docId, data, options = {}) {
        const adminEmail = localStorage.getItem("adminEmail") || (firebase.auth().currentUser && firebase.auth().currentUser.email) || "admin@vvisc.net";
        const adminName = localStorage.getItem("adminName") || (firebase.auth().currentUser && firebase.auth().currentUser.displayName) || "Admin";

        const payload = {
            ...data,
            updatedAt: new Date().toISOString(),
            updatedBy: adminEmail
        };

        let targetId = docId;

        // Save directly to Firestore cloud first!
        try {
            const fsPayload = {
                ...payload,
                updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
            };
            delete fsPayload.id;

            const isNew = !targetId || targetId.startsWith("local_");
            if (isNew) {
                fsPayload.createdAt = firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
                const newDocRef = await db.collection(colName).add(fsPayload);
                targetId = newDocRef.id;
            } else {
                await db.collection(colName).doc(targetId).set(fsPayload, { merge: true });
            }

            // Record audit log
            this.logAudit(isNew ? "CREATE" : "UPDATE", colName, targetId, `${isNew ? "Created" : "Updated"} document in ${colName} (${targetId})`, {
                fields: Object.keys(data),
                title: data.name || data.title || data.eventName || ""
            });
        } catch (err) {
            console.error(`Firestore saveDoc error for ${colName}/${targetId}:`, err);
            if (!targetId) targetId = "local_" + Date.now();
        }

        payload.id = targetId;

        // Update local storage cache
        try {
            let localList = [];
            const raw = localStorage.getItem("vvisc_col_" + colName);
            if (raw) localList = JSON.parse(raw);
            const idx = localList.findIndex(item => item.id === targetId || (docId && item.id === docId));
            if (idx >= 0) localList[idx] = { ...localList[idx], ...payload };
            else localList.push(payload);
            localStorage.setItem("vvisc_col_" + colName, JSON.stringify(localList));
        } catch (e) {}

        return targetId;
    },

    async deleteDoc(colName, docId) {
        try {
            let localList = [];
            const raw = localStorage.getItem("vvisc_col_" + colName);
            if (raw) localList = JSON.parse(raw);
            localList = localList.filter(item => item.id !== docId);
            localStorage.setItem("vvisc_col_" + colName, JSON.stringify(localList));
        } catch (e) {}

        try {
            await db.collection(colName).doc(docId).delete();
            this.logAudit("DELETE", colName, docId, `Deleted document from ${colName} (${docId})`);
        } catch (err) {
            console.warn(`Firestore deleteDoc notice for ${colName}/${docId}:`, err);
        }
        return true;
    },

    // --------------------------------------------------
    // Audit Logging Helper
    // --------------------------------------------------
    async logAudit(action, colName, docId, summary, details = {}) {
        try {
            const user = firebase.auth && firebase.auth().currentUser;
            const adminEmail = (user && user.email) || localStorage.getItem("adminEmail") || "admin@vvisc.net";
            const adminName = (user && user.displayName) || localStorage.getItem("adminName") || "Admin";

            const logEntry = {
                action: action || "ACTION",
                collection: colName || "general",
                documentId: String(docId || ""),
                summary: summary || `${action} on ${colName}`,
                performedBy: adminEmail,
                details: typeof details === "string" ? details : JSON.stringify(details || {}),
                timestamp: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
            };

            await db.collection("auditLogs").add(logEntry);
        } catch (e) {
            console.info("Audit log note:", e.message || e);
        }
    },

    // --------------------------------------------------
    // Content Revisions / Snapshot Helper
    // --------------------------------------------------
    async saveRevision(colName, docId, contentSnapshot) {
        try {
            const user = firebase.auth && firebase.auth().currentUser;
            const adminEmail = (user && user.email) || localStorage.getItem("adminEmail") || "admin@vvisc.net";
            await db.collection("auditLogs").add({
                action: "REVISION",
                collection: colName,
                documentId: String(docId),
                summary: `Snapshot for ${colName}/${docId}`,
                snapshot: contentSnapshot,
                userEmail: adminEmail,
                timestamp: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
            });
        } catch (e) {
            console.warn("Save revision warning:", e);
        }
    },

    // --------------------------------------------------
    // Media Library Tracker
    // --------------------------------------------------
    async recordMediaUpload(mediaData) {
        try {
            const user = firebase.auth && firebase.auth().currentUser;
            const adminEmail = (user && user.email) || localStorage.getItem("adminEmail") || "admin@vvisc.net";
            const entry = {
                url: mediaData.url,
                fileName: mediaData.fileName || "image.jpg",
                folder: mediaData.folder || "cms",
                size: mediaData.size || 0,
                mimeType: mediaData.mimeType || "image/jpeg",
                uploadedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
                uploadedBy: adminEmail
            };
            await db.collection("media").add(entry);
        } catch (e) {
            console.warn("Media registry warning:", e);
        }
    },

    // Compatibility aliases for collection item CRUD and file handling
    async saveCollectionItem(colName, docId, data) {
        return this.saveDoc(colName, docId, data);
    },

    async deleteCollectionItem(colName, docId) {
        return this.deleteDoc(colName, docId);
    },

    async fileToBase64(file) {
        return this.uploadImage(file, "gallery");
    },

    // --------------------------------------------------
    // 3. Image Upload Helper (Storage / Auto-Compressed Fallback)
    // --------------------------------------------------
    async uploadImage(file, folder = "cms") {
        if (!file) return null;

        // Helper to compress an image file to a lightweight dataURL (< 50KB)
        const compressImage = (f) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const maxDim = 460;
                    let w = img.naturalWidth || img.width;
                    let h = img.naturalHeight || img.height;
                    if (w > maxDim || h > maxDim) {
                        if (w >= h) {
                            h = Math.round((h * maxDim) / w);
                            w = maxDim;
                        } else {
                            w = Math.round((w * maxDim) / h);
                            h = maxDim;
                        }
                    }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL("image/jpeg", 0.78));
                };
                img.onerror = () => resolve(e.target.result);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve("assets/nodp.png");
            reader.readAsDataURL(f);
        });

        let uploadedUrl = null;

        // 1. Try Firebase Storage with 5s timeout first if available
        try {
            if (firebase.storage && typeof firebase.storage === "function") {
                const uploadPromise = (async () => {
                    const storageRef = firebase.storage().ref();
                    const fileName = `${folder}/${Date.now()}_${(file.name || "img").replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                    const fileRef = storageRef.child(fileName);
                    const snapshot = await fileRef.put(file);
                    return await snapshot.ref.getDownloadURL();
                })();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Storage timeout")), 5000)
                );

                uploadedUrl = await Promise.race([uploadPromise, timeoutPromise]);
            }
        } catch (err) {
            console.warn("Storage upload notice (using optimized image format):", err);
        }

        // 2. High-efficiency compressed dataURL fallback (Guaranteed Firestore safe, ~35KB)
        if (!uploadedUrl) {
            uploadedUrl = await compressImage(file);
        }

        // 3. Register media in media collection
        if (uploadedUrl) {
            this.recordMediaUpload({
                url: uploadedUrl,
                fileName: file.name || "image.jpg",
                folder: folder,
                size: file.size || 0,
                mimeType: file.type || "image/jpeg"
            });
        }

        return uploadedUrl;
    },

    // Helper to ensure any existing dataUrl or image string is compressed (< 50KB)
    compressDataUrl(dataUrl, maxDim = 460, quality = 0.78) {
        return new Promise((resolve) => {
            if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
                return resolve(dataUrl);
            }
            if (dataUrl.length < 50000) {
                return resolve(dataUrl);
            }
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let w = img.naturalWidth || img.width;
                let h = img.naturalHeight || img.height;
                if (w > maxDim || h > maxDim) {
                    if (w >= h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    },

    // --------------------------------------------------
    // 4. Initial Seed Data Process
    // --------------------------------------------------
    async seedInitialCMSData(force = false) {
        try {
            const checkDoc = await db.collection("websiteContent").doc("home").get();
            if (checkDoc.exists && !force) {
                console.log("CMS initial dataset already exists.");
                return false;
            }

            console.log("Seeding initial CMS datasets to Firestore...");

            // 1. Home Page Seed
            await this.saveContent("home", {
                heroTitle: "VVISC Technical Club",
                heroSubtitle: "IUCEE Student Chapter",
                heroDescription: "Innovate, Build, and Transform with us. Bridging academic excellence with cutting-edge engineering skills.",
                ctaPrimaryText: "Explore Events",
                ctaPrimaryLink: "events.html",
                ctaSecondaryText: "Join Community",
                ctaSecondaryLink: "contact.html",
                statMembers: "500+",
                statEvents: "25+",
                statDepts: "6",
                statReach: "1000+",
                aboutTitle: "Empowering Next-Gen Engineers",
                aboutDescription: "VVISC IUCEE Student Chapter provides a vibrant platform for technology enthusiasts to collaborate on real-world projects, attend technical workshops, hackathons, and industry mentorship sessions.",
                featuredSectionHeading: "Featured Events & Activities",
                featuredSectionSubtitle: "Participate in hands-on workshops, challenges, and hackathons organized by VVISC.",

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

            // 2. About Page Seed
            await this.saveContent("about", {
                pageTitle: "About VVISC IUCEE",
                introTitle: "Pioneering Innovation at VVIT",
                introText: "VVISC (VVC IUCEE Student Chapter) is a premier student organization committed to enhancing technical education, engineering mindset, and hands-on project development.",
                visionTitle: "Our Vision",
                visionText: "To create an inclusive ecosystem of innovation where every student transforms academic knowledge into practical technological solutions for real-world impact.",
                missionTitle: "Our Mission",
                missionText: "Empower students through skill-building workshops, industry mentorship, collaborative hackathons, and interdisciplinary research initiatives.",
                timeline: [
                    { year: "2024", title: "Chapter Inception", description: "VVISC established under the IUCEE umbrella at VVIT.", active: true, order: 1 },
                    { year: "2025", title: "National Recognition", description: "Hosted national-level hackathons and regional technical symposiums.", active: true, order: 2 },
                    { year: "2026", title: "Global Expansion", description: "Expanded research labs and collaborative student development initiatives.", active: true, order: 3 }
                ]
            });

            // 3. Contact Page Seed
            await this.saveContent("contact", {
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

            // 4. Website Settings Seed
            await this.saveContent("settings", {
                siteName: "VVISC Technical Club",
                tagline: "Innovate, Build & Transform",
                contactEmail: "vvisc@vvit.net",
                phone: "+91 98765 43210",
                copyrightText: "© 2026 VVISC IUCEE Student Chapter. All Rights Reserved.",
                defaultSeoTitle: "VVISC Technical Club - VVIT IUCEE Chapter",
                defaultSeoDescription: "Official website of VVISC IUCEE Student Chapter at VVIT."
            });

            // 5. Seed Departments
            const initialDepts = [
                {
                    name: "Research & Development",
                    slug: "rnd",
                    icon: "🧪",
                    shortDescription: "Innovation & Research",
                    description: "The R&D Department transforms ideas into innovative projects, research papers, and prototypes while encouraging students to explore emerging technologies.",
                    headName: "Lead Researcher",
                    headRole: "Department Lead",
                    objectives: ["Research Papers", "Innovation Projects", "Patent Ideas", "Prototype Development"],
                    activities: ["Paper Publishing", "Tech Paper Reading Clubs", "Patent Filing Guidance"],
                    contactEmail: "rnd@vvisc.net",
                    displayOrder: 1,
                    active: true
                },
                {
                    name: "Digital Infrastructure",
                    slug: "digital",
                    icon: "💻",
                    shortDescription: "Technology & Systems",
                    description: "Manages all digital assets, web portals, cloud systems, and platform infrastructure supporting VVISC operations.",
                    headName: "Tech Lead",
                    headRole: "Infrastructure Lead",
                    objectives: ["Web Development", "Cloud Architecture", "Platform Maintenance", "Cybersecurity"],
                    activities: ["Full-Stack Builds", "Server Administration", "DevOps Pipelines"],
                    contactEmail: "tech@vvisc.net",
                    displayOrder: 2,
                    active: true
                },
                {
                    name: "Public Relations",
                    slug: "pr",
                    icon: "📢",
                    shortDescription: "Branding & Outreach",
                    description: "Handles external communications, industry partnerships, campus outreach, and media representation.",
                    headName: "PR Head",
                    headRole: "Outreach Lead",
                    objectives: ["Industry Outreach", "Media Relations", "Sponsorship Management", "Campus Engagement"],
                    activities: ["Corporate Tie-ups", "Press Releases", "Guest Speaker Management"],
                    contactEmail: "pr@vvisc.net",
                    displayOrder: 3,
                    active: true
                },
                {
                    name: "Operations",
                    slug: "operations",
                    icon: "⚙️",
                    shortDescription: "Execution & Management",
                    description: "Ensures seamless execution of events, logistics, venue scheduling, and team coordination.",
                    headName: "Operations Lead",
                    headRole: "Event Logistics Lead",
                    objectives: ["Event Planning", "Logistics Coordination", "Venue Management", "Resource Allocation"],
                    activities: ["Hackathon Logistics", "Workshop Coordination", "Inventory Control"],
                    contactEmail: "ops@vvisc.net",
                    displayOrder: 4,
                    active: true
                },
                {
                    name: "Strategic Planning",
                    slug: "strategy",
                    icon: "📈",
                    shortDescription: "Content Development",
                    description: "Formulates long-term roadmaps, curriculum outlines, content strategies, and growth metrics for VVISC.",
                    headName: "Strategy Lead",
                    headRole: "Planning Lead",
                    objectives: ["Roadmap Planning", "Content Creation", "Performance Tracking", "Policy Design"],
                    activities: ["Annual Roadmaps", "Curriculum Drafting", "Impact Analysis"],
                    contactEmail: "strategy@vvisc.net",
                    displayOrder: 5,
                    active: true
                },
                {
                    name: "Social Media & Visual Arts",
                    slug: "social",
                    icon: "🎨",
                    shortDescription: "Creative Design",
                    description: "Drives visual identity, graphic design, social media campaigns, video production, and creative storytelling.",
                    headName: "Creative Head",
                    headRole: "Visual Arts Lead",
                    objectives: ["Graphic Design", "Social Media Marketing", "Video Editing", "Brand Consistency"],
                    activities: ["Social Campaigns", "Poster Design", "Aftermovies & Reels"],
                    contactEmail: "design@vvisc.net",
                    displayOrder: 6,
                    active: true
                },
                {
                    name: "Finance Team",
                    slug: "finance",
                    icon: "💰",
                    shortDescription: "Budget & Accounts",
                    description: "Manages budget allocations, sponsorship accounting, auditing, and financial transparency for all VVISC initiatives.",
                    headName: "Finance Head",
                    headRole: "Treasury Lead",
                    objectives: ["Budget Allocation", "Financial Accounting", "Sponsorship Tracking", "Audit Reports"],
                    activities: ["Budget Approvals", "Financial Audits", "Sponsorship Receipts"],
                    contactEmail: "finance@vvisc.net",
                    displayOrder: 7,
                    active: true
                }
            ];

            for (const d of initialDepts) {
                await this.saveDoc("departments", null, d);
            }

            // 6. Seed Council Members
            const initialCouncil = [
                {
                    name: "Dr. Naveen Ravela",
                    memberType: "Chief Faculty",
                    role: "Chief Faculty Coordinator",
                    department: "Mech Department",
                    description: "Passionate educator dedicated to mentoring students in innovation, research and leadership.",
                    profileImage: "assets/council/faculty/chief.jpg",
                    email: "faculty@vvit.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 1,
                    active: true
                },
                {
                    name: "Dr. Faculty Member 1",
                    memberType: "Faculty Coordinator",
                    role: "Faculty Coordinator",
                    department: "Computer Science",
                    description: "Mentoring student technical teams and research projects.",
                    profileImage: "assets/council/faculty/faculty1.jpg",
                    email: "faculty1@vvit.net",
                    linkedin: "#",
                    github: "",
                    displayOrder: 2,
                    active: true
                },
                {
                    name: "Dr. Faculty Member 2",
                    memberType: "Faculty Coordinator",
                    role: "Faculty Coordinator",
                    department: "Information Technology",
                    description: "Guiding workshops and innovation activities.",
                    profileImage: "assets/council/faculty/faculty2.jpg",
                    email: "faculty2@vvit.net",
                    linkedin: "#",
                    github: "",
                    displayOrder: 3,
                    active: true
                },
                {
                    name: "Dr. Faculty Member 3",
                    memberType: "Faculty Coordinator",
                    role: "Faculty Coordinator",
                    department: "Electronics & Communication",
                    description: "Supporting leadership and student development.",
                    profileImage: "assets/council/faculty/faculty3.jpg",
                    email: "faculty3@vvit.net",
                    linkedin: "#",
                    github: "",
                    displayOrder: 4,
                    active: true
                },
                {
                    name: "Soniya K",
                    memberType: "Student Leader",
                    role: "President",
                    department: "Executive Council",
                    description: "Leads the entire council, coordinates departments and represents VVISC.",
                    profileImage: "assets/nodp.png",
                    email: "president@vvisc.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 5,
                    active: true
                },
                {
                    name: "Yeshitha B",
                    memberType: "Student Leader",
                    role: "Vice President",
                    department: "Executive Council",
                    description: "Supports the President, oversees departments and manages council operations.",
                    profileImage: "assets/nodp.png",
                    email: "vp@vvisc.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 6,
                    active: true
                },
                {
                    name: "Abid Sk",
                    memberType: "Student Leader",
                    role: "Secretary",
                    department: "Executive Council",
                    description: "Maintains records, meeting minutes and official documentation.",
                    profileImage: "assets/nodp.png",
                    email: "secretary@vvisc.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 7,
                    active: true
                },
                {
                    name: "Lalith B",
                    memberType: "Student Leader",
                    role: "Treasurer",
                    department: "Executive Council",
                    description: "Manages finances, sponsorship budgets and expenditures.",
                    profileImage: "assets/nodp.png",
                    email: "treasurer@vvisc.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 8,
                    active: true
                },
                {
                    name: "Harshitha Ch",
                    memberType: "Student Leader",
                    role: "Research & Development Co-ordinator",
                    department: "Research & Development",
                    description: "Oversees research and development initiatives, coordinates projects and ensures alignment with organizational goals.",
                    profileImage: "assets/nodp.png",
                    email: "rnd@vvisc.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 9,
                    active: true
                },
                {
                    name: "Rajavardhan P",
                    memberType: "Student Leader",
                    role: "Digital Infrastructure Co-ordinator",
                    department: "Digital Infrastructure",
                    description: "Manages digital infrastructure, including networks, servers, and IT systems.",
                    profileImage: "assets/nodp.png",
                    email: "digital@vvisc.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 10,
                    active: true
                },
                {
                    name: "Harika K",
                    memberType: "Student Leader",
                    role: "Public Relations Co-ordinator",
                    department: "Public Relations",
                    description: "Manages public relations, media outreach, and communication strategies to enhance the organization's image.",
                    profileImage: "assets/nodp.png",
                    email: "pr@vvisc.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 11,
                    active: true
                },
                {
                    name: "Praveena B",
                    memberType: "Student Leader",
                    role: "Operations Co-ordinator",
                    department: "Operations",
                    description: "Manages operations, logistics, and ensures smooth execution of events and activities.",
                    profileImage: "assets/nodp.png",
                    email: "operations@vvisc.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 12,
                    active: true
                },
                {
                    name: "Nishitha M",
                    memberType: "Student Leader",
                    role: "Strategic Planning & Content Development Co-ordinator",
                    department: "Strategic Planning",
                    description: "Manages strategic planning and content development for the organization.",
                    profileImage: "assets/nodp.png",
                    email: "strategy@vvisc.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 13,
                    active: true
                },
                {
                    name: "Abhishek B",
                    memberType: "Student Leader",
                    role: "Media & Visual Arts Co-ordinator",
                    department: "Media & Visual Arts",
                    description: "Manages public relations, media outreach, and communication strategies to enhance the organization's image.",
                    profileImage: "assets/nodp.png",
                    email: "media@vvisc.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 14,
                    active: true
                }
            ];

            for (const c of initialCouncil) {
                await this.saveDoc("councilMembers", null, c);
            }

            // 7. Seed Sample Gallery Items
            const initialGallery = [
                {
                    title: "Annual Hackathon 2025",
                    description: "Students building innovative solutions during the 24-hour coding challenge.",
                    imageUrl: "assets/1.png",
                    category: "Hackathons",
                    eventName: "Hackathon 2025",
                    date: "2025-10-15",
                    displayOrder: 1,
                    active: true
                },
                {
                    title: "AI Workshop Series",
                    description: "Hands-on deep learning workshop with hands-on labs.",
                    imageUrl: "assets/2.png",
                    category: "Workshops",
                    eventName: "AI Bootcamp",
                    date: "2025-11-20",
                    displayOrder: 2,
                    active: true
                },
                {
                    title: "Robotics Exhibition",
                    description: "Demonstrating autonomous hardware prototypes designed by R&D team.",
                    imageUrl: "assets/4.png",
                    category: "Exhibitions",
                    eventName: "Tech Expo",
                    date: "2026-01-10",
                    displayOrder: 3,
                    active: true
                }
            ];

            for (const g of initialGallery) {
                await this.saveDoc("gallery", null, g);
            }

            console.log("CMS Initial Seed completed successfully!");
            return true;
        } catch (err) {
            console.error("CMS Initial Seed Error:", err);
            return false;
        }
    }
};
