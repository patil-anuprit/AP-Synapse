/* ============================================================
   AP SYNAPSE — CLICKABLE STABLE NOTIFICATION CONTROL
   ============================================================ */

(() => {
    "use strict";


    function findTopbar() {

        return (
            document.querySelector(".topbar") ||
            document.querySelector(".top-bar") ||
            document.querySelector(".app-topbar") ||
            document.querySelector(".workspace-topbar") ||
            document.querySelector("header")
        );
    }


    function findAnchor(topbar) {

        const selectors = [
            "#themeToggle",
            "#themeBtn",
            ".theme-toggle",
            ".theme-btn",
            '[aria-label*="theme" i]',
            '[title*="theme" i]',
            "#profileBtn",
            ".profile-btn"
        ];


        for (const selector of selectors) {

            const element =
                topbar.querySelector(selector);

            if (element) {
                return element;
            }
        }


        return null;
    }


    function killOldNotifications() {

        const old =
            document.getElementById(
                "apSynapseNotificationCenter"
            );


        if (!old) return;


        if (
            old.contains(
                document.activeElement
            )
        ) {
            document.activeElement?.blur?.();
        }


        old.style.setProperty(
            "display",
            "none",
            "important"
        );


        old.setAttribute(
            "aria-hidden",
            "true"
        );


        try {
            old.inert = true;
        } catch {}
    }


    function getPanel() {

        let panel =
            document.getElementById(
                "apStableNotificationPanel"
            );


        if (panel) return panel;


        panel =
            document.createElement("section");


        panel.id =
            "apStableNotificationPanel";


        panel.setAttribute(
            "aria-hidden",
            "true"
        );


        panel.innerHTML = `

            <header
                class="ap-stable-notification-header"
            >

                <span
                    class="ap-stable-notification-kicker"
                >
                    AP SYNAPSE
                </span>

                <h2
                    class="ap-stable-notification-title"
                >
                    Notifications
                </h2>

                <p
                    class="ap-stable-notification-subtitle"
                >
                    Your intelligence activity.
                </p>


                <button
                    type="button"
                    class="ap-stable-notification-close"
                    aria-label="Close activity panel"
                    title="Close"
                >

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path d="M6 6L18 18"></path>
                        <path d="M18 6L6 18"></path>
                    </svg>

                </button>

            </header>


            <div
                class="ap-stable-notification-body"
            >

                <div
                    class="ap-stable-notification-check"
                    aria-hidden="true"
                >
                    ✓
                </div>

                <div
                    class="ap-stable-notification-empty-title"
                >
                    You're all caught up.
                </div>

                <div
                    class="ap-stable-notification-empty-copy"
                >
                    Important AP Synapse activity
                    will appear here.
                </div>

            </div>


            <footer
                class="ap-stable-notification-footer"
            >

                <button
                    type="button"
                    class="ap-stable-notification-preferences"
                >
                    Notification preferences →
                </button>

            </footer>
        `;


        document.body.appendChild(
            panel
        );


        panel
            .querySelector(
                ".ap-stable-notification-close"
            )
            .addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    closePanel();
                }
            );


        panel
            .querySelector(
                ".ap-stable-notification-preferences"
            )
            .addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    closePanel();


                    const settings =
                        document.querySelector(
                            "#settingsBtn, [data-action='settings'], .settings-btn"
                        );


                    settings?.click?.();
                }
            );


        return panel;
    }


    function openPanel() {

        killOldNotifications();


        const panel =
            getPanel();


        panel.classList.add(
            "ap-open"
        );


        panel.setAttribute(
            "aria-hidden",
            "false"
        );


        try {
            panel.inert = false;
        } catch {}


        const bell =
            document.querySelector(
                ".ap-notification-icon-only"
            );


        bell?.setAttribute(
            "aria-expanded",
            "true"
        );
    }


    function closePanel() {

        const panel =
            document.getElementById(
                "apStableNotificationPanel"
            );


        if (!panel) return;


        if (
            panel.contains(
                document.activeElement
            )
        ) {
            document.activeElement?.blur?.();
        }


        panel.classList.remove(
            "ap-open"
        );


        panel.setAttribute(
            "aria-hidden",
            "true"
        );


        try {
            panel.inert = true;
        } catch {}


        const bell =
            document.querySelector(
                ".ap-notification-icon-only"
            );


        bell?.setAttribute(
            "aria-expanded",
            "false"
        );
    }


    function togglePanel() {

        const panel =
            getPanel();


        if (
            panel.classList.contains(
                "ap-open"
            )
        ) {

            closePanel();

        } else {

            openPanel();
        }
    }


    function installBell() {

        killOldNotifications();


        let bell =
            document.querySelector(
                ".ap-notification-icon-only"
            );


        if (!bell) {

            const topbar =
                findTopbar();


            if (!topbar) return;


            bell =
                document.createElement(
                    "button"
                );


            bell.type =
                "button";


            bell.className =
                "ap-notification-icon-only";


            bell.setAttribute(
                "aria-label",
                "AP Synapse alerts"
            );


            bell.setAttribute(
                "title",
                "Activity"
            );


            bell.setAttribute(
                "aria-expanded",
                "false"
            );


            bell.innerHTML = `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                    ></path>

                    <path
                        d="M10 21h4"
                    ></path>
                </svg>
            `;


            const anchor =
                findAnchor(topbar);


            if (anchor) {

                anchor.insertAdjacentElement(
                    "beforebegin",
                    bell
                );

            } else {

                topbar.appendChild(
                    bell
                );
            }
        }


        /*
         * Important:
         * Replace previous no-op click handler
         * by cloning the button.
         */

        const fresh =
            bell.cloneNode(true);


        bell.replaceWith(
            fresh
        );


        fresh.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                togglePanel();

            },
            false
        );


        killOldNotifications();


        console.log(
            "✅ AP SYNAPSE — CLICKABLE NOTIFICATION CONTROL READY"
        );
    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            installBell,
            { once: true }
        );

    } else {

        installBell();
    }


    /*
     * One delayed initialization only.
     * No continuous polling.
     */

    setTimeout(
        installBell,
        450
    );


    /*
     * Escape closes panel.
     */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {
                closePanel();
            }

        }
    );

})();
