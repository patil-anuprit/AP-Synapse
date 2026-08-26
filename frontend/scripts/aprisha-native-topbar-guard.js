(() => {

    "use strict";

    if (window.__AP_APRISHA_NATIVE_TOPBAR_GUARD__) {
        return;
    }

    window.__AP_APRISHA_NATIVE_TOPBAR_GUARD__ = true;


    function runningInsideAndroidApp() {

        /*
         * Trusted Web Activity launched by the Android package.
         */

        if (
            String(document.referrer || "")
                .startsWith("android-app://")
        ) {
            return true;
        }


        /*
         * Standalone installed application mode.
         */

        if (
            window.matchMedia?.(
                "(display-mode: standalone)"
            )?.matches
        ) {
            return true;
        }


        return false;
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
             * REAL AP SYNAPSE ANDROID APP
             *
             * Do nothing here.
             * Allow the existing Aprisha controller to continue
             * and invoke:
             *
             * apsynapse://presence?start=1&source=topbar
             *
             * -> Android
             * -> PresenceSetupActivity
             * -> real Aprisha session.
             */

            if (runningInsideAndroidApp()) {

                console.log(
                    "AP APRISHA -> REAL ANDROID APRISHA"
                );

                return;
            }


            /*
             * NORMAL WEBSITE / DESKTOP DEVTOOLS
             *
             * There is no Android VoiceInteractionService here.
             * Prevent the custom-scheme error and do NOT substitute
             * Live Talk or another AP Synapse feature.
             */

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();


            console.log(
                "AP APRISHA -> NATIVE ANDROID APP REQUIRED"
            );

        },
        true
    );


    console.log(
        "AP SYNAPSE -> APRISHA NATIVE TOPBAR GUARD READY"
    );

})();
