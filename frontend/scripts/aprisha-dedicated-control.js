(() => {
    "use strict";

    const BUTTON_ID = "apDedicatedAprishaButton";
    const OVERLAY_ID = "apDedicatedAprishaOverlay";

    let recognition = null;

    function addStyles() {
        if (document.getElementById("apDedicatedAprishaStyles")) return;

        const style = document.createElement("style");
        style.id = "apDedicatedAprishaStyles";
        style.textContent = `
            #${BUTTON_ID} {
                height: 42px;
                padding: 0 15px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                flex: 0 0 auto;
                border: 1px solid rgba(213,181,94,.42);
                border-radius: 13px;
                background: linear-gradient(145deg,#24252a,#0d0e11);
                color: #e2c06a;
                font: 800 13px/1 Inter,system-ui,sans-serif;
                cursor: pointer;
                box-shadow: 0 8px 24px rgba(0,0,0,.28);
            }

            #${BUTTON_ID}:hover {
                border-color: rgba(226,194,108,.8);
                box-shadow: 0 0 22px rgba(214,181,94,.16);
                transform: translateY(-1px);
            }

            #${BUTTON_ID} .aprisha-icon {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #e2c06a;
                box-shadow: 0 0 12px rgba(226,192,106,.75);
            }

            #${OVERLAY_ID} {
                position: fixed;
                inset: 0;
                z-index: 1000000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 18px;
                background: rgba(0,0,0,.68);
                backdrop-filter: blur(12px);
            }

            #${OVERLAY_ID}.open {
                display: flex;
            }

            .ap-dedicated-aprisha-panel {
                width: min(620px,calc(100vw - 28px));
                overflow: hidden;
                border: 1px solid rgba(213,181,94,.3);
                border-radius: 22px;
                background: linear-gradient(145deg,#202126,#090a0d);
                color: #f5f1e7;
                box-shadow: 0 30px 100px rgba(0,0,0,.62);
            }

            .ap-dedicated-aprisha-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 17px 20px;
                border-bottom: 1px solid rgba(255,255,255,.08);
                font-weight: 850;
            }

            .ap-dedicated-aprisha-close {
                width: 38px;
                height: 38px;
                border: 1px solid rgba(255,255,255,.12);
                border-radius: 12px;
                background: rgba(255,255,255,.06);
                color: #fff;
                font-size: 22px;
                cursor: pointer;
            }

            .ap-dedicated-aprisha-body {
                padding: 34px 22px 30px;
                text-align: center;
            }

            .ap-dedicated-aprisha-orb {
                width: 108px;
                height: 108px;
                margin: 0 auto 22px;
                display: grid;
                place-items: center;
                border: 1px solid rgba(226,192,106,.4);
                border-radius: 50%;
                color: #e2c06a;
                font-weight: 950;
                box-shadow: 0 0 50px rgba(214,181,94,.15);
            }

            .ap-dedicated-aprisha-orb.listening {
                animation: apAprishaPulse 1.1s ease-in-out infinite;
            }

            .ap-dedicated-aprisha-status {
                margin: 0 0 9px;
                font-size: 27px;
                font-weight: 850;
            }

            .ap-dedicated-aprisha-transcript {
                min-height: 24px;
                margin: 0 0 24px;
                color: rgba(245,241,231,.68);
                font-size: 14px;
            }

            .ap-dedicated-aprisha-actions {
                display: flex;
                justify-content: center;
                gap: 10px;
            }

            .ap-dedicated-aprisha-actions button {
                padding: 11px 19px;
                border: 0;
                border-radius: 12px;
                background: linear-gradient(135deg,#e2c06a,#a6802e);
                color: #101114;
                font-weight: 850;
                cursor: pointer;
            }

            .ap-dedicated-aprisha-actions .secondary {
                background: rgba(255,255,255,.09);
                color: #f5f1e7;
            }

            @keyframes apAprishaPulse {
                50% {
                    transform: scale(1.05);
                    box-shadow: 0 0 72px rgba(214,181,94,.38);
                }
            }

            @media (max-width: 640px) {
                #${BUTTON_ID} {
                    width: 42px;
                    min-width: 42px;
                    padding: 0;
                    font-size: 0;
                }

                #${BUTTON_ID}::after {
                    content: "A";
                    font-size: 14px;
                    font-weight: 950;
                }

                #${BUTTON_ID} .aprisha-icon {
                    display: none;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function createPanel() {
        if (document.getElementById(OVERLAY_ID)) return;

        const overlay = document.createElement("div");
        overlay.id = OVERLAY_ID;
        overlay.innerHTML = `
            <section class="ap-dedicated-aprisha-panel"
                     role="dialog"
                     aria-modal="true"
                     aria-label="Aprisha voice assistant">
                <div class="ap-dedicated-aprisha-head">
                    <span>Aprisha</span>
                    <button class="ap-dedicated-aprisha-close"
                            type="button"
                            aria-label="Close Aprisha">×</button>
                </div>

                <div class="ap-dedicated-aprisha-body">
                    <div class="ap-dedicated-aprisha-orb">AP</div>
                    <p class="ap-dedicated-aprisha-status">Ask Aprisha</p>
                    <p class="ap-dedicated-aprisha-transcript">
                        Tap Speak and say your command.
                    </p>

                    <div class="ap-dedicated-aprisha-actions">
                        <button class="ap-dedicated-aprisha-speak" type="button">
                            Speak
                        </button>
                        <button class="ap-dedicated-aprisha-stop secondary" type="button">
                            Stop
                        </button>
                    </div>
                </div>
            </section>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector(".ap-dedicated-aprisha-close")
            .addEventListener("click", close);

        overlay.querySelector(".ap-dedicated-aprisha-speak")
            .addEventListener("click", speak);

        overlay.querySelector(".ap-dedicated-aprisha-stop")
            .addEventListener("click", stop);

        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) close();
        });
    }

    function setState(status, transcript) {
        const overlay = document.getElementById(OVERLAY_ID);

        if (!overlay) return;

        overlay.querySelector(".ap-dedicated-aprisha-status").textContent =
            status;

        overlay.querySelector(".ap-dedicated-aprisha-transcript").textContent =
            transcript || "";
    }

    function setListening(active) {
        document
            .querySelector(".ap-dedicated-aprisha-orb")
            ?.classList.toggle("listening", active);
    }

    function open() {
        createPanel();
        document.getElementById(OVERLAY_ID)?.classList.add("open");
    }

    function close() {
        stop();
        document.getElementById(OVERLAY_ID)?.classList.remove("open");
    }

    function sendToChat(text) {
        const input =
            document.querySelector("#userInput") ||
            document.querySelector("#messageInput") ||
            document.querySelector("textarea");

        if (!input) {
            setState("Command received", text);
            return;
        }

        const nativeSetter =
            Object.getOwnPropertyDescriptor(
                Object.getPrototypeOf(input),
                "value"
            )?.set;

        if (nativeSetter) {
            nativeSetter.call(input, text);
        } else {
            input.value = text;
        }

        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();

        const sendButton =
            document.querySelector("#sendButton") ||
            document.querySelector("[data-send]") ||
            document.querySelector("button[type='submit']");

        if (sendButton && !sendButton.disabled) {
            sendButton.click();
        }

        setState("Sent to AP Synapse", text);
    }

    function speak() {
        open();
        stop();

        const Speech =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!Speech) {
            setState("Voice unavailable", "Please use Chrome or Edge.");
            return;
        }

        recognition = new Speech();
        recognition.lang = navigator.language || "en-IN";
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => {
            setListening(true);
            setState("Listening…", "Speak naturally.");
        };

        recognition.onresult = (event) => {
            let finalText = "";
            let interimText = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;

                if (event.results[i].isFinal) finalText += text;
                else interimText += text;
            }

            const heard = (finalText || interimText).trim();

            if (heard) setState("I heard you", heard);
            if (finalText.trim()) sendToChat(finalText.trim());
        };

        recognition.onerror = (event) => {
            setListening(false);

            const message =
                event.error === "not-allowed"
                    ? "Allow microphone permission and try again."
                    : "Tap Speak to try again.";

            setState("Voice stopped", message);
        };

        recognition.onend = () => {
            setListening(false);
            recognition = null;
        };

        try {
            recognition.start();
        } catch {
            setState("Voice unavailable", "Tap Speak again.");
        }
    }

    function stop() {
        setListening(false);

        if (recognition) {
            try {
                recognition.abort();
            } catch {}
        }

        recognition = null;
    }

    function findProfileButton() {
        const preferredSelectors = [
            "#profileButton",
            "#profileBtn",
            "[data-profile]",
            "[aria-label*='profile' i]",
            "[title*='profile' i]",
            "[aria-label*='account' i]",
            "[title*='account' i]"
        ];

        for (const selector of preferredSelectors) {
            const match = document.querySelector(selector);

            if (
                match &&
                match.id !== BUTTON_ID &&
                !match.closest(`#${OVERLAY_ID}`)
            ) {
                return match.closest("button,a,[role='button']") || match;
            }
        }

        const topbar =
            document.querySelector("header") ||
            document.querySelector(".topbar") ||
            document.querySelector(".top-bar") ||
            document.querySelector(".app-topbar");

        const candidates = Array.from(
            (topbar || document).querySelectorAll(
                "button,a,[role='button']"
            )
        );

        return candidates.find((element) => {
            if (element.id === BUTTON_ID) return false;

            return String(element.textContent || "")
                .trim()
                .toLowerCase() === "ap";
        });
    }

    function installButton() {
        if (document.getElementById(BUTTON_ID)) return true;

        const profileButton = findProfileButton();

        if (!profileButton?.parentElement) return false;

        const button = document.createElement("button");
        button.id = BUTTON_ID;
        button.type = "button";
        button.title = "Open Aprisha";
        button.setAttribute("aria-label", "Open Aprisha");
        button.innerHTML = `
            <span class="aprisha-icon" aria-hidden="true"></span>
            <span>Aprisha</span>
        `;

        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            open();
        });

        // Separate Aprisha button immediately before the AP profile button.
        profileButton.parentElement.insertBefore(button, profileButton);

        return true;
    }

    function boot() {
        addStyles();
        createPanel();
        installButton();

        const observer = new MutationObserver(() => {
            installButton();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        window.Aprisha = { open, close, speak, stop };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
