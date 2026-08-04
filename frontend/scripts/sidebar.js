import { openPage } from "./workspace/workspaceRouter.js";
import { openAssistant } from "./workspace/assistant.js";
import {
    getConversations,
    getConversation,
    deleteConversation
} from "./workspace/history.js";
import { createConversation } from "./workspace/history.js";

const sidebar = document.querySelector(".sidebar");
window.renderHistory = renderHistory;

const projectsBtn = document.getElementById("projectsBtn");

const historyItems = document.querySelectorAll(".history-item");

console.log(projectsBtn);

const codeStudioBtn = document.getElementById("codeStudioBtn");

const historyContainer =
    document.querySelector(".history-list");

    // ======================================
// AP SYNAPSE — DYNAMIC HISTORY
// ======================================

function renderHistory() {

    const historyContainer =
        document.querySelector(".history-list");

    if (!historyContainer) {
        console.error("❌ .history-list NOT FOUND");
        return;
    }

    let rawHistory = [];

    try {
        rawHistory = getConversations();
    } catch (error) {
        console.error("❌ getConversations failed:", error);
        return;
    }

    // Always normalize history into an array
    let conversations = [];

    if (Array.isArray(rawHistory)) {

        conversations = rawHistory;

    } else if (
        rawHistory &&
        Array.isArray(rawHistory.conversations)
    ) {

        conversations = rawHistory.conversations;

    } else if (
        rawHistory &&
        typeof rawHistory === "object"
    ) {

        conversations = Object.values(rawHistory);

    }

    console.log(
        "📚 FINAL HISTORY ARRAY:",
        conversations
    );

    historyContainer.innerHTML = "";

    if (conversations.length === 0) {

        historyContainer.innerHTML = `
            <div class="history-empty">
                No conversations yet
            </div>
        `;

        return;
    }

    conversations.forEach((conversation) => {

        if (!conversation) return;

        const id = conversation.id;

        const title =
            conversation.title ||
            conversation.name ||
            "New Conversation";

        const messages =
            Array.isArray(conversation.messages)
                ? conversation.messages
                : [];

        const lastMessage =
            messages.length > 0
                ? messages[messages.length - 1]
                : null;

        const preview =
            lastMessage?.content ||
            lastMessage?.text ||
            "No messages yet";

        const item =
            document.createElement("div");

        item.className = "history-item";

        item.dataset.conversationId =
            id ?? "";

        item.innerHTML = `
            <div class="history-item-content">

                <div class="history-title">
                    ${escapeHTML(title)}
                </div>

                <div class="history-preview">
                    ${escapeHTML(preview).slice(0, 70)}
                </div>

                <div class="history-time">
                    ${formatHistoryTime(
                        conversation.updatedAt ||
                        conversation.createdAt
                    )}
                </div>

            </div>

            <button
                class="history-delete"
                title="Delete conversation"
                type="button"
            >
                ×
            </button>
        `;

        // OPEN CONVERSATION
        item.addEventListener("click", (event) => {

            if (
                event.target.closest(".history-delete")
            ) {
                return;
            }

            document
                .querySelectorAll(".history-item")
                .forEach(element => {
                    element.classList.remove("active");
                });

            item.classList.add("active");

            openSavedConversation(id);

        });

        // DELETE CONVERSATION
        const deleteBtn =
            item.querySelector(".history-delete");

        deleteBtn.addEventListener("click", (event) => {

            event.preventDefault();
            event.stopPropagation();

            if (!id) return;

            deleteConversation(id);

            renderHistory();

        });

        historyContainer.appendChild(item);

    });

    console.log(
        `✅ ${conversations.length} conversations rendered`
    );
}

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;

}

function formatHistoryTime(dateString) {

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const now = new Date();

    const diff =
        Math.floor(
            (now - date) / 1000
        );

    if (diff < 60) {
        return "Just now";
    }

    if (diff < 3600) {
        return `${Math.floor(diff / 60)}m ago`;
    }

    if (diff < 86400) {
        return `${Math.floor(diff / 3600)}h ago`;
    }

    if (diff < 604800) {
        return `${Math.floor(diff / 86400)}d ago`;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short"
        }
    );
}

// ======================================
// RESTORE SAVED CONVERSATION
// ======================================

