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

        let { sidebar, button, overlay } = elements();

        if (sidebar) {
        sidebar.style.zIndex = "2147483647";
        }

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

            overlay.style.zIndex = "2147483640";
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

        /* =========================================================
   AP SYNAPSE — FINAL SIDEBAR VISIBILITY / STACKING FIX
   ========================================================= */

@media (max-width: 767px) {

    /* Overlay MUST stay behind sidebar */
    .mobile-sidebar-overlay {
        position: fixed !important;
        inset: 0 !important;

        z-index: 2147483000 !important;

        background: rgba(0,0,0,.45) !important;

        pointer-events: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
    }

    .mobile-sidebar-overlay.ap-sidebar-visible {
        pointer-events: auto !important;
        opacity: 1 !important;
        visibility: visible !important;
    }

    /* =====================================================
       SIDEBAR — SINGLE SOLID SURFACE
       ===================================================== */

    aside.sidebar {
        position: fixed !important;

        top: 0 !important;
        left: 0 !important;
        bottom: 0 !important;

        width: min(326px, 88vw) !important;
        height: 100dvh !important;

        z-index: 2147483640 !important;

        display: flex !important;
        flex-direction: column !important;

        background:
            linear-gradient(
                180deg,
                #17191e 0%,
                #111318 48%,
                #0c0e12 100%
            ) !important;

        background-color: #111318 !important;

        color: #f5f5f3 !important;

        opacity: 1 !important;

        overflow-x: hidden !important;
        overflow-y: auto !important;

        isolation: isolate !important;

        transform: translate3d(-105%,0,0) !important;

        visibility: hidden !important;
        pointer-events: none !important;
    }

    aside.sidebar.ap-sidebar-open {
        transform: translate3d(0,0,0) !important;

        visibility: visible !important;
        pointer-events: auto !important;

        opacity: 1 !important;
    }

    /* =====================================================
       EVERY DIRECT SECTION — NORMAL FLOW
       ===================================================== */

    aside.sidebar > .sidebar-header,
    aside.sidebar > .sidebar-group,
    aside.sidebar > .sidebar-footer {
        position: relative !important;

        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;

        flex: 0 0 auto !important;

        box-sizing: border-box !important;

        background: transparent !important;

        transform: none !important;

        overflow: visible !important;
    }

    /* Header */
    aside.sidebar > .sidebar-header {
        order: 1 !important;
        z-index: 20 !important;
    }

    /* Recent/history */
    aside.sidebar > .recent-group {
        order: 2 !important;
        z-index: 10 !important;
    }

    /* Main navigation */
    aside.sidebar > .sidebar-group:not(.recent-group) {
        order: 3 !important;
        z-index: 30 !important;
    }

    /* Footer */
    aside.sidebar > .sidebar-footer {
        order: 4 !important;
        z-index: 40 !important;
    }

    /* =====================================================
       HISTORY — NEVER FLOAT / NEVER OVERLAP NAV
       ===================================================== */

    aside.sidebar .history-list {
        position: relative !important;

        display: flex !important;
        flex-direction: column !important;

        width: 100% !important;

        height: auto !important;
        max-height: none !important;

        margin: 0 !important;
        padding: 0 !important;

        overflow: visible !important;

        transform: none !important;

        background: transparent !important;
    }

    aside.sidebar .history-item {
        position: relative !important;

        display: flex !important;

        width: 100% !important;
        height: auto !important;
        min-height: 54px !important;

        flex: 0 0 auto !important;

        margin: 0 !important;

        transform: none !important;

        background: transparent !important;

        z-index: 1 !important;
    }

    /* =====================================================
       NAVIGATION — ITS OWN CLEAN COLUMN
       ===================================================== */

    aside.sidebar nav {
        position: relative !important;

        display: flex !important;
        flex-direction: column !important;

        width: 100% !important;
        height: auto !important;

        margin: 0 !important;
        padding: 0 !important;

        flex: 0 0 auto !important;

        overflow: visible !important;

        background: transparent !important;

        z-index: 50 !important;
    }

    aside.sidebar nav a {
        position: relative !important;

        display: flex !important;

        width: 100% !important;
        height: 46px !important;
        min-height: 46px !important;

        flex: 0 0 46px !important;

        box-sizing: border-box !important;

        margin: 0 !important;

        transform: none !important;

        background: transparent !important;

        z-index: 51 !important;

        pointer-events: auto !important;
    }

    /* =====================================================
       CONTENT INSIDE SIDEBAR
       ===================================================== */

    aside.sidebar .history-item-content,
    aside.sidebar .history-title,
    aside.sidebar .history-preview,
    aside.sidebar .history-time {
        position: relative !important;

        background: transparent !important;
    }

    /* =====================================================
       NEW CHAT
       ===================================================== */

    aside.sidebar .new-chat-btn {
        position: relative !important;

        z-index: 100 !important;

        pointer-events: auto !important;
    }

    /* =====================================================
       BUTTONS / TEXT ALWAYS VISIBLE
       ===================================================== */

    aside.sidebar button,
    aside.sidebar a,
    aside.sidebar span,
    aside.sidebar div {
        box-sizing: border-box;
    }

    aside.sidebar a,
    aside.sidebar button {
        color: inherit;
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

/* =========================================================
   AP SYNAPSE — FINAL MOBILE SIDEBAR CONTROLLER
   SINGLE SOURCE OF TRUTH
   ========================================================= */

(() => {

    "use strict";

    const MOBILE_BREAKPOINT = 767;

    function getSidebar() {
        return document.querySelector(".app > aside.sidebar");
    }

    function getButton() {
        return document.querySelector(".mobile-menu-button");
    }

    function getOverlay() {
        return document.querySelector(".mobile-sidebar-overlay");
    }


    /* =====================================================
       CREATE REQUIRED MOBILE ELEMENTS
       ===================================================== */

    function ensureElements() {

        let button = getButton();
        let overlay = getOverlay();

        if (!button) {

            button =
                document.createElement("button");

            button.className =
                "mobile-menu-button";

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

            overlay =
                document.createElement("div");

            overlay.className =
                "mobile-sidebar-overlay";

            document.body.appendChild(overlay);
        }

        return {
            sidebar: getSidebar(),
            button: getButton(),
            overlay: getOverlay()
        };
    }


    /* =====================================================
       CLOSE
       ===================================================== */

    function closeSidebar() {

        const {
            sidebar,
            button,
            overlay
        } = ensureElements();

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

        console.log(
            "✅ AP Synapse sidebar closed"
        );
    }


    /* =====================================================
       OPEN
       ===================================================== */

    function openSidebar() {

        const {
            sidebar,
            button,
            overlay
        } = ensureElements();

        if (!sidebar) {

            console.error(
                "❌ AP Synapse sidebar not found"
            );

            return;
        }

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
            "✅ AP Synapse sidebar opened"
        );
    }


    /* =====================================================
       TOGGLE
       ===================================================== */

    function toggleSidebar(event) {

        event?.preventDefault();
        event?.stopPropagation();

        const sidebar = getSidebar();

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


    /* =====================================================
       NAVIGATION
       IMPORTANT:
       We DO NOT hijack navigation here.
       The existing AP Synapse navigation code handles it.
       We ONLY close the drawer on mobile.
       ===================================================== */

    function closeAfterNavigation(event) {

        const link =
            event.target.closest(
                ".sidebar nav a"
            );

        if (!link) return;

        if (
            window.innerWidth <=
            MOBILE_BREAKPOINT
        ) {

            setTimeout(
                closeSidebar,
                100
            );
        }
    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    function initialize() {

        const {
            sidebar,
            button,
            overlay
        } = ensureElements();

        if (!sidebar) {

            console.error(
                "❌ AP Synapse sidebar missing"
            );

            return;
        }


        /* Remove duplicate generated controls */

        document
            .querySelectorAll(
                ".mobile-menu-button"
            )
            .forEach((element, index) => {

                if (index > 0) {
                    element.remove();
                }

            });


        document
            .querySelectorAll(
                ".mobile-sidebar-overlay"
            )
            .forEach((element, index) => {

                if (index > 0) {
                    element.remove();
                }

            });


        /* =========================
           BUTTON
           ========================= */

        button.onclick = null;

        button.addEventListener(
            "click",
            toggleSidebar,
            {
                passive: false
            }
        );


        /* =========================
           OVERLAY
           ========================= */

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


        /* =========================
           NAVIGATION
           ========================= */

        sidebar.addEventListener(
            "click",
            closeAfterNavigation
        );


        /* =========================
           ESCAPE
           ========================= */

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


        /* =========================
           RESIZE
           ========================= */

        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth >
                    MOBILE_BREAKPOINT
                ) {

                    closeSidebar();

                }

            },
            {
                passive: true
            }
        );


        /* =========================
           INITIAL STATE
           ========================= */

        closeSidebar();


        console.log(
            "🚀 AP SYNAPSE — FINAL MOBILE SIDEBAR READY"
        );
    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );

    } else {

        initialize();

    }

})();

/* ============================================================
   AP SYNAPSE — FINAL SIDEBAR CONTROLLER
   DESKTOP + MOBILE
   FINAL STABLE VERSION
   ============================================================ */

(() => {
    "use strict";

    const MOBILE_BREAKPOINT = 767;

    /* ========================================================
       ELEMENTS
       ======================================================== */

    function getElements() {
        return {
            sidebar: document.querySelector(".sidebar"),
            button: document.querySelector(".mobile-menu-button"),
            overlay: document.querySelector(".mobile-sidebar-overlay")
        };
    }

    /* ========================================================
       FINAL CSS
       ======================================================== */

    function installFinalSidebarCSS() {

        document
            .getElementById("AP-SYNAPSE-FINAL-SIDEBAR-CONTROLLER-CSS")
            ?.remove();

        const style = document.createElement("style");

        style.id =
            "AP-SYNAPSE-FINAL-SIDEBAR-CONTROLLER-CSS";

        style.textContent = `

        /* ====================================================
           DESKTOP
           ==================================================== */

        @media (min-width: 768px) {

            .sidebar {

                position: relative !important;

                left: auto !important;
                top: auto !important;
                bottom: auto !important;

                width: 280px !important;
                min-width: 280px !important;
                max-width: 280px !important;

                height: 100vh !important;

                display: flex !important;

                visibility: visible !important;
                opacity: 1 !important;

                transform: none !important;

                pointer-events: auto !important;

                z-index: 100 !important;

                flex-shrink: 0 !important;

                overflow-y: auto !important;
                overflow-x: hidden !important;
            }

            .mobile-menu-button,
            .mobile-sidebar-overlay {

                display: none !important;

            }

        }


        /* ====================================================
           MOBILE
           ==================================================== */

        @media (max-width: 767px) {

            html,
            body {

                width: 100% !important;
                max-width: 100% !important;

                overflow-x: hidden !important;

            }


            /* ------------------------------------------------
               MOBILE MENU BUTTON
               ------------------------------------------------ */

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

                border:
                    1px solid
                    rgba(198,166,107,.55) !important;

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


            /* ------------------------------------------------
               OVERLAY
               ------------------------------------------------ */

            .mobile-sidebar-overlay {

                position: fixed !important;

                inset: 0 !important;

                width: 100vw !important;
                height: 100dvh !important;

                background:
                    rgba(0,0,0,.42) !important;

                opacity: 0 !important;

                visibility: hidden !important;

                pointer-events: none !important;

                z-index: 999998 !important;

                transition:
                    opacity .22s ease,
                    visibility .22s ease !important;

            }


            .mobile-sidebar-overlay.ap-sidebar-visible {

                opacity: 1 !important;

                visibility: visible !important;

                pointer-events: auto !important;

            }


            /* ------------------------------------------------
               SIDEBAR CLOSED
               ------------------------------------------------ */

            aside.sidebar {

                position: fixed !important;

                top: 0 !important;
                left: 0 !important;
                bottom: 0 !important;

                width:
                    min(320px, 88vw) !important;

                min-width:
                    min(320px, 88vw) !important;

                max-width:
                    min(320px, 88vw) !important;

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

                visibility: hidden !important;

                opacity: 1 !important;

                transform:
                    translate3d(-105%,0,0) !important;

                pointer-events: none !important;

                transition:
                    transform .28s
                    cubic-bezier(.22,.61,.36,1),
                    visibility .28s ease !important;

            }


            /* ------------------------------------------------
               SIDEBAR OPEN
               ------------------------------------------------ */

            aside.sidebar.ap-sidebar-open {

                visibility: visible !important;

                opacity: 1 !important;

                transform:
                    translate3d(0,0,0) !important;

                pointer-events: auto !important;

            }


            /* ------------------------------------------------
               SIDEBAR CHILDREN
               ------------------------------------------------ */

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


            /* ------------------------------------------------
               SIDEBAR HEADER
               ------------------------------------------------ */

            .sidebar-header {

                width: 100% !important;

                min-height: 70px !important;

                flex: 0 0 auto !important;

            }


            /* ------------------------------------------------
               NAV
               ------------------------------------------------ */

            aside.sidebar nav {

                position: relative !important;

                display: flex !important;

                flex-direction: column !important;

                width: 100% !important;

                height: auto !important;

                margin: 0 !important;

                padding: 0 !important;

                overflow: visible !important;

                transform: none !important;

                flex: 0 0 auto !important;

            }


            aside.sidebar nav a {

                position: relative !important;

                display: flex !important;

                align-items: center !important;

                width: 100% !important;

                min-height: 48px !important;

                height: 48px !important;

                max-height: 48px !important;

                margin: 0 !important;

                padding:
                    0 18px !important;

                box-sizing: border-box !important;

                flex: 0 0 48px !important;

                transform: none !important;

                float: none !important;

                overflow: hidden !important;

                pointer-events: auto !important;

                touch-action: manipulation !important;

            }


            /* ------------------------------------------------
               HISTORY
               ------------------------------------------------ */

            aside.sidebar .history-list {

                position: relative !important;

                display: flex !important;

                flex-direction: column !important;

                width: 100% !important;

                height: auto !important;

                max-height: none !important;

                margin: 0 !important;

                padding: 0 !important;

                overflow: visible !important;

                transform: none !important;

                flex: 0 0 auto !important;

            }


            aside.sidebar .history-item {

                position: relative !important;

                display: flex !important;

                align-items: center !important;

                width: 100% !important;

                min-height: 54px !important;

                height: auto !important;

                margin: 0 !important;

                padding: 8px 12px !important;

                box-sizing: border-box !important;

                transform: none !important;

                overflow: visible !important;

                pointer-events: auto !important;

            }


            .history-item-content {

                min-width: 0 !important;

                flex: 1 1 auto !important;

                overflow: hidden !important;

            }


            .history-delete {

                flex: 0 0 auto !important;

                pointer-events: auto !important;

            }


            /* ------------------------------------------------
               FOOTER
               ------------------------------------------------ */

            aside.sidebar > .sidebar-footer {

                width: 100% !important;

                min-height: 70px !important;

                margin-top: auto !important;

                flex: 0 0 auto !important;

            }


            /* ------------------------------------------------
               BODY LOCK
               ------------------------------------------------ */

            body.ap-sidebar-locked {

                overflow: hidden !important;

            }

        }
        `;

        document.head.appendChild(style);

    }


    /* ========================================================
       REMOVE OLD INLINE DEBUG STYLES
       ======================================================== */

    function clearForcedInlineStyles() {

        const { sidebar, button, overlay } =
            getElements();

        if (sidebar) {

            sidebar.style.removeProperty(
                "visibility"
            );

            sidebar.style.removeProperty(
                "transform"
            );

            sidebar.style.removeProperty(
                "pointer-events"
            );

            sidebar.style.removeProperty(
                "display"
            );

        }

        if (button) {

            button.style.removeProperty(
                "display"
            );

        }

        if (overlay) {

            overlay.style.removeProperty(
                "display"
            );

        }

    }


    /* ========================================================
       CLOSE SIDEBAR
       ======================================================== */

    function closeFinalSidebar() {

        const {
            sidebar,
            button,
            overlay
        } = getElements();

        if (!sidebar) return;

        sidebar.classList.remove(
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

        console.log(
            "✅ AP SYNAPSE — SIDEBAR CLOSED"
        );

    }


    /* ========================================================
       OPEN SIDEBAR
       ======================================================== */

    function openFinalSidebar() {

        const {
            sidebar,
            button,
            overlay
        } = getElements();

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
            "✅ AP SYNAPSE — SIDEBAR OPENED"
        );

    }


    /* ========================================================
       TOGGLE
       ======================================================== */

    function toggleFinalSidebar(event) {

        event?.preventDefault();
        event?.stopPropagation();

        const { sidebar } =
            getElements();

        if (!sidebar) return;

        if (
            sidebar.classList.contains(
                "ap-sidebar-open"
            )
        ) {

            closeFinalSidebar();

        } else {

            openFinalSidebar();

        }

    }


    /* ========================================================
       INITIALIZE
       ======================================================== */

    function initializeFinalSidebar() {

        installFinalSidebarCSS();

        clearForcedInlineStyles();

        const {
            sidebar,
            button,
            overlay
        } = getElements();

        if (!sidebar) {

            console.error(
                "❌ AP SYNAPSE — SIDEBAR NOT FOUND"
            );

            return;

        }


        /* ----------------------------------------------------
           MOBILE BUTTON
           ---------------------------------------------------- */

        if (button) {

            /*
             * Clone the button.
             *
             * This removes old click listeners from previous
             * sidebar implementations and prevents duplicate
             * toggle handlers.
             */

            const cleanButton =
                button.cloneNode(true);

            button.replaceWith(
                cleanButton
            );

            cleanButton.addEventListener(
                "click",
                toggleFinalSidebar,
                {
                    passive: false
                }
            );

        }


        /* ----------------------------------------------------
           OVERLAY
           ---------------------------------------------------- */

        const freshOverlay =
            document.querySelector(
                ".mobile-sidebar-overlay"
            );

        if (freshOverlay) {

            freshOverlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        freshOverlay
                    ) {

                        closeFinalSidebar();

                    }

                }
            );

        }


        /* ----------------------------------------------------
           SIDEBAR NAVIGATION
           
           IMPORTANT:
           Clicking a navigation item is allowed to execute
           the existing AP Synapse navigation code first.

           Then the mobile drawer closes automatically.
           ---------------------------------------------------- */

        sidebar.addEventListener(
            "click",
            event => {

                const link =
                    event.target.closest(
                        "nav a"
                    );

                if (!link) return;

                if (
                    window.innerWidth <=
                    MOBILE_BREAKPOINT
                ) {

                    setTimeout(
                        () => {
                            closeFinalSidebar();
                        },
                        180
                    );

                }

            },
            true
        );


        /* ----------------------------------------------------
           NEW CHAT
           ---------------------------------------------------- */

        sidebar.addEventListener(
            "click",
            event => {

                const newChat =
                    event.target.closest(
                        ".new-chat-btn"
                    );

                if (!newChat) return;

                if (
                    window.innerWidth <=
                    MOBILE_BREAKPOINT
                ) {

                    setTimeout(
                        closeFinalSidebar,
                        120
                    );

                }

            },
            true
        );


        /* ----------------------------------------------------
           ESCAPE
           ---------------------------------------------------- */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
                ) {

                    closeFinalSidebar();

                }

            }
        );


        /* ----------------------------------------------------
           DESKTOP RESIZE
           ---------------------------------------------------- */

        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth >
                    MOBILE_BREAKPOINT
                ) {

                    closeFinalSidebar();

                }

            },
            {
                passive: true
            }
        );


        /* ----------------------------------------------------
           INITIAL STATE
           ---------------------------------------------------- */

        closeFinalSidebar();


        console.log(
            "🚀 AP SYNAPSE — FINAL SIDEBAR CONTROLLER READY"
        );

    }


    /* ========================================================
       START
       ======================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeFinalSidebar,
            {
                once: true
            }
        );

    } else {

        initializeFinalSidebar();

    }

})();

/* ============================================================
   AP SYNAPSE — FINAL SIDEBAR CONTROLLER
   ONE CONTROLLER ONLY
   Desktop + Mobile
   ============================================================ */

