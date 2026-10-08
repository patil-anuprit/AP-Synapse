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


/* AP_APRISHA_FULL_LABEL_V1 */
#apAprishaOrderAprishaBtnV1 {
  width: auto !important;
  min-width: 108px !important;
  padding: 0 15px !important;

  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;

  font: 750 13px/1 Inter, system-ui, -apple-system, "Segoe UI", sans-serif !important;
  letter-spacing: .005em !important;

  flex: 0 0 auto !important;
}

#apAprishaOrderAprishaBtnV1 .apord-label {
  display: inline-block !important;

  color: #efd887 !important;

  font: 750 13px/1 Inter, system-ui, -apple-system, "Segoe UI", sans-serif !important;

  white-space: nowrap !important;
}

#apAprishaOrderAprishaBtnV1 .apord-icon {
  width: 20px !important;
  height: 20px !important;
  flex: 0 0 20px !important;
}

/* keep Aprisha visually separate from Human + Omega */
#apAprishaOrderAprishaBtnV1 {
  margin-right: 1px !important;
}

@media (max-width: 767px) {
  #apAprishaOrderAprishaBtnV1 {
    min-width: 96px !important;
    height: 40px !important;
    min-height: 40px !important;
    padding: 0 12px !important;
    gap: 7px !important;
  }

  #apAprishaOrderAprishaBtnV1 .apord-label {
    font-size: 12px !important;
  }

  #apAprishaOrderAprishaBtnV1 .apord-icon {
    width: 18px !important;
    height: 18px !important;
    flex-basis: 18px !important;
  }
}

@media (max-width: 430px) {
  #apAprishaOrderAprishaBtnV1 {
    min-width: 90px !important;
    padding: 0 10px !important;
    gap: 6px !important;
  }

  #apAprishaOrderAprishaBtnV1 .apord-label {
    font-size: 11.5px !important;
  }
}

/* AP_HUMAN_INTERFACE_LABEL_V1 */
#apAprishaOrderComboV1 {
  width: auto !important;
  min-width: 214px !important;
  height: 42px !important;

  padding: 2px 3px 2px 13px !important;

  display: inline-flex !important;
  align-items: center !important;
  justify-content: flex-start !important;

  gap: 0 !important;

  border: 1px solid rgba(228, 194, 101, .30) !important;
  border-radius: 14px !important;

  background:
    radial-gradient(circle at 18% 12%, rgba(244,219,145,.075), transparent 38%),
    linear-gradient(150deg, rgba(28,30,35,.995), rgba(9,10,13,.998)) !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 8px 24px rgba(0,0,0,.30) !important;

  overflow: hidden !important;
}

#apAprishaOrderComboV1 .apord-human-label {
  display: inline-flex !important;
  align-items: center !important;

  height: 100% !important;

  margin-right: 10px !important;
  padding-right: 11px !important;

  border-right: 1px solid rgba(255,255,255,.075) !important;

  color: #e9d38a !important;

  font:
    720 11.5px/1
    Inter,
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif !important;

  letter-spacing: .018em !important;

  white-space: nowrap !important;

  opacity: .96 !important;

  user-select: none !important;
  pointer-events: none !important;
}

#apAprishaOrderComboV1 .apord-combo-btn {
  width: 38px !important;
  min-width: 38px !important;

  height: 36px !important;
  min-height: 36px !important;

  border-radius: 10px !important;
}

#apAprishaOrderComboV1 .apord-combo-btn + .apord-combo-btn::before {
  top: 8px !important;
  height: 20px !important;
}

#apAprishaOrderComboV1 .apord-icon {
  width: 22px !important;
  height: 22px !important;
}

/* Clear professional hover: quiet, not flashy */
#apAprishaOrderComboV1:hover {
  border-color: rgba(239,208,119,.46) !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 9px 26px rgba(0,0,0,.33) !important;
}

