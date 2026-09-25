(() => {
    "use strict";

    if (
        window.__AP_PERSONALIZATION_MOBILE_HOME_V1__
    ) {
        return;
    }

    window.__AP_PERSONALIZATION_MOBILE_HOME_V1__ =
        true;

    const BUTTON_ID =
        "apPersonalizationMobileHome";

    const MOBILE_MAX =
        720;

    function isMobile() {
        return (
            window.innerWidth <=
            MOBILE_MAX
        );
    }

    function personalizationWorkspace() {
        return (
            document.querySelector(
                ".ap-personalization-workspace-shell"
            ) ||
            document.getElementById(
                "personalizationPage"
            )
        );
    }

    function personalizationHeader() {
        const workspace =
            personalizationWorkspace();

        if (!workspace) {
            return null;
        }

        return (
            workspace.querySelector(
                ".ap-personalization-workspace-header-inner"
            ) ||
            workspace.querySelector(
                ".ap-personalization-workspace-header"
            )
        );
    }

    function goHome() {
        const assistant =
            document.getElementById(
                "assistantBtn"
            );

        if (assistant) {
            assistant.click();

            window.dispatchEvent(
                new CustomEvent(
                    "ap-personalization-mobile-home",
                    {
                        detail: {
                            destination:
                                "assistant"
                        }
                    }
                )
            );

            return true;
        }

        const fallback =
            document.querySelector(
                '[data-page="assistant"], [data-workspace="assistant"]'
            );

        if (fallback) {
            fallback.click();
            return true;
        }

        console.warn(
            "AP Personalization mobile home: Assistant navigation control not found."
        );

        return false;
    }

    function createButton() {
        let button =
            document.getElementById(
                BUTTON_ID
            );

        if (button) {
            return button;
        }

        button =
            document.createElement(
                "button"
            );

        button.id =
            BUTTON_ID;

        button.type =
            "button";

        button.className =
            "ap-personalization-mobile-home";

        button.setAttribute(
            "aria-label",
            "Back to AP Synapse home"
        );

        button.setAttribute(
            "title",
            "Back to Home"
        );

        button.innerHTML = `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    d="M15.5 5.5L9 12l6.5 6.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
            <span>Home</span>
        `;

        button.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopPropagation();

                goHome();
            }
        );

        return button;
    }

    function mount() {
        const header =
            personalizationHeader();

        if (!header) {
            return false;
        }

        const button =
            createButton();

        if (
            button.parentElement !==
            header
        ) {
            header.appendChild(
                button
            );
        }

        button.hidden =
            !isMobile();

        return true;
    }

    function scheduleMount() {
        requestAnimationFrame(
            mount
        );

        setTimeout(
            mount,
            120
        );

        setTimeout(
            mount,
            500
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            scheduleMount,
            {
                once: true
            }
        );
    }
    else {
        scheduleMount();
    }

    window.addEventListener(
        "resize",
        mount,
        {
            passive: true
        }
    );

    document.addEventListener(
        "click",
        event => {
            const personalizationOpen =
                event.target?.closest?.(
                    "#personalizationBtn, #apRailPersonalization, [data-page='personalization'], [data-workspace='personalization']"
                );

            if (personalizationOpen) {
                setTimeout(
                    mount,
                    0
                );

                setTimeout(
                    mount,
                    180
                );
            }
        },
        true
    );

    window.APPersonalizationMobileHome = {
        version:
            "1.0.0",

        mount,

        goHome,

        status() {
            return {
                mobile:
                    isMobile(),

                workspace:
                    Boolean(
                        personalizationWorkspace()
                    ),

                header:
                    Boolean(
                        personalizationHeader()
                    ),

                button:
                    Boolean(
                        document.getElementById(
                            BUTTON_ID
                        )
                    )
            };
        }
    };

    console.log(
        "⌂ AP SYNAPSE PERSONALIZATION MOBILE HOME READY"
    );
})();
// ============================================================
// AP_PERSONALIZATION_MOBILE_HOME_FIX_V11
// V1 routed to Assistant correctly but left the dynamic
// Personalization workspace visible above it on mobile.
// This capture-phase bridge exits that workspace first.
// ============================================================

