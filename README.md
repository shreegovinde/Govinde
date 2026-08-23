# Shree Govind Enterprise

Marketing website for Shree Govind Enterprise — AC installation, maintenance and home
appliance repair services in Thane.

Static site: plain HTML, CSS and vanilla JavaScript. No build step, no dependencies,
nothing to install.

**Live:** https://shreegovinde.github.io/Govinde/

## Project structure

```
.
├── index.html              # The whole site - one page
├── assets/
│   ├── css/style.css       # CSS variables at the top, responsive rules at the bottom
│   ├── js/script.js        # Navbar, smooth scroll, slider, booking form, modals
│   └── images/
│       ├── ac-technician.jpg   # Hero photo
│       ├── og-preview.jpg      # 1200x630 card shown when the link is shared
│       └── favicon.svg         # Browser tab icon
├── backend/                # Does NOT run on the website - see below
│   ├── Code.gs             # Google Apps Script that receives booking submissions
│   └── README.md           # One-time setup steps for it
├── .nojekyll               # Tells GitHub Pages to serve the files as-is
└── README.md
```

## Running locally

```bash
python -m http.server 8000
```

Then visit http://localhost:8000 — no filename needed, the server finds `index.html`.

## Publishing

Hosted on GitHub Pages from the `main` branch, root folder (**Settings → Pages**).
Push to `main` and the site updates within a minute.

Only `index.html` and `assets/` are needed to render the site. `backend/` is committed
for version control; it is inert as far as the website is concerned.

**Moving to a custom domain later:** add the domain under Settings → Pages, then update
the two absolute URLs in the `og:` meta tags at the top of `index.html`.

> Anything committed here is public and permanent, including in git history.
> Never commit a password, API key, or Google Sheet ID.

## Page sections

| Section      | Anchor          | Notes                                              |
| ------------ | --------------- | -------------------------------------------------- |
| Hero         | `#home`         | CTAs: Book a Service, Emergency Support             |
| Services     | `#services`     | Four service cards                                  |
| Pricing      | `#pricing`      | Three plans, middle card highlighted                |
| Testimonials | `#testimonials` | Auto-sliding carousel, 3 cards per view on desktop  |
| Booking      | `#contact`      | Request form, saves to a Google Sheet               |

## Call-to-action links

All buttons are anchor tags (`<a class="btn ...">`) so they work with keyboard
navigation, right-click and "open in new tab".

`Schedule Service` and `Book a Service` scroll to `#contact`. To change the phone
number, update every `tel:` link in `index.html`.

## Booking form

Submissions are saved to a Google Sheet and emailed, via a Google Apps Script Web App.
There is no server and no database file in this repo.

Setup is a one-time job — see [backend/README.md](backend/README.md). The deployed
endpoint URL lives in `BOOKING_ENDPOINT` in `assets/js/script.js`.

That URL is public, which is fine: it is write-only and cannot read the Sheet.

## Testimonial slider

Markup is in the `#testimonials` section; behaviour is `initTestimonialSlider()` in
`assets/js/script.js`.

- Autoplay interval: `data-autoplay="5000"` on `.testimonial-slider` (remove to disable)
- Cards per view: the `--per-view` CSS variable, overridden per breakpoint (3 → 2 → 1)
- Autoplay pauses on hover and keyboard focus; arrows, dots and swipe all work
- Controls hide themselves when every card already fits on screen

To add one, copy an `<article class="testimonial-card">` block — the dots and slide
count update automatically.

## Modals

Any element with `data-modal="<id>"` opens the modal with that id instead of following
its `href`, which stays as a no-JavaScript fallback.

| Trigger | Opens |
| --- | --- |
| Emergency Support | `#phoneModal` — number, copy button, WhatsApp |
| Get Started (yearly plan) | `#serviceModal` — plan paused notice |

To put the yearly plan back on sale, delete `data-modal="serviceModal"` from its button.

## Notes

- `initCtaTracking()` in `script.js` is a hook point for analytics
- A commented-out `fetch()` example for dynamic pricing sits at the bottom of that file
- The testimonials are placeholder text — replace them with real customer words