/* Mobile — keep label readable while preserving the full ordered row */
@media (max-width: 767px) {
  #apAprishaOrderComboV1 {
    min-width: 178px !important;
    height: 40px !important;

    padding-left: 10px !important;
  }

  #apAprishaOrderComboV1 .apord-human-label {
    margin-right: 7px !important;
    padding-right: 8px !important;

    font-size: 10px !important;
    letter-spacing: .01em !important;
  }

  #apAprishaOrderComboV1 .apord-combo-btn {
    width: 34px !important;
    min-width: 34px !important;

    height: 34px !important;
    min-height: 34px !important;
  }

  #apAprishaOrderComboV1 .apord-icon {
    width: 20px !important;
    height: 20px !important;
  }
}

@media (max-width: 430px) {
  #apAprishaOrderComboV1 {
    min-width: 165px !important;
    height: 38px !important;

    padding-left: 9px !important;
  }

  #apAprishaOrderComboV1 .apord-human-label {
    margin-right: 6px !important;
    padding-right: 7px !important;

    font-size: 9.5px !important;
  }

  #apAprishaOrderComboV1 .apord-combo-btn {
    width: 32px !important;
    min-width: 32px !important;

    height: 32px !important;
    min-height: 32px !important;
  }

  #apAprishaOrderComboV1 .apord-icon {
    width: 19px !important;
    height: 19px !important;
  }
}

/* AP_HUMAN_INTERFACE_MICROHEADER_V2_START */

/*
  Final direction:
  - one compact capsule
  - tiny HUMAN INTERFACE microheader
  - Hand and Omega are the only dominant controls
  - no flashy effects / pulse / blink
  - same AP Synapse graphite + restrained gold language
*/

#apAprishaOrderComboV1 {
  position: relative !important;

  width: 124px !important;
  min-width: 124px !important;
  max-width: 124px !important;

  height: 44px !important;
  min-height: 44px !important;

  padding: 10px 4px 3px !important;

  display: inline-flex !important;
  align-items: flex-end !important;
  justify-content: center !important;

  gap: 2px !important;

  border: 1px solid rgba(226, 194, 108, .24) !important;
  border-radius: 14px !important;

  background:
    radial-gradient(circle at 50% -10%, rgba(239, 210, 125, .075), transparent 48%),
    linear-gradient(155deg, rgba(27, 29, 34, .995), rgba(9, 10, 13, .998)) !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.038),
    0 8px 22px rgba(0,0,0,.28) !important;

  overflow: hidden !important;
}

#apAprishaOrderComboV1::after {
  content: "" !important;

  position: absolute !important;
  left: 50% !important;
  top: 17px !important;

  width: 1px !important;
  height: 19px !important;

  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255,255,255,.075) 25%,
    rgba(255,255,255,.075) 75%,
    transparent
  ) !important;

  transform: translateX(-.5px) !important;

  pointer-events: none !important;
}

#apAprishaOrderComboV1 .apord-human-label {
  position: absolute !important;

  top: 4px !important;
  left: 8px !important;
  right: 8px !important;

  height: auto !important;

  display: block !important;

  margin: 0 !important;
  padding: 0 !important;

  border: 0 !important;

  color: rgba(239, 216, 141, .63) !important;

  font:
    760 6.8px/1
    Inter,
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif !important;

  letter-spacing: .155em !important;
  text-align: center !important;

  white-space: nowrap !important;

  opacity: 1 !important;

  user-select: none !important;
  pointer-events: none !important;
}

#apAprishaOrderComboV1 .apord-combo-btn {
  position: relative !important;

  width: 52px !important;
  min-width: 52px !important;

  height: 29px !important;
  min-height: 29px !important;

  padding: 0 !important;
  margin: 0 !important;

  display: grid !important;
  place-items: center !important;

  border: 0 !important;
  border-radius: 9px !important;

  background: transparent !important;
  box-shadow: none !important;

  opacity: .90 !important;

  transition:
    background .14s ease,
    opacity .14s ease,
    transform .14s ease !important;
}

#apAprishaOrderComboV1 .apord-combo-btn + .apord-combo-btn::before {
  display: none !important;
}

#apAprishaOrderComboV1 .apord-combo-btn:hover {
  background: rgba(235, 202, 111, .065) !important;
  opacity: 1 !important;
  transform: none !important;
}

