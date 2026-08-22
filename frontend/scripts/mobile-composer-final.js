/* ============================================================
   AP SYNAPSE — MOBILE COMPOSER FINAL

   Behaviour:
   - tap send arrow -> keyboard closes
   - keyboard Go/Send/Enter -> keyboard closes
   - Shift+Enter remains available where supported
   - send button remains visible on iOS
   ============================================================ */

(() => {
    "use strict";


    function mobile() {

        return (
            window.matchMedia(
                "(max-width: 760px)"
            ).matches
        );
    }


    /* ========================================================
       FIND THE REAL AP SYNAPSE INPUT
       ======================================================== */

    function findInput() {

        /*
         * Semantic selectors first.
         */

        const selectors = [

            '#messageInput',
            '#chatInput',
            '#userInput',

            'textarea[placeholder*="Ask AP Synapse" i]',
            'input[placeholder*="Ask AP Synapse" i]',

            '.chat-input textarea',
            '.chat-input input',

            '.composer textarea',
            '.composer input',

            '.chat-composer textarea',
            '.chat-composer input'
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


        /*
         * Final safe fallback:
         * locate input from its actual visible placeholder.
         */

        return [
            ...document.querySelectorAll(
                "textarea,input"
            )
        ].find(element => {

            const placeholder =
                (
                    element.getAttribute(
                        "placeholder"
                    ) || ""
                ).toLowerCase();


            return (
                placeholder.includes(
                    "ap synapse"
                )
            );

        }) || null;
    }


    /* ========================================================
       FIND COMPOSER
       ======================================================== */

    function findComposer(input) {

        if (!input) {
            return null;
        }


        const known =
            input.closest(`
                .composer,
                .chat-composer,
                .composer-shell,
                .composer-container,
                .chat-input-container,
                .input-container,
                .message-input-container,
                .input-bar
            `);


        if (known) {
            return known;
        }


        /*
         * Walk upward until we find the input's
         * surrounding container containing buttons.
         */

        let element =
            input.parentElement;


        for (
            let i = 0;
            element && i < 6;
            i++,
            element = element.parentElement
        ) {

            if (
                element.querySelector(
                    "button"
                )
            ) {

                return element;
            }
        }


        return input.parentElement;
    }


    /* ========================================================
       FIND REAL SEND BUTTON
       ======================================================== */

    function findSend(composer) {

        if (!composer) {
            return null;
        }


        const selectors = [

            '#sendBtn',
            '#sendButton',
            '#sendMessageBtn',

            '.send-btn',
            '.send-button',
            '.send-message',

            '[data-action="send"]',
            '[data-command="send"]',

            '[aria-label*="send" i]',
            '[title*="send" i]'
        ];


        for (const selector of selectors) {

            const button =
                composer.querySelector(
                    selector
                );


            if (button) {
                return button;
            }
        }


        /*
         * Detect the visible arrow/send control.
         */

        const buttons =
            [...composer.querySelectorAll(
                "button,[role='button']"
            )];


        const semantic =
            buttons.find(button => {

                const metadata = [

                    button.id,
                    button.className,

                    button.getAttribute(
                        "aria-label"
                    ),

                    button.getAttribute(
                        "title"
                    ),

                    button.getAttribute(
                        "data-action"
                    )

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


                return (
                    /send|submit/.test(
                        metadata
                    )
                );

            });


        if (semantic) {
            return semantic;
        }


        /*
         * Your send arrow is normally the right-most
         * composer button.
         */

        return buttons
            .filter(button => {

                const rect =
                    button.getBoundingClientRect();


                return (
                    rect.width > 25 &&
                    rect.height > 25
                );

            })
            .sort((a, b) => {

                return (
                    b.getBoundingClientRect().right -
                    a.getBoundingClientRect().right
                );

            })[0] || null;
    }


    /* ========================================================
       KEYBOARD DISMISS
       ======================================================== */

    function dismissKeyboard(input) {

        if (!mobile()) {
            return;
        }


        const active =
            document.activeElement;


        if (
            active === input ||
            active instanceof HTMLInputElement ||
            active instanceof HTMLTextAreaElement
        ) {

            /*
             * Delay slightly so AP Synapse's existing
             * send handler receives the original event first.
             */

            requestAnimationFrame(() => {

                try {
                    active.blur();
                }
                catch {}


                try {
                    input.blur();
                }
                catch {}


                /*
                 * iOS Safari sometimes keeps the visual
                 * viewport raised for one frame.
                 */

                setTimeout(() => {

                    try {
                        input.blur();
                    }
                    catch {}

                }, 40);

            });
        }
    }


    /* ========================================================
       INSTALL
       ======================================================== */

    function install() {

        if (!mobile()) {
            return;
        }


        const input =
            findInput();


        if (!input) {
            return;
        }


        const composer =
            findComposer(
                input
            );


        const send =
            findSend(
                composer
            );


        input.classList.add(
            "ap-mobile-chat-input-final"
        );


        input.setAttribute(
            "enterkeyhint",
            "send"
        );


        input.setAttribute(
            "autocomplete",
            "off"
        );


        if (composer) {

            composer.classList.add(
                "ap-mobile-composer-final"
            );
        }


        if (send) {

            send.classList.add(
                "ap-mobile-send-final"
            );


            send.setAttribute(
                "aria-label",
                send.getAttribute(
                    "aria-label"
                ) || "Send message"
            );


            /*
             * Send button:
             * existing AP Synapse handler performs sending;
             * this controller only closes keyboard.
             */

            if (
                send.dataset.apKeyboardDismiss !==
                    "true"
            ) {

                send.dataset.apKeyboardDismiss =
                    "true";


                send.addEventListener(
                    "click",
                    () => {

                        dismissKeyboard(
                            input
                        );

                    },
                    false
                );
            }
        }


        /* ----------------------------------------------------
           MOBILE KEYBOARD GO / SEND / ENTER
           ---------------------------------------------------- */

        if (
            input.dataset.apKeyboardDismiss !==
                "true"
        ) {

            input.dataset.apKeyboardDismiss =
                "true";


            input.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key !== "Enter"
                    ) {
                        return;
                    }


                    /*
                     * Preserve Shift+Enter newline.
                     */

                    if (
                        event.shiftKey
                    ) {
                        return;
                    }


                    /*
                     * DO NOT preventDefault.
                     * Existing chat.js still owns sending.
                     */

                    setTimeout(
                        () => {

                            dismissKeyboard(
                                input
                            );

                        },
                        0
                    );

                },
                false
            );
        }


        /* ----------------------------------------------------
           FORM SUBMIT FALLBACK
           ---------------------------------------------------- */

        const form =
            input.closest(
                "form"
            );


        if (
            form &&
            form.dataset.apKeyboardDismiss !==
                "true"
        ) {

            form.dataset.apKeyboardDismiss =
                "true";


            form.addEventListener(
                "submit",
                () => {

                    dismissKeyboard(
                        input
                    );

                },
                false
            );
        }


        console.log(
            "✅ AP SYNAPSE — MOBILE KEYBOARD/SEND READY",
            {
                input,
                composer,
                send
            }
        );
    }


    /* ========================================================
       START
       ======================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            install,
            {
                once:true
            }
        );

    } else {

        install();
    }


    /*
     * Finite refreshes for dynamic workspace navigation.
     */

    document.addEventListener(
        "focusin",
        event => {

            if (
                mobile() &&
                (
                    event.target instanceof
                        HTMLInputElement ||

                    event.target instanceof
                        HTMLTextAreaElement
                )
            ) {

                install();
            }

        },
        true
    );


    window.addEventListener(
        "resize",
        install,
        {
            passive:true
        }
    );


    /*
     * iPhone keyboard changes visualViewport height
     * without always firing normal window resize.
     */

    if (
        window.visualViewport
    ) {

        window.visualViewport.addEventListener(
            "resize",
            install,
            {
                passive:true
            }
        );
    }


    console.log(
        "✅ AP SYNAPSE — MOBILE COMPOSER CONTROLLER ACTIVE"
    );

})();
