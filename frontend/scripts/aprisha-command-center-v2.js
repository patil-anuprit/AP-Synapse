(() => {
  "use strict";

  const STYLE_ID = "ap-aprisha-command-center-v2-style";
  const HUMAN_PROXY_ID = "apHumanInterfaceTopbarBtn";
  const MORE_ID = "apTopbarMoreV2";
  const MORE_PANEL_ID = "apTopbarMorePanelV2";

  if (window.__AP_APRISHA_COMMAND_CENTER_V2__) return;
  window.__AP_APRISHA_COMMAND_CENTER_V2__ = true;

  const q = (selector, root = document) => root.querySelector(selector);

  function getTopbarRight() {
    return q(".topbar .topbar-right") || q(".topbar-right");
  }

  function humanRuntimeButton() {
    return q("#apAprishaHumanInterfaceV2 .aphi-launch");
  }

  function omegaRoot() {
    return document.getElementById("apAprishaOmegaConsoleV1");
  }

  function iconHuman() {
    return `
      <svg class="apcc-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="apccHumanGold" x1="4" y1="3" x2="23" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#fff0b9"/>
            <stop offset=".5" stop-color="#e7c76c"/>
            <stop offset="1" stop-color="#a98537"/>
          </linearGradient>
        </defs>
        <path class="apcc-human-palm"
          d="M8.1 12.8V8.3c0-.9.68-1.58 1.53-1.58.86 0 1.54.69 1.54 1.58v3.45-5.33c0-.91.7-1.62 1.56-1.62.87 0 1.57.71 1.57 1.62v5.23-4.36c0-.89.69-1.58 1.54-1.58.86 0 1.55.69 1.55 1.58v5.02-3.26c0-.84.66-1.49 1.48-1.49.83 0 1.49.65 1.49 1.49v5.88c0 5.04-2.58 8.04-7.11 8.04-4.29 0-7.22-2.71-7.22-6.77v-1.72c0-1.05.78-1.84 1.77-1.84h.31Z"/>
        <circle class="apcc-human-node" cx="22.1" cy="7.2" r="1.3"/>
        <path class="apcc-human-signal" d="M21.7 3.4c1.7.55 2.87 1.69 3.46 3.35"/>
      </svg>`;
  }

  function iconOmega() {
    return `
      <svg class="apcc-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <circle class="apcc-omega-ring" cx="14" cy="14" r="10.2"/>
        <path class="apcc-omega-orbit" d="M4.1 11.6C5.38 6.84 9.12 3.72 14 3.72c4.4 0 8.05 2.56 9.55 6.44"/>
        <circle class="apcc-omega-node" cx="23.65" cy="10.3" r="1.2"/>
        <text class="apcc-omega-text" x="14" y="19.1" text-anchor="middle">Ω</text>
      </svg>`;
  }

  function iconMore() {
    return `
      <svg class="apcc-icon apcc-more-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <circle cx="7.2" cy="14" r="1.55"/>
        <circle cx="14" cy="14" r="1.55"/>
        <circle cx="20.8" cy="14" r="1.55"/>
      </svg>`;
  }

  function injectStyles() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    style.textContent = `
/* ==========================================================
   AP SYNAPSE — APRISHA COMMAND CENTER V2
   Clean mobile/desktop intelligence controls
========================================================== */

.topbar,
.topbar-right {
  overflow: visible !important;
}

.topbar-right {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 7px !important;
  min-width: 0 !important;
}

/* Hide original floating Human Interface launcher.
   Its actual click handler is preserved and triggered by proxy. */
#apAprishaHumanInterfaceV2 .aphi-launch {
  display: none !important;
}

/* ---------- shared command buttons ---------- */
#${HUMAN_PROXY_ID},
#${MORE_ID},
#apAprishaOmegaConsoleV1 .ao-launch {
  position: relative !important;
  width: 44px !important;
  height: 44px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  flex: 0 0 44px !important;
  padding: 0 !important;
  margin: 0 !important;

  display: grid !important;
  place-items: center !important;

  border: 1px solid rgba(220, 188, 98, .28) !important;
  border-radius: 14px !important;

  background:
    radial-gradient(circle at 30% 15%, rgba(244, 219, 145, .085), transparent 42%),
    linear-gradient(150deg, rgba(29,31,37,.99), rgba(9,10,13,.995)) !important;

  color: #efd788 !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 8px 24px rgba(0,0,0,.30) !important;

  cursor: pointer !important;
  touch-action: manipulation !important;
  -webkit-tap-highlight-color: transparent !important;

  overflow: hidden !important;
  visibility: visible !important;
  opacity: 1 !important;

  transition:
    transform .14s ease,
    border-color .14s ease,
    background .14s ease,
    box-shadow .14s ease !important;
}

#${HUMAN_PROXY_ID}:hover,
#${MORE_ID}:hover,
#apAprishaOmegaConsoleV1 .ao-launch:hover {
  transform: translateY(-1px) !important;
  border-color: rgba(239, 208, 119, .60) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 11px 28px rgba(0,0,0,.36),
    0 0 18px rgba(229,193,96,.10) !important;
}

#${HUMAN_PROXY_ID}:active,
#${MORE_ID}:active,
#apAprishaOmegaConsoleV1 .ao-launch:active {
  transform: scale(.965) !important;
}

#${HUMAN_PROXY_ID}:focus-visible,
#${MORE_ID}:focus-visible,
#apAprishaOmegaConsoleV1 .ao-launch:focus-visible {
  outline: none !important;
  box-shadow:
    0 0 0 3px rgba(229,193,96,.17),
    0 9px 26px rgba(0,0,0,.34) !important;
}

/* active Human Interface state */
#${HUMAN_PROXY_ID}[data-active="true"] {
  border-color: rgba(239,208,119,.72) !important;
  background:
    radial-gradient(circle at 30% 15%, rgba(244,219,145,.13), transparent 42%),
    linear-gradient(150deg, #292820, #0c0d10) !important;
}

/* shared SVG */
.apcc-icon {
  width: 27px !important;
  height: 27px !important;
  display: block !important;
  overflow: visible !important;
}

/* Human Interface mark */
#${HUMAN_PROXY_ID} .apcc-human-palm {
  fill: none;
  stroke: url(#apccHumanGold);
  stroke-width: 1.55;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 3px rgba(231,199,108,.16));
}
#${HUMAN_PROXY_ID} .apcc-human-node {
  fill: #efd47b;
  filter: drop-shadow(0 0 4px rgba(239,212,123,.50));
}
#${HUMAN_PROXY_ID} .apcc-human-signal {
  fill: none;
  stroke: rgba(239,212,123,.72);
  stroke-width: 1.15;
  stroke-linecap: round;
}

/* Omega — replace weak old art with strong readable mark */
#apAprishaOmegaConsoleV1 {
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  flex: 0 0 auto !important;
  margin: 0 !important;
  z-index: 2147482500 !important;
  overflow: visible !important;
}

#apAprishaOmegaConsoleV1 .ao-mark {
  width: 27px !important;
  height: 27px !important;
  display: grid !important;
  place-items: center !important;
}

#apAprishaOmegaConsoleV1 .ao-mark > * {
  display: none !important;
}

#apAprishaOmegaConsoleV1 .ao-mark .apcc-icon {
  display: block !important;
}

#apAprishaOmegaConsoleV1 .apcc-omega-ring {
  fill: rgba(235,203,111,.035);
  stroke: rgba(235,203,111,.28);
  stroke-width: 1;
}
#apAprishaOmegaConsoleV1 .apcc-omega-orbit {
  fill: none;
  stroke: rgba(239,211,126,.46);
  stroke-width: 1.15;
  stroke-linecap: round;
}
#apAprishaOmegaConsoleV1 .apcc-omega-node {
  fill: #f0d57d;
  filter: drop-shadow(0 0 4px rgba(240,213,125,.52));
}
#apAprishaOmegaConsoleV1 .apcc-omega-text {
  fill: #f5dfa0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -.4px;
}

/* status dot is intentionally tiny and quiet */
#apAprishaOmegaConsoleV1 .ao-live {
  width: 6px !important;
  height: 6px !important;
  top: 5px !important;
  right: 5px !important;
  border: 1.5px solid #111318 !important;
  background: #e9ca70 !important;
  box-shadow: 0 0 7px rgba(233,202,112,.40) !important;
}

/* Omega panel */
#apAprishaOmegaConsoleV1 .ao-panel {
  top: calc(100% + 10px) !important;
  right: 0 !important;
  left: auto !important;
  bottom: auto !important;
  width: min(430px, calc(100vw - 24px)) !important;
  min-width: 350px !important;
  z-index: 2147483600 !important;
}

/* ---------- overflow menu ---------- */
#${MORE_ID} {
  display: none !important;
}

#${MORE_PANEL_ID} {
  display: none;
  position: fixed;
  z-index: 2147483640;
  width: 220px;
  padding: 7px;
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 16px;
  background:
    radial-gradient(circle at 15% 0%, rgba(235,201,107,.08), transparent 35%),
    rgba(13,14,17,.985);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  box-shadow:
    0 24px 70px rgba(0,0,0,.50),
    inset 0 1px 0 rgba(255,255,255,.035);
}

#${MORE_PANEL_ID}.open {
  display: block;
  animation: apccMenuIn .14s ease-out;
}

@keyframes apccMenuIn {
  from { opacity: 0; transform: translateY(-4px) scale(.985); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

#${MORE_PANEL_ID} .apcc-menu-label {
  padding: 8px 10px 6px;
  color: rgba(255,255,255,.38);
  font-size: 9px;
  font-weight: 750;
  letter-spacing: .13em;
  text-transform: uppercase;
}

#${MORE_PANEL_ID} .apcc-menu-item {
  width: 100%;
  min-height: 42px;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgba(255,255,255,.78);
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  font: 600 12px/1 Inter,system-ui,sans-serif;
  cursor: pointer;
}

#${MORE_PANEL_ID} .apcc-menu-item:hover {
  background: rgba(255,255,255,.055);
  color: #fff;
}

#${MORE_PANEL_ID} .apcc-menu-glyph {
  width: 24px;
  height: 24px;
  border: 1px solid rgba(229,196,104,.15);
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #dfc46f;
  font-size: 12px;
  flex: 0 0 24px;
}

/* ---------- keep existing Aprisha premium but prevent compression ---------- */
#apDedicatedAprishaButton {
  flex: 0 0 auto !important;
}

/* ---------- desktop: clean spacing ---------- */
@media (min-width: 768px) {
  #${HUMAN_PROXY_ID} {
    display: grid !important;
  }
}

/* ---------- mobile command bar ---------- */
@media (max-width: 767px) {
  .topbar-right {
    gap: 5px !important;
  }

  #${HUMAN_PROXY_ID},
  #${MORE_ID},
  #apAprishaOmegaConsoleV1 .ao-launch {
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    min-height: 40px !important;
    flex-basis: 40px !important;
    border-radius: 12px !important;
  }

  .apcc-icon,
  #apAprishaOmegaConsoleV1 .ao-mark {
    width: 25px !important;
    height: 25px !important;
  }

  /* mobile gets a deliberate command cluster:
     Aprisha / Human / Omega / Profile / More */
  #settingsBtn,
  #apMobileThemeToggle,
  .ap-notification-icon-only,
  #shareConversationBtn {
    display: none !important;
  }

  #${MORE_ID} {
    display: grid !important;
  }

  #apDedicatedAprishaButton {
    width: 40px !important;
    min-width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
    border-radius: 12px !important;
    font-size: 0 !important;
    gap: 0 !important;
    flex: 0 0 40px !important;
  }

  #apDedicatedAprishaButton > span:not(.aprisha-icon) {
    display: none !important;
  }

  #apDedicatedAprishaButton .aprisha-icon {
    display: block !important;
    width: 10px !important;
    height: 10px !important;
    margin: 0 !important;
    border-radius: 50% !important;
    background: #e5c768 !important;
    box-shadow:
      0 0 0 5px rgba(229,199,104,.07),
      0 0 11px rgba(229,199,104,.35) !important;
  }

  #apDedicatedAprishaButton::after {
    content: "A" !important;
    display: block !important;
    position: absolute !important;
    font: 800 12px/1 Inter,system-ui,sans-serif !important;
    color: #e9d283 !important;
    transform: translateY(13px) scale(.62) !important;
    opacity: .72 !important;
  }

  #profileBtn {
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    flex: 0 0 40px !important;
    padding: 3px !important;
  }

  #profileBtn img {
    width: 32px !important;
    height: 32px !important;
  }

  #apAprishaOmegaConsoleV1 .ao-panel {
    position: fixed !important;
    top: calc(66px + env(safe-area-inset-top)) !important;
    right: 8px !important;
    left: 8px !important;
    bottom: auto !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    max-height: calc(100dvh - 82px - env(safe-area-inset-top)) !important;
    overflow: auto !important;
  }
}

@media (max-width: 430px) {
  .topbar-right {
    gap: 4px !important;
  }

  #${HUMAN_PROXY_ID},
  #${MORE_ID},
  #apAprishaOmegaConsoleV1 .ao-launch,
  #apDedicatedAprishaButton,
  #profileBtn {
    width: 38px !important;
    min-width: 38px !important;
    height: 38px !important;
    min-height: 38px !important;
    flex-basis: 38px !important;
    border-radius: 11px !important;
  }

  .apcc-icon,
  #apAprishaOmegaConsoleV1 .ao-mark {
    width: 24px !important;
    height: 24px !important;
  }

  #profileBtn img {
    width: 30px !important;
    height: 30px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  #${HUMAN_PROXY_ID},
  #${MORE_ID},
  #apAprishaOmegaConsoleV1 .ao-launch,
  #${MORE_PANEL_ID} {
    transition: none !important;
    animation: none !important;
  }
}
`;
  }

  function ensureHumanProxy() {
    const topbarRight = getTopbarRight();
    const original = humanRuntimeButton();

    if (!topbarRight || !original) return null;

    let button = document.getElementById(HUMAN_PROXY_ID);

    if (!button) {
      button = document.createElement("button");
      button.id = HUMAN_PROXY_ID;
      button.type = "button";
      button.className = "apcc-command-button apcc-human-button";
      button.title = "Aprisha Human Interface";
      button.setAttribute("aria-label", "Open Aprisha Human Interface");
      button.innerHTML = iconHuman();

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const runtimeButton = humanRuntimeButton();
        if (runtimeButton) runtimeButton.click();
      });
    }

    const aprisha = document.getElementById("apDedicatedAprishaButton");
    const omega = omegaRoot();

    if (aprisha && aprisha.parentElement === topbarRight) {
      if (aprisha.nextElementSibling !== button) {
        aprisha.insertAdjacentElement("afterend", button);
      }
    } else if (omega && omega.parentElement === topbarRight) {
      topbarRight.insertBefore(button, omega);
    } else if (button.parentElement !== topbarRight) {
      topbarRight.prepend(button);
    }

    return button;
  }

  function beautifyOmega() {
    const root = omegaRoot();
    const topbarRight = getTopbarRight();

    if (!root || !topbarRight) return false;

    const human = document.getElementById(HUMAN_PROXY_ID);
    const launch = q(".ao-launch", root);
    const mark = q(".ao-mark", root);

    if (launch) {
      launch.title = "Aprisha Ω — Universal Action Intelligence";
      launch.setAttribute("aria-label", "Open Aprisha Omega");
    }

    if (mark && !q(".apcc-icon", mark)) {
      mark.innerHTML = iconOmega();
    }

    if (human && human.parentElement === topbarRight) {
      if (human.nextElementSibling !== root) {
        human.insertAdjacentElement("afterend", root);
      }
    } else {
      const aprisha = document.getElementById("apDedicatedAprishaButton");
      if (aprisha && aprisha.parentElement === topbarRight) {
        aprisha.insertAdjacentElement("afterend", root);
      } else if (root.parentElement !== topbarRight) {
        topbarRight.prepend(root);
      }
    }

    return true;
  }

  function makeMenuItem(label, glyph, targetGetter) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "apcc-menu-item";
    button.innerHTML = `
      <span class="apcc-menu-glyph" aria-hidden="true">${glyph}</span>
      <span>${label}</span>
    `;

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const target = targetGetter();
      closeMore();

      if (target && typeof target.click === "function") {
        target.click();
      }
    });

    return button;
  }

  function ensureMoreMenu() {
    const topbarRight = getTopbarRight();
    if (!topbarRight) return;

    let button = document.getElementById(MORE_ID);
    let panel = document.getElementById(MORE_PANEL_ID);

    if (!button) {
      button = document.createElement("button");
      button.id = MORE_ID;
      button.type = "button";
      button.title = "More workspace controls";
      button.setAttribute("aria-label", "More workspace controls");
      button.setAttribute("aria-expanded", "false");
      button.innerHTML = iconMore();

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleMore(button);
      });
    }

    if (!panel) {
      panel = document.createElement("div");
      panel.id = MORE_PANEL_ID;
      panel.setAttribute("role", "menu");
      panel.innerHTML = `<div class="apcc-menu-label">Workspace controls</div>`;

      panel.append(
        makeMenuItem(
          "Settings",
          "⚙",
          () => document.getElementById("settingsBtn")
        ),
        makeMenuItem(
          "Appearance",
          "◐",
          () => document.getElementById("apMobileThemeToggle")
        ),
        makeMenuItem(
          "Activity",
          "•",
          () => q(".ap-notification-icon-only")
        ),
        makeMenuItem(
          "Share conversation",
          "↗",
          () => document.getElementById("shareConversationBtn")
        )
      );

      document.body.appendChild(panel);
    }

    const profile = document.getElementById("profileBtn");

    if (profile && profile.parentElement === topbarRight) {
      profile.insertAdjacentElement("afterend", button);
    } else if (button.parentElement !== topbarRight) {
      topbarRight.appendChild(button);
    }
  }

  function positionMore(button) {
    const panel = document.getElementById(MORE_PANEL_ID);
    if (!panel || !button) return;

    const rect = button.getBoundingClientRect();
    const width = 220;
    const margin = 8;

    let left = rect.right - width;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

    panel.style.left = `${left}px`;
    panel.style.top = `${Math.min(rect.bottom + 8, window.innerHeight - 260)}px`;
  }

  function openMore(button) {
    const panel = document.getElementById(MORE_PANEL_ID);
    if (!panel) return;

    positionMore(button);
    panel.classList.add("open");
    button.setAttribute("aria-expanded", "true");
  }

  function closeMore() {
    const button = document.getElementById(MORE_ID);
    const panel = document.getElementById(MORE_PANEL_ID);

    panel?.classList.remove("open");
    button?.setAttribute("aria-expanded", "false");
  }

  function toggleMore(button) {
    const panel = document.getElementById(MORE_PANEL_ID);
    if (!panel) return;

    if (panel.classList.contains("open")) closeMore();
    else openMore(button);
  }

  function updateHumanState() {
    const proxy = document.getElementById(HUMAN_PROXY_ID);
    const root = document.getElementById("apAprishaHumanInterfaceV2");
    if (!proxy || !root) return;

    proxy.dataset.active = root.classList.contains("open") ? "true" : "false";
  }

  function repair() {
    injectStyles();
    ensureHumanProxy();
    beautifyOmega();
    ensureMoreMenu();
    updateHumanState();
  }

  function boot() {
    repair();

    let framePending = false;

    const observer = new MutationObserver(() => {
      if (framePending) return;
      framePending = true;

      requestAnimationFrame(() => {
        framePending = false;
        repair();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"]
    });

    document.addEventListener("pointerdown", (event) => {
      const panel = document.getElementById(MORE_PANEL_ID);
      const button = document.getElementById(MORE_ID);

      if (!panel?.classList.contains("open")) return;
      if (panel.contains(event.target) || button?.contains(event.target)) return;

      closeMore();
    }, true);

    window.addEventListener("resize", () => {
      const button = document.getElementById(MORE_ID);
      const panel = document.getElementById(MORE_PANEL_ID);

      if (button && panel?.classList.contains("open")) {
        positionMore(button);
      }
    }, { passive: true });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMore();
    });

    console.log("APRISHA COMMAND CENTER V2 READY", {
      humanInterface: !!humanRuntimeButton(),
      humanProxy: !!document.getElementById(HUMAN_PROXY_ID),
      omega: !!omegaRoot(),
      mobileCompact: window.matchMedia("(max-width: 767px)").matches
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();