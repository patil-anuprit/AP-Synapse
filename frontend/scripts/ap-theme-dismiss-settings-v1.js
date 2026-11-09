/* AP_THEME_CLOSE_SETTINGS_ON_MODE_CHANGE_V1 */
(() => {
  "use strict";

  if (window.__AP_CLOSE_SETTINGS_ON_THEME_V1__) return;
  window.__AP_CLOSE_SETTINGS_ON_THEME_V1__ = true;

  const root = document.documentElement;
  let previous = root.getAttribute("data-ap-theme");

  function closeSettingsPopup() {
    const panel = document.getElementById("popupPanel");
    const title = document.getElementById("popupTitle");

    if (!panel || title?.textContent?.trim().toLowerCase() !== "settings") {
      return;
    }

    const close = document.getElementById("closePopup");
    if (close) close.click();

    panel.style.display = "none";
    panel.classList.remove("open", "active", "show", "visible");
  }

  new MutationObserver(() => {
    const current = root.getAttribute("data-ap-theme");

    if (current === previous ||
        !["light", "dark"].includes(current)) return;

    previous = current;

    queueMicrotask(closeSettingsPopup);
    requestAnimationFrame(closeSettingsPopup);
    setTimeout(closeSettingsPopup, 60);

  }).observe(root, {
    attributes: true,
    attributeFilter: ["data-ap-theme"]
  });
})();
