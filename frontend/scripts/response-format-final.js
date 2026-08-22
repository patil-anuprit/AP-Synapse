/* ============================================================
   AP SYNAPSE — RESPONSE FORMAT FINAL

   FIXES:
   \text{Score}        -> Score
   \times              -> ×
   \frac{1}{2}         -> 1/2
   \[ formula \]       -> formula
   \( formula \)       -> formula

   ALSO:
   [NCERT](https://...) -> clickable NCERT
   https://...          -> clickable URL
   www.example.com      -> clickable URL
   example.gov.in       -> clickable URL

   DOES NOT MODIFY:
   - code blocks
   - pre blocks
   - user messages
   - textarea/input
   ============================================================ */

(() => {
    "use strict";


    /* ========================================================
       TEXT / LATEX CLEANER
       ======================================================== */

    function cleanMathText(value) {

        if (
            typeof value !== "string" ||
            !value
        ) {

            return value;
        }


        let text =
            value;


        /*
         * Display / inline math wrappers.
         */

        text = text
            .replace(/\\\[/g, "")
            .replace(/\\\]/g, "")
            .replace(/\\\(/g, "")
            .replace(/\\\)/g, "");


        /*
         * Common text containers.
         *
         * Run repeatedly because some answers can contain
         * more than one.
         */

        for (
            let i = 0;
            i < 5;
            i++
        ) {

            text = text
                .replace(
                    /\\text\s*\{([^{}]*)\}/g,
                    "$1"
                )
                .replace(
                    /\\mathrm\s*\{([^{}]*)\}/g,
                    "$1"
                )
                .replace(
                    /\\mathbf\s*\{([^{}]*)\}/g,
                    "$1"
                )
                .replace(
                    /\\operatorname\s*\{([^{}]*)\}/g,
                    "$1"
                );
        }


        /*
         * Fractions.
         *
         * \frac{3}{4} -> 3/4
         */

        for (
            let i = 0;
            i < 5;
            i++
        ) {

            text = text.replace(
                /\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g,
                "($1/$2)"
            );
        }


        /*
         * Normal mathematical characters.
         */

        const replacements = [

            [/\\times\b/g, "×"],
            [/\\cdot\b/g, "·"],
            [/\\div\b/g, "÷"],

            [/\\pm\b/g, "±"],

            [/\\leq\b/g, "≤"],
            [/\\le\b/g, "≤"],

            [/\\geq\b/g, "≥"],
            [/\\ge\b/g, "≥"],

            [/\\neq\b/g, "≠"],
            [/\\ne\b/g, "≠"],

            [/\\approx\b/g, "≈"],

            [/\\rightarrow\b/g, "→"],
            [/\\to\b/g, "→"],

            [/\\leftarrow\b/g, "←"],

            [/\\infty\b/g, "∞"],

            [/\\degree\b/g, "°"],

            [/\\%/g, "%"],

            [/\\alpha\b/g, "α"],
            [/\\beta\b/g, "β"],
            [/\\gamma\b/g, "γ"],
            [/\\delta\b/g, "δ"],
            [/\\theta\b/g, "θ"],
            [/\\lambda\b/g, "λ"],
            [/\\pi\b/g, "π"],
            [/\\sigma\b/g, "σ"],

            [/\\sqrt\s*\{([^{}]+)\}/g, "√($1)"]
        ];


        replacements.forEach(
            ([pattern, replacement]) => {

                text =
                    text.replace(
                        pattern,
                        replacement
                    );

            }
        );


        /*
         * Basic superscript/subscript cleanup.
         *
         * x^{2} -> x^2
         * N_{total} -> N_total
         */

        text = text
            .replace(
                /\^\{([^{}]+)\}/g,
                "^$1"
            )
            .replace(
                /_\{([^{}]+)\}/g,
                "_$1"
            );


        /*
         * Remove $$ formatting markers.
         *
         * Do NOT remove ordinary single dollar signs because
         * they may represent currency.
         */

        text =
            text.replace(
                /\$\$/g,
                ""
            );


        /*
         * Remove a few remaining harmless TeX layout commands.
         */

        text = text
            .replace(
                /\\,/g,
                " "
            )
            .replace(
                /\\;/g,
                " "
            )
            .replace(
                /\\quad\b/g,
                " "
            )
            .replace(
                /\\qquad\b/g,
                "  "
            );


        /*
         * Do not leave ugly repeated spaces.
         */

        text =
            text.replace(
                /[ \t]{2,}/g,
                " "
            );


        return text;
    }


    /* ========================================================
       AP RESPONSE CONTENT ONLY
       ======================================================== */

    function responseRoot(element) {

        return element.closest(`
            .assistant-message,
            .ai-message,
            .bot-message,
            .response-content,
            .message.assistant,
            .message.ai
        `);
    }


    function excluded(element) {

        return !!element.closest(`
            pre,
            code,
            textarea,
            input,
            select,
            [contenteditable="true"],
            .user-message,
            .message.user
        `);
    }


    /* ========================================================
       CLEAN LATEX TEXT NODES
       ======================================================== */

    function cleanResponseText(root) {

        if (
            !(root instanceof Element)
        ) {
            return;
        }


        const walker =
            document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT
            );


        const nodes = [];

        let node;


        while (
            node =
            walker.nextNode()
        ) {

            const parent =
                node.parentElement;


            if (
                !parent ||
                excluded(parent) ||
                parent.closest("a")
            ) {

                continue;
            }


            nodes.push(
                node
            );
        }


        nodes.forEach(node => {

            const before =
                node.nodeValue;


            const after =
                cleanMathText(
                    before
                );


            if (
                before !== after
            ) {

                node.nodeValue =
                    after;
            }

        });
    }


    /* ========================================================
       MARKDOWN LINKS
       [NCERT](https://ncert.nic.in/)
       ======================================================== */

    function repairMarkdownLinks(root) {

        const walker =
            document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT
            );


        const nodes = [];

        let node;


        while (
            node =
            walker.nextNode()
        ) {

            const parent =
                node.parentElement;


            if (
                !parent ||
                excluded(parent) ||
                parent.closest("a")
            ) {

                continue;
            }


            if (
                /\[[^\]]+\]\(https?:\/\/[^)\s]+\)/i
                    .test(
                        node.nodeValue || ""
                    )
            ) {

                nodes.push(
                    node
                );
            }
        }


        nodes.forEach(node => {

            const text =
                node.nodeValue;


            const regex =
                /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi;


            let match;
            let last =
                0;


            const fragment =
                document.createDocumentFragment();


            while (
                (
                    match =
                        regex.exec(text)
                ) !== null
            ) {

                fragment.append(
                    document.createTextNode(
                        text.slice(
                            last,
                            match.index
                        )
                    )
                );


                const link =
                    makeLink(
                        match[2],
                        match[1]
                    );


                if (link) {

                    fragment.append(
                        link
                    );

                } else {

                    fragment.append(
                        document.createTextNode(
                            match[0]
                        )
                    );
                }


                last =
                    regex.lastIndex;
            }


            fragment.append(
                document.createTextNode(
                    text.slice(last)
                )
            );


            node.replaceWith(
                fragment
            );

        });
    }


    /* ========================================================
       SECURE LINK FACTORY
       ======================================================== */

    function makeLink(
        rawURL,
        label
    ) {

        try {

            let value =
                rawURL.trim();


            if (
                /^www\./i.test(value)
            ) {

                value =
                    "https://" +
                    value;
            }


            /*
             * Plain domain:
             * ncert.nic.in
             * diksha.gov.in
             */

            if (
                !/^[a-z]+:\/\//i.test(value)
            ) {

                value =
                    "https://" +
                    value;
            }


            const url =
                new URL(value);


            if (
                url.protocol !== "https:" &&
                url.protocol !== "http:"
            ) {

                return null;
            }


            const anchor =
                document.createElement(
                    "a"
                );


            anchor.className =
                "ap-response-link-final";


            anchor.href =
                url.href;


            anchor.target =
                "_blank";


            anchor.rel =
                "noopener noreferrer";


            anchor.textContent =
                label ||
                url.hostname.replace(
                    /^www\./,
                    ""
                );


            return anchor;

        } catch {

            return null;
        }
    }


    /* ========================================================
       RAW URLs / DOMAINS
       ======================================================== */

    function linkifyText(root) {

        const walker =
            document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT
            );


        const nodes = [];

        let node;


        while (
            node =
            walker.nextNode()
        ) {

            const parent =
                node.parentElement;


            if (
                !parent ||
                excluded(parent) ||
                parent.closest("a")
            ) {

                continue;
            }


            const text =
                node.nodeValue || "";


            /*
             * URLs + www + common institutional domains.
             */

            if (
                /(https?:\/\/|www\.|(?:[a-z0-9-]+\.)+(?:gov\.in|nic\.in|edu\.in|ac\.in|org|com|net)\b)/i
                    .test(text)
            ) {

                nodes.push(
                    node
                );
            }
        }


        nodes.forEach(node => {

            const text =
                node.nodeValue;


            const regex =
                /(https?:\/\/[^\s<>"')\]]+|www\.[^\s<>"')\]]+|(?:[a-z0-9-]+\.)+(?:gov\.in|nic\.in|edu\.in|ac\.in|org|com|net)(?:\/[^\s<>"')\]]*)?)/gi;


            let match;
            let last =
                0;


            const fragment =
                document.createDocumentFragment();


            let changed =
                false;


            while (
                (
                    match =
                        regex.exec(text)
                ) !== null
            ) {

                let url =
                    match[0];


                /*
                 * Strip punctuation normally ending sentences.
                 */

                let trailing =
                    "";


                while (
                    /[.,;:!?]$/.test(url)
                ) {

                    trailing =
                        url.slice(-1) +
                        trailing;


                    url =
                        url.slice(
                            0,
                            -1
                        );
                }


                fragment.append(
                    document.createTextNode(
                        text.slice(
                            last,
                            match.index
                        )
                    )
                );


                const link =
                    makeLink(
                        url,
                        url.replace(
                            /^https?:\/\//i,
                            ""
                        )
                    );


                if (link) {

                    fragment.append(
                        link
                    );


                    changed =
                        true;

                } else {

                    fragment.append(
                        document.createTextNode(
                            url
                        )
                    );
                }


                if (trailing) {

                    fragment.append(
                        document.createTextNode(
                            trailing
                        )
                    );
                }


                last =
                    regex.lastIndex;
            }


            fragment.append(
                document.createTextNode(
                    text.slice(last)
                )
            );


            if (changed) {

                node.replaceWith(
                    fragment
                );
            }

        });
    }


    /* ========================================================
       PROCESS RESPONSE
       ======================================================== */

    function processResponse(root) {

        if (
            !(root instanceof Element)
        ) {
            return;
        }


        const response =
            responseRoot(root) ||
            (
                root.matches?.(
                    ".assistant-message,.ai-message,.bot-message,.response-content,.message.assistant,.message.ai"
                )
                    ?
                    root
                    :
                    null
            );


        if (!response) {
            return;
        }


        cleanResponseText(
            response
        );


        repairMarkdownLinks(
            response
        );


        linkifyText(
            response
        );


        response.dataset
            .apResponseFormatFinal =
                "true";
    }


    function scan() {

        const chat =
            document.getElementById(
                "chatWindow"
            );


        if (!chat) {
            return;
        }


        chat
            .querySelectorAll(`
                .assistant-message,
                .ai-message,
                .bot-message,
                .response-content,
                .message.assistant,
                .message.ai
            `)
            .forEach(
                processResponse
            );
    }


    /* ========================================================
       DYNAMIC RESPONSES
       ======================================================== */

    function start() {

        const chat =
            document.getElementById(
                "chatWindow"
            );


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
                mutations => {

                    requestAnimationFrame(
                        scan
                    );

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


        /*
         * History restoration may happen after navigation.
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
            "✅ AP SYNAPSE — RESPONSE FORMAT FINAL ACTIVE"
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
