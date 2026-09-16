(() => {
    "use strict";

    if (
        window.__AP_APRISHA_BARGE_IN_V11__
    ) {
        return;
    }

    window.__AP_APRISHA_BARGE_IN_V11__ =
        true;


    const synth =
        window.speechSynthesis;

    const Recognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (
        !synth ||
        !Recognition
    ) {

        console.warn(
            "[APRISHA V11] Barge-in unavailable in this browser."
        );

        return;
    }


    const state = {

        sequence: 0,

        activeToken: 0,

        recognition: null,

        restartTimer: null,

        commandTimer: null,

        currentTtsText: "",

        interrupted: false,

        pendingCommand: "",

        finishing: false
    };


    function normalize(
        value
    ) {

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


    /*
     * Explicit interruption phrase.
     *
     * Examples:
     *
     * Aprisha wait...
     * Hey Aprisha wait...
     * Aprisha stop...
     * Aprisha hold on...
     * Aprisha listen...
     */

    const interruptionPattern =
        /^\s*(?:hey\s+)?aprisha(?:\s|,)+(?:wait|stop|hold\s+on|listen)\b[\s,;:!?.-]*(.*)$/i;


    function setCaptureActive(
        value
    ) {

        window.__AP_APRISHA_BARGE_CAPTURE_ACTIVE__ =
            Boolean(
                value
            );
    }


    function clearRestartTimer() {

        if (
            state.restartTimer
        ) {

            clearTimeout(
                state.restartTimer
            );

            state.restartTimer =
                null;
        }
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


    function abortRecognizer() {

        const current =
            state.recognition;

        state.recognition =
            null;


        if (!current) {
            return;
        }


        try {

            current.onend =
                null;

            current.onerror =
                null;

            current.onresult =
                null;

            current.abort();

        }
        catch {}
    }


    function setInputValue(
        input,
        value
    ) {

        try {

            const proto =
                Object.getPrototypeOf(
                    input
                );

            const descriptor =
                Object.getOwnPropertyDescriptor(
                    proto,
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


        input.dispatchEvent(
            new Event(
                "change",
                {
                    bubbles: true
                }
            )
        );
    }


    function submitToAPSynapse(
        rawText
    ) {

        const text =
            String(
                rawText || ""
            )
                .trim();


        if (!text) {
            return false;
        }


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
                "[APRISHA V11] Chat input was not found.",
                text
            );


            document.dispatchEvent(
                new CustomEvent(
                    "ap:aprisha-barge-command",
                    {
                        detail: {
                            text
                        }
                    }
                )
            );


            return false;
        }


        setInputValue(
            input,
            text
        );


        try {
            input.focus();
        }
        catch {}


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

            return true;
        }


        const form =
            input.closest(
                "form"
            );


        if (
            form?.requestSubmit
        ) {

            form.requestSubmit();

            return true;
        }


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


        return true;
    }


    function finishWithCommand(
        command
    ) {

        const clean =
            String(
                command || ""
            )
                .trim();


        if (
            !clean ||
            state.finishing
        ) {
            return;
        }


        state.finishing =
            true;

        state.pendingCommand =
            "";

        state.interrupted =
            false;


        clearCommandTimer();
        clearRestartTimer();


        setCaptureActive(
            false
        );


        abortRecognizer();


        window.__AP_APRISHA_LAST_BARGE_IN__ =
            clean;


        console.log(
            "[APRISHA V11] INTERRUPTION COMMAND:",
            clean
        );


        document.dispatchEvent(
            new CustomEvent(
                "ap:aprisha-barge-in",
                {
                    detail: {
                        text: clean
                    }
                }
            )
        );


        setTimeout(
            () => {

                const sent =
                    submitToAPSynapse(
                        clean
                    );


                console.log(
                    sent
                        ? "[APRISHA V11] New request sent."
                        : "[APRISHA V11] Could not auto-submit request."
                );


                state.finishing =
                    false;

            },
            100
        );
    }


    function armCommandTimeout() {

        clearCommandTimer();


        state.commandTimer =
            setTimeout(
                () => {

                    if (
                        !state.interrupted
                    ) {
                        return;
                    }


                    /*
                     * User said only "Aprisha wait"
                     * and then remained silent.
                     *
                     * Speech remains stopped and the normal
                     * Aprisha listener may resume.
                     */

                    console.log(
                        "[APRISHA V11] Interruption timed out; returning to normal listening."
                    );


                    state.interrupted =
                        false;

                    state.pendingCommand =
                        "";

                    setCaptureActive(
                        false
                    );


                    abortRecognizer();

                },
                10000
            );
    }


    function scheduleListenerRestart(
        token
    ) {

        clearRestartTimer();


        state.restartTimer =
            setTimeout(
                () => {

                    if (
                        token !==
                        state.activeToken
                    ) {
                        return;
                    }


                    if (
                        !synth.speaking &&
                        !state.interrupted
                    ) {

                        setCaptureActive(
                            false
                        );

                        return;
                    }


                    startBargeListener(
                        token
                    );

                },
                180
            );
    }


    function startBargeListener(
        token
    ) {

        if (
            token !==
            state.activeToken
        ) {
            return;
        }


        if (
            state.recognition
        ) {
            return;
        }


        const recognition =
            new Recognition();


        state.recognition =
            recognition;


        setCaptureActive(
            true
        );


        recognition.lang =
            navigator.language ||
            "en-IN";


        recognition.continuous =
            true;


        recognition.interimResults =
            true;


        recognition.maxAlternatives =
            3;


        recognition.onstart =
            () => {

                if (
                    state.recognition !==
                    recognition
                ) {
                    return;
                }


                console.log(
                    "[APRISHA V11] Interruption listener armed."
                );
            };


        recognition.onresult =
            event => {

                if (
                    state.recognition !==
                    recognition
                ) {
                    return;
                }


                const result =
                    event.results[
                        event.results.length - 1
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


                /*
                 * ------------------------------------------------
                 * PHASE 1
                 * Aprisha is still speaking.
                 *
                 * Ignore everything EXCEPT an explicit:
                 *
                 * "Aprisha wait..."
                 * ------------------------------------------------
                 */

                if (
                    !state.interrupted
                ) {

                    const match =
                        heard.match(
                            interruptionPattern
                        );


                    if (!match) {

                        /*
                         * Most recognition while TTS is playing
                         * will be Aprisha hearing her own speaker.
                         *
                         * Do nothing.
                         */

                        return;
                    }


                    /*
                     * Extra protection against the unlikely case
                     * where Aprisha's own TTS itself contains the
                     * interruption phrase.
                     */

                    const heardNormalized =
                        normalize(
                            heard
                        );

                    const ttsNormalized =
                        normalize(
                            state.currentTtsText
                        );


                    if (
                        ttsNormalized &&
                        heardNormalized.length > 15 &&
                        ttsNormalized.includes(
                            heardNormalized
                        )
                    ) {

                        return;
                    }


                    state.interrupted =
                        true;


                    state.pendingCommand =
                        String(
                            match[1] ||
                            ""
                        )
                            .trim();


                    console.log(
                        "[APRISHA V11] USER INTERRUPTED APRISHA:",
                        heard
                    );


                    /*
                     * Stop Aprisha immediately.
                     */

                    try {

                        synth.cancel();

                    }
                    catch {}


                    state.currentTtsText =
                        "";


                    setCaptureActive(
                        true
                    );


                    armCommandTimeout();


                    /*
                     * If Chrome already finalized the complete
                     * sentence:
                     *
                     * "Aprisha wait explain this simply"
                     *
                     * execute immediately.
                     */

                    if (
                        result.isFinal &&
                        state.pendingCommand
                    ) {

                        finishWithCommand(
                            state.pendingCommand
                        );
                    }


                    return;
                }


                /*
                 * ------------------------------------------------
                 * PHASE 2
                 * Aprisha has stopped speaking.
                 *
                 * Continue listening for the user's replacement
                 * request.
                 * ------------------------------------------------
                 */


                const repeatedTrigger =
                    heard.match(
                        interruptionPattern
                    );


                const command =
                    repeatedTrigger
                        ? String(
                            repeatedTrigger[1] ||
                            ""
                        ).trim()
                        : heard;


                if (
                    command
                ) {

                    state.pendingCommand =
                        command;
                }


                armCommandTimeout();


                if (
                    result.isFinal &&
                    state.pendingCommand
                ) {

                    finishWithCommand(
                        state.pendingCommand
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
                        "[APRISHA V11] Interruption listener event:",
                        code
                    );
                }
            };


        recognition.onend =
            () => {

                if (
                    state.recognition !==
                    recognition
                ) {
                    return;
                }


                state.recognition =
                    null;


                /*
                 * If we already captured useful words and Chrome
                 * ended without marking them final, use them.
                 */

                if (
                    state.interrupted &&
                    state.pendingCommand
                ) {

                    finishWithCommand(
                        state.pendingCommand
                    );

                    return;
                }


                if (
                    token ===
                        state.activeToken &&
                    (
                        synth.speaking ||
                        state.interrupted
                    )
                ) {

                    scheduleListenerRestart(
                        token
                    );

                    return;
                }


                setCaptureActive(
                    false
                );
            };


        try {

            recognition.start();

        }
        catch (error) {

            state.recognition =
                null;


            if (
                error?.name !==
                "InvalidStateError"
            ) {

                console.warn(
                    "[APRISHA V11] Could not start interruption listener:",
                    error
                );
            }


            scheduleListenerRestart(
                token
            );
        }
    }


    function ttsStarted(
        utterance,
        token
    ) {

        state.activeToken =
            token;

        state.currentTtsText =
            String(
                utterance?.text ||
                ""
            );

        state.interrupted =
            false;

        state.pendingCommand =
            "";

        state.finishing =
            false;


        clearCommandTimer();


        console.log(
            "[APRISHA V11] Aprisha speaking - barge-in armed."
        );


        /*
         * A short delay lets the normal conversation recognizer
         * finish its current cycle before the interruption
         * listener takes ownership.
         */

        setTimeout(
            () => {

                if (
                    token !==
                    state.activeToken
                ) {
                    return;
                }


                if (
                    synth.speaking
                ) {

                    startBargeListener(
                        token
                    );
                }

            },
            120
        );
    }


    function ttsFinished(
        token
    ) {

        if (
            token !==
            state.activeToken
        ) {
            return;
        }


        state.currentTtsText =
            "";


        /*
         * If the user interrupted, keep listening even though
         * speechSynthesis.cancel() caused TTS to finish.
         */

        if (
            state.interrupted
        ) {
            return;
        }


        state.activeToken =
            0;


        clearRestartTimer();
        clearCommandTimer();


        setCaptureActive(
            false
        );


        abortRecognizer();


        console.log(
            "[APRISHA V11] TTS complete - normal listening resumes."
        );
    }


    /*
     * =========================================================
     * WRAP THE GLOBAL SPEECH SYNTHESIS OUTPUT
     *
     * This catches:
     * - Dedicated Aprisha TTS
     * - Voice Router TTS
     * - Universal Aprisha TTS
     * - Power Core Aprisha TTS
     *
     * without rewriting each subsystem.
     * =========================================================
     */


    if (
        !synth.__apAprishaBargeWrappedV11
    ) {

        synth.__apAprishaBargeWrappedV11 =
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
                 * Chrome occasionally delays or misses the
                 * utterance start event. Use speaking state
                 * as a fallback.
                 */

                setTimeout(
                    () => {

                        if (
                            synth.speaking
                        ) {

                            startOnce();
                        }

                    },
                    100
                );


                return result;
            };
    }


    console.log(
        "[APRISHA V11] Natural interruption engine ready."
    );

})();