#apAprishaOrderComboV1 .apord-combo-btn:active {
  transform: scale(.95) !important;
}

#apAprishaOrderComboV1 .apord-combo-btn[data-active="true"] {
  background:
    radial-gradient(circle at 50% 35%, rgba(240, 213, 131, .10), transparent 70%),
    rgba(235, 202, 111, .045) !important;

  box-shadow:
    inset 0 0 0 1px rgba(239, 210, 125, .14) !important;

  opacity: 1 !important;
}

#apAprishaOrderComboV1 .apord-icon {
  width: 20px !important;
  height: 20px !important;
}

#apAprishaOrderComboV1 .apord-stroke {
  stroke-width: 1.45 !important;
}

#apAprishaOrderComboV1:hover {
  border-color: rgba(239, 208, 119, .38) !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 9px 24px rgba(0,0,0,.31) !important;
}

/* Mobile keeps the same visual hierarchy, just slightly tighter. */
@media (max-width: 767px) {
  #apAprishaOrderComboV1 {
    width: 112px !important;
    min-width: 112px !important;
    max-width: 112px !important;

    height: 40px !important;
    min-height: 40px !important;

    padding: 9px 3px 3px !important;

    border-radius: 13px !important;
  }

  #apAprishaOrderComboV1 .apord-human-label {
    top: 3px !important;

    font-size: 6.2px !important;
    letter-spacing: .13em !important;
  }

  #apAprishaOrderComboV1 .apord-combo-btn {
    width: 47px !important;
    min-width: 47px !important;

    height: 27px !important;
    min-height: 27px !important;
  }

  #apAprishaOrderComboV1 .apord-icon {
    width: 19px !important;
    height: 19px !important;
  }

  #apAprishaOrderComboV1::after {
    top: 15px !important;
    height: 17px !important;
  }
}

@media (max-width: 430px) {
  #apAprishaOrderComboV1 {
    width: 106px !important;
    min-width: 106px !important;
    max-width: 106px !important;

    height: 38px !important;
    min-height: 38px !important;
  }

  #apAprishaOrderComboV1 .apord-human-label {
    font-size: 5.9px !important;
    letter-spacing: .115em !important;
  }

  #apAprishaOrderComboV1 .apord-combo-btn {
    width: 44px !important;
    min-width: 44px !important;

    height: 25px !important;
    min-height: 25px !important;
  }

  #apAprishaOrderComboV1 .apord-icon {
    width: 18px !important;
    height: 18px !important;
  }
}

/* absolutely no pulsing / blinking in this grouped control */
#apAprishaOrderComboV1,
#apAprishaOrderComboV1 * {
  animation: none !important;
}

/* AP_HUMAN_INTERFACE_MICROHEADER_V2_END */

/* AP_UNIFIED_APRISHA_HUMAN_CAPSULE_V1_START */

/*
  Final direction:
  - first segment is only "Aprisha"
  - second segment is the compact HUMAN INTERFACE capsule
  - both segments visually read like one single premium control
  - restrained, sober, official, graphite + muted-gold
*/

#apAprishaOrderAprishaBtnV1,
#apAprishaOrderComboV1 {
  background:
    radial-gradient(circle at 28% 16%, rgba(244,219,145,.075), transparent 42%),
    linear-gradient(150deg, rgba(28,30,35,.995), rgba(9,10,13,.998)) !important;
  border-color: rgba(228,194,101,.24) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 8px 22px rgba(0,0,0,.28) !important;
}

/* Left segment: APRISHA only */
#apAprishaOrderAprishaBtnV1 {
  position: relative !important;

  width: auto !important;
  min-width: 104px !important;
  max-width: none !important;

  height: 44px !important;
  min-height: 44px !important;

  padding: 0 12px !important;
  margin-right: -8px !important;

  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;

  border-radius: 14px 0 0 14px !important;
  border-right-width: 0 !important;

  z-index: 2 !important;
}

#apAprishaOrderAprishaBtnV1::after {
  content: "" !important;

  position: absolute !important;
  right: 0 !important;
  top: 11px !important;

  width: 1px !important;
  height: 22px !important;

  background: rgba(255,255,255,.085) !important;
}

