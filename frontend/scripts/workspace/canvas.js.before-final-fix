(() => {
    "use strict";

    let state = {
        drawing: false,
        erasing: false,
        lastX: 0,
        lastY: 0,
        canvas: null,
        page: null,
        ctx: null,
        initializedCanvas: null
    };

    function findElements() {
        const page = document.getElementById("canvasPage");
        const canvas = document.getElementById("apCanvas");

        if (!page || !canvas) {
            return false;
        }

        state.page = page;
        state.canvas = canvas;

        return true;
    }

    function getContext() {
        if (!state.canvas) return null;

        if (
            state.ctx &&
            state.initializedCanvas === state.canvas
        ) {
            return state.ctx;
        }

        state.ctx = state.canvas.getContext("2d", {
            alpha: true,
            desynchronized: true
        });

        state.initializedCanvas = state.canvas;

        return state.ctx;
    }

    function resizeCanvas() {
        if (!findElements()) return;

        const canvas = state.canvas;
        const ctx = getContext();

        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();

        if (rect.width <= 0 || rect.height <= 0) {
            return;
        }

        const dpr = Math.min(
            Math.max(window.devicePixelRatio || 1, 1),
            2
        );

        const oldWidth = canvas.width;
        const oldHeight = canvas.height;

        let oldCanvas = null;

        if (oldWidth > 0 && oldHeight > 0) {
            oldCanvas = document.createElement("canvas");
            oldCanvas.width = oldWidth;
            oldCanvas.height = oldHeight;

            const oldCtx = oldCanvas.getContext("2d");

            if (oldCtx) {
                oldCtx.drawImage(canvas, 0, 0);
            }
        }

        canvas.width = Math.max(
            1,
            Math.round(rect.width * dpr)
        );

        canvas.height = Math.max(
            1,
            Math.round(rect.height * dpr)
        );

        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#111";
        ctx.globalCompositeOperation = "source-over";

        if (oldCanvas) {
            ctx.drawImage(
                oldCanvas,
                0,
                0,
                oldCanvas.width,
                oldCanvas.height,
                0,
                0,
                rect.width,
                rect.height
            );
        }
    }

    function getPoint(e) {
        const canvas = state.canvas;

        if (!canvas) {
            return {
                x: 0,
                y: 0
            };
        }

        const rect = canvas.getBoundingClientRect();

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function startDrawing(e) {
        const canvas = state.canvas;

        if (!canvas) return;

        if (
            e.button !== undefined &&
            e.button !== 0
        ) {
            return;
        }

        const rect = canvas.getBoundingClientRect();

        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {
            return;
        }

        state.drawing = true;

        const point = getPoint(e);

        state.lastX = point.x;
        state.lastY = point.y;

        try {
            canvas.setPointerCapture(e.pointerId);
        } catch {}

        e.preventDefault();
    }

    function draw(e) {
        if (!state.drawing) return;

        const canvas = state.canvas;
        const ctx = state.ctx;

        if (!canvas || !ctx) return;

        const point = getPoint(e);

        ctx.beginPath();

        ctx.moveTo(
            state.lastX,
            state.lastY
        );

        ctx.lineTo(
            point.x,
            point.y
        );

        if (state.erasing) {

            ctx.globalCompositeOperation =
                "destination-out";

            ctx.lineWidth = 28;

        } else {

            ctx.globalCompositeOperation =
                "source-over";

            ctx.strokeStyle = "#111";
            ctx.lineWidth = 4;
        }

        ctx.stroke();

        state.lastX = point.x;
        state.lastY = point.y;

        e.preventDefault();
    }

    function stopDrawing(e) {
        if (!state.drawing) return;

        state.drawing = false;

        const canvas = state.canvas;
        const ctx = state.ctx;

        if (ctx) {
            ctx.globalCompositeOperation =
                "source-over";
        }

        if (
            canvas &&
            e &&
            e.pointerId !== undefined
        ) {
            try {
                if (
                    canvas.hasPointerCapture(e.pointerId)
                ) {
                    canvas.releasePointerCapture(
                        e.pointerId
                    );
                }
            } catch {}
        }
    }

    function attachCanvasEvents() {
        if (!findElements()) return false;

        const canvas = state.canvas;

        if (
            canvas.dataset.apWhiteboardEvents === "true"
        ) {
            return true;
        }

        getContext();

        canvas.style.touchAction = "none";
        canvas.style.cursor = "crosshair";

        canvas.addEventListener(
            "pointerdown",
            startDrawing,
            { passive: false }
        );

        canvas.addEventListener(
            "pointermove",
            draw,
            { passive: false }
        );

        canvas.addEventListener(
            "pointerup",
            stopDrawing,
            { passive: true }
        );

        canvas.addEventListener(
            "pointercancel",
            stopDrawing,
            { passive: true }
        );

        canvas.addEventListener(
            "pointerleave",
            stopDrawing,
            { passive: true }
        );

        canvas.dataset.apWhiteboardEvents = "true";

        console.log(
            "⚡ AP WHITEBOARD — POINTER ENGINE ATTACHED"
        );

        return true;
    }

    function attachControls() {
        const pen = document.getElementById("canvasPen");
        const erase = document.getElementById("canvasErase");
        const clear = document.getElementById("canvasClear");

        if (pen && pen.dataset.apBound !== "true") {

            pen.addEventListener("click", () => {

                state.erasing = false;

                if (state.ctx) {
                    state.ctx.globalCompositeOperation =
                        "source-over";
                }

                pen.classList.add("active");
                erase?.classList.remove("active");

                console.log(
                    "✎ AP WHITEBOARD — PEN"
                );
            });

            pen.dataset.apBound = "true";
        }

        if (erase && erase.dataset.apBound !== "true") {

            erase.addEventListener("click", () => {

                state.erasing = true;

                erase.classList.add("active");
                pen?.classList.remove("active");

                console.log(
                    "⌫ AP WHITEBOARD — ERASER"
                );
            });

            erase.dataset.apBound = "true";
        }

        if (clear && clear.dataset.apBound !== "true") {

            clear.addEventListener("click", () => {

                clearCanvas();

                console.log(
                    "🧹 AP WHITEBOARD — CLEARED"
                );
            });

            clear.dataset.apBound = "true";
        }

        if (pen) {
            pen.classList.add("active");
        }
    }

    function clearCanvas() {
        if (!findElements()) return;

        const canvas = state.canvas;
        const ctx = getContext();

        if (!ctx) return;

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }

    function prepareWhiteboard() {
        if (!findElements()) {
            return false;
        }

        attachCanvasEvents();
        attachControls();

        return true;
    }

    function openWhiteboard() {

        if (!findElements()) {
            console.warn(
                "⚠️ AP Whiteboard: page/canvas not ready yet."
            );
            return;
        }

        const page = state.page;

        page.style.setProperty(
            "display",
            "block",
            "important"
        );

        page.style.setProperty(
            "visibility",
            "visible",
            "important"
        );

        page.style.setProperty(
            "opacity",
            "1",
            "important"
        );

        page.style.setProperty(
            "pointer-events",
            "auto",
            "important"
        );

        page.setAttribute(
            "aria-hidden",
            "false"
        );

        page.classList.add("active");

        document.body.classList.add(
            "whiteboard-active"
        );

        requestAnimationFrame(() => {

            requestAnimationFrame(() => {

                prepareWhiteboard();
                resizeCanvas();

                console.log(
                    "🎨 AP WHITEBOARD — OPENED",
                    {
                        width:
                            state.canvas?.getBoundingClientRect()
                                .width,

                        height:
                            state.canvas?.getBoundingClientRect()
                                .height
                    }
                );
            });
        });
    }

    function initialize() {

        prepareWhiteboard();

        window.addEventListener(
            "resize",
            () => {
                resizeCanvas();
            },
            { passive: true }
        );

        /*
         * The Canvas page can be dynamically rendered
         * after this script loads. Keep watching for it.
         */
        const observer =
            new MutationObserver(() => {

                if (
                    findElements()
                ) {
                    prepareWhiteboard();
                }

            });

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

        /*
         * Public API
         */
        window.APWhiteboard = {

            open: openWhiteboard,

            resize: resizeCanvas,

            clear: clearCanvas,

            init: prepareWhiteboard
        };

        console.log(
            "⚡ AP SYNAPSE WHITEBOARD — ENGINE READY"
        );
    }

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );

    } else {

        initialize();
    }

})();