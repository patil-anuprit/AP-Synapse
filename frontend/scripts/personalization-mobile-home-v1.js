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