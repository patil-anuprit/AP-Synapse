(() => {

    "use strict";

    if (window.__AP_MOBILE_GOLD_SHELL__) {
        return;
    }

    window.__AP_MOBILE_GOLD_SHELL__ = true;


    const MOBILE_QUERY =
        window.matchMedia(
            "(max-width: 768px)"
        );


    const ICONS = {

        menu: `
            <svg viewBox="0 0 24 24">
                <path d="M5 7h14"></path>
                <path d="M5 12h14"></path>
                <path d="M5 17h14"></path>
            </svg>
        `,

        bell: `
            <svg viewBox="0 0 24 24">
                <path d="M18 9a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"></path>
                <path d="M10 20h4"></path>
            </svg>
        `,

        intelligence: `
            <svg viewBox="0 0 24 24">
                <circle cx="8" cy="8" r="2.5"></circle>
                <path d="M3.8 17.5c.6-2.7 2.1-4 4.2-4s3.6 1.3 4.2 4"></path>
                <path d="M17 5v4"></path>
                <path d="M15 7h4"></path>
                <path d="M17 14v4"></path>
                <path d="M15 16h4"></path>
            </svg>
        `

    };


    function mobile() {

        return MOBILE_QUERY.matches;

    }


    /* ========================================================
       FIND EXISTING TOPBAR
       ======================================================== */

    function findOriginalTopbar() {

        const profile =
            document.getElementById(
                "profileBtn"
            );


        if (!profile) {
            return null;
        }


        return (

            profile.closest(
                ".topbar"
            ) ||

            profile.closest(
                ".top-bar"
            ) ||

            profile.closest(
                "[class*='topbar']"
            ) ||

            profile.closest(
                "[id*='topbar']"
            ) ||

            profile.closest(
                "header"
            ) ||

            profile.parentElement
                ?.parentElement ||

            null

        );

    }


    /* ========================================================
       MOBILE TOPBAR
       ======================================================== */

    function ensureGoldTopbar() {

        if (!mobile()) {
            return;
        }


        const original =
            findOriginalTopbar();


        if (original) {

            original.classList.add(
                "ap-original-mobile-topbar"
            );

        }


        let bar =
            document.getElementById(
                "apMobileGoldTopbar"
            );


        if (!bar) {

            bar =
                document.createElement(
                    "header"
                );


            bar.id =
                "apMobileGoldTopbar";


            bar.innerHTML = `

                <button
                    id="apGoldMobileMenu"
                    class="ap-gold-topbar-button ap-gold-menu"
                    type="button"
                    aria-label="Open navigation">

                    ${ICONS.menu}

                </button>


                <div
                    class="ap-gold-mobile-brand"
                    aria-label="AP Synapse">

                    <div class="ap-gold-brand-mark">
                        AP
                    </div>


                    <div class="ap-gold-brand-copy">

                        <strong>
                            AP SYNAPSE
                        </strong>

                        <span>
                            <i></i>
                            INTELLIGENCE
                        </span>

                    </div>

                </div>


                <div class="ap-gold-mobile-actions">

                    <button
                        id="apGoldNotifications"
                        class="ap-gold-topbar-button"
                        type="button"
                        aria-label="Notifications">

                        ${ICONS.bell}

                    </button>


                    <button
                        id="apGoldProfile"
                        class="ap-gold-profile-button"
                        type="button"
                        aria-label="Profile">

                        AP

                    </button>

                </div>
            `;


            document.body.appendChild(
                bar
            );


            /* ---------------------------------------------
               MENU
               --------------------------------------------- */

            bar
                .querySelector(
                    "#apGoldMobileMenu"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        const control =
                            document.getElementById(
                                "apMobileMenu"
                            ) ||

                            document.querySelector(
                                "[data-action='mobile-menu']"
                            );


                        control?.click();

                    }
                );


            /* ---------------------------------------------
               NOTIFICATIONS
               --------------------------------------------- */

            bar
                .querySelector(
                    "#apGoldNotifications"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        const selectors = [

                            "#notificationBtn",

                            "#notificationsBtn",

                            "#notificationButton",

                            "[data-action='notifications']",

                            "[aria-label*='notification' i]"

                        ];


                        for (
                            const selector
                            of selectors
                        ) {

                            const candidates =
                                document.querySelectorAll(
                                    selector
                                );


                            for (
                                const candidate
                                of candidates
                            ) {

                                if (
                                    candidate.closest(
                                        "#apMobileGoldTopbar"
                                    )
                                ) {
                                    continue;
                                }


                                candidate.click();

                                return;

                            }

                        }

                    }
                );


            /* ---------------------------------------------
               PROFILE
               --------------------------------------------- */

            bar
                .querySelector(
                    "#apGoldProfile"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        document
                            .getElementById(
                                "profileBtn"
                            )
                            ?.click();

                    }
                );

        }

    }


    /* ========================================================
       REAL MOBILE PERSONALIZATION ROW
       ======================================================== */

    function ensurePersonalizationRow() {

        if (!mobile()) {
            return;
        }


        const profile =
            document.getElementById(
                "profileSidebarBtn"
            );


        if (
            !profile ||
            !profile.parentElement
        ) {
            return;
        }


        let row =
            document.getElementById(
                "personalizationSidebarBtn"
            );


        if (!row) {

            row =
                document.createElement(
                    "button"
                );


            row.id =
                "personalizationSidebarBtn";


            row.type =
                "button";


            profile.parentElement.insertBefore(
                row,
                profile
            );

        }


        /*
         * Do not clone Settings/Profile.
         * Give Personalization its own stable structure.
         */

        row.classList.add(
            "ap-mobile-personalization-row"
        );


        row.dataset.action =
            "personalization";


        row.dataset.page =
            "personalization";


        row.setAttribute(
            "aria-label",
            "Personalization"
        );


        row.setAttribute(
            "title",
            "Personalization"
        );


        if (
            row.tagName === "A"
        ) {

            row.setAttribute(
                "href",
                "javascript:void(0)"
            );

        }


        row.innerHTML = `

            <span class="ap-mobile-personalization-icon">
                ${ICONS.intelligence}
            </span>

            <span class="ap-mobile-personalization-label">
                Personalization
            </span>

            <span class="ap-mobile-personalization-badge">
                AI
            </span>
        `;


        /*
         * Guarantee ordering:
         *
         * Settings
         * Personalization
         * Profile
         */

        if (
            row.nextElementSibling !==
            profile
        ) {

            profile.parentElement.insertBefore(
                row,
                profile
            );

        }

    }


    /* ========================================================
       OPEN PERSONALIZATION
       ======================================================== */

    function openPersonalization() {

        /*
         * Close the mobile navigation first.
         */

        const overlay =
            document.getElementById(
                "apSidebarOverlay"
            );


        if (
            overlay &&
            getComputedStyle(overlay)
                .display !== "none"
        ) {

            overlay.click();

        }


        document.body.classList.remove(
            "sidebar-open",
            "mobile-sidebar-open"
        );


        /*
         * Open the real dedicated workspace.
         */

        if (
            window
                .AP_PERSONALIZATION_WORKSPACE
                ?.open
        ) {

            window
                .AP_PERSONALIZATION_WORKSPACE
                .open();

            return;

        }


        /*
         * Fallback — never silently fail.
         */

        window
            .AP_PERSONALIZATION
            ?.load?.();

    }


    /*
     * Capture phase means old sidebar repair scripts cannot
     * turn Personalization back into the broken dot.
     */

    document.addEventListener(
        "click",
        event => {

            const target =
                event.target
                    ?.closest?.(
                        "#personalizationSidebarBtn," +
                        ".ap-mobile-personalization-row"
                    );


            if (!target) {
                return;
            }


            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();


            openPersonalization();

        },
        true
    );


    /* ========================================================
       REMOVE OLD MOBILE RAIL PERSONALIZATION ARTIFACT
       ======================================================== */

    function repairOldDot() {

        if (!mobile()) {
            return;
        }


        const railPersonalization =
            document.getElementById(
                "apRailPersonalization"
            );


        if (railPersonalization) {

            railPersonalization.classList.add(
                "ap-mobile-rail-personalization-hidden"
            );

        }

    }


    /* ========================================================
       MAINTAIN FINAL STATE AFTER LEGACY SIDEBAR REPAIRS
       ======================================================== */

    let scheduled =
        false;


    function repair() {

        if (scheduled) {
            return;
        }


        scheduled =
            true;


        requestAnimationFrame(
            () => {

                scheduled =
                    false;


                if (!mobile()) {
                    return;
                }


                ensureGoldTopbar();

                ensurePersonalizationRow();

                repairOldDot();

                document.body.classList.add(
                    "ap-mobile-gold-shell"
                );

            }
        );

    }


    const observer =
        new MutationObserver(
            repair
        );


    observer.observe(
        document.documentElement,
        {
            childList:
                true,

            subtree:
                true
        }
    );


    MOBILE_QUERY.addEventListener?.(
        "change",
        repair
    );


    window.addEventListener(
        "resize",
        repair,
        {
            passive: true
        }
    );


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            repair,
            {
                once: true
            }
        );

    }
    else {

        repair();

    }


    console.log(
        "AP SYNAPSE -> MOBILE GOLD SHELL READY"
    );

})();
