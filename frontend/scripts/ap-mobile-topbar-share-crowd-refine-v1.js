/* AP Synapse - Mobile Topbar Share Crowd Refine V1 */
(() => {
  "use strict";

  if (window.__apMobileTopbarShareCrowdRefineV1) return;
  window.__apMobileTopbarShareCrowdRefineV1 = true;

  const MOBILE_QUERY = "(max-width: 767px)";
  const ACTIVE_CLASS = "ap-mobile-share-crowd-active-v1";
  const SHIFT_VAR = "--ap-mobile-aprisha-shift-v1";
  const mobile = matchMedia(MOBILE_QUERY);

  const style = document.createElement("style");
  style.id = "ap-mobile-topbar-share-crowd-refine-v1-style";
  style.textContent = `
    @media (max-width: 767px) {
      .topbar .topbar-right > #apAprishaOrderAprishaBtnV1,
      .topbar .topbar-right > #apAprishaOrderComboV1 {
        translate: var(${SHIFT_VAR}, 0px) 0 !important;
      }

      html.${ACTIVE_CLASS} .topbar .topbar-right > #profileBtn,
      html.${ACTIVE_CLASS} .topbar .topbar-right > #shareConversationBtn,
      html.${ACTIVE_CLASS} .topbar .topbar-right > .ap-notification-icon-only {
        scale: 0.96 !important;
        margin-inline: -2px !important;
        transform-origin: center center !important;
        transition:
          scale 160ms ease,
          margin 160ms ease !important;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      html.${ACTIVE_CLASS} .topbar .topbar-right > #profileBtn,
      html.${ACTIVE_CLASS} .topbar .topbar-right > #shareConversationBtn,
      html.${ACTIVE_CLASS} .topbar .topbar-right > .ap-notification-icon-only {
        transition: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  function visible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);

    return (
      rect.width > 2 &&
      rect.height > 2 &&
      cs.display !== "none" &&
      cs.visibility !== "hidden" &&
      cs.opacity !== "0"
    );
  }

  function getElements() {
    const header = document.querySelector(".topbar");
    const row = header?.querySelector(".topbar-right");
    const aprishaBtn = document.getElementById("apAprishaOrderAprishaBtnV1");
    const aprishaCombo = document.getElementById("apAprishaOrderComboV1");
    const notification = row?.querySelector(".ap-notification-icon-only");
    const share = document.getElementById("shareConversationBtn");
    const profile = document.getElementById("profileBtn");
    const theme = document.getElementById("apMobileThemeToggle");

    return {
      header,
      row,
      aprishaBtn,
      aprishaCombo,
      notification,
      share,
      profile,
      theme
    };
  }

  function update() {
    const {
      header,
      row,
      aprishaBtn,
      aprishaCombo,
      notification,
      share,
      profile,
      theme
    } = getElements();

    if (!header || !row || !aprishaBtn || !aprishaCombo ||
        !notification || !share || !profile || !theme) {
      return;
    }

    if (!mobile.matches) {
      row.style.removeProperty(SHIFT_VAR);
      document.documentElement.classList.remove(ACTIVE_CLASS);
      return;
    }

    const shareVisible = visible(share);
    document.documentElement.classList.toggle(ACTIVE_CLASS, shareVisible);

    const a = aprishaBtn.getBoundingClientRect();
    const b = aprishaCombo.getBoundingClientRect();
    const h = header.getBoundingClientRect();

    if (!a.width || !b.width || !h.width) return;

    const oldShift =
      parseFloat(row.style.getPropertyValue(SHIFT_VAR)) || 0;

    const left = Math.min(a.left, b.left);
    const right = Math.max(a.right, b.right);
    const currentCenter = (left + right) / 2;
    const headerCenter = h.left + h.width / 2;

    const desiredShift = oldShift + (headerCenter - currentCenter);

    const visibleUtilities = [notification, theme, profile, share]
      .filter(visible)
      .map(el => el.getBoundingClientRect().left);

    const safeBoundary =
      Math.min(h.right - 4, ...visibleUtilities) - 7;

    const maxShift = oldShift + (safeBoundary - right);

    const nextShift = Math.max(0, Math.min(desiredShift, maxShift));

    if (Number.isFinite(nextShift)) {
      row.style.setProperty(
        SHIFT_VAR,
        `${nextShift.toFixed(2)}px`
      );
    }
  }

  let scheduled = false;

  function schedule() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      update();
    });
  }

  function boot() {
    const row = document.querySelector(".topbar .topbar-right");
    const header = document.querySelector(".topbar");

    if (!row || !header) return;

    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(row, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden"]
    });

    const resizeObserver =
      "ResizeObserver" in window ? new ResizeObserver(schedule) : null;

    resizeObserver?.observe(header);

    [
      document.getElementById("shareConversationBtn"),
      document.getElementById("profileBtn"),
      document.getElementById("apMobileThemeToggle"),
      row.querySelector(".ap-notification-icon-only"),
      document.getElementById("apAprishaOrderAprishaBtnV1"),
      document.getElementById("apAprishaOrderComboV1")
    ].filter(Boolean).forEach(el => resizeObserver?.observe(el));

    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("pageshow", schedule);
    mobile.addEventListener?.("change", schedule);

    schedule();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
