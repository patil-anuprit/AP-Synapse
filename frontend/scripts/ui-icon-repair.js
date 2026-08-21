(() => {
    "use strict";

    /* =========================================================
       AP SYNAPSE — GLOBAL SEMANTIC ICON ENGINE
       Replaces broken ?, ??, � and emoji UI icons with SVG.
       ========================================================= */

    const ICONS = {

        copy: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="8" y="8" width="11" height="11" rx="2"></rect>
                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>
            </svg>
        `,

        edit: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"></path>
            </svg>
        `,

        share: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="18" cy="5" r="2.5"></circle>
                <circle cx="6" cy="12" r="2.5"></circle>
                <circle cx="18" cy="19" r="2.5"></circle>
                <path d="M8.2 10.8l7.5-4.3"></path>
                <path d="M8.2 13.2l7.5 4.3"></path>
            </svg>
        `,

        regenerate: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 7v5h-5"></path>
                <path d="M19 12a7 7 0 1 0-2.1 5"></path>
            </svg>
        `,

        delete: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16"></path>
                <path d="M9 7V4h6v3"></path>
                <path d="M7 7l1 13h8l1-13"></path>
            </svg>
        `,

        voice: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"></path>
                <path d="M5 11a7 7 0 0 0 14 0"></path>
                <path d="M12 18v3"></path>
            </svg>
        `,

        stop: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2"></rect>
            </svg>
        `,

        check: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.2 4.2L19 7"></path>
            </svg>
        `
    };


    const LABELS = {
        copy: "Copy",
        edit: "Edit",
        share: "Share",
        regenerate: "Regenerate",
        delete: "Delete",
        voice: "Voice",
        stop: "Stop"
    };


    function getSemanticAction(button) {

        if (!(button instanceof HTMLElement)) {
            return null;
        }


        const information = [

            button.dataset?.action || "",
            button.id || "",
            button.className || "",
            button.getAttribute("aria-label") || "",
            button.getAttribute("title") || "",
            button.textContent || ""

        ]
        .join(" ")
        .toLowerCase();


        if (/\bcopy\b|clipboard/.test(information)) {
            return "copy";
        }


        if (/\bedit\b/.test(information)) {
            return "edit";
        }


        if (/\bshare\b/.test(information)) {
            return "share";
        }


        if (
            /regenerate|retry|try again/.test(
                information
            )
        ) {
            return "regenerate";
        }


        if (
            /delete|remove|trash/.test(
                information
            )
        ) {
            return "delete";
        }


        if (
            /\bstop\b|cancel generation/.test(
                information
            )
        ) {
            return "stop";
        }


        if (
            /voice|microphone|\bmic\b|speech/.test(
                information
            )
        ) {
            return "voice";
        }


        return null;
    }


    function repairButton(button) {

        const action =
            getSemanticAction(button);


        if (
            !action ||
            !ICONS[action]
        ) {
            return;
        }


        /*
         * Don't repeatedly rebuild a button.
         */
        if (
            button.dataset.apIconAction ===
            action
        ) {
            return;
        }


        button.dataset.apIconAction =
            action;


        /*
         * Preserve whether this particular UI
         * previously had a visible action label.
         */
        const existingLabel =
            button.querySelector(
                ".ap-action-label"
            );


        const shouldShowLabel =
            Boolean(existingLabel) ||
            button.classList.contains(
                "copyBtn"
            );


        const label =
            LABELS[action] || "";


        button.innerHTML = `
            <span class="ap-semantic-icon">
                ${ICONS[action]}
            </span>

            ${
                shouldShowLabel
                    ? `
                        <span class="ap-action-label">
                            ${label}
                        </span>
                    `
                    : ""
            }
        `;


        /*
         * Accessibility remains readable even
         * when button is icon-only.
         */
        if (
            !button.getAttribute(
                "aria-label"
            )
        ) {

            button.setAttribute(
                "aria-label",
                label
            );
        }


        if (
            !button.getAttribute(
                "title"
            )
        ) {

            button.setAttribute(
                "title",
                label
            );
        }
    }


    /* =========================================================
       FIX BROKEN STREAMING / TYPING CURSORS
       ========================================================= */

    function repairBrokenCursors(scope = document) {

    const blockedSelector = [
        "input",
        "textarea",
        "button",
        "select",
        "option",
        "label",
        "[contenteditable='true']",
        ".message.user",
        ".user-message",
        ".ap-user-message",
        "[data-role='user']",
        "[data-author='user']"
    ].join(",");


    const isBrokenMark = value => {

        const text =
            String(value || "")
                .trim();

        return (
            text === "?" ||
            text === "??" ||
            text === "???" ||
            text === "�"
        );
    };


    /* =====================================================
       1. REAL ELEMENTS
       ===================================================== */

    scope
        .querySelectorAll("*")
        .forEach(element => {

            if (
                element.matches(blockedSelector) ||
                element.closest(blockedSelector)
            ) {
                return;
            }


            /*
             * Only elements containing nothing except
             * the corrupted cursor mark.
             */
            if (
                element.children.length === 0 &&
                isBrokenMark(
                    element.textContent
                )
            ) {

                const rect =
                    element.getBoundingClientRect();


                const style =
                    getComputedStyle(element);


                const tiny =
                    (
                        rect.width <= 70 &&
                        rect.height <= 70
                    );


                const animated =
                    style.animationName !== "none";


                const identity =
                    `${element.id || ""} ${element.className || ""}`
                        .toLowerCase();


                const cursorLike =
                    /cursor|caret|typing|stream|blink|loader|loading/
                        .test(identity);


                /*
                 * Standalone ? around assistant output.
                 */
                const assistantArea =
                    Boolean(
                        element.closest(
                            ".message.assistant, .assistant-message, .ap-assistant-message, .message.ai, .ai-message, [data-role='assistant'], [data-author='assistant']"
                        )
                    );


                /*
                 * Also catch the exact case visible in
                 * your screenshot: a tiny mark directly
                 * below/outside an assistant response.
                 */
                const previous =
                    element.previousElementSibling;


                const followsAssistant =
                    Boolean(
                        previous &&
                        (
                            previous.matches?.(
                                ".message.assistant, .assistant-message, .ap-assistant-message, .message.ai, .ai-message"
                            ) ||
                            previous.querySelector?.(
                                ".message.assistant, .assistant-message, .ap-assistant-message"
                            )
                        )
                    );


                if (
                    tiny &&
                    (
                        assistantArea ||
                        followsAssistant ||
                        animated ||
                        cursorLike
                    )
                ) {

                    element.remove();

                    return;
                }
            }


            /* =================================================
               2. ::BEFORE / ::AFTER
               ================================================= */

            ["::before", "::after"]
                .forEach(pseudo => {

                    const pseudoStyle =
                        getComputedStyle(
                            element,
                            pseudo
                        );


                    let content =
                        pseudoStyle.content || "";


                    content =
                        content
                            .replace(
                                /^["']|["']$/g,
                                ""
                            )
                            .trim();


                    if (
                        !isBrokenMark(content)
                    ) {
                        return;
                    }


                    element.classList.add(
                        pseudo === "::before"
                            ? "ap-kill-before-mark"
                            : "ap-kill-after-mark"
                    );

                });

        });


    /* =====================================================
       3. RAW TEXT NODES
       ===================================================== */

    const walker =
        document.createTreeWalker(
            scope,
            NodeFilter.SHOW_TEXT
        );


    const badNodes = [];

    let textNode;


    while (
        textNode = walker.nextNode()
    ) {

        if (
            !isBrokenMark(
                textNode.nodeValue
            )
        ) {
            continue;
        }


        const parent =
            textNode.parentElement;


        if (
            !parent ||
            parent.matches(blockedSelector) ||
            parent.closest(blockedSelector)
        ) {
            continue;
        }


        badNodes.push(
            textNode
        );
    }


    badNodes.forEach(node => {

        const parent =
            node.parentElement;


        if (!parent) {
            return;
        }


        const rect =
            parent.getBoundingClientRect();


        /*
         * Avoid deleting a legitimate large paragraph
         * consisting of a question mark.
         */
        if (
            rect.width <= 120 &&
            rect.height <= 80
        ) {

            node.nodeValue = "";
        }

    });
}

    /* =========================================================
       FIX ALL EXISTING MESSAGE ACTIONS
       ========================================================= */

    function repairAPInterface(scope = document) {

        const candidates =
            scope.querySelectorAll(`
                button[data-action],
                .ap-response-action,
                .ap-user-message-actions button,
                .message-actions button,
                .copyBtn,
                button[aria-label*="copy" i],
                button[aria-label*="edit" i],
                button[aria-label*="share" i],
                button[aria-label*="regenerate" i],
                button[aria-label*="voice" i],
                button[title*="copy" i],
                button[title*="edit" i],
                button[title*="share" i],
                button[title*="regenerate" i],
                button[title*="voice" i]
            `);


        candidates.forEach(
            repairButton
        );


        repairBrokenCursors(
            scope
        );
    }


    /* =========================================================
       INITIAL
       ========================================================= */

    function start() {

        repairAPInterface();


        /*
         * Chat messages/actions are dynamically created.
         * Repair every new response automatically.
         */
        const observer =
            new MutationObserver(
                mutations => {

                    mutations.forEach(
                        mutation => {

                            mutation
                                .addedNodes
                                .forEach(node => {

                                    if (
                                        !(
                                            node instanceof
                                            HTMLElement
                                        )
                                    ) {
                                        return;
                                    }


                                    if (
                                        node.matches?.(
                                            "button"
                                        )
                                    ) {

                                        repairButton(
                                            node
                                        );
                                    }


                                    repairAPInterface(
                                        node
                                    );

                                });

                        });

                }
            );


        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );


        console.log(
            "✅ AP SYNAPSE GLOBAL ICON ENGINE ACTIVE"
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
                once: true
            }
        );

    } else {

        start();
    }

})();

/*
 * AP Synapse responses can add the cursor AFTER
 * streaming has already begun.
 *
 * Keep removing corrupted standalone cursor marks
 * while the interface is active.
 */

setInterval(
    () => {

        repairBrokenCursors(
            document
        );

    },
    250
);