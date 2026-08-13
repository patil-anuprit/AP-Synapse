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

        const body =
            document.createElement("div");

        body.textContent =
            text;

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
                    "https://ap-synapse-backend.onrender.com/chat",
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

    function speak(text) {

        window.speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(text);

        utterance.lang = "en-IN";

        utterance.rate = 1.03;

        utterance.pitch =
            selectedVoiceType === "male"
                ? 0.92
                : 1.05;

        utterance.volume = 1;

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }


        utterance.onstart =
            () => {

                speaking = true;

                screen.classList.add(
                    "is-speaking"
                );

                screen.classList.remove(
                    "is-listening"
                );

                status.textContent =
                    "AP Synapse is speaking";

                micText.textContent =
                    "AP Synapse is speaking";

            };


        utterance.onend =
            () => {

                speaking = false;

                screen.classList.remove(
                    "is-speaking"
                );

                status.textContent =
                    "Listening";

                micText.textContent =
                    "Microphone is on";


                /*
                 * Automatically return to
                 * listening after AP Synapse
                 * finishes speaking.
                 */

                if (active) {

                    setTimeout(
                        startListening,
                        180
                    );

                }

            };


        utterance.onerror =
            () => {

                speaking = false;

                screen.classList.remove(
                    "is-speaking"
                );

                if (active) {
                    startListening();
                }

            };


        window.speechSynthesis.speak(
            utterance
        );

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
