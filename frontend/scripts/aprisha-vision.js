(() => {
    "use strict";

    const API =
        ["localhost", "127.0.0.1"].includes(location.hostname)
            ? "http://localhost:5000/chat"
            : "https://api.ap-synapse.com/chat";

    const state = {
        stream: null,
        facingMode: "environment",
        capturedImage: "",
        busy: false
    };


    /* ========================================================
       CREATE APRISHA VISION
       ======================================================== */

    function createVision() {

        if (document.getElementById("apAprishaVision")) {
            return;
        }

        const root =
            document.createElement("section");

        root.id =
            "apAprishaVision";

        root.setAttribute(
            "aria-hidden",
            "true"
        );

        root.innerHTML = `
            <div class="ap-vision-shell">

                <header class="ap-vision-header">

                    <div class="ap-vision-brand">

                        <div class="ap-vision-logo">
                            AP
                        </div>

                        <div>
                            <strong>Aprisha Vision</strong>
                            <span>See · Understand · Explain</span>
                        </div>

                    </div>

                    <button
                        id="apVisionClose"
                        type="button"
                        aria-label="Close Aprisha Vision"
                    >
                        ×
                    </button>

                </header>


                <main class="ap-vision-main">

                    <div class="ap-vision-camera">

                        <video
                            id="apVisionVideo"
                            autoplay
                            playsinline
                            muted
                        ></video>

                        <img
                            id="apVisionCapturePreview"
                            alt="Captured Aprisha Vision frame"
                            hidden
                        >

                        <canvas
                            id="apVisionCanvas"
                            hidden
                        ></canvas>


                        <div class="ap-vision-frame-guide">

                            <span class="tl"></span>
                            <span class="tr"></span>
                            <span class="bl"></span>
                            <span class="br"></span>

                        </div>


                        <div class="ap-vision-status">
                            <span class="ap-vision-status-dot"></span>

                            <span id="apVisionStatus">
                                Camera inactive
                            </span>
                        </div>


                        <div class="ap-vision-privacy">
                            Camera is active only while Vision is open
                        </div>

                    </div>


                    <section class="ap-vision-intelligence">

                        <div class="ap-vision-kicker">
                            APRISHA VISION
                        </div>

                        <h2>
                            What are you looking at?
                        </h2>

                        <p id="apVisionAnswer">
                            Point the camera at something, capture it,
                            then ask Aprisha about what you see.
                        </p>


                        <textarea
                            id="apVisionQuestion"
                            rows="2"
                            placeholder="Ask about this view..."
                        >What am I looking at? Describe it clearly and explain the most useful details.</textarea>


                        <div class="ap-vision-actions">

                            <button
                                id="apVisionSwitch"
                                type="button"
                            >
                                Switch camera
                            </button>

                            <button
                                id="apVisionRetake"
                                type="button"
                                hidden
                            >
                                Retake
                            </button>

                            <button
                                id="apVisionCapture"
                                class="ap-vision-primary"
                                type="button"
                            >
                                Capture
                            </button>

                            <button
                                id="apVisionAsk"
                                class="ap-vision-primary"
                                type="button"
                                hidden
                            >
                                Ask Aprisha
                            </button>

                        </div>

                    </section>

                </main>

            </div>
        `;

        document.body.appendChild(
            root
        );


        document
            .getElementById("apVisionClose")
            ?.addEventListener(
                "click",
                closeVision
            );


        document
            .getElementById("apVisionSwitch")
            ?.addEventListener(
                "click",
                switchCamera
            );


        document
            .getElementById("apVisionCapture")
            ?.addEventListener(
                "click",
                captureFrame
            );


        document
            .getElementById("apVisionRetake")
            ?.addEventListener(
                "click",
                retake
            );


        document
            .getElementById("apVisionAsk")
            ?.addEventListener(
                "click",
                askAprishaVision
            );


        installPresenceButton();
    }


    /* ========================================================
       ADD VISION TO APRISHA PRESENCE
       ======================================================== */

    function installPresenceButton() {

        if (
            document.getElementById(
                "apPresenceVision"
            )
        ) {
            return;
        }


        const suggestions =
            document.querySelector(
                ".ap-presence-suggestions"
            );


        if (!suggestions) {

            setTimeout(
                installPresenceButton,
                500
            );

            return;
        }


        const button =
            document.createElement(
                "button"
            );


        button.id =
            "apPresenceVision";

        button.type =
            "button";

        button.textContent =
            "Vision";


        button.addEventListener(
            "click",
            openVision
        );


        suggestions.appendChild(
            button
        );
    }


    /* ========================================================
       CAMERA
       ======================================================== */

    async function openVision() {

        const root =
            document.getElementById(
                "apAprishaVision"
            );


        root?.classList.add(
            "ap-visible"
        );


        root?.setAttribute(
            "aria-hidden",
            "false"
        );


        document.documentElement
            .classList.add(
                "ap-vision-open"
            );


        document.body
            .classList.add(
                "ap-vision-open"
            );


        await startCamera();
    }


    async function startCamera() {

        stopCamera();


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            setStatus(
                "Camera is not supported by this browser",
                true
            );

            return;
        }


        if (
            location.protocol !== "https:" &&
            !["localhost", "127.0.0.1"]
                .includes(location.hostname)
        ) {

            setStatus(
                "Secure HTTPS connection required",
                true
            );

            return;
        }


        setStatus(
            "Requesting camera access…"
        );


        try {

            state.stream =
                await navigator.mediaDevices
                    .getUserMedia({
                        video: {
                            facingMode: {
                                ideal:
                                    state.facingMode
                            },

                            width: {
                                ideal:
                                    1280
                            },

                            height: {
                                ideal:
                                    720
                            }
                        },

                        audio:
                            false
                    });


            const video =
                document.getElementById(
                    "apVisionVideo"
                );


            if (video) {

                video.srcObject =
                    state.stream;


                await video.play();
            }


            setStatus(
                "Vision ready"
            );


        } catch (error) {

            console.error(
                "Aprisha Vision camera:",
                error
            );


            if (
                error.name ===
                "NotAllowedError"
            ) {

                setStatus(
                    "Camera permission was not allowed",
                    true
                );

            }
            else {

                setStatus(
                    "Camera could not start",
                    true
                );
            }
        }
    }


    function stopCamera() {

        if (!state.stream) {
            return;
        }


        state.stream
            .getTracks()
            .forEach(
                track => track.stop()
            );


        state.stream =
            null;


        const video =
            document.getElementById(
                "apVisionVideo"
            );


        if (video) {

            video.srcObject =
                null;
        }
    }


    async function switchCamera() {

        state.facingMode =
            state.facingMode ===
            "environment"
                ? "user"
                : "environment";


        state.capturedImage =
            "";


        showCameraView();


        await startCamera();
    }


    /* ========================================================
       CAPTURE
       ======================================================== */

    function captureFrame() {

        const video =
            document.getElementById(
                "apVisionVideo"
            );

        const canvas =
            document.getElementById(
                "apVisionCanvas"
            );

        const preview =
            document.getElementById(
                "apVisionCapturePreview"
            );


        if (
            !video ||
            !canvas ||
            !preview ||
            !video.videoWidth
        ) {

            setStatus(
                "Camera frame is not ready",
                true
            );

            return;
        }


        /*
         * Keep uploads efficient for mobile.
         */

        const sourceWidth =
            video.videoWidth;

        const sourceHeight =
            video.videoHeight;

        const maxWidth =
            1280;

        const scale =
            Math.min(
                1,
                maxWidth / sourceWidth
            );


        canvas.width =
            Math.round(
                sourceWidth *
                scale
            );


        canvas.height =
            Math.round(
                sourceHeight *
                scale
            );


        const context =
            canvas.getContext(
                "2d",
                {
                    alpha:
                        false
                }
            );


        if (!context) {
            return;
        }


        if (
            state.facingMode ===
            "user"
        ) {

            context.translate(
                canvas.width,
                0
            );

            context.scale(
                -1,
                1
            );
        }


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        state.capturedImage =
            canvas.toDataURL(
                "image/jpeg",
                0.82
            );


        preview.src =
            state.capturedImage;


        preview.hidden =
            false;


        video.hidden =
            true;


        document
            .getElementById(
                "apVisionCapture"
            )
            .hidden =
            true;


        document
            .getElementById(
                "apVisionAsk"
            )
            .hidden =
            false;


        document
            .getElementById(
                "apVisionRetake"
            )
            .hidden =
            false;


        setStatus(
            "Frame captured"
        );


        /*
         * Stop camera immediately after capture.
         * No unnecessary background camera usage.
         */

        stopCamera();
    }


    async function retake() {

        state.capturedImage =
            "";


        showCameraView();


        await startCamera();
    }


    function showCameraView() {

        const preview =
            document.getElementById(
                "apVisionCapturePreview"
            );

        const video =
            document.getElementById(
                "apVisionVideo"
            );


        if (preview) {

            preview.hidden =
                true;

            preview.removeAttribute(
                "src"
            );
        }


        if (video) {

            video.hidden =
                false;
        }


        document
            .getElementById(
                "apVisionCapture"
            )
            .hidden =
            false;


        document
            .getElementById(
                "apVisionAsk"
            )
            .hidden =
            true;


        document
            .getElementById(
                "apVisionRetake"
            )
            .hidden =
            true;
    }


    /* ========================================================
       VISION INTELLIGENCE
       ======================================================== */

    async function askAprishaVision() {

        if (
            !state.capturedImage ||
            state.busy
        ) {
            return;
        }


        const questionInput =
            document.getElementById(
                "apVisionQuestion"
            );


        const answer =
            document.getElementById(
                "apVisionAnswer"
            );


        const question =
            questionInput?.value
                ?.trim()
            ||
            "Describe what I am looking at.";


        /*
         * Vision safety:
         * understand the scene/object,
         * but don't try to identify real people.
         */

        const prompt = `
You are Aprisha Vision inside AP Synapse.

Analyze the image supplied by the user.

User question:
${question}

Give a clear, practical answer.
Describe visible objects, text, scene, layout or relevant details.
If a person is visible, describe only non-sensitive visible details needed
for the user's question. Do not attempt to identify who the person is.
If something cannot be determined reliably from the image, say so.
`.trim();


        state.busy =
            true;


        setStatus(
            "Aprisha is seeing…"
        );


        if (answer) {

            answer.textContent =
                "Understanding the captured view…";
        }


        const askButton =
            document.getElementById(
                "apVisionAsk"
            );


        if (askButton) {

            askButton.disabled =
                true;

            askButton.textContent =
                "Seeing…";
        }


        try {

            const sessionId =
                localStorage.getItem(
                    "apAprishaSessionId"
                )
                ||
                (
                    "aprisha-vision-" +
                    crypto.randomUUID()
                );


            const response =
                await fetch(
                    API,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "x-session-id":
                                sessionId
                        },

                        body:
                            JSON.stringify({
                                message:
                                    prompt,

                                documentImage:
                                    state.capturedImage,

                                source:
                                    "aprisha-vision"
                            })
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Vision request failed: ${response.status}`
                );
            }


            const result =
                await readResponse(
                    response
                );


            const finalText =
                cleanText(result)
                ||
                "I couldn't determine enough from this view.";


            if (answer) {

                answer.textContent =
                    finalText;
            }


            setStatus(
                "Vision understood"
            );


            await speak(
                finalText
            );


        } catch (error) {

            console.error(
                "Aprisha Vision:",
                error
            );


            if (answer) {

                answer.textContent =
                    "Aprisha couldn't analyze this view right now. Please try again.";
            }


            setStatus(
                "Vision request failed",
                true
            );


        } finally {

            state.busy =
                false;


            if (askButton) {

                askButton.disabled =
                    false;

                askButton.textContent =
                    "Ask Aprisha";
            }
        }
    }


    /* ========================================================
       STREAM RESPONSE
       ======================================================== */

    async function readResponse(
        response
    ) {

        if (!response.body) {

            return await response.text();
        }


        const reader =
            response.body.getReader();

        const decoder =
            new TextDecoder();


        let raw =
            "";


        while (true) {

            const {
                value,
                done
            } =
                await reader.read();


            if (done) {
                break;
            }


            raw +=
                decoder.decode(
                    value,
                    {
                        stream:
                            true
                    }
                );
        }


        raw +=
            decoder.decode();


        return parseResponse(
            raw
        );
    }


    function parseResponse(
        raw
    ) {

        const text =
            String(raw || "")
                .trim();


        if (!text) {
            return "";
        }


        try {

            const json =
                JSON.parse(
                    text
                );


            return (
                json.reply ||
                json.response ||
                json.answer ||
                json.content ||
                json.text ||
                json.message?.content ||
                ""
            );

        } catch {}


        let output =
            "";


        for (
            let line of
            text.split(/\r?\n/)
        ) {

            line =
                line.trim();


            if (!line) {
                continue;
            }


            if (
                line.startsWith(
                    "data:"
                )
            ) {

                line =
                    line.slice(5)
                        .trim();
            }


            if (
                line ===
                "[DONE]"
            ) {
                continue;
            }


            try {

                const json =
                    JSON.parse(line);


                output +=
                    json.delta?.content ||
                    json.content ||
                    json.text ||
                    json.response ||
                    json.reply ||
                    "";

            } catch {

                output +=
                    (
                        output
                            ? "\n"
                            : ""
                    )
                    +
                    line;
            }
        }


        return output ||
            text;
    }


    function cleanText(
        text
    ) {

        return String(
            text || ""
        )
            .replace(
                /```[\s\S]*?```/g,
                " Code example available on screen. "
            )
            .replace(
                /\[([^\]]+)\]\([^)]+\)/g,
                "$1"
            )
            .replace(
                /[#*_`>]/g,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }


    /* ========================================================
       APRISHA SPEECH
       ======================================================== */

    function speak(
        text
    ) {

        return new Promise(
            resolve => {

                if (
                    !("speechSynthesis" in window)
                ) {

                    resolve();
                    return;
                }


                speechSynthesis.cancel();


                const utterance =
                    new SpeechSynthesisUtterance(
                        text
                    );


                utterance.rate =
                    1.02;


                utterance.pitch =
                    1;


                utterance.lang =
                    navigator.language ||
                    "en-IN";


                utterance.onend =
                    resolve;


                utterance.onerror =
                    resolve;


                speechSynthesis.speak(
                    utterance
                );
            }
        );
    }


    /* ========================================================
       STATUS
       ======================================================== */

    function setStatus(
        message,
        error = false
    ) {

        const status =
            document.getElementById(
                "apVisionStatus"
            );


        const dot =
            document.querySelector(
                ".ap-vision-status-dot"
            );


        if (status) {

            status.textContent =
                message;
        }


        if (dot) {

            dot.classList.toggle(
                "ap-error",
                error
            );
        }
    }


    /* ========================================================
       CLOSE
       ======================================================== */

    function closeVision() {

        stopCamera();


        state.capturedImage =
            "";


        state.busy =
            false;


        showCameraView();


        document
            .getElementById(
                "apAprishaVision"
            )
            ?.classList.remove(
                "ap-visible"
            );


        document
            .getElementById(
                "apAprishaVision"
            )
            ?.setAttribute(
                "aria-hidden",
                "true"
            );


        document.documentElement
            .classList.remove(
                "ap-vision-open"
            );


        document.body
            .classList.remove(
                "ap-vision-open"
            );
    }


    /* ========================================================
       PUBLIC API
       ======================================================== */

    window.APAprishaVision = {
        open:
            openVision,

        close:
            closeVision
    };


    function boot() {

        createVision();


        console.log(
            "✅ AP SYNAPSE — APRISHA VISION READY"
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