(() => {
    "use strict";

    const MOBILE_BREAKPOINT = 767;

    let sidebar;
    let menuButton;
    let overlay;

    function getElements() {
        sidebar = document.querySelector(".sidebar");
        menuButton = document.querySelector(".mobile-menu-button");
        overlay = document.querySelector(".mobile-sidebar-overlay");

        return {
            sidebar,
            menuButton,
            overlay
        };
    }

    /* ========================================================
       CREATE MOBILE CONTROLS
       ======================================================== */

    function ensureControls() {

        getElements();

        if (!menuButton) {

            menuButton = document.createElement("button");

            menuButton.className =
                "mobile-menu-button";

            menuButton.type = "button";

            menuButton.setAttribute(
                "aria-label",
                "Open AP Synapse navigation"
            );

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            menuButton.textContent = "☰";

            document.body.appendChild(menuButton);
        }

        if (!overlay) {

            overlay = document.createElement("div");

            overlay.className =
                "mobile-sidebar-overlay";

            document.body.appendChild(overlay);
        }

        getElements();
    }


    /* ========================================================
       FINAL CSS
       ======================================================== */

    function installCSS() {

        document
            .getElementById(
                "AP-SYNAPSE-SIDEBAR-FINAL-CSS"
            )
            ?.remove();

        const style =
            document.createElement("style");

        style.id =
            "AP-SYNAPSE-SIDEBAR-FINAL-CSS";

        style.textContent = `

/* ============================================================
   BASE
   ============================================================ */

.sidebar {
    box-sizing: border-box;
}


/* ============================================================
   DESKTOP — 768px+
   SIDEBAR MUST BE VISIBLE
   ============================================================ */

@media (min-width: 768px) {

    .mobile-menu-button,
    .mobile-sidebar-overlay {
        display: none !important;
    }

    body {
        overflow-x: hidden !important;
    }

    .app {
        display: flex !important;
        width: 100% !important;
        min-height: 100vh !important;
    }

    aside.sidebar {
        position: fixed !important;

        top: 0 !important;
        left: 0 !important;
        bottom: 0 !important;

        width: 260px !important;
        height: 100vh !important;

        display: flex !important;

        visibility: visible !important;
        opacity: 1 !important;

        transform: none !important;

        pointer-events: auto !important;

        z-index: 1000 !important;

        overflow-x: hidden !important;
        overflow-y: auto !important;

        flex-direction: column !important;

        margin: 0 !important;
    }

    main.workspace {
        margin-left: 260px !important;

        width: calc(
            100% - 260px
        ) !important;

        min-width: 0 !important;

        position: relative !important;
    }

}


/* ============================================================
   MOBILE — 767px AND BELOW
   ============================================================ */

@media (max-width: 767px) {

    html,
    body {
        width: 100% !important;
        max-width: 100% !important;

        overflow-x: hidden !important;
    }


    /* ========================================================
       THREE-BAR BUTTON
       ======================================================== */

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
            rgba(198,166,107,.55) !important;

        border-radius: 14px !important;

        background:
            rgba(14,16,20,.98) !important;

        color: #f5f5f3 !important;

        font-size: 24px !important;
        line-height: 1 !important;

        z-index: 2147483647 !important;

        opacity: 1 !important;
        visibility: visible !important;

        pointer-events: auto !important;

        cursor: pointer !important;

        touch-action: manipulation !important;

        box-shadow:
            0 8px 28px
            rgba(0,0,0,.35) !important;
    }


    /* ========================================================
       OVERLAY
       IMPORTANT:
       IT IS BEHIND SIDEBAR
       ======================================================== */

    .mobile-sidebar-overlay {

        position: fixed !important;

        inset: 0 !important;

        width: 100vw !important;
        height: 100dvh !important;

        display: block !important;

        background:
            rgba(0,0,0,.42) !important;

        opacity: 0 !important;

        visibility: hidden !important;

        pointer-events: none !important;

        z-index: 2147483000 !important;

        transition:
            opacity .2s ease,
            visibility .2s ease !important;
    }


    .mobile-sidebar-overlay.ap-visible {

        opacity: 1 !important;

        visibility: visible !important;

        pointer-events: auto !important;
    }


    /* ========================================================
       SIDEBAR — CLOSED DEFAULT
       ======================================================== */

    aside.sidebar {

        position: fixed !important;

        top: 0 !important;
        left: 0 !important;
        bottom: 0 !important;

        width:
            min(320px, 86vw) !important;

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
                #17191e 0%,
                #0c0e12 100%
            ) !important;

        visibility: hidden !important;

        opacity: 1 !important;

        transform:
            translate3d(
                -105%,
                0,
                0
            ) !important;

        pointer-events: none !important;

        z-index: 2147483646 !important;

        overflow-x: hidden !important;
        overflow-y: auto !important;

        -webkit-overflow-scrolling: touch !important;

        transition:
            transform .25s
            cubic-bezier(.22,.61,.36,1),
            visibility 0s linear .25s !important;
    }


    /* ========================================================
       SIDEBAR — OPEN
       ======================================================== */

    aside.sidebar.ap-open {

        visibility: visible !important;

        opacity: 1 !important;

        transform:
            translate3d(
                0,
                0,
                0
            ) !important;

        pointer-events: auto !important;

        transition:
            transform .25s
            cubic-bezier(.22,.61,.36,1),
            visibility 0s !important;
    }


    /* ========================================================
       SIDEBAR CONTENT
       ======================================================== */

    aside.sidebar > * {

        position: relative !important;

        top: auto !important;
        right: auto !important;
        bottom: auto !important;
        left: auto !important;

        transform: none !important;

        float: none !important;

        box-sizing: border-box !important;

        max-width: 100% !important;

        flex-shrink: 0 !important;
    }


    aside.sidebar nav {

        position: relative !important;

        display: flex !important;

        flex-direction: column !important;

        width: 100% !important;

        height: auto !important;

        margin: 0 !important;

        padding: 0 !important;

        overflow: visible !important;

        pointer-events: auto !important;

        z-index: 20 !important;
    }


    aside.sidebar nav a {

        position: relative !important;

        display: flex !important;

        align-items: center !important;

        width: 100% !important;

        min-height: 48px !important;
        height: 48px !important;

        box-sizing: border-box !important;

        padding:
            0 18px !important;

        margin: 0 !important;

        pointer-events: auto !important;

        touch-action: manipulation !important;

        z-index: 30 !important;
    }


    /* ========================================================
       NEW CHAT
       ======================================================== */

    aside.sidebar .new-chat-btn {

        position: relative !important;

        pointer-events: auto !important;

        z-index: 30 !important;
    }


    /* ========================================================
       HISTORY
       ======================================================== */

    aside.sidebar .history-list {

        position: relative !important;

        width: 100% !important;

        height: auto !important;

        max-height: none !important;

        overflow: visible !important;

        pointer-events: auto !important;

        z-index: 20 !important;
    }


    aside.sidebar .history-item {

        position: relative !important;

        width: 100% !important;

        min-height: 54px !important;

        box-sizing: border-box !important;

        pointer-events: auto !important;
    }


    /* ========================================================
       MOBILE BODY LOCK
       ======================================================== */

    body.ap-mobile-sidebar-open {

        overflow: hidden !important;
    }


    /* ========================================================
       MAIN CONTENT
       ======================================================== */

    main.workspace {

        width: 100% !important;

        min-width: 0 !important;

        margin-left: 0 !important;

        position: relative !important;
    }

}


/* ============================================================
   SAFETY — NEVER LET OLD CLASSES OVERRIDE FINAL STATE
   ============================================================ */

@media (max-width: 767px) {

    aside.sidebar.ap-open {
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        transform: translate3d(0,0,0) !important;
    }

    aside.sidebar:not(.ap-open) {
        visibility: hidden !important;
        pointer-events: none !important;
        transform: translate3d(-105%,0,0) !important;
    }

}

        `;

        document.head.appendChild(style);
    }


    /* ========================================================
       CLOSE
       ======================================================== */

    function closeSidebar() {

        getElements();

        if (!sidebar) return;

        sidebar.classList.remove(
            "ap-open",
            "ap-sidebar-open"
        );

        overlay?.classList.remove(
            "ap-visible",
            "ap-sidebar-visible"
        );

        document.body.classList.remove(
            "ap-mobile-sidebar-open",
            "ap-sidebar-locked"
        );

        if (menuButton) {

            menuButton.textContent = "☰";

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            menuButton.setAttribute(
                "aria-label",
                "Open AP Synapse navigation"
            );
        }

        console.log(
            "✅ AP SYNAPSE SIDEBAR CLOSED"
        );
    }


    /* ========================================================
       OPEN
       ======================================================== */

    function openSidebar() {

        getElements();

        if (!sidebar) return;

        sidebar.classList.add("ap-open");

        overlay?.classList.add("ap-visible");

        document.body.classList.add(
            "ap-mobile-sidebar-open"
        );

        if (menuButton) {

            menuButton.textContent = "×";

            menuButton.setAttribute(
                "aria-expanded",
                "true"
            );

            menuButton.setAttribute(
                "aria-label",
                "Close AP Synapse navigation"
            );
        }

        console.log(
            "✅ AP SYNAPSE SIDEBAR OPENED"
        );
    }


    /* ========================================================
       TOGGLE
       ======================================================== */

    function toggleSidebar(event) {

        event.preventDefault();
        event.stopPropagation();

        getElements();

        if (!sidebar) return;

        if (
            sidebar.classList.contains("ap-open")
        ) {

            closeSidebar();

        } else {

            openSidebar();

        }
    }


    /* ========================================================
       NAVIGATION
       ======================================================== */

    function handleNavigation(event) {

        const link =
            event.target.closest(
                ".sidebar nav a"
            );

        if (!link) return;

        /*
         * Do NOT preventDefault here.
         *
         * The existing AP Synapse navigation
         * handler in sidebar.js/app.js must
         * receive the click.
         */

        console.log(
            "🧭 AP SYNAPSE NAVIGATION:",
            link.textContent.trim()
        );

        /*
         * Give the existing navigation code
         * a moment to open the requested page,
         * then close the mobile sidebar.
         */

        if (
            window.matchMedia(
                "(max-width: 767px)"
            ).matches
        ) {

            setTimeout(() => {

                closeSidebar();

            }, 180);
        }
    }


    /* ========================================================
       INITIALIZE
       ======================================================== */

    function initialize() {

        installCSS();

        ensureControls();

        getElements();

        if (!sidebar) {

            console.error(
                "❌ AP SYNAPSE SIDEBAR NOT FOUND"
            );

            return;
        }


        /* ----------------------------------------------------
           Remove ONLY duplicate mobile controls.
           Do NOT remove sidebar.
           ---------------------------------------------------- */

        document
            .querySelectorAll(
                ".mobile-menu-button"
            )
            .forEach((element, index) => {

                if (index > 0) {
                    element.remove();
                }

            });


        document
            .querySelectorAll(
                ".mobile-sidebar-overlay"
            )
            .forEach((element, index) => {

                if (index > 0) {
                    element.remove();
                }

            });


        getElements();


        /* ----------------------------------------------------
           Remove old state classes
           ---------------------------------------------------- */

        sidebar.classList.remove(
            "ap-sidebar-open"
        );

        overlay?.classList.remove(
            "ap-sidebar-visible"
        );


        /* ----------------------------------------------------
           MENU BUTTON
           ---------------------------------------------------- */

        menuButton.onclick = null;

        menuButton.addEventListener(
            "click",
            toggleSidebar,
            {
                passive: false
            }
        );


        /* ----------------------------------------------------
           OVERLAY
           ---------------------------------------------------- */

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


        /* ----------------------------------------------------
           NAVIGATION
           ---------------------------------------------------- */

        sidebar.addEventListener(
            "click",
            handleNavigation,
            false
        );


        /* ----------------------------------------------------
           ESC
           ---------------------------------------------------- */

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


        /* ----------------------------------------------------
           RESIZE
           ---------------------------------------------------- */

        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth >=
                    MOBILE_BREAKPOINT + 1
                ) {

                    closeSidebar();

                }

            },
            {
                passive: true
            }
        );


        /* ----------------------------------------------------
           INITIAL STATE
           ---------------------------------------------------- */

        if (
            window.innerWidth >=
            MOBILE_BREAKPOINT + 1
        ) {

            sidebar.classList.remove(
                "ap-open"
            );

        } else {

            closeSidebar();

        }


        console.log(
            "🚀 AP SYNAPSE FINAL SIDEBAR READY"
        );
    }


    /* ========================================================
       START
       ======================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );

    } else {

        initialize();

    }

})();

/* ============================================================
   AP SYNAPSE — MOBILE SIDEBAR
   SINGLE CONTROLLER
   Desktop navigation untouched
   ============================================================ */

