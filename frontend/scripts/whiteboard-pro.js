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
// ============================================================
// AP_INFINITE_CANVAS_V18
// Practically unbounded vector whiteboard with persistent state.
// ============================================================

(() => {
    "use strict";

    if (window.__AP_INFINITE_CANVAS_V18__) {
        return;
    }

    window.__AP_INFINITE_CANVAS_V18__ = true;

    const DB_NAME =
        "ap-synapse-infinite-canvas";

    const DB_VERSION = 1;

    const BOARD_STORE =
        "boards";

    const ARCHIVE_STORE =
        "archives";

    const BOARD_KEY =
        "default-board-v1";

    const MIN_ZOOM =
        0.001;

    const MAX_ZOOM =
        256;

    const MAX_UNDO =
        60;

    const SAVE_DELAY_MS =
        300;

    let page = null;
    let shell = null;
    let canvas = null;
    let ctx = null;
    let dpr = 1;

    let board = {
        version: 1,
        items: [],
        view: {
            tx: 0,
            ty: 0,
            zoom: 1
        },
        updatedAt: Date.now()
    };

    let mode =
        "pen";

    let color =
        "#111111";

    let lineWidth =
        4;

    let activeItem =
        null;

    let previewItem =
        null;

    let eraseCheckpointed =
        false;

    let spaceHeld =
        false;

    let renderQueued =
        false;

    let saveTimer =
        null;

    let dbPromise =
        null;

    const pointers =
        new Map();

    let gesture =
        null;

    const undoStack =
        [];

    const redoStack =
        [];

    const imageCache =
        new Map();

    let hud =
        null;

    let zoomLabel =
        null;

    let saveLabel =
        null;

    function cloneItems() {
        return JSON.parse(
            JSON.stringify(
                board.items
            )
        );
    }

    function checkpoint() {
        undoStack.push(
            cloneItems()
        );

        if (
            undoStack.length >
            MAX_UNDO
        ) {
            undoStack.shift();
        }

        redoStack.length = 0;
    }

    function undo() {
        if (!undoStack.length) {
            return;
        }

        redoStack.push(
            cloneItems()
        );

        board.items =
            undoStack.pop();

        saveSoon();
        queueRender();
    }

    function redo() {
        if (!redoStack.length) {
            return;
        }

        undoStack.push(
            cloneItems()
        );

        board.items =
            redoStack.pop();

        saveSoon();
        queueRender();
    }

    function clamp(
        value,
        min,
        max
    ) {
        return Math.min(
            max,
            Math.max(
                min,
                value
            )
        );
    }

    function uid(prefix = "item") {
        return (
            prefix +
            "-" +
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 9)
        );
    }

    function openDb() {
        if (dbPromise) {
            return dbPromise;
        }

        dbPromise =
            new Promise(
                (resolve, reject) => {
                    const request =
                        indexedDB.open(
                            DB_NAME,
                            DB_VERSION
                        );

                    request.onupgradeneeded =
                        () => {
                            const db =
                                request.result;

                            if (
                                !db.objectStoreNames
                                    .contains(
                                        BOARD_STORE
                                    )
                            ) {
                                db.createObjectStore(
                                    BOARD_STORE,
                                    {
                                        keyPath:
                                            "key"
                                    }
                                );
                            }

                            if (
                                !db.objectStoreNames
                                    .contains(
                                        ARCHIVE_STORE
                                    )
                            ) {
                                db.createObjectStore(
                                    ARCHIVE_STORE,
                                    {
                                        keyPath:
                                            "id"
                                    }
                                );
                            }
                        };

                    request.onsuccess =
                        () =>
                            resolve(
                                request.result
                            );

                    request.onerror =
                        () =>
                            reject(
                                request.error
                            );
                }
            );

        return dbPromise;
    }

    async function loadBoard() {
        try {
            const db =
                await openDb();

            const saved =
                await new Promise(
                    (resolve, reject) => {
                        const tx =
                            db.transaction(
                                BOARD_STORE,
                                "readonly"
                            );

                        const request =
                            tx
                                .objectStore(
                                    BOARD_STORE
                                )
                                .get(
                                    BOARD_KEY
                                );

                        request.onsuccess =
                            () =>
                                resolve(
                                    request.result ||
                                    null
                                );

                        request.onerror =
                            () =>
                                reject(
                                    request.error
                                );
                    }
                );

            if (
                saved &&
                Array.isArray(
                    saved.items
                ) &&
                saved.view
            ) {
                board = {
                    version:
                        Number(
                            saved.version
                        ) || 1,

                    items:
                        saved.items,

                    view: {
                        tx:
                            Number(
                                saved.view.tx
                            ) || 0,

                        ty:
                            Number(
                                saved.view.ty
                            ) || 0,

                        zoom:
                            clamp(
                                Number(
                                    saved.view.zoom
                                ) || 1,
                                MIN_ZOOM,
                                MAX_ZOOM
                            )
                    },

                    updatedAt:
                        Number(
                            saved.updatedAt
                        ) ||
                        Date.now()
                };
            }
        }
        catch (error) {
            console.warn(
                "AP Infinite Canvas load failed:",
                error
            );
        }
    }

    async function saveNow() {
        clearTimeout(
            saveTimer
        );

        saveTimer = null;

        board.updatedAt =
            Date.now();

        if (saveLabel) {
            saveLabel.textContent =
                "Saving…";
        }

        try {
            const db =
                await openDb();

            await new Promise(
                (resolve, reject) => {
                    const tx =
                        db.transaction(
                            BOARD_STORE,
                            "readwrite"
                        );

                    tx
                        .objectStore(
                            BOARD_STORE
                        )
                        .put({
                            key:
                                BOARD_KEY,

                            version:
                                board.version,

                            items:
                                board.items,

                            view:
                                board.view,

                            updatedAt:
                                board.updatedAt
                        });

                    tx.oncomplete =
                        resolve;

                    tx.onerror =
                        () =>
                            reject(
                                tx.error
                            );

                    tx.onabort =
                        () =>
                            reject(
                                tx.error
                            );
                }
            );

            if (saveLabel) {
                saveLabel.textContent =
                    "Saved";
            }
        }
        catch (error) {
            console.warn(
                "AP Infinite Canvas save failed:",
                error
            );

            if (saveLabel) {
                saveLabel.textContent =
                    "Local save unavailable";
            }
        }
    }

    function saveSoon() {
        if (saveLabel) {
            saveLabel.textContent =
                "Saving…";
        }

        clearTimeout(
            saveTimer
        );

        saveTimer =
            setTimeout(
                saveNow,
                SAVE_DELAY_MS
            );
    }

    async function archiveBoard(
        reason = "manual-clear"
    ) {
        if (!board.items.length) {
            return;
        }

        try {
            const db =
                await openDb();

            await new Promise(
                (resolve, reject) => {
                    const tx =
                        db.transaction(
                            ARCHIVE_STORE,
                            "readwrite"
                        );

                    tx
                        .objectStore(
                            ARCHIVE_STORE
                        )
                        .put({
                            id:
                                Date.now(),

                            reason,

                            items:
                                cloneItems(),

                            view:
                                {
                                    ...board.view
                                },

                            createdAt:
                                Date.now()
                        });

                    tx.oncomplete =
                        resolve;

                    tx.onerror =
                        () =>
                            reject(
                                tx.error
                            );
                }
            );
        }
        catch (error) {
            console.warn(
                "AP Canvas archive failed:",
                error
            );
        }
    }

    function queueRender() {
        if (renderQueued) {
            return;
        }

        renderQueued = true;

        requestAnimationFrame(
            () => {
                renderQueued =
                    false;

                render();
            }
        );
    }

    function screenPoint(
        clientX,
        clientY
    ) {
        const rect =
            canvas.getBoundingClientRect();

        return {
            x:
                clientX -
                rect.left,

            y:
                clientY -
                rect.top
        };
    }

    function screenToWorld(
        sx,
        sy
    ) {
        return {
            x:
                (
                    sx -
                    board.view.tx
                ) /
                board.view.zoom,

            y:
                (
                    sy -
                    board.view.ty
                ) /
                board.view.zoom
        };
    }

    function clientToWorld(
        clientX,
        clientY
    ) {
        const s =
            screenPoint(
                clientX,
                clientY
            );

        return screenToWorld(
            s.x,
            s.y
        );
    }

    function zoomText() {
        const percentage =
            board.view.zoom *
            100;

        if (
            percentage >= 1000
        ) {
            return (
                Math.round(
                    percentage
                ) +
                "%"
            );
        }

        if (
            percentage >= 10
        ) {
            return (
                percentage
                    .toFixed(0) +
                "%"
            );
        }

        if (
            percentage >= 1
        ) {
            return (
                percentage
                    .toFixed(1) +
                "%"
            );
        }

        return (
            percentage
                .toFixed(2) +
            "%"
        );
    }

    function updateHud() {
        if (zoomLabel) {
            zoomLabel.textContent =
                zoomText();
        }

        if (canvas) {
            canvas.dataset.apCanvasMode =
                mode;
        }
    }

    function zoomAtScreen(
        sx,
        sy,
        targetZoom
    ) {
        const before =
            screenToWorld(
                sx,
                sy
            );

        const nextZoom =
            clamp(
                targetZoom,
                MIN_ZOOM,
                MAX_ZOOM
            );

        board.view.zoom =
            nextZoom;

        board.view.tx =
            sx -
            before.x *
            nextZoom;

        board.view.ty =
            sy -
            before.y *
            nextZoom;

        updateHud();
        saveSoon();
        queueRender();
    }

    function zoomCenter(
        factor
    ) {
        const rect =
            canvas.getBoundingClientRect();

        zoomAtScreen(
            rect.width / 2,
            rect.height / 2,
            board.view.zoom *
                factor
        );
    }

    function resetView() {
        const rect =
            canvas.getBoundingClientRect();

        board.view.zoom = 1;
        board.view.tx =
            rect.width / 2;
        board.view.ty =
            rect.height / 2;

        updateHud();
        saveSoon();
        queueRender();
    }

    function drawItem(
        item
    ) {
        if (!item) {
            return;
        }

        ctx.save();

        ctx.lineCap =
            "round";

        ctx.lineJoin =
            "round";

        ctx.strokeStyle =
            item.color ||
            "#111111";

        ctx.fillStyle =
            item.color ||
            "#111111";

        ctx.lineWidth =
            Number(
                item.width
            ) || 4;

        if (
            item.type ===
            "stroke"
        ) {
            const points =
                item.points ||
                [];

            if (!points.length) {
                ctx.restore();
                return;
            }

            ctx.beginPath();
            ctx.moveTo(
                points[0].x,
                points[0].y
            );

            for (
                let i = 1;
                i < points.length;
                i++
            ) {
                ctx.lineTo(
                    points[i].x,
                    points[i].y
                );
            }

            ctx.stroke();
        }

        else if (
            item.type ===
            "line"
        ) {
            ctx.beginPath();
            ctx.moveTo(
                item.x1,
                item.y1
            );
            ctx.lineTo(
                item.x2,
                item.y2
            );
            ctx.stroke();
        }

        else if (
            item.type ===
            "rect"
        ) {
            const x =
                Math.min(
                    item.x1,
                    item.x2
                );

            const y =
                Math.min(
                    item.y1,
                    item.y2
                );

            const w =
                Math.abs(
                    item.x2 -
                    item.x1
                );

            const h =
                Math.abs(
                    item.y2 -
                    item.y1
                );

            ctx.strokeRect(
                x,
                y,
                w,
                h
            );
        }

        else if (
            item.type ===
            "ellipse"
        ) {
            const cx =
                (
                    item.x1 +
                    item.x2
                ) / 2;

            const cy =
                (
                    item.y1 +
                    item.y2
                ) / 2;

            const rx =
                Math.abs(
                    item.x2 -
                    item.x1
                ) / 2;

            const ry =
                Math.abs(
                    item.y2 -
                    item.y1
                ) / 2;

            ctx.beginPath();

            ctx.ellipse(
                cx,
                cy,
                Math.max(
                    rx,
                    0.01
                ),
                Math.max(
                    ry,
                    0.01
                ),
                0,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }

        else if (
            item.type ===
            "text"
        ) {
            ctx.font =
                `${Number(
                    item.size
                ) || 24}px Inter, Arial, sans-serif`;

            ctx.textBaseline =
                "top";

            ctx.fillText(
                item.text ||
                "",
                item.x,
                item.y
            );
        }

        else if (
            item.type ===
            "image"
        ) {
            const src =
                item.src;

            if (src) {
                let image =
                    imageCache.get(
                        src
                    );

                if (!image) {
                    image =
                        new Image();

                    image.onload =
                        queueRender;

                    image.src =
                        src;

                    imageCache.set(
                        src,
                        image
                    );
                }

                if (
                    image.complete &&
                    image.naturalWidth
                ) {
                    ctx.drawImage(
                        image,
                        item.x,
                        item.y,
                        item.w,
                        item.h
                    );
                }
            }
        }

        ctx.restore();
    }

    function renderGrid(
        width,
        height
    ) {
        const zoom =
            board.view.zoom;

        if (
            zoom <
            0.08
        ) {
            return;
        }

        let worldStep =
            40;

        while (
            worldStep *
            zoom <
            28
        ) {
            worldStep *= 2;
        }

        while (
            worldStep *
            zoom >
            100
        ) {
            worldStep /= 2;
        }

        const screenStep =
            worldStep *
            zoom;

        const startX =
            (
                (
                    board.view.tx %
                    screenStep
                ) +
                screenStep
            ) %
            screenStep;

        const startY =
            (
                (
                    board.view.ty %
                    screenStep
                ) +
                screenStep
            ) %
            screenStep;

        ctx.save();

        ctx.fillStyle =
            "rgba(15,17,20,.055)";

        for (
            let x = startX;
            x < width;
            x += screenStep
        ) {
            for (
                let y = startY;
                y < height;
                y += screenStep
            ) {
                ctx.beginPath();
                ctx.arc(
                    x * dpr,
                    y * dpr,
                    Math.max(
                        0.65,
                        0.7 * dpr
                    ),
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }

        ctx.restore();
    }

    function render() {
        if (!ctx || !canvas) {
            return;
        }

        const rect =
            canvas.getBoundingClientRect();

        const cssWidth =
            rect.width;

        const cssHeight =
            rect.height;

        if (
            !cssWidth ||
            !cssHeight
        ) {
            return;
        }

        ctx.setTransform(
            1,
            0,
            0,
            1,
            0,
            0
        );

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle =
            "#ffffff";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        renderGrid(
            cssWidth,
            cssHeight
        );

        ctx.save();

        ctx.setTransform(
            dpr *
                board.view.zoom,
            0,
            0,
            dpr *
                board.view.zoom,
            dpr *
                board.view.tx,
            dpr *
                board.view.ty
        );

        for (
            const item of
            board.items
        ) {
            drawItem(
                item
            );
        }

        if (previewItem) {
            ctx.save();

            ctx.globalAlpha =
                0.72;

            drawItem(
                previewItem
            );

            ctx.restore();
        }

        if (activeItem) {
            drawItem(
                activeItem
            );
        }

        ctx.restore();

        updateHud();
    }

    function resizeBoard() {
        if (
            !canvas ||
            !shell
        ) {
            return;
        }

        const shellTop =
            shell
                .getBoundingClientRect()
                .top;

        const available =
            Math.max(
                560,
                window.innerHeight -
                    shellTop -
                    4
            );

        shell.style.setProperty(
            "height",
            `${Math.round(
                available
            )}px`,
            "important"
        );

        shell.style.setProperty(
            "min-height",
            "560px",
            "important"
        );

        shell.style.setProperty(
            "max-height",
            "none",
            "important"
        );

        canvas.style.width =
            "100%";

        canvas.style.height =
            "100%";

        const rect =
            canvas.getBoundingClientRect();

        dpr =
            clamp(
                window.devicePixelRatio ||
                    1,
                1,
                2
            );

        const targetWidth =
            Math.max(
                1,
                Math.round(
                    rect.width *
                    dpr
                )
            );

        const targetHeight =
            Math.max(
                1,
                Math.round(
                    rect.height *
                    dpr
                )
            );

        if (
            canvas.width !==
                targetWidth ||
            canvas.height !==
                targetHeight
        ) {
            canvas.width =
                targetWidth;

            canvas.height =
                targetHeight;
        }

        queueRender();
    }

    function pointDistanceToSegment(
        px,
        py,
        x1,
        y1,
        x2,
        y2
    ) {
        const dx =
            x2 - x1;

        const dy =
            y2 - y1;

        if (
            dx === 0 &&
            dy === 0
        ) {
            return Math.hypot(
                px - x1,
                py - y1
            );
        }

        const t =
            clamp(
                (
                    (
                        px - x1
                    ) * dx +
                    (
                        py - y1
                    ) * dy
                ) /
                (
                    dx * dx +
                    dy * dy
                ),
                0,
                1
            );

        const x =
            x1 +
            t * dx;

        const y =
            y1 +
            t * dy;

        return Math.hypot(
            px - x,
            py - y
        );
    }

    function itemHit(
        item,
        p,
        radius
    ) {
        if (
            item.type ===
            "stroke"
        ) {
            const points =
                item.points ||
                [];

            for (
                let i = 1;
                i < points.length;
                i++
            ) {
                if (
                    pointDistanceToSegment(
                        p.x,
                        p.y,
                        points[i - 1].x,
                        points[i - 1].y,
                        points[i].x,
                        points[i].y
                    ) <= radius
                ) {
                    return true;
                }
            }

            return false;
        }

        if (
            item.type ===
            "line"
        ) {
            return (
                pointDistanceToSegment(
                    p.x,
                    p.y,
                    item.x1,
                    item.y1,
                    item.x2,
                    item.y2
                ) <=
                radius
            );
        }

        if (
            item.type ===
                "rect" ||
            item.type ===
                "ellipse"
        ) {
            const minX =
                Math.min(
                    item.x1,
                    item.x2
                ) -
                radius;

            const maxX =
                Math.max(
                    item.x1,
                    item.x2
                ) +
                radius;

            const minY =
                Math.min(
                    item.y1,
                    item.y2
                ) -
                radius;

            const maxY =
                Math.max(
                    item.y1,
                    item.y2
                ) +
                radius;

            return (
                p.x >= minX &&
                p.x <= maxX &&
                p.y >= minY &&
                p.y <= maxY
            );
        }

        if (
            item.type ===
            "text"
        ) {
            return (
                Math.abs(
                    p.x -
                    item.x
                ) <=
                    140 /
                    board.view.zoom &&
                Math.abs(
                    p.y -
                    item.y
                ) <=
                    50 /
                    board.view.zoom
            );
        }

        if (
            item.type ===
            "image"
        ) {
            return (
                p.x >=
                    item.x -
                        radius &&
                p.x <=
                    item.x +
                        item.w +
                        radius &&
                p.y >=
                    item.y -
                        radius &&
                p.y <=
                    item.y +
                        item.h +
                        radius
            );
        }

        return false;
    }

    function eraseAt(
        p
    ) {
        const radius =
            18 /
            board.view.zoom;

        const before =
            board.items.length;

        board.items =
            board.items.filter(
                item =>
                    !itemHit(
                        item,
                        p,
                        radius
                    )
            );

        if (
            board.items.length !==
            before
        ) {
            saveSoon();
            queueRender();
        }
    }

    function beginShape(
        type,
        p
    ) {
        previewItem = {
            id:
                uid(type),

            type,

            x1:
                p.x,

            y1:
                p.y,

            x2:
                p.x,

            y2:
                p.y,

            color,

            width:
                lineWidth
        };
    }

    function firstTwoPointers() {
        return Array.from(
            pointers.values()
        ).slice(
            0,
            2
        );
    }

    function distance(
        a,
        b
    ) {
        return Math.hypot(
            b.x - a.x,
            b.y - a.y
        );
    }

    function center(
        a,
        b
    ) {
        return {
            x:
                (
                    a.x +
                    b.x
                ) / 2,

            y:
                (
                    a.y +
                    b.y
                ) / 2
        };
    }

    function startPinch() {
        if (
            pointers.size <
            2
        ) {
            return;
        }

        activeItem = null;
        previewItem = null;
        eraseCheckpointed =
            false;

        const [
            a,
            b
        ] =
            firstTwoPointers();

        const c =
            center(
                a,
                b
            );

        const world =
            screenToWorld(
                c.x,
                c.y
            );

        gesture = {
            type:
                "pinch",

            startDistance:
                Math.max(
                    1,
                    distance(
                        a,
                        b
                    )
                ),

            startZoom:
                board.view.zoom,

            worldX:
                world.x,

            worldY:
                world.y
        };
    }

    function onPointerDown(
        event
    ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const s =
            screenPoint(
                event.clientX,
                event.clientY
            );

        pointers.set(
            event.pointerId,
            {
                x:
                    s.x,

                y:
                    s.y,

                pointerType:
                    event.pointerType
            }
        );

        try {
            canvas.setPointerCapture(
                event.pointerId
            );
        }
        catch (_) {}

        if (
            pointers.size >=
            2
        ) {
            startPinch();
            return;
        }

        const wantsPan =
            mode === "pan" ||
            spaceHeld ||
            event.button === 1 ||
            event.button === 2;

        if (wantsPan) {
            gesture = {
                type:
                    "pan",

                startX:
                    s.x,

                startY:
                    s.y,

                startTx:
                    board.view.tx,

                startTy:
                    board.view.ty
            };

            return;
        }

        const p =
            screenToWorld(
                s.x,
                s.y
            );

        if (
            mode ===
            "erase"
        ) {
            checkpoint();

            eraseCheckpointed =
                true;

            eraseAt(
                p
            );

            return;
        }

        if (
            mode ===
            "line" ||
            mode ===
            "rect" ||
            mode ===
            "ellipse"
        ) {
            checkpoint();

            beginShape(
                mode,
                p
            );

            return;
        }

        if (
            mode ===
            "text"
        ) {
            const text =
                window.prompt(
                    "Enter text for the canvas:"
                );

            if (
                text &&
                text.trim()
            ) {
                checkpoint();

                board.items.push({
                    id:
                        uid(
                            "text"
                        ),

                    type:
                        "text",

                    x:
                        p.x,

                    y:
                        p.y,

                    text:
                        text.trim(),

                    color,

                    size:
                        Math.max(
                            18,
                            lineWidth *
                                5
                        )
                });

                saveSoon();
                queueRender();
            }

            return;
        }

        checkpoint();

        activeItem = {
            id:
                uid(
                    "stroke"
                ),

            type:
                "stroke",

            color,

            width:
                lineWidth,

            points: [
                p
            ]
        };

        queueRender();
    }

    function onPointerMove(
        event
    ) {
        if (
            !pointers.has(
                event.pointerId
            )
        ) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        const s =
            screenPoint(
                event.clientX,
                event.clientY
            );

        pointers.set(
            event.pointerId,
            {
                x:
                    s.x,

                y:
                    s.y,

                pointerType:
                    event.pointerType
            }
        );

        if (
            pointers.size >=
            2
        ) {
            if (
                !gesture ||
                gesture.type !==
                    "pinch"
            ) {
                startPinch();
            }

            const [
                a,
                b
            ] =
                firstTwoPointers();

            const c =
                center(
                    a,
                    b
                );

            const dist =
                Math.max(
                    1,
                    distance(
                        a,
                        b
                    )
                );

            const nextZoom =
                clamp(
                    gesture.startZoom *
                        (
                            dist /
                            gesture.startDistance
                        ),
                    MIN_ZOOM,
                    MAX_ZOOM
                );

            board.view.zoom =
                nextZoom;

            board.view.tx =
                c.x -
                gesture.worldX *
                    nextZoom;

            board.view.ty =
                c.y -
                gesture.worldY *
                    nextZoom;

            updateHud();
            saveSoon();
            queueRender();

            return;
        }

        if (
            gesture?.type ===
            "pan"
        ) {
            board.view.tx =
                gesture.startTx +
                (
                    s.x -
                    gesture.startX
                );

            board.view.ty =
                gesture.startTy +
                (
                    s.y -
                    gesture.startY
                );

            saveSoon();
            queueRender();

            return;
        }

        const p =
            screenToWorld(
                s.x,
                s.y
            );

        if (
            mode ===
            "erase" &&
            eraseCheckpointed
        ) {
            eraseAt(
                p
            );

            return;
        }

        if (activeItem) {
            const points =
                activeItem.points;

            const previous =
                points[
                    points.length -
                    1
                ];

            if (
                !previous ||
                Math.hypot(
                    p.x -
                        previous.x,
                    p.y -
                        previous.y
                ) >
                    0.75 /
                    board.view.zoom
            ) {
                points.push(
                    p
                );

                queueRender();
            }

            return;
        }

        if (previewItem) {
            previewItem.x2 =
                p.x;

            previewItem.y2 =
                p.y;

            queueRender();
        }
    }

    function onPointerUp(
        event
    ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        pointers.delete(
            event.pointerId
        );

        try {
            canvas.releasePointerCapture(
                event.pointerId
            );
        }
        catch (_) {}

        if (
            gesture?.type ===
                "pinch"
        ) {
            if (
                pointers.size <
                2
            ) {
                gesture = null;
            }

            saveSoon();
            return;
        }

        if (
            gesture?.type ===
                "pan"
        ) {
            gesture = null;
            saveSoon();
            return;
        }

        if (activeItem) {
            if (
                activeItem.points
                    .length >=
                1
            ) {
                board.items.push(
                    activeItem
                );
            }

            activeItem = null;

            saveSoon();
            queueRender();
        }

        if (previewItem) {
            board.items.push(
                previewItem
            );

            previewItem = null;

            saveSoon();
            queueRender();
        }

        eraseCheckpointed =
            false;
    }

    function onWheel(
        event
    ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const s =
            screenPoint(
                event.clientX,
                event.clientY
            );

        if (
            event.ctrlKey ||
            event.metaKey
        ) {
            const factor =
                Math.exp(
                    -event.deltaY *
                    0.002
                );

            zoomAtScreen(
                s.x,
                s.y,
                board.view.zoom *
                    factor
            );

            return;
        }

        board.view.tx -=
            event.deltaX;

        board.view.ty -=
            event.deltaY;

        saveSoon();
        queueRender();
    }

    function descriptorFor(
        element
    ) {
        return [
            element?.dataset?.tool,
            element?.dataset?.action,
            element?.getAttribute?.(
                "title"
            ),
            element?.getAttribute?.(
                "aria-label"
            ),
            element?.id,
            element?.textContent
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
    }

    function setMode(
        nextMode
    ) {
        mode =
            nextMode;

        updateHud();
    }

    async function clearBoard() {
        if (!board.items.length) {
            return;
        }

        const okay =
            window.confirm(
                "Clear the visible AP Canvas board?\n\nA recovery archive will be saved first."
            );

        if (!okay) {
            return;
        }

        await archiveBoard(
            "manual-clear"
        );

        checkpoint();

        board.items =
            [];

        saveSoon();
        queueRender();
    }

    function toolbarClick(
        event
    ) {
        const target =
            event.target?.closest?.(
                "button, [role='button']"
            );

        if (
            !target ||
            !target.closest(
                "#canvasPage"
            )
        ) {
            return;
        }

        if (
            target.closest(
                "#apCanvasMakeBeautiful"
            )
        ) {
            return;
        }

        const description =
            descriptorFor(
                target
            );

        if (
            target.matches(
                ".ap-wb-color"
            ) ||
            target.dataset?.color
        ) {
            const candidate =
                target.dataset?.color ||
                target.style
                    ?.backgroundColor ||
                getComputedStyle(
                    target
                ).backgroundColor;

            if (candidate) {
                color =
                    candidate;
            }

            return;
        }

        if (
            /undo/.test(
                description
            )
        ) {
            event.preventDefault();
            event.stopImmediatePropagation();
            undo();
            return;
        }

        if (
            /redo/.test(
                description
            )
        ) {
            event.preventDefault();
            event.stopImmediatePropagation();
            redo();
            return;
        }

        if (
            /clear|trash|delete all/.test(
                description
            )
        ) {
            event.preventDefault();
            event.stopImmediatePropagation();
            clearBoard();
            return;
        }

        if (
            /eras/.test(
                description
            )
        ) {
            setMode(
                "erase"
            );
            return;
        }

        if (
            /hand|pan|move canvas/.test(
                description
            )
        ) {
            setMode(
                "pan"
            );
            return;
        }

        if (
            /rectangle|square|rect/.test(
                description
            )
        ) {
            setMode(
                "rect"
            );
            return;
        }

        if (
            /circle|ellipse|oval/.test(
                description
            )
        ) {
            setMode(
                "ellipse"
            );
            return;
        }

        if (
            /\bline\b/.test(
                description
            )
        ) {
            setMode(
                "line"
            );
            return;
        }

        if (
            /\btext\b|\btype\b/.test(
                description
            )
        ) {
            setMode(
                "text"
            );
            return;
        }

        if (
            /pen|pencil|brush|draw/.test(
                description
            )
        ) {
            setMode(
                "pen"
            );
        }
    }

    function toolbarInput(
        event
    ) {
        const target =
            event.target;

        if (
            !target?.closest?.(
                "#canvasPage"
            )
        ) {
            return;
        }

        if (
            target.matches(
                "input[type='color']"
            )
        ) {
            color =
                target.value ||
                color;

            return;
        }

        if (
            target.matches(
                ".ap-wb-size, input[type='range']"
            )
        ) {
            const value =
                Number(
                    target.value
                );

            if (
                Number.isFinite(
                    value
                ) &&
                value > 0
            ) {
                lineWidth =
                    clamp(
                        value,
                        1,
                        80
                    );
            }
        }
    }

    function createHud() {
        document
            .getElementById(
                "apInfiniteCanvasHud"
            )
            ?.remove();

        hud =
            document.createElement(
                "div"
            );

        hud.id =
            "apInfiniteCanvasHud";

        hud.innerHTML = `
            <button
                type="button"
                class="ap-inf-brand"
                title="AP Infinite Canvas"
                aria-label="AP Infinite Canvas"
            >
                ∞
            </button>

            <button
                type="button"
                data-ap-inf="pan"
                title="Pan canvas"
                aria-label="Pan canvas"
            >
                ✋
            </button>

            <button
                type="button"
                data-ap-inf="out"
                title="Zoom out"
                aria-label="Zoom out"
            >
                −
            </button>

            <button
                type="button"
                class="ap-inf-zoom"
                data-ap-inf="reset-zoom"
                title="Reset zoom to 100%"
            >
                100%
            </button>

            <button
                type="button"
                data-ap-inf="in"
                title="Zoom in"
                aria-label="Zoom in"
            >
                +
            </button>

            <button
                type="button"
                data-ap-inf="home"
                title="Return to board origin"
                aria-label="Return to board origin"
            >
                ⌂
            </button>

            <span
                class="ap-inf-save"
                title="Canvas autosave status"
            >
                Saved
            </span>
        `;

        page.appendChild(
            hud
        );

        zoomLabel =
            hud.querySelector(
                ".ap-inf-zoom"
            );

        saveLabel =
            hud.querySelector(
                ".ap-inf-save"
            );

        hud.addEventListener(
            "click",
            event => {
                const button =
                    event.target.closest(
                        "button"
                    );

                if (!button) {
                    return;
                }

                const action =
                    button.dataset
                        .apInf;

                if (
                    action ===
                    "pan"
                ) {
                    setMode(
                        mode === "pan"
                            ? "pen"
                            : "pan"
                    );
                }

                else if (
                    action ===
                    "out"
                ) {
                    zoomCenter(
                        0.8
                    );
                }

                else if (
                    action ===
                    "in"
                ) {
                    zoomCenter(
                        1.25
                    );
                }

                else if (
                    action ===
                    "reset-zoom"
                ) {
                    const rect =
                        canvas.getBoundingClientRect();

                    zoomAtScreen(
                        rect.width / 2,
                        rect.height / 2,
                        1
                    );
                }

                else if (
                    action ===
                    "home"
                ) {
                    resetView();
                }
            }
        );

        updateHud();
    }

    // AP_INFINITE_CANVAS_V181
    // Reconnect the visible Whiteboard Pro history controls
    // to the new persistent vector history engine.
    function wireLegacyHistoryButtons() {
        const toolbar =
            document.querySelector(
                "#canvasPage .ap-wb-pro-toolbar"
            );

        if (!toolbar) {
            return false;
        }

        const buttons =
            Array.from(
                toolbar.querySelectorAll(
                    "button"
                )
            )
                .filter(button => {
                    const style =
                        getComputedStyle(
                            button
                        );

                    return (
                        style.display !==
                            "none" &&
                        style.visibility !==
                            "hidden"
                    );
                });

        if (buttons.length < 4) {
            return false;
        }

        let shareButton =
            toolbar.querySelector(
                ".ap-wb-share"
            );

        if (!shareButton) {
            shareButton =
                buttons.find(button =>
                    /share|export/.test(
                        descriptorFor(
                            button
                        )
                    )
                ) ||
                buttons[
                    buttons.length -
                    1
                ];
        }

        const shareIndex =
            buttons.indexOf(
                shareButton
            );

        if (shareIndex < 3) {
            return false;
        }

        let clearIndex =
            buttons.findIndex(button =>
                /clear|trash|delete all/.test(
                    descriptorFor(
                        button
                    )
                )
            );

        if (
            clearIndex < 2 ||
            clearIndex >=
                shareIndex
        ) {
            // Current AP toolbar order at the right edge is:
            // Undo, Redo, Clear, Share.
            clearIndex =
                shareIndex - 1;
        }

        const undoButton =
            buttons[
                clearIndex - 2
            ];

        const redoButton =
            buttons[
                clearIndex - 1
            ];

        if (
            !undoButton ||
            !redoButton
        ) {
            return false;
        }

        undoButton.dataset.action =
            "undo";

        redoButton.dataset.action =
            "redo";

        undoButton.dataset
            .apInfiniteHistory =
            "undo";

        redoButton.dataset
            .apInfiniteHistory =
            "redo";

        undoButton.setAttribute(
            "title",
            "Undo"
        );

        redoButton.setAttribute(
            "title",
            "Redo"
        );

        undoButton.setAttribute(
            "aria-label",
            "Undo"
        );

        redoButton.setAttribute(
            "aria-label",
            "Redo"
        );

        return true;
    }

    // Remove the three legacy pill-shaped controls that are
    // visually left underneath the floating Whiteboard Pro toolbar.
    // We identify them geometrically so this remains safe even if
    // their old generated class names change.
    function removeGhostUnderlayControls() {
        const toolbar =
            document.querySelector(
                "#canvasPage .ap-wb-pro-toolbar"
            );

        if (
            !toolbar ||
            !page
        ) {
            return 0;
        }

        const toolbarRect =
            toolbar.getBoundingClientRect();

        const candidates =
            Array.from(
                page.querySelectorAll(
                    "button, [role='button']"
                )
            )
                .filter(element => {
                    if (
                        element.closest(
                            ".ap-wb-pro-toolbar"
                        ) ||
                        element.closest(
                            "#apInfiniteCanvasHud"
                        ) ||
                        element.closest(
                            "#apCanvasMakeBeautiful"
                        )
                    ) {
                        return false;
                    }

                    const rect =
                        element.getBoundingClientRect();

                    if (
                        !rect.width ||
                        !rect.height
                    ) {
                        return false;
                    }

                    const horizontallyNearToolbar =
                        rect.right >=
                            toolbarRect.left &&
                        rect.left <=
                            toolbarRect.right;

                    const verticallyUnderToolbar =
                        rect.top >=
                            toolbarRect.bottom -
                                14 &&
                        rect.top <=
                            toolbarRect.bottom +
                                34;

                    const pillSized =
                        rect.width >= 54 &&
                        rect.width <= 190 &&
                        rect.height >= 18 &&
                        rect.height <= 52;

                    return (
                        horizontallyNearToolbar &&
                        verticallyUnderToolbar &&
                        pillSized
                    );
                })
                .slice(
                    0,
                    3
                );

        for (
            const element of
            candidates
        ) {
            element.dataset
                .apInfiniteGhostHidden =
                "true";

            element.style.setProperty(
                "display",
                "none",
                "important"
            );
        }

        return candidates.length;
    }

    function repairCanvasChrome() {
        wireLegacyHistoryButtons();
        removeGhostUnderlayControls();
    }
    function bindEvents() {
        canvas.style.touchAction =
            "none";

        canvas.addEventListener(
            "pointerdown",
            onPointerDown,
            {
                capture: true,
                passive: false
            }
        );

        canvas.addEventListener(
            "pointermove",
            onPointerMove,
            {
                capture: true,
                passive: false
            }
        );

        canvas.addEventListener(
            "pointerup",
            onPointerUp,
            {
                capture: true,
                passive: false
            }
        );

        canvas.addEventListener(
            "pointercancel",
            onPointerUp,
            {
                capture: true,
                passive: false
            }
        );

        canvas.addEventListener(
            "wheel",
            onWheel,
            {
                passive: false
            }
        );

        canvas.addEventListener(
            "contextmenu",
            event =>
                event.preventDefault()
        );

        document.addEventListener(
            "click",
            toolbarClick,
            true
        );

        document.addEventListener(
            "input",
            toolbarInput,
            true
        );

        window.addEventListener(
            "keydown",
            event => {
                const tag =
                    document.activeElement
                        ?.tagName
                        ?.toLowerCase();

                const editingText =
                    tag === "input" ||
                    tag === "textarea" ||
                    document.activeElement
                        ?.isContentEditable;

                if (
                    event.code ===
                        "Space" &&
                    !editingText
                ) {
                    spaceHeld =
                        true;

                    canvas.classList.add(
                        "ap-inf-space-pan"
                    );

                    event.preventDefault();
                }

                if (
                    !editingText &&
                    (
                        event.ctrlKey ||
                        event.metaKey
                    ) &&
                    event.key
                        .toLowerCase() ===
                        "z"
                ) {
                    event.preventDefault();

                    if (
                        event.shiftKey
                    ) {
                        redo();
                    }
                    else {
                        undo();
                    }
                }

                if (
                    !editingText &&
                    (
                        event.ctrlKey ||
                        event.metaKey
                    ) &&
                    event.key
                        .toLowerCase() ===
                        "y"
                ) {
                    event.preventDefault();
                    redo();
                }
            },
            true
        );

        window.addEventListener(
            "keyup",
            event => {
                if (
                    event.code ===
                    "Space"
                ) {
                    spaceHeld =
                        false;

                    canvas.classList.remove(
                        "ap-inf-space-pan"
                    );
                }
            },
            true
        );

        window.addEventListener(
            "resize",
            () => {
                resizeBoard();
                repairCanvasChrome();
            },
            {
                passive: true
            }
        );

        document.addEventListener(
            "visibilitychange",
            () => {
                if (
                    document.visibilityState ===
                    "hidden"
                ) {
                    saveNow();
                }
            }
        );

        canvas.addEventListener(
            "ap:canvas-beautified",
            event => {
                const src =
                    event.detail
                        ?.imageUrl;

                if (!src) {
                    return;
                }

                checkpoint();

                const rect =
                    canvas.getBoundingClientRect();

                const topLeft =
                    screenToWorld(
                        rect.width *
                            0.1,
                        rect.height *
                            0.1
                    );

                const bottomRight =
                    screenToWorld(
                        rect.width *
                            0.9,
                        rect.height *
                            0.9
                    );

                board.items.push({
                    id:
                        uid(
                            "image"
                        ),

                    type:
                        "image",

                    src,

                    x:
                        topLeft.x,

                    y:
                        topLeft.y,

                    w:
                        bottomRight.x -
                        topLeft.x,

                    h:
                        bottomRight.y -
                        topLeft.y
                });

                saveSoon();
                queueRender();
            }
        );
    }

    function snapshotLegacyCanvas(
        oldCanvas
    ) {
        try {
            const width =
                oldCanvas.width;

            const height =
                oldCanvas.height;

            if (
                !width ||
                !height
            ) {
                return null;
            }

            const oldCtx =
                oldCanvas.getContext(
                    "2d",
                    {
                        willReadFrequently:
                            true
                    }
                );

            if (!oldCtx) {
                return null;
            }

            const sampleX =
                Math.max(
                    1,
                    Math.floor(
                        width / 48
                    )
                );

            const sampleY =
                Math.max(
                    1,
                    Math.floor(
                        height / 48
                    )
                );

            const data =
                oldCtx.getImageData(
                    0,
                    0,
                    width,
                    height
                ).data;

            let ink =
                false;

            for (
                let y = 0;
                y < height &&
                    !ink;
                y += sampleY
            ) {
                for (
                    let x = 0;
                    x < width;
                    x += sampleX
                ) {
                    const i =
                        (
                            y *
                            width +
                            x
                        ) *
                        4;

                    const a =
                        data[
                            i + 3
                        ];

                    const r =
                        data[i];

                    const g =
                        data[
                            i + 1
                        ];

                    const b =
                        data[
                            i + 2
                        ];

                    if (
                        a > 30 &&
                        (
                            r < 235 ||
                            g < 235 ||
                            b < 235
                        )
                    ) {
                        ink =
                            true;
                        break;
                    }
                }
            }

            if (!ink) {
                return null;
            }

            return {
                src:
                    oldCanvas
                        .toDataURL(
                            "image/png"
                        ),

                cssWidth:
                    oldCanvas
                        .getBoundingClientRect()
                        .width,

                cssHeight:
                    oldCanvas
                        .getBoundingClientRect()
                        .height
            };
        }
        catch (_) {
            return null;
        }
    }

    async function init() {
        const oldCanvas =
            document.getElementById(
                "apCanvas"
            );

        page =
            document.getElementById(
                "canvasPage"
            );

        if (
            !oldCanvas ||
            !page
        ) {
            return;
        }

        shell =
            oldCanvas.closest(
                ".whiteboard-shell"
            ) ||
            oldCanvas.parentElement;

        if (!shell) {
            return;
        }

        const legacy =
            snapshotLegacyCanvas(
                oldCanvas
            );

        const replacement =
            oldCanvas.cloneNode(
                true
            );

        replacement.removeAttribute(
            "width"
        );

        replacement.removeAttribute(
            "height"
        );

        replacement.classList.add(
            "ap-infinite-canvas"
        );

        replacement.style.maxWidth =
            "none";

        replacement.style.maxHeight =
            "none";

        replacement.style.margin =
            "0";

        replacement.style.touchAction =
            "none";

        oldCanvas.replaceWith(
            replacement
        );

        canvas =
            replacement;

        ctx =
            canvas.getContext(
                "2d",
                {
                    alpha:
                        false,

                    desynchronized:
                        true
                }
            );

        if (!ctx) {
            return;
        }

        page.classList.add(
            "ap-infinite-board-active"
        );

        shell.classList.add(
            "ap-infinite-shell"
        );

        await loadBoard();

        resizeBoard();

        if (
            board.view.tx === 0 &&
            board.view.ty === 0
        ) {
            const rect =
                canvas.getBoundingClientRect();

            board.view.tx =
                rect.width / 2;

            board.view.ty =
                rect.height / 2;
        }

        if (
            legacy &&
            !board.items.length
        ) {
            const rect =
                canvas.getBoundingClientRect();

            const world =
                screenToWorld(
                    0,
                    0
                );

            board.items.push({
                id:
                    uid(
                        "legacy"
                    ),

                type:
                    "image",

                src:
                    legacy.src,

                x:
                    world.x,

                y:
                    world.y,

                w:
                    (
                        legacy.cssWidth ||
                        rect.width
                    ) /
                    board.view.zoom,

                h:
                    (
                        legacy.cssHeight ||
                        rect.height
                    ) /
                    board.view.zoom
            });

            saveSoon();
        }

        createHud();
        bindEvents();
        repairCanvasChrome();
        resizeBoard();
        queueRender();

        requestAnimationFrame(
            repairCanvasChrome
        );

        setTimeout(
            repairCanvasChrome,
            120
        );

        setTimeout(
            repairCanvasChrome,
            600
        );

        const resizeObserver =
            new ResizeObserver(
                () => {
                    resizeBoard();
                }
            );

        resizeObserver.observe(
            shell
        );

        window.APInfiniteCanvas = {
            version:
                "1.8.0",

            save:
                saveNow,

            resetView,

            undo,

            redo,

            setMode,

            status() {
                return {
                    items:
                        board.items
                            .length,

                    zoom:
                        board.view.zoom,

                    mode,

                    persistent:
                        "indexeddb",

                    minZoom:
                        MIN_ZOOM,

                    maxZoom:
                        MAX_ZOOM
                };
            },

            exportBoard() {
                return JSON.parse(
                    JSON.stringify(
                        board
                    )
                );
            }
        };

        console.log(
            "∞ AP SYNAPSE INFINITE CANVAS V1.8 READY"
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            () => {
                setTimeout(
                    init,
                    0
                );
            },
            {
                once: true
            }
        );
    }
    else {
        setTimeout(
            init,
            0
        );
    }
})();
// ============================================================
// AP_INFINITE_CANVAS_V182
// Exact viewport-bottom fitter.
// ============================================================

(() => {
    "use strict";

    if (window.__AP_INFINITE_CANVAS_V182__) {
        return;
    }

    window.__AP_INFINITE_CANVAS_V182__ = true;

    let frame = 0;

    function fitInfiniteCanvasToViewport() {
        const page =
            document.getElementById(
                "canvasPage"
            );

        const shell =
            page?.querySelector(
                ".whiteboard-shell.ap-infinite-shell"
            );

        const canvas =
            page?.querySelector(
                "#apCanvas.ap-infinite-canvas"
            );

        if (
            !page ||
            !shell ||
            !canvas
        ) {
            return false;
        }

        const pageRect =
            page.getBoundingClientRect();

        const shellRect =
            shell.getBoundingClientRect();

        const viewportHeight =
            Math.max(
                1,
                Number(
                    window.visualViewport
                        ?.height
                ) ||
                document.documentElement
                    .clientHeight ||
                window.innerHeight ||
                0
            );

        /*
         * Use actual viewport coordinates instead of old CSS
         * height rules. Give a tiny 2px breathing space so no
         * black strip appears from rounding.
         */
        const desiredHeight =
            Math.max(
                560,
                Math.ceil(
                    viewportHeight -
                    shellRect.top +
                    2
                )
            );

        shell.style.setProperty(
            "height",
            `${desiredHeight}px`,
            "important"
        );

        shell.style.setProperty(
            "min-height",
            `${desiredHeight}px`,
            "important"
        );

        shell.style.setProperty(
            "max-height",
            "none",
            "important"
        );

        canvas.style.setProperty(
            "height",
            `${desiredHeight}px`,
            "important"
        );

        canvas.style.setProperty(
            "min-height",
            `${desiredHeight}px`,
            "important"
        );

        canvas.style.setProperty(
            "max-height",
            "none",
            "important"
        );

        page.style.setProperty(
            "padding-bottom",
            "0",
            "important"
        );

        page.style.setProperty(
            "margin-bottom",
            "0",
            "important"
        );

        page.style.setProperty(
            "min-height",
            `${
                Math.max(
                    desiredHeight,
                    Math.ceil(
                        shellRect.top -
                        pageRect.top +
                        desiredHeight
                    )
                )
            }px`,
            "important"
        );

        /*
         * Infinite Canvas V1.8 internally resizes the backing
         * bitmap when its shell changes. Trigger a normal
         * browser resize so that renderer sees this exact size.
         */
        window.dispatchEvent(
            new CustomEvent(
                "ap:infinite-canvas-fit",
                {
                    detail: {
                        desiredHeight
                    }
                }
            )
        );

        return true;
    }

    function scheduleFit() {
        cancelAnimationFrame(
            frame
        );

        frame =
            requestAnimationFrame(
                () => {
                    fitInfiniteCanvasToViewport();
                }
            );
    }

    window.addEventListener(
        "resize",
        scheduleFit,
        {
            passive: true
        }
    );

    window.visualViewport
        ?.addEventListener(
            "resize",
            scheduleFit,
            {
                passive: true
            }
        );

    window.visualViewport
        ?.addEventListener(
            "scroll",
            scheduleFit,
            {
                passive: true
            }
        );

    document.addEventListener(
        "visibilitychange",
        () => {
            if (
                document.visibilityState ===
                "visible"
            ) {
                scheduleFit();
            }
        }
    );

    const observer =
        new MutationObserver(
            () => {
                if (
                    document.querySelector(
                        "#canvasPage #apCanvas.ap-infinite-canvas"
                    )
                ) {
                    scheduleFit();
                }
            }
        );

    observer.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true
        }
    );

    /*
     * Run after the original Whiteboard Pro CSS and all of the
     * UI repair scripts have had time to settle.
     */
    setTimeout(
        scheduleFit,
        0
    );

    setTimeout(
        scheduleFit,
        100
    );

    setTimeout(
        scheduleFit,
        350
    );

    setTimeout(
        scheduleFit,
        900
    );

    window.APInfiniteCanvasFit =
        {
            version:
                "1.8.2",

            fit:
                fitInfiniteCanvasToViewport
        };

    console.log(
        "∞ AP INFINITE CANVAS V1.8.2 VIEWPORT FIT READY"
    );
})();