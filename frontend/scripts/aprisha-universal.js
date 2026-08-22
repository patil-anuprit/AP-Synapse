(() => {
    "use strict";

    const API =
        ["localhost", "127.0.0.1"].includes(location.hostname)
            ? "http://localhost:5000/chat"
            : "https://api.ap-synapse.com/chat";

    const WAKE_PHRASES = [
        "hey aprisha",
        "hi aprisha",
        "aprisha"
    ];

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    const state = {
        enabled:
            localStorage.getItem("apAprishaEnabled") === "true",

        wakeListening: false,
        commandListening: false,
        awake: false,
        thinking: false,

        stayUntil: 0,

        wakeRecognizer: null,
        commandRecognizer: null,

        sessionId:
            localStorage.getItem("apAprishaSessionId") ||
            (
                "aprisha-web-" +
                crypto.randomUUID()
            ),

        lastTranscript: ""
    };

    localStorage.setItem(
        "apAprishaSessionId",
        state.sessionId
    );


    /* ========================================================
       UI
       ======================================================== */

    function createUI() {

        if (
            document.getElementById(
                "apAprishaUniversal"
            )
        ) {
            return;
        }

        const root =
            document.createElement("div");

        root.id =
            "apAprishaUniversal";

        root.innerHTML = `
            <button
                id="apAprishaOrb"
                type="button"
                aria-label="Aprisha"
                title="Aprisha"
            >
                <span class="ap-aprisha-orb-mark">AP</span>
                <span class="ap-aprisha-orb-pulse"></span>
            </button>

            <section
                id="apAprishaPanel"
                class="ap-aprisha-panel"
                aria-live="polite"
            >
                <header class="ap-aprisha-header">

                    <div class="ap-aprisha-brand">
                        <div class="ap-aprisha-mark">
                            AP
                        </div>

                        <div>
                            <strong>Aprisha</strong>
                            <span>AP Presence</span>
                        </div>
                    </div>

                    <button
                        id="apAprishaClose"
                        type="button"
                        aria-label="Close Aprisha"
                    >
                        ×
                    </button>

                </header>

                <div class="ap-aprisha-intelligence">

                    <div
                        id="apAprishaField"
                        class="ap-aprisha-field"
                    >
                        <i></i>
                        <i></i>
                        <i></i>
                    </div>

                    <div
                        id="apAprishaState"
                        class="ap-aprisha-state"
                    >
                        Aprisha ready
                    </div>

                    <div
                        id="apAprishaText"
                        class="ap-aprisha-text"
                    >
                        Say “Hey Aprisha”
                    </div>

                </div>

                <div class="ap-aprisha-actions">

                    <button
                        id="apAprishaEnable"
                        type="button"
                    >
                        Enable Aprisha
                    </button>

                    <button
                        id="apAprishaSpeak"
                        type="button"
                    >
                        Speak
                    </button>

                    <button
                        id="apAprishaStop"
                        type="button"
                    >
                        Stop
                    </button>

                </div>

                <div class="ap-aprisha-foot">
                    Voice activation works while AP Synapse is open.
                </div>

            </section>
        `;

        document.body.appendChild(root);

        document
            .getElementById("apAprishaOrb")
            .addEventListener(
                "click",
                openPanel
            );

        document
            .getElementById("apAprishaClose")
            .addEventListener(
                "click",
                closePanel
            );

        document
            .getElementById("apAprishaEnable")
            .addEventListener(
                "click",
                enableAprisha
            );

        document
            .getElementById("apAprishaSpeak")
            .addEventListener(
                "click",
                beginCommandListening
            );

        document
            .getElementById("apAprishaStop")
            .addEventListener(
                "click",
                stopEverything
            );

        refreshUI();
    }


    function openPanel() {

        document
            .getElementById("apAprishaPanel")
            ?.classList.add("ap-open");
    }


    function closePanel() {

        document
            .getElementById("apAprishaPanel")
            ?.classList.remove("ap-open");
    }


    function setState(
        label,
        text,
        mode = "ready"
    ) {

        const stateEl =
            document.getElementById(
                "apAprishaState"
            );

        const textEl =
            document.getElementById(
                "apAprishaText"
            );

        const field =
            document.getElementById(
                "apAprishaField"
            );

        if (stateEl) {
            stateEl.textContent = label;
        }

        if (textEl) {
            textEl.textContent = text;
        }

        if (field) {

            field.dataset.mode =
                mode;
        }
    }


    function refreshUI() {

        const enable =
            document.getElementById(
                "apAprishaEnable"
            );

        if (enable) {

            enable.textContent =
                state.enabled
                    ? "Aprisha Enabled"
                    : "Enable Aprisha";

            enable.classList.toggle(
                "ap-active",
                state.enabled
            );
        }
    }


    /* ========================================================
       ENABLE
       ======================================================== */

    async function enableAprisha() {

        openPanel();

        if (!SpeechRecognition) {

            setState(
                "Voice unavailable",
                "This browser does not expose Android speech recognition.",
                "error"
            );

            return;
        }

        /*
         * Start recognition from the user's click.
         * This also triggers microphone permission where needed.
         */

        state.enabled = true;

        localStorage.setItem(
            "apAprishaEnabled",
            "true"
        );

        refreshUI();

        setState(
            "Aprisha enabled",
            "Say “Hey Aprisha”",
            "waiting"
        );

        startWakeListening();
    }


    /* ========================================================
       WAKE WORD
       ======================================================== */

    function startWakeListening() {

        if (
            !state.enabled ||
            !SpeechRecognition ||
            state.thinking ||
            state.commandListening
        ) {
            return;
        }

        stopWakeRecognizer();

        const recognition =
            new SpeechRecognition();

        state.wakeRecognizer =
            recognition;

        recognition.continuous =
            true;

        recognition.interimResults =
            true;

        recognition.maxAlternatives =
            3;

        recognition.lang =
            navigator.language ||
            "en-IN";

        recognition.onstart = () => {

            state.wakeListening =
                true;

            setState(
                "Aprisha ready",
                "Say “Hey Aprisha”",
                "waiting"
            );
        };


        recognition.onresult = event => {

            let transcript = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                transcript +=
                    event.results[i][0]
                        .transcript +
                    " ";
            }

            transcript =
                transcript
                    .toLowerCase()
                    .trim();

            if (!transcript) {
                return;
            }

            state.lastTranscript =
                transcript;

            const detected =
                WAKE_PHRASES.some(
                    phrase =>
                        transcript.includes(
                            phrase
                        )
                );

            if (detected) {

                wakeDetected();
            }
        };


        recognition.onerror = event => {

            state.wakeListening =
                false;

            if (
                event.error ===
                "not-allowed"
            ) {

                setState(
                    "Microphone permission needed",
                    "Allow microphone access to use Aprisha.",
                    "error"
                );

                return;
            }

            restartWakeLater();
        };


        recognition.onend = () => {

            state.wakeListening =
                false;

            restartWakeLater();
        };


        try {

            recognition.start();

        } catch {

            restartWakeLater();
        }
    }


    function stopWakeRecognizer() {

        const recognition =
            state.wakeRecognizer;

        state.wakeRecognizer =
            null;

        state.wakeListening =
            false;

        if (!recognition) {
            return;
        }

        recognition.onend = null;
        recognition.onerror = null;

        try {
            recognition.stop();
        } catch {}

        try {
            recognition.abort();
        } catch {}
    }


    function restartWakeLater() {

        if (
            !state.enabled ||
            state.awake ||
            state.commandListening ||
            state.thinking ||
            document.hidden
        ) {
            return;
        }

        setTimeout(
            startWakeListening,
            650
        );
    }


    function wakeDetected() {

        if (state.awake) {
            return;
        }

        state.awake = true;

        state.stayUntil =
            Date.now() +
            45000;

        stopWakeRecognizer();

        openPanel();

        setState(
            "Hey Aprisha",
            "I'm listening.",
            "awake"
        );

        vibrate();

        playWakeTone();

        setTimeout(
            beginCommandListening,
            300
        );
    }


    /* ========================================================
       COMMAND RECOGNITION
       ======================================================== */

    function beginCommandListening() {

        if (
            !SpeechRecognition ||
            state.commandListening ||
            state.thinking
        ) {
            return;
        }

        stopWakeRecognizer();
        stopCommandRecognizer();

        state.awake = true;

        if (
            Date.now() >
            state.stayUntil
        ) {

            state.stayUntil =
                Date.now() +
                45000;
        }

        const recognition =
            new SpeechRecognition();

        state.commandRecognizer =
            recognition;

        recognition.continuous =
            false;

        recognition.interimResults =
            true;

        recognition.maxAlternatives =
            3;

        recognition.lang =
            navigator.language ||
            "en-IN";


        recognition.onstart = () => {

            state.commandListening =
                true;

            setState(
                "Listening",
                "Speak naturally…",
                "listening"
            );
        };


        recognition.onresult = event => {

            let transcript = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                transcript +=
                    event.results[i][0]
                        .transcript +
                    " ";
            }

            transcript =
                transcript.trim();

            if (transcript) {

                setState(
                    "Listening",
                    transcript,
                    "listening"
                );
            }

            const finalResult =
                Array
                    .from(event.results)
                    .some(
                        result =>
                            result.isFinal
                    );

            if (
                finalResult &&
                transcript
            ) {

                stopCommandRecognizer();

                processCommand(
                    transcript
                );
            }
        };


        recognition.onerror = event => {

            state.commandListening =
                false;

            if (
                event.error ===
                    "no-speech" ||
                event.error ===
                    "aborted"
            ) {

                resumeAfterInteraction();

                return;
            }

            setState(
                "Aprisha",
                "I couldn't hear that clearly.",
                "ready"
            );

            resumeAfterInteraction();
        };


        recognition.onend = () => {

            state.commandListening =
                false;
        };


        try {

            recognition.start();

        } catch {

            state.commandListening =
                false;
        }
    }


    function stopCommandRecognizer() {

        const recognition =
            state.commandRecognizer;

        state.commandRecognizer =
            null;

        state.commandListening =
            false;

        if (!recognition) {
            return;
        }

        recognition.onend = null;

        try {
            recognition.stop();
        } catch {}

        try {
            recognition.abort();
        } catch {}
    }


    /* ========================================================
       COMMANDS
       ======================================================== */

    async function processCommand(
        command
    ) {

        const normalized =
            command
                .toLowerCase()
                .trim();


        if (
            ["stop", "cancel", "goodbye", "close aprisha"]
                .includes(normalized)
        ) {

            stopPresenceSession();

            return;
        }


        if (
            normalized.includes(
                "stay with me"
            )
        ) {

            state.stayUntil =
                Date.now() +
                120000;

            await speak(
                "I'm here. You can keep talking."
            );

            resumeAfterInteraction();

            return;
        }


        if (
            normalized.includes(
                "open ap synapse"
            )
        ) {

            await speak(
                "Opening AP Synapse."
            );

            location.href =
                "/";

            return;
        }


        await askAP(command);
    }


    /* ========================================================
       AP SYNAPSE INTELLIGENCE
       ======================================================== */

    async function askAP(
        command
    ) {

        state.thinking = true;

        setState(
            "Aprisha is thinking",
            command,
            "thinking"
        );


        try {

            const response =
                await fetch(
                    API,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "x-session-id":
                                state.sessionId
                        },

                        body:
                            JSON.stringify({
                                message:
                                    command,

                                source:
                                    "aprisha-universal"
                            })
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }


            const reply =
                await readAPResponse(
                    response
                );


            state.thinking =
                false;


            const finalReply =
                cleanReply(reply) ||
                "I couldn't create a response for that.";


            setState(
                "Aprisha",
                finalReply,
                "speaking"
            );


            await speak(
                finalReply
            );


            resumeAfterInteraction();

        }
        catch (error) {

            console.error(
                "Aprisha:",
                error
            );

            state.thinking =
                false;

            setState(
                "Connection issue",
                "I couldn't reach AP Synapse right now.",
                "error"
            );


            await speak(
                "I couldn't reach AP Synapse right now."
            );


            resumeAfterInteraction();
        }
    }


    async function readAPResponse(
        response
    ) {

        if (!response.body) {

            return await response.text();
        }


        const reader =
            response.body.getReader();

        const decoder =
            new TextDecoder();

        let raw = "";


        while (true) {

            const {
                value,
                done
            } =
                await reader.read();


            if (done) {
                break;
            }


            raw +=
                decoder.decode(
                    value,
                    {
                        stream:
                            true
                    }
                );
        }


        raw +=
            decoder.decode();


        return parsePossibleStream(
            raw
        );
    }


    function parsePossibleStream(
        raw
    ) {

        const trimmed =
            String(raw || "")
                .trim();


        if (!trimmed) {
            return "";
        }


        try {

            const json =
                JSON.parse(trimmed);

            return (
                json.reply ||
                json.response ||
                json.answer ||
                json.content ||
                json.text ||
                json.message?.content ||
                ""
            );

        } catch {}


        const lines =
            trimmed.split(
                /\r?\n/
            );

        let result = "";


        for (
            let line of lines
        ) {

            line =
                line.trim();


            if (!line) {
                continue;
            }


            if (
                line.startsWith(
                    "data:"
                )
            ) {

                line =
                    line.slice(5)
                        .trim();
            }


            if (
                line === "[DONE]"
            ) {
                continue;
            }


            try {

                const json =
                    JSON.parse(line);


                result +=
                    json.delta?.content ||
                    json.content ||
                    json.text ||
                    json.response ||
                    json.reply ||
                    "";

            } catch {

                result +=
                    (
                        result
                            ? "\n"
                            : ""
                    ) +
                    line;
            }
        }


        return result ||
            trimmed;
    }


    function cleanReply(
        text
    ) {

        return String(
            text || ""
        )
            .replace(
                /```[\s\S]*?```/g,
                " Code example available on screen. "
            )
            .replace(
                /\[([^\]]+)\]\([^)]+\)/g,
                "$1"
            )
            .replace(
                /[#*_`>]/g,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }


    /* ========================================================
       VOICE OUTPUT
       ======================================================== */

    function speak(
        text
    ) {

        return new Promise(
            resolve => {

                if (
                    !("speechSynthesis" in window)
                ) {

                    resolve();
                    return;
                }


                speechSynthesis.cancel();


                const utterance =
                    new SpeechSynthesisUtterance(
                        text
                    );


                utterance.rate =
                    1.02;

                utterance.pitch =
                    1.0;

                utterance.lang =
                    navigator.language ||
                    "en-IN";


                utterance.onend =
                    resolve;


                utterance.onerror =
                    resolve;


                speechSynthesis.speak(
                    utterance
                );
            }
        );
    }


    /* ========================================================
       CONTINUITY
       ======================================================== */

    function resumeAfterInteraction() {

        state.thinking =
            false;


        if (
            Date.now() <
            state.stayUntil
        ) {

            state.awake =
                true;


            setState(
                "Aprisha is here",
                "Go ahead…",
                "awake"
            );


            setTimeout(
                beginCommandListening,
                500
            );

        }
        else {

            state.awake =
                false;


            setState(
                "Aprisha ready",
                "Say “Hey Aprisha”",
                "waiting"
            );


            restartWakeLater();
        }
    }


    function stopPresenceSession() {

        state.awake =
            false;

        state.thinking =
            false;

        state.stayUntil =
            0;

        stopCommandRecognizer();

        speechSynthesis
            ?.cancel();


        setState(
            "Aprisha ready",
            "Say “Hey Aprisha”",
            "waiting"
        );


        restartWakeLater();
    }


    function stopEverything() {

        state.enabled =
            false;

        state.awake =
            false;

        state.thinking =
            false;


        localStorage.setItem(
            "apAprishaEnabled",
            "false"
        );


        stopWakeRecognizer();
        stopCommandRecognizer();

        speechSynthesis
            ?.cancel();


        setState(
            "Aprisha paused",
            "Tap Enable Aprisha when you want her again.",
            "ready"
        );


        refreshUI();
    }


    /* ========================================================
       SMALL FEEDBACK
       ======================================================== */

    function vibrate() {

        try {

            navigator.vibrate?.(
                [18, 25, 34]
            );

        } catch {}
    }


    function playWakeTone() {

        try {

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;


            if (!AudioContext) {
                return;
            }


            const context =
                new AudioContext();


            const oscillator =
                context.createOscillator();


            const gain =
                context.createGain();


            oscillator.frequency
                .setValueAtTime(
                    520,
                    context.currentTime
                );


            oscillator.frequency
                .exponentialRampToValueAtTime(
                    720,
                    context.currentTime +
                    0.12
                );


            gain.gain
                .setValueAtTime(
                    0.045,
                    context.currentTime
                );


            gain.gain
                .exponentialRampToValueAtTime(
                    0.0001,
                    context.currentTime +
                    0.18
                );


            oscillator.connect(gain);
            gain.connect(context.destination);

            oscillator.start();
            oscillator.stop(
                context.currentTime +
                0.18
            );

        } catch {}
    }


    /* ========================================================
       LIFECYCLE
       ======================================================== */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (document.hidden) {

                stopWakeRecognizer();
                stopCommandRecognizer();

                return;
            }


            if (
                state.enabled &&
                !state.awake
            ) {

                setTimeout(
                    startWakeListening,
                    500
                );
            }
        }
    );


    window.addEventListener(
        "pageshow",
        () => {

            if (
                state.enabled
            ) {

                setTimeout(
                    startWakeListening,
                    700
                );
            }
        }
    );


    function boot() {

        createUI();


        if (state.enabled) {

            setState(
                "Aprisha ready",
                "Say “Hey Aprisha”",
                "waiting"
            );


            /*
             * Browsers may still require one interaction after
             * reopening the PWA before microphone access resumes.
             */
            setTimeout(
                startWakeListening,
                900
            );
        }


        console.log(
            "✅ AP SYNAPSE — APRISHA UNIVERSAL READY"
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            boot,
            {
                once:
                    true
            }
        );

    }
    else {

        boot();
    }

})();