(() => {
    "use strict";

    const BREAKPOINT = 767;

    function getSidebar() {
        return document.querySelector(".sidebar");
    }

    function getMenuButton() {
        return document.querySelector(".mobile-menu-button");
    }

    function getOverlay() {
        return document.querySelector(".mobile-sidebar-overlay");
    }

    function ensureControls() {

        let button = getMenuButton();
        let overlay = getOverlay();

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
            overlay.className = "mobile-sidebar-overlay";

            document.body.appendChild(overlay);
        }

        return {
            sidebar: getSidebar(),
            button: getMenuButton(),
            overlay: getOverlay()
        };
    }

    function closeSidebar() {

        const {
            sidebar,
            button,
            overlay
        } = ensureControls();

        if (!sidebar) return;

        sidebar.classList.remove("ap-sidebar-open");

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

    function openSidebar() {

        const {
            sidebar,
            button,
            overlay
        } = ensureControls();

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
    }

    function toggleSidebar(event) {

        event?.preventDefault();
        event?.stopPropagation();

        const sidebar = getSidebar();

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

    function initialize() {

        const {
            sidebar,
            button,
            overlay
        } = ensureControls();

        if (!sidebar) {
            console.error(
                "❌ AP Synapse sidebar not found"
            );
            return;
        }

        /*
         * Remove duplicate generated controls.
         */
        document
            .querySelectorAll(".mobile-menu-button")
            .forEach((element, index) => {
                if (index > 0) element.remove();
            });

        document
            .querySelectorAll(".mobile-sidebar-overlay")
            .forEach((element, index) => {
                if (index > 0) element.remove();
            });

        /*
         * Clean old state.
         */
        sidebar.classList.remove(
            "ap-open",
            "ap-sidebar-open",
            "mobile-open",
            "ap-mobile-open"
        );

        overlay?.classList.remove(
            "ap-visible",
            "visible",
            "active",
            "ap-sidebar-visible",
            "ap-mobile-open"
        );

        /*
         * Clone menu button so old listeners
         * from previous controllers are removed.
         */
        const cleanButton =
            button.cloneNode(true);

        button.replaceWith(cleanButton);

        cleanButton.addEventListener(
            "click",
            toggleSidebar,
            { passive: false }
        );

        /*
         * Overlay closes sidebar.
         */
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

        /*
         * Do NOT intercept navigation.
         * Existing navigation code handles it.
         */
        sidebar.addEventListener(
            "click",
            event => {

                const link =
                    event.target.closest(
                        "nav a"
                    );

                if (!link) return;

                if (
                    window.innerWidth <=
                    BREAKPOINT
                ) {
                    setTimeout(
                        closeSidebar,
                        180
                    );
                }

            }
        );

        /*
         * New Chat.
         */
        sidebar.addEventListener(
            "click",
            event => {

                const newChat =
                    event.target.closest(
                        ".new-chat-btn"
                    );

                if (!newChat) return;

                if (
                    window.innerWidth <=
                    BREAKPOINT
                ) {
                    setTimeout(
                        closeSidebar,
                        120
                    );
                }

            }
        );

        /*
         * Escape.
         */
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

        /*
         * Desktop resize.
         */
        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth >
                    BREAKPOINT
                ) {
                    closeSidebar();
                }

            },
            { passive: true }
        );

        closeSidebar();

        console.log(
            "✅ AP SYNAPSE — SINGLE MOBILE SIDEBAR CONTROLLER READY"
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

/* ============================================================
   AP SYNAPSE — FINAL MOBILE DRAWER BEHAVIOR
   MOBILE ONLY
   DESKTOP NAVIGATION UNTOUCHED
   ============================================================ */

(() => {

    "use strict";

    const MOBILE_BREAKPOINT = 767;

    function isMobile() {

        return window.innerWidth <= MOBILE_BREAKPOINT;

    }


    function getSidebar() {

        return document.querySelector(
            ".sidebar"
        );

    }


    function getMenuButton() {

        return document.querySelector(
            ".mobile-menu-button"
        );

    }


    function getOverlay() {

        return document.querySelector(
            ".mobile-sidebar-overlay"
        );

    }


    /* ========================================================
       CLOSE
       ======================================================== */

    function closeMobileSidebar() {

        if (!isMobile()) return;

        const sidebar = getSidebar();
        const button = getMenuButton();
        const overlay = getOverlay();

        if (sidebar) {

            sidebar.classList.remove(
                "ap-sidebar-open"
            );

        }

        if (overlay) {

            overlay.classList.remove(
                "ap-sidebar-visible"
            );

        }

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
       OPEN
       ======================================================== */

    function openMobileSidebar() {

        if (!isMobile()) return;

        const sidebar = getSidebar();
        const button = getMenuButton();
        const overlay = getOverlay();

        if (!sidebar) return;


        sidebar.classList.add(
            "ap-sidebar-open"
        );


        if (overlay) {

            overlay.classList.add(
                "ap-sidebar-visible"
            );

        }


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

    }


    /* ========================================================
       TOGGLE
       ======================================================== */

    function toggleMobileSidebar(event) {

        event.preventDefault();
        event.stopPropagation();

        const sidebar = getSidebar();

        if (!sidebar) return;

        if (
            sidebar.classList.contains(
                "ap-sidebar-open"
            )
        ) {

            closeMobileSidebar();

        } else {

            openMobileSidebar();

        }

    }


    /* ========================================================
       INITIALIZE
       ======================================================== */

    function initializeMobileDrawer() {

        const sidebar = getSidebar();
        const button = getMenuButton();
        const overlay = getOverlay();

        if (!sidebar || !button || !overlay) {

            console.warn(
                "AP Synapse mobile drawer elements not found."
            );

            return;

        }


        /*
         * Clone hamburger button.
         *
         * This removes old click handlers attached
         * by previous sidebar controllers.
         */

        const cleanButton =
            button.cloneNode(true);

        button.replaceWith(
            cleanButton
        );


        cleanButton.addEventListener(
            "click",
            toggleMobileSidebar,
            {
                passive: false
            }
        );


        /*
         * Overlay closes drawer.
         */

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target === overlay
                ) {

                    closeMobileSidebar();

                }

            }
        );


        /*
         * ANY sidebar navigation link/button
         * closes the drawer on mobile.
         *
         * We do NOT prevent the original action.
         */

        sidebar.addEventListener(
            "click",
            event => {

                if (!isMobile()) return;


                const clickedControl =
                    event.target.closest(
                        "a, button"
                    );


                if (!clickedControl) return;


                /*
                 * Let the existing navigation/action
                 * execute first.
                 */

                setTimeout(
                    closeMobileSidebar,
                    120
                );

            },
            true
        );


        /*
         * ESC closes drawer.
         */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    isMobile()
                ) {

                    closeMobileSidebar();

                }

            }
        );


        /*
         * If user changes from mobile to desktop,
         * reset only the mobile drawer state.
         */

        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth >
                    MOBILE_BREAKPOINT
                ) {

                    sidebar.classList.remove(
                        "ap-sidebar-open"
                    );

                    overlay.classList.remove(
                        "ap-sidebar-visible"
                    );

                    document.body.classList.remove(
                        "ap-sidebar-locked"
                    );

                    cleanButton.textContent = "☰";

                    cleanButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            },
            {
                passive: true
            }
        );


        /*
         * Guaranteed initial mobile state.
         */

        if (isMobile()) {

            closeMobileSidebar();

        }

        console.log(
            "🚀 AP SYNAPSE — FINAL MOBILE DRAWER READY"
        );

    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeMobileDrawer,
            {
                once: true
            }
        );

    } else {

        initializeMobileDrawer();

    }

})();

/* =========================================================
   AP SYNAPSE — FINAL MOBILE SIDEBAR CONTROLLER
   MOBILE ONLY
   ========================================================= */

(() => {
    "use strict";

    const MOBILE_BREAKPOINT = 767;

    function isMobile() {
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function getSidebar() {
        return document.querySelector(".sidebar");
    }

    function getMenuButton() {
        return document.querySelector(".mobile-menu-button");
    }

    function getOverlay() {
        return document.querySelector(".mobile-sidebar-overlay");
    }

    function openMobileSidebar() {

        if (!isMobile()) return;

        const sidebar = getSidebar();
        const overlay = getOverlay();

        if (!sidebar) {
            console.warn("AP Synapse: mobile sidebar not found");
            return;
        }

        /* Remove every old/competing state first */
        document.body.classList.remove(
            "ap-sidebar-visible",
            "ap-open",
            "mobile-open",
            "ap-mobile-open"
        );

        sidebar.classList.remove(
            "ap-sidebar-visible",
            "ap-open",
            "mobile-open",
            "ap-mobile-open"
        );

        /* One clean state */
        document.body.classList.add("ap-sidebar-open");
        sidebar.classList.add("ap-sidebar-open");

        if (overlay) {
            overlay.classList.add("ap-sidebar-open");
        }

        document.body.style.overflow = "hidden";

        console.log("AP SYNAPSE — MOBILE SIDEBAR OPEN");
    }


    function closeMobileSidebar() {

        const sidebar = getSidebar();
        const overlay = getOverlay();

        document.body.classList.remove(
            "ap-sidebar-open",
            "ap-sidebar-visible",
            "ap-open",
            "mobile-open",
            "ap-mobile-open"
        );

        if (sidebar) {
            sidebar.classList.remove(
                "ap-sidebar-open",
                "ap-sidebar-visible",
                "ap-open",
                "mobile-open",
                "ap-mobile-open"
            );
        }

        if (overlay) {
            overlay.classList.remove(
                "ap-sidebar-open",
                "ap-sidebar-visible",
                "ap-open",
                "mobile-open",
                "ap-mobile-open"
            );
        }

        document.body.style.overflow = "";

        console.log("AP SYNAPSE — MOBILE SIDEBAR CLOSED");
    }


    function toggleMobileSidebar() {

        if (!isMobile()) return;

        const sidebar = getSidebar();

        if (!sidebar) return;

        const isOpen =
            document.body.classList.contains("ap-sidebar-open") ||
            sidebar.classList.contains("ap-sidebar-open");

        if (isOpen) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    }


    /* =====================================================
       HAMBURGER
       ===================================================== */

    document.addEventListener("click", function (event) {

        if (!isMobile()) return;

        const menuButton =
            event.target.closest(".mobile-menu-button");

        if (menuButton) {

            event.preventDefault();
            event.stopPropagation();

            toggleMobileSidebar();

            return;
        }


        /* =================================================
           OVERLAY CLICK = CLOSE
           ================================================= */

        const overlay =
            event.target.closest(".mobile-sidebar-overlay");

        if (overlay) {

            event.preventDefault();
            event.stopPropagation();

            closeMobileSidebar();

            return;
        }


        /* =================================================
           SIDEBAR NAVIGATION = CLOSE FIRST
           ================================================= */

        const sidebar =
            event.target.closest(".sidebar");

        if (sidebar) {

            const navigationButton =
                event.target.closest(
                    "a, button, [role='button'], .nav-item, .menu-item"
                );

            if (navigationButton) {

                /*
                 * Close immediately before navigation.
                 * Navigation can then continue normally.
                 */
                closeMobileSidebar();

                console.log(
                    "AP SYNAPSE — MOBILE NAVIGATION → SIDEBAR CLOSED"
                );
            }
        }

    }, true);


    /* =====================================================
       ESCAPE
       ===================================================== */

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape" && isMobile()) {
            closeMobileSidebar();
        }

    });


    /* =====================================================
       ROTATION / RESIZE SAFETY
       ===================================================== */

    window.addEventListener("resize", function () {

        if (!isMobile()) {
            closeMobileSidebar();
        }

    });


    console.log(
        "AP SYNAPSE — FINAL MOBILE SIDEBAR CONTROLLER READY"
    );

})();

/* ============================================================
   AP SYNAPSE — FINAL MOBILE SIDEBAR CONTROLLER
   MOBILE ONLY — DOES NOT ALTER DESKTOP
   ============================================================ */

(function () {
    'use strict';

    function initMobileSidebarController() {

        const menuButton = document.querySelector('.mobile-menu-button');
        const sidebar = document.querySelector('aside.sidebar, .sidebar');
        const overlay = document.querySelector('.mobile-sidebar-overlay');

        if (!menuButton || !sidebar) {
            console.warn('AP Synapse: Mobile sidebar elements not found.');
            return;
        }

        /* ----------------------------------------------------
           OPEN
        ---------------------------------------------------- */
        function openMobileSidebar() {

            if (window.innerWidth > 768) return;

            document.body.classList.add('ap-sidebar-open');
            sidebar.classList.add('ap-sidebar-open');

            if (overlay) {
                overlay.classList.add('ap-sidebar-open');
            }

            menuButton.setAttribute('aria-expanded', 'true');

            /* Force the mobile sidebar into the visible state */
            sidebar.style.setProperty('visibility', 'visible', 'important');
            sidebar.style.setProperty('opacity', '1', 'important');
            sidebar.style.setProperty('transform', 'translateX(0)', 'important');

            if (overlay) {
                overlay.style.setProperty('visibility', 'visible', 'important');
                overlay.style.setProperty('opacity', '1', 'important');
                overlay.style.setProperty('z-index', '9998', 'important');
            }

            sidebar.style.setProperty('z-index', '9999', 'important');
        }


        /* ----------------------------------------------------
           CLOSE
        ---------------------------------------------------- */
        function closeMobileSidebar() {

            if (window.innerWidth > 768) return;

            document.body.classList.remove('ap-sidebar-open');
            sidebar.classList.remove('ap-sidebar-open');

            if (overlay) {
                overlay.classList.remove('ap-sidebar-open');
            }

            menuButton.setAttribute('aria-expanded', 'false');

            /* Return to the closed mobile state */
            sidebar.style.setProperty(
                'transform',
                'translateX(-100%)',
                'important'
            );

            sidebar.style.setProperty(
                'visibility',
                'hidden',
                'important'
            );

            sidebar.style.setProperty(
                'opacity',
                '0',
                'important'
            );

            if (overlay) {
                overlay.style.setProperty(
                    'opacity',
                    '0',
                    'important'
                );

                overlay.style.setProperty(
                    'visibility',
                    'hidden',
                    'important'
                );
            }
        }


        /* ----------------------------------------------------
           3 BARS — TRUE TOGGLE
        ---------------------------------------------------- */
        menuButton.addEventListener('click', function (event) {

            event.preventDefault();
            event.stopPropagation();

            if (window.innerWidth > 768) return;

            const isOpen =
                document.body.classList.contains('ap-sidebar-open');

            if (isOpen) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });


        /* ----------------------------------------------------
           OVERLAY CLICK = CLOSE
        ---------------------------------------------------- */
        if (overlay) {

            overlay.addEventListener('click', function (event) {

                event.preventDefault();
                event.stopPropagation();

                closeMobileSidebar();
            });
        }


        /* ----------------------------------------------------
           SIDEBAR BUTTON / LINK CLICK = CLOSE
           Navigation is NOT prevented.
        ---------------------------------------------------- */
        sidebar.addEventListener('click', function (event) {

            if (window.innerWidth > 768) return;

            const clickedItem = event.target.closest(
                'a, button, [role="button"]'
            );

            if (!clickedItem) return;

            /*
             * Don't close when clicking the mobile menu button
             * if it somehow exists inside the sidebar.
             */
            if (clickedItem === menuButton) return;

            /*
             * Close immediately, then allow the original
             * navigation/action to continue normally.
             */
            closeMobileSidebar();
        });


        /* ----------------------------------------------------
           ESCAPE = CLOSE
        ---------------------------------------------------- */
        document.addEventListener('keydown', function (event) {

            if (event.key === 'Escape') {
                closeMobileSidebar();
            }
        });


        /* ----------------------------------------------------
           SCREEN SIZE SAFETY
           Desktop is returned to normal control.
        ---------------------------------------------------- */
        window.addEventListener('resize', function () {

            if (window.innerWidth > 768) {

                document.body.classList.remove('ap-sidebar-open');
                sidebar.classList.remove('ap-sidebar-open');

                if (overlay) {
                    overlay.classList.remove('ap-sidebar-open');
                }

                menuButton.setAttribute('aria-expanded', 'false');

                /*
                 * Remove ONLY the inline mobile overrides.
                 * Desktop CSS gets control again.
                 */
                sidebar.style.removeProperty('visibility');
                sidebar.style.removeProperty('opacity');
                sidebar.style.removeProperty('transform');
                sidebar.style.removeProperty('z-index');

                if (overlay) {
                    overlay.style.removeProperty('visibility');
                    overlay.style.removeProperty('opacity');
                    overlay.style.removeProperty('z-index');
                }
            }
        });


        console.log(
            'AP Synapse — Final Mobile Sidebar Controller Ready'
        );
    }


    /* --------------------------------------------------------
       WAIT UNTIL DOM IS READY
       -------------------------------------------------------- */
    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            initMobileSidebarController
        );

    } else {

        initMobileSidebarController();
    }

})();

/* ============================================================
   AP SYNAPSE — MOBILE SIDEBAR FINAL OVERRIDE
   MOBILE ONLY
   Desktop is completely untouched.
   ============================================================ */

