/* ============================================================
   AP SYNAPSE — EXCLUSIVE COMPOSER READ CONTROLLER V4

   SAME SPEAKER BUTTON:

   IDLE
      ↓ click
   PLAYING FROM START
      ↓ click
   PAUSED
      ↓ click
   RESUMED FROM SAME POSITION
      ↓ click
   RESTARTED FROM BEGINNING
      ↓ click
   PAUSED
      ...

   IMPORTANT:
   The OLD Read-Aloud click handler is completely blocked.
   ============================================================ */

(() => {
    "use strict";


    const speech =
        window.speechSynthesis;


    if (!speech) {

        console.warn(
            "AP Synapse: Speech synthesis unavailable."
        );

        return;
    }


    let state =
        "idle";


    let activeButton =
        null;


    let activeUtterance =
        null;


    let activeText =
        "";


    /*
     * States:
     *
     * idle
     * playing
     * paused
     * resumed
     */


    /* ========================================================
       FIND COMPOSER
       ======================================================== */

    function findInput() {

        return (
            document.getElementById("userInput") ||

            document.getElementById("messageInput") ||

            document.getElementById("chatInput") ||

            document.querySelector(
                'textarea[placeholder*="Ask AP Synapse" i]'
            ) ||

            document.querySelector(
                'input[placeholder*="Ask AP Synapse" i]'
            ) ||

            document.querySelector(
                'textarea[placeholder*="AP Synapse" i]'
            ) ||

            document.querySelector(
                'input[placeholder*="AP Synapse" i]'
            )
        );
    }


    function findComposer() {

        const input =
            findInput();


        if (!input) {
            return null;
        }


        return (
            input.closest(`
                .composer,
                .chat-composer,
                .composer-shell,
                .composer-container,
                .chat-input-container,
                .input-container,
                .input-bar,
                .command-bar,
                .ap-composer-final,
                .ap-mobile-composer-final
            `)
            ||
            input.parentElement?.parentElement
            ||
            input.parentElement
        );
    }


    /* ========================================================
       FIND THE COMPOSER SPEAKER BUTTON
       ======================================================== */

    function semantic(button) {

        return [

            button.id,
            button.className,

            button.getAttribute(
                "aria-label"
            ),

            button.getAttribute(
                "title"
            ),

            button.getAttribute(
                "data-action"
            ),

            button.getAttribute(
                "data-command"
            ),

            button.getAttribute(
                "data-icon-action"
            )

        ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    }


    function isSpeakerButton(button) {

        if (
            !(button instanceof HTMLElement)
        ) {

            return false;
        }


        const composer =
            findComposer();


        if (
            !composer ||
            !composer.contains(button)
        ) {

            return false;
        }


        /*
         * Never hijack these composer controls.
         */

        const info =
            semantic(
                button
            );


        if (
            /microphone|\bmic\b|dictat|voice.?input|speech.?input/
                .test(info)
        ) {

            return false;
        }


        if (
            /image|photo|picture|gallery/
                .test(info)
        ) {

            return false;
        }


        if (
            /send|submit/
                .test(info)
        ) {

            return false;
        }


        if (
            /attach|upload|file/
                .test(info)
        ) {

            return false;
        }


        /*
         * Known Read-Aloud identifiers.
         */

        if (
            /read.?aloud|read.?response|speaker|speak.?response|audio.?response/
                .test(info)
        ) {

            return true;
        }


        if (
            button.matches(`
                #readBtn,
                #readAloudBtn,
                #readResponseBtn,
                #speakerBtn,
                .read-aloud-btn,
                .read-response-btn,
                .speaker-btn
            `)
        ) {

            return true;
        }


        /*
         * SVG speaker fallback.
         */

        const svg =
            button.querySelector(
                "svg"
            );


        if (!svg) {
            return false;
        }


        const markup =
            svg.innerHTML
                .replace(/\s+/g, " ")
                .toLowerCase();


        const rect =
            button.getBoundingClientRect();


        return (
            rect.width <= 60 &&
            rect.height <= 60 &&
            (
                markup.includes("17 9") ||
                markup.includes("5 10") ||
                markup.includes("14 6") ||
                markup.includes("speaker")
            )
        );
    }


    function getSpeakerFromEvent(event) {

        const target =
            event.target;


        if (!(target instanceof Element)) {
            return null;
        }


        const button =
            target.closest(
                "button,[role='button']"
            );


        return (
            button &&
            isSpeakerButton(button)
        )
            ?
            button
            :
            null;
    }


    /* ========================================================
       GET LATEST AP SYNAPSE RESPONSE
       ======================================================== */

    function latestAssistantMessage() {

        const chat =
            document.getElementById(
                "chatWindow"
            );


        if (!chat) {
            return null;
        }


        const selectors = `
            .message.assistant,
            .assistant-message,
            .ai-message,
            .bot-message,
            [data-role="assistant"]
        `;


        const messages =
            [...chat.querySelectorAll(
                selectors
            )]
            .filter(element => {

                return !element.closest(
                    ".user-message, .message.user, [data-role='user']"
                );

            });


        if (messages.length) {

            return messages[
                messages.length - 1
            ];
        }


        /*
         * Renderer fallback.
         */

        const responses =
            [...chat.querySelectorAll(
                ".response-content, .ap-response-body"
            )];


        return (
            responses[
                responses.length - 1
            ] || null
        );
    }


    function getResponseText() {

        const message =
            latestAssistantMessage();


        if (!message) {
            return "";
        }


        const clone =
            message.cloneNode(
                true
            );


        /*
         * Don't read buttons/actions/UI labels.
         */

        clone
            .querySelectorAll(`
                .ap-response-actions,
                .message-actions,
                .ap-final-response-actions,
                button,
                script,
                style,
                textarea,
                input
            `)
            .forEach(element =>
                element.remove()
            );


        return (
            clone.innerText ||
            clone.textContent ||
            ""
        )
        .replace(
            /\n{3,}/g,
            "\n\n"
        )
        .replace(
            /[ \t]{2,}/g,
            " "
        )
        .trim();
    }


    /* ========================================================
       BUTTON STATES
       ======================================================== */

    function clearButtonState(
        button
    ) {

        if (!button) {
            return;
        }


        button.classList.remove(
            "ap-reading-active",
            "ap-read-paused",
            "ap-read-resumed"
        );
    }


    function showIdle(
        button
    ) {

        clearButtonState(
            button
        );


        if (button) {

            button.dataset.apReadState =
                "idle";


            button.setAttribute(
                "aria-label",
                "Read response"
            );


            button.setAttribute(
                "title",
                "Read response"
            );


            button.setAttribute(
                "aria-pressed",
                "false"
            );
        }


        state =
            "idle";
    }


    function showPlaying(
        button
    ) {

        clearButtonState(
            button
        );


        button.classList.add(
            "ap-reading-active"
        );


        button.dataset.apReadState =
            "playing";


        button.setAttribute(
            "aria-label",
            "Pause reading"
        );


        button.setAttribute(
            "title",
            "Pause reading"
        );


        button.setAttribute(
            "aria-pressed",
            "true"
        );


        activeButton =
            button;


        state =
            "playing";
    }


    function showPaused(
        button
    ) {

        clearButtonState(
            button
        );


        button.classList.add(
            "ap-read-paused"
        );


        button.dataset.apReadState =
            "paused";


        button.setAttribute(
            "aria-label",
            "Resume reading"
        );


        button.setAttribute(
            "title",
            "Resume reading"
        );


        button.setAttribute(
            "aria-pressed",
            "true"
        );


        activeButton =
            button;


        state =
            "paused";
    }


    function showResumed(
        button
    ) {

        clearButtonState(
            button
        );


        button.classList.add(
            "ap-read-resumed"
        );


        button.dataset.apReadState =
            "resumed";


        button.setAttribute(
            "aria-label",
            "Restart reading from beginning"
        );


        button.setAttribute(
            "title",
            "Restart reading from beginning"
        );


        button.setAttribute(
            "aria-pressed",
            "true"
        );


        activeButton =
            button;


        state =
            "resumed";
    }


    /* ========================================================
       CREATE ONE PERSISTENT UTTERANCE
       ======================================================== */

    function createUtterance(
        text,
        button
    ) {

        const utterance =
            new SpeechSynthesisUtterance(
                text
            );


        utterance.rate =
            1;


        utterance.pitch =
            1;


        utterance.volume =
            1;


        utterance.onend =
            () => {

                /*
                 * Ignore onend from an OLD utterance which
                 * was cancelled during Restart.
                 */

                if (
                    activeUtterance !==
                    utterance
                ) {

                    return;
                }


                activeUtterance =
                    null;


                activeText =
                    "";


                showIdle(
                    button
                );


                console.log(
                    "✅ AP SYNAPSE — READING COMPLETED"
                );
            };


        utterance.onerror =
            event => {

                /*
                 * cancel() can produce an interrupted/canceled
                 * error. Do not treat that as a failure.
                 */

                if (
                    activeUtterance !==
                    utterance
                ) {

                    return;
                }


                if (
                    event.error ===
                        "canceled" ||
                    event.error ===
                        "interrupted"
                ) {

                    return;
                }


                activeUtterance =
                    null;


                activeText =
                    "";


                showIdle(
                    button
                );


                console.warn(
                    "AP Synapse Read Aloud:",
                    event.error
                );
            };


        return utterance;
    }


    /* ========================================================
       START FROM BEGINNING
       ======================================================== */

    function startFromBeginning(
        button
    ) {

        const text =
            getResponseText();


        if (!text) {

            console.warn(
                "AP Synapse: no response available to read."
            );

            showIdle(
                button
            );

            return;
        }


        /*
         * Completely kill anything left by the old/native
         * speech system.
         */

        speech.cancel();


        activeText =
            text;


        activeUtterance =
            createUtterance(
                text,
                button
            );


        /*
         * Safari/iOS behaves more reliably if speak()
         * happens one frame after cancel().
         */

        requestAnimationFrame(
            () => {

                speech.speak(
                    activeUtterance
                );


                showPlaying(
                    button
                );


                console.log(
                    "▶ AP SYNAPSE — READING FROM BEGINNING"
                );
            }
        );
    }


    /* ========================================================
       PAUSE CURRENT UTTERANCE
       ======================================================== */

    function pauseReading(
        button
    ) {

        if (
            !activeUtterance
        ) {

            showIdle(
                button
            );

            return;
        }


        speech.pause();


        showPaused(
            button
        );


        console.log(
            "⏸ AP SYNAPSE — READING PAUSED"
        );
    }


    /* ========================================================
       RESUME SAME UTTERANCE
       ======================================================== */

    function resumeReading(
        button
    ) {

        if (
            !activeUtterance
        ) {

            /*
             * If browser discarded the utterance,
             * safely restart instead of doing nothing.
             */

            startFromBeginning(
                button
            );

            return;
        }


        /*
         * THIS is the critical difference:
         *
         * We DO NOT call speak() again.
         * We resume the SAME SpeechSynthesisUtterance.
         */

        speech.resume();


        showResumed(
            button
        );


        console.log(
            "▶ AP SYNAPSE — READING RESUMED FROM SAME POSITION"
        );
    }


    /* ========================================================
       FOURTH CLICK — RESTART
       ======================================================== */

    function restartReading(
        button
    ) {

        /*
         * Make old callbacks harmless BEFORE cancel.
         */

        activeUtterance =
            null;


        speech.cancel();


        activeText =
            "";


        showIdle(
            button
        );


        /*
         * New utterance = true restart from character 0.
         */

        setTimeout(
            () => {

                startFromBeginning(
                    button
                );

            },
            50
        );


        console.log(
            "⏮ AP SYNAPSE — RESTART REQUESTED"
        );
    }


    /* ========================================================
       EXCLUSIVE CLICK CONTROLLER

       Capture on WINDOW means this executes BEFORE
       document/button handlers.

       EVERY speaker click is stopped here.
       The OLD Read Aloud handler NEVER receives it.
       ======================================================== */

    window.addEventListener(
        "click",
        event => {

            const button =
                getSpeakerFromEvent(
                    event
                );


            if (!button) {
                return;
            }


            /*
             * Always block old AP Synapse Read handler.
             */

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();


            /*
             * IDLE
             * click 1
             */

            if (
                state === "idle"
            ) {

                startFromBeginning(
                    button
                );

                return;
            }


            /*
             * PLAYING
             * click 2
             */

            if (
                state === "playing"
            ) {

                pauseReading(
                    button
                );

                return;
            }


            /*
             * PAUSED
             * click 3
             */

            if (
                state === "paused"
            ) {

                resumeReading(
                    button
                );

                return;
            }


            /*
             * RESUMED
             * click 4
             */

            if (
                state === "resumed"
            ) {

                restartReading(
                    button
                );

                return;
            }

        },
        true
    );


    /* ========================================================
       SAFETY RESET
       ======================================================== */

    window.addEventListener(
        "pagehide",
        () => {

            activeUtterance =
                null;


            activeText =
                "";


            speech.cancel();


            if (
                activeButton
            ) {

                showIdle(
                    activeButton
                );
            }

        }
    );


    console.log(
        "✅ AP SYNAPSE — EXCLUSIVE READ CONTROLLER V4 ACTIVE"
    );

})();