function openSavedConversation(id) {

    const conversation = getConversation(id);

    if (!conversation) {
        console.warn(
            "Conversation not found:",
            id
        );
        return;
    }

    const chatWindow =
        document.getElementById("chatWindow");

    const heroScreen =
        document.getElementById("heroScreen");

    if (!chatWindow) {
        console.warn("Chat window not found.");
        return;
    }

    // ======================================
    // HIDE HERO
    // ======================================

    if (heroScreen) {
        heroScreen.style.display = "none";
    }

    // ======================================
    // SHOW CHAT
    // ======================================

    chatWindow.style.display = "flex";

    // ======================================
    // CLEAR OLD CHAT
    // ======================================

    chatWindow.innerHTML = "";

    // ======================================
    // RESTORE SAVED MESSAGES
    // ======================================

    conversation.messages.forEach(message => {

        const wrapper =
            document.createElement("div");

        wrapper.className =
           `message ${
              message.role === "user"
                  ? "user"
                  : "assistant"
        }`;

        // ----------------------------------
        // AVATAR
        // ----------------------------------

        const avatar =
            document.createElement("div");

        avatar.className = "avatar";

        avatar.textContent =
            message.role === "user"
                ? "U"
                : "AP";

        // ----------------------------------
        // MESSAGE BODY
        // ----------------------------------

        const body =
            document.createElement("div");

        body.className = "message-body";

        // ----------------------------------
        // MARKDOWN
        // ----------------------------------

        if (window.marked) {

            body.innerHTML =
                marked.parse(
                    message.content || ""
                );

        } else {

            body.textContent =
                message.content || "";

        }

        // ----------------------------------
        // AI ACTIONS
        // ----------------------------------

        if (message.role === "assistant") {

            const actions =
                document.createElement("div");

            actions.className =
                "message-actions";

            actions.innerHTML = `

                <button class="copyBtn">
                    📋 Copy
                </button>

                <button class="speakBtn">
                    🔊 Read Aloud
                </button>

            `;

            body.appendChild(actions);

        }

        // ==================================
        // IMPORTANT:
        // avatar and body are SIBLINGS
        // ==================================

        wrapper.appendChild(avatar);
        wrapper.appendChild(body);

        chatWindow.appendChild(wrapper);

    });

    // ======================================
    // SET ACTIVE CONVERSATION
    // ======================================

    window.currentConversationId =
        conversation.id;

    if (window.setActiveConversation) {

        window.setActiveConversation(
            conversation.id
        );

    }

    // ======================================
    // DEBUG
    // ======================================

    console.log(
        "✅ Conversation restored:",
        conversation.title
    );

    console.log(
        "Messages restored:",
        conversation.messages.length
    );

    // ======================================
// FINAL VIEW — OPEN SAVED CONVERSATION
// ======================================

requestAnimationFrame(() => {

    requestAnimationFrame(() => {

        // Hide homepage completely
        if (heroScreen) {

            heroScreen.style.setProperty(
                "display",
                "none",
                "important"
            );

            heroScreen.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            heroScreen.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

        }

        // Show conversation
        chatWindow.style.setProperty(
            "display",
            "flex",
            "important"
        );

        chatWindow.style.setProperty(
            "visibility",
            "visible",
            "important"
        );

        chatWindow.style.setProperty(
            "opacity",
            "1",
            "important"
        );

        // Move to latest message
        chatWindow.scrollTop =
            chatWindow.scrollHeight;

        console.log(
            "✅ Conversation positioned correctly:",
            conversation.title
        );

    });

});

    // ======================================
// RESTORE EXACT CONVERSATION POSITION
// ======================================

requestAnimationFrame(() => {

    requestAnimationFrame(() => {

        const messages =
            chatWindow.querySelectorAll(".message");

        const lastMessage =
            messages[messages.length - 1];

        if (lastMessage) {

            lastMessage.scrollIntoView({
                behavior: "instant",
                block: "end"
            });

        }

    });

});

}

renderHistory();

const workspaceItems = document.querySelectorAll(".sidebar nav a");

const newChatBtn = document.querySelector(".new-chat-btn")

workspaceItems.forEach(item=>{

item.addEventListener("mouseenter",()=>{

item.style.transform="translateX(6px)";

});

item.addEventListener("mouseleave",()=>{

item.style.transform="translateX(0px)";

});

});

newChatBtn.addEventListener("click", () => {

    const chatWindow = document.getElementById("chatWindow");
    const hero = document.getElementById("heroScreen");
    const input = document.getElementById("userInput");

    // Clear current conversation UI
    if (chatWindow) {
        chatWindow.innerHTML = "";
        chatWindow.style.display = "none";
    }

    // Return to hero
    if (hero) {
        hero.style.display = "flex";
        hero.style.opacity = "1";
        hero.style.transform = "translateY(0)";
    }

    // Clear input
    if (input) {
        input.value = "";
        input.focus();
    }

    // Create a new saved conversation
    const conversation = createConversation("New Conversation");

    console.log("🆕 New conversation created:", conversation);

    renderHistory();

});

// ===============================
// Projects Page
// ===============================

document.querySelectorAll(".sidebar nav a").forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        // Highlight active menu
        document.querySelectorAll(".sidebar nav a")
            .forEach(a => a.classList.remove("active"));

        link.classList.add("active");

        const page = link.textContent.trim().toLowerCase();

        switch(page){

    case "assistant":

        document.body.dataset.page = "assistant";

        openPage("assistant");
        openAssistant();

        break;


    case "projects":

        document.body.dataset.page = "projects";

        openPage("projects");

        break;


    case "knowledge":

        document.body.dataset.page = "knowledge";

        openPage("knowledge");

        break;


    case "documents":

        document.body.dataset.page = "documents";

        openPage("documents");

        break;


    case "automation":

        document.body.dataset.page = "automation";

        openPage("automation");

        break;


    case "canvas":

        document.body.dataset.page = "canvas";

        openPage("canvas");

        break;


    case "code studio":

        document.body.dataset.page = "codestudio";

        openPage("codestudio");

        break;

    case "settings":

    document.body.dataset.page = "settings";

    openPage("settings");

    break;

}

    });

});

