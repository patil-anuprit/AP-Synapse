(() => {

    "use strict";

    if (window.__AP_APRISHA_TOPBAR_FINAL__) {
        return;
    }

    window.__AP_APRISHA_TOPBAR_FINAL__ = true;


    function isAndroidTWA() {

        return String(
            document.referrer || ""
        ).startsWith(
            "android-app://"
        );

    }


    document.addEventListener(
        "click",

        event => {

            const button =
                event.target.closest?.(
                    "#apDedicatedAprishaButton"
                );


            if (!button) {
                return;
            }


            /*
             * Installed Android AP Synapse:
             * preserve the existing native Aprisha flow.
             */

            if (isAndroidTWA()) {

                console.log(
                    "AP APRISHA TOPBAR -> NATIVE"
                );

                return;
            }


            /*
             * Normal browser / PWA / DevTools:
             * prevent the controller from trying apsynapse://.
             */

            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();


            if (
                window.Aprisha &&
                typeof window.Aprisha.open === "function"
            ) {

                /*
                 * TRUE = webOnly.
                 *
                 * This is the REAL Aprisha controller's own
                 * browser interface — NOT Live Talk.
                 */

                window.Aprisha.open(
                    true
                );


                console.log(
                    "AP APRISHA TOPBAR -> REAL WEB APRISHA"
                );

                return;

            }


            console.warn(
                "AP Aprisha controller is not ready."
            );

        },

        true
    );


    console.log(
        "AP SYNAPSE -> APRISHA TOPBAR FINAL READY"
    );

})();
