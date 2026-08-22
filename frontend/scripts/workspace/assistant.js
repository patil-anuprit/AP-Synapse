export function openAssistant() {

    const assistant =
        document.getElementById("assistantPage");

    const hero =
        document.getElementById("heroScreen");

    const chat =
        document.getElementById("chatWindow");

    if (assistant)
        assistant.style.display = "block";

    if (hero)
        hero.style.display = "flex";

    if (chat)
        chat.style.display = "none";

    console.log("Assistant Ready");

}

// =========================================================
// AP SYNAPSE — PREMIUM LIVE TALK
// =========================================================

(() => {

    const liveTalkBtn =
        document.getElementById("liveTalkBtn");

    const liveTalkScreen =
        document.getElementById("liveTalkScreen");

    const screen = liveTalkScreen;

    const status =
        document.getElementById("liveTalkStatus");

    const micText =
        document.getElementById("liveTalkSubtext");

    const transcript =
        document.getElementById("liveTalkTranscript");

    const liveTalkCloseBtn =
        document.getElementById("liveTalkCloseBtn");

    const liveTalkPauseBtn =
        document.getElementById("liveTalkPauseBtn");

    const liveTalkPauseIcon =
        document.getElementById("liveTalkPauseIcon");

    const liveTalkPauseText =
        document.getElementById("liveTalkPauseText");

    const voiceOptions =
        document.querySelectorAll(
        ".live-talk-voice-option"
    );

    if (!liveTalkBtn || !screen) {
        console.warn(
            "AP Synapse Live Talk controls not found."
        );
        return;
    }


    const notify = (
        typeof window.showAPSynapseNotification ===
        "function"
    )
        ? window.showAPSynapseNotification
        : (message) =>
            console.log("AP Synapse:", message);


    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        liveTalkBtn.addEventListener(
            "click",
            () => {

                notify(
                    "Live Talk is not supported by this browser.",
                    "error"
                );

            }
        );

        return;
    }


    const recognition =
        new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";


    let active = false;
    let listening = false;
    let speaking = false;
    let paused = false;

    function pauseLiveTalk() {

    paused = true;

    stopListening();

    window.speechSynthesis.pause();

    if (liveTalkPauseIcon) {
        liveTalkPauseIcon.textContent = "▶";
    }

    if (liveTalkPauseText) {
        liveTalkPauseText.textContent =
            "Resume";
    }

    updateLiveTalkStatus(
        "Paused",
        "Live Talk is paused."
    );
}


function resumeLiveTalk() {

    paused = false;

    window.speechSynthesis.resume();

    if (liveTalkPauseIcon) {
        liveTalkPauseIcon.textContent = "⏸";
    }

    if (liveTalkPauseText) {
        liveTalkPauseText.textContent =
            "Pause";
    }

    updateLiveTalkStatus(
        "Listening",
        "Speak naturally — AP Synapse is listening…"
    );

    startListening();
}

if (
    liveTalkPauseBtn &&
    typeof liveTalkPauseBtn.addEventListener === "function"
) {
    liveTalkPauseBtn.addEventListener("click", () => {
        if (paused) {
            resumeLiveTalk();
        } else {
            pauseLiveTalk();
        }
    });
}

    // =========================================================
// AP SYNAPSE — LIVE TALK VOICE SELECTION
// =========================================================

let selectedVoiceType = "male";
let selectedVoice = null;

const voiceCards =
    document.querySelectorAll(
        ".live-talk-voice-card"
    );


    // =====================================================
    // SCREEN
    // =====================================================

    function openCallScreen() {

        screen.classList.add("is-open");
        screen.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "live-talk-active"
        );

        transcript.innerHTML = "";

        addMessage(
            "synapse",
            "AP Synapse",
            "I'm listening. Speak naturally."
        );

        status.textContent =
            "Listening";

        micText.textContent =
            "Microphone is on";

    }


    function closeCallScreen() {

        screen.classList.remove(
            "is-open"
        );

        screen.classList.remove(
            "is-listening",
            "is-speaking"
        );

        screen.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "live-talk-active"
        );

    }


    // =====================================================
    // TRANSCRIPT
    // =====================================================

    function addMessage(
        type,
        label,
        text
    ) {

        const message =
            document.createElement("div");

        message.className =
            `live-talk-message ${type}`;

        const title =
            document.createElement("div");

        title.className =
            "live-talk-message-label";

        title.textContent =
            label;

        const body = document.createElement("div");
        body.className = "live-talk-message-body";

        const cleanVisualText = String(text ?? "")
            // Remove fenced code blocks completely
            .replace(/```[\s\S]*?```/g, "")

            // Remove inline code formatting
            .replace(/`([^`]+)`/g, "$1")

            // Remove images and keep alt text
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")

            // Convert Markdown links to visible text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")

            // Remove Markdown headings
            .replace(/^\s*#{1,6}\s*/gm, "")

            // Remove bold / italic / strike formatting
            .replace(/\*\*\*(.*?)\*\*\*/gs, "$1")
            .replace(/\*\*(.*?)\*\*/gs, "$1")
            .replace(/\*(.*?)\*/gs, "$1")
            .replace(/__(.*?)__/gs, "$1")
            .replace(/_(.*?)_/gs, "$1")
            .replace(/~~(.*?)~~/gs, "$1")

           // Clean list markers
           .replace(/^\s*[-*+]\s+/gm, "• ")
           .replace(/^\s*\d+\.\s+/gm, "")

          // Remove quote markers
          .replace(/^\s*>\s?/gm, "")

          // LaTeX delimiters
          .replace(/\\\((.*?)\\\)/gs, "$1")
          .replace(/\\\[(.*?)\\\]/gs, "$1")
          .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
          .replace(/\$([^$]+)\$/g, "$1")

          // Common LaTeX fractions — including nested expressions
          .replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "$1/$2")

          // Common LaTeX commands
          .replace(/\\sqrt\s*\{([^{}]*)\}/g, "√$1")
          .replace(/\\text\s*\{([^{}]*)\}/g, "$1")
          .replace(/\\mathrm\s*\{([^{}]*)\}/g, "$1")
          .replace(/\\mathbf\s*\{([^{}]*)\}/g, "$1")
          .replace(/\\left/g, "")
          .replace(/\\right/g, "")
          .replace(/\\times/g, " × ")
          .replace(/\\cdot/g, " · ")
          .replace(/\\pm/g, " ± ")
          .replace(/\\Delta/g, "Δ")
          .replace(/\\theta/g, "θ")
          .replace(/\\pi/g, "π")
          .replace(/\\alpha/g, "α")
          .replace(/\\beta/g, "β")
          .replace(/\\gamma/g, "γ")
          .replace(/\\lambda/g, "λ")
          .replace(/\\mu/g, "μ")
          .replace(/\\sigma/g, "σ")
          .replace(/\\sum/g, "Σ")
          .replace(/\\infty/g, "∞")
          .replace(/\\circ/g, "°")

          // Remove remaining LaTeX commands
          .replace(/\\[a-zA-Z]+\*?/g, "")

          // Remove remaining LaTeX braces
          .replace(/[{}]/g, "")

          // Remove formatting symbols that should never be visible
          .replace(/[#*_~`]+/g, "")

          // Clean table separators
          .replace(/^\s*\|/gm, "")
          .replace(/\|\s*$/gm, "")
          .replace(/\|/g, "  ")

          // Normalize whitespace
          .replace(/[ \t]{2,}/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        body.textContent = cleanVisualText;

        message.appendChild(title);
        message.appendChild(body);

        transcript.appendChild(
            message
        );

        transcript.scrollTop =
            transcript.scrollHeight;
    }


    // =====================================================
    // LISTEN
    // =====================================================

    function loadSynapseVoices() {

    const voices =
        window.speechSynthesis.getVoices();

    if (!voices.length) return;

    const englishVoices =
        voices.filter(voice =>
            /^en(-|_)/i.test(voice.lang)
        );

    if (!englishVoices.length) return;

    const maleHints = [
        "male",
        "david",
        "mark",
        "daniel",
        "george",
        "alex"
    ];

    const femaleHints = [
        "female",
        "zira",
        "samantha",
        "victoria",
        "susan",
        "karen"
    ];

    function findVoice(hints) {

        return englishVoices.find(
            voice =>
                hints.some(
                    hint =>
                        voice.name
                            .toLowerCase()
                            .includes(hint)
                )
        );
    }

    function finishLiveTalk() {

    active = false;
    paused = false;

    stopListening();

    window.speechSynthesis.cancel();

    closeLiveTalkScreen();

    liveTalkBtn.classList.remove(
        "is-active",
        "is-listening",
        "is-speaking"
    );

    updateLiveTalkStatus(
        "Listening",
        "Ready"
    );
}

if (liveTalkCloseBtn) {
    liveTalkCloseBtn.addEventListener(
        "click",
        finishLiveTalk
    );
}

if (liveTalkEndBtn instanceof Element) {
    liveTalkEndBtn.addEventListener(
        "click",
        finishLiveTalk
    );
}

voiceOptions.forEach(option => {

    option.addEventListener(
        "click",
        () => {

            voiceOptions.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );

            option.classList.add(
                "active"
            );

            selectedVoiceType =
                option.dataset.voice;

            loadSynapseVoices();

            console.log(
                "Selected voice:",
                selectedVoiceType
            );

        }
    );

});

    const maleVoice =
        findVoice(maleHints) ||
        englishVoices[0];

    const femaleVoice =
        findVoice(femaleHints) ||
        englishVoices[1] ||
        englishVoices[0];

    selectedVoice =
        selectedVoiceType === "male"
            ? maleVoice
            : femaleVoice;
}


