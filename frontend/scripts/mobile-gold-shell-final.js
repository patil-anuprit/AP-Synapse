(() => {

    "use strict";

    if (window.__AP_MOBILE_COMMAND_BAR_V2__) {
        return;
    }

    window.__AP_MOBILE_COMMAND_BAR_V2__ =
        true;


    const MQ =
        window.matchMedia(
            "(max-width: 768px)"
        );


    const ICON = {

        menu: `
            <svg viewBox="0 0 24 24">
                <path d="M5 7h14"></path>
                <path d="M5 12h14"></path>
                <path d="M5 17h14"></path>
            </svg>
        `,

        aprisha: `
            <svg viewBox="0 0 24 24">
                <path d="M12 3.8v2.1"></path>
                <path d="M12 18.1v2.1"></path>
                <path d="M3.8 12h2.1"></path>
                <path d="M18.1 12h2.1"></path>
                <circle cx="12" cy="12" r="4.2"></circle>
                <path d="M9.9 12h4.2"></path>
                <path d="M12 9.9v4.2"></path>
            </svg>
        `,

        bell: `
            <svg viewBox="0 0 24 24">
                <path d="M18 9.4a6 6 0 10-12 0c0 5.8-2.4 7-2.4 7h16.8S18 15.2 18 9.4"></path>
                <path d="M10 19.2h4"></path>
            </svg>
        `,

        sun: `
            <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3.6"></circle>
                <path d="M12 2.7v2"></path>
                <path d="M12 19.3v2"></path>
                <path d="M2.7 12h2"></path>
                <path d="M19.3 12h2"></path>
                <path d="M5.4 5.4l1.4 1.4"></path>
                <path d="M17.2 17.2l1.4 1.4"></path>
                <path d="M18.6 5.4l-1.4 1.4"></path>
                <path d="M6.8 17.2l-1.4 1.4"></path>
            </svg>
        `,

        moon: `
            <svg viewBox="0 0 24 24">
                <path d="M20 15.5A8.2 8.2 0 018.5 4a8.2 8.2 0 1011.5 11.5z"></path>
            </svg>
        `,

        share: `
            <svg viewBox="0 0 24 24">
                <circle cx="18" cy="5.5" r="2.2"></circle>
                <circle cx="6" cy="12" r="2.2"></circle>
                <circle cx="18" cy="18.5" r="2.2"></circle>
                <path d="M8 11l7.9-4.3"></path>
                <path d="M8 13l7.9 4.3"></path>
            </svg>
        `

    };


    function mobile() {

        return MQ.matches;

    }


    function all(selector) {

        try {
            return Array.from(
                document.querySelectorAll(
                    selector
                )
            );
        }
        catch {
            return [];
        }

    }


    function firstExternal(selectors) {

        for (
            const selector
            of selectors
        ) {

            for (
                const element
                of all(selector)
            ) {

                if (
                    element.closest(
                        "#apMobileGoldTopbar"
                    )
                ) {
                    continue;
                }


                return element;

            }

        }


        return null;

    }


    function findByText(words) {

        const buttons =
            all(
                "button, a, [role='button']"
            );


        for (
            const button
            of buttons
        ) {

            if (
                button.closest(
                    "#apMobileGoldTopbar"
                )
            ) {
                continue;
            }


            const haystack = [

                button.textContent,

                button.getAttribute(
                    "aria-label"
                ),

                button.getAttribute(
                    "title"
                ),

                button.id,

                button.className

            ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


            if (
                words.some(
                    word =>
                        haystack.includes(
                            word
                        )
                )
            ) {

                return button;

            }

        }


        return null;

    }


    function clickExisting(
        selectors,
        words = []
    ) {

        const target =
            firstExternal(
                selectors
            ) ||
            findByText(
                words
            );


        if (!target) {

            console.warn(
                "AP Mobile command target not found:",
                words.join(", ")
            );

            return false;

        }


        target.click();

        return true;

    }


    /* ========================================================
       ORIGINAL TOPBAR
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
                "header"
            ) ||

            profile.parentElement
                ?.parentElement ||

            null

        );

    }


    /* ========================================================
       ACTION PROXIES
       ======================================================== */

    function openMenu() {

        clickExisting(
            [
                "#apMobileMenu",
                "#sidebarToggle",
                "#menuBtn",
                "[aria-label*='menu' i]"
            ],
            [
                "menu",
                "sidebar"
            ]
        );

    }


    function openAprisha() {

        clickExisting(
            [
                "#aprishaBtn",
                "#aprishaButton",
                "#askAprishaBtn",
                "#aprishaToggle",
                "[data-action*='aprisha' i]",
                "[aria-label*='aprisha' i]",
                "[title*='aprisha' i]"
            ],
            [
                "ask aprisha",
                "aprisha"
            ]
        );

    }


    function openNotifications() {

        clickExisting(
            [
                "#notificationBtn",
                "#notificationsBtn",
                "#notificationButton",
                "#notificationIcon",
                "[data-action*='notification' i]",
                "[aria-label*='notification' i]",
                "[title*='notification' i]"
            ],
            [
                "notification",
                "alerts"
            ]
        );

    }


    function openShare() {

        clickExisting(
            [
                "#shareConversationBtn",
                "#shareBtn",
                "[data-action='share']",
                "[aria-label*='share' i]",
                "[title*='share' i]"
            ],
            [
                "share"
            ]
        );

    }


    function openProfile() {

        const profile =
            document.getElementById(
                "profileBtn"
            ) ||
            document.getElementById(
                "profileSidebarBtn"
            );


        profile?.click();

    }


    function toggleTheme() {

        const success =
            clickExisting(
                [
                    "#themeToggle",
                    "#themeBtn",
                    "#themeButton",
                    "#darkModeToggle",
                    "#lightModeToggle",
                    "[data-action*='theme' i]",
                    "[aria-label*='theme' i]",
                    "[title*='theme' i]",
                    "[aria-label*='dark' i]",
                    "[aria-label*='light' i]"
                ],
                [
                    "theme",
                    "dark mode",
                    "light mode"
                ]
            );


        if (!success) {

            /*
             * Compatibility fallback only.
             */

            const currentlyLight =
                document.body.classList.contains(
                    "light-mode"
                ) ||
                document.documentElement
                    .dataset
                    .theme === "light";


            const next =
                currentlyLight
                    ? "dark"
                    : "light";


            document.documentElement
                .dataset
                .theme =
                    next;


            document.body
                .classList
                .toggle(
                    "light-mode",
                    next === "light"
                );


            document.body
                .classList
                .toggle(
                    "dark-mode",
                    next === "dark"
                );


            try {

                localStorage.setItem(
                    "theme",
                    next
                );

            }
            catch {}

        }


        setTimeout(
            syncThemeIcon,
            80
        );

    }


    /* ========================================================
       THEME STATE
       ======================================================== */

    function isLight() {

        return (

            document.documentElement
                .dataset
                .theme === "light" ||

            document.body
                .dataset
                .theme === "light" ||

            document.body
                .classList
                .contains(
                    "light-mode"
                ) ||

            document.documentElement
                .classList
                .contains(
                    "light-mode"
                )

        );

    }


    function syncThemeIcon() {

        const button =
            document.getElementById(
                "apGoldTheme"
            );


        if (!button) {
            return;
        }


        /*
         * If page is light:
         * show moon = action switches to dark.
         *
         * If page is dark:
         * show sun = action switches to light.
         */

        button.innerHTML =
            isLight()
                ? ICON.moon
                : ICON.sun;


        button.setAttribute(
            "aria-label",
            isLight()
                ? "Switch to dark mode"
                : "Switch to light mode"
        );

    }


    /* ========================================================
       CREATE FINAL BAR
       ======================================================== */

    function ensureBar() {

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
                    class="ap-mobile-command ap-mobile-menu-command"
                    type="button"
                    aria-label="Open navigation">
                    ${ICON.menu}
                </button>


                <button
                    id="apGoldBrandMark"
                    class="ap-mobile-brand-mark"
                    type="button"
                    aria-label="AP Synapse home">
                    <span>AP</span>
                </button>


                <button
                    id="apGoldAprisha"
                    class="ap-mobile-aprisha-command"
                    type="button"
                    aria-label="Ask Aprisha">

                    <span class="ap-mobile-aprisha-orb">
                        ${ICON.aprisha}
                    </span>

                    <span class="ap-mobile-aprisha-copy">
                        <small>ASK</small>
                        <strong>Aprisha</strong>
                    </span>

                    <i></i>

                </button>


                <div class="ap-mobile-command-cluster">

                    <button
                        id="apGoldNotifications"
                        class="ap-mobile-command"
                        type="button"
                        aria-label="Notifications">
                        ${ICON.bell}
                    </button>


                    <button
                        id="apGoldTheme"
                        class="ap-mobile-command"
                        type="button"
                        aria-label="Change theme">
                    </button>


                    <button
                        id="apGoldShare"
                        class="ap-mobile-command"
                        type="button"
                        aria-label="Share conversation">
                        ${ICON.share}
                    </button>


                    <button
                        id="apGoldProfile"
                        class="ap-mobile-profile-command"
                        type="button"
                        aria-label="Profile">
                        AP
                    </button>

                </div>
            `;


            document.body.appendChild(
                bar
            );


            bar
                .querySelector(
                    "#apGoldMobileMenu"
                )
                ?.addEventListener(
                    "click",
                    openMenu
                );


            bar
                .querySelector(
                    "#apGoldBrandMark"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        const home =
                            document.querySelector(
                                '[data-page="assistant"], #assistantSidebarBtn'
                            );


                        home?.click();

                    }
                );


            bar
                .querySelector(
                    "#apGoldAprisha"
                )
                ?.addEventListener(
                    "click",
                    openAprisha
                );


            bar
                .querySelector(
                    "#apGoldNotifications"
                )
                ?.addEventListener(
                    "click",
                    openNotifications
                );


            bar
                .querySelector(
                    "#apGoldTheme"
                )
                ?.addEventListener(
                    "click",
                    toggleTheme
                );


            bar
                .querySelector(
                    "#apGoldShare"
                )
                ?.addEventListener(
                    "click",
                    openShare
                );


            bar
                .querySelector(
                    "#apGoldProfile"
                )
                ?.addEventListener(
                    "click",
                    openProfile
                );

        }


        syncThemeIcon();

    }


    /* ========================================================
       KEEP PERSONALIZATION REAL MOBILE ROW
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


        row.classList.add(
            "ap-mobile-personalization-row"
        );


        row.dataset.action =
            "personalization";


        row.dataset.page =
            "personalization";


        row.innerHTML = `
            <span class="ap-mobile-personalization-core">
                <span></span>
            </span>

            <span class="ap-mobile-personalization-label">
                Personalization
            </span>

            <span class="ap-mobile-personalization-state">
                AI
            </span>
        `;


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


    document.addEventListener(
        "click",
        event => {

            const target =
                event.target
                    ?.closest?.(
                        "#personalizationSidebarBtn"
                    );


            if (!target) {
                return;
            }


            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();


            document.body.classList.remove(
                "sidebar-open",
                "mobile-sidebar-open"
            );


            if (
                window
                    .AP_PERSONALIZATION_WORKSPACE
                    ?.open
            ) {

                window
                    .AP_PERSONALIZATION_WORKSPACE
                    .open();

            }
            else {

                window
                    .AP_PERSONALIZATION
                    ?.load?.();

            }

        },
        true
    );


    /* ========================================================
       REPAIR
       ======================================================== */

    let repairQueued =
        false;


    function repair() {

        if (
            repairQueued ||
            !mobile()
        ) {
            return;
        }


        repairQueued =
            true;


        requestAnimationFrame(
            () => {

                repairQueued =
                    false;


                ensureBar();

                ensurePersonalizationRow();


                document
                    .getElementById(
                        "apRailPersonalization"
                    )
                    ?.classList
                    .add(
                        "ap-mobile-old-personalization-hidden"
                    );


                document.body.classList.add(
                    "ap-mobile-command-bar-active"
                );

            }
        );

    }


    const observer =
        new MutationObserver(
            () => {

                repair();

                syncThemeIcon();

            }
        );


    observer.observe(
        document.documentElement,
        {
            childList:
                true,

            subtree:
                true,

            attributes:
                true,

            attributeFilter: [
                "class",
                "data-theme"
            ]
        }
    );


    MQ.addEventListener?.(
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
        "AP SYNAPSE -> MOBILE COMMAND BAR V2 READY"
    );

})();
