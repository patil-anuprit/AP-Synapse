(() => {
    "use strict";

    /* =========================================================
       AP SYNAPSE
       APRISHA INSTANT PRESENCE MASTER
       ========================================================= */

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    const LOCAL =
        ["localhost", "127.0.0.1"]
            .includes(location.hostname);

    const API =
        LOCAL
            ? "http://localhost:5000/chat"
            : "https://api.ap-synapse.com/chat";


    const randomId = () => {

        try {
            return crypto.randomUUID();
        }
        catch {
            return (
                Date.now().toString(36) +
                Math.random()
                    .toString(36)
                    .slice(2)
            );
        }
    };


    const state = {

        enabled:
            localStorage.getItem(
                "apAprishaEnabled"
            ) !== "false",

        wakeActive:
            false,

        commandActive:
            false,

        awake:
            false,

        thinking:
            false,

        wakeRecognition:
            null,

        commandRecognition:
            null,

        stayUntil:
            0,

        restarting:
            false,

        sessionId:
            localStorage.getItem(
                "apAprishaSessionId"
            )
            ||
            (
                "aprisha-" +
                randomId()
            )
    };


    localStorage.setItem(
        "apAprishaSessionId",
        state.sessionId
    );


    const WAKE_FORMS = [
        "hey aprisha",
        "hey a prisha",
        "hey aprisa",
        "hey apreesha",
        "hey aprisha."
    ];


    /* =========================================================
       CREATE UI
       ========================================================= */

    function createUI() {

        if (
            document.getElementById(
                "apAprishaUniversal"
            )
        ) {
            return;
        }


        const root =
            document.createElement(
                "div"
            );


        root.id =
            "apAprishaUniversal";


        root.innerHTML = `

            <!-- ONE-TIME MICROPHONE ACTIVATION -->

            <div
                id="apAprishaPermission"
                class="ap-aprisha-permission"
                hidden
            >
                <div class="ap-aprisha-permission-mark">
                    AP
                </div>

                <div class="ap-aprisha-permission-copy">
                    <strong>
                        Enable Hey Aprisha
                    </strong>

                    <span>
                        One-time microphone permission
                    </span>
                </div>

                <button
                    id="apAprishaPermissionEnable"
                    type="button"
                >
                    Enable
                </button>
            </div>


            <!-- SMALL ALWAYS-AVAILABLE ORB -->

            <button
                id="apAprishaOrb"
                class="ap-aprisha-orb"
                type="button"
                aria-label="Open Aprisha"
                title="Aprisha"
            >
                <span>AP</span>
                <i></i>
            </button>


            <!-- EXISTING COMPATIBILITY PANEL -->

            <section
                id="apAprishaPanel"
                class="ap-aprisha-panel"
            >
                <header class="ap-aprisha-panel-head">

                    <div class="ap-aprisha-mini-brand">
                        <b>AP</b>

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

                <div class="ap-aprisha-actions">

                    <button
                        id="apAprishaEnable"
                        type="button"
                    >
                        Enable
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
                        Pause
                    </button>

                </div>
            </section>


            <!-- SIRI-LIKE INSTANT PRESENCE -->

            <section
                id="apAprishaSiri"
                class="ap-aprisha-siri"
                aria-hidden="true"
                aria-live="polite"
            >

                <div
                    class="ap-aprisha-siri-backdrop"
                    data-aprisha-close
                ></div>

                <div class="ap-aprisha-siri-card">

                    <div class="ap-aprisha-siri-top">

                        <div class="ap-aprisha-siri-name">
                            Aprisha
                        </div>

                        <button
                            id="apAprishaSiriClose"
                            type="button"
                            aria-label="Close Aprisha"
                        >
                            ×
                        </button>

                    </div>


                    <div
                        id="apAprishaSiriCore"
                        class="ap-aprisha-siri-core"
                        data-mode="ready"
                    >
                        <span class="r r1"></span>
                        <span class="r r2"></span>
                        <span class="r r3"></span>

                        <strong>
                            AP
                        </strong>
                    </div>


                    <div
                        id="apAprishaSiriStatus"
                        class="ap-aprisha-siri-status"
                    >
                        Aprisha
                    </div>


                    <div
                        id="apAprishaSiriText"
                        class="ap-aprisha-siri-text"
                    >
                        How can I help?
                    </div>


                    <div
                        id="apAprishaLiveTranscript"
                        class="ap-aprisha-live-transcript"
                    ></div>


                    <div class="ap-aprisha-siri-foot">

                        <button
                            id="apAprishaSiriMic"
                            type="button"
                        >
                            Speak
                        </button>

                        <button
                            id="apAprishaSiriPresence"
                            type="button"
                        >
                            Presence
                        </button>

                        <button
                            id="apAprishaSiriVision"
                            type="button"
                        >
                            Vision
                        </button>

                    </div>

                </div>

            </section>
        `;


        document.body.appendChild(
            root
        );


        bindUI();
    }


    /* =========================================================
       UI BINDINGS
       ========================================================= */

    function bindUI() {

        document
            .getElementById(
                "apAprishaOrb"
            )
            ?.addEventListener(
                "click",
                openPanel
            );


        document
            .getElementById(
                "apAprishaClose"
            )
            ?.addEventListener(
                "click",
                closePanel
            );


        document
            .getElementById(
                "apAprishaEnable"
            )
            ?.addEventListener(
                "click",
                enableAprisha
            );


        document
            .getElementById(
                "apAprishaPermissionEnable"
            )
            ?.addEventListener(
                "click",
                enableAprisha
            );


        document
            .getElementById(
                "apAprishaSpeak"
            )
            ?.addEventListener(
                "click",
                manualSpeak
            );


        document
            .getElementById(
                "apAprishaStop"
            )
            ?.addEventListener(
                "click",
                pauseAprisha
            );


        document
            .getElementById(
                "apAprishaSiriClose"
            )
            ?.addEventListener(
                "click",
                endPresence
            );


        document
            .querySelector(
                "[data-aprisha-close]"
            )
            ?.addEventListener(
                "click",
                endPresence
            );


        document
            .getElementById(
                "apAprishaSiriMic"
            )
            ?.addEventListener(
                "click",
                startCommandListening
            );


        document
            .getElementById(
                "apAprishaSiriPresence"
            )
            ?.addEventListener(
                "click",
                () => {

                    closeSiri();

                    window
                        .APAprishaPresence
                        ?.open?.();
                }
            );


        document
            .getElementById(
                "apAprishaSiriVision"
            )
            ?.addEventListener(
                "click",
                () => {

                    closeSiri();

                    window
                        .APAprishaVision
                        ?.open?.();
                }
            );
    }


    /* =========================================================
       DISPLAY
       ========================================================= */

    function openPanel() {

        document
            .getElementById(
                "apAprishaPanel"
            )
            ?.classList.add(
                "ap-open"
            );
    }


    function closePanel() {

        document
            .getElementById(
                "apAprishaPanel"
            )
            ?.classList.remove(
                "ap-open"
            );
    }


    function openSiri() {

        const siri =
            document.getElementById(
                "apAprishaSiri"
            );


        siri?.classList.add(
            "ap-open"
        );


        siri?.setAttribute(
            "aria-hidden",
            "false"
        );
    }


    function closeSiri() {

        const siri =
            document.getElementById(
                "apAprishaSiri"
            );


        siri?.classList.remove(
            "ap-open"
        );


        siri?.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    function modeFromState(
        label
    ) {

        const value =
            String(label || "")
                .toLowerCase();


        if (
            value.includes("listening")
        ) return "listening";


        if (
            value.includes("thinking")
        ) return "thinking";


        if (
            value.includes("speaking")
        ) return "speaking";


        if (
            value.includes("error") ||
            value.includes("permission") ||
            value.includes("unavailable")
        ) return "error";


        if (
            state.awake
        ) return "awake";


        return "ready";
    }


    function setState(
        label,
        text
    ) {

        const stateNode =
            document.getElementById(
                "apAprishaState"
            );


        const textNode =
            document.getElementById(
                "apAprishaText"
            );


        const siriStatus =
            document.getElementById(
                "apAprishaSiriStatus"
            );


        const siriText =
            document.getElementById(
                "apAprishaSiriText"
            );


        const core =
            document.getElementById(
                "apAprishaSiriCore"
            );


        if (stateNode) {

            stateNode.textContent =
                label;
        }


        if (textNode) {

            textNode.textContent =
                text;
        }


        if (siriStatus) {

            siriStatus.textContent =
                label;
        }


        if (siriText) {

            siriText.textContent =
                text;
        }


        if (core) {

            core.dataset.mode =
                modeFromState(
                    label
                );
        }
    }


    function setTranscript(
        text = ""
    ) {

        const node =
            document.getElementById(
                "apAprishaLiveTranscript"
            );


        if (node) {

            node.textContent =
                text;
        }
    }


    /* =========================================================
       MICROPHONE PERMISSION
       ========================================================= */

    async function permissionState() {

        try {

            if (
                !navigator.permissions
            ) {
                return "unknown";
            }


            const result =
                await navigator.permissions
                    .query({
                        name:
                            "microphone"
                    });


            return result.state;

        }
        catch {

            return "unknown";
        }
    }


    function showPermissionPrompt(
        show
    ) {

        const prompt =
            document.getElementById(
                "apAprishaPermission"
            );


        if (prompt) {

            prompt.hidden =
                !show;
        }
    }


    async function enableAprisha() {

        if (!SpeechRecognition) {

            setState(
                "Voice wake unavailable",
                "Use a supported browser or the microphone button."
            );

            openPanel();

            return;
        }


        try {

            /*
             * Explicitly request microphone once.
             */

            const stream =
                await navigator.mediaDevices
                    .getUserMedia({
                        audio:
                            true,

                        video:
                            false
                    });


            stream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );


            state.enabled =
                true;


            localStorage.setItem(
                "apAprishaEnabled",
                "true"
            );


            showPermissionPrompt(
                false
            );


            setState(
                "Aprisha ready",
                "Say “Hey Aprisha”"
            );


            startWakeListening();

        }
        catch (error) {

            console.warn(
                "Aprisha microphone:",
                error
            );


            setState(
                "Microphone permission needed",
                "Allow microphone access to enable Hey Aprisha."
            );


            showPermissionPrompt(
                true
            );


            openPanel();
        }
    }


    /* =========================================================
       WAKE DETECTION
       ========================================================= */

    function normalize(
        value
    ) {

        return String(
            value || ""
        )
            .toLowerCase()
            .replace(
                /[^\p{L}\p{N}\s]/gu,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }


    function detectWake(
        transcript
    ) {

        const value =
            normalize(
                transcript
            );


        for (
            const phrase of
            WAKE_FORMS
        ) {

            const normalizedPhrase =
                normalize(
                    phrase
                );


            const index =
                value.indexOf(
                    normalizedPhrase
                );


            if (
                index !== -1
            ) {

                const after =
                    value
                        .slice(
                            index +
                            normalizedPhrase.length
                        )
                        .trim();


                return {
                    detected:
                        true,

                    command:
                        after
                };
            }
        }


        return {
            detected:
                false,

            command:
                ""
        };
    }


    function stopWakeListening() {

        const recognition =
            state.wakeRecognition;


        state.wakeRecognition =
            null;


        state.wakeActive =
            false;


        if (!recognition) {
            return;
        }


        recognition.onend =
            null;


        recognition.onerror =
            null;


        try {
            recognition.stop();
        }
        catch {}


        try {
            recognition.abort();
        }
        catch {}
    }


    function startWakeListening() {

        if (
            !SpeechRecognition ||
            !state.enabled ||
            state.awake ||
            state.commandActive ||
            state.thinking ||
            document.hidden ||
            state.wakeActive
        ) {

            return;
        }


        stopWakeListening();


        const recognition =
            new SpeechRecognition();


        state.wakeRecognition =
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


        recognition.onstart =
            () => {

                state.wakeActive =
                    true;


                setState(
                    "Aprisha ready",
                    "Say “Hey Aprisha”"
                );
            };


        recognition.onresult =
            event => {

                let combined =
                    "";


                for (
                    let index =
                        event.resultIndex;

                    index <
                    event.results.length;

                    index++
                ) {

                    combined +=
                        " " +
                        event.results[index][0]
                            .transcript;
                }


                const result =
                    detectWake(
                        combined
                    );


                if (
                    result.detected
                ) {

                    wakeAprisha(
                        result.command
                    );
                }
            };


        recognition.onerror =
            event => {

                state.wakeActive =
                    false;


                if (
                    event.error ===
                    "not-allowed" ||
                    event.error ===
                    "service-not-allowed"
                ) {

                    showPermissionPrompt(
                        true
                    );


                    setState(
                        "Enable Hey Aprisha",
                        "Microphone permission is required once."
                    );


                    return;
                }


                restartWake();
            };


        recognition.onend =
            () => {

                state.wakeActive =
                    false;


                restartWake();
            };


        try {

            recognition.start();

        }
        catch {

            restartWake();
        }
    }


    function restartWake() {

        if (
            state.restarting ||
            !state.enabled ||
            state.awake ||
            state.commandActive ||
            state.thinking ||
            document.hidden
        ) {
            return;
        }


        state.restarting =
            true;


        setTimeout(
            () => {

                state.restarting =
                    false;

                startWakeListening();

            },
            450
        );
    }


    /* =========================================================
       WAKE RESPONSE
       ========================================================= */

    async function wakeAprisha(
        immediateCommand = ""
    ) {

        if (
            state.awake ||
            state.thinking
        ) {
            return;
        }


        /*
         * Completely release the wake recognizer first.
         * Chrome/Android can otherwise keep the microphone
         * attached to the old SpeechRecognition session.
         */

        stopWakeListening();


        state.awake =
            true;


        state.commandActive =
            false;


        state.stayUntil =
            Date.now() +
            60000;


        openSiri();


        setTranscript("");


        setState(
            "Aprisha",
            "How can I help?"
        );


        feedback();


        /*
         * Give Chrome a moment to release wake recognition.
         */

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    250
                )
        );


        if (
            immediateCommand &&
            immediateCommand.trim().length > 2
        ) {

            await speak(
                "I'm listening."
            );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        260
                    )
            );


            executeCommand(
                immediateCommand.trim()
            );


            return;
        }


        /*
         * Speak first.
         * The new speak() always resolves even when
         * Chrome fails to fire SpeechSynthesis onend.
         */

        await speak(
            "How can I help?"
        );


        /*
         * Critical microphone handoff delay.
         */

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    420
                )
        );


        if (
            !state.awake ||
            state.thinking
        ) {
            return;
        }


        setState(
            "Listening",
            "I'm listening…"
        );


        startCommandListening();
    }

    /* =========================================================
       COMMAND LISTENER
       ========================================================= */

    function stopCommandListening() {

        const recognition =
            state.commandRecognition;


        state.commandRecognition =
            null;


        state.commandActive =
            false;


        if (!recognition) {
            return;
        }


        recognition.onstart =
            null;

        recognition.onresult =
            null;

        recognition.onspeechstart =
            null;

        recognition.onspeechend =
            null;

        recognition.onend =
            null;

        recognition.onerror =
            null;


        try {

            recognition.stop();

        }
        catch {}


        try {

            recognition.abort();

        }
        catch {}
    }


    function startCommandListening(
        retryAttempt = 0
    ) {

        if (
            !SpeechRecognition ||
            state.thinking ||
            !state.awake ||
            document.hidden
        ) {

            return;
        }


        /*
         * Never let wake recognition compete for microphone.
         */

        stopWakeListening();


        if (
            state.commandRecognition
        ) {

            stopCommandListening();
        }


        openSiri();


        setTranscript("");


        /*
         * Small handoff period is important on Android Chrome.
         */

        setTimeout(
            () =>
                launchCommandRecognition(
                    retryAttempt
                ),
            retryAttempt === 0
                ? 220
                : 500
        );
    }


    function launchCommandRecognition(
        retryAttempt = 0
    ) {

        if (
            !state.awake ||
            state.thinking ||
            document.hidden
        ) {

            return;
        }


        /*
         * Another recognizer may already have successfully
         * started while a retry timer was waiting.
         */

        if (
            state.commandActive
        ) {

            return;
        }


        let recognition;


        try {

            recognition =
                new SpeechRecognition();

        }
        catch (error) {

            console.error(
                "Aprisha recognition creation:",
                error
            );

            return;
        }


        state.commandRecognition =
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


        let transcript =
            "";


        let commandExecuted =
            false;


        let heardSpeech =
            false;


        recognition.onstart =
            () => {

                state.commandActive =
                    true;


                setState(
                    "Listening",
                    "I'm listening…"
                );


                setTranscript("");


                console.log(
                    "🎙️ APRISHA COMMAND LISTENER ACTIVE"
                );
            };


        recognition.onspeechstart =
            () => {

                heardSpeech =
                    true;


                setState(
                    "Listening",
                    "Go ahead…"
                );
            };


        recognition.onresult =
            event => {

                /*
                 * Reconstruct the ENTIRE recognition result.
                 * This is much more reliable than only reading
                 * event.resultIndex on Android Chrome.
                 */

                let full =
                    "";


                let hasFinal =
                    false;


                for (
                    let index = 0;
                    index <
                    event.results.length;
                    index++
                ) {

                    const result =
                        event.results[index];


                    if (
                        result &&
                        result[0] &&
                        result[0].transcript
                    ) {

                        full +=
                            (
                                full
                                    ? " "
                                    : ""
                            )
                            +
                            result[0]
                                .transcript;
                    }


                    if (
                        result.isFinal
                    ) {

                        hasFinal =
                            true;
                    }
                }


                transcript =
                    full.trim();


                if (
                    transcript
                ) {

                    heardSpeech =
                        true;


                    setTranscript(
                        transcript
                    );


                    setState(
                        "Listening",
                        transcript
                    );
                }


                if (
                    hasFinal &&
                    transcript &&
                    !commandExecuted
                ) {

                    commandExecuted =
                        true;


                    console.log(
                        "✅ APRISHA HEARD:",
                        transcript
                    );


                    /*
                     * Stop recognizer before calling AP Synapse.
                     */

                    recognition.onend =
                        null;


                    recognition.onerror =
                        null;


                    state.commandActive =
                        false;


                    state.commandRecognition =
                        null;


                    try {

                        recognition.stop();

                    }
                    catch {}


                    executeCommand(
                        transcript
                    );
                }
            };


        recognition.onspeechend =
            () => {

                /*
                 * Android sometimes provides a useful interim
                 * transcript but never marks it final.
                 * Calling stop() asks Chrome to finalize it.
                 */

                if (
                    transcript &&
                    !commandExecuted
                ) {

                    try {

                        recognition.stop();

                    }
                    catch {}
                }
            };


        recognition.onerror =
            event => {

                state.commandActive =
                    false;


                if (
                    state.commandRecognition ===
                    recognition
                ) {

                    state.commandRecognition =
                        null;
                }


                console.warn(
                    "Aprisha recognition:",
                    event.error
                );


                if (
                    commandExecuted
                ) {

                    return;
                }


                if (
                    event.error ===
                        "not-allowed" ||
                    event.error ===
                        "service-not-allowed"
                ) {

                    setState(
                        "Microphone permission needed",
                        "Allow microphone access for Aprisha."
                    );


                    const permissionBar =
                        document.getElementById(
                            "apAprishaPermission"
                        );


                    if (
                        permissionBar
                    ) {

                        permissionBar.hidden =
                            false;
                    }


                    return;
                }


                /*
                 * Android/Chrome regularly produces
                 * aborted/network/no-speech during microphone
                 * transitions. Retry automatically.
                 */

                if (
                    (
                        event.error ===
                            "aborted" ||
                        event.error ===
                            "no-speech" ||
                        event.error ===
                            "audio-capture" ||
                        event.error ===
                            "network"
                    )
                    &&
                    retryAttempt < 4
                    &&
                    state.awake
                ) {

                    setState(
                        "Listening",
                        "I'm listening…"
                    );


                    setTimeout(
                        () =>
                            startCommandListening(
                                retryAttempt + 1
                            ),
                        550
                    );


                    return;
                }


                continueOrSleep();
            };


        recognition.onend =
            () => {

                state.commandActive =
                    false;


                if (
                    state.commandRecognition ===
                    recognition
                ) {

                    state.commandRecognition =
                        null;
                }


                if (
                    commandExecuted
                ) {

                    return;
                }


                /*
                 * IMPORTANT:
                 * Some mobile browsers return transcript and
                 * immediately end without an isFinal result.
                 * Do NOT throw that speech away.
                 */

                if (
                    transcript.trim()
                ) {

                    commandExecuted =
                        true;


                    console.log(
                        "✅ APRISHA HEARD ON END:",
                        transcript
                    );


                    executeCommand(
                        transcript.trim()
                    );


                    return;
                }


                /*
                 * Nothing was heard.
                 * Keep listening instead of silently dying.
                 */

                if (
                    state.awake &&
                    Date.now() <
                        state.stayUntil
                ) {

                    setState(
                        "Listening",
                        heardSpeech
                            ? "Go ahead…"
                            : "I'm listening…"
                    );


                    setTimeout(
                        () =>
                            startCommandListening(
                                Math.min(
                                    retryAttempt + 1,
                                    4
                                )
                            ),
                        500
                    );


                    return;
                }


                continueOrSleep();
            };


        try {

            recognition.start();

        }
        catch (error) {

            state.commandActive =
                false;


            state.commandRecognition =
                null;


            console.warn(
                "Aprisha listener start retry:",
                error
            );


            if (
                retryAttempt < 4 &&
                state.awake
            ) {

                setTimeout(
                    () =>
                        startCommandListening(
                            retryAttempt + 1
                        ),
                    650
                );

            }
            else {

                setState(
                    "Aprisha",
                    "Tap Speak and try again."
                );
            }
        }
    }


    function manualSpeak() {

        /*
         * Manual microphone button must always work,
         * even if the wake listener is currently active.
         */

        stopWakeListening();


        state.awake =
            true;


        state.stayUntil =
            Date.now() +
            60000;


        openSiri();


        setState(
            "Listening",
            "I'm listening…"
        );


        startCommandListening();
    }

    /* =========================================================
       AP SYNAPSE ACTION ENGINE
       ========================================================= */

    function visibleControls() {

        return [
            ...document.querySelectorAll(
                `
                button,
                a,
                [role="button"],
                [data-page],
                [data-route],
                [data-workspace]
                `
            )
        ].filter(
            element => {

                if (
                    element.closest(
                        "#apAprishaUniversal"
                    )
                ) {

                    return false;
                }


                const style =
                    getComputedStyle(
                        element
                    );


                return (
                    style.display !==
                    "none"
                    &&
                    style.visibility !==
                    "hidden"
                );
            }
        );
    }


    function clickByText(
        possibilities
    ) {

        const wanted =
            possibilities.map(
                value =>
                    normalize(value)
            );


        const controls =
            visibleControls();


        /*
         * Exact label first.
         */

        for (
            const control of
            controls
        ) {

            const text =
                normalize(
                    control.innerText ||
                    control.textContent ||
                    control.getAttribute(
                        "aria-label"
                    ) ||
                    control.getAttribute(
                        "title"
                    ) ||
                    ""
                );


            if (
                wanted.includes(
                    text
                )
            ) {

                control.click();

                return true;
            }
        }


        /*
         * Then partial label.
         */

        for (
            const control of
            controls
        ) {

            const text =
                normalize(
                    control.innerText ||
                    control.textContent ||
                    control.getAttribute(
                        "aria-label"
                    ) ||
                    control.getAttribute(
                        "title"
                    ) ||
                    ""
                );


            if (
                wanted.some(
                    item =>
                        text.includes(item)
                )
            ) {

                control.click();

                return true;
            }
        }


        return false;
    }


    function sendToMainChat(
        text
    ) {

        const input =
            document.getElementById(
                "userInput"
            );


        const send =
            document.getElementById(
                "sendBtn"
            );


        if (
            !input ||
            !send
        ) {

            return false;
        }


        if (
            "value" in input
        ) {

            input.value =
                text;
        }
        else {

            input.textContent =
                text;
        }


        input.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles:
                        true
                }
            )
        );


        send.click();


        return true;
    }


    function latestAssistantText() {

        const messages =
            [
                ...document.querySelectorAll(
                    `
                    .message.ai,
                    .message.assistant,
                    .assistant-message,
                    .ai-message,
                    .bot-message,
                    [data-role="assistant"]
                    `
                )
            ];


        const last =
            messages[
                messages.length - 1
            ];


        return String(
            last?.innerText || ""
        )
            .replace(
                /\bCopy\b/gi,
                ""
            )
            .replace(
                /\bRead\b/gi,
                ""
            )
            .trim();
    }


    async function executeCommand(
        raw
    ) {

        const command =
            normalize(
                raw
            );


        setTranscript(
            raw
        );


        /* STOP */

        if (
            /^(stop|cancel|goodbye|bye|close aprisha)$/
                .test(command)
        ) {

            await speak(
                "Okay."
            );


            endPresence();

            return;
        }


        /* STAY WITH ME */

        if (
            command.includes(
                "stay with me"
            )
        ) {

            state.stayUntil =
                Date.now() +
                120000;


            setState(
                "Aprisha",
                "I'm here."
            );


            await speak(
                "I'm here. You can keep talking."
            );


            continueOrSleep();

            return;
        }


        /* APRISHA VISION */

        if (
            command.includes(
                "vision"
            )
            ||
            command.includes(
                "what am i looking at"
            )
            ||
            command.includes(
                "use camera"
            )
        ) {

            await speak(
                "Opening Vision."
            );


            closeSiri();


            window
                .APAprishaVision
                ?.open?.();


            resetPresenceState();

            return;
        }


        /* FULL PRESENCE */

        if (
            command.includes(
                "open presence"
            )
            ||
            command.includes(
                "presence mode"
            )
        ) {

            await speak(
                "Opening Presence."
            );


            closeSiri();


            window
                .APAprishaPresence
                ?.open?.();


            resetPresenceState();

            return;
        }


        /* NEW CHAT */

        if (
            /new (chat|conversation)/
                .test(command)
        ) {

            const success =
                document.querySelector(
                    ".new-chat-btn"
                )
                    ?.click?.();


            await speak(
                "Starting a new conversation."
            );


            endPresence();

            return;
        }


        /* CODE STUDIO */

        if (
            command.includes(
                "code studio"
            )
            ||
            command === "coding"
        ) {

            const success =
                clickByText([
                    "Code Studio",
                    "Code"
                ]);


            await speak(
                success
                    ? "Opening Code Studio."
                    : "I couldn't locate Code Studio."
            );


            endPresence();

            return;
        }


        /* DOCUMENTS */

        if (
            command.includes(
                "documents"
            )
            ||
            command.includes(
                "document intelligence"
            )
        ) {

            const success =
                clickByText([
                    "Documents",
                    "Document Intelligence"
                ]);


            await speak(
                success
                    ? "Opening Documents."
                    : "I couldn't locate Documents."
            );


            endPresence();

            return;
        }


        /* WHITEBOARD / CANVAS */

        if (
            command.includes(
                "whiteboard"
            )
            ||
            command === "canvas"
            ||
            command.includes(
                "open canvas"
            )
        ) {

            const success =
                clickByText([
                    "Whiteboard",
                    "Canvas"
                ]);


            await speak(
                success
                    ? "Opening the canvas."
                    : "I couldn't locate the canvas."
            );


            endPresence();

            return;
        }


        /* PROJECTS */

        if (
            command.includes(
                "projects"
            )
            ||
            command.includes(
                "open project"
            )
        ) {

            const success =
                clickByText([
                    "Projects",
                    "Project"
                ]);


            await speak(
                success
                    ? "Opening Projects."
                    : "I couldn't locate Projects."
            );


            endPresence();

            return;
        }


        /* SETTINGS */

        if (
            command.includes(
                "settings"
            )
        ) {

            const success =
                clickByText([
                    "Settings"
                ]);


            await speak(
                success
                    ? "Opening Settings."
                    : "I couldn't locate Settings."
            );


            endPresence();

            return;
        }


        /* WEB SEARCH */

        if (
            command.includes(
                "turn on web"
            )
            ||
            command.includes(
                "enable web"
            )
            ||
            command ===
                "web search"
        ) {

            const button =
                document.getElementById(
                    "webBtn"
                );


            if (
                button &&
                !button.classList
                    .contains("active")
            ) {

                button.click();
            }


            await speak(
                "Web search is enabled."
            );


            continueOrSleep();

            return;
        }


        if (
            command.includes(
                "turn off web"
            )
            ||
            command.includes(
                "disable web"
            )
        ) {

            const button =
                document.getElementById(
                    "webBtn"
                );


            if (
                button &&
                button.classList
                    .contains("active")
            ) {

                button.click();
            }


            await speak(
                "Web search is off."
            );


            continueOrSleep();

            return;
        }


        /* DEEP THINK */

        if (
            command.includes(
                "enable deep think"
            )
            ||
            command.includes(
                "turn on deep think"
            )
        ) {

            const button =
                document.getElementById(
                    "deepThinkBtn"
                );


            if (
                button &&
                !button.classList
                    .contains("active")
            ) {

                button.click();
            }


            await speak(
                "Deep Think is enabled."
            );


            continueOrSleep();

            return;
        }


        /* READ LATEST RESPONSE */

        if (
            command.includes(
                "read this"
            )
            ||
            command.includes(
                "read the answer"
            )
            ||
            command.includes(
                "read latest"
            )
        ) {

            const text =
                latestAssistantText();


            if (text) {

                setState(
                    "Speaking",
                    text
                );


                await speak(
                    text
                );
            }
            else {

                await speak(
                    "There isn't an answer to read yet."
                );
            }


            continueOrSleep();

            return;
        }


        /* STOP SPEAKING */

        if (
            command.includes(
                "stop reading"
            )
            ||
            command.includes(
                "stop speaking"
            )
        ) {

            window.speechSynthesis
                ?.cancel();


            continueOrSleep();

            return;
        }


        /* IMAGE GENERATION -> NORMAL CHAT UI */

        if (
            /\b(create|generate|draw|make)\b.*\b(image|picture|photo|illustration)\b/
                .test(command)
        ) {

            const success =
                sendToMainChat(
                    raw
                );


            await speak(
                success
                    ? "I'll create that in AP Synapse."
                    : "I couldn't open the image request."
            );


            endPresence();

            return;
        }


        /*
         * EVERYTHING ELSE:
         * AP Synapse intelligence.
         */

        await askAP(
            raw
        );
    }


    /* =========================================================
       AP INTELLIGENCE
       ========================================================= */

    async function askAP(
        message
    ) {

        state.thinking =
            true;


        setState(
            "Thinking",
            message
        );


        try {

            const web =
                document
                    .getElementById(
                        "webBtn"
                    )
                    ?.classList
                    .contains(
                        "active"
                    )
                ||
                /\b(search|look up|latest|current|today)\b/
                    .test(
                        normalize(
                            message
                        )
                    );


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
                                message,
                                web,
                                source:
                                    "aprisha-instant-presence"
                            })
                    }
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }


            const result =
                await readResponse(
                    response
                );


            state.thinking =
                false;


            /*
             * Image response.
             */

            if (
                result.type ===
                "image"
                &&
                result.url
            ) {

                setState(
                    "Aprisha",
                    "Your image is ready in AP Synapse."
                );


                sendToMainChat(
                    message
                );


                await speak(
                    "Your image request is ready in AP Synapse."
                );


                endPresence();

                return;
            }


            const answer =
                cleanForSpeech(
                    result.text
                )
                ||
                "I couldn't create a response for that.";


            setState(
                "Aprisha",
                answer
            );


            await speak(
                answer
            );


            continueOrSleep();

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
                "I couldn't reach AP Synapse right now."
            );


            await speak(
                "I couldn't reach AP Synapse right now."
            );


            continueOrSleep();
        }
    }


    async function readResponse(
        response
    ) {

        if (
            !response.body
        ) {

            const raw =
                await response.text();


            return parseRaw(
                raw
            );
        }


        const reader =
            response.body
                .getReader();


        const decoder =
            new TextDecoder();


        let raw =
            "";


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


        return parseRaw(
            raw
        );
    }


    function parseRaw(
        raw
    ) {

        const value =
            String(raw || "")
                .trim();


        if (!value) {

            return {
                type:
                    "text",

                text:
                    ""
            };
        }


        try {

            const json =
                JSON.parse(
                    value
                );


            if (
                json.type ===
                "image"
                &&
                json.url
            ) {

                return {
                    type:
                        "image",

                    url:
                        json.url,

                    text:
                        ""
                };
            }


            return {
                type:
                    "text",

                text:
                    (
                        json.reply ||
                        json.response ||
                        json.answer ||
                        json.content ||
                        json.text ||
                        json.message?.content ||
                        ""
                    )
            };

        }
        catch {}


        let output =
            "";


        for (
            let line of
            value.split(
                /\r?\n/
            )
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
                line ===
                "[DONE]"
            ) {

                continue;
            }


            try {

                const json =
                    JSON.parse(
                        line
                    );


                output +=
                    (
                        json.delta?.content ||
                        json.content ||
                        json.text ||
                        json.response ||
                        json.reply ||
                        ""
                    );

            }
            catch {

                output +=
                    (
                        output
                            ? "\n"
                            : ""
                    )
                    +
                    line;
            }
        }


        return {
            type:
                "text",

            text:
                output ||
                value
        };
    }


    /* =========================================================
       SPEECH
       ========================================================= */

    function cleanForSpeech(
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


    function speak(
        text
    ) {

        return new Promise(
            resolve => {

                const spokenText =
                    cleanForSpeech(
                        text
                    );


                if (
                    !spokenText ||
                    !(
                        "speechSynthesis"
                        in window
                    )
                ) {

                    resolve();

                    return;
                }


                let finished =
                    false;


                let safetyTimer =
                    null;


                const finish =
                    () => {

                        if (
                            finished
                        ) {

                            return;
                        }


                        finished =
                            true;


                        if (
                            safetyTimer
                        ) {

                            clearTimeout(
                                safetyTimer
                            );
                        }


                        resolve();
                    };


                try {

                    window
                        .speechSynthesis
                        .cancel();

                }
                catch {}


                const speech =
                    new SpeechSynthesisUtterance(
                        spokenText
                    );


                speech.lang =
                    navigator.language ||
                    "en-IN";


                speech.rate =
                    1.02;


                speech.pitch =
                    1;


                speech.volume =
                    1;


                speech.onend =
                    finish;


                speech.onerror =
                    finish;


                /*
                 * Critical fallback.
                 *
                 * Chrome can audibly finish the sentence but
                 * occasionally omit the onend callback.
                 * Aprisha must never get stuck because of that.
                 */

                const estimatedMs =
                    Math.max(
                        1800,
                        Math.min(
                            60000,
                            (
                                spokenText.length *
                                72
                            )
                            +
                            1200
                        )
                    );


                safetyTimer =
                    setTimeout(
                        finish,
                        estimatedMs
                    );


                /*
                 * Chrome behaves more reliably when speak()
                 * is not issued in the same event cycle as
                 * speechSynthesis.cancel().
                 */

                setTimeout(
                    () => {

                        if (
                            finished
                        ) {

                            return;
                        }


                        try {

                            window
                                .speechSynthesis
                                .speak(
                                    speech
                                );

                        }
                        catch (
                            error
                        ) {

                            console.warn(
                                "Aprisha speech:",
                                error
                            );


                            finish();
                        }

                    },
                    60
                );
            }
        );
    }

    /* =========================================================
       FOLLOW-UP MODE
       ========================================================= */

    function continueOrSleep() {

        state.thinking =
            false;


        if (
            Date.now() <
            state.stayUntil
        ) {

            state.awake =
                true;


            setState(
                "Listening",
                "Anything else?"
            );


            setTimeout(
                startCommandListening,
                420
            );

            return;
        }


        endPresence();
    }


    function resetPresenceState() {

        state.awake =
            false;

        state.commandActive =
            false;

        state.thinking =
            false;

        state.stayUntil =
            0;


        setState(
            "Aprisha ready",
            "Say “Hey Aprisha”"
        );


        restartWake();
    }


    function endPresence() {

        stopCommandListening();


        window.speechSynthesis
            ?.cancel();


        closeSiri();


        resetPresenceState();
    }


    function pauseAprisha() {

        state.enabled =
            false;


        localStorage.setItem(
            "apAprishaEnabled",
            "false"
        );


        stopWakeListening();
        stopCommandListening();


        window.speechSynthesis
            ?.cancel();


        closeSiri();


        setState(
            "Aprisha paused",
            "Tap Enable to reactivate Hey Aprisha."
        );
    }


    /* =========================================================
       FEEDBACK
       ========================================================= */

    function feedback() {

        try {

            navigator.vibrate?.(
                [20, 25, 38]
            );

        }
        catch {}


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
                    760,
                    context.currentTime +
                    .13
                );


            gain.gain
                .setValueAtTime(
                    .035,
                    context.currentTime
                );


            gain.gain
                .exponentialRampToValueAtTime(
                    .0001,
                    context.currentTime +
                    .18
                );


            oscillator.connect(
                gain
            );


            gain.connect(
                context.destination
            );


            oscillator.start();


            oscillator.stop(
                context.currentTime +
                .18
            );
        }
        catch {}
    }


    /* =========================================================
       AUTO-ARM FROM WEBSITE OPEN
       ========================================================= */

    async function autoArm() {

        if (
            !state.enabled
        ) {

            setState(
                "Aprisha paused",
                "Tap Enable to reactivate."
            );

            return;
        }


        if (
            !SpeechRecognition
        ) {

            setState(
                "Voice wake unavailable",
                "Use the Aprisha microphone button."
            );

            return;
        }


        const permission =
            await permissionState();


        if (
            permission ===
            "granted"
        ) {

            showPermissionPrompt(
                false
            );


            startWakeListening();

            return;
        }


        /*
         * First device visit:
         * browsers require microphone permission.
         */

        showPermissionPrompt(
            true
        );


        setState(
            "Enable Hey Aprisha",
            "Allow microphone once. Future visits will arm automatically."
        );


        /*
         * After any normal interaction, try to resume
         * automatically if permission changed.
         */

        document.addEventListener(
            "pointerdown",
            async () => {

                const result =
                    await permissionState();


                if (
                    result ===
                    "granted"
                ) {

                    showPermissionPrompt(
                        false
                    );


                    startWakeListening();
                }
            },
            {
                once:
                    true,

                capture:
                    true
            }
        );
    }


    /* =========================================================
       PAGE LIFECYCLE
       ========================================================= */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.hidden
            ) {

                stopWakeListening();
                stopCommandListening();

                return;
            }


            if (
                state.enabled &&
                !state.awake
            ) {

                setTimeout(
                    startWakeListening,
                    350
                );
            }
        }
    );


    window.addEventListener(
        "focus",
        () => {

            if (
                state.enabled &&
                !state.awake
            ) {

                setTimeout(
                    startWakeListening,
                    300
                );
            }
        }
    );


    window.addEventListener(
        "pageshow",
        () => {

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


    /* =========================================================
       PUBLIC APRISHA API
       ========================================================= */

    window.APAprisha = {

        wake:
            () =>
                wakeAprisha(),

        listen:
            startCommandListening,

        ask:
            askAP,

        execute:
            executeCommand,

        enable:
            enableAprisha,

        pause:
            pauseAprisha,

        open:
            openSiri,

        close:
            endPresence
    };


    /* =========================================================
       BOOT
       ========================================================= */

    function boot() {

        createUI();


        setState(
            "Aprisha ready",
            "Say “Hey Aprisha”"
        );


        autoArm();


        console.log(
            "✅ AP SYNAPSE — APRISHA INSTANT PRESENCE READY"
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