// Browser voices may load after the page.

window.speechSynthesis.onvoiceschanged =
    loadSynapseVoices;

loadSynapseVoices();

voiceCards.forEach(card => {

    card.addEventListener(
        "click",
        () => {

            selectedVoiceType =
                card.dataset.voice;

            voiceCards.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );

            card.classList.add(
                "active"
            );

            loadSynapseVoices();

            if (speaking) {
                window.speechSynthesis.cancel();

                speaking = false;
            }

            console.log(
                "AP Synapse voice:",
                selectedVoiceType
            );

        }
    );

});

    function startListening() {

        if (!active || speaking) {
            return;
        }

        listening = true;

        screen.classList.add(
            "is-listening"
        );

        screen.classList.remove(
            "is-speaking"
        );

        status.textContent =
            "Listening";

        micText.textContent =
            "Microphone is on";

        try {
            recognition.start();
        } catch (_) {}

    }


    function stopListening() {

        listening = false;

        screen.classList.remove(
            "is-listening"
        );

        try {
            recognition.stop();
        } catch (_) {}

    }


    // =====================================================
    // SEND TO AP SYNAPSE
    // =====================================================

    async function sendToSynapse(text) {

        stopListening();

        speaking = true;

        screen.classList.add(
            "is-speaking"
        );

        status.textContent =
            "AP Synapse is thinking…";

        micText.textContent =
            "Processing";


        addMessage(
            "user",
            "You",
            text
        );


        try {

            const response =
                await fetch(
                    "https://api.ap-synapse.com/chat",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            message: text
                        })
                    }
                );


            /*
             * IMPORTANT:
             * Your backend may return JSON OR
             * plain text. Do not blindly call
             * response.json().
             */

            const raw =
                await response.text();


            if (!response.ok) {

                throw new Error(
                    raw ||
                    `Server returned ${response.status}`
                );

            }


            let reply = "";


            try {

                const result =
                    JSON.parse(raw);

                reply =
                    result.reply ||
                    result.message ||
                    result.response ||
                    "";

            } catch (_) {

                // Backend returned plain text.

                reply =
                    raw.trim();

            }


            if (!reply) {

                throw new Error(
                    "AP Synapse returned an empty response."
                );

            }


            addMessage(
                "synapse",
                "AP Synapse",
                reply
            );


            speak(reply);

        }

        catch (error) {

            console.error(
                "❌ AP Synapse Live Talk error:",
                error
            );

            speaking = false;

            screen.classList.remove(
                "is-speaking"
            );

            status.textContent =
                "Connection problem";

            micText.textContent =
                "Microphone paused";

            notify(
                "AP Synapse could not respond right now.",
                "error"
            );


            setTimeout(
                () => {

                    if (active) {
                        startListening();
                    }

                },
                500
            );

        }

    }


    // =====================================================
    // SPEAK
    // =====================================================

    function cleanLiveTalkText(text) {
    return String(text || "")
        .replace(/```[\s\S]*?```/g, "")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/^\s*#{1,6}\s*/gm, "")
        .replace(/\*\*\*(.*?)\*\*\*/gs, "$1")
        .replace(/\*\*(.*?)\*\*/gs, "$1")
        .replace(/\*(.*?)\*/gs, "$1")
        .replace(/__(.*?)__/gs, "$1")
        .replace(/_(.*?)_/gs, "$1")
        .replace(/~~(.*?)~~/gs, "$1")
        .replace(/^\s*[-*+]\s+/gm, "")
        .replace(/^\s*\d+\.\s+/gm, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/^\s*>\s?/gm, "")
        .replace(/[#*_~`]+/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function speak(text, gender = selectedVoiceType) {

    if (!text) return;

    window.speechSynthesis.cancel();

    // =====================================================
    // CLEAN TEXT FOR SPEECH
    // =====================================================

    let cleanText = String(text)

        .replace(/```[\s\S]*?```/g, "")
        .replace(/`([^`]+)`/g, "$1")

        .replace(/!\[.*?\]\(.*?\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")

        .replace(/#{1,6}\s*/g, "")

        .replace(/\*\*\*(.*?)\*\*\*/gs, "$1")
        .replace(/\*\*(.*?)\*\*/gs, "$1")
        .replace(/\*(.*?)\*/gs, "$1")

        .replace(/__(.*?)__/gs, "$1")
        .replace(/_(.*?)_/gs, "$1")
        .replace(/~~(.*?)~~/gs, "$1")

        .replace(/^\s*[-*+]\s+/gm, "")
        .replace(/^\s*\d+\.\s+/gm, "")
        .replace(/^\s*>\s?/gm, "")

        .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
        .replace(/\$([^$]+)\$/g, "$1")

        .replace(/\\\((.*?)\\\)/gs, "$1")
        .replace(/\\\[(.*?)\\\]/gs, "$1")

        .replace(
            /\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,
            "$1 divided by $2"
        )

        .replace(
            /\\sqrt\s*\{([^{}]*)\}/g,
            "square root of $1"
        )

        .replace(/\\text\s*\{([^{}]*)\}/g, "$1")
        .replace(/\\mathrm\s*\{([^{}]*)\}/g, "$1")

        .replace(/\\left/g, "")
        .replace(/\\right/g, "")

        .replace(/\\times/g, " times ")
        .replace(/\\cdot/g, " times ")

        .replace(/\\Delta/g, "delta")
        .replace(/\\theta/g, "theta")
        .replace(/\\pi/g, "pi")
        .replace(/\\alpha/g, "alpha")
        .replace(/\\beta/g, "beta")
        .replace(/\\gamma/g, "gamma")
        .replace(/\\sigma/g, "sigma")
        .replace(/\\infty/g, "infinity")
        .replace(/\\circ/g, " degrees ")

        // Remove any remaining LaTeX commands
        .replace(/\\[a-zA-Z]+\*?/g, "")

        // Remove remaining braces and formatting symbols
        .replace(/[{}]/g, "")
        .replace(/[#$*_~`|]+/g, "")

        .replace(/\s+/g, " ")
        .trim();

    if (!cleanText) return;


    // =====================================================
    // SPEECH OBJECT
    // =====================================================

    const speech =
        new SpeechSynthesisUtterance(cleanText);

    speech.lang = "en-IN";
    speech.rate = 0.95;
    speech.volume = 1;

    speech.pitch =
        gender === "male"
            ? 0.85
            : 1.05;


    // =====================================================
    // VOICE SELECTION
    // =====================================================

    const voices =
        window.speechSynthesis.getVoices();

    const englishVoices =
        voices.filter(voice =>
            /^en(-|_)/i.test(voice.lang)
        );


    const maleHints = [
        "male",
        "david",
        "mark",
        "daniel",
        "george",
        "guy",
        "ryan",
        "james"
    ];


    const femaleHints = [
        "female",
        "zira",
        "samantha",
        "victoria",
        "susan",
        "karen",
        "aria",
        "jenny",
        "hazel"
    ];


    function matchesVoice(
        voice,
        hints
    ) {

        const name =
            voice.name.toLowerCase();

        return hints.some(
            hint =>
                name.includes(
                    hint.toLowerCase()
                )
        );
    }


    let chosenVoice = null;


    // =====================================================
    // MALE
    // =====================================================

    if (gender === "male") {

        chosenVoice =
            englishVoices.find(
                voice =>
                    matchesVoice(
                        voice,
                        maleHints
                    )
            );


        // Do not accidentally choose an obvious
        // female voice as the male fallback.

        if (!chosenVoice) {

            chosenVoice =
                englishVoices.find(
                    voice =>
                        !matchesVoice(
                            voice,
                            femaleHints
                        )
                );
        }

    }


    // =====================================================
    // FEMALE
    // =====================================================

    else {

        chosenVoice =
            englishVoices.find(
                voice =>
                    matchesVoice(
                        voice,
                        femaleHints
                    )
            );


        // Do not accidentally choose an obvious
        // male voice as the female fallback.

        if (!chosenVoice) {

            chosenVoice =
                englishVoices.find(
                    voice =>
                        !matchesVoice(
                            voice,
                            maleHints
                        )
                );
        }

    }


    // Final fallback only if the browser exposes
    // no identifiable gender-specific voice.

    if (!chosenVoice) {

        chosenVoice =
            englishVoices[0] ||
            voices[0] ||
            null;
    }


    if (chosenVoice) {

        speech.voice =
            chosenVoice;

        speech.lang =
            chosenVoice.lang;

        console.log(
            "🎙️ AP SYNAPSE SPEAKING:",
            gender,
            "|",
            chosenVoice.name,
            "|",
            chosenVoice.lang
        );

    } else {

        console.warn(
            "⚠️ AP Synapse: no speech voice available."
        );

    }


    // =====================================================
    // SPEAK
    // =====================================================

    speaking = true;

    window.speechSynthesis.speak(
        speech
    );


    speech.onend = () => {

        speaking = false;

        screen.classList.remove(
            "is-speaking"
        );

        if (active && !paused) {

            updateLiveTalkStatus(
                "Listening",
                "Speak naturally — AP Synapse is listening…"
            );

            startListening();

        }

    };


    speech.onerror = () => {

        speaking = false;

        screen.classList.remove(
            "is-speaking"
        );

        if (active && !paused) {
            startListening();
        }

    };

}


    // =====================================================
    // RECOGNITION RESULT
    // =====================================================

    recognition.onresult =
        event => {

            const text =
                event
                    .results[0][0]
                    .transcript
                    .trim();


            if (!text) {

                startListening();
                return;

            }


            sendToSynapse(text);

        };


    // =====================================================
    // RECOGNITION ERROR
    // =====================================================

    recognition.onerror =
        event => {

            console.warn(
                "Live Talk recognition:",
                event.error
            );


            listening = false;


            if (
                !active ||
                speaking
            ) {
                return;
            }


            if (
                event.error ===
                "not-allowed"
            ) {

                status.textContent =
                    "Microphone permission required";

                micText.textContent =
                    "Allow microphone access";

                notify(
                    "Please allow microphone access for Live Talk.",
                    "error"
                );

                return;
            }


            setTimeout(
                startListening,
                250
            );

        };


    recognition.onend =
        () => {

            listening = false;

            screen.classList.remove(
                "is-listening"
            );

            /*
             * Recognition can end naturally.
             * Restart automatically unless
             * AP Synapse is speaking.
             */

            if (
                active &&
                !speaking
            ) {

                setTimeout(
                    startListening,
                    120
                );

            }

        };


    // =====================================================
    // END CALL
    // =====================================================

    function endLiveTalk() {

        active = false;
        listening = false;
        speaking = false;


        try {
            recognition.stop();
        } catch (_) {}


        window.speechSynthesis.cancel();


        screen.classList.remove(
            "is-listening",
            "is-speaking"
        );


        closeCallScreen();


        liveTalkBtn.classList.remove(
            "is-active",
            "is-listening",
            "is-speaking"
        );


        liveTalkBtn.setAttribute(
            "aria-label",
            "Start Live Talk"
        );


        status.textContent =
            "Call ended";


        notify(
            "Live Talk ended.",
            "info"
        );

    }


    // =====================================================
    // START CALL
    // =====================================================

    function startLiveTalk() {

        if (active) {
            return;
        }


        active = true;

        openLiveTalkScreen();

        updateLiveTalkStatus(
            "Listening",
            "Speak naturally — AP Synapse is listening…"
        );

        notify(
            "AP Synapse Live Talk is ready.",
            "success"
        );

        /*
         * Start microphone immediately.
         */

        setTimeout(
            startListening,
            250
        );

    }

    function openLiveTalkScreen() {

    if (!liveTalkScreen) return;

    liveTalkScreen.classList.add("is-open");

    liveTalkScreen.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";
}


