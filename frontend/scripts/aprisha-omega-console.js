(() => {
  "use strict";

  const ROOT_ID = "apAprishaOmegaConsoleV1";
  const STYLE_ID = "apAprishaOmegaConsoleV1Style";
  const MARKER = "AP_APRISHA_OMEGA_CONSOLE_V1";

  if (window.__AP_APRISHA_OMEGA_CONSOLE_V1__) return;
  window.__AP_APRISHA_OMEGA_CONSOLE_V1__ = true;

  function boot() {
    const omega = window.APAprishaOmega;
    if (!omega?.run) {
      setTimeout(boot, 120);
      return;
    }
    if (document.getElementById(ROOT_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
#${ROOT_ID}{position:fixed;right:18px;bottom:88px;z-index:2147482800;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#f7f7f8}
#${ROOT_ID} *{box-sizing:border-box}
#${ROOT_ID} .ao-launch{width:48px;height:48px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(145deg,#22252b,#090a0d);color:#fff;font-size:21px;font-weight:700;cursor:pointer;box-shadow:0 18px 52px rgba(0,0,0,.44)}
#${ROOT_ID} .ao-panel{display:none;position:absolute;right:0;bottom:58px;width:min(420px,calc(100vw - 28px));padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:20px;background:rgba(12,13,16,.97);backdrop-filter:blur(20px);box-shadow:0 30px 100px rgba(0,0,0,.6)}
#${ROOT_ID}.open .ao-panel{display:block}
#${ROOT_ID} .ao-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
#${ROOT_ID} .ao-title{font-size:14px;font-weight:750;letter-spacing:-.01em}
#${ROOT_ID} .ao-sub{font-size:10px;color:rgba(255,255,255,.54);margin-top:3px}
#${ROOT_ID} .ao-close{border:0;background:transparent;color:#fff;font-size:20px;cursor:pointer}
#${ROOT_ID} .ao-row{display:flex;gap:8px}
#${ROOT_ID} input{min-width:0;flex:1;height:42px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.05);color:#fff;padding:0 12px;outline:none}
#${ROOT_ID} .ao-run{height:42px;padding:0 15px;border:0;border-radius:12px;background:#f3f4f6;color:#101216;font-weight:700;cursor:pointer}
#${ROOT_ID} .ao-status{margin-top:10px;padding:10px 11px;border-radius:12px;background:rgba(255,255,255,.04);font-size:11px;line-height:1.45;color:rgba(255,255,255,.7);white-space:pre-wrap;max-height:180px;overflow:auto}
#${ROOT_ID} .ao-bad{color:#ffb7b7}
#${ROOT_ID} .ao-good{color:#c9ffd2}
@media(max-width:600px){#${ROOT_ID}{right:12px;bottom:82px}}
`;
    document.head.appendChild(style);

    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.innerHTML = `
      <button class="ao-launch" type="button" aria-label="Open Aprisha Omega">Ω</button>
      <section class="ao-panel" role="dialog" aria-label="Aprisha Omega command console">
        <div class="ao-head">
          <div><div class="ao-title">APRISHA Ω</div><div class="ao-sub" data-role="meta">Capability kernel</div></div>
          <button class="ao-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="ao-row">
          <input data-role="goal" autocomplete="off" placeholder="Give Aprisha a goal…" />
          <button class="ao-run" type="button">Run</button>
        </div>
        <div class="ao-status" data-role="status">Ready.</div>
      </section>`;
    document.body.appendChild(root);

    const launch = root.querySelector(".ao-launch");
    const close = root.querySelector(".ao-close");
    const runButton = root.querySelector(".ao-run");
    const input = root.querySelector('[data-role="goal"]');
    const status = root.querySelector('[data-role="status"]');
    const meta = root.querySelector('[data-role="meta"]');

    function refreshMeta() {
      const s = omega.status();
      meta.textContent = `${s.skills} skills · ${s.workflows} workflows · bridge ${s.bridgeReady ? "ready" : "waiting"}`;
    }

    function open() {
      root.classList.add("open");
      refreshMeta();
      setTimeout(() => input.focus(), 0);
    }

    function hide() {
      root.classList.remove("open");
    }

    async function runGoal() {
      const goal = String(input.value || "").trim();
      if (!goal) return;
      runButton.disabled = true;
      status.className = "ao-status";
      status.textContent = `Planning: ${goal}`;
      try {
        const result = await omega.run(goal, { source: "omega-console" });
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

    window.APAprishaOmega.openConsole = open;
    window.APAprishaOmega.closeConsole = hide;
    window.APAprishaOmega.consoleMarker = MARKER;
    refreshMeta();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
