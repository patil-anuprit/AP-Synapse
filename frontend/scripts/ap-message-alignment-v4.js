
/* AP Synapse Mobile Message Alignment V4 */
(() => {
  "use strict";

  if (window.__apMessageAlignmentV4) return;
  window.__apMessageAlignmentV4 = true;

  const mobile = matchMedia("(max-width: 767px)");
  let pending = false;

  function repair() {
    if (!mobile.matches) return;

    const chat = document.getElementById("chatWindow");

    if (chat) {
      chat.querySelectorAll(".message.ai").forEach(message => {
        const body =
          message.querySelector(":scope > .message-body") ||
          message.querySelector(".message-body");

        const actions =
          message.querySelector(".ap-response-actions");

        if (!body || !actions || actions.contains(body)) return;

        // Reposition existing buttons, retaining their click handlers.
        if (actions.parentElement !== body) {
          body.appendChild(actions);
        }
      });
    }

    // Correct the real Share-dialog close button.
    const close = document.querySelector(
      '#apShareV2Backdrop .ap-share-panel > header > ' +
      'button.ap-share-close[data-action="close"]'
    );

    if (close) {
      if (close.children.length ||
          close.textContent.trim() !== "×") {
        close.replaceChildren(
          document.createTextNode("×")
        );
      }

      if (close.getAttribute("aria-label") !==
          "Close share conversation") {
        close.setAttribute(
          "aria-label",
          "Close share conversation"
        );
      }
    }
  }

  function schedule() {
    if (pending) return;
    pending = true;

    requestAnimationFrame(() => {
      pending = false;
      repair();
    });
  }

  function boot() {
    if (!document.body) return;

    new MutationObserver(schedule).observe(document.body, {
      childList: true,
      subtree: true
    });

    mobile.addEventListener?.("change", schedule);
    schedule();
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
