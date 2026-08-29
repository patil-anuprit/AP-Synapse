(() => {
    "use strict";

    if (window.__AP_FINAL_POLISH_V1__) {
        return;
    }

    window.__AP_FINAL_POLISH_V1__ = true;


    const PRIMARY =
        "https://api.ap-synapse.com";

    const SECONDARY =
        "https://ap-synapse-production.up.railway.app";


    const state = {
        file: null,
        previewURL: "",
        sessionId: "",
        uploadStartedAt: 0,
        finalAcknowledgement: "",
        acknowledgementBody: null
    };


    // ========================================================
    // AP SYNAPSE — UI TEXT SANITIZER
    // Conversations are deliberately excluded.
    // ========================================================

    function isConversationContent(element) {

        return !!element?.closest?.(
            [
                "#chatWindow",
                ".message",
                ".message-body",
                ".conversation",
                ".conversation-message",
                "[data-role='assistant']",
                "[data-role='user']"
            ].join(",")
        );

    }


    function shouldIgnoreTextNode(node) {

        const parent =
            node?.parentElement;

        if (!parent) {
            return true;
        }

        if (isConversationContent(parent)) {
            return true;
        }

        if (
            parent.closest(
                [
                    "script",
                    "style",
                    "pre",
                    "code",
                    "textarea",
                    "input",
                    "[contenteditable='true']"
                ].join(",")
            )
        ) {
            return true;
        }

        return false;
    }


    function cleanUITextNode(node) {

        if (
            !node ||
            node.nodeType !== Node.TEXT_NODE ||
            shouldIgnoreTextNode(node)
        ) {
            return;
        }


        const parent =
            node.parentElement;

        const original =
            node.nodeValue || "";

        let cleaned =
            original;


        // Unicode replacement characters.
        cleaned =
            cleaned.replace(
                /\uFFFD+/g,
                ""
            );


        /*
         * Remove broken double/triple question-mark icon debris,
         * while leaving normal grammatical single question marks alone.
         */
        cleaned =
            cleaned.replace(
                /(^|[\s([{])\?{2,}(?=\s|[A-Za-z0-9)\]}]|$)/g,
                "$1"
            );


        /*
         * An icon-only '?' is safe to remove only when the control
         * already has an accessible label/title.
         */
        if (
            /^\s*\?\s*$/.test(cleaned) &&
            (
                parent.matches(
                    "button,[role='button']"
                ) ||
                parent.getAttribute(
                    "aria-label"
                ) ||
                parent.getAttribute(
                    "title"
                )
            )
        ) {

            cleaned = "";

        }


        cleaned =
            cleaned.replace(
                /[ \t]{2,}/g,
                " "
            );


        if (cleaned !== original) {

            node.nodeValue =
                cleaned;

        }

    }


    function cleanUI(root) {

        if (!root) {
            return;
        }


        if (
            root.nodeType ===
            Node.TEXT_NODE
        ) {

            cleanUITextNode(root);
            return;

        }


        if (
            root.nodeType !==
            Node.ELEMENT_NODE
        ) {
            return;
        }


        if (isConversationContent(root)) {
            return;
        }


        const walker =
            document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT
            );


        let node;

        while (
            (
                node =
                    walker.nextNode()
            )
        ) {

            cleanUITextNode(node);

        }

    }


    // ========================================================
    // AP SYNAPSE — SMART CHAT LINK REPAIR
    // Converts URLs accidentally returned in code formatting.
    // ========================================================

    function safeHTTPURL(value) {

        try {

            const url =
                new URL(
                    String(value).trim()
                );

            if (
                url.protocol !== "http:" &&
                url.protocol !== "https:"
            ) {
                return null;
            }

            return url.href;

        }
        catch {

            return null;

        }

    }


    function makeSmartLink(
        label,
        href
    ) {

        const link =
            document.createElement(
                "a"
            );

        link.className =
            "ap-smart-chat-link";

        link.href =
            href;

        link.target =
            "_blank";

        link.rel =
            "noopener noreferrer";

        link.textContent =
            label || href;

        return link;

    }


    function repairCodeLink(code) {

        if (
            !code ||
            code.dataset.apLinkRepaired ===
                "1"
        ) {
            return;
        }


        const text =
            (
                code.textContent || ""
            ).trim();


        if (!text) {
            return;
        }


        let label =
            "";

        let href =
            "";


        const markdown =
            text.match(
                /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/
            );


        if (markdown) {

            label =
                markdown[1].trim();

            href =
                safeHTTPURL(
                    markdown[2]
                ) || "";

        }
        else {

            href =
                safeHTTPURL(
                    text
                ) || "";

            label =
                text;

        }


        if (!href) {
            return;
        }


        const link =
            makeSmartLink(
                label,
                href
            );


        const pre =
            code.closest(
                "pre"
            );


        /*
         * If the whole code block is only a URL,
         * replace the entire code block.
         */
        if (
            pre &&
            (
                pre.textContent || ""
            ).trim() === text
        ) {

            pre.replaceWith(
                link
            );

        }
        else {

            code.replaceWith(
                link
            );

        }

    }


    function repairAssistantLinks(
        root = document
    ) {

        const bodies = [];


        if (
            root.matches?.(
                ".message.ai .message-body"
            )
        ) {

            bodies.push(root);

        }


        root.querySelectorAll?.(
            ".message.ai .message-body"
        )
        .forEach(
            body =>
                bodies.push(body)
        );


        for (const body of bodies) {

            body
                .querySelectorAll(
                    "code"
                )
                .forEach(
                    repairCodeLink
                );


            body
                .querySelectorAll(
                    "a[href]"
                )
                .forEach(link => {

                    const href =
                        safeHTTPURL(
                            link.href
                        );

                    if (!href) {
                        return;
                    }

                    link.target =
                        "_blank";

                    link.rel =
                        "noopener noreferrer";

                    link.classList.add(
                        "ap-smart-chat-link"
                    );

                });

        }

    }


    // ========================================================
    // ATTACHMENT UI
    // ========================================================

    function formatBytes(bytes) {

        const value =
            Number(bytes) || 0;

        if (value < 1024) {
            return `${value} B`;
        }

        if (value < 1024 * 1024) {
            return `${(
                value / 1024
            ).toFixed(1)} KB`;
        }

        return `${(
            value /
            (1024 * 1024)
        ).toFixed(1)} MB`;

    }


    function typeLabel(file) {

        const type =
            String(
                file?.type || ""
            ).toLowerCase();

        const name =
            String(
                file?.name || ""
            ).toLowerCase();


        if (
            type.startsWith(
                "image/"
            )
        ) {
            return "IMG";
        }

        if (
            type ===
                "application/pdf" ||
            name.endsWith(
                ".pdf"
            )
        ) {
            return "PDF";
        }

        if (
            name.endsWith(".doc") ||
            name.endsWith(".docx")
        ) {
            return "DOC";
        }

        if (
            name.endsWith(".xls") ||
            name.endsWith(".xlsx") ||
            name.endsWith(".csv")
        ) {
            return "DATA";
        }

        if (
            name.endsWith(".txt")
        ) {
            return "TXT";
        }

        return "FILE";

    }


    function createAttachmentContents(
        container,
        file,
        statusText
    ) {

        container.textContent =
            "";


        const visual =
            document.createElement(
                "div"
            );

        visual.className =
            "ap-attachment-visual";


        if (
            file.type?.startsWith(
                "image/"
            ) &&
            state.previewURL
        ) {

            const image =
                document.createElement(
                    "img"
                );

            image.src =
                state.previewURL;

            image.alt =
                file.name;

            image.className =
                "ap-attachment-preview-image";

            visual.appendChild(
                image
            );

        }
        else {

            const type =
                document.createElement(
                    "span"
                );

            type.className =
                "ap-attachment-type";

            type.textContent =
                typeLabel(file);

            visual.appendChild(
                type
            );

        }


        const info =
            document.createElement(
                "div"
            );

        info.className =
            "ap-attachment-info";


        const name =
            document.createElement(
                "strong"
            );

        name.className =
            "ap-attachment-name";

        name.textContent =
            file.name;


        const meta =
            document.createElement(
                "span"
            );

        meta.className =
            "ap-attachment-meta";

        meta.textContent =
            `${formatBytes(
                file.size
            )} · ${statusText}`;


        info.append(
            name,
            meta
        );


        container.append(
            visual,
            info
        );

    }


    function ensureAttachmentShelf() {

        let shelf =
            document.getElementById(
                "apAttachmentShelfV1"
            );

        if (shelf) {
            return shelf;
        }


        const fileInput =
            document.getElementById(
                "fileInput"
            );

        if (!fileInput) {
            return null;
        }


        shelf =
            document.createElement(
                "div"
            );

        shelf.id =
            "apAttachmentShelfV1";

        shelf.className =
            "ap-attachment-shelf";

        shelf.hidden =
            true;


        const composer =
            fileInput.closest(
                [
                    ".composer",
                    ".composer-shell",
                    ".chat-composer",
                    ".chat-input-container",
                    ".input-area",
                    ".bottom-input"
                ].join(",")
            );


        if (
            composer?.parentElement
        ) {

            composer.parentElement
                .insertBefore(
                    shelf,
                    composer
                );

        }
        else {

            fileInput.parentElement
                ?.insertBefore(
                    shelf,
                    fileInput
                );

        }


        return shelf;

    }


    function showAttachmentShelf(
        file,
        status =
            "Preparing"
    ) {

        const shelf =
            ensureAttachmentShelf();

        if (!shelf) {
            return;
        }


        shelf.hidden =
            false;

        createAttachmentContents(
            shelf,
            file,
            status
        );

    }


    // ========================================================
    // NO UNWANTED UPWARD JUMP DURING FILE UPLOAD
    // ========================================================

    function protectUploadViewport() {

        const chat =
            document.getElementById(
                "chatWindow"
            );


        const originalChatTop =
            chat?.scrollTop || 0;

        const originalPageTop =
            window.scrollY || 0;


        let cancelled =
            false;


        const cancel =
            () => {
                cancelled = true;
            };


        const events = [
            "wheel",
            "touchstart",
            "pointerdown"
        ];


        events.forEach(
            eventName => {

                window.addEventListener(
                    eventName,
                    cancel,
                    {
                        capture: true,
                        passive: true,
                        once: true
                    }
                );

            }
        );


        [
            0,
            40,
            100,
            220,
            420,
            750,
            1200,
            1800
        ].forEach(delay => {

            setTimeout(
                () => {

                    if (cancelled) {
                        return;
                    }


                    /*
                     * Only stop an AUTOMATIC jump upward.
                     * Normal downward scrolling is untouched.
                     */
                    if (
                        chat &&
                        chat.scrollTop <
                            originalChatTop - 60
                    ) {

                        chat.scrollTop =
                            originalChatTop;

                    }


                    if (
                        window.scrollY <
                            originalPageTop - 60
                    ) {

                        window.scrollTo(
                            {
                                top:
                                    originalPageTop,
                                behavior:
                                    "auto"
                            }
                        );

                    }

                },
                delay
            );

        });

    }


    // ========================================================
    // ENHANCE THE USER'S EXISTING "UPLOADING..." MESSAGE
    // ========================================================

    function latestMatchingBody(
        selector,
        predicate
    ) {

        const bodies =
            [
                ...document.querySelectorAll(
                    selector
                )
            ].reverse();


        return bodies.find(
            body =>
                predicate(
                    (
                        body.innerText ||
                        body.textContent ||
                        ""
                    ).trim()
                )
        ) || null;

    }


    function enhanceUserUploadMessage() {

        const file =
            state.file;

        if (!file) {
            return;
        }


        const body =
            latestMatchingBody(
                "#chatWindow .message.user .message-body",
                text =>
                    text.includes(
                        file.name
                    ) &&
                    /uploading/i.test(
                        text
                    )
            );


        if (
            !body ||
            body.dataset
                .apAttachmentEnhanced ===
                "1"
        ) {
            return;
        }


        body.dataset
            .apAttachmentEnhanced =
            "1";


        body.textContent =
            "";


        const card =
            document.createElement(
                "div"
            );

        card.className =
            "ap-chat-attachment-card";


        createAttachmentContents(
            card,
            file,
            "Uploading…"
        );


        body.appendChild(
            card
        );

    }


    function markUserAttachmentReady() {

        const file =
            state.file;

        if (!file) {
            return;
        }


        const card =
            document.querySelector(
                "#chatWindow .message.user .ap-chat-attachment-card:last-child"
            );


        if (card) {

            createAttachmentContents(
                card,
                file,
                "Ready"
            );

        }


        showAttachmentShelf(
            file,
            "Ready"
        );

    }


    // ========================================================
    // FIND / UPDATE EXISTING GENERIC UPLOAD ACK
    // ========================================================

    function findGenericUploadAck() {

        const file =
            state.file;

        if (!file) {
            return null;
        }


        return latestMatchingBody(
            "#chatWindow .message.ai .message-body",
            text =>
                text.includes(
                    file.name
                ) &&
                (
                    /uploaded successfully/i.test(
                        text
                    ) ||
                    /you can now ask/i.test(
                        text
                    ) ||
                    /document ready/i.test(
                        text
                    )
                )
        );

    }


    function createFallbackAckBody() {

        const chat =
            document.getElementById(
                "chatWindow"
            );

        if (!chat) {
            return null;
        }


        const wrapper =
            document.createElement(
                "div"
            );

        wrapper.className =
            "message ai ap-upload-intake-message";


        const avatar =
            document.createElement(
                "div"
            );

        avatar.className =
            "avatar";

        avatar.textContent =
            "AP";


        const body =
            document.createElement(
                "div"
            );

        body.className =
            "message-body";


        wrapper.append(
            avatar,
            body
        );


        chat.appendChild(
            wrapper
        );


        return body;

    }


    function writeAcknowledgement(
        text
    ) {

        let body =
            findGenericUploadAck() ||
            state.acknowledgementBody;


        if (!body) {

            body =
                createFallbackAckBody();

        }


        if (!body) {
            return;
        }


        state.acknowledgementBody =
            body;


        body.textContent =
            "";


        const copy =
            document.createElement(
                "p"
            );

        copy.className =
            "ap-upload-intake-copy";

        copy.textContent =
            text;


        body.appendChild(
            copy
        );


        repairAssistantLinks(
            body
        );

    }


    function fallbackAcknowledgement(
        file
    ) {

        const current =
            window.currentDocument;


        if (
            typeof current ===
                "string" &&
            current.trim()
        ) {

            const words =
                current
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .length;


            return (
                `I've received ${file.name}. ` +
                `It contains readable document content of about ${words.toLocaleString()} words and is ready for detailed analysis. ` +
                `How can I help you with it?`
            );

        }


        if (
            file.type?.startsWith(
                "image/"
            )
        ) {

            return (
                `I've received ${file.name}. ` +
                `The image is loaded and ready for visual analysis. ` +
                `How can I help you with it?`
            );

        }


        return (
            `I've received ${file.name}. ` +
            `The file is loaded and ready for detailed analysis. ` +
            `How can I help you with it?`
        );

    }


    // ========================================================
    // RENDER -> RAILWAY FALLBACK FOR AUTOMATIC FILE SUMMARY
    // ========================================================

    async function fetchDocumentSummary(
        file
    ) {

        if (!state.sessionId) {

            throw new Error(
                "Upload session ID unavailable."
            );

        }


        let lastError =
            null;


        for (
            const base of [
                PRIMARY,
                SECONDARY
            ]
        ) {

            try {

                const response =
                    await fetch(
                        `${base}/document/summary`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "x-session-id":
                                    state.sessionId
                            },

                            body:
                                JSON.stringify({
                                    fileName:
                                        file.name,

                                    mimeType:
                                        file.type || ""
                                })
                        }
                    );


                if (
                    !response.ok
                ) {

                    lastError =
                        new Error(
                            `HTTP ${response.status}`
                        );

                    continue;

                }


                const data =
                    await response.json();


                if (
                    data?.success &&
                    data?.summary
                ) {

                    return String(
                        data.summary
                    ).trim();

                }

            }
            catch (error) {

                lastError =
                    error;

            }

        }


        throw (
            lastError ||
            new Error(
                "Automatic document analysis unavailable."
            )
        );

    }


    function normalizeAcknowledgement(
        file,
        summary
    ) {

        let text =
            String(
                summary || ""
            )
            .replace(
                /```[\s\S]*?```/g,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


        if (!text) {

            return fallbackAcknowledgement(
                file
            );

        }


        if (
            !/^i(?:'|’)ve received\b/i.test(
                text
            )
        ) {

            text =
                `I've received ${file.name}. ${text}`;

        }


        if (
            !/how can i help you with it\??$/i.test(
                text
            )
        ) {

            text +=
                " How can I help you with it?";

        }


        if (
            text.length > 700
        ) {

            text =
                text.slice(
                    0,
                    620
                )
                .replace(
                    /\s+\S*$/,
                    ""
                )
                .trim() +
                "… How can I help you with it?";

        }


        return text;

    }


    async function handleUploadReady(
        uploadData
    ) {

        const file =
            state.file;

        if (!file) {
            return;
        }


        if (
            uploadData?.original &&
            uploadData.original !==
                file.name
        ) {
            return;
        }


        markUserAttachmentReady();


        /*
         * Replace the old generic upload message immediately.
         */
        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    80
                )
        );


        writeAcknowledgement(
            `I've received ${file.name}. I'm reviewing its contents now…`
        );


        try {

            const summary =
                await fetchDocumentSummary(
                    file
                );


            const finalText =
                normalizeAcknowledgement(
                    file,
                    summary
                );


            state.finalAcknowledgement =
                finalText;


            writeAcknowledgement(
                finalText
            );

        }
        catch (error) {

            console.warn(
                "AP document intake analysis fallback:",
                error
            );


            const fallback =
                fallbackAcknowledgement(
                    file
                );


            state.finalAcknowledgement =
                fallback;


            writeAcknowledgement(
                fallback
            );

        }

    }


    // ========================================================
    // OBSERVE EXISTING /upload CALL WITHOUT DUPLICATING UPLOAD
    // ========================================================

    function getHeader(
        headers,
        name
    ) {

        if (!headers) {
            return "";
        }


        if (
            headers instanceof Headers
        ) {

            return (
                headers.get(name) ||
                ""
            );

        }


        const target =
            name.toLowerCase();


        for (
            const [
                key,
                value
            ] of Object.entries(
                headers
            )
        ) {

            if (
                key.toLowerCase() ===
                target
            ) {

                return String(
                    value
                );

            }

        }


        return "";

    }


    const previousFetch =
        window.fetch.bind(
            window
        );


    window.fetch =
        async function(
            input,
            init
        ) {

            const url =
                typeof input ===
                    "string"
                    ? input
                    : input?.url || "";


            const isUpload =
                /\/upload(?:\?|$)/i.test(
                    url
                );


            if (
                isUpload &&
                state.file
            ) {

                const session =
                    getHeader(
                        init?.headers,
                        "x-session-id"
                    );


                if (session) {

                    state.sessionId =
                        session;

                }

            }


            const response =
                await previousFetch(
                    input,
                    init
                );


            if (
                isUpload &&
                response.ok &&
                state.file
            ) {

                response.clone()
                    .json()
                    .then(data => {

                        handleUploadReady(
                            data
                        );

                    })
                    .catch(() => {});

            }


            return response;

        };


    // ========================================================
    // FILE SELECTION
    // ========================================================

    function onFileSelected(
        event
    ) {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }


        if (
            state.previewURL
        ) {

            URL.revokeObjectURL(
                state.previewURL
            );

        }


        state.file =
            file;

        state.previewURL =
            URL.createObjectURL(
                file
            );

        state.sessionId =
            "";

        state.uploadStartedAt =
            Date.now();

        state.finalAcknowledgement =
            "";

        state.acknowledgementBody =
            null;


        protectUploadViewport();


        showAttachmentShelf(
            file,
            "Uploading…"
        );


        [
            0,
            30,
            100,
            250
        ].forEach(delay => {

            setTimeout(
                enhanceUserUploadMessage,
                delay
            );

        });

    }


    function installFileListener() {

        const input =
            document.getElementById(
                "fileInput"
            );

        if (
            !input ||
            input.dataset
                .apFinalPolishBound ===
                "1"
        ) {
            return;
        }


        input.dataset
            .apFinalPolishBound =
            "1";


        /*
         * Capture phase lets us preserve the viewport before
         * any existing upload UI modifies the conversation.
         */
        input.addEventListener(
            "change",
            onFileSelected,
            true
        );

    }


    // ========================================================
    // DYNAMIC UI OBSERVER
    // ========================================================

    const pendingNodes =
        new Set();

    let observerScheduled =
        false;


    function flushObservedNodes() {

        observerScheduled =
            false;


        const nodes =
            [...pendingNodes];

        pendingNodes.clear();


        for (
            const node of nodes
        ) {

            cleanUI(node);

            if (
                node.nodeType ===
                Node.ELEMENT_NODE
            ) {

                repairAssistantLinks(
                    node
                );

            }

        }


        installFileListener();

        enhanceUserUploadMessage();


        if (
            state.finalAcknowledgement
        ) {

            const generic =
                findGenericUploadAck();

            if (
                generic &&
                generic !==
                    state.acknowledgementBody
            ) {

                state.acknowledgementBody =
                    generic;

                writeAcknowledgement(
                    state.finalAcknowledgement
                );

            }

        }

    }


    const observer =
        new MutationObserver(
            mutations => {

                for (
                    const mutation
                    of mutations
                ) {

                    mutation
                        .addedNodes
                        .forEach(
                            node =>
                                pendingNodes.add(
                                    node
                                )
                        );

                }


                if (
                    observerScheduled
                ) {
                    return;
                }


                observerScheduled =
                    true;


                requestAnimationFrame(
                    flushObservedNodes
                );

            }
        );


    function boot() {

        installFileListener();

        ensureAttachmentShelf();

        cleanUI(
            document.body
        );

        repairAssistantLinks(
            document
        );


        observer.observe(
            document.body,
            {
                childList:
                    true,

                subtree:
                    true,

                characterData:
                    true
            }
        );


        console.log(
            "AP FINAL POLISH V1 ACTIVE"
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

    }
    else {

        boot();

    }


    window.addEventListener(
        "beforeunload",
        () => {

            if (
                state.previewURL
            ) {

                URL.revokeObjectURL(
                    state.previewURL
                );

            }

        }
    );

})();
