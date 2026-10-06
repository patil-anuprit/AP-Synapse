(() => {
"use strict";

const VERSION = "1.0.0";
const MARKER = "AP_APRISHA_HUMAN_INTERFACE_FINAL_V2";
const STORAGE_KEY = "ap_aprisha_human_interface_v2";
const ROOT_ID = "apAprishaHumanInterfaceV2";
const STYLE_ID = "apAprishaHumanInterfaceV2Style";
const FRAME_INTERVAL = 110;

if (window.__AP_APRISHA_HUMAN_INTERFACE_V2__) return;
window.__AP_APRISHA_HUMAN_INTERFACE_V2__ = true;

const BUILTIN_SIGNALS = [
  ["gesture:Victory", "Two fingers"],
  ["gesture:Open_Palm", "Open palm"],
  ["gesture:Closed_Fist", "Closed fist"],
  ["gesture:Pointing_Up", "Pointing up"],
  ["gesture:Thumb_Up", "Thumb up"],
  ["gesture:Thumb_Down", "Thumb down"],
  ["gesture:ILoveYou", "I love you"],
  ["gesture:Pinch", "Pinch"],
  ["head:down", "Head / neck down"],
  ["head:up", "Head up"],
  ["head:left", "Head left"],
  ["head:right", "Head right"]
];

const newId = () =>
  crypto.randomUUID?.() ||
  `ap-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const clamp = (v, a, b) => Math.min(b, Math.max(a, Number(v)));
const clean = (v) => String(v ?? "").trim();

function defaults() {
  return {
    confidence: 0.78,
    holdMs: 700,
    cooldownMs: 1800,
    learned: [],
    mappings: [
      {
        id: newId(),
        enabled: false,
        primary: "gesture:Victory",
        secondary: "",
        actionType: "aprisha",
        actionValue: "Open Gmail",
        context: "*",
        holdMs: 700,
        cooldownMs: 1800,
        confirm: false
      },
      {
        id: newId(),
        enabled: false,
        primary: "head:down",
        secondary: "",
        actionType: "aprisha",
        actionValue: "Open Spotify",
        context: "*",
        holdMs: 850,
        cooldownMs: 2200,
        confirm: false
      }
    ]
  };
}

function loadConfig() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return defaults();
    const base = defaults();
    return {
      confidence: clamp(parsed.confidence ?? base.confidence, 0.5, 0.98),
      holdMs: clamp(parsed.holdMs ?? base.holdMs, 250, 3000),
      cooldownMs: clamp(parsed.cooldownMs ?? base.cooldownMs, 500, 10000),
      learned: Array.isArray(parsed.learned) ? parsed.learned.slice(0, 24) : [],
      mappings: Array.isArray(parsed.mappings) ? parsed.mappings : base.mappings
    };
  } catch {
    return defaults();
  }
}

const state = {
  enabled: false,
  loading: false,
  modelsReady: false,
  stream: null,
  gestureRecognizer: null,
  faceLandmarker: null,
  raf: 0,
  lastFrame: 0,
  signals: new Map(),
  externalSignals: new Map(),
  trackers: new Map(),
  calibration: { active: false, samples: [], base: null },
  training: null,
  config: loadConfig()
};

function saveConfig() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
  } catch {}
}

function node(tag, attrs = {}, value = "") {
  const element = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === "class") element.className = val;
    else if (key === "dataset") Object.assign(element.dataset, val);
    else if (key.startsWith("aria-")) element.setAttribute(key, val);
    else if (key === "checked") element.checked = !!val;
    else element[key] = val;
  }
  if (value) element.textContent = value;
  return element;
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = node("style", { id: STYLE_ID });
  style.textContent = `
#${ROOT_ID}{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#f6f7f9}
#${ROOT_ID} *{box-sizing:border-box}
#${ROOT_ID} .aphi-launch{pointer-events:auto;position:absolute;right:22px;bottom:22px;height:56px;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:0 17px 0 10px;background:linear-gradient(145deg,rgba(33,35,40,.98),rgba(10,11,13,.98));color:#fff;display:flex;align-items:center;gap:11px;box-shadow:0 22px 70px rgba(0,0,0,.48);backdrop-filter:blur(18px);cursor:pointer}
#${ROOT_ID} .aphi-orb{width:35px;height:35px;border-radius:50%;background:radial-gradient(circle at 35% 28%,#fff,#d9dde4 18%,#777e88 44%,#262a30 66%,#0c0d0f 84%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.34),0 0 24px rgba(230,235,245,.15)}
#${ROOT_ID} .aphi-launch strong{display:block;font-size:13px;text-align:left;letter-spacing:-.01em}
#${ROOT_ID} .aphi-launch small{display:block;color:rgba(255,255,255,.54);font-size:10px;margin-top:3px}
#${ROOT_ID} .aphi-shade{pointer-events:auto;display:none;position:absolute;inset:0;background:rgba(0,0,0,.48);backdrop-filter:blur(10px);padding:18px;align-items:center;justify-content:flex-end}
#${ROOT_ID}.open .aphi-shade{display:flex}
#${ROOT_ID} .aphi-panel{width:min(860px,calc(100vw - 36px));max-height:calc(100vh - 36px);overflow:auto;border:1px solid rgba(255,255,255,.11);border-radius:28px;background:radial-gradient(circle at 10% -10%,rgba(255,255,255,.10),transparent 28%),linear-gradient(160deg,#191b1f,#0b0c0e);box-shadow:0 36px 120px rgba(0,0,0,.65)}
#${ROOT_ID} .aphi-header{position:sticky;top:0;z-index:3;padding:23px 24px 18px;border-bottom:1px solid rgba(255,255,255,.09);background:rgba(14,15,17,.9);backdrop-filter:blur(20px);display:flex;justify-content:space-between;gap:18px}
#${ROOT_ID} .aphi-kicker{font-size:10px;letter-spacing:.18em;color:rgba(255,255,255,.5);text-transform:uppercase}
#${ROOT_ID} h2{font-size:clamp(22px,3vw,31px);letter-spacing:-.035em;margin:6px 0 0;font-weight:650}
#${ROOT_ID} .aphi-sub{font-size:12px;line-height:1.5;color:rgba(255,255,255,.58);margin:7px 0 0;max-width:620px}
#${ROOT_ID} button,#${ROOT_ID} input,#${ROOT_ID} select{font:inherit}
#${ROOT_ID} .aphi-x,#${ROOT_ID} .aphi-secondary,#${ROOT_ID} .aphi-danger,#${ROOT_ID} .aphi-primary{border:1px solid rgba(255,255,255,.11);border-radius:12px;min-height:40px;padding:0 14px;cursor:pointer;color:#fff;background:rgba(255,255,255,.05)}
#${ROOT_ID} .aphi-x{width:40px;padding:0;font-size:22px}
#${ROOT_ID} .aphi-primary{background:#f1f3f6;color:#101216;font-weight:650}
#${ROOT_ID} .aphi-danger{color:#ffd2d2;background:rgba(255,100,100,.08)}
#${ROOT_ID} .aphi-body{padding:20px 24px 26px}
#${ROOT_ID} .aphi-status{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:14px}
#${ROOT_ID} .aphi-stat,#${ROOT_ID} .aphi-card,#${ROOT_ID} .aphi-rule,#${ROOT_ID} .aphi-teach{border:1px solid rgba(255,255,255,.09);border-radius:16px;background:rgba(255,255,255,.035)}
#${ROOT_ID} .aphi-stat{padding:11px 13px}
#${ROOT_ID} .aphi-stat small{font-size:9px;letter-spacing:.11em;text-transform:uppercase;color:rgba(255,255,255,.48);display:block}
#${ROOT_ID} .aphi-stat strong{font-size:12px;margin-top:6px;display:block}
#${ROOT_ID} .aphi-buttons{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:15px}
#${ROOT_ID} .aphi-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:12px}
#${ROOT_ID} .aphi-card{overflow:hidden}
#${ROOT_ID} .aphi-cardtop{padding:11px 13px;border-bottom:1px solid rgba(255,255,255,.08);font-size:11px;display:flex;justify-content:space-between;color:rgba(255,255,255,.65)}
#${ROOT_ID} .aphi-video{position:relative;aspect-ratio:16/10;background:#060708;overflow:hidden}
#${ROOT_ID} video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1);opacity:.87}
#${ROOT_ID} .aphi-signals{position:absolute;left:10px;right:10px;bottom:10px;display:flex;gap:6px;flex-wrap:wrap}
#${ROOT_ID} .aphi-chip{font-size:9px;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:6px 8px;background:rgba(0,0,0,.56);backdrop-filter:blur(8px)}
#${ROOT_ID} .aphi-settings{padding:12px;display:grid;gap:10px}
#${ROOT_ID} label{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.5);display:grid;gap:5px}
#${ROOT_ID} input,#${ROOT_ID} select{width:100%;min-width:0;height:37px;border:1px solid rgba(255,255,255,.11);border-radius:10px;background:rgba(255,255,255,.045);color:#fff;padding:0 10px;outline:none}
#${ROOT_ID} option{color:#111}
#${ROOT_ID} h3{font-size:13px;margin:20px 0 9px}
#${ROOT_ID} .aphi-rules{display:grid;gap:8px}
#${ROOT_ID} .aphi-rule{padding:10px;display:grid;grid-template-columns:auto minmax(120px,1fr) minmax(120px,1fr) minmax(150px,1fr) auto;gap:7px;align-items:center}
#${ROOT_ID} .aphi-rule .aphi-advanced{grid-column:2/-1;display:grid;grid-template-columns:1fr 1fr 110px 90px;gap:7px}
#${ROOT_ID} .aphi-check{width:18px;height:18px;accent-color:#f0f2f5}
#${ROOT_ID} .aphi-remove{width:36px;height:36px;padding:0}
#${ROOT_ID} .aphi-teach{padding:11px;display:grid;grid-template-columns:1fr auto auto;gap:8px}
#${ROOT_ID} .aphi-note{font-size:10px;line-height:1.55;color:rgba(255,255,255,.52);margin:11px 0 0}
#${ROOT_ID} .aphi-toast{position:absolute;left:50%;bottom:24px;transform:translate(-50%,10px);opacity:0;padding:11px 14px;border:1px solid rgba(255,255,255,.13);border-radius:13px;background:rgba(10,11,13,.96);font-size:11px;box-shadow:0 18px 55px rgba(0,0,0,.5);transition:.18s;pointer-events:none}
#${ROOT_ID} .aphi-toast.show{opacity:1;transform:translate(-50%,0)}
#${ROOT_ID} .aphi-confirm{pointer-events:auto;display:none;position:absolute;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(12px);align-items:center;justify-content:center;padding:22px}
#${ROOT_ID} .aphi-confirm.show{display:flex}
#${ROOT_ID} .aphi-confirmbox{width:min(430px,100%);padding:18px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:#111316}
#${ROOT_ID} .aphi-confirmbox p{font-size:12px;line-height:1.5;color:rgba(255,255,255,.62);white-space:pre-wrap}
#${ROOT_ID} .aphi-confirmactions{display:flex;justify-content:flex-end;gap:8px}
@media(max-width:720px){
  #${ROOT_ID} .aphi-shade{padding:0;align-items:flex-end}
  #${ROOT_ID} .aphi-panel{width:100%;max-height:94vh;border-radius:24px 24px 0 0}
  #${ROOT_ID} .aphi-grid,#${ROOT_ID} .aphi-status{grid-template-columns:1fr}
  #${ROOT_ID} .aphi-rule{grid-template-columns:auto 1fr auto}
  #${ROOT_ID} .aphi-rule .aphi-secondarySignal,#${ROOT_ID} .aphi-rule .aphi-actionValue{grid-column:2/-1}
  #${ROOT_ID} .aphi-rule .aphi-advanced{grid-column:1/-1;grid-template-columns:1fr 1fr}
  #${ROOT_ID} .aphi-teach{grid-template-columns:1fr}
  #${ROOT_ID} .aphi-launch small{display:none}
}
@media(prefers-reduced-motion:reduce){#${ROOT_ID} *{transition:none!important}}
`;
  document.head.appendChild(style);
}

function makeStat(label, role) {
  const x = node("div", { class: "aphi-stat" });
  x.append(
    node("small", {}, label),
    node("strong", { dataset: { role } }, role === "armed" ? "Disarmed" : "Off")
  );
  return x;
}

function makeNumberField(label, key, value, min, max, step) {
  const wrapper = node("label", {}, label);
  wrapper.appendChild(
    node("input", {
      type: "number",
      value: String(value),
      min: String(min),
      max: String(max),
      step: String(step),
      dataset: { config: key }
    })
  );
  return wrapper;
}

function mount() {
  if (document.getElementById(ROOT_ID)) return;
  ensureStyles();

  const root = node("div", { id: ROOT_ID });

  const launch = node("button", {
    class: "aphi-launch",
    type: "button",
    "aria-label": "Open Aprisha Human Interface"
  });
  const brand = node("span");
  brand.append(
    node("strong", {}, "Aprisha"),
    node("small", {}, "Human Interface")
  );
  launch.append(
    node("i", { class: "aphi-orb", "aria-hidden": "true" }),
    brand
  );

  const shade = node("div", { class: "aphi-shade" });
  const panel = node("section", {
    class: "aphi-panel",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Aprisha Human Interface"
  });

  const header = node("div", { class: "aphi-header" });
  const heading = node("div");
  heading.append(
    node("div", { class: "aphi-kicker" }, "AP SYNAPSE · APRISHA"),
    node("h2", {}, "Aprisha — the human interface to AP Synapse."),
    node(
      "p",
      { class: "aphi-sub" },
      "Program physical intent. Combine hands, head movement, learned personal poses, contextual rules and future wearable signals into Aprisha actions."
    )
  );
  const close = node("button", {
    class: "aphi-x",
    type: "button",
    "aria-label": "Close"
  }, "×");
  header.append(heading, close);

  const body = node("div", { class: "aphi-body" });

  const statuses = node("div", { class: "aphi-status" });
  statuses.append(
    makeStat("Camera", "camera"),
    makeStat("Vision", "vision"),
    makeStat("Interface", "armed")
  );

  const buttons = node("div", { class: "aphi-buttons" });
  buttons.append(
    node("button", { class: "aphi-primary", type: "button", dataset: { action: "toggle" } }, "Enable Human Interface"),
    node("button", { class: "aphi-secondary", type: "button", dataset: { action: "calibrate" } }, "Calibrate neutral"),
    node("button", { class: "aphi-secondary", type: "button", dataset: { action: "add" } }, "+ Mapping"),
    node("button", { class: "aphi-secondary", type: "button", dataset: { action: "export" } }, "Export mappings")
  );

  const grid = node("div", { class: "aphi-grid" });

  const visionCard = node("div", { class: "aphi-card" });
  const visionTop = node("div", { class: "aphi-cardtop" });
  visionTop.append(
    node("span", {}, "Intent Vision"),
    node("span", {}, "Local browser processing")
  );
  const videoBox = node("div", { class: "aphi-video" });
  const video = node("video", {
    autoplay: true,
    playsInline: true,
    muted: true,
    dataset: { role: "video" }
  });
  const signals = node("div", {
    class: "aphi-signals",
    dataset: { role: "signals" }
  });
  videoBox.append(video, signals);
  visionCard.append(visionTop, videoBox);

  const settingsCard = node("div", { class: "aphi-card" });
  const settingsTop = node("div", { class: "aphi-cardtop" });
  settingsTop.append(
    node("span", {}, "Recognition"),
    node("span", {}, "Safety thresholds")
  );
  const settings = node("div", { class: "aphi-settings" });
  settings.append(
    makeNumberField("Confidence", "confidence", state.config.confidence, 0.5, 0.98, 0.01),
    makeNumberField("Default hold ms", "holdMs", state.config.holdMs, 250, 3000, 50),
    makeNumberField("Default cooldown ms", "cooldownMs", state.config.cooldownMs, 500, 10000, 100)
  );
  settingsCard.append(settingsTop, settings);
  grid.append(visionCard, settingsCard);

  const rulesTitle = node("h3", {}, "Intent mappings · combine two signals for a chord");
  const rules = node("div", {
    class: "aphi-rules",
    dataset: { role: "rules" }
  });

  const teachTitle = node("h3", {}, "Teach Aprisha · personalized one-hand signal");
  const teach = node("div", { class: "aphi-teach" });
  teach.append(
    node("input", {
      type: "text",
      placeholder: "Signal name — e.g. Study Sign",
      maxlength: 60,
      dataset: { role: "teachName" }
    }),
    node("button", {
      class: "aphi-primary",
      type: "button",
      dataset: { action: "teach" }
    }, "Teach signal"),
    node("button", {
      class: "aphi-danger",
      type: "button",
      dataset: { action: "clear" }
    }, "Clear learned")
  );

  const note = node(
    "p",
    { class: "aphi-note" },
    "Camera permission is requested only when you enable the interface. Camera frames are processed in the browser. Learned pose templates stay in this browser. New mappings are disabled by default. Confirmation, hold time and cooldown help prevent accidental execution. System-wide app control still uses Aprisha's native/action runtime where the operating system permits it."
  );

  body.append(
    statuses,
    buttons,
    grid,
    rulesTitle,
    rules,
    teachTitle,
    teach,
    note
  );

  panel.append(header, body);
  shade.appendChild(panel);

  const toast = node("div", {
    class: "aphi-toast",
    dataset: { role: "toast" },
    role: "status",
    "aria-live": "polite"
  });

  const confirm = node("div", {
    class: "aphi-confirm",
    dataset: { role: "confirm" }
  });

  root.append(launch, shade, toast, confirm);
  document.body.appendChild(root);

  launch.addEventListener("click", openPanel);
  close.addEventListener("click", closePanel);
  shade.addEventListener("click", (event) => {
    if (event.target === shade) closePanel();
  });
  root.addEventListener("click", handleClick);
  root.addEventListener("change", handleChange);

  renderRules();
  updateStatus();
  renderSignals();
}

const root = () => document.getElementById(ROOT_ID);

function openPanel() {
  mount();
  root()?.classList.add("open");
}

function closePanel() {
  root()?.classList.remove("open");
}

function toast(message) {
  const target = root()?.querySelector('[data-role="toast"]');
  if (!target) return;
  target.textContent = clean(message);
  target.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => target.classList.remove("show"), 2500);
}

function fillSignalOptions(select, current) {
  select.textContent = "";
  select.appendChild(node("option", { value: "" }, "None"));

  for (const [value, label] of BUILTIN_SIGNALS) {
    const option = node("option", { value }, label);
    option.selected = value === current;
    select.appendChild(option);
  }

  for (const learned of state.config.learned) {
    const value = `custom:${learned.id}`;
    const option = node("option", { value }, `Learned · ${learned.name}`);
    option.selected = value === current;
    select.appendChild(option);
  }
}

function renderRules() {
  const host = root()?.querySelector('[data-role="rules"]');
  if (!host) return;
  host.textContent = "";

  for (const mapping of state.config.mappings) {
    const row = node("div", {
      class: "aphi-rule",
      dataset: { ruleId: mapping.id }
    });

    const enabled = node("input", {
      class: "aphi-check",
      type: "checkbox",
      checked: !!mapping.enabled,
      dataset: { field: "enabled" }
    });

    const primary = node("select", {
      dataset: { field: "primary" }
    });
    fillSignalOptions(primary, mapping.primary);

    const secondary = node("select", {
      class: "aphi-secondarySignal",
      dataset: { field: "secondary" }
    });
    fillSignalOptions(secondary, mapping.secondary);

    const actionValue = node("input", {
      class: "aphi-actionValue",
      type: "text",
      value: mapping.actionValue || "",
      placeholder: "Aprisha command or https:// URL",
      maxlength: 400,
      dataset: { field: "actionValue" }
    });

    const remove = node("button", {
      class: "aphi-secondary aphi-remove",
      type: "button",
      dataset: { action: "remove", id: mapping.id }
    }, "×");

    const advanced = node("div", { class: "aphi-advanced" });

    const typeSelect = node("select", {
      dataset: { field: "actionType" }
    });
    [
      ["aprisha", "Aprisha command"],
      ["url", "Open URL"],
      ["event", "Emit AP event"]
    ].forEach(([value, label]) => {
      const option = node("option", { value }, label);
      option.selected = value === (mapping.actionType || "aprisha");
      typeSelect.appendChild(option);
    });

    const context = node("input", {
      type: "text",
      value: mapping.context || "*",
      placeholder: "* or host:ap-synapse.com",
      maxlength: 180,
      dataset: { field: "context" }
    });

    const hold = node("input", {
      type: "number",
      value: String(mapping.holdMs ?? state.config.holdMs),
      min: "250",
      max: "3000",
      step: "50",
      dataset: { field: "holdMs" }
    });

    const confirmWrap = node("label", {}, "Confirm");
    confirmWrap.appendChild(
      node("input", {
        class: "aphi-check",
        type: "checkbox",
        checked: !!mapping.confirm,
        dataset: { field: "confirm" }
      })
    );

    advanced.append(typeSelect, context, hold, confirmWrap);
    row.append(enabled, primary, secondary, actionValue, remove, advanced);
    host.appendChild(row);
  }
}

function handleChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.dataset?.config) {
    const key = target.dataset.config;
    const value = Number(target.value);

    if (key === "confidence") state.config.confidence = clamp(value, 0.5, 0.98);
    if (key === "holdMs") state.config.holdMs = clamp(value, 250, 3000);
    if (key === "cooldownMs") state.config.cooldownMs = clamp(value, 500, 10000);
    saveConfig();
    return;
  }

  const row = target.closest?.("[data-rule-id]");
  const field = target.dataset?.field;
  if (!row || !field) return;

  const mapping = state.config.mappings.find((item) => item.id === row.dataset.ruleId);
  if (!mapping) return;

  if (field === "enabled" || field === "confirm") {
    mapping[field] = !!target.checked;
  } else if (field === "holdMs") {
    mapping[field] = clamp(target.value, 250, 3000);
  } else {
    mapping[field] = clean(target.value);
  }

  state.trackers.delete(mapping.id);
  saveConfig();
}

async function handleClick(event) {
  const button = event.target.closest?.("[data-action]");
  if (!button) return;

  const action = button.dataset.action;

  if (action === "toggle") {
    if (state.enabled) disable();
    else await enable();
  }
  if (action === "calibrate") calibrate();
  if (action === "add") addMapping();
  if (action === "remove") removeMapping(button.dataset.id);
  if (action === "teach") teachSignal();
  if (action === "clear") clearLearned();
  if (action === "export") exportMappings();
}

function addMapping() {
  state.config.mappings.push({
    id: newId(),
    enabled: false,
    primary: "gesture:Victory",
    secondary: "",
    actionType: "aprisha",
    actionValue: "",
    context: "*",
    holdMs: state.config.holdMs,
    cooldownMs: state.config.cooldownMs,
    confirm: false
  });
  saveConfig();
  renderRules();
}

function removeMapping(id) {
  state.config.mappings =
    state.config.mappings.filter((item) => item.id !== id);
  state.trackers.delete(id);
  saveConfig();
  renderRules();
}

function clearLearned() {
  state.config.learned = [];
  saveConfig();
  renderRules();
  toast("Learned signals cleared from this browser.");
}

function exportMappings() {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          system: "Aprisha Human Interface",
          version: VERSION,
          exportedAt: new Date().toISOString(),
          config: state.config
        },
        null,
        2
      )
    ],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = node("a", {
    href: url,
    download: `aprisha-human-interface-${Date.now()}.json`
  });

  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function ensureModels() {
  if (state.modelsReady) return;

  if (state.loading) {
    while (state.loading) {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    if (!state.modelsReady) throw new Error("Vision initialization failed.");
    return;
  }

  state.loading = true;
  updateStatus();

  try {
    const visionTasks =
      await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm");

    const vision =
      await visionTasks.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
      );

    state.gestureRecognizer =
      await visionTasks.GestureRecognizer.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55
        }
      );

    state.faceLandmarker =
      await visionTasks.FaceLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
          },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.55,
          minFacePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55
        }
      );

    state.modelsReady = true;
  } finally {
    state.loading = false;
    updateStatus();
  }
}

async function enable() {
  if (state.enabled) return;

  if (!navigator.mediaDevices?.getUserMedia) {
    toast("Camera is unavailable in this browser.");
    return;
  }

  try {
    await ensureModels();

    state.stream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 600 },
          frameRate: { ideal: 24, max: 30 }
        },
        audio: false
      });

    const video = root()?.querySelector('[data-role="video"]');
    if (!video) throw new Error("Video surface unavailable.");

    video.srcObject = state.stream;
    await video.play();

    state.enabled = true;
    calibrate();
    updateStatus();
    toast("Aprisha Human Interface enabled.");
    state.raf = requestAnimationFrame(processFrame);
  } catch (error) {
    console.error("Aprisha Human Interface:", error);
    disable();

    toast(
      error?.name === "NotAllowedError"
        ? "Camera permission was not granted."
        : "Aprisha vision could not start."
    );
  }
}

function disable() {
  state.enabled = false;

  if (state.raf) cancelAnimationFrame(state.raf);
  state.raf = 0;

  for (const track of state.stream?.getTracks?.() || []) track.stop();

  state.stream = null;
  state.signals.clear();
  state.externalSignals.clear();
  state.trackers.clear();
  state.training = null;

  const video = root()?.querySelector('[data-role="video"]');
  if (video) video.srcObject = null;

  updateStatus();
  renderSignals();
}

function calibrate() {
  if (!state.enabled) {
    toast("Enable the interface first.");
    return;
  }

  state.calibration = {
    active: true,
    samples: [],
    base: null
  };

  toast("Face forward naturally for neutral calibration.");
}

function normalizeHand(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[0];
  const middle = landmarks[9];
  const indexBase = landmarks[5];
  const pinkyBase = landmarks[17];

  const scale = Math.max(
    Math.hypot(
      middle.x - wrist.x,
      middle.y - wrist.y,
      (middle.z || 0) - (wrist.z || 0)
    ),
    Math.hypot(
      pinkyBase.x - indexBase.x,
      pinkyBase.y - indexBase.y,
      (pinkyBase.z || 0) - (indexBase.z || 0)
    ),
    0.001
  );

  const angle =
    Math.atan2(
      middle.y - wrist.y,
      middle.x - wrist.x
    );

  const c = Math.cos(-angle);
  const s = Math.sin(-angle);
  const vector = [];

  for (const point of landmarks) {
    const x = (point.x - wrist.x) / scale;
    const y = (point.y - wrist.y) / scale;
    const z = ((point.z || 0) - (wrist.z || 0)) / scale;

    vector.push(
      x * c - y * s,
      x * s + y * c,
      z
    );
  }

  return vector;
}

function vectorDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;

  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const delta = a[i] - b[i];
    sum += delta * delta;
  }

  return Math.sqrt(sum / a.length);
}

function centroid(vectors) {
  if (!vectors.length) return null;

  const out = new Array(vectors[0].length).fill(0);

  for (const vector of vectors) {
    for (let i = 0; i < out.length; i += 1) {
      out[i] += vector[i];
    }
  }

  for (let i = 0; i < out.length; i += 1) {
    out[i] /= vectors.length;
  }

  return out;
}

function teachSignal() {
  if (!state.enabled) {
    toast("Enable the interface first.");
    return;
  }

  const input = root()?.querySelector('[data-role="teachName"]');
  const name = clean(input?.value);

  if (!name) {
    toast("Name the signal first.");
    input?.focus();
    return;
  }

  if (state.config.learned.length >= 24) {
    toast("Maximum 24 learned signals reached.");
    return;
  }

  state.training = {
    id: newId(),
    name,
    samples: [],
    end: performance.now() + 2800
  };

  toast("Hold your custom hand pose naturally for about 3 seconds.");
}

function finishTeaching() {
  const training = state.training;
  if (!training) return;

  state.training = null;

  if (training.samples.length < 10) {
    toast("Not enough clear samples. Teach it again.");
    return;
  }

  const center = centroid(training.samples);
  const distances =
    training.samples.map((sample) => vectorDistance(sample, center));

  const mean =
    distances.reduce((sum, value) => sum + value, 0) /
    distances.length;

  state.config.learned.push({
    id: training.id,
    name: training.name,
    centroid: center,
    threshold: clamp(mean * 2.6 + 0.055, 0.08, 0.32)
  });

  saveConfig();
  renderRules();

  const input = root()?.querySelector('[data-role="teachName"]');
  if (input) input.value = "";

  toast(`Aprisha learned “${training.name}”.`);
}

function detectLearnedPose(vector) {
  if (!vector) return null;

  let best = null;

  for (const learned of state.config.learned) {
    const distance = vectorDistance(vector, learned.centroid);
    const threshold = clamp(learned.threshold || 0.18, 0.06, 0.38);
    const score = clamp(1 - distance / threshold, 0, 1);

    if (
      distance <= threshold &&
      (!best || score > best.score)
    ) {
      best = {
        signal: `custom:${learned.id}`,
        score
      };
    }
  }

  return best;
}

function pinchScore(landmarks) {
  if (!landmarks || landmarks.length < 21) return 0;

  const wrist = landmarks[0];
  const middle = landmarks[9];
  const thumb = landmarks[4];
  const index = landmarks[8];

  const scale = Math.max(
    0.001,
    Math.hypot(
      middle.x - wrist.x,
      middle.y - wrist.y
    )
  );

  const distance =
    Math.hypot(
      thumb.x - index.x,
      thumb.y - index.y
    ) / scale;

  return clamp(
    1 - distance / 0.58,
    0,
    1
  );
}

function faceMetric(landmarks) {
  if (!landmarks || landmarks.length < 264) return null;

  const left = landmarks[33];
  const right = landmarks[263];
  const nose = landmarks[1];

  const eyeDistance =
    Math.max(
      0.001,
      Math.hypot(
        right.x - left.x,
        right.y - left.y
      )
    );

  const eyeX = (left.x + right.x) / 2;
  const eyeY = (left.y + right.y) / 2;

  return {
    yaw: (nose.x - eyeX) / eyeDistance,
    pitch: (nose.y - eyeY) / eyeDistance
  };
}

function collectHeadSignals(landmarks, signals) {
  const metric = faceMetric(landmarks);
  if (!metric) return;

  if (state.calibration.active) {
    state.calibration.samples.push(metric);

    if (state.calibration.samples.length >= 28) {
      const base =
        state.calibration.samples.reduce(
          (sum, sample) => ({
            yaw: sum.yaw + sample.yaw,
            pitch: sum.pitch + sample.pitch
          }),
          { yaw: 0, pitch: 0 }
        );

      base.yaw /= state.calibration.samples.length;
      base.pitch /= state.calibration.samples.length;

      state.calibration = {
        active: false,
        samples: [],
        base
      };

      toast("Neutral head position calibrated.");
    }

    return;
  }

  const base = state.calibration.base;
  if (!base) return;

  const yaw = metric.yaw - base.yaw;
  const pitch = metric.pitch - base.pitch;

  if (pitch > 0.105) {
    signals.set("head:down", clamp(0.72 + pitch, 0, 1));
  } else if (pitch < -0.10) {
    signals.set("head:up", clamp(0.72 + Math.abs(pitch), 0, 1));
  }

  if (yaw > 0.12) {
    signals.set("head:right", clamp(0.72 + yaw, 0, 1));
  } else if (yaw < -0.12) {
    signals.set("head:left", clamp(0.72 + Math.abs(yaw), 0, 1));
  }
}

function mergeExternalSignals(signals, now) {
  for (const [name, value] of state.externalSignals) {
    if (value.until <= now) {
      state.externalSignals.delete(name);
      continue;
    }

    signals.set(name, value.confidence);
  }
}

async function processFrame(now) {
  if (!state.enabled) return;

  state.raf = requestAnimationFrame(processFrame);

  if (
    document.hidden ||
    now - state.lastFrame < FRAME_INTERVAL
  ) {
    return;
  }

  state.lastFrame = now;

  const video = root()?.querySelector('[data-role="video"]');
  if (!video || video.readyState < 2) return;

  try {
    const timestamp = Math.max(1, Math.round(performance.now()));
    const signals = new Map();

    const gestureResult =
      state.gestureRecognizer?.recognizeForVideo(
        video,
        timestamp
      );

    const faceResult =
      state.faceLandmarker?.detectForVideo(
        video,
        timestamp
      );

    const hands = gestureResult?.landmarks || [];
    const gestureSets = gestureResult?.gestures || [];

    for (let index = 0; index < hands.length; index += 1) {
      const hand = hands[index];
      const category = gestureSets[index]?.[0];
      const gestureName = category?.categoryName || "";
      const gestureConfidence = Number(category?.score || 0);

      if (
        gestureName &&
        gestureName !== "None" &&
        gestureConfidence >= state.config.confidence
      ) {
        signals.set(
          `gesture:${gestureName}`,
          gestureConfidence
        );
      }

      const pinch = pinchScore(hand);

      if (pinch >= state.config.confidence) {
        signals.set("gesture:Pinch", pinch);
      }

      const vector = normalizeHand(hand);

      if (
        state.training &&
        performance.now() <= state.training.end &&
        vector
      ) {
        state.training.samples.push(vector);
      }

      const learned = detectLearnedPose(vector);

      if (learned && learned.score >= 0.28) {
        signals.set(
          learned.signal,
          learned.score
        );
      }
    }

    if (
      state.training &&
      performance.now() > state.training.end
    ) {
      finishTeaching();
    }

    collectHeadSignals(
      faceResult?.faceLandmarks?.[0],
      signals
    );

    mergeExternalSignals(
      signals,
      performance.now()
    );

    state.signals = signals;

    renderSignals();
    evaluateMappings(performance.now());
  } catch (error) {
    console.warn(
      "Aprisha Human Interface frame:",
      error
    );
  }
}

function signalLabel(signal) {
  const builtin =
    BUILTIN_SIGNALS.find(
      ([value]) => value === signal
    );

  if (builtin) return builtin[1];

  if (signal.startsWith("custom:")) {
    return (
      state.config.learned.find(
        (item) => item.id === signal.slice(7)
      )?.name ||
      "Learned signal"
    );
  }

  return signal;
}

function renderSignals() {
  const host =
    root()?.querySelector(
      '[data-role="signals"]'
    );

  if (!host) return;

  host.textContent = "";

  if (state.calibration.active) {
    host.appendChild(
      node(
        "span",
        { class: "aphi-chip" },
        "Calibrating neutral…"
      )
    );
  }

  if (state.training) {
    host.appendChild(
      node(
        "span",
        { class: "aphi-chip" },
        `Learning ${state.training.name} · ${state.training.samples.length}`
      )
    );
  }

  const top =
    [...state.signals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

  for (const [signal, confidence] of top) {
    host.appendChild(
      node(
        "span",
        { class: "aphi-chip" },
        `${signalLabel(signal)} · ${Math.round(confidence * 100)}%`
      )
    );
  }

  if (
    !top.length &&
    !state.calibration.active &&
    !state.training
  ) {
    host.appendChild(
      node(
        "span",
        { class: "aphi-chip" },
        "Waiting for intent"
      )
    );
  }
}

function contextMatches(mapping) {
  const query =
    clean(mapping.context || "*")
      .toLowerCase();

  if (!query || query === "*") return true;

  if (query.startsWith("host:")) {
    return location.hostname
      .toLowerCase()
      .includes(
        query.slice(5).trim()
      );
  }

  if (query.startsWith("title:")) {
    return document.title
      .toLowerCase()
      .includes(
        query.slice(6).trim()
      );
  }

  if (query.startsWith("path:")) {
    return location.pathname
      .toLowerCase()
      .includes(
        query.slice(5).trim()
      );
  }

  return (
    `${location.hostname} ${location.pathname} ${document.title}`
      .toLowerCase()
      .includes(query)
  );
}

function evaluateMappings(now) {
  for (const mapping of state.config.mappings) {
    if (
      !mapping.enabled ||
      !mapping.primary ||
      !contextMatches(mapping)
    ) {
      state.trackers.delete(mapping.id);
      continue;
    }

    const present =
      state.signals.has(mapping.primary) &&
      (
        !mapping.secondary ||
        state.signals.has(mapping.secondary)
      );

    let tracker =
      state.trackers.get(mapping.id) ||
      {
        since: 0,
        last: 0,
        latched: false
      };

    state.trackers.set(
      mapping.id,
      tracker
    );

    if (!present) {
      tracker.since = 0;
      tracker.latched = false;
      continue;
    }

    if (!tracker.since) {
      tracker.since = now;
    }

    const hold =
      clamp(
        mapping.holdMs ?? state.config.holdMs,
        250,
        3000
      );

    const cooldown =
      clamp(
        mapping.cooldownMs ?? state.config.cooldownMs,
        500,
        10000
      );

    if (
      !tracker.latched &&
      now - tracker.since >= hold &&
      now - tracker.last >= cooldown
    ) {
      tracker.latched = true;
      tracker.last = now;
      void executeMapping(mapping);
    }
  }
}

async function confirmMapping(mapping) {
  return new Promise((resolve) => {
    const host =
      root()?.querySelector(
        '[data-role="confirm"]'
      );

    if (!host) {
      resolve(false);
      return;
    }

    host.textContent = "";

    const box =
      node(
        "div",
        { class: "aphi-confirmbox" }
      );

    box.append(
      node(
        "h3",
        {},
        "Confirm Aprisha action"
      ),
      node(
        "p",
        {},
        `${signalLabel(mapping.primary)}${mapping.secondary ? ` + ${signalLabel(mapping.secondary)}` : ""}\n${mapping.actionValue || ""}`
      )
    );

    const actions =
      node(
        "div",
        { class: "aphi-confirmactions" }
      );

    const cancel =
      node(
        "button",
        { class: "aphi-secondary", type: "button" },
        "Cancel"
      );

    const execute =
      node(
        "button",
        { class: "aphi-primary", type: "button" },
        "Execute"
      );

    const done = (value) => {
      host.classList.remove("show");
      host.textContent = "";
      resolve(value);
    };

    cancel.addEventListener(
      "click",
      () => done(false)
    );

    execute.addEventListener(
      "click",
      () => done(true)
    );

    actions.append(
      cancel,
      execute
    );

    box.appendChild(actions);
    host.appendChild(box);
    host.classList.add("show");
  });
}

async function executeMapping(mapping) {
  if (
    mapping.confirm &&
    !(await confirmMapping(mapping))
  ) {
    toast("Action cancelled.");
    return;
  }

  const actionType =
    clean(mapping.actionType || "aprisha");

  const actionValue =
    clean(mapping.actionValue);

  if (!actionValue) {
    toast("This mapping has no action.");
    return;
  }

  try {
    if (actionType === "aprisha") {
      if (
        !window.APAprisha ||
        typeof window.APAprisha.execute !== "function"
      ) {
        throw new Error(
          "Aprisha action runtime is not ready."
        );
      }

      await window.APAprisha.execute(
        actionValue
      );

      toast(
        `Aprisha executed: ${actionValue}`
      );
      return;
    }

    if (actionType === "url") {
      const target =
        new URL(
          actionValue,
          location.href
        );

      if (
        !["https:", "http:"]
          .includes(target.protocol)
      ) {
        throw new Error(
          "Only http/https URLs are allowed."
        );
      }

      window.open(
        target.href,
        "_blank",
        "noopener,noreferrer"
      );

      toast("Mapped destination opened.");
      return;
    }

    if (actionType === "event") {
      window.dispatchEvent(
        new CustomEvent(
          "ap:aprisha-human-action",
          {
            detail: {
              value: actionValue,
              ruleId: mapping.id,
              primary: mapping.primary,
              secondary: mapping.secondary || null,
              timestamp: Date.now()
            }
          }
        )
      );

      toast(
        `AP event emitted: ${actionValue}`
      );
    }
  } catch (error) {
    console.error(
      "Aprisha Human Interface action:",
      error
    );

    toast(
      error?.message ||
      "Action failed."
    );
  }
}

function pushExternalSignal(
  signal,
  confidence = 1,
  durationMs = 900
) {
  const name = clean(signal);
  if (!name) return false;

  state.externalSignals.set(
    name,
    {
      confidence: clamp(confidence, 0, 1),
      until:
        performance.now() +
        clamp(durationMs, 120, 10000)
    }
  );

  return true;
}

function updateStatus() {
  const host = root();
  if (!host) return;

  const camera =
    host.querySelector(
      '[data-role="camera"]'
    );

  const vision =
    host.querySelector(
      '[data-role="vision"]'
    );

  const armed =
    host.querySelector(
      '[data-role="armed"]'
    );

  const toggle =
    host.querySelector(
      '[data-action="toggle"]'
    );

  if (camera) {
    camera.textContent =
      state.enabled
        ? "Active"
        : "Off";
  }

  if (vision) {
    vision.textContent =
      state.loading
        ? "Loading"
        : state.modelsReady
          ? "Ready"
          : "Standby";
  }

  if (armed) {
    armed.textContent =
      state.enabled
        ? "Armed"
        : "Disarmed";
  }

  if (toggle) {
    toggle.textContent =
      state.enabled
        ? "Disable Human Interface"
        : "Enable Human Interface";
  }
}

window.addEventListener(
  "ap:aprisha-signal",
  (event) => {
    pushExternalSignal(
      event?.detail?.signal,
      event?.detail?.confidence ?? 1,
      event?.detail?.durationMs ?? 900
    );
  }
);

window.addEventListener(
  "pagehide",
  disable,
  { once: true }
);

window.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      root()?.classList.contains("open")
    ) {
      closePanel();
    }
  }
);

window.APAprishaHumanInterface = {
  version: VERSION,
  open: openPanel,
  close: closePanel,
  enable,
  disable,
  pushSignal: pushExternalSignal,

  status() {
    return {
      ready: true,
      enabled: state.enabled,
      modelsReady: state.modelsReady,
      signals: [...state.signals.keys()],
      mappings: state.config.mappings.length,
      learnedSignals: state.config.learned.length
    };
  },

  addMapping(mapping = {}) {
    const item = {
      id: newId(),
      enabled: !!mapping.enabled,
      primary: clean(mapping.primary),
      secondary: clean(mapping.secondary),
      actionType: clean(mapping.actionType || "aprisha"),
      actionValue: clean(mapping.actionValue),
      context: clean(mapping.context || "*"),
      holdMs: clamp(
        mapping.holdMs ?? state.config.holdMs,
        250,
        3000
      ),
      cooldownMs: clamp(
        mapping.cooldownMs ?? state.config.cooldownMs,
        500,
        10000
      ),
      confirm: !!mapping.confirm
    };

    state.config.mappings.push(item);
    saveConfig();
    renderRules();

    return item.id;
  }
};

function boot() {
  mount();

  console.log(
    "APRISHA HUMAN INTERFACE READY",
    window.APAprishaHumanInterface.status()
  );

  void MARKER;
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    boot,
    { once: true }
  );
} else {
  boot();
}

})();