#apAprishaOrderAprishaBtnV1 .apord-icon,
#apAprishaOrderAprishaBtnV1 svg {
  display: none !important;
}

#apAprishaOrderAprishaBtnV1 .apord-label {
  display: inline-block !important;

  color: #efd887 !important;

  font:
    760 13px/1
    Inter,
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif !important;

  letter-spacing: .01em !important;
  white-space: nowrap !important;
}

#apAprishaOrderAprishaBtnV1:hover {
  border-color: rgba(239,208,119,.36) !important;
  transform: none !important;
}

/* Right segment: HUMAN INTERFACE capsule — connected to Aprisha */
#apAprishaOrderComboV1 {
  position: relative !important;

  width: 104px !important;
  min-width: 104px !important;
  max-width: 104px !important;

  height: 44px !important;
  min-height: 44px !important;

  padding: 9px 3px 3px !important;
  margin-left: 0 !important;

  display: inline-flex !important;
  align-items: flex-end !important;
  justify-content: center !important;
  gap: 2px !important;

  border-radius: 0 14px 14px 0 !important;
  border-left-width: 0 !important;

  overflow: hidden !important;
}

#apAprishaOrderComboV1::before {
  content: "" !important;

  position: absolute !important;
  left: 0 !important;
  top: 11px !important;

  width: 1px !important;
  height: 22px !important;

  background: rgba(255,255,255,.085) !important;
}

#apAprishaOrderComboV1::after {
  content: "" !important;

  position: absolute !important;
  left: 50% !important;
  top: 18px !important;

  width: 1px !important;
  height: 16px !important;

  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255,255,255,.075) 24%,
    rgba(255,255,255,.075) 76%,
    transparent
  ) !important;

  transform: translateX(-.5px) !important;
  pointer-events: none !important;
}

#apAprishaOrderComboV1 .apord-human-label {
  position: absolute !important;
  top: 4px !important;
  left: 8px !important;
  right: 8px !important;

  display: block !important;
  margin: 0 !important;
  padding: 0 !important;

  color: rgba(239,216,141,.62) !important;

  font:
    760 6.2px/1
    Inter,
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif !important;

  letter-spacing: .145em !important;
  text-align: center !important;
  white-space: nowrap !important;

  border: 0 !important;
  user-select: none !important;
  pointer-events: none !important;
}

#apAprishaOrderComboV1 .apord-combo-btn {
  position: relative !important;

  width: 43px !important;
  min-width: 43px !important;

  height: 24px !important;
  min-height: 24px !important;

  border: 0 !important;
  border-radius: 9px !important;

  background: transparent !important;
  box-shadow: none !important;

  opacity: .92 !important;
}

#apAprishaOrderComboV1 .apord-combo-btn + .apord-combo-btn::before {
  display: none !important;
}

#apAprishaOrderComboV1 .apord-combo-btn:hover {
  background: rgba(235,202,111,.065) !important;
  opacity: 1 !important;
  transform: none !important;
}

#apAprishaOrderComboV1 .apord-combo-btn:active {
  transform: scale(.95) !important;
}

#apAprishaOrderComboV1 .apord-combo-btn[data-active="true"] {
  background:
    radial-gradient(circle at 50% 35%, rgba(240,213,131,.10), transparent 70%),
    rgba(235,202,111,.04) !important;
  box-shadow:
    inset 0 0 0 1px rgba(239,210,125,.12) !important;
  opacity: 1 !important;
}

#apAprishaOrderComboV1 .apord-icon {
  width: 16px !important;
  height: 16px !important;
}

#apAprishaOrderComboV1:hover {
  border-color: rgba(239,208,119,.36) !important;
}