function closeLiveTalkScreen() {

    if (!liveTalkScreen) return;

    liveTalkScreen.classList.remove(
        "is-open"
    );

    liveTalkScreen.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";
}


function updateLiveTalkStatus(
    status,
    subtext
) {

    if (liveTalkStatus) {
        liveTalkStatus.textContent = status;
    }

    if (liveTalkSubtext) {
        liveTalkSubtext.textContent = subtext;
    }
}


    // =====================================================
    // BUTTONS
    // =====================================================

    liveTalkBtn.addEventListener(
        "click",
        () => {

            if (active) {
                endLiveTalk();
            } else {
                startLiveTalk();
            }

        }
    );

    const closeBtn = document.getElementById("liveTalkCloseBtn");
    const endBtn = document.getElementById("liveTalkEndBtn");

    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            endLiveTalk
        );

    }


    if (endBtn) {

        endBtn.addEventListener(
            "click",
            endLiveTalk
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                active
            ) {

                endLiveTalk();

            }

        }
    );


    window.AP_Synapse_LiveTalk = {

        start: startLiveTalk,

        stop: endLiveTalk

    };


    console.log(
        "✦ AP Synapse Premium Live Talk ready."
    );

})();

/* ============================================================
   AP SYNAPSE — MOBILE ASSISTANT
   AUTO-DETECT + KEEP EXACTLY ONE VISIBLE SCROLLBAR
   ============================================================ */

