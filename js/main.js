// Shared behaviour for every page: fills in shop details from config.js,
// renders hours / open-now status, and handles the mobile nav.
(function () {
  const S = window.SHOP;
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const fmtTime = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return m ? `${h12}:${String(m).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
  };
  const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const fullAddress = `${S.address.street}, ${S.address.city}, ${S.address.state} ${S.address.zip}`;
  const telHref = "tel:" + S.phone.replace(/[^\d+]/g, "");

  window.SHOP_UTIL = { DAYS, fmtTime, toMin, fullAddress, telHref };

  // Text bindings: <span data-shop="name"></span>
  const values = {
    name: S.name,
    tagline: S.tagline,
    phone: S.phone,
    email: S.email,
    address: fullAddress,
    street: S.address.street,
    city: S.address.city,
    cityline: `${S.address.city}, ${S.address.state} ${S.address.zip}`,
    legalName: S.legalName,
    neighborhood: S.neighborhood,
    since: S.since,
    years: String(new Date().getFullYear() - Number(S.since)),
    year: String(new Date().getFullYear()),
  };
  document.querySelectorAll("[data-shop]").forEach((el) => {
    const v = values[el.dataset.shop];
    if (v != null) el.textContent = v;
  });
  // Hide anything that needs an email when none is configured.
  if (!S.email) document.querySelectorAll("[data-needs-email]").forEach((el) => el.remove());

  document.querySelectorAll("[data-shop-href]").forEach((el) => {
    const k = el.dataset.shopHref;
    if (k === "phone") el.href = telHref;
    if (k === "email") el.href = "mailto:" + S.email;
    if (k === "maps") { el.href = S.mapsUrl; el.target = "_blank"; el.rel = "noopener"; }
  });
  document.title = document.title.replace("{name}", S.name);

  // Hours table
  document.querySelectorAll("[data-hours-table]").forEach((table) => {
    const today = new Date().getDay();
    const order = [1, 2, 3, 4, 5, 6, 0];
    table.innerHTML = order.map((d) => {
      const h = S.hours[d];
      const txt = h ? `${fmtTime(h[0])} – ${fmtTime(h[1])}` : "Closed";
      return `<tr class="${d === today ? "today" : ""}"><td>${DAYS[d]}</td><td>${txt}</td></tr>`;
    }).join("");
  });

  // Open-now status
  document.querySelectorAll("[data-open-now]").forEach((el) => {
    const now = new Date();
    const h = S.hours[now.getDay()];
    const mins = now.getHours() * 60 + now.getMinutes();
    if (h && mins >= toMin(h[0]) && mins < toMin(h[1])) {
      el.textContent = `Open now · until ${fmtTime(h[1])}`;
    } else {
      el.classList.add("closed");
      // Find next opening
      for (let i = 0; i < 8; i++) {
        const d = (now.getDay() + i) % 7;
        const nh = S.hours[d];
        if (!nh) continue;
        if (i === 0 && mins >= toMin(nh[0])) continue;
        el.textContent = `Closed · opens ${i === 0 ? "today" : i === 1 ? "tomorrow" : DAYS[d]} ${fmtTime(nh[0])}`;
        break;
      }
    }
  });

  // Map embed
  document.querySelectorAll("[data-map]").forEach((frame) => {
    frame.src = S.mapEmbedUrl ||
      "https://www.google.com/maps?output=embed&q=" + encodeURIComponent(`${S.name}, ${fullAddress}`);
  });

  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));
  }
})();
