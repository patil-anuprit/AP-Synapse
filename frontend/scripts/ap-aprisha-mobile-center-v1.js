
/* AP Synapse - APRISHA Mobile Topbar Center V1 */
(() => {
  "use strict";

  if (window.__apAprishaMobileCenterV1) return;
  window.__apAprishaMobileCenterV1 = true;

  const style = document.createElement("style");
  style.id = "ap-aprisha-mobile-center-v1";

  style.textContent = `
    @media (max-width: 767px) {
      html body .topbar .topbar-right
      #apAprishaOrderAprishaBtnV1,
      html body .topbar .topbar-right
      #apAprishaOrderComboV1 {
        translate:
          var(--ap-aprisha-mobile-center, 0px)
          0 !important;
      }
    }
  `;

  document.head.appendChild(style);

  const mobile = matchMedia("(max-width: 767px)");
  let scheduled = false;

  function center() {
    const first = document.getElementById(
      "apAprishaOrderAprishaBtnV1"
    );

    const last = document.getElementById(
      "apAprishaOrderComboV1"
    );

    const bar = first?.closest(".topbar");
    const row = first?.closest(".topbar-right");

    if (!bar || !row || !last || !row.contains(last))
      return;

    if (!mobile.matches) {
      row.style.removeProperty(
        "--ap-aprisha-mobile-center"
      );
      return;
    }

    const a = first.getBoundingClientRect();
    const b = last.getBoundingClientRect();
    const header = bar.getBoundingClientRect();

    if (!a.width || !b.width || !header.width)
      return;

    const old = parseFloat(
      row.style.getPropertyValue(
        "--ap-aprisha-mobile-center"
      )
    ) || 0;

    const left = Math.min(a.left, b.left);
    const right = Math.max(a.right, b.right);

    // Position the combined three-button group at
    // the actual horizontal center of the top bar.
    const desired = old + (
      header.left + header.width / 2 -
      (left + right) / 2
    );

    // Preserve hamburger space.
    const min = old + (
      header.left + 49 - left
    );

    // Prevent overlapping neighboring topbar buttons.
    const adjacent = Array.from(row.children)
      .filter(el =>
        el !== first &&
        el !== last &&
        !el.contains(first) &&
        !el.contains(last)
      )
      .map(el => ({
        el,
        rect: el.getBoundingClientRect()
      }))
      .filter(item =>
        item.rect.width > 1 &&
        item.rect.left >= right - 1 &&
        !["absolute", "fixed"].includes(
          getComputedStyle(item.el).position
        )
      )
      .map(item => item.rect.left);

    const rightLimit = Math.min(
      header.right - 5,
      ...adjacent
    );

    const max = old + (
      rightLimit - right - 7
    );

    if (max < min) return;

    const shift = Math.max(
      min,
      Math.min(desired, max)
    );

    if (!Number.isFinite(shift)) return;

    if (Math.abs(shift - old) > 0.5) {
      row.style.setProperty(
        "--ap-aprisha-mobile-center",
        `${shift.toFixed(2)}px`
      );
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      center();
    });
  }

  function boot() {
    schedule();

    new MutationObserver(schedule).observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

    window.addEventListener(
      "resize", schedule, { passive: true }
    );

    window.addEventListener("pageshow", schedule);

    mobile.addEventListener?.("change", schedule);

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(schedule);
      const bar = document.querySelector(".topbar");
      if (bar) observer.observe(bar);
    }
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
