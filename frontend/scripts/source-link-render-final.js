/* ============================================================
   AP SYNAPSE — SOURCE LINK RENDER FINAL

   Converts accidentally printed AP source HTML into
   professional clickable source cards.

   Only AP source markup is touched.
   Normal HTML/code examples are untouched.
   ============================================================ */

(() => {
    "use strict";


    function containsBrokenSourceMarkup(text) {

        if (
            typeof text !== "string"
        ) {
            return false;
        }


        return (
            text.includes("<a") &&
            /ap-source/i.test(text) &&
            /href\s*=/i.test(text)
        );
    }


    function safeSource(rawAnchor) {

        try {

            const parser =
                new DOMParser();


            const documentFragment =
                parser.parseFromString(
                    rawAnchor,
                    "text/html"
                );


            const anchor =
                documentFragment.querySelector(
                    "a"
                );


            if (!anchor) {
                return null;
            }


            /*
             * Only repair AP Synapse-generated source links.
             */

            const classes =
                anchor.className || "";


            if (
                !/ap-source/i.test(
                    classes
                )
            ) {

                return null;
            }


            const href =
                anchor.getAttribute(
                    "href"
                );


            if (!href) {
                return null;
            }


            const url =
                new URL(
                    href,
                    window.location.href
                );


            /*
             * Security: no javascript:, data:, etc.
             */

            if (
                url.protocol !== "http:" &&
                url.protocol !== "https:"
            ) {

                return null;
            }


            let domain =
                url.hostname
                    .replace(/^www\./i, "");


            const originalText =
                (
                    anchor.textContent ||
                    ""
                )
                .replace(/\s+/g, " ")
                .trim();


            /*
             * Prefer useful source text when available.
             */

            if (
                originalText &&
                !originalText.startsWith(
                    "http"
                ) &&
                originalText.length <= 80
            ) {

                domain =
                    originalText;
            }


            return {
                url:
                    url.href,

                domain
            };

        } catch {

            return null;
        }
    }


    function createSourceCard(source) {

        const link =
            document.createElement(
                "a"
            );


        link.className =
            "ap-source-final-card";


        link.href =
            source.url;


        link.target =
            "_blank";


        link.rel =
            "noopener noreferrer";


        link.setAttribute(
            "aria-label",
            `Open source: ${source.domain}`
        );


        link.innerHTML = `
            <span class="ap-source-final-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"></circle>
                    <path d="M3 12h18"></path>
                    <path d="M12 3c3 3 3 15 0 18"></path>
                    <path d="M12 3c-3 3-3 15 0 18"></path>
                </svg>
            </span>

            <span class="ap-source-final-copy">
                <span class="ap-source-final-label">
                    Source
                </span>

                <span class="ap-source-final-domain"></span>
            </span>

            <span aria-hidden="true">
                ↗
            </span>
        `;


        link
            .querySelector(
                ".ap-source-final-domain"
            )
            .textContent =
                source.domain;


        return link;
    }


    function repairBlock(element) {

        if (
            !(element instanceof HTMLElement)
        ) {

            return;
        }


        if (
            element.dataset
                .apSourceRepair ===
                "done"
        ) {

            return;
        }


        const raw =
            element.textContent || "";


        if (
            !containsBrokenSourceMarkup(
                raw
            )
        ) {

            return;
        }


        /*
         * Do not touch user-authored code examples unless
         * they specifically contain AP Synapse source markup.
         */

        const anchorPattern =
            /<a\b[\s\S]*?<\/a>/gi;


        const matches =
            [...raw.matchAll(
                anchorPattern
            )];


        const valid =
            matches
                .map(match => ({
                    match,
                    source:
                        safeSource(
                            match[0]
                        )
                }))
                .filter(item =>
                    item.source
                );


        if (!valid.length) {
            return;
        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "ap-source-repaired-line";


        let cursor =
            0;


        valid.forEach(item => {

            const index =
                item.match.index;


            /*
             * Preserve ordinary text surrounding the source.
             */

            const before =
                raw.slice(
                    cursor,
                    index
                );


            if (
                before.trim()
            ) {

                wrapper.appendChild(
                    document.createTextNode(
                        before
                    )
                );
            }


            wrapper.appendChild(
                createSourceCard(
                    item.source
                )
            );


            cursor =
                index +
                item.match[0].length;
        });


        const after =
            raw.slice(
                cursor
            );


        if (
            after.trim()
        ) {

            wrapper.appendChild(
                document.createTextNode(
                    after
                )
            );
        }


        /*
         * If <code> is inside <pre>, replace the entire
         * ugly code block, not merely the inner code node.
         */

        const replacementTarget =
            element.matches("code") &&
            element.parentElement?.matches(
                "pre"
            )
                ?
                element.parentElement
                :
                element;


        replacementTarget
            .replaceWith(
                wrapper
            );


        wrapper.dataset
            .apSourceRepair =
                "done";


        console.log(
            "✅ AP SYNAPSE — RAW SOURCE MARKUP REPAIRED"
        );
    }


    function scan(root) {

        if (!root) {
            return;
        }


        const candidates = [];


        if (
            root instanceof HTMLElement
        ) {

            candidates.push(
                root
            );
        }


        root.querySelectorAll?.(
            `
            pre,
            code,
            .message-content,
            .response-content,
            .assistant-message p,
            .assistant-message div,
            .ai-message p,
            .ai-message div
            `
        )
        .forEach(element => {

            candidates.push(
                element
            );

        });


        /*
         * Process smaller/deeper elements first.
         */

        candidates
            .sort(
                (a,b) =>
                    b.querySelectorAll("*").length -
                    a.querySelectorAll("*").length
            )
            .forEach(
                repairBlock
            );
    }


    let scheduled =
        false;


    function schedule(root) {

        if (scheduled) {
            return;
        }


        scheduled =
            true;


        requestAnimationFrame(() => {

            scheduled =
                false;


            scan(
                root ||
                document.getElementById(
                    "chatWindow"
                ) ||
                document.body
            );

        });
    }


    function start() {

        const chat =
            document.getElementById(
                "chatWindow"
            );


        if (!chat) {

            setTimeout(
                start,
                200
            );

            return;
        }


        /*
         * Existing/history messages.
         */

        scan(chat);


        /*
         * Future responses.
         *
         * Observer is limited ONLY to chatWindow,
         * not the whole AP Synapse interface.
         */

        const observer =
            new MutationObserver(
                mutations => {

                    for (
                        const mutation
                        of mutations
                    ) {

                        if (
                            mutation.type ===
                            "characterData"
                        ) {

                            schedule(
                                mutation.target
                                    .parentElement
                            );

                            continue;
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
            );


        observer.observe(
            chat,
            {
                subtree:true,
                childList:true,
                characterData:true
            }
        );


        console.log(
            "✅ AP SYNAPSE — SOURCE RENDERER ACTIVE"
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