(() => {
    "use strict";

    const MOBILE_MAX = 767;

    function isMobile() {
        return window.innerWidth <= MOBILE_MAX;
    }

    function getSidebar() {
        return document.querySelector("aside.sidebar");
    }

    function getMenuButton() {
        return document.querySelector(".mobile-menu-button");
    }

    function getOverlay() {
        return document.querySelector(".mobile-sidebar-overlay");
    }

    function closeMobileSidebar() {

        if (!isMobile()) return;

        const sidebar = getSidebar();
        const overlay = getOverlay();
        const button = getMenuButton();

        if (sidebar) {

            sidebar.classList.remove(
                "ap-sidebar-open",
                "mobile-open",
                "ap-mobile-open",
                "ap-open"
            );

            sidebar.style.setProperty(
                "transform",
                "translate3d(-110%,0,0)",
                "important"
            );

            sidebar.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            sidebar.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            sidebar.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

            sidebar.style.setProperty(
                "z-index",
                "2147483646",
                "important"
            );
        }

        if (overlay) {

            overlay.classList.remove(
                "ap-sidebar-visible",
                "active",
                "visible",
                "ap-mobile-open"
            );

            overlay.style.setProperty(
                "opacity",
                "0",
                "important"
            );

            overlay.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            overlay.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "z-index",
                "2147483645",
                "important"
            );
        }

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

            button.style.setProperty(
                "z-index",
                "2147483647",
                "important"
            );
        }

        document.body.classList.remove(
            "ap-sidebar-open",
            "ap-sidebar-locked"
        );
    }


    function openMobileSidebar() {

        if (!isMobile()) return;

        const sidebar = getSidebar();
        const overlay = getOverlay();
        const button = getMenuButton();

        if (!sidebar) {
            console.error(
                "AP Synapse: sidebar element not found."
            );
            return;
        }

        /* ----------------------------------------------------
           CRITICAL:
           Put the drawer directly under BODY.

           This removes any parent stacking-context problem
           that was causing the black overlay to appear above it.
           ---------------------------------------------------- */

        if (sidebar.parentElement !== document.body) {
            document.body.appendChild(sidebar);
        }

        if (overlay && overlay.parentElement !== document.body) {
            document.body.appendChild(overlay);
        }

        /* ----------------------------------------------------
           SIDEBAR
           ---------------------------------------------------- */

        sidebar.classList.add(
            "ap-sidebar-open"
        );

        sidebar.classList.remove(
            "mobile-open",
            "ap-mobile-open",
            "ap-open"
        );

        sidebar.style.setProperty(
            "position",
            "fixed",
            "important"
        );

        sidebar.style.setProperty(
            "top",
            "0",
            "important"
        );

        sidebar.style.setProperty(
            "left",
            "0",
            "important"
        );

        sidebar.style.setProperty(
            "bottom",
            "0",
            "important"
        );

        sidebar.style.setProperty(
            "width",
            "min(326px,88vw)",
            "important"
        );

        sidebar.style.setProperty(
            "height",
            "100dvh",
            "important"
        );

        sidebar.style.setProperty(
            "max-height",
            "100dvh",
            "important"
        );

        sidebar.style.setProperty(
            "display",
            "flex",
            "important"
        );

        sidebar.style.setProperty(
            "flex-direction",
            "column",
            "important"
        );

        sidebar.style.setProperty(
            "background",
            "#111318",
            "important"
        );

        sidebar.style.setProperty(
            "opacity",
            "1",
            "important"
        );

        sidebar.style.setProperty(
            "visibility",
            "visible",
            "important"
        );

        sidebar.style.setProperty(
            "pointer-events",
            "auto",
            "important"
        );

        sidebar.style.setProperty(
            "transform",
            "translate3d(0,0,0)",
            "important"
        );

        sidebar.style.setProperty(
            "filter",
            "none",
            "important"
        );

        sidebar.style.setProperty(
            "backdrop-filter",
            "none",
            "important"
        );

        sidebar.style.setProperty(
            "-webkit-backdrop-filter",
            "none",
            "important"
        );

        sidebar.style.setProperty(
            "z-index",
            "2147483646",
            "important"
        );

        sidebar.style.setProperty(
            "overflow-y",
            "auto",
            "important"
        );

        /* ----------------------------------------------------
           OVERLAY
           ---------------------------------------------------- */

        if (overlay) {

            overlay.style.setProperty(
                "position",
                "fixed",
                "important"
            );

            overlay.style.setProperty(
                "inset",
                "0",
                "important"
            );

            overlay.style.setProperty(
                "background",
                "rgba(0,0,0,.48)",
                "important"
            );

            overlay.style.setProperty(
                "filter",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "backdrop-filter",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "-webkit-backdrop-filter",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            overlay.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

            overlay.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );

            overlay.style.setProperty(
                "z-index",
                "2147483645",
                "important"
            );

            overlay.classList.add(
                "ap-sidebar-visible"
            );
        }

        /* ----------------------------------------------------
           HAMBURGER
           ---------------------------------------------------- */

        if (button) {

            button.style.setProperty(
                "position",
                "fixed",
                "important"
            );

            button.style.setProperty(
                "z-index",
                "2147483647",
                "important"
            );

            button.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );

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

        document.body.classList.add(
            "ap-sidebar-open"
        );
    }


    function toggleMobileSidebar(event) {

        if (!isMobile()) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const sidebar = getSidebar();

        if (
            sidebar &&
            sidebar.classList.contains(
                "ap-sidebar-open"
            )
        ) {

            closeMobileSidebar();

        } else {

            openMobileSidebar();

        }
    }


    function setupMobileSidebar() {

        const button = getMenuButton();
        const overlay = getOverlay();

        if (!button) {
            console.error(
                "AP Synapse: mobile menu button not found."
            );
            return;
        }

        /* ----------------------------------------------------
           IMPORTANT:
           Clone button.

           This removes all old click listeners attached by
           previous sidebar controllers in sidebar.js.
           ---------------------------------------------------- */

        const cleanButton =
            button.cloneNode(true);

        button.replaceWith(cleanButton);


        /* ----------------------------------------------------
           MENU BUTTON
           ---------------------------------------------------- */

        cleanButton.addEventListener(
            "click",
            toggleMobileSidebar,
            {
                capture: true,
                passive: false
            }
        );


        /* ----------------------------------------------------
           OVERLAY CLOSE
           ---------------------------------------------------- */

        if (overlay) {

            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target === overlay
                    ) {

                        closeMobileSidebar();

                    }

                },
                true
            );
        }


        /* ----------------------------------------------------
           SIDEBAR NAVIGATION
           Any sidebar link/button closes the drawer.
           ---------------------------------------------------- */

        const sidebar = getSidebar();

        if (sidebar) {

            sidebar.addEventListener(
                "click",
                event => {

                    if (!isMobile()) return;

                    const target =
                        event.target.closest(
                            "a, button"
                        );

                    if (!target) return;

                    /*
                       Don't close because of the hamburger.
                       It is outside the sidebar anyway.
                    */

                    setTimeout(
                        closeMobileSidebar,
                        0
                    );

                },
                true
            );
        }


        /* ----------------------------------------------------
           ESCAPE
           ---------------------------------------------------- */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    isMobile()
                ) {

                    closeMobileSidebar();

                }

            }
        );


        /* ----------------------------------------------------
           RESIZE
           ---------------------------------------------------- */

        window.addEventListener(
            "resize",
            () => {

                if (!isMobile()) {

                    /*
                       Desktop is untouched.
                       Just remove mobile state.
                    */

                    const sidebar = getSidebar();
                    const overlay = getOverlay();

                    sidebar?.classList.remove(
                        "ap-sidebar-open"
                    );

                    overlay?.classList.remove(
                        "ap-sidebar-visible"
                    );

                }

            },
            {
                passive: true
            }
        );


        /* ----------------------------------------------------
           INITIAL STATE
           ---------------------------------------------------- */

        if (isMobile()) {
            closeMobileSidebar();
        }

        console.log(
            "✅ AP SYNAPSE MOBILE SIDEBAR — FINAL OVERRIDE READY"
        );
    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            setupMobileSidebar,
            {
                once: true
            }
        );

    } else {

        setupMobileSidebar();

    }

})();

/* ============================================================
   AP SYNAPSE — FINAL MOBILE SIDEBAR MASTER CONTROLLER
   MOBILE ONLY
   Desktop navigation/layout is untouched.
   ============================================================ */

(() => {
    "use strict";

    const MOBILE_MAX = 767;

    function isMobile() {
        return window.innerWidth <= MOBILE_MAX;
    }

    function getSidebar() {
        return document.querySelector("aside.sidebar");
    }

    function getButton() {
        return document.querySelector(".mobile-menu-button");
    }

    function getOverlay() {
        return document.querySelector(".mobile-sidebar-overlay");
    }

    function removeDuplicateControls() {
        const buttons = document.querySelectorAll(
            ".mobile-menu-button"
        );

        buttons.forEach((button, index) => {
            if (index > 0) {
                button.remove();
            }
        });

        const overlays = document.querySelectorAll(
            ".mobile-sidebar-overlay"
        );

        overlays.forEach((overlay, index) => {
            if (index > 0) {
                overlay.remove();
            }
        });
    }

    function forceClosedStyles(sidebar, overlay, button) {

        if (sidebar) {
            sidebar.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            sidebar.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            sidebar.style.setProperty(
                "transform",
                "translate3d(-105%,0,0)",
                "important"
            );

            sidebar.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

            sidebar.style.setProperty(
                "z-index",
                "2147483646",
                "important"
            );
        }

        if (overlay) {
            overlay.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            overlay.style.setProperty(
                "opacity",
                "0",
                "important"
            );

            overlay.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "backdrop-filter",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "-webkit-backdrop-filter",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "z-index",
                "2147483640",
                "important"
            );
        }

        if (button) {
            button.textContent = "☰";

            button.setAttribute(
                "aria-expanded",
                "false"
            );
        }

        document.body.classList.remove(
            "ap-sidebar-locked",
            "ap-mobile-nav-open"
        );
    }

    function forceOpenStyles(sidebar, overlay, button) {

        if (sidebar) {

            sidebar.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

            sidebar.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            sidebar.style.setProperty(
                "transform",
                "translate3d(0,0,0)",
                "important"
            );

            sidebar.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );

            sidebar.style.setProperty(
                "z-index",
                "2147483647",
                "important"
            );

            sidebar.style.setProperty(
                "filter",
                "none",
                "important"
            );

            sidebar.style.setProperty(
                "backdrop-filter",
                "none",
                "important"
            );

            sidebar.style.setProperty(
                "-webkit-backdrop-filter",
                "none",
                "important"
            );
        }

        if (overlay) {

            overlay.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

            overlay.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            overlay.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );

            overlay.style.setProperty(
                "backdrop-filter",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "-webkit-backdrop-filter",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "z-index",
                "2147483640",
                "important"
            );
        }

        if (button) {

            button.textContent = "×";

            button.setAttribute(
                "aria-expanded",
                "true"
            );
        }

        document.body.classList.add(
            "ap-sidebar-locked"
        );
    }

    function closeMobileSidebar() {

        if (!isMobile()) return;

        const sidebar = getSidebar();
        const overlay = getOverlay();
        const button = getButton();

        if (!sidebar) return;

        sidebar.classList.remove(
            "ap-sidebar-open",
            "ap-open",
            "mobile-open",
            "ap-mobile-open"
        );

        overlay?.classList.remove(
            "ap-sidebar-visible",
            "active",
            "visible",
            "ap-visible",
            "ap-mobile-open"
        );

        forceClosedStyles(
            sidebar,
            overlay,
            button
        );

        console.log(
            "✅ AP SYNAPSE — MOBILE SIDEBAR CLOSED"
        );
    }

    function openMobileSidebar() {

        if (!isMobile()) return;

        removeDuplicateControls();

        const sidebar = getSidebar();
        const overlay = getOverlay();
        const button = getButton();

        if (!sidebar) {
            console.error(
                "❌ AP SYNAPSE — SIDEBAR NOT FOUND"
            );
            return;
        }

        sidebar.classList.add(
            "ap-sidebar-open"
        );

        overlay?.classList.add(
            "ap-sidebar-visible"
        );

        forceOpenStyles(
            sidebar,
            overlay,
            button
        );

        console.log(
            "✅ AP SYNAPSE — MOBILE SIDEBAR OPENED"
        );
    }

    function toggleMobileSidebar(event) {

        if (!isMobile()) return;

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const sidebar = getSidebar();

        if (!sidebar) return;

        const isOpen =
            sidebar.classList.contains(
                "ap-sidebar-open"
            );

        if (isOpen) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    }

    function setupMobileSidebar() {

        removeDuplicateControls();

        let button = getButton();
        let overlay = getOverlay();

        const sidebar = getSidebar();

        if (!sidebar) {
            console.error(
                "❌ AP SYNAPSE — MOBILE SIDEBAR NOT FOUND"
            );
            return;
        }

        /* Create button only if missing */
        if (!button) {

            button =
                document.createElement("button");

            button.className =
                "mobile-menu-button";

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

        /* Create overlay only if missing */
        if (!overlay) {

            overlay =
                document.createElement("div");

            overlay.className =
                "mobile-sidebar-overlay";

            document.body.appendChild(
                overlay
            );
        }

        /*
         * CLONE BUTTON
         * This removes all old click handlers
         * from previous sidebar controllers.
         */
        const cleanButton =
            button.cloneNode(true);

        button.replaceWith(
            cleanButton
        );

        button = cleanButton;

        button.addEventListener(
            "click",
            toggleMobileSidebar,
            {
                passive: false
            }
        );

        /*
         * CLONE OVERLAY
         * Removes old overlay handlers.
         */
        const cleanOverlay =
            overlay.cloneNode(false);

        overlay.replaceWith(
            cleanOverlay
        );

        overlay = cleanOverlay;

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {
                    closeMobileSidebar();
                }

            },
            {
                passive: true
            }
        );

        /*
         * CLOSE WHEN ANY SIDEBAR
         * CONTROL IS CLICKED.
         *
         * We do NOT prevent navigation.
         */
        sidebar.addEventListener(
            "click",
            event => {

                if (!isMobile()) return;

                const clicked =
                    event.target.closest(
                        "a, button, input"
                    );

                if (!clicked) return;

                /*
                 * Give the existing AP Synapse
                 * navigation code time to run.
                 */
                setTimeout(
                    () => {
                        closeMobileSidebar();
                    },
                    50
                );

            },
            false
        );

        /*
         * ESC CLOSE
         */
        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    isMobile()
                ) {
                    closeMobileSidebar();
                }

            },
            false
        );

        /*
         * RESIZE
         *
         * If desktop preview is entered,
         * mobile state is completely removed.
         */
        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth >
                    MOBILE_MAX
                ) {

                    const currentSidebar =
                        getSidebar();

                    const currentOverlay =
                        getOverlay();

                    const currentButton =
                        getButton();

                    if (currentSidebar) {
                        currentSidebar.classList.remove(
                            "ap-sidebar-open",
                            "ap-open",
                            "mobile-open",
                            "ap-mobile-open"
                        );

                        currentSidebar.style.removeProperty(
                            "visibility"
                        );

                        currentSidebar.style.removeProperty(
                            "transform"
                        );

                        currentSidebar.style.removeProperty(
                            "pointer-events"
                        );

                        currentSidebar.style.removeProperty(
                            "z-index"
                        );
                    }

                    currentOverlay?.classList.remove(
                        "ap-sidebar-visible",
                        "active",
                        "visible",
                        "ap-visible",
                        "ap-mobile-open"
                    );

                    currentOverlay?.style.removeProperty(
                        "visibility"
                    );

                    currentOverlay?.style.removeProperty(
                        "opacity"
                    );

                    currentOverlay?.style.removeProperty(
                        "pointer-events"
                    );

                    currentOverlay?.style.removeProperty(
                        "z-index"
                    );

                    currentButton?.style.removeProperty(
                        "z-index"
                    );

                    document.body.classList.remove(
                        "ap-sidebar-locked",
                        "ap-mobile-nav-open"
                    );
                }

            },
            {
                passive: true
            }
        );

        /*
         * INITIAL MOBILE STATE
         */
        if (isMobile()) {
            closeMobileSidebar();
        }

        console.log(
            "🚀 AP SYNAPSE — MOBILE SIDEBAR MASTER CONTROLLER READY"
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            setupMobileSidebar,
            {
                once: true
            }
        );

    } else {

        setupMobileSidebar();

    }

})();

/* =========================================================
   AP SYNAPSE — MOBILE SIDEBAR FINAL CONTROLLER
   MOBILE ONLY
   DESKTOP IS UNTOUCHED
   ========================================================= */

(() => {
    "use strict";

    const MOBILE_BREAKPOINT = 767;

    function isMobile() {
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function getSidebar() {
        return document.querySelector("aside.sidebar");
    }

    function getMenuButton() {
        return document.querySelector(".mobile-menu-button");
    }

    function getOverlay() {
        return document.querySelector(".mobile-sidebar-overlay");
    }

    function closeMobileSidebar() {

        if (!isMobile()) return;

        const sidebar = getSidebar();
        const button = getMenuButton();
        const overlay = getOverlay();

        if (!sidebar) return;

        sidebar.classList.remove(
            "ap-sidebar-open",
            "mobile-open",
            "ap-mobile-open"
        );

        overlay?.classList.remove(
            "ap-sidebar-visible",
            "active",
            "visible",
            "ap-mobile-open"
        );

        document.body.classList.remove(
            "ap-sidebar-open",
            "ap-sidebar-locked",
            "ap-mobile-nav-open"
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

    function openMobileSidebar() {

        if (!isMobile()) return;

        const sidebar = getSidebar();
        const button = getMenuButton();
        const overlay = getOverlay();

        if (!sidebar) return;

        sidebar.classList.add("ap-sidebar-open");

        overlay?.classList.add(
            "ap-sidebar-visible"
        );

        document.body.classList.add(
            "ap-sidebar-open",
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
    }

    function toggleMobileSidebar(event) {

        if (!isMobile()) return;

        event.preventDefault();
        event.stopPropagation();

        const sidebar = getSidebar();

        if (!sidebar) return;

        if (
            sidebar.classList.contains(
                "ap-sidebar-open"
            )
        ) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    }

    function initializeMobileSidebar() {

        const button = getMenuButton();
        const overlay = getOverlay();
        const sidebar = getSidebar();

        if (!button || !sidebar) {
            console.warn(
                "AP Synapse mobile sidebar elements not found."
            );
            return;
        }

        /* Remove every old menu-button click listener */
        const cleanButton =
            button.cloneNode(true);

        button.replaceWith(cleanButton);

        cleanButton.addEventListener(
            "click",
            toggleMobileSidebar,
            { passive: false }
        );

        /* Overlay click = close */
        if (overlay) {

            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target === overlay
                    ) {
                        closeMobileSidebar();
                    }

                }
            );

        }

        /* ANY SIDEBAR NAVIGATION/CONTROL = CLOSE */
        sidebar.addEventListener(
            "click",
            event => {

                if (!isMobile()) return;

                const clicked =
                    event.target.closest(
                        "a, button"
                    );

                if (!clicked) return;

                /* Never treat the mobile menu button as a sidebar item */
                if (
                    clicked.classList.contains(
                        "mobile-menu-button"
                    )
                ) {
                    return;
                }

                /* Let the existing action/navigation happen first */
                setTimeout(
                    closeMobileSidebar,
                    50
                );

            },
            true
        );

        /* ESC = close */
        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    isMobile()
                ) {
                    closeMobileSidebar();
                }

            }
        );

        /* If viewport becomes desktop, clean mobile state */
        window.addEventListener(
            "resize",
            () => {

                if (!isMobile()) {

                    const sidebar =
                        getSidebar();

                    const overlay =
                        getOverlay();

                    sidebar?.classList.remove(
                        "ap-sidebar-open",
                        "mobile-open",
                        "ap-mobile-open"
                    );

                    overlay?.classList.remove(
                        "ap-sidebar-visible",
                        "active",
                        "visible",
                        "ap-mobile-open"
                    );

                    document.body.classList.remove(
                        "ap-sidebar-open",
                        "ap-sidebar-locked",
                        "ap-mobile-nav-open"
                    );

                }

            },
            { passive: true }
        );

        /* Start CLOSED */
        closeMobileSidebar();

        console.log(
            "✅ AP SYNAPSE — MOBILE SIDEBAR FINAL FIX READY"
        );
    }

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeMobileSidebar,
            { once: true }
        );

    } else {

        initializeMobileSidebar();

    }

})();

/* ============================================================
   AP SYNAPSE — MOBILE SIDEBAR
   SINGLE CLEAN CONTROLLER
   Desktop is untouched.
   ============================================================ */

