/* AP Synapse mobile message actions V2: limited to visible chat messages. */
(() => {
  "use strict";
  if (window.__apMobileMessagePolishV2) return;
  window.__apMobileMessagePolishV2 = true;
  const mobile = matchMedia("(max-width: 900px)");
  const CHAT = "#chatWindow";
  const ROOT = ".message.user, .message.ai";
  const BODY = ".message-body, [data-message-body], .message-content, .message-text";
  const ACTION = "button, [role='button']";

  function label(el) {
    return [el.getAttribute("aria-label"), el.getAttribute("title"),
      el.getAttribute("data-action"), el.className?.baseVal ?? el.className,
      el.textContent].filter(Boolean).join(" ").toLowerCase();
  }
  function message(btn) { return btn.closest(ROOT); }
  function isEdit(btn) {
    if (/\b(edit|pencil|rewrite)\b/.test(label(btn))) return true;
    const root = message(btn), parent = btn.parentElement;
    return !!(root?.matches(".message.user") && parent?.classList.contains("ap-user-message-actions") &&
      parent.querySelectorAll(ACTION).length === 2 && btn === parent.querySelectorAll(ACTION)[1]);
  }
  function isShare(btn) {
    if (/\b(share|share-message|share-response)\b/.test(label(btn))) return true;
    const root = message(btn), parent = btn.parentElement;
    return !!(root?.matches(".message.ai") && parent &&
      /action/i.test(parent.className || "") &&
      parent.querySelectorAll(ACTION).length === 2 && btn === parent.querySelectorAll(ACTION)[1]);
  }
  function messageText(root) {
    if (!root) return "";
    const body = root.querySelector(BODY);
    const copy = (body || root).cloneNode(true);
    copy.querySelectorAll(".avatar,.timestamp,.message-time,.message-meta,time,.ap-user-message-actions,[data-ap-msg-actions],button,[role='button'],svg").forEach(el=>el.remove());
    return (copy.textContent || "").replace(/\u00a0/g, " ").replace(/\s+\d{1,2}:\d{2}(?:\s*[AP]M)?\s*$/i, "").trim();
  }
  function composer() {
    return document.querySelector("#userInput, .ap-mobile-chat-input-final, .command-bar textarea, .command-bar input[type=text]");
  }
  function setInput(input, value) {
    let proto = input;
    let setter;
    while ((proto = Object.getPrototypeOf(proto))) {
      const d = Object.getOwnPropertyDescriptor(proto, "value");
      if (d?.set) { setter = d.set; break; }
    }
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event("input", {bubbles:true}));
    input.focus({preventScroll:true});
  }
  function edit(btn) {
    const root = message(btn), clean = messageText(root);
    if (!root?.matches(".message.user") || !clean) return;
    setTimeout(() => {
      const input = composer();
      if (input && input.value !== clean) setInput(input, clean);
    }, 0);
  }

  function dismissShare() {
    const overlay = document.getElementById("apMobileMessageShareV2");
    if (!overlay) return;
    overlay.remove();
  }
  function showShare(root) {
    const text = messageText(root);
    if (!text) return;
    dismissShare();
    const back = document.createElement("div");
    back.id = "apMobileMessageShareV2";
    back.className = "ap-mobile-message-share-v2";
    back.innerHTML = '<section class="ap-mm-share-sheet" role="dialog" aria-modal="true" aria-label="Share message">' +
      '<div class="ap-mm-share-head"><strong>Share message</strong><button type="button" class="ap-mm-share-close" aria-label="Close">×</button></div>' +
      '<p class="ap-mm-share-preview"></p>' +
      '<div class="ap-mm-share-controls"><button type="button" class="ap-mm-share-copy">Copy text</button><button type="button" class="ap-mm-share-native">Share</button></div>' +
      '<p class="ap-mm-share-status" role="status"></p></section>';
    back.querySelector(".ap-mm-share-preview").textContent = text.slice(0,240) + (text.length > 240 ? "…" : "");
    const share = back.querySelector(".ap-mm-share-native");
    if (!navigator.share) share.hidden = true;
    const status = back.querySelector(".ap-mm-share-status");
    back.querySelector(".ap-mm-share-close").addEventListener("click", dismissShare);
    back.addEventListener("click", e => {if (e.target === back) dismissShare();});
    back.querySelector(".ap-mm-share-copy").addEventListener("click", async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(text);
        status.textContent = "Copied. You can now paste the message anywhere.";
      } catch (_e) {
        const fallback = document.createElement("textarea");
        fallback.value = text;
        fallback.style.cssText = "position:fixed;left:-9999px;top:0";
        document.body.appendChild(fallback);
        fallback.select();
        let copied = false;
        try { copied = document.execCommand("copy"); } catch (_e) {}
        fallback.remove();
        status.textContent = copied ? "Copied. You can now paste the message anywhere." : "Copy unavailable in this browser.";
      }
    });
    share.addEventListener("click", async () => {
      try { await navigator.share({title:"AP Synapse message", text}); }
      catch (e) { if (e?.name !== "AbortError") status.textContent = "Sharing was unavailable. Use Copy text instead."; }
    });
    document.body.appendChild(back);
    back.querySelector(".ap-mm-share-close").focus({preventScroll:true});
  }
  document.addEventListener("keydown", e=>{if(e.key==="Escape")dismissShare();});
  document.addEventListener("click", e=>{
    if (!mobile.matches) return;
    const btn = e.target.closest(ACTION);
    if (!btn || !btn.closest(CHAT) || !message(btn)) return;
    if (isShare(btn)) { e.preventDefault(); e.stopImmediatePropagation(); showShare(message(btn)); }
    else if (isEdit(btn)) edit(btn);
  }, true);
  function styleClusters() {
    if (!mobile.matches) return;
    const chat = document.querySelector(CHAT);
    if (!chat) return;
    chat.querySelectorAll(ROOT).forEach(root => {
      root.querySelectorAll("button, [role='button']").forEach(btn=>{
        if (!(isEdit(btn) || isShare(btn) || /\bcopy\b/.test(label(btn)))) return;
        const parent = btn.parentElement;
        if (!parent || parent.querySelectorAll(":scope > button, :scope > [role='button']").length > 4) return;
        parent.setAttribute("data-ap-msg-actions", "true");
        parent.querySelectorAll(":scope > button, :scope > [role='button']").forEach(b=>b.setAttribute("data-ap-msg-action", "true"));
      });
    });
  }
  function boot(){
    const chat=document.querySelector(CHAT);
    if (!chat) return;
    styleClusters();
    const observer=new MutationObserver(() => requestAnimationFrame(styleClusters));
    observer.observe(chat,{childList:true,subtree:true});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
