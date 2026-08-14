/**
 * Soldering Tools Recommender
 * ===========================
 * Data lives in /data/ — edit products.json or compatibility.json to update.
 * Decision tree is in this file under TREE.
 */

let PRODUCTS = [];
let COMPAT = {};
let CONFIG = { formAccessKey: "", siteName: "Soldering Tools Recommender" };
let path = [];
let answers = {};

// ========== DECISION TREE ==========
// Edit labels / next keys / tips arrays here when the flowchart changes.
const TREE = {
  start: {
    q: "What are you looking for?",
    sub: "Choose the main category",
    options: [
      { label: "Tools (Soldering, Hot Air, Flux...)", next: "tools_type", key: "main", val: "tools" },
      { label: "Parts / Fix or build something", next: "parts_type", key: "main", val: "parts" }
    ]
  },
  tools_type: {
    q: "What kind of tool?",
    sub: "Select the category you need",
    options: [
      { label: "Soldering Iron / Station", next: "iron_form", key: "tool", val: "iron" },
      { label: "Hot Air Station", next: "hotair_use", key: "tool", val: "hotair" },
      { label: "Flux", next: "show_flux", key: "tool", val: "flux" },
      { label: "Solder Wire", next: "show_solder", key: "tool", val: "solder" },
      { label: "Desoldering Wick", next: "show_wick", key: "tool", val: "wick" },
      { label: "Tips only", next: "tips_type", key: "tool", val: "tips" },
      { label: "Handles only", next: "handles_type", key: "tool", val: "handles" },
      { label: "Just give me the cheapest options", next: "cheapest", key: "tool", val: "cheapest" }
    ]
  },
  iron_form: {
    q: "Station or Portable?",
    sub: "How do you prefer your soldering tool?",
    options: [
      { label: "Soldering Station (bench)", next: "station_use", key: "form", val: "station" },
      { label: "Portable / Cordless style", next: "portable_use", key: "form", val: "portable" },
      { label: "Classic Iron (900M style)", next: "show_iron_classic", key: "form", val: "iron" },
      { label: "2-in-1 Combo (Iron + Hot Air)", next: "show_combo", key: "form", val: "combo" }
    ]
  },
  station_use: {
    q: "What will you mainly work on?",
    sub: "This determines tip compatibility and power needs",
    options: [
      { label: "General use (through-hole, basic SMD)", next: "rec_station_gen", key: "use", val: "general", tips: ["C245", "T12"] },
      { label: "General use + Microsoldering", next: "rec_station_gen_micro", key: "use", val: "gen_micro", tips: ["C245", "C210"] },
      { label: "Exclusively Microsoldering (phones, fine pitch)", next: "rec_station_micro", key: "use", val: "micro", tips: ["C210", "C115"] },
      { label: "Heavy load (consoles, GPUs, large boards)", next: "rec_station_heavy", key: "use", val: "heavy", tips: ["C470", "C245"] },
      { label: "All-rounder (most flexible)", next: "rec_station_all", key: "use", val: "all", tips: ["C245", "C210", "C115"] }
    ]
  },
  portable_use: {
    q: "What will you mainly work on?",
    sub: "Portable tools have specific tip systems",
    options: [
      { label: "General use", next: "rec_portable_gen", key: "use", val: "general", tips: ["C245", "T12"] },
      { label: "General + Microsoldering", next: "rec_portable_gen_micro", key: "use", val: "gen_micro", tips: ["C210"] },
      { label: "Exclusively Microsoldering", next: "rec_portable_micro", key: "use", val: "micro", tips: ["C115"] }
    ]
  },
  hotair_use: {
    q: "What power level do you need?",
    sub: "Higher power = better for large boards / heavy work",
    options: [
      { label: "Around 1000W (general / phones)", next: "rec_hotair_1000", key: "power", val: "1000" },
      { label: "Over 1000W (consoles, larger boards)", next: "rec_hotair_over1000", key: "power", val: "over1000" },
      { label: "More powerful (over 1300W)", next: "rec_hotair_over1300", key: "power", val: "over1300" },
      { label: "2-in-1 Station (Iron + Hot Air)", next: "show_combo", key: "power", val: "combo" },
      { label: "Cheapest / occasional use", next: "rec_hotair_cheap", key: "power", val: "cheap" }
    ]
  },
  tips_type: {
    q: "Which tip system?",
    sub: "Match the tip to your station/handle",
    options: [
      { label: "C245", next: "show_tips_c245", key: "tip", val: "C245" },
      { label: "C210", next: "show_tips_c210", key: "tip", val: "C210" },
      { label: "C115", next: "show_tips_c115", key: "tip", val: "C115" },
      { label: "T12", next: "show_tips_t12", key: "tip", val: "T12" },
      { label: "900M (classic)", next: "show_tips_900m", key: "tip", val: "900M" },
      { label: "C470", next: "show_tips_c470", key: "tip", val: "C470" }
    ]
  },
  handles_type: {
    q: "Which handle system?",
    sub: "Match the handle to your station",
    options: [
      { label: "T245 / C245", next: "show_handles_c245", key: "handle", val: "C245" },
      { label: "T210 / C210", next: "show_handles_c210", key: "handle", val: "C210" },
      { label: "T115 / C115", next: "show_handles_c115", key: "handle", val: "C115" },
      { label: "T12", next: "show_handles_t12", key: "handle", val: "T12" },
      { label: "T470 / C470", next: "show_handles_c470", key: "handle", val: "C470" }
    ]
  },
  parts_type: {
    q: "What do you want to fix or build?",
    sub: "Select the device / area",
    options: [
      { label: "Consoles (Joystick, HDMI, Modding)", next: "parts_console_menu", key: "part", val: "consoles" },
      { label: "Phones", next: "show_fix_phones", key: "part", val: "phones" },
      { label: "Laptop", next: "show_fix_laptop", key: "part", val: "laptop" },
      { label: "FPV", next: "show_fix_fpv", key: "part", val: "fpv" },
      { label: "GPU", next: "show_fix_gpu", key: "part", val: "gpu" },
      { label: "Microcontrollers", next: "show_fix_mcu", key: "part", val: "mcu" }
    ]
  },
  parts_console_menu: {
    q: "Console repair — what do you need?",
    sub: "Joystick, HDMI port, or modding parts",
    options: [
      { label: "Joystick / Analog stick", next: "parts_console", key: "console_part", val: "joystick" },
      { label: "HDMI Port", next: "parts_hdmi", key: "console_part", val: "hdmi" },
      { label: "Switch Modding (Picofly etc.)", next: "show_modding", key: "console_part", val: "modding" }
    ]
  },
  parts_console: {
    q: "Which console?",
    sub: "Joystick / stick replacement — includes soldering tools + special tips",
    options: [
      { label: "PS5", next: "show_joystick_ps5", key: "console", val: "PS5" },
      { label: "PS4", next: "show_joystick_ps4", key: "console", val: "PS4" },
      { label: "Xbox", next: "show_joystick_xbox", key: "console", val: "XBOX" },
      { label: "Switch / Switch Pro", next: "show_joystick_switch", key: "console", val: "Switch" },
      { label: "Show all joysticks", next: "show_joystick_all", key: "console", val: "all" }
    ]
  },
  parts_hdmi: {
    q: "Which console HDMI?",
    sub: "HDMI port replacement — includes soldering tools",
    options: [
      { label: "PS5", next: "show_hdmi_ps5", key: "console", val: "PS5" },
      { label: "PS4", next: "show_hdmi_ps4", key: "console", val: "PS4" },
      { label: "Xbox", next: "show_hdmi_xbox", key: "console", val: "XBOX" },
      { label: "Show all HDMI", next: "show_hdmi_all", key: "console", val: "all" }
    ]
  }
};

