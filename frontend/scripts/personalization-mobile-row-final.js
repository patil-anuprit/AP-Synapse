(() => {

    "use strict";

    if (window.__AP_PERSONALIZATION_MOBILE_ROW_FINAL__) {
        return;
    }

    window.__AP_PERSONALIZATION_MOBILE_ROW_FINAL__ = true;


    function repairPersonalizationRow() {

        if (window.innerWidth > 768) {
            return;
        }

        const button =
            document.getElementById(
                "personalizationSidebarBtn"
            );

        if (!button) {
            return;
        }


        /*
         * Personalization was accidentally receiving the
         * Settings icon-only treatment.
         */

        button.classList.remove(
            "ap-real-settings-row",
            "ap-kill-before-mark"
        );


        button.setAttribute(
            "aria-label",
            "Personalization"
        );

        button.setAttribute(
            "title",
            "Personalization"
        );


        const styles = {

            width: "100%",
            "max-width": "none",
            "min-width": "0",

            height: "48px",
            "min-height": "48px",

            flex: "0 0 auto",
            "flex-basis": "auto",

            "align-self": "stretch",

            display: "flex",

            "align-items": "center",
            "justify-content": "flex-start",

            gap: "11px",

            margin: "0",
            padding: "0 14px",

            overflow: "visible",

            "box-sizing": "border-box",

            "text-align": "left",
            "text-indent": "0",

            "font-size": "12px",
            "font-weight": "520",
            "line-height": "1",

            color: "rgba(242,240,234,.90)",

            opacity: "1",
            visibility: "visible",

            transform: "none",

            "white-space": "nowrap",

            "text-decoration": "none",

            "pointer-events": "auto"

        };


        for (
            const [property, value]
            of Object.entries(styles)
        ) {

            button.style.setProperty(
                property,
                value,
                "important"
            );

        }


        /*
         * Use real DOM children instead of ::before.
         * This prevents ui-questionmark-final.js from
         * changing the Personalization icon into '?'.
         */

        let icon =
            button.querySelector(
                ".ap-personalization-mobile-icon"
            );

        let label =
            button.querySelector(
                ".ap-personalization-mobile-label"
            );


        if (!icon || !label) {

            button.textContent = "";


            icon =
                document.createElement(
                    "span"
                );

            icon.className =
                "ap-personalization-mobile-icon";

            icon.setAttribute(
                "aria-hidden",
                "true"
            );

            icon.textContent =
                "\u25C7";


            label =
                document.createElement(
                    "span"
                );

            label.className =
                "ap-personalization-mobile-label";

            label.textContent =
                "Personalization";


            button.append(
                icon,
                label
            );

        }


        icon.style.setProperty(
            "width",
            "17px",
            "important"
        );

        icon.style.setProperty(
            "min-width",
            "17px",
            "important"
        );

        icon.style.setProperty(
            "display",
            "inline-flex",
            "important"
        );

        icon.style.setProperty(
            "align-items",
            "center",
            "important"
        );

        icon.style.setProperty(
            "justify-content",
            "center",
            "important"
        );

        icon.style.setProperty(
            "color",
            "#d8ad5c",
            "important"
        );

        icon.style.setProperty(
            "font-size",
            "13px",
            "important"
        );


        label.style.setProperty(
            "display",
            "inline-block",
            "important"
        );

        label.style.setProperty(
            "visibility",
            "visible",
            "important"
        );

        label.style.setProperty(
            "opacity",
            "1",
            "important"
        );

        label.style.setProperty(
            "font-size",
            "12px",
            "important"
        );


        console.log(
            "AP SYNAPSE -> PERSONALIZATION MOBILE ROW READY"
        );

    }


    /*
     * Run after the legacy sidebar and question-mark repairs.
     * No MutationObserver.
     */

    function boot() {

        repairPersonalizationRow();

        requestAnimationFrame(
            repairPersonalizationRow
        );

        setTimeout(
            repairPersonalizationRow,
            80
        );

        setTimeout(
            repairPersonalizationRow,
            300
        );

    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            boot,
            {
                once: true
            }
        );

    }
    else {

        boot();

    }

})();
