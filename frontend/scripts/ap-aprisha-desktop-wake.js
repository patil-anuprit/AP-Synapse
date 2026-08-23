(() => {
    "use strict";

    const VERSION = "desktop-wake-v1";
    const KEY_ENABLED = "ap_aprisha_desktop_wake_enabled";
    const WakeRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    let recognition = null;
    let listening = false;
    let restartTimer = null;
    let lastWake = 0;

    function isSupported() {
        return Boolean(WakeRecognition);
    }

    function addStyles() {
        if (document.getElementById("ap-desktop-wake-style")) return;

        const style = document.createElement("style");
        style.id = "ap-desktop-wake-style";
        style.textContent = `
            .ap-desktop-wake-panel {
                position: fixed;
                right: 18px;
                bottom: 18px;
                z-index: 999999;
                width: min(380px, calc(100vw - 28px));
                padding: 16px;
                border: 1px solid rgba(218, 185, 92, 0.34);
                border-radius: 14px;
                background: rgba(10, 11, 14, 0.94);
                color: #f6f1e4;
                box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
                backdrop-filter: blur(18px);
                font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            .ap-desktop-wake-panel h3 {
                margin: 0 0 6px;
                font-size: 15px;
                font-weight: 800;
                letter-spacing: 0;
            }

            .ap-desktop-wake-panel p {
                margin: 0 0 12px;
                color: rgba(246, 241, 228, 0.74);
                font-size: 13px;
                line-height: 1.45;
            }

            .ap-desktop-wake-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .ap-desktop-wake-panel button {
                border: 0;
                border-radius: 10px;
                padding: 9px 12px;
                cursor: pointer;
                font-weight: 800;
                background: linear-gradient(135deg, #e0c06b, #a9832e);
                color: #101114;
            }

            .ap-desktop-wake-panel button.secondary {
                background: rgba(255, 255, 255, 0.09);
                color: #f6f1e4;
            }

            .ap-aprisha-wake-veil {
                position: fixed;
                inset: 0;
                z-index: 999998;
                pointer-events: none;
                opacity: 0;
                transform: scale(1.02);
                transition: opacity 240ms ease, transform 420ms ease;
                background:
                    radial-gradient(circle at 50% 46%, rgba(224, 192, 107, 0.20), transparent 28%),
                    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.12), transparent 12%),
                    linear-gradient(135deg, rgba(5, 6, 8, 0.80), rgba(17, 18, 23, 0.74));
                backdrop-filter: blur(8px);
            }

            .ap-aprisha-wake-veil.active {
                opacity: 1;
                transform: scale(1);
            }

            .ap-aprisha-wake-core {
                position: absolute;
                left: 50%;
                top: 48%;
                transform: translate(-50%, -50%);
                width: min(420px, 76vw);
                aspect-ratio: 1;
                border-radius: 50%;
                border: 1px solid rgba(224, 192, 107, 0.32);
                box-shadow:
                    0 0 70px rgba(224, 192, 107, 0.28),
                    inset 0 0 70px rgba(224, 192, 107, 0.10);
                animation: apWakePulse 1.4s ease-in-out infinite;
            }

            .ap-aprisha-wake-text {
                position: absolute;
                left: 50%;
                top: calc(48% + min(260px, 40vw));
                transform: translateX(-50%);
                text-align: center;
                color: #f8efd2;
                font: 800 18px/1.2 Inter, system-ui, sans-serif;
                text-shadow: 0 0 24px rgba(224, 192, 107, 0.32);
            }

            @keyframes apWakePulse {
                0%, 100% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.72; }
                50% { transform: translate(-50%, -50%) scale(1.04); opacity: 1; }
            }

            @media (max-width: 520px) {
                .ap-desktop-wake-panel {
                    left: 14px;
                    right: 14px;
                    bottom: 14px;
                    width: auto;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function ensureVeil() {
        let veil = document.getElementById("ap-aprisha-wake-veil");

        if (veil) return veil;

        veil = document.createElement("div");
        veil.id = "ap-aprisha-wake-veil";
        veil.className = "ap-aprisha-wake-veil";
        veil.innerHTML = `
            <div class="ap-aprisha-wake-core"></div>
            <div class="ap-aprisha-wake-text">Aprisha is awake</div>
        `;

        document.body.appendChild(veil);
        return veil;
    }

    function setStatus(text) {
        const status = document.getElementById("ap-desktop-wake-status");
        if (status) status.textContent = text;
    }

    function openAprishaSurface(phrase) {
        document.body.classList.add("chat-active", "aprisha-awake");

        const siriText = document.getElementById("apAprishaSiriText");
        if (siriText) {
            siriText.textContent = "Listening...";
        }

        const transcript = document.getElementById("apAprishaLiveTranscript");
        if (transcript) {
            transcript.textContent = phrase || "Hey Aprisha";
        }

        const candidates = [
            "#apAprishaButton",
            "#apAprishaToggle",
            "#apAprishaOpen",
            "#aprishaButton",
            "#aprishaToggle",
            "[data-aprisha-open]",
            "[data-open-aprisha]",
            ".ap-aprisha-btn",
            ".aprisha-button",
            ".aprisha-fab"
        ];

        for (const selector of candidates) {
            const element = document.querySelector(selector);

            if (element && typeof element.click === "function") {
                try {
                    element.click();
                    return;
                } catch {}
            }
        }

        window.dispatchEvent(
            new CustomEvent("ap:aprisha:wake", {
                detail: {
                    phrase: phrase || "Hey Aprisha",
                    source: VERSION
                }
            })
        );
    }

    function triggerWake(phrase) {
        const now = Date.now();

        if (now - lastWake < 3500) return;
        lastWake = now;

        const veil = ensureVeil();
        veil.classList.add("active");

        openAprishaSurface(phrase);
        setStatus("Aprisha awake. Say your command.");

        setTimeout(() => {
            veil.classList.remove("active");
        }, 2400);
    }

    function heardWakeWord(text) {
        const normalized =
            String(text || "")
                .toLowerCase()
                .replace(/[^\w\s]/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        return (
            normalized.includes("hey aprisha") ||
            normalized.includes("hi aprisha") ||
            normalized.includes("ok aprisha") ||
            normalized.includes("aprisha") ||
            normalized.includes("apreesha")
        );
    }

    function stopRecognition() {
        listening = false;
        clearTimeout(restartTimer);

        if (recognition) {
            try {
                recognition.onend = null;
                recognition.onerror = null;
                recognition.onresult = null;
                recognition.stop();
                recognition.abort();
            } catch {}
        }

        recognition = null;
        setStatus("Desktop Wake is off.");
    }

    function scheduleRestart() {
        clearTimeout(restartTimer);

        if (localStorage.getItem(KEY_ENABLED) !== "1") return;

        restartTimer = setTimeout(() => {
            startRecognition();
        }, 700);
    }

    function startRecognition() {
        if (!isSupported()) {
            setStatus("Speech recognition is not supported in this browser.");
            return;
        }

        clearTimeout(restartTimer);

        try {
            if (recognition) {
                try {
                    recognition.abort();
                } catch {}
            }

            recognition = new WakeRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = navigator.language || "en-IN";

            recognition.onstart = () => {
                listening = true;
                setStatus("Desktop Wake is listening for Hey Aprisha.");
            };

            recognition.onresult = (event) => {
                let combined = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    combined += " " + event.results[i][0].transcript;
                }

                if (heardWakeWord(combined)) {
                    triggerWake(combined);
                }
            };

            recognition.onerror = () => {
                listening = false;
                scheduleRestart();
            };

            recognition.onend = () => {
                listening = false;
                scheduleRestart();
            };

            recognition.start();
        } catch {
            listening = false;
            scheduleRestart();
        }
    }

    async function enableWake() {
        localStorage.setItem(KEY_ENABLED, "1");

        try {
            if (navigator.mediaDevices?.getUserMedia) {
                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        audio: true
                    });

                stream.getTracks().forEach((track) => track.stop());
            }
        } catch {}

        startRecognition();
    }

    function showPanel() {
        addStyles();

        if (document.getElementById("ap-desktop-wake-panel")) return;

        const panel = document.createElement("div");
        panel.id = "ap-desktop-wake-panel";
        panel.className = "ap-desktop-wake-panel";

        panel.innerHTML = `
            <h3>Aprisha Desktop Wake</h3>
            <p id="ap-desktop-wake-status">
                Enable once, then say Hey Aprisha while AP Synapse is open.
            </p>
            <div class="ap-desktop-wake-actions">
                <button type="button" data-ap-wake-enable>Enable Wake</button>
                <button type="button" class="secondary" data-ap-wake-test>Test Effect</button>
                <button type="button" class="secondary" data-ap-wake-hide>Hide</button>
            </div>
        `;

        document.body.appendChild(panel);

        panel.querySelector("[data-ap-wake-enable]")?.addEventListener("click", enableWake);
        panel.querySelector("[data-ap-wake-test]")?.addEventListener("click", () => triggerWake("Hey Aprisha"));
        panel.querySelector("[data-ap-wake-hide]")?.addEventListener("click", () => panel.remove());
    }

    function boot() {
        addStyles();

        window.APAprishaDesktopWake = {
            version: VERSION,
            enable: enableWake,
            stop: stopRecognition,
            test: () => triggerWake("Hey Aprisha"),
            show: showPanel
        };

        setTimeout(showPanel, 1200);

        if (localStorage.getItem(KEY_ENABLED) === "1") {
            setTimeout(startRecognition, 1600);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
