(() => {
    "use strict";

    function createPresenceHome() {

        if (
            document.getElementById(
                "apAprishaPresenceHome"
            )
        ) return;

        const home =
            document.createElement("section");

        home.id =
            "apAprishaPresenceHome";

        home.setAttribute(
            "aria-hidden",
            "true"
        );

        home.innerHTML = `
            <div class="ap-presence-backdrop"></div>

            <header class="ap-presence-top">

                <div class="ap-presence-brand">

                    <div class="ap-presence-logo">
                        AP
                    </div>

                    <div>
                        <strong>Aprisha</strong>
                        <span>AP Presence</span>
                    </div>

                </div>

                <div class="ap-presence-top-actions">

                    <span
                        id="apPresenceConnection"
                        class="ap-presence-connection"
                    >
                        ● Ready
                    </span>

                    <button
                        id="apPresenceClose"
                        type="button"
                        aria-label="Close Aprisha Presence"
                    >
                        ×
                    </button>

                </div>

            </header>


            <main class="ap-presence-stage">

                <div class="ap-presence-intelligence">

                    <div
                        id="apPresenceCore"
                        class="ap-presence-core"
                        data-mode="ready"
                    >

                        <div class="ap-presence-ring ring-1"></div>
                        <div class="ap-presence-ring ring-2"></div>
                        <div class="ap-presence-ring ring-3"></div>
                        <div class="ap-presence-ring ring-4"></div>

                        <div class="ap-presence-node">
                            AP
                        </div>

                    </div>


                    <div
                        id="apPresenceState"
                        class="ap-presence-state"
                    >
                        Aprisha
                    </div>


                    <div
                        id="apPresenceTranscript"
                        class="ap-presence-transcript"
                    >
                        Say “Hey Aprisha”
                    </div>


                    <div class="ap-presence-hint">
                        Voice · Intelligence · Continuity
                    </div>

                </div>


                <div class="ap-presence-suggestions">

                    <button
                        type="button"
                        data-ap-command="Help me understand this"
                    >
                        Explain this
                    </button>

                    <button
                        type="button"
                        data-ap-command="Give me a short summary"
                    >
                        Summarize
                    </button>

                    <button
                        type="button"
                        data-ap-command="Stay with me"
                    >
                        Stay with me
                    </button>

                </div>

            </main>


            <footer class="ap-presence-controls">

                <button
                    id="apPresenceWake"
                    class="ap-presence-secondary"
                    type="button"
                >
                    Enable Hey Aprisha
                </button>

                <button
                    id="apPresenceMic"
                    class="ap-presence-mic"
                    type="button"
                    aria-label="Speak to Aprisha"
                >
                    <span class="ap-presence-mic-symbol"></span>
                </button>

                <button
                    id="apPresenceOpenChat"
                    class="ap-presence-secondary"
                    type="button"
                >
                    Open Chat
                </button>

            </footer>

        `;

        document.body.appendChild(
            home
        );


        /* ----------------------------------------------------
           Add Presence button to existing Aprisha panel
           ---------------------------------------------------- */

        const actions =
            document.querySelector(
                "#apAprishaPanel .ap-aprisha-actions"
            );

        if (
            actions &&
            !document.getElementById(
                "apAprishaPresenceLaunch"
            )
        ) {

            const launch =
                document.createElement(
                    "button"
                );

            launch.id =
                "apAprishaPresenceLaunch";

            launch.type =
                "button";

            launch.textContent =
                "Presence";

            actions.prepend(
                launch
            );

            launch.addEventListener(
                "click",
                openPresence
            );
        }


        document
            .getElementById(
                "apPresenceClose"
            )
            ?.addEventListener(
                "click",
                closePresence
            );


        document
            .getElementById(
                "apPresenceMic"
            )
            ?.addEventListener(
                "click",
                () => {

                    document
                        .getElementById(
                            "apAprishaSpeak"
                        )
                        ?.click();
                }
            );


        document
            .getElementById(
                "apPresenceWake"
            )
            ?.addEventListener(
                "click",
                () => {

                    document
                        .getElementById(
                            "apAprishaEnable"
                        )
                        ?.click();
                }
            );


        document
            .getElementById(
                "apPresenceOpenChat"
            )
            ?.addEventListener(
                "click",
                () => {

                    closePresence();

                    document
                        .getElementById(
                            "userInput"
                        )
                        ?.focus();
                }
            );


        home
            .querySelectorAll(
                "[data-ap-command]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const command =
                                button.dataset
                                    .apCommand;

                            if (
                                command ===
                                "Stay with me"
                            ) {

                                /*
                                 * Voice engine already understands
                                 * this command. Start listening so
                                 * the user can say it naturally.
                                 */

                                document
                                    .getElementById(
                                        "apAprishaSpeak"
                                    )
                                    ?.click();

                                return;
                            }


                            sendQuickCommand(
                                command
                            );
                        }
                    );
                }
            );


        watchAprisha();
    }


    /* ========================================================
       OPEN / CLOSE
       ======================================================== */

    function openPresence() {

        const home =
            document.getElementById(
                "apAprishaPresenceHome"
            );

        if (!home) return;

        home.classList.add(
            "ap-visible"
        );

        home.setAttribute(
            "aria-hidden",
            "false"
        );

        document.documentElement
            .classList.add(
                "ap-presence-open"
            );

        document.body
            .classList.add(
                "ap-presence-open"
            );

        syncFromAprisha();
    }


    function closePresence() {

        const home =
            document.getElementById(
                "apAprishaPresenceHome"
            );

        home?.classList.remove(
            "ap-visible"
        );

        home?.setAttribute(
            "aria-hidden",
            "true"
        );

        document.documentElement
            .classList.remove(
                "ap-presence-open"
            );

        document.body
            .classList.remove(
                "ap-presence-open"
            );
    }


    /* ========================================================
       MIRROR APRISHA UNIVERSAL STATE
       ======================================================== */

    function detectMode(
        state
    ) {

        const value =
            String(state || "")
                .toLowerCase();

        if (
            value.includes(
                "listening"
            )
        ) return "listening";

        if (
            value.includes(
                "thinking"
            )
        ) return "thinking";

        if (
            value.includes(
                "here"
            ) ||
            value.includes(
                "hey aprisha"
            )
        ) return "awake";

        if (
            value.includes(
                "issue"
            ) ||
            value.includes(
                "permission"
            )
        ) return "error";

        return "ready";
    }


    function syncFromAprisha() {

        const sourceState =
            document.getElementById(
                "apAprishaState"
            );

        const sourceText =
            document.getElementById(
                "apAprishaText"
            );

        const targetState =
            document.getElementById(
                "apPresenceState"
            );

        const targetText =
            document.getElementById(
                "apPresenceTranscript"
            );

        const core =
            document.getElementById(
                "apPresenceCore"
            );

        const connection =
            document.getElementById(
                "apPresenceConnection"
            );


        const stateText =
            sourceState?.textContent
                ?.trim()
            ||
            "Aprisha";


        const transcript =
            sourceText?.textContent
                ?.trim()
            ||
            "Say “Hey Aprisha”";


        if (targetState) {

            targetState.textContent =
                stateText;
        }


        if (targetText) {

            targetText.textContent =
                transcript;
        }


        const mode =
            detectMode(
                stateText
            );


        if (core) {

            core.dataset.mode =
                mode;
        }


        if (connection) {

            if (
                mode === "error"
            ) {

                connection.textContent =
                    "● Check connection";

            }
            else if (
                mode === "listening"
            ) {

                connection.textContent =
                    "● Listening";

            }
            else if (
                mode === "thinking"
            ) {

                connection.textContent =
                    "● Thinking";

            }
            else {

                connection.textContent =
                    "● Ready";
            }
        }
    }


    function watchAprisha() {

        const source =
            document.getElementById(
                "apAprishaPanel"
            );

        if (!source) {

            setTimeout(
                watchAprisha,
                500
            );

            return;
        }


        const observer =
            new MutationObserver(
                syncFromAprisha
            );


        observer.observe(
            source,
            {
                subtree:
                    true,

                childList:
                    true,

                characterData:
                    true,

                attributes:
                    true
            }
        );


        syncFromAprisha();
    }


    /* ========================================================
       QUICK COMMANDS THROUGH NORMAL AP SYNAPSE CHAT
       ======================================================== */

    function sendQuickCommand(
        command
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

            /*
             * Fall back to voice.
             */

            document
                .getElementById(
                    "apAprishaSpeak"
                )
                ?.click();

            return;
        }


        if (
            "value" in input
        ) {

            input.value =
                command;

        }
        else {

            input.textContent =
                command;
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


        closePresence();

        send.click();
    }


    /* ========================================================
       GLOBAL ENTRY
       ======================================================== */

    window.APAprishaPresence = {
        open:
            openPresence,

        close:
            closePresence
    };


    function boot() {

        createPresenceHome();

        console.log(
            "✅ AP SYNAPSE — APRISHA PRESENCE HOME READY"
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
