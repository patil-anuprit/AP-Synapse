(() => {
    "use strict";

    const selector =
        "#apSynapseNotificationCenter";


    function getNotificationCenter() {

        return document.querySelector(
            selector
        );
    }


    function releaseNotificationFocus() {

        const center =
            getNotificationCenter();

        if (!center) {
            return;
        }


        const active =
            document.activeElement;


        if (
            active &&
            center.contains(active)
        ) {

            active.blur();
        }
    }


    /*
     * IMPORTANT:
     * Run BEFORE existing click handlers.
     *
     * If the notification is about to close,
     * remove focus before its code applies
     * aria-hidden="true".
     */

    document.addEventListener(
        "pointerdown",
        function (event) {

            const center =
                getNotificationCenter();

            if (!center) {
                return;
            }


            const active =
                document.activeElement;


            if (
                !active ||
                !center.contains(active)
            ) {
                return;
            }


            const closeButton =
                event.target.closest(
                    ".popup-close"
                );


            const clickedOutside =
                !center.contains(
                    event.target
                );


            if (
                closeButton ||
                clickedOutside
            ) {

                active.blur();
            }

        },
        true
    );


    /*
     * Escape closing
     */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                releaseNotificationFocus();
            }

        },
        true
    );


    /*
     * Keep hidden notification UI non-focusable.
     * `inert` is the correct mechanism for this.
     */

    const observer =
        new MutationObserver(() => {

            const center =
                getNotificationCenter();

            if (!center) {
                return;
            }


            const hidden =
                center.getAttribute(
                    "aria-hidden"
                ) === "true";


            if (hidden) {

                releaseNotificationFocus();

                center.setAttribute(
                    "inert",
                    ""
                );

            } else {

                center.removeAttribute(
                    "inert"
                );
            }

        });


    function start() {

        const center =
            getNotificationCenter();

        if (!center) {
            return;
        }


        observer.observe(
            center,
            {
                attributes: true,
                attributeFilter: [
                    "aria-hidden"
                ]
            }
        );


        if (
            center.getAttribute(
                "aria-hidden"
            ) === "true"
        ) {

            center.setAttribute(
                "inert",
                ""
            );
        }


        console.log(
            "✅ AP SYNAPSE ACCESSIBILITY FOCUS FIX READY"
        );
    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            {
                once: true
            }
        );

    } else {

        start();
    }

})();