(() => {
    "use strict";

    function getScrollableElements() {

        const page =
            document.getElementById("assistantPage");

        if (!page) return [];


        const elements = [
            document.documentElement,
            document.body
        ];


        /*
         * Include Assistant page + every descendant.
         */
        elements.push(page);

        page
            .querySelectorAll("*")
            .forEach(el => {
                elements.push(el);
            });


        /*
         * Also include ancestors because the second scrollbar
         * may belong to the workspace shell.
         */
        let parent =
            page.parentElement;

        while (
            parent &&
            parent !== document.body
        ) {
            elements.push(parent);
            parent = parent.parentElement;
        }


        return [
            ...new Set(elements)
        ]
        .filter(el => {

            if (!(el instanceof HTMLElement)) {
                return false;
            }

            const style =
                getComputedStyle(el);

            const overflowY =
                style.overflowY;

            const canScroll =
                (
                    overflowY === "auto" ||
                    overflowY === "scroll" ||
                    overflowY === "overlay"
                );

            const actuallyScrollable =
                el.scrollHeight >
                el.clientHeight + 3;


            return (
                canScroll &&
                actuallyScrollable
            );
        });
    }


    function applyOneScrollbar() {

        if (
            window.innerWidth > 760 ||
            document.body.dataset.page !== "assistant"
        ) {
            return;
        }


        const scrollables =
            getScrollableElements();


        if (!scrollables.length) {
            return;
        }


        /*
         * Clear previous state.
         */
        document
            .querySelectorAll(
                ".ap-hide-native-scrollbar, .ap-main-scrollbar"
            )
            .forEach(el => {

                el.classList.remove(
                    "ap-hide-native-scrollbar",
                    "ap-main-scrollbar"
                );

            });


        /*
         * The proper scrollbar is the scroll container whose
         * right edge is furthest to the right.
         */
        const ranked =
            scrollables
                .map(el => {

                    const rect =
                        el.getBoundingClientRect();

                    return {
                        el,
                        right: rect.right,
                        height: rect.height,
                        width: rect.width,
                        id: el.id,
                        cls:
                            typeof el.className === "string"
                                ? el.className
                                : ""
                    };
                })
                .filter(item =>
                    item.height > 120 &&
                    item.width > 100
                )
                .sort(
                    (a, b) =>
                        b.right - a.right
                );


        if (!ranked.length) {
            return;
        }


        const keeper =
            ranked[0].el;


        /*
         * Hide scrollbar VISUALS on every competing scroller.
         * Their scrolling still works.
         */
        ranked.forEach(item => {

            if (item.el === keeper) {

                item.el.classList.add(
                    "ap-main-scrollbar"
                );

            } else {

                item.el.classList.add(
                    "ap-hide-native-scrollbar"
                );
            }

        });


        /*
         * Also remove old fake/custom scrollbar tracks
         * contained inside Assistant.
         */
        const page =
            document.getElementById(
                "assistantPage"
            );


        page
            ?.querySelectorAll(`
                .scrollbar,
                .custom-scrollbar,
                .scroll-track,
                .scroll-thumb,
                .scroll-indicator,
                [class*="scrollbar-track"],
                [class*="scrollbar-thumb"]
            `)
            .forEach(el => {

                el.classList.add(
                    "ap-hide-custom-scrollbar"
                );

            });


        console.log(
            "✅ AP SYNAPSE — ONE SCROLLBAR SELECTED:",
            {
                keeper:
                    keeper.id ||
                    keeper.className ||
                    keeper.tagName,

                detected:
                    ranked.map(item => ({
                        element:
                            item.id ||
                            item.cls ||
                            item.el.tagName,

                        right:
                            Math.round(
                                item.right
                            )
                    }))
            }
        );
    }


    function schedule() {

        requestAnimationFrame(() => {
            requestAnimationFrame(
                applyOneScrollbar
            );
        });
    }


    schedule();

    setTimeout(schedule, 100);
    setTimeout(schedule, 400);
    setTimeout(schedule, 900);


    window.addEventListener(
        "resize",
        schedule,
        {
            passive: true
        }
    );


    const observer =
        new MutationObserver(
            schedule
        );


    observer.observe(
        document.body,
        {
            attributes: true,
            attributeFilter: [
                "data-page"
            ]
        }
    );

})();

