(() => {
    "use strict";

    const VERSION = "aprisha-v2-bridge-1";

    function isInsideAprishaV2(element) {
        return Boolean(element.closest("#aprishaV2Overlay"));
    }

    function getLabel(element) {
        return String(
            element.textContent ||
            element.getAttribute("aria-label") ||
            element.getAttribute("title") ||
            ""
        ).trim().toLowerCase();
    }

    function openAprisha() {
        if (window.AprishaV2?.open) {
            window.AprishaV2.open();
            return true;
        }

        return false;
    }

    function startAprishaVoice() {
        if (window.AprishaV2?.open) {
            window.AprishaV2.open();

            setTimeout(() => {
                window.AprishaV2?.start?.();
            }, 220);

            return true;
        }

        return false;
    }

    function bindExistingApButtons() {
        const candidates =
            document.querySelectorAll(
                "button, a, [role='button'], .topbar-action, .toolbar-btn, .icon-btn"
            );

        candidates.forEach((element) => {
            if (element.dataset.aprishaV2Bridge === "1") return;
            if (isInsideAprishaV2(element)) return;

            const label = getLabel(element);

            const looksLikeAprisha =
                label === "ap" ||
                label === "aprisha" ||
                label.includes("open aprisha") ||
                label.includes("ap synapse voice");

            if (!looksLikeAprisha) return;

            element.dataset.aprishaV2Bridge = "1";
            element.setAttribute("title", "Open Aprisha");
            element.setAttribute("aria-label", "Open Aprisha");

            element.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openAprisha();
                },
                true
            );
        });
    }

    function bindComposerMic() {
        document.addEventListener(
            "click",
            (event) => {
                const button =
                    event.target.closest(
                        "button, [role='button'], a"
                    );

                if (!button) return;
                if (isInsideAprishaV2(button)) return;

                const label = getLabel(button);
                const html = String(button.innerHTML || "").toLowerCase();

                const looksLikeMic =
                    label.includes("microphone") ||
                    label.includes("mic") ||
                    label.includes("voice") ||
                    html.includes("microphone") ||
                    html.includes("mic");

                if (!looksLikeMic) return;

                event.preventDefault();
                event.stopPropagation();

                startAprishaVoice();
            },
            true
        );
    }

    function boot() {
        window.AprishaV2Bridge = {
            version: VERSION,
            bind: bindExistingApButtons,
            open: openAprisha,
            speak: startAprishaVoice
        };

        bindExistingApButtons();
        bindComposerMic();

        setInterval(bindExistingApButtons, 1500);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