/* Mobile */
@media (max-width: 767px) {
  #apAprishaOrderAprishaBtnV1 {
    min-width: 98px !important;
    height: 40px !important;
    min-height: 40px !important;
    padding: 0 13px !important;
    margin-right: -6px !important;
  }

  #apAprishaOrderAprishaBtnV1 .apord-label {
    font-size: 11.5px !important;
  }

  #apAprishaOrderAprishaBtnV1::after {
    top: 10px !important;
    height: 16px !important;
  }

  #apAprishaOrderComboV1 {
    width: 104px !important;
    min-width: 104px !important;
    max-width: 104px !important;

    height: 40px !important;
    min-height: 40px !important;

    padding: 9px 3px 3px !important;
  }

  #apAprishaOrderComboV1 .apord-human-label {
    top: 3px !important;
    font-size: 5.4px !important;
    letter-spacing: .125em !important;
  }

  #apAprishaOrderComboV1 .apord-combo-btn {
    width: 43px !important;
    min-width: 43px !important;

    height: 24px !important;
    min-height: 24px !important;
  }

  #apAprishaOrderComboV1 .apord-icon {
    width: 17px !important;
    height: 17px !important;
  }

  #apAprishaOrderComboV1::before {
    top: 10px !important;
    height: 16px !important;
  }

  #apAprishaOrderComboV1::after {
    top: 16px !important;
    height: 17px !important;
  }
}

@media (max-width: 430px) {
  #apAprishaOrderAprishaBtnV1 {
    min-width: 92px !important;
    padding: 0 12px !important;
  }

  #apAprishaOrderAprishaBtnV1 .apord-label {
    font-size: 11.5px !important;
  }

  #apAprishaOrderComboV1 {
    width: 104px !important;
    min-width: 104px !important;
    max-width: 104px !important;
  }

  #apAprishaOrderComboV1 .apord-human-label {
    font-size: 5.4px !important;
    letter-spacing: .11em !important;
  }

  #apAprishaOrderComboV1 .apord-combo-btn {
    width: 43px !important;
    min-width: 43px !important;

    height: 24px !important;
    min-height: 24px !important;
  }

  #apAprishaOrderComboV1 .apord-icon {
    width: 16px !important;
    height: 16px !important;
  }
}

/* keep this whole unified capsule completely calm */
#apAprishaOrderAprishaBtnV1,
#apAprishaOrderComboV1,
#apAprishaOrderAprishaBtnV1 *,
#apAprishaOrderComboV1 * {
  animation: none !important;
}

/* AP_UNIFIED_APRISHA_HUMAN_CAPSULE_V1_END */

/* AP_MOBILE_SAFEFIT_V1_START */

/*
  Goal:
  - keep the full word "Aprisha" visible
  - reserve real space for the hamburger/sidebar control
  - keep Aprisha + Human Interface unified
  - preserve Bell / Gear / Profile / Share
  - affect mobile only; desktop stays untouched
*/

@media (max-width: 767px) {

  /* Reserve room on the left for the hamburger / sidebar control. */
  .topbar {
    position: relative !important;
  }

  .topbar-right {
    margin-left: auto !important;

    width: calc(100% - 50px) !important;
    max-width: calc(100% - 50px) !important;

    padding-left: 2px !important;
    padding-right: 6px !important;

    box-sizing: border-box !important;

    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;

    gap: 4px !important;

    overflow: visible !important;
  }

  /* Aprisha remains readable — do not shrink it into an icon. */
  #apAprishaOrderAprishaBtnV1 {
    min-width: 84px !important;
    width: 84px !important;
    max-width: 84px !important;

    height: 38px !important;
    min-height: 38px !important;

    padding: 0 10px !important;
    margin-right: -4px !important;

    flex: 0 0 84px !important;
  }

  #apAprishaOrderAprishaBtnV1 .apord-label {
    font-size: 11.5px !important;
    letter-spacing: .004em !important;

    overflow: visible !important;
    text-overflow: clip !important;
    white-space: nowrap !important;
  }

  /* Compact Human Interface without losing its identity. */
  #apAprishaOrderComboV1 {
    width: 94px !important;
    min-width: 94px !important;
    max-width: 94px !important;

    height: 38px !important;
    min-height: 38px !important;

    padding: 8px 2px 2px !important;

    flex: 0 0 94px !important;
  }

  #apAprishaOrderComboV1 .apord-human-label {
    top: 3px !important;

    font-size: 5.3px !important;
    letter-spacing: .095em !important;
  }

  #apAprishaOrderComboV1 .apord-combo-btn {
    width: 39px !important;
    min-width: 39px !important;

    height: 25px !important;
    min-height: 25px !important;
  }

  #apAprishaOrderComboV1 .apord-icon {
    width: 16px !important;
    height: 16px !important;
  }

  /* Keep the remaining ordered controls compact and visible. */
  .ap-notification-icon-only,
  #settingsBtn,
  #profileBtn,
  #shareConversationBtn {
    width: 34px !important;
    min-width: 34px !important;
    max-width: 34px !important;

    height: 36px !important;
    min-height: 36px !important;

    flex: 0 0 34px !important;

    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  #profileBtn img {
    width: 28px !important;
    height: 28px !important;
  }

  /* Keep search out of the compact mobile command row. */
  .topbar-search,
  .search-box {
    display: none !important;
  }
}

