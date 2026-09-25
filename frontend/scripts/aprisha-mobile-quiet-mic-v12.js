(() => {
    "use strict";

    if (
        window.__AP_APRISHA_QUIET_MOBILE_MIC_V12__
    ) {
        return;
    }

    window.__AP_APRISHA_QUIET_MOBILE_MIC_V12__ =
        true;

    const mobile =
        /Android|iPhone|iPad|iPod|Mobile/i
            .test(
                navigator.userAgent ||
                ""
            );

    if (!mobile) {
        window.APAprishaQuietMicV12 = {
            version: "12.0.0",
            active: false,
            reason: "desktop",
            status() {
                return {
                    mobile: false,
                    enabled: false,
                    mode: "desktop-unchanged"
                };
            }
        };

        return;
    }

    const NativeRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!NativeRecognition) {
        window.APAprishaQuietMicV12 = {
            version: "12.0.0",
            active: false,
            reason: "speech-recognition-unavailable",
            status() {
                return {
                    mobile: true,
                    enabled: false,
                    mode: "unsupported"
                };
            }
        };

        return;
    }

    let enabled = true;

    let mediaStream = null;
    let audioContext = null;
    let analyser = null;
    let samples = null;

    let vadTimer = null;

    let pendingRecognizer = null;
    let activeRecognizer = null;

    let micStarting = null;

    let manualBypassUntil = 0;
    let lastSpeechTrigger = 0;

    let noiseFloor = 0.008;
    let speechFrames = 0;

    let quietMicReady = false;
    let fallbackReason = "";

    const START_COOLDOWN_MS = 1400;
    const MANUAL_BYPASS_MS = 3500;

    const originalStartByPrototype =
        new Map();

    const patchedPrototypes =
        new Set();

    const now =
        () =>
            performance.now();

    function isSpeakingTts() {
        try {
            return Boolean(
                window.speechSynthesis
                    ?.speaking
            );
        }
        catch (_) {
            return false;
        }
    }

    function recentManualGesture() {
        return (
            now() <
            manualBypassUntil
        );
    }

    function looksLikeVoiceControl(
        target
    ) {
        const element =
            target?.closest?.(
                "button,[role='button'],a"
            );

        if (!element) {
            return false;
        }

        const descriptor = [
            element.id,
            element.className,
            element.getAttribute(
                "aria-label"
            ),
            element.getAttribute(
                "title"
            ),
            element.textContent
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return (
            /aprisha|microphone|\bmic\b|voice|speak|talk/
                .test(
                    descriptor
                )
        );
    }

    function noteManualGesture(
        event
    ) {
        if (
            looksLikeVoiceControl(
                event.target
            )
        ) {
            manualBypassUntil =
                now() +
                MANUAL_BYPASS_MS;

            resumeAudioContext();
        }
    }

    function resumeAudioContext() {
        if (
            audioContext &&
            audioContext.state ===
                "suspended"
        ) {
            audioContext
                .resume()
                .catch(
                    () => {}
                );
        }
    }

    async function stopQuietMic() {
        if (vadTimer) {
            clearInterval(
                vadTimer
            );

            vadTimer = null;
        }

        if (mediaStream) {
            for (
                const track of
                mediaStream.getTracks()
            ) {
                try {
                    track.stop();
                }
                catch (_) {}
            }

            mediaStream = null;
        }

        analyser = null;
        samples = null;

        if (audioContext) {
            try {
                await audioContext.close();
            }
            catch (_) {}

            audioContext = null;
        }

        quietMicReady = false;
        micStarting = null;
    }

    async function ensureQuietMic() {
        if (
            quietMicReady &&
            mediaStream &&
            analyser
        ) {
            resumeAudioContext();
            return true;
        }

        if (micStarting) {
            return micStarting;
        }

        micStarting =
            (async () => {
                if (
                    !navigator.mediaDevices
                        ?.getUserMedia
                ) {
                    fallbackReason =
                        "getUserMedia-unavailable";

                    return false;
                }

                try {
                    mediaStream =
                        await navigator
                            .mediaDevices
                            .getUserMedia({
                                audio: {
                                    echoCancellation:
                                        true,
                                    noiseSuppression:
                                        true,
                                    autoGainControl:
                                        true,
                                    channelCount:
                                        1
                                },
                                video:
                                    false
                            });

                    const AudioContextCtor =
                        window.AudioContext ||
                        window.webkitAudioContext;

                    if (!AudioContextCtor) {
                        fallbackReason =
                            "audio-context-unavailable";

                        await stopQuietMic();

                        return false;
                    }

                    audioContext =
                        new AudioContextCtor({
                            latencyHint:
                                "interactive"
                        });

                    const source =
                        audioContext
                            .createMediaStreamSource(
                                mediaStream
                            );

                    analyser =
                        audioContext
                            .createAnalyser();

                    analyser.fftSize =
                        1024;

                    analyser.smoothingTimeConstant =
                        0.24;

                    samples =
                        new Float32Array(
                            analyser.fftSize
                        );

                    source.connect(
                        analyser
                    );

                    resumeAudioContext();

                    quietMicReady =
                        true;

                    fallbackReason =
                        "";

                    startVadLoop();

                    console.log(
                        "🔇 APRISHA QUIET MIC ACTIVE — waiting for speech"
                    );

                    return true;
                }
                catch (error) {
                    fallbackReason =
                        String(
                            error?.name ||
                            error?.message ||
                            "mic-start-failed"
                        );

                    await stopQuietMic();

                    return false;
                }
                finally {
                    micStarting =
                        null;
                }
            })();

        return micStarting;
    }

    function calculateRms() {
        if (
            !analyser ||
            !samples
        ) {
            return 0;
        }

        analyser.getFloatTimeDomainData(
            samples
        );

        let sum = 0;

        for (
            let i = 0;
            i < samples.length;
            i++
        ) {
            const value =
                samples[i];

            sum +=
                value *
                value;
        }

        return Math.sqrt(
            sum /
            samples.length
        );
    }

    function startPendingRecognition(
        reason
    ) {
        const recognizer =
            pendingRecognizer;

        if (
            !recognizer ||
            activeRecognizer ||
            isSpeakingTts()
        ) {
            return false;
        }

        const stamp =
            now();

        if (
            stamp -
            lastSpeechTrigger <
            START_COOLDOWN_MS
        ) {
            return false;
        }

        pendingRecognizer =
            null;

        lastSpeechTrigger =
            stamp;

        const originalStart =
            originalStartByPrototype.get(
                Object.getPrototypeOf(
                    recognizer
                )
            );

        if (
            typeof originalStart !==
            "function"
        ) {
            return false;
        }

        try {
            activeRecognizer =
                recognizer;

            originalStart.call(
                recognizer
            );

            console.log(
                "🎤 APRISHA RECOGNITION STARTED:",
                reason
            );

            return true;
        }
        catch (error) {
            activeRecognizer =
                null;

            if (
                error?.name !==
                "InvalidStateError"
            ) {
                console.warn(
                    "Aprisha quiet recognition start:",
                    error?.name ||
                    error?.message ||
                    error
                );
            }

            return false;
        }
    }

    function triggerFromSpeech() {
        if (
            !enabled ||
            !pendingRecognizer ||
            activeRecognizer ||
            isSpeakingTts()
        ) {
            return;
        }

        startPendingRecognition(
            "speech-onset"
        );
    }

    function startVadLoop() {
        if (vadTimer) {
            return;
        }

        vadTimer =
            setInterval(
                () => {
                    if (
                        !enabled ||
                        document.hidden ||
                        !quietMicReady ||
                        !analyser
                    ) {
                        speechFrames = 0;
                        return;
                    }

                    if (
                        audioContext?.state ===
                        "suspended"
                    ) {
                        resumeAudioContext();
                        return;
                    }

                    if (isSpeakingTts()) {
                        speechFrames = 0;
                        return;
                    }

                    const rms =
                        calculateRms();

                    if (
                        !Number.isFinite(
                            rms
                        )
                    ) {
                        return;
                    }

                    const likelySilence =
                        rms <
                        Math.max(
                            0.028,
                            noiseFloor *
                                2.2
                        );

                    if (likelySilence) {
                        noiseFloor =
                            noiseFloor *
                                0.94 +
                            Math.max(
                                0.002,
                                rms
                            ) *
                                0.06;
                    }

                    const threshold =
                        Math.max(
                            0.026,
                            noiseFloor *
                                2.8
                        );

                    if (rms >= threshold) {
                        speechFrames += 1;
                    }
                    else {
                        speechFrames =
                            Math.max(
                                0,
                                speechFrames -
                                1
                            );
                    }

                    if (
                        speechFrames >= 2
                    ) {
                        speechFrames = 0;
                        triggerFromSpeech();
                    }
                },
                45
            );
    }

    function attachRecognizerLifecycle(
        recognizer
    ) {
        if (
            recognizer
                .__apQuietLifecycleAttached
        ) {
            return;
        }

        recognizer
            .__apQuietLifecycleAttached =
            true;

        recognizer.addEventListener(
            "start",
            () => {
                activeRecognizer =
                    recognizer;
            }
        );

        recognizer.addEventListener(
            "end",
            () => {
                if (
                    activeRecognizer ===
                    recognizer
                ) {
                    activeRecognizer =
                        null;
                }

                /*
                 * The existing Aprisha router may immediately
                 * request another recognition cycle here.
                 * Its next .start() call will be gated again
                 * until actual speech is detected.
                 */
            }
        );

        recognizer.addEventListener(
            "error",
            event => {
                const code =
                    String(
                        event?.error ||
                        ""
                    );

                if (
                    code ===
                        "not-allowed" ||
                    code ===
                        "service-not-allowed" ||
                    code ===
                        "audio-capture"
                ) {
                    if (
                        activeRecognizer ===
                        recognizer
                    ) {
                        activeRecognizer =
                            null;
                    }

                    if (
                        pendingRecognizer ===
                        recognizer
                    ) {
                        pendingRecognizer =
                            null;
                    }
                }
            }
        );
    }

    function patchPrototype(
        Constructor
    ) {
        const prototype =
            Constructor?.prototype;

        if (
            !prototype ||
            patchedPrototypes.has(
                prototype
            )
        ) {
            return;
        }

        const originalStart =
            prototype.start;

        if (
            typeof originalStart !==
            "function"
        ) {
            return;
        }

        originalStartByPrototype.set(
            prototype,
            originalStart
        );

        patchedPrototypes.add(
            prototype
        );

        prototype.start =
            function apQuietMobileStart() {
                attachRecognizerLifecycle(
                    this
                );

                if (!enabled) {
                    return originalStart.call(
                        this
                    );
                }

                /*
                 * Manual microphone/Aprisha taps should feel
                 * instant. One browser cue at an intentional
                 * user action is preferable to delayed capture.
                 */
                if (recentManualGesture()) {
                    if (
                        activeRecognizer &&
                        activeRecognizer !==
                            this
                    ) {
                        try {
                            activeRecognizer.abort();
                        }
                        catch (_) {}

                        activeRecognizer =
                            null;
                    }

                    pendingRecognizer =
                        null;

                    activeRecognizer =
                        this;

                    return originalStart.call(
                        this
                    );
                }

                /*
                 * Automatic Aprisha wake/restart calls are not
                 * allowed to continuously reopen Chrome speech.
                 * Hold the recognizer until VAD hears real speech.
                 */
                pendingRecognizer =
                    this;

                ensureQuietMic()
                    .then(
                        ready => {
                            if (!ready) {
                                /*
                                 * Never sacrifice Aprisha if this
                                 * browser cannot provide the quiet
                                 * WebAudio path.
                                 */
                                if (
                                    pendingRecognizer ===
                                        this &&
                                    !activeRecognizer
                                ) {
                                    pendingRecognizer =
                                        null;

                                    activeRecognizer =
                                        this;

                                    try {
                                        originalStart.call(
                                            this
                                        );
                                    }
                                    catch (_) {
                                        activeRecognizer =
                                            null;
                                    }
                                }
                            }
                        }
                    );

                return undefined;
            };
    }

    patchPrototype(
        window.SpeechRecognition
    );

    patchPrototype(
        window.webkitSpeechRecognition
    );

    document.addEventListener(
        "pointerdown",
        noteManualGesture,
        true
    );

    document.addEventListener(
        "touchstart",
        noteManualGesture,
        {
            capture: true,
            passive: true
        }
    );

    document.addEventListener(
        "visibilitychange",
        () => {
            if (document.hidden) {
                speechFrames = 0;

                /*
                 * Browsers are free to suspend background pages.
                 * Release the web mic instead of fighting the OS.
                 * Native Aprisha remains the system-wide path.
                 */
                stopQuietMic();
            }
            else if (
                enabled &&
                pendingRecognizer
            ) {
                ensureQuietMic();
            }
        }
    );

    window.addEventListener(
        "pagehide",
        () => {
            stopQuietMic();
        }
    );

    window.APAprishaQuietMicV12 = {
        version:
            "12.0.0",

        get active() {
            return enabled;
        },

        enable() {
            enabled = true;

            if (pendingRecognizer) {
                ensureQuietMic();
            }
        },

        disable() {
            enabled = false;
            pendingRecognizer = null;

            stopQuietMic();
        },

        async warmup() {
            enabled = true;
            return ensureQuietMic();
        },

        status() {
            return {
                mobile,
                enabled,
                quietMicReady,
                audioState:
                    audioContext?.state ||
                    "none",
                hasStream:
                    Boolean(
                        mediaStream
                    ),
                pendingRecognition:
                    Boolean(
                        pendingRecognizer
                    ),
                activeRecognition:
                    Boolean(
                        activeRecognizer
                    ),
                noiseFloor:
                    Number(
                        noiseFloor.toFixed(
                            5
                        )
                    ),
                fallbackReason
            };
        }
    };

    console.log(
        "🔇 APRISHA QUIET MOBILE MIC V12 READY"
    );
})();