/* ============================================================
   AP SYNAPSE — MOBILE HOME EXACT SINGLE SCROLL FIX
   #assistantPage scrolls
   #heroScreen NEVER scrolls
   ============================================================ */

(() => {
    "use strict";

    function fixAPMobileHomeScroll() {

        if (
            window.innerWidth > 760 ||
            document.body.dataset.page !== "assistant"
        ) {
            return;
        }

        const page =
            document.getElementById("assistantPage");

        const hero =
            document.getElementById("heroScreen");

        if (!page || !hero) {
            return;
        }


        /* ==============================================
           OUTER PAGE = ONLY SCROLL OWNER
           ============================================== */

        page.style.setProperty(
            "overflow-x",
            "hidden",
            "important"
        );

        page.style.setProperty(
            "overflow-y",
            "auto",
            "important"
        );


        /* ==============================================
           HERO = CONTENT ONLY, NEVER A SCROLLER
           ============================================== */

        hero.style.setProperty(
            "height",
            "auto",
            "important"
        );

        hero.style.setProperty(
            "min-height",
            "0",
            "important"
        );

        hero.style.setProperty(
            "max-height",
            "none",
            "important"
        );

        hero.style.setProperty(
            "overflow",
            "visible",
            "important"
        );

        hero.style.setProperty(
            "overflow-x",
            "visible",
            "important"
        );

        hero.style.setProperty(
            "overflow-y",
            "visible",
            "important"
        );


        console.log(
            "✅ AP SYNAPSE — HERO SCROLL REMOVED",
            {
                assistantOverflow:
                    getComputedStyle(page).overflowY,

                heroOverflow:
                    getComputedStyle(hero).overflowY,

                heroHeight:
                    hero.clientHeight,

                heroScrollHeight:
                    hero.scrollHeight
            }
        );
    }


    function scheduleFix() {

        requestAnimationFrame(() => {
            requestAnimationFrame(
                fixAPMobileHomeScroll
            );
        });
    }


    scheduleFix();

    setTimeout(scheduleFix, 100);
    setTimeout(scheduleFix, 400);
    setTimeout(scheduleFix, 800);


    window.addEventListener(
        "resize",
        scheduleFix,
        {
            passive: true
        }
    );


    new MutationObserver(
        scheduleFix
    ).observe(
        document.body,
        {
            attributes: true,
            attributeFilter: [
                "data-page"
            ]
        }
    );

})();

