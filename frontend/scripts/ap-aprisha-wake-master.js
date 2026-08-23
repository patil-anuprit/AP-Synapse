(() => {
    "use strict";

    const KEY = "ap_aprisha_wake_master_enabled";
    const Speech =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    let recognition = null;
    let restarting = false;
    let active = false;

    function supported() {
        return Boolean(Speech);
    }

    function setText(text) {
        const siri = document.getElementById("apAprishaSiriText");
        const live = document.getElementById("apAprishaLiveTranscript");

        if (siri) siri.textContent = text;
        if (live) live.textContent = "Say: Hey Aprisha";
    }

    function wakeEffect() {
        let fx = document.getElementById("ap-aprisha-wake-flash");

        if (!fx) {
            fx = document.createElement("div");
            fx.id = "ap-aprisha-wake-flash";
            fx.style.cssText = `
                position: fixed;
                inset: 0;
                z-index: 999999;
                pointer-events: none;
                opacity: 0;
                background:
                    radial-gradient(circle at center, rgba(216,180,88,.28), transparent 26%),
                    rgba(0,0,0,.36);
                backdrop-filter: blur(5px);
                transition: opacity .22s ease;
            `;
            document.body.appendChild(fx);
        }

        fx.style.opacity = "1";
        setTimeout(() => fx.style.opacity = "0", 1200);
    }

    function openAprisha() {
        document.body.classList.add("chat-active", "aprisha-awake");

        const selectors = [
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

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && typeof el.click === "function") {
                try {
                    el.click();
                    break;
                } catch {}
            }
        }

        window.dispatchEvent(new CustomEvent("ap:aprisha:wake"));
    }

    function heardWake(text) {
        const n =
            String(text || "")
                .toLowerCase()
                .replace(/[^\w\s]/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        return (
            n.includes("hey aprisha") ||
            n.includes("hi aprisha") ||
            n.includes("ok aprisha") ||
            n.includes("aprisha") ||
            n.includes("apreesha")
        );
    }

    function stop() {
        active = false;
        restarting = false;

        if (recognition) {
            try {
                recognition.onend = null;
                recognition.onerror = null;
                recognition.onresult = null;
                recognition.abort();
            } catch {}
        }

        recognition = null;
    }

    function restart() {
        if (!active || restarting) return;

        restarting = true;

        setTimeout(() => {
            restarting = false;
            if (active) start();
        }, 700);
    }

    function start() {
        if (!supported()) {
            setText("Speech wake is not supported in this browser.");
            return;
        }

        active = true;
        localStorage.setItem(KEY, "1");

        try {
            if (recognition) {
                try { recognition.abort(); } catch {}
            }

            recognition = new Speech();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = navigator.language || "en-IN";

            recognition.onstart = () => {
                setText("Hey Aprisha is listening...");
            };

            recognition.onresult = (event) => {
                let text = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    text += " " + event.results[i][0].transcript;
                }

                if (heardWake(text)) {
                    wakeEffect();
                    openAprisha();
                    setText("Aprisha is awake. Speak your command.");
                }
            };

            recognition.onerror = restart;
            recognition.onend = restart;

            recognition.start();
        } catch {
            restart();
        }
    }

    async function enable() {
        localStorage.setItem(KEY, "1");

        try {
            if (navigator.mediaDevices?.getUserMedia) {
                const stream =
                    await navigator.mediaDevices.getUserMedia({ audio: true });

                stream.getTracks().forEach((track) => track.stop());
            }
        } catch {}

        start();
    }

    function hookEnableButtons() {
        document.addEventListener("click", (event) => {
            const button = event.target.closest("button, [role='button'], a");
            if (!button) return;

            const text =
                String(button.textContent || button.getAttribute("aria-label") || "")
                    .toLowerCase();

            if (
                text.includes("enable hey aprisha") ||
                text.includes("enable aprisha") ||
                text.includes("hey aprisha")
            ) {
                setTimeout(enable, 120);
            }
        }, true);
    }

    function boot() {
        window.APAprishaWakeMaster = {
            enable,
            start,
            stop,
            test() {
                wakeEffect();
                openAprisha();
                setText("Aprisha is awake. Speak your command.");
            }
        };

        hookEnableButtons();

        if (localStorage.getItem(KEY) === "1") {
            setTimeout(start, 1200);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