(() => {
    "use strict";

    const MOBILE_MAX = 767;

    function getSidebar() {
        return document.querySelector("aside.sidebar");
    }

    function getMenuButton() {
        return document.querySelector(".mobile-menu-button");
    }

    function getOverlay() {
        return document.querySelector(".mobile-sidebar-overlay");
    }

    function isMobile() {
        return window.innerWidth <= MOBILE_MAX;
    }

    function closeSidebar() {
        const sidebar = getSidebar();
        const button = getMenuButton();
        const overlay = getOverlay();

        if (sidebar) {
            sidebar.classList.remove(
                "ap-sidebar-open",
                "ap-open"
            );
        }

        if (overlay) {
            overlay.classList.remove(
                "ap-sidebar-visible",
                "ap-visible",
                "active",
                "mobile-open",
                "is-open"
            );
        }

        document.body.classList.remove(
            "ap-sidebar-locked",
            "ap-mobile-sidebar-open",
            "mobile-sidebar-open"
        );

        if (button) {
            button.textContent = "☰";
            button.setAttribute("aria-expanded", "false");
            button.setAttribute(
                "aria-label",
                "Open AP Synapse navigation"
            );
        }
    }

    function openSidebar() {
        if (!isMobile()) return;

        const sidebar = getSidebar();
        const button = getMenuButton();
        const overlay = getOverlay();

        if (!sidebar) {
            console.error(
                "❌ AP Synapse sidebar not found."
            );
            return;
        }

        /*
         * Use BOTH existing state classes.
         * This makes the controller compatible with
         * the existing CSS without changing desktop.
         */
        sidebar.classList.add(
            "ap-sidebar-open",
            "ap-open"
        );

        if (overlay) {
            overlay.classList.add(
                "ap-sidebar-visible",
                "ap-visible"
            );
        }

        document.body.classList.add(
            "ap-sidebar-locked",
            "ap-mobile-sidebar-open"
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
    }

    function toggleSidebar(event) {
        event.preventDefault();
        event.stopPropagation();

        const sidebar = getSidebar();

        if (!sidebar) return;

        const open =
            sidebar.classList.contains(
                "ap-sidebar-open"
            ) ||
            sidebar.classList.contains(
                "ap-open"
            );

        if (open) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    function setup() {
        const sidebar = getSidebar();
        const button = getMenuButton();
        const overlay = getOverlay();

        if (!sidebar) {
            console.error(
                "❌ AP Synapse sidebar not found."
            );
            return;
        }

        /*
         * Clean initial state.
         */
        closeSidebar();

        /*
         * MENU BUTTON
         *
         * cloneNode removes any old click listeners
         * from the previous broken controllers.
         */
        if (button) {
            const cleanButton =
                button.cloneNode(true);

            button.replaceWith(cleanButton);

            cleanButton.addEventListener(
                "click",
                toggleSidebar,
                {
                    passive: false
                }
            );
        }

        /*
         * OVERLAY
         *
         * Clicking outside the sidebar closes it.
         */
        if (overlay) {
            const cleanOverlay =
                overlay.cloneNode(true);

            overlay.replaceWith(cleanOverlay);

            cleanOverlay.addEventListener(
                "click",
                event => {
                    if (
                        event.target ===
                        cleanOverlay
                    ) {
                        closeSidebar();
                    }
                }
            );
        }

        /*
         * SIDEBAR NAVIGATION
         *
         * Existing navigation code is NOT cancelled.
         * We only close the mobile drawer.
         */
        sidebar.addEventListener(
            "click",
            event => {
                const link =
                    event.target.closest(
                        "nav a"
                    );

                if (!link) return;

                if (isMobile()) {
                    setTimeout(
                        closeSidebar,
                        120
                    );
                }
            },
            true
        );

        /*
         * NEW CHAT
         */
        sidebar.addEventListener(
            "click",
            event => {
                const newChat =
                    event.target.closest(
                        ".new-chat-btn"
                    );

                if (!newChat) return;

                if (isMobile()) {
                    setTimeout(
                        closeSidebar,
                        120
                    );
                }
            },
            true
        );

        /*
         * ESC
         */
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

        /*
         * RESIZE
         *
         * If mobile -> desktop, drawer closes.
         */
        window.addEventListener(
            "resize",
            () => {
                if (!isMobile()) {
                    closeSidebar();
                }
            },
            {
                passive: true
            }
        );

        console.log(
            "✅ AP SYNAPSE — CLEAN MOBILE SIDEBAR READY"
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            setup,
            {
                once: true
            }
        );
    } else {
        setup();
    }

})();

/* ============================================================
   AP SYNAPSE — MOBILE SIDEBAR FINAL OVERRIDE
   Mobile ONLY — Desktop untouched
   ============================================================ */

(() => {
    "use strict";

    const MOBILE = () => window.innerWidth <= 767;

    const getSidebar = () =>
        document.querySelector("aside.sidebar");

    const getMenu = () =>
        document.querySelector(".mobile-menu-button");

    const getOverlay = () =>
        document.querySelector(".mobile-sidebar-overlay");

    function openMobileSidebar() {
        if (!MOBILE()) return;

        const sidebar = getSidebar();
        const overlay = getOverlay();
        const menu = getMenu();

        if (!sidebar) return;

        sidebar.classList.add("ap-sidebar-open");
        overlay?.classList.add("ap-sidebar-visible");

        sidebar.style.setProperty(
            "transform",
            "translate3d(0,0,0)",
            "important"
        );

        sidebar.style.setProperty(
            "visibility",
            "visible",
            "important"
        );

        sidebar.style.setProperty(
            "opacity",
            "1",
            "important"
        );

        sidebar.style.setProperty(
            "pointer-events",
            "auto",
            "important"
        );

        sidebar.style.setProperty(
            "z-index",
            "2147483647",
            "important"
        );

        if (overlay) {
            overlay.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

            overlay.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            overlay.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );

            overlay.style.setProperty(
                "z-index",
                "2147483640",
                "important"
            );
        }

        document.body.classList.add("ap-sidebar-locked");

        if (menu) {
            menu.setAttribute("aria-expanded", "true");
        }
    }


    function closeMobileSidebar() {

        const sidebar = getSidebar();
        const overlay = getOverlay();
        const menu = getMenu();

        if (!sidebar) return;

        sidebar.classList.remove("ap-sidebar-open");
        overlay?.classList.remove("ap-sidebar-visible");

        sidebar.style.setProperty(
            "transform",
            "translate3d(-100%,0,0)",
            "important"
        );

        sidebar.style.setProperty(
            "visibility",
            "hidden",
            "important"
        );

        sidebar.style.setProperty(
            "opacity",
            "1",
            "important"
        );

        sidebar.style.setProperty(
            "pointer-events",
            "none",
            "important"
        );

        if (overlay) {
            overlay.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            overlay.style.setProperty(
                "opacity",
                "0",
                "important"
            );

            overlay.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );
        }

        document.body.classList.remove("ap-sidebar-locked");

        if (menu) {
            menu.setAttribute("aria-expanded", "false");
        }
    }


    function toggleMobileSidebar(event) {

        if (!MOBILE()) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const sidebar = getSidebar();

        if (
            sidebar &&
            sidebar.classList.contains("ap-sidebar-open")
        ) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    }


    /* ------------------------------------------------------------
       MENU BUTTON
       Capture phase prevents older sidebar controllers
       from fighting this controller.
       ------------------------------------------------------------ */

    document.addEventListener(
        "click",
        event => {

            const menu = event.target.closest(
                ".mobile-menu-button"
            );

            if (!menu || !MOBILE()) return;

            toggleMobileSidebar(event);

        },
        true
    );


    /* ------------------------------------------------------------
       OVERLAY
       ------------------------------------------------------------ */

    document.addEventListener(
        "click",
        event => {

            const overlay = event.target.closest(
                ".mobile-sidebar-overlay"
            );

            if (
                !overlay ||
                !MOBILE()
            ) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            closeMobileSidebar();

        },
        true
    );


    /* ------------------------------------------------------------
       SIDEBAR NAVIGATION
       Let the existing navigation execute,
       then close the drawer automatically.
       ------------------------------------------------------------ */

    document.addEventListener(
        "click",
        event => {

            if (!MOBILE()) return;

            const sidebar = event.target.closest(
                "aside.sidebar"
            );

            if (!sidebar) return;

            const navigationItem =
                event.target.closest(
                    "a, button"
                );

            if (!navigationItem) return;

            if (
                navigationItem.closest(
                    ".mobile-menu-button"
                )
            ) {
                return;
            }

            setTimeout(() => {
                closeMobileSidebar();
            }, 80);

        },
        true
    );


    /* ------------------------------------------------------------
       ESC
       ------------------------------------------------------------ */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                MOBILE()
            ) {
                closeMobileSidebar();
            }

        },
        true
    );


    /* ------------------------------------------------------------
       RESIZE
       Never interfere with desktop.
       ------------------------------------------------------------ */

    window.addEventListener(
        "resize",
        () => {

            if (!MOBILE()) {
                closeMobileSidebar();
            }

        },
        { passive: true }
    );


    /* ------------------------------------------------------------
       INITIAL MOBILE STATE
       ------------------------------------------------------------ */

    function mobileSidebarBoot() {

        if (MOBILE()) {
            closeMobileSidebar();
        }

    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            mobileSidebarBoot,
            { once: true }
        );

    } else {

        mobileSidebarBoot();

    }


    console.log(
        "✅ AP SYNAPSE — MOBILE SIDEBAR OVERRIDE ACTIVE"
    );

})();

/* =========================================================
   AP SYNAPSE — FINAL MOBILE SIDEBAR FIX
   Fixes:
   1. Sidebar visible above overlay
   2. Sidebar fully clickable
   3. Overlay behind sidebar
   4. 3-bars toggles open/close
   5. Sidebar links automatically close sidebar
   6. Desktop untouched
   ========================================================= */

(() => {
    "use strict";

    if (window.__AP_FINAL_MOBILE_SIDEBAR__) return;
    window.__AP_FINAL_MOBILE_SIDEBAR__ = true;

    const isMobile = () => window.innerWidth <= 767;

    const sidebar = () => document.querySelector("aside.sidebar");
    const overlay = () => document.querySelector(".mobile-sidebar-overlay");
    const menu = () => document.querySelector(".mobile-menu-button");

    function setup() {
        if (!isMobile()) return;

        const s = sidebar();
        const o = overlay();

        if (!s || !o) return;

        /*
         * CRITICAL:
         * Put overlay INSIDE .app so it shares the same
         * stacking context as the sidebar.
         */
        const app = document.querySelector(".app");

        if (app && o.parentElement !== app) {
            app.insertBefore(o, app.firstChild);
        }

        /* Overlay */
        Object.assign(o.style, {
            position: "absolute",
            inset: "0",
            zIndex: "999998",
            background: "rgba(0,0,0,.48)",
            filter: "none",
            backdropFilter: "none",
            webkitBackdropFilter: "none",
            pointerEvents: "none"
        });

        /* Sidebar */
        Object.assign(s.style, {
            position: "fixed",
            top: "0",
            left: "0",
            bottom: "0",
            width: "min(320px, 88vw)",
            height: "100dvh",
            zIndex: "999999",
            background: "#111318",
            filter: "none",
            backdropFilter: "none",
            webkitBackdropFilter: "none",
            opacity: "1"
        });

        /* Keep sidebar children clickable */
        s.style.pointerEvents = "auto";

        s.querySelectorAll("*").forEach(el => {
            el.style.pointerEvents = "auto";
            el.style.filter = "none";
            el.style.backdropFilter = "none";
            el.style.webkitBackdropFilter = "none";
        });
    }

    function openSidebar() {
        if (!isMobile()) return;

        setup();

        const s = sidebar();
        const o = overlay();

        if (!s || !o) return;

        s.classList.add("ap-sidebar-open");
        s.classList.add("ap-sidebar-visible");

        o.classList.add("ap-sidebar-open");
        o.classList.add("ap-sidebar-visible");

        s.style.setProperty("visibility", "visible", "important");
        s.style.setProperty("opacity", "1", "important");
        s.style.setProperty(
            "transform",
            "translate3d(0,0,0)",
            "important"
        );
        s.style.setProperty(
            "pointer-events",
            "auto",
            "important"
        );
        s.style.setProperty(
            "z-index",
            "999999",
            "important"
        );

        o.style.setProperty(
            "visibility",
            "visible",
            "important"
        );
        o.style.setProperty(
            "opacity",
            "1",
            "important"
        );
        o.style.setProperty(
            "pointer-events",
            "auto",
            "important"
        );
        o.style.setProperty(
            "z-index",
            "999998",
            "important"
        );

        document.body.classList.add("ap-sidebar-open");
    }

    function closeSidebar() {
        const s = sidebar();
        const o = overlay();

        if (!s || !o) return;

        s.classList.remove(
            "ap-sidebar-open",
            "ap-sidebar-visible"
        );

        o.classList.remove(
            "ap-sidebar-open",
            "ap-sidebar-visible"
        );

        s.style.setProperty(
            "transform",
            "translate3d(-100%,0,0)",
            "important"
        );
        s.style.setProperty(
            "pointer-events",
            "none",
            "important"
        );

        o.style.setProperty(
            "opacity",
            "0",
            "important"
        );
        o.style.setProperty(
            "pointer-events",
            "none",
            "important"
        );

        document.body.classList.remove("ap-sidebar-open");
    }

    function toggleSidebar(e) {
        if (!isMobile()) return;

        e.preventDefault();
        e.stopPropagation();

        const s = sidebar();

        if (
            s &&
            (
                s.classList.contains("ap-sidebar-open") ||
                s.classList.contains("ap-sidebar-visible")
            )
        ) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    /* 3-bars button */
    document.addEventListener(
        "click",
        e => {
            if (!isMobile()) return;

            const m = e.target.closest(".mobile-menu-button");

            if (m) {
                toggleSidebar(e);
            }
        },
        true
    );

    /* Overlay closes sidebar */
    document.addEventListener(
        "click",
        e => {
            if (!isMobile()) return;

            const o = e.target.closest(".mobile-sidebar-overlay");

            if (o) {
                e.preventDefault();
                e.stopPropagation();
                closeSidebar();
            }
        },
        true
    );

    /* Sidebar navigation closes automatically */
    document.addEventListener(
        "click",
        e => {
            if (!isMobile()) return;

            const s = sidebar();

            if (!s || !s.contains(e.target)) return;

            const link = e.target.closest(
                "a, button"
            );

            if (!link) return;

            /* Don't close when clicking the sidebar's own close/menu control */
            if (
                link.classList.contains("mobile-menu-button") ||
                link.closest(".mobile-menu-button")
            ) {
                return;
            }

            setTimeout(closeSidebar, 50);
        },
        true
    );

    /* Initial setup */
    setup();

    /* Re-apply when viewport changes */
    window.addEventListener(
        "resize",
        () => {
            if (isMobile()) {
                setup();
            } else {
                closeSidebar();
            }
        },
        { passive: true }
    );

    console.log(
        "✅ AP SYNAPSE — FINAL MOBILE SIDEBAR FIX ACTIVE"
    );
})();

/* =========================================================
   AP SYNAPSE — MOBILE MENU SINGLE-TAP FIX
   ========================================================= */

(() => {
    "use strict";

    if (window.__AP_SINGLE_TAP_MENU_FIX__) return;
    window.__AP_SINGLE_TAP_MENU_FIX__ = true;

    document.addEventListener("click", function (e) {
        if (window.innerWidth > 767) return;

        const menu = e.target.closest(".mobile-menu-button");
        if (!menu) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        const sidebar = document.querySelector("aside.sidebar");
        if (!sidebar) return;

        const isOpen =
            sidebar.classList.contains("ap-sidebar-open") ||
            sidebar.classList.contains("ap-sidebar-visible") ||
            getComputedStyle(sidebar).transform ===
                "matrix(1, 0, 0, 1, 0, 0)";

        if (isOpen) {
            if (typeof window.closeSidebar === "function") {
                window.closeSidebar();
            } else {
                sidebar.classList.remove(
                    "ap-sidebar-open",
                    "ap-sidebar-visible"
                );
            }
        } else {
            if (typeof window.openSidebar === "function") {
                window.openSidebar();
            } else {
                sidebar.classList.add(
                    "ap-sidebar-open",
                    "ap-sidebar-visible"
                );

                sidebar.style.setProperty(
                    "visibility",
                    "visible",
                    "important"
                );

                sidebar.style.setProperty(
                    "transform",
                    "translate3d(0,0,0)",
                    "important"
                );

                sidebar.style.setProperty(
                    "pointer-events",
                    "auto",
                    "important"
                );
            }
        }
    }, true);

})();

/* =========================================================
   AP SYNAPSE — FINAL SINGLE-TAP MOBILE MENU
   Removes ALL previous menu-button listeners
   and installs exactly ONE.
   ========================================================= */

(() => {
    "use strict";

    function installSingleTapMenu() {
        if (window.innerWidth > 767) return;

        const oldButton =
            document.querySelector(".mobile-menu-button");

        if (!oldButton) return;

        /* Clone removes every previous event listener */
        const button = oldButton.cloneNode(true);

        oldButton.replaceWith(button);

        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            const sidebar =
                document.querySelector("aside.sidebar");

            const overlay =
                document.querySelector(
                    ".mobile-sidebar-overlay"
                );

            if (!sidebar) return;

            const opened =
                sidebar.classList.contains(
                    "ap-sidebar-open"
                );

            if (opened) {
                sidebar.classList.remove(
                    "ap-sidebar-open"
                );

                overlay?.classList.remove(
                    "ap-sidebar-visible"
                );

                document.body.classList.remove(
                    "ap-sidebar-locked"
                );

                button.textContent = "☰";
                button.setAttribute(
                    "aria-expanded",
                    "false"
                );
            } else {
                sidebar.classList.add(
                    "ap-sidebar-open"
                );

                overlay?.classList.add(
                    "ap-sidebar-visible"
                );

                document.body.classList.add(
                    "ap-sidebar-locked"
                );

                button.textContent = "×";
                button.setAttribute(
                    "aria-expanded",
                    "true"
                );
            }
        });

        console.log(
            "✅ AP SYNAPSE — SINGLE TAP MENU ACTIVE"
        );
    }

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            installSingleTapMenu,
            { once: true }
        );
    } else {
        installSingleTapMenu();
    }
})();

