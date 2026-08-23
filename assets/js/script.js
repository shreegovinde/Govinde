/* =========================================================
   Shree Govind Enterprise - Site Scripts
   1. Navbar scroll effect
   2. Smooth scrolling for in-page anchor links
   3. Testimonial slider (autoplay + arrows + dots + swipe)
   4. Booking form (posts to Google Apps Script -> Google Sheet)
   5. Modals (service unavailable, emergency phone)
   6. CTA click tracking (placeholder)
   7. Dynamic pricing fetch (commented out)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    const navbar = document.querySelector('.navbar');

    /* ---------- 1. Navbar Scroll Effect ---------- */
    const initNavbarScroll = () => {
        if (!navbar) return;

        navbar.style.transition = 'box-shadow 0.3s ease';
        window.addEventListener('scroll', () => {
            navbar.style.boxShadow = window.scrollY > 50
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                : 'none';
        });
    };

    /* ---------- 2. Smooth Scrolling ---------- */
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                if (this.dataset.modal) return;   // handled by initModals

                const targetElement = document.querySelector(targetId);
                if (!targetElement) return;

                e.preventDefault();

                // Highlight the matching navbar link (if this is one)
                if (this.closest('.nav-links')) {
                    document.querySelectorAll('.nav-links a')
                        .forEach(link => link.classList.remove('active'));
                    this.classList.add('active');
                }

                const navbarHeight = navbar ? navbar.offsetHeight : 0;
                const offsetPosition =
                    targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            });
        });
    };

    /* ---------- 3. Testimonial Slider ---------- */
    const initTestimonialSlider = () => {
        const slider = document.querySelector('.testimonial-slider');
        const track = slider && slider.querySelector('.testimonial-track');
        if (!slider || !track) return;

        const cards = Array.from(track.children);
        const controls = document.querySelector('.slider-controls');
        const dotsWrap = document.querySelector('[data-slider-dots]');
        const prevBtn = document.querySelector('[data-slider-prev]');
        const nextBtn = document.querySelector('[data-slider-next]');
        const autoplayDelay = parseInt(slider.dataset.autoplay, 10) || 0;

        let index = 0;
        let step = 0;
        let maxIndex = 0;
        let timer = null;

        const measure = () => {
            const styles = getComputedStyle(track);
            const gap = parseFloat(styles.columnGap || styles.gap) || 0;
            const cardWidth = cards[0].getBoundingClientRect().width;
            const perView = Math.max(
                1,
                Math.round((slider.getBoundingClientRect().width + gap) / (cardWidth + gap))
            );

            step = cardWidth + gap;
            maxIndex = Math.max(0, cards.length - perView);
        };

        const buildDots = () => {
            if (!dotsWrap) return;

            dotsWrap.innerHTML = '';
            for (let i = 0; i <= maxIndex; i++) {
                const dot = document.createElement('button');
                dot.className = 'slider-dot';
                dot.type = 'button';
                dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
                dot.addEventListener('click', () => goTo(i));
                dotsWrap.appendChild(dot);
            }
        };

        const render = () => {
            track.style.transform = `translateX(-${index * step}px)`;

            if (dotsWrap) {
                Array.from(dotsWrap.children).forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
            }
        };

        const goTo = (i, { fromUser = true } = {}) => {
            // Wrap around at both ends so the slider never dead-ends
            if (i < 0) i = maxIndex;
            if (i > maxIndex) i = 0;

            index = i;
            render();
            if (fromUser) restartAutoplay();
        };

        const startAutoplay = () => {
            if (!autoplayDelay || maxIndex === 0) return;
            timer = setInterval(() => goTo(index + 1, { fromUser: false }), autoplayDelay);
        };

        const stopAutoplay = () => {
            clearInterval(timer);
            timer = null;
        };

        const restartAutoplay = () => {
            stopAutoplay();
            startAutoplay();
        };

        const layout = () => {
            measure();
            buildDots();
            if (index > maxIndex) index = maxIndex;

            // Every card already fits on screen - nothing to navigate
            if (controls) controls.hidden = (maxIndex === 0);

            render();
        };

        /* Arrows */
        if (prevBtn) prevBtn.addEventListener('click', () => goTo(index - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goTo(index + 1));

        /* Pause while the visitor is reading or tabbing through */
        slider.addEventListener('mouseenter', stopAutoplay);
        slider.addEventListener('mouseleave', startAutoplay);
        slider.addEventListener('focusin', stopAutoplay);
        slider.addEventListener('focusout', startAutoplay);

        /* Touch / swipe */
        let touchStartX = 0;
        slider.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoplay();
        }, { passive: true });

        slider.addEventListener('touchend', e => {
            const delta = e.changedTouches[0].screenX - touchStartX;
            if (Math.abs(delta) > 50) {
                goTo(delta < 0 ? index + 1 : index - 1);
            } else {
                startAutoplay();
            }
        }, { passive: true });

        /* Recalculate on resize (card widths change per breakpoint) */
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(layout, 150);
        });

        layout();
        // Re-measure once web fonts and the icon stylesheet have settled
        window.addEventListener('load', layout);
        startAutoplay();
    };

    /* ---------- 4. Booking Form ---------- */
    // Google Apps Script Web App URL. Deploy the script in backend/Code.gs and
    // paste the /exec URL it gives you here. See backend/README.md for steps.
    const BOOKING_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzS1iG_NctKgBUamY2TTJ5YBrF58bxTKuifvD0YJfOIQKSWX08ThDV9L1eqTEHtvq7x/exec';

    const initBookingForm = () => {
        const form = document.getElementById('bookingForm');
        if (!form) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const btnLabel = submitBtn.querySelector('.btn-label');
        const status = form.querySelector('.form-status');
        const serviceField = form.querySelector('#service');
        const defaultLabel = btnLabel.textContent;

        const setStatus = (message, type) => {
            status.textContent = message;
            status.className = `form-status is-visible ${type}`;
        };

        const clearStatus = () => {
            status.textContent = '';
            status.className = 'form-status';
        };

        // A call-to-action can preselect the dropdown, e.g. data-service="Yearly Service Plan"
        document.querySelectorAll('[data-service]').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const wanted = trigger.dataset.service;
                const match = Array.from(serviceField.options)
                    .find(option => option.text === wanted);
                if (match) serviceField.value = match.value;
            });
        });

        form.addEventListener('submit', async event => {
            event.preventDefault();
            clearStatus();
            form.classList.add('validated');

            if (!form.checkValidity()) {
                setStatus('Please fill in your name, phone number and the service you need.', 'error');
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            if (BOOKING_ENDPOINT.indexOf('PASTE_') === 0) {
                setStatus('Booking endpoint is not configured yet. See backend/README.md.', 'error');
                return;
            }

            submitBtn.classList.add('is-loading');
            btnLabel.textContent = 'Sending...';

            try {
                // URLSearchParams keeps this a "simple" request, so the browser skips
                // the CORS preflight that Apps Script web apps cannot answer.
                const response = await fetch(BOOKING_ENDPOINT, {
                    method: 'POST',
                    body: new URLSearchParams(new FormData(form))
                });

                const result = await response.json();
                if (!result.ok) throw new Error(result.error || 'Request rejected');

                form.reset();
                form.classList.remove('validated');
                setStatus('Thank you. Your request is booked — we will call you shortly to confirm the slot.', 'success');
            } catch (error) {
                console.error('Booking submit failed:', error);
                setStatus('Sorry, that did not go through. Please call us on +91 9075862702 and we will book it for you.', 'error');
            } finally {
                submitBtn.classList.remove('is-loading');
                btnLabel.textContent = defaultLabel;
            }
        });
    };

    /* ---------- 5. Modals ---------- */
    // Any element with data-modal="<id>" opens the modal with that id instead
    // of following its href. The href stays as a no-JavaScript fallback.
    const initModals = () => {
        const modals = document.querySelectorAll('.modal-overlay');
        if (!modals.length) return;

        let lastFocused = null;

        const close = modal => {
            modal.classList.remove('is-open');
            document.body.style.overflow = '';

            setTimeout(() => { modal.hidden = true; }, 300);
            if (lastFocused) lastFocused.focus();
        };

        const open = modal => {
            lastFocused = document.activeElement;
            modal.hidden = false;
            document.body.style.overflow = 'hidden';

            // Next frame, so the browser animates from the starting state
            requestAnimationFrame(() => modal.classList.add('is-open'));

            const first = modal.querySelector('[data-modal-close]');
            if (first) first.focus();
        };

        document.querySelectorAll('[data-modal]').forEach(trigger => {
            trigger.addEventListener('click', event => {
                const modal = document.getElementById(trigger.dataset.modal);
                if (!modal) return;

                event.preventDefault();
                open(modal);
            });
        });

        modals.forEach(modal => {
            modal.querySelectorAll('[data-modal-close]')
                .forEach(button => button.addEventListener('click', () => close(modal)));

            // Click the dimmed backdrop, but not the card itself
            modal.addEventListener('click', event => {
                if (event.target === modal) close(modal);
            });
        });

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            modals.forEach(modal => { if (!modal.hidden) close(modal); });
        });

        /* Copy-to-clipboard buttons inside modals */
        document.querySelectorAll('[data-copy]').forEach(button => {
            const label = button.querySelector('span');
            const original = label ? label.textContent : '';

            button.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(button.dataset.copy);
                } catch (error) {
                    // Older browsers, or a page not served over https
                    const temp = document.createElement('textarea');
                    temp.value = button.dataset.copy;
                    document.body.appendChild(temp);
                    temp.select();
                    document.execCommand('copy');
                    temp.remove();
                }

                if (!label) return;
                label.textContent = 'Copied';
                setTimeout(() => { label.textContent = original; }, 1800);
            });
        });
    };

    /* ---------- 6. CTA Tracking ---------- */
    // The call-to-action buttons are now real anchor links, so navigation is
    // handled by the browser. Keep this hook to plug in analytics or a lead
    // capture modal (POST /api/v1/bookings) when the backend is ready.
    const initCtaTracking = () => {
        document.querySelectorAll('a.btn').forEach(button => {
            button.addEventListener('click', () => {
                console.log(`CTA clicked: ${button.innerText.trim()}`);
            });
        });
    };

    /* ---------- 7. Dynamic Pricing (optional) ---------- */
    // Uncomment this when the backend API is ready to populate the HTML dynamically
    /*
    fetch('/api/v1/pricing.json')
        .then(response => response.json())
        .then(data => {
            console.log('Pricing data loaded from backend:', data);
            // Logic to inject data.ac_services into the DOM goes here
        })
        .catch(error => console.error('Error loading pricing:', error));
    */

    /* ---------- Init ---------- */
    initNavbarScroll();
    initSmoothScroll();
    initTestimonialSlider();
    initBookingForm();
    initModals();
    initCtaTracking();
});
