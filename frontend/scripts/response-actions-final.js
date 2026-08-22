/* ============================================================
   AP SYNAPSE — RESPONSE ACTIONS FINAL

   Every AP Synapse response:
       Copy
       Read

   Applies to:
   - new answers
   - restored History answers
   - desktop
   - mobile

   Never added to user messages.
   ============================================================ */

(() => {
    "use strict";


    let activeSpeechButton = null;


    const COPY_ICON = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="8" y="8" width="10" height="10" rx="2"/>
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>
        </svg>
    `;


    const READ_ICON = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 10v4h4l5 4V6L9 10H5z"/>
            <path d="M17 9a4 4 0 0 1 0 6"/>
        </svg>
    `;


    const STOP_ICON = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="7" y="7" width="10" height="10" rx="1"/>
        </svg>
    `;


    function getChat() {

        return document.getElementById(
            "chatWindow"
        );
    }


    function isUserMessage(element) {

        return !!element.closest(`
            .user-message,
            .message.user,
            [data-role="user"]
        `);
    }


    function getResponseBody(message) {

        return (
            message.querySelector(
                ".response-content"
            ) ||

            message.querySelector(
                ".message-content"
            ) ||

            message.querySelector(
                ".markdown-body"
            ) ||

            message.querySelector(
                ".ap-response-body"
            ) ||

            message
        );
    }


    function responseText(message) {

        const body =
            getResponseBody(
                message
            );


        if (!body) {
            return "";
        }


        /*
         * Clone so UI controls, source-action buttons etc.
         * are never copied/read as answer content.
         */

        const clone =
            body.cloneNode(
                true
            );


        clone.querySelectorAll(`
            .ap-final-response-actions,
            .ap-response-actions,
            .message-actions,
            button,
            script,
            style
        `)
        .forEach(
            element =>
                element.remove()
        );


        return (
            clone.innerText ||
            clone.textContent ||
            ""
        )
        .replace(/\s+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }


    async function copyResponse(
        message,
        button
    ) {

        const text =
            responseText(
                message
            );


        if (!text) {
            return;
        }


        try {

            await navigator
                .clipboard
                .writeText(
                    text
                );

        } catch {

            const textarea =
                document.createElement(
                    "textarea"
                );


            textarea.value =
                text;


            textarea.style.position =
                "fixed";


            textarea.style.opacity =
                "0";


            document.body.appendChild(
                textarea
            );


            textarea.select();


            try {

                document.execCommand(
                    "copy"
                );

            } catch {}


            textarea.remove();
        }


        button.classList.add(
            "ap-copied"
        );


        button.querySelector(
            ".ap-final-action-label"
        ).textContent =
            "Copied";


        setTimeout(() => {

            button.classList.remove(
                "ap-copied"
            );


            const label =
                button.querySelector(
                    ".ap-final-action-label"
                );


            if (label) {

                label.textContent =
                    "Copy";
            }

        }, 1200);
    }


    function resetReadButton(
        button
    ) {

        if (!button) {
            return;
        }


        button.classList.remove(
            "ap-reading"
        );


        button.innerHTML =
            READ_ICON +
            `
            <span class="ap-final-action-label">
                Read
            </span>
            `;


        button.setAttribute(
            "aria-label",
            "Read response aloud"
        );


        if (
            activeSpeechButton ===
            button
        ) {

            activeSpeechButton =
                null;
        }
    }


    function stopSpeech() {

        if (
            "speechSynthesis" in window
        ) {

            window.speechSynthesis.cancel();
        }


        if (
            activeSpeechButton
        ) {

            const old =
                activeSpeechButton;


            activeSpeechButton =
                null;


            resetReadButton(
                old
            );
        }
    }


    function readResponse(
        message,
        button
    ) {

        if (
            !(
                "speechSynthesis" in window
            )
        ) {

            return;
        }


        /*
         * Same button while reading = Stop.
         */

        if (
            button.classList.contains(
                "ap-reading"
            )
        ) {

            stopSpeech();

            return;
        }


        stopSpeech();


        const text =
            responseText(
                message
            );


        if (!text) {
            return;
        }


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

                resetReadButton(
                    button
                );
            };


        utterance.onerror =
            () => {

                resetReadButton(
                    button
                );
            };


        activeSpeechButton =
            button;


        button.classList.add(
            "ap-reading"
        );


        button.innerHTML =
            STOP_ICON +
            `
            <span class="ap-final-action-label">
                Stop
            </span>
            `;


        button.setAttribute(
            "aria-label",
            "Stop reading response"
        );


        window.speechSynthesis.speak(
            utterance
        );
    }


    function buildActions(
        message
    ) {

        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "ap-final-response-actions";


        actions.setAttribute(
            "aria-label",
            "Response actions"
        );


        /* COPY */

        const copy =
            document.createElement(
                "button"
            );


        copy.type =
            "button";


        copy.className =
            "ap-final-response-action ap-final-copy";


        copy.setAttribute(
            "aria-label",
            "Copy response"
        );


        copy.innerHTML =
            COPY_ICON +
            `
            <span class="ap-final-action-label">
                Copy
            </span>
            `;


        copy.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                copyResponse(
                    message,
                    copy
                );

            }
        );


        /* READ */

        const read =
            document.createElement(
                "button"
            );


        read.type =
            "button";


        read.className =
            "ap-final-response-action ap-final-read";


        read.setAttribute(
            "aria-label",
            "Read response aloud"
        );


        read.innerHTML =
            READ_ICON +
            `
            <span class="ap-final-action-label">
                Read
            </span>
            `;


        read.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                readResponse(
                    message,
                    read
                );

            }
        );


        actions.append(
            copy,
            read
        );


        return actions;
    }


    function installForMessage(
        message
    ) {

        if (
            !(message instanceof HTMLElement) ||
            isUserMessage(message)
        ) {

            return;
        }


        /*
         * Do not install more than once.
         */

        if (
            message.querySelector(
                ".ap-final-response-actions"
            )
        ) {

            return;
        }


        /*
         * Remove/hide older response-action rows so the
         * final UI contains ONLY clean Copy + Read.
         */

        message
            .querySelectorAll(
                ".ap-response-actions, .message-actions"
            )
            .forEach(old => {

                old.style.setProperty(
                    "display",
                    "none",
                    "important"
                );

            });


        const body =
            getResponseBody(
                message
            );


        if (
            !body ||
            !responseText(message)
        ) {

            return;
        }


        const actions =
            buildActions(
                message
            );


        /*
         * Place directly below the visible AP response.
         */

        if (
            body !== message &&
            body.parentElement
        ) {

            body.insertAdjacentElement(
                "afterend",
                actions
            );

        } else {

            message.appendChild(
                actions
            );
        }
    }


    function scan() {

        const chat =
            getChat();


        if (!chat) {
            return;
        }


        let messages =
            chat.querySelectorAll(`
                .message.assistant,
                .assistant-message,
                .ai-message,
                .bot-message,
                [data-role="assistant"]
            `);


        /*
         * Fallback for renderers where response-content
         * itself is the only identifiable response node.
         */

        if (!messages.length) {

            messages =
                chat.querySelectorAll(
                    ".response-content"
                );
        }


        messages.forEach(
            installForMessage
        );
    }


    function start() {

        const chat =
            getChat();


        if (!chat) {

            setTimeout(
                start,
                150
            );

            return;
        }


        scan();


        const observer =
            new MutationObserver(
                () => {

                    requestAnimationFrame(
                        scan
                    );

                }
            );


        observer.observe(
            chat,
            {
                subtree:true,
                childList:true
            }
        );


        /*
         * Re-scan after History restoration/navigation.
         */

        document.addEventListener(
            "click",
            () => {

                setTimeout(
                    scan,
                    100
                );


                setTimeout(
                    scan,
                    350
                );

            },
            true
        );


        console.log(
            "✅ AP SYNAPSE — COPY + READ RESPONSE ACTIONS ACTIVE"
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            {
                once:true
            }
        );

    } else {

        start();
    }

})();
