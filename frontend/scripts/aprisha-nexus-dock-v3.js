(() => {
  "use strict";

  const FLAG = "__AP_APRISHA_NEXUS_DOCK_V3__";
  if (window[FLAG]) return;
  window[FLAG] = true;

  const DOCK_ID = "apAprishaNexusDockV3";
  const MORE_ID = "apAprishaNexusMoreV3";
  const MENU_ID = "apAprishaNexusMenuV3";
  const STYLE_ID = "apAprishaNexusDockV3Style";

  const q = (selector, root = document) => root.querySelector(selector);

  let setupObserver = null;
  let finishedSetup = false;

  function topbarRight() {
    return q(".topbar .topbar-right") || q(".topbar-right");
  }

  function originalAprisha() {
    return document.getElementById("apDedicatedAprishaButton");
  }

  function humanButton() {
    return q("#apAprishaHumanInterfaceV2 .aphi-launch");
  }

  function omegaRoot() {
    return document.getElementById("apAprishaOmegaConsoleV1");
  }

  function omegaLaunch() {
    return q("#apAprishaOmegaConsoleV1 .ao-launch");
  }

  function profileButton() {
    return document.getElementById("profileBtn");
  }

  function svgAprisha() {
    return `
      <svg class="apnx-icon" viewBox="0 0 28 28" aria-hidden="true">
        <path class="apnx-main"
          d="M5.7 21.7 12.1 5.8c.34-.84 1.15-1.39 2.05-1.39.92 0 1.74.56 2.08 1.42l6.07 15.87"/>
        <path class="apnx-main" d="M9.2 14.1h9.85"/>
        <circle class="apnx-node" cx="14.12" cy="5.1" r="1.22"/>
      </svg>`;
  }

  function svgHuman() {
    return `
      <svg class="apnx-icon" viewBox="0 0 28 28" aria-hidden="true">
        <path class="apnx-main"
          d="M8.4 13.2V8.7c0-.88.65-1.54 1.47-1.54s1.48.66 1.48 1.54v3.2-5.02c0-.9.69-1.6 1.54-1.6.86 0 1.55.7 1.55 1.6v5-4.15c0-.84.65-1.5 1.47-1.5.81 0 1.46.66 1.46 1.5v4.72-3.06c0-.79.61-1.4 1.37-1.4s1.38.61 1.38 1.4v5.61c0 4.84-2.49 7.71-6.86 7.71-4.16 0-6.98-2.61-6.98-6.49v-1.64c0-1.02.75-1.79 1.7-1.79h.42Z"/>
        <path class="apnx-signal" d="M21.3 4.25c1.58.52 2.71 1.56 3.27 3.08"/>
        <circle class="apnx-node" cx="22.12" cy="7.1" r="1.1"/>
      </svg>`;
  }

  function svgOmega() {
    return `
      <svg class="apnx-icon" viewBox="0 0 28 28" aria-hidden="true">
        <circle class="apnx-soft-ring" cx="14" cy="14" r="10.15"/>
        <path class="apnx-main"
          d="M7.9 20.5h4.08v-3.13c-2.37-.88-3.98-3.12-3.98-5.83 0-3.9 2.62-6.53 6-6.53s6 2.63 6 6.53c0 2.71-1.61 4.95-3.98 5.83v3.13h4.08"/>
        <circle class="apnx-node" cx="22.75" cy="8.2" r="1.05"/>
      </svg>`;
  }

  function svgMore() {
    return `
      <svg class="apnx-more-icon" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="7.2" cy="14" r="1.5"/>
        <circle cx="14" cy="14" r="1.5"/>
        <circle cx="20.8" cy="14" r="1.5"/>
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
/* =========================================================
   AP SYNAPSE — APRISHA NEXUS DOCK V3
   Stable, static, no pulse / no blinking
========================================================= */

.topbar,
.topbar-right {
  overflow: visible !important;
}

.topbar-right {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 8px !important;
  min-width: 0 !important;
}

/* Original launch controls stay functional but are not shown. */
#apDedicatedAprishaButton {
  display: none !important;
}

#apAprishaHumanInterfaceV2 .aphi-launch {
  display: none !important;
}

#apAprishaOmegaConsoleV1 .ao-launch {
  display: none !important;
}

/* Decouple the Omega panel from the crowded topbar. */
#apAprishaOmegaConsoleV1 {
  position: fixed !important;
  inset: 0 auto auto 0 !important;
  width: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  overflow: visible !important;
  z-index: 2147483500 !important;
  pointer-events: none !important;
}

#apAprishaOmegaConsoleV1 .ao-panel {
  position: fixed !important;
  top: 82px !important;
  right: 18px !important;
  bottom: auto !important;
  left: auto !important;
  width: min(430px, calc(100vw - 36px)) !important;
  min-width: 340px !important;
  max-height: calc(100dvh - 100px) !important;
  overflow: auto !important;
  z-index: 2147483600 !important;
  pointer-events: auto !important;
}

/* ---------- Unified 3-part Aprisha dock ---------- */
#${DOCK_ID} {
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 0 0 auto !important;

  height: 44px !important;
  padding: 3px !important;
  gap: 0 !important;

  border: 1px solid rgba(226, 194, 108, .30) !important;
  border-radius: 15px !important;

  background:
    radial-gradient(circle at 18% 10%, rgba(244,219,145,.09), transparent 42%),
    linear-gradient(150deg, rgba(28,30,35,.995), rgba(8,9,12,.998)) !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.045),
    0 9px 28px rgba(0,0,0,.33) !important;

  overflow: hidden !important;
  isolation: isolate !important;
}

#${DOCK_ID}::after {
  content: "" !important;
  position: absolute !important;
  inset: 0 !important;
  border-radius: inherit !important;
  pointer-events: none !important;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.012) !important;
}

#${DOCK_ID} .apnx-segment {
  position: relative !important;

  width: 40px !important;
  height: 36px !important;
  min-width: 40px !important;

  padding: 0 !important;
  margin: 0 !important;

  border: 0 !important;
  border-radius: 11px !important;

  display: grid !important;
  place-items: center !important;

  background: transparent !important;
  color: #eed487 !important;

  cursor: pointer !important;
  touch-action: manipulation !important;
  -webkit-tap-highlight-color: transparent !important;

  opacity: .92 !important;

  transition:
    background .14s ease,
    opacity .14s ease,
    transform .14s ease !important;
}

#${DOCK_ID} .apnx-segment + .apnx-segment::before {
  content: "" !important;
  position: absolute !important;
  left: -1px !important;
  top: 8px !important;
  width: 1px !important;
  height: 20px !important;
  background: rgba(255,255,255,.07) !important;
}

#${DOCK_ID} .apnx-segment:hover {
  background: rgba(235, 202, 111, .075) !important;
  opacity: 1 !important;
}

#${DOCK_ID} .apnx-segment:active {
  transform: scale(.94) !important;
}

#${DOCK_ID} .apnx-segment:focus-visible {
  outline: none !important;
  background: rgba(235,202,111,.09) !important;
  box-shadow: inset 0 0 0 1px rgba(239,208,119,.25) !important;
}

#${DOCK_ID} .apnx-segment[data-active="true"] {
  background:
    radial-gradient(circle at 50% 30%, rgba(242,214,133,.12), transparent 58%),
    rgba(229,193,96,.055) !important;
  opacity: 1 !important;
}

#${DOCK_ID} .apnx-icon {
  width: 24px !important;
  height: 24px !important;
  display: block !important;
  overflow: visible !important;
}

#${DOCK_ID} .apnx-main {
  fill: none !important;
  stroke: #efd887 !important;
  stroke-width: 1.55 !important;
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
}

#${DOCK_ID} .apnx-signal {
  fill: none !important;
  stroke: rgba(239,216,135,.66) !important;
  stroke-width: 1.08 !important;
  stroke-linecap: round !important;
}

#${DOCK_ID} .apnx-node {
  fill: #efd57e !important;
}

#${DOCK_ID} .apnx-soft-ring {
  fill: rgba(239,216,135,.025) !important;
  stroke: rgba(239,216,135,.18) !important;
  stroke-width: .9 !important;
}

/* No pulse, blink, orbit animation, status flashing, or shimmer. */
#${DOCK_ID},
#${DOCK_ID} *,
#apAprishaOmegaConsoleV1 .ao-live {
  animation: none !important;
}

#apAprishaOmegaConsoleV1 .ao-live {
  display: none !important;
}

/* ---------- More ---------- */
#${MORE_ID} {
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  padding: 0 !important;

  display: none !important;
  place-items: center !important;

  border: 1px solid rgba(255,255,255,.09) !important;
  border-radius: 12px !important;

  background: rgba(255,255,255,.025) !important;
  color: rgba(255,255,255,.55) !important;

  cursor: pointer !important;
  touch-action: manipulation !important;
}

#${MORE_ID}:hover {
  background: rgba(255,255,255,.055) !important;
  color: rgba(255,255,255,.80) !important;
}

#${MORE_ID} .apnx-more-icon {
  width: 24px !important;
  height: 24px !important;
  fill: currentColor !important;
}

#${MENU_ID} {
  display: none;
  position: fixed;
  width: 224px;
  z-index: 2147483642;

  padding: 8px;

  border: 1px solid rgba(255,255,255,.09);
  border-radius: 16px;

  background:
    radial-gradient(circle at 15% 0%, rgba(235,201,107,.07), transparent 34%),
    rgba(13,14,17,.988);

  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);

  box-shadow:
    0 24px 70px rgba(0,0,0,.52),
    inset 0 1px 0 rgba(255,255,255,.035);
}

#${MENU_ID}.open {
  display: block;
}

#${MENU_ID} .apnx-menu-kicker {
  padding: 8px 10px 7px;
  color: rgba(255,255,255,.36);
  font-size: 9px;
  font-weight: 750;
  letter-spacing: .12em;
  text-transform: uppercase;
}

#${MENU_ID} .apnx-menu-item {
  width: 100%;
  min-height: 42px;
  padding: 0 10px;

  border: 0;
  border-radius: 10px;

  background: transparent;
  color: rgba(255,255,255,.76);

  display: flex;
  align-items: center;
  gap: 10px;

  font: 600 12px/1 Inter,system-ui,sans-serif;
  text-align: left;

  cursor: pointer;
}

#${MENU_ID} .apnx-menu-item:hover {
  background: rgba(255,255,255,.055);
  color: #fff;
}

#${MENU_ID} .apnx-menu-symbol {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;

  border: 1px solid rgba(229,196,104,.14);
  border-radius: 8px;

  display: grid;
  place-items: center;

  color: #dbc16e;
  font-size: 12px;
}

/* ---------- Mobile: only Dock + Profile + More ---------- */
@media (max-width: 767px) {
  .topbar-right {
    gap: 6px !important;
  }

  .topbar-right > * {
    display: none !important;
  }

  .topbar-right > #${DOCK_ID},
  .topbar-right > #profileBtn,
  .topbar-right > #${MORE_ID} {
    display: inline-flex !important;
  }

  #${DOCK_ID} {
    height: 40px !important;
    padding: 3px !important;
    border-radius: 13px !important;
  }

  #${DOCK_ID} .apnx-segment {
    width: 36px !important;
    min-width: 36px !important;
    height: 32px !important;
    border-radius: 9px !important;
  }

  #${DOCK_ID} .apnx-icon {
    width: 22px !important;
    height: 22px !important;
  }

  #profileBtn {
    width: 40px !important;
    min-width: 40px !important;
    height: 40px !important;
    padding: 3px !important;
    border-radius: 12px !important;
    flex: 0 0 40px !important;
  }

  #profileBtn img {
    width: 32px !important;
    height: 32px !important;
  }

  #${MORE_ID} {
    display: grid !important;
  }

  #apAprishaOmegaConsoleV1 .ao-panel {
    top: calc(64px + env(safe-area-inset-top)) !important;
    left: 8px !important;
    right: 8px !important;
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

  #${DOCK_ID} {
    height: 38px !important;
    border-radius: 12px !important;
  }

  #${DOCK_ID} .apnx-segment {
    width: 34px !important;
    min-width: 34px !important;
    height: 30px !important;
  }

  #${DOCK_ID} .apnx-icon {
    width: 21px !important;
    height: 21px !important;
  }

  #profileBtn,
  #${MORE_ID} {
    width: 38px !important;
    min-width: 38px !important;
    height: 38px !important;
    flex: 0 0 38px !important;
  }

  #profileBtn img {
    width: 30px !important;
    height: 30px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  #${DOCK_ID} .apnx-segment {
    transition: none !important;
  }
}
`;
  }

  function makeSegment(role, label, svg) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "apnx-segment";
    button.dataset.role = role;
    button.dataset.active = "false";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.innerHTML = svg;
    return button;
  }

  function buildDock() {
    const bar = topbarRight();
    if (!bar) return null;

    let dock = document.getElementById(DOCK_ID);
    if (!dock) {
      dock = document.createElement("div");
      dock.id = DOCK_ID;
      dock.setAttribute("role", "group");
      dock.setAttribute("aria-label", "Aprisha intelligence controls");

      const aprisha = makeSegment("aprisha", "Aprisha", svgAprisha());
      const human = makeSegment("human", "Aprisha Human Interface", svgHuman());
      const omega = makeSegment("omega", "Aprisha Omega", svgOmega());

      aprisha.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        originalAprisha()?.click();
      });

      human.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        humanButton()?.click();
        window.setTimeout(syncState, 0);
      });

      omega.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const root = omegaRoot();
        if (root?.classList.contains("open")) {
          window.APAprishaOmega?.closeConsole?.();
        } else {
          window.APAprishaOmega?.openConsole?.();
        }
        window.setTimeout(syncState, 0);
      });

      dock.append(aprisha, human, omega);
    }

    const profile = profileButton();

    if (profile && profile.parentElement === bar) {
      if (profile.previousElementSibling !== dock) {
        bar.insertBefore(dock, profile);
      }
    } else if (dock.parentElement !== bar) {
      bar.appendChild(dock);
    }

    return dock;
  }

  function makeMenuItem(label, symbol, targetGetter) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "apnx-menu-item";
    button.innerHTML = `
      <span class="apnx-menu-symbol" aria-hidden="true">${symbol}</span>
      <span>${label}</span>
    `;

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const target = targetGetter();
      closeMenu();

      if (target && typeof target.click === "function") {
        target.click();
      }
    });

    return button;
  }

  function buildMore() {
    const bar = topbarRight();
    if (!bar) return null;

    let more = document.getElementById(MORE_ID);
    if (!more) {
      more = document.createElement("button");
      more.id = MORE_ID;
      more.type = "button";
      more.title = "More workspace controls";
      more.setAttribute("aria-label", "More workspace controls");
      more.setAttribute("aria-expanded", "false");
      more.innerHTML = svgMore();

      more.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleMenu();
      });
    }

    let menu = document.getElementById(MENU_ID);
    if (!menu) {
      menu = document.createElement("div");
      menu.id = MENU_ID;
      menu.setAttribute("role", "menu");
      menu.innerHTML = `<div class="apnx-menu-kicker">Workspace controls</div>`;

      menu.append(
        makeMenuItem("Settings", "⚙", () => document.getElementById("settingsBtn")),
        makeMenuItem("Appearance", "◐", () => document.getElementById("apMobileThemeToggle")),
        makeMenuItem("Activity", "•", () =>
          q(".ap-notification-icon-only") ||
          q('[aria-label="AP Synapse alerts"]') ||
          q('[title="Activity"]')
        ),
        makeMenuItem("Share conversation", "↗", () =>
          document.getElementById("shareConversationBtn")
        )
      );

      document.body.appendChild(menu);
    }

    const profile = profileButton();

    if (profile && profile.parentElement === bar) {
      if (profile.nextElementSibling !== more) {
        profile.insertAdjacentElement("afterend", more);
      }
    } else if (more.parentElement !== bar) {
      bar.appendChild(more);
    }

    return more;
  }

  function positionMenu() {
    const more = document.getElementById(MORE_ID);
    const menu = document.getElementById(MENU_ID);

    if (!more || !menu) return;

    const rect = more.getBoundingClientRect();
    const width = 224;
    const margin = 8;

    let left = rect.right - width;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

    const top = Math.min(rect.bottom + 8, window.innerHeight - 270);

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  function openMenu() {
    const more = document.getElementById(MORE_ID);
    const menu = document.getElementById(MENU_ID);
    if (!more || !menu) return;

    positionMenu();
    menu.classList.add("open");
    more.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    const more = document.getElementById(MORE_ID);
    const menu = document.getElementById(MENU_ID);

    menu?.classList.remove("open");
    more?.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    const menu = document.getElementById(MENU_ID);
    if (!menu) return;

    if (menu.classList.contains("open")) closeMenu();
    else openMenu();
  }

  function moveOmegaOutOfTopbar() {
    const root = omegaRoot();
    if (!root) return false;

    if (root.parentElement !== document.body) {
      document.body.appendChild(root);
    }

    return true;
  }

  function syncState() {
    const dock = document.getElementById(DOCK_ID);
    if (!dock) return;

    const humanSegment = q('[data-role="human"]', dock);
    const omegaSegment = q('[data-role="omega"]', dock);

    if (humanSegment) {
      humanSegment.dataset.active =
        humanButton()?.closest("#apAprishaHumanInterfaceV2")?.classList.contains("open")
          ? "true"
          : "false";
    }

    if (omegaSegment) {
      omegaSegment.dataset.active =
        omegaRoot()?.classList.contains("open") ? "true" : "false";
    }
  }

  function finishSetup() {
    if (finishedSetup) return true;

    const bar = topbarRight();
    const aprisha = originalAprisha();
    const human = humanButton();
    const omega = omegaRoot();
    const profile = profileButton();

    if (!bar || !aprisha || !human || !omega || !profile || !window.APAprishaOmega) {
      return false;
    }

    injectStyles();
    moveOmegaOutOfTopbar();
    buildDock();
    buildMore();
    syncState();

    finishedSetup = true;

    if (setupObserver) {
      setupObserver.disconnect();
      setupObserver = null;
    }

    console.log("APRISHA NEXUS DOCK V3 READY", {
      stable: true,
      pulse: false,
      aprisha: true,
      humanInterface: true,
      omega: true
    });

    return true;
  }

  function boot() {
    injectStyles();

    if (finishSetup()) return;

    setupObserver = new MutationObserver(() => {
      finishSetup();
    });

    setupObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    /* Hard stop: observer exists only for startup discovery, never forever. */
    window.setTimeout(() => {
      finishSetup();

      if (setupObserver) {
        setupObserver.disconnect();
        setupObserver = null;
      }
    }, 5000);

    document.addEventListener("pointerdown", (event) => {
      const menu = document.getElementById(MENU_ID);
      const more = document.getElementById(MORE_ID);

      if (!menu?.classList.contains("open")) return;
      if (menu.contains(event.target) || more?.contains(event.target)) return;

      closeMenu();
    }, true);

    window.addEventListener("resize", () => {
      const menu = document.getElementById(MENU_ID);

      if (menu?.classList.contains("open")) {
        positionMenu();
      }
    }, { passive: true });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("ap:aprisha-omega:run-start", syncState);
    window.addEventListener("ap:aprisha-omega:run-error", syncState);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();