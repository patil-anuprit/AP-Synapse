/* ============================================================
   AP SYNAPSE — NOTIFICATION CENTER FINAL CONTROLLER
   ============================================================ */

(() => {
    "use strict";

    let scheduled = false;


    const normalize = value =>
        String(value || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();


    function ownText(element) {

        return [...element.childNodes]
            .filter(node =>
                node.nodeType === Node.TEXT_NODE
            )
            .map(node => node.textContent || "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
    }


    function leaves(root) {

        return [...root.querySelectorAll("*")]
            .filter(element => {

                const text =
                    ownText(element);

                return !!text;
            });
    }


    function findLeaf(root, text) {

        const wanted =
            normalize(text);

        return leaves(root)
            .find(element =>
                normalize(ownText(element)) ===
                wanted
            ) || null;
    }


    function findAllLeaves(root, text) {

        const wanted =
            normalize(text);

        return leaves(root)
            .filter(element =>
                normalize(ownText(element)) ===
                wanted
            );
    }


    /* ========================================================
       SEMANTIC CLASSES
       ======================================================== */

    function decorateHeader(root) {

        const kicker =
            findLeaf(
                root,
                "AP SYNAPSE"
            );


        const title =
            findLeaf(
                root,
                "Notifications"
            );


        const caught =
            findAllLeaves(
                root,
                "You're all caught up."
            );


        if (kicker) {

            kicker.classList.add(
                "ap-final-notification-kicker"
            );
        }


        if (title) {

            title.classList.add(
                "ap-final-notification-title"
            );


            /*
             * Find sensible header container.
             */
            let header =
                title.parentElement;


            if (
                header &&
                header !== root
            ) {

                header.classList.add(
                    "ap-final-notification-header"
                );
            }
        }


        /*
         * First occurrence is usually header subtitle.
         */
        if (caught[0]) {

            caught[0].classList.add(
                "ap-final-notification-subtitle"
            );
        }
    }


    function decorateActions(root) {

        const mark =
            findLeaf(
                root,
                "Mark all as read"
            );


        const clear =
            findLeaf(
                root,
                "Clear"
            );


        if (mark) {

            mark.classList.add(
                "ap-final-notification-action"
            );
        }


        if (clear) {

            clear.classList.add(
                "ap-final-notification-action"
            );
        }


        if (
            mark &&
            clear
        ) {

            const parent =
                mark.parentElement ===
                clear.parentElement
                    ? mark.parentElement
                    : null;


            parent?.classList.add(
                "ap-final-notification-actions"
            );
        }


        return {
            mark,
            clear
        };
    }


    function decorateEmptyState(root) {

        const caught =
            findAllLeaves(
                root,
                "You're all caught up."
            );


        /*
         * Last occurrence normally belongs to center empty state.
         */
        const emptyTitle =
            caught.length > 1
                ? caught[caught.length - 1]
                : caught[0];


        const emptyCopy =
            [...leaves(root)]
                .find(element =>

                    normalize(
                        ownText(element)
                    ).includes(
                        "important ap synapse activity will appear here"
                    )
                );


        if (!emptyTitle) {
            return null;
        }


        emptyTitle.classList.add(
            "ap-final-empty-title"
        );


        emptyCopy?.classList.add(
            "ap-final-empty-copy"
        );


        /*
         * Find their common compact container.
         */

        let state =
            emptyTitle.parentElement;


        if (
            emptyCopy &&
            state &&
            !state.contains(emptyCopy)
        ) {

            state =
                emptyCopy.parentElement;
        }


        if (
            state &&
            state !== root
        ) {

            state.classList.add(
                "ap-final-empty-state"
            );


            /*
             * Find existing check icon if present.
             */

            const candidates =
                [...state.querySelectorAll("*")];


            const icon =
                candidates.find(element => {

                    const text =
                        normalize(
                            element.textContent
                        );

                    const rect =
                        element.getBoundingClientRect();


                    return (
                        (
                            text === "✓" ||
                            text === "✔"
                        ) &&
                        rect.width <= 80
                    );
                });


            if (icon) {

                icon.classList.add(
                    "ap-final-empty-icon"
                );
            }
        }


        return state;
    }


    function decorateFooter(root) {

        const label =
            [...leaves(root)]
                .find(element =>

                    normalize(
                        ownText(element)
                    ).includes(
                        "ap synapse intelligence workspace"
                    )
                );


        const preferences =
            [...leaves(root)]
                .find(element =>

                    normalize(
                        ownText(element)
                    ).includes(
                        "notification preferences"
                    )
                );


        label?.classList.add(
            "ap-final-notification-footer-label"
        );


        preferences?.classList.add(
            "ap-final-notification-preferences"
        );


        if (
            label &&
            preferences
        ) {

            let footer =
                label.parentElement;


            if (
                footer &&
                !footer.contains(preferences)
            ) {

                footer =
                    preferences.parentElement;
            }


            footer?.classList.add(
                "ap-final-notification-footer"
            );
        }
    }


    /* ========================================================
       EMPTY / POPULATED STATE
       ======================================================== */

    function getNotificationItems(root) {

        const selectors = `
            .notification-item,
            .ap-notification-item,
            [data-notification-item]
        `;


        return [...root.querySelectorAll(selectors)]
            .filter(item => {

                const style =
                    getComputedStyle(item);

                return (
                    style.display !== "none" &&
                    style.visibility !== "hidden"
                );
            });
    }


    function applyState(
        root,
        actions,
        emptyState
    ) {

        const items =
            getNotificationItems(root);


        const isEmpty =
            items.length === 0 &&
            !!emptyState;


        root.classList.toggle(
            "ap-final-notification-empty",
            isEmpty
        );


        [
            actions.mark,
            actions.clear
        ]
        .filter(Boolean)
        .forEach(action => {

            action.classList.toggle(
                "ap-final-action-disabled",
                isEmpty
            );


            action.setAttribute(
                "aria-disabled",
                isEmpty
                    ? "true"
                    : "false"
            );
        });
    }


    /* ========================================================
       ACCESSIBILITY
       ======================================================== */

    function syncAccessibility(root) {

        const hidden =
            root.getAttribute(
                "aria-hidden"
            ) === "true";


        if (hidden) {

            if (
                root.contains(
                    document.activeElement
                )
            ) {

                document.activeElement?.blur?.();
            }


            try {
                root.inert = true;
            } catch {}

        } else {

            try {
                root.inert = false;
            } catch {}
        }
    }


    /* ========================================================
       FINAL REPAIR
       ======================================================== */

    function repair() {

        scheduled = false;


        const root =
            document.getElementById(
                "apSynapseNotificationCenter"
            );


        if (!root) {
            return;
        }


        root.classList.add(
            "ap-notification-final-ui"
        );


        decorateHeader(root);

        const actions =
            decorateActions(root);

        const emptyState =
            decorateEmptyState(root);


        decorateFooter(root);

        applyState(
            root,
            actions,
            emptyState
        );

        syncAccessibility(root);
    }


    function schedule() {

        if (scheduled) {
            return;
        }


        scheduled = true;


        requestAnimationFrame(() => {

            requestAnimationFrame(
                repair
            );

        });
    }


    document.addEventListener(
        "click",
        schedule,
        true
    );


    new MutationObserver(
        schedule
    ).observe(
        document.body,
        {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: [
                "class",
                "style",
                "aria-hidden"
            ]
        }
    );


    window.addEventListener(
        "resize",
        schedule,
        {
            passive: true
        }
    );


    schedule();


    console.log(
        "✅ AP SYNAPSE — NOTIFICATION CENTER FINAL READY"
    );

})();

/* ============================================================
   AP SYNAPSE — NOTIFICATION CLOSE FINAL
   ============================================================ */

(() => {
    "use strict";


    function closeNotifications(root) {

        if (!root) return;


        /*
         * Never hide a focused descendant.
         */
        if (
            root.contains(
                document.activeElement
            )
        ) {

            document.activeElement?.blur?.();
        }


        /*
         * Remove common open-state classes.
         */
        root.classList.remove(
            "open",
            "active",
            "visible",
            "show",
            "is-open"
        );


        /*
         * Accessibility state.
         */
        root.setAttribute(
            "aria-hidden",
            "true"
        );


        try {
            root.inert = true;
        } catch {}


        /*
         * Actual visual close.
         * Existing AP Synapse notification trigger
         * can display it again normally.
         */
        root.style.display =
            "none";


        console.log(
            "✅ AP SYNAPSE — NOTIFICATIONS CLOSED"
        );
    }


    function installNotificationClose() {

        const root =
            document.getElementById(
                "apSynapseNotificationCenter"
            );


        if (!root) return;


        let button =
            root.querySelector(
                ".ap-notification-close-final"
            );


        if (!button) {

            button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "ap-notification-close-final";


            button.setAttribute(
                "aria-label",
                "Close notifications"
            );


            button.setAttribute(
                "title",
                "Close"
            );


            button.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6L18 18"></path>
                    <path d="M18 6L6 18"></path>
                </svg>
            `;


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    closeNotifications(
                        root
                    );
                }
            );


            root.appendChild(
                button
            );
        }
    }


    function repairOpenState() {

        const root =
            document.getElementById(
                "apSynapseNotificationCenter"
            );


        if (!root) return;


        const style =
            getComputedStyle(root);


        const visible =
            style.display !== "none" &&
            style.visibility !== "hidden";


        if (visible) {

            root.setAttribute(
                "aria-hidden",
                "false"
            );


            try {
                root.inert = false;
            } catch {}
        }
    }


    function run() {

        installNotificationClose();
        repairOpenState();
    }


    run();


    document.addEventListener(
        "click",
        () => {

            requestAnimationFrame(
                run
            );

        },
        true
    );


    new MutationObserver(
        run
    ).observe(
        document.body,
        {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: [
                "style",
                "class",
                "aria-hidden"
            ]
        }
    );


    console.log(
        "✅ AP SYNAPSE — NOTIFICATION CLOSE READY"
    );

})();

