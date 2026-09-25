(() => {
    "use strict";

    const ID = "ap-intelligence-note";

    let note = null;
    let composer = null;
    let raf = 0;

    function findComposer() {
        const input = document.querySelector("#userInput");
        if (!input) return null;

        return (
            input.closest(".command-bar") ||
            input.closest("form") ||
            input.parentElement
        );
    }

    function createNote() {
        if (document.getElementById(ID)) {
            note = document.getElementById(ID);
            return note;
        }

        const el = document.createElement("div");

        el.id = ID;
        el.setAttribute("aria-hidden", "true");

        el.innerHTML = `
            <span class="ap-intelligence-note-star">✦</span>
            <span>Think without limits. Validate with care.</span>
        `;

        Object.assign(el.style, {
            position: "fixed",
            zIndex: "80",
            textAlign: "center",
            boxSizing: "border-box",
            padding: "0 14px",
            margin: "0",
            fontSize: "11px",
            lineHeight: "1.35",
            fontWeight: "500",
            letterSpacing: "0.025em",
            color: "rgba(255,255,255,.40)",
            userSelect: "none",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            opacity: "0",
            transform: "translateY(3px)",
            transition:
                "opacity .28s ease, transform .28s ease"
        });

        const star =
            el.querySelector(".ap-intelligence-note-star");

        if (star) {
            Object.assign(star.style, {
                display: "inline-block",
                marginRight: "6px",
                color: "rgba(214,177,91,.72)",
                textShadow:
                    "0 0 10px rgba(214,177,91,.18)"
            });
        }

        document.body.appendChild(el);

        requestAnimationFrame(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
        });

        note = el;
        return el;
    }

    function place() {
        raf = 0;

        composer = findComposer();

        if (!composer) {
            if (note) note.style.display = "none";
            return;
        }

        const el = createNote();
        const rect = composer.getBoundingClientRect();

        if (
            rect.width < 160 ||
            rect.bottom < 0 ||
            rect.top > window.innerHeight
        ) {
            el.style.display = "none";
            return;
        }

        el.style.display = "block";

        const desiredTop = rect.bottom + 8;
        const bottomSafe = window.innerHeight - 18;

        el.style.left = `${Math.round(rect.left)}px`;
        el.style.width = `${Math.round(rect.width)}px`;
        el.style.top =
            `${Math.round(Math.min(desiredTop, bottomSafe))}px`;

        if (window.innerWidth <= 640) {
            el.style.fontSize = "10px";
            el.style.whiteSpace = "normal";
            el.style.padding = "0 10px";
        } else {
            el.style.fontSize = "11px";
            el.style.whiteSpace = "nowrap";
            el.style.padding = "0 14px";
        }
    }

    function schedulePlace() {
        if (raf) return;

        raf =
            requestAnimationFrame(place);
    }

    function boot() {
        place();

        window.addEventListener(
            "resize",
            schedulePlace,
            { passive: true }
        );

        window.addEventListener(
            "scroll",
            schedulePlace,
            { passive: true }
        );

        new MutationObserver(schedulePlace)
            .observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true
            });

        if ("ResizeObserver" in window) {
            const ro =
                new ResizeObserver(schedulePlace);

            const current =
                findComposer();

            if (current) ro.observe(current);
        }
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