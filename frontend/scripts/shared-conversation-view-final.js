(() => {
    "use strict";

    const CLASS_NAME =
        "ap-shared-conversation-view";


    /* ========================================================
       INITIAL URL

       performance navigation URL remains useful even when the
       sharing system removes a secret/token from the address
       bar using history.replaceState().
       ======================================================== */

    function initialURL() {

        try {

            const navigation =
                performance
                    .getEntriesByType(
                        "navigation"
                    )[0];

            return (
                navigation?.name ||
                location.href
            );

        } catch {

            return location.href;
        }
    }


    function looksShared(urlValue) {

        try {

            const url =
                new URL(
                    urlValue,
                    location.origin
                );


            const keys = [
                "share",
                "shared",
                "live",
                "room",
                "snapshot",
                "collab",
                "conversationShare",
                "shareId",
                "roomId",
                "token",
                "key"
            ];


            const hasKey =
                keys.some(
                    key =>
                        url.searchParams.has(
                            key
                        )
                );


            const pathShared =
                /\/(share|shared|snapshot|collab)(\/|$)/i
                    .test(
                        url.pathname
                    );


            const hashShared =
                /(?:^|[#&?])(share|shared|live|room|snapshot|collab|shareid|roomid)=/i
                    .test(
                        url.hash
                    );


            return (
                hasKey ||
                pathShared ||
                hashShared
            );

        } catch {

            return false;
        }
    }


    function shareDOMPresent() {

        return Boolean(
            document.querySelector(`
                [data-share-v2-room],
                [data-live-room],
                [data-shared-conversation],
                .ap-share-v2-live,
                .ap-share-live-active,
                .ap-shared-conversation,
                .shared-conversation-view
            `)
        );
    }


    function shouldUseSharedView() {

        return (
            looksShared(
                initialURL()
            )
            ||
            looksShared(
                location.href
            )
            ||
            shareDOMPresent()
        );
    }


    /* ========================================================
       TITLE
       ======================================================== */

    function cleanText(value) {

        return String(
            value || ""
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }


    function findConversationTitle() {

        const explicit =
            document.querySelector(`
                [data-share-title],
                .ap-share-title,
                .shared-conversation-title
            `);


        const explicitText =
            cleanText(
                explicit?.textContent
            );


        if (explicitText) {

            return explicitText
                .slice(
                    0,
                    80
                );
        }


        const firstUser =
            document.querySelector(`
                #chatWindow .message.user .message-body,
                #chatWindow .user-message .message-body,
                #chatWindow .user-message .message-content,
                #chatWindow [data-role="user"] .message-body,
                #chatWindow [data-role="user"] .message-content
            `);


        const firstText =
            cleanText(
                firstUser?.textContent
            );


        if (firstText) {

            return firstText
                .slice(
                    0,
                    72
                );
        }


        return "Shared AP Synapse Conversation";
    }


    function detectMode() {

        const value =
            initialURL()
                .toLowerCase();


        if (
            value.includes(
                "snapshot"
            )
        ) {

            return {
                label:
                    "SNAPSHOT",

                subtitle:
                    "Read-only shared conversation"
            };
        }


        return {
            label:
                "LIVE",

            subtitle:
                "Shared AP Synapse conversation"
        };
    }


    /* ========================================================
       HEADER
       ======================================================== */

    function createHeader() {

        if (
            document.getElementById(
                "apSharedConversationHeader"
            )
        ) {

            updateHeader();

            return;
        }


        const mode =
            detectMode();


        const header =
            document.createElement(
                "header"
            );


        header.id =
            "apSharedConversationHeader";


        header.setAttribute(
            "aria-label",
            "Shared AP Synapse conversation"
        );


        header.innerHTML = `
            <div class="ap-shared-header-inner">

                <div
                    class="ap-shared-brand"
                    aria-hidden="true"
                >
                    AP
                </div>

                <div class="ap-shared-heading">

                    <div class="ap-shared-heading-top">

                        <div
                            id="apSharedConversationTitle"
                        >
                            Shared AP Synapse Conversation
                        </div>

                        <div class="ap-shared-live-pill">

                            <span
                                class="ap-shared-live-dot"
                            ></span>

                            <span>
                                ${mode.label}
                            </span>

                        </div>

                    </div>

                    <div
                        id="apSharedConversationSubtitle"
                        class="ap-shared-subtitle"
                    >
                        ${mode.subtitle}
                    </div>

                </div>

                <div class="ap-shared-header-status">

                    <span
                        class="ap-shared-status-dot"
                    ></span>

                    <span>
                        Connected
                    </span>

                </div>

            </div>
        `;


        document.body.appendChild(
            header
        );


        updateHeader();
    }


    function updateHeader() {

        const title =
            document.getElementById(
                "apSharedConversationTitle"
            );


        if (title) {

            title.textContent =
                findConversationTitle();
        }
    }


    /* ========================================================
       COMPOSER
       ======================================================== */

    function markComposer() {

        const input =
            document.getElementById(
                "userInput"
            );


        if (!input) {
            return;
        }


        document
            .querySelectorAll(
                ".ap-shared-composer-host"
            )
            .forEach(
                item =>
                    item.classList.remove(
                        "ap-shared-composer-host"
                    )
            );


        const host =
            input.closest(`
                .composer,
                .composer-container,
                .composer-shell,
                .chat-composer,
                .chat-input,
                .chat-input-container,
                .message-composer,
                .input-area,
                .input-container,
                .prompt-input-container,
                .prompt-box
            `)
            ||
            input.parentElement;


        host?.classList.add(
            "ap-shared-composer-host"
        );
    }


    /* ========================================================
       FORCE CORRECT ASSISTANT VISIBILITY

       Does not alter scroll position.
       ======================================================== */

    function enforceConversationSurface() {

        const assistant =
            document.getElementById(
                "assistantPage"
            );


        const chat =
            document.getElementById(
                "chatWindow"
            );


        const hero =
            document.getElementById(
                "heroScreen"
            );


        if (hero) {

            hero.style.setProperty(
                "display",
                "none",
                "important"
            );
        }


        if (assistant) {

            assistant.style.setProperty(
                "display",
                "block",
                "important"
            );

            assistant.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

            assistant.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            assistant.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );

            assistant.setAttribute(
                "aria-hidden",
                "false"
            );
        }


        if (chat) {

            chat.style.setProperty(
                "display",
                "block",
                "important"
            );

            chat.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

            chat.style.setProperty(
                "opacity",
                "1",
                "important"
            );
        }
    }


    function applySharedView() {

        if (
            !shouldUseSharedView()
        ) {

            return false;
        }


        document.body
            .classList
            .add(
                CLASS_NAME
            );


        document.documentElement
            .classList
            .add(
                CLASS_NAME
            );


        createHeader();

        enforceConversationSurface();

        markComposer();

        updateHeader();


        return true;
    }


    /* ========================================================
       OBSERVER

       Only layout repair.
       NEVER changes chat scrollTop.
       ======================================================== */

    let queued =
        false;


    function queueRepair() {

        if (queued) {
            return;
        }


        queued =
            true;


        requestAnimationFrame(
            () => {

                queued =
                    false;


                if (
                    !document.body
                        .classList
                        .contains(
                            CLASS_NAME
                        )
                ) {

                    applySharedView();

                    return;
                }


                enforceConversationSurface();

                markComposer();

                updateHeader();

            }
        );
    }


    function boot() {

        if (
            !applySharedView()
        ) {

            /*
             * share-v2 may establish its room after this
             * script begins. Observe briefly for that state.
             */

            let attempts =
                0;


            const timer =
                setInterval(
                    () => {

                        attempts +=
                            1;


                        if (
                            applySharedView()
                            ||
                            attempts > 20
                        ) {

                            clearInterval(
                                timer
                            );
                        }

                    },
                    250
                );
        }


        const observer =
            new MutationObserver(
                queueRepair
            );


        observer.observe(
            document.documentElement,
            {
                childList: true,
                subtree: true
            }
        );


        window.addEventListener(
            "resize",
            queueRepair,
            {
                passive: true
            }
        );


        window.visualViewport
            ?.addEventListener(
                "resize",
                queueRepair,
                {
                    passive: true
                }
            );


        console.log(
            "✅ AP SYNAPSE — SHARED CONVERSATION VIEW READY"
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
                once: true
            }
        );

    } else {

        boot();
    }

})();
