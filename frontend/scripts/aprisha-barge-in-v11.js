(() => {
    "use strict";

    /*
     * =========================================================
     * AP SYNAPSE
     * APRISHA TRUE BARGE-IN V11.1
     *
     * Important design:
     *
     * We DO NOT attempt normal SpeechRecognition while Aprisha
     * is talking.
     *
     * Chrome often refuses / suppresses recognition while its
     * own SpeechSynthesis is active.
     *
     * Instead:
     *
     * 1. A real getUserMedia microphone stream remains open.
     * 2. Web Audio detects genuine incoming voice activity.
     * 3. User voice immediately cancels Aprisha TTS.
     * 4. Only THEN normal SpeechRecognition starts.
     * 5. Remaining user sentence becomes the new command.
     *
     * =========================================================
     */


    if (
        window.__AP_APRISHA_TRUE_BARGE_IN_V111__
    ) {
        return;
    }


    window.__AP_APRISHA_TRUE_BARGE_IN_V111__ =
        true;


    const synth =
        window.speechSynthesis;


    const Recognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;


    if (
        !synth ||
        !navigator.mediaDevices ||
        !AudioContextClass
    ) {

        console.warn(
            "[APRISHA V11.2] Required browser audio APIs unavailable."
        );

        return;
    }


    const state = {

        sequence: 0,
        ttsToken: 0,
        ttsActive: false,

        vadRunning: false,
        vadFrame: 0,

        baseline: 0,

        // AP_APRISHA_ANTI_SELF_TRIGGER_V112
        leakPeak: 0,
        stableThreshold: 0,

        voiceMs: 0,
        previousFrameTime: 0,
        calibrateUntil: 0,

        stream: null,
        streamLabel: "",
        streamDeviceId: "",

        audioContext: null,
        analyser: null,
        source: null,
        samples: null,

        micPromise: null,

        interrupted: false,

        commandRecognition: null,
        commandText: "",
        commandAttempts: 0,
        commandDeadline: 0,
        commandTimer: null,

        previousDedicatedOwner: false
    };


    function sleep(ms) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
        );
    }


    function normalize(value) {

        return String(
            value || ""
        )
            .toLowerCase()
            .normalize("NFKD")
            .replace(
                /[^a-z0-9\s]/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }


    function deviceScore(device) {

        const label =
            normalize(
                device?.label
            );


        if (!label) {
            return 0;
        }


        /*
         * These are playback / loopback sources,
         * not normal human microphones.
         */

        if (
            /\b(stereo mix|what u hear|loopback|monitor of|virtual cable|vb cable|cable output|output capture)\b/i
                .test(
                    label
                )
        ) {

            return -10000;
        }


        let score = 0;


        if (
            /\bmicrophone array\b/i.test(
                label
            )
        ) {
            score += 600;
        }


        if (
            /\b(headset|headphone|airpods|earbuds|bluetooth)\b/i.test(
                label
            )
        ) {
            score += 520;
        }


        if (
            /\b(usb microphone|usb mic)\b/i.test(
                label
            )
        ) {
            score += 500;
        }


        if (
            /\b(webcam|camera)\b/i.test(
                label
            )
        ) {
            score += 350;
        }


        if (
            /\b(microphone|mic)\b/i.test(
                label
            )
        ) {
            score += 300;
        }


        if (
            /\b(default)\b/i.test(
                label
            )
        ) {
            score += 20;
        }


        if (
            /\b(communications)\b/i.test(
                label
            )
        ) {
            score += 15;
        }


        return score;
    }


    function audioConstraints(
        deviceId = null
    ) {

        const constraints = {

            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
        };


        if (
            deviceId &&
            deviceId !== "default" &&
            deviceId !== "communications"
        ) {

            constraints.deviceId = {
                exact: deviceId
            };
        }


        return constraints;
    }


    function streamAlive() {

        const track =
            state.stream
                ?.getAudioTracks?.()[0];


        return Boolean(
            track &&
            track.readyState === "live"
        );
    }


    function stopCurrentStream() {

        try {

            state.stream
                ?.getTracks?.()
                .forEach(
                    track =>
                        track.stop()
                );

        }
        catch {}


        state.stream =
            null;


        try {

            state.source
                ?.disconnect?.();

        }
        catch {}


        state.source =
            null;

        state.analyser =
            null;

        state.samples =
            null;
    }


    async function setupAudioGraph(
        stream
    ) {

        if (
            !state.audioContext ||
            state.audioContext.state === "closed"
        ) {

            state.audioContext =
                new AudioContextClass();
        }


        try {

            if (
                state.audioContext.state ===
                "suspended"
            ) {

                await state.audioContext.resume();
            }

        }
        catch {}


        if (
            state.source
        ) {

            try {
                state.source.disconnect();
            }
            catch {}
        }


        const source =
            state.audioContext
                .createMediaStreamSource(
                    stream
                );


        const analyser =
            state.audioContext
                .createAnalyser();


        analyser.fftSize =
            1024;


        analyser.smoothingTimeConstant =
            0.15;


        source.connect(
            analyser
        );


        state.source =
            source;


        state.analyser =
            analyser;


        state.samples =
            new Float32Array(
                analyser.fftSize
            );
    }


    async function ensureMicrophone() {

        if (
            streamAlive() &&
            state.analyser
        ) {

            return state.stream;
        }


        if (
            state.micPromise
        ) {

            return state.micPromise;
        }


        state.micPromise =
            (async () => {

                /*
                 * First permission probe.
                 *
                 * This exposes meaningful audio-device names
                 * on browsers that hide them before permission.
                 */

                let probe = null;


                try {

                    probe =
                        await navigator
                            .mediaDevices
                            .getUserMedia({
                                audio: true
                            });

                }
                catch (error) {

                    console.warn(
                        "[APRISHA V11.2] Microphone permission unavailable:",
                        error
                    );

                    throw error;
                }


                try {

                    probe
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                }
                catch {}


                const devices =
                    await navigator
                        .mediaDevices
                        .enumerateDevices();


                const inputs =
                    devices
                        .filter(
                            device =>
                                device.kind ===
                                "audioinput"
                        )
                        .map(
                            device => ({
                                device,
                                score:
                                    deviceScore(
                                        device
                                    )
                            })
                        )
                        .filter(
                            item =>
                                item.score >
                                -10000
                        )
                        .sort(
                            (a, b) =>
                                b.score -
                                a.score
                        );


                let selectedStream =
                    null;


                let selectedDevice =
                    null;


                /*
                 * Prefer a physical microphone ID rather than
                 * browser aliases such as "default".
                 */

                const physicalFirst = [
                    ...inputs.filter(
                        item =>
                            item.device.deviceId !==
                                "default" &&
                            item.device.deviceId !==
                                "communications"
                    ),

                    ...inputs.filter(
                        item =>
                            item.device.deviceId ===
                                "default" ||
                            item.device.deviceId ===
                                "communications"
                    )
                ];


                for (
                    const item
                    of physicalFirst
                ) {

                    if (
                        item.score <= 0
                    ) {
                        continue;
                    }


                    try {

                        selectedStream =
                            await navigator
                                .mediaDevices
                                .getUserMedia({
                                    audio:
                                        audioConstraints(
                                            item
                                                .device
                                                .deviceId
                                        )
                                });


                        selectedDevice =
                            item.device;


                        break;

                    }
                    catch {}
                }


                /*
                 * Last fallback:
                 * browser-selected input, but still request
                 * echo cancellation / noise suppression.
                 */

                if (
                    !selectedStream
                ) {

                    selectedStream =
                        await navigator
                            .mediaDevices
                            .getUserMedia({
                                audio:
                                    audioConstraints()
                            });


                    selectedDevice =
                        null;
                }


                stopCurrentStream();


                state.stream =
                    selectedStream;


                const liveTrack =
                    selectedStream
                        .getAudioTracks()[0];


                state.streamLabel =
                    liveTrack?.label ||
                    selectedDevice?.label ||
                    "Microphone";


                state.streamDeviceId =
                    selectedDevice?.deviceId ||
                    "";


                await setupAudioGraph(
                    selectedStream
                );


                console.log(
                    "[APRISHA V11.2] Selected microphone:",
                    state.streamLabel
                );


                return selectedStream;

            })();


        try {

            return await state.micPromise;

        }
        finally {

            state.micPromise =
                null;
        }
    }


    function stopVad() {

        state.vadRunning =
            false;


        if (
            state.vadFrame
        ) {

            cancelAnimationFrame(
                state.vadFrame
            );


            state.vadFrame =
                0;
        }


        state.voiceMs =
            0;
    }


    function calculateRms() {

        if (
            !state.analyser ||
            !state.samples
        ) {

            return 0;
        }


        state.analyser
            .getFloatTimeDomainData(
                state.samples
            );


        let sum = 0;


        for (
            let i = 0;
            i < state.samples.length;
            i++
        ) {

            const sample =
                state.samples[i];


            sum +=
                sample *
                sample;
        }


        return Math.sqrt(
            sum /
            state.samples.length
        );
    }


    async function startVad(
        token
    ) {

        if (
            token !==
            state.ttsToken
        ) {
            return;
        }


        try {

            await ensureMicrophone();

        }
        catch {

            return;
        }


        if (
            token !== state.ttsToken ||
            !state.ttsActive ||
            !synth.speaking
        ) {

            return;
        }


        try {

            if (
                state.audioContext?.state ===
                "suspended"
            ) {

                await state.audioContext.resume();
            }

        }
        catch {}


        state.vadRunning =
            true;


        state.baseline =
            0;


        state.leakPeak =
            0;


        state.stableThreshold =
            0;


        state.voiceMs =
            0;


        state.previousFrameTime =
            performance.now();


        /*
         * AP_APRISHA_ANTI_SELF_TRIGGER_V112
         *
         * First learn Aprisha's own loudspeaker leakage.
         *
         * V11.1 used only 350ms and could mistake the beginning
         * of Aprisha's own voice for a human interruption.
         */

        state.calibrateUntil =
            performance.now() +
            900;


        console.log(
            "[APRISHA V11.2] Raw mic barge-in armed on:",
            state.streamLabel
        );


        const loop =
            now => {

                if (
                    !state.vadRunning ||
                    token !==
                        state.ttsToken ||
                    !state.ttsActive
                ) {

                    return;
                }


                const rms =
                    calculateRms();


                const dt =
                    Math.max(
                        8,
                        Math.min(
                            60,
                            now -
                            state.previousFrameTime
                        )
                    );


                state.previousFrameTime =
                    now;


                if (
                    now <
                    state.calibrateUntil
                ) {

                    if (
                        state.baseline === 0
                    ) {

                        state.baseline =
                            rms;
                    }
                    else {

                        state.baseline =
                            state.baseline *
                                0.82 +
                            rms *
                                0.18;
                    }


                    /*
                     * Remember the strongest normal sound caused
                     * by Aprisha's own speakers.
                     */

                    state.leakPeak =
                        Math.max(
                            state.leakPeak,
                            rms
                        );


                    state.vadFrame =
                        requestAnimationFrame(
                            loop
                        );


                    return;
                }


                /*
                 * Dynamic threshold.
                 *
                 * Echo-cancelled TTS leakage becomes baseline.
                 * Human speech should produce a substantial
                 * rise above that baseline.
                 */

                /*
                 * AP_APRISHA_ANTI_SELF_TRIGGER_V112
                 *
                 * V11.1 example:
                 *
                 * speaker leakage = ~0.020
                 * threshold       = 0.014
                 *
                 * Result: Aprisha interrupted herself.
                 *
                 * V11.2 requires a substantial increase above
                 * BOTH the normal noise floor and Aprisha's
                 * measured speaker leakage.
                 */

                if (
                    !state.stableThreshold
                ) {

                    state.stableThreshold =
                        Math.max(
                            0.028,
                            state.baseline *
                                3.0,
                            state.leakPeak *
                                1.70
                        );


                    console.log(
                        "[APRISHA V11.2] Anti-echo calibrated:",
                        {
                            baseline:
                                state.baseline,

                            speakerLeak:
                                state.leakPeak,

                            interruptionThreshold:
                                state.stableThreshold
                        }
                    );
                }


                const threshold =
                    Math.max(
                        state.stableThreshold,
                        state.baseline *
                            2.8
                    );


                if (
                    rms >
                    threshold
                ) {

                    state.voiceMs +=
                        dt;
                }
                else {

                    state.voiceMs =
                        Math.max(
                            0,
                            state.voiceMs -
                            dt *
                            0.8
                        );


                    if (
                        rms <
                        threshold *
                        1.25
                    ) {

                        state.baseline =
                            state.baseline *
                                0.995 +
                            rms *
                                0.005;
                    }
                }


                /*
                 * Require sustained voice rather than one short
                 * speaker/room transient.
                 */

                if (
                    state.voiceMs >=
                    300
                ) {

                    interruptAprisha(
                        rms,
                        threshold
                    );


                    return;
                }


                state.vadFrame =
                    requestAnimationFrame(
                        loop
                    );
            };


        state.vadFrame =
            requestAnimationFrame(
                loop
            );
    }


    function clearCommandTimer() {

        if (
            state.commandTimer
        ) {

            clearTimeout(
                state.commandTimer
            );


            state.commandTimer =
                null;
        }
    }


    function stopCommandRecognition() {

        const current =
            state.commandRecognition;


        state.commandRecognition =
            null;


        if (!current) {
            return;
        }


        try {

            current.onresult =
                null;

            current.onerror =
                null;

            current.onend =
                null;

            current.abort();

        }
        catch {}
    }


    function cleanReplacementCommand(
        raw
    ) {

        let text =
            String(
                raw || ""
            )
                .trim();


        text =
            text.replace(
                /^\s*(?:hey\s+)?aprisha\b[\s,;:!?.-]*/i,
                ""
            );


        text =
            text.replace(
                /^\s*(?:wait|stop|pause|listen|hold\s+on)\b[\s,;:!?.-]*/i,
                ""
            );


        return text.trim();
    }


    function setInputValue(
        input,
        value
    ) {

        try {

            const descriptor =
                Object.getOwnPropertyDescriptor(
                    Object.getPrototypeOf(
                        input
                    ),
                    "value"
                );


            if (
                descriptor?.set
            ) {

                descriptor.set.call(
                    input,
                    value
                );
            }
            else {

                input.value =
                    value;
            }

        }
        catch {

            input.value =
                value;
        }


        input.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles: true
                }
            )
        );
    }


    function submitCommand(
        raw
    ) {

        const text =
            cleanReplacementCommand(
                raw
            );


        if (!text) {

            console.log(
                "[APRISHA V11.2] Speech stopped; no replacement command captured."
            );


            releaseCapture();


            return;
        }


        console.log(
            "[APRISHA V11.2] INTERRUPTION COMMAND:",
            text
        );


        window.__AP_APRISHA_LAST_BARGE_IN__ =
            text;


        document.dispatchEvent(
            new CustomEvent(
                "ap:aprisha-barge-in",
                {
                    detail: {
                        text
                    }
                }
            )
        );


        const input =
            document.querySelector(
                "#userInput"
            ) ||
            document.querySelector(
                "textarea[data-chat-input]"
            ) ||
            document.querySelector(
                "textarea[placeholder*='Ask']"
            ) ||
            document.querySelector(
                "input[placeholder*='Ask']"
            );


        if (!input) {

            console.error(
                "[APRISHA V11.2] Chat input unavailable."
            );


            releaseCapture();

            return;
        }


        setInputValue(
            input,
            text
        );


        const send =
            document.querySelector(
                "#sendBtn"
            ) ||
            document.querySelector(
                "button.command-send"
            ) ||
            document.querySelector(
                "button[aria-label='Send']"
            ) ||
            document.querySelector(
                "button[aria-label='Send message']"
            );


        if (
            send &&
            !send.disabled
        ) {

            send.click();

        }
        else {

            const form =
                input.closest(
                    "form"
                );


            if (
                form?.requestSubmit
            ) {

                form.requestSubmit();

            }
            else {

                input.dispatchEvent(
                    new KeyboardEvent(
                        "keydown",
                        {
                            key: "Enter",
                            code: "Enter",
                            bubbles: true,
                            cancelable: true
                        }
                    )
                );
            }
        }


        console.log(
            "[APRISHA V11.2] New request sent."
        );


        setTimeout(
            releaseCapture,
            250
        );
    }


    function releaseCapture() {

        clearCommandTimer();

        stopCommandRecognition();


        window.__AP_APRISHA_BARGE_CAPTURE_ACTIVE__ =
            false;


        /*
         * Restore the microphone ownership state that existed
         * before the interruption.
         */

        window.__AP_APRISHA_DEDICATED_MIC__ =
            Boolean(
                state.previousDedicatedOwner
            );


        state.interrupted =
            false;


        state.commandText =
            "";


        state.commandAttempts =
            0;


        console.log(
            "[APRISHA V11.2] Normal Aprisha listening released."
        );
    }


    function beginCommandRecognition() {

        if (
            !Recognition
        ) {

            console.warn(
                "[APRISHA V11.2] SpeechRecognition unavailable after interruption."
            );


            releaseCapture();

            return;
        }


        if (
            !state.interrupted ||
            state.commandRecognition
        ) {

            return;
        }


        if (
            performance.now() >
            state.commandDeadline
        ) {

            submitCommand(
                state.commandText
            );


            return;
        }


        state.commandAttempts++;


        const recognition =
            new Recognition();


        state.commandRecognition =
            recognition;


        recognition.lang =
            navigator.language ||
            "en-IN";


        recognition.continuous =
            false;


        recognition.interimResults =
            true;


        recognition.maxAlternatives =
            3;


        recognition.onstart =
            () => {

                console.log(
                    "[APRISHA V11.2] Listening for replacement command..."
                );
            };


        recognition.onresult =
            event => {

                const result =
                    event.results[
                        event.results.length -
                        1
                    ];


                const heard =
                    String(
                        result?.[0]
                            ?.transcript ||
                        ""
                    )
                        .trim();


                if (!heard) {
                    return;
                }


                state.commandText =
                    heard;


                console.log(
                    "[APRISHA V11.2] Heard after interruption:",
                    heard
                );


                if (
                    result.isFinal
                ) {

                    stopCommandRecognition();


                    submitCommand(
                        heard
                    );
                }
            };


        recognition.onerror =
            event => {

                const code =
                    String(
                        event?.error ||
                        ""
                    );


                if (
                    code !== "no-speech" &&
                    code !== "aborted"
                ) {

                    console.warn(
                        "[APRISHA V11.2] Replacement listener event:",
                        code
                    );
                }
            };


        recognition.onend =
            () => {

                if (
                    state.commandRecognition ===
                    recognition
                ) {

                    state.commandRecognition =
                        null;
                }


                if (
                    !state.interrupted
                ) {
                    return;
                }


                if (
                    state.commandText
                ) {

                    submitCommand(
                        state.commandText
                    );


                    return;
                }


                /*
                 * Chrome may need a moment after TTS cancellation.
                 * Retry briefly rather than immediately giving up.
                 */

                if (
                    performance.now() <
                        state.commandDeadline &&
                    state.commandAttempts <
                        4
                ) {

                    setTimeout(
                        beginCommandRecognition,
                        100
                    );


                    return;
                }


                submitCommand("");
            };


        try {

            recognition.start();

        }
        catch (error) {

            state.commandRecognition =
                null;


            if (
                error?.name ===
                "InvalidStateError"
            ) {

                setTimeout(
                    beginCommandRecognition,
                    100
                );


                return;
            }


            console.warn(
                "[APRISHA V11.2] Replacement recognizer failed:",
                error
            );


            releaseCapture();
        }
    }


    function interruptAprisha(
        rms,
        threshold
    ) {

        if (
            state.interrupted ||
            !state.ttsActive
        ) {

            return;
        }


        state.interrupted =
            true;


        stopVad();


        /*
         * Prevent V8 and Voice Router from starting another
         * SpeechRecognition during this handoff.
         */

        state.previousDedicatedOwner =
            Boolean(
                window.__AP_APRISHA_DEDICATED_MIC__
            );


        window.__AP_APRISHA_BARGE_CAPTURE_ACTIVE__ =
            true;


        window.__AP_APRISHA_DEDICATED_MIC__ =
            true;


        console.log(
            "[APRISHA V11.2] USER VOICE DETECTED - INTERRUPTING.",
            {
                level: rms,
                threshold
            }
        );


        document.dispatchEvent(
            new CustomEvent(
                "ap:aprisha-user-interrupt"
            )
        );


        /*
         * Stop Aprisha immediately.
         */

        try {

            synth.cancel();

        }
        catch {}


        state.ttsActive =
            false;


        state.commandText =
            "";


        state.commandAttempts =
            0;


        state.commandDeadline =
            performance.now() +
            5500;


        /*
         * Give Chrome a short moment to fully release TTS,
         * then use its normal speech recognizer for the
         * remainder of the user's sentence.
         */

        setTimeout(
            beginCommandRecognition,
            90
        );


        clearCommandTimer();


        state.commandTimer =
            setTimeout(
                () => {

                    if (
                        state.interrupted
                    ) {

                        submitCommand(
                            state.commandText
                        );
                    }

                },
                6000
            );
    }


    function ttsStarted(
        utterance,
        token
    ) {

        state.ttsToken =
            token;


        state.ttsActive =
            true;


        state.interrupted =
            false;


        state.commandText =
            "";


        state.commandAttempts =
            0;


        stopVad();


        console.log(
            "[APRISHA V11.2] Aprisha speaking - TRUE barge-in preparing."
        );


        startVad(
            token
        );
    }


    function ttsFinished(
        token
    ) {

        if (
            token !==
            state.ttsToken
        ) {

            return;
        }


        /*
         * Cancellation caused by user interruption must NOT
         * release the capture ownership yet.
         */

        if (
            state.interrupted
        ) {

            return;
        }


        state.ttsActive =
            false;


        stopVad();


        window.__AP_APRISHA_BARGE_CAPTURE_ACTIVE__ =
            false;


        console.log(
            "[APRISHA V11.2] TTS complete - normal listening continues."
        );
    }


    /*
     * =========================================================
     * Wrap all Aprisha browser TTS through one common layer.
     * =========================================================
     */

    if (
        !synth.__apAprishaTrueBargeWrappedV111
    ) {

        synth.__apAprishaTrueBargeWrappedV111 =
            true;


        const nativeSpeak =
            synth.speak.bind(
                synth
            );


        synth.speak =
            function (
                utterance
            ) {

                const token =
                    ++state.sequence;


                let started =
                    false;


                let finished =
                    false;


                const startOnce =
                    () => {

                        if (started) {
                            return;
                        }


                        started =
                            true;


                        ttsStarted(
                            utterance,
                            token
                        );
                    };


                const finishOnce =
                    () => {

                        if (finished) {
                            return;
                        }


                        finished =
                            true;


                        ttsFinished(
                            token
                        );
                    };


                try {

                    utterance
                        ?.addEventListener?.(
                            "start",
                            startOnce,
                            {
                                once: true
                            }
                        );


                    utterance
                        ?.addEventListener?.(
                            "end",
                            finishOnce,
                            {
                                once: true
                            }
                        );


                    utterance
                        ?.addEventListener?.(
                            "error",
                            finishOnce,
                            {
                                once: true
                            }
                        );

                }
                catch {}


                const result =
                    nativeSpeak(
                        utterance
                    );


                /*
                 * Fallback for Chrome builds that occasionally
                 * miss SpeechSynthesisUtterance.onstart.
                 */

                setTimeout(
                    () => {

                        if (
                            synth.speaking
                        ) {

                            startOnce();
                        }

                    },
                    80
                );


                return result;
            };
    }


    /*
     * =========================================================
     * PRE-WARM REAL MICROPHONE
     *
     * When a user intentionally interacts with Aprisha/Speak,
     * get microphone permission and select the best real input
     * before Aprisha later needs barge-in.
     * =========================================================
     */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target
                    ?.closest?.(
                        "button,[role='button']"
                    );


            const text =
                normalize(
                    button?.textContent
                );


            if (
                text.includes(
                    "aprisha"
                ) ||
                text === "speak"
            ) {

                ensureMicrophone()
                    .catch(
                        () => {}
                    );
            }

        },
        true
    );


    /*
     * If headset / USB microphone changes, rediscover next use.
     */

    try {

        navigator.mediaDevices
            .addEventListener(
                "devicechange",
                () => {

                    stopCurrentStream();

                    console.log(
                        "[APRISHA V11.2] Audio devices changed - microphone will be reselected."
                    );
                }
            );

    }
    catch {}


    window.APAprishaBargeInV111 = {

        ensureMicrophone,

        getState() {

            return {

                microphone:
                    state.streamLabel,

                streamAlive:
                    streamAlive(),

                ttsActive:
                    state.ttsActive,

                interrupted:
                    state.interrupted,

                captureActive:
                    Boolean(
                        window.__AP_APRISHA_BARGE_CAPTURE_ACTIVE__
                    )
            };
        }

    };


    console.log(
        "[APRISHA V11.2] TRUE BARGE-IN ENGINE READY"
    );

})();
