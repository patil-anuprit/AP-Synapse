(() => {
    "use strict";

    if (window.__AP_UPLOAD_POLISH_V2__) {
        return;
    }

    window.__AP_UPLOAD_POLISH_V2__ = true;


    const state = {
        file: null,
        previewURL: "",
        selectedAt: 0,
        body: null
    };


    function textOf(element) {
        return (
            element?.innerText ||
            element?.textContent ||
            ""
        ).trim();
    }


    function size(bytes) {

        const n =
            Number(bytes) || 0;

        if (n < 1024) {
            return `${n} B`;
        }

        if (n < 1024 * 1024) {
            return `${(n / 1024).toFixed(1)} KB`;
        }

        return `${(
            n /
            (1024 * 1024)
        ).toFixed(1)} MB`;

    }


    function typeName(file) {

        const name =
            String(file?.name || "")
                .toLowerCase();

        const type =
            String(file?.type || "")
                .toLowerCase();


        if (type.startsWith("image/")) {
            return "IMAGE";
        }

        if (
            type === "application/pdf" ||
            name.endsWith(".pdf")
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
            name.endsWith(".xlsx") ||
            name.endsWith(".xls") ||
            name.endsWith(".csv")
        ) {
            return "DATA";
        }

        if (name.endsWith(".txt")) {
            return "TXT";
        }

        return "FILE";
    }


    // ========================================================
    // FULL IMAGE PREVIEW
    // ========================================================

    function openImagePreview() {

        if (
            !state.file ||
            !state.previewURL ||
            !state.file.type?.startsWith("image/")
        ) {
            return;
        }


        document
            .getElementById("apUploadPreviewV2")
            ?.remove();


        const overlay =
            document.createElement("div");

        overlay.id =
            "apUploadPreviewV2";

        overlay.className =
            "ap-upload-preview-v2";


        const image =
            document.createElement("img");

        image.src =
            state.previewURL;

        image.alt =
            state.file.name;


        const close =
            document.createElement("button");

        close.type =
            "button";

        close.className =
            "ap-upload-preview-close-v2";

        close.setAttribute(
            "aria-label",
            "Close preview"
        );

        close.textContent =
            "×";


        close.addEventListener(
            "click",
            () => overlay.remove()
        );


        overlay.addEventListener(
            "click",
            event => {

                if (event.target === overlay) {
                    overlay.remove();
                }

            }
        );


        overlay.append(
            image,
            close
        );

        document.body.appendChild(
            overlay
        );

    }


    // ========================================================
    // COMPACT PROFESSIONAL ATTACHMENT
    // ========================================================

    function makeCard(status) {

        const file =
            state.file;

        if (!file) {
            return null;
        }


        const card =
            document.createElement("div");

        card.className =
            "ap-upload-card-v2";


        const visual =
            document.createElement("div");

        visual.className =
            "ap-upload-visual-v2";


        if (
            file.type?.startsWith("image/") &&
            state.previewURL
        ) {

            const img =
                document.createElement("img");

            img.src =
                state.previewURL;

            img.alt =
                file.name;

            img.loading =
                "eager";

            img.addEventListener(
                "click",
                openImagePreview
            );

            visual.appendChild(img);

        }
        else {

            const type =
                document.createElement("span");

            type.textContent =
                typeName(file);

            visual.appendChild(type);

        }


        const info =
            document.createElement("div");

        info.className =
            "ap-upload-info-v2";


        const name =
            document.createElement("strong");

        name.textContent =
            file.name;


        const meta =
            document.createElement("span");

        meta.className =
            "ap-upload-meta-v2";

        meta.textContent =
            `${size(file.size)} · ${status}`;


        info.append(
            name,
            meta
        );


        card.append(
            visual,
            info
        );


        return card;

    }


    function findCurrentUploadBody() {

        if (!state.file) {
            return null;
        }


        const bodies =
            [
                ...document.querySelectorAll(
                    "#chatWindow .message.user .message-body"
                )
            ].reverse();


        return bodies.find(body => {

            if (
                body.dataset.apUploadV2 ===
                "1"
            ) {
                return true;
            }


            const text =
                textOf(body);


            return (
                body.querySelector("img") ||
                text.includes(state.file.name) ||
                /uploading|uploaded successfully|ready for analysis/i
                    .test(text)
            );

        }) || null;

    }


    function normalizeAttachment() {

        if (!state.file) {
            return;
        }


        const body =
            findCurrentUploadBody();

        if (!body) {
            return;
        }


        /*
         * Completely replace the old giant upload UI.
         * This also removes the broken '?' icon.
         */
        body.replaceChildren(
            makeCard("Analyzing…")
        );


        body.dataset.apUploadV2 =
            "1";

        state.body =
            body;


        /*
         * We already have the attachment in-chat.
         * Do not show a second permanent composer shelf.
         */
        const oldShelf =
            document.getElementById(
                "apAttachmentShelfV1"
            );

        if (oldShelf) {
            oldShelf.hidden = true;
            oldShelf.style.display = "none";
        }

    }


    function markReady() {

        if (!state.body) {
            state.body =
                findCurrentUploadBody();
        }


        if (!state.body) {
            return;
        }


        state.body.replaceChildren(
            makeCard(
                "Ready for analysis"
            )
        );


        state.body.dataset.apUploadV2 =
            "1";

    }


    // ========================================================
    // REMOVE OLD DUPLICATE "UPLOADED SUCCESSFULLY"
    // ========================================================

    function removeLegacyAcknowledgement() {

        if (
            !state.file ||
            Date.now() -
                state.selectedAt >
                30000
        ) {
            return;
        }


        const messages =
            [
                ...document.querySelectorAll(
                    "#chatWindow .message.ai"
                )
            ].slice(-8);


        for (const message of messages) {

            const body =
                message.querySelector(
                    ".message-body"
                );

            if (!body) {
                continue;
            }


            const text =
                textOf(body);


            if (
                /^i(?:'|’)ve received\b/i
                    .test(text)
            ) {
                continue;
            }


            if (
                /uploaded successfully/i.test(text) ||
                /you can ask me anything about it/i.test(text) ||
                /you can now ask me anything/i.test(text)
            ) {

                message.remove();

            }

        }

    }


    // ========================================================
    // KEEP ONLY ONE INTELLIGENT ACKNOWLEDGEMENT
    // ========================================================

    function normalizeIntelligentAck() {

        if (!state.file) {
            return;
        }


        const bodies =
            [
                ...document.querySelectorAll(
                    "#chatWindow .message.ai .message-body"
                )
            ];


        const acknowledgements =
            bodies.filter(body => {

                const text =
                    textOf(body);

                return (
                    /^i(?:'|’)ve received\b/i
                        .test(text) &&
                    (
                        text.includes(
                            state.file.name
                        ) ||
                        Date.now() -
                            state.selectedAt <
                            30000
                    )
                );

            });


        if (
            acknowledgements.length >
            0
        ) {

            markReady();


            const oldShelf =
                document.getElementById(
                    "apAttachmentShelfV1"
                );

            if (oldShelf) {

                oldShelf.hidden =
                    true;

                oldShelf.style.display =
                    "none";

            }

        }


        /*
         * If any accidental duplicate intelligent
         * acknowledgement exists, keep only the newest.
         */
        if (
            acknowledgements.length >
            1
        ) {

            acknowledgements
                .slice(0, -1)
                .forEach(body => {

                    body
                        .closest(".message.ai")
                        ?.remove();

                });

        }

    }


    // ========================================================
    // NO UPWARD AUTOSCROLL ON FILE SELECTION
    // ========================================================

    function protectViewport() {

        const chat =
            document.getElementById(
                "chatWindow"
            );

        if (!chat) {
            return;
        }


        const startingTop =
            chat.scrollTop;


        let userMoved =
            false;


        const cancel =
            () => {
                userMoved = true;
            };


        chat.addEventListener(
            "wheel",
            cancel,
            {
                once: true,
                passive: true
            }
        );


        chat.addEventListener(
            "touchstart",
            cancel,
            {
                once: true,
                passive: true
            }
        );


        [
            0,
            50,
            120,
            250,
            500,
            900,
            1400,
            2000
        ].forEach(delay => {

            setTimeout(
                () => {

                    if (
                        userMoved ||
                        !chat
                    ) {
                        return;
                    }


                    /*
                     * Block only an automatic jump UP.
                     * Natural downward movement remains allowed.
                     */
                    if (
                        chat.scrollTop <
                        startingTop - 50
                    ) {

                        chat.scrollTop =
                            startingTop;

                    }

                },
                delay
            );

        });

    }


    // ========================================================
    // FILE INPUT
    // ========================================================

    function bindFileInput() {

        const input =
            document.getElementById(
                "fileInput"
            );

        if (
            !input ||
            input.dataset.apUploadV2Bound ===
                "1"
        ) {
            return;
        }


        input.dataset.apUploadV2Bound =
            "1";


        input.addEventListener(
            "change",
            event => {

                const file =
                    event.target.files?.[0];

                if (!file) {
                    return;
                }


                if (state.previewURL) {

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

                state.selectedAt =
                    Date.now();

                state.body =
                    null;


                protectViewport();


                [
                    0,
                    40,
                    100,
                    200,
                    450,
                    900,
                    1500
                ].forEach(delay => {

                    setTimeout(
                        () => {

                            normalizeAttachment();
                            removeLegacyAcknowledgement();
                            normalizeIntelligentAck();

                        },
                        delay
                    );

                });

            },
            true
        );

    }


    // ========================================================
    // CONTINUOUS REPAIR FOR ASYNC STREAMING DOM
    // ========================================================

    let scheduled =
        false;


    const observer =
        new MutationObserver(() => {

            if (scheduled) {
                return;
            }


            scheduled =
                true;


            requestAnimationFrame(
                () => {

                    scheduled =
                        false;

                    bindFileInput();

                    normalizeAttachment();

                    removeLegacyAcknowledgement();

                    normalizeIntelligentAck();

                }
            );

        });


    function boot() {

        bindFileInput();


        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );


        console.log(
            "AP UPLOAD POLISH V2 ACTIVE"
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

            if (state.previewURL) {

                URL.revokeObjectURL(
                    state.previewURL
                );

            }

        }
    );

})();
