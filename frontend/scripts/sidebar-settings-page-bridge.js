/* ============================================================
   AP SYNAPSE — ORIGINAL SETTINGS PAGE RESTORE
   Sidebar Settings -> existing full #settingsPage
   ============================================================ */

(() => {
    "use strict";

    let opening = false;


    function getSettingsPage() {

        return (
            document.getElementById("settingsPage") ||
            document.querySelector("[data-page='settings']") ||
            document.querySelector(".settings-page")
        );
    }


    function closeLegacyPopup() {

        const popup =
            document.getElementById("popupPanel");


        if (popup) {

            popup.style.setProperty(
                "display",
                "none",
                "important"
            );

            popup.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            popup.style.setProperty(
                "opacity",
                "0",
                "important"
            );

            popup.setAttribute(
                "aria-hidden",
                "true"
            );
        }
    }


    function closeMobileSidebar() {

        if (window.innerWidth > 760) {
            return;
        }


        const hits =
            document.elementsFromPoint(
                35,
                35
            );


        for (const hit of hits) {

            const button =
                hit.closest?.(
                    "button,[role='button']"
                );


            if (!button) continue;


            const text =
                (button.textContent || "")
                    .replace(/\s+/g, "")
                    .trim()
                    .toLowerCase();


            const open =
                text === "x" ||
                text === "×" ||
                text === "✕" ||
                button.getAttribute(
                    "aria-expanded"
                ) === "true";


            if (open) {

                button.click();

                break;
            }
        }
    }


    function hideOtherWorkspacePages(settingsPage) {

        const selectors = [
            "#assistantPage",
            "#projectsPage",
            "#knowledgePage",
            "#documentsPage",
            "#automationPage",
            "#codeStudioPage",
            "#canvasPage"
        ];


        selectors.forEach(selector => {

            const page =
                document.querySelector(selector);


            if (
                !page ||
                page === settingsPage
            ) {
                return;
            }


            page.classList.remove(
                "active",
                "visible",
                "open"
            );


            page.style.setProperty(
                "display",
                "none",
                "important"
            );


            page.setAttribute(
                "aria-hidden",
                "true"
            );
        });
    }


    function showOriginalSettingsPage() {

        if (opening) return;

        opening = true;


        const settingsPage =
            getSettingsPage();


        if (!settingsPage) {

            console.error(
                "AP Synapse: original #settingsPage not found."
            );

            opening = false;

            return;
        }


        closeLegacyPopup();

        closeMobileSidebar();


        /*
         * First try the existing AP Synapse workspace router.
         */

        if (
            typeof window.APWorkspaceOpenPage ===
            "function"
        ) {

            try {

                window.APWorkspaceOpenPage(
                    "settings"
                );

            } catch {}
        }


        /*
         * Guarantee the existing Settings page wins.
         */

        setTimeout(() => {

            closeLegacyPopup();

            hideOtherWorkspacePages(
                settingsPage
            );


            settingsPage.classList.add(
                "active",
                "visible",
                "open"
            );


            settingsPage.style.removeProperty(
                "display"
            );


            settingsPage.style.setProperty(
                "display",
                "block",
                "important"
            );


            settingsPage.style.setProperty(
                "visibility",
                "visible",
                "important"
            );


            settingsPage.style.setProperty(
                "opacity",
                "1",
                "important"
            );


            settingsPage.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );


            settingsPage.setAttribute(
                "aria-hidden",
                "false"
            );


            document.body.dataset.page =
                "settings";


            settingsPage.scrollTop =
                0;


            const scrollParent =
                settingsPage.closest(
                    ".workspace-content"
                );


            if (scrollParent) {

                scrollParent.scrollTop =
                    0;
            }


            /* ==================================================
               AP SETTINGS POST-OPEN SIDEBAR CLOSE
               Settings is now visible, so close the REAL
               mobile sidebar exactly as the user pressing X.
               ================================================== */

            requestAnimationFrame(() => {
                closeMobileSidebar();
            });


            setTimeout(() => {
                closeMobileSidebar();
            }, 70);


            setTimeout(() => {
                closeMobileSidebar();
            }, 180);


            opening = false;


            console.log(
                "✅ AP SYNAPSE — ORIGINAL SETTINGS PAGE RESTORED"
            );

            console.log(
                "✅ AP SYNAPSE — SETTINGS SIDEBAR AUTO-CLOSED"
            );

        }, 80);
    }


    /* ========================================================
       SIDEBAR SETTINGS
       ======================================================== */

    document.addEventListener(
        "click",
        event => {

            const target =
                event.target;


            if (!(target instanceof Element)) {
                return;
            }


            const settings =
                target.closest(
                    "#sidebarSettingsBtn"
                );


            if (!settings) {
                return;
            }


            /*
             * Block the legacy popup handler.
             */

            /*
             * IMPORTANT:
             * Do NOT stop propagation here.
             *
             * AP Synapse's native sidebar listener must receive
             * this same Settings click so it can close the
             * mobile sidebar properly.
             */
            event.preventDefault();


            showOriginalSettingsPage();

        },
        true
    );


    console.log(
        "✅ AP SYNAPSE — SETTINGS PAGE BRIDGE READY"
    );

})();
