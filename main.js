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
    const scrollContainer = document.querySelector('.scroll-container');
    const canvas = document.getElementById('scroll-canvas');
    const preloader = document.querySelector('.preloader');
    const preloaderBar = document.querySelector('.preloader-bar-fill');
    const scrollHint = document.getElementById('intro-scroll-hint');
    const eventOverlay = document.getElementById('canvas-event-overlay');

    if (scrollContainer && canvas) {
        const context = canvas.getContext('2d');
        const frameCount = 176;
        const currentFrame = index => `frames/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;
        const images = [];
        let loadedImages = 0;
        let assetsReady = false;
        let lastDrawnFrame = 0;

        /* ----------------------------------------------------------
           High-DPI canvas sizing (fixes the blurry logo intro).

           Previously the canvas's internal bitmap was locked to the
           source frame size (1280x720) while its CSS box stretched
           to 100vw/100dvh — the browser then upscaled that low-res
           bitmap across the whole screen, which read as soft/blurry
           on any screen wider than 1280px (i.e. almost every desktop
           and most phones at their CSS pixel width).

           Fix: size the canvas's actual drawing buffer to match its
           on-screen box in device pixels (CSS size × devicePixelRatio),
           then draw each frame in using a manual "cover" fit with
           high-quality image smoothing. This removes the extra blur
           pass caused by CSS upscaling a tiny bitmap.
           ---------------------------------------------------------- */
        const canvasStage = document.getElementById('canvasStage') || canvas.parentElement;

        const sizeCanvasToDisplay = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
            const rect = canvasStage.getBoundingClientRect();
            const displayWidth = Math.max(1, Math.round(rect.width * dpr));
            const displayHeight = Math.max(1, Math.round(rect.height * dpr));
            if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                canvas.width = displayWidth;
                canvas.height = displayHeight;
            }
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
        };

        // Draws a frame using "cover" scaling (fills the box completely,
        // cropping overflow, no distortion) into the high-res buffer.
        const drawFrame = (index) => {
            const clamped = Math.max(0, Math.min(frameCount - 1, index));
            lastDrawnFrame = clamped;
            const img = images[clamped];
            if (!(img && img.complete && img.naturalWidth > 0)) return;

            const canvasRatio = canvas.width / canvas.height;
            const imgRatio = img.naturalWidth / img.naturalHeight;
            let sx, sy, sWidth, sHeight;

            if (imgRatio > canvasRatio) {
                sHeight = img.naturalHeight;
                sWidth = sHeight * canvasRatio;
                sx = (img.naturalWidth - sWidth) / 2;
                sy = 0;
            } else {
                sWidth = img.naturalWidth;
                sHeight = sWidth / canvasRatio;
                sx = 0;
                sy = (img.naturalHeight - sHeight) / 2;
            }

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        };

        sizeCanvasToDisplay();

        const updatePreloader = () => {
            const pct = Math.round((loadedImages / frameCount) * 100);
            if (preloaderBar) preloaderBar.style.width = pct + '%';
            if (loadedImages >= frameCount) {
                assetsReady = true;
                if (preloader) preloader.classList.add('is-hidden');
            }
        };

        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            img.src = currentFrame(i);
            img.onload = () => {
                loadedImages++;
                if (loadedImages === 1) {
                    sizeCanvasToDisplay();
                    drawFrame(0);
                }
                updatePreloader();
            };
            img.onerror = () => {
                loadedImages++;
                updatePreloader();
            };
            images.push(img);
        }

        // Safety net: hide preloader after 4s regardless, so a slow/broken
        // asset never traps the visitor on a blank screen.
        setTimeout(() => {
            assetsReady = true;
            if (preloader) preloader.classList.add('is-hidden');
        }, 4000);

        // Re-size the drawing buffer on resize/orientation change and
        // redraw the current frame so it never reverts to a blurry state.
        let resizeRaf = null;
        window.addEventListener('resize', () => {
            if (resizeRaf) cancelAnimationFrame(resizeRaf);
            resizeRaf = requestAnimationFrame(() => {
                sizeCanvasToDisplay();
                drawFrame(lastDrawnFrame);
            });
        });

        // --- Sequence state ---
        const SEQUENCE_DURATION = 1700; // ms — total auto-play length ("fast", ~1.5-2s)
        const LOGO_SLIDE_START = 0.82;  // fraction of sequence when the logo starts sliding left
        const CARD_REVEAL_AT = 0.98;    // fraction of sequence when the event card begins revealing
        let hasPlayed = false;
        let isPlaying = false;

        const isIntroInView = () => {
            const rect = scrollContainer.getBoundingClientRect();
            // Consider it "in view" if it's still substantially on screen
            return rect.top > -50 && rect.top < window.innerHeight * 0.5;
        };

        const lockScroll = () => {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }
            document.body.classList.add('intro-scroll-locked');
        };

        const unlockScroll = () => {
            document.body.classList.remove('intro-scroll-locked');
            document.body.style.paddingRight = '';
        };

        const playSequence = () => {
            if (isPlaying || hasPlayed) return;
            isPlaying = true;
            lockScroll();
            if (scrollHint) scrollHint.classList.add('is-hidden');

            const begin = () => {
                const startTime = performance.now();

                const step = (now) => {
                    const elapsed = now - startTime;
                    let progress = Math.min(elapsed / SEQUENCE_DURATION, 1);

                    const frameIndex = Math.floor(progress * (frameCount - 1));
                    drawFrame(frameIndex);

                    // Logo slide-left, eased in over the tail of the sequence
                    canvas.style.transform = "translateX(0)";

                    // Event card reveal near the very end
                    if (eventOverlay) {
                        if (progress > CARD_REVEAL_AT) {
                            eventOverlay.classList.add('is-visible');
                        } else {
                            eventOverlay.classList.remove('is-visible');
                        }
                    }

                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        isPlaying = false;
                        hasPlayed = true;
                        // Brief pause so the reveal (and the Register CTA)
                        // can be appreciated before scroll unlocks. The
                        // visitor's own next scroll then continues normally —
                        // we don't auto-advance past the card they just saw.
                        setTimeout(unlockScroll, 450);
                    }
                };

                requestAnimationFrame(step);
            };

            // If assets are still loading, give them a brief moment to finish
            // so playback doesn't visibly jump/stutter on slower connections.
            if (assetsReady) {
                begin();
            } else {
                const waitStart = performance.now();
                const waitForAssets = () => {
                    if (assetsReady || performance.now() - waitStart > 1000) {
                        begin();
                    } else {
                        requestAnimationFrame(waitForAssets);
                    }
                };
                waitForAssets();
            }
        };

        // Initial frame paint while waiting for the first scroll
        drawFrame(0);

        // --- Intercept the very first scroll/swipe gesture over the intro ---
        const triggerIfNeeded = (e) => {
            if (hasPlayed || isPlaying) return;
            if (!isIntroInView()) return;
            if (e.cancelable) e.preventDefault();
            playSequence();
        };

        window.addEventListener('wheel', triggerIfNeeded, { passive: false });

        let touchStartY = 0;
        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (hasPlayed || isPlaying) return;
            if (!isIntroInView()) return;
            const deltaY = touchStartY - e.touches[0].clientY;
            if (Math.abs(deltaY) > 10) {
                if (e.cancelable) e.preventDefault();
                playSequence();
            }
        }, { passive: false });

        // Keyboard scroll keys (space, page down, arrow down) — accessibility
        window.addEventListener('keydown', (e) => {
            const keys = ['ArrowDown', 'PageDown', ' '];
            if (!keys.includes(e.key)) return;
            if (hasPlayed || isPlaying) return;
            if (!isIntroInView()) return;
            e.preventDefault();
            playSequence();
        });

    } else if (preloader) {
        // No frame sequence on this page — don't block on it.
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
        }

        themeToggleBtn.addEventListener('click', () => {
            if (body.classList.contains('light-mode')) {
                body.classList.replace('light-mode', 'dark-mode');
                localStorage.setItem('vvisc-theme', 'dark-mode');
            } else {
                body.classList.replace('dark-mode', 'light-mode');
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
            mobileMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        };

        hamburger.addEventListener('click', toggleMenu);

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mobileMenu.classList.contains('active')) {
                    toggleMenu();
                }
            });
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
            navbar.classList.toggle('is-scrolled', scrollY > 20);
        }
        if (scrollProgress) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
            scrollProgress.style.width = Math.min(100, Math.max(0, pct)) + '%';
        }
    };
    window.addEventListener('scroll', updateNavOnScroll, { passive: true });
    updateNavOnScroll();

    /* ============================================
       7. Custom Cursor (desktop / mouse only)
       ============================================ */
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (supportsHover) {
        const cursorDot = document.createElement('div');
        cursorDot.className = 'cursor-dot';
        const cursorRing = document.createElement('div');
        cursorRing.className = 'cursor-ring';
        document.body.appendChild(cursorDot);
        document.body.appendChild(cursorRing);
        document.body.classList.add('cursor-active');

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
        });

        const animateRing = () => {
            ringX += (mouseX - ringX) * 0.18;
            ringY += (mouseY - ringY) * 0.18;
            cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
            requestAnimationFrame(animateRing);
        };
        requestAnimationFrame(animateRing);

        const hoverTargets = 'a, button, .card, .event-card, .department-card, .profile-card, .gallery-item, .carousel-item, input, textarea';
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(hoverTargets)) {
                cursorRing.classList.add('is-hovering');
            }
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(hoverTargets)) {
                cursorRing.classList.remove('is-hovering');
            }
        });

        document.addEventListener('mouseleave', () => {
            cursorDot.style.opacity = '0';
            cursorRing.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
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

            announcementCards.forEach(card => {
                const categoryEl = card.querySelector('.category');
                const cardCategory = categoryEl ? categoryEl.textContent.trim() : '';
                const text = card.textContent.toLowerCase();

                const matchesCategory = activeCategory === 'All' || cardCategory === activeCategory;
                const matchesQuery = !query || text.includes(query);

                const shouldShow = matchesCategory && matchesQuery;
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

                    number.textContent = target + "+";

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

    const timelineSteps = document.querySelectorAll(".timeline-step");
    const timelineProgress = document.querySelector(".timeline-progress");
    const journeySection = document.querySelector(".journey-section");

    if (journeySection && timelineProgress) {

        /*------------------------------
            Reveal Cards
        ------------------------------*/

        const timelineObserver = new IntersectionObserver((entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("active");

                    timelineObserver.unobserve(entry.target);

                }

            });

        }, {

            threshold: 0.25

        });

        timelineSteps.forEach(step => timelineObserver.observe(step));



        /*------------------------------
            Progress Line
        ------------------------------*/

        function updateTimelineProgress() {

            const rect = journeySection.getBoundingClientRect();

            const windowHeight = window.innerHeight;

            const start = windowHeight * 0.75;

            const end = rect.height + windowHeight * 0.25;

            let progress = ((start - rect.top) / end);

            progress = Math.max(0, Math.min(progress, 1));

            timelineProgress.style.width = `${progress * 100}%`;

        }

        window.addEventListener("scroll", updateTimelineProgress);

        updateTimelineProgress();



        /*------------------------------
            Hover Animation
        ------------------------------*/

        timelineSteps.forEach(step => {

            const card = step.querySelector(".timeline-card");
            const icon = step.querySelector(".timeline-icon");
            const dot = step.querySelector(".timeline-dot");

            step.addEventListener("mouseenter", () => {

                card.style.transform = "translateY(-12px)";
                icon.style.transform = "translateY(-8px) scale(1.08)";
                dot.style.transform = "scale(1.25)";

                dot.style.boxShadow =
                    "0 0 25px rgba(199,107,60,.65)";

            });

            step.addEventListener("mouseleave", () => {

                card.style.transform = "";
                icon.style.transform = "";
                dot.style.transform = "";

                dot.style.boxShadow =
                    "0 0 18px rgba(199,107,60,.35)";

            });

        });



            /*------------------------------
                Stagger Entrance
            ------------------------------*/

            timelineSteps.forEach((step, index) => {

                step.style.transitionDelay = `${index * 180}ms`;

            });

        }
        document.querySelectorAll(".timeline-card").forEach(card=>{

        card.addEventListener("mousemove",(e)=>{

            const rect=card.getBoundingClientRect();

            const x=e.clientX-rect.left;

            const y=e.clientY-rect.top;

            card.style.background=`
            radial-gradient(
            circle at ${x}px ${y}px,
            rgba(255,255,255,.96),
            rgba(255,255,255,.78) 45%,
            rgba(255,255,255,.70)
            )`;

        });

        card.addEventListener("mouseleave",()=>{

            card.style.background="rgba(255,255,255,.72)";

        });

    });

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
        counter.innerText = target + "+";
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

console.log(lightbox);
console.log(lightboxImage);
console.log(closeBtn);
console.log(nextBtn);
console.log(prevBtn);

let currentIndex = 0;

const galleryImages = [];

galleryItems.forEach((item,index)=>{

    const img = item.querySelector("img");

    galleryImages.push(img);

    item.addEventListener("click",()=>{

        currentIndex=index;

        showImage();

    });

});

function showImage(){

    if(!lightbox || !lightboxImage) return;

    lightbox.classList.add("active");

    lightboxImage.src = galleryImages[currentIndex].src;

}

closeBtn.onclick=()=>{

lightbox.classList.remove("active");

};

nextBtn.onclick=()=>{

currentIndex++;

if(currentIndex>=galleryImages.length){

currentIndex=0;

}

showImage();

};

prevBtn.onclick=()=>{

currentIndex--;

if(currentIndex<0){

currentIndex=galleryImages.length-1;

}

showImage();

};

lightbox.onclick=(e)=>{

if(e.target===lightbox){

lightbox.classList.remove("active");

}

};

document.addEventListener("keydown",(e)=>{

if(!lightbox.classList.contains("active")) return;

if(e.key==="Escape"){

lightbox.classList.remove("active");

}

if(e.key==="ArrowRight"){

nextBtn.click();

}

if(e.key==="ArrowLeft"){

prevBtn.click();

}

});
