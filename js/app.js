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
      { label: "Spot Welder", next: "spotwelder_type", key: "tool", val: "spotwelder" },
      { label: "Measurement Tools", next: "measure_type", key: "tool", val: "measure" },
      { label: "Power Supplies", next: "psu_voltage", key: "tool", val: "psu" },
      { label: "Flux", next: "show_flux", key: "tool", val: "flux" },
      { label: "Solder Wire", next: "show_solder", key: "tool", val: "solder" },
      { label: "Desoldering Wick", next: "show_wick", key: "tool", val: "wick" },
      { label: "Tips only", next: "tips_type", key: "tool", val: "tips" },
      { label: "Handles only", next: "handles_type", key: "tool", val: "handles" },
      { label: "Just give me the cheapest options", next: "cheapest", key: "tool", val: "cheapest" }
    ]
  },
  // --- Spot Welder ---
  spotwelder_type: {
    q: "Spot welder — what do you need?",
    sub: "Machine or nickel strips for battery packs",
    options: [
      { label: "Spot Welder Machine", next: "show_spotwelder", key: "spot", val: "machine" },
      { label: "Nickel Strips / Tape", next: "show_stripes", key: "spot", val: "stripes" }
    ]
  },
  // --- Measurement Tools ---
  measure_type: {
    q: "What measurement tool?",
    sub: "Multimeters, scopes, milliohm meters and more",
    options: [
      { label: "Multimeter", next: "show_multimeter", key: "measure", val: "multimeter" },
      { label: "Oscilloscope", next: "show_oscilloscope", key: "measure", val: "oscilloscope" },
      { label: "Milliohm / Microohm meter", next: "show_milliohm", key: "measure", val: "milliohm" },
      { label: "Battery Tester", next: "show_battery_tester", key: "measure", val: "battery_tester" },
      { label: "LCR Meter", next: "show_lcr", key: "measure", val: "lcr" },
      { label: "Component Tester / ESR", next: "show_component_tester", key: "measure", val: "component" },
      { label: "Show all measurement tools", next: "show_measure_all", key: "measure", val: "all" }
    ]
  },
  // --- Power Supplies (filter by voltage then current) ---
  psu_voltage: {
    q: "Power supply — voltage range?",
    sub: "Choose the maximum voltage you need",
    options: [
      { label: "Up to 30V", next: "psu_current_30", key: "psu_v", val: "30" },
      { label: "Up to 60V", next: "psu_current_60", key: "psu_v", val: "60" },
      { label: "Higher / adjustable (60V+)", next: "psu_current_high", key: "psu_v", val: "high" },
      { label: "Show all power supplies", next: "show_psu_all", key: "psu_v", val: "all" }
    ]
  },
  psu_current_30: {
    q: "Current (Amps) for ≤30V supplies?",
    sub: "Higher current is better for motors, high-power loads",
    options: [
      { label: "Up to 5A", next: "show_psu_30_5", key: "psu_a", val: "5" },
      { label: "5–10A", next: "show_psu_30_10", key: "psu_a", val: "10" },
      { label: "Over 10A", next: "show_psu_30_high", key: "psu_a", val: "high" },
      { label: "Any current (all ≤30V)", next: "show_psu_30_all", key: "psu_a", val: "all" }
    ]
  },
  psu_current_60: {
    q: "Current (Amps) for ≤60V supplies?",
    sub: "Higher current is better for motors, high-power loads",
    options: [
      { label: "Up to 5A", next: "show_psu_60_5", key: "psu_a", val: "5" },
      { label: "5–10A", next: "show_psu_60_10", key: "psu_a", val: "10" },
      { label: "Over 10A", next: "show_psu_60_high", key: "psu_a", val: "high" },
      { label: "Any current (all ≤60V)", next: "show_psu_60_all", key: "psu_a", val: "all" }
    ]
  },
  psu_current_high: {
    q: "Current for higher-voltage supplies?",
    sub: "60V and above",
    options: [
      { label: "Up to 5A", next: "show_psu_high_5", key: "psu_a", val: "5" },
      { label: "5–10A", next: "show_psu_high_10", key: "psu_a", val: "10" },
      { label: "Over 10A", next: "show_psu_high_high", key: "psu_a", val: "high" },
      { label: "Any current", next: "show_psu_high_all", key: "psu_a", val: "all" }
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
      { label: "Consoles", next: "parts_console_select", key: "part", val: "consoles" },
      { label: "Batteries / Battery packs", next: "show_batteries", key: "part", val: "batteries" },
      { label: "Phones", next: "show_fix_phones", key: "part", val: "phones" },
      { label: "Laptop", next: "show_fix_laptop", key: "part", val: "laptop" },
      { label: "FPV", next: "show_fix_fpv", key: "part", val: "fpv" },
      { label: "GPU", next: "show_fix_gpu", key: "part", val: "gpu" },
      { label: "Microcontrollers", next: "show_fix_mcu", key: "part", val: "mcu" }
    ]
  },
  // Console first → then what you need (Joystick / HDMI / Other / Modding)
  parts_console_select: {
    q: "Which console?",
    sub: "All parts for that console are shown together",
    options: [
      { label: "PS5", next: "show_console_ps5", key: "console", val: "PS5" },
      { label: "PS4", next: "show_console_ps4", key: "console", val: "PS4" },
      { label: "Xbox", next: "show_console_xbox", key: "console", val: "XBOX" },
      { label: "Game Boy / GBA", next: "show_console_gameboy", key: "console", val: "GameBoy" },
      { label: "Other consoles", next: "show_console_other", key: "console", val: "Other" }
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

/** Any category by sub_category (tools, measure, psu, parts…) */
function bySubAny(...subs) {
  return filterProducts(p => subs.includes(p.sub_category));
}

/**
 * Power supply filter.
 * Products should use sub_category = "psu".
 * Put voltage/current in the `power` field, e.g. "30V 5A", "0-60V 10A", "30V/5A".
 * This parser is tolerant of common formats.
 */
function parsePsuSpec(p) {
  const text = `${p.power || ""} ${p.model || ""} ${p.brand || ""}`.toUpperCase();
  let volts = 0;
  let amps = 0;
  const vMatch = text.match(/(\d+)\s*V/);
  const aMatch = text.match(/(\d+(?:\.\d+)?)\s*A/);
  if (vMatch) volts = parseInt(vMatch[1], 10);
  if (aMatch) amps = parseFloat(aMatch[1]);
  return { volts, amps };
}

function psuFilter(maxVolts, minAmps, maxAmps) {
  return filterProducts(p => {
    if (p.sub_category !== "psu") return false;
    const { volts, amps } = parsePsuSpec(p);
    // If no numbers found, still show the product (better than hiding everything)
    if (!volts && !amps) return true;
    if (maxVolts != null && volts > maxVolts) return false;
    if (minAmps != null && amps > 0 && amps < minAmps) return false;
    if (maxAmps != null && amps > maxAmps) return false;
    return true;
  });
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

/** Other console parts: buttons, flex, capacitors, etc. */
function otherConsoleParts(consoleKey) {
  return filterProducts(p => {
    if (p.category !== "parts") return false;
    const compat = (p.compatibility || "").toUpperCase();
    const isOther =
      compat.includes("OTHER") ||
      compat.includes("BUTTON") ||
      compat.includes("FLEX") ||
      compat.includes("CAP") ||
      compat.includes("CAPACITOR") ||
      compat.includes("SCREEN") ||
      compat.includes("MEMBRANE");
    if (!isOther) return false;
    if (consoleKey === "all") return true;
    const sub = (p.sub_category || "").toUpperCase();
    if (consoleKey === "Switch") return sub.includes("SWITCH");
    if (consoleKey === "GameBoy" || consoleKey === "GAMEBOY") {
      return sub.includes("GAMEBOY") || sub.includes("GAME BOY") || sub === "GB" || sub === "GBA";
    }
    if (consoleKey === "Other" || consoleKey === "OTHER") {
      const main = ["PS5", "PS4", "XBOX", "SWITCH", "GAMEBOY", "GAME BOY", "GB", "GBA"];
      return !main.some(m => sub === m || sub.includes(m));
    }
    return sub === consoleKey.toUpperCase() || sub.includes(consoleKey.toUpperCase());
  });
}

function gameboyParts(kind) {
  return filterProducts(p => {
    if (p.category !== "parts") return false;
    const sub = (p.sub_category || "").toUpperCase();
    if (!(sub.includes("GAMEBOY") || sub.includes("GAME BOY") || sub === "GB" || sub === "GBA")) return false;
    if (kind === "all") return true;
    const compat = (p.compatibility || "").toUpperCase();
    const model = (p.model || "").toUpperCase();
    if (kind === "screen") {
      return compat.includes("SCREEN") || model.includes("IPS") || model.includes("SCREEN");
    }
    if (kind === "buttons") {
      return compat.includes("BUTTON") || compat.includes("MEMBRANE");
    }
    return true;
  });
}

function otherConsoleBucketParts(kind) {
  return filterProducts(p => {
    if (p.category !== "parts") return false;
    const sub = (p.sub_category || "").toUpperCase();
    const main = ["PS5", "PS4", "XBOX", "SWITCH", "GAMEBOY", "GAME BOY", "GB", "GBA"];
    if (main.some(m => sub === m || sub.includes(m))) return false;
    if (kind === "all") return true;
    const compat = (p.compatibility || "").toUpperCase();
    if (kind === "joystick") return compat.includes("JOYSTICK");
    if (kind === "other") {
      return (
        compat.includes("OTHER") ||
        compat.includes("BUTTON") ||
        compat.includes("FLEX") ||
        compat.includes("CAP") ||
        compat.includes("CAPACITOR") ||
        compat.includes("SCREEN")
      );
    }
    return true;
  });
}

/** Generic other electronic parts (not console-specific) */
function otherParts() {
  return filterProducts(p => {
    if (p.category !== "parts") return false;
    const sub = (p.sub_category || "").toLowerCase();
    const compat = (p.compatibility || "").toUpperCase();
    return (
      sub === "other" ||
      compat.includes("OTHER") ||
      compat.includes("BUTTON") ||
      compat.includes("FLEX") ||
      compat.includes("CAP") ||
      compat.includes("CAPACITOR")
    );
  });
}

function batteryProducts() {
  return filterProducts(p => p.sub_category === "battery" || (p.compatibility || "").toUpperCase().includes("BATTERY"));
}


/** All parts for one or more console sub_categories */
function consolePartsBySub(...subs) {
  const want = new Set(subs.map(s => s.toUpperCase()));
  return filterProducts(p => {
    if (p.category !== "parts") return false;
    const sub = (p.sub_category || "").toUpperCase();
    if (want.has(sub)) return true;
    // Game Boy aliases
    if (want.has("GAMEBOY") && (sub.includes("GAMEBOY") || sub === "GB" || sub === "GBA")) return true;
    return false;
  });
}

/** Parts for "other" consoles (not PS5/PS4/XBOX/GameBoy/Switch) */
function otherConsolesParts() {
  const main = ["PS5", "PS4", "XBOX", "SWITCH", "GAMEBOY", "GAME BOY", "GB", "GBA"];
  return filterProducts(p => {
    if (p.category !== "parts") return false;
    const sub = (p.sub_category || "").toUpperCase();
    if (!sub) return false;
    // exclude pure battery / generic other kits that aren't consoles
    if (sub === "BATTERY" || sub === "OTHER") return false;
    return !main.some(m => sub === m || sub.includes(m));
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

/** Rebuild answers from current path and return the node key to show next */
function rebuildFromPath() {
  answers = {};
  let current = "start";
  for (const p of path) {
    const node = TREE[current];
    if (!node) break;
    const opt = node.options.find(o => o.label === p.label);
    if (!opt) break;
    answers[opt.key] = opt.val;
    if (opt.tips) answers.tips = opt.tips;
    current = opt.next;
  }
  return current;
}

function goBack() {
  if (path.length === 0) return;
  path.pop();
  const current = rebuildFromPath();
  if (path.length === 0) {
    renderQuestion("start");
  } else if (TREE[current]) {
    renderQuestion(current);
  } else {
    showResults(current);
  }
}

/** Jump to a previous step: keep choices before index, re-open that menu */
function jumpToStep(index) {
  // index -1 = home (start)
  if (index < -1) return;
  if (index === -1) {
    path = [];
    answers = {};
    document.getElementById("results").classList.remove("active");
    document.getElementById("results").innerHTML = "";
    renderQuestion("start");
    return;
  }
  if (index >= path.length) return;
  // Truncate to choices before this crumb → reopen the question for this crumb
  const targetNode = path[index].node;
  path = path.slice(0, index);
  rebuildFromPath();
  document.getElementById("results").classList.remove("active");
  document.getElementById("results").innerHTML = "";
  if (TREE[targetNode]) {
    renderQuestion(targetNode);
  } else {
    renderQuestion("start");
  }
}

function updateBreadcrumb() {
  const el = document.getElementById("breadcrumb");
  if (path.length === 0) {
    el.innerHTML = "";
    return;
  }
  const home = `<button type="button" class="crumb crumb-btn" onclick="jumpToStep(-1)">Home</button>`;
  const crumbs = path
    .map((p, i) => {
      const isLast = i === path.length - 1;
      const label = p.label.length > 36 ? p.label.slice(0, 34) + "…" : p.label;
      if (isLast) {
        return `<span class="crumb current">${label}</span>`;
      }
      return `<button type="button" class="crumb crumb-btn" onclick="jumpToStep(${i})" title="${p.label.replace(/"/g, "&quot;")}">${label}</button>`;
    })
    .join(`<span class="crumb-sep">›</span>`);
  el.innerHTML = home + `<span class="crumb-sep">›</span>` + crumbs;
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

/** Return list of tip system codes for a product (e.g. ["C245","C210"]) */
function getCompatibleTipsList(p) {
  const code = String(p.compatibility || "").trim();
  if (!code) return [];
  if (/joystick|hdmi|modding/i.test(code)) return [];
  const mapped = COMPAT[code];
  if (mapped && mapped.length) {
    return mapped.map(t => String(t).toUpperCase());
  }
  const model = (p.model || "").toUpperCase();
  if (/^(C|T)\d+|900M/.test(model)) return [model];
  return [];
}

let activeTipFilter = null;

function filterByTip(tip) {
  tip = String(tip || "").toUpperCase();
  // Toggle off if same tip clicked again
  if (activeTipFilter === tip) {
    clearTipFilter();
    return;
  }
  activeTipFilter = tip;

  const cards = document.querySelectorAll(".product-card[data-tips]");
  cards.forEach(card => {
    const tips = (card.getAttribute("data-tips") || "")
      .split(",")
      .map(t => t.trim().toUpperCase())
      .filter(Boolean);
    // Cards with no tip data (flux, wick…) stay visible but dimmed lightly
    if (!tips.length) {
      card.classList.add("tip-dimmed");
      card.classList.remove("tip-match");
      return;
    }
    if (tips.includes(tip)) {
      card.classList.remove("tip-dimmed");
      card.classList.add("tip-match");
    } else {
      card.classList.add("tip-dimmed");
      card.classList.remove("tip-match");
    }
  });

  // Highlight active tip buttons
  document.querySelectorAll(".tag.tips[data-tip]").forEach(btn => {
    btn.classList.toggle("tip-active", btn.getAttribute("data-tip") === tip);
  });

  updateTipFilterBar();
}

function clearTipFilter() {
  activeTipFilter = null;
  document.querySelectorAll(".product-card").forEach(card => {
    card.classList.remove("tip-dimmed", "tip-match");
  });
  document.querySelectorAll(".tag.tips").forEach(btn => {
    btn.classList.remove("tip-active");
  });
  updateTipFilterBar();
}

function updateTipFilterBar() {
  let bar = document.getElementById("tip-filter-bar");
  if (!activeTipFilter) {
    if (bar) bar.remove();
    return;
  }
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "tip-filter-bar";
    bar.className = "tip-filter-bar";
    const results = document.getElementById("results");
    if (results && results.firstChild) {
      results.insertBefore(bar, results.firstChild);
    } else if (results) {
      results.appendChild(bar);
    }
  }
  bar.innerHTML = `
    <span>Showing products compatible with <strong>${activeTipFilter}</strong></span>
    <button type="button" class="btn btn-secondary btn-sm" onclick="clearTipFilter()">Clear filter</button>
  `;
}

function productCard(p) {
  const name = [p.brand, p.model].filter(Boolean).join(" ");
  const tipList = getCompatibleTipsList(p);
  const tags = [];
  if (p.power) tags.push(`<span class="tag power">${p.power}</span>`);
  if (p.price) tags.push(`<span class="tag price">${p.price}</span>`);
  tipList.forEach(t => {
    tags.push(
      `<button type="button" class="tag tips${activeTipFilter === t ? " tip-active" : ""}" data-tip="${t}" onclick="filterByTip('${t}')" title="Filter by ${t}">${t}</button>`
    );
  });
  const meta = tags.length
    ? `<div class="product-meta">${tags.join("")}</div>`
    : "";
  const dataTips = tipList.length ? ` data-tips="${tipList.join(",")}"` : "";
  return `<div class="product-card"${dataTips}>
    <div class="product-thumb">
      ${getProductThumb(p)}
    </div>
    <div class="product-body">
      <div class="product-brand">${p.brand || p.sub_category || ""}</div>
      <div class="product-name">${name || p.model || p.sub_category}</div>
      ${meta}
      ${
        p.link
          ? `<a class="product-link" href="${p.link}" target="_blank" rel="noopener">More Details →</a>`
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
  activeTipFilter = null;
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

    // --- OTHER CONSOLE PARTS (buttons, flex, caps…) ---
    case "show_other_ps5":
    case "show_other_ps4":
    case "show_other_xbox":
    case "show_other_switch":
    case "show_other_all": {
      const consoleMap = {
        show_other_ps5: "PS5",
        show_other_ps4: "PS4",
        show_other_xbox: "XBOX",
        show_other_switch: "Switch",
        show_other_all: "all"
      };
      const consoleKey = consoleMap[key];
      const title =
        consoleKey === "all"
          ? "Other Console Parts (buttons, flex, capacitors…)"
          : `${consoleKey} — Other Parts (buttons, flex, capacitors…)`;
      html += section(title, otherConsoleParts(consoleKey));
      html += solderingForRepair();
      html += alwaysRecommendExtras();
      break;
    }

    // --- GAME BOY ---
    case "show_other_gameboy":
      html += section(
        "Game Boy — Buttons, membranes & other parts",
        gameboyParts("all").filter(p => {
          const c = (p.compatibility || "").toUpperCase();
          const m = (p.model || "").toUpperCase();
          return !(c.includes("SCREEN") || m.includes("IPS") || m.includes("SCREEN"));
        })
      );
      html += solderingForRepair();
      break;
    case "show_screen_gameboy":
      html += section("Game Boy — Screen / IPS kits", gameboyParts("screen"));
      html += solderingForRepair();
      break;
    case "show_gameboy_all":
      html += section("All Game Boy parts", gameboyParts("all"));
      html += solderingForRepair();
      html += alwaysRecommendExtras();
      break;

    // --- OTHER CONSOLES (Dreamcast, PSP, Wii, etc.) ---
    case "show_joystick_other":
      html += section("Other consoles — Joysticks", otherConsoleBucketParts("joystick"));
      html += solderingForJoystick();
      break;
    case "show_other_otherconsole":
      html += section("Other consoles — Parts (buttons, flex, caps…)", otherConsoleBucketParts("other"));
      html += solderingForRepair();
      break;
    case "show_otherconsole_all":
      html += section("All other-console parts", otherConsoleBucketParts("all"));
      html += solderingForRepair();
      html += alwaysRecommendExtras();
      break;

    // --- GENERIC OTHER PARTS ---
    case "show_other_parts":
      html += section(
        "Other Parts (capacitors, buttons, flex cables…)",
        otherParts(),
        "Generic replacement parts. Use console-specific paths for PS5/PS4/Xbox/Switch parts."
      );
      html += alwaysRecommendExtras();
      break;

    // --- BATTERIES (includes recommended spot welder gear) ---
    case "show_batteries":
      html += section(
        "Batteries / Cells (Li-ion examples)",
        batteryProducts(),
        "Example Li-ion and pack cells. Always follow safe charging and handling practices."
      );
      html += section(
        "Recommended: Spot Welder Machines",
        bySubAny("spotwelder"),
        "Spot welders are commonly used to build / repair battery packs with nickel strips."
      );
      html += section("Nickel Strips / Tape", bySubAny("stripes"));
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

    // ========== SPOT WELDER ==========
    case "show_spotwelder":
      html += section(
        "Spot Welder Machines",
        bySubAny("spotwelder"),
        "Battery pack / nickel-strip spot welders. Check pulse power and electrode quality."
      );
      html += section(
        "Recommended: Nickel Strips / Tape",
        bySubAny("stripes"),
        "Use pure nickel strips with the spot welder for battery packs."
      );
      break;
    case "show_stripes":
      html += section(
        "Nickel Strips / Tape",
        bySubAny("stripes"),
        "Pure nickel or nickel-plated strips for battery packs (18650, etc.)."
      );
      break;
    case "show_spotflux":
      html += section(
        "Flux for Spot Welding / Battery Work",
        bySubAny("spotflux", "flux"),
        "Flux that helps with nickel strip soldering or cleaning before welding."
      );
      break;

    // ========== MEASUREMENT TOOLS ==========
    case "show_multimeter":
      html += section("Multimeters", bySubAny("multimeter"), "Digital multimeters for voltage, current, resistance, continuity.");
      break;
    case "show_oscilloscope":
      html += section("Oscilloscopes", bySubAny("oscilloscope"), "Portable and benchtop scopes for signal debugging.");
      break;
    case "show_milliohm":
      html += section(
        "Milliohm / Microohm Meters",
        bySubAny("milliohm"),
        "Low-resistance meters — useful for battery internal resistance, PCB traces, contacts."
      );
      break;
    case "show_battery_tester":
      html += section(
        "Battery Testers",
        bySubAny("battery_tester"),
        "Internal resistance / capacity testers for Li-ion, NiMH and other cells."
      );
      break;
    case "show_lcr":
      html += section("LCR Meters", bySubAny("lcr"), "Measure inductance, capacitance and resistance accurately.");
      break;
    case "show_component_tester":
      html += section(
        "Component Testers / ESR Meters",
        bySubAny("component"),
        "Transistor / capacitor / ESR testers — handy for quick checks."
      );
      break;
    case "show_measure_all":
      html += section("Multimeters", bySubAny("multimeter"));
      html += section("Oscilloscopes", bySubAny("oscilloscope"));
      html += section("Milliohm / Microohm Meters", bySubAny("milliohm"));
      html += section("Battery Testers", bySubAny("battery_tester"));
      html += section("LCR Meters", bySubAny("lcr"));
      html += section("Component Testers", bySubAny("component"));
      break;

    // ========== POWER SUPPLIES ==========
    case "show_psu_all":
      html += section(
        "All Power Supplies",
        bySubAny("psu"),
        "Tip: put voltage & current in the power column (e.g. \"30V 5A\") so filters work better."
      );
      break;
    case "show_psu_30_5":
      html += section("Power Supplies ≤30V, up to ~5A", psuFilter(30, null, 5));
      break;
    case "show_psu_30_10":
      html += section("Power Supplies ≤30V, 5–10A", psuFilter(30, 5, 10));
      break;
    case "show_psu_30_high":
      html += section("Power Supplies ≤30V, over 10A", psuFilter(30, 10, null));
      break;
    case "show_psu_30_all":
      html += section("All Power Supplies ≤30V", psuFilter(30, null, null));
      break;
    case "show_psu_60_5":
      html += section("Power Supplies ≤60V, up to ~5A", psuFilter(60, null, 5));
      break;
    case "show_psu_60_10":
      html += section("Power Supplies ≤60V, 5–10A", psuFilter(60, 5, 10));
      break;
    case "show_psu_60_high":
      html += section("Power Supplies ≤60V, over 10A", psuFilter(60, 10, null));
      break;
    case "show_psu_60_all":
      html += section("All Power Supplies ≤60V", psuFilter(60, null, null));
      break;
    case "show_psu_high_5":
      html += section("Higher-voltage PSUs (60V+), up to ~5A", filterProducts(p => {
        if (p.sub_category !== "psu") return false;
        const { volts, amps } = parsePsuSpec(p);
        if (!volts) return true;
        return volts > 60 && (amps === 0 || amps <= 5);
      }));
      break;
    case "show_psu_high_10":
      html += section("Higher-voltage PSUs (60V+), 5–10A", filterProducts(p => {
        if (p.sub_category !== "psu") return false;
        const { volts, amps } = parsePsuSpec(p);
        if (!volts) return true;
        return volts > 60 && amps >= 5 && amps <= 10;
      }));
      break;
    case "show_psu_high_high":
      html += section("Higher-voltage PSUs (60V+), over 10A", filterProducts(p => {
        if (p.sub_category !== "psu") return false;
        const { volts, amps } = parsePsuSpec(p);
        if (!volts) return true;
        return volts > 60 && amps > 10;
      }));
      break;
    case "show_psu_high_all":
      html += section("All higher-voltage Power Supplies (60V+)", filterProducts(p => {
        if (p.sub_category !== "psu") return false;
        const { volts } = parsePsuSpec(p);
        return !volts || volts > 60;
      }));
      break;

    // --- SIMPLE CONSOLE PAGES (all parts for that console) ---
    case "show_console_ps5":
      html += section("PS5 parts", consolePartsBySub("PS5"));
      html += solderingForRepair();
      html += alwaysRecommendExtras();
      break;
    case "show_console_ps4":
      html += section("PS4 parts", consolePartsBySub("PS4"));
      html += solderingForRepair();
      html += alwaysRecommendExtras();
      break;
    case "show_console_xbox":
      html += section("Xbox parts", consolePartsBySub("XBOX"));
      html += solderingForRepair();
      html += alwaysRecommendExtras();
      break;
    case "show_console_gameboy":
      html += section("Game Boy / GBA parts", consolePartsBySub("GameBoy", "GB", "GBA"));
      html += solderingForRepair();
      html += alwaysRecommendExtras();
      break;
    case "show_console_other":
      html += section("Other consoles (PSP, NES, etc.)", otherConsolesParts());
      html += solderingForRepair();
      html += alwaysRecommendExtras();
      break;


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
  activeTipFilter = null;
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



// ========== SEARCH ==========
let searchTimer = null;

function onSearchInput(e) {
  const q = (e.target.value || "").trim();
  const clearBtn = document.getElementById("searchClear");
  if (clearBtn) clearBtn.hidden = !q;
  clearTimeout(searchTimer);
  if (!q) {
    // don't auto-restart on every delete; only clear results if showing search
    return;
  }
  searchTimer = setTimeout(() => runSearch(q), 150);
}

function onSearchKey(e) {
  if (e.key === "Escape") {
    clearSearch();
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    clearTimeout(searchTimer);
    runSearch((e.target.value || "").trim());
  }
}

function clearSearch() {
  const input = document.getElementById("siteSearch");
  if (input) input.value = "";
  const clearBtn = document.getElementById("searchClear");
  if (clearBtn) clearBtn.hidden = true;
  showMain();
  restart();
}

function searchProducts(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  return PRODUCTS.filter(p => {
    const hay = [
      p.brand, p.model, p.sub_category, p.category,
      p.power, p.price, p.compatibility, String(p.id)
    ].map(x => (x || "").toLowerCase()).join(" ");
    return tokens.every(t => hay.includes(t));
  });
}

function runSearch(query) {
  query = (query || "").trim();
  if (!query) return;

  // Ensure we are on the main view
  showMain();
  activeTipFilter = null;

  const area = document.getElementById("question-area");
  const res = document.getElementById("results");
  if (area) area.style.display = "none";
  if (!res) return;

  res.classList.add("active");
  const progress = document.getElementById("progress");
  if (progress) progress.style.width = "100%";
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) restartBtn.classList.add("visible");

  if (!PRODUCTS || PRODUCTS.length === 0) {
    res.innerHTML = `<div class="empty-msg">Product database is still loading or failed to load. Wait a moment and try again.</div>`;
    return;
  }

  const items = searchProducts(query);
  let html = `<div class="search-hint">Search results for <strong>${escapeHtml(query)}</strong> — ${items.length} product(s)</div>`;
  if (items.length === 0) {
    html += `<div class="empty-msg">No products matched. Try a brand, model, or category (e.g. <em>FNIRSI</em>, <em>multimeter</em>, <em>C245</em>, <em>psu</em>).</div>`;
  } else {
    html += `<div class="product-grid">${items.map(productCard).join("")}</div>`;
  }
  html += `<div class="nav-buttons" style="margin-top:32px">
    <button class="btn btn-secondary" onclick="clearSearch()">← Clear search</button>
    <button class="btn btn-primary" onclick="restart()">Start Over</button>
  </div>`;
  res.innerHTML = html;

  const bc = document.getElementById("breadcrumb");
  if (bc) bc.innerHTML = `Search: ${escapeHtml(query)}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// Boot
loadData();