// ========== LOAD DATA ==========
// products.json  = stable catalog (brand, model, power, ESD…)
// links.json     = links + images (update often — affiliate links expire)
// compatibility.json = tip system codes
async function loadData() {
  const area = document.getElementById("question-area");
  area.innerHTML = `<div class="loading">Loading product database…</div>`;

  try {
    const [prodRes, compatRes, linksRes, configRes] = await Promise.all([
      fetch("data/products.json"),
      fetch("data/compatibility.json"),
      fetch("data/links.json"),
      fetch("data/config.json")
    ]);
    if (!prodRes.ok) throw new Error("Failed to load products.json");
    if (!compatRes.ok) throw new Error("Failed to load compatibility.json");
    if (!linksRes.ok) throw new Error("Failed to load links.json");
    // config is optional
    if (configRes.ok) {
      CONFIG = { ...CONFIG, ...(await configRes.json()) };
    }

    const products = await prodRes.json();
    COMPAT = await compatRes.json();
    const links = await linksRes.json();

    // Merge link + image from links.json into each product
    PRODUCTS = products.map(p => {
      const extra = links[String(p.id)] || {};
      return {
        ...p,
        link: extra.link || "",
        image: extra.image || ""
      };
    });

    renderQuestion("start");
  } catch (err) {
    area.innerHTML = `<div class="error-box">
      <strong>Could not load data files.</strong><br>
      Make sure you serve this folder with a local web server (not file://).<br>
      Example: <code>python3 -m http.server 8080</code> then open http://localhost:8080<br><br>
      ${err.message}
    </div>`;
  }
}

