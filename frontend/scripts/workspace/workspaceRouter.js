const pages = {};

export function registerPage(name, id, display = "block") {

    const element = document.getElementById(id);

    if (!element) {
        console.warn(`Missing page: ${id}`);
        return;
    }

    pages[name] = {
        element,
        display
    };
}


export function openPage(name) {

    console.log("NAVIGATING TO:", name);

    // ==========================================
    // HIDE EVERY REGISTERED PAGE
    // ==========================================

    Object.values(pages).forEach(page => {

        page.element.style.setProperty(
            "display",
            "none",
            "important"
        );

        page.element.style.setProperty(
            "visibility",
            "hidden",
            "important"
        );

        page.element.style.setProperty(
            "opacity",
            "0",
            "important"
        );

        page.element.style.setProperty(
            "pointer-events",
            "none",
            "important"
        );

        page.element.setAttribute(
            "aria-hidden",
            "true"
        );

    });


    // ==========================================
    // FIND REQUESTED PAGE
    // ==========================================

    const page = pages[name];

    if (!page) {

        console.warn(
            `Page '${name}' is not registered.`
        );

        return;
    }


    // ==========================================
    // SHOW ONLY REQUESTED PAGE
    // ==========================================

    page.element.style.setProperty(
        "display",
        page.display,
        "important"
    );

    page.element.style.setProperty(
        "visibility",
        "visible",
        "important"
    );

    page.element.style.setProperty(
        "opacity",
        "1",
        "important"
    );

    page.element.style.setProperty(
        "pointer-events",
        "auto",
        "important"
    );

    page.element.setAttribute(
        "aria-hidden",
        "false"
    );



    // ======================================================
    // AP SYNAPSE — RESTORED CHAT WINS
    // ======================================================

    if (name === "assistant") {

        const hero =
            document.getElementById("heroScreen");

        const chat =
            document.getElementById("chatWindow");

        const hasRestoredConversation =
            chat &&
            chat.children.length > 0 &&
            chat.textContent.trim().length > 0;

        if (hasRestoredConversation) {

            document.body.classList.add(
                "chat-active"
            );

            if (hero) {

                hero.style.setProperty(
                    "display",
                    "none",
                    "important"
                );

                hero.style.setProperty(
                    "visibility",
                    "hidden",
                    "important"
                );

                hero.style.setProperty(
                    "opacity",
                    "0",
                    "important"
                );

                hero.style.setProperty(
                    "pointer-events",
                    "none",
                    "important"
                );
            }

            chat.style.setProperty(
                "display",
                "flex",
                "important"
            );

            chat.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

            chat.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            console.log(
                "✅ AP SYNAPSE — RESTORED CHAT OWNS ASSISTANT"
            );
        }
    }
    console.log("OPENED:",
        page.element.id
    );

}

// ======================================================
// AP SYNAPSE â€” HERO ACTION BUTTONS
// ======================================================

export function setupHeroActions() {

    const buttons = document.querySelectorAll(".hero-action-btn");

    if (!buttons.length) {
        console.warn("Hero action buttons not found.");
        return;
    }

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const mode = button.dataset.mode;

            console.log("HERO ACTION:", mode);

            // ==========================================
            // CODE â†’ CODE STUDIO
            // ==========================================

            if (mode === "code") {

                openPage("codestudio");

                return;
            }


            // ==========================================
            // ALL OTHER MODES â†’ ASSISTANT
            // ==========================================

            openPage("assistant");


            // Tell Assistant which mode was selected
            window.dispatchEvent(
                new CustomEvent("apSynapseModeChange", {
                    detail: {
                        mode
                    }
                })
            );


            // ==========================================
            // FOCUS CHAT INPUT
            // ==========================================

            setTimeout(() => {

                const input =
                    document.getElementById("userInput");

                if (!input) return;

                const placeholders = {

                    research:
                        "Ask AP Synapse to research anything...",

                    write:
                        "What would you like AP Synapse to write?",

                    analyse:
                        "What would you like AP Synapse to analyse?",

                    plan:
                        "What would you like AP Synapse to plan?",

                    create:
                        "What would you like AP Synapse to create?"

                };

                input.placeholder =
                    placeholders[mode] ||
                    "Ask AP Synapse anything...";

                input.focus();

            }, 50);

        });

    });

    console.log(
        `âœ… ${buttons.length} hero action buttons connected`
    );
}

setupHeroActions();


/* ============================================================
   AP SYNAPSE â€” NATIVE WORKSPACE ROUTER BRIDGE
   Allows History to open Assistant through the official router.
   ============================================================ */

window.APWorkspaceOpenPage = openPage;

console.log(
    "âœ… AP SYNAPSE â€” WORKSPACE ROUTER BRIDGE READY"
);

