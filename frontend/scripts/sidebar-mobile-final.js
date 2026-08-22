/* ============================================================
   AP SYNAPSE — REAL MOBILE SIDEBAR FINAL
   Exact footer/settings repair
   ============================================================ */

(() => {
    "use strict";


    function mobile() {
        return window.innerWidth <= 760;
    }


    function findSettingsControl(footer) {

        if (!footer) {
            return null;
        }


        /*
         * First use semantic/native identifiers.
         */

        const semantic =
            footer.querySelector(`
                #settingsBtn,
                #settingsButton,
                [data-action="settings"],
                [data-page="settings"],
                .settings-btn,
                .settings-button,
                [aria-label*="setting" i],
                [title*="setting" i]
            `);


        if (semantic) {
            return semantic;
        }


        /*
         * Your current UI has a gear-only Settings control
         * above Profile.
         *
         * Find the actionable footer element which is NOT Profile.
         */

        const candidates =
            [...footer.querySelectorAll(
                "button, a, [role='button'], .sidebar-item, .menu-item"
            )];


        for (const element of candidates) {

            const text =
                (element.textContent || "")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();


            const profile =
                text.includes("profile") ||
                element.dataset?.action ===
                    "profile";


            if (profile) {
                continue;
            }


            /*
             * Gear-only / tiny footer control.
             */

            if (
                text === "" ||
                text === "⚙" ||
                text === "⚙️" ||
                text.length <= 2
            ) {

                return element;
            }
        }


        /*
         * Final fallback:
         * first direct footer action before Profile.
         */

        return candidates.find(element => {

            const text =
                (element.textContent || "")
                    .toLowerCase();


            return !text.includes(
                "profile"
            );

        }) || null;
    }


    function repair() {

        if (!mobile()) {
            return;
        }


        const sidebar =
            document.querySelector(
                ".sidebar"
            );


        if (!sidebar) {
            return;
        }


        /* ====================================================
           HISTORY — EXACT NATIVE ELEMENT
           ==================================================== */

        const recent =
            sidebar.querySelector(
                ".recent-group"
            );


        if (recent) {

            recent.style.setProperty(
                "overflow-y",
                "auto",
                "important"
            );


            recent.style.setProperty(
                "overflow-x",
                "hidden",
                "important"
            );


            recent.style.setProperty(
                "-webkit-overflow-scrolling",
                "touch",
                "important"
            );


            recent.style.setProperty(
                "touch-action",
                "pan-y",
                "important"
            );
        }


        /* ====================================================
           SETTINGS — EXACT FOOTER
           ==================================================== */

        const footer =
            sidebar.querySelector(
                ".sidebar-footer"
            );


        if (!footer) {
            return;
        }


        const settings =
            findSettingsControl(
                footer
            );


        if (!settings) {

            console.warn(
                "AP Synapse Settings footer control not found."
            );

            return;
        }


        settings.classList.add(
            "ap-real-settings-row"
        );


        settings.setAttribute(
            "aria-label",
            "Settings"
        );


        settings.setAttribute(
            "title",
            "Settings"
        );


        if (
            !settings.querySelector(
                ".ap-real-settings-label"
            )
        ) {

            const label =
                document.createElement(
                    "span"
                );


            label.className =
                "ap-real-settings-label";


            label.textContent =
                "Settings";


            settings.appendChild(
                label
            );
        }


        console.log(
            "✅ AP SYNAPSE — REAL HISTORY + SETTINGS READY",
            {
                history:
                    recent,

                settings:
                    settings
            }
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            repair,
            {
                once:true
            }
        );

    } else {

        repair();
    }


    /*
     * Finite passes because sidebar history is rendered
     * asynchronously.
     */

    requestAnimationFrame(
        repair
    );


    setTimeout(
        repair,
        120
    );


    setTimeout(
        repair,
        400
    );


    document.addEventListener(
        "click",
        event => {

            if (!mobile()) {
                return;
            }


            const target =
                event.target;


            if (!(target instanceof Element)) {
                return;
            }


            /*
             * Any opening of the sidebar gets one
             * immediate repair after native rendering.
             */

            if (
                target.closest(
                    "#sidebarToggle, #menuToggle, .sidebar-toggle, .menu-toggle, [data-sidebar-toggle]"
                )
            ) {

                setTimeout(
                    repair,
                    40
                );


                setTimeout(
                    repair,
                    160
                );
            }

        },
        true
    );


    console.log(
        "✅ AP SYNAPSE — REAL MOBILE SIDEBAR CONTROLLER READY"
    );

})();
