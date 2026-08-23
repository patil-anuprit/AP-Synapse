(() => {
    "use strict";

    const AP_AUTO_VERSION = "ap-auto-setup-v1";
    const BACKEND_URL =
        window.AP_BACKEND_URL ||
        "https://ap-synapse-backend.onrender.com";

    const state = {
        installPrompt: null,
        ready: false
    };

    function log(message) {
        console.info("[AP Synapse Auto Setup]", message);
    }

    function safe(fn) {
        try {
            return fn();
        } catch (error) {
            console.warn("[AP Synapse Auto Setup]", error);
            return null;
        }
    }

    async function warmBackend() {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);

        try {
            await fetch(BACKEND_URL + "/health", {
                method: "GET",
                cache: "no-store",
                mode: "cors",
                signal: controller.signal
            });
            log("Backend warmed.");
        } catch {
            try {
                await fetch(BACKEND_URL + "/", {
                    method: "GET",
                    cache: "no-store",
                    mode: "cors",
                    signal: controller.signal
                });
            } catch {}
        } finally {
            clearTimeout(timer);
        }
    }

    async function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) return;

        try {
            const registration =
                await navigator.serviceWorker.register(
                    "/service-worker.js?v=" + encodeURIComponent(AP_AUTO_VERSION)
                );

            await registration.update();

            if (registration.waiting) {
                registration.waiting.postMessage({
                    type: "AP_SKIP_WAITING"
                });
            }

            navigator.serviceWorker.addEventListener("controllerchange", () => {
                sessionStorage.setItem("ap_auto_reloaded", "1");

                if (sessionStorage.getItem("ap_auto_reloaded_once") !== "1") {
                    sessionStorage.setItem("ap_auto_reloaded_once", "1");
                    location.reload();
                }
            });

            log("Service worker ready.");
        } catch (error) {
            console.warn("[AP Synapse Auto Setup] Service worker failed.", error);
        }
    }

    async function cleanOldCaches() {
        if (!("caches" in window)) return;

        try {
            const keys = await caches.keys();

            await Promise.all(
                keys
                    .filter((key) =>
                        key.startsWith("ap-synapse") &&
                        key !== "ap-synapse-runtime-v1"
                    )
                    .map((key) => caches.delete(key))
            );
        } catch {}
    }

    function captureInstallPrompt() {
        window.addEventListener("beforeinstallprompt", (event) => {
            event.preventDefault();
            state.installPrompt = event;
            showSetupPanel();
        });
    }

    async function getPermissionStatus(name) {
        if (!navigator.permissions?.query) return "unknown";

        try {
            const result = await navigator.permissions.query({ name });
            return result.state;
        } catch {
            return "unknown";
        }
    }

    async function getNeeds() {
        const needs = [];

        const mic =
            await getPermissionStatus("microphone");

        const notifications =
            await getPermissionStatus("notifications");

        if (mic !== "granted") {
            needs.push("Microphone");
        }

        if (
            "Notification" in window &&
            Notification.permission !== "granted"
        ) {
            needs.push("Notifications");
        }

        if (state.installPrompt) {
            needs.push("Install app");
        }

        return needs;
    }

    function setupStyles() {
        if (document.getElementById("ap-auto-setup-style")) return;

        const style = document.createElement("style");
        style.id = "ap-auto-setup-style";
        style.textContent = `
            .ap-auto-setup {
                position: fixed;
                right: 18px;
                bottom: 18px;
                z-index: 999999;
                width: min(360px, calc(100vw - 28px));
                padding: 16px;
                border: 1px solid rgba(212, 175, 55, 0.28);
                border-radius: 14px;
                background: rgba(12, 13, 16, 0.94);
                color: #f5f2ea;
                box-shadow: 0 18px 48px rgba(0, 0, 0, 0.38);
                backdrop-filter: blur(18px);
                font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            .ap-auto-setup h3 {
                margin: 0 0 6px;
                font-size: 15px;
                font-weight: 700;
            }

            .ap-auto-setup p {
                margin: 0 0 12px;
                color: rgba(245, 242, 234, 0.74);
                font-size: 13px;
                line-height: 1.45;
            }

            .ap-auto-setup-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .ap-auto-setup button {
                border: 0;
                border-radius: 10px;
                padding: 9px 12px;
                cursor: pointer;
                font-weight: 700;
                background: linear-gradient(135deg, #d6b45f, #a8842f);
                color: #101113;
            }

            .ap-auto-setup button.secondary {
                background: rgba(255, 255, 255, 0.08);
                color: #f5f2ea;
            }

            @media (max-width: 520px) {
                .ap-auto-setup {
                    left: 14px;
                    right: 14px;
                    bottom: 14px;
                    width: auto;
                }
            }
        `;

        document.head.appendChild(style);
    }

    async function showSetupPanel() {
        const needs = await getNeeds();

        if (!needs.length) return;
        if (document.getElementById("ap-auto-setup")) return;

        setupStyles();

        const panel = document.createElement("div");
        panel.id = "ap-auto-setup";
        panel.className = "ap-auto-setup";

        panel.innerHTML = `
            <h3>Finish AP Synapse Setup</h3>
            <p>Required items: ${needs.join(", ")}. Some permissions need your tap because browsers and phones protect them.</p>
            <div class="ap-auto-setup-actions">
                <button type="button" data-ap-auto-start>Enable</button>
                <button type="button" class="secondary" data-ap-auto-later>Later</button>
            </div>
        `;

        document.body.appendChild(panel);

        panel
            .querySelector("[data-ap-auto-later]")
            ?.addEventListener("click", () => panel.remove());

        panel
            .querySelector("[data-ap-auto-start]")
            ?.addEventListener("click", async () => {
                await runUserSetup();
                panel.remove();
            });
    }

    async function runUserSetup() {
        if (navigator.mediaDevices?.getUserMedia) {
            try {
                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        audio: true
                    });

                stream.getTracks().forEach((track) => track.stop());
            } catch {}
        }

        if (
            "Notification" in window &&
            Notification.permission === "default"
        ) {
            try {
                await Notification.requestPermission();
            } catch {}
        }

        if (state.installPrompt) {
            try {
                state.installPrompt.prompt();
                await state.installPrompt.userChoice;
                state.installPrompt = null;
            } catch {}
        }
    }

    function exposeApi() {
        window.APSynapseAutoSetup = {
            version: AP_AUTO_VERSION,
            run: runUserSetup,
            show: showSetupPanel,
            warmBackend,
            updateServiceWorker: registerServiceWorker
        };
    }

    
    // AP_WAKE_MODE_SETUP_V1
    function showWakeModePanel() {
        if (document.getElementById("ap-wake-mode-setup")) return;

        const panel = document.createElement("div");
        panel.id = "ap-wake-mode-setup";
        panel.className = "ap-auto-setup";
        panel.innerHTML = `
            <h3>Aprisha Wake Mode</h3>
            <p>
                For full mobile power, install AP Synapse as the Android app,
                allow microphone, notifications and device permissions, then
                enable Aprisha Wake Mode inside the app.
            </p>
            <div class="ap-auto-setup-actions">
                <button type="button" data-ap-wake-open>Open AP Synapse</button>
                <button type="button" class="secondary" data-ap-wake-close>Later</button>
            </div>
        `;

        document.body.appendChild(panel);

        panel.querySelector("[data-ap-wake-close]")?.addEventListener("click", () => {
            panel.remove();
        });

        panel.querySelector("[data-ap-wake-open]")?.addEventListener("click", () => {
            location.href = "/?wake-mode=1";
        });
    }

    window.APAprishaWakeMode = {
        show: showWakeModePanel,
        note:
            "Always-on wake word requires the installed Android app with a visible foreground service. Browser and iPhone cannot provide unrestricted Siri replacement."
    };

    setTimeout(showWakeModePanel, 2200);

    async function boot() {
        exposeApi();
        captureInstallPrompt();

        await Promise.allSettled([
            registerServiceWorker(),
            cleanOldCaches(),
            warmBackend()
        ]);

        state.ready = true;

        setTimeout(showSetupPanel, 1200);

        log("Auto setup complete.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