/* ============================================================
   AP SYNAPSE — MOBILE SIDEBAR FINAL OVERRIDE
   DOUBLE-TAP FIX
   MOBILE ONLY — DESKTOP UNTOUCHED
   ============================================================ */

(() => {
    "use strict";

    /* Prevent this final override from being installed twice */
    if (window.__AP_SYNapseMobileFinalOverride) return;
    window.__AP_SYNapseMobileFinalOverride = true;

    const BREAKPOINT = 767;

    function getSidebar() {
        return document.querySelector("aside.sidebar, .sidebar");
    }

    function getMenuButton() {
        return document.querySelector(".mobile-menu-button");
    }

    function getOverlay() {
        return document.querySelector(".mobile-sidebar-overlay");
    }

    function isMobile() {
        return window.innerWidth <= BREAKPOINT;
    }

    /* ---------------------------------------------------------
       FORCE THE CORRECT MOBILE LAYERS
       --------------------------------------------------------- */

    function prepareLayers() {

        if (!isMobile()) return;

        const sidebar = getSidebar();
        const button = getMenuButton();
        const overlay = getOverlay();

        if (sidebar) {
            sidebar.style.setProperty(
                "z-index",
                "2147483647",
                "important"
            );

            sidebar.style.setProperty(
                "position",
                "fixed",
                "important"
            );

            sidebar.style.setProperty(
                "top",
                "0",
                "important"
            );

            sidebar.style.setProperty(
                "left",
                "0",
                "important"
            );

            sidebar.style.setProperty(
                "bottom",
                "0",
                "important"
            );

            sidebar.style.setProperty(
                "width",
                "min(326px, 88vw)",
                "important"
            );

            sidebar.style.setProperty(
                "height",
                "100dvh",
                "important"
            );

            sidebar.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            sidebar.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            sidebar.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

            sidebar.style.setProperty(
                "transform",
                "translateX(-110%)",
                "important"
            );

            sidebar.style.setProperty(
                "filter",
                "none",
                "important"
            );

            sidebar.style.setProperty(
                "backdrop-filter",
                "none",
                "important"
            );

            sidebar.style.setProperty(
                "-webkit-backdrop-filter",
                "none",
                "important"
            );

            sidebar.style.setProperty(
                "transition",
                "transform 0.25s ease, visibility 0s linear 0.25s",
                "important"
            );
        }

        if (overlay) {

            overlay.style.setProperty(
                "position",
                "fixed",
                "important"
            );

            overlay.style.setProperty(
                "inset",
                "0",
                "important"
            );

            overlay.style.setProperty(
                "z-index",
                "2147483640",
                "important"
            );

            overlay.style.setProperty(
                "background",
                "rgba(0,0,0,0.45)",
                "important"
            );

            overlay.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            overlay.style.setProperty(
                "opacity",
                "0",
                "important"
            );

            overlay.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "filter",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "backdrop-filter",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "-webkit-backdrop-filter",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "transition",
                "opacity 0.25s ease, visibility 0s linear 0.25s",
                "important"
            );
        }

        if (button) {

            button.style.setProperty(
                "z-index",
                "2147483647",
                "important"
            );

            button.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );

            button.style.setProperty(
                "touch-action",
                "manipulation",
                "important"
            );
        }
    }

    /* ---------------------------------------------------------
       OPEN
       --------------------------------------------------------- */

    function openSidebar() {

        if (!isMobile()) return;

        const sidebar = getSidebar();
        const overlay = getOverlay();
        const button = getMenuButton();

        if (!sidebar) return;

        sidebar.style.setProperty(
            "visibility",
            "visible",
            "important"
        );

        sidebar.style.setProperty(
            "opacity",
            "1",
            "important"
        );

        sidebar.style.setProperty(
            "pointer-events",
            "auto",
            "important"
        );

        sidebar.style.setProperty(
            "transform",
            "translateX(0)",
            "important"
        );

        sidebar.style.setProperty(
            "z-index",
            "2147483647",
            "important"
        );

        sidebar.style.setProperty(
            "filter",
            "none",
            "important"
        );

        sidebar.style.setProperty(
            "backdrop-filter",
            "none",
            "important"
        );

        sidebar.style.setProperty(
            "-webkit-backdrop-filter",
            "none",
            "important"
        );

        if (overlay) {

            overlay.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

            overlay.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            overlay.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );

            overlay.style.setProperty(
                "z-index",
                "2147483640",
                "important"
            );
        }

        if (button) {
            button.setAttribute(
                "aria-expanded",
                "true"
            );
        }

        document.body.classList.add(
            "ap-sidebar-open"
        );

        document.documentElement.classList.add(
            "ap-sidebar-open"
        );
    }

    /* ---------------------------------------------------------
       CLOSE
       --------------------------------------------------------- */

    function closeSidebar() {

        const sidebar = getSidebar();
        const overlay = getOverlay();
        const button = getMenuButton();

        if (sidebar) {

            sidebar.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            sidebar.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

            sidebar.style.setProperty(
                "transform",
                "translateX(-110%)",
                "important"
            );
        }

        if (overlay) {

            overlay.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            overlay.style.setProperty(
                "opacity",
                "0",
                "important"
            );

            overlay.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );
        }

        if (button) {
            button.setAttribute(
                "aria-expanded",
                "false"
            );
        }

        document.body.classList.remove(
            "ap-sidebar-open"
        );

        document.documentElement.classList.remove(
            "ap-sidebar-open"
        );
    }

    /* ---------------------------------------------------------
       SINGLE SOURCE OF TRUTH
       IMPORTANT:
       CAPTURE PHASE + stopImmediatePropagation()
       BLOCKS THE OLD DUPLICATE HANDLERS.
       --------------------------------------------------------- */

    document.addEventListener(
        "click",
        event => {

            if (!isMobile()) return;

            const button =
                event.target.closest(
                    ".mobile-menu-button"
                );

            if (button) {

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                const sidebar = getSidebar();

                if (!sidebar) return;

                const visible =
                    getComputedStyle(sidebar).visibility ===
                    "visible" &&
                    getComputedStyle(sidebar).transform ===
                    "matrix(1, 0, 0, 1, 0, 0)";

                if (visible) {
                    closeSidebar();
                } else {
                    openSidebar();
                }

                return;
            }

            const overlay =
                event.target.closest(
                    ".mobile-sidebar-overlay"
                );

            if (overlay) {

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                closeSidebar();

                return;
            }

            const sidebar =
                event.target.closest(
                    "aside.sidebar, .sidebar"
                );

            if (sidebar) {

                const link =
                    event.target.closest(
                        "a, button"
                    );

                if (link) {

                    const isNavigation =
                        link.closest(
                            "nav"
                        ) ||
                        link.classList.contains(
                            "new-chat-btn"
                        ) ||
                        link.closest(
                            ".sidebar-footer"
                        );

                    if (isNavigation) {

                        setTimeout(
                            () => {
                                if (isMobile()) {
                                    closeSidebar();
                                }
                            },
                            0
                        );
                    }
                }

                return;
            }

        },
        true
    );

    /* ---------------------------------------------------------
       ESCAPE
       --------------------------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (
                isMobile() &&
                event.key === "Escape"
            ) {
                closeSidebar();
            }

        },
        true
    );

    /* ---------------------------------------------------------
       RESIZE
       --------------------------------------------------------- */

    window.addEventListener(
        "resize",
        () => {

            if (!isMobile()) {
                closeSidebar();
                return;
            }

            prepareLayers();

        },
        {
            passive: true
        }
    );

    /* ---------------------------------------------------------
       INITIALIZE
       --------------------------------------------------------- */

    function initialize() {

        if (isMobile()) {
            prepareLayers();
            closeSidebar();
        }
    }

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );

    } else {

        initialize();

    }

    console.log(
        "✅ AP SYNAPSE — MOBILE SIDEBAR DOUBLE-TAP OVERRIDE READY"
    );

})();

/* ============================================================
   AP SYNAPSE — ABSOLUTE FINAL MOBILE SIDEBAR FIX
   FIXES DOUBLE-TAP CAUSED BY DUPLICATE EVENT LISTENERS
   MOBILE ONLY — DESKTOP UNTOUCHED
   ============================================================ */

(() => {
    "use strict";

    const MOBILE_MAX = 767;

    function runFinalMobileFix() {

        if (window.innerWidth > MOBILE_MAX) return;

        let oldButton =
            document.querySelector(".mobile-menu-button");

        let sidebar =
            document.querySelector("aside.sidebar, .sidebar");

        let oldOverlay =
            document.querySelector(".mobile-sidebar-overlay");

        if (!oldButton || !sidebar) {
            console.warn(
                "AP Synapse mobile sidebar elements not ready."
            );
            return;
        }

        /* ========================================================
           1. DESTROY OLD MENU-BUTTON EVENT LISTENERS
           ======================================================== */

        const button =
            oldButton.cloneNode(true);

        oldButton.replaceWith(button);

        /* ========================================================
           2. DESTROY OLD OVERLAY EVENT LISTENERS
           ======================================================== */

        let overlay = oldOverlay;

        if (oldOverlay) {
            overlay =
                oldOverlay.cloneNode(true);

            oldOverlay.replaceWith(overlay);
        }

        /* ========================================================
           3. FINAL MOBILE VISUAL STATE
           ======================================================== */

        sidebar.style.setProperty(
            "position",
            "fixed",
            "important"
        );

        sidebar.style.setProperty(
            "top",
            "0",
            "important"
        );

        sidebar.style.setProperty(
            "left",
            "0",
            "important"
        );

        sidebar.style.setProperty(
            "bottom",
            "0",
            "important"
        );

        sidebar.style.setProperty(
            "width",
            "min(326px, 88vw)",
            "important"
        );

        sidebar.style.setProperty(
            "height",
            "100dvh",
            "important"
        );

        sidebar.style.setProperty(
            "z-index",
            "2147483647",
            "important"
        );

        sidebar.style.setProperty(
            "opacity",
            "1",
            "important"
        );

        sidebar.style.setProperty(
            "filter",
            "none",
            "important"
        );

        sidebar.style.setProperty(
            "backdrop-filter",
            "none",
            "important"
        );

        sidebar.style.setProperty(
            "-webkit-backdrop-filter",
            "none",
            "important"
        );

        sidebar.style.setProperty(
            "transition",
            "transform .25s ease",
            "important"
        );

        /* CLOSED initially */

        sidebar.classList.remove(
            "ap-sidebar-open",
            "ap-open"
        );

        sidebar.style.setProperty(
            "transform",
            "translate3d(-105%,0,0)",
            "important"
        );

        sidebar.style.setProperty(
            "visibility",
            "hidden",
            "important"
        );

        sidebar.style.setProperty(
            "pointer-events",
            "none",
            "important"
        );

        /* ========================================================
           4. FINAL OVERLAY
           ======================================================== */

        if (overlay) {

            overlay.style.setProperty(
                "position",
                "fixed",
                "important"
            );

            overlay.style.setProperty(
                "inset",
                "0",
                "important"
            );

            overlay.style.setProperty(
                "z-index",
                "2147483640",
                "important"
            );

            overlay.style.setProperty(
                "background",
                "rgba(0,0,0,.45)",
                "important"
            );

            overlay.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            overlay.style.setProperty(
                "opacity",
                "0",
                "important"
            );

            overlay.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "filter",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "backdrop-filter",
                "none",
                "important"
            );

            overlay.style.setProperty(
                "-webkit-backdrop-filter",
                "none",
                "important"
            );
        }

        /* ========================================================
           5. OPEN
           ======================================================== */

        function openSidebar() {

            sidebar.classList.add(
                "ap-sidebar-open"
            );

            sidebar.classList.add(
                "ap-open"
            );

            sidebar.style.setProperty(
                "transform",
                "translate3d(0,0,0)",
                "important"
            );

            sidebar.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

            sidebar.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );

            sidebar.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            if (overlay) {

                overlay.style.setProperty(
                    "visibility",
                    "visible",
                    "important"
                );

                overlay.style.setProperty(
                    "opacity",
                    "1",
                    "important"
                );

                overlay.style.setProperty(
                    "pointer-events",
                    "auto",
                    "important"
                );
            }

            document.body.classList.add(
                "ap-sidebar-open"
            );

            document.body.classList.add(
                "ap-mobile-sidebar-open"
            );

            document.documentElement.classList.add(
                "ap-sidebar-open"
            );

            button.setAttribute(
                "aria-expanded",
                "true"
            );
        }

        /* ========================================================
           6. CLOSE
           ======================================================== */

        function closeSidebar() {

            sidebar.classList.remove(
                "ap-sidebar-open",
                "ap-open"
            );

            sidebar.style.setProperty(
                "transform",
                "translate3d(-105%,0,0)",
                "important"
            );

            sidebar.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            sidebar.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

            if (overlay) {

                overlay.style.setProperty(
                    "visibility",
                    "hidden",
                    "important"
                );

                overlay.style.setProperty(
                    "opacity",
                    "0",
                    "important"
                );

                overlay.style.setProperty(
                    "pointer-events",
                    "none",
                    "important"
                );
            }

            document.body.classList.remove(
                "ap-sidebar-open",
                "ap-mobile-sidebar-open"
            );

            document.documentElement.classList.remove(
                "ap-sidebar-open"
            );

            button.setAttribute(
                "aria-expanded",
                "false"
            );
        }

        /* ========================================================
           7. ONE — ONLY ONE — MENU HANDLER
           ======================================================== */

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                const isOpen =
                    sidebar.classList.contains(
                        "ap-sidebar-open"
                    ) ||
                    sidebar.classList.contains(
                        "ap-open"
                    );

                if (isOpen) {
                    closeSidebar();
                } else {
                    openSidebar();
                }

            },
            {
                capture: true,
                passive: false
            }
        );

        /* ========================================================
           8. OVERLAY CLOSE
           ======================================================== */

        if (overlay) {

            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target === overlay
                    ) {
                        event.preventDefault();
                        event.stopPropagation();
                        closeSidebar();
                    }

                },
                {
                    capture: true
                }
            );
        }

        /* ========================================================
           9. SIDEBAR NAVIGATION → CLOSE
           ======================================================== */

        sidebar.addEventListener(
            "click",
            event => {

                const link =
                    event.target.closest(
                        "a, button"
                    );

                if (!link) return;

                /*
                 * Do not interfere with navigation.
                 * Just close the mobile drawer.
                 */

                setTimeout(
                    () => {
                        if (
                            window.innerWidth <=
                            MOBILE_MAX
                        ) {
                            closeSidebar();
                        }
                    },
                    50
                );

            },
            {
                capture: false
            }
        );

        /* ========================================================
           10. ESC
           ======================================================== */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    window.innerWidth <= MOBILE_MAX
                ) {
                    closeSidebar();
                }

            },
            {
                capture: true
            }
        );

        console.log(
            "✅ AP SYNAPSE — TRUE SINGLE MOBILE SIDEBAR CONTROLLER ACTIVE"
        );
    }

    /*
     * IMPORTANT:
     * Wait until all previous sidebar controllers have finished
     * attaching their listeners, THEN replace the button.
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => {
                setTimeout(
                    runFinalMobileFix,
                    50
                );
            },
            {
                once: true
            }
        );

    } else {

        setTimeout(
            runFinalMobileFix,
            50
        );

    }

})();

/* ============================================================
   AP SYNAPSE — MOBILE SIDEBAR SINGLE-TAP FINAL OVERRIDE
   MOBILE ONLY — DESKTOP UNTOUCHED
   ============================================================ */
