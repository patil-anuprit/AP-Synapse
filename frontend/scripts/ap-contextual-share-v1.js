/* AP SYNAPSE - CONTEXTUAL SHARE V1 */
(() => {
  "use strict";

  function boot() {
    const button = document.getElementById("shareConversationBtn");
    const assistant = document.getElementById("assistantPage");
    const chat = document.getElementById("chatWindow");
    const hero = document.getElementById("heroScreen");

    if (!button || !assistant || !chat || !hero) return;

    const userMessageSelector = [
      ".message.user",
      ".user-message",
      ".chat-message.user",
      '[data-role="user"]',
      '[data-message-role="user"]'
    ].join(",");

    function visible(element) {
      if (!element || element.getAttribute("aria-hidden") === "true")
        return false;

      const style = getComputedStyle(element);

      return style.display !== "none" &&
             style.visibility !== "hidden";
    }

    function update() {
      const hasConversation =
        visible(assistant) &&
        visible(chat) &&
        !visible(hero) &&
        !!chat.querySelector(userMessageSelector);

      button.dataset.apShareReady = String(hasConversation);

      if (hasConversation) {
        button.removeAttribute("aria-hidden");
      } else {
        button.setAttribute("aria-hidden", "true");
      }
    }

    let scheduled = false;

    function scheduleUpdate() {
      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(() => {
        scheduled = false;
        update();
      });
    }

    // React when messages are added or removed.
    new MutationObserver(scheduleUpdate).observe(chat, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "aria-hidden"]
    });

    // React when the homepage or workspace changes.
    for (const element of [assistant, hero]) {
      new MutationObserver(scheduleUpdate).observe(element, {
        attributes: true,
        attributeFilter: ["style", "class", "aria-hidden", "hidden"]
      });
    }

    window.addEventListener("pageshow", scheduleUpdate);
    window.addEventListener("popstate", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
