import {
    getConversations
} from "./workspace/history.js";

import "./workspace/knowledge.js";
import "./brain.js";

import {
    registerPage,
    openPage
} from "./workspace/workspaceRouter.js";

import {
    openAssistant
} from "./workspace/assistant.js";

document.addEventListener("DOMContentLoaded", () => {

    console.log("🚀 AP Synapse Started");

    console.log(
        "📚 History Engine:",
        getConversations()
    );

    // Register every page
    registerPage("assistant", "assistantPage", "block");
    registerPage("projects", "projectsPage", "block");
    registerPage("codestudio", "codeStudioPage", "block");
    registerPage("workspace", "workspacePage", "block"); 
    registerPage("knowledge", "knowledgePage", "block");
    registerPage("documents", "documentsPage", "block");
    registerPage("automation", "automationPage", "block");
    registerPage("canvas", "canvasPage", "block");
    registerPage("settings", "settingsPage", "block");

    // Start AP Synapse on Assistant
    requestAnimationFrame(() => {

        openPage("assistant");

        requestAnimationFrame(() => {

            openAssistant();

            // Make sure the initial assistant surface is visible
            const assistant =
                document.getElementById("assistantPage");

            const hero =
                document.getElementById("heroScreen");

            if (assistant) {
                assistant.style.removeProperty("top");
                assistant.style.removeProperty("transform");
                assistant.style.removeProperty("margin-top");
            }

            if (hero) {
                hero.style.removeProperty("top");
                hero.style.removeProperty("transform");
                hero.style.removeProperty("margin-top");
            }

            console.log("✅ AP Synapse Assistant initialized");

        });

    });

});