/* Extra fit for very narrow phones / DevTools widths around 393px. */
@media (max-width: 410px) {

  .topbar-right {
    width: calc(100% - 48px) !important;
    max-width: calc(100% - 48px) !important;

    padding-right: 4px !important;
    gap: 3px !important;
  }

  #apAprishaOrderAprishaBtnV1 {
    width: 80px !important;
    min-width: 80px !important;
    max-width: 80px !important;

    padding: 0 8px !important;

    flex-basis: 80px !important;
  }

  #apAprishaOrderAprishaBtnV1 .apord-label {
    font-size: 11px !important;
  }

  #apAprishaOrderComboV1 {
    width: 90px !important;
    min-width: 90px !important;
    max-width: 90px !important;

    flex-basis: 90px !important;
  }

  #apAprishaOrderComboV1 .apord-human-label {
    font-size: 5.1px !important;
    letter-spacing: .085em !important;
  }

  #apAprishaOrderComboV1 .apord-combo-btn {
    width: 37px !important;
    min-width: 37px !important;
  }

  .ap-notification-icon-only,
  #settingsBtn,
  #profileBtn,
  #shareConversationBtn {
    width: 32px !important;
    min-width: 32px !important;
    max-width: 32px !important;

    height: 34px !important;
    min-height: 34px !important;

    flex-basis: 32px !important;
  }

  #profileBtn img {
    width: 27px !important;
    height: 27px !important;
  }
}

/* AP_MOBILE_SAFEFIT_V1_END */

/* AP_MOBILE_FIT_V2_START */

/*
  Narrow-phone final fit.
  This intentionally affects only <= 410px.
  It keeps the unified premium design but creates enough
  left-side breathing room so "Aprisha" cannot sit beneath
  the hamburger/sidebar button.
*/

