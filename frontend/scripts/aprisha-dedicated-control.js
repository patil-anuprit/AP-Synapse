(() => {
    "use strict";

    const BUTTON_ID = "apDedicatedAprishaButton";
    const OVERLAY_ID = "apDedicatedAprishaOverlay";

    let recognition = null;

    function isAndroidDevice() {
        return /android/i.test(String(navigator.userAgent || ""));
    }

    function openNativeAprisha(source = "web") {
        const url =
            "apsynapse://presence?start=1&source=" +
            encodeURIComponent(source);

        const link = document.createElement("a");
        link.href = url;
        link.style.display = "none";
        link.setAttribute("aria-hidden", "true");
        document.body.appendChild(link);
        link.click();
        link.remove();

        return true;
    }

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

    function open(webOnly = false) {
        if (isAndroidDevice() && !webOnly) {
            return openNativeAprisha("topbar");
        }

        createPanel();
        document.getElementById(OVERLAY_ID)?.classList.add("open");
        return true;
    }

    function close() {
        stop();
        document.getElementById(OVERLAY_ID)?.classList.remove("open");
    }


    // AP_DEDICATED_ACTIONS_V4
    let replyObserver = null;
    let replyTimer = null;

    function speakOut(text) {
        const clean = String(text || "")
            .replace(/https?:\/\/\S+/g, " link ")
            .replace(/[\`*_#>|]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 1800);

        if (!clean || !("speechSynthesis" in window)) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = navigator.language || "en-IN";
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
    }

    function assistantNodes() {
        const selectors = [
            '[data-role="assistant"]',
            '[data-message-role="assistant"]',
            '.message.assistant',
            '.assistant-message',
            '.ai-message',
            '.bot-message',
            '.response-message',
            '.message-row.assistant'
        ];

        return Array.from(
            document.querySelectorAll(selectors.join(","))
        ).filter((node) => !node.closest("#" + OVERLAY_ID));
    }

    function watchForAssistantReply() {
        replyObserver?.disconnect();
        clearTimeout(replyTimer);

        const baseline = new Set(
            assistantNodes().map((node) =>
                String(node.innerText || node.textContent || "").trim()
            )
        );

        replyObserver = new MutationObserver(() => {
            const candidate = assistantNodes()
                .slice()
                .reverse()
                .find((node) => {
                    const text = String(
                        node.innerText || node.textContent || ""
                    ).trim();

                    return text.length > 2 && !baseline.has(text);
                });

            if (!candidate) return;

            clearTimeout(replyTimer);

            replyTimer = setTimeout(() => {
                const answer = String(
                    candidate.innerText ||
                    candidate.textContent ||
                    ""
                ).trim();

                if (!answer) return;

                replyObserver?.disconnect();
                setState("Aprisha", answer);
                speakOut(answer);
            }, 2200);
        });

        replyObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        setTimeout(() => replyObserver?.disconnect(), 90000);
    }

    function openWebsite(name, url) {
        setState("Opening " + name, "Taking you to " + name + ".");
        speakOut("Opening " + name);

        const opened = window.open(url, "_blank");

        if (opened) {
            try {
                opened.opener = null;
            } catch {}
        } else {
            setTimeout(() => window.location.assign(url), 500);
        }
    }

    function handleAprishaCommand(text) {
        const command = String(text || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s.-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const wantsOpen =
            /\b(open|launch|start|visit|go to)\b/.test(command);

        const websites = [
            {
                words: ["youtube"],
                name: "YouTube",
                url: "https://www.youtube.com/"
            },
            {
                words: ["whatsapp"],
                name: "WhatsApp",
                url: "https://web.whatsapp.com/"
            },
            {
                words: ["gmail"],
                name: "Gmail",
                url: "https://mail.google.com/"
            },
            {
                words: ["google drive", "drive"],
                name: "Google Drive",
                url: "https://drive.google.com/"
            },
            {
                words: ["google calendar", "calendar"],
                name: "Google Calendar",
                url: "https://calendar.google.com/"
            },
            {
                words: ["github"],
                name: "GitHub",
                url: "https://github.com/"
            }
        ];

        if (wantsOpen) {
            const target = websites.find((website) =>
                website.words.some((word) => command.includes(word))
            );

            if (target) {
                openWebsite(target.name, target.url);
                return;
            }
        }

        const youtubeSearch = command.match(
            /(?:search|find)\s+(?:on\s+)?youtube\s+(?:for\s+)?(.+)/
        );

        if (youtubeSearch?.[1]) {
            const query = encodeURIComponent(youtubeSearch[1]);

            openWebsite(
                "YouTube search",
                "https://www.youtube.com/results?search_query=" + query
            );

            return;
        }

        const googleSearch = command.match(
            /(?:search|google)\s+(?:for\s+)?(.+)/
        );

        if (googleSearch?.[1]) {
            const query = encodeURIComponent(googleSearch[1]);

            openWebsite(
                "Google search",
                "https://www.google.com/search?q=" + query
            );

            return;
        }

        const deviceOnlyCommand =
            /^(?:call|phone|ring|send (?:a )?(?:message|text|sms)|(?:set|start) (?:a )?(?:timer|alarm|reminder)|remind me|(?:what is|what's|tell me) my battery|battery level|turn (?:on|off) (?:the )?(?:flashlight|torch|wifi|wi fi|bluetooth)|volume (?:up|down)|mute|unmute|open camera|take (?:a )?(?:photo|picture)|record video)\b/.test(command);

        if (deviceOnlyCommand) {
            setState(
                "Use Aprisha on Android",
                "That command needs the native AP Synapse Android app."
            );
            speakOut(
                "That device command needs Aprisha in the AP Synapse Android app."
            );
            return;
        }

        watchForAssistantReply();

        if (sendToChat(text)) {
            setState("Sent to AP Synapse", text);
            speakOut("Your request has been sent to AP Synapse.");
        } else {
            replyObserver?.disconnect();

            setState(
                "Chat connection unavailable",
                "Open an AP Synapse conversation and try again."
            );

            speakOut(
                "Please open an AP Synapse conversation and try again."
            );
        }
    }

    function sendToChat(text) {
        const inputSelectors = [
            "#userInput",
            "#messageInput",
            "#chatInput",
            "#promptInput",
            "textarea[placeholder*='message' i]",
            "textarea[placeholder*='ask' i]",
            "textarea"
        ];

        const inputs = Array.from(
            document.querySelectorAll(inputSelectors.join(","))
        ).filter((element) => {
            if (element.closest("#" + OVERLAY_ID)) return false;
            if (element.disabled || element.readOnly) return false;

            return element.getClientRects().length > 0;
        });

        const input = inputs[0];

        if (!input) return false;

        const descriptor =
            Object.getOwnPropertyDescriptor(
                Object.getPrototypeOf(input),
                "value"
            );

        if (descriptor?.set) {
            descriptor.set.call(input, text);
        } else {
            input.value = text;
        }

        input.dispatchEvent(
            new Event("input", { bubbles: true })
        );

        input.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        input.focus();

        const sendSelectors = [
            "#sendButton",
            "#sendBtn",
            "[data-send]",
            ".send-button",
            ".send-btn",
            "button[aria-label*='send' i]",
            "button[title*='send' i]"
        ];

        const sendButton = Array.from(
            document.querySelectorAll(sendSelectors.join(","))
        ).find((button) => {
            if (button.closest("#" + OVERLAY_ID)) return false;
            if (button.disabled) return false;

            return button.getClientRects().length > 0;
        });

        if (sendButton) {
            sendButton.click();
            return true;
        }

        const form = input.closest("form");

        if (form?.requestSubmit) {
            form.requestSubmit();
            return true;
        }

        input.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                bubbles: true,
                cancelable: true
            })
        );

        return true;
    }

    function speak() {
        if (isAndroidDevice()) {
            openNativeAprisha("microphone");
            return;
        }

        open(true);
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
            if (finalText.trim()) handleAprishaCommand(finalText.trim());
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

    function bindAndroidVoiceControls() {
        if (!isAndroidDevice()) return;

        document.addEventListener(
            "click",
            (event) => {
                const button = event.target.closest(
                    "button,a,[role='button']"
                );

                if (!button) return;
                if (button.id === BUTTON_ID) return;
                if (button.closest("#" + OVERLAY_ID)) return;

                const label = String(
                    button.getAttribute("aria-label") ||
                    button.getAttribute("title") ||
                    button.getAttribute("data-tooltip") ||
                    ""
                ).toLowerCase();

                const isComposerVoice =
                    button.id === "voiceBtn" ||
                    label === "voice input" ||
                    label === "microphone" ||
                    label === "start voice input";

                if (!isComposerVoice) return;

                event.preventDefault();
                event.stopImmediatePropagation();
                openNativeAprisha("composer-microphone");
            },
            true
        );
    }

    function boot() {
        addStyles();

        if (!isAndroidDevice()) {
            createPanel();
        }

        installButton();
        bindAndroidVoiceControls();

        const observer = new MutationObserver(() => {
            installButton();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        window.Aprisha = {
            open,
            close,
            speak,
            stop,
            say: speakOut,
            command: handleAprishaCommand,
            openNative: openNativeAprisha
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
