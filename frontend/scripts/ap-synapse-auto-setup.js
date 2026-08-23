(() => {
    "use strict";

    const VERSION = "quiet-auto-setup-v1";
    const BACKEND_URL =
        window.AP_BACKEND_URL ||
        "https://ap-synapse-backend.onrender.com";

    async function warmBackend() {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);

        try {
            await fetch(BACKEND_URL + "/health", {
                method: "GET",
                cache: "no-store",
                mode: "cors",
                signal: controller.signal
            });
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
                    "/service-worker.js?v=" + encodeURIComponent(VERSION)
                );

            await registration.update();

            if (registration.waiting) {
                registration.waiting.postMessage({
                    type: "AP_SKIP_WAITING"
                });
            }
        } catch {}
    }

    async function cleanOldCaches() {
        if (!("caches" in window)) return;

        try {
            const keys = await caches.keys();

            await Promise.all(
                keys
                    .filter((key) => key.startsWith("ap-synapse"))
                    .map((key) => caches.delete(key))
            );
        } catch {}
    }

    function exposeManualSetup() {
        window.APSynapseAutoSetup = {
            version: VERSION,

            async run() {
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
            },

            warmBackend,
            updateServiceWorker: registerServiceWorker
        };
    }

    function boot() {
        exposeManualSetup();

        Promise.allSettled([
            registerServiceWorker(),
            cleanOldCaches(),
            warmBackend()
        ]);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
