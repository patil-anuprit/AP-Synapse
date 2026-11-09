/* AP SYNAPSE — PREMIUM LIGHT APPEARANCE V1.
 * Isolated theme controller: no app engine, chat, voice, or menu changes. */
(() => {
  "use strict";
  if (window.__AP_PREMIUM_LIGHT_V1__) return;
  window.__AP_PREMIUM_LIGHT_V1__ = true;

  const KEY = "ap_synapse_appearance_premium_v1";
  const HTML = document.documentElement;
  const BUTTONS = "#themeSettingsBtn,#apMobileThemeToggle,#themeToggle,#theme-toggle,#darkModeToggle,#lightModeToggle";
  const meta = document.querySelector('meta[name="theme-color"]');
  const originalMeta = meta ? meta.getAttribute("content") : null;
  let mode = "dark";

  function savedMode() {
    try { return localStorage.getItem(KEY); }
    catch { return null; }
  }
  function saveMode(next) {
    try { localStorage.setItem(KEY, next); }
    catch { /* Theme still works without persistent storage. */ }
  }
  function updateControls() {
    const light = mode === "light";
    const settings = document.getElementById("themeSettingsBtn");
    if (settings) {
      settings.textContent = light ? "☀ Light Mode" : "☾ Dark Mode";
      settings.setAttribute("aria-pressed", String(light));
      settings.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    }
    const mobile = document.getElementById("apMobileThemeToggle");
    if (mobile) {
      mobile.setAttribute("aria-pressed", String(light));
      mobile.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
      mobile.setAttribute("title", light ? "Switch to dark mode" : "Switch to light mode");
      const icon = mobile.querySelector(".ap-theme-icon");
      if (icon) icon.textContent = light ? "☾" : "☼";
    }
    const popup = document.querySelectorAll("#themeToggle,#theme-toggle,#darkModeToggle,#lightModeToggle");
    popup.forEach((button) => {
      button.setAttribute("aria-pressed", String(light));
      button.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
      button.textContent = light ? "☾ Dark Mode" : "☀ Light Mode";
    });
  }
  function applyMode(next, persist = true) {
    mode = next === "light" ? "light" : "dark";
    HTML.setAttribute("data-ap-theme", mode);
    document.body?.classList.toggle("light-mode", mode === "light");
    if (meta) meta.setAttribute("content", mode === "light" ? "#f7f8fa" : (originalMeta || "#0b0b0c"));
    if (persist) saveMode(mode);
    updateControls();
  }

  // Take ownership of EXISTING theme controls only, before legacy handlers run.
  // All other clicks and all other AP Synapse behavior pass through unchanged.
  window.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest(BUTTONS) : null;
    if (!target) {
      if (event.target instanceof Element && event.target.closest("#settingsBtn,#sidebarSettingsBtn"))
        setTimeout(updateControls, 0);
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    applyMode(mode === "light" ? "dark" : "light");
  }, true);

  // Respect any other existing theme command that toggles the legacy class.
  let synchronizing = false;
  function observeLegacyChanges() {
    const body = document.body;
    if (!body) return;
    const observer = new MutationObserver(() => {
      if (synchronizing) return;
      const legacy = body.classList.contains("light-mode") ? "light" : "dark";
      if (legacy === mode) return;
      synchronizing = true;
      applyMode(legacy);
      synchronizing = false;
    });
    observer.observe(body, { attributes: true, attributeFilter: ["class"] });
  }
  function boot() {
    const stored = savedMode();
    const inferred = document.body?.classList.contains("light-mode") ? "light" : "dark";
    applyMode(stored === "light" || stored === "dark" ? stored : inferred, false);
    observeLegacyChanges();
    window.addEventListener("storage", (event) => {
      if (event.key === KEY && (event.newValue === "light" || event.newValue === "dark"))
        applyMode(event.newValue, false);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
