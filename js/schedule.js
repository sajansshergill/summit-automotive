// Multi-step service scheduler: vehicle → services → date/time → contact → review.
(function () {
  const S = window.SHOP;
  const { DAYS, fmtTime, toMin, telHref } = window.SHOP_UTIL;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const SERVICES = [
    { group: "Maintenance", items: [
      { id: "oil", label: "Oil & filter change" },
      { id: "tuneup", label: "Tune-up" },
      { id: "fluids", label: "Fluid service / flush" },
      { id: "inspection", label: "Multi-point inspection" },
    ]},
    { group: "Tires", items: [
      { id: "tires", label: "New / replacement tires" },
      { id: "flat", label: "Flat tire repair" },
      { id: "rotation", label: "Rotation & balance" },
      { id: "alignment", label: "Wheel alignment" },
    ]},
    { group: "Repairs", items: [
      { id: "brakes", label: "Brakes" },
      { id: "diagnostic", label: "Check engine light / diagnostics" },
      { id: "battery", label: "Battery, starter & alternator" },
      { id: "ac", label: "A/C & heating" },
      { id: "suspension", label: "Suspension & steering" },
      { id: "engine", label: "Engine & transmission" },
      { id: "exhaust", label: "Exhaust & muffler" },
      { id: "other", label: "Something else (describe below)" },
    ]},
  ];
  const SVC_LABEL = Object.fromEntries(SERVICES.flatMap((g) => g.items.map((i) => [i.id, i.label])));

  const form = $("#sched-form");
  const panes = $$(".step-pane");
  const crumbs = $$("#progress li");
  const nextBtn = $("#next");
  const backBtn = $("#back");
  const errEl = $("#step-error");
  const LAST_STEP = 4;
  let step = 0;
  const state = { date: null, time: null };

  // ---------- Build dynamic inputs ----------
  const yearSel = $("#year");
  const thisYear = new Date().getFullYear();
  yearSel.innerHTML = '<option value="">Select year</option>' +
    Array.from({ length: 40 }, (_, i) => `<option>${thisYear + 1 - i}</option>`).join("");

  $("#svc-groups").innerHTML = SERVICES.map((g) => `
    <div class="svc-group">
      <h3>${g.group}</h3>
      <div class="svc-options">
        ${g.items.map((i) => `
          <div class="svc-option">
            <input type="checkbox" name="services" id="svc-${i.id}" value="${i.id}">
            <label for="svc-${i.id}">${i.label}</label>
          </div>`).join("")}
      </div>
    </div>`).join("");

  // Preselect from ?service=brakes
  const pre = new URLSearchParams(location.search).get("service");
  if (pre && SVC_LABEL[pre]) {
    $(`#svc-${pre}`).checked = true;
  }

  // ---------- Dates & slots ----------
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const LEAD_MIN = 60;         // can't book within the next hour
  const CUTOFF_MIN = 60;       // last slot is an hour before closing

  function slotsFor(date) {
    const h = S.hours[date.getDay()];
    if (!h) return [];
    const out = [];
    const now = new Date();
    const nowMin = sameDay(date, now) ? now.getHours() * 60 + now.getMinutes() + LEAD_MIN : -1;
    for (let m = toMin(h[0]); m <= toMin(h[1]) - CUTOFF_MIN; m += S.slotMinutes) {
      out.push({ min: m, disabled: m < nowMin });
    }
    return out;
  }

  function renderDates() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 0; days.length < 21 && i < 40; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      days.push(d);
    }
    $("#dates").innerHTML = days.map((d) => {
      const open = slotsFor(d).some((s) => !s.disabled);
      return `<button type="button" class="date-btn" data-date="${d.toISOString()}" ${open ? "" : "disabled"} role="option">
        <div class="dow">${DAYS[d.getDay()].slice(0, 3)}</div>
        <div class="day">${d.getDate()}</div>
        <div class="mon">${d.toLocaleString("en-US", { month: "short" })}</div>
      </button>`;
    }).join("");
    $$(".date-btn").forEach((b) => b.addEventListener("click", () => selectDate(new Date(b.dataset.date))));
    renderSlots();
  }

  function selectDate(d) {
    state.date = d; state.time = null;
    $$(".date-btn").forEach((b) => b.classList.toggle("selected", sameDay(new Date(b.dataset.date), d)));
    renderSlots(); updateSummary(); errEl.textContent = "";
  }

  function renderSlots() {
    const wrap = $("#slots");
    if (!state.date) {
      wrap.innerHTML = '<p class="empty-note" style="grid-column:1/-1">Select a date above to see available times.</p>';
      return;
    }
    wrap.innerHTML = slotsFor(state.date).map((s) => {
      const t = `${String(Math.floor(s.min / 60)).padStart(2, "0")}:${String(s.min % 60).padStart(2, "0")}`;
      return `<button type="button" class="slot ${state.time === t ? "selected" : ""}" data-time="${t}" ${s.disabled ? "disabled" : ""} role="option">${fmtTime(t)}</button>`;
    }).join("");
    $$(".slot", wrap).forEach((b) => b.addEventListener("click", () => {
      state.time = b.dataset.time;
      $$(".slot", wrap).forEach((x) => x.classList.toggle("selected", x === b));
      updateSummary(); errEl.textContent = "";
    }));
  }

  // ---------- Data & summary ----------
  const val = (id) => $("#" + id).value.trim();
  const selectedServices = () => $$('input[name="services"]:checked').map((c) => SVC_LABEL[c.value]);
  const visitType = () => $('input[name="visitType"]:checked').value;
  const vehicleText = () => [val("year"), val("make"), val("model")].filter(Boolean).join(" ");
  const dateText = () => state.date ? state.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "";

  function updateSummary() {
    $("#sum-vehicle").textContent = vehicleText() || "—";
    const svcs = selectedServices();
    $("#sum-services").textContent = svcs.length ? svcs.join(", ") : "—";
    $("#sum-date").textContent = state.date ? state.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—";
    $("#sum-time").textContent = state.time ? fmtTime(state.time) : "—";
    $("#sum-visit").textContent = visitType();
  }
  form.addEventListener("input", updateSummary);
  form.addEventListener("change", updateSummary);

  // ---------- Validation ----------
  const digits = (s) => s.replace(/\D/g, "");
  function check(id, ok) {
    const f = $("#" + id).closest(".field");
    f.classList.toggle("invalid", !ok);
    return ok;
  }
  function validate(n) {
    errEl.textContent = "";
    if (n === 0) {
      const a = check("year", !!val("year"));
      const b = check("make", !!val("make"));
      const c = check("model", !!val("model"));
      return a && b && c;
    }
    if (n === 1) {
      if (!selectedServices().length && !val("notes")) {
        errEl.textContent = "Choose at least one service or describe what you need.";
        return false;
      }
      return true;
    }
    if (n === 2) {
      if (!state.date || !state.time) {
        errEl.textContent = !state.date ? "Please choose a date." : "Please choose a time.";
        return false;
      }
      return true;
    }
    if (n === 3) {
      const a = check("first", !!val("first"));
      const b = check("last", !!val("last"));
      const p = digits(val("phone"));
      const c = check("phone", p.length === 10 || (p.length === 11 && p[0] === "1"));
      const e = val("email");
      const d = check("email", !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      if (val("contactPref") === "Email" && !e) { check("email", false); return false; }
      return a && b && c && d;
    }
    return true;
  }
  ["year", "make", "model", "first", "last", "phone", "email"].forEach((id) =>
    $("#" + id).addEventListener("input", () => $("#" + id).closest(".field").classList.remove("invalid")));

  // Format phone as (201) 555-0100 while typing
  const fmtPhone = (s) => {
    const d = digits(s).replace(/^1/, "").slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };
  ["phone", "lookup-input"].forEach((id) => $("#" + id).addEventListener("input", (e) => { e.target.value = fmtPhone(e.target.value); }));

  // ---------- Review ----------
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function renderReview() {
    const rows = [
      ["Vehicle", esc(vehicleText()) + (val("mileage") ? ` · ${esc(val("mileage"))} mi` : "") + (val("vin") ? `<br>VIN/Plate: ${esc(val("vin"))}` : ""), 0],
      ["Services", (selectedServices().join(", ") || "See notes") + (val("notes") ? `<br><em>“${esc(val("notes"))}”</em>` : ""), 1],
      ["Appointment", `${dateText()} at ${fmtTime(state.time)} · ${visitType()}`, 2],
      ["Contact", `${esc(val("first"))} ${esc(val("last"))}<br>${esc(val("phone"))}${val("email") ? " · " + esc(val("email")) : ""}<br>Prefers: ${val("contactPref")}`, 3],
    ];
    $("#review-list").innerHTML = rows.map(([h, body, s]) => `
      <div class="review-item">
        <div><h4>${h}</h4><div>${body}</div></div>
        <button type="button" data-goto="${s}">Edit</button>
      </div>`).join("");
    $$("[data-goto]").forEach((b) => b.addEventListener("click", () => go(+b.dataset.goto)));
  }

  // ---------- Navigation ----------
  function go(n) {
    step = n;
    panes.forEach((p) => p.classList.toggle("active", +p.dataset.pane === n));
    crumbs.forEach((c) => {
      const i = +c.dataset.step;
      c.classList.toggle("active", i === n);
      c.classList.toggle("done", i < n);
    });
    backBtn.style.visibility = n === 0 ? "hidden" : "visible";
    nextBtn.textContent = n === LAST_STEP ? "Send Request" : "Continue →";
    $("#step-nav").style.display = n > LAST_STEP ? "none" : "flex";
    errEl.textContent = "";
    if (n === LAST_STEP) renderReview();
    const top = $("#scheduler").getBoundingClientRect().top;
    if (top < 0) $("#scheduler").scrollIntoView({ behavior: "smooth" });
  }
  nextBtn.addEventListener("click", () => {
    if (step === LAST_STEP) return submit();
    if (validate(step)) go(step + 1);
  });
  backBtn.addEventListener("click", () => step > 0 && go(step - 1));

  // Hero "start with phone" box → fill contact phone and jump into the tool
  $("#lookup").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("#lookup-input").value;
    if (v) $("#phone").value = fmtPhone(v);
    $("#scheduler").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => $("#year").focus({ preventScroll: true }), 400);
  });

  // ---------- Submit ----------
  function payload() {
    return {
      vehicle: vehicleText(), mileage: val("mileage"), vin: val("vin"),
      services: selectedServices().join(", "), notes: val("notes"),
      date: dateText(), time: fmtTime(state.time), visitType: visitType(),
      name: `${val("first")} ${val("last")}`, phone: val("phone"), email: val("email"),
      contactPreference: val("contactPref"),
    };
  }
  function asText(p) {
    return [
      `Service appointment request — ${S.name}`, "",
      `Name: ${p.name}`, `Phone: ${p.phone}`, p.email ? `Email: ${p.email}` : null, `Contact by: ${p.contactPreference}`, "",
      `Vehicle: ${p.vehicle}`, p.mileage ? `Mileage: ${p.mileage}` : null, p.vin ? `VIN/Plate: ${p.vin}` : null, "",
      `Services: ${p.services || "(see notes)"}`, p.notes ? `Notes: ${p.notes}` : null, "",
      `Requested: ${p.date} at ${p.time} (${p.visitType})`,
    ].filter((l) => l !== null).join("\n");
  }

  async function submit() {
    const p = payload();
    const when = `${p.date} at ${p.time}`;
    nextBtn.disabled = true;
    try {
      if (S.formEndpoint) {
        const res = await fetch(S.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ _subject: `Service request: ${p.vehicle} — ${when}`, ...p }),
        });
        if (!res.ok) throw new Error("bad status " + res.status);
        $("#done-title").textContent = "Request received!";
        $("#done-msg").textContent = `Thanks, ${val("first")}! We've received your request for ${when}. We'll contact you shortly to confirm. Need to make a change? Call us at ${S.phone}.`;
      } else if (S.email) {
        location.href = `mailto:${S.email}?subject=${encodeURIComponent(`Service request: ${p.vehicle} — ${when}`)}&body=${encodeURIComponent(asText(p))}`;
        $("#done-title").textContent = "Almost done!";
        $("#done-msg").textContent = `Your email app should open with your request filled in — just press send. If it didn't open, call us at ${S.phone} to book ${when}.`;
      } else {
        $("#done-title").textContent = "One last step — give us a call";
        $("#done-msg").textContent = `Online requests aren't connected yet. Please call ${S.phone} to confirm your appointment for ${when} — your appointment details are in the summary on this page.`;
      }
      go(LAST_STEP + 1);
    } catch (err) {
      errEl.textContent = `Sorry, we couldn't send your request. Please call us at ${S.phone}.`;
    } finally {
      nextBtn.disabled = false;
    }
  }

  // ---------- Init ----------
  renderDates();
  updateSummary();
  go(0);
  if (pre && SVC_LABEL[pre]) setTimeout(() => $("#scheduler").scrollIntoView(), 60);
})();