(() => {
    "use strict";

    const BREAKPOINT = 767;

    function install() {
        if (window.innerWidth > BREAKPOINT) return;

        const oldButton =
            document.querySelector(".mobile-menu-button");

        const sidebar =
            document.querySelector("aside.sidebar, .sidebar");

        const oldOverlay =
            document.querySelector(".mobile-sidebar-overlay");

        if (!oldButton || !sidebar) {
            console.warn("AP MOBILE SIDEBAR: elements not ready");
            return;
        }

        /* ----------------------------------------------------
           CRITICAL:
           Clone the button.
           This removes EVERY old click/touch listener attached
           by all previous sidebar controllers.
           ---------------------------------------------------- */

        const button = oldButton.cloneNode(true);

        oldButton.replaceWith(button);

        /* Remove old overlay listeners too */
        let overlay = oldOverlay;

        if (overlay) {
            overlay = overlay.cloneNode(true);
            oldOverlay.replaceWith(overlay);
        }

        function isOpen() {
            return (
                sidebar.classList.contains("ap-mobile-open") ||
                sidebar.classList.contains("mobile-open")
            );
        }

        function open() {
            sidebar.classList.add(
                "ap-mobile-open",
                "mobile-open",
                "ap-sidebar-open"
            );

            sidebar.style.setProperty(
                "transform",
                "translateX(0)",
                "important"
            );

            sidebar.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

            sidebar.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            sidebar.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );

            if (overlay) {
                overlay.classList.add(
                    "active",
                    "visible",
                    "ap-mobile-open",
                    "ap-sidebar-visible"
                );

                overlay.style.setProperty(
                    "opacity",
                    "1",
                    "important"
                );

                overlay.style.setProperty(
                    "visibility",
                    "visible",
                    "important"
                );

                overlay.style.setProperty(
                    "pointer-events",
                    "auto",
                    "important"
                );
            }

            document.body.classList.add(
                "ap-mobile-nav-open",
                "ap-mobile-sidebar-open"
            );

            button.textContent = "×";
            button.setAttribute(
                "aria-expanded",
                "true"
            );
        }

        function close() {
            sidebar.classList.remove(
                "ap-mobile-open",
                "mobile-open",
                "ap-sidebar-open"
            );

            sidebar.style.setProperty(
                "transform",
                "translateX(-110%)",
                "important"
            );

            sidebar.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            sidebar.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

            if (overlay) {
                overlay.classList.remove(
                    "active",
                    "visible",
                    "ap-mobile-open",
                    "ap-sidebar-visible"
                );

                overlay.style.setProperty(
                    "opacity",
                    "0",
                    "important"
                );

                overlay.style.setProperty(
                    "visibility",
                    "hidden",
                    "important"
                );

                overlay.style.setProperty(
                    "pointer-events",
                    "none",
                    "important"
                );
            }

            document.body.classList.remove(
                "ap-mobile-nav-open",
                "ap-mobile-sidebar-open"
            );

            button.textContent = "☰";
            button.setAttribute(
                "aria-expanded",
                "false"
            );
        }

        /* ----------------------------------------------------
           INITIAL STATE
           ---------------------------------------------------- */

        close();

        /* ----------------------------------------------------
           ONE — AND ONLY ONE — MOBILE BUTTON HANDLER
           pointerdown prevents the double-tap problem.
           ---------------------------------------------------- */

        button.addEventListener(
            "pointerdown",
            event => {

                if (window.innerWidth > BREAKPOINT) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                if (isOpen()) {
                    close();
                } else {
                    open();
                }
            },
            {
                capture: true,
                passive: false
            }
        );

        /* ----------------------------------------------------
           OVERLAY CLOSE
           ---------------------------------------------------- */

        if (overlay) {
            overlay.addEventListener(
                "pointerdown",
                event => {

                    if (
                        event.target !== overlay ||
                        window.innerWidth > BREAKPOINT
                    ) {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    close();
                },
                {
                    capture: true,
                    passive: false
                }
            );
        }

        /* ----------------------------------------------------
           SIDEBAR NAVIGATION:
           close immediately when a sidebar item is selected.
           ---------------------------------------------------- */

        sidebar.addEventListener(
            "click",
            event => {

                if (window.innerWidth > BREAKPOINT) {
                    return;
                }

                const item =
                    event.target.closest(
                        "a, button"
                    );

                if (!item) return;

                if (
                    item.closest(
                        ".mobile-menu-button"
                    )
                ) {
                    return;
                }

                close();
            },
            true
        );

        /* ----------------------------------------------------
           ESCAPE
           ---------------------------------------------------- */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    window.innerWidth <= BREAKPOINT
                ) {
                    close();
                }
            },
            true
        );

        console.log(
            "✅ AP SYNAPSE MOBILE SIDEBAR — SINGLE TAP OVERRIDE ACTIVE"
        );
    }

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            () => setTimeout(install, 100),
            { once: true }
        );
    } else {
        setTimeout(install, 100);
    }

})();

/* ============================================================
   AP SYNAPSE — MOBILE X CLOSE GUARANTEE
   ============================================================ */
setTimeout(() => {

    if (window.innerWidth > 767) return;

    const btn =
        document.querySelector(".mobile-menu-button");

    const sidebar =
        document.querySelector("aside.sidebar, .sidebar");

    if (!btn || !sidebar) return;

    btn.addEventListener(
        "click",
        event => {

            if (window.innerWidth > 767) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const open =
                sidebar.classList.contains("ap-mobile-open") ||
                sidebar.classList.contains("mobile-open");

            if (open) {
                btn.dispatchEvent(
                    new PointerEvent("pointerdown", {
                        bubbles: true,
                        cancelable: true,
                        pointerType: "touch"
                    })
                );
            }
        },
        true
    );

}, 300);

/* ============================================================
   AP SYNAPSE — FINAL MOBILE ☰ / × TOGGLE
   SINGLE TAP • FORCE CLOSE • MOBILE ONLY
   ============================================================ */
(() => {
    "use strict";

    setTimeout(() => {

        if (window.innerWidth > 767) return;

        const oldButton =
            document.querySelector(".mobile-menu-button");

        const sidebar =
            document.querySelector("aside.sidebar, .sidebar");

        const overlay =
            document.querySelector(".mobile-sidebar-overlay");

        if (!oldButton || !sidebar) {
            console.warn("AP MOBILE FINAL: elements missing");
            return;
        }

        /* Remove ALL previous listeners from the menu button */
        const button = oldButton.cloneNode(true);
        oldButton.replaceWith(button);

        function openSidebar() {

            sidebar.classList.add(
                "ap-open",
                "ap-sidebar-open",
                "ap-mobile-open",
                "mobile-open"
            );

            sidebar.style.setProperty(
                "transform",
                "translate3d(0,0,0)",
                "important"
            );

            sidebar.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

            sidebar.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            sidebar.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );

            if (overlay) {

                overlay.classList.add(
                    "active",
                    "visible",
                    "ap-visible",
                    "ap-sidebar-visible",
                    "ap-mobile-open"
                );

                overlay.style.setProperty(
                    "opacity",
                    "1",
                    "important"
                );

                overlay.style.setProperty(
                    "visibility",
                    "visible",
                    "important"
                );

                overlay.style.setProperty(
                    "pointer-events",
                    "auto",
                    "important"
                );
            }

            document.body.classList.add(
                "ap-mobile-sidebar-open",
                "ap-mobile-nav-open"
            );

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

        function closeSidebar() {

            sidebar.classList.remove(
                "ap-open",
                "ap-sidebar-open",
                "ap-mobile-open",
                "mobile-open"
            );

            sidebar.style.setProperty(
                "transform",
                "translate3d(-105%,0,0)",
                "important"
            );

            sidebar.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            sidebar.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            sidebar.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );

            if (overlay) {

                overlay.classList.remove(
                    "active",
                    "visible",
                    "ap-visible",
                    "ap-sidebar-visible",
                    "ap-mobile-open"
                );

                overlay.style.setProperty(
                    "opacity",
                    "0",
                    "important"
                );

                overlay.style.setProperty(
                    "visibility",
                    "hidden",
                    "important"
                );

                overlay.style.setProperty(
                    "pointer-events",
                    "none",
                    "important"
                );
            }

            document.body.classList.remove(
                "ap-mobile-sidebar-open",
                "ap-mobile-nav-open"
            );

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

        function isOpen() {
            return (
                sidebar.classList.contains("ap-open") ||
                sidebar.classList.contains("ap-sidebar-open") ||
                sidebar.classList.contains("ap-mobile-open") ||
                sidebar.classList.contains("mobile-open")
            );
        }

        /* Clean starting state */
        closeSidebar();

        /* ONE SINGLE TAP HANDLER */
        button.addEventListener(
            "pointerdown",
            event => {

                if (window.innerWidth > 767) return;

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                if (isOpen()) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            },
            {
                capture: true,
                passive: false
            }
        );

        /* Sidebar links close automatically */
        sidebar.addEventListener(
            "pointerdown",
            event => {

                if (window.innerWidth > 767) return;

                const item =
                    event.target.closest("a, button");

                if (!item) return;

                if (item === button) return;

                setTimeout(closeSidebar, 50);
            },
            true
        );

        /* Overlay closes */
        if (overlay) {
            overlay.addEventListener(
                "pointerdown",
                event => {

                    if (
                        event.target === overlay &&
                        window.innerWidth <= 767
                    ) {
                        event.preventDefault();
                        event.stopPropagation();
                        closeSidebar();
                    }
                },
                true
            );
        }

        console.log(
            "✅ AP SYNAPSE — FINAL ☰ / × MOBILE TOGGLE READY"
        );

    }, 500);

})();

/* =========================================================
   AP SYNAPSE — MOBILE SIDEBAR SCROLL STABILITY
   Native mobile scrolling • No scroll hijacking
   ========================================================= */

(() => {

    const MOBILE_BREAKPOINT = 768;

    function initializeMobileSidebarScroll() {

        const sidebar =
            document.querySelector(".sidebar");

        if (!sidebar) {
            return false;
        }

        /* -----------------------------------------
           Native mobile scrolling
        ----------------------------------------- */

        function applyScrollMode() {

            if (window.innerWidth <= MOBILE_BREAKPOINT) {

                sidebar.style.overflowY = "auto";
                sidebar.style.overflowX = "hidden";

                sidebar.style.touchAction = "pan-y";

                sidebar.style.webkitOverflowScrolling =
                    "touch";

                /* Do NOT use smooth scrolling on the
                   user's finger-driven sidebar scroll. */
                sidebar.style.scrollBehavior = "auto";

            } else {

                sidebar.style.removeProperty("overflow-y");
                sidebar.style.removeProperty("overflow-x");
                sidebar.style.removeProperty("touch-action");
                sidebar.style.removeProperty(
                    "-webkit-overflow-scrolling"
                );
                sidebar.style.removeProperty(
                    "scroll-behavior"
                );

            }

        }

        /* -----------------------------------------
           Track genuine scrolling
        ----------------------------------------- */

        let scrolling = false;
        let scrollTimer = null;

        sidebar.addEventListener(
            "scroll",
            () => {

                scrolling = true;

                clearTimeout(scrollTimer);

                scrollTimer = setTimeout(() => {

                    scrolling = false;

                }, 150);

            },
            {
                passive: true
            }
        );

        sidebar.__apSynapseIsScrolling =
            () => scrolling;

        /* -----------------------------------------
           Prevent accidental click propagation
           immediately after a swipe
        ----------------------------------------- */

        sidebar.addEventListener(
            "click",
            (event) => {

                if (
                    window.innerWidth <= MOBILE_BREAKPOINT &&
                    scrolling
                ) {

                    event.stopPropagation();

                }

            },
            true
        );

        /* -----------------------------------------
           Resize
        ----------------------------------------- */

        window.addEventListener(
            "resize",
            applyScrollMode,
            {
                passive: true
            }
        );

        applyScrollMode();

        console.log(
            "✅ AP SYNAPSE — MOBILE SIDEBAR SCROLL STABILITY ACTIVE"
        );

        return true;
    }

    /* ---------------------------------------------
       Wait for the sidebar to exist.

       We intentionally do NOT require
       mobileSidebarBtn here. The scroll system
       must never fail just because the toggle
       controller loads later.
    --------------------------------------------- */

    if (initializeMobileSidebarScroll()) {
        return;
    }

    let attempts = 0;

    const retryTimer =
        setInterval(() => {

            attempts++;

            if (initializeMobileSidebarScroll()) {

                clearInterval(retryTimer);

                return;
            }

            if (attempts >= 40) {

                clearInterval(retryTimer);

                console.warn(
                    "⚠️ AP SYNAPSE — Sidebar element was not available after initialization."
                );

            }

        }, 250);

})();

/* ============================================================
   AP SYNAPSE — DESKTOP SIDEBAR COLLAPSE / RAIL
   FINAL SAFE CONTROLLER
   ------------------------------------------------------------
   Uses the existing:
      body.ap-sidebar-collapsed
      .ap-collapsed-rail
      .ap-rail-btn
      .ap-sidebar-icon-btn

   Desktop only.
   Mobile is completely untouched.
   No permanent localStorage state.
   ============================================================ */

