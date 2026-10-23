document.addEventListener('DOMContentLoaded', () => {

    /* ============================================
       0. Active Page Highlighting
       ============================================ */
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });

    /* ============================================
       1. Preloader + Scroll-Locked Intro Sequence
       Scrolling once over the intro section locks the page,
       auto-plays the 176-frame sequence, slides the logo left,
       reveals the event card on the right, then unlocks scroll.
       ============================================ */
    /* ============================================
       1. Cinematic 250-Frame LogoSequence with Clean Logo Hold
       Matching LogoSequence.jsx & Hero.tsx:
       - Progressive loading with 45-frame initial priority
       - Cover fit high-DPI rendering algorithm (warm parchment #ede7dc)
       - Beginning state prompt ("Scroll Once to Begin")
       - Skip Intro button during playback
       - Lock scroll during ~3.8s animation, unlock on final frame (frame 250)
       - Completion state: "VVISC Chapter Activated • Scroll to Explore ↓"
       ============================================ */
    const canvas = document.getElementById('scroll-canvas');
    const startPrompt = document.getElementById('seq-start-prompt');
    const skipWrap = document.getElementById('seq-skip-wrap');
    const skipBtn = document.getElementById('skipIntroBtn');
    const preloader = document.querySelector('.preloader');
    const preloaderBar = document.querySelector('.preloader-bar-fill');

    if (canvas) {
        const totalFrames = 168;
        const basePath = 'logo-sequence/frame-';
        const extension = '.jpg';
        const initialBatchSize = 25;
        const duration = 3800; // ms

        const images = new Array(totalFrames).fill(null);
        let loadedCount = 0;
        let isReady = false;
        let isFullyLoaded = false;
        let hasStarted = false;
        let isPlaying = false;
        let isCompleted = false;
        let currentFrameIndex = 0;
        let rafId = null;

        // Ensure scroll is at top on fresh load
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);

        const constructUrl = (index) => {
            const paddedIndex = String(index).padStart(3, '0');
            return `${basePath}${paddedIndex}${extension}`;
        };

        const preloaderMark = document.querySelector('.preloader-mark');
        const updatePreloader = () => {
            const pct = Math.min(100, Math.round((loadedCount / totalFrames) * 100));
            if (preloaderBar) preloaderBar.style.width = pct + '%';
            if (preloaderMark) preloaderMark.textContent = `PREPARING EXPERIENCE ... ${pct}%`;
            if ((loadedCount >= initialBatchSize || loadedCount >= totalFrames) && !isReady) {
                isReady = true;
                if (!hasStarted) renderFrame(0);
                if (preloader) preloader.classList.add('is-hidden');
            }
            if (loadedCount >= totalFrames) {
                isFullyLoaded = true;
            }
        };

        // High-DPI COVER Render Algorithm: edge-to-edge full screen, never letterboxed
        const renderFrame = (frameIdx) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = getFrame(frameIdx);
            if (!img || !img.complete || img.naturalWidth === 0) return;

            const width = window.innerWidth;
            const height = window.innerHeight;
            if (width === 0 || height === 0) return;

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
                canvas.width = width * dpr;
                canvas.height = height * dpr;
            }

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, width, height);

            // Warm parchment ivory tone matching frames
            ctx.fillStyle = '#ede7dc';
            ctx.fillRect(0, 0, width, height);

            // Cover math
            const imgWidth = img.naturalWidth || 1920;
            const imgHeight = img.naturalHeight || 1080;
            const canvasRatio = width / height;
            const imgRatio = imgWidth / imgHeight;

            let renderW, renderH, offsetX, offsetY;

            if (canvasRatio > imgRatio) {
                renderW = width;
                renderH = width / imgRatio;
                offsetX = 0;
                offsetY = (height - renderH) / 2;
            } else {
                renderH = height;
                renderW = height * imgRatio;
                offsetX = (width - renderW) / 2;
                offsetY = 0;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
            ctx.restore();
        };

        // Fallback: if requested frame is not yet loaded, return nearest preceding frame
        const getFrame = (frameIndex) => {
            const clamped = Math.max(0, Math.min(frameIndex, totalFrames - 1));
            if (images[clamped] && images[clamped].complete && images[clamped].naturalWidth > 0) {
                return images[clamped];
            }
            for (let i = clamped - 1; i >= 0; i--) {
                if (images[i] && images[i].complete && images[i].naturalWidth > 0) return images[i];
            }
            for (let i = clamped + 1; i < totalFrames; i++) {
                if (images[i] && images[i].complete && images[i].naturalWidth > 0) return images[i];
            }
            return null;
        };

        const loadImage = (index) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = constructUrl(index);
                const onDone = () => {
                    images[index - 1] = img;
                    loadedCount += 1;
                    updatePreloader();
                    resolve(img);
                };
                img.onload = onDone;
                img.onerror = () => {
                    loadedCount += 1;
                    updatePreloader();
                    resolve(null);
                };
            });
        };

        const loadAllFrames = async () => {
            // Phase 1: Load initial batch
            const initialPromises = [];
            for (let i = 1; i <= Math.min(initialBatchSize, totalFrames); i++) {
                initialPromises.push(loadImage(i));
            }
            await Promise.all(initialPromises);
            isReady = true;
            if (!hasStarted) renderFrame(0);

            // Phase 2: Stream remaining frames with concurrency of 8
            const remaining = [];
            for (let i = initialBatchSize + 1; i <= totalFrames; i++) {
                remaining.push(i);
            }
            let curr = 0;
            const worker = async () => {
                while (curr < remaining.length) {
                    const idx = remaining[curr++];
                    await loadImage(idx);
                }
            };
            const workers = Array.from({ length: 8 }, () => worker());
            await Promise.all(workers);
        };

        loadAllFrames();

        // Safety timeout for preloader: guarantees user is never stuck
        setTimeout(() => {
            if (!isReady) {
                isReady = true;
                if (!hasStarted) renderFrame(0);
            }
            if (preloader) preloader.classList.add('is-hidden');
        }, 2200);

        // Skip directly to final locked frame
        const skipToFinalFrame = () => {
            if (rafId) cancelAnimationFrame(rafId);
            hasStarted = true;
            isCompleted = true;
            isPlaying = false;
            currentFrameIndex = totalFrames - 1;
            renderFrame(totalFrames - 1);
            document.body.style.overflow = '';
            if (startPrompt) startPrompt.classList.add('hidden');
            if (skipWrap) skipWrap.classList.add('hidden');
        };

        // Trigger-Once Cinematic Animation Execution
        const triggerSequence = () => {
            if (hasStarted || isCompleted || !isReady) return;
            hasStarted = true;
            isPlaying = true;

            // Temporarily lock body scroll while the cinematic opening unfolds
            document.body.style.overflow = 'hidden';

            if (startPrompt) startPrompt.classList.add('hidden');
            if (skipWrap) skipWrap.classList.remove('hidden');

            const startTime = performance.now();
            const animateLoop = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(1, elapsed / duration);

                const targetFrame = Math.min(totalFrames - 1, Math.floor(progress * totalFrames));
                currentFrameIndex = targetFrame;
                renderFrame(targetFrame);

                if (progress < 1) {
                    rafId = requestAnimationFrame(animateLoop);
                } else {
                    // Animation finished! Lock permanently on Frame 250
                    currentFrameIndex = totalFrames - 1;
                    renderFrame(totalFrames - 1);
                    isCompleted = true;
                    isPlaying = false;
                    document.body.style.overflow = '';
                    if (skipWrap) skipWrap.classList.add('hidden');
                }
            };

            rafId = requestAnimationFrame(animateLoop);
        };

        if (startPrompt) {
            startPrompt.addEventListener('click', triggerSequence);
        }
        if (skipBtn) {
            skipBtn.addEventListener('click', skipToFinalFrame);
        }

        // Listen for user scroll / gestures to trigger the sequence
        const onWheel = (e) => {
            if (!hasStarted && e.deltaY > 0) {
                if (e.cancelable) e.preventDefault();
                triggerSequence();
            }
        };

        let touchStartY = 0;
        const onTouchStart = (e) => {
            touchStartY = e.touches[0].clientY;
        };

        const onTouchMove = (e) => {
            if (!hasStarted) {
                const touchCurrentY = e.touches[0].clientY;
                if (touchStartY - touchCurrentY > 10) {
                    if (e.cancelable) e.preventDefault();
                    triggerSequence();
                }
            }
        };

        const onKeyDown = (e) => {
            if (!hasStarted) {
                if (['ArrowDown', 'PageDown', 'Space', ' '].includes(e.key)) {
                    if (e.cancelable) e.preventDefault();
                    triggerSequence();
                }
            }
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('keydown', onKeyDown);

        window.addEventListener('resize', () => {
            renderFrame(currentFrameIndex);
        });

    } else if (preloader) {
        preloader.classList.add('is-hidden');
    }

    /* ============================================ 
       2. Theme Toggle Logic
       ============================================ */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    if (themeToggleBtn) {
        const savedTheme = localStorage.getItem('vvisc-theme');
        if (savedTheme) {
            body.classList.remove('light-mode', 'dark-mode');
            body.classList.add(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme === 'dark-mode' ? 'dark' : 'light');
        } else {
            const isDark = body.classList.contains('dark-mode');
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        }

        themeToggleBtn.addEventListener('click', () => {
            if (body.classList.contains('light-mode')) {
                body.classList.replace('light-mode', 'dark-mode');
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('vvisc-theme', 'dark-mode');
            } else {
                body.classList.replace('dark-mode', 'light-mode');
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('vvisc-theme', 'light-mode');
            }
        });
    }

    /* ============================================
       3. Hamburger Menu Logic
       ============================================ */
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu a');

    if (hamburger && mobileMenu) {
        const toggleMenu = () => {
            const isActive = mobileMenu.classList.contains('active');
            if (isActive) {
                mobileMenu.classList.remove('active');
                hamburger.classList.remove('active');
            } else {
                mobileMenu.classList.add('active');
                hamburger.classList.add('active');
            }
        };

        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Use event delegation so all existing and dynamic links or buttons work smoothly
        mobileMenu.addEventListener('click', (e) => {
            const item = e.target.closest('a, button');
            if (item && mobileMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    /* ============================================
       4. Scroll Reveal Animation using Intersection Observer
       ============================================ */
    const fadeElements = document.querySelectorAll('.fade-in, .reveal-left, .reveal-right, .reveal-up, .reveal-down, .reveal-scale, .reveal-zoom');
    if (fadeElements.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        fadeElements.forEach(el => observer.observe(el));
    }

    /* ============================================
       5. Count-Up Animation for "Our Impact" section
       ============================================ */
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length > 0) {
        let hasAnimated = false;

        const easeOutQuad = t => t * (2 - t);

        const countUpObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasAnimated) {
                    hasAnimated = true;
                    statNumbers.forEach(stat => {
                        const target = +stat.getAttribute('data-target');
                        const duration = 1600;
                        const startTime = performance.now();

                        const updateCount = (now) => {
                            const elapsed = now - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const eased = easeOutQuad(progress);
                            const current = Math.floor(eased * target);
                            stat.innerText = current;
                            if (progress < 1) {
                                requestAnimationFrame(updateCount);
                            } else {
                                stat.innerText = target;
                            }
                        };
                        requestAnimationFrame(updateCount);
                    });
                }
            });
        }, { threshold: 0.4 });

        const impactContainer = document.querySelector('.impact-container');
        if (impactContainer) {
            countUpObserver.observe(impactContainer);
        }
    }

    /* ============================================
       6. Navbar scroll state + scroll progress bar
       ============================================ */
    const navbar = document.querySelector('.navbar');
    const scrollProgress = document.querySelector('.scroll-progress');

    const updateNavOnScroll = () => {
        const scrollY = window.scrollY;
        if (navbar) {
            const hasHero = document.getElementById('hero') || document.querySelector('.hero');
            const threshold = hasHero ? (0.7 * window.innerHeight) : 60;
            navbar.classList.toggle('is-scrolled', scrollY > threshold);
        }
        if (scrollProgress) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
            scrollProgress.style.width = Math.min(100, Math.max(0, pct)) + '%';
        }
    };
    window.addEventListener('scroll', updateNavOnScroll, { passive: true });
    updateNavOnScroll();

    /* =====================================================================
       7. Interactive Magnetic Cursor & Button Hover System
       (Heritage Academic × Modern Engineering)
       - Resting: Inner dot (8px, #D4AF37) + outer ring (32px, 0.18 lerp)
       - Interactive hover: expands to 80px with action micro-typography
       - Standard buttons: scales to 48px with soft gold glow & magnetic pull
       - Desktop only: window.matchMedia('(pointer: fine)').matches
       ===================================================================== */
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (isFinePointer) {
        const cursorContainer = document.createElement('div');
        cursorContainer.className = 'vvisc-magnetic-cursor';
        cursorContainer.setAttribute('aria-hidden', 'true');

        const cursorDot = document.createElement('div');
        cursorDot.className = 'cursor-dot';

        const cursorRing = document.createElement('div');
        cursorRing.className = 'cursor-ring';

        const cursorLabel = document.createElement('span');
        cursorLabel.className = 'cursor-label';
        cursorRing.appendChild(cursorLabel);

        cursorContainer.appendChild(cursorDot);
        cursorContainer.appendChild(cursorRing);
        document.body.appendChild(cursorContainer);

        let mouseX = -100;
        let mouseY = -100;
        let ringX = -100;
        let ringY = -100;
        let isCursorVisible = false;
        let isMagnetic = false;
        let magneticX = 0;
        let magneticY = 0;

        let activeMagneticBtn = null;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (!isCursorVisible) {
                isCursorVisible = true;
                cursorDot.style.opacity = '1';
                cursorRing.style.opacity = '1';
                ringX = mouseX;
                ringY = mouseY;
            }

            cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

            // Button magnetic shift: gently translate button toward cursor (max 6-8px)
            const targetBtn = e.target.closest('.btn, .btn-primary, .btn-secondary, .nav-login-btn, .explore-impact-btn');
            if (targetBtn) {
                activeMagneticBtn = targetBtn;
                const rect = targetBtn.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const shiftX = Math.max(-8, Math.min(8, (mouseX - centerX) * 0.18));
                const shiftY = Math.max(-6, Math.min(6, (mouseY - centerY) * 0.18));
                targetBtn.style.transform = `translate3d(${shiftX}px, ${shiftY}px, 0)`;
                targetBtn.style.transition = 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)';
            } else if (activeMagneticBtn) {
                activeMagneticBtn.style.transform = '';
                activeMagneticBtn.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
                activeMagneticBtn = null;
            }
        }, { passive: true });

        // Physics animation loop using smooth lerp (factor 0.18)
        const animateCursor = () => {
            if (isCursorVisible) {
                const targetX = isMagnetic ? magneticX : mouseX;
                const targetY = isMagnetic ? magneticY : mouseY;

                ringX += (targetX - ringX) * 0.18;
                ringY += (targetY - ringY) * 0.18;

                cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
            }
            requestAnimationFrame(animateCursor);
        };
        requestAnimationFrame(animateCursor);

        // Hover State on Interactive Elements
        document.addEventListener('mouseover', (e) => {
            const cursorTarget = e.target.closest('[data-cursor]');
            if (cursorTarget) {
                const actionLabel = cursorTarget.getAttribute('data-cursor');
                if (actionLabel) {
                    cursorLabel.textContent = actionLabel.toUpperCase();
                    cursorRing.classList.add('cursor-ring--expanded');
                    cursorRing.classList.remove('cursor-ring--hover');
                    cursorDot.classList.add('cursor-dot--hidden');
                    return;
                }
            }

            // Standard buttons, cards, links without custom action
            const interactiveTarget = e.target.closest('a, button, .btn, .card, .department-card, .highlight-card, .tilted-impact-card, .past-event-card, input, textarea');
            if (interactiveTarget) {
                cursorRing.classList.add('cursor-ring--hover');
                cursorRing.classList.remove('cursor-ring--expanded');
                cursorLabel.textContent = '';

                // Magnetic attraction for buttons
                if (interactiveTarget.matches('.btn, button, .nav-login-btn, .reviews-highlight, .theme-toggle, .nav-monogram-pill')) {
                    const rect = interactiveTarget.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const dist = Math.hypot(mouseX - centerX, mouseY - centerY);
                    if (dist < Math.max(rect.width, rect.height) * 0.85) {
                        isMagnetic = true;
                        magneticX = centerX + (mouseX - centerX) * 0.25;
                        magneticY = centerY + (mouseY - centerY) * 0.25;
                    }
                }
            }
        });

        document.addEventListener('mouseout', (e) => {
            const related = e.relatedTarget;
            const currentCursorTarget = e.target.closest('[data-cursor]');
            const nextCursorTarget = related ? related.closest('[data-cursor]') : null;

            if (currentCursorTarget && (!nextCursorTarget || currentCursorTarget !== nextCursorTarget)) {
                cursorRing.classList.remove('cursor-ring--expanded');
                cursorDot.classList.remove('cursor-dot--hidden');
                cursorLabel.textContent = '';
            }

            const currentInteractive = e.target.closest('a, button, .btn, .card, .department-card, .highlight-card, .tilted-impact-card, .past-event-card, input, textarea');
            const nextInteractive = related ? related.closest('a, button, .btn, .card, .department-card, .highlight-card, .tilted-impact-card, .past-event-card, input, textarea') : null;

            if (currentInteractive && (!nextInteractive || currentInteractive !== nextInteractive)) {
                cursorRing.classList.remove('cursor-ring--hover');
                isMagnetic = false;
            }

            if (activeMagneticBtn && (!related || !related.closest('.btn, .btn-primary, .btn-secondary, .nav-login-btn, .explore-impact-btn'))) {
                activeMagneticBtn.style.transform = '';
                activeMagneticBtn.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
                activeMagneticBtn = null;
            }
        });

        document.addEventListener('mouseleave', () => {
            isCursorVisible = false;
            cursorDot.style.opacity = '0';
            cursorRing.style.opacity = '0';
            if (activeMagneticBtn) {
                activeMagneticBtn.style.transform = '';
                activeMagneticBtn.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
                activeMagneticBtn = null;
            }
        });

        document.addEventListener('mouseenter', () => {
            isCursorVisible = true;
            cursorDot.style.opacity = '1';
            cursorRing.style.opacity = '1';
        });
    }

    /* ============================================
       8. Page Transitions
       ============================================ */
    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'page-transition';
    transitionOverlay.innerHTML = `
        <div class="pt-panel pt-top"></div>
        <div class="pt-panel pt-bottom"></div>
        <span class="pt-mark">VVISC</span>
    `;
    document.body.appendChild(transitionOverlay);

    // Entrance: briefly show the overlay covering the page, then wipe away.
    requestAnimationFrame(() => {
        transitionOverlay.classList.add('is-entering');
        document.body.classList.add('is-page-ready');
    });

    const isInternalLink = (link) => {
        if (!link) return false;
        const href = link.getAttribute('href');
        if (!href) return false;
        if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
        if (link.target === '_blank') return false;
        return href.endsWith('.html') || href === '/' || href === '';
    };

    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (!isInternalLink(link)) return;
            const destination = link.getAttribute('href');
            if (destination === currentPage) return;
            e.preventDefault();
            transitionOverlay.classList.remove('is-entering');
            transitionOverlay.classList.add('is-leaving');
            setTimeout(() => {
                window.location.href = destination;
            }, 480);
        });
    });

    /* ============================================
       9. Contact Form Handling
       ============================================ */
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        let statusEl = contactForm.querySelector('.form-status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = 'form-status';
            contactForm.appendChild(statusEl);
        }

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const requiredFields = contactForm.querySelectorAll('[required]');
            let allFilled = true;
            requiredFields.forEach(field => {
                if (!field.value.trim()) allFilled = false;
            });

            if (!allFilled) {
                statusEl.textContent = 'Please fill in all fields before sending.';
                statusEl.className = 'form-status error is-visible';
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.dataset.originalText = submitBtn.textContent;
                submitBtn.textContent = 'Sending...';
            }

            // NOTE: This currently simulates a send. Once a backend endpoint
            // exists (e.g. POST /api/contact), replace this timeout with a
            // fetch() call to that endpoint and handle the real response.
            setTimeout(() => {
                statusEl.textContent = "Message sent — we'll get back to you soon.";
                statusEl.className = 'form-status success is-visible';
                contactForm.reset();
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Send Message';
                }
            }, 900);
        });
    }

    /* ============================================
       9b. Cursor-Tilt for Event Highlight Cards
       ============================================ */
    const supportsHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : false;
    const tiltCards = document.querySelectorAll('.tilt-card');
    if (tiltCards.length > 0 && supportsHover) {
        tiltCards.forEach(card => {
            const inner = card.querySelector('.highlight-card-inner');
            if (!inner) return;

            const maxTilt = 10; // degrees

            card.addEventListener('mouseenter', () => {
                card.classList.add('is-tilting');
            });

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const px = x / rect.width;
                const py = y / rect.height;

                const rx = (px - 0.5) * maxTilt * 2;
                const ry = -(py - 0.5) * maxTilt * 2;

                inner.style.setProperty('--rx', `${rx}deg`);
                inner.style.setProperty('--ry', `${ry}deg`);
                inner.style.setProperty('--mx', `${px * 100}%`);
                inner.style.setProperty('--my', `${py * 100}%`);
            });

            card.addEventListener('mouseleave', () => {
                card.classList.remove('is-tilting');
                inner.style.setProperty('--rx', '0deg');
                inner.style.setProperty('--ry', '0deg');
            });
        });
    }

    /* ============================================
       10. Announcements: Search + Category Filter
       ============================================ */
    const filterBar = document.querySelector('.filter-bar');
    if (filterBar) {
        const filterInput = filterBar.querySelector('.filter-input');
        const filterBtns = filterBar.querySelectorAll('.filter-btn');
        const announcementCards = document.querySelectorAll('.announcement-card');
        const announcementList = document.querySelector('.announcement-list');

        let noResultsEl = document.querySelector('.no-results');
        if (!noResultsEl && announcementList) {
            noResultsEl = document.createElement('div');
            noResultsEl.className = 'no-results';
            noResultsEl.textContent = 'No announcements match your search.';
            announcementList.insertAdjacentElement('afterend', noResultsEl);
        }

        let activeCategory = 'All';

        const applyFilters = () => {
            const query = (filterInput ? filterInput.value : '').trim().toLowerCase();
            let visibleCount = 0;
            const currentCards = document.querySelectorAll('.announcement-card');

            currentCards.forEach(card => {
                const categoryEl = card.querySelector('.category');
                const cardCategory = categoryEl ? categoryEl.textContent.trim().toLowerCase() : '';
                const text = card.textContent.toLowerCase();

                const targetCat = activeCategory.trim().toLowerCase();
                const matchesCategory = targetCat === 'all' || cardCategory === targetCat;
                const matchesQuery = !query || text.includes(query);

                const shouldShow = matchesCategory && matchesQuery;
                card.style.display = shouldShow ? 'block' : 'none';
                card.classList.toggle('is-filtered-out', !shouldShow);
                if (shouldShow) visibleCount++;
            });

            if (noResultsEl) {
                noResultsEl.classList.toggle('is-visible', visibleCount === 0);
            }
        };

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeCategory = btn.textContent.trim();
                applyFilters();
            });
        });

        if (filterInput) {
            filterInput.addEventListener('input', applyFilters);
        }

        if (filterInput) {
            filterInput.addEventListener('input', applyFilters);
        }
    }
    const track = document.getElementById("carouselTrack");

    if(track){

        track.innerHTML += track.innerHTML;

        let position = 0;
        let speed = 0.4;
        let isDragging = false;
        let startX = 0;
        let previous = 0;

        const halfWidth = () => track.scrollWidth / 2;

        function animate(){

            if(!isDragging){

                position -= speed;

                if(Math.abs(position) >= halfWidth()){
                    position = 0;
                }

                track.style.transform = `translateX(${position}px)`;
            }

            requestAnimationFrame(animate);
        }

        animate();

        track.addEventListener("mousedown",(e)=>{
            isDragging = true;
            startX = e.clientX;
            previous = position;
        });

        window.addEventListener("mouseup",()=>{
            isDragging = false;
        });

        window.addEventListener("mousemove",(e)=>{
            if(!isDragging) return;

            position = previous + (e.clientX - startX);
            track.style.transform = `translateX(${position}px)`;
        });

        track.addEventListener("touchstart",(e)=>{
            isDragging = true;
            startX = e.touches[0].clientX;
            previous = position;
        });

        window.addEventListener("touchend",()=>{
            isDragging = false;
        });

        window.addEventListener("touchmove",(e)=>{
            if(!isDragging) return;

            position = previous + (e.touches[0].clientX - startX);
            track.style.transform = `translateX(${position}px)`;
        });

    }

}); 
/*==========================================================
  PREMIUM IMPACT SECTION
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    const cards = document.querySelectorAll(".reveal-impact");
    const numbers = document.querySelectorAll(".impact-number");
    const progress = document.querySelector(".timeline-progress");
    const timeline = document.querySelector(".impact-timeline");

    /*---------------------------------------
      Scroll Reveal
    ---------------------------------------*/

    const revealObserver = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            entry.target.classList.add("active");

            revealObserver.unobserve(entry.target);

        });

    }, {

        threshold: 0.25

    });

    cards.forEach(card => revealObserver.observe(card));

    /*---------------------------------------
      Count Animation
    ---------------------------------------*/

    const counterObserver = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            const number = entry.target;

            const target = +number.dataset.target;

            let current = 0;

            const duration = 1600;

            const increment = target / (duration / 16);

            const update = () => {

                current += increment;

                if (current < target) {
                    number.textContent = Math.floor(current);
                    requestAnimationFrame(update);
                } else {
                    number.textContent = number.dataset.cmsValue || (target + "+");
                }

            };

            update();

            counterObserver.unobserve(number);

        });

    }, {

        threshold: .6

    });

    numbers.forEach(num => counterObserver.observe(num));

    /*---------------------------------------
      Timeline Progress
    ---------------------------------------*/

    function updateTimeline() {

        if (!timeline || !progress) return;

        const rect = timeline.getBoundingClientRect();

        const windowHeight = window.innerHeight;

        const start = windowHeight * 0.2;

        const end = rect.height + windowHeight * 0.2;

        let percent = ((start - rect.top) / end) * 100;

        percent = Math.max(0, Math.min(percent, 100));

        progress.style.height = percent + "%";

    }

    window.addEventListener("scroll", updateTimeline);

    updateTimeline();

    /*---------------------------------------
      Floating Animation
    ---------------------------------------*/

    cards.forEach((card, index) => {

        card.animate(

            [

                {

                    transform: "translateY(0px)"

                },

                {

                    transform: "translateY(-10px)"

                },

                {

                    transform: "translateY(0px)"

                }

            ],

            {

                duration: 4000 + index * 400,

                iterations: Infinity,

                easing: "ease-in-out"

            }

        );

    });

    /*---------------------------------------
      Mouse Spotlight
    ---------------------------------------*/

    document.querySelectorAll(".impact-card").forEach(card => {

        card.addEventListener("mousemove", (e) => {

            const rect = card.getBoundingClientRect();

            const x = e.clientX - rect.left;

            const y = e.clientY - rect.top;

            card.style.background = `
            radial-gradient(
                circle at ${x}px ${y}px,
                rgba(255,255,255,.95),
                rgba(255,255,255,.72) 45%,
                rgba(255,255,255,.60) 100%
            )`;

        });

        card.addEventListener("mouseleave", () => {

            card.style.background =
                "rgba(255,255,255,.68)";

        });

    });

    /*---------------------------------------
      Icon Hover
    ---------------------------------------*/

    document.querySelectorAll(".impact-card").forEach(card => {

        const icon = card.querySelector(".impact-icon");

        card.addEventListener("mouseenter", () => {

            icon.animate(

                [

                    {

                        transform: "rotate(0deg) scale(1)"

                    },

                    {

                        transform: "rotate(10deg) scale(1.08)"

                    }

                ],

                {

                    duration: 300,

                    fill: "forwards"

                }

            );

        });

        card.addEventListener("mouseleave", () => {

            icon.animate(

                [

                    {

                        transform: "rotate(10deg) scale(1.08)"

                    },

                    {

                        transform: "rotate(0deg) scale(1)"

                    }

                ],

                {

                    duration: 300,

                    fill: "forwards"

                }

            );

        });

    });

});
/*==========================================================
            ABOUT PAGE ANIMATIONS
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    const aboutSection = document.querySelector(".about-section");

    if (!aboutSection) return;

    /* ----------------------------------
       Reveal Animation
    -----------------------------------*/

    const revealItems = document.querySelectorAll(".reveal-about");

    const revealObserver = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            entry.target.classList.add("active");

            revealObserver.unobserve(entry.target);

        });

    }, {

        threshold:0.15

    });

    revealItems.forEach(item => revealObserver.observe(item));



    /* ----------------------------------
       Stagger Feature Cards
    -----------------------------------*/

    const featureCards = document.querySelectorAll(".feature-card");

    featureCards.forEach((card,index)=>{

        card.style.transitionDelay=`${index*120}ms`;

    });



    /* ----------------------------------
       Logo Parallax
    -----------------------------------*/

    const logoCard=document.querySelector(".about-logo-card");

    window.addEventListener("mousemove",(e)=>{

        if(!logoCard) return;

        const x=(e.clientX/window.innerWidth-.5)*18;

        const y=(e.clientY/window.innerHeight-.5)*18;

        logoCard.style.transform=
        `rotateY(${x}deg) rotateX(${-y}deg)`;

    });



    /* ----------------------------------
       Reset Rotation
    -----------------------------------*/

    window.addEventListener("mouseleave",()=>{

        if(!logoCard) return;

        logoCard.style.transform="rotateY(0deg) rotateX(0deg)";

    });



    /* ----------------------------------
       Mouse Spotlight
    -----------------------------------*/

    document.querySelectorAll(".about-card,.feature-card")
    .forEach(card=>{

        card.addEventListener("mousemove",(e)=>{

            const rect=card.getBoundingClientRect();

            const x=e.clientX-rect.left;

            const y=e.clientY-rect.top;

            card.style.background=`
            radial-gradient(
                circle at ${x}px ${y}px,
                rgba(255,255,255,.96),
                rgba(255,255,255,.76) 45%,
                rgba(255,255,255,.68) 100%
            )`;

        });

        card.addEventListener("mouseleave",()=>{

            card.style.background="rgba(255,255,255,.70)";

        });

    });



    /* ----------------------------------
       Floating Feature Cards
    -----------------------------------*/

    featureCards.forEach((card,index)=>{

        card.animate(

            [

                {
                    transform:"translateY(0px)"
                },

                {
                    transform:"translateY(-8px)"
                },

                {
                    transform:"translateY(0px)"
                }

            ],

            {

                duration:4500+(index*250),

                iterations:Infinity,

                easing:"ease-in-out"

            }

        );

    });



    /* ----------------------------------
       About Cards Hover Lift
    -----------------------------------*/

    document.querySelectorAll(".about-card")
    .forEach(card=>{

        card.addEventListener("mouseenter",()=>{

            card.animate(

                [

                    {

                        transform:"translateY(0px)"

                    },

                    {

                        transform:"translateY(-12px)"

                    }

                ],

                {

                    duration:250,

                    fill:"forwards"

                }

            );

        });

        card.addEventListener("mouseleave",()=>{

            card.animate(

                [

                    {

                        transform:"translateY(-12px)"

                    },

                    {

                        transform:"translateY(0px)"

                    }

                ],

                {

                    duration:250,

                    fill:"forwards"

                }

            );

        });

    });
    /* Journey Timeline Progress */

    const journey = document.querySelector(".journey-section");
    const line = document.querySelector(".journey-line");

    function animateJourney(){

        if(!journey || !line) return;

        const rect = journey.getBoundingClientRect();

        const windowHeight = window.innerHeight;

        const progress = Math.min(
            Math.max(
                ((windowHeight - rect.top) / (rect.height),0),
            1)
        );

        line.style.background =
        `linear-gradient(
            to bottom,
            #C76B3C 0%,
            #D4AF37 ${progress*100}%,
            #ece6dd ${progress*100}%,
            #ece6dd 100%
        )`;

    }

    window.addEventListener("scroll", animateJourney);

    animateJourney();

    /*==========================================================
            HORIZONTAL JOURNEY TIMELINE
    ==========================================================*/

    function initJourneyTimeline() {
        const timelineSteps = document.querySelectorAll(".timeline-step");
        const timelineProgress = document.querySelector(".timeline-progress");
        const journeySection = document.querySelector(".journey-section");

        // Immediately ensure all steps and reveal items are active and visible
        timelineSteps.forEach((step, index) => {
            step.classList.add("active");
            step.classList.add("visible");
            step.style.opacity = "1";
            step.style.transform = "none";
            step.style.transitionDelay = `${index * 120}ms`;

            const card = step.querySelector(".timeline-card");
            const icon = step.querySelector(".timeline-icon");
            const dot = step.querySelector(".timeline-dot");

            if (card && !step._hoverAttached) {
                step._hoverAttached = true;
                step.addEventListener("mouseenter", () => {
                    card.style.transform = "translateY(-10px)";
                    if (icon) icon.style.transform = "translateY(-6px) scale(1.08)";
                    if (dot) {
                        dot.style.transform = "scale(1.25)";
                        dot.style.boxShadow = "0 0 25px rgba(200, 155, 53, 0.65)";
                    }
                });

                step.addEventListener("mouseleave", () => {
                    card.style.transform = "";
                    if (icon) icon.style.transform = "";
                    if (dot) {
                        dot.style.transform = "";
                        dot.style.boxShadow = "";
                    }
                });
            }
        });

        const revealAboutElements = document.querySelectorAll(".journey-section .reveal-about, .journey-heading");
        revealAboutElements.forEach(el => {
            el.classList.add("active");
            el.classList.add("visible");
            el.style.opacity = "1";
            el.style.transform = "none";
        });

        if (journeySection && timelineProgress) {
            function updateTimelineProgress() {
                const rect = journeySection.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const start = windowHeight * 0.85;
                const end = rect.height + windowHeight * 0.35;
                let progress = ((start - rect.top) / end);
                progress = Math.max(0, Math.min(progress, 1));
                timelineProgress.style.width = `${progress * 100}%`;
            }
            window.removeEventListener("scroll", updateTimelineProgress);
            window.addEventListener("scroll", updateTimelineProgress, { passive: true });
            updateTimelineProgress();
        }

        document.querySelectorAll(".timeline-card").forEach(card => {
            if (card._mouseAttached) return;
            card._mouseAttached = true;
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const isLight = document.body.classList.contains("light-mode") || document.documentElement.getAttribute("data-theme") === "light";
                if (isLight) {
                    card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,1), rgba(255,255,255,0.92) 50%, #ffffff)`;
                } else {
                    card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(20, 52, 42, 0.95), rgba(12, 36, 28, 0.9) 50%, rgba(8, 24, 18, 0.95))`;
                }
            });

            card.addEventListener("mouseleave", () => {
                card.style.background = "";
            });
        });
    }

    window.initJourneyTimeline = initJourneyTimeline;
    initJourneyTimeline();

});
/*=================================================
        Department Switcher
    ==================================================*/

const departmentButtons =
document.querySelectorAll(".department-btn");

const departmentContents =
document.querySelectorAll(".department-content");

departmentButtons.forEach(button=>{

    button.addEventListener("click",()=>{

    departmentButtons.forEach(btn=>{

    btn.classList.remove("active");

    });

    button.classList.add("active");

    const target =
    button.dataset.department;

    departmentContents.forEach(content=>{

    content.classList.remove("active");

    });

    document
    .getElementById(target)
    .classList.add("active");

    });

});
 document.querySelectorAll(".project-card").forEach(card=>{

        card.addEventListener("mouseenter",()=>{

            card.animate(

                [

                    {

                        transform:"translateY(0px)"

                    },

                    {

                        transform:"translateY(-10px)"

                    }

                ],

                {

                    duration:250,

                    fill:"forwards"

                }

            );

        });

    });
        const departmentOrder = [
        "rnd",
        "digital",
        "pr",
        "operations",
        "strategy",
        "social",
        "finance"
    ];

    document.querySelectorAll(".next-department").forEach(button => {

        button.addEventListener("click", () => {

            const current = document.querySelector(".department-content.active");

            const currentIndex = departmentOrder.indexOf(current.id);

            const nextIndex = (currentIndex + 1) % departmentOrder.length;

            document.querySelector(
                `.department-btn[data-department="${departmentOrder[nextIndex]}"]`
            ).click();

        });

    });

    document.querySelectorAll(".prev-department").forEach(button => {

        button.addEventListener("click", () => {

            const current = document.querySelector(".department-content.active");

            const currentIndex = departmentOrder.indexOf(current.id);

            const prevIndex =
                (currentIndex - 1 + departmentOrder.length) %
                departmentOrder.length;

            document.querySelector(
                `.department-btn[data-department="${departmentOrder[prevIndex]}"]`
            ).click();

        });

    });

    /*====================================
        COUNTER ANIMATION
====================================*/

const counters = document.querySelectorAll(".counter, .gallery-counter");
const speed=200;

const observer=new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

const counter=entry.target;

const target=+counter.dataset.target;

const update=()=>{

const count=+counter.innerText;

const increment=Math.ceil(target/speed);

if(count<target){

counter.innerText=count+increment;

requestAnimationFrame(update);

}else{
    if(counter.classList.contains("gallery-counter")){
        counter.innerText = target;
    }else{
        counter.innerText = counter.dataset.cmsValue || (target + "+");
    }

}

};

update();

observer.unobserve(counter);

}

});

},{threshold:0.5});

counters.forEach(counter=>observer.observe(counter));

/*=====================================
        GALLERY LIGHTBOX
======================================*/
const lightbox = document.getElementById("galleryLightbox");
const galleryItems = document.querySelectorAll(".gallery-item");
const lightboxImage = document.getElementById("lightboxImage");
const closeBtn = document.querySelector(".lightbox-close");
const nextBtn = document.querySelector(".lightbox-next");
const prevBtn = document.querySelector(".lightbox-prev");

if (
    lightbox &&
    lightboxImage &&
    closeBtn &&
    nextBtn &&
    prevBtn
) {

    let currentIndex = 0;
    const galleryImages = [];

    galleryItems.forEach((item, index) => {

        const img = item.querySelector("img");

        galleryImages.push(img);

        item.addEventListener("click", () => {

            currentIndex = index;

            showImage();

        });

    });

    function showImage() {

        lightbox.classList.add("active");

        lightboxImage.src = galleryImages[currentIndex].src;

    }

    closeBtn.onclick = () => {

        lightbox.classList.remove("active");

    };

    nextBtn.onclick = () => {

        currentIndex++;

        if (currentIndex >= galleryImages.length)
            currentIndex = 0;

        showImage();

    };

    prevBtn.onclick = () => {

        currentIndex--;

        if (currentIndex < 0)
            currentIndex = galleryImages.length - 1;

        showImage();

    };

    lightbox.onclick = (e) => {

        if (e.target === lightbox) {

            lightbox.classList.remove("active");

        }

    };

    document.addEventListener("keydown", (e) => {

        if (!lightbox.classList.contains("active"))
            return;

        if (e.key === "Escape")
            lightbox.classList.remove("active");

        if (e.key === "ArrowRight")
            nextBtn.click();

        if (e.key === "ArrowLeft")
            prevBtn.click();

    });

}
/* ============================================
   Generic Live Countdown
   Any wrapper with [data-countdown-target="ISO date"]
   ticks its descendant [data-unit="days|hours|minutes|seconds"]
   elements every second. Works on any page/markup shape.
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const countdownWrappers = document.querySelectorAll('[data-countdown-target]');
    countdownWrappers.forEach((wrapper) => {
        const dayEl = wrapper.querySelector('[data-unit="days"]') || wrapper.querySelector('#days');
        const hourEl = wrapper.querySelector('[data-unit="hours"]') || wrapper.querySelector('#hours');
        const minEl = wrapper.querySelector('[data-unit="minutes"]') || wrapper.querySelector('#minutes');
        const secEl = wrapper.querySelector('[data-unit="seconds"]') || wrapper.querySelector('#seconds');
        const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

        function tick() {
            const targetIso = wrapper.dataset.countdownTarget || wrapper.getAttribute('data-countdown-target');
            if (!targetIso) return;
            const target = new Date(targetIso).getTime();
            if (isNaN(target)) return;

            const diff = Math.max(0, target - Date.now());
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            if (dayEl) dayEl.textContent = pad(days);
            if (hourEl) hourEl.textContent = pad(hours);
            if (minEl) minEl.textContent = pad(minutes);
            if (secEl) secEl.textContent = pad(seconds);
        }

        tick();
        setInterval(tick, 1000);
    });

    // Compact "X days left" chips: <span data-countdown-days data-target="ISO date">
    document.querySelectorAll('[data-countdown-days]').forEach((chip) => {
        const target = new Date(chip.dataset.target).getTime();
        if (isNaN(target)) return;
        const diff = target - Date.now();
        const days = Math.max(0, Math.ceil(diff / 86400000));
        chip.textContent = days === 0 ? 'Today' : days + ' day' + (days === 1 ? '' : 's') + ' left';
    });
});

/* =====================================================================
   Dynamic Theme Interactions — Cursor Spotlight & 3D Tilt Effects
   ===================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Create Cursor Glow Follower Element
    let glow = document.querySelector(".vvisc-cursor-glow");
    if (!glow && !window.matchMedia("(pointer: coarse)").matches) {
        glow = document.createElement("div");
        glow.className = "vvisc-cursor-glow";
        document.body.appendChild(glow);
    }

    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;

    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        if (glow) {
            currentX += (mouseX - currentX) * 0.15;
            currentY += (mouseY - currentY) * 0.15;
            glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // 2. Mouse position tracking for spotlight cards
    const cards = document.querySelectorAll(".card, .spotlight-card, .department-card, .past-event-card, .council-card, .testimonial-card, .auth-shell");
    cards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty("--mouse-x", `${x}px`);
            card.style.setProperty("--mouse-y", `${y}px`);
        });
    });

    // 3. Subtle 3D Card Tilt Effect (Disabled for Event Cards)
    cards.forEach(card => {
        if (card.classList.contains("premium-event-card") || 
            card.classList.contains("past-event-card") || 
            card.classList.contains("countdown-card") || 
            card.closest(".events-section") || 
            card.closest(".past-events") || 
            card.closest(".featured-event")) {
            return;
        }

        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * -4;
            const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 4;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
        });
    });

    // 4. Smooth Footer Back-to-Top
    const backToTopBtn = document.getElementById("footerBackToTop");
    if (backToTopBtn) {
        backToTopBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }
});
