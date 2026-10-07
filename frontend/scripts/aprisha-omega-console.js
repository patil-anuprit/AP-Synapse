(() => {
  "use strict";

  const ROOT_ID = "apAprishaOmegaConsoleV1";
  const STYLE_ID = "apAprishaOmegaConsoleV1Style";
  const MARKER = "AP_APRISHA_OMEGA_CONSOLE_TOPBAR_V1_1";

  if (window.__AP_APRISHA_OMEGA_CONSOLE_TOPBAR_V1_1__) return;
  window.__AP_APRISHA_OMEGA_CONSOLE_TOPBAR_V1_1__ = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function findTopbarRight() {
    return (
      document.querySelector(".topbar .topbar-right") ||
      document.querySelector(".topbar-right") ||
      document.querySelector("header.topbar")
    );
  }

  function placeInTopbar(root) {
    const target = findTopbarRight();
    if (!target) return false;

    const aprisha = document.getElementById("apDedicatedAprishaButton");
    const activity = target.querySelector(".ap-notification-icon-only");
    const profile = document.getElementById("profileBtn");

    if (aprisha && aprisha.parentElement === target) {
      aprisha.insertAdjacentElement("afterend", root);
    } else if (activity && activity.parentElement === target) {
      target.insertBefore(root, activity);
    } else if (profile && profile.parentElement === target) {
      target.insertBefore(root, profile);
    } else {
      target.appendChild(root);
    }

    root.dataset.aoPlacement = "topbar";
    return true;
  }

  async function waitForOmega() {
    for (let i = 0; i < 150; i += 1) {
      if (window.APAprishaOmega?.run) return window.APAprishaOmega;
      await sleep(120);
    }
    return null;
  }

  function addStyles() {
    document.getElementById(STYLE_ID)?.remove();

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
#${ROOT_ID}{position:relative;display:inline-flex;align-items:center;flex:0 0 auto;z-index:2147482000;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#f7f7f8;isolation:isolate}
#${ROOT_ID} *{box-sizing:border-box}
#${ROOT_ID} .ao-launch{position:relative;width:44px;height:44px;min-width:44px;padding:0;display:grid;place-items:center;border:0;border-radius:14px;background:transparent;color:#f6df9a;cursor:pointer;outline:none;isolation:isolate;transform:translateZ(0);-webkit-tap-highlight-color:transparent}
#${ROOT_ID} .ao-launch::before{content:"";position:absolute;inset:0;border-radius:14px;padding:1px;background:conic-gradient(from 210deg,rgba(255,255,255,.10),rgba(239,205,114,.78),rgba(255,255,255,.14),rgba(129,148,255,.50),rgba(255,255,255,.10));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;opacity:.88}
#${ROOT_ID} .ao-launch::after{content:"";position:absolute;inset:3px;z-index:-1;border-radius:11px;background:radial-gradient(circle at 30% 18%,rgba(245,219,145,.14),transparent 42%),linear-gradient(150deg,rgba(34,36,42,.98),rgba(10,11,14,.99));box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 8px 24px rgba(0,0,0,.32)}
#${ROOT_ID} .ao-launch:hover{transform:translateY(-1px)}
#${ROOT_ID} .ao-launch:hover::before{opacity:1;filter:drop-shadow(0 0 8px rgba(229,193,96,.30))}
#${ROOT_ID} .ao-launch:active{transform:translateY(0) scale(.97)}
#${ROOT_ID} .ao-launch:focus-visible{box-shadow:0 0 0 3px rgba(222,190,100,.22)}
#${ROOT_ID} .ao-mark{position:relative;width:28px;height:28px;display:grid;place-items:center}
#${ROOT_ID} .ao-mark svg{width:28px;height:28px;overflow:visible;display:block}
#${ROOT_ID} .ao-orbit{fill:none;stroke:rgba(236,203,113,.40);stroke-width:1.15;stroke-linecap:round;stroke-dasharray:4 4.8}
#${ROOT_ID} .ao-orbit-node{fill:#f1d887;filter:drop-shadow(0 0 3px rgba(241,216,135,.55))}
#${ROOT_ID} .ao-glyph{fill:none;stroke:#f5df9e;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 4px rgba(245,223,158,.22))}
#${ROOT_ID} .ao-core{fill:rgba(246,223,157,.08);stroke:rgba(246,223,157,.24);stroke-width:.8}
#${ROOT_ID} .ao-live{position:absolute;right:4px;top:4px;width:7px;height:7px;border-radius:50%;background:#e9cc78;border:2px solid #111318;box-shadow:0 0 0 1px rgba(233,204,120,.18),0 0 8px rgba(233,204,120,.48);pointer-events:none}
#${ROOT_ID} .ao-tip{position:absolute;top:calc(100% + 9px);right:0;z-index:5;padding:7px 10px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(12,13,16,.97);color:rgba(255,255,255,.78);box-shadow:0 12px 36px rgba(0,0,0,.34);white-space:nowrap;font-size:10px;font-weight:700;letter-spacing:.02em;opacity:0;transform:translateY(-3px);pointer-events:none;transition:opacity .14s ease,transform .14s ease}
#${ROOT_ID} .ao-launch:hover + .ao-tip,#${ROOT_ID} .ao-launch:focus-visible + .ao-tip{opacity:1;transform:translateY(0)}
#${ROOT_ID} .ao-panel{display:none;position:absolute;top:calc(100% + 12px);right:0;width:min(438px,calc(100vw - 30px));padding:0;overflow:hidden;border:1px solid rgba(255,255,255,.105);border-radius:21px;background:radial-gradient(circle at 12% 0%,rgba(235,200,108,.10),transparent 32%),linear-gradient(155deg,rgba(23,24,29,.985),rgba(9,10,13,.992));backdrop-filter:blur(24px) saturate(1.08);-webkit-backdrop-filter:blur(24px) saturate(1.08);box-shadow:0 34px 100px rgba(0,0,0,.60),0 8px 28px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.04);transform-origin:top right}
#${ROOT_ID}.open .ao-panel{display:block;animation:aoPanelIn .16s ease-out}
@keyframes aoPanelIn{from{opacity:0;transform:translateY(-5px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
#${ROOT_ID} .ao-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 16px 13px;border-bottom:1px solid rgba(255,255,255,.06)}
#${ROOT_ID} .ao-head-main{display:flex;align-items:center;gap:11px;min-width:0}
#${ROOT_ID} .ao-head-mark{width:34px;height:34px;flex:0 0 34px;display:grid;place-items:center;border:1px solid rgba(236,203,113,.24);border-radius:11px;background:rgba(236,203,113,.055);color:#f0d583;font-size:17px;font-weight:900;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
#${ROOT_ID} .ao-title{font-size:14px;font-weight:790;letter-spacing:-.015em;color:#f5f5f3}
#${ROOT_ID} .ao-sub{margin-top:3px;font-size:10px;color:rgba(255,255,255,.48);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#${ROOT_ID} .ao-close{width:34px;height:34px;padding:0;border:1px solid rgba(255,255,255,.07);border-radius:10px;background:rgba(255,255,255,.035);color:rgba(255,255,255,.72);font-size:18px;cursor:pointer}
#${ROOT_ID} .ao-close:hover{background:rgba(255,255,255,.07);color:#fff}
#${ROOT_ID} .ao-body{padding:14px}
#${ROOT_ID} .ao-row{display:flex;gap:8px}
#${ROOT_ID} input{min-width:0;flex:1;height:43px;border:1px solid rgba(255,255,255,.095);border-radius:12px;background:rgba(255,255,255,.045);color:#fff;padding:0 12px;outline:none;font:500 12px/1 Inter,system-ui,sans-serif}
#${ROOT_ID} input::placeholder{color:rgba(255,255,255,.34)}
#${ROOT_ID} input:focus{border-color:rgba(232,201,116,.38);box-shadow:0 0 0 3px rgba(232,201,116,.065)}
#${ROOT_ID} .ao-run{height:43px;padding:0 15px;border:1px solid rgba(243,219,151,.36);border-radius:12px;background:linear-gradient(135deg,#f0d98d,#cba84e);color:#111216;font-weight:820;cursor:pointer;box-shadow:0 7px 18px rgba(195,157,62,.14)}
#${ROOT_ID} .ao-run:disabled{opacity:.55;cursor:wait}
#${ROOT_ID} .ao-status{margin-top:10px;padding:10px 11px;border:1px solid rgba(255,255,255,.05);border-radius:12px;background:rgba(255,255,255,.028);font-size:11px;line-height:1.45;color:rgba(255,255,255,.64);white-space:pre-wrap;max-height:190px;overflow:auto}
#${ROOT_ID} .ao-bad{color:#ffc0c0}
#${ROOT_ID} .ao-good{color:#d5f7d9}
@media(max-width:767px){#${ROOT_ID}{position:relative;z-index:2147483600}#${ROOT_ID} .ao-launch{width:40px;height:40px;min-width:40px;border-radius:12px}#${ROOT_ID} .ao-launch::before{border-radius:12px}#${ROOT_ID} .ao-launch::after{border-radius:9px}#${ROOT_ID} .ao-mark,#${ROOT_ID} .ao-mark svg{width:25px;height:25px}#${ROOT_ID} .ao-panel{position:fixed;top:calc(68px + env(safe-area-inset-top));left:10px;right:10px;width:auto;max-height:calc(100dvh - 84px - env(safe-area-inset-top));overflow:auto;transform-origin:top right}#${ROOT_ID} .ao-tip{display:none}}
@media(prefers-reduced-motion:reduce){#${ROOT_ID} *{animation:none!important;transition:none!important}}
`;
    document.head.appendChild(style);
  }

  function createRoot() {
    document.getElementById(ROOT_ID)?.remove();

    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.innerHTML = `
      <button class="ao-launch" type="button" aria-label="Open Aprisha Omega" aria-expanded="false" title="Aprisha Ω — Universal Action Intelligence">
        <span class="ao-mark" aria-hidden="true">
          <svg viewBox="0 0 28 28" focusable="false">
            <circle class="ao-core" cx="14" cy="14" r="8.1"></circle>
            <path class="ao-orbit" d="M3.8 14c0-5.65 4.55-10.2 10.2-10.2 4.65 0 8.58 3.08 9.83 7.31"></path>
            <path class="ao-orbit" d="M24.2 14c0 5.65-4.55 10.2-10.2 10.2-4.65 0-8.58-3.08-9.83-7.31"></path>
            <circle class="ao-orbit-node" cx="23.82" cy="11.18" r="1.05"></circle>
            <circle class="ao-orbit-node" cx="4.18" cy="16.82" r=".82"></circle>
            <path class="ao-glyph" d="M8.1 19.4h4v-2.7c-2.05-.75-3.45-2.72-3.45-5.05 0-3.02 2.38-5.45 5.35-5.45s5.35 2.43 5.35 5.45c0 2.33-1.4 4.3-3.45 5.05v2.7h4"></path>
          </svg>
        </span>
        <span class="ao-live" aria-hidden="true"></span>
      </button>
      <div class="ao-tip" role="tooltip">Aprisha Ω</div>
      <section class="ao-panel" role="dialog" aria-label="Aprisha Omega command console">
        <div class="ao-head">
          <div class="ao-head-main">
            <div class="ao-head-mark" aria-hidden="true">Ω</div>
            <div><div class="ao-title">APRISHA Ω</div><div class="ao-sub" data-role="meta">Universal Action Intelligence</div></div>
          </div>
          <button class="ao-close" type="button" aria-label="Close Aprisha Omega">×</button>
        </div>
        <div class="ao-body">
          <div class="ao-row">
            <input data-role="goal" autocomplete="off" placeholder="Give Aprisha a goal…" aria-label="Aprisha Omega goal" />
            <button class="ao-run" type="button">Run</button>
          </div>
          <div class="ao-status" data-role="status" role="status" aria-live="polite">Ready.</div>
        </div>
      </section>`;
    return root;
  }

  async function boot() {
    const omega = await waitForOmega();
    if (!omega) {
      console.warn("APRISHA OMEGA TOPBAR: Omega runtime not ready.");
      return;
    }

    addStyles();
    const root = createRoot();

    if (!placeInTopbar(root)) {
      document.body.appendChild(root);
      root.dataset.aoPlacement = "fallback";
      console.warn("APRISHA OMEGA TOPBAR: topbar not found; using fallback placement.");
    }

    const launch = root.querySelector(".ao-launch");
    const close = root.querySelector(".ao-close");
    const runButton = root.querySelector(".ao-run");
    const input = root.querySelector('[data-role="goal"]');
    const status = root.querySelector('[data-role="status"]');
    const meta = root.querySelector('[data-role="meta"]');

    function refreshMeta() {
      const s = omega.status();
      meta.textContent = `${s.skills} skills · ${s.workflows} workflows · bridge ${s.bridgeReady ? "ready" : "waiting"}`;
      root.dataset.aoReady = s.ready ? "true" : "false";
    }

    function open() {
      root.classList.add("open");
      launch.setAttribute("aria-expanded", "true");
      refreshMeta();
      setTimeout(() => input.focus(), 0);
    }

    function hide() {
      root.classList.remove("open");
      launch.setAttribute("aria-expanded", "false");
    }

    async function runGoal() {
      const goal = String(input.value || "").trim();
      if (!goal) return;
      runButton.disabled = true;
      status.className = "ao-status";
      status.textContent = `Planning: ${goal}`;
      try {
        const result = await omega.run(goal, { source: "omega-topbar-console" });
        status.classList.add("ao-good");
        status.textContent = `Done\n${JSON.stringify(result.results, null, 2)}`;
        input.value = "";
      } catch (error) {
        status.classList.add("ao-bad");
        status.textContent = `Failed: ${error?.message || String(error)}`;
      } finally {
        runButton.disabled = false;
        refreshMeta();
      }
    }

    launch.addEventListener("click", () => root.classList.contains("open") ? hide() : open());
    close.addEventListener("click", hide);
    runButton.addEventListener("click", runGoal);

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        runGoal();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        hide();
        launch.focus();
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (!root.classList.contains("open")) return;
      if (root.contains(event.target)) return;
      hide();
    }, true);

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && root.classList.contains("open")) {
        hide();
        launch.focus();
      }
    });

    window.addEventListener("ap:aprisha-omega:run-start", (event) => {
      if (!root.classList.contains("open")) return;
      status.className = "ao-status";
      status.textContent = `Running: ${event.detail?.goal || "goal"}`;
      refreshMeta();
    });

    window.addEventListener("ap:aprisha-omega:run-error", (event) => {
      if (!root.classList.contains("open")) return;
      status.className = "ao-status ao-bad";
      status.textContent = `Failed: ${event.detail?.message || "Unknown error"}`;
      refreshMeta();
    });

    const observer = new MutationObserver(() => {
      if (!document.body.contains(root)) return;
      if (root.closest(".topbar-right")) return;
      placeInTopbar(root);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    omega.openConsole = open;
    omega.closeConsole = hide;
    omega.consoleMarker = MARKER;
    refreshMeta();

    console.log("APRISHA OMEGA TOPBAR V1.1 READY", {
      placement: root.dataset.aoPlacement,
      marker: MARKER,
      status: omega.status()
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
