(() => {
    "use strict";

    if (
        window.__AP_APRISHA_CAPABILITY_CENTER_V1__
    ) {
        return;
    }

    window.__AP_APRISHA_CAPABILITY_CENTER_V1__ =
        true;


    const ACTIVATED_KEY =
        "ap_aprisha_capabilities_activated_v1";

    const SEEN_KEY =
        "ap_aprisha_capabilities_seen_v1";


    const state = {

        microphone:
            "unknown",

        camera:
            "unknown",

        notifications:
            "unknown",

        location:
            "unknown"
    };


    /* ======================================================
       HELPERS
       ====================================================== */

    function secure() {

        return (
            window.isSecureContext ||
            location.hostname === "localhost" ||
            location.hostname === "127.0.0.1"
        );
    }


    function setProgress(
        message
    ) {

        const el =
            document.getElementById(
                "ap-cap-progress"
            );


        if (!el) {
            return;
        }


        el.textContent =
            message || "";


        el.classList.toggle(
            "ap-visible",
            !!message
        );
    }


    function setState(
        capability,
        value
    ) {

        state[capability] =
            value;


        const el =
            document.querySelector(
                `[data-ap-state="${capability}"]`
            );


        if (!el) {
            return;
        }


        el.className =
            "ap-cap-state";


        if (
            value === "granted"
        ) {

            el.textContent =
                "Allowed";

            el.classList.add(
                "ap-granted"
            );

        }
        else if (
            value === "denied"
        ) {

            el.textContent =
                "Not allowed";

            el.classList.add(
                "ap-denied"
            );

        }
        else if (
            value === "prompt"
        ) {

            el.textContent =
                "Needs permission";

            el.classList.add(
                "ap-prompt"
            );

        }
        else if (
            value === "unsupported"
        ) {

            el.textContent =
                "Not supported here";

        }
        else {

            el.textContent =
                "Checking…";
        }


        window.dispatchEvent(
            new CustomEvent(
                "ap:aprisha-capability-updated",
                {
                    detail: {
                        capability,
                        state: value
                    }
                }
            )
        );
    }


    async function queryPermission(
        name
    ) {

        try {

            if (
                !navigator.permissions
                    ?.query
            ) {

                return "unknown";
            }


            const result =
                await navigator
                    .permissions
                    .query({
                        name
                    });


            return (
                result.state ||
                "unknown"
            );

        }
        catch {

            return "unknown";
        }
    }


    /* ======================================================
       STATUS
       ====================================================== */

    async function refreshStatus() {

        if (!secure()) {

            for (
                const capability of [
                    "microphone",
                    "camera",
                    "notifications",
                    "location"
                ]
            ) {

                setState(
                    capability,
                    "unsupported"
                );
            }


            setProgress(
                "Aprisha permissions require HTTPS."
            );


            return;
        }


        const mic =
            await queryPermission(
                "microphone"
            );


        const camera =
            await queryPermission(
                "camera"
            );


        const location =
            await queryPermission(
                "geolocation"
            );


        setState(
            "microphone",
            mic
        );


        setState(
            "camera",
            camera
        );


        setState(
            "location",
            location
        );


        if (
            "Notification" in window
        ) {

            setState(
                "notifications",
                Notification.permission ===
                    "default"
                    ? "prompt"
                    : Notification.permission
            );

        } else {

            setState(
                "notifications",
                "unsupported"
            );
        }
    }


    /* ======================================================
       CORE PERMISSION REQUESTS
       ====================================================== */

    async function requestNotifications() {

        if (
            !("Notification" in window)
        ) {

            setState(
                "notifications",
                "unsupported"
            );


            return false;
        }


        try {

            const result =
                await Notification
                    .requestPermission();


            setState(
                "notifications",
                result === "default"
                    ? "prompt"
                    : result
            );


            return (
                result === "granted"
            );

        }
        catch {

            setState(
                "notifications",
                "denied"
            );


            return false;
        }
    }


    async function requestMicrophone() {

        try {

            if (
                !navigator.mediaDevices
                    ?.getUserMedia
            ) {

                setState(
                    "microphone",
                    "unsupported"
                );


                return false;
            }


            const stream =
                await navigator
                    .mediaDevices
                    .getUserMedia({
                        audio: true
                    });


            stream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );


            setState(
                "microphone",
                "granted"
            );


            /*
             * Activate existing Aprisha voice engine
             * only when it exists.
             */
            try {

                await window
                    .APAprishaVoiceRouter
                    ?.enable
                    ?.();

            }
            catch {}


            return true;

        }
        catch (error) {

            console.warn(
                "Aprisha microphone permission:",
                error
            );


            setState(
                "microphone",
                "denied"
            );


            return false;
        }
    }


    async function requestCamera() {

        try {

            if (
                !navigator.mediaDevices
                    ?.getUserMedia
            ) {

                setState(
                    "camera",
                    "unsupported"
                );


                return false;
            }


            const stream =
                await navigator
                    .mediaDevices
                    .getUserMedia({
                        video: true
                    });


            stream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );


            setState(
                "camera",
                "granted"
            );


            return true;

        }
        catch (error) {

            console.warn(
                "Aprisha camera permission:",
                error
            );


            setState(
                "camera",
                "denied"
            );


            return false;
        }
    }


    function requestLocation() {

        return new Promise(
            resolve => {

                if (
                    !navigator.geolocation
                ) {

                    setState(
                        "location",
                        "unsupported"
                    );


                    resolve(false);
                    return;
                }


                navigator.geolocation
                    .getCurrentPosition(

                        () => {

                            setState(
                                "location",
                                "granted"
                            );


                            resolve(true);
                        },

                        error => {

                            console.warn(
                                "Aprisha location permission:",
                                error
                            );


                            setState(
                                "location",
                                "denied"
                            );


                            resolve(false);
                        },

                        {
                            enableHighAccuracy:
                                false,

                            timeout:
                                10000,

                            maximumAge:
                                300000
                        }
                    );
            }
        );
    }


    /* ======================================================
       ACTIVATE APRISHA
       ====================================================== */

    async function activate() {

        if (!secure()) {

            setProgress(
                "HTTPS is required before Aprisha can request device capabilities."
            );


            return;
        }


        const button =
            document.getElementById(
                "ap-cap-activate"
            );


        if (button) {
            button.disabled = true;
        }


        try {

            /*
             * Notifications are requested first because
             * browsers often require this to happen close
             * to the user's button click.
             */

            setProgress(
                "Requesting notifications…"
            );


            await requestNotifications();


            setProgress(
                "Requesting microphone…"
            );


            await requestMicrophone();


            setProgress(
                "Requesting camera…"
            );


            await requestCamera();


            setProgress(
                "Requesting location…"
            );


            await requestLocation();


            /*
             * Presence core can connect now if available.
             */
            try {

                window
                    .APSynapsePresence
                    ?.connect
                    ?.();

            }
            catch {}


            localStorage.setItem(
                ACTIVATED_KEY,
                "1"
            );


            localStorage.setItem(
                SEEN_KEY,
                "1"
            );


            setProgress(
                "Aprisha is activated. Additional sensitive capabilities will be requested only when a task needs them."
            );


            await refreshStatus();


            setTimeout(
                () => {
                    close();
                },
                1800
            );

        }
        finally {

            if (button) {
                button.disabled = false;
            }
        }
    }


    /* ======================================================
       JUST-IN-TIME CAPABILITIES

       Browser security requires these to be selected/
       confirmed when actually used.
       ====================================================== */

    async function requestScreen() {

        if (
            !navigator.mediaDevices
                ?.getDisplayMedia
        ) {

            throw new Error(
                "Screen sharing is not supported by this browser."
            );
        }


        /*
         * Returns the stream to Aprisha.
         * User chooses the screen/window/tab.
         */
        return await navigator
            .mediaDevices
            .getDisplayMedia({
                video: true,
                audio: false
            });
    }


    function pickFiles(
        options = {}
    ) {

        return new Promise(
            resolve => {

                const input =
                    document.createElement(
                        "input"
                    );


                input.type =
                    "file";


                input.multiple =
                    !!options.multiple;


                if (
                    options.accept
                ) {

                    input.accept =
                        options.accept;
                }


                input.style.display =
                    "none";


                input.addEventListener(
                    "change",
                    () => {

                        const files =
                            Array.from(
                                input.files ||
                                []
                            );


                        input.remove();


                        resolve(
                            files
                        );
                    },
                    {
                        once: true
                    }
                );


                document.body
                    .appendChild(
                        input
                    );


                input.click();
            }
        );
    }


    async function readClipboard() {

        if (
            !navigator.clipboard
                ?.readText
        ) {

            throw new Error(
                "Clipboard reading is not supported here."
            );
        }


        /*
         * Browser may require a fresh user gesture.
         */
        return await navigator
            .clipboard
            .readText();
    }


    async function writeClipboard(
        value
    ) {

        if (
            !navigator.clipboard
                ?.writeText
        ) {

            throw new Error(
                "Clipboard writing is not supported here."
            );
        }


        await navigator
            .clipboard
            .writeText(
                String(value ?? "")
            );


        return true;
    }


    async function share(
        data
    ) {

        if (
            !navigator.share
        ) {

            throw new Error(
                "Native sharing is unavailable."
            );
        }


        await navigator.share(
            data
        );


        return true;
    }


    function activateNativeAssistant() {

        if (
            window
                .AprishaAssistantRuntime
                ?.activate
        ) {

            window
                .AprishaAssistantRuntime
                .activate();


            return true;
        }


        return false;
    }


    /* ======================================================
       UI
       ====================================================== */

    function buildUI() {

        if (
            document.getElementById(
                "ap-capability-overlay"
            )
        ) {
            return;
        }


        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "ap-capability-overlay";


        overlay.innerHTML = `
            <section
                class="ap-cap-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ap-cap-title"
            >

                <header class="ap-cap-head">

                    <div class="ap-cap-mark">
                        AP
                    </div>

                    <div>

                        <h2
                            id="ap-cap-title"
                            class="ap-cap-title"
                        >
                            Activate Aprisha
                        </h2>

                        <p class="ap-cap-subtitle">
                            Give AP Synapse the capabilities you want Aprisha to use.
                        </p>

                    </div>

                </header>


                <div class="ap-cap-intro">

                    Aprisha only receives capabilities that
                    you explicitly approve. Sensitive actions
                    such as screen sharing, choosing files and
                    external device access remain under your
                    control.

                </div>


                <div class="ap-cap-grid">

                    <div class="ap-cap-item">

                        <div class="ap-cap-icon">
                            🎤
                        </div>

                        <div>

                            <div class="ap-cap-name">
                                Microphone
                            </div>

                            <div
                                class="ap-cap-state"
                                data-ap-state="microphone"
                            >
                                Checking…
                            </div>

                        </div>

                    </div>


                    <div class="ap-cap-item">

                        <div class="ap-cap-icon">
                            ◉
                        </div>

                        <div>

                            <div class="ap-cap-name">
                                Camera
                            </div>

                            <div
                                class="ap-cap-state"
                                data-ap-state="camera"
                            >
                                Checking…
                            </div>

                        </div>

                    </div>


                    <div class="ap-cap-item">

                        <div class="ap-cap-icon">
                            ⌖
                        </div>

                        <div>

                            <div class="ap-cap-name">
                                Location
                            </div>

                            <div
                                class="ap-cap-state"
                                data-ap-state="location"
                            >
                                Checking…
                            </div>

                        </div>

                    </div>


                    <div class="ap-cap-item">

                        <div class="ap-cap-icon">
                            ◌
                        </div>

                        <div>

                            <div class="ap-cap-name">
                                Notifications
                            </div>

                            <div
                                class="ap-cap-state"
                                data-ap-state="notifications"
                            >
                                Checking…
                            </div>

                        </div>

                    </div>

                </div>


                <div class="ap-cap-note">

                    Files, screen sharing, clipboard access,
                    Bluetooth/USB devices and protected system
                    actions require a fresh user confirmation
                    when Aprisha actually needs them. Browsers
                    do not permit websites to silently bypass
                    those safeguards.

                </div>


                <div class="ap-cap-actions">

                    <button
                        id="ap-cap-activate"
                        class="ap-cap-primary"
                        type="button"
                    >
                        Activate Aprisha
                    </button>

                    <button
                        id="ap-cap-later"
                        class="ap-cap-secondary"
                        type="button"
                    >
                        Not now
                    </button>

                </div>


                <div
                    id="ap-cap-progress"
                    class="ap-cap-progress"
                ></div>

            </section>
        `;


        document.body
            .appendChild(
                overlay
            );


        const manage =
            document.createElement(
                "button"
            );


        manage.className =
            "ap-cap-manage";


        manage.type =
            "button";


        manage.title =
            "Aprisha permissions";


        manage.setAttribute(
            "aria-label",
            "Manage Aprisha permissions"
        );


        manage.textContent =
            "AP";


        document.body
            .appendChild(
                manage
            );


        document
            .getElementById(
                "ap-cap-activate"
            )
            ?.addEventListener(
                "click",
                activate
            );


        document
            .getElementById(
                "ap-cap-later"
            )
            ?.addEventListener(
                "click",
                () => {

                    localStorage.setItem(
                        SEEN_KEY,
                        "1"
                    );


                    close();
                }
            );


        manage.addEventListener(
            "click",
            open
        );
    }


    async function open() {

        buildUI();


        document
            .getElementById(
                "ap-capability-overlay"
            )
            ?.classList
            .add(
                "ap-open"
            );


        await refreshStatus();
    }


    function close() {

        document
            .getElementById(
                "ap-capability-overlay"
            )
            ?.classList
            .remove(
                "ap-open"
            );
    }


    function shouldAutoOpen() {

        return (
            localStorage.getItem(
                ACTIVATED_KEY
            ) !== "1"
            &&
            localStorage.getItem(
                SEEN_KEY
            ) !== "1"
        );
    }


    /* ======================================================
       PUBLIC APRISHA CAPABILITY API
       ====================================================== */

    window.AprishaCapabilities = {

        open,
        close,

        activate,

        refresh:
            refreshStatus,

        status() {

            return {
                ...state,

                secureContext:
                    secure(),

                activated:
                    localStorage
                        .getItem(
                            ACTIVATED_KEY
                        ) === "1",

                screenShare:
                    !!navigator
                        .mediaDevices
                        ?.getDisplayMedia,

                filePicker:
                    true,

                clipboard:
                    !!navigator
                        .clipboard,

                share:
                    !!navigator
                        .share,

                nativeAssistant:
                    !!window
                        .AprishaAssistantRuntime
                        ?.activate
            };
        },


        request: {

            microphone:
                requestMicrophone,

            camera:
                requestCamera,

            location:
                requestLocation,

            notifications:
                requestNotifications,

            screen:
                requestScreen,

            files:
                pickFiles,

            clipboardRead:
                readClipboard,

            clipboardWrite:
                writeClipboard,

            share,

            nativeAssistant:
                activateNativeAssistant
        }
    };


    /* ======================================================
       START
       ====================================================== */

    function boot() {

        buildUI();


        refreshStatus();


        if (
            shouldAutoOpen()
        ) {

            setTimeout(
                open,
                650
            );
        }


        console.log(
            "⚡ AP SYNAPSE — APRISHA CAPABILITY CENTER READY"
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