# Summit Automotive — website

Website for **Summit Automotive Corporation**, 475 Pavonia Ave, Jersey City, NJ 07306 · (201) 659-5872.
The layout follows the Hudson Toyota "Schedule Service" page: black top bar, red promo strip, an online appointment scheduler and SEO copy underneath.

Plain HTML/CSS/JS, with no build step.

| Page | What's on it |
| --- | --- |
| `index.html` | Hero, quick actions, services, makes serviced, why us, how it works, Google reviews link, hours + map, footer |
| `schedule-service.html` | 5-step scheduler (Vehicle → Services → Date & Time → Contact → Review) with a live summary sidebar |

## Edit shop details

All business info (name, phone, address, hours, map link) lives in **`js/config.js`**, and both pages read from it.
The details came from public directory listings, so confirm them with the shop before launch.

- **Receive appointment requests:** create a free form at [Formspree](https://formspree.io) and set `formEndpoint`.
  Without one, the scheduler opens an email to `email` (if set); if neither is set, it asks the customer to call.
- **Map:** in Google Maps, use Share → Embed a map and paste the `src` URL into `mapEmbedUrl`.
- **Booking times:** these come from `hours` and `slotMinutes`. Same-day slots within the next hour and the last hour before close are hidden.
- **Preselect a service:** link to `schedule-service.html?service=brakes`. Valid ids are listed in `js/schedule.js`.

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

Deploy by uploading the folder to any static host (GitHub Pages, Netlify, Vercel).

## Before launch

- Replace the stock Unsplash photos (`.hero`, `.why-img`, `.sched-hero` in `css/styles.css`) with photos of the shop.
- Add the shop's email.

## Live site (GitHub Pages)

Published at **https://sajansshergill.github.io/summit-automotive/**.
GitHub settings: Settings → Pages → Build and deployment → *Deploy from a branch* → pick the branch with the site and `/ (root)`.
