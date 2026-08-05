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

/* ============================================================
   AP SYNAPSE — FINAL MOBILE SIDEBAR
   CLEAN FINAL VERSION
   ============================================================ */

(() => {
    "use strict";

    const BREAKPOINT = 767;

    function elements() {
        return {
            sidebar: document.querySelector(".sidebar"),
            button: document.querySelector(".mobile-menu-button"),
            overlay: document.querySelector(".mobile-sidebar-overlay")
        };
    }

    function ensureElements() {

        let { button, overlay } = elements();

        if (!button) {
            button = document.createElement("button");

            button.className = "mobile-menu-button";
            button.type = "button";
            button.textContent = "☰";
            button.setAttribute(
                "aria-label",
                "Open AP Synapse navigation"
            );
            button.setAttribute(
                "aria-expanded",
                "false"
            );

            document.body.appendChild(button);
        }

        if (!overlay) {
            overlay = document.createElement("div");

            overlay.className =
                "mobile-sidebar-overlay";

            document.body.appendChild(overlay);
        }

        return elements();
    }

    /* ========================================================
       FINAL MOBILE SIDEBAR CSS
       ======================================================== */

    function installFinalCSS() {

        document
            .getElementById("AP-SYNAPSE-FINAL-SIDEBAR-CSS")
            ?.remove();

        const style =
            document.createElement("style");

        style.id =
            "AP-SYNAPSE-FINAL-SIDEBAR-CSS";

        style.textContent = `

        /* =====================================================
           DESKTOP
           ===================================================== */

        @media (min-width: 768px) {

            .mobile-menu-button,
            .mobile-sidebar-overlay {
                display: none !important;
            }

        }


        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 767px) {

            html,
            body {
                width: 100%;
                max-width: 100%;
                overflow-x: hidden !important;
            }


            /* =================================================
               MENU BUTTON
               ================================================= */

            .mobile-menu-button {

                position: fixed !important;

                top:
                    calc(
                        12px +
                        env(safe-area-inset-top)
                    ) !important;

                left: 12px !important;

                width: 48px !important;
                height: 48px !important;

                display: flex !important;

                align-items: center !important;
                justify-content: center !important;

                padding: 0 !important;
                margin: 0 !important;

                border: 1px solid
                    rgba(198,166,107,.45) !important;

                border-radius: 15px !important;

                background:
                    rgba(14,16,20,.97) !important;

                color: #f5f5f3 !important;

                font-size: 24px !important;
                line-height: 1 !important;

                z-index: 2147483647 !important;

                pointer-events: auto !important;
                touch-action: manipulation !important;

                cursor: pointer !important;

                box-shadow:
                    0 10px 30px
                    rgba(0,0,0,.35) !important;
            }


            /* =================================================
               OVERLAY
               IMPORTANT:
               IT MUST NEVER COVER THE SIDEBAR
               ================================================= */

            .mobile-sidebar-overlay {

                position: fixed !important;

                inset: 0 !important;

                width: 100vw !important;
                height: 100dvh !important;

                background:
                    rgba(0,0,0,.45) !important;

                opacity: 0 !important;
                visibility: hidden !important;

                pointer-events: none !important;

                z-index: 999998 !important;

                transition:
                    opacity .2s ease,
                    visibility .2s ease !important;
            }

            .mobile-sidebar-overlay.ap-sidebar-visible {

                opacity: 1 !important;

                visibility: visible !important;

                pointer-events: auto !important;
            }


            /* =================================================
               SIDEBAR
               ================================================= */

            aside.sidebar {

                position: fixed !important;

                top: 0 !important;
                left: 0 !important;
                bottom: 0 !important;

                width:
                    min(326px, 88vw) !important;

                height: 100dvh !important;

                max-height: 100dvh !important;

                display: flex !important;

                flex-direction: column !important;

                box-sizing: border-box !important;

                margin: 0 !important;

                padding: 0 !important;

                background:
                    linear-gradient(
                        180deg,
                        rgba(20,22,27,.995),
                        rgba(10,12,16,.995)
                    ) !important;

                z-index: 999999 !important;

                overflow-x: hidden !important;
                overflow-y: auto !important;

                -webkit-overflow-scrolling: touch !important;

                transform:
                    translate3d(-105%,0,0) !important;

                visibility: hidden !important;

                pointer-events: none !important;

                opacity: 1 !important;

                transition:
                    transform .28s
                    cubic-bezier(.22,.61,.36,1),
                    visibility .28s ease !important;
            }


            /* =================================================
               SIDEBAR OPEN
               ================================================= */

            aside.sidebar.ap-sidebar-open {

                transform:
                    translate3d(0,0,0) !important;

                visibility: visible !important;

                pointer-events: auto !important;
            }


            /* =================================================
               CRITICAL:
               SIDEBAR CHILDREN MUST STAY IN NORMAL FLOW
               ================================================= */

            aside.sidebar > * {

                position: relative !important;

                top: auto !important;
                right: auto !important;
                bottom: auto !important;
                left: auto !important;

                transform: none !important;

                float: none !important;

                box-sizing: border-box !important;

                width: 100% !important;

                flex-shrink: 0 !important;
            }


            /* =================================================
               HEADER
               ================================================= */

            .sidebar-header {

                position: relative !important;

                width: 100% !important;

                height: auto !important;

                min-height: 70px !important;

                flex: 0 0 auto !important;

                z-index: 10 !important;
            }


            /* =================================================
               EVERY SIDEBAR GROUP
               ================================================= */

            aside.sidebar > .sidebar-group {

                position: relative !important;

                display: flex !important;

                flex-direction: column !important;

                width: 100% !important;

                height: auto !important;

                min-height: 0 !important;

                flex: 0 0 auto !important;

                overflow: visible !important;

                transform: none !important;

                z-index: 10 !important;
            }


            /* =================================================
               RECENT / HISTORY SECTION
               ================================================= */

            aside.sidebar > .recent-group {

                order: 2 !important;

                height: auto !important;

                min-height: 0 !important;

                margin: 0 !important;

                padding: 0 !important;

                overflow: visible !important;
            }


            /* =================================================
               HISTORY LIST
               ================================================= */

            aside.sidebar .history-list {

                position: relative !important;

                display: flex !important;

                flex-direction: column !important;

                width: 100% !important;

                height: auto !important;

                min-height: 0 !important;

                max-height: none !important;

                margin: 0 !important;

                padding: 0 !important;

                overflow: visible !important;

                transform: none !important;

                flex: 0 0 auto !important;
            }


            /* =================================================
               HISTORY ITEMS
               ================================================= */

            aside.sidebar .history-item {

                position: relative !important;

                display: flex !important;

                flex-direction: row !important;

                align-items: center !important;

                width: 100% !important;

                min-width: 0 !important;

                height: auto !important;

                min-height: 54px !important;

                margin: 0 !important;

                padding: 8px 12px !important;

                box-sizing: border-box !important;

                flex: 0 0 auto !important;

                transform: none !important;

                float: none !important;

                overflow: visible !important;

                z-index: 1 !important;

                pointer-events: auto !important;
            }


            .history-item-content {

                position: relative !important;

                display: flex !important;

                flex-direction: column !important;

                width: auto !important;

                min-width: 0 !important;

                flex: 1 1 auto !important;

                overflow: hidden !important;

                transform: none !important;
            }


            .history-title,
            .history-preview,
            .history-time {

                position: relative !important;

                width: 100% !important;

                overflow: hidden !important;

                text-overflow: ellipsis !important;

                white-space: nowrap !important;

                transform: none !important;
            }


            .history-delete {

                position: relative !important;

                flex: 0 0 auto !important;

                z-index: 5 !important;

                pointer-events: auto !important;
            }


            /* =================================================
               MAIN NAVIGATION SECTION
               ================================================= */

            aside.sidebar > .sidebar-group:not(.recent-group) {

                order: 3 !important;

                display: flex !important;

                flex-direction: column !important;

                width: 100% !important;

                height: auto !important;

                min-height: 0 !important;

                margin: 0 !important;

                padding: 0 !important;

                overflow: visible !important;
            }


            /* =================================================
               NAV
               ================================================= */

            aside.sidebar nav {

                position: relative !important;

                display: flex !important;

                flex-direction: column !important;

                width: 100% !important;

                height: auto !important;

                min-height: 0 !important;

                margin: 0 !important;

                padding: 0 !important;

                overflow: visible !important;

                transform: none !important;

                flex: 0 0 auto !important;

                z-index: 20 !important;
            }


            /* =================================================
               NAV LINKS
               ================================================= */

            aside.sidebar nav a {

                position: relative !important;

                display: flex !important;

                align-items: center !important;

                width: 100% !important;

                height: 48px !important;

                min-height: 48px !important;

                max-height: 48px !important;

                margin: 0 !important;

                padding: 0 18px !important;

                box-sizing: border-box !important;

                flex: 0 0 48px !important;

                transform: none !important;

                float: none !important;

                overflow: hidden !important;

                z-index: 21 !important;

                pointer-events: auto !important;

                touch-action: manipulation !important;
            }


            /* =================================================
               FOOTER
               ================================================= */

            aside.sidebar > .sidebar-footer {

                order: 99 !important;

                position: relative !important;

                width: 100% !important;

                height: auto !important;

                min-height: 70px !important;

                margin-top: auto !important;

                flex: 0 0 auto !important;

                z-index: 50 !important;
            }


            /* =================================================
               BODY LOCK
               ================================================= */

            body.ap-sidebar-locked {

                overflow: hidden !important;
            }

        }
        `;

        document.head.appendChild(style);
    }


    /* ========================================================
       OPEN
       ======================================================== */

    function openSidebar() {

        const {
            sidebar,
            button,
            overlay
        } = ensureElements();

        if (!sidebar) return;

        sidebar.classList.add(
            "ap-sidebar-open"
        );

        overlay?.classList.add(
            "ap-sidebar-visible"
        );

        document.body.classList.add(
            "ap-sidebar-locked"
        );

        if (button) {

            button.textContent = "×";

            button.setAttribute(
                "aria-expanded",
                "true"
            );

            button.setAttribute(
                "aria-label",
                "Close AP Synapse navigation"
            );
        }

        console.log(
            "🚀 AP SYNAPSE SIDEBAR OPEN"
        );
    }


    /* ========================================================
       CLOSE
       ======================================================== */

    function closeSidebar() {

        const {
            sidebar,
            button,
            overlay
        } = elements();

        sidebar?.classList.remove(
            "ap-sidebar-open"
        );

        overlay?.classList.remove(
            "ap-sidebar-visible"
        );

        document.body.classList.remove(
            "ap-sidebar-locked"
        );

        if (button) {

            button.textContent = "☰";

            button.setAttribute(
                "aria-expanded",
                "false"
            );

            button.setAttribute(
                "aria-label",
                "Open AP Synapse navigation"
            );
        }
    }


    /* ========================================================
       TOGGLE
       ======================================================== */

    function toggleSidebar(event) {

        event.preventDefault();
        event.stopPropagation();

        const { sidebar } = elements();

        if (!sidebar) return;

        if (
            sidebar.classList.contains(
                "ap-sidebar-open"
            )
        ) {

            closeSidebar();

        } else {

            openSidebar();

        }
    }


    /* ========================================================
       INITIALIZE
       ======================================================== */

    function initialize() {

        installFinalCSS();

        const {
            button,
            overlay,
            sidebar
        } = ensureElements();

        if (!sidebar) {

            console.error(
                "❌ AP SYNAPSE SIDEBAR NOT FOUND"
            );

            return;
        }


        /* Remove duplicate old mobile elements */

        document
            .querySelectorAll(".mobile-menu-button")
            .forEach((element, index) => {

                if (index > 0) {
                    element.remove();
                }

            });

        document
            .querySelectorAll(".mobile-sidebar-overlay")
            .forEach((element, index) => {

                if (index > 0) {
                    element.remove();
                }

            });


        /* =====================================================
           CLEAN OLD STATE
           ===================================================== */

        sidebar.classList.remove(
            "ap-sidebar-open"
        );

        overlay?.classList.remove(
            "ap-sidebar-visible"
        );

        document.body.classList.remove(
            "ap-sidebar-locked"
        );


        /* =====================================================
           MENU BUTTON
           ===================================================== */

        if (button) {

            button.onclick = null;

            button.addEventListener(
                "click",
                toggleSidebar,
                {
                    passive: false
                }
            );
        }


        /* =====================================================
           OVERLAY
           ===================================================== */

        if (overlay) {

            overlay.onclick = null;

            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target === overlay
                    ) {

                        closeSidebar();

                    }

                }
            );
        }


        /* =====================================================
           ESCAPE
           ===================================================== */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
                ) {

                    closeSidebar();

                }

            }
        );


        /* =====================================================
           NAVIGATION CLOSE
           ===================================================== */

        sidebar.addEventListener(
            "click",
            event => {

                const link =
                    event.target.closest(
                        "nav a"
                    );

                if (!link) return;

                setTimeout(
                    closeSidebar,
                    150
                );

            }
        );


        /* =====================================================
           NEW CHAT CLOSE
           ===================================================== */

        sidebar.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        ".new-chat-btn"
                    );

                if (!button) return;

                setTimeout(
                    closeSidebar,
                    150
                );

            }
        );


        /* =====================================================
           DESKTOP RESIZE
           ===================================================== */

        window.addEventListener(
            "resize",
            () => {

                if (
                    !window.matchMedia(
                        `(min-width: ${BREAKPOINT + 1}px)`
                    ).matches
                ) {

                    return;

                }

                closeSidebar();

            },
            {
                passive: true
            }
        );


        console.log(
            "✅ AP SYNAPSE — FINAL SIDEBAR READY"
        );
    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );

    } else {

        initialize();

    }

})();