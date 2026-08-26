(() => {

    "use strict";

    if (window.__AP_PERSONALIZATION_WORKSPACE_FINAL__) {
        return;
    }

    window.__AP_PERSONALIZATION_WORKSPACE_FINAL__ = true;


    let workspace = null;


    function sleep(ms) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
        );

    }


    /* ========================================================
       CREATE PAGE
       ======================================================== */

    function ensureWorkspace() {

        if (
            document.getElementById(
                "apPersonalizationWorkspace"
            )
        ) {

            workspace =
                document.getElementById(
                    "apPersonalizationWorkspace"
                );

            return workspace;

        }


        workspace =
            document.createElement(
                "section"
            );


        workspace.id =
            "apPersonalizationWorkspace";


        workspace.setAttribute(
            "aria-hidden",
            "true"
        );


        workspace.innerHTML = `

<div class="ap-personalization-workspace-shell">

    <header class="ap-personalization-workspace-header">

        <div class="ap-personalization-workspace-header-inner">

            <button
                id="apPersonalizationBack"
                class="ap-personalization-workspace-back"
                type="button"
                aria-label="Close personalization">

                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true">

                    <path
                        d="M15 5l-7 7 7 7">
                    </path>

                </svg>

            </button>


            <div class="ap-personalization-workspace-heading">

                <span>
                    AP INTELLIGENCE PROFILE
                </span>

                <h1>
                    Personalization
                </h1>

                <p>
                    Make AP Synapse adapt intelligently
                    to your work, knowledge, goals and preferences.
                </p>

            </div>


            <div
                id="apPersonalizationWorkspaceStatus"
                class="ap-personalization-workspace-status">

                Personal intelligence

            </div>

        </div>

    </header>


    <main class="ap-personalization-workspace-main">

        <div
            id="apPersonalizationWorkspaceContent"
            class="ap-personalization-workspace-content">
        </div>

    </main>

</div>
`;


        document.body.appendChild(
            workspace
        );


        workspace
            .querySelector(
                "#apPersonalizationBack"
            )
            ?.addEventListener(
                "click",
                closeWorkspace
            );


        return workspace;

    }


    /* ========================================================
       MOVE EXISTING REAL PERSONALIZATION PANEL
       ======================================================== */

    async function mountPersonalization() {

        ensureWorkspace();


        /*
         * Existing personalization-final.js owns
         * all real forms/API/memory logic.
         *
         * We only relocate its panel.
         */

        let panel =
            document.getElementById(
                "apPersonalizationPanel"
            );


        if (!panel) {

            try {

                await window
                    .AP_PERSONALIZATION
                    ?.load?.();

            }
            catch {}


            await sleep(
                120
            );


            panel =
                document.getElementById(
                    "apPersonalizationPanel"
                );

        }


        if (!panel) {

            console.warn(
                "AP Personalization panel unavailable."
            );

            return false;

        }


        const content =
            document.getElementById(
                "apPersonalizationWorkspaceContent"
            );


        if (
            content &&
            panel.parentElement !==
                content
        ) {

            content.appendChild(
                panel
            );

        }


        return true;

    }


    /* ========================================================
       CLOSE ANY OLD PROFILE POPUP
       ======================================================== */

    function closeProfilePopup() {

        const profile =
            document.getElementById(
                "profileCard"
            );


        if (!profile) {
            return;
        }


        profile.classList.remove(
            "active"
        );


        profile.classList.remove(
            "ap-profile-signed-in"
        );


        profile.style.display =
            "none";


        profile.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    /* ========================================================
       OPEN
       ======================================================== */

    async function openWorkspace() {

        ensureWorkspace();


        closeProfilePopup();


        const mounted =
            await mountPersonalization();


        workspace.classList.add(
            "active"
        );


        workspace.setAttribute(
            "aria-hidden",
            "false"
        );


        document.documentElement
            .classList
            .add(
                "ap-personalization-open"
            );


        document.body
            .classList
            .add(
                "ap-personalization-open"
            );


        if (mounted) {

            try {

                await window
                    .AP_PERSONALIZATION
                    ?.load?.();

            }
            catch {}


            const panel =
                document.getElementById(
                    "apPersonalizationPanel"
                );


            panel?.scrollIntoView({
                block:
                    "start"
            });

        }


        /*
         * Close mobile sidebar if open.
         */

        document.body.classList.remove(
            "sidebar-open"
        );


        document.body.classList.remove(
            "mobile-sidebar-open"
        );


        console.log(
            "AP SYNAPSE -> PERSONALIZATION WORKSPACE OPEN"
        );

    }


    /* ========================================================
       CLOSE
       ======================================================== */

    function closeWorkspace() {

        if (!workspace) {
            return;
        }


        workspace.classList.remove(
            "active"
        );


        workspace.setAttribute(
            "aria-hidden",
            "true"
        );


        document.documentElement
            .classList
            .remove(
                "ap-personalization-open"
            );


        document.body
            .classList
            .remove(
                "ap-personalization-open"
            );


        console.log(
            "AP SYNAPSE -> PERSONALIZATION WORKSPACE CLOSED"
        );

    }


    /* ========================================================
       CRITICAL:
       INTERCEPT EXISTING SIDEBAR PERSONALIZATION BUTTON
       BEFORE OLD PROFILE-OPEN HANDLER RUNS
       ======================================================== */

    document.addEventListener(
        "click",
        event => {

            const target =
                event.target
                    ?.closest?.(
                        "#personalizationSidebarBtn," +
                        "#apRailPersonalization," +
                        "[data-action='personalization']"
                    );


            if (!target) {
                return;
            }


            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();


            openWorkspace();

        },
        true
    );


    /* ========================================================
       ESCAPE
       ======================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                workspace?.classList.contains(
                    "active"
                )
            ) {

                closeWorkspace();

            }

        }
    );


    /* ========================================================
       PUBLIC API
       ======================================================== */

    window.AP_PERSONALIZATION_WORKSPACE = {

        open:
            openWorkspace,

        close:
            closeWorkspace,

        mount:
            mountPersonalization

    };


    /* ========================================================
       INITIALIZE
       ======================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => {

                ensureWorkspace();

                mountPersonalization();

            },
            {
                once:
                    true
            }
        );

    }
    else {

        ensureWorkspace();

        mountPersonalization();

    }


    console.log(
        "AP SYNAPSE -> PERSONALIZATION WORKSPACE READY"
    );

})();
