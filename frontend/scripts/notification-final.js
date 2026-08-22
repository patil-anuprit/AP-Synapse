/* ============================================================
   AP SYNAPSE — STABLE FINAL NOTIFICATIONS
   Event-driven only.
   ============================================================ */

(() => {
    "use strict";

    const normalize = value =>
        String(value || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();


    function ownText(el) {

        return [...el.childNodes]
            .filter(node =>
                node.nodeType === Node.TEXT_NODE
            )
            .map(node => node.textContent || "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
    }


    function findLeaf(root, wanted) {

        wanted = normalize(wanted);

        return [...root.querySelectorAll("*")]
            .find(el =>
                normalize(ownText(el)) === wanted
            ) || null;
    }


    function closePanel(root) {

        if (
            root.contains(
                document.activeElement
            )
        ) {
            document.activeElement?.blur?.();
        }


        root.setAttribute(
            "aria-hidden",
            "true"
        );


        try {
            root.inert = true;
        } catch {}


        root.classList.remove(
            "open",
            "active",
            "visible",
            "show",
            "is-open"
        );


        root.style.display = "none";
    }


    function ensureClose(root) {

        let close =
            root.querySelector(
                ".ap-notification-close-final"
            );


        if (close) return;


        close =
            document.createElement("button");

        close.type = "button";

        close.className =
            "ap-notification-close-final";

        close.title =
            "Close";

        close.setAttribute(
            "aria-label",
            "Close notifications"
        );


        close.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6L18 18"></path>
                <path d="M18 6L6 18"></path>
            </svg>
        `;


        close.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                closePanel(root);
            }
        );


        root.appendChild(close);
    }


    function decorate(root) {

        const kicker =
            findLeaf(root, "AP SYNAPSE");

        const title =
            findLeaf(root, "Notifications");

        const subtitle =
            findLeaf(
                root,
                "You're all caught up."
            );

        const mark =
            findLeaf(
                root,
                "Mark all as read"
            );

        const clear =
            findLeaf(
                root,
                "Clear"
            );

        const footer =
            [...root.querySelectorAll("*")]
                .find(el =>
                    normalize(ownText(el))
                        .includes(
                            "ap synapse intelligence workspace"
                        )
                );

        const preferences =
            [...root.querySelectorAll("*")]
                .find(el =>
                    normalize(ownText(el))
                        .includes(
                            "notification preferences"
                        )
                );


        kicker?.classList.add(
            "ap-final-notification-kicker"
        );

        title?.classList.add(
            "ap-final-notification-title"
        );

        subtitle?.classList.add(
            "ap-final-notification-subtitle"
        );


        if (title?.parentElement) {

            title.parentElement.classList.add(
                "ap-final-notification-header"
            );
        }


        mark?.classList.add(
            "ap-final-notification-action"
        );

        clear?.classList.add(
            "ap-final-notification-action"
        );


        if (
            mark &&
            clear &&
            mark.parentElement === clear.parentElement
        ) {

            mark.parentElement.classList.add(
                "ap-final-notification-actions"
            );
        }


        footer?.classList.add(
            "ap-final-notification-footer-label"
        );

        preferences?.classList.add(
            "ap-final-notification-preferences"
        );


        if (
            footer &&
            preferences &&
            footer.parentElement ===
                preferences.parentElement
        ) {

            footer.parentElement.classList.add(
                "ap-final-notification-footer"
            );
        }
    }


    function repairNotifications() {

        if (window.innerWidth > 760) return;


        const root =
            document.getElementById(
                "apSynapseNotificationCenter"
            );


        if (!root) return;


        ensureClose(root);

        decorate(root);


        const style =
            getComputedStyle(root);


        if (
            style.display !== "none" &&
            style.visibility !== "hidden"
        ) {

            root.setAttribute(
                "aria-hidden",
                "false"
            );

            try {
                root.inert = false;
            } catch {}
        }
    }


    function scheduleNotificationRepair() {

        requestAnimationFrame(
            repairNotifications
        );

        setTimeout(
            repairNotifications,
            150
        );
    }


    document.addEventListener(
        "click",
        scheduleNotificationRepair,
        true
    );


    window.addEventListener(
        "resize",
        repairNotifications,
        { passive: true }
    );


    document.addEventListener(
        "DOMContentLoaded",
        repairNotifications
    );


    console.log(
        "✅ AP SYNAPSE — STABLE NOTIFICATIONS READY"
    );

})();
