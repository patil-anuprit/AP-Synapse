(() => {
    "use strict";

    const ID = "ap-intelligence-note";

    function mount() {
        const existing = document.getElementById(ID);
        if (existing?.isConnected) return;

        const input = document.querySelector("#userInput");
        if (!input) return;

        const composer =
            input.closest(".command-bar") ||
            input.closest("form") ||
            input.parentElement;

        if (!composer || !composer.parentElement) return;

        const note = document.createElement("div");

        note.id = ID;
        note.setAttribute("aria-hidden", "true");

        note.innerHTML = `
            <span class="ap-intelligence-note-star">✦</span>
            <span>Think without limits. Validate with care.</span>
        `;

        Object.assign(note.style, {
            width: "100%",
            boxSizing: "border-box",
            textAlign: "center",
            marginTop: "9px",
            padding: "0 16px 2px",
            fontSize: "11px",
            lineHeight: "1.45",
            fontWeight: "500",
            letterSpacing: "0.025em",
            color: "inherit",
            opacity: "0",
            transform: "translateY(3px)",
            userSelect: "none",
            pointerEvents: "none",
            filter: "saturate(.9)",
            transition:
                "opacity .35s ease, transform .35s ease"
        });

        const star =
            note.querySelector(".ap-intelligence-note-star");

        if (star) {
            Object.assign(star.style, {
                display: "inline-block",
                marginRight: "6px",
                color: "rgba(214,177,91,.78)",
                textShadow:
                    "0 0 12px rgba(214,177,91,.18)"
            });
        }

        composer.parentElement.insertBefore(
            note,
            composer.nextSibling
        );

        requestAnimationFrame(() => {
            note.style.opacity = "0.38";
            note.style.transform = "translateY(0)";
        });
    }

    function boot() {
        mount();

        const observer =
            new MutationObserver(() => mount());

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            boot,
            { once: true }
        );
    } else {
        boot();
    }
})();