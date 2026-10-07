/*
 * Shop details — edit this file to update the whole site.
 * Every page reads from here, so name/phone/address/hours only live in one place.
 * Sourced from public directory listings; confirm with the shop before launch.
 */
window.SHOP = {
  name: "Summit Automotive",
  legalName: "Summit Automotive Corporation",
  tagline: "Domestic & foreign auto repair and tire center in Jersey City since 1979.",
  phone: "(201) 659-5872",
  email: "", // optional — add the shop's email to show it on the site
  address: {
    street: "475 Pavonia Ave",
    city: "Jersey City",
    state: "NJ",
    zip: "07306",
  },
  neighborhood: "Journal Square / Hilltop",
  mapsUrl: "https://maps.app.goo.gl/X7ZNKKRz1Ky8YvQc8",
  // Google Maps embed: Maps > Share > Embed a map > copy the src="" URL.
  // Leave empty to fall back to a search embed built from the address.
  mapEmbedUrl: "",
  // 0 = Sunday ... 6 = Saturday. null = closed. Times in 24h "HH:MM".
  hours: {
    0: null,
    1: ["08:00", "16:00"],
    2: ["08:00", "16:00"],
    3: ["08:00", "16:00"],
    4: ["08:00", "16:00"],
    5: ["08:00", "16:00"],
    6: null,
  },
  // Appointment slot length in minutes for the scheduler.
  slotMinutes: 30,
  // Optional: a form endpoint (e.g. Formspree "https://formspree.io/f/xxxx").
  // If empty, the scheduler opens the visitor's email app (when email is set)
  // or shows the request summary with a call button.
  formEndpoint: "",
  since: "1979",
};
