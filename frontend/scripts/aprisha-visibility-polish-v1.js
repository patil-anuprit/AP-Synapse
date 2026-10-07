(() => {
  "use strict";

  const STYLE_ID = "ap-aprisha-visibility-polish-v1";

  if (window.__AP_APRISHA_VISIBILITY_POLISH_V1__) return;
  window.__AP_APRISHA_VISIBILITY_POLISH_V1__ = true;

  function injectStyles() {
    let style = document.getElementById(STYLE_ID);

    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    style.textContent = `
/* =========================================================
   APRISHA VISIBILITY POLISH V1
========================================================= */

/* ---------------------------------------------------------
   APRISHA HUMAN INTERFACE LAUNCHER
   Original runtime creates this as a bottom-right fixed control.
   This patch keeps it fully inside the viewport and makes it
   premium, readable and reliably clickable.
--------------------------------------------------------- */

#apAprishaHumanInterfaceV2 {
  z-index: 2147483000 !important;
}

#apAprishaHumanInterfaceV2 .aphi-launch {
  pointer-events: auto !important;

  position: absolute !important;
  right: 18px !important;
  bottom: 18px !important;
  left: auto !important;
  top: auto !important;

  width: auto !important;
  max-width: calc(100vw - 36px) !important;
  min-width: 166px !important;
  height: 58px !important;
  min-height: 58px !important;

  display: inline-flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 11px !important;

  padding: 0 16px 0 10px !important;
  margin: 0 !important;

  border: 1px solid rgba(226, 194, 108, .34) !important;
  border-radius: 18px !important;

  background:
    radial-gradient(circle at 12% 10%, rgba(239, 213, 138, .11), transparent 36%),
    linear-gradient(145deg, rgba(31, 33, 39, .985), rgba(9, 10, 13, .99)) !important;

  color: #f6f3e8 !important;

  box-shadow:
    0 20px 60px rgba(0, 0, 0, .48),
    0 0 0 1px rgba(255,255,255,.025) inset,
    0 1px 0 rgba(255,255,255,.035) inset !important;

  backdrop-filter: blur(18px) saturate(1.08) !important;
  -webkit-backdrop-filter: blur(18px) saturate(1.08) !important;

  overflow: visible !important;
  visibility: visible !important;
  opacity: 1 !important;

  cursor: pointer !important;
  touch-action: manipulation !important;

  transform: translateZ(0) !important;
  transition:
    transform .15s ease,
    border-color .15s ease,
    box-shadow .15s ease !important;
}

#apAprishaHumanInterfaceV2 .aphi-launch:hover {
  transform: translateY(-2px) !important;

  border-color: rgba(239, 208, 124, .62) !important;

  box-shadow:
    0 24px 68px rgba(0,0,0,.54),
    0 0 24px rgba(226, 194, 108, .12),
    0 1px 0 rgba(255,255,255,.04) inset !important;
}

#apAprishaHumanInterfaceV2 .aphi-launch:active {
  transform: scale(.985) !important;
}

#apAprishaHumanInterfaceV2 .aphi-launch:focus-visible {
  outline: none !important;
  box-shadow:
    0 0 0 3px rgba(226, 194, 108, .18),
    0 20px 60px rgba(0,0,0,.48) !important;
}

#apAprishaHumanInterfaceV2 .aphi-orb {
  position: relative !important;

  width: 38px !important;
  height: 38px !important;
  min-width: 38px !important;

  border-radius: 50% !important;

  background:
    radial-gradient(circle at 34% 27%, #fff8da 0%, #e9d391 14%, #9a7d39 30%, #34312b 54%, #121316 74%, #090a0c 100%) !important;

  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.28),
    inset -4px -5px 12px rgba(0,0,0,.38),
    0 0 0 1px rgba(226,194,108,.14),
    0 0 22px rgba(226,194,108,.18) !important;
}

#apAprishaHumanInterfaceV2 .aphi-orb::before {
  content: "" !important;
  position: absolute !important;
  inset: 5px !important;
  border: 1px solid rgba(247, 220, 141, .34) !important;
  border-radius: 50% !important;
  transform: rotate(-24deg) scaleX(1.22) !important;
}

#apAprishaHumanInterfaceV2 .aphi-orb::after {
  content: "" !important;
  position: absolute !important;
  width: 5px !important;
  height: 5px !important;
  top: 5px !important;
  right: 5px !important;
  border-radius: 50% !important;
  background: #efd47d !important;
  box-shadow: 0 0 8px rgba(239,212,125,.72) !important;
}

#apAprishaHumanInterfaceV2 .aphi-launch strong {
  display: block !important;
  color: #f7efda !important;
  font-size: 13px !important;
  line-height: 1.05 !important;
  font-weight: 800 !important;
  letter-spacing: .005em !important;
  text-align: left !important;
}

#apAprishaHumanInterfaceV2 .aphi-launch small {
  display: block !important;
  margin-top: 4px !important;
  color: rgba(255,255,255,.58) !important;
  font-size: 10px !important;
  line-height: 1.05 !important;
  font-weight: 550 !important;
  letter-spacing: .015em !important;
  text-align: left !important;
}


/* ---------------------------------------------------------
   APRISHA OMEGA TOPBAR CONTROL
--------------------------------------------------------- */

#apAprishaOmegaConsoleV1 {
  position: relative !important;

  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;

  flex: 0 0 auto !important;

  width: auto !important;
  height: auto !important;

  margin: 0 2px !important;

  z-index: 2147482000 !important;

  overflow: visible !important;
  visibility: visible !important;
  opacity: 1 !important;
}

#apAprishaOmegaConsoleV1 .ao-launch {
  position: relative !important;

  width: 46px !important;
  height: 46px !important;
  min-width: 46px !important;

  padding: 0 !important;
  margin: 0 !important;

  display: grid !important;
  place-items: center !important;

  border: 1px solid rgba(226, 194, 108, .38) !important;
  border-radius: 15px !important;

  background:
    radial-gradient(circle at 30% 18%, rgba(242, 216, 139, .14), transparent 38%),
    linear-gradient(145deg, #24262c, #0a0b0f) !important;

  color: #f3dc91 !important;

  box-shadow:
    0 10px 28px rgba(0,0,0,.36),
    inset 0 1px 0 rgba(255,255,255,.05),
    0 0 0 1px rgba(255,255,255,.015) !important;

  cursor: pointer !important;
  overflow: visible !important;
  visibility: visible !important;
  opacity: 1 !important;
  touch-action: manipulation !important;

  transition:
    transform .14s ease,
    border-color .14s ease,
    box-shadow .14s ease !important;
}

#apAprishaOmegaConsoleV1 .ao-launch:hover {
  transform: translateY(-1px) !important;

  border-color: rgba(242, 216, 139, .72) !important;

  box-shadow:
    0 14px 34px rgba(0,0,0,.44),
    0 0 20px rgba(235,202,112,.15),
    inset 0 1px 0 rgba(255,255,255,.06) !important;
}

#apAprishaOmegaConsoleV1 .ao-launch:active {
  transform: scale(.97) !important;
}

#apAprishaOmegaConsoleV1 .ao-launch:focus-visible {
  outline: none !important;
  box-shadow:
    0 0 0 3px rgba(230,196,108,.18),
    0 12px 30px rgba(0,0,0,.38) !important;
}

/* stronger symbol visibility */
#apAprishaOmegaConsoleV1 .ao-mark {
  width: 31px !important;
  height: 31px !important;
  display: grid !important;
  place-items: center !important;
}

#apAprishaOmegaConsoleV1 .ao-mark svg {
  width: 31px !important;
  height: 31px !important;
  display: block !important;
  overflow: visible !important;
}

#apAprishaOmegaConsoleV1 .ao-core {
  fill: rgba(245,223,158,.11) !important;
  stroke: rgba(245,223,158,.32) !important;
  stroke-width: 1 !important;
}

#apAprishaOmegaConsoleV1 .ao-orbit {
  fill: none !important;
  stroke: rgba(241,214,132,.62) !important;
  stroke-width: 1.5 !important;
  stroke-linecap: round !important;
}

#apAprishaOmegaConsoleV1 .ao-orbit-node {
  fill: #f2d57e !important;
  filter: drop-shadow(0 0 3px rgba(242,213,126,.6)) !important;
}

#apAprishaOmegaConsoleV1 .ao-glyph {
  fill: none !important;
  stroke: #f7e3a1 !important;
  stroke-width: 2.3 !important;
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
  filter: drop-shadow(0 0 4px rgba(247,227,161,.26)) !important;
}

#apAprishaOmegaConsoleV1 .ao-live {
  width: 8px !important;
  height: 8px !important;

  top: 4px !important;
  right: 4px !important;

  border: 2px solid #111318 !important;
  border-radius: 50% !important;

  background: #efd27a !important;

  box-shadow:
    0 0 0 1px rgba(239,210,122,.18),
    0 0 9px rgba(239,210,122,.58) !important;
}

/* panel must open under the topbar icon, not in a narrow strip */
#apAprishaOmegaConsoleV1 .ao-panel {
  position: absolute !important;

  top: calc(100% + 12px) !important;
  right: 0 !important;
  bottom: auto !important;
  left: auto !important;

  width: min(438px, calc(100vw - 28px)) !important;
  min-width: 360px !important;

  z-index: 2147483600 !important;

  overflow: hidden !important;
}


/* ---------------------------------------------------------
   PREVENT TOPBAR CLIPPING
--------------------------------------------------------- */

.topbar,
.topbar-right {
  overflow: visible !important;
}

.topbar-right {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}


/* ---------------------------------------------------------
   MOBILE
--------------------------------------------------------- */

@media (max-width: 767px) {

  #apAprishaHumanInterfaceV2 .aphi-launch {
    right: 10px !important;
    bottom: 14px !important;

    min-width: 48px !important;
    max-width: calc(100vw - 20px) !important;

    height: 48px !important;
    min-height: 48px !important;

    padding: 0 10px !important;
    border-radius: 15px !important;
  }

  #apAprishaHumanInterfaceV2 .aphi-orb {
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
  }

  #apAprishaHumanInterfaceV2 .aphi-launch strong {
    font-size: 12px !important;
  }

  #apAprishaHumanInterfaceV2 .aphi-launch small {
    display: none !important;
  }

  #apAprishaOmegaConsoleV1 {
    margin: 0 1px !important;
  }

  #apAprishaOmegaConsoleV1 .ao-launch {
    width: 42px !important;
    height: 42px !important;
    min-width: 42px !important;

    border-radius: 13px !important;
  }

  #apAprishaOmegaConsoleV1 .ao-mark,
  #apAprishaOmegaConsoleV1 .ao-mark svg {
    width: 27px !important;
    height: 27px !important;
  }

  #apAprishaOmegaConsoleV1 .ao-panel {
    position: fixed !important;

    top: calc(68px + env(safe-area-inset-top)) !important;
    right: 10px !important;
    left: 10px !important;
    bottom: auto !important;

    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    max-height: calc(100dvh - 86px - env(safe-area-inset-top)) !important;

    overflow: auto !important;
  }
}

@media (max-width: 480px) {

  #apAprishaHumanInterfaceV2 .aphi-launch {
    right: 8px !important;
    bottom: 10px !important;
  }

  #apAprishaOmegaConsoleV1 .ao-launch {
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
  }

  #apAprishaOmegaConsoleV1 .ao-mark,
  #apAprishaOmegaConsoleV1 .ao-mark svg {
    width: 25px !important;
    height: 25px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  #apAprishaHumanInterfaceV2 .aphi-launch,
  #apAprishaOmegaConsoleV1 .ao-launch {
    transition: none !important;
  }
}
`;
  }

  function placeOmega() {
    const root = document.getElementById("apAprishaOmegaConsoleV1");

    if (!root) return false;

    const topbarRight =
      document.querySelector(".topbar .topbar-right") ||
      document.querySelector(".topbar-right");

    if (!topbarRight) return false;

    const aprisha =
      document.getElementById("apDedicatedAprishaButton");

    const activity =
      topbarRight.querySelector(".ap-notification-icon-only");

    const profile =
      document.getElementById("profileBtn");

    if (
      aprisha &&
      aprisha.parentElement === topbarRight
    ) {
      if (aprisha.nextElementSibling !== root) {
        aprisha.insertAdjacentElement("afterend", root);
      }

      root.dataset.apOmegaPlacement = "beside-aprisha";
      return true;
    }

    if (
      activity &&
      activity.parentElement === topbarRight
    ) {
      topbarRight.insertBefore(root, activity);
      root.dataset.apOmegaPlacement = "before-activity";
      return true;
    }

    if (
      profile &&
      profile.parentElement === topbarRight
    ) {
      topbarRight.insertBefore(root, profile);
      root.dataset.apOmegaPlacement = "before-profile";
      return true;
    }

    if (root.parentElement !== topbarRight) {
      topbarRight.appendChild(root);
    }

    root.dataset.apOmegaPlacement = "topbar-end";
    return true;
  }

  function revealHumanInterface() {
    const root =
      document.getElementById("apAprishaHumanInterfaceV2");

    const launch =
      root?.querySelector(".aphi-launch");

    if (!launch) return false;

    launch.style.setProperty(
      "visibility",
      "visible",
      "important"
    );

    launch.style.setProperty(
      "opacity",
      "1",
      "important"
    );

    launch.style.setProperty(
      "pointer-events",
      "auto",
      "important"
    );

    return true;
  }

  function repair() {
    injectStyles();
    placeOmega();
    revealHumanInterface();
  }

  function boot() {
    repair();

    let queued = false;

    const observer =
      new MutationObserver(() => {

        if (queued) return;

        queued = true;

        requestAnimationFrame(() => {
          queued = false;
          repair();
        });
      });

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

    window.addEventListener(
      "resize",
      repair,
      { passive: true }
    );

    console.log(
      "APRISHA VISIBILITY POLISH V1 READY",
      {
        humanInterface:
          !!document.querySelector(
            "#apAprishaHumanInterfaceV2 .aphi-launch"
          ),

        omega:
          !!document.getElementById(
            "apAprishaOmegaConsoleV1"
          ),

        omegaPlacement:
          document
            .getElementById(
              "apAprishaOmegaConsoleV1"
            )
            ?.dataset
            ?.apOmegaPlacement || "waiting"
      }
    );
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      { once: true }
    );
  } else {
    boot();
  }
})();