(() => {
    "use strict";

    const AP_DESKTOP = 767;

    const isDesktop = () =>
        window.innerWidth > AP_DESKTOP;

    function getSidebar() {
        return document.querySelector(
            ".app > aside.sidebar, aside.sidebar, .sidebar"
        );
    }

    function getRail() {
        return document.querySelector(
            ".ap-collapsed-rail"
        );
    }

    function getCollapseButton() {
        const sidebar = getSidebar();

        if (!sidebar) return null;

        return sidebar.querySelector(
            ".ap-sidebar-icon-btn"
        );
    }

    /* ============================================================
   AP SYNAPSE — SINGLE DESKTOP SIDEBAR CONTROLLER
   ============================================================ */

(() => {

    "use strict";

    const DESKTOP_BREAKPOINT = 768;
    const SIDEBAR_WIDTH = "280px";
    const RAIL_WIDTH = "64px";

    function isDesktop() {
        return window.innerWidth > DESKTOP_BREAKPOINT;
    }

    function getSidebar() {
        return document.querySelector(".sidebar");
    }

    function getRail() {
        return document.querySelector("#apCollapsedRail");
    }

    function getCollapseButton() {
        return document.querySelector("#apSidebarCollapse");
    }

    /* ========================================================
       FORCE FULL SIDEBAR
       ======================================================== */

    function showFullSidebar() {

        if (!isDesktop()) return;

        const sidebar = getSidebar();
        const rail = getRail();

        document.body.classList.remove(
            "ap-sidebar-collapsed"
        );

        if (sidebar) {

            sidebar.classList.remove(
                "ap-sidebar-collapsed"
            );

            sidebar.style.setProperty(
                "display",
                "flex",
                "important"
            );

            sidebar.style.setProperty(
                "width",
                SIDEBAR_WIDTH,
                "important"
            );

            sidebar.style.setProperty(
                "opacity",
                "1",
                "important"
            );

            sidebar.style.setProperty(
                "visibility",
                "visible",
                "important"
            );

            sidebar.style.setProperty(
                "pointer-events",
                "auto",
                "important"
            );

            sidebar.style.setProperty(
                "z-index",
                "2147483000",
                "important"
            );
        }

        if (rail) {

            rail.classList.remove("ap-visible");

            rail.setAttribute(
                "aria-hidden",
                "true"
            );

            rail.style.setProperty(
                "display",
                "none",
                "important"
            );

            rail.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );
        }

        const collapseButton =
            getCollapseButton();

        if (collapseButton) {

            collapseButton.setAttribute(
                "aria-label",
                "Collapse sidebar"
            );

            collapseButton.setAttribute(
                "data-tooltip",
                "Collapse sidebar"
            );

            collapseButton.setAttribute(
                "aria-expanded",
                "true"
            );
        }
    }


    /* ========================================================
       COLLAPSE TO 64px RAIL
       ======================================================== */

    function collapseToRail() {

        if (!isDesktop()) return;

        const sidebar = getSidebar();
        const rail = getRail();

        if (!sidebar || !rail) {
            console.error(
                "❌ AP Synapse sidebar/rail missing."
            );
            return;
        }

        /*
         * Collapse the main sidebar.
         */

        document.body.classList.add(
            "ap-sidebar-collapsed"
        );

        sidebar.classList.add(
            "ap-sidebar-collapsed"
        );

        sidebar.style.setProperty(
            "width",
            "0px",
            "important"
        );

        sidebar.style.setProperty(
            "min-width",
            "0px",
            "important"
        );

        sidebar.style.setProperty(
            "opacity",
            "0",
            "important"
        );

        sidebar.style.setProperty(
            "visibility",
            "hidden",
            "important"
        );

        sidebar.style.setProperty(
            "pointer-events",
            "none",
            "important"
        );


        /*
         * Show the EXISTING AP Collapsed Rail.
         */

        rail.classList.add(
            "ap-visible"
        );

        rail.setAttribute(
            "aria-hidden",
            "false"
        );

        rail.style.setProperty(
            "display",
            "flex",
            "important"
        );

        rail.style.setProperty(
            "visibility",
            "visible",
            "important"
        );

        rail.style.setProperty(
            "opacity",
            "1",
            "important"
        );

        rail.style.setProperty(
            "width",
            RAIL_WIDTH,
            "important"
        );

        rail.style.setProperty(
            "height",
            "100vh",
            "important"
        );

        rail.style.setProperty(
            "position",
            "fixed",
            "important"
        );

        rail.style.setProperty(
            "left",
            "0",
            "important"
        );

        rail.style.setProperty(
            "top",
            "0",
            "important"
        );

        rail.style.setProperty(
            "z-index",
            "2147483000",
            "important"
        );

        rail.style.setProperty(
            "pointer-events",
            "auto",
            "important"
        );


        /*
         * Update collapse button state.
         */

        const collapseButton =
            getCollapseButton();

        if (collapseButton) {

            collapseButton.setAttribute(
                "aria-expanded",
                "false"
            );

            collapseButton.setAttribute(
                "aria-label",
                "Sidebar collapsed"
            );
        }

        console.log(
            "✅ AP SYNAPSE — SIDEBAR → 64px RAIL"
        );
    }


    /* ========================================================
       RAIL → FULL SIDEBAR
       ======================================================== */

    function expandFromRail() {

        if (!isDesktop()) return;

        showFullSidebar();

        localStorage.setItem(
            "apSynapseSidebarCollapsed",
            "false"
        );

        console.log(
            "✅ AP SYNAPSE — RAIL → FULL SIDEBAR"
        );
    }


    /* ========================================================
       COLLAPSE BUTTON
       ======================================================== */

    function bindCollapseButton() {

        const oldButton =
            getCollapseButton();

        if (!oldButton) return;

        /*
         * Replace the button with a clone.
         *
         * This removes all the old conflicting
         * click listeners from previous controllers.
         */

        if (
            oldButton.dataset.apCleanSidebarButton ===
            "true"
        ) {
            return;
        }

        const button =
            oldButton.cloneNode(true);

        button.dataset.apCleanSidebarButton =
            "true";

        oldButton.replaceWith(button);

        button.addEventListener(
            "click",
            event => {

                if (!isDesktop()) return;

                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();

                collapseToRail();

                localStorage.setItem(
                    "apSynapseSidebarCollapsed",
                    "true"
                );

            },
            true
        );

        console.log(
            "✅ AP Synapse — collapse button bound once"
        );
    }


    /* ========================================================
       RAIL BUTTON HELPERS
       ======================================================== */

    function clickExisting(id) {

        const target =
            document.getElementById(id);

        if (!target) {

            console.warn(
                "⚠️ Sidebar target not found:",
                id
            );

            return false;
        }

        target.click();

        return true;
    }


    /* ========================================================
       RAIL NAVIGATION
       ======================================================== */

    function bindRail() {

        const rail = getRail();

        if (!rail) {

            console.warn(
                "⚠️ #apCollapsedRail not found."
            );

            return;
        }

        /*
         * Replace the entire rail once.
         *
         * This removes old rail listeners.
         */

        if (
            rail.dataset.apCleanRail ===
            "true"
        ) {
            return;
        }

        const cleanRail =
            rail.cloneNode(true);

        cleanRail.dataset.apCleanRail =
            "true";

        rail.replaceWith(cleanRail);


        cleanRail.style.setProperty(
            "pointer-events",
            "auto",
            "important"
        );

        cleanRail
            .querySelectorAll(".ap-rail-btn")
            .forEach(button => {

                button.style.setProperty(
                    "pointer-events",
                    "auto",
                    "important"
                );

                button.style.setProperty(
                    "cursor",
                    "pointer",
                    "important"
                );
            });


        cleanRail.addEventListener(
            "click",
            event => {

                if (!isDesktop()) return;

                const button =
                    event.target.closest(
                        ".ap-rail-btn"
                    );

                if (!button) return;

                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();


                /*
                 * OPEN SIDEBAR
                 */

                if (
                    button.id === "apRailOpen" ||
                    button.classList.contains(
                        "ap-rail-expand"
                    )
                ) {

                    expandFromRail();

                    return;
                }


                /*
                 * NEW CHAT
                 */

                if (
                    button.id === "apRailNewChat"
                ) {

                    expandFromRail();

                    setTimeout(
                        () => {

                            clickExisting(
                                "newChatBtn"
                            ) ||
                            document
                                .querySelector(
                                    ".new-chat-btn"
                                )
                                ?.click();

                        },
                        80
                    );

                    return;
                }


                /*
                 * RECENT
                 */

                if (
                    button.id === "apRailRecent"
                ) {

                    expandFromRail();

                    setTimeout(
                        () => {

                            const history =
                                document.querySelector(
                                    ".history"
                                );

                            if (history) {

                                history.scrollIntoView({
                                    behavior:
                                        "smooth",
                                    block:
                                        "start"
                                });

                                return;
                            }

                            const firstHistory =
                                document.querySelector(
                                    ".history-item"
                                );

                            firstHistory?.click();

                        },
                        80
                    );

                    return;
                }


                /*
                 * SETTINGS
                 */

                if (
                    button.id === "apRailSettings"
                ) {

                    expandFromRail();

                    setTimeout(
                        () => {

                            clickExisting(
                                "sidebarSettingsBtn"
                            );

                        },
                        80
                    );

                    return;
                }


                /*
                 * PROFILE
                 */

                if (
                    button.id === "apRailProfile"
                ) {

                    expandFromRail();

                    setTimeout(
                        () => {

                            clickExisting(
                                "profileSidebarBtn"
                            );

                        },
                        80
                    );

                    return;
                }

            },
            true
        );

        console.log(
            "✅ AP Synapse — rail navigation bound once"
        );
    }


    /* ========================================================
       DESKTOP / MOBILE SAFETY
       ======================================================== */

    function syncResponsiveState() {

        const sidebar = getSidebar();
        const rail = getRail();

        if (!sidebar) return;


        /*
         * MOBILE
         */

        if (!isDesktop()) {

            document.body.classList.remove(
                "ap-sidebar-collapsed"
            );

            sidebar.classList.remove(
                "ap-sidebar-collapsed"
            );

            sidebar.style.removeProperty(
                "width"
            );

            sidebar.style.removeProperty(
                "opacity"
            );

            sidebar.style.removeProperty(
                "visibility"
            );

            sidebar.style.removeProperty(
                "pointer-events"
            );

            if (rail) {

                rail.classList.remove(
                    "ap-visible"
                );

                rail.setAttribute(
                    "aria-hidden",
                    "true"
                );

                rail.style.setProperty(
                    "display",
                    "none",
                    "important"
                );
            }

            return;
        }


        /*
         * DESKTOP
         */

        const saved =
            localStorage.getItem(
                "apSynapseSidebarCollapsed"
            );

        if (saved === "true") {

            collapseToRail();

        } else {

            showFullSidebar();

        }
    }


    /* ========================================================
       INITIALIZE
       ======================================================== */

    function initializeSidebarController() {

        if (!isDesktop()) {

            syncResponsiveState();

            return;
        }

        bindCollapseButton();
        bindRail();

        /*
         * Default to the user's saved state.
         *
         * If there is no saved state, full sidebar.
         */

        const saved =
            localStorage.getItem(
                "apSynapseSidebarCollapsed"
            );

        if (saved === "true") {

            collapseToRail();

        } else {

            localStorage.setItem(
                "apSynapseSidebarCollapsed",
                "false"
            );

            showFullSidebar();

        }

        console.log(
            "✅ AP SYNAPSE — SINGLE SIDEBAR CONTROLLER ACTIVE"
        );
    }


    /* ========================================================
       RESIZE
       ======================================================== */

    let resizeTimer = null;

    window.addEventListener(
        "resize",
        () => {

            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(
                () => {

                    syncResponsiveState();

                },
                100
            );

        },
        {
            passive: true
        }
    );


    /* ========================================================
       START
       ======================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeSidebarController,
            {
                once: true
            }
        );

    } else {

        initializeSidebarController();

    }

})();

/* ============================================================
   AP SYNAPSE — STABLE DESKTOP SIDEBAR CONTROLLER
   FINAL SINGLE CONTROLLER
   ============================================================ */

(() => {

    "use strict";

    console.log(
        "🚀 AP SYNAPSE — STABLE SIDEBAR CONTROLLER STARTING"
    );

    const SIDEBAR_SELECTOR = ".sidebar";
    const COLLAPSED_CLASS = "ap-sidebar-collapsed";

    const sidebar =
        document.querySelector(SIDEBAR_SELECTOR);

    const collapseButton =
        document.querySelector("#apSidebarCollapse");

    const rail =
        document.querySelector("#apCollapsedRail");

    if (!sidebar) {
        console.error(
            "❌ AP SYNAPSE — Sidebar element not found"
        );
        return;
    }

    if (!collapseButton) {
        console.error(
            "❌ AP SYNAPSE — Collapse button not found"
        );
        return;
    }

    if (!rail) {
        console.error(
            "❌ AP SYNAPSE — Collapsed rail not found"
        );
        return;
    }


    /* ========================================================
       DESKTOP CHECK
       ======================================================== */

    function isDesktop() {
        return window.innerWidth > 768;
    }


    /* ========================================================
       FORCE RAIL VISIBILITY
       ======================================================== */

    function showRail() {

        rail.classList.add("ap-visible");

        rail.setAttribute(
            "aria-hidden",
            "false"
        );

        rail.style.setProperty(
            "display",
            "flex",
            "important"
        );

        rail.style.setProperty(
            "visibility",
            "visible",
            "important"
        );

        rail.style.setProperty(
            "opacity",
            "1",
            "important"
        );

        rail.style.setProperty(
            "pointer-events",
            "auto",
            "important"
        );

        rail.style.setProperty(
            "position",
            "fixed",
            "important"
        );

        rail.style.setProperty(
            "left",
            "0",
            "important"
        );

        rail.style.setProperty(
            "top",
            "0",
            "important"
        );

        rail.style.setProperty(
            "width",
            "64px",
            "important"
        );

        rail.style.setProperty(
            "height",
            "100vh",
            "important"
        );

        rail.style.setProperty(
            "z-index",
            "2147483000",
            "important"
        );
    }


    /* ========================================================
       HIDE RAIL
       ======================================================== */

    function hideRail() {

        rail.classList.remove("ap-visible");

        rail.setAttribute(
            "aria-hidden",
            "true"
        );

        rail.style.removeProperty("display");
        rail.style.removeProperty("visibility");
        rail.style.removeProperty("opacity");
        rail.style.removeProperty("pointer-events");
    }


    /* ========================================================
       OPEN FULL SIDEBAR
       ======================================================== */

    function openSidebar() {

        if (!isDesktop()) return;

        document.body.classList.remove(
            COLLAPSED_CLASS
        );

        sidebar.classList.remove(
            COLLAPSED_CLASS
        );

        sidebar.style.setProperty(
            "display",
            "flex",
            "important"
        );

        sidebar.style.setProperty(
            "visibility",
            "visible",
            "important"
        );

        sidebar.style.setProperty(
            "opacity",
            "1",
            "important"
        );

        sidebar.style.setProperty(
            "width",
            "280px",
            "important"
        );

        sidebar.style.setProperty(
            "pointer-events",
            "auto",
            "important"
        );

        hideRail();

        collapseButton.setAttribute(
            "aria-label",
            "Collapse sidebar"
        );

        collapseButton.setAttribute(
            "data-tooltip",
            "Collapse sidebar"
        );

        collapseButton.setAttribute(
            "aria-expanded",
            "true"
        );

        localStorage.setItem(
            "apSynapseSidebarCollapsed",
            "false"
        );

        console.log(
            "✅ AP SYNAPSE — FULL SIDEBAR OPEN"
        );
    }


    /* ========================================================
       COLLAPSE TO RAIL
       ======================================================== */

    function collapseSidebar() {

        if (!isDesktop()) return;

        document.body.classList.add(
            COLLAPSED_CLASS
        );

        sidebar.classList.add(
            COLLAPSED_CLASS
        );

        sidebar.style.setProperty(
            "width",
            "0px",
            "important"
        );

        sidebar.style.setProperty(
            "opacity",
            "0",
            "important"
        );

        sidebar.style.setProperty(
            "pointer-events",
            "none",
            "important"
        );

        showRail();

        collapseButton.setAttribute(
            "aria-label",
            "Expand sidebar"
        );

        collapseButton.setAttribute(
            "data-tooltip",
            "Expand sidebar"
        );

        collapseButton.setAttribute(
            "aria-expanded",
            "false"
        );

        localStorage.setItem(
            "apSynapseSidebarCollapsed",
            "true"
        );

        console.log(
            "✅ AP SYNAPSE — SIDEBAR COLLAPSED TO RAIL"
        );
    }


    /* ========================================================
       REMOVE OLD BUTTON LISTENERS
       ======================================================== */

    const cleanCollapseButton =
        collapseButton.cloneNode(true);

    collapseButton.replaceWith(
        cleanCollapseButton
    );


    /* ========================================================
       COLLAPSE BUTTON
       ======================================================== */

    cleanCollapseButton.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            if (!isDesktop()) return;

            collapseSidebar();

        },
        true
    );


    /* ========================================================
       RAIL BUTTONS
       ======================================================== */

    const railButtons =
        rail.querySelectorAll(
            "button"
        );


    railButtons.forEach(button => {

        button.style.setProperty(
            "pointer-events",
            "auto",
            "important"
        );

        button.style.setProperty(
            "cursor",
            "pointer",
            "important"
        );

    });


    /* ========================================================
       OPEN BUTTON
       ======================================================== */

    const openButton =
        rail.querySelector(
            "#apRailOpen"
        );


    if (openButton) {

        const cleanOpenButton =
            openButton.cloneNode(true);

        openButton.replaceWith(
            cleanOpenButton
        );


        cleanOpenButton.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                openSidebar();

            },
            true
        );

    } else {

        console.error(
            "❌ AP SYNAPSE — #apRailOpen not found"
        );

    }


    /* ========================================================
       NEW CHAT
       ======================================================== */

    const newChatButton =
        rail.querySelector(
            "#apRailNewChat"
        );


    if (newChatButton) {

        const cleanNewChat =
            newChatButton.cloneNode(true);

        newChatButton.replaceWith(
            cleanNewChat
        );


        cleanNewChat.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                openSidebar();

                setTimeout(() => {

                    const newChat =
                        document.querySelector(
                            ".new-chat-btn"
                        );

                    if (newChat) {
                        newChat.click();
                    }

                }, 100);

            },
            true
        );

    }


    /* ========================================================
       RECENT
       ======================================================== */

    const recentButton =
        rail.querySelector(
            "#apRailRecent"
        );


    if (recentButton) {

        const cleanRecent =
            recentButton.cloneNode(true);

        recentButton.replaceWith(
            cleanRecent
        );


        cleanRecent.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                openSidebar();

                setTimeout(() => {

                    const target =
                        document.querySelector(
                            "#historyPanel, .history-section, .history-list"
                        );

                    if (target) {

                        target.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest"
                        });

                    }

                }, 100);

            },
            true
        );

    }


    /* ========================================================
       SETTINGS
       ======================================================== */

    const settingsButton =
        rail.querySelector(
            "#apRailSettings"
        );


    if (settingsButton) {

        const cleanSettings =
            settingsButton.cloneNode(true);

        settingsButton.replaceWith(
            cleanSettings
        );


        cleanSettings.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                openSidebar();

                setTimeout(() => {

                    const settings =
                        document.querySelector(
                            "#sidebarSettingsBtn"
                        );

                    if (settings) {
                        settings.click();
                    }

                }, 100);

            },
            true
        );

    }


    /* ========================================================
       PROFILE
       ======================================================== */

    const profileButton =
        rail.querySelector(
            "#apRailProfile"
        );


    if (profileButton) {

        const cleanProfile =
            profileButton.cloneNode(true);

        profileButton.replaceWith(
            cleanProfile
        );


        cleanProfile.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                openSidebar();

                setTimeout(() => {

                    const profile =
                        document.querySelector(
                            "#profileSidebarBtn"
                        );

                    if (profile) {
                        profile.click();
                    }

                }, 100);

            },
            true
        );

    }


    /* ========================================================
       INITIAL STATE
       ======================================================== */

    function restoreState() {

        if (!isDesktop()) {

            document.body.classList.remove(
                COLLAPSED_CLASS
            );

            sidebar.classList.remove(
                COLLAPSED_CLASS
            );

            hideRail();

            return;
        }


        /*
         * IMPORTANT:
         * Start OPEN.
         *
         * This prevents the sidebar from disappearing
         * after a hard refresh.
         */

        openSidebar();
    }


    /* ========================================================
       RESIZE
       ======================================================== */

    window.addEventListener(
        "resize",
        () => {

            if (!isDesktop()) {

                document.body.classList.remove(
                    COLLAPSED_CLASS
                );

                sidebar.classList.remove(
                    COLLAPSED_CLASS
                );

                hideRail();

                return;
            }

            /*
             * Do not randomly change state
             * during desktop resize.
             */

            if (
                document.body.classList.contains(
                    COLLAPSED_CLASS
                )
            ) {

                showRail();

            } else {

                openSidebar();

            }

        },
        {
            passive: true
        }
    );


    /* ========================================================
       START
       ======================================================== */

    restoreState();

    console.log(
        "🚀 AP SYNAPSE — STABLE SIDEBAR CONTROLLER READY"
    );

})();

})();

/* ============================================================
   AP SYNAPSE — FINAL SIDEBAR HISTORY GUARD
   Keeps existing sidebar/navigation intact.
   History remains below all navigation controls.
   ============================================================ */

(() => {
    "use strict";

    function protectSidebarHistory() {

        if (window.innerWidth <= 768) return;

        const sidebar =
            document.querySelector(".sidebar");

        const recentGroup =
            document.querySelector(
                ".sidebar .recent-group"
            );

        const historyList =
            document.querySelector(
                ".sidebar .history-list"
            );

        if (!sidebar || !recentGroup || !historyList) {
            return;
        }

        /* Sidebar remains scrollable as one workspace */
        sidebar.style.setProperty(
            "height",
            "100vh",
            "important"
        );

        sidebar.style.setProperty(
            "overflow-y",
            "auto",
            "important"
        );

        sidebar.style.setProperty(
            "overflow-x",
            "hidden",
            "important"
        );

        /* History section gets real space */
        recentGroup.style.setProperty(
            "display",
            "flex",
            "important"
        );

        recentGroup.style.setProperty(
            "flex-direction",
            "column",
            "important"
        );

        recentGroup.style.setProperty(
            "flex",
            "0 0 360px",
            "important"
        );

        recentGroup.style.setProperty(
            "height",
            "360px",
            "important"
        );

        recentGroup.style.setProperty(
            "min-height",
            "360px",
            "important"
        );

        recentGroup.style.setProperty(
            "max-height",
            "360px",
            "important"
        );

        recentGroup.style.setProperty(
            "overflow",
            "hidden",
            "important"
        );

        /* History list scrolls internally */
        historyList.style.setProperty(
            "display",
            "flex",
            "important"
        );

        historyList.style.setProperty(
            "flex-direction",
            "column",
            "important"
        );

        historyList.style.setProperty(
            "flex",
            "1 1 auto",
            "important"
        );

        historyList.style.setProperty(
            "height",
            "auto",
            "important"
        );

        historyList.style.setProperty(
            "min-height",
            "0",
            "important"
        );

        historyList.style.setProperty(
            "max-height",
            "none",
            "important"
        );

        historyList.style.setProperty(
            "overflow-y",
            "auto",
            "important"
        );

        historyList.style.setProperty(
            "overflow-x",
            "hidden",
            "important"
        );
    }


    function startHistoryGuard() {

        protectSidebarHistory();

        /* Re-apply if an existing controller modifies the layout */
        const sidebar =
            document.querySelector(".sidebar");

        const recentGroup =
            document.querySelector(
                ".sidebar .recent-group"
            );

        if (recentGroup) {

            const observer =
                new MutationObserver(() => {

                    if (
                        window.innerWidth > 768 &&
                        recentGroup.getBoundingClientRect().height === 0
                    ) {
                        protectSidebarHistory();
                    }

                });

            observer.observe(
                recentGroup,
                {
                    attributes: true,
                    attributeFilter: ["style"]
                }
            );

            window.addEventListener(
                "resize",
                protectSidebarHistory,
                { passive: true }
            );
        }
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            startHistoryGuard,
            { once: true }
        );

    } else {

        startHistoryGuard();

    }

})();

