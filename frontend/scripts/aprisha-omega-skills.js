(() => {
  "use strict";

  const MARKER = "AP_APRISHA_OMEGA_CORE_SKILLS_V1";
  if (window.__AP_APRISHA_OMEGA_SKILLS_V1__) return;
  window.__AP_APRISHA_OMEGA_SKILLS_V1__ = true;

  function boot() {
    const omega = window.APAprishaOmega;
    if (!omega?.skills?.register) {
      setTimeout(boot, 100);
      return;
    }

    const clean = (value) => String(value ?? "").trim();
    const lower = (value) => clean(value).toLowerCase();
    const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const KNOWN_SITES = {
      gmail: "https://mail.google.com/",
      mail: "https://mail.google.com/",
      youtube: "https://www.youtube.com/",
      google: "https://www.google.com/",
      github: "https://github.com/",
      spotify: "https://open.spotify.com/",
      whatsapp: "https://web.whatsapp.com/",
      drive: "https://drive.google.com/",
      "google drive": "https://drive.google.com/",
      calendar: "https://calendar.google.com/",
      "google calendar": "https://calendar.google.com/",
      maps: "https://maps.google.com/",
      "google maps": "https://maps.google.com/"
    };

    function openNewTab(url) {
      const opened = window.open(url, "_blank");
      if (!opened) {
        const error = new Error("The browser blocked the new tab. Allow pop-ups for AP Synapse and try again.");
        error.code = "AP_OMEGA_POPUP_BLOCKED";
        throw error;
      }
      try { opened.opener = null; } catch {}
      return { url, opened: true };
    }

    omega.skills.register({
      id: "web.open_url",
      description: "Open an http/https URL in a new tab",
      risk: "low",
      match(goal) {
        const text = clean(goal);
        const match = text.match(/^(?:open|go to|visit)\s+(https?:\/\/\S+)$/i) || text.match(/^(https?:\/\/\S+)$/i);
        return match ? { score: 0.99, input: { url: match[1] } } : null;
      },
      execute({ url }) {
        const parsed = new URL(url, location.href);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only http/https URLs are allowed.");
        return openNewTab(parsed.href);
      },
      verify(result) {
        return { ok: !!result?.opened, message: result?.opened ? "New tab opened." : "New tab did not open." };
      }
    });

    omega.skills.register({
      id: "web.open_known",
      description: "Open a known web service",
      risk: "low",
      match(goal) {
        const text = lower(goal).replace(/[.!?]+$/, "");
        const match = text.match(/^(?:open|launch|go to|visit)\s+(.+)$/i);
        if (!match) return null;
        const key = match[1].trim();
        const url = KNOWN_SITES[key];
        return url ? { score: 0.98, input: { key, url } } : null;
      },
      async execute({ url, key }) {
        try {
          return { ...openNewTab(url), service: key, via: "web" };
        } catch (error) {
          if (error?.code === "AP_OMEGA_POPUP_BLOCKED" && omega.status().legacyReady) {
            const legacyResult = await omega.executeLegacy(`open ${key}`);
            return { opened: true, service: key, via: "legacy", legacyResult: legacyResult ?? null };
          }
          throw error;
        }
      },
      verify(result) {
        return { ok: !!result?.opened, message: result?.opened ? `${result.service || "Service"} opened.` : "Service did not open." };
      }
    });

    omega.skills.register({
      id: "web.search",
      description: "Search the web",
      risk: "low",
      match(goal) {
        const text = clean(goal);
        const match = text.match(/^(?:search(?: the)? web for|google|search for)\s+(.+)$/i);
        return match ? { score: 0.96, input: { query: clean(match[1]) } } : null;
      },
      execute({ query }) {
        if (!clean(query)) throw new Error("Search query is empty.");
        const url = `https://www.google.com/search?q=${encodeURIComponent(clean(query))}`;
        return { ...openNewTab(url), query: clean(query) };
      },
      verify(result) {
        return { ok: !!result?.opened };
      }
    });

    omega.skills.register({
      id: "browser.back",
      description: "Navigate the current tab back",
      risk: "low",
      match(goal) {
        return /^(?:go\s+)?back$/i.test(clean(goal)) ? { score: 0.98, input: {} } : null;
      },
      execute() {
        history.back();
        return { requested: true };
      }
    });

    omega.skills.register({
      id: "browser.forward",
      description: "Navigate the current tab forward",
      risk: "low",
      match(goal) {
        return /^(?:go\s+)?forward$/i.test(clean(goal)) ? { score: 0.98, input: {} } : null;
      },
      execute() {
        history.forward();
        return { requested: true };
      }
    });

    omega.skills.register({
      id: "browser.reload",
      description: "Reload the current page",
      risk: "medium",
      match(goal) {
        return /^(?:reload|refresh)(?:\s+(?:page|this page))?$/i.test(clean(goal)) ? { score: 0.98, input: {} } : null;
      },
      execute() {
        setTimeout(() => location.reload(), 40);
        return { requested: true };
      }
    });

    const interactiveSelector = [
      "button",
      "a[href]",
      "[role='button']",
      "[role='menuitem']",
      "input[type='button']",
      "input[type='submit']",
      "[data-action]"
    ].join(",");

    function elementName(el) {
      return clean(
        el.getAttribute?.("aria-label") ||
        el.getAttribute?.("title") ||
        el.getAttribute?.("data-action") ||
        el.innerText ||
        el.value
      );
    }

    function visible(el) {
      if (!el || el.disabled) return false;
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) !== 0 && el.getClientRects().length > 0;
    }

    function findInteractive(label) {
      const wanted = lower(label);
      const all = [...document.querySelectorAll(interactiveSelector)].filter(visible);
      return all.find((el) => lower(elementName(el)) === wanted) ||
        all.find((el) => lower(elementName(el)).includes(wanted)) ||
        null;
    }

    function clickRisk({ label }) {
      const text = lower(label);
      const sensitive = /\b(delete|remove|erase|send|submit|publish|post|buy|purchase|pay|checkout|transfer|confirm|logout|log out|sign out|unsubscribe|cancel subscription)\b/i;
      return sensitive.test(text) ? "high" : "medium";
    }

    omega.skills.register({
      id: "ui.click",
      description: "Click a visible control by its accessible name",
      risk: clickRisk,
      describe({ label }) {
        return `Click the visible control “${clean(label)}”.`;
      },
      match(goal) {
        const match = clean(goal).match(/^(?:click|press|tap)\s+(.+)$/i);
        return match ? { score: 0.88, input: { label: clean(match[1]) } } : null;
      },
      canRun({ label }) {
        return findInteractive(label) ? true : `I cannot find a visible control named “${clean(label)}”.`;
      },
      execute({ label }) {
        const target = findInteractive(label);
        if (!target) throw new Error(`Visible control not found: ${clean(label)}`);
        const beforeUrl = location.href;
        const name = elementName(target);
        target.focus?.({ preventScroll: true });
        target.click();
        return { clicked: true, name, beforeUrl };
      },
      verify(result) {
        return { ok: !!result?.clicked, message: result?.clicked ? `Clicked ${result.name || "control"}.` : "Click was not issued." };
      }
    });

    function editableTarget() {
      const el = document.activeElement;
      if (!el) return null;
      if (el.matches?.("input, textarea")) return el;
      if (el.isContentEditable) return el;
      return null;
    }

    omega.skills.register({
      id: "ui.type",
      description: "Type text into the currently focused editable field",
      risk: "medium",
      match(goal) {
        const match = clean(goal).match(/^type\s+[“\"]?([\s\S]+?)[”\"]?$/i);
        return match ? { score: 0.78, input: { text: match[1] } } : null;
      },
      canRun() {
        const target = editableTarget();
        if (!target) return "Focus an input or text box first.";
        if (lower(target.type) === "password") return "Aprisha will not type into password fields through the generic typing skill.";
        return true;
      },
      execute({ text }) {
        const target = editableTarget();
        if (!target) throw new Error("No focused editable field.");
        if (lower(target.type) === "password") throw new Error("Generic typing into password fields is blocked.");

        if (target.isContentEditable) {
          target.textContent = clean(text);
          target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: clean(text) }));
        } else {
          const proto = Object.getPrototypeOf(target);
          const descriptor = Object.getOwnPropertyDescriptor(proto, "value") || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value") || Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
          if (descriptor?.set) descriptor.set.call(target, clean(text));
          else target.value = clean(text);
          target.dispatchEvent(new Event("input", { bubbles: true }));
          target.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return { typed: true, characters: clean(text).length };
      },
      verify(result) {
        return { ok: !!result?.typed };
      }
    });

    omega.skills.register({
      id: "clipboard.write",
      description: "Write supplied text to the clipboard",
      risk: "medium",
      match(goal) {
        const match = clean(goal).match(/^(?:copy)\s+([\s\S]+?)\s+(?:to\s+)?clipboard$/i);
        return match ? { score: 0.9, input: { text: match[1] } } : null;
      },
      async canRun() {
        return navigator.clipboard?.writeText ? true : "Clipboard writing is unavailable in this browser context.";
      },
      async execute({ text }) {
        await navigator.clipboard.writeText(String(text ?? ""));
        return { written: true, characters: String(text ?? "").length };
      },
      verify(result) {
        return { ok: !!result?.written };
      }
    });

    omega.skills.register({
      id: "clipboard.read",
      description: "Read text from the clipboard",
      risk: "high",
      requiresConfirmation: true,
      match(goal) {
        return /^(?:read|show|get)\s+(?:the\s+)?clipboard$/i.test(clean(goal)) ? { score: 0.94, input: {} } : null;
      },
      async canRun() {
        return navigator.clipboard?.readText ? true : "Clipboard reading is unavailable in this browser context.";
      },
      async execute() {
        const text = await navigator.clipboard.readText();
        return { text };
      }
    });

    omega.skills.register({
      id: "time.wait",
      description: "Wait briefly before the next step",
      risk: "low",
      match(goal) {
        const match = clean(goal).match(/^wait\s+(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|milliseconds?|ms)$/i);
        if (!match) return null;
        let ms = Number(match[1]);
        if (!/^m/i.test(match[2])) ms *= 1000;
        ms = Math.min(10000, Math.max(0, ms));
        return { score: 0.95, input: { ms } };
      },
      async execute({ ms }) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(10000, Math.max(0, Number(ms) || 0))));
        return { waitedMs: ms };
      }
    });

    omega.skills.register({
      id: "ap.event",
      description: "Dispatch a structured AP Synapse action event",
      risk: "medium",
      execute({ name, detail = {} }) {
        const eventName = clean(name);
        if (!eventName) throw new Error("AP event name is required.");
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
        return { dispatched: true, name: eventName };
      },
      verify(result) {
        return { ok: !!result?.dispatched };
      }
    });

    omega.skills.register({
      id: "aprisha.legacy",
      description: "Use the existing Aprisha command runtime for commands not yet represented as Omega skills",
      risk({ command }) {
        const text = lower(command);
        return /\b(delete|remove|erase|send|submit|publish|post|buy|purchase|pay|checkout|transfer|password|security|account|logout|log out|sign out)\b/i.test(text)
          ? "high"
          : "low";
      },
      describe({ command }) {
        return `Run the existing Aprisha command “${clean(command)}”.`;
      },
      async canRun() {
        return omega.status().legacyReady ? true : "The existing Aprisha command runtime is not ready yet.";
      },
      async execute({ command }) {
        const value = clean(command);
        if (!value) throw new Error("Aprisha command is empty.");
        const result = await omega.executeLegacy(value);
        return { command: value, legacyResult: result ?? null, delegated: true };
      }
    });

    omega.skills.register({
      id: "omega.status",
      description: "Report Aprisha Omega runtime status",
      risk: "low",
      match(goal) {
        return /^(?:omega status|aprisha status|what can you do)$/i.test(clean(goal)) ? { score: 0.91, input: {} } : null;
      },
      execute() {
        return omega.status();
      }
    });

    omega.emit?.("core-skills-ready", { marker: MARKER, skills: omega.skills.list().length });
    console.log("APRISHA OMEGA CORE SKILLS READY", omega.status());
  }

  boot();
})();