@media (max-width: 410px) {

  .topbar {
    position: relative !important;
    box-sizing: border-box !important;
  }

  .topbar-right {
    box-sizing: border-box !important;

    width: calc(100% - 48px) !important;
    max-width: calc(100% - 48px) !important;

    margin-left: 48px !important;
    margin-right: 0 !important;

    padding-left: 10px !important;
    padding-right: 2px !important;

    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;

    gap: 2px !important;

    overflow: visible !important;
  }

  /* unified left segment — full Aprisha word */
  #apAprishaOrderAprishaBtnV1 {
    width: 74px !important;
    min-width: 74px !important;
    max-width: 74px !important;

    height: 36px !important;
    min-height: 36px !important;

    flex: 0 0 74px !important;

    margin-right: -4px !important;
    padding: 0 7px !important;

    overflow: visible !important;
  }

  #apAprishaOrderAprishaBtnV1 .apord-label {
    display: block !important;

    width: auto !important;
    max-width: none !important;

    font-size: 10.5px !important;
    line-height: 1 !important;
    letter-spacing: 0 !important;

    white-space: nowrap !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }

  /* unified right segment — Human Interface + two icons */
  #apAprishaOrderComboV1 {
    width: 82px !important;
    min-width: 82px !important;
    max-width: 82px !important;

    height: 36px !important;
    min-height: 36px !important;

    flex: 0 0 82px !important;

    padding: 8px 1px 2px !important;
  }

  #apAprishaOrderComboV1 .apord-human-label {
    top: 3px !important;
    left: 3px !important;
    right: 3px !important;

    font-size: 4.65px !important;
    letter-spacing: .07em !important;

    white-space: nowrap !important;
  }

  #apAprishaOrderComboV1 .apord-combo-btn {
    width: 35px !important;
    min-width: 35px !important;

    height: 23px !important;
    min-height: 23px !important;
  }

  #apAprishaOrderComboV1 .apord-icon {
    width: 15px !important;
    height: 15px !important;
  }

  #apAprishaOrderComboV1::before {
    top: 9px !important;
    height: 18px !important;
  }

  #apAprishaOrderComboV1::after {
    top: 15px !important;
    height: 15px !important;
  }

  /*
    Keep the remaining controls compact enough that
    the left side never has to slide under the hamburger.
  */
  .ap-notification-icon-only,
  #settingsBtn,
  #profileBtn,
  #shareConversationBtn,
  #apMobileThemeToggle {
    width: 28px !important;
    min-width: 28px !important;
    max-width: 28px !important;

    height: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;

    flex: 0 0 28px !important;

    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  #profileBtn {
    padding: 2px !important;
  }

  #profileBtn img {
    width: 24px !important;
    height: 24px !important;
  }

  /* Search does not belong in a 393px command row. */
  .topbar-search,
  .search-box {
    display: none !important;
  }
}

/* Extra guard for very narrow phones. */
@media (max-width: 370px) {

  .topbar-right {
    padding-left: 7px !important;
    gap: 1px !important;
  }

  #apAprishaOrderAprishaBtnV1 {
    width: 70px !important;
    min-width: 70px !important;
    max-width: 70px !important;

    flex-basis: 70px !important;
  }

  #apAprishaOrderAprishaBtnV1 .apord-label {
    font-size: 10px !important;
  }

  #apAprishaOrderComboV1 {
    width: 78px !important;
    min-width: 78px !important;
    max-width: 78px !important;

    flex-basis: 78px !important;
  }

  #apAprishaOrderComboV1 .apord-human-label {
    font-size: 4.4px !important;
  }

  .ap-notification-icon-only,
  #settingsBtn,
  #profileBtn,
  #shareConversationBtn,
  #apMobileThemeToggle {
    width: 26px !important;
    min-width: 26px !important;
    max-width: 26px !important;

    flex-basis: 26px !important;
  }
}

/* AP_MOBILE_FIT_V2_END */

/* AP_MOBILE_LEFTSAFE_V3_START */

/*
  Final narrow-phone fix:
  The hamburger occupies the left edge of the header.
  Instead of merely shrinking controls, pin the command row
  to a real safe zone to the RIGHT of the hamburger.
*/

