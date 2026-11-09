
/* AP Synapse - Mobile Compact Topbar Controls */
(() => {
  "use strict";

  if (window.__apMobileCompactV1) return;
  window.__apMobileCompactV1 = true;

  const CLS = "ap-mobile-compact-control-v1";
  const mobile = matchMedia("(max-width: 767px)");

  const css = document.createElement("style");
  css.textContent = `
    @media (max-width: 767px) {
      .topbar .topbar-right .${CLS} {
        scale: .96 !important;
        margin-inline: -2px !important;
        transform-origin: center center;
        transition: scale 160ms ease;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .${CLS} {
        transition: none !important;
      }
    }
  `;
  document.head.appendChild(css);

  function visible(el) {
    if (!el.getClientRects().length) return false;
    const s = getComputedStyle(el);
    return s.display !== "none" &&
           s.visibility !== "hidden" &&
           Number(s.opacity) > 0;
  }

  function describe(el) {
    const icon = el.querySelector(
      "svg, img, i, [data-lucide]"
    );

    return [
      el.id,
      typeof el.className === "string"
        ? el.className : "",
      el.getAttribute("aria-label"),
      el.getAttribute("title"),
      el.getAttribute("data-tooltip"),
      icon?.getAttribute("data-lucide"),
      icon?.getAttribute("class"),
      icon?.getAttribute("alt"),
      el.textContent?.trim().slice(0, 40)
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function update() {
    const row = document.querySelector(
      ".topbar .topbar-right"
    );

    if (!row) return;

    const aprishaIds = [
      "apAprishaOrderAprishaBtnV1",
      "apAprishaOrderComboV1"
    ];

    const protectedControls = aprishaIds
      .map(id => document.getElementById(id))
      .filter(Boolean);

    const controls = [...row.querySelectorAll(
      'button, a, [role="button"], ' +
      '[onclick], [tabindex="0"], ' +
      '[id*="Share"], [id*="share"], ' +
      '[id*="Notif"], [id*="notif"], ' +
      '[id*="Profile"], [id*="profile"]'
    )].filter(el => {
      if (!visible(el)) return false;

      if (protectedControls.some(a =>
        el === a ||
        el.contains(a) ||
        a.contains(el)
      )) return false;

      const width = el.getBoundingClientRect().width;
      return width >= 12 && width <= 100;
    });

    const find = regex =>
      controls.find(el => regex.test(describe(el)));

    const share = find(/share/);
    const notification = find(/notif|bell/);
    const profile = find(
      /profile|avatar|account|user.?menu|user.?icon/
    );

    const selected = [share, notification, profile];

    const valid =
      mobile.matches &&
      selected.every(Boolean) &&
      new Set(selected).size === 3;

    let changed = false;

    for (const el of row.querySelectorAll("." + CLS)) {
      if (!valid || !selected.includes(el)) {
        el.classList.remove(CLS);
        changed = true;
      }
    }

    if (valid) {
      for (const el of selected) {
        if (!el.classList.contains(CLS)) {
          el.classList.add(CLS);
          changed = true;
        }
      }
    }

    if (changed) {
      window.dispatchEvent(new Event("resize"));
    }
  }

  function boot() {
    const row = document.querySelector(
      ".topbar .topbar-right"
    );

    if (!row) return;

    let queued = false;

    const schedule = () => {
      if (queued) return;
      queued = true;

      requestAnimationFrame(() => {
        queued = false;
        update();
      });
    };

    new MutationObserver(schedule).observe(row, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "class", "style", "hidden", "aria-hidden"
      ]
    });

    window.addEventListener("resize", schedule, {
      passive: true
    });

    mobile.addEventListener?.("change", schedule);
    window.addEventListener("pageshow", schedule);

    schedule();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded", boot, { once: true }
    );
  } else {
    boot();
  }
})();