// ========== HELPERS ==========
function parsePower(p) {
  if (!p) return 0;
  const m = String(p).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function filterProducts(pred) {
  return PRODUCTS.filter(pred);
}

function bySub(...subs) {
  return filterProducts(p => p.category === "tools" && subs.includes(p.sub_category));
}

function tipsByCompat(...codes) {
  const set = new Set(codes.map(c => c.toUpperCase()));
  return filterProducts(p => {
    if (p.sub_category !== "tips") return false;
    if ((p.model || "").toLowerCase() === "joystick") return false; // special tips handled separately
    const m = (p.model || "").toUpperCase();
    return [...set].some(c => m.includes(c));
  });
}

function handlesByCompat(...codes) {
  const set = new Set(codes.map(c => c.toUpperCase()));
  return filterProducts(p => {
    if (p.sub_category !== "handles") return false;
    const m = (p.model || "").toUpperCase();
    const mapped = m.replace(/^T/, "C");
    return [...set].some(c => m.includes(c) || mapped.includes(c));
  });
}

function stationsCompatibleWith(tipCodes) {
  return filterProducts(p => {
    if (p.sub_category !== "station") return false;
    const comp = COMPAT[String(p.compatibility)] || [];
    return tipCodes.some(t =>
      comp.map(x => x.toUpperCase()).includes(t.toUpperCase())
    );
  });
}

function portablesCompatibleWith(tipCodes) {
  return filterProducts(p => {
    if (p.sub_category !== "portable") return false;
    const comp = COMPAT[String(p.compatibility)] || [];
    return tipCodes.some(t =>
      comp.map(x => x.toUpperCase()).includes(t.toUpperCase())
    );
  });
}

/** Special joystick tips (brand = console name, model = Joystick) */
function joystickTips(consoleKey) {
  return filterProducts(p => {
    if (p.sub_category !== "tips") return false;
    if ((p.model || "").toLowerCase() !== "joystick") return false;
    if (consoleKey === "all") return true;
    const brand = (p.brand || "").toUpperCase();
    if (consoleKey === "Switch") {
      return brand.includes("SWITCH");
    }
    return brand === consoleKey.toUpperCase() || brand.includes(consoleKey.toUpperCase());
  });
}

/** Joystick parts for a console */
function joystickParts(consoleKey) {
  return filterProducts(p => {
    if (p.category !== "parts") return false;
    if (!(p.compatibility || "").toUpperCase().includes("JOYSTICK")) return false;
    if (consoleKey === "all") return true;
    const sub = (p.sub_category || "").toUpperCase();
    if (consoleKey === "Switch") {
      return sub.includes("SWITCH");
    }
    return sub === consoleKey.toUpperCase() || sub.includes(consoleKey.toUpperCase());
  });
}

function hdmiParts(consoleKey) {
  return filterProducts(p => {
    if (p.category !== "parts") return false;
    if (!(p.compatibility || "").toUpperCase().includes("HDMI")) return false;
    if (consoleKey === "all") return true;
    const sub = (p.sub_category || "").toUpperCase();
    return sub === consoleKey.toUpperCase() || sub.includes(consoleKey.toUpperCase());
  });
}

// ========== RENDER ==========
function renderQuestion(nodeKey) {
  const node = TREE[nodeKey];
  if (!node) {
    showResults(nodeKey);
    return;
  }

  const area = document.getElementById("question-area");
  const results = document.getElementById("results");
  results.classList.remove("active");
  area.style.display = "block";

  let html = `<div class="card">
    <div class="question-title">${node.q}</div>
    <div class="question-sub">${node.sub || ""}</div>
    <div class="options">`;

  node.options.forEach((opt, i) => {
    html += `<button class="option-btn" onclick="choose('${nodeKey}', ${i})">
      <span class="num">${i + 1}</span>
      <span>${opt.label}</span>
    </button>`;
  });

  html += `</div>
    <div class="nav-buttons">
      ${path.length > 0 ? '<button class="btn btn-secondary" onclick="goBack()">← Back</button>' : ""}
    </div>
  </div>`;

  area.innerHTML = html;
  updateBreadcrumb();
  updateProgress();
  document.getElementById("restartBtn").classList.toggle("visible", path.length > 0);
}

function choose(nodeKey, idx) {
  const node = TREE[nodeKey];
  const opt = node.options[idx];
  path.push({ node: nodeKey, label: opt.label });
  answers[opt.key] = opt.val;
  if (opt.tips) answers.tips = opt.tips;

  if (TREE[opt.next]) {
    renderQuestion(opt.next);
  } else {
    showResults(opt.next);
  }
}

function goBack() {
  if (path.length === 0) return;
  path.pop();
  answers = {};
  let current = "start";
  for (const p of path) {
    const node = TREE[current];
    const opt = node.options.find(o => o.label === p.label);
    if (opt) {
      answers[opt.key] = opt.val;
      if (opt.tips) answers.tips = opt.tips;
      current = opt.next;
    }
  }
  if (path.length === 0) {
    renderQuestion("start");
  } else {
    let cur = "start";
    for (const p of path) {
      const node = TREE[cur];
      const opt = node.options.find(o => o.label === p.label);
      if (opt) cur = opt.next;
    }
    if (TREE[cur]) renderQuestion(cur);
    else showResults(cur);
  }
}

function updateBreadcrumb() {
  const el = document.getElementById("breadcrumb");
  if (path.length === 0) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = path
    .map(
      (p, i) =>
        `<span class="crumb ${i === path.length - 1 ? "current" : ""}">${p.label}</span>`
    )
    .join("");
}

function updateProgress() {
  const pct = Math.min(5 + path.length * 18, 95);
  document.getElementById("progress").style.width = pct + "%";
}

/** Category emoji + label fallbacks (always work offline). Optional p.image = real photo URL. */
const CATEGORY_META = {
  station:  { emoji: "🖥️", label: "Station" },
  portable: { emoji: "✍️", label: "Portable" },
  iron:     { emoji: "🔥", label: "Iron" },
  tips:     { emoji: "📍", label: "Tip" },
  handles:  { emoji: "🔧", label: "Handle" },
  hotair:   { emoji: "💨", label: "Hot Air" },
  combo:    { emoji: "📦", label: "Combo" },
  wick:     { emoji: "🧵", label: "Wick" },
  pump:     { emoji: "💉", label: "Pump" },
  flux:     { emoji: "🧴", label: "Flux" },
  solder:   { emoji: "🪙", label: "Solder" },
  default:  { emoji: "🔩", label: "Part" }
};

function getCategoryMeta(p) {
  if (p.category === "parts") {
    const c = (p.compatibility || "").toUpperCase();
    if (c.includes("JOYSTICK")) return { emoji: "🎮", label: "Joystick" };
    if (c.includes("HDMI")) return { emoji: "🔌", label: "HDMI" };
    if (c.includes("MODDING")) return { emoji: "🧩", label: "Modding" };
    return CATEGORY_META.default;
  }
  const key = (p.sub_category || "").toLowerCase();
  return CATEGORY_META[key] || CATEGORY_META.default;
}

function getProductThumb(p) {
  const meta = getCategoryMeta(p);
  const fallback = `<div class="product-icon" data-fallback>
      <span class="icon-emoji">${meta.emoji}</span>
      <span class="icon-label-text">${meta.label}</span>
    </div>`;

  if (p.image) {
    // Real photo when URL is set; falls back to emoji icon if image fails to load
    return `<img src="${p.image}" alt="${meta.label}" class="product-img" loading="lazy"
      onerror="this.style.display='none'; const fb=this.parentElement.querySelector('[data-fallback]'); if(fb) fb.style.display='flex';">
      ${fallback.replace('data-fallback', 'data-fallback style="display:none"')}`;
  }
  return fallback;
}

function productCard(p) {
  const name = [p.brand, p.model].filter(Boolean).join(" ");
  const powerTag = p.power
    ? `<div class="product-meta"><span class="tag power">${p.power}</span></div>`
    : "";
  return `<div class="product-card">
    <div class="product-thumb">
      ${getProductThumb(p)}
    </div>
    <div class="product-body">
      <div class="product-brand">${p.brand || "—"}</div>
      <div class="product-name">${name || p.sub_category}</div>
      ${powerTag}
      ${
        p.link
          ? `<a class="product-link" href="${p.link}" target="_blank" rel="noopener">View on AliExpress →</a>`
          : ""
      }
    </div>
  </div>`;
}

function section(title, items, note) {
  if (!items || items.length === 0) {
    return `<div class="section-title">${title}</div><div class="empty-msg">No matching products found.</div>`;
  }
  let html = `<div class="section-title">${title} <span style="color:var(--muted);font-weight:400;font-size:0.9rem">(${items.length})</span></div>`;
  if (note) html += `<div class="note">${note}</div>`;
  html += `<div class="product-grid">${items.map(productCard).join("")}</div>`;
  return html;
}

function alwaysRecommendExtras() {
  return (
    section("Recommended Flux", bySub("flux")) +
    section("Recommended Solder", bySub("solder")) +
    section("Recommended Wick", bySub("wick"))
  );
}

/** Soldering recommendations for joystick path: 900M first, C245/T12 stations & portables. No extra tips/handles. */
function solderingForJoystick() {
  const stations = stationsCompatibleWith(["C245", "T12"]);
  const portables = portablesCompatibleWith(["C245", "T12"]);
  const classicIrons = bySub("iron"); // 900M style — shown first
  stations.sort((a, b) => parsePower(a.power) - parsePower(b.power));
  portables.sort((a, b) => parsePower(a.power) - parsePower(b.power));

  let html = "";
  html += section(
    "Classic Irons (900M style)",
    classicIrons,
    "Budget option — often enough for joystick module work."
  );
  html += section(
    "Recommended Soldering Stations (C245 / T12)",
    stations.slice(0, 8),
    "C245 / T12 compatible. Good for joystick pads and small boards."
  );
  html += section(
    "Recommended Portable Irons (C245 / T12)",
    portables.slice(0, 6),
    "Portable options if you prefer something compact."
  );
  return html;
}

/** Soldering recommendations for HDMI / modding (includes tips & handles). */
function solderingForRepair() {
  const tips = ["C245", "T12", "900M"];
  const stations = stationsCompatibleWith(["C245", "T12"]);
  const portables = portablesCompatibleWith(["C245", "T12"]);
  const classicIrons = bySub("iron");
  stations.sort((a, b) => parsePower(a.power) - parsePower(b.power));
  portables.sort((a, b) => parsePower(a.power) - parsePower(b.power));

  let html = "";
  html += section(
    "Classic Irons (900M style)",
    classicIrons,
    "Budget option for controller / console board work."
  );
  html += section(
    "Recommended Soldering Stations (C245 / T12)",
    stations.slice(0, 8),
    "C245 / T12 compatible."
  );
  html += section(
    "Recommended Portable Irons (C245 / T12)",
    portables.slice(0, 6)
  );
  html += section("Recommended Tips (C245 + T12 + 900M)", tipsByCompat(...tips));
  html += section("Recommended Handles (C245 / T12)", handlesByCompat("C245", "T12"));
  return html;
}

// ========== RESULT HANDLERS ==========
function showResults(key) {
  document.getElementById("question-area").style.display = "none";
  const res = document.getElementById("results");
  res.classList.add("active");
  document.getElementById("progress").style.width = "100%";
  document.getElementById("restartBtn").classList.add("visible");
  updateBreadcrumb();

  let html = "";

  switch (key) {
    // --- STATIONS ---
    case "rec_station_gen": {
      const tips = ["C245", "T12"];
      html += section(
        "Recommended Stations (General use – C245 + T12)",
        stationsCompatibleWith(tips),
        "Compatible with C245 and T12 tip systems. Good for everyday through-hole and basic SMD."
      );
      html += section("Recommended Tips (C245 + T12)", tipsByCompat(...tips));
      html += section("Recommended Handles", handlesByCompat(...tips));
      html += alwaysRecommendExtras();
      break;
    }
    case "rec_station_gen_micro": {
      const tips = ["C245", "C210"];
      html += section("Recommended Stations (General + Microsoldering)", stationsCompatibleWith(tips));
      html += section("Recommended Tips (C245 + C210)", tipsByCompat(...tips));
      html += section("Recommended Handles", handlesByCompat(...tips));
      html += alwaysRecommendExtras();
      break;
    }
    case "rec_station_micro": {
      // Stations that support C115 (any combo including C115); tips only C210 + C115; no T245 handles
      const stations = filterProducts(p => {
        if (p.sub_category !== "station") return false;
        const comp = (COMPAT[String(p.compatibility)] || []).map(x => x.toUpperCase());
        return comp.includes("C115");
      });
      html += section(
        "Recommended Stations (Exclusive Microsoldering – C115)",
        stations,
        "Stations that support C115 (and combinations with C115). Best for fine-pitch work on phones and small boards."
      );
      html += section("Recommended Tips (C210 + C115 only)", tipsByCompat("C210", "C115"));
      html += section(
        "Recommended Handles (C210 / C115 — no T245)",
        handlesByCompat("C210", "C115", "T210", "T115")
      );
      html += alwaysRecommendExtras();
      break;
    }
    case "rec_station_heavy": {
      // Tips only C245 + C470; stations only ~400W
      const stations = filterProducts(p => {
        if (p.sub_category !== "station") return false;
        const w = parsePower(p.power);
        return w >= 350; // ~400W class
      });
      stations.sort((a, b) => parsePower(b.power) - parsePower(a.power));
      html += section(
        "Recommended Stations (Heavy load – ~400W)",
        stations,
        "Higher power stations for consoles, GPUs and large boards."
      );
      html += section("Recommended Tips (C245 + C470 only)", tipsByCompat("C245", "C470"));
      html += section("Recommended Handles (C245 / C470)", handlesByCompat("C245", "C470", "T245", "T470"));
      html += alwaysRecommendExtras();
      break;
    }
    case "rec_station_all": {
      const tips = ["C245", "C210", "C115"];
      html += section("Recommended Stations (All-rounder)", stationsCompatibleWith(tips));
      html += section("Recommended Tips (C245 + C210 + C115)", tipsByCompat(...tips));
      html += section("Recommended Handles", handlesByCompat(...tips));
      html += alwaysRecommendExtras();
      break;
    }

    // --- PORTABLES ---
    case "rec_portable_gen": {
      const tips = ["C245", "T12"];
      html += section("Recommended Portable Irons (General – C245 / T12)", portablesCompatibleWith(tips));
      html += section("Recommended Tips", tipsByCompat(...tips));
      html += alwaysRecommendExtras();
      break;
    }
    case "rec_portable_gen_micro": {
      const tips = ["C210"];
      html += section("Recommended Portable Irons (General + Micro – C210)", portablesCompatibleWith(tips));
      html += section("Recommended Tips (C210)", tipsByCompat(...tips));
      html += alwaysRecommendExtras();
      break;
    }
    case "rec_portable_micro": {
      const tips = ["C115"];
      html += section("Recommended Portable Irons (Exclusive Micro – C115)", portablesCompatibleWith(tips));
      html += section("Recommended Tips (C115)", tipsByCompat(...tips));
      html += alwaysRecommendExtras();
      break;
    }

    // --- HOT AIR ---
    case "rec_hotair_1000": {
      const items = bySub("hotair").filter(p => {
        const w = parsePower(p.power);
        return w >= 900 && w <= 1100;
      });
      html += section("Hot Air Stations (~1000W)", items, "Good balance for phones, small boards and general rework.");
      html += alwaysRecommendExtras();
      break;
    }
    case "rec_hotair_over1000": {
      const items = bySub("hotair").filter(p => parsePower(p.power) > 1000);
      items.sort((a, b) => parsePower(b.power) - parsePower(a.power));
      html += section("Hot Air Stations (Over 1000W)", items, "Better for consoles, larger boards and faster heat-up.");
      html += alwaysRecommendExtras();
      break;
    }
    case "rec_hotair_over1300": {
      const items = bySub("hotair").filter(p => parsePower(p.power) > 1300);
      items.sort((a, b) => parsePower(b.power) - parsePower(a.power));
      html += section("Hot Air Stations (More powerful – over 1300W)", items);
      html += alwaysRecommendExtras();
      break;
    }
    case "rec_hotair_cheap": {
      const items = bySub("hotair").slice().sort((a, b) => parsePower(a.power) - parsePower(b.power));
      html += section(
        "Hot Air – Lowest power / cheapest first",
        items.slice(0, 8),
        "Lower power units. Fine for occasional use; may struggle with large boards."
      );
      html += alwaysRecommendExtras();
      break;
    }

    // --- COMBO / CLASSIC ---
    case "show_combo": {
      html += section(
        "2-in-1 Combo Stations (Iron + Hot Air)",
        bySub("combo"),
        "⚠️ Many combo units are marked ESD: danger. Prefer separate quality station + hot air for serious work."
      );
      html += alwaysRecommendExtras();
      break;
    }
    case "show_iron_classic": {
      html += section(
        "Classic Soldering Irons (900M style)",
        bySub("iron"),
        "⚠️ Often ESD: danger. Cheap and simple, but not ideal for sensitive electronics."
      );
      html += section("900M Tips", tipsByCompat("900M"));
      html += alwaysRecommendExtras();
      break;
    }

    // --- TIPS ---
    case "show_tips_c245":
      html += section("C245 Tips", tipsByCompat("C245"));
      break;
    case "show_tips_c210":
      html += section("C210 Tips", tipsByCompat("C210"));
      break;
    case "show_tips_c115":
      html += section("C115 Tips", tipsByCompat("C115"));
      break;
    case "show_tips_t12":
      html += section("T12 Tips", tipsByCompat("T12"));
      break;
    case "show_tips_900m":
      html += section("900M Tips", tipsByCompat("900M"));
      break;
    case "show_tips_c470":
      html += section("C470 Tips", tipsByCompat("C470"));
      break;

    // --- HANDLES ---
    case "show_handles_c245":
      html += section("Handles for C245 / T245", handlesByCompat("C245", "T245"));
      break;
    case "show_handles_c210":
      html += section("Handles for C210 / T210", handlesByCompat("C210", "T210"));
      break;
    case "show_handles_c115":
      html += section("Handles for C115 / T115", handlesByCompat("C115", "T115"));
      break;
    case "show_handles_t12":
      html += section("Handles for T12", handlesByCompat("T12"));
      break;
    case "show_handles_c470":
      html += section("Handles for C470 / T470", handlesByCompat("C470", "T470"));
      break;

    // --- CONSUMABLES ---
    case "show_flux":
      html += section("All Flux", bySub("flux"));
      break;
    case "show_solder":
      html += section("All Solder", bySub("solder"));
      break;
    case "show_wick":
      html += section("All Desoldering Wick", bySub("wick"));
      break;

    // --- CHEAPEST ---
    case "cheapest": {
      html += `<div class="note">Cheapest-oriented picks. Many have weaker ESD ratings. Fine if you only need the tool once or for non-sensitive work.</div>`;
      html += section("Portable (examples)", bySub("portable").slice(0, 6));
      html += section("Stations (examples)", bySub("station").slice(0, 6));
      html += section("Classic Irons", bySub("iron"));
      html += section("2-in-1 Combos", bySub("combo"));
      html += alwaysRecommendExtras();
      break;
    }

    // --- JOYSTICK (parts + soldering tools + special tips) ---
    // No regular tips/handles — only special joystick tips + irons (900M first)
    case "show_joystick_ps5":
    case "show_joystick_ps4":
    case "show_joystick_xbox":
    case "show_joystick_switch":
    case "show_joystick_all": {
      const consoleMap = {
        show_joystick_ps5: "PS5",
        show_joystick_ps4: "PS4",
        show_joystick_xbox: "XBOX",
        show_joystick_switch: "Switch",
        show_joystick_all: "all"
      };
      const consoleKey = consoleMap[key];
      const title =
        consoleKey === "all"
          ? "All Joystick Modules"
          : `${consoleKey} Joystick Modules`;

      html += section(
        title,
        joystickParts(consoleKey),
        "Replacement analog sticks / modules. TMR and Hall-effect options where available."
      );
      html += section(
        `Special Soldering Tips for ${consoleKey === "all" ? "Joysticks" : consoleKey + " Joysticks"}`,
        joystickTips(consoleKey),
        "Please ensure the chosen tips is compatible with the iron (900m, C245, T12)."
      );
      html += solderingForJoystick();
      html += section("Desoldering Pumps", bySub("pump"));
      html += alwaysRecommendExtras();
      break;
    }

    // --- HDMI: parts first → hot air → C245+C210 irons (no 900M) ---
    case "show_hdmi_ps5":
    case "show_hdmi_ps4":
    case "show_hdmi_xbox":
    case "show_hdmi_all": {
      const consoleMap = {
        show_hdmi_ps5: "PS5",
        show_hdmi_ps4: "PS4",
        show_hdmi_xbox: "XBOX",
        show_hdmi_all: "all"
      };
      const consoleKey = consoleMap[key];
      const title =
        consoleKey === "all" ? "All HDMI Ports" : `${consoleKey} HDMI Ports`;

      // 1. Parts first
      html += section(title, hdmiParts(consoleKey));

      // 2. Hot air
      const hotair = bySub("hotair").filter(p => parsePower(p.power) >= 1000);
      hotair.sort((a, b) => parsePower(b.power) - parsePower(a.power));
      html += section(
        "Hot Air (for HDMI port removal / install)",
        hotair,
        "Hot air is commonly used to remove and install HDMI ports."
      );

      // 3. C245 + C210 irons only (no 900M)
      const tips = ["C245", "C210"];
      const stations = stationsCompatibleWith(tips);
      const portables = portablesCompatibleWith(tips);
      stations.sort((a, b) => parsePower(a.power) - parsePower(b.power));
      portables.sort((a, b) => parsePower(a.power) - parsePower(b.power));
      html += section("Recommended Stations (C245 + C210)", stations);
      html += section("Recommended Portable Irons (C245 + C210)", portables);
      html += section("Recommended Tips (C245 + C210)", tipsByCompat(...tips));
      html += section("Recommended Handles (C245 / C210)", handlesByCompat("C245", "C210", "T245", "T210"));
      html += alwaysRecommendExtras();
      break;
    }

    case "show_modding":
      html += section(
        "Switch Modding (Picofly etc.)",
        filterProducts(
          p =>
            p.category === "parts" &&
            (p.compatibility || "").toUpperCase().includes("MODDING")
        )
      );
      html += solderingForRepair();
      html += alwaysRecommendExtras();
      break;

    // --- PHONES: microsoldering focus (C115 stations, C210+C115 tips) ---
    case "show_fix_phones": {
      const stations = filterProducts(p => {
        if (p.sub_category !== "station") return false;
        const comp = (COMPAT[String(p.compatibility)] || []).map(x => x.toUpperCase());
        return comp.includes("C115");
      });
      const portables = portablesCompatibleWith(["C115", "C210"]);
      html += section(
        "Recommended Stations (phone / microsoldering – C115)",
        stations,
        "Stations that support C115 for fine-pitch phone work."
      );
      html += section("Recommended Portable Irons", portables.slice(0, 6));
      html += section("Recommended Tips (C210 + C115)", tipsByCompat("C210", "C115"));
      html += section("Recommended Handles (C210 / C115)", handlesByCompat("C210", "C115", "T210", "T115"));
      const hotair = bySub("hotair").filter(p => parsePower(p.power) >= 900 && parsePower(p.power) <= 1200);
      html += section("Hot Air (~1000W – phones / small boards)", hotair);
      html += alwaysRecommendExtras();
      break;
    }

    // --- LAPTOP: general + microsoldering ---
    case "show_fix_laptop": {
      const tips = ["C245", "C210"];
      const stations = stationsCompatibleWith(tips);
      const portables = portablesCompatibleWith(tips);
      html += section(
        "Recommended Stations (laptop – C245 + C210)",
        stations,
        "General + microsoldering for laptop boards and connectors."
      );
      html += section("Recommended Portable Irons", portables.slice(0, 6));
      html += section("Recommended Tips (C245 + C210)", tipsByCompat(...tips));
      html += section("Recommended Handles", handlesByCompat("C245", "C210", "T245", "T210"));
      const hotair = bySub("hotair").filter(p => parsePower(p.power) >= 1000);
      hotair.sort((a, b) => parsePower(b.power) - parsePower(a.power));
      html += section("Hot Air (over 1000W – useful for BGA / large parts)", hotair.slice(0, 8));
      html += alwaysRecommendExtras();
      break;
    }

    // --- FPV: portable + tips (no handles) ---
    case "show_fix_fpv": {
      const tips = ["C245", "T12"];
      const portables = portablesCompatibleWith(tips);
      const stations = stationsCompatibleWith(tips);
      portables.sort((a, b) => parsePower(b.power) - parsePower(a.power));
      html += section(
        "Recommended Portable Irons (FPV – C245 / T12)",
        portables,
        "Portable tools are handy for FPV builds and field repairs."
      );
      html += section("Recommended Stations (if you prefer a bench setup)", stations.slice(0, 6));
      html += section("Recommended Tips (C245 + T12)", tipsByCompat(...tips));
      html += alwaysRecommendExtras();
      break;
    }

    // --- GPU: 200W + ~400W stations (no portables) + hot air + C245/C210 ---
    case "show_fix_gpu": {
      const stations = filterProducts(p => {
        if (p.sub_category !== "station") return false;
        const w = parsePower(p.power);
        return w >= 180; // include 200W and 400W class
      });
      stations.sort((a, b) => parsePower(b.power) - parsePower(a.power));
      html += section(
        "Recommended Stations (GPU – 200W and ~400W)",
        stations,
        "200W and higher power stations for large ground planes and GPU work."
      );
      html += section("Recommended Tips (C245 + C210)", tipsByCompat("C245", "C210"));
      html += section("Recommended Handles (C245 / C210)", handlesByCompat("C245", "C210", "T245", "T210"));
      const hotair = bySub("hotair").filter(p => parsePower(p.power) > 1000);
      hotair.sort((a, b) => parsePower(b.power) - parsePower(a.power));
      html += section("Hot Air (over 1000W – GPU / large boards)", hotair);
      html += alwaysRecommendExtras();
      break;
    }

    // --- MICROCONTROLLERS: general + light micro (Arduino, ESP, etc.) ---
    case "show_fix_mcu": {
      const tips = ["C245", "T12", "C210"];
      const stations = stationsCompatibleWith(["C245", "T12", "C210"]);
      const portables = portablesCompatibleWith(["C245", "T12", "C210"]);
      html += section(
        "Recommended Stations (microcontrollers – C245 / T12 / C210)",
        stations,
        "Good for Arduino, ESP32, Pico, and similar boards — through-hole and fine SMD."
      );
      html += section("Recommended Portable Irons", portables.slice(0, 8));
      html += section("Recommended Tips (C245 + T12 + C210)", tipsByCompat(...tips));
      html += section("Recommended Handles", handlesByCompat("C245", "T12", "C210", "T245", "T210"));
      html += alwaysRecommendExtras();
      break;
    }

    default:
      html += `<div class="card"><p>No specific recommendations for this path yet.</p></div>`;
  }

  html += `<div class="nav-buttons" style="margin-top:32px">
    <button class="btn btn-secondary" onclick="goBack()">← Back</button>
    <button class="btn btn-primary" onclick="restart()">Start Over</button>
  </div>`;

  res.innerHTML = html;
}

function restart() {
  path = [];
  answers = {};
  document.getElementById("results").classList.remove("active");
  document.getElementById("results").innerHTML = "";
  showMain();
  renderQuestion("start");
}

// ========== ABOUT / CONTACT ==========
function showMain() {
  document.getElementById("main-view").style.display = "block";
  document.getElementById("about-view").style.display = "none";
  document.getElementById("navHome").classList.add("active");
  document.getElementById("navAbout").classList.remove("active");
}

function showAbout() {
  document.getElementById("main-view").style.display = "none";
  document.getElementById("about-view").style.display = "block";
  document.getElementById("navHome").classList.remove("active");
  document.getElementById("navAbout").classList.add("active");
  document.getElementById("restartBtn").classList.remove("visible");
  // reset form status
  const st = document.getElementById("contact-status");
  if (st) {
    st.hidden = true;
    st.textContent = "";
  }
}

async function submitContact(e) {
  e.preventDefault();
  const status = document.getElementById("contact-status");
  const btn = e.target.querySelector('button[type="submit"]');
  const name = (document.getElementById("contact-name").value || "").trim();
  const email = (document.getElementById("contact-email").value || "").trim();
  const message = (document.getElementById("contact-message").value || "").trim();

  // Only an access key is stored in the site files.
  // The destination email is configured on the Web3Forms dashboard and is never shown to the sender.
  const accessKey = (CONFIG.formAccessKey || "").trim();
  if (!accessKey || accessKey === "YOUR_WEB3FORMS_ACCESS_KEY") {
    status.hidden = false;
    status.className = "contact-status err";
    status.textContent = "Contact form is not configured yet. Please try again later.";
    return;
  }

  btn.disabled = true;
  status.hidden = false;
  status.className = "contact-status";
  status.textContent = "Sending…";

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `[${CONFIG.siteName || "Recommender"}] Message from ${name}`,
        name,
        email,
        message,
        from_name: CONFIG.siteName || "Soldering Tools Recommender"
      })
    });
    const data = await res.json();
    if (data.success) {
      status.className = "contact-status ok";
      status.textContent = "Message sent. Thank you!";
      document.getElementById("contact-form").reset();
    } else {
      throw new Error(data.message || "Send failed");
    }
  } catch (err) {
    status.className = "contact-status err";
    status.textContent = "Could not send the message. Please try again later.";
  } finally {
    btn.disabled = false;
  }
}

// Boot
loadData();