window.renderHistory = renderHistory;

window.refreshHistory = function () {
    renderHistory();
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        renderHistory();
    });
} else {
    renderHistory();
}

// ======================================================
// AP SYNAPSE — INTELLIGENCE ACTIONS
// ======================================================

document.querySelectorAll(".console-action").forEach(button => {

    button.addEventListener("click", () => {

        const action = button.dataset.action;

        console.log("AP Synapse action:", action);

        switch (action) {

            case "research":
                startIntelligenceMode(
                    "Research",
                    "What would you like to research?"
                );
                break;

            case "write":
                startIntelligenceMode(
                    "Write",
                    "What would you like to write?"
                );
                break;

            case "code":
                openPage("codestudio");
                document.body.dataset.page = "codestudio";
                break;

            case "analyze":
                startIntelligenceMode(
                    "Analyze",
                    "What would you like to analyze?"
                );
                break;

            case "learn":
                startIntelligenceMode(
                    "Learn",
                    "What would you like to learn?"
                );
                break;

            case "plan":
                startIntelligenceMode(
                    "Plan",
                    "What would you like to plan?"
                );
                break;

            case "create":
                startIntelligenceMode(
                    "Create",
                    "What would you like to create?"
                );
                break;

            case "explore":
                startIntelligenceMode(
                    "Explore",
                    "What would you like to explore?"
                );
                break;

        }

    });

});


function startIntelligenceMode(mode, placeholder) {

    const hero =
        document.getElementById("heroScreen");

    const chat =
        document.getElementById("chatWindow");

    const input =
        document.getElementById("userInput");

    if (hero) {
        hero.style.display = "none";
    }

    if (chat) {
        chat.style.display = "flex";
        chat.innerHTML = "";
    }

    if (input) {

        input.placeholder =
            placeholder;

        input.focus();

    }

    window.apSynapseMode = mode;

    console.log(
        `🧠 AP Synapse mode: ${mode}`
    );

}

// ======================================================
// RECENT INTELLIGENCE
// ======================================================

function renderRecentIntelligence() {

    const grid =
        document.getElementById(
            "recentIntelligenceGrid"
        );

    if (!grid) return;

    const conversations =
        getConversations();

    grid.innerHTML = "";

    const recent =
        conversations.slice(0, 4);

    if (!recent.length) {

        grid.innerHTML = `
            <div class="recent-card">
                <div class="recent-card-title">
                    No recent intelligence
                </div>

                <div class="recent-card-meta">
                    Start a conversation with AP Synapse.
                </div>
            </div>
        `;

        return;
    }

    recent.forEach(conversation => {

        const card =
            document.createElement("div");

        card.className =
            "recent-card";

        card.innerHTML = `

            <div class="recent-card-title">
                ${escapeHTML(
                    conversation.title ||
                    "New Conversation"
                )}
            </div>

            <div class="recent-card-meta">
                ${formatHistoryTime(
                    conversation.updatedAt ||
                    conversation.createdAt
                )}
            </div>

            <div class="recent-card-action">
                Continue →
            </div>

        `;

        card.addEventListener(
            "click",
            () => {

                openSavedConversation(
                    conversation.id
                );

            }
        );

        grid.appendChild(card);

    });

}

renderRecentIntelligence();

// =====================================
// AP SYNAPSE CANVAS
// =====================================

const canvas = document.getElementById("apCanvas");

if (canvas) {

    const ctx = canvas.getContext("2d");

    let drawing = false;
    let erasing = false;

    function position(e) {

        const rect = canvas.getBoundingClientRect();

        return {
            x: (e.clientX - rect.left) *
               (canvas.width / rect.width),

            y: (e.clientY - rect.top) *
               (canvas.height / rect.height)
        };

    }

    canvas.addEventListener("pointerdown", e => {

        drawing = true;

        const p = position(e);

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);

    });

    canvas.addEventListener("pointermove", e => {

        if (!drawing) return;

        const p = position(e);

        ctx.lineWidth = erasing ? 30 : 4;
        ctx.lineCap = "round";
        ctx.strokeStyle = erasing ? "#ffffff" : "#111111";

        ctx.lineTo(p.x, p.y);
        ctx.stroke();

    });

    canvas.addEventListener("pointerup", () => {

        drawing = false;

    });

    canvas.addEventListener("pointerleave", () => {

        drawing = false;

    });

    document.getElementById("canvasPen")?.addEventListener(
        "click",
        () => erasing = false
    );

    document.getElementById("canvasErase")?.addEventListener(
        "click",
        () => erasing = true
    );

    document.getElementById("canvasClear")?.addEventListener(
        "click",
        () => ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        )
    );

}