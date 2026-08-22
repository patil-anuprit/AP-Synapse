(() => {
    "use strict";

    /*
     * =========================================================
     * AP SYNAPSE · APRISHA PRESENCE ENGINE V12
     *
     * ONE microphone owner.
     * ONE wake engine.
     * ONE command engine.
     * ONE conversation lifecycle.
     * =========================================================
     */

    if (window.__AP_APRISHA_V12__) {
        return;
    }

    window.__AP_APRISHA_V12__ = true;


    const Recognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    const LOCAL =
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";


    const API =
        LOCAL
            ? "http://localhost:5000/chat"
            : "https://api.ap-synapse.com/chat";


    const SESSION_KEY =
        "apAprishaSessionId";


    const ENABLED_KEY =
        "apAprishaEnabled";


    const MIC_KEY =
        "apAprishaMicGranted";


    const randomId = () => {

        try {
            return crypto.randomUUID();
        }
        catch {
            return (
                Date.now().toString(36) +
                Math.random().toString(36).slice(2)
            );
        }
    };


    const state = {

        enabled:
            localStorage.getItem(ENABLED_KEY) !== "false",

        permission:
            false,

        mode:
            "idle",

        recognizer:
            null,

        recognizerToken:
            0,

        awake:
            false,

        thinking:
            false,

        speaking:
            false,

        stayUntil:
            0,

        wakeRestartTimer:
            null,

        commandRestartTimer:
            null,

        sessionId:
            localStorage.getItem(SESSION_KEY) ||
            (
                "aprisha-" +
                randomId()
            )
    };


    localStorage.setItem(
        SESSION_KEY,
        state.sessionId
    );


    /*
     * Different browsers can transcribe Aprisha differently.
     */

    const WAKE_PATTERNS = [
        "hey aprisha",
        "hey a prisha",
        "hey aprisa",
        "hey apreesha",
        "hi aprisha"
    ];


    /* =========================================================
       UTILITIES
       ========================================================= */

    function normalize(text) {

        return String(text || "")
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, " ")
            .replace(/\s+/g, " ")
            .trim();
    }


    function sleep(ms) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
        );
    }


    function isMobile() {

        return (
            matchMedia("(max-width: 760px)").matches ||
            /Android|iPhone|iPad|Mobile/i.test(
                navigator.userAgent
            )
        );
    }


    function vibrate(pattern = [18, 22, 30]) {

        try {
            navigator.vibrate?.(pattern);
        }
        catch {}
    }


    /* =========================================================
       CREATE UI
       ========================================================= */

    function buildUI() {

        document
            .getElementById(
                "apAprishaUniversal"
            )
            ?.remove();


        const root =
            document.createElement("div");


        root.id =
            "apAprishaUniversal";


        root.innerHTML = `

            <div
                id="apAprishaPermission"
                class="ap-aprisha-permission"
                hidden
            >
                <div class="ap-aprisha-permission-icon">
                    AP
                </div>

                <div class="ap-aprisha-permission-copy">
                    <strong>
                        Enable Hey Aprisha
                    </strong>

                    <span>
                        Allow microphone once
                    </span>
                </div>

                <button
                    id="apAprishaPermissionEnable"
                    type="button"
                >
                    Enable
                </button>
            </div>


            <button
                id="apAprishaOrb"
                class="ap-aprisha-orb"
                type="button"
                aria-label="Aprisha"
            >
                <span>AP</span>
                <i></i>
            </button>


            <section
                id="apAprishaPanel"
                class="ap-aprisha-panel"
            >
                <header>

                    <div class="ap-aprisha-brand">
                        <b>AP</b>

                        <div>
                            <strong>Aprisha</strong>
                            <span>AP Presence</span>
                        </div>
                    </div>

                    <button
                        id="apAprishaClose"
                        type="button"
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


            <section
                id="apAprishaSiri"
                class="ap-aprisha-siri"
                aria-hidden="true"
            >

                <div
                    class="ap-aprisha-backdrop"
                id="apAprishaBackdrop"
                ></div>


                <article
                    class="ap-aprisha-presence"
                >

                    <header
                        class="ap-aprisha-presence-header"
                    >

                        <span>
                            Aprisha
                        </span>

                        <button
                            id="apAprishaSiriClose"
                            type="button"
                            aria-label="Close Aprisha"
                        >
                            ×
                        </button>

                    </header>


                    <div
                        id="apAprishaSiriCore"
                        class="ap-aprisha-core"
                        data-mode="idle"
                    >

                        <i class="ring ring1"></i>
                        <i class="ring ring2"></i>
                        <i class="ring ring3"></i>
                        <i class="ring ring4"></i>

                        <b>
                            AP
                        </b>

                    </div>


                    <div
                        id="apAprishaSiriStatus"
                        class="ap-aprisha-status"
                    >
                        Aprisha
                    </div>


                    <div
                        id="apAprishaSiriText"
                        class="ap-aprisha-main-text"
                    >
                        How can I help?
                    </div>


                    <div
                        id="apAprishaLiveTranscript"
                        class="ap-aprisha-transcript"
                    ></div>


                    <footer
                        class="ap-aprisha-presence-actions"
                    >

                        <button
                            id="apAprishaSiriMic"
                            type="button"
                        >
                            Speak
                        </button>

                        <button
                            id="apAprishaSiriVision"
                            type="button"
                        >
                            Vision
                        </button>

                        <button
                            id="apAprishaSiriPresence"
                            type="button"
                        >
                            Presence
                        </button>

                    </footer>

                </article>

            </section>
        `;


        document.body.appendChild(
            root
        );


        bindUI();
    }


    /* =========================================================
       UI
       ========================================================= */

    function openPresence() {

        const panel =
            document.getElementById(
                "apAprishaSiri"
            );


        panel?.classList.add(
            "ap-open"
        );


        panel?.setAttribute(
            "aria-hidden",
            "false"
        );
    }


    function closePresence() {

        const panel =
            document.getElementById(
                "apAprishaSiri"
            );


        panel?.classList.remove(
            "ap-open"
        );


        panel?.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    function openMiniPanel() {

        document
            .getElementById(
                "apAprishaPanel"
            )
            ?.classList.add(
                "ap-open"
            );
    }


    function closeMiniPanel() {

        document
            .getElementById(
                "apAprishaPanel"
            )
            ?.classList.remove(
                "ap-open"
            );
    }


    function setUI(
        mode,
        title,
        text
    ) {

        state.mode =
            mode;


        const miniState =
            document.getElementById(
                "apAprishaState"
            );


        const miniText =
            document.getElementById(
                "apAprishaText"
            );


        const status =
            document.getElementById(
                "apAprishaSiriStatus"
            );


        const main =
            document.getElementById(
                "apAprishaSiriText"
            );


        const core =
            document.getElementById(
                "apAprishaSiriCore"
            );


        if (miniState) {

            miniState.textContent =
                title;
        }


        if (miniText) {

            miniText.textContent =
                text;
        }


        if (status) {

            status.textContent =
                title;
        }


        if (main) {

            main.textContent =
                text;
        }


        if (core) {

            core.dataset.mode =
                mode;
        }
    }


    function transcript(text = "") {

        const node =
            document.getElementById(
                "apAprishaLiveTranscript"
            );


        if (node) {

            node.textContent =
                text;
        }
    }


    function showPermission(
        show
    ) {

        const node =
            document.getElementById(
                "apAprishaPermission"
            );


        if (node) {

            node.hidden =
                !show;
        }
    }


    /* =========================================================
       EXACTLY ONE MICROPHONE OWNER
       ========================================================= */

    function destroyRecognizer() {

        state.recognizerToken++;


        clearTimeout(
            state.wakeRestartTimer
        );


        clearTimeout(
            state.commandRestartTimer
        );


        const recognizer =
            state.recognizer;


        state.recognizer =
            null;


        if (!recognizer) {
            return;
        }


        recognizer.onstart =
            null;

        recognizer.onresult =
            null;

        recognizer.onend =
            null;

        recognizer.onerror =
            null;

        recognizer.onaudiostart =
            null;

        recognizer.onsoundstart =
            null;

        recognizer.onspeechstart =
            null;


        try {
            recognizer.stop();
        }
        catch {}


        try {
            recognizer.abort();
        }
        catch {}
    }


    /* =========================================================
       MICROPHONE PERMISSION
       ========================================================= */

    async function requestPermission() {

        if (
            !navigator.mediaDevices?.getUserMedia
        ) {

            throw new Error(
                "Microphone access is unavailable."
            );
        }


        const stream =
            await navigator.mediaDevices
                .getUserMedia({
                    audio: {
                        echoCancellation:
                            true,

                        noiseSuppression:
                            true,

                        autoGainControl:
                            true
                    },

                    video:
                        false
                });


        stream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );


        state.permission =
            true;


        state.enabled =
            true;


        localStorage.setItem(
            MIC_KEY,
            "true"
        );


        localStorage.setItem(
            ENABLED_KEY,
            "true"
        );


        showPermission(
            false
        );
    }


    async function enable() {

        try {

            setUI(
                "starting",
                "Starting Aprisha",
                "Allow microphone access…"
            );


            await requestPermission();


            setUI(
                "idle",
                "Aprisha ready",
                "Say “Hey Aprisha”"
            );


            await sleep(250);


            armWake();


            /*
             * First activation shows the user immediately
             * that Aprisha is operational.
             */

            if (
                !sessionStorage.getItem(
                    "apAprishaFirstDemo"
                )
            ) {

                sessionStorage.setItem(
                    "apAprishaFirstDemo",
                    "true"
                );


                await sleep(350);


                wake();
            }

        }
        catch (error) {

            console.error(
                "Aprisha permission:",
                error
            );


            showPermission(
                true
            );


            setUI(
                "error",
                "Microphone permission needed",
                "Allow microphone access and try again."
            );
        }
    }


    /* =========================================================
       WAKE ENGINE
       ========================================================= */

    function detectWake(text) {

        const value =
            normalize(text);


        for (
            const pattern of
            WAKE_PATTERNS
        ) {

            const p =
                normalize(pattern);


            const index =
                value.indexOf(p);


            if (
                index >= 0
            ) {

                return {

                    found:
                        true,

                    after:
                        value
                            .slice(
                                index +
                                p.length
                            )
                            .trim()
                };
            }
        }


        return {
            found:
                false,

            after:
                ""
        };
    }


    function armWake() {

        if (
            !Recognition ||
            !state.enabled ||
            !state.permission ||
            state.awake ||
            state.thinking ||
            state.speaking ||
            document.hidden
        ) {
            return;
        }


        destroyRecognizer();


        const token =
            state.recognizerToken;


        let recognition;


        try {

            recognition =
                new Recognition();

        }
        catch {

            return;
        }


        state.recognizer =
            recognition;


        recognition.lang =
            navigator.language ||
            "en-IN";


        recognition.continuous =
            !isMobile();


        recognition.interimResults =
            true;


        recognition.maxAlternatives =
            3;


        recognition.onstart =
            () => {

                if (
                    token !==
                    state.recognizerToken
                ) {
                    return;
                }


                setUI(
                    "idle",
                    "Aprisha ready",
                    "Say “Hey Aprisha”"
                );
            };


        recognition.onresult =
            event => {

                if (
                    token !==
                    state.recognizerToken
                ) {
                    return;
                }


                let heard =
                    "";


                for (
                    let i =
                        event.resultIndex;

                    i <
                        event.results.length;

                    i++
                ) {

                    heard +=
                        " " +
                        (
                            event.results[i][0]
                                ?.transcript
                            ||
                            ""
                        );
                }


                const match =
                    detectWake(
                        heard
                    );


                if (
                    match.found
                ) {

                    destroyRecognizer();


                    wake(
                        match.after
                    );
                }
            };


        recognition.onerror =
            event => {

                if (
                    token !==
                    state.recognizerToken
                ) {
                    return;
                }


                if (
                    event.error ===
                        "not-allowed" ||
                    event.error ===
                        "service-not-allowed"
                ) {

                    state.permission =
                        false;


                    localStorage.removeItem(
                        MIC_KEY
                    );


                    showPermission(
                        true
                    );


                    return;
                }


                scheduleWake();
            };


        recognition.onend =
            () => {

                if (
                    token !==
                    state.recognizerToken
                ) {
                    return;
                }


                state.recognizer =
                    null;


                scheduleWake();
            };


        try {

            recognition.start();

        }
        catch {

            scheduleWake();
        }
    }


    function scheduleWake() {

        clearTimeout(
            state.wakeRestartTimer
        );


        if (
            !state.enabled ||
            state.awake ||
            state.thinking ||
            state.speaking ||
            document.hidden
        ) {
            return;
        }


        state.wakeRestartTimer =
            setTimeout(
                armWake,
                isMobile()
                    ? 420
                    : 250
            );
    }


    /* =========================================================
       WAKE
       ========================================================= */

    async function wake(
        directCommand = ""
    ) {

        destroyRecognizer();


        state.awake =
            true;


        state.stayUntil =
            Date.now() +
            60000;


        openPresence();


        transcript("");


        setUI(
            "awake",
            "Aprisha",
            "How can I help?"
        );


        vibrate();


        if (
            directCommand &&
            directCommand.length > 2
        ) {

            await speak(
                "I'm listening."
            );


            await sleep(250);


            execute(
                directCommand
            );


            return;
        }


        await speak(
            "How can I help?"
        );


        /*
         * TTS must completely surrender the audio path
         * before recognition starts.
         */

        await sleep(
            isMobile()
                ? 500
                : 300
        );


        listen();
    }


    /* =========================================================
       COMMAND LISTENING
       ========================================================= */

    function listen(
        attempt = 0
    ) {

        if (
            !Recognition ||
            !state.awake ||
            state.thinking ||
            state.speaking ||
            document.hidden
        ) {
            return;
        }


        destroyRecognizer();


        openPresence();


        transcript("");


        setUI(
            "listening",
            "Listening",
            "I'm listening…"
        );


        const token =
            state.recognizerToken;


        let recognition;


        try {

            recognition =
                new Recognition();

        }
        catch {

            retryCommand(
                attempt
            );

            return;
        }


        state.recognizer =
            recognition;


        recognition.lang =
            navigator.language ||
            "en-IN";


        recognition.continuous =
            false;


        /*
         * Interim gives immediate visual feedback.
         * Final result remains the execution trigger.
         */

        recognition.interimResults =
            true;


        recognition.maxAlternatives =
            1;


        let lastText =
            "";


        let executed =
            false;


        recognition.onstart =
            () => {

                if (
                    token !==
                    state.recognizerToken
                ) {
                    return;
                }


                console.log(
                    "🎙️ APRISHA LISTENING"
                );
            };


        recognition.onaudiostart =
            () => {

                setUI(
                    "listening",
                    "Listening",
                    "Microphone active…"
                );
            };


        recognition.onspeechstart =
            () => {

                setUI(
                    "listening",
                    "Listening",
                    "I hear you…"
                );
            };


        recognition.onresult =
            event => {

                if (
                    token !==
                    state.recognizerToken
                ) {
                    return;
                }


                let full =
                    "";

                let final =
                    false;


                for (
                    let i = 0;
                    i <
                        event.results.length;
                    i++
                ) {

                    const result =
                        event.results[i];


                    full +=
                        (
                            full
                                ? " "
                                : ""
                        )
                        +
                        (
                            result[0]
                                ?.transcript
                            ||
                            ""
                        );


                    if (
                        result.isFinal
                    ) {

                        final =
                            true;
                    }
                }


                lastText =
                    full.trim();


                if (
                    lastText
                ) {

                    transcript(
                        lastText
                    );


                    setUI(
                        "listening",
                        "Listening",
                        lastText
                    );
                }


                if (
                    final &&
                    lastText &&
                    !executed
                ) {

                    executed =
                        true;


                    const command =
                        lastText;


                    destroyRecognizer();


                    setUI(
                        "heard",
                        "Heard",
                        command
                    );


                    setTimeout(
                        () =>
                            execute(
                                command
                            ),
                        80
                    );
                }
            };


        recognition.onerror =
            event => {

                if (
                    token !==
                    state.recognizerToken
                ) {
                    return;
                }


                console.warn(
                    "Aprisha voice:",
                    event.error
                );


                if (
                    executed
                ) {
                    return;
                }


                state.recognizer =
                    null;


                if (
                    event.error ===
                        "not-allowed" ||
                    event.error ===
                        "service-not-allowed"
                ) {

                    state.permission =
                        false;


                    showPermission(
                        true
                    );


                    setUI(
                        "error",
                        "Microphone blocked",
                        "Allow microphone access."
                    );


                    return;
                }


                retryCommand(
                    attempt
                );
            };


        recognition.onend =
            () => {

                if (
                    token !==
                    state.recognizerToken
                ) {
                    return;
                }


                state.recognizer =
                    null;


                if (
                    executed
                ) {
                    return;
                }


                /*
                 * Mobile Chrome occasionally provides text
                 * before ending without flagging isFinal.
                 */

                if (
                    lastText
                ) {

                    executed =
                        true;


                    execute(
                        lastText
                    );


                    return;
                }


                retryCommand(
                    attempt
                );
            };


        try {

            recognition.start();

        }
        catch {

            retryCommand(
                attempt
            );
        }
    }


    function retryCommand(
        attempt
    ) {

        clearTimeout(
            state.commandRestartTimer
        );


        if (
            !state.awake ||
            state.thinking ||
            state.speaking
        ) {
            return;
        }


        if (
            Date.now() >
                state.stayUntil
        ) {

            sleepPresence();

            return;
        }


        const next =
            Math.min(
                attempt + 1,
                5
            );


        setUI(
            "listening",
            "Listening",
            "I'm still listening…"
        );


        state.commandRestartTimer =
            setTimeout(
                () =>
                    listen(next),
                isMobile()
                    ? 550
                    : 350
            );
    }


    /* =========================================================
       LOCAL AP SYNAPSE ACTIONS
       ========================================================= */

    function visible(element) {

        if (!element) {
            return false;
        }


        const style =
            getComputedStyle(element);


        return (
            style.display !== "none" &&
            style.visibility !== "hidden"
        );
    }


    function controls() {

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
        ]
        .filter(
            element =>

                visible(element) &&

                !element.closest(
                    "#apAprishaUniversal"
                )
        );
    }


    function clickText(
        names
    ) {

        const wanted =
            names.map(
                normalize
            );


        const list =
            controls();


        /*
         * Exact first.
         */

        for (
            const node of
            list
        ) {

            const text =
                normalize(
                    node.getAttribute(
                        "aria-label"
                    )
                    ||
                    node.getAttribute(
                        "title"
                    )
                    ||
                    node.innerText
                    ||
                    node.textContent
                );


            if (
                wanted.includes(
                    text
                )
            ) {

                node.click();

                return true;
            }
        }


        /*
         * Partial fallback.
         */

        for (
            const node of
            list
        ) {

            const text =
                normalize(
                    node.getAttribute(
                        "aria-label"
                    )
                    ||
                    node.getAttribute(
                        "title"
                    )
                    ||
                    node.innerText
                    ||
                    node.textContent
                );


            if (
                wanted.some(
                    item =>
                        text.includes(item)
                )
            ) {

                node.click();

                return true;
            }
        }


        return false;
    }


    function sendMainChat(
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


    async function localAction(
        command
    ) {

        // AP_APRISHA_WEB_DIRECT_ACTION_MASTER
        /*
         * Browser/PWA direct destinations.
         *
         * Native AP Presence handles installed Android apps.
         * Browser Aprisha handles web destinations directly.
         */

        const apWebCommand =
            String(
                command || ""
            )
            .trim();


        const apWebNormalized =
            apWebCommand
                .toLowerCase()
                .replace(
                    /\\s+/g,
                    " "
                )
                .trim();


        const apWebDestinations = {

            "youtube":
                "https://www.youtube.com",

            "google":
                "https://www.google.com",

            "gmail":
                "https://mail.google.com",

            "google maps":
                "https://maps.google.com",

            "maps":
                "https://maps.google.com",

            "google drive":
                "https://drive.google.com",

            "drive":
                "https://drive.google.com",

            "github":
                "https://github.com",

            "wikipedia":
                "https://www.wikipedia.org",

            "reddit":
                "https://www.reddit.com",

            "amazon":
                "https://www.amazon.in"
        };


        const apOpenMatch =
            apWebNormalized.match(
                /^(?:please\\s+)?(?:open|launch|start|visit|go to)\\s+(.+)$/
            );


        if (
            apOpenMatch
        ) {

            let requested =
                apOpenMatch[1]
                    .replace(
                        /\\s+(?:app|application|website|site)$/i,
                        ""
                    )
                    .trim();


            /*
             * Example:
             * "open the youtube app"
             */

            requested =
                requested.replace(
                    /^the\\s+/,
                    ""
                );


            const destination =
                apWebDestinations[
                    requested
                ];


            if (
                destination
            ) {

                const displayName =
                    requested
                        .replace(
                            /\\b\\w/g,
                            letter =>
                                letter.toUpperCase()
                        );


                /*
                 * Update Aprisha before leaving AP Synapse.
                 */

                try {

                    setUI?.(
                        "opening",
                        "Opening " +
                        displayName +
                        "…"
                    );

                }
                catch {}


                try {

                    const siriText =
                        document.getElementById(
                            "apAprishaSiriText"
                        );

                    const liveTranscript =
                        document.getElementById(
                            "apAprishaLiveTranscript"
                        );

                    if (siriText) {

                        siriText.textContent =
                            "Opening " +
                            displayName +
                            "…";
                    }


                    if (liveTranscript) {

                        liveTranscript.textContent =
                            apWebCommand;
                    }

                }
                catch {}


                /*
                 * Same-tab navigation is intentional.
                 *
                 * Unlike window.open(), this does NOT depend
                 * on popup permission after a voice command.
                 *
                 * On supported mobile systems, Android may
                 * hand the HTTPS destination to its associated
                 * installed application.
                 */

                window.location.assign(
                    destination
                );


                return true;
            }


            /*
             * Explicit URL:
             *
             * "open https://example.com"
             */

            if (
                requested.startsWith(
                    "https://"
                )
                ||
                requested.startsWith(
                    "http://"
                )
            ) {

                try {

                    const parsed =
                        new URL(
                            requested
                        );


                    if (
                        parsed.protocol === "https:"
                        ||
                        parsed.protocol === "http:"
                    ) {

                        window.location.assign(
                            parsed.href
                        );


                        return true;
                    }

                }
                catch {}
            }
        }



        const c =
            normalize(command);


        /*
         * Stop.
         */

        if (
            /^(stop|cancel|goodbye|bye|close aprisha|go away)$/
                .test(c)
        ) {

            await speak(
                "Okay."
            );


            sleepPresence();


            return true;
        }


        /*
         * Continuous conversation.
         */

        if (
            c.includes(
                "stay with me"
            )
        ) {

            state.stayUntil =
                Date.now() +
                120000;


            await speak(
                "I'm here. Keep talking."
            );


            followUp();


            return true;
        }


        /*
         * Vision.
         */

        if (
            c.includes("vision") ||
            c.includes("use camera") ||
            c.includes("what am i looking at")
        ) {

            await speak(
                "Opening Vision."
            );


            closePresence();


            window
                .APAprishaVision
                ?.open?.();


            reset();


            return true;
        }


        /*
         * Full Presence mode.
         */

        if (
            c.includes(
                "presence mode"
            ) ||
            c.includes(
                "open presence"
            )
        ) {

            await speak(
                "Opening Presence."
            );


            closePresence();


            window
                .APAprishaPresence
                ?.open?.();


            reset();


            return true;
        }


        /*
         * New chat.
         */

        if (
            c.includes("new chat") ||
            c.includes("new conversation")
        ) {

            const success =
                clickText([
                    "New Conversation",
                    "New Chat"
                ]);


            await speak(
                success
                    ? "Starting a new conversation."
                    : "I couldn't find the new conversation control."
            );


            sleepPresence();


            return true;
        }


        /*
         * Workspace navigation.
         */

        const routes = [

            {
                test:
                    c.includes(
                        "code studio"
                    ),

                names:
                    [
                        "Code Studio",
                        "Code"
                    ],

                reply:
                    "Opening Code Studio."
            },

            {
                test:
                    c.includes(
                        "documents"
                    ),

                names:
                    [
                        "Documents"
                    ],

                reply:
                    "Opening Documents."
            },

            {
                test:
                    c.includes(
                        "projects"
                    ),

                names:
                    [
                        "Projects"
                    ],

                reply:
                    "Opening Projects."
            },

            {
                test:
                    c.includes(
                        "knowledge"
                    ),

                names:
                    [
                        "Knowledge"
                    ],

                reply:
                    "Opening Knowledge."
            },

            {
                test:
                    c.includes(
                        "automation"
                    ),

                names:
                    [
                        "Automation"
                    ],

                reply:
                    "Opening Automation."
            },

            {
                test:
                    c.includes(
                        "settings"
                    ),

                names:
                    [
                        "Settings"
                    ],

                reply:
                    "Opening Settings."
            },

            {
                test:
                    c.includes(
                        "assistant"
                    )
                    &&
                    (
                        c.includes("open") ||
                        c.includes("go to")
                    ),

                names:
                    [
                        "Assistant"
                    ],

                reply:
                    "Opening Assistant."
            },

            {
                test:
                    c.includes("whiteboard") ||
                    c.includes("canvas"),

                names:
                    [
                        "Whiteboard",
                        "Canvas"
                    ],

                reply:
                    "Opening the canvas."
            }
        ];


        for (
            const route of
            routes
        ) {

            if (
                !route.test
            ) {
                continue;
            }


            const success =
                clickText(
                    route.names
                );


            await speak(
                success
                    ? route.reply
                    : "I couldn't find that workspace."
            );


            sleepPresence();


            return true;
        }


        /*
         * Web search.
         */

        if (
            c.includes("enable web") ||
            c.includes("turn on web") ||
            c === "web search"
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


            followUp();


            return true;
        }


        if (
            c.includes("disable web") ||
            c.includes("turn off web")
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


            followUp();


            return true;
        }


        /*
         * Deep Think.
         */

        if (
            c.includes(
                "enable deep think"
            ) ||
            c.includes(
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


            followUp();


            return true;
        }


        /*
         * Image generation belongs in normal AP Synapse chat
         * so the generated image renders normally.
         */

        if (
            /\b(create|generate|draw|make)\b.*\b(image|picture|illustration|photo)\b/
                .test(c)
        ) {

            const sent =
                sendMainChat(
                    command
                );


            await speak(
                sent
                    ? "Creating that in AP Synapse."
                    : "I couldn't start that request."
            );


            sleepPresence();


            return true;
        }


        return false;
    }


    /* =========================================================
       EXECUTE
       ========================================================= */

    async function execute(
        command
    ) {

        command =
            String(command || "")
                .trim();


        if (!command) {

            listen();

            return;
        }


        transcript(
            command
        );


        setUI(
            "processing",
            "Aprisha",
            command
        );


        /*
         * Local actions execute immediately.
         */

        if (
            await localAction(
                command
            )
        ) {

            return;
        }


        /*
         * Everything else goes to AP Synapse intelligence.
         */

        await ask(
            command
        );
    }


    /* =========================================================
       AP SYNAPSE INTELLIGENCE
       ========================================================= */

    async function ask(
        message
    ) {

        destroyRecognizer();


        state.thinking =
            true;


        setUI(
            "thinking",
            "Thinking",
            "Working on it…"
        );


        try {

            const web =
                document
                    .getElementById(
                        "webBtn"
                    )
                    ?.classList
                    .contains("active")
                ||
                /\b(latest|today|current|search|look up|news)\b/i
                    .test(message);


            const response =
                await fetch(
                    API,
                    {
                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "text/plain, application/json",

                            "x-session-id":
                                state.sessionId
                        },

                        body:
                            JSON.stringify({

                                message,

                                web,

                                source:
                                    "aprisha-mobile-master"
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


            const type =
                response.headers
                    .get("content-type")
                ||
                "";


            let answer =
                "";


            /*
             * JSON endpoint.
             */

            if (
                type.includes(
                    "application/json"
                )
            ) {

                const json =
                    await response.json();


                if (
                    json.type === "image" &&
                    json.url
                ) {

                    sendMainChat(
                        message
                    );


                    state.thinking =
                        false;


                    await speak(
                        "Your image is being created in AP Synapse."
                    );


                    sleepPresence();


                    return;
                }


                answer =
                    json.reply ||
                    json.response ||
                    json.answer ||
                    json.content ||
                    json.text ||
                    json.message?.content ||
                    "";
            }

            /*
             * Streaming/plain-text backend.
             */

            else if (
                response.body
            ) {

                const reader =
                    response.body
                        .getReader();


                const decoder =
                    new TextDecoder();


                while (true) {

                    const {
                        value,
                        done
                    } =
                        await reader.read();


                    if (done) {
                        break;
                    }


                    const chunk =
                        decoder.decode(
                            value,
                            {
                                stream:
                                    true
                            }
                        );


                    answer +=
                        chunk;


                    const preview =
                        cleanAnswer(
                            answer
                        );


                    if (preview) {

                        setUI(
                            "thinking",
                            "Aprisha",
                            preview
                        );
                    }
                }


                answer +=
                    decoder.decode();
            }

            else {

                answer =
                    await response.text();
            }


            answer =
                parsePossibleStream(
                    answer
                );


            answer =
                cleanAnswer(
                    answer
                );


            if (!answer) {

                answer =
                    "I couldn't create a useful response for that.";
            }


            state.thinking =
                false;


            setUI(
                "answer",
                "Aprisha",
                answer
            );


            transcript("");


            await speak(
                answer
            );


            followUp();

        }
        catch (error) {

            console.error(
                "Aprisha intelligence:",
                error
            );


            state.thinking =
                false;


            setUI(
                "error",
                "Connection issue",
                "I couldn't reach AP Synapse right now."
            );


            await speak(
                "I couldn't reach AP Synapse right now."
            );


            followUp();
        }
    }


    function parsePossibleStream(
        raw
    ) {

        raw =
            String(raw || "")
                .trim();


        if (!raw) {
            return "";
        }


        try {

            const json =
                JSON.parse(raw);


            return (
                json.reply ||
                json.response ||
                json.answer ||
                json.content ||
                json.text ||
                json.message?.content ||
                ""
            );
        }
        catch {}


        /*
         * Parse SSE / JSON-line responses when present.
         */

        if (
            raw.includes("\ndata:") ||
            raw.startsWith("data:")
        ) {

            let result =
                "";


            for (
                let line of
                raw.split(/\r?\n/)
            ) {

                line =
                    line.trim();


                if (
                    !line ||
                    line === "[DONE]" ||
                    line === "data: [DONE]"
                ) {
                    continue;
                }


                if (
                    line.startsWith(
                        "data:"
                    )
                ) {

                    line =
                        line
                            .slice(5)
                            .trim();
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
                }
                catch {

                    result +=
                        (
                            result
                                ? " "
                                : ""
                        )
                        +
                        line;
                }
            }


            return result;
        }


        return raw;
    }


    function cleanAnswer(
        text
    ) {

        return String(text || "")
            .replace(
                /```[\s\S]*?```/g,
                " Code is available in the response. "
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


    /* =========================================================
       SPEAK
       ========================================================= */

    function speak(
        text
    ) {

        return new Promise(
            resolve => {

                text =
                    cleanAnswer(
                        text
                    );


                if (
                    !text ||
                    !("speechSynthesis" in window)
                ) {

                    resolve();

                    return;
                }


                destroyRecognizer();


                state.speaking =
                    true;


                setUI(
                    "speaking",
                    "Aprisha",
                    text
                );


                let done =
                    false;


                let timer;


                const finish =
                    () => {

                        if (done) {
                            return;
                        }


                        done =
                            true;


                        state.speaking =
                            false;


                        clearTimeout(
                            timer
                        );


                        resolve();
                    };


                try {

                    speechSynthesis.cancel();

                }
                catch {}


                const utterance =
                    new SpeechSynthesisUtterance(
                        text
                    );


                utterance.lang =
                    navigator.language ||
                    "en-IN";


                utterance.rate =
                    isMobile()
                        ? 1.04
                        : 1.02;


                utterance.pitch =
                    1;


                utterance.volume =
                    1;


                utterance.onend =
                    finish;


                utterance.onerror =
                    finish;


                /*
                 * Chrome sometimes speaks but misses onend.
                 */

                timer =
                    setTimeout(
                        finish,
                        Math.max(
                            1800,
                            Math.min(
                                60000,
                                text.length *
                                    65 +
                                    1300
                            )
                        )
                    );


                setTimeout(
                    () => {

                        try {

                            speechSynthesis
                                .speak(
                                    utterance
                                );

                        }
                        catch {

                            finish();
                        }

                    },
                    70
                );
            }
        );
    }


    /* =========================================================
       FOLLOW-UP
       ========================================================= */

    async function followUp() {

        state.thinking =
            false;


        if (
            !state.awake
        ) {

            scheduleWake();

            return;
        }


        if (
            Date.now() >
                state.stayUntil
        ) {

            sleepPresence();

            return;
        }


        await sleep(
            isMobile()
                ? 420
                : 280
        );


        setUI(
            "listening",
            "Listening",
            "Anything else?"
        );


        listen();
    }


    function reset() {

        destroyRecognizer();


        state.awake =
            false;


        state.thinking =
            false;


        state.speaking =
            false;


        state.stayUntil =
            0;


        setUI(
            "idle",
            "Aprisha ready",
            "Say “Hey Aprisha”"
        );


        scheduleWake();
    }


    function sleepPresence() {

        destroyRecognizer();


        try {
            speechSynthesis.cancel();
        }
        catch {}


        closePresence();


        reset();
    }


    function pause() {

        state.enabled =
            false;


        localStorage.setItem(
            ENABLED_KEY,
            "false"
        );


        destroyRecognizer();


        state.awake =
            false;


        closePresence();


        setUI(
            "idle",
            "Aprisha paused",
            "Tap Enable to reactivate."
        );
    }


    /* =========================================================
       UI EVENTS
       ========================================================= */

    function bindUI() {

        document
            .getElementById(
                "apAprishaPermissionEnable"
            )
            ?.addEventListener(
                "click",
                enable
            );


        document
            .getElementById(
                "apAprishaEnable"
            )
            ?.addEventListener(
                "click",
                enable
            );


        document
            .getElementById(
                "apAprishaOrb"
            )
            ?.addEventListener(
                "click",
                openMiniPanel
            );


        document
            .getElementById(
                "apAprishaClose"
            )
            ?.addEventListener(
                "click",
                closeMiniPanel
            );


        document
            .getElementById(
                "apAprishaSpeak"
            )
            ?.addEventListener(
                "click",
                () => {

                    destroyRecognizer();


                    state.awake =
                        true;


                    state.stayUntil =
                        Date.now() +
                        60000;


                    openPresence();


                    listen();
                }
            );


        /*
         * Tap mic = interrupt Aprisha and immediately listen.
         */

        document
            .getElementById(
                "apAprishaSiriMic"
            )
            ?.addEventListener(
                "click",
                () => {

                    try {
                        speechSynthesis.cancel();
                    }
                    catch {}


                    state.speaking =
                        false;


                    state.awake =
                        true;


                    state.stayUntil =
                        Date.now() +
                        60000;


                    listen();
                }
            );


        document
            .getElementById(
                "apAprishaStop"
            )
            ?.addEventListener(
                "click",
                pause
            );


        document
            .getElementById(
                "apAprishaSiriClose"
            )
            ?.addEventListener(
                "click",
                sleepPresence
            );


        document
            .getElementById(
                "apAprishaBackdrop"
            )
            ?.addEventListener(
                "click",
                sleepPresence
            );


        document
            .getElementById(
                "apAprishaSiriVision"
            )
            ?.addEventListener(
                "click",
                () => {

                    destroyRecognizer();


                    closePresence();


                    window
                        .APAprishaVision
                        ?.open?.();


                    reset();
                }
            );


        document
            .getElementById(
                "apAprishaSiriPresence"
            )
            ?.addEventListener(
                "click",
                () => {

                    destroyRecognizer();


                    closePresence();


                    window
                        .APAprishaPresence
                        ?.open?.();


                    reset();
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

                destroyRecognizer();

                return;
            }


            if (
                state.enabled &&
                !state.awake &&
                state.permission
            ) {

                setTimeout(
                    armWake,
                    450
                );
            }
        }
    );


    window.addEventListener(
        "focus",
        () => {

            if (
                state.enabled &&
                !state.awake &&
                state.permission
            ) {

                setTimeout(
                    armWake,
                    400
                );
            }
        }
    );


    /* =========================================================
       AUTO RESTORE
       ========================================================= */

    async function restore() {

        if (
            !state.enabled
        ) {

            showPermission(
                false
            );

            return;
        }


        if (!Recognition) {

            setUI(
                "error",
                "Voice wake unavailable",
                "Use the Speak button on this browser."
            );

            return;
        }


        /*
         * Chrome Permissions API.
         */

        try {

            const result =
                await navigator.permissions
                    ?.query({
                        name:
                            "microphone"
                    });


            if (
                result?.state ===
                "granted"
            ) {

                state.permission =
                    true;


                localStorage.setItem(
                    MIC_KEY,
                    "true"
                );


                showPermission(
                    false
                );


                armWake();


                result.onchange =
                    () => {

                        if (
                            result.state ===
                            "granted"
                        ) {

                            state.permission =
                                true;

                            armWake();

                        }
                        else {

                            state.permission =
                                false;

                            destroyRecognizer();

                            showPermission(
                                true
                            );
                        }
                    };


                return;
            }


            if (
                result?.state ===
                "denied"
            ) {

                state.permission =
                    false;


                showPermission(
                    true
                );


                return;
            }

        }
        catch {}


        /*
         * Stored permission hint for browsers where
         * Permissions.query("microphone") is unavailable.
         */

        if (
            localStorage.getItem(
                MIC_KEY
            ) === "true"
        ) {

            state.permission =
                true;


            showPermission(
                false
            );


            armWake();

        }
        else {

            showPermission(
                true
            );
        }
    }


    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.APAprisha = {

        enable,

        wake,

        listen,

        ask,

        execute,

        pause,

        open:
            wake,

        close:
            sleepPresence
    };


    /* =========================================================
       BOOT
       ========================================================= */

    function boot() {

        buildUI();


        setUI(
            "idle",
            "Aprisha ready",
            "Say “Hey Aprisha”"
        );


        restore();


        console.log(
            "✅ AP SYNAPSE · APRISHA MOBILE MASTER V12 READY"
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