/* ============================================================
   AP SYNAPSE — REMOVE OLD DUPLICATE MOBILE SCROLL SYSTEMS
   ============================================================ */

(() => {
    "use strict";

    function cleanupAPMobileScrollbars() {

        if (window.innerWidth > 760) {
            return;
        }

        /*
         * Remove the artificial scrollbar we previously created.
         */
        document
            .querySelectorAll(
                ".ap-mobile-single-scrollbar"
            )
            .forEach(element => {
                element.remove();
            });


        /*
         * Remove classes left behind by older scrollbar patches.
         */
        document
            .querySelectorAll(`
                .ap-hide-native-scrollbar,
                .ap-main-scrollbar,
                .ap-home-hide-scrollbar,
                .ap-hide-custom-scrollbar,
                .ap-old-scroll-visual-hidden,
                .ap-assistant-scroll-parent-lock
            `)
            .forEach(element => {

                element.classList.remove(
                    "ap-hide-native-scrollbar",
                    "ap-main-scrollbar",
                    "ap-home-hide-scrollbar",
                    "ap-hide-custom-scrollbar",
                    "ap-old-scroll-visual-hidden",
                    "ap-assistant-scroll-parent-lock"
                );

            });


        document.documentElement.classList.remove(
            "ap-one-mobile-scrollbar"
        );


        const page =
            document.getElementById(
                "assistantPage"
            );

        const hero =
            document.getElementById(
                "heroScreen"
            );


        if (!page || !hero) {
            return;
        }


        /*
         * ONE REAL SCROLL OWNER
         */

        page.style.setProperty(
            "overflow-y",
            "auto",
            "important"
        );

        page.style.setProperty(
            "overflow-x",
            "hidden",
            "important"
        );


        /*
         * Hero itself is ordinary expanding content.
         */

        hero.style.setProperty(
            "height",
            "auto",
            "important"
        );

        hero.style.setProperty(
            "max-height",
            "none",
            "important"
        );

        hero.style.setProperty(
            "overflow-y",
            "visible",
            "important"
        );

        hero.style.setProperty(
            "overflow-x",
            "hidden",
            "important"
        );


        console.log(
            "✅ AP SYNAPSE — OLD DUPLICATE SCROLL SYSTEM REMOVED"
        );
    }


    cleanupAPMobileScrollbars();

})();


/* ============================================================
   AP SYNAPSE — MOBILE HOME PERMANENT FINAL POSITION
   ============================================================ */

(() => {
    "use strict";

    function applyFinalMobileHomePosition() {

        if (window.innerWidth > 760) return;

        const container =
            document.querySelector(
                "#heroScreen .hero-container"
            );

        if (!container) return;

        container.style.setProperty(
            "position",
            "relative",
            "important"
        );

        container.style.setProperty(
            "top",
            "-72px",
            "important"
        );

        container.style.setProperty(
            "transform",
            "none",
            "important"
        );

        container.style.setProperty(
            "translate",
            "none",
            "important"
        );
    }


    /* Apply immediately */
    applyFinalMobileHomePosition();


    /* Apply whenever Home becomes active */
    new MutationObserver(() => {
        applyFinalMobileHomePosition();
    }).observe(
        document.body,
        {
            attributes: true,
            attributeFilter: ["data-page"]
        }
    );


    /* Keep correct on mobile resize/orientation */
    window.addEventListener(
        "resize",
        applyFinalMobileHomePosition,
        { passive: true }
    );

})();

