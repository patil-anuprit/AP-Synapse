(() => {
    "use strict";

    if (window.__AP_APRISHA_VOICE_ROUTER_V7__) {
        return;
    }

    window.__AP_APRISHA_VOICE_ROUTER_V7__ = true;

    const Recognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    const ENABLE_KEY =
        "ap_aprisha_voice_router_v7";

    const SESSION_MS =
        60000;

    let recognition = null;
    let running = false;
    let starting = false;
    let executing = false;

    let sessionUntil = 0;

    let restartTimer = null;
    let commitTimer = null;

    let latestText = "";

    // AP_APRISHA_COMPLETE_COMMAND_V751
    //
    // Chrome may divide one natural sentence into several
    // SpeechRecognition result fragments or speech bursts.
    //
    // Keep enough state to rebuild the entire command before
    // executing it.
    let utteranceResultStart = null;

    let utterancePrefix = "";

    let lastExecuted = "";
    let lastExecutedAt = 0;


    /* =====================================================
       UTILITIES
       ===================================================== */

    function normalize(value) {

        return String(value || "")
            .toLowerCase()
            .replace(/[^\w\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }


    function sessionActive() {

        return (
            Date.now() <
            sessionUntil
        );
    }


    function extendSession() {

        sessionUntil =
            Date.now() +
            SESSION_MS;
    }


    function endSession() {

        sessionUntil = 0;

        console.log(
            "⚪ Aprisha conversation session ended"
        );
    }


    function clearRestart() {

        if (restartTimer) {
            clearTimeout(restartTimer);
        }

        restartTimer = null;
    }


    function clearCommit() {

        if (commitTimer) {
            clearTimeout(commitTimer);
        }

        commitTimer = null;
    }


    function speaking() {

        try {

            return !!(
                window.speechSynthesis &&
                (
                    speechSynthesis.speaking ||
                    speechSynthesis.pending
                )
            );

        }
        catch {

            return false;
        }
    }


    /* =====================================================
       WAKE DETECTION
       ===================================================== */

    const WAKE_PHRASES = [

        // AP_APRISHA_FAST_WAKE_ALIASES_V754
        //
        // Real Chrome transcriptions observed for "Aprisha".
        "hey pree ha",
        "hey preeha",
        "hey pree sha",
        "hey pri sha",
        "hey prisha",
        "hey preesha",
        "hey apreesha",
        "hey appreesha",
        "hey appree ha",
        "hey appre sha",
        "hey apre sha",
        "hey appreci",
        "hey apprecia",

        "hey aprisha",
        "hi aprisha",

        "hey apreesha",
        "hey aprisa",
        "hey apisha",
        "hey apsisha",
        "hey apprisha",

        "hey apprecia",
        "hey aprecia",
        "hey appresha",

        /*
         * Actual Chrome interpretations
         * observed on this machine.
         */
        "hair pressure",
        "air pressure",
        "hare pressure",
        "heir pressure",

        // AP_APRISHA_WAKE_ALIAS_V72
        // Actual Chrome interpretations observed:
        "yah pressure",
        "yeah pressure",
        "ya pressure",

        "yah prisha",
        "yeah prisha",
        "ya prisha",

        "yah preesha",
        "yeah preesha",
        "ya preesha",

        "hair prisha",
        "air prisha",

        "hair preesha",
        "air preesha",

        "hey pressure",
        "hi pressure",

        "hey a prisha",
        "hi a prisha",

        // AP_FUZZY_APRISHA_NAME_V73
        "hey presha",
        "hi presha",

        "hey prisha",
        "hi prisha",

        "hey preesha",
        "hi preesha",

        "hey preshia",
        "hi preshia"
    ];


    function detectWake(value) {

        const text =
            normalize(value);


        if (!text) {

            return {
                found: false,
                command: ""
            };
        }


        for (
            const phrase of WAKE_PHRASES
        ) {

            const position =
                text.indexOf(
                    phrase
                );


            if (
                position !== -1 &&
                position <= 8
            ) {

                return {

                    found: true,

                    command:
                        text
                            .slice(
                                position +
                                phrase.length
                            )
                            .trim(),

                    phrase
                };
            }
        }


        /*
         * Fuzzy:
         * "hey <something close to Aprisha>"
         */
        const words =
            text.split(/\s+/);


        if (
            words[0] === "hey" ||
            words[0] === "hi"
        ) {

            const possibleName =
                String(
                    words[1] || ""
                )
                .replace(
                    /[^a-z]/g,
                    ""
                );


            if (
                /^(apr|apre|appr|appre|api|prish|presh|pres|preesh)[a-z]{1,8}$/
                    .test(
                        possibleName
                    )
            ) {

                return {

                    found: true,

                    command:
                        words
                            .slice(2)
                            .join(" ")
                            .trim()
                };
            }
        }


        return {
            found: false,
            command: ""
        };
    }


    /* =====================================================
       MICROPHONE CONTROL
       ===================================================== */

    function stopRecognizer() {

        const current =
            recognition;

        recognition = null;

        running = false;
        starting = false;


        if (!current) {
            return;
        }


        try {

            current.onstart = null;
            current.onspeechstart = null;
            current.onresult = null;
            current.onerror = null;
            current.onend = null;

        }
        catch {}


        try {

            current.abort();

        }
        catch {}
    }


    function scheduleStart(
        delay = 400
    ) {

        clearRestart();


        if (
            executing ||
            document.hidden ||
            localStorage.getItem(
                ENABLE_KEY
            ) !== "1"
        ) {

            return;
        }


        restartTimer =
            setTimeout(
                start,
                delay
            );
    }


    /* =====================================================
       WAIT UNTIL APRISHA HAS FINISHED SPEAKING
       ===================================================== */

    async function waitUntilQuiet() {

        /*
         * Some Aprisha actions begin TTS slightly after
         * execute() resolves.
         */
        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    350
                )
        );


        const startTime =
            Date.now();


        while (
            speaking() &&
            Date.now() -
                startTime <
                15000
        ) {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        200
                    )
            );
        }


        /*
         * Prevent microphone reopening on
         * the final syllable of Aprisha's voice.
         */
        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    300
                )
        );
    }


    /* =====================================================
       SAY SMALL WAKE RESPONSE
       ===================================================== */

    async function acknowledgeWake() {

        if (
            !window.speechSynthesis ||
            !window.SpeechSynthesisUtterance
        ) {
            return;
        }


        try {

            speechSynthesis.cancel();


            const voice =
                new SpeechSynthesisUtterance(
                    "Yes?"
                );


            voice.rate = 1;
            voice.pitch = 1;


            await new Promise(
                resolve => {

                    voice.onend =
                        resolve;

                    voice.onerror =
                        resolve;


                    speechSynthesis.speak(
                        voice
                    );
                }
            );

        }
        catch {}
    }


    /* =====================================================
       EXECUTE REAL APRISHA COMMAND
       ===================================================== */

    async function executeCommand(
        command
    ) {

        const clean =
            String(command || "")
                .trim();


        if (!clean) {
            return;
        }


        /*
         * Prevent the same final transcript being
         * executed twice.
         */
        const normalized =
            normalize(clean);


        if (
            normalized ===
                lastExecuted &&
            Date.now() -
                lastExecutedAt <
                1800
        ) {

            return;
        }


        if (
            !window.APAprisha ||
            typeof window.APAprisha
                .execute !==
                "function"
        ) {

            console.error(
                "❌ APAprisha.execute unavailable"
            );

            return;
        }


        lastExecuted =
            normalized;

        lastExecutedAt =
            Date.now();


        executing =
            true;


        clearRestart();
        clearCommit();

        stopRecognizer();


        /*
         * Extend conversation BEFORE executing,
         * so even instant navigation commands
         * activate follow-up mode.
         */
        extendSession();


        console.log(
            "⚡ APRISHA EXECUTE →",
            clean
        );


        try {

            await Promise.resolve(
                window.APAprisha.execute(
                    clean
                )
            );


            console.log(
                "✅ APRISHA COMMAND COMPLETE"
            );

        }
        catch (error) {

            console.error(
                "❌ APRISHA COMMAND FAILED:",
                error
            );
        }


        /*
         * Aprisha may speak:
         * "Opening Canvas..."
         *
         * Keep microphone OFF during its voice.
         */
        await waitUntilQuiet();


        executing =
            false;


        /*
         * Every completed command renews
         * the conversational window.
         */
        extendSession();


        console.log(
            "🎙️ FOLLOW-UP READY — no wake word required"
        );


        scheduleStart(
            200
        );
    }


    /* =====================================================
       COMMIT RECOGNIZED SENTENCE
       ===================================================== */

    async function commit() {

        clearCommit();


        const raw =
            String(
                latestText || ""
            ).trim();


        latestText = "";


        if (!raw) {
            return;
        }


        const wake =
            detectWake(
                raw
            );


        // AP_APRISHA_WAKE_TAIL_GUARD_V752
        //
        // Chrome commonly leaves tiny garbage fragments after
        // a fuzzy wake transcription:
        //
        // "hey appri a"
        // "hey aprisha uh"
        //
        // These are NOT real commands.

        const wakeCommandRaw =
            String(
                wake?.command ||
                ""
            )
                .trim();


        const wakeCommandNormalized =
            normalize(
                wakeCommandRaw
            );


        const wakeCommandLooksLikeNoise =
            !wakeCommandNormalized ||
            wakeCommandNormalized.length <= 2 ||
            /^(?:a|i|uh|um|hm|hmm|ah|oh|hey|hi)$/i
                .test(
                    wakeCommandNormalized
                );


        const safeWakeCommand =
            wakeCommandLooksLikeNoise
                ? ""
                : wakeCommandRaw;


        /*
         * MODE 1
         *
         * "Hey Aprisha, open Canvas"
         */
        if (
            wake.found &&
            safeWakeCommand
        ) {

            extendSession();


            console.log(
                "⚡ HEY APRISHA →",
                safeWakeCommand
            );


            await executeCommand(
                safeWakeCommand
            );


            return;
        }


        /*
         * MODE 2
         *
         * User only says:
         *
         * "Hey Aprisha"
         */
        if (
            wake.found &&
            !safeWakeCommand
        ) {

            stopRecognizer();

            extendSession();


            console.log(
                "⚡ HEY APRISHA — session opened"
            );


            await acknowledgeWake();


            console.log(
                "🎙️ Aprisha ready for command"
            );


            scheduleStart(
                150
            );


            return;
        }


        /*
         * MODE 3
         *
         * Active session:
         *
         * "Open YouTube"
         *
         * No second wake word required.
         */
        if (
            sessionActive()
        ) {

            await executeCommand(
                raw
            );


            return;
        }


        /*
         * Outside active session:
         * ignore ordinary background speech.
         */
    }



    /* =====================================================
       TRANSCRIPT QUALITY

       Chrome can produce:

       open
       open youtube
       youtube
       operation open youtube

       Never allow a worse late transcript to replace
       the clean command.
       ===================================================== */

    function commandScore(value) {

        const text =
            normalize(value);

        if (!text) {
            return -9999;
        }

        const words =
            text.split(/\s+/);

        let score =
            (words.length * 10) +
            text.length;


        /*
         * Proper command beginning.
         */
        if (
            /^(open|launch|go to|goto|show|play|search|find|create|start|stop|close|move|send|switch|continue|write|code|analyse|analyze|plan)\b/
                .test(text)
        ) {
            score += 180;
        }


        /*
         * Wake phrase is highly meaningful.
         */
        const wake =
            detectWake(text);

        if (wake.found) {

            score += 220;

            if (wake.command) {
                score += 120;
            }
        }


        /*
         * Common Chrome recognition garbage seen
         * before the real command.
         */
        if (
            /^(operation|pressure|hair|air|hare|heir)\b/
                .test(text)
        ) {
            score -= 140;
        }


        return score;
    }


    function queueCommit(
        text,
        final
    ) {

        const candidate =
            String(text || "")
                .trim();

        if (!candidate) {
            return;
        }


        /*
         * CRITICAL FIX:
         *
         * Keep the BEST transcript from the utterance,
         * not simply the newest transcript.
         */
        const candidateNormalized =
            normalize(
                candidate
            );


        const latestNormalized =
            normalize(
                latestText
            );


        const extendsCurrent =
            Boolean(
                latestNormalized &&
                candidateNormalized
                    .startsWith(
                        latestNormalized +
                        " "
                    )
            );


        if (
            !latestText ||
            extendsCurrent ||
            commandScore(candidate) >=
                commandScore(latestText)
        ) {

            latestText =
                candidate;

            console.log(
                "🧠 Aprisha best command:",
                latestText
            );
        }


        clearCommit();


        /*
         * Allow Chrome a little time to finish
         * revising the sentence.
         */
        // AP_APRISHA_FAST_WAKE_COMMIT_V754

        const fastWake =
            !sessionActive() &&
            detectWake(candidate).found;


        const delay =
            fastWake
                ? 120
                : (
                    final
                        ? 850
                        : 1200
                );


        commitTimer =
            setTimeout(
                commit,
                delay
            );
    }


    /* =====================================================
       START MICROPHONE
       ===================================================== */

    function start() {

        if (!Recognition) {

            console.error(
                "❌ Browser SpeechRecognition unavailable"
            );

            return false;
        }


        if (
            executing ||
            running ||
            starting ||
            recognition ||
            document.hidden ||
            localStorage.getItem(
                ENABLE_KEY
            ) !== "1"
        ) {

            return false;
        }


        /*
         * AP_APRISHA_SINGLE_MIC_OWNER_V91
         *
         * Exactly one SpeechRecognition instance may own
         * Aprisha's microphone at a time.
         *
         * While the dedicated conversational session owns
         * the microphone, Voice Router MUST NOT create or
         * restart a competing recognizer.
         */
        if (
            window.__AP_APRISHA_DEDICATED_MIC__ === true
        ) {

            running = false;
            starting = false;

            /*
             * Lightweight retry only.
             *
             * This does NOT open another microphone.
             * It simply checks again after the conversation
             * releases ownership.
             */
            scheduleStart(
                600
            );

            return false;
        }


        /*
         * Never listen to Aprisha's own voice.
         */
        if (
            speaking()
        ) {

            scheduleStart(
                450
            );

            return false;
        }


        starting =
            true;


        const r =
            new Recognition();


        recognition =
            r;


        r.lang =
            "en-IN";

        r.continuous =
            true;

        r.interimResults =
            true;

        r.maxAlternatives =
            3;


        r.onstart =
            () => {

                if (
                    recognition !== r
                ) {
                    return;
                }


                starting =
                    false;

                running =
                    true;


                console.log(
                    sessionActive()
                        ? "🎙️ Aprisha conversation listening"
                        : "🎤 Hey Aprisha listening"
                );
            };


        r.onspeechstart =
            () => {

                // AP_APRISHA_CROSS_BURST_CONTINUATION_V751

                // AP_APRISHA_SLEEP_RESET_V754
                //
                // Cross-burst continuation is useful AFTER
                // Aprisha is awake, but harmful while waiting
                // for "Hey Aprisha".
                //
                // While asleep, every new speech burst starts
                // clean so background fragments never build up.

                if (
                    sessionActive()
                ) {

                    utterancePrefix =
                        String(
                            latestText || ""
                        )
                            .trim();

                }
                else {

                    utterancePrefix =
                        "";

                    latestText =
                        "";
                }


                utteranceResultStart =
                    null;


                /*
                 * A new burst arrived before commit().
                 * Cancel the pending execution, but preserve
                 * the existing sentence so the new words can
                 * extend it.
                 */

                clearCommit();
            };


        r.onresult =
            event => {

                if (
                    recognition !== r ||
                    executing
                ) {
                    return;
                }


                /*
                 * Ignore Aprisha TTS completely.
                 */
                if (
                    speaking()
                ) {
                    return;
                }


                                /*
                 * AP_APRISHA_WAKE_ONLY_LANE_V755
                 *
                 * While Aprisha is asleep, ordinary speech
                 * must never enter the command accumulator.
                 */

                if (!sessionActive()) {

                    const wakeParts = [];

                    for (
                        let wi = Math.max(
                            0,
                            Number(event.resultIndex) || 0
                        );
                        wi < event.results.length;
                        wi++
                    ) {

                        const part = String(
                            event.results[wi]?.[0]?.transcript || ""
                        ).trim();

                        if (part) {
                            wakeParts.push(part);
                        }
                    }

                    const wakeRaw =
                        wakeParts
                            .join(" ")
                            .replace(/\s+/g, " ")
                            .trim();

                    const wakeNormalized =
                        normalize(wakeRaw);

                    const normalWake =
                        detectWake(wakeRaw);

                    const fuzzyWake =
                        /\b(?:hey|hai|hi|hair)\s+(?:app?ree?s?h?a?|apree?s?h?a?|pree?s?h?a?|pri?s?h?a?)\b/i
                            .test(wakeNormalized);

                    if (
                        normalWake.found ||
                        fuzzyWake
                    ) {

                        console.log(
                            "⚡ APRISHA FAST WAKE →",
                            wakeRaw
                        );

                        latestText = "";
                        utterancePrefix = "";
                        utteranceResultStart = null;

                        clearCommit();

                        queueCommit(
                            "hey aprisha",
                            true
                        );

                        return;
                    }

                    /*
                     * No wake phrase detected.
                     * Discard all asleep speech immediately.
                     */

                    latestText = "";
                    utterancePrefix = "";
                    utteranceResultStart = null;

                    clearCommit();

                    return;
                }

/*
                 * AP_APRISHA_FULL_UTTERANCE_ASSEMBLY_V751
                 *
                 * Do not use only event.results[last].
                 *
                 * Chrome can produce:
                 *
                 * result 0: "explain India"
                 * result 1: "in short"
                 *
                 * Reconstruct every result belonging to this
                 * current speech burst.
                 */

                if (
                    utteranceResultStart ===
                    null
                ) {

                    utteranceResultStart =
                        Math.max(
                            0,
                            Number(
                                event.resultIndex
                            ) || 0
                        );
                }


                const utteranceParts =
                    [];


                let utteranceFinal =
                    true;


                for (
                    let i =
                        utteranceResultStart;
                    i <
                        event.results.length;
                    i++
                ) {

                    const pieceResult =
                        event.results[i];


                    const piece =
                        String(
                            pieceResult?.[0]
                                ?.transcript ||
                            ""
                        )
                            .trim();


                    if (piece) {

                        utteranceParts.push(
                            piece
                        );
                    }


                    if (
                        !pieceResult?.isFinal
                    ) {

                        utteranceFinal =
                            false;
                    }
                }


                const currentBurst =
                    utteranceParts
                        .join(" ")
                        .replace(
                            /s+/g,
                            " "
                        )
                        .trim();


                const prefixNormalized =
                    normalize(
                        utterancePrefix
                    );


                const burstNormalized =
                    normalize(
                        currentBurst
                    );


                /*
                 * If Chrome already revised the new result into
                 * the entire sentence, do not duplicate prefix.
                 *
                 * Otherwise append the new burst.
                 */

                const text =
                    (
                        utterancePrefix &&
                        currentBurst &&
                        !burstNormalized
                            .startsWith(
                                prefixNormalized
                            )
                    )
                        ? (
                            utterancePrefix +
                            " " +
                            currentBurst
                        )
                            .replace(
                                /s+/g,
                                " "
                            )
                            .trim()
                        : (
                            currentBurst ||
                            utterancePrefix
                        );




                if (!text) {
                    return;
                }


                console.log(
                    "🎧 Aprisha heard:",
                    text
                );


                /*
                 * Outside a session, only bother
                 * committing text containing a wake.
                 */
                if (
                    !sessionActive()
                ) {

                    const wake =
                        detectWake(
                            text
                        );


                    if (!wake.found) {
                        return;
                    }
                }


                queueCommit(
                    text,
                    utteranceFinal
                );
            };


        r.onerror =
            event => {

                const code =
                    String(
                        event?.error ||
                        ""
                    );


                if (
                    code === "aborted" ||
                    code === "no-speech"
                ) {

                    return;
                }


                console.warn(
                    "Aprisha recognition:",
                    code
                );
            };


        r.onend =
            () => {

                if (
                    recognition !== r
                ) {
                    return;
                }


                recognition =
                    null;

                running =
                    false;

                starting =
                    false;


                if (!executing) {

                    scheduleStart(
                        400
                    );
                }
            };


        try {

            r.start();

            return true;

        }
        catch {

            recognition =
                null;

            running =
                false;

            starting =
                false;


            scheduleStart(
                700
            );


            return false;
        }
    }


    /* =====================================================
       ENABLE / DISABLE
       ===================================================== */

    async function enable() {

        try {

            if (
                navigator.mediaDevices
                    ?.getUserMedia
            ) {

                const stream =
                    await navigator
                        .mediaDevices
                        .getUserMedia({
                            audio: true
                        });


                stream
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );
            }


            localStorage.setItem(
                ENABLE_KEY,
                "1"
            );


            scheduleStart(
                100
            );


            console.log(
                "✅ APRISHA VOICE ROUTER V7 ENABLED"
            );


            return true;

        }
        catch (error) {

            console.error(
                "❌ Aprisha microphone permission:",
                error
            );


            return false;
        }
    }


    function disable() {

        localStorage.removeItem(
            ENABLE_KEY
        );


        sessionUntil =
            0;


        clearRestart();
        clearCommit();

        stopRecognizer();


        console.log(
            "Aprisha Voice Router V7 disabled"
        );
    }


    function beginSession() {

        extendSession();


        console.log(
            "🎙️ Aprisha manual conversation session opened"
        );


        scheduleStart(
            100
        );
    }


    /* =====================================================
       PRESERVE EXISTING SPEAK BUTTON

       Existing Aprisha "Speak" button can simply
       activate this router's conversation mode.
       ===================================================== */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target
                    ?.closest
                    ?.("button");


            if (!button) {
                return;
            }


            const text =
                normalize(
                    button.textContent
                );


            if (
                text === "speak"
            ) {

                beginSession();
            }

        },
        true
    );


    /* =====================================================
       PAGE LIFECYCLE
       ===================================================== */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.hidden
            ) {

                stopRecognizer();
                return;
            }


            scheduleStart(
                350
            );
        }
    );


    window.addEventListener(
        "focus",
        () => {

            scheduleStart(
                300
            );
        }
    );


    /*
     * First browser interaction guarantees
     * microphone permission can be requested.
     */
    const firstGesture =
        () => {

            document.removeEventListener(
                "pointerdown",
                firstGesture,
                true
            );


            document.removeEventListener(
                "keydown",
                firstGesture,
                true
            );


            enable();
        };


    document.addEventListener(
        "pointerdown",
        firstGesture,
        true
    );


    document.addEventListener(
        "keydown",
        firstGesture,
        true
    );


    /* =====================================================
       PUBLIC DEBUG API
       ===================================================== */

    window.APAprishaVoiceRouter = {

        enable,

        disable,

        start,

        beginSession,

        endSession,

        execute:
            executeCommand,

        status() {

            return {

                version:
                    "7",

                supported:
                    !!Recognition,

                enabled:
                    localStorage
                        .getItem(
                            ENABLE_KEY
                        ) ===
                    "1",

                running,

                executing,

                sessionActive:
                    sessionActive(),

                sessionSecondsLeft:
                    sessionActive()
                        ? Math.ceil(
                            (
                                sessionUntil -
                                Date.now()
                            ) /
                            1000
                        )
                        : 0,

                recognizer:
                    !!recognition
            };
        }
    };


    /*
     * Keep enabled across refreshes.
     */
    localStorage.setItem(
        ENABLE_KEY,
        "1"
    );


    setTimeout(
        start,
        800
    );


    console.log(
        "✅ AP SYNAPSE — APRISHA VOICE ROUTER V7 READY"
    );

})();