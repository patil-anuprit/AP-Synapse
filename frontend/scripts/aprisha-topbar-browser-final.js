(() => {

    "use strict";

    if (window.__AP_APRISHA_TOPBAR_BROWSER_FIX__) {
        return;
    }

    window.__AP_APRISHA_TOPBAR_BROWSER_FIX__ = true;


    function isMobile() {
        return window.innerWidth <= 768;
    }


    function isAndroidTWA() {

        /*
         * True Android Trusted Web Activity.
         * Normal Chrome and DevTools mobile emulation
         * will NOT pass this test.
         */

        return String(document.referrer || "")
            .startsWith("android-app://");

    }


    function openWebAprisha() {

        /*
         * Preferred existing AP Synapse Live Talk API.
         */

        if (
            window.AP_Synapse_LiveTalk &&
            typeof window.AP_Synapse_LiveTalk.start === "function"
        ) {

            window.AP_Synapse_LiveTalk.start();

            return true;
        }


        /*
         * Existing real Live Talk button fallback.
         */

        const liveTalkButton =
            document.getElementById("liveTalkBtn");


        if (liveTalkButton) {

            liveTalkButton.click();

            return true;
        }


        return false;
    }


    document.addEventListener(
        "click",

        function (event) {

            if (!isMobile()) {
                return;
            }


            const button =
                event.target.closest?.(
                    "#apDedicatedAprishaButton"
                );


            if (!button) {
                return;
            }


            /*
             * Installed Android TWA:
             *
             * Do NOT interfere.
             * Existing Aprisha native launcher continues
             * to use the Android presence layer.
             */

            if (isAndroidTWA()) {

                console.log(
                    "AP APRISHA TOPBAR -> NATIVE ANDROID"
                );

                return;
            }


            /*
             * Normal mobile browser / Chrome DevTools:
             *
             * Prevent apsynapse:// launch completely.
             */

            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();


            const opened =
                openWebAprisha();


            if (opened) {

                console.log(
                    "AP APRISHA TOPBAR -> WEB APRISHA"
                );

            }
            else {

                console.warn(
                    "AP Aprisha web interface is not currently available."
                );

            }

        },

        true
    );


    console.log(
        "AP SYNAPSE -> APRISHA TOPBAR BROWSER FIX READY"
    );

})();
