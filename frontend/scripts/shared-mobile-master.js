(() => {
    "use strict";


    const MOBILE_QUERY =
        window.matchMedia(
            "(max-width: 760px)"
        );


    let shell =
        null;

    let originalChatParent =
        null;

    let originalChatNext =
        null;

    let originalComposerParent =
        null;

    let originalComposerNext =
        null;

    let observer =
        null;


    /* ========================================================
       DETECT ORIGINAL SHARED URL

       This continues working even when share-v2 removes
       secret parameters with history.replaceState().
       ======================================================== */

    function originalNavigationURL() {

        try {

            return (
                performance
                    .getEntriesByType(
                        "navigation"
                    )[0]
                    ?.name
                ||
                location.href
            );

        } catch {

            return location.href;
        }
    }


    function isSharedURL(value) {

        try {

            const url =
                new URL(
                    value,
                    location.origin
                );


            const parameters = [
                "share",
                "shared",
                "live",
                "room",
                "roomId",
                "shareId",
                "snapshot",
                "collab",
                "token",
                "key"
            ];


            if (
                parameters.some(
                    key =>
                        url.searchParams.has(
                            key
                        )
                )
            ) {

                return true;
            }


            if (
                /\/(share|shared|snapshot|collab)(\/|$)/i
                    .test(
                        url.pathname
                    )
            ) {

                return true;
            }


            if (
                /(share|shared|live|room|snapshot|collab)/i
                    .test(
                        url.hash
                    )
            ) {

                return true;
            }


            return false;

        } catch {

            return false;
        }
    }


    function sharedStatePresent() {

        if (
            isSharedURL(
                originalNavigationURL()
            )
            ||
            isSharedURL(
                location.href
            )
        ) {

            return true;
        }


        if (
            document.body
                ?.classList
                .contains(
                    "ap-shared-conversation-view"
                )
        ) {

            return true;
        }


        return Boolean(
            document.querySelector(`
                [data-share-v2-room],
                [data-live-room],
                [data-shared-conversation],
                .ap-share-v2-live,
                .ap-share-live-active,
                .ap-shared-conversation
            `)
        );
    }


    function shouldActivate() {

        return (
            MOBILE_QUERY.matches
            &&
            sharedStatePresent()
        );
    }


    /* ========================================================
       FIND REAL COMPOSER
       ======================================================== */

    function findComposer() {

        const input =
            document.getElementById(
                "userInput"
            );


        if (!input) {
            return null;
        }


        const candidates = [
            ".composer",
            ".composer-container",
            ".composer-shell",
            ".chat-composer",
            ".chat-input-container",
            ".chat-input",
            ".message-composer",
            ".input-container",
            ".input-area",
            ".prompt-input-container",
            ".prompt-box",
            ".composer-wrap"
        ];


        for (
            const selector of
            candidates
        ) {

            const result =
                input.closest(
                    selector
                );


            if (result) {
                return result;
            }
        }


        /*
         * Fall back to a parent that also owns sendBtn.
         */

        let current =
            input.parentElement;


        for (
            let depth = 0;
            current &&
            depth < 6;
            depth += 1
        ) {

            if (
                current.querySelector(
                    "#sendBtn"
                )
            ) {

                return current;
            }


            current =
                current.parentElement;
        }


        return input.parentElement;
    }


    /* ========================================================
       TITLE
       ======================================================== */

    function normalizedText(value) {

        return String(
            value || ""
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }


    function conversationTitle() {

        const chat =
            document.getElementById(
                "chatWindow"
            );


        if (!chat) {

            return "Shared conversation";
        }


        const user =
            chat.querySelector(`
                .message.user .message-body,
                .message.user .message-content,
                .user-message .message-body,
                .user-message .message-content,
                [data-role="user"] .message-body,
                [data-role="user"] .message-content
            `);


        const value =
            normalizedText(
                user?.textContent
            );


        if (!value) {

            return "Shared conversation";
        }


        return value.slice(
            0,
            58
        );
    }


    /* ========================================================
       TABLE CONTAINMENT
       ======================================================== */

    function wrapTables() {

        const chat =
            document.getElementById(
                "chatWindow"
            );


        if (!chat) {
            return;
        }


        chat
            .querySelectorAll(
                "table"
            )
            .forEach(
                table => {

                    if (
                        table.parentElement
                            ?.classList
                            .contains(
                                "ap-shared-table-scroll"
                            )
                    ) {

                        return;
                    }


                    const wrapper =
                        document.createElement(
                            "div"
                        );


                    wrapper.className =
                        "ap-shared-table-scroll";


                    table.parentNode
                        ?.insertBefore(
                            wrapper,
                            table
                        );


                    wrapper.appendChild(
                        table
                    );
                }
            );
    }


    /* ========================================================
       VIEWPORT / MOBILE KEYBOARD
       ======================================================== */

    function updateViewportHeight() {

        const height =
            window.visualViewport
                ?.height
            ||
            window.innerHeight;


        document.documentElement
            .style
            .setProperty(
                "--ap-shared-mobile-height",
                `${Math.round(height)}px`
            );
    }


    /* ========================================================
       MENU
       ======================================================== */

    function createMenuPanel() {

        if (
            document.getElementById(
                "apSharedMobileMenuPanel"
            )
        ) {

            return;
        }


        const panel =
            document.createElement(
                "div"
            );


        panel.id =
            "apSharedMobileMenuPanel";


        panel.innerHTML = `
            <button
                class="ap-shared-mobile-menu-row"
                type="button"
                data-ap-shared-action="copy"
            >
                Copy conversation link
            </button>

            <button
                class="ap-shared-mobile-menu-row"
                type="button"
                data-ap-shared-action="share"
            >
                Share conversation
            </button>
        `;


        document.body.appendChild(
            panel
        );


        panel.addEventListener(
            "click",
            async event => {

                const button =
                    event.target.closest(
                        "[data-ap-shared-action]"
                    );


                if (!button) {
                    return;
                }


                const action =
                    button.dataset
                        .apSharedAction;


                if (
                    action ===
                    "copy"
                ) {

                    try {

                        await navigator
                            .clipboard
                            .writeText(
                                originalNavigationURL()
                            );

                    } catch {}
                }


                if (
                    action ===
                    "share"
                ) {

                    if (
                        navigator.share
                    ) {

                        try {

                            await navigator.share({
                                title:
                                    "AP Synapse Conversation",

                                url:
                                    originalNavigationURL()
                            });

                        } catch {}
                    }
                }


                panel.classList.remove(
                    "ap-open"
                );
            }
        );
    }


    /* ========================================================
       CREATE SHELL
       ======================================================== */

    function createShell() {

        if (shell) {
            return shell;
        }


        shell =
            document.createElement(
                "div"
            );


        shell.id =
            "apSharedMobileShell";


        shell.innerHTML = `
            <header
                class="ap-shared-mobile-header"
            >
                <div
                    class="ap-shared-mobile-header-inner"
                >

                    <div
                        class="ap-shared-mobile-logo"
                        aria-hidden="true"
                    >
                        AP
                    </div>

                    <div
                        class="ap-shared-mobile-title-area"
                    >
                        <div
                            class="ap-shared-mobile-title-row"
                        >
                            <div
                                id="apSharedMobileTitle"
                            >
                                Shared conversation
                            </div>

                            <div
                                class="ap-shared-mobile-live"
                            >
                                <span
                                    class="ap-shared-mobile-live-dot"
                                ></span>

                                LIVE
                            </div>
                        </div>

                        <div
                            class="ap-shared-mobile-subtitle"
                        >
                            AP Synapse · Shared conversation
                        </div>
                    </div>

                    <button
                        id="apSharedMobileMenu"
                        class="ap-shared-mobile-menu"
                        type="button"
                        aria-label="Shared conversation options"
                    >
                        ⋯
                    </button>

                </div>
            </header>

            <main
                id="apSharedMobileMain"
            ></main>

            <footer
                id="apSharedMobileFooter"
            ></footer>
        `;


        document.body.appendChild(
            shell
        );


        createMenuPanel();


        shell
            .querySelector(
                "#apSharedMobileMenu"
            )
            ?.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    document
                        .getElementById(
                            "apSharedMobileMenuPanel"
                        )
                        ?.classList
                        .toggle(
                            "ap-open"
                        );
                }
            );


        document.addEventListener(
            "click",
            event => {

                if (
                    !event.target.closest(
                        "#apSharedMobileMenuPanel"
                    )
                    &&
                    !event.target.closest(
                        "#apSharedMobileMenu"
                    )
                ) {

                    document
                        .getElementById(
                            "apSharedMobileMenuPanel"
                        )
                        ?.classList
                        .remove(
                            "ap-open"
                        );
                }
            }
        );


        return shell;
    }


    /* ========================================================
       MOVE THE REAL CHAT + REAL COMPOSER

       Moving a DOM node keeps its existing JS event listeners.
       ======================================================== */

    function mountRealConversation() {

        const chat =
            document.getElementById(
                "chatWindow"
            );


        if (!chat) {
            return false;
        }


        createShell();


        const main =
            document.getElementById(
                "apSharedMobileMain"
            );


        const footer =
            document.getElementById(
                "apSharedMobileFooter"
            );


        if (
            !main ||
            !footer
        ) {

            return false;
        }


        if (
            chat.parentElement !==
            main
        ) {

            if (
                !originalChatParent
            ) {

                originalChatParent =
                    chat.parentNode;


                originalChatNext =
                    chat.nextSibling;
            }


            main.appendChild(
                chat
            );
        }


        const composer =
            findComposer();


        if (
            composer &&
            composer !== footer &&
            !footer.contains(
                composer
            )
        ) {

            if (
                !originalComposerParent
            ) {

                originalComposerParent =
                    composer.parentNode;


                originalComposerNext =
                    composer.nextSibling;
            }


            composer.classList.add(
                "ap-shared-real-composer"
            );


            footer.appendChild(
                composer
            );
        }


        return true;
    }


    /* ========================================================
       NO AUTO SCROLL
       ======================================================== */

    function preserveScrollDuringRepair(
        callback
    ) {

        const chat =
            document.getElementById(
                "chatWindow"
            );


        const top =
            chat?.scrollTop;


        callback();


        if (
            chat &&
            Number.isFinite(top)
        ) {

            chat.scrollTop =
                top;
        }
    }


    /* ========================================================
       ACTIVATE
       ======================================================== */

    function activate() {

        if (
            !shouldActivate()
        ) {

            return false;
        }


        updateViewportHeight();


        document.documentElement
            .classList
            .add(
                "ap-shared-mobile-active"
            );


        document.body
            .classList
            .add(
                "ap-shared-mobile-focus"
            );


        const mounted =
            mountRealConversation();


        if (!mounted) {

            return false;
        }


        const title =
            document.getElementById(
                "apSharedMobileTitle"
            );


        if (title) {

            title.textContent =
                conversationTitle();
        }


        wrapTables();


        return true;
    }


    /* ========================================================
       LIVE UPDATE OBSERVER

       NEVER scrolls conversation.
       ======================================================== */

    let repairQueued =
        false;


    function queueRepair() {

        if (repairQueued) {
            return;
        }


        repairQueued =
            true;


        requestAnimationFrame(
            () => {

                repairQueued =
                    false;


                if (
                    !shouldActivate()
                ) {

                    return;
                }


                preserveScrollDuringRepair(
                    () => {

                        activate();

                        wrapTables();


                        const title =
                            document.getElementById(
                                "apSharedMobileTitle"
                            );


                        if (title) {

                            title.textContent =
                                conversationTitle();
                        }

                    }
                );

            }
        );
    }


    /* ========================================================
       BOOT
       ======================================================== */

    function boot() {

        updateViewportHeight();


        /*
         * share-v2 may finish loading the room shortly
         * after DOMContentLoaded.
         */

        let attempts =
            0;


        const wait =
            setInterval(
                () => {

                    attempts += 1;


                    if (
                        activate()
                        ||
                        attempts >= 40
                    ) {

                        clearInterval(
                            wait
                        );
                    }

                },
                150
            );


        observer =
            new MutationObserver(
                queueRepair
            );


        observer.observe(
            document.documentElement,
            {
                childList:
                    true,

                subtree:
                    true,

                characterData:
                    true
            }
        );


        window.visualViewport
            ?.addEventListener(
                "resize",
                () => {

                    updateViewportHeight();

                },
                {
                    passive:
                        true
                }
            );


        window.addEventListener(
            "resize",
            () => {

                updateViewportHeight();

                queueRepair();

            },
            {
                passive:
                    true
            }
        );


        console.log(
            "✅ AP SYNAPSE — SHARED MOBILE MASTER READY"
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

    } else {

        boot();
    }

})();
