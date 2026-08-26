(() => {

    "use strict";

    if (window.__AP_PERSONALIZATION_SIDEBAR_FINAL__) {
        return;
    }

    window.__AP_PERSONALIZATION_SIDEBAR_FINAL__ = true;


    /* ========================================================
       ICON
       ======================================================== */

    const PERSONALIZATION_ICON = `
        <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round">

            <circle
                cx="8.5"
                cy="8"
                r="3">
            </circle>

            <path
                d="M3.5 18c.7-3.1 2.6-4.8 5-4.8s4.2 1.7 5 4.8">
            </path>

            <path d="M17.5 5v4"></path>
            <path d="M15.5 7h4"></path>

            <path d="M17.5 13.5v3"></path>
            <path d="M16 15h3"></path>

        </svg>
    `;


    /* ========================================================
       OPEN PERSONALIZATION DIRECTLY
       ======================================================== */

    async function openPersonalization(event) {

        event?.preventDefault?.();
        event?.stopPropagation?.();


        /*
         * Use the existing Profile system.
         * We do NOT create a duplicate modal/page.
         */

        const profileControl =
            document.getElementById(
                "profileSidebarBtn"
            ) ||
            document.getElementById(
                "profileBtn"
            ) ||
            document.getElementById(
                "apRailProfile"
            );


        if (profileControl) {

            profileControl.click();

        }


        /*
         * Give the existing Profile controller enough time
         * to expose the real profile sheet.
         */

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    130
                )
        );


        try {

            await window
                .AP_PERSONALIZATION
                ?.load?.();

        }
        catch {}


        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    80
                )
        );


        const panel =
            document.getElementById(
                "apPersonalizationPanel"
            );


        if (!panel) {

            console.warn(
                "AP Synapse Personalization panel not available."
            );

            return;

        }


        panel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        /*
         * Premium temporary focus treatment.
         */

        panel.classList.add(
            "ap-personalization-direct-focus"
        );


        setTimeout(
            () => {

                panel.classList.remove(
                    "ap-personalization-direct-focus"
                );

            },
            1500
        );

    }


    /* ========================================================
       FULL SIDEBAR BUTTON
       Settings
       Personalization
       Profile
       ======================================================== */

    function ensureFullSidebarButton() {

        const settings =
            document.getElementById(
                "sidebarSettingsBtn"
            );


        const profile =
            document.getElementById(
                "profileSidebarBtn"
            );


        if (
            !settings ||
            !profile ||
            !profile.parentNode
        ) {
            return;
        }


        let button =
            document.getElementById(
                "personalizationSidebarBtn"
            );


        if (!button) {

            button =
                settings.cloneNode(
                    true
                );


            button.id =
                "personalizationSidebarBtn";


            button.removeAttribute(
                "onclick"
            );


            button.href =
                "javascript:void(0)";


            button.dataset.action =
                "personalization";


            button.dataset.page =
                "personalization";


            button.setAttribute(
                "aria-label",
                "Personalization"
            );


            button.setAttribute(
                "title",
                "Personalization"
            );


            button.textContent =
                "Personalization";


            button.addEventListener(
                "click",
                openPersonalization
            );

        }


        /*
         * Guarantee exact ordering:
         *
         * Settings
         * Personalization
         * Profile
         */

        if (
            button.parentNode !==
            profile.parentNode ||
            button.nextElementSibling !==
            profile
        ) {

            profile.parentNode.insertBefore(
                button,
                profile
            );

        }

    }


    /* ========================================================
       COLLAPSED RAIL BUTTON
       ======================================================== */

    function ensureRailButton() {

        const settings =
            document.getElementById(
                "apRailSettings"
            );


        const profile =
            document.getElementById(
                "apRailProfile"
            );


        if (
            !settings ||
            !profile ||
            !profile.parentNode
        ) {
            return;
        }


        let button =
            document.getElementById(
                "apRailPersonalization"
            );


        if (!button) {

            button =
                settings.cloneNode(
                    false
                );


            button.id =
                "apRailPersonalization";


            button.type =
                "button";


            button.dataset.tooltip =
                "Personalization";


            button.dataset.action =
                "personalization";


            button.setAttribute(
                "aria-label",
                "Personalization"
            );


            button.setAttribute(
                "title",
                "Personalization"
            );


            button.innerHTML =
                PERSONALIZATION_ICON;


            button.addEventListener(
                "click",
                openPersonalization
            );

        }


        if (
            button.parentNode !==
            profile.parentNode ||
            button.nextElementSibling !==
            profile
        ) {

            profile.parentNode.insertBefore(
                button,
                profile
            );

        }

    }


    /* ========================================================
       INSTALL
       ======================================================== */

    function ensureButtons() {

        ensureFullSidebarButton();

        ensureRailButton();

    }


    let scheduled = false;


    function scheduleEnsure() {

        if (scheduled) {
            return;
        }


        scheduled = true;


        requestAnimationFrame(
            () => {

                scheduled = false;

                ensureButtons();

            }
        );

    }


    /*
     * Mobile/sidebar repair scripts can move the existing
     * Settings/Profile controls.
     *
     * Keep Personalization attached to the real sidebar.
     */

    const observer =
        new MutationObserver(
            scheduleEnsure
        );


    observer.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true
        }
    );


    document.addEventListener(
        "DOMContentLoaded",
        ensureButtons,
        {
            once: true
        }
    );


    if (
        document.readyState !==
        "loading"
    ) {

        ensureButtons();

    }


    console.log(
        "AP SYNAPSE -> PERSONALIZATION SIDEBAR READY"
    );

})();
