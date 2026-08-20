// =========================================
// AP SYNAPSE — INTELLIGENCE FIELD
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    const button = document.getElementById("intelligenceFieldBtn");
    const panel = document.getElementById("intelligenceFieldPanel");
    const closeButton = document.getElementById("closeIntelligenceField");

    if (!button || !panel) return;

    function openField() {

        panel.classList.add("open");
        panel.setAttribute("aria-hidden", "false");
        button.setAttribute("aria-expanded", "true");

    }

    function closeField() {

        panel.classList.remove("open");
        panel.setAttribute("aria-hidden", "true");
        button.setAttribute("aria-expanded", "false");

    }

    button.addEventListener("click", (event) => {

        event.stopPropagation();

        if (panel.classList.contains("open")) {
            closeField();
        } else {
            openField();
        }

    });

    if (closeButton) {
        closeButton.addEventListener("click", closeField);
    }

    panel.addEventListener("click", (event) => {

        if (event.target === panel) {
            closeField();
        }

    });

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeField();
        }

    });

});