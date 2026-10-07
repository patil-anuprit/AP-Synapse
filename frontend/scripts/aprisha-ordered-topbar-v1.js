(() => {
  "use strict";

  const FLAG = "__AP_APRISHA_ORDERED_TOPBAR_V1__";
  if (window[FLAG]) return;
  window[FLAG] = true;

  const STYLE_ID = "ap-aprisha-ordered-topbar-v1-style";
  const APRISHA_PROXY_ID = "apAprishaOrderAprishaBtnV1";
  const COMBO_ID = "apAprishaOrderComboV1";
  const HUMAN_PROXY_ID = "apAprishaOrderHumanBtnV1";
  const OMEGA_PROXY_ID = "apAprishaOrderOmegaBtnV1";

  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  let bootAttempts = 0;
  const BOOT_LIMIT = 40;

  function topbarRight() {
    return q(".topbar .topbar-right") || q(".topbar-right");
  }

  function originalAprisha() {
    return document.getElementById("apDedicatedAprishaButton");
  }

  function humanRoot() {
    return document.getElementById("apAprishaHumanInterfaceV2");
  }

  function humanLaunch() {
    return q("#apAprishaHumanInterfaceV2 .aphi-launch");
  }

  function omegaRoot() {
    return document.getElementById("apAprishaOmegaConsoleV1");
  }

  function notificationButton() {
    return (
      q(".ap-notification-icon-only") ||
      q('[aria-label*="alert" i]') ||
      q('[title*="notification" i]') ||
      q('[title*="activity" i]')
    );
  }

  function settingsButton() {
    return document.getElementById("settingsBtn") || q('[aria-label*="setting" i]');
  }

  function profileButton() {
    return document.getElementById("profileBtn");
  }

  function shareButton() {
    return (
      document.getElementById("shareConversationBtn") ||
      q('[aria-label*="share" i]') ||
      q('[title*="share" i]')
    );
  }

  function searchContainer() {
    return (
      q(".topbar-search") ||
      q(".search-box") ||
      q('input[placeholder*="Search"]')?.closest("div")
    );
  }

  function svgAprisha() {
    return `
      <svg class="apord-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <path class="apord-stroke" d="M5.9 21.7 12.2 5.8c.34-.85 1.16-1.4 2.07-1.4.93 0 1.76.56 2.1 1.43l5.98 15.87"/>
        <path class="apord-stroke" d="M9.35 14.15h9.55"/>
        <circle class="apord-fill" cx="14.14" cy="5.2" r="1.18"/>
      </svg>
    `;
  }

  function svgHuman() {
    return `
      <svg class="apord-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <path class="apord-stroke"
          d="M8.3 13.15V8.68c0-.86.66-1.52 1.48-1.52s1.48.66 1.48 1.52v3.26-4.98c0-.9.68-1.6 1.54-1.6.84 0 1.53.7 1.53 1.6v4.98-4.12c0-.83.65-1.48 1.46-1.48.82 0 1.47.65 1.47 1.48v4.7-3.08c0-.78.61-1.38 1.37-1.38s1.37.6 1.37 1.38v5.62c0 4.8-2.46 7.65-6.8 7.65-4.14 0-6.95-2.58-6.95-6.43v-1.67c0-.98.75-1.76 1.68-1.76h.4Z"/>
        <path class="apord-signal" d="M21.28 4.2c1.56.53 2.7 1.56 3.24 3.08"/>
        <circle class="apord-fill" cx="22.08" cy="7.04" r="1.08"/>
      </svg>
    `;
  }

  function svgOmega() {
    return `
      <svg class="apord-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <circle class="apord-ring" cx="14" cy="14" r="10.15"/>
        <path class="apord-stroke"
          d="M7.95 20.4h4.02v-3.08c-2.32-.86-3.9-3.08-3.9-5.76 0-3.85 2.6-6.42 5.94-6.42s5.94 2.57 5.94 6.42c0 2.68-1.58 4.9-3.9 5.76v3.08h4.02"/>
        <circle class="apord-fill" cx="22.72" cy="8.26" r="1.02"/>
      </svg>
    `;
  }

  function injectStyles() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    style.textContent = `
.topbar, .topbar-right {
  overflow: visible !important;
}

.topbar-right {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 8px !important;
  min-width: 0 !important;
}

/* Hide old custom topbar experiments if present */
#apAprishaNexusDockV3,
#apAprishaNexusMoreV3,
#apHumanInterfaceTopbarBtn,
#apTopbarMoreV21 {
  display: none !important;
}

/* Keep originals functional but hidden where needed */
#apDedicatedAprishaButton,
#apAprishaHumanInterfaceV2 .aphi-launch,
#apAprishaOmegaConsoleV1 .ao-launch {
  display: none !important;
}

/* Move omega container out of crowded topbar area */
#apAprishaOmegaConsoleV1 {
  position: fixed !important;
  inset: 0 auto auto 0 !important;
  width: 0 !important;
  height: 0 !important;
  overflow: visible !important;
  margin: 0 !important;
  pointer-events: none !important;
  z-index: 2147483500 !important;
}

#apAprishaOmegaConsoleV1 .ao-panel {
  position: fixed !important;
  top: 82px !important;
  right: 16px !important;
  left: auto !important;
  bottom: auto !important;
  width: min(430px, calc(100vw - 32px)) !important;
  min-width: 340px !important;
  max-height: calc(100dvh - 96px) !important;
  overflow: auto !important;
  pointer-events: auto !important;
  z-index: 2147483600 !important;
}

#apAprishaOmegaConsoleV1 .ao-live {
  display: none !important;
  animation: none !important;
}

.apord-btn,
#${COMBO_ID},
.apord-combo-btn {
  animation: none !important;
}

.apord-btn,
.apord-combo-btn {
  position: relative !important;
  width: 42px !important;
  height: 42px !important;
  min-width: 42px !important;
  min-height: 42px !important;
  padding: 0 !important;
  margin: 0 !important;
  display: grid !important;
  place-items: center !important;
  border: 1px solid rgba(228,194,101,.28) !important;
  border-radius: 13px !important;
  background:
    radial-gradient(circle at 28% 18%, rgba(244,219,145,.08), transparent 42%),
    linear-gradient(150deg, rgba(29,31,36,.995), rgba(9,10,13,.998)) !important;
  color: #eed588 !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 8px 22px rgba(0,0,0,.30) !important;
  cursor: pointer !important;
  touch-action: manipulation !important;
  -webkit-tap-highlight-color: transparent !important;
  transition:
    transform .14s ease,
    border-color .14s ease,
    background .14s ease,
    box-shadow .14s ease !important;
}

.apord-btn:hover,
.apord-combo-btn:hover {
  transform: translateY(-1px) !important;
  border-color: rgba(239,208,119,.55) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 10px 28px rgba(0,0,0,.34) !important;
}

.apord-btn:active,
.apord-combo-btn:active {
  transform: scale(.97) !important;
}

.apord-btn[data-active="true"],
.apord-combo-btn[data-active="true"] {
  background:
    radial-gradient(circle at 28% 18%, rgba(244,219,145,.12), transparent 42%),
    linear-gradient(150deg, rgba(42,38,24,.995), rgba(10,10,12,.998)) !important;
  border-color: rgba(239,208,119,.72) !important;
}

.apord-icon {
  width: 24px !important;
  height: 24px !important;
  display: block !important;
  overflow: visible !important;
}

.apord-stroke {
  fill: none !important;
  stroke: #efd887 !important;
  stroke-width: 1.55 !important;
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
}

.apord-signal {
  fill: none !important;
  stroke: rgba(239,216,135,.66) !important;
  stroke-width: 1.08 !important;
  stroke-linecap: round !important;
}

.apord-fill {
  fill: #efd57d !important;
}

.apord-ring {
  fill: rgba(239,216,135,.024) !important;
  stroke: rgba(239,216,135,.18) !important;
  stroke-width: .9 !important;
}

/* The grouped pair for Human + Omega */
#${COMBO_ID} {
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0 !important;
  height: 42px !important;
  padding: 2px !important;
  border: 1px solid rgba(228,194,101,.30) !important;
  border-radius: 14px !important;
  background:
    radial-gradient(circle at 25% 12%, rgba(244,219,145,.08), transparent 40%),
    linear-gradient(150deg, rgba(28,30,35,.995), rgba(9,10,13,.998)) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 8px 24px rgba(0,0,0,.32) !important;
  overflow: hidden !important;
}

#${COMBO_ID} .apord-combo-btn {
  width: 40px !important;
  min-width: 40px !important;
  height: 38px !important;
  min-height: 38px !important;
  border: 0 !important;
  border-radius: 11px !important;
  background: transparent !important;
  box-shadow: none !important;
}

#${COMBO_ID} .apord-combo-btn + .apord-combo-btn::before {
  content: "" !important;
  position: absolute !important;
  left: -1px !important;
  top: 8px !important;
  width: 1px !important;
  height: 22px !important;
  background: rgba(255,255,255,.07) !important;
}

#${COMBO_ID} .apord-combo-btn:hover {
  background: rgba(235,202,111,.08) !important;
}

/* Force the requested order */
#${APRISHA_PROXY_ID} { order: 1 !important; }
#${COMBO_ID} { order: 2 !important; }
.ap-notification-icon-only,
[aria-label*="alert" i] { order: 3 !important; }
#settingsBtn { order: 4 !important; }
#profileBtn { order: 5 !important; }
#shareConversationBtn { order: 6 !important; }

.topbar-search,
.search-box {
  order: 7 !important;
}

/* Ensure requested right-side controls stay visible */
.ap-notification-icon-only,
#settingsBtn,
#profileBtn,
#shareConversationBtn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Mobile sizing */
@media (max-width: 767px) {
  .topbar-right {
    gap: 6px !important;
  }

  .apord-btn,
  .apord-combo-btn,
  #settingsBtn,
  .ap-notification-icon-only,
  #profileBtn,
  #shareConversationBtn {
    width: 40px !important;
    min-width: 40px !important;
    height: 40px !important;
    min-height: 40px !important;
  }

  #${COMBO_ID} {
    height: 40px !important;
    padding: 2px !important;
  }

  #${COMBO_ID} .apord-combo-btn {
    width: 38px !important;
    min-width: 38px !important;
    height: 36px !important;
    min-height: 36px !important;
  }

  #profileBtn img {
    width: 32px !important;
    height: 32px !important;
  }

  #apAprishaOmegaConsoleV1 .ao-panel {
    top: calc(64px + env(safe-area-inset-top)) !important;
    right: 8px !important;
    left: 8px !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    max-height: calc(100dvh - 80px - env(safe-area-inset-top)) !important;
  }
}

@media (max-width: 430px) {
  .topbar-right {
    gap: 5px !important;
  }

  .apord-btn,
  #settingsBtn,
  .ap-notification-icon-only,
  #profileBtn,
  #shareConversationBtn {
    width: 38px !important;
    min-width: 38px !important;
    height: 38px !important;
    min-height: 38px !important;
  }

  #${COMBO_ID} {
    height: 38px !important;
  }

  #${COMBO_ID} .apord-combo-btn {
    width: 36px !important;
    min-width: 36px !important;
    height: 34px !important;
    min-height: 34px !important;
  }

  .apord-icon {
    width: 22px !important;
    height: 22px !important;
  }

  #profileBtn img {
    width: 30px !important;
    height: 30px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .apord-btn,
  .apord-combo-btn {
    transition: none !important;
  }
}
`;
  }

  function buildAprishaProxy() {
    let button = document.getElementById(APRISHA_PROXY_ID);
    if (button) return button;

    button = document.createElement("button");
    button.id = APRISHA_PROXY_ID;
    button.className = "apord-btn";
    button.type = "button";
    button.title = "Aprisha";
    button.setAttribute("aria-label", "Aprisha");
    button.innerHTML = svgAprisha();

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      originalAprisha()?.click();
    });

    return button;
  }

  function buildCombo() {
    let combo = document.getElementById(COMBO_ID);
    if (combo) return combo;

    combo = document.createElement("div");
    combo.id = COMBO_ID;
    combo.setAttribute("role", "group");
    combo.setAttribute("aria-label", "Aprisha Human Interface and Omega");

    const human = document.createElement("button");
    human.id = HUMAN_PROXY_ID;
    human.className = "apord-combo-btn";
    human.type = "button";
    human.title = "Aprisha Human Interface";
    human.setAttribute("aria-label", "Aprisha Human Interface");
    human.setAttribute("data-active", "false");
    human.innerHTML = svgHuman();

    human.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      humanLaunch()?.click();
      window.setTimeout(syncActiveState, 50);
      window.setTimeout(syncActiveState, 400);
    });

    const omega = document.createElement("button");
    omega.id = OMEGA_PROXY_ID;
    omega.className = "apord-combo-btn";
    omega.type = "button";
    omega.title = "Aprisha Omega";
    omega.setAttribute("aria-label", "Aprisha Omega");
    omega.setAttribute("data-active", "false");
    omega.innerHTML = svgOmega();

    omega.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (omegaRoot()?.classList.contains("open")) {
        window.APAprishaOmega?.closeConsole?.();
      } else {
        window.APAprishaOmega?.openConsole?.();
      }

      window.setTimeout(syncActiveState, 50);
      window.setTimeout(syncActiveState, 400);
    });

    combo.append(human, omega);
    return combo;
  }

  function moveOmegaRoot() {
    const root = omegaRoot();
    if (root && root.parentElement !== document.body) {
      document.body.appendChild(root);
    }
  }

  function orderedInsert() {
    const bar = topbarRight();
    const notif = notificationButton();
    const settings = settingsButton();
    const profile = profileButton();
    const share = shareButton();
    const search = searchContainer();
    const aprishaProxy = buildAprishaProxy();
    const combo = buildCombo();

    if (!bar) return false;

    if (aprishaProxy.parentElement !== bar) {
      bar.appendChild(aprishaProxy);
    }
    if (combo.parentElement !== bar) {
      bar.appendChild(combo);
    }

    const desired = [aprishaProxy, combo, notif, settings, profile, share, search].filter(Boolean);

    desired.forEach((node) => {
      if (node.parentElement === bar) {
        bar.appendChild(node);
      }
    });

    return true;
  }

  function syncActiveState() {
    const human = document.getElementById(HUMAN_PROXY_ID);
    const omega = document.getElementById(OMEGA_PROXY_ID);

    if (human) {
      human.setAttribute(
        "data-active",
        humanRoot()?.classList.contains("open") ? "true" : "false"
      );
    }

    if (omega) {
      omega.setAttribute(
        "data-active",
        omegaRoot()?.classList.contains("open") ? "true" : "false"
      );
    }
  }

  function observeState() {
    const hRoot = humanRoot();
    const oRoot = omegaRoot();

    if (hRoot && !hRoot.dataset.apordObserved) {
      const mo = new MutationObserver(syncActiveState);
      mo.observe(hRoot, { attributes: true, attributeFilter: ["class"] });
      hRoot.dataset.apordObserved = "true";
    }

    if (oRoot && !oRoot.dataset.apordObserved) {
      const mo = new MutationObserver(syncActiveState);
      mo.observe(oRoot, { attributes: true, attributeFilter: ["class"] });
      oRoot.dataset.apordObserved = "true";
    }
  }

  function readyToBuild() {
    return !!(
      topbarRight() &&
      originalAprisha() &&
      humanLaunch() &&
      omegaRoot() &&
      notificationButton() &&
      settingsButton() &&
      profileButton()
    );
  }

  function boot() {
    bootAttempts += 1;

    if (!readyToBuild()) {
      if (bootAttempts < BOOT_LIMIT) {
        window.setTimeout(boot, 250);
      }
      return;
    }

    injectStyles();
    moveOmegaRoot();
    orderedInsert();
    syncActiveState();
    observeState();

    console.log("APRISHA ORDERED TOPBAR V1 READY", {
      order: [
        "Aprisha",
        "Human+Omega",
        "Notification",
        "Settings",
        "Profile",
        "Share"
      ]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();