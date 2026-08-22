/* ============================================================
   AP SYNAPSE — MOBILE HISTORY ONE-SHOT FINAL

   IMPORTANT:
   - exactly ONE native sidebar close
   - no repeated toggle
   - no MutationObserver
   - no interval
   ============================================================ */

(() => {
    "use strict";

    let historyClosing = false;


    function mobile() {
        return window.innerWidth <= 760;
    }


    function getTopLeftButton() {

        /*
         * IMPORTANT:
         *
         * Do NOT search by ID/class.
         * AP Synapse currently has more than one sidebar
         * controller/control in the DOM.
         *
         * Get the ACTUAL element physically visible where
         * the user manually presses X.
         */

        const viewportWidth =
            window.innerWidth;


        /*
         * Visible mobile X/hamburger is around
         * 34px from the viewport's left/top.
         */

        const x =
            Math.min(
                35,
                viewportWidth / 10
            );

        const y =
            35;


        const stack =
            document.elementsFromPoint(
                x,
                y
            );


        /*
         * Find the first genuinely clickable top-left
         * element/ancestor from the REAL hit-test stack.
         */

        for (const hit of stack) {

            let element =
                hit;


            for (
                let depth = 0;
                element && depth < 6;
                depth++,
                element = element.parentElement
            ) {

                if (
                    !(element instanceof HTMLElement)
                ) {
                    continue;
                }


                const rect =
                    element.getBoundingClientRect();


                const style =
                    getComputedStyle(
                        element
                    );


                const topLeft =
                    rect.left >= -2 &&
                    rect.left < 75 &&
                    rect.top >= -2 &&
                    rect.top < 90 &&
                    rect.width >= 25 &&
                    rect.width <= 75 &&
                    rect.height >= 25 &&
                    rect.height <= 75;


                if (!topLeft) {
                    continue;
                }


                const interactive =
                    element.matches(
                        "button, [role='button'], a, [tabindex]"
                    ) ||

                    style.cursor ===
                        "pointer" ||

                    typeof element.onclick ===
                        "function";


                if (interactive) {

                    console.log(
                        "🎯 AP SYNAPSE — REAL VISIBLE X TARGET",
                        element
                    );


                    return element;
                }
            }
        }


        /*
         * Absolute fallback:
         * use the physical element under the finger.
         */

        return document.elementFromPoint(
            x,
            y
        );
    }




    function buttonLooksLikeClose(button) {

        if (!button) {
            return false;
        }


        const text =
            (button.textContent || "")
                .replace(/\s+/g, "")
                .trim()
                .toLowerCase();


        const aria =
            button.getAttribute(
                "aria-expanded"
            );


        return (
            aria === "true" ||

            text === "x" ||
            text === "×" ||
            text === "✕" ||

            button.classList.contains("open") ||
            button.classList.contains("active") ||
            button.classList.contains("is-open")
        );
    }


    function fixConversationScroller() {

        const page =
            document.getElementById(
                "assistantPage"
            );


        const chat =
            document.getElementById(
                "chatWindow"
            );


        if (!page || !chat) {
            return;
        }


        /*
         * chatWindow = content
         * assistantPage = real mobile scroll owner
         */

        chat.style.setProperty(
            "overflow",
            "visible",
            "important"
        );


        chat.style.setProperty(
            "height",
            "auto",
            "important"
        );


        chat.style.setProperty(
            "max-height",
            "none",
            "important"
        );


        page.style.setProperty(
            "overflow-y",
            "auto",
            "important"
        );


        page.style.setProperty(
            "overflow-x",
            "hidden",
            "important"
        );


        requestAnimationFrame(() => {

            /*
             * Keep restored conversation around its
             * existing/latest position.
             */

            page.scrollTop =
                Math.min(
                    page.scrollTop,
                    page.scrollHeight -
                    page.clientHeight
                );

        });
    }


    window.APAfterHistoryRestore = function () {

        if (
            !mobile() ||
            historyClosing
        ) {

            return;
        }


        historyClosing = true;


        const button =
            getTopLeftButton();


        /*
         * ONE native close only.
         *
         * This invokes the exact sidebar controller that
         * works when you manually press X.
         */

        if (
            button &&
            buttonLooksLikeClose(button)
        ) {

            /*
             * Reproduce the real mobile interaction rather
             * than HTMLElement.click().
             *
             * This follows the same event route as manually
             * pressing the visible X.
             */

            const rect =
                button.getBoundingClientRect();


            const clientX =
                rect.left +
                (rect.width / 2);


            const clientY =
                rect.top +
                (rect.height / 2);


            const pointerOptions = {

                bubbles: true,
                cancelable: true,
                composed: true,

                clientX,
                clientY,

                pointerId: 1,
                pointerType: "touch",

                isPrimary: true,

                button: 0,
                buttons: 1
            };


            try {

                button.dispatchEvent(
                    new PointerEvent(
                        "pointerdown",
                        pointerOptions
                    )
                );


                button.dispatchEvent(
                    new PointerEvent(
                        "pointerup",
                        {
                            ...pointerOptions,
                            buttons: 0
                        }
                    )
                );

            } catch {}


            button.dispatchEvent(
                new MouseEvent(
                    "click",
                    {
                        bubbles: true,
                        cancelable: true,
                        composed: true,

                        clientX,
                        clientY,

                        button: 0
                    }
                )
            );


            console.log(
                "✅ AP SYNAPSE — REAL VISIBLE HISTORY X PRESSED"
            );

        } else {

            console.log(
                "✅ AP SYNAPSE — HISTORY SIDEBAR ALREADY CLOSED"
            );
        }


        /*
         * Wait for native close transition,
         * then release the conversation viewport.
         */

        setTimeout(() => {

            fixConversationScroller();

            historyClosing = false;


            console.log(
                "✅ AP SYNAPSE — HISTORY INTERACTION RELEASED"
            );

        }, 120);
    };


    console.log(
        "✅ AP SYNAPSE — HISTORY ONE-SHOT CONTROLLER READY"
    );

})();


