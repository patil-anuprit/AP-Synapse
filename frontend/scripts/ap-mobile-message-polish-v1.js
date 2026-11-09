
/* AP SYNAPSE - MOBILE MESSAGE POLISH V1 */
(() => {
  "use strict";

  const MOBILE_QUERY = window.matchMedia("(max-width: 900px)");

  function isMobile() {
    return MOBILE_QUERY.matches;
  }

  function isVisible(el) {
    if (!el) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function getLabel(el) {
    return [
      el.getAttribute("aria-label") || "",
      el.getAttribute("title") || "",
      el.getAttribute("data-action") || "",
      el.getAttribute("data-role") || "",
      el.className || "",
      el.textContent || ""
    ].join(" ").toLowerCase();
  }

  function isShareButton(btn) {
    const label = getLabel(btn);
    return /share|collaborat|snapshot/.test(label);
  }

  function isExplicitEditButton(btn) {
    const label = getLabel(btn);
    return /edit|pencil|pen|rewrite/.test(label);
  }

  function isLikelyEditButton(btn) {
    if (isExplicitEditButton(btn)) return true;
    const parent = btn.parentElement;
    if (!parent) return false;

    const siblings = Array.from(parent.children).filter(
      node => node.matches && node.matches("button,[role='button']")
    );

    if (siblings.length >= 2 && siblings.length <= 3) {
      const hasShare = siblings.some(isShareButton);
      if (hasShare && !isShareButton(btn)) return true;
    }
    return false;
  }

  function findComposer() {
    const selectors = [
      "textarea.ap-mobile-chat-input-final",
      "textarea#userInput",
      "input.ap-mobile-chat-input-final",
      "input#userInput",
      ".ap-mobile-chat-input-final",
      ".command-bar textarea",
      ".command-bar input[type='text']",
      "textarea",
      "input[type='text']"
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (isVisible(el)) return el;
    }
    return null;
  }

  function setNativeValue(el, value) {
    const proto = Object.getPrototypeOf(el);
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }
  }

  function cleanText(text) {
    return (text || "")
      .replace(/\u00A0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function stripTrailingTimestamp(text) {
    let t = cleanText(text);

    const patterns = [
      /\s+(?:\d{1,2}:\d{2})(?:\s?[APMapm]{2})?$/,
      /\s+(?:today|yesterday)\s+\d{1,2}:\d{2}(?:\s?[APMapm]{2})?$/i,
      /\s+(?:mon|tue|wed|thu|fri|sat|sun)\s+\d{1,2}:\d{2}(?:\s?[APMapm]{2})?$/i
    ];

    for (const pattern of patterns) {
      t = t.replace(pattern, "").trim();
    }
    return t;
  }

  function extractMessageText(root) {
    if (!root) return "";

    const contentSelectors = [
      "[data-message-body]",
      ".message-text",
      ".message-content",
      ".chat-message-content",
      ".bubble-content",
      ".content",
      ".text",
      ".markdown",
      ".prose"
    ];

    for (const selector of contentSelectors) {
      const el = root.querySelector(selector);
      if (el && isVisible(el)) {
        const clone = el.cloneNode(true);
        clone.querySelectorAll(
          ".timestamp,.time,.message-time,.message-meta,.meta,time,.edited,[data-time],[data-timestamp],button,svg"
        ).forEach(node => node.remove());

        const txt = stripTrailingTimestamp(clone.textContent || "");
        if (txt) return txt;
      }
    }

    const clone = root.cloneNode(true);
    clone.querySelectorAll(
      ".timestamp,.time,.message-time,.message-meta,.meta,time,.edited,[data-time],[data-timestamp],button,svg"
    ).forEach(node => node.remove());

    return stripTrailingTimestamp(clone.textContent || "");
  }

  function findMessageRoot(node) {
    return node.closest(
      "[data-message-id], .message, .chat-message, .user-message, .assistant-message, li"
    );
  }

  function applyComposerText(value) {
    const input = findComposer();
    if (!input) return;

    const text = stripTrailingTimestamp(value);
    if (!text) return;

    setNativeValue(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    if (typeof input.focus === "function") input.focus();

    try {
      const len = input.value.length;
      if (typeof input.setSelectionRange === "function") {
        input.setSelectionRange(len, len);
      }
    } catch (_) {}
  }

  function repairEditFill(clickedButton) {
    const root = findMessageRoot(clickedButton);
    const extracted = extractMessageText(root);

    const run = () => {
      const input = findComposer();
      if (!input) return;

      let finalText = extracted || stripTrailingTimestamp(input.value || "");
      finalText = stripTrailingTimestamp(finalText);
      if (!finalText) return;

      if ((input.value || "") !== finalText) {
        applyComposerText(finalText);
      }
    };

    setTimeout(run, 0);
    setTimeout(run, 50);
    setTimeout(run, 180);
  }

  function styleMessageActionClusters() {
    if (!isMobile()) return;

    const buttons = Array.from(document.querySelectorAll("button,[role='button']"));

    buttons.forEach(btn => {
      if (!isVisible(btn)) return;
      if (!(isLikelyEditButton(btn) || isShareButton(btn))) return;

      const messageRoot = findMessageRoot(btn);
      if (!messageRoot) return;

      const cluster = btn.parentElement;
      if (!cluster) return;

      const clusterButtons = Array.from(cluster.children).filter(
        node => node.matches && node.matches("button,[role='button']")
      );

      if (!clusterButtons.length || clusterButtons.length > 4) return;

      cluster.setAttribute("data-ap-msg-actions", "true");
      clusterButtons.forEach(b => b.setAttribute("data-ap-msg-action", "true"));
    });
  }

  function fixShareSheetCloseButton() {
    const panels = Array.from(document.querySelectorAll("div,section,aside"));

    panels.forEach(panel => {
      const text = cleanText(panel.textContent || "");
      if (!/share conversation/i.test(text)) return;

      panel.setAttribute("data-ap-share-sheet", "true");

      const buttons = Array.from(panel.querySelectorAll("button,[role='button']")).filter(isVisible);
      if (!buttons.length) return;

      let closeBtn = buttons.find(btn => /close|dismiss|cancel|x/i.test(getLabel(btn)));

      if (!closeBtn) {
        const panelRect = panel.getBoundingClientRect();

        closeBtn = buttons
          .map(btn => {
            const r = btn.getBoundingClientRect();
            const score = Math.abs(r.top - panelRect.top) + Math.abs(r.right - panelRect.right);
            return { btn, score };
          })
          .sort((a, b) => a.score - b.score)[0]?.btn || null;
      }

      if (!closeBtn) return;

      closeBtn.setAttribute("data-ap-share-close", "true");
      closeBtn.setAttribute("aria-label", "Close share panel");
      closeBtn.setAttribute("title", "Close");

      if (closeBtn.dataset.apShareCloseApplied !== "true") {
        closeBtn.dataset.apShareCloseApplied = "true";
        closeBtn.textContent = "×";
      }
    });
  }

  function runPolish() {
    styleMessageActionClusters();
    fixShareSheetCloseButton();
  }

  document.addEventListener("click", event => {
    const btn = event.target.closest("button,[role='button']");
    if (!btn) return;

    if (isLikelyEditButton(btn) && !isShareButton(btn)) {
      repairEditFill(btn);
    }

    setTimeout(runPolish, 0);
    setTimeout(runPolish, 120);
  }, true);

  const observer = new MutationObserver(() => {
    requestAnimationFrame(runPolish);
  });

  function boot() {
    if (!document.body) return;
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-hidden"]
    });

    runPolish();
    setTimeout(runPolish, 250);
    setTimeout(runPolish, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
