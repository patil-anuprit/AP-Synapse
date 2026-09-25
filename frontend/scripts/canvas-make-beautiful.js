(() => {
    "use strict";

    const VERSION = "1.0.0";
    const BUTTON_ID =
        "apCanvasMakeBeautiful";

    const PAGE_SELECTOR =
        "#canvasPage";

    const CANVAS_SELECTOR =
        "#apCanvas";

    const API_BASE =
        (
            location.hostname === "localhost" ||
            location.hostname === "127.0.0.1"
        )
            ? "http://localhost:5000"
            : String(
                window.AP_BACKEND_URL ||
                window.API_BASE ||
                "https://api.ap-synapse.com"
            ).replace(/\/+$/, "");

    const styles = [
        ["auto", "Auto"],
        ["realistic", "Realistic"],
        ["storybook", "Storybook"],
        ["architecture", "Architecture"],
        ["3d", "3D"],
        ["watercolor", "Watercolor"],
        ["cartoon", "Cartoon"],
        ["fantasy", "Fantasy"]
    ];

    let activeStyle =
        "auto";

    let lastOriginalDataUrl =
        "";

    let lastResultUrl =
        "";

    function page() {
        return document.querySelector(
            PAGE_SELECTOR
        );
    }

    function canvas() {
        return document.querySelector(
            CANVAS_SELECTOR
        );
    }

    function toolbar() {
        const root = page();

        if (!root) return null;

        return (
            root.querySelector(
                ".whiteboard-toolbar"
            ) ||
            root.querySelector(
                ".canvas-toolbar"
            ) ||
            root.querySelector(
                ".toolbar"
            )
        );
    }

    function notify(message) {
        if (
            typeof window.showToast ===
            "function"
        ) {
            window.showToast(message);
            return;
        }

        console.log(
            "[AP Canvas]",
            message
        );
    }

    function canvasHasDrawing(
        source
    ) {
        try {
            const ctx =
                source.getContext(
                    "2d",
                    {
                        willReadFrequently:
                            true
                    }
                );

            const width =
                source.width;

            const height =
                source.height;

            if (
                !ctx ||
                !width ||
                !height
            ) {
                return false;
            }

            const stepX =
                Math.max(
                    1,
                    Math.floor(
                        width / 48
                    )
                );

            const stepY =
                Math.max(
                    1,
                    Math.floor(
                        height / 48
                    )
                );

            const data =
                ctx.getImageData(
                    0,
                    0,
                    width,
                    height
                ).data;

            let darkSamples = 0;

            for (
                let y = 0;
                y < height;
                y += stepY
            ) {
                for (
                    let x = 0;
                    x < width;
                    x += stepX
                ) {
                    const i =
                        (
                            y * width +
                            x
                        ) * 4;

                    const r =
                        data[i];

                    const g =
                        data[i + 1];

                    const b =
                        data[i + 2];

                    const a =
                        data[i + 3];

                    if (
                        a > 20 &&
                        (
                            r < 235 ||
                            g < 235 ||
                            b < 235
                        )
                    ) {
                        darkSamples++;

                        if (
                            darkSamples >= 2
                        ) {
                            return true;
                        }
                    }
                }
            }

            return false;
        }
        catch (_) {
            return true;
        }
    }

    function exportSketch() {
        const source =
            canvas();

        if (!source) {
            throw new Error(
                "Canvas drawing surface was not found."
            );
        }

        if (
            !canvasHasDrawing(
                source
            )
        ) {
            throw new Error(
                "Draw something on the canvas first."
            );
        }

        const maxSide =
            1280;

        const scale =
            Math.min(
                1,
                maxSide /
                    Math.max(
                        source.width,
                        source.height
                    )
            );

        const output =
            document.createElement(
                "canvas"
            );

        output.width =
            Math.max(
                1,
                Math.round(
                    source.width *
                    scale
                )
            );

        output.height =
            Math.max(
                1,
                Math.round(
                    source.height *
                    scale
                )
            );

        const ctx =
            output.getContext(
                "2d",
                {
                    alpha: false
                }
            );

        ctx.fillStyle =
            "#ffffff";

        ctx.fillRect(
            0,
            0,
            output.width,
            output.height
        );

        ctx.drawImage(
            source,
            0,
            0,
            output.width,
            output.height
        );

        return output.toDataURL(
            "image/png"
        );
    }

    function escapeHtml(value) {
        return String(
            value || ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    function closeDialog() {
        document
            .querySelector(
                ".ap-cmb-overlay"
            )
            ?.remove();
    }

    function makeStyleButtons() {
        return styles
            .map(
                ([value, label]) => `
                    <button
                        class="ap-cmb-style ${
                            value ===
                            activeStyle
                                ? "is-active"
                                : ""
                        }"
                        type="button"
                        data-style="${escapeHtml(
                            value
                        )}"
                    >
                        ${escapeHtml(
                            label
                        )}
                    </button>
                `
            )
            .join("");
    }

    function openDialog() {
        const source =
            canvas();

        if (!source) {
            notify(
                "Open Canvas first."
            );
            return;
        }

        closeDialog();

        const overlay =
            document.createElement(
                "div"
            );

        overlay.className =
            "ap-cmb-overlay";

        overlay.innerHTML = `
            <section
                class="ap-cmb-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="apCmbTitle"
            >
                <header class="ap-cmb-header">
                    <div>
                        <p class="ap-cmb-eyebrow">
                            AP Canvas Intelligence
                        </p>

                        <h2
                            class="ap-cmb-title"
                            id="apCmbTitle"
                        >
                            Make Beautiful
                        </h2>

                        <p class="ap-cmb-subtitle">
                            Turn your rough sketch into a polished,
                            colourful finished artwork while preserving
                            your original idea.
                        </p>
                    </div>

                    <button
                        class="ap-cmb-close"
                        type="button"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </header>

                <div class="ap-cmb-body">
                    <label class="ap-cmb-label">
                        Choose a style
                    </label>

                    <div class="ap-cmb-styles">
                        ${makeStyleButtons()}
                    </div>

                    <label
                        class="ap-cmb-label"
                        for="apCmbPrompt"
                    >
                        Describe the final look
                        <span
                            style="
                                opacity:.48;
                                font-weight:500;
                            "
                        >
                            — optional
                        </span>
                    </label>

                    <textarea
                        id="apCmbPrompt"
                        class="ap-cmb-prompt"
                        maxlength="1200"
                        placeholder="Example: A welcoming colourful house with flowers, warm sunlight, a beautiful garden and premium realistic detail."
                    ></textarea>

                    <div
                        class="ap-cmb-error"
                        id="apCmbError"
                    ></div>

                    <div
                        class="ap-cmb-progress"
                        id="apCmbProgress"
                    >
                        <div class="ap-cmb-progress-title">
                            Transforming your sketch…
                        </div>

                        <div class="ap-cmb-progress-sub">
                            AP Synapse is understanding the drawing,
                            preserving your idea and creating the final artwork.
                        </div>

                        <div class="ap-cmb-shimmer"></div>
                    </div>

                    <div
                        class="ap-cmb-result-grid"
                        id="apCmbResults"
                        hidden
                    >
                        <article class="ap-cmb-preview-card">
                            <div class="ap-cmb-preview-head">
                                <span>Before</span>
                                <span>Sketch</span>
                            </div>

                            <img
                                id="apCmbBefore"
                                alt="Original canvas sketch"
                            />
                        </article>

                        <article class="ap-cmb-preview-card">
                            <div class="ap-cmb-preview-head">
                                <span>After</span>
                                <span>Beautiful</span>
                            </div>

                            <img
                                id="apCmbAfter"
                                alt="Beautified canvas artwork"
                            />
                        </article>
                    </div>

                    <div class="ap-cmb-actions">
                        <button
                            class="ap-cmb-btn"
                            type="button"
                            data-action="cancel"
                        >
                            Cancel
                        </button>

                        <button
                            class="ap-cmb-btn"
                            type="button"
                            data-action="download"
                            hidden
                        >
                            Download
                        </button>

                        <button
                            class="ap-cmb-btn"
                            type="button"
                            data-action="again"
                            hidden
                        >
                            Try Again
                        </button>

                        <button
                            class="ap-cmb-btn primary"
                            type="button"
                            data-action="beautify"
                        >
                            ✦ Make Beautiful
                        </button>

                        <button
                            class="ap-cmb-btn primary"
                            type="button"
                            data-action="insert"
                            hidden
                        >
                            Use on Canvas
                        </button>
                    </div>
                </div>
            </section>
        `;

        document.body.appendChild(
            overlay
        );

        const close =
            () =>
                overlay.remove();

        overlay
            .querySelector(
                ".ap-cmb-close"
            )
            ?.addEventListener(
                "click",
                close
            );

        overlay
            .querySelector(
                '[data-action="cancel"]'
            )
            ?.addEventListener(
                "click",
                close
            );

        overlay.addEventListener(
            "mousedown",
            event => {
                if (
                    event.target ===
                    overlay
                ) {
                    close();
                }
            }
        );

        overlay
            .querySelectorAll(
                ".ap-cmb-style"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        activeStyle =
                            button.dataset
                                .style ||
                            "auto";

                        overlay
                            .querySelectorAll(
                                ".ap-cmb-style"
                            )
                            .forEach(
                                item =>
                                    item.classList
                                        .toggle(
                                            "is-active",
                                            item ===
                                                button
                                        )
                            );
                    }
                );
            });

        const beautifyButton =
            overlay.querySelector(
                '[data-action="beautify"]'
            );

        const insertButton =
            overlay.querySelector(
                '[data-action="insert"]'
            );

        const downloadButton =
            overlay.querySelector(
                '[data-action="download"]'
            );

        const againButton =
            overlay.querySelector(
                '[data-action="again"]'
            );

        const errorBox =
            overlay.querySelector(
                "#apCmbError"
            );

        const progress =
            overlay.querySelector(
                "#apCmbProgress"
            );

        const results =
            overlay.querySelector(
                "#apCmbResults"
            );

        async function generate() {
            try {
                errorBox.classList
                    .remove(
                        "is-visible"
                    );

                errorBox.textContent =
                    "";

                lastOriginalDataUrl =
                    exportSketch();

                const description =
                    overlay
                        .querySelector(
                            "#apCmbPrompt"
                        )
                        ?.value
                        ?.trim() ||
                    "";

                beautifyButton.disabled =
                    true;

                beautifyButton.textContent =
                    "Creating…";

                progress.classList.add(
                    "is-visible"
                );

                results.hidden =
                    true;

                insertButton.hidden =
                    true;

                downloadButton.hidden =
                    true;

                againButton.hidden =
                    true;

                const response =
                    await fetch(
                        `${API_BASE}/canvas/beautify`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    sketchDataUrl:
                                        lastOriginalDataUrl,
                                    style:
                                        activeStyle,
                                    description
                                })
                        }
                    );

                const raw =
                    await response.text();

                let data =
                    null;

                try {
                    data =
                        JSON.parse(
                            raw
                        );
                }
                catch (_) {
                    data = null;
                }

                if (
                    !response.ok ||
                    !data?.imageUrl
                ) {
                    throw new Error(
                        data?.error ||
                        raw ||
                        `Canvas Intelligence returned ${response.status}.`
                    );
                }

                lastResultUrl =
                    data.imageUrl;

                overlay.querySelector(
                    "#apCmbBefore"
                ).src =
                    lastOriginalDataUrl;

                overlay.querySelector(
                    "#apCmbAfter"
                ).src =
                    lastResultUrl;

                progress.classList
                    .remove(
                        "is-visible"
                    );

                results.hidden =
                    false;

                insertButton.hidden =
                    false;

                downloadButton.hidden =
                    false;

                againButton.hidden =
                    false;

                beautifyButton.hidden =
                    true;
            }
            catch (error) {
                console.error(
                    "AP Canvas Make Beautiful:",
                    error
                );

                progress.classList
                    .remove(
                        "is-visible"
                    );

                errorBox.textContent =
                    error?.message ||
                    "AP Synapse could not transform the sketch.";

                errorBox.classList.add(
                    "is-visible"
                );
            }
            finally {
                beautifyButton.disabled =
                    false;

                beautifyButton.textContent =
                    "✦ Make Beautiful";
            }
        }

        beautifyButton
            ?.addEventListener(
                "click",
                generate
            );

        againButton
            ?.addEventListener(
                "click",
                () => {
                    beautifyButton.hidden =
                        false;

                    insertButton.hidden =
                        true;

                    downloadButton.hidden =
                        true;

                    againButton.hidden =
                        true;

                    results.hidden =
                        true;

                    lastResultUrl =
                        "";

                    generate();
                }
            );

        downloadButton
            ?.addEventListener(
                "click",
                async () => {
                    if (
                        !lastResultUrl
                    ) {
                        return;
                    }

                    try {
                        const response =
                            await fetch(
                                lastResultUrl
                            );

                        const blob =
                            await response.blob();

                        const url =
                            URL.createObjectURL(
                                blob
                            );

                        const a =
                            document.createElement(
                                "a"
                            );

                        a.href =
                            url;

                        a.download =
                            "AP-Synapse-Canvas-Beautiful.png";

                        document.body
                            .appendChild(
                                a
                            );

                        a.click();
                        a.remove();

                        setTimeout(
                            () =>
                                URL.revokeObjectURL(
                                    url
                                ),
                            2500
                        );
                    }
                    catch (_) {
                        window.open(
                            lastResultUrl,
                            "_blank",
                            "noopener"
                        );
                    }
                }
            );

        insertButton
            ?.addEventListener(
                "click",
                async () => {
                    const target =
                        canvas();

                    if (
                        !target ||
                        !lastResultUrl
                    ) {
                        return;
                    }

                    insertButton.disabled =
                        true;

                    insertButton.textContent =
                        "Applying…";

                    try {
                        const img =
                            new Image();

                        img.crossOrigin =
                            "anonymous";

                        await new Promise(
                            (
                                resolve,
                                reject
                            ) => {
                                img.onload =
                                    resolve;

                                img.onerror =
                                    reject;

                                img.src =
                                    lastResultUrl;
                            }
                        );

                        const ctx =
                            target.getContext(
                                "2d"
                            );

                        ctx.save();

                        ctx.fillStyle =
                            "#ffffff";

                        ctx.fillRect(
                            0,
                            0,
                            target.width,
                            target.height
                        );

                        const sourceRatio =
                            img.width /
                            img.height;

                        const targetRatio =
                            target.width /
                            target.height;

                        let drawWidth =
                            target.width;

                        let drawHeight =
                            target.height;

                        let dx = 0;
                        let dy = 0;

                        if (
                            sourceRatio >
                            targetRatio
                        ) {
                            drawHeight =
                                target.width /
                                sourceRatio;

                            dy =
                                (
                                    target.height -
                                    drawHeight
                                ) / 2;
                        }
                        else {
                            drawWidth =
                                target.height *
                                sourceRatio;

                            dx =
                                (
                                    target.width -
                                    drawWidth
                                ) / 2;
                        }

                        ctx.drawImage(
                            img,
                            dx,
                            dy,
                            drawWidth,
                            drawHeight
                        );

                        ctx.restore();

                        target.dispatchEvent(
                            new CustomEvent(
                                "ap:canvas-beautified",
                                {
                                    bubbles:
                                        true,
                                    detail: {
                                        imageUrl:
                                            lastResultUrl,
                                        version:
                                            VERSION
                                    }
                                }
                            )
                        );

                        closeDialog();

                        notify(
                            "Beautiful result added to Canvas."
                        );
                    }
                    catch (error) {
                        console.error(
                            "Could not insert generated image:",
                            error
                        );

                        errorBox.textContent =
                            "The artwork was generated, but AP Synapse could not place it on the canvas. You can still download it.";

                        errorBox.classList.add(
                            "is-visible"
                        );
                    }
                    finally {
                        insertButton.disabled =
                            false;

                        insertButton.textContent =
                            "Use on Canvas";
                    }
                }
            );

        setTimeout(
            () =>
                overlay
                    .querySelector(
                        "#apCmbPrompt"
                    )
                    ?.focus(),
            80
        );
    }

    function makeButton() {
        const button =
            document.createElement(
                "button"
            );

        button.id =
            BUTTON_ID;

        button.type =
            "button";

        button.innerHTML = `
            <span class="ap-cmb-spark">
                ✦
            </span>
            <span>
                Make Beautiful
            </span>
        `;

        button.setAttribute(
            "aria-label",
            "Transform your canvas sketch into beautiful finished artwork"
        );

        button.addEventListener(
            "click",
            openDialog
        );

        return button;
    }

    function mount() {
        if (
            document.getElementById(
                BUTTON_ID
            )
        ) {
            return;
        }

        const root =
            page();

        if (!root) {
            return;
        }

        const button =
            makeButton();

        const bar =
            toolbar();

        if (bar) {
            bar.appendChild(
                button
            );
        }
        else {
            button.classList.add(
                "ap-cmb-floating"
            );

            if (
                getComputedStyle(
                    root
                ).position ===
                "static"
            ) {
                root.style.position =
                    "relative";
            }

            root.appendChild(
                button
            );
        }
    }

    function boot() {
        mount();

        const observer =
            new MutationObserver(
                mount
            );

        observer.observe(
            document.documentElement,
            {
                childList: true,
                subtree: true
            }
        );

        window.APCanvasBeautify = {
            version: VERSION,
            open: openDialog,
            mount,
            status() {
                return {
                    version: VERSION,
                    canvas:
                        Boolean(
                            canvas()
                        ),
                    button:
                        Boolean(
                            document.getElementById(
                                BUTTON_ID
                            )
                        ),
                    apiBase:
                        API_BASE
                };
            }
        };

        console.log(
            "✦ AP Canvas Make Beautiful ready"
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
})();