/* ============================================================
   AP SYNAPSE — ASSISTANT EXITS HISTORY FINAL

   When reading History:
   Sidebar -> Assistant = clean Assistant Home.

   History data itself is NOT deleted.
   ============================================================ */

(() => {
    "use strict";

    let resettingAssistant = false;


    function mobile() {
        return window.innerWidth <= 760;
    }


    function findNewChatButton() {

        const known =
            document.querySelector(`
                #newChatBtn,
                #newChatButton,
                .new-chat,
                .new-chat-btn,
                [data-action="new-chat"],
                [data-action="newChat"]
            `);


        if (known) {
            return known;
        }


        return [...document.querySelectorAll(
            "button,a,[role='button']"
        )].find(element => {

            const text =
                (element.textContent || "")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();


            return (
                text === "new chat" ||
                text === "new conversation"
            );

        }) || null;
    }


    function isAssistantNavigation(target) {

        const item =
            target.closest(`
                [data-page="assistant"],
                [data-route="assistant"],
                [data-action="assistant"],
                #assistantBtn,
                .assistant-btn,
                button,
                a,
                [role="button"],
                .nav-item,
                .menu-item,
                .sidebar-item
            `);


        if (!item) {
            return false;
        }


        if (
            item.dataset?.page === "assistant" ||
            item.dataset?.route === "assistant" ||
            item.dataset?.action === "assistant"
        ) {

            return true;
        }


        const text =
            (item.textContent || "")
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();


        return (
            text === "assistant" ||
            text.startsWith("assistant ")
        );
    }


    function closeVisibleSidebarIfNeeded() {

        const stack =
            document.elementsFromPoint(
                35,
                35
            );


        for (const hit of stack) {

            const button =
                hit.closest?.(
                    "button,[role='button']"
                );


            if (!button) {
                continue;
            }


            const rect =
                button.getBoundingClientRect();


            if (
                rect.left > 75 ||
                rect.top > 90
            ) {

                continue;
            }


            const text =
                (button.textContent || "")
                    .replace(/\s+/g, "")
                    .trim()
                    .toLowerCase();


            const open =
                text === "x" ||
                text === "×" ||
                text === "✕" ||
                button.getAttribute(
                    "aria-expanded"
                ) === "true";


            if (open) {

                button.click();

                break;
            }
        }
    }


    function showAssistantHome() {

        if (
            !mobile() ||
            resettingAssistant
        ) {

            return;
        }


        resettingAssistant = true;


        /*
         * FIRST use AP Synapse's native New Chat reset.
         *
         * This properly resets active conversation state
         * instead of merely hiding the History HTML.
         */

        const newChat =
            findNewChatButton();


        if (newChat) {

            newChat.click();
        }


        /*
         * Then enforce the final visible Assistant state.
         */

        setTimeout(() => {

            const hero =
                document.getElementById(
                    "heroScreen"
                );


            const chat =
                document.getElementById(
                    "chatWindow"
                );


            const page =
                document.getElementById(
                    "assistantPage"
                );


            document.body.classList.remove(
                "chat-active"
            );


            document.body.dataset.page =
                "assistant";


            if (chat) {

                chat.style.setProperty(
                    "display",
                    "none",
                    "important"
                );


                chat.style.setProperty(
                    "visibility",
                    "hidden",
                    "important"
                );
            }


            if (hero) {

                /*
                 * History placed IMPORTANT styles here,
                 * therefore Assistant Home must remove them
                 * explicitly.
                 */

                hero.style.removeProperty(
                    "height"
                );

                hero.style.removeProperty(
                    "min-height"
                );

                hero.style.removeProperty(
                    "max-height"
                );

                hero.style.removeProperty(
                    "overflow"
                );

                hero.style.removeProperty(
                    "transform"
                );


                hero.style.setProperty(
                    "display",
                    "flex",
                    "important"
                );


                hero.style.setProperty(
                    "visibility",
                    "visible",
                    "important"
                );


                hero.style.setProperty(
                    "opacity",
                    "1",
                    "important"
                );


                hero.style.setProperty(
                    "pointer-events",
                    "auto",
                    "important"
                );


                hero.removeAttribute(
                    "aria-hidden"
                );
            }


            /*
             * Open the official Assistant workspace
             * AFTER old chat has been reset.
             */

            if (
                typeof window.APWorkspaceOpenPage ===
                "function"
            ) {

                window.APWorkspaceOpenPage(
                    "assistant"
                );
            }


            if (page) {

                page.scrollTop =
                    0;
            }


            /*
             * Ensure sidebar returns to normal closed state.
             */

            setTimeout(
                closeVisibleSidebarIfNeeded,
                40
            );


            resettingAssistant =
                false;


            console.log(
                "✅ AP SYNAPSE — ASSISTANT HOME RESTORED FROM HISTORY"
            );

        }, 30);
    }


    document.addEventListener(
        "click",
        event => {

            if (
                !mobile() ||
                resettingAssistant
            ) {

                return;
            }


            const target =
                event.target;


            if (!(target instanceof Element)) {
                return;
            }


            if (
                isAssistantNavigation(
                    target
                )
            ) {

                /*
                 * Let native sidebar navigation fire first,
                 * then make Assistant Home the final authority.
                 */

                setTimeout(
                    showAssistantHome,
                    0
                );
            }

        },
        true
    );


    console.log(
        "✅ AP SYNAPSE — ASSISTANT/HISTORY EXIT READY"
    );

})();
