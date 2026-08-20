(() => {
    "use strict";

    const state = {
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
        state.page = document.getElementById("canvasPage");
        state.canvas = document.getElementById("apCanvas");

        return !!(state.page && state.canvas);
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
            alpha: true
        });

        state.initializedCanvas = state.canvas;

        return state.ctx;
    }

    function resizeCanvas() {

        if (!findElements()) return;

        const canvas = state.canvas;
        const shell = canvas.closest(".whiteboard-shell");

        if (!shell) return;

        const ctx = getContext();

        if (!ctx) return;

        /*
         * IMPORTANT:
         * Never measure the canvas itself to determine its height.
         *
         * The canvas can temporarily be 0px/2px high while flex layout
         * is resolving. Measuring that value and writing it back creates
         * the permanent 2px collapse.
         */

        const shellRect = shell.getBoundingClientRect();

        const toolbar =
            shell.querySelector(".whiteboard-toolbar");

        const toolbarRect =
            toolbar?.getBoundingClientRect();

        const shellWidth =
            Math.max(1, shellRect.width);

        const toolbarHeight =
            toolbarRect?.height || 64;

        const availableHeight =
            Math.max(
                320,
                shellRect.height - toolbarHeight
            );

        const cssWidth =
            Math.max(1, shellWidth - 2);

        /*
         * Use the actual available layout height.
         * Never write the canvas's previous measured height.
         */

        const cssHeight =
            Math.max(320, availableHeight);

        const dpr = Math.min(
            Math.max(window.devicePixelRatio || 1, 1),
            2
        );

        const oldWidth = canvas.width;
        const oldHeight = canvas.height;

        let oldCanvas = null;

        if (oldWidth > 0 && oldHeight > 0) {

            oldCanvas =
                document.createElement("canvas");

            oldCanvas.width = oldWidth;
            oldCanvas.height = oldHeight;

            const oldCtx =
                oldCanvas.getContext("2d");

            if (oldCtx) {
                oldCtx.drawImage(
                    canvas,
                    0,
                    0
                );
            }
        }

        /*
         * CSS controls layout.
         * Do NOT write canvas.style.height from canvas.getBoundingClientRect().
         */

        canvas.style.width =
            `${cssWidth}px`;

        canvas.style.height =
            `${cssHeight}px`;

        canvas.style.minHeight =
            `${cssHeight}px`;

        canvas.style.maxHeight =
            "none";

        canvas.width =
            Math.max(
                1,
                Math.round(cssWidth * dpr)
            );

        canvas.height =
            Math.max(
                1,
                Math.round(cssHeight * dpr)
            );

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

        ctx.lineCap =
            "round";

        ctx.lineJoin =
            "round";

        ctx.lineWidth =
            4;

        ctx.strokeStyle =
            "#111";

        ctx.globalCompositeOperation =
            "source-over";

        if (oldCanvas) {

            ctx.drawImage(
                oldCanvas,
                0,
                0,
                oldCanvas.width,
                oldCanvas.height,
                0,
                0,
                cssWidth,
                cssHeight
            );

        }

        console.log(
            "AP WHITEBOARD RESIZED:",
            {
                width: cssWidth,
                height: cssHeight,
                dpr
            }
        );
    }

    function getPoint(e) {
        const rect =
            state.canvas.getBoundingClientRect();

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function startDrawing(e) {
        if (!state.canvas) return;

        if (
            e.button !== undefined &&
            e.button !== 0
        ) {
            return;
        }

        const rect =
            state.canvas.getBoundingClientRect();

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
            state.canvas.setPointerCapture(
                e.pointerId
            );
        } catch {}

        e.preventDefault();
    }

    function draw(e) {
        if (!state.drawing) return;

        const ctx = state.ctx;

        if (!ctx) return;

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
        state.drawing = false;

        if (state.ctx) {
            state.ctx.globalCompositeOperation =
                "source-over";
        }

        if (
            state.canvas &&
            e &&
            e.pointerId !== undefined
        ) {
            try {
                if (
                    state.canvas.hasPointerCapture(
                        e.pointerId
                    )
                ) {
                    state.canvas.releasePointerCapture(
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
            canvas.dataset.apWhiteboardEvents ===
            "true"
        ) {
            return true;
        }

        getContext();

        canvas.style.touchAction =
            "none";

        canvas.style.pointerEvents =
            "auto";

        canvas.style.cursor =
            "crosshair";

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
            stopDrawing
        );

        canvas.addEventListener(
            "pointercancel",
            stopDrawing
        );

        canvas.addEventListener(
            "pointerleave",
            stopDrawing
        );

        canvas.dataset.apWhiteboardEvents =
            "true";

        return true;
    }

    function clearCanvas() {
        if (!findElements()) return;

        const ctx = getContext();

        if (!ctx) return;

        ctx.clearRect(
            0,
            0,
            state.canvas.width,
            state.canvas.height
        );
    }

    function attachControls() {
        const pen =
            document.getElementById("canvasPen");

        const erase =
            document.getElementById("canvasErase");

        const clear =
            document.getElementById("canvasClear");

        if (
            pen &&
            pen.dataset.apBound !== "true"
        ) {
            pen.addEventListener(
                "click",
                () => {
                    state.erasing = false;

                    pen.classList.add("active");
                    erase?.classList.remove(
                        "active"
                    );
                }
            );

            pen.dataset.apBound = "true";
        }

        if (
            erase &&
            erase.dataset.apBound !== "true"
        ) {
            erase.addEventListener(
                "click",
                () => {
                    state.erasing = true;

                    erase.classList.add("active");
                    pen?.classList.remove(
                        "active"
                    );
                }
            );

            erase.dataset.apBound = "true";
        }

        if (
            clear &&
            clear.dataset.apBound !== "true"
        ) {
            clear.addEventListener(
                "click",
                clearCanvas
            );

            clear.dataset.apBound = "true";
        }

        pen?.classList.add("active");
    }

    function prepareWhiteboard() {
        if (!findElements()) return false;

        /*
         * Force the shell to have actual drawing space.
         */

        const shell =
            state.canvas.closest(
                ".whiteboard-shell"
            );

        if (shell) {
            shell.style.minHeight =
                "520px";

            shell.style.height =
                "520px";

            shell.style.display =
                "flex";

            shell.style.flexDirection =
                "column";
        }

        attachCanvasEvents();
        attachControls();

        return true;
    }

    function openWhiteboard() {
        if (!findElements()) return;

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
            prepareWhiteboard();
            resizeCanvas();
        });
    }

    function initialize() {
        prepareWhiteboard();

        window.addEventListener(
            "resize",
            resizeCanvas,
            { passive: true }
        );

        window.APWhiteboard = {
            open: openWhiteboard,
            resize: resizeCanvas,
            clear: clearCanvas,
            init: prepareWhiteboard
        };

        /*
         * Initial sizing after layout.
         */

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                resizeCanvas();
            });
        });

        console.log(
            "AP SYNAPSE WHITEBOARD ENGINE READY"
        );
    }

    if (
        document.readyState ===
        "loading"
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


/* =========================================================
   AP SYNAPSE — WHITEBOARD HARD LAYOUT LOCK
   FINAL: BYPASS PARENT FLEX COLLAPSE
========================================================= */

(() => {
    const styleId = "ap-synapse-whiteboard-hard-lock";

    function installWhiteboardLock() {

        if (!document.getElementById(styleId)) {

            const style = document.createElement("style");
            style.id = styleId;

            style.textContent = `
                #canvasPage {
                    position: fixed !important;
                    inset: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    min-width: 0 !important;
                    min-height: 0 !important;
                    max-width: none !important;
                    max-height: none !important;
                    box-sizing: border-box !important;
                    overflow: auto !important;
                }

                #canvasPage .whiteboard-shell {
                    display: flex !important;
                    flex-direction: column !important;
                    width: calc(100vw - 40px) !important;
                    height: 520px !important;
                    min-height: 520px !important;
                    max-height: 520px !important;
                    max-width: none !important;
                    flex: none !important;
                    box-sizing: border-box !important;
                    overflow: hidden !important;
                    margin-left: 20px !important;
                    margin-right: 20px !important;
                }

                #canvasPage .whiteboard-toolbar {
                    display: flex !important;
                    flex: none !important;
                    width: 100% !important;
                    height: 64px !important;
                    min-height: 64px !important;
                    max-height: 64px !important;
                    box-sizing: border-box !important;
                }

                #canvasPage #apCanvas {
                    display: block !important;
                    position: relative !important;
                    width: 100% !important;
                    height: 440px !important;
                    min-height: 440px !important;
                    max-height: 440px !important;
                    flex: none !important;
                    box-sizing: border-box !important;
                    pointer-events: auto !important;
                    touch-action: none !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
            `;

            document.head.appendChild(style);
        }

        const page = document.getElementById("canvasPage");
        const shell = page?.querySelector(".whiteboard-shell");
        const canvas = document.getElementById("apCanvas");

        if (!page || !shell || !canvas) return;

        page.style.setProperty("position", "fixed", "important");
        page.style.setProperty("inset", "0", "important");
        page.style.setProperty("width", "100vw", "important");
        page.style.setProperty("height", "100vh", "important");

        shell.style.setProperty("display", "flex", "important");
        shell.style.setProperty("flex", "none", "important");
        shell.style.setProperty("height", "520px", "important");
        shell.style.setProperty("min-height", "520px", "important");

        canvas.style.setProperty("display", "block", "important");
        canvas.style.setProperty("flex", "none", "important");
        canvas.style.setProperty("width", "100%", "important");
        canvas.style.setProperty("height", "440px", "important");
        canvas.style.setProperty("min-height", "440px", "important");
        canvas.style.setProperty("max-height", "440px", "important");
    }

    installWhiteboardLock();

    new MutationObserver(installWhiteboardLock)
        .observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["style", "class"]
        });

    window.addEventListener("resize", installWhiteboardLock);

})();
