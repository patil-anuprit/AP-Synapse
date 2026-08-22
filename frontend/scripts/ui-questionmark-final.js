/* ============================================================
   AP SYNAPSE — PERMANENT UI ICON REPAIR V2

   Repairs broken ? / ?? / ??? / � UI glyphs.
   Dynamic / mutation-safe.
   Conversational content is NEVER modified.
   ============================================================ */

(() => {
    "use strict";

    const ICONS = {

        mic: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3"/>
                <path d="M5 11a7 7 0 0 0 14 0"/>
                <path d="M12 18v3"/>
            </svg>`,

        speaker: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 10v4h4l5 4V6L9 10H5z"/>
                <path d="M17 9a4 4 0 0 1 0 6"/>
            </svg>`,

        bell: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
                <path d="M10 21h4"/>
            </svg>`,

        close: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18"/>
            </svg>`,

        menu: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16"/>
            </svg>`,

        settings: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 9 7.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A8 8 0 0 0 10.4 18l.3 2.6h4L15 18a8 8 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z"/>
            </svg>`,

        profile: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4"/>
                <path d="M5 20c1.5-4 3.9-6 7-6s5.5 2 7 6"/>
            </svg>`,

        copy: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="8" y="8" width="10" height="10" rx="2"/>
                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>
            </svg>`,

        edit: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20h4l11-11-4-4L4 16v4z"/>
            </svg>`,

        share: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="18" cy="5" r="2"/>
                <circle cx="6" cy="12" r="2"/>
                <circle cx="18" cy="19" r="2"/>
                <path d="M8 11l8-5M8 13l8 5"/>
            </svg>`,

        trash: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/>
            </svg>`,

        search: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6"/>
                <path d="M16 16l4 4"/>
            </svg>`,

        globe: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9"/>
                <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>
            </svg>`,

        image: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <circle cx="8" cy="9" r="1.5"/>
                <path d="M4 17l5-5 4 4 3-3 4 4"/>
            </svg>`,

        attach: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 12.5l7-7a4 4 0 1 1 5.5 5.8l-9 9a6 6 0 0 1-8.5-8.5l8-8"/>
            </svg>`,

        send: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M14 7l5 5-5 5"/>
            </svg>`,

        refresh: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 7v5h-5"/>
                <path d="M19 12a7 7 0 1 0-2 5"/>
            </svg>`,

        info: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 10v6M12 7h.01"/>
            </svg>`
    };


    const CONTENT_EXCLUSIONS = `
        .assistant-message,
        .user-message,
        .ai-message,
        .bot-message,
        .message-content,
        .response-content,
        .markdown-body,
        .document-answer,
        pre,
        code,
        textarea,
        input,
        select
    `;


    function broken(value) {

        const text = String(value || "")
            .replace(/\s+/g, "")
            .trim();

        return (
            /^[?]{1,8}$/.test(text) ||
            /^[�]{1,8}$/.test(text) ||
            /^[?�]{1,8}$/.test(text)
        );
    }


    function semantic(element) {

        const owner =
            element.closest(
                "button,[role='button'],a"
            ) || element;

        return [
            owner.id,
            owner.className,
            owner.getAttribute("title"),
            owner.getAttribute("aria-label"),
            owner.getAttribute("data-action"),
            owner.getAttribute("data-icon-action"),
            owner.getAttribute("data-command"),
            owner.getAttribute("data-page")
        ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    }


    function typeFor(element) {

        const s = semantic(element);

        if (/voice|microphone|\bmic\b/.test(s)) return "mic";
        if (/speaker|audio|read.?aloud/.test(s)) return "speaker";
        if (/notification|alert|bell/.test(s)) return "bell";
        if (/close|dismiss|cancel/.test(s)) return "close";
        if (/menu|hamburger|sidebar/.test(s)) return "menu";
        if (/setting|preference/.test(s)) return "settings";
        if (/profile|account|identity|user/.test(s)) return "profile";
        if (/copy|clipboard/.test(s)) return "copy";
        if (/edit|rename/.test(s)) return "edit";
        if (/share/.test(s)) return "share";
        if (/delete|trash|remove/.test(s)) return "trash";
        if (/search/.test(s)) return "search";
        if (/web|globe|browser/.test(s)) return "globe";
        if (/image|photo|picture|gallery/.test(s)) return "image";
        if (/attach|paperclip|upload|file/.test(s)) return "attach";
        if (/send|submit|arrow/.test(s)) return "send";
        if (/refresh|retry|regenerate|reload/.test(s)) return "refresh";

        return "info";
    }


    function isContent(element) {

        return !!element.closest(
            CONTENT_EXCLUSIONS
        );
    }


    function repair(element) {

        if (!(element instanceof HTMLElement)) {
            return;
        }

        if (isContent(element)) {
            return;
        }

        /*
         * Prefer the actual interactive control.
         */
        let target =
            element.closest(
                "button,[role='button'],a"
            ) || element;


        if (isContent(target)) {
            return;
        }


        /*
         * IMPORTANT:
         * Do NOT skip something merely because it was
         * repaired before.
         *
         * chat.js can overwrite the icon later.
         */
        if (!broken(target.textContent)) {

            /*
             * Check a broken child icon too.
             */
            const child =
                [...target.querySelectorAll(
                    "span,i"
                )]
                .find(node =>
                    broken(node.textContent)
                );

            if (!child) {
                return;
            }
        }


        /*
         * Avoid replacing large content containers.
         */
        if (
            !target.matches(
                "button,[role='button'],a"
            ) &&
            target.children.length > 2
        ) {
            return;
        }


        const type =
            typeFor(target);


        target.innerHTML =
            `<span class="ap-ui-repaired-icon">${ICONS[type]}</span>`;


        target.dataset.apQuestionRepair =
            "done";


        target.classList.add(
            "ap-questionmark-repaired"
        );


        if (
            !target.getAttribute("aria-label")
        ) {

            target.setAttribute(
                "aria-label",
                type
            );
        }


        console.log(
            "✅ AP UI PERMANENT REPAIR:",
            type,
            target
        );
    }


    function scan(root) {

        if (!root) return;


        if (
            root instanceof HTMLElement
        ) {

            repair(root);
        }


        root.querySelectorAll?.(
            "button,[role='button'],a,span,i"
        )
        .forEach(
            repair
        );
    }


    let scheduled = false;


    function schedule(root = document.body) {

        if (scheduled) {
            return;
        }


        scheduled = true;


        requestAnimationFrame(() => {

            scheduled = false;

            scan(root || document.body);

        });
    }


    function start() {

        scan(document.body);


        /*
         * This is what fixes the remaining issue:
         *
         * whenever another AP Synapse script later writes
         * ??? back into an icon, repair it immediately.
         */

        const observer =
            new MutationObserver(
                mutations => {

                    for (const mutation of mutations) {

                        if (
                            mutation.type ===
                            "characterData"
                        ) {

                            const parent =
                                mutation.target
                                    .parentElement;

                            if (parent) {
                                schedule(parent);
                            }

                            continue;
                        }


                        if (
                            mutation.type ===
                            "childList"
                        ) {

                            if (
                                mutation.target instanceof
                                HTMLElement
                            ) {

                                schedule(
                                    mutation.target
                                );
                            }


                            mutation.addedNodes
                                .forEach(node => {

                                    if (
                                        node instanceof
                                        HTMLElement
                                    ) {

                                        schedule(node);
                                    }
                                });
                        }
                    }

                }
            );


        observer.observe(
            document.body,
            {
                subtree:
                    true,

                childList:
                    true,

                characterData:
                    true
            }
        );


        /*
         * Also check after ordinary UI interactions.
         */

        document.addEventListener(
            "click",
            event => {

                const target =
                    event.target;

                if (
                    target instanceof HTMLElement
                ) {

                    setTimeout(
                        () => schedule(target),
                        0
                    );

                    setTimeout(
                        () => scan(document.body),
                        80
                    );
                }

            },
            true
        );


        console.log(
            "✅ AP SYNAPSE — PERMANENT UI ICON GUARD ACTIVE"
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

/* ============================================================
   AP SYNAPSE — GLOBAL UI TEXT CORRUPTION GUARD

   Fixes:
   ?? Web Search Enabled  -> Web Search Enabled
   ??? Voice Ready        -> Voice Ready
   � Search               -> Search

   DOES NOT TOUCH AP SYNAPSE CHAT/RESPONSE CONTENT.
   ============================================================ */

(() => {
    "use strict";

    const EXCLUDED_CONTENT = `
        #chatWindow,
        .chat-window,
        .assistant-message,
        .user-message,
        .ai-message,
        .bot-message,
        .message-content,
        .response-content,
        .markdown-body,
        .document-answer,
        .ap-response-body,
        pre,
        code,
        textarea,
        input,
        [contenteditable="true"]
    `;


    function excluded(element) {

        return (
            element instanceof Element &&
            !!element.closest(EXCLUDED_CONTENT)
        );
    }


    function cleanUIString(value) {

        if (
            typeof value !== "string" ||
            !value
        ) {
            return value;
        }


        let result = value;


        /*
         * Unicode replacement-character corruption.
         */
        result =
            result.replace(
                /\uFFFD+/g,
                ""
            );


        /*
         * Broken icon prefix:
         *
         * ?? Text
         * ??? Text
         * ???? Text
         */
        result =
            result.replace(
                /^(\s*)\?{2,}\s+/,
                "$1"
            );


        /*
         * Occasionally only one broken ? survives:
         *
         * ? Web Search Enabled
         *
         * Restrict this to a question mark followed by
         * whitespace + ordinary UI wording.
         */
        result =
            result.replace(
                /^(\s*)\?\s+(?=[A-Z0-9])/,
                "$1"
            );


        /*
         * Corrupt separators in UI labels:
         *
         * Copy ?? Share
         */
        result =
            result.replace(
                /\s+\?{2,}\s+/g,
                " · "
            );


        /*
         * Broken junk at end of labels:
         *
         * Voice Enabled ??
         */
        result =
            result.replace(
                /\s+\?{2,}\s*$/,
                ""
            );


        /*
         * Remove spaces left by cleanup.
         */
        result =
            result.replace(
                /[ \t]{2,}/g,
                " "
            );


        return result;
    }


    function cleanDirectTextNodes(element) {

        if (
            !(element instanceof HTMLElement) ||
            excluded(element)
        ) {
            return;
        }


        /*
         * Do not replace element.innerHTML/textContent.
         * Clean TEXT NODES only so SVG icons and child
         * structures remain completely intact.
         */

        element.childNodes.forEach(node => {

            if (
                node.nodeType !==
                Node.TEXT_NODE
            ) {
                return;
            }


            const before =
                node.nodeValue;


            const after =
                cleanUIString(
                    before
                );


            if (
                after !== before
            ) {

                node.nodeValue =
                    after;


                console.log(
                    "✅ AP UI TEXT CLEANED:",
                    after.trim()
                );
            }

        });


        /*
         * Also repair corrupted accessibility/tooltip labels.
         */

        [
            "title",
            "aria-label",
            "data-tooltip"
        ].forEach(attribute => {

            if (
                !element.hasAttribute(
                    attribute
                )
            ) {
                return;
            }


            const before =
                element.getAttribute(
                    attribute
                );


            const after =
                cleanUIString(
                    before
                );


            if (
                after !== before
            ) {

                element.setAttribute(
                    attribute,
                    after
                );
            }

        });
    }


    function scan(root = document.body) {

        if (!root) {
            return;
        }


        if (
            root instanceof HTMLElement
        ) {
            cleanDirectTextNodes(root);
        }


        /*
         * UI chrome only.
         */

        root.querySelectorAll?.(`
            button,
            [role="button"],
            [role="status"],
            [role="alert"],
            .toast,
            .toast-message,
            .notification,
            .notification-message,
            .status,
            .status-message,
            .tooltip,
            .menu-item,
            .command-item,
            .sidebar-item,
            .settings-control,
            .popup-panel,
            .popup-header,
            label,
            nav span,
            header span
        `)
        .forEach(
            cleanDirectTextNodes
        );
    }


    let scheduled = false;


    function schedule() {

        if (scheduled) {
            return;
        }


        scheduled = true;


        requestAnimationFrame(() => {

            scheduled = false;

            scan(
                document.body
            );

        });
    }


    /*
     * Initial cleanup.
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            schedule,
            {
                once:true
            }
        );

    } else {

        schedule();
    }


    /*
     * Dynamic AP Synapse UI:
     *
     * toasts
     * popups
     * status messages
     * sidebar
     * settings
     * profile
     * command palette
     *
     * New corrupt text is cleaned immediately.
     */

    const observer =
        new MutationObserver(
            mutations => {

                let needsRepair =
                    false;


                for (
                    const mutation
                    of mutations
                ) {

                    const target =
                        mutation.target.nodeType ===
                            Node.TEXT_NODE
                            ?
                            mutation.target.parentElement
                            :
                            mutation.target;


                    if (
                        target instanceof Element &&
                        excluded(target)
                    ) {
                        continue;
                    }


                    needsRepair =
                        true;

                    break;
                }


                if (needsRepair) {
                    schedule();
                }

            }
        );


    function beginObserver() {

        if (!document.body) {
            return;
        }


        observer.observe(
            document.body,
            {
                subtree:true,
                childList:true,
                characterData:true,

                attributes:true,

                attributeFilter:[
                    "title",
                    "aria-label",
                    "data-tooltip"
                ]
            }
        );
    }


    if (document.body) {

        beginObserver();

    } else {

        document.addEventListener(
            "DOMContentLoaded",
            beginObserver,
            {
                once:true
            }
        );
    }


    console.log(
        "✅ AP SYNAPSE — GLOBAL UI TEXT CORRUPTION GUARD ACTIVE"
    );

})();

