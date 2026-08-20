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
                return { ...fallbackData, ...doc.data(), ...localData };
            }
        } catch (err) {
            console.warn(`CMS getContent warning for ${docKey}:`, err);
        }
        return { ...fallbackData, ...localData };
    },

    async saveContent(docKey, data) {
        const payload = {
            ...data,
            updatedAt: new Date().toISOString(),
            updatedBy: localStorage.getItem("adminEmail") || localStorage.getItem("adminName") || "Admin"
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
        let localMap = new Map();
        try {
            const raw = localStorage.getItem("vvisc_col_" + colName);
            if (raw) {
                localList = JSON.parse(raw);
                localList.forEach(item => {
                    if (item.id) localMap.set(item.id, item);
                    if (item.slug) localMap.set(item.slug, item);
                });
            }
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
                    const fsData = { id: doc.id, ...doc.data() };
                    const localItem = localMap.get(doc.id) || localMap.get(fsData.slug);
                    if (localItem) {
                        results.push({ ...fsData, ...localItem });
                        localMap.delete(doc.id);
                        if (fsData.slug) localMap.delete(fsData.slug);
                    } else {
                        results.push(fsData);
                    }
                });
                // Append remaining local items
                localMap.forEach(item => {
                    if (!results.some(r => r.id === item.id || (r.slug && r.slug === item.slug))) {
                        results.push(item);
                    }
                });

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

    async saveDoc(colName, docId, data) {
        const payload = {
            ...data,
            updatedAt: new Date().toISOString(),
            updatedBy: localStorage.getItem("adminEmail") || localStorage.getItem("adminName") || "Admin"
        };

        const targetId = docId || ("local_" + Date.now());
        payload.id = targetId;

        // Local storage update
        try {
            let localList = [];
            const raw = localStorage.getItem("vvisc_col_" + colName);
            if (raw) localList = JSON.parse(raw);
            const idx = localList.findIndex(item => item.id === targetId);
            if (idx >= 0) localList[idx] = { ...localList[idx], ...payload };
            else localList.push(payload);
            localStorage.setItem("vvisc_col_" + colName, JSON.stringify(localList));
        } catch (e) {}

        try {
            const fsPayload = {
                ...payload,
                updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
            };
            delete fsPayload.id;
            if (!docId) {
                fsPayload.createdAt = firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
                const newDocRef = await db.collection(colName).add(fsPayload);
                return newDocRef.id;
            } else {
                await db.collection(colName).doc(docId).set(fsPayload, { merge: true });
                return docId;
            }
        } catch (err) {
            console.warn(`Firestore saveDoc permission notice for ${colName}/${targetId} (saved locally):`, err);
            return targetId;
        }
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
        } catch (err) {
            console.warn(`Firestore deleteDoc notice for ${colName}/${docId}:`, err);
        }
        return true;
    },

    // --------------------------------------------------
    // 3. Image Upload Helper (Storage / Base64 Fallback)
    // --------------------------------------------------
    async uploadImage(file, folder = "cms") {
        if (!file) return null;

        // Size check (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("File size exceeds 5MB limit. Please choose a smaller image.");
        }

        const readAsDataURL = (f) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(f);
        });

        // Try Firebase Storage with 3s timeout first if available
        try {
            if (firebase.storage && typeof firebase.storage === "function") {
                const uploadPromise = (async () => {
                    const storageRef = firebase.storage().ref();
                    const fileName = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                    const fileRef = storageRef.child(fileName);
                    const snapshot = await fileRef.put(file);
                    return await snapshot.ref.getDownloadURL();
                })();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Storage timeout")), 3000)
                );

                return await Promise.race([uploadPromise, timeoutPromise]);
            }
        } catch (err) {
            console.warn("Firebase Storage upload notice (falling back to instant base64):", err);
        }

        // Base64 DataURL Fallback (Instant success guaranteed)
        return await readAsDataURL(file);
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
                featuredSectionSubtitle: "Participate in hands-on workshops, challenges, and hackathons organized by VVISC."
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
                    name: "Dr. Faculty Mentor",
                    role: "Chief Faculty Coordinator",
                    department: "AI & ML Department",
                    memberType: "Faculty",
                    description: "Passionate educator dedicated to mentoring students in innovation, research and leadership.",
                    profileImage: "assets/council/faculty/chief.jpg",
                    email: "faculty@vvit.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 1,
                    active: true
                },
                {
                    name: "Student Lead",
                    role: "President / Student President",
                    department: "Executive Council",
                    memberType: "Student",
                    description: "Leading VVISC vision, team coordination, and inter-departmental collaboration.",
                    profileImage: "assets/nodp.png",
                    email: "president@vvisc.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 2,
                    active: true
                },
                {
                    name: "Vice President",
                    role: "Vice President",
                    department: "Executive Council",
                    memberType: "Student",
                    description: "Overseeing operations, student engagement, and strategic execution.",
                    profileImage: "assets/nodp.png",
                    email: "vp@vvisc.net",
                    linkedin: "#",
                    github: "#",
                    displayOrder: 3,
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
