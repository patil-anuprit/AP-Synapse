(() => {

    "use strict";

    function initAPCodeStudioPro() {

        const page =
            document.getElementById(
                "codeStudioPage"
            );

        const input =
            document.getElementById(
                "codeStudioInput"
            );

        const output =
            document.getElementById(
                "codeStudioOutput"
            );


        if (
            !page ||
            !input ||
            !output
        ) {

            console.warn(
                "AP Code Studio Pro: required elements missing."
            );

            return;
        }


        if (
            page.dataset.apCodePro === "1"
        ) {

            return;
        }


        page.dataset.apCodePro = "1";


        /* =====================================================
           PRESERVE EXISTING ANALYZE BUTTON
           ===================================================== */

        const oldButtons =
            [...page.querySelectorAll("button")];


        const analyzeButton =
            oldButtons.find(button =>

                /analy/i.test(
                    button.textContent || ""
                )

            );


        /* =====================================================
           ROOT
           ===================================================== */

        const root =
            document.createElement(
                "section"
            );


        root.className =
            "ap-code-pro";


        root.innerHTML = `

            <header class="ap-code-header">

                <button
                    type="button"
                    class="ap-code-action ap-code-explorer-toggle"
                    aria-label="Project explorer"
                    title="Project Explorer"
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M4 6.5h6l2 2h8v10H4z"/>
                    </svg>
                </button>


                <div class="ap-code-brand">

                    <div class="ap-code-brand-mark">

                        <svg viewBox="0 0 24 24">
                            <path d="M8 8l-4 4 4 4"/>
                            <path d="M16 8l4 4-4 4"/>
                            <path d="M14 5l-4 14"/>
                        </svg>

                    </div>

                    <div class="ap-code-brand-copy">

                        <div class="ap-code-brand-title">
                            Code Studio
                        </div>

                        <div class="ap-code-brand-sub">
                            AP Synapse Development Workspace
                        </div>

                    </div>

                </div>


                <div class="ap-code-actions">

                    <button
                        type="button"
                        class="ap-code-action ap-code-preview-btn"
                        title="Preview project"
                        aria-label="Preview project"
                    >

                        <svg viewBox="0 0 24 24">
                            <path d="M8 5l11 7-11 7z"/>
                        </svg>

                        <span>Preview</span>

                    </button>


                    <button
                        type="button"
                        class="ap-code-action ap-code-ai-toggle"
                        title="Toggle AP Intelligence"
                        aria-label="Toggle AP Intelligence"
                    >

                        <svg viewBox="0 0 24 24">
                            <path d="M12 3v3"/>
                            <path d="M12 18v3"/>
                            <path d="M3 12h3"/>
                            <path d="M18 12h3"/>
                            <circle cx="12" cy="12" r="4"/>
                        </svg>

                        <span>Intelligence</span>

                    </button>

                </div>

            </header>


            <div class="ap-code-body">

                <div class="ap-code-backdrop"></div>


                <aside class="ap-code-explorer">

                    <div class="ap-code-section-head">
                        Explorer
                    </div>


                    <div class="ap-code-project">

                        <div class="ap-code-project-name">

                            <svg viewBox="0 0 24 24">
                                <path d="M3 6h7l2 2h9v10H3z"/>
                            </svg>

                            <span>
                                AP SYNAPSE PROJECT
                            </span>

                        </div>


                        <button
                            type="button"
                            class="ap-code-file active"
                            data-file="index.html"
                        >
                            <span class="ap-file-dot"></span>
                            index.html
                        </button>


                        <button
                            type="button"
                            class="ap-code-file"
                            data-file="styles.css"
                        >
                            <span class="ap-file-dot"></span>
                            styles.css
                        </button>


                        <button
                            type="button"
                            class="ap-code-file"
                            data-file="script.js"
                        >
                            <span class="ap-file-dot"></span>
                            script.js
                        </button>

                    </div>

                </aside>


                <main class="ap-code-editor-panel">

                    <div class="ap-code-tabs">

                        <button
                            type="button"
                            class="ap-code-tab active"
                            data-file="index.html"
                        >
                            <span class="ap-file-dot"></span>
                            index.html
                        </button>


                        <button
                            type="button"
                            class="ap-code-tab"
                            data-file="styles.css"
                        >
                            <span class="ap-file-dot"></span>
                            styles.css
                        </button>


                        <button
                            type="button"
                            class="ap-code-tab"
                            data-file="script.js"
                        >
                            <span class="ap-file-dot"></span>
                            script.js
                        </button>

                    </div>


                    <div class="ap-code-editor-host">

                        <div class="ap-code-lines">
                            1
                        </div>

                    </div>


                    <div class="ap-code-preview">

                        <div class="ap-code-preview-head">

                            <span>
                                Project Preview
                            </span>

                            <button
                                type="button"
                                class="ap-code-preview-close"
                                aria-label="Close preview"
                            >
                                ×
                            </button>

                        </div>

                        <iframe
                            sandbox="allow-scripts"
                            title="AP Synapse project preview"
                        ></iframe>

                    </div>

                </main>


                <aside class="ap-code-ai">

                    <div class="ap-code-ai-head">

                        <span class="ap-code-ai-star">
                            ✦
                        </span>

                        <span>
                            AP Intelligence
                        </span>

                        <span class="ap-code-live"></span>

                    </div>


                    <div class="ap-code-ai-content"></div>

                </aside>

            </div>


            <footer class="ap-code-status">

                <span class="ap-code-status-file">
                    index.html
                </span>

                <span class="ap-code-status-lines">
                    Ln 1
                </span>

                <span class="ap-code-status-chars">
                    0 characters
                </span>

                <span>
                    UTF-8
                </span>

                <span class="ap-code-status-live">
                    AP Intelligence Ready
                </span>

            </footer>

        `;


        page.appendChild(root);


        /* =====================================================
           MOVE EXISTING WORKING ELEMENTS
           NOT COPIES
           ===================================================== */

        const editorHost =
            root.querySelector(
                ".ap-code-editor-host"
            );


        const aiContent =
            root.querySelector(
                ".ap-code-ai-content"
            );


        editorHost.appendChild(
            input
        );


        aiContent.appendChild(
            output
        );


        input.classList.add(
            "ap-code-input-pro"
        );


        output.classList.add(
            "ap-code-output-pro"
        );


        /*
         * Move the EXISTING Analyze button,
         * therefore its existing listener continues working.
         */

        if (analyzeButton) {

            analyzeButton.classList.add(
                "ap-code-analyze"
            );


            const actions =
                root.querySelector(
                    ".ap-code-actions"
                );


            actions.appendChild(
                analyzeButton
            );
        }


        page.classList.add(
            "ap-code-pro-ready"
        );


        /* =====================================================
           FILE SYSTEM — LIGHTWEIGHT LOCAL WORKSPACE
           ===================================================== */

        const STORAGE_KEY =
            "ap-synapse-code-studio-v1";


        let saved = null;


        try {

            saved =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    )
                );

        } catch (_) {

            saved = null;
        }


        const files = {

            "index.html":
                saved?.["index.html"] ??
                input.value ??
                "",

            "styles.css":
                saved?.["styles.css"] ??
                "",

            "script.js":
                saved?.["script.js"] ??
                ""

        };


        let activeFile =
            "index.html";


        input.value =
            files[activeFile];


        function saveFiles() {

            files[activeFile] =
                input.value;


            try {

                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(files)
                );

            } catch (_) {
                // Storage unavailable — editor still works.
            }
        }


        function switchFile(fileName) {

            if (!files.hasOwnProperty(fileName)) {
                return;
            }


            saveFiles();


            activeFile =
                fileName;


            input.value =
                files[fileName];


            root.querySelectorAll(
                "[data-file]"
            )
            .forEach(element => {

                element.classList.toggle(
                    "active",
                    element.dataset.file === fileName
                );

            });


            root.querySelector(
                ".ap-code-status-file"
            ).textContent =
                fileName;


            updateEditorMeta();


            input.focus();


            if (
                window.innerWidth <= 760
            ) {

                root.classList.remove(
                    "ap-explorer-open"
                );
            }
        }


        root.querySelectorAll(
            "[data-file]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    switchFile(
                        button.dataset.file
                    );

                }
            );

        });


        /* =====================================================
           LINE NUMBERS / STATUS
           ===================================================== */

        const lines =
            root.querySelector(
                ".ap-code-lines"
            );


        const lineStatus =
            root.querySelector(
                ".ap-code-status-lines"
            );


        const charStatus =
            root.querySelector(
                ".ap-code-status-chars"
            );


        function updateEditorMeta() {

            const value =
                input.value;


            const count =
                Math.max(
                    1,
                    value.split("\n").length
                );


            let numbers = "";


            for (
                let i = 1;
                i <= count;
                i++
            ) {

                numbers +=
                    `${i}${
                        i === count
                            ? ""
                            : "\n"
                    }`;
            }


            lines.textContent =
                numbers;


            lineStatus.textContent =
                `Ln ${count}`;


            charStatus.textContent =
                `${value.length} characters`;


            files[activeFile] =
                value;
        }


        input.addEventListener(
            "input",
            () => {

                updateEditorMeta();

                saveFiles();

            }
        );


        input.addEventListener(
            "scroll",
            () => {

                lines.scrollTop =
                    input.scrollTop;

            },
            {
                passive: true
            }
        );


        /* =====================================================
           TAB KEY IN EDITOR
           ===================================================== */

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Tab"
                ) {

                    event.preventDefault();


                    const start =
                        input.selectionStart;


                    const end =
                        input.selectionEnd;


                    input.setRangeText(
                        "    ",
                        start,
                        end,
                        "end"
                    );


                    input.dispatchEvent(
                        new Event(
                            "input",
                            {
                                bubbles: true
                            }
                        )
                    );
                }


                /*
                 * Ctrl + Enter =
                 * existing AP Synapse Analyze
                 */
                if (
                    event.ctrlKey &&
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    saveFiles();

                    analyzeButton?.click();
                }


                /*
                 * Ctrl + S =
                 * local workspace save
                 */
                if (
                    event.ctrlKey &&
                    event.key.toLowerCase() === "s"
                ) {

                    event.preventDefault();

                    saveFiles();


                    const live =
                        root.querySelector(
                            ".ap-code-status-live"
                        );


                    live.textContent =
                        "Saved";


                    setTimeout(
                        () => {

                            live.textContent =
                                "AP Intelligence Ready";

                        },
                        1000
                    );
                }

            }
        );


        /* =====================================================
           SAFE FRONT-END PREVIEW
           ===================================================== */

        const preview =
            root.querySelector(
                ".ap-code-preview"
            );


        const iframe =
            preview.querySelector(
                "iframe"
            );

        const codeBody =
            root.querySelector(
                ".ap-code-body"
            );


        /*
         * Preview belongs to the complete IDE workspace,
         * not only inside the editor panel.
         */
        /*
         * Preview belongs to the FULL Code Studio,
         * not inside editor/body panels.
         */
        root.appendChild(
           preview
        );


        function openPreview() {

            saveFiles();


            let html =
                files["index.html"];


            const css =
                files["styles.css"];


            const js =
                files["script.js"]
                    .replace(
                        /<\/script/gi,
                        "<\\/script"
                    );


            if (!html.trim()) {

                html = `
                    <!doctype html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                    </head>
                    <body></body>
                    </html>
                `;
            }


            if (
                /<\/head>/i.test(html)
            ) {

                html =
                    html.replace(
                        /<\/head>/i,
                        `<style>${css}</style></head>`
                    );

            } else {

                html =
                    `<style>${css}</style>${html}`;
            }


            if (
                /<\/body>/i.test(html)
            ) {

                html =
                    html.replace(
                        /<\/body>/i,
                        `<script>${js}<\/script></body>`
                    );

            } else {

                html +=
                    `<script>${js}<\/script>`;
            }


            /*
             * Make preview behave like a real standalone web page.
             */

            if (
               !/<meta[^>]+name=["']viewport["']/i.test(html)
            ) {

               if (/<head[^>]*>/i.test(html)) {

                  html = html.replace(
                      /<head([^>]*)>/i,
                      `<head$1>
                          <meta
                              name="viewport"
                              content="width=device-width, initial-scale=1.0"
                           >
                       `
                   );

                } else {

                   html =
                       `
                       <!doctype html>

                       <html>

                       <head>

                          <meta charset="UTF-8">

                          <meta
                              name="viewport"
                              content="width=device-width, initial-scale=1.0"
                           >

                       </head>

                       <body>

                           ${html}

                       </body>

                       </html>
                       `;
               }
            }


            iframe.srcdoc =
                html;


            preview.classList.add(
                "open"
            );
        }


        root.querySelector(
            ".ap-code-preview-btn"
        )
        .addEventListener(
            "click",
            openPreview
        );


        root.querySelector(
            ".ap-code-preview-close"
        )
        .addEventListener(
            "click",
            () => {

                preview.classList.remove(
                    "open"
                );

            }
        );


        /* =====================================================
           MOBILE EXPLORER
           ===================================================== */

        root.querySelector(
            ".ap-code-explorer-toggle"
        )
        .addEventListener(
            "click",
            () => {

                root.classList.toggle(
                    "ap-explorer-open"
                );

            }
        );


        root.querySelector(
            ".ap-code-backdrop"
        )
        .addEventListener(
            "click",
            () => {

                root.classList.remove(
                    "ap-explorer-open"
                );

            }
        );


        /* =====================================================
           INTELLIGENCE COLLAPSE
           ===================================================== */

        root.querySelector(
            ".ap-code-ai-toggle"
        )
        .addEventListener(
            "click",
            () => {

                root.classList.toggle(
                    "ap-ai-collapsed"
                );

            }
        );


        /* =====================================================
           EXACT AVAILABLE HEIGHT
           ===================================================== */

        function fitCodeStudio() {

            if (
                getComputedStyle(page)
                    .display === "none"
            ) {

                return;
            }


            const rect =
                page.getBoundingClientRect();


            if (
                rect.width < 200 ||
                rect.top < 20
            ) {

                return;
            }


            const available =
                Math.max(
                    420,
                    Math.floor(
                        window.innerHeight -
                        rect.top -
                        8
                    )
                );


            root.style.height =
                `${available}px`;
        }


        window.addEventListener(
            "resize",
            fitCodeStudio,
            {
                passive: true
            }
        );


        const pageObserver =
            new MutationObserver(
                fitCodeStudio
            );


        pageObserver.observe(
            page,
            {
                attributes: true,
                attributeFilter: [
                    "class",
                    "style",
                    "hidden"
                ]
            }
        );


        const bodyObserver =
            new MutationObserver(
                fitCodeStudio
            );


        bodyObserver.observe(
            document.body,
            {
                attributes: true,
                attributeFilter: [
                    "data-page"
                ]
            }
        );


        requestAnimationFrame(() => {

            requestAnimationFrame(
                fitCodeStudio
            );

        });


        setTimeout(
            fitCodeStudio,
            150
        );


        updateEditorMeta();


        console.log(
            "⚡ AP SYNAPSE CODE STUDIO PRO ACTIVE"
        );
    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initAPCodeStudioPro,
            {
                once: true
            }
        );

    } else {

        initAPCodeStudioPro();
    }

})();