(() => {
    "use strict";

    if (
        window.__AP_PERSONALIZATION_MOBILE_HOME_FIX_V11__
    ) {
        return;
    }

    window.__AP_PERSONALIZATION_MOBILE_HOME_FIX_V11__ =
        true;

    const HIDDEN_ATTR =
        "data-ap-personalization-mobile-home-hidden";

    function isMobile() {
        return (
            window.innerWidth <=
            720
        );
    }

    function personalizationShell() {
        return document.querySelector(
            ".ap-personalization-workspace-shell"
        );
    }

    function collectPersonalizationLayers() {
        const layers =
            new Set();

        const shell =
            personalizationShell();

        if (shell) {
            layers.add(
                shell
            );

            let node =
                shell.parentElement;

            let depth =
                0;

            while (
                node &&
                node !== document.body &&
                depth < 5
            ) {
                const signature =
                    (
                        `${node.id || ""} ${node.className || ""}`
                    )
                        .toLowerCase();

                /*
                 * Only mark ancestors that clearly belong to
                 * Personalization. Never hide generic app/main
                 * containers that may also contain Assistant.
                 */
                if (
                    signature.includes(
                        "personalization"
                    )
                ) {
                    layers.add(
                        node
                    );
                }

                node =
                    node.parentElement;

                depth +=
                    1;
            }
        }

        const page =
            document.getElementById(
                "personalizationPage"
            );

        if (page) {
            layers.add(
                page
            );
        }

        return [
            ...layers
        ];
    }

    function concealPersonalization() {
        const layers =
            collectPersonalizationLayers();

        layers.forEach(
            element => {
                element.setAttribute(
                    HIDDEN_ATTR,
                    "true"
                );

                element.setAttribute(
                    "aria-hidden",
                    "true"
                );
            }
        );

        document.body.classList.add(
            "ap-personalization-mobile-home-exited"
        );

        return layers.length;
    }

    function revealPersonalization() {
        document
            .querySelectorAll(
                `[${HIDDEN_ATTR}="true"]`
            )
            .forEach(
                element => {
                    element.removeAttribute(
                        HIDDEN_ATTR
                    );

                    element.removeAttribute(
                        "aria-hidden"
                    );
                }
            );

        document.body.classList.remove(
            "ap-personalization-mobile-home-exited"
        );
    }

    function navigateAssistant() {
        const assistant =
            document.getElementById(
                "assistantBtn"
            );

        if (assistant) {
            assistant.click();
            return true;
        }

        const fallback =
            document.querySelector(
                '[data-page="assistant"], [data-workspace="assistant"]'
            );

        if (fallback) {
            fallback.click();
            return true;
        }

        return false;
    }

    function fixedGoHome() {
        const hiddenCount =
            concealPersonalization();

        const navigated =
            navigateAssistant();

        window.dispatchEvent(
            new CustomEvent(
                "ap-personalization-mobile-home",
                {
                    detail: {
                        destination:
                            "assistant",

                        hiddenLayers:
                            hiddenCount,

                        navigated
                    }
                }
            )
        );

        /*
         * Run once more after the router finishes its DOM work.
         * This prevents the Personalization workspace from
         * reasserting itself during the same navigation frame.
         */
        requestAnimationFrame(
            () => {
                concealPersonalization();

                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: "auto"
                });
            }
        );

        setTimeout(
            () => {
                concealPersonalization();
            },
            80
        );

        console.log(
            "⌂ AP SYNAPSE — PERSONALIZATION MOBILE HOME EXITED",
            {
                hiddenLayers:
                    hiddenCount,

                navigated
            }
        );

        return navigated;
    }

    function isPersonalizationOpener(
        target
    ) {
        return Boolean(
            target?.closest?.(
                "#personalizationBtn, #apRailPersonalization, [data-page='personalization'], [data-workspace='personalization']"
            )
        );
    }

    document.addEventListener(
        "click",
        event => {
            if (!isMobile()) {
                return;
            }

            const home =
                event.target?.closest?.(
                    "#apPersonalizationMobileHome"
                );

            if (home) {
                /*
                 * Capture phase intentionally takes ownership before
                 * the original V1 target listener can run.
                 */
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                fixedGoHome();

                return;
            }

            if (
                isPersonalizationOpener(
                    event.target
                )
            ) {
                /*
                 * Make the existing Personalization workspace visible
                 * again before its normal open handler runs.
                 */
                revealPersonalization();

                setTimeout(
                    () => {
                        window
                            .APPersonalizationMobileHome
                            ?.mount?.();
                    },
                    0
                );
            }
        },
        true
    );

    window.AP_PERSONALIZATION_MOBILE_HOME_FIX_V11 = {
        version:
            "1.1.0",

        goHome:
            fixedGoHome,

        conceal:
            concealPersonalization,

        reveal:
            revealPersonalization,

        status() {
            return {
                mobile:
                    isMobile(),

                shell:
                    Boolean(
                        personalizationShell()
                    ),

                hidden:
                    document
                        .querySelectorAll(
                            `[${HIDDEN_ATTR}="true"]`
                        )
                        .length
            };
        }
    };

    console.log(
        "✅ AP SYNAPSE PERSONALIZATION MOBILE HOME V1.1 FIX READY"
    );
})();