@media (max-width: 410px) {

  .topbar {
    position: relative !important;
    overflow: visible !important;
    box-sizing: border-box !important;
  }

  /*
    Critical fix:
    left/right positioning wins over any older width/margin rules
    and prevents the Aprisha segment from living underneath ☰.
  */
  .topbar-right {
    position: absolute !important;

    left: 52px !important;
    right: 3px !important;
    top: 0 !important;

    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;

    height: 100% !important;

    margin: 0 !important;
    padding: 0 !important;

    box-sizing: border-box !important;

    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;

    gap: 2px !important;

    overflow: visible !important;

    transform: none !important;
    translate: none !important;
  }

  /* Full Aprisha word; never allow this first segment to shrink. */
  #apAprishaOrderAprishaBtnV1 {
    position: relative !important;

    width: 78px !important;
    min-width: 78px !important;
    max-width: 78px !important;

    height: 36px !important;
    min-height: 36px !important;

    flex: 0 0 78px !important;

    margin: 0 -4px 0 0 !important;
    padding: 0 8px !important;

    box-sizing: border-box !important;

    overflow: visible !important;

    transform: none !important;
  }

  #apAprishaOrderAprishaBtnV1 .apord-label {
    display: block !important;

    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;

    margin: 0 !important;
    padding: 0 !important;

    color: #efd887 !important;

    font-size: 10.5px !important;
    line-height: 1 !important;
    letter-spacing: 0 !important;

    text-align: center !important;

    white-space: nowrap !important;
    overflow: visible !important;
    text-overflow: clip !important;

    transform: none !important;
  }

  /* Compact right half of the single Aprisha/Human Interface capsule. */
  #apAprishaOrderComboV1 {
    width: 84px !important;
    min-width: 84px !important;
    max-width: 84px !important;

    height: 36px !important;
    min-height: 36px !important;

    flex: 0 0 84px !important;

    margin: 0 !important;
    padding: 8px 1px 2px !important;

    box-sizing: border-box !important;
  }

  #apAprishaOrderComboV1 .apord-human-label {
    top: 3px !important;
    left: 3px !important;
    right: 3px !important;

    font-size: 4.7px !important;
    letter-spacing: .065em !important;

    white-space: nowrap !important;
  }

  #apAprishaOrderComboV1 .apord-combo-btn {
    width: 36px !important;
    min-width: 36px !important;

    height: 23px !important;
    min-height: 23px !important;

    flex: 0 0 36px !important;
  }

  #apAprishaOrderComboV1 .apord-icon {
    width: 15px !important;
    height: 15px !important;
  }

  /* Compact remaining topbar controls, preserving their order. */
  .ap-notification-icon-only,
  #settingsBtn,
  #apMobileThemeToggle,
  #profileBtn,
  #shareConversationBtn {
    width: 29px !important;
    min-width: 29px !important;
    max-width: 29px !important;

    height: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;

    flex: 0 0 29px !important;

    margin: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;

    box-sizing: border-box !important;
  }

  #profileBtn {
    padding: 2px !important;
  }

  #profileBtn img {
    width: 24px !important;
    height: 24px !important;
  }

  .topbar-search,
  .search-box {
    display: none !important;
  }
}

/* Very narrow fallback */
@media (max-width: 370px) {

  .topbar-right {
    left: 50px !important;
    right: 2px !important;
    gap: 1px !important;
  }

  #apAprishaOrderAprishaBtnV1 {
    width: 73px !important;
    min-width: 73px !important;
    max-width: 73px !important;
    flex-basis: 73px !important;
  }

  #apAprishaOrderAprishaBtnV1 .apord-label {
    font-size: 10px !important;
  }

  #apAprishaOrderComboV1 {
    width: 80px !important;
    min-width: 80px !important;
    max-width: 80px !important;
    flex-basis: 80px !important;
  }

  #apAprishaOrderComboV1 .apord-human-label {
    font-size: 4.45px !important;
  }

  .ap-notification-icon-only,
  #settingsBtn,
  #apMobileThemeToggle,
  #profileBtn,
  #shareConversationBtn {
    width: 27px !important;
    min-width: 27px !important;
    max-width: 27px !important;
    flex-basis: 27px !important;
  }
}

/* AP_MOBILE_LEFTSAFE_V3_END */
/* AP_APRISHA_MOBILE_BALANCE_V4_START */
@media (max-width: 767px) {
  .topbar-right > .apord-utility-anchor {
    margin-left: auto !important;
  }
}
/* AP_APRISHA_MOBILE_BALANCE_V4_END */

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
        button.innerHTML = `
      <span class="apord-label">Aprisha</span>
    `;

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

    const label = document.createElement("span");
    label.className = "apord-human-label";
    label.textContent = "HUMAN INTERFACE";
    label.setAttribute("aria-hidden", "true");

    combo.append(label, human, omega);
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

    /* AP_APRISHA_MOBILE_BALANCE_V4_ANCHOR */
    const firstUtility = notif || settings || profile || share;
    const utilityHost = firstUtility &&
      (firstUtility.parentElement === bar
        ? firstUtility
        : Array.from(bar.children).find(child => child.contains(firstUtility)));
    if (utilityHost) utilityHost.classList.add("apord-utility-anchor");

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