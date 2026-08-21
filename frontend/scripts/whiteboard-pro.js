(() => {
    "use strict";

    function initAPWhiteboardPro() {

        const canvas = document.getElementById("apCanvas");

        if (!canvas) {
            console.warn("AP Whiteboard Pro: canvas not found.");
            return;
        }

        if (canvas.dataset.apWhiteboardPro === "true") {
            return;
        }

        canvas.dataset.apWhiteboardPro = "true";

        const shell =
            canvas.closest(".whiteboard-shell") ||
            canvas.parentElement;

        if (!shell) {
            console.warn("AP Whiteboard Pro: shell not found.");
            return;
        }

        const ctx = canvas.getContext("2d", {
            willReadFrequently: true
        });

        if (!ctx) return;

        if (getComputedStyle(shell).position === "static") {
            shell.style.position = "relative";
        }


        // =====================================================
        // Hide legacy controls
        // =====================================================

        [
            "canvasPen",
            "canvasErase",
            "canvasClear"
        ].forEach(id => {

            const oldControl = document.getElementById(id);

            if (oldControl) {
                oldControl.style.display = "none";
            }

        });


        // =====================================================
        // Icons
        // =====================================================

        const icons = {

            drag: `
                <svg viewBox="0 0 24 24">
                    <circle cx="8" cy="6" r="1"></circle>
                    <circle cx="16" cy="6" r="1"></circle>
                    <circle cx="8" cy="12" r="1"></circle>
                    <circle cx="16" cy="12" r="1"></circle>
                    <circle cx="8" cy="18" r="1"></circle>
                    <circle cx="16" cy="18" r="1"></circle>
                </svg>
            `,

            pen: `
                <svg viewBox="0 0 24 24">
                    <path d="M4 20l4.2-1 10.6-10.6-3.2-3.2L5 15.8 4 20z"></path>
                    <path d="M13.8 7l3.2 3.2"></path>
                </svg>
            `,

            highlighter: `
                <svg viewBox="0 0 24 24">
                    <path d="M7 16l8.8-8.8 3 3L10 19H7v-3z"></path>
                    <path d="M5 21h14"></path>
                </svg>
            `,

            eraser: `
                <svg viewBox="0 0 24 24">
                    <path d="M7.5 18.5l-3-3 8-8 5 5-6 6h-4z"></path>
                    <path d="M11.5 18.5H20"></path>
                </svg>
            `,

            line: `
                <svg viewBox="0 0 24 24">
                    <path d="M5 19L19 5"></path>
                </svg>
            `,

            rectangle: `
                <svg viewBox="0 0 24 24">
                    <rect x="5" y="6" width="14" height="12" rx="1"></rect>
                </svg>
            `,

            circle: `
                <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="7"></circle>
                </svg>
            `,

            text: `
                <svg viewBox="0 0 24 24">
                    <path d="M6 6h12"></path>
                    <path d="M12 6v12"></path>
                    <path d="M9 18h6"></path>
                </svg>
            `,

            undo: `
                <svg viewBox="0 0 24 24">
                    <path d="M9 8L5 12l4 4"></path>
                    <path d="M5 12h8a6 6 0 016 6"></path>
                </svg>
            `,

            redo: `
                <svg viewBox="0 0 24 24">
                    <path d="M15 8l4 4-4 4"></path>
                    <path d="M19 12h-8a6 6 0 00-6 6"></path>
                </svg>
            `,

            trash: `
                <svg viewBox="0 0 24 24">
                    <path d="M5 7h14"></path>
                    <path d="M9 7V4h6v3"></path>
                    <path d="M7 7l1 13h8l1-13"></path>
                </svg>
            `,

            share: `
                <svg viewBox="0 0 24 24">
                    <path d="M12 16V4"></path>
                    <path d="M8 8l4-4 4 4"></path>
                    <path d="M5 13v6h14v-6"></path>
                </svg>
            `
        };


        // =====================================================
        // Toolbar
        // =====================================================

        const toolbar = document.createElement("div");

        toolbar.className = "ap-wb-pro-toolbar";

        toolbar.innerHTML = `

            <div class="ap-wb-group">

                <button
                    class="ap-wb-btn ap-wb-drag"
                    type="button"
                    title="Move toolbar"
                    aria-label="Move toolbar"
                >
                    ${icons.drag}
                </button>

            </div>


            <div class="ap-wb-group">

                <button class="ap-wb-btn active"
                    data-tool="pen"
                    title="Pen (P)">
                    ${icons.pen}
                </button>

                <button class="ap-wb-btn"
                    data-tool="highlighter"
                    title="Highlighter (H)">
                    ${icons.highlighter}
                </button>

                <button class="ap-wb-btn"
                    data-tool="eraser"
                    title="Eraser (E)">
                    ${icons.eraser}
                </button>

                <button class="ap-wb-btn"
                    data-tool="line"
                    title="Line (L)">
                    ${icons.line}
                </button>

                <button class="ap-wb-btn"
                    data-tool="rectangle"
                    title="Rectangle (R)">
                    ${icons.rectangle}
                </button>

                <button class="ap-wb-btn"
                    data-tool="circle"
                    title="Circle (O)">
                    ${icons.circle}
                </button>

                <button class="ap-wb-btn"
                    data-tool="text"
                    title="Text (T)">
                    ${icons.text}
                </button>

            </div>


            <div class="ap-wb-group ap-wb-colors">

                ${[
                    "#101216",
                    "#ffffff",
                    "#e7b75c",
                    "#ef4444",
                    "#f97316",
                    "#eab308",
                    "#22c55e",
                    "#06b6d4",
                    "#3b82f6",
                    "#8b5cf6",
                    "#ec4899"
                ].map(color => `

                    <button
                        type="button"
                        class="ap-wb-color ${color === "#e7b75c" ? "active" : ""}"
                        data-color="${color}"
                        style="--wb-color:${color}"
                        title="${color}">
                    </button>

                `).join("")}

                <label
                    class="ap-wb-custom-color"
                    title="Custom colour">

                    <input
                        id="apWbCustomColor"
                        type="color"
                        value="#e7b75c">

                </label>

            </div>


            <div class="ap-wb-group">

                <div
                    class="ap-wb-size-wrap"
                    title="Brush size">

                    <span class="ap-wb-size-dot"></span>

                    <input
                        id="apWbSize"
                        class="ap-wb-size"
                        type="range"
                        min="1"
                        max="32"
                        value="4">

                </div>

            </div>


            <div class="ap-wb-group">

                <button
                    id="apWbUndo"
                    class="ap-wb-btn"
                    type="button"
                    title="Undo (Ctrl+Z)">
                    ${icons.undo}
                </button>

                <button
                    id="apWbRedo"
                    class="ap-wb-btn"
                    type="button"
                    title="Redo (Ctrl+Y)">
                    ${icons.redo}
                </button>

                <button
                    id="apWbClear"
                    class="ap-wb-btn"
                    type="button"
                    title="Clear board">
                    ${icons.trash}
                </button>

            </div>


            <div class="ap-wb-group">

                <button
                    id="apWbShare"
                    class="ap-wb-btn ap-wb-share"
                    type="button"
                    title="Share whiteboard">

                    ${icons.share}

                    <span>Share</span>

                </button>

            </div>
        `;

        shell.appendChild(toolbar);

        // =====================================================
// AP SYNAPSE — TOOLBAR GROUP IDENTITIES
// Used only for professional responsive layout
// =====================================================

const apWbGroups =
    toolbar.querySelectorAll(
        ":scope > .ap-wb-group"
    );

apWbGroups[0]?.classList.add(
    "ap-wb-drag-group"
);

apWbGroups[1]?.classList.add(
    "ap-wb-tools-group"
);

apWbGroups[2]?.classList.add(
    "ap-wb-colors-group"
);

apWbGroups[3]?.classList.add(
    "ap-wb-size-group"
);

apWbGroups[4]?.classList.add(
    "ap-wb-history-group"
);

apWbGroups[5]?.classList.add(
    "ap-wb-share-group"
);

// =====================================================
// AP SYNAPSE — MOBILE WHITEBOARD TOOL DOCK TOGGLE
// =====================================================

const wbDockToggle =
    document.createElement("button");

wbDockToggle.type = "button";

wbDockToggle.className =
    "ap-wb-collapse-toggle";

wbDockToggle.setAttribute(
    "aria-label",
    "Hide whiteboard tools"
);

wbDockToggle.setAttribute(
    "aria-expanded",
    "true"
);


const COLLAPSE_ICON = `
    <svg viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6"></path>
    </svg>
`;

const EXPAND_ICON = `
    <svg viewBox="0 0 24 24">
        <path d="M6 15l6-6 6 6"></path>
    </svg>
`;


wbDockToggle.innerHTML =
    COLLAPSE_ICON;


function setWhiteboardDockCollapsed(
    collapsed
) {

    toolbar.classList.toggle(
        "ap-wb-collapsed",
        collapsed
    );


    wbDockToggle.innerHTML =
        collapsed
            ? EXPAND_ICON
            : COLLAPSE_ICON;


    wbDockToggle.setAttribute(
        "aria-expanded",
        String(!collapsed)
    );


    wbDockToggle.setAttribute(
        "aria-label",
        collapsed
            ? "Show whiteboard tools"
            : "Hide whiteboard tools"
    );


    wbDockToggle.title =
        collapsed
            ? "Show tools"
            : "Hide tools";
}


wbDockToggle.addEventListener(
    "click",
    event => {

        event.preventDefault();

        event.stopPropagation();

        const collapsed =
            !toolbar.classList.contains(
                "ap-wb-collapsed"
            );

        setWhiteboardDockCollapsed(
            collapsed
        );
    }
);


toolbar.appendChild(
    wbDockToggle
);


        // =====================================================
        // Toast
        // =====================================================

        const toast = document.createElement("div");

        toast.className = "ap-wb-toast";

        shell.appendChild(toast);

        let toastTimer = null;

        function notify(message) {

            toast.textContent = message;

            toast.classList.add("visible");

            clearTimeout(toastTimer);

            toastTimer = setTimeout(() => {

                toast.classList.remove("visible");

            }, 2400);
        }


        // =====================================================
        // State
        // =====================================================

        const state = {

            tool: "pen",

            color: "#e7b75c",

            size: 4,

            drawing: false,

            startX: 0,
            startY: 0,

            lastX: 0,
            lastY: 0,

            previewBase: null,

            history: [],

            historyIndex: -1,

            restoring: false
        };


        // =====================================================
        // Canvas helpers
        // =====================================================

        function resetContext() {

            ctx.setTransform(1, 0, 0, 1, 0, 0);

            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = "source-over";
        }


        function getCanvasScale() {

            const rect = canvas.getBoundingClientRect();

            return {

                x: canvas.width / rect.width,

                y: canvas.height / rect.height
            };
        }


        function getPoint(event) {

            const rect = canvas.getBoundingClientRect();

            return {

                x:
                    (event.clientX - rect.left) *
                    (canvas.width / rect.width),

                y:
                    (event.clientY - rect.top) *
                    (canvas.height / rect.height)
            };
        }


        function getStrokeWidth(event = null) {

            const scale = getCanvasScale();

            let width =
                state.size *
                ((scale.x + scale.y) / 2);

            if (
                event &&
                event.pointerType === "pen" &&
                event.pressure > 0
            ) {

                width *=
                    0.45 +
                    (event.pressure * 1.15);
            }

            if (state.tool === "eraser") {

                width *= 3.3;
            }

            return width;
        }


        function setDrawingStyle(event = null) {

            resetContext();

            ctx.strokeStyle = state.color;

            ctx.fillStyle = state.color;

            ctx.lineWidth = getStrokeWidth(event);

            if (state.tool === "eraser") {

                ctx.globalCompositeOperation =
                    "destination-out";
            }

            if (state.tool === "highlighter") {

                ctx.globalAlpha = 0.22;

                ctx.lineWidth *= 3.3;
            }
        }


        // =====================================================
        // History
        // =====================================================

        function snapshot() {

            try {

                return canvas.toDataURL(
                    "image/webp",
                    0.92
                );

            } catch {

                return canvas.toDataURL("image/png");
            }
        }


        function saveHistory() {

            if (state.restoring) return;

            if (
                state.historyIndex <
                state.history.length - 1
            ) {

                state.history =
                    state.history.slice(
                        0,
                        state.historyIndex + 1
                    );
            }

            state.history.push(snapshot());

            if (state.history.length > 15) {

                state.history.shift();
            }

            state.historyIndex =
                state.history.length - 1;

            updateHistoryButtons();
        }


        function restoreSnapshot(data) {

            if (!data) return;

            state.restoring = true;

            const image = new Image();

            image.onload = () => {

                resetContext();

                ctx.clearRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                ctx.drawImage(
                    image,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                state.restoring = false;
            };

            image.src = data;
        }


        function undo() {

            if (state.historyIndex <= 0) return;

            state.historyIndex--;

            restoreSnapshot(
                state.history[state.historyIndex]
            );

            updateHistoryButtons();
        }


        function redo() {

            if (
                state.historyIndex >=
                state.history.length - 1
            ) return;

            state.historyIndex++;

            restoreSnapshot(
                state.history[state.historyIndex]
            );

            updateHistoryButtons();
        }


        const undoButton =
            toolbar.querySelector("#apWbUndo");

        const redoButton =
            toolbar.querySelector("#apWbRedo");


        function updateHistoryButtons() {

            undoButton.disabled =
                state.historyIndex <= 0;

            redoButton.disabled =
                state.historyIndex >=
                state.history.length - 1;
        }


        saveHistory();


        // =====================================================
        // Tool selection
        // =====================================================

        function selectTool(tool) {

            state.tool = tool;

            toolbar
                .querySelectorAll("[data-tool]")
                .forEach(button => {

                    button.classList.toggle(
                        "active",
                        button.dataset.tool === tool
                    );

                });


            const cursorMap = {

                pen: "crosshair",

                highlighter: "crosshair",

                eraser: "cell",

                line: "crosshair",

                rectangle: "crosshair",

                circle: "crosshair",

                text: "text"
            };

            canvas.style.cursor =
                cursorMap[tool] || "crosshair";
        }


        toolbar
            .querySelectorAll("[data-tool]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectTool(
                            button.dataset.tool
                        );

                    }
                );

            });


        // =====================================================
        // Colours
        // =====================================================

        function selectColor(color) {

            state.color = color;

            toolbar
                .querySelectorAll(".ap-wb-color")
                .forEach(button => {

                    button.classList.toggle(
                        "active",
                        button.dataset.color
                            .toLowerCase() ===
                        color.toLowerCase()
                    );

                });
        }


        toolbar
            .querySelectorAll(".ap-wb-color")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectColor(
                            button.dataset.color
                        );

                    }
                );

            });


        const customColor =
            toolbar.querySelector(
                "#apWbCustomColor"
            );


        customColor.addEventListener(
            "input",
            event => {

                selectColor(
                    event.target.value
                );

            }
        );


        // =====================================================
        // Brush size
        // =====================================================

        const sizeInput =
            toolbar.querySelector("#apWbSize");

        const sizeDot =
            toolbar.querySelector(
                ".ap-wb-size-dot"
            );


        function updateSizePreview() {

            const displaySize =
                Math.max(
                    4,
                    Math.min(
                        18,
                        state.size
                    )
                );

            sizeDot.style.width =
                `${displaySize}px`;

            sizeDot.style.height =
                `${displaySize}px`;
        }


        sizeInput.addEventListener(
            "input",
            event => {

                state.size =
                    Number(event.target.value);

                updateSizePreview();
            }
        );


        updateSizePreview();


        // =====================================================
        // Free drawing
        // =====================================================

        function drawSegment(event, point) {

            setDrawingStyle(event);

            ctx.beginPath();

            ctx.moveTo(
                state.lastX,
                state.lastY
            );

            ctx.lineTo(
                point.x,
                point.y
            );

            ctx.stroke();

            state.lastX = point.x;
            state.lastY = point.y;
        }


        function drawDot(event, point) {

            setDrawingStyle(event);

            const radius =
                ctx.lineWidth / 2;

            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            resetContext();
        }


        // =====================================================
        // Shapes
        // =====================================================

        function drawShape(x, y) {

            setDrawingStyle();

            const sx = state.startX;
            const sy = state.startY;

            const width = x - sx;
            const height = y - sy;


            if (state.tool === "line") {

                ctx.beginPath();

                ctx.moveTo(sx, sy);

                ctx.lineTo(x, y);

                ctx.stroke();
            }


            if (state.tool === "rectangle") {

                ctx.strokeRect(
                    sx,
                    sy,
                    width,
                    height
                );
            }


            if (state.tool === "circle") {

                const cx =
                    sx + width / 2;

                const cy =
                    sy + height / 2;

                const rx =
                    Math.abs(width / 2);

                const ry =
                    Math.abs(height / 2);

                ctx.beginPath();

                ctx.ellipse(
                    cx,
                    cy,
                    rx,
                    ry,
                    0,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
            }

            resetContext();
        }


        // =====================================================
        // Text
        // =====================================================

        function addText(point) {

            const value =
                window.prompt(
                    "Enter text"
                );

            if (!value) return;

            resetContext();

            const scale = getCanvasScale();

            const fontSize =
                Math.max(
                    16,
                    state.size * 5
                ) * scale.x;

            ctx.fillStyle = state.color;

            ctx.font =
                `500 ${fontSize}px Arial, sans-serif`;

            ctx.textBaseline = "top";

            ctx.fillText(
                value,
                point.x,
                point.y
            );

            saveHistory();
        }


        // =====================================================
        // Pointer events
        // =====================================================

        function pointerDown(event) {

            if (event.button !== undefined &&
                event.button !== 0) {

                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();

            const point =
                getPoint(event);


            if (state.tool === "text") {

                addText(point);

                return;
            }


            state.drawing = true;

            state.startX =
                state.lastX =
                point.x;

            state.startY =
                state.lastY =
                point.y;


            if (
                state.tool === "line" ||
                state.tool === "rectangle" ||
                state.tool === "circle"
            ) {

                state.previewBase =
                    ctx.getImageData(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

            } else {

                drawDot(
                    event,
                    point
                );
            }


            try {

                canvas.setPointerCapture(
                    event.pointerId
                );

            } catch {}
        }


        function pointerMove(event) {

            event.preventDefault();
            event.stopImmediatePropagation();

            if (!state.drawing) return;

            const events =
                typeof event.getCoalescedEvents === "function"
                    ? event.getCoalescedEvents()
                    : [event];


            if (
                state.tool === "pen" ||
                state.tool === "highlighter" ||
                state.tool === "eraser"
            ) {

                events.forEach(item => {

                    const point =
                        getPoint(item);

                    drawSegment(
                        item,
                        point
                    );
                });

                return;
            }


            const point =
                getPoint(event);


            if (state.previewBase) {

                resetContext();

                ctx.putImageData(
                    state.previewBase,
                    0,
                    0
                );
            }

            drawShape(
                point.x,
                point.y
            );
        }


        function pointerUp(event) {

            event.preventDefault();
            event.stopImmediatePropagation();

            if (!state.drawing) return;

            const point =
                getPoint(event);


            if (
                state.tool === "line" ||
                state.tool === "rectangle" ||
                state.tool === "circle"
            ) {

                if (state.previewBase) {

                    resetContext();

                    ctx.putImageData(
                        state.previewBase,
                        0,
                        0
                    );
                }

                drawShape(
                    point.x,
                    point.y
                );
            }


            state.drawing = false;

            state.previewBase = null;

            resetContext();

            saveHistory();


            try {

                canvas.releasePointerCapture(
                    event.pointerId
                );

            } catch {}
        }


        canvas.addEventListener(
            "pointerdown",
            pointerDown,
            {
                capture: true,
                passive: false
            }
        );


        canvas.addEventListener(
            "pointermove",
            pointerMove,
            {
                capture: true,
                passive: false
            }
        );


        canvas.addEventListener(
            "pointerup",
            pointerUp,
            {
                capture: true,
                passive: false
            }
        );


        canvas.addEventListener(
            "pointercancel",
            pointerUp,
            {
                capture: true,
                passive: false
            }
        );


        /*
         * Prevent older mouse/touch handlers
         * from drawing a second stroke.
         */
        [
            "mousedown",
            "mousemove",
            "mouseup",
            "touchstart",
            "touchmove",
            "touchend"
        ].forEach(type => {

            canvas.addEventListener(
                type,
                event => {

                    event.stopImmediatePropagation();

                },
                {
                    capture: true,
                    passive: false
                }
            );

        });


        // =====================================================
        // Undo / redo / clear
        // =====================================================

        undoButton.addEventListener(
            "click",
            undo
        );


        redoButton.addEventListener(
            "click",
            redo
        );


        toolbar
            .querySelector("#apWbClear")
            .addEventListener(
                "click",
                () => {

                    const confirmed =
                        window.confirm(
                            "Clear the entire whiteboard?"
                        );

                    if (!confirmed) return;

                    resetContext();

                    ctx.clearRect(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    saveHistory();

                    notify(
                        "Whiteboard cleared"
                    );
                }
            );


        // =====================================================
        // Export canvas for sharing
        // =====================================================

        function createExportCanvas() {

            const exportCanvas =
                document.createElement(
                    "canvas"
                );

            exportCanvas.width =
                canvas.width;

            exportCanvas.height =
                canvas.height;

            const exportCtx =
                exportCanvas.getContext("2d");


            let background =
                getComputedStyle(canvas)
                    .backgroundColor;


            if (
                !background ||
                background ===
                    "rgba(0, 0, 0, 0)" ||
                background ===
                    "transparent"
            ) {

                background =
                    getComputedStyle(shell)
                        .backgroundColor;
            }


            if (
                !background ||
                background ===
                    "rgba(0, 0, 0, 0)" ||
                background ===
                    "transparent"
            ) {

                background = "#ffffff";
            }


            exportCtx.fillStyle =
                background;

            exportCtx.fillRect(
                0,
                0,
                exportCanvas.width,
                exportCanvas.height
            );


            exportCtx.drawImage(
                canvas,
                0,
                0
            );


            return exportCanvas;
        }


        function canvasToBlob(
            exportCanvas
        ) {

            return new Promise(resolve => {

                exportCanvas.toBlob(
                    resolve,
                    "image/png",
                    1
                );

            });
        }


        async function shareWhiteboard() {

            try {

                const exportCanvas =
                    createExportCanvas();

                const blob =
                    await canvasToBlob(
                        exportCanvas
                    );


                if (!blob) {

                    throw new Error(
                        "Unable to create image"
                    );
                }


                const file =
                    new File(
                        [blob],
                        "AP-Synapse-Whiteboard.png",
                        {
                            type: "image/png"
                        }
                    );


                // -----------------------------------------
                // Native share sheet
                // -----------------------------------------

                if (
                    navigator.share &&
                    navigator.canShare &&
                    navigator.canShare({
                        files: [file]
                    })
                ) {

                    await navigator.share({

                        title:
                            "AP Synapse Whiteboard",

                        text:
                            "Shared from AP Synapse Whiteboard",

                        files: [file]

                    });

                    return;
                }


                // -----------------------------------------
                // Clipboard image fallback
                // -----------------------------------------

                if (
                    navigator.clipboard &&
                    window.ClipboardItem
                ) {

                    await navigator.clipboard.write([
                        new ClipboardItem({
                            "image/png": blob
                        })
                    ]);

                    notify(
                        "Whiteboard copied — paste it into WhatsApp, Instagram or another app"
                    );

                    return;
                }


                // -----------------------------------------
                // Download fallback
                // -----------------------------------------

                const url =
                    URL.createObjectURL(blob);

                const link =
                    document.createElement("a");

                link.href = url;

                link.download =
                    "AP-Synapse-Whiteboard.png";

                document.body.appendChild(link);

                link.click();

                link.remove();

                setTimeout(
                    () =>
                        URL.revokeObjectURL(
                            url
                        ),
                    2000
                );

                notify(
                    "Whiteboard image prepared"
                );


            } catch (error) {

                if (
                    error &&
                    error.name === "AbortError"
                ) {

                    return;
                }

                console.error(
                    "AP Whiteboard share error:",
                    error
                );

                notify(
                    "Unable to share the whiteboard"
                );
            }
        }


        toolbar
            .querySelector("#apWbShare")
            .addEventListener(
                "click",
                shareWhiteboard
            );


        // =====================================================
        // Movable toolbar
        // =====================================================

        const dragHandle =
            toolbar.querySelector(
                ".ap-wb-drag"
            );

        let toolbarDragging = false;

        let dragOffsetX = 0;
        let dragOffsetY = 0;


        dragHandle.addEventListener(
            "pointerdown",
            event => {

                if (
                    window.innerWidth <= 760
                ) {

                    return;
                }

                event.preventDefault();

                toolbarDragging = true;

                const toolbarRect =
                    toolbar.getBoundingClientRect();

                dragOffsetX =
                    event.clientX -
                    toolbarRect.left;

                dragOffsetY =
                    event.clientY -
                    toolbarRect.top;


                toolbar.style.transform =
                    "none";


                dragHandle.setPointerCapture(
                    event.pointerId
                );
            }
        );


        dragHandle.addEventListener(
            "pointermove",
            event => {

                if (!toolbarDragging) return;

                const shellRect =
                    shell.getBoundingClientRect();

                const toolbarRect =
                    toolbar.getBoundingClientRect();


                let left =
                    event.clientX -
                    shellRect.left -
                    dragOffsetX;


                let top =
                    event.clientY -
                    shellRect.top -
                    dragOffsetY;


                left =
                    Math.max(
                        8,
                        Math.min(
                            left,
                            shell.clientWidth -
                                toolbarRect.width -
                                8
                        )
                    );


                top =
                    Math.max(
                        8,
                        Math.min(
                            top,
                            shell.clientHeight -
                                toolbarRect.height -
                                8
                        )
                    );


                toolbar.style.left =
                    `${left}px`;

                toolbar.style.top =
                    `${top}px`;

                toolbar.style.right =
                    "auto";

                toolbar.style.bottom =
                    "auto";
            }
        );


        function finishToolbarDrag(
            event
        ) {

            if (!toolbarDragging) return;

            toolbarDragging = false;

            try {

                dragHandle.releasePointerCapture(
                    event.pointerId
                );

            } catch {}
        }


        dragHandle.addEventListener(
            "pointerup",
            finishToolbarDrag
        );

        dragHandle.addEventListener(
            "pointercancel",
            finishToolbarDrag
        );


        // =====================================================
        // Keyboard shortcuts
        // =====================================================

        document.addEventListener(
            "keydown",
            event => {

                const active =
                    document.activeElement;

                if (
                    active &&
                    (
                        active.tagName === "INPUT" ||
                        active.tagName === "TEXTAREA" ||
                        active.isContentEditable
                    )
                ) {

                    return;
                }


                if (
                    (event.ctrlKey ||
                        event.metaKey) &&
                    event.key.toLowerCase() === "z"
                ) {

                    event.preventDefault();

                    if (event.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }

                    return;
                }


                if (
                    (event.ctrlKey ||
                        event.metaKey) &&
                    event.key.toLowerCase() === "y"
                ) {

                    event.preventDefault();

                    redo();

                    return;
                }


                const shortcuts = {

                    p: "pen",

                    h: "highlighter",

                    e: "eraser",

                    l: "line",

                    r: "rectangle",

                    o: "circle",

                    t: "text"
                };


                const selected =
                    shortcuts[
                        event.key.toLowerCase()
                    ];


                if (selected) {

                    selectTool(selected);
                }
            }
        );
        
        // ============================================================
// AP SYNAPSE — FINAL DESKTOP WHITEBOARD HEIGHT LOCK
// DESKTOP ONLY. MOBILE IS COMPLETELY UNTOUCHED.
// ============================================================

const apCanvasPage =
    document.getElementById("canvasPage");

let apDesktopLayoutRAF = 0;


function lockAPDesktopWhiteboardLayout() {

    // ABSOLUTELY DO NOTHING ON MOBILE
    if (window.innerWidth <= 760) {
        return;
    }

    if (!apCanvasPage || !shell || !canvas) {
        return;
    }


    cancelAnimationFrame(apDesktopLayoutRAF);


    apDesktopLayoutRAF =
        requestAnimationFrame(() => {

            const pageRect =
                apCanvasPage.getBoundingClientRect();


            /*
             * Canvas page is not currently visible.
             */
            if (
                pageRect.width < 100 ||
                pageRect.top < 50
            ) {
                return;
            }


            /*
             * Exact available desktop height:
             * from Canvas page top to bottom of browser.
             */
            const bottomGap = 8;

            const availableHeight =
                Math.floor(
                    window.innerHeight -
                    pageRect.top -
                    bottomGap
                );


            if (availableHeight < 400) {
                return;
            }


            // ------------------------------------------------
            // PAGE
            // Inline !important defeats the huge collection
            // of old competing CSS rules.
            // ------------------------------------------------

            apCanvasPage.style.setProperty(
                "height",
                `${availableHeight}px`,
                "important"
            );

            apCanvasPage.style.setProperty(
                "min-height",
                "0",
                "important"
            );

            apCanvasPage.style.setProperty(
                "max-height",
                "none",
                "important"
            );

            apCanvasPage.style.setProperty(
                "overflow",
                "hidden",
                "important"
            );

            apCanvasPage.style.setProperty(
                "padding-bottom",
                "0px",
                "important"
            );


            // ------------------------------------------------
            // WHITEBOARD SHELL
            // ------------------------------------------------

            shell.style.setProperty(
                "height",
                `${availableHeight}px`,
                "important"
            );

            shell.style.setProperty(
                "min-height",
                "0",
                "important"
            );

            shell.style.setProperty(
                "max-height",
                "none",
                "important"
            );

            shell.style.setProperty(
                "width",
                "100%",
                "important"
            );

            shell.style.setProperty(
                "margin",
                "0",
                "important"
            );

            shell.style.setProperty(
                "overflow",
                "hidden",
                "important"
            );


            // ------------------------------------------------
            // VISUAL CANVAS
            //
            // canvas.js continues owning canvas.width /
            // canvas.height pixel resolution.
            // We only control its CSS dimensions here.
            // ------------------------------------------------

            canvas.style.setProperty(
                "width",
                "100%",
                "important"
            );

            canvas.style.setProperty(
                "height",
                "100%",
                "important"
            );

            canvas.style.setProperty(
                "max-width",
                "none",
                "important"
            );

            canvas.style.setProperty(
                "max-height",
                "none",
                "important"
            );

            canvas.style.setProperty(
                "display",
                "block",
                "important"
            );


            console.log(
                "✅ AP SYNAPSE DESKTOP CANVAS LOCKED:",
                {
                    top: Math.round(pageRect.top),
                    viewport: window.innerHeight,
                    whiteboardHeight: availableHeight
                }
            );

        });
}


function scheduleAPDesktopLayoutLock() {

    if (window.innerWidth <= 760) {
        return;
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(
            lockAPDesktopWhiteboardLayout
        );
    });
}


// Initial desktop load
scheduleAPDesktopLayoutLock();


// Router/layout settlement
setTimeout(
    scheduleAPDesktopLayoutLock,
    60
);

setTimeout(
    scheduleAPDesktopLayoutLock,
    180
);

setTimeout(
    scheduleAPDesktopLayoutLock,
    500
);


// Desktop resize only
window.addEventListener(
    "resize",
    () => {

        if (window.innerWidth > 760) {
            scheduleAPDesktopLayoutLock();
        }

    },
    {
        passive: true
    }
);


// Canvas page becoming active
const apCanvasDesktopObserver =
    new MutationObserver(() => {

        if (window.innerWidth > 760) {
            scheduleAPDesktopLayoutLock();
        }

    });


apCanvasDesktopObserver.observe(
    apCanvasPage,
    {
        attributes: true,
        attributeFilter: [
            "class",
            "style",
            "hidden"
        ]
    }
);

// ============================================================
// AP SYNAPSE — DESKTOP ACTUAL CANVAS FULL VERTICAL FIX
// MOBILE <= 760px IS NEVER TOUCHED
// ============================================================

let apDesktopCanvasFixBusy = false;

function forceAPDesktopCanvasVerticalSize() {

    if (window.innerWidth <= 760) return;
    if (apDesktopCanvasFixBusy) return;

    const canvas =
        document.getElementById("apCanvas");

    if (!canvas) return;

    const rect =
        canvas.getBoundingClientRect();

    if (
        rect.width < 300 ||
        rect.top < 100
    ) {
        return;
    }

    apDesktopCanvasFixBusy = true;

    /*
     * KEEP:
     * - exact current top
     * - exact current left
     * - exact current width
     *
     * CHANGE ONLY:
     * - vertical bottom
     */

    const top =
        Math.round(rect.top);

    const left =
        Math.round(rect.left);

    const width =
        Math.round(rect.width);

    const height =
        Math.max(
            500,
            Math.floor(
                window.innerHeight -
                top -
                8
            )
        );


    // --------------------------------------------------------
    // ACTUAL WHITE DRAWING SURFACE
    // --------------------------------------------------------

    canvas.style.setProperty(
        "position",
        "fixed",
        "important"
    );

    canvas.style.setProperty(
        "top",
        `${top}px`,
        "important"
    );

    canvas.style.setProperty(
        "left",
        `${left}px`,
        "important"
    );

    canvas.style.setProperty(
        "right",
        "auto",
        "important"
    );

    canvas.style.setProperty(
        "bottom",
        "auto",
        "important"
    );

    canvas.style.setProperty(
        "width",
        `${width}px`,
        "important"
    );

    canvas.style.setProperty(
        "height",
        `${height}px`,
        "important"
    );

    canvas.style.setProperty(
        "min-height",
        `${height}px`,
        "important"
    );

    canvas.style.setProperty(
        "max-height",
        "none",
        "important"
    );

    canvas.style.setProperty(
        "margin",
        "0",
        "important"
    );

    canvas.style.setProperty(
        "z-index",
        "20",
        "important"
    );

    canvas.style.setProperty(
        "background",
        "#ffffff",
        "important"
    );

    canvas.style.setProperty(
        "border-radius",
        "0 0 18px 18px",
        "important"
    );


    /*
     * Also extend the shell visually,
     * but do NOT reposition it.
     */

    const shell =
        canvas.closest(".whiteboard-shell");

    if (shell) {

        shell.style.setProperty(
            "height",
            `${height}px`,
            "important"
        );

        shell.style.setProperty(
            "min-height",
            `${height}px`,
            "important"
        );

        shell.style.setProperty(
            "max-height",
            "none",
            "important"
        );

        shell.style.setProperty(
            "overflow",
            "visible",
            "important"
        );
    }


    /*
     * Keep professional toolbar above the fixed canvas.
     */

    const toolbar =
        document.querySelector(
            "#canvasPage .ap-wb-pro-toolbar"
        );

    if (toolbar) {

        toolbar.style.setProperty(
            "z-index",
            "99999",
            "important"
        );
    }


    apDesktopCanvasFixBusy = false;

    console.log(
        "✅ AP DESKTOP CANVAS VERTICAL SIZE:",
        {
            top,
            width,
            height,
            bottom:
                top + height
        }
    );
}


// Run after Canvas/layout/router have settled
requestAnimationFrame(() => {
    requestAnimationFrame(
        forceAPDesktopCanvasVerticalSize
    );
});

setTimeout(
    forceAPDesktopCanvasVerticalSize,
    100
);

setTimeout(
    forceAPDesktopCanvasVerticalSize,
    300
);

setTimeout(
    forceAPDesktopCanvasVerticalSize,
    800
);


// Browser resize
window.addEventListener(
    "resize",
    () => {

        if (window.innerWidth <= 760) {
            return;
        }

        /*
         * Temporarily release position so current
         * horizontal workspace geometry can be measured.
         */

        const canvas =
            document.getElementById("apCanvas");

        if (!canvas) return;

        canvas.style.removeProperty(
            "position"
        );

        canvas.style.removeProperty(
            "top"
        );

        canvas.style.removeProperty(
            "left"
        );

        canvas.style.removeProperty(
            "width"
        );

        canvas.style.removeProperty(
            "height"
        );

        requestAnimationFrame(() => {
            requestAnimationFrame(
                forceAPDesktopCanvasVerticalSize
            );
        });

    },
    {
        passive: true
    }
);

// ============================================================
// AP SYNAPSE — DESKTOP WHITEBOARD PORTAL
// FINAL FIX FOR PARENT HEIGHT / OVERFLOW CLIPPING
// MOBILE IS NEVER MODIFIED
// ============================================================

const apWbPage =
    document.getElementById("canvasPage");

const apWbOriginalParent =
    shell.parentNode;

const apWbMarker =
    document.createComment(
        "AP-WHITEBOARD-DESKTOP-SLOT"
    );

apWbOriginalParent.insertBefore(
    apWbMarker,
    shell
);

let apWbPortalActive = false;


function apCanvasPageVisible() {

    if (!apWbPage) return false;

    const style =
        getComputedStyle(apWbPage);

    return (
        !apWbPage.hidden &&
        style.display !== "none" &&
        style.visibility !== "hidden"
    );
}


function mountAPDesktopWhiteboard() {

    // MOBILE: ABSOLUTELY NOTHING
    if (window.innerWidth <= 760) {
        restoreAPWhiteboard();
        return;
    }

    if (!apCanvasPageVisible()) {
        restoreAPWhiteboard();
        return;
    }


    /*
     * Measure its correct desktop position BEFORE
     * removing it from the clipped workspace.
     */
    if (!apWbPortalActive) {

        const rect =
            shell.getBoundingClientRect();

        if (
            rect.width < 300 ||
            rect.top < 100
        ) {
            return;
        }


        shell.dataset.apDesktopLeft =
            String(rect.left);

        shell.dataset.apDesktopTop =
            String(rect.top);

        shell.dataset.apDesktopWidth =
            String(rect.width);


        /*
         * MOVE THE SAME LIVE WHITEBOARD TO BODY.
         *
         * Drawing state/listeners are preserved.
         * This escapes every height/overflow rule
         * on Canvas workspace parents.
         */
        document.body.appendChild(shell);

        apWbPortalActive = true;
    }


    const pageRect =
        apWbPage.getBoundingClientRect();


    /*
     * Keep same workspace horizontal boundaries.
     */
    const left =
        pageRect.width > 300
            ? pageRect.left
            : Number(
                shell.dataset.apDesktopLeft
            );


    const width =
        pageRect.width > 300
            ? pageRect.width
            : Number(
                shell.dataset.apDesktopWidth
            );


    const top =
        Number(
            shell.dataset.apDesktopTop
        );


    const height =
        Math.max(
            520,
            Math.floor(
                window.innerHeight -
                top -
                8
            )
        );


    // ========================================================
    // LIVE WHITEBOARD
    // ========================================================

    shell.style.setProperty(
        "position",
        "fixed",
        "important"
    );

    shell.style.setProperty(
        "top",
        `${top}px`,
        "important"
    );

    shell.style.setProperty(
        "left",
        `${left}px`,
        "important"
    );

    shell.style.setProperty(
        "right",
        "auto",
        "important"
    );

    shell.style.setProperty(
        "bottom",
        "auto",
        "important"
    );

    shell.style.setProperty(
        "width",
        `${width}px`,
        "important"
    );

    shell.style.setProperty(
        "height",
        `${height}px`,
        "important"
    );

    shell.style.setProperty(
        "min-height",
        `${height}px`,
        "important"
    );

    shell.style.setProperty(
        "max-height",
        "none",
        "important"
    );

    shell.style.setProperty(
        "margin",
        "0",
        "important"
    );

    shell.style.setProperty(
        "padding",
        "0",
        "important"
    );

    shell.style.setProperty(
        "overflow",
        "hidden",
        "important"
    );

    shell.style.setProperty(
        "background",
        "#ffffff",
        "important"
    );

    shell.style.setProperty(
        "z-index",
        "50",
        "important"
    );

    shell.style.setProperty(
        "border-radius",
        "0 0 18px 18px",
        "important"
    );


    // ========================================================
    // ACTUAL DRAWING CANVAS
    // ========================================================

    canvas.style.setProperty(
        "position",
        "absolute",
        "important"
    );

    canvas.style.setProperty(
        "inset",
        "0",
        "important"
    );

    canvas.style.setProperty(
        "width",
        "100%",
        "important"
    );

    canvas.style.setProperty(
        "height",
        "100%",
        "important"
    );

    canvas.style.setProperty(
        "max-width",
        "none",
        "important"
    );

    canvas.style.setProperty(
        "max-height",
        "none",
        "important"
    );

    canvas.style.setProperty(
        "display",
        "block",
        "important"
    );


    // Pro toolbar stays above the drawing surface
    toolbar.style.setProperty(
        "z-index",
        "9999",
        "important"
    );


    /*
     * Let your existing canvas.js update
     * actual drawing resolution.
     */
    requestAnimationFrame(() => {

        window.dispatchEvent(
            new Event("resize")
        );

    });


    console.log(
        "✅ AP WHITEBOARD DESKTOP PORTAL:",
        {
            top,
            height,
            bottom:
                top + height,
            viewport:
                window.innerHeight
        }
    );
}


function restoreAPWhiteboard() {

    if (!apWbPortalActive) {
        return;
    }


    /*
     * Put the SAME board back in its original
     * Canvas location before mobile/other pages.
     */
    if (apWbMarker.parentNode) {

        apWbMarker.parentNode.insertBefore(
            shell,
            apWbMarker.nextSibling
        );
    }


    [
        "position",
        "top",
        "left",
        "right",
        "bottom",
        "width",
        "height",
        "min-height",
        "max-height",
        "margin",
        "padding",
        "overflow",
        "background",
        "z-index",
        "border-radius"
    ].forEach(property => {

        shell.style.removeProperty(
            property
        );

    });


    [
        "position",
        "inset",
        "width",
        "height",
        "max-width",
        "max-height",
        "display"
    ].forEach(property => {

        canvas.style.removeProperty(
            property
        );

    });


    apWbPortalActive = false;
}


// Initial desktop mount
requestAnimationFrame(() => {

    requestAnimationFrame(
        mountAPDesktopWhiteboard
    );

});

setTimeout(
    mountAPDesktopWhiteboard,
    150
);

setTimeout(
    mountAPDesktopWhiteboard,
    500
);


// Desktop resize / mobile switch
window.addEventListener(
    "resize",
    () => {

        if (window.innerWidth <= 760) {

            restoreAPWhiteboard();

        } else {

            mountAPDesktopWhiteboard();
        }

    },
    {
        passive: true
    }
);


// Detect router page changes
const apWbPageObserver =
    new MutationObserver(() => {

        if (
            window.innerWidth > 760 &&
            apCanvasPageVisible()
        ) {

            mountAPDesktopWhiteboard();

        } else {

            restoreAPWhiteboard();
        }

    });


apWbPageObserver.observe(
    apWbPage,
    {
        attributes: true,
        attributeFilter: [
            "class",
            "style",
            "hidden"
        ]
    }
);

        // =====================================================
        // Initial state
        // =====================================================

        selectTool("pen");

        updateHistoryButtons();

        console.log(
            "⚡ AP SYNAPSE WHITEBOARD PRO ACTIVE"
        );
    }


    // =========================================================
    // Start
    // =========================================================

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initAPWhiteboardPro
        );

    } else {

        initAPWhiteboardPro();
    }

})();