(() => {
    "use strict";

    const Speech =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    let recognition = null;
    let listening = false;

    function ensureUI() {
        if (document.getElementById("aprishaV2Fab")) return;

        const fab = document.createElement("button");
        fab.id = "aprishaV2Fab";
        fab.className = "aprisha-v2-fab";
        fab.type = "button";
        fab.textContent = "AP";
        fab.setAttribute("aria-label", "Open Aprisha");

        const overlay = document.createElement("div");
        overlay.id = "aprishaV2Overlay";
        overlay.className = "aprisha-v2-overlay";

        overlay.innerHTML = `
            <section class="aprisha-v2-panel" role="dialog" aria-modal="true" aria-label="Aprisha">
                <header class="aprisha-v2-head">
                    <div class="aprisha-v2-title">Aprisha</div>
                    <button class="aprisha-v2-close" type="button" aria-label="Close">×</button>
                </header>

                <div class="aprisha-v2-body">
                    <div id="aprishaV2Orb" class="aprisha-v2-orb">AP</div>
                    <p id="aprishaV2Status" class="aprisha-v2-status">Tap Speak and ask Aprisha.</p>
                    <p id="aprishaV2Transcript" class="aprisha-v2-transcript">Voice starts only after your tap.</p>

                    <div class="aprisha-v2-actions">
                        <button id="aprishaV2Speak" class="aprisha-v2-btn" type="button">Speak</button>
                        <button id="aprishaV2Stop" class="aprisha-v2-btn secondary" type="button">Stop</button>
                    </div>
                </div>
            </section>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(overlay);

        fab.addEventListener("click", open);
        overlay.querySelector(".aprisha-v2-close").addEventListener("click", close);
        document.getElementById("aprishaV2Speak").addEventListener("click", start);
        document.getElementById("aprishaV2Stop").addEventListener("click", stop);
    }

    function open() {
        ensureUI();
        document.getElementById("aprishaV2Overlay").classList.add("open");
    }

    function close() {
        stop();
        document.getElementById("aprishaV2Overlay")?.classList.remove("open");
    }

    function setStatus(status, transcript = "") {
        const statusEl = document.getElementById("aprishaV2Status");
        const transcriptEl = document.getElementById("aprishaV2Transcript");

        if (statusEl) statusEl.textContent = status;
        if (transcriptEl) transcriptEl.textContent = transcript;
    }

    function setListening(value) {
        listening = value;

        document.getElementById("aprishaV2Orb")?.classList.toggle("listening", value);
        document.getElementById("aprishaV2Fab")?.classList.toggle("listening", value);
    }

    function sendToChat(text) {
        const input =
            document.querySelector("#userInput") ||
            document.querySelector("#messageInput") ||
            document.querySelector("textarea") ||
            document.querySelector("input[type='text']");

        if (input) {
            input.value = text;
            input.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const send =
            document.querySelector("#sendButton") ||
            document.querySelector("[data-send]") ||
            document.querySelector("button[type='submit']");

        if (send) {
            send.click();
        }
    }

    async function start() {
        // AP_APRISHA_V2_VOICE_GATE
        window.__AP_APRISHA_ALLOW_VOICE_START = true;
        ensureUI();

        if (!Speech) {
            setStatus("Voice is not supported in this browser.", "Use Chrome or Edge.");
            return;
        }

        try {
            if (navigator.mediaDevices?.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach((track) => track.stop());
            }
        } catch {}

        stop();

        recognition = new Speech();
        recognition.lang = navigator.language || "en-IN";
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => {
            setListening(true);
            setStatus("Listening...", "Speak naturally.");
        };

        recognition.onresult = (event) => {
            let finalText = "";
            let interimText = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const part = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalText += part;
                } else {
                    interimText += part;
                }
            }

            const text = (finalText || interimText).trim();

            if (text) {
                setStatus("I heard you.", text);
            }

            if (finalText.trim()) {
                sendToChat(finalText.trim());
                setStatus("Sent to AP Synapse.", finalText.trim());
            }
        };

        recognition.onerror = () => {
            setListening(false);
            setStatus("Voice stopped.", "Tap Speak again.");
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognition.start();
    }

    function stop() {
        window.__AP_APRISHA_ALLOW_VOICE_START = false;
        setListening(false);

        if (recognition) {
            try {
                recognition.abort();
            } catch {}
        }

        recognition = null;
    }

    function boot() {
        ensureUI();

        window.AprishaV2 = {
            open,
            close,
            start,
            stop
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
