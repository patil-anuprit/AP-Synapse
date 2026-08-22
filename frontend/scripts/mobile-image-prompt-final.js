/* ============================================================
   AP SYNAPSE — MOBILE IMAGE CREATION FINAL

   Replaces broken inline image helper with professional sheet.
   Existing image-generation sending remains untouched.
   ============================================================ */

(() => {
    "use strict";


    let sheet = null;


    function mobile() {

        return window.innerWidth <= 760;
    }


    function findInput() {

        const selectors = [

            "#messageInput",
            "#chatInput",
            "#userInput",

            'textarea[placeholder*="AP Synapse" i]',
            'input[placeholder*="AP Synapse" i]',

            ".composer textarea",
            ".composer input",

            ".chat-composer textarea",
            ".chat-composer input"
        ];


        for (const selector of selectors) {

            const input =
                document.querySelector(
                    selector
                );


            if (input) {
                return input;
            }
        }


        return [
            ...document.querySelectorAll(
                "textarea,input"
            )
        ].find(element => {

            const placeholder =
                (
                    element.placeholder ||
                    ""
                ).toLowerCase();


            return placeholder.includes(
                "synapse"
            );

        }) || null;
    }


    function semanticText(element) {

        return [

            element.id,
            element.className,

            element.getAttribute(
                "aria-label"
            ),

            element.getAttribute(
                "title"
            ),

            element.getAttribute(
                "data-action"
            ),

            element.getAttribute(
                "data-icon-action"
            ),

            element.getAttribute(
                "data-command"
            )

        ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    }


    function isImageButton(target) {

        const button =
            target.closest(
                "button,[role='button']"
            );


        if (!button) {
            return null;
        }


        /*
         * Never treat generated/chat response controls
         * as composer image button.
         */

        if (
            button.closest(
                ".message, .assistant-message, .user-message, .response-content"
            )
        ) {

            return null;
        }


        const semantics =
            semanticText(
                button
            );


        if (
            /image|photo|picture|gallery/.test(
                semantics
            )
        ) {

            return button;
        }


        /*
         * Existing icon-repair system may mark it semantically.
         */

        if (
            button.dataset?.apQuestionRepair ===
                "done" &&
            /image/.test(
                semantics
            )
        ) {

            return button;
        }


        return null;
    }


    function removeLegacyImageHelper() {

        const phrases = [

            "image generation is ready",
            "type something like",
            "create a futuristic",
            "draw a solar system"
        ];


        const hero =
            document.getElementById(
                "heroScreen"
            );


        if (!hero) {
            return;
        }


        [
            ...hero.querySelectorAll(
                "div,p,span,li,section"
            )
        ]
        .forEach(element => {

            const text =
                (
                    element.textContent ||
                    ""
                )
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();


            if (!text) {
                return;
            }


            const matches =
                phrases.some(
                    phrase =>
                        text.includes(
                            phrase
                        )
                );


            if (!matches) {
                return;
            }


            /*
             * Hide only the smallest matching helper element.
             * Never hide heroScreen itself.
             */

            if (
                element === hero ||
                element.classList.contains(
                    "hero-container"
                )
            ) {

                return;
            }


            element.classList.add(
                "ap-mobile-legacy-image-helper-hidden"
            );
        });
    }


    function buildSheet() {

        if (sheet) {
            return sheet;
        }


        sheet =
            document.createElement(
                "section"
            );


        sheet.id =
            "apMobileImageSheet";


        sheet.setAttribute(
            "aria-hidden",
            "true"
        );


        sheet.innerHTML = `
            <div class="ap-image-sheet-head">

                <div>
                    <span class="ap-image-sheet-kicker">
                        AP SYNAPSE VISUAL
                    </span>

                    <h3 class="ap-image-sheet-title">
                        Create an image
                    </h3>

                    <p class="ap-image-sheet-copy">
                        Describe what you want AP Synapse to create.
                    </p>
                </div>

                <button
                    type="button"
                    class="ap-image-sheet-close"
                    aria-label="Close image creator"
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M6 6l12 12M18 6L6 18"/>
                    </svg>
                </button>

            </div>

            <div class="ap-image-sheet-options">

                <button
                    type="button"
                    class="ap-image-prompt-option"
                    data-prompt="Create an image of a futuristic intelligent city at night"
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M4 20V9l5-4 4 4 3-2 4 3v10"/>
                        <path d="M8 20v-5h4v5M16 13h.01"/>
                    </svg>

                    <span>
                        Futuristic intelligent city
                    </span>
                </button>


                <button
                    type="button"
                    class="ap-image-prompt-option"
                    data-prompt="Create an image of a detailed solar system in deep space"
                >
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3"/>
                        <ellipse cx="12" cy="12" rx="9" ry="4"/>
                        <path d="M7 5l1 1M17 18l1 1"/>
                    </svg>

                    <span>
                        Detailed solar system
                    </span>
                </button>


                <button
                    type="button"
                    class="ap-image-prompt-option"
                    data-prompt="Create an image of a premium abstract neural intelligence network"
                >
                    <svg viewBox="0 0 24 24">
                        <circle cx="6" cy="7" r="2"/>
                        <circle cx="18" cy="6" r="2"/>
                        <circle cx="12" cy="17" r="2"/>
                        <path d="M8 8l8-1M7 9l4 6M17 8l-4 7"/>
                    </svg>

                    <span>
                        Abstract intelligence network
                    </span>
                </button>

            </div>

            <div class="ap-image-sheet-custom">
                Or type your own image description in the composer below.
            </div>
        `;


        document.body.appendChild(
            sheet
        );


        sheet
            .querySelector(
                ".ap-image-sheet-close"
            )
            .addEventListener(
                "click",
                closeSheet
            );


        sheet
            .querySelectorAll(
                ".ap-image-prompt-option"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const input =
                            findInput();


                        if (!input) {
                            return;
                        }


                        input.value =
                            button.dataset.prompt;


                        input.dispatchEvent(
                            new Event(
                                "input",
                                {
                                    bubbles:true
                                }
                            )
                        );


                        closeSheet();


                        requestAnimationFrame(
                            () => {

                                input.focus();


                                try {

                                    input.setSelectionRange(
                                        input.value.length,
                                        input.value.length
                                    );

                                } catch {}

                            }
                        );

                    }
                );
            });


        return sheet;
    }


    function openSheet() {

        if (!mobile()) {
            return;
        }


        removeLegacyImageHelper();


        const root =
            buildSheet();


        root.classList.add(
            "ap-open"
        );


        root.setAttribute(
            "aria-hidden",
            "false"
        );


        const input =
            findInput();


        if (
            input &&
            !input.value.trim()
        ) {

            input.placeholder =
                "Describe the image you want to create…";
        }


        console.log(
            "✅ AP SYNAPSE — MOBILE IMAGE CREATOR OPEN"
        );
    }


    function closeSheet() {

        if (!sheet) {
            return;
        }


        sheet.classList.remove(
            "ap-open"
        );


        sheet.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    /*
     * Capture phase is intentional.
     *
     * It prevents the OLD broken image-helper handler
     * from dumping content across the hero.
     */

    document.addEventListener(
        "click",
        event => {

            if (!mobile()) {
                return;
            }


            const target =
                event.target;


            if (!(target instanceof Element)) {
                return;
            }


            /*
             * IMPORTANT:
             * Controls INSIDE the image creator must use
             * their own handlers.
             *
             * Otherwise "ap-image-sheet-close" is mistaken
             * for the composer image button because its class
             * contains the word "image".
             */
            if (
                target.closest(
                    "#apMobileImageSheet"
                )
            ) {
                return;
            }


            const imageButton =
                isImageButton(
                    target
                );


            if (!imageButton) {
                return;
            }


            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();


            openSheet();

        },
        true
    );


    /*
     * If an older handler already created its helper
     * during startup, clean it once.
     */

    requestAnimationFrame(
        removeLegacyImageHelper
    );


    setTimeout(
        removeLegacyImageHelper,
        150
    );


    console.log(
        "✅ AP SYNAPSE — MOBILE IMAGE CREATOR READY"
    );

})();
