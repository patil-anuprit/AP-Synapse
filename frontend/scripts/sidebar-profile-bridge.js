/* ============================================================
   AP SYNAPSE — SIDEBAR PROFILE BRIDGE

   Sidebar Profile
        ↓
   close mobile sidebar
        ↓
   invoke existing Profile controller

   No observer.
   No interval.
   ============================================================ */

(() => {
    "use strict";

    let openingProfile = false;


    function sidebar() {

        return (
            document.querySelector("#sidebar") ||
            document.querySelector(".sidebar") ||
            document.querySelector(".mobile-sidebar") ||
            document.querySelector("[data-sidebar]")
        );
    }


    function isProfileItem(target) {

        const side =
            sidebar();


        if (
            !side ||
            !target ||
            !side.contains(target)
        ) {
            return false;
        }


        const item =
            target.closest(`
                button,
                a,
                [role="button"],
                .sidebar-item,
                .menu-item,
                .nav-item,
                [data-action],
                [data-page]
            `);


        if (!item) {
            return false;
        }


        if (
            item.dataset?.action === "profile" ||
            item.dataset?.page === "profile"
        ) {
            return true;
        }


        const text =
            (item.textContent || "")
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();


        return (
            text === "profile" ||
            text === "your profile" ||
            text.startsWith("profile ")
        );
    }


    function visibleTopLeftToggle() {

        const stack =
            document.elementsFromPoint(
                35,
                35
            );


        for (const hit of stack) {

            const button =
                hit.closest?.(
                    "button,[role='button']"
                );


            if (!button) {
                continue;
            }


            const r =
                button.getBoundingClientRect();


            if (
                r.left < 75 &&
                r.top < 90 &&
                r.width >= 25 &&
                r.height >= 25
            ) {
                return button;
            }
        }


        return null;
    }


    function closeSidebar() {

        if (window.innerWidth > 760) {
            return;
        }


        const toggle =
            visibleTopLeftToggle();


        if (!toggle) {
            return;
        }


        const text =
            (toggle.textContent || "")
                .replace(/\s+/g, "")
                .trim()
                .toLowerCase();


        const open =
            toggle.getAttribute(
                "aria-expanded"
            ) === "true" ||

            text === "x" ||
            text === "×" ||
            text === "✕" ||

            toggle.classList.contains("open") ||
            toggle.classList.contains("active") ||
            toggle.classList.contains("is-open");


        if (open) {

            toggle.click();

            console.log(
                "✅ AP SYNAPSE — SIDEBAR CLOSED FOR PROFILE"
            );
        }
    }


    function findExistingProfileControl() {

        const side =
            sidebar();


        const selectors = [
            "#profileBtn",
            "#profileButton",
            ".profile-btn",
            ".profile-button",
            '[data-action="profile"]',
            '[aria-label*="profile" i]',
            '[title*="profile" i]'
        ];


        for (const selector of selectors) {

            const candidates =
                [...document.querySelectorAll(
                    selector
                )];


            const control =
                candidates.find(element => {

                    /*
                     * Do not click the sidebar item again.
                     */

                    if (
                        side &&
                        side.contains(element)
                    ) {
                        return false;
                    }


                    if (
                        element.closest("#profileCard")
                    ) {
                        return false;
                    }


                    return true;
                });


            if (control) {
                return control;
            }
        }


        /*
         * Fallback:
         * topbar AP initials button.
         */

        const topbar =
            document.querySelector(
                ".topbar, .top-bar, .app-topbar, .workspace-topbar, header"
            );


        if (topbar) {

            const apButton =
                [...topbar.querySelectorAll(
                    "button,[role='button']"
                )]
                .find(element => {

                    const text =
                        (element.textContent || "")
                            .replace(/\s+/g, "")
                            .trim()
                            .toUpperCase();


                    return text === "AP";
                });


            if (apButton) {
                return apButton;
            }
        }


        return null;
    }


    function openProfile() {

        if (openingProfile) {
            return;
        }


        openingProfile = true;


        closeSidebar();


        /*
         * Wait for the sidebar overlay/body-lock
         * to finish closing first.
         */

        setTimeout(() => {

            const control =
                findExistingProfileControl();


            if (control) {

                control.click();


                console.log(
                    "✅ AP SYNAPSE — SIDEBAR PROFILE OPENED"
                );


                openingProfile = false;

                return;
            }


            console.warn(
                "AP Synapse Profile control not found."
            );


            openingProfile = false;

        }, 120);
    }


    document.addEventListener(
        "click",
        event => {

            if (openingProfile) {
                return;
            }


            const target =
                event.target;


            if (!(target instanceof Element)) {
                return;
            }


            if (!isProfileItem(target)) {
                return;
            }


            /*
             * Stop the currently broken sidebar Profile
             * action and send it to the real Profile controller.
             */

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();


            openProfile();

        },
        true
    );


    console.log(
        "✅ AP SYNAPSE — SIDEBAR PROFILE BRIDGE READY"
    );

})();
