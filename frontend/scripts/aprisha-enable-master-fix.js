(() => {
    "use strict";

    const GRANTED_KEY =
        "apAprishaMicGranted";

    let enabling =
        false;


    /* ============================================================
       VISUAL STATUS
       ============================================================ */

    function permissionBar() {

        return document.getElementById(
            "apAprishaPermission"
        );
    }


    function permissionButton() {

        return document.getElementById(
            "apAprishaPermissionEnable"
        );
    }


    function setButton(
        text,
        disabled = false
    ) {

        const button =
            permissionButton();

        if (!button) {
            return;
        }

        button.textContent =
            text;

        button.disabled =
            disabled;
    }


    function setPermissionText(
        title,
        subtitle
    ) {

        const copy =
            document.querySelector(
                ".ap-aprisha-permission-copy"
            );

        if (!copy) {
            return;
        }

        const strong =
            copy.querySelector(
                "strong"
            );

        const span =
            copy.querySelector(
                "span"
            );

        if (strong) {
            strong.textContent =
                title;
        }

        if (span) {
            span.textContent =
                subtitle;
        }
    }


    function showError(
        message
    ) {

        setPermissionText(
            "Hey Aprisha needs microphone access",
            message
        );

        setButton(
            "Try Again",
            false
        );

        const bar =
            permissionBar();

        if (bar) {
            bar.hidden =
                false;
        }
    }


    /* ============================================================
       DIRECT MICROPHONE ACTIVATION
       ============================================================ */

    async function requestMicrophone() {

        if (
            !navigator.mediaDevices ||
            typeof navigator.mediaDevices.getUserMedia !==
                "function"
        ) {

            throw new Error(
                "This browser does not provide microphone access."
            );
        }


        const stream =
            await navigator.mediaDevices
                .getUserMedia({
                    audio: {
                        echoCancellation:
                            true,

                        noiseSuppression:
                            true,

                        autoGainControl:
                            true
                    },

                    video:
                        false
                });


        /*
         * We only need this stream to obtain permission.
         * Aprisha's speech recognition handles listening.
         */

        stream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );
    }


    /* ============================================================
       ENABLE MASTER
       ============================================================ */

    async function enableMaster(
        event
    ) {

        if (enabling) {
            return;
        }


        if (event) {

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }


        enabling =
            true;


        setButton(
            "Enabling…",
            true
        );


        setPermissionText(
            "Starting Aprisha",
            "Allow microphone access when your browser asks."
        );


        try {

            await requestMicrophone();


            /*
             * Permanent browser/device marker.
             */

            localStorage.setItem(
                GRANTED_KEY,
                "true"
            );


            localStorage.setItem(
                "apAprishaEnabled",
                "true"
            );


            setPermissionText(
                "Hey Aprisha enabled",
                "Aprisha is ready."
            );


            setButton(
                "Enabled",
                true
            );


            /*
             * Now invoke the real Aprisha engine.
             */

            if (
                window.APAprisha &&
                typeof window.APAprisha.enable ===
                    "function"
            ) {

                try {

                    await window
                        .APAprisha
                        .enable();

                }
                catch (
                    internalError
                ) {

                    console.warn(
                        "Aprisha internal enable:",
                        internalError
                    );
                }
            }


            const bar =
                permissionBar();


            if (bar) {

                setTimeout(
                    () => {

                        bar.hidden =
                            true;

                    },
                    550
                );
            }


            /*
             * Confirmation vibration.
             */

            try {

                navigator.vibrate?.(
                    [18, 25, 35]
                );

            }
            catch {}


            /*
             * The FIRST successful Enable immediately
             * demonstrates Aprisha.
             */

            setTimeout(
                () => {

                    if (
                        window.APAprisha &&
                        typeof window.APAprisha.wake ===
                            "function"
                    ) {

                        window
                            .APAprisha
                            .wake();

                    }
                    else if (
                        window.APAprisha &&
                        typeof window.APAprisha.open ===
                            "function"
                    ) {

                        window
                            .APAprisha
                            .open();
                    }

                },
                650
            );


            console.log(
                "✅ APRISHA MICROPHONE ACTIVATED"
            );


        }
        catch (
            error
        ) {

            console.error(
                "Aprisha microphone activation:",
                error
            );


            if (
                error.name ===
                    "NotAllowedError" ||
                error.name ===
                    "PermissionDeniedError"
            ) {

                showError(
                    "Microphone permission was blocked. Allow it from the browser's site permissions, then tap Try Again."
                );

            }
            else if (
                error.name ===
                "NotFoundError"
            ) {

                showError(
                    "No microphone was found on this device."
                );

            }
            else {

                showError(
                    error.message ||
                    "Microphone could not be started."
                );
            }

        }
        finally {

            enabling =
                false;
        }
    }


    /* ============================================================
       CAPTURE CLICK BEFORE ANY OTHER AP SYNAPSE HANDLER
       ============================================================ */

    document.addEventListener(
        "click",
        event => {

            const target =
                event.target
                    ?.closest?.(
                        "#apAprishaPermissionEnable, #apAprishaEnable"
                    );


            if (!target) {
                return;
            }


            enableMaster(
                event
            );

        },
        true
    );


    /*
     * Pointer handler improves Android/PWA reliability.
     */

    document.addEventListener(
        "pointerup",
        event => {

            const target =
                event.target
                    ?.closest?.(
                        "#apAprishaPermissionEnable"
                    );


            if (!target) {
                return;
            }


            /*
             * Click normally follows pointerup.
             * Only intervene if click somehow never arrives.
             */

            target.dataset
                .aprishaPointerSeen =
                String(
                    Date.now()
                );

        },
        true
    );


    /* ============================================================
       AUTO START ON FUTURE VISITS
       ============================================================ */

    function autoRestore() {

        const granted =
            localStorage.getItem(
                GRANTED_KEY
            ) === "true";


        const enabled =
            localStorage.getItem(
                "apAprishaEnabled"
            ) !== "false";


        if (
            !granted ||
            !enabled
        ) {

            return;
        }


        /*
         * Hide one-time permission banner.
         */

        const bar =
            permissionBar();


        if (bar) {

            bar.hidden =
                true;
        }


        /*
         * Existing permission means getUserMedia no longer
         * needs another browser prompt.
         */

        setTimeout(
            async () => {

                try {

                    if (
                        window.APAprisha &&
                        typeof window.APAprisha.enable ===
                            "function"
                    ) {

                        await window
                            .APAprisha
                            .enable();
                    }

                }
                catch (
                    error
                ) {

                    console.warn(
                        "Aprisha auto restore:",
                        error
                    );
                }

            },
            700
        );
    }


    /* ============================================================
       BROWSER PERMISSION CHANGE RECOVERY
       ============================================================ */

    async function watchPermission() {

        if (
            !navigator.permissions
        ) {
            return;
        }


        try {

            const permission =
                await navigator.permissions
                    .query({
                        name:
                            "microphone"
                    });


            permission.onchange =
                () => {

                    if (
                        permission.state ===
                        "granted"
                    ) {

                        localStorage.setItem(
                            GRANTED_KEY,
                            "true"
                        );


                        localStorage.setItem(
                            "apAprishaEnabled",
                            "true"
                        );


                        autoRestore();

                    }
                    else if (
                        permission.state ===
                        "denied"
                    ) {

                        localStorage.removeItem(
                            GRANTED_KEY
                        );
                    }
                };

        }
        catch {

            /*
             * Permissions API differs between browsers.
             * Direct getUserMedia remains the source of truth.
             */
        }
    }


    /* ============================================================
       BOOT
       ============================================================ */

    function boot() {

        /*
         * Force pointer accessibility.
         */

        const style =
            document.createElement(
                "style"
            );


        style.textContent = `

            #apAprishaPermission {
                pointer-events:
                    auto !important;
            }

            #apAprishaPermissionEnable {
                pointer-events:
                    auto !important;

                touch-action:
                    manipulation !important;

                cursor:
                    pointer !important;

                position:
                    relative !important;

                z-index:
                    2147483647 !important;
            }

            #apAprishaPermissionEnable:disabled {
                cursor:
                    wait !important;

                opacity:
                    .72 !important;
            }

        `;


        document.head
            .appendChild(
                style
            );


        autoRestore();
        watchPermission();


        console.log(
            "✅ APRISHA ENABLE MASTER FIX ACTIVE"
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
