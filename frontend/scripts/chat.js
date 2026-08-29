import { getSessionId } from "./session.js";
import {
    saveProject
} from "./projects.js";
import {
    getConversations,
    createConversation,
    addMessage as saveHistoryMessage,
    truncateConversation
} from "./workspace/history.js";

console.log("? chat.js loaded");
console.log("PAGE LOADED:", Date.now());
console.log("STEP 1");
let input = document.getElementById("userInput");
console.log("STEP 2");
let sendBtn = document.getElementById("sendBtn");
console.log("STEP 3");
let voiceBtn = document.getElementById("voiceBtn");
let speakBtn = document.getElementById("speakBtn");
let lastAIResponse = "";

window.currentDocumentImage = "";

let currentConversationId =
    window.currentConversationId || null;
    window.setActiveConversation = function (id) {

    currentConversationId = id;

    window.currentConversationId = id;

    console.log(
        "?? Active conversation:",
        currentConversationId
    );

};
const fileInput = document.getElementById("fileInput");
let attachBtn = document.getElementById("attachBtn");

attachBtn.addEventListener("click", () => {

    fileInput.value = "";

    if (fileInput.showPicker) {
        fileInput.showPicker();
    } else {
        fileInput.click();
    }

});

// ==============================
// AP Synapse Active Conversation
// ==============================

function ensureConversation() {

    if (currentConversationId) {
        return currentConversationId;
    }

    const conversation = createConversation("New Conversation");

    currentConversationId = conversation.id;

    console.log(
        "?? Active conversation:",
        currentConversationId
    );

    return currentConversationId;
}

console.log("File Input:", fileInput);
const imageUpload=document.getElementById("imageUpload");
console.log("Image Upload:", imageUpload);
let stopBtn=document.getElementById("stopBtn");
let controller = null;
const chatWindow = document.getElementById("chatWindow");
chatWindow.style.display = "none";
console.log("STEP 4");
const heroScreen = document.getElementById("heroScreen");
const projectModal = document.getElementById("projectModal");
const createProjectBtn = document.getElementById("createProject");
const cancelProjectBtn = document.getElementById("cancelProject");
const projectCards = document.querySelectorAll(".prompt-chip");
let imageGenBtn =
document.getElementById("imageGenBtn");
let deepThinkBtn =
document.getElementById("deepThinkBtn");

window.deepThinking=false;
let webBtn =
document.getElementById("webBtn");

let webMode=false;

window.webMode = false;
document.querySelectorAll(".prompt-chip").forEach(chip => {

    chip.addEventListener("click", () => {

        input.value = chip.innerText;

        sendMessage();

    });

});

console.log("Input:", input);
console.log("Send Button:", sendBtn);
console.log("Chat Window:", chatWindow);
console.log("Hero Screen:", heroScreen);

console.log("STEP 5");

function scrollChatToBottom(force = false) {

    /*
     * AP SYNAPSE
     * Automatic chat scrolling intentionally disabled.
     *
     * The user controls the conversation position manually.
     */

    return;
}

console.log("STEP 6");

const newChatBtn = document.querySelector(".new-chat-btn");

newChatBtn.addEventListener("click", () => {

    chatWindow.innerHTML = "";

    input.value = "";

    heroScreen.style.display = "flex";

    chatWindow.style.display = "none";

    window.currentDocument = "";
    window.currentDocumentImage = "";

    showToast("New Conversation Started");

});

console.log("STEP 7");

// =====================================
// MESSAGE RENDERER
// =====================================

function addMessage(type, text) {

    const wrapper = document.createElement("div");

    const isUser =
        type === "user-message" ||
        type === "user";

    wrapper.className =
        `message ${isUser ? "user" : "ai"}`;

    wrapper.dataset.messageId =
        `ap-msg-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

    const body =
        document.createElement("div");

    body.className = "message-body";

    body.innerHTML =
        marked.parse(String(text ?? ""));

    wrapper.innerHTML = `
        <div class="avatar">
            ${isUser ? "U" : "AP"}
        </div>
    `;

    wrapper.appendChild(body);

    if (isUser) {
        createUserMessageActions(wrapper, body);
    }

    chatWindow.appendChild(wrapper);

    requestAnimationFrame(() => {
        scrollChatToBottom(true);
        refreshConversationNavigator();
    });

    return wrapper;
}

function getCurrentConversationMessages() {

    if (!currentConversationId) {
        return [];
    }

    const conversations =
        getConversations();

    const conversation =
        conversations.find(
            item =>
                item.id === currentConversationId
        );

    return conversation?.messages || [];

}
// ============================================================
// AP SYNAPSE ï¿½ USER MESSAGE ACTIONS
// ============================================================

function createUserMessageActions(messageElement, body) {

    if (
        messageElement.querySelector(
            ".ap-user-message-actions"
        )
    ) {
        return;
    }

    const actions =
        document.createElement("div");

    actions.className =
        "ap-user-message-actions";

    actions.innerHTML = `
        <button
            type="button"
            class="ap-message-mini-action"
            data-action="copy"
            aria-label="Copy message"
            title="Copy"
        >
            ?
        </button>

        <button
            type="button"
            class="ap-message-mini-action"
            data-action="edit"
            aria-label="Edit message"
            title="Edit"
        >
            ?
        </button>
    `;

    body.after(actions);

    actions
    .querySelector('[data-action="edit"]')
    ?.addEventListener("click", () => {

        const original =
            body.innerText.trim();

        const messages =
            Array.from(
                chatWindow.querySelectorAll(
                    ".message.user, .message.ai"
                )
            );

        const messagePosition =
            messages.indexOf(messageElement);

        if (messagePosition === -1) {

            console.warn(
                "Could not locate edited message."
            );

            return;

        }

        /*
         * Convert visible message position
         * into the corresponding history
         * message index.
         */
        const historyMessages =
            getCurrentConversationMessages();

        const historyIndex =
            historyMessages.findIndex(
                message =>
                    message &&
                    message.role === "user" &&
                    message.content === original
            );

        if (historyIndex === -1) {

            console.warn(
                "Could not locate message in conversation history."
            );

            input.value = original;
            input.focus();

            return;

        }

        /*
         * Store edit state.
         */
        window.apSynapseEditState = {

            conversationId:
                currentConversationId,

            messageIndex:
                historyIndex,

            originalMessage:
                original,

            messageElement

        };

        input.value = original;

        input.focus();

        input.setSelectionRange(
            input.value.length,
            input.value.length
        );

        showToast(
            "Edit message ï¿½ press Enter to regenerate"
        );

    });
}

// =====================================
// SEND MESSAGE
// =====================================


// =========================================================
// AP_VISUAL_FRONTEND_ROUTER_V1
// VIDEO + 3D RESULT RENDERING
// =========================================================

function apSafeVisualUrl(value) {

    try {

        const url =
            new URL(String(value || ""));

        if (
            url.protocol !== "https:" &&
            url.protocol !== "http:"
        ) {
            return "";
        }

        return url.href;

    }
    catch {
        return "";
    }
}


function apRenderVisualError(message) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message ai";

    const avatar =
        document.createElement("div");

    avatar.className =
        "avatar";

    avatar.textContent =
        "AP";

    const body =
        document.createElement("div");

    body.className =
        "message-body";

    body.textContent =
        String(
            message ||
            "Visual generation is currently unavailable."
        );

    wrapper.appendChild(avatar);
    wrapper.appendChild(body);

    chatWindow.appendChild(wrapper);

    scrollChatToBottom();
}


function apRenderVisualResult(
    data,
    type
) {

    const url =
        apSafeVisualUrl(
            data?.url
        );

    if (!url) {

        apRenderVisualError(
            "AP Synapse received an invalid visual result."
        );

        return;
    }


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message ai";


    const avatar =
        document.createElement("div");

    avatar.className =
        "avatar";

    avatar.textContent =
        "AP";


    const body =
        document.createElement("div");

    body.className =
        "message-body";


    const title =
        document.createElement("strong");

    title.textContent =
        type === "video"
            ? "Generated Video"
            : "Generated 3D Model";


    body.appendChild(title);


    const mediaShell =
        document.createElement("div");

    mediaShell.style.marginTop =
        "14px";

    mediaShell.style.borderRadius =
        "16px";

    mediaShell.style.overflow =
        "hidden";

    mediaShell.style.border =
        "1px solid rgba(255,255,255,.10)";

    mediaShell.style.background =
        "rgba(255,255,255,.035)";


    if (type === "video") {

        const video =
            document.createElement("video");

        video.src =
            url;

        video.controls =
            true;

        video.playsInline =
            true;

        video.preload =
            "metadata";

        video.style.display =
            "block";

        video.style.width =
            "100%";

        video.style.maxHeight =
            "620px";

        video.style.background =
            "#000";

        mediaShell.appendChild(
            video
        );

    }
    else {

        const modelCard =
            document.createElement("div");

        modelCard.style.padding =
            "24px";

        modelCard.style.display =
            "flex";

        modelCard.style.flexDirection =
            "column";

        modelCard.style.gap =
            "8px";


        const modelTitle =
            document.createElement("div");

        modelTitle.textContent =
            "AP Synapse 3D Asset";

        modelTitle.style.fontWeight =
            "700";

        modelTitle.style.fontSize =
            "16px";


        const modelMeta =
            document.createElement("div");

        modelMeta.textContent =
            data?.engine
                ? `Engine: ${data.engine}`
                : "3D model ready";

        modelMeta.style.opacity =
            ".68";

        modelMeta.style.fontSize =
            "13px";


        modelCard.appendChild(
            modelTitle
        );

        modelCard.appendChild(
            modelMeta
        );

        mediaShell.appendChild(
            modelCard
        );

    }


    body.appendChild(
        mediaShell
    );


    const actions =
        document.createElement("div");

    actions.style.display =
        "flex";

    actions.style.flexWrap =
        "wrap";

    actions.style.gap =
        "8px";

    actions.style.marginTop =
        "12px";


    const openButton =
        document.createElement("button");

    openButton.type =
        "button";

    openButton.textContent =
        type === "video"
            ? "Open Video"
            : "Open 3D Model";

    openButton.onclick =
        () => {
            window.open(
                url,
                "_blank",
                "noopener,noreferrer"
            );
        };


    const downloadButton =
        document.createElement("button");

    downloadButton.type =
        "button";

    downloadButton.textContent =
        "Download";

    downloadButton.onclick =
        () => {

            const link =
                document.createElement("a");

            link.href =
                url;

            link.target =
                "_blank";

            link.rel =
                "noopener";

            link.download =
                type === "video"
                    ? `AP-Synapse-Video-${Date.now()}.mp4`
                    : `AP-Synapse-3D-${Date.now()}.glb`;

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();
        };


    actions.appendChild(
        openButton
    );

    actions.appendChild(
        downloadButton
    );

    body.appendChild(
        actions
    );


    wrapper.appendChild(
        avatar
    );

    wrapper.appendChild(
        body
    );

    chatWindow.appendChild(
        wrapper
    );


    if (
        currentConversationId &&
        typeof saveHistoryMessage === "function"
    ) {

        saveHistoryMessage(
            currentConversationId,
            "assistant",
            type === "video"
                ? `Generated video: ${url}`
                : `Generated 3D model: ${url}`
        );

    }


    scrollChatToBottom();
}


// ============================================================
// AP_CHAT_RESILIENCE_V1
// Network recovery + retry + offline wait
// ============================================================

const AP_CHAT_RETRYABLE_HTTP =
    new Set([
        408,
        425,
        429,
        502,
        503,
        504,
        520,
        521,
        522,
        523,
        524
    ]);

function apAbortError() {

    return new DOMException(
        "Generation stopped",
        "AbortError"
    );
}

function apRetryDelay(ms, signal) {

    return new Promise(
        (resolve, reject) => {

            if (signal?.aborted) {
                reject(apAbortError());
                return;
            }

            const timer =
                setTimeout(
                    cleanupAndResolve,
                    ms
                );

            function cleanupAndResolve() {

                signal?.removeEventListener(
                    "abort",
                    onAbort
                );

                resolve();
            }

            function onAbort() {

                clearTimeout(timer);

                reject(apAbortError());
            }

            signal?.addEventListener(
                "abort",
                onAbort,
                { once: true }
            );
        }
    );
}

function apWaitForInternet(signal) {

    if (navigator.onLine !== false) {
        return Promise.resolve();
    }

    if (
        typeof showToast === "function"
    ) {
        showToast(
            "Connection paused â€” waiting to reconnect"
        );
    }

    return new Promise(
        (resolve, reject) => {

            function cleanup() {

                window.removeEventListener(
                    "online",
                    onOnline
                );

                signal?.removeEventListener(
                    "abort",
                    onAbort
                );
            }

            function onOnline() {

                cleanup();

                if (
                    typeof showToast ===
                    "function"
                ) {
                    showToast(
                        "Connection restored"
                    );
                }

                resolve();
            }

            function onAbort() {

                cleanup();
                reject(apAbortError());
            }

            window.addEventListener(
                "online",
                onOnline,
                { once: true }
            );

            signal?.addEventListener(
                "abort",
                onAbort,
                { once: true }
            );
        }
    );
}

const AP_PRIMARY_API_BASE =
    "https://api.ap-synapse.com";

const AP_SECONDARY_API_BASE =
    "https://ap-synapse-production.up.railway.app";

async function apResilientFetch(
    url,
    options = {}
) {

    // AP_PRODUCTION_BACKEND_FAILOVER_V4

    const originalURL =
        String(url || "");

    let candidates = [
        originalURL
    ];

    if (
        originalURL.startsWith(
            AP_PRIMARY_API_BASE
        )
    ) {

        candidates = [
            originalURL,
            AP_SECONDARY_API_BASE +
                originalURL.slice(
                    AP_PRIMARY_API_BASE.length
                )
        ];

    }
    else if (
        originalURL.startsWith(
            AP_SECONDARY_API_BASE
        )
    ) {

        candidates = [
            originalURL,
            AP_PRIMARY_API_BASE +
                originalURL.slice(
                    AP_SECONDARY_API_BASE.length
                )
        ];
    }

    let lastError = null;

    const retryableStatuses =
        new Set([
            408,
            425,
            429,
            500,
            502,
            503,
            504
        ]);

    /*
     * Two complete rounds.
     * Each round tries every available backend.
     */
    for (
        let round = 0;
        round < 2;
        round++
    ) {

        for (
            const candidateURL
            of candidates
        ) {

            try {

                console.log(
                    "AP BACKEND TRY â†’",
                    candidateURL
                );

                const response =
                    await fetch(
                        candidateURL,
                        options
                    );

                /*
                 * Success or permanent client error:
                 * return it to normal chat handling.
                 */
                if (
                    response.ok ||
                    !retryableStatuses.has(
                        response.status
                    )
                ) {

                    console.log(
                        "AP BACKEND ACTIVE â†’",
                        candidateURL,
                        response.status
                    );

                    return response;
                }

                const error =
                    new Error(
                        "Backend returned HTTP " +
                        response.status
                    );

                error.status =
                    response.status;

                lastError =
                    error;

                console.warn(
                    "AP BACKEND RETRYABLE â†’",
                    candidateURL,
                    response.status
                );

            }
            catch (error) {

                if (
                    error?.name ===
                    "AbortError"
                ) {
                    throw error;
                }

                lastError =
                    error;

                console.warn(
                    "AP BACKEND UNAVAILABLE â†’",
                    candidateURL,
                    error?.message ||
                        error
                );
            }
        }

        if (round === 0) {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        350
                    )
            );
        }
    }

    throw (
        lastError ||
        new TypeError(
            "AP Synapse backends unavailable."
        )
    );
}
// ============================================================
// AP_HOST_STREAM_RECOVERY_V2
// Render <-> Railway host-level stream continuity.
// ============================================================

function apBuildHostURL(
    base,
    path = "/chat"
) {

    return (
        String(base || "")
            .replace(/\/+$/, "") +
        path
    );
}


function apAlternateHostChatURL(
    activeURL
) {

    const active =
        String(activeURL || "");


    if (
        active.startsWith(
            AP_SECONDARY_API_BASE
        )
    ) {

        return apBuildHostURL(
            AP_PRIMARY_API_BASE,
            "/chat"
        );

    }


    return apBuildHostURL(
        AP_SECONDARY_API_BASE,
        "/chat"
    );
}


function apRemoveHostResumeOverlap(
    existingText,
    incomingText
) {

    const existing =
        String(existingText || "");

    const incoming =
        String(incomingText || "");


    if (
        !existing ||
        !incoming
    ) {
        return incoming;
    }


    const maximum =
        Math.min(
            4000,
            existing.length,
            incoming.length
        );


    for (
        let size = maximum;
        size >= 8;
        size--
    ) {

        if (
            existing.slice(-size) ===
            incoming.slice(0, size)
        ) {

            return incoming.slice(
                size
            );

        }

    }


    return incoming;
}


function apBuildHostRecoveryMessage(
    originalMessage,
    partialAnswer
) {

    const partial =
        String(
            partialAnswer || ""
        ).slice(-12000);


    return (
        String(originalMessage || "") +
        "\n\n" +
        "AP Synapse continuity recovery instruction:\n" +
        "A previous AP Synapse server already started answering this exact request, " +
        "but its connection was interrupted. Continue naturally from exactly where " +
        "the partial answer below stopped. Do not restart the answer. Do not repeat " +
        "already-written text. Do not mention the interruption, recovery process, " +
        "hosting provider, or this instruction. Return only the natural continuation.\n\n" +
        "PARTIAL ANSWER ALREADY SHOWN:\n" +
        partial
    );
}

async function sendMessage() {

    const message =
        input.value.trim();

    if (!message) return;


    // ============================================================
// AP SYNAPSE ï¿½ CLOSE MOBILE KEYBOARD AFTER SEND
// ============================================================

if (
    window.innerWidth <= 768 &&
    input
) {
    input.blur();

    setTimeout(() => {
        document.activeElement?.blur();
    }, 50);
}

    // =====================================
    // EDITED MESSAGE MODE
    // =====================================

    const editState =
        window.apSynapseEditState;

    if (
        editState &&
        editState.conversationId ===
            currentConversationId
    ) {

        console.log(
            "?? Regenerating from edited message:",
            editState
        );

        /*
         * Remove the old user message and
         * everything after it from history.
         */
        truncateConversation(
            currentConversationId,
            editState.messageIndex
        );

        /*
         * Remove the old visible message
         * and every response after it.
         */
        const visibleMessages =
            Array.from(
                chatWindow.querySelectorAll(
                    ".message.user, .message.ai"
                )
            );

        const editedElement =
            editState.messageElement;

        const editedPosition =
            visibleMessages.indexOf(
                editedElement
            );

        if (editedPosition !== -1) {

            visibleMessages
                .slice(editedPosition)
                .forEach(element => {
                    element.remove();
                });

        }

        /*
         * Clear edit mode BEFORE continuing.
         */
        window.apSynapseEditState = null;

        /*
         * The code below will now save the
         * edited message as the new message
         * and generate a fresh AI response.
         */

    }

    // Switch from home screen to conversation mode
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


    // =====================================
    // ENSURE ACTIVE CONVERSATION
    // =====================================

    if (!currentConversationId) {

        const conversation = createConversation(
            message.length > 40
                ? message.substring(0, 40) + "..."
                : message
        );

        currentConversationId = conversation.id;

        window.currentConversationId =
            currentConversationId;

    }


    // =====================================
    // SAVE USER MESSAGE ï¿½ EXACTLY ONCE
    // =====================================

    saveHistoryMessage(
        currentConversationId,
        "user",
        message
    );


    // =====================================
    // SHOW USER MESSAGE ï¿½ EXACTLY ONCE
    // =====================================

    addMessage(
        "user-message",
        message
    );


    if (window.renderHistory) {
        window.renderHistory();
    }


    // =====================================
    // UI
    // =====================================

    const isImageRequest =
        /\b(create|generate|make|draw|design|render|produce|paint|illustrate|visualize|depict|show|imagine)\b[\s\S]{0,500}\b(image|picture|photo|artwork|illustration|portrait|wallpaper|logo|poster|scene|character|landscape|concept.?art)\b/i.test(
            message
        );


    // AP_VISUAL_INTENT_DETECTION_V1

    const isVideoRequest =
        /\b(create|generate|make|render|produce|animate|design)\b[\s\S]{0,500}\b(video|animation|animated clip|movie clip|cinematic clip)\b/i.test(
            message
        );

    const is3DRequest =
        /\b(create|generate|make|build|design|render|produce|convert|turn)\b[\s\S]{0,500}\b(3d|3-d|three dimensional|three-dimensional|3d model|3-d model|mesh)\b/i.test(
            message
        );
    console.log(
        "??? Frontend image request detected:",
        isImageRequest,
        "|",
        message
    );

    // =====================================
// ENTER CHAT MODE
// =====================================

document.body.classList.add("chat-active");

if (heroScreen) {

    heroScreen.style.setProperty(
        "display",
        "none",
        "important"
    );

    heroScreen.style.visibility = "hidden";
    heroScreen.style.pointerEvents = "none";

}

if (chatWindow) {

    chatWindow.style.setProperty(
        "display",
        "flex",
        "important"
    );

    chatWindow.style.visibility = "visible";
    chatWindow.style.pointerEvents = "auto";

}


    input.value = "";


    const thinking =
        document.createElement("div");

    thinking.id = "thinking";
    thinking.className = "thinking";

    thinking.innerHTML = `
    <div class="ap-synapse-thinking">
        <div class="ap-thinking-mark"></div>

        <div class="ap-thinking-text">
            <span class="ap-thinking-label">AP Synapse</span>
            <span class="ap-thinking-stage">Analyzing</span>

            <span class="ap-thinking-dots">
                <span></span>
                <span></span>
                <span></span>
            </span>
        </div>
    </div>
`;

const thinkingStages = [
    "Analyzing",
    "Understanding",
    "Searching",
    "Verifying",
    "Synthesizing",
    "Preparing"
];

let thinkingStageIndex = 0;

const thinkingStage =
    thinking.querySelector(".ap-thinking-stage");

const thinkingInterval =
    setInterval(() => {

        if (!thinkingStage) return;

        thinkingStageIndex =
            (thinkingStageIndex + 1) %
            thinkingStages.length;

        thinkingStage.textContent =
            thinkingStages[thinkingStageIndex];

    }, 900);

    chatWindow.appendChild(thinking);

    scrollChatToBottom();


    // =====================================
    // REQUEST
    // =====================================

    try {

        controller =
            new AbortController();



        // =================================================
        // AP_VISUAL_REQUEST_ROUTER_V1
        // VIDEO + 3D
        // Existing image/chat pipeline remains untouched.
        // =================================================

        if (
            isVideoRequest ||
            is3DRequest
        ) {

            const visualType =
                is3DRequest
                    ? "3d"
                    : "video";

            const endpoint =
                visualType === "3d"
                    ? "https://api.ap-synapse.com/3d"
                    : "https://api.ap-synapse.com/video";


            const payload =
                visualType === "video"
                    ? {
                        prompt: message,
                        duration: 5,
                        resolution: "1080p",
                        aspectRatio: "16:9"
                    }
                    : {
                        prompt: message
                    };


            // AP_VISUAL_WAIT_STATUS_V1
            clearInterval(thinkingInterval);

            if (thinkingStage) {

                thinkingStage.textContent =
                    visualType === "3d"
                        ? "Waiting for free 3D GPU"
                        : "Generating video";
            }

            const visualResponse =
                await fetch(
                    endpoint,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "x-session-id":
                                (
                                    window.apLiveRoomId
                                        ? `live:${window.apLiveRoomId}`
                                        : getSessionId()
                                )
                        },

                        body:
                            JSON.stringify(
                                payload
                            ),

                        signal:
                            controller.signal
                    }
                );


            clearInterval(
                thinkingInterval
            );

            document
                .getElementById(
                    "thinking"
                )
                ?.remove();


            let visualData = {};

            try {

                visualData =
                    await visualResponse.json();

            }
            catch {}


            if (
                !visualResponse.ok ||
                visualData?.success === false
            ) {

                apRenderVisualError(
                    visualData?.error ||
                    (
                        visualType === "video"
                            ? "Video generation is currently unavailable."
                            : "3D generation is currently unavailable."
                    )
                );

                return;
            }


            apRenderVisualResult(
                visualData,
                visualType
            );

            return;
        }

        const response = await apResilientFetch(
            "https://api.ap-synapse.com/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",

                    // AP_PERSONALIZATION_CHAT_HEADERS_FINAL
                    "x-personalization-id":
                        window.AP_PERSONALIZATION
                            ?.getGuestId?.() ||
                        localStorage.getItem(
                            "apSynapsePersonalizationGuestId"
                        ) ||
                        "",

                    ...(window.AP_PERSONALIZATION
                        ?.getToken?.()

                        ? {
                            "Authorization":
                                `Bearer ${window.AP_PERSONALIZATION.getToken()}`
                        }

                        : {}),

                    "x-session-id": (window.apLiveRoomId ? `live:${window.apLiveRoomId}` : getSessionId())
                },

                body: JSON.stringify({
                    message,

                    document: window.currentDocument ?? "",

                    web: window.webMode,
                    deep: window.deepThinking
                }),

                signal: controller.signal
            }
        );


        if (!response.ok) {
            throw new Error("Server Error");
        }


        clearInterval(thinkingInterval);

        document
           .getElementById("thinking")
           ?.remove();


        // =====================================
// AP SYNAPSE IMAGE RESPONSE
// =====================================

const contentType =
    response.headers.get("content-type") || "";

if (contentType.includes("application/json")) {

    const data =
        await response.json();

    // =====================================
    // GEMINI IMAGE RESPONSE
    // =====================================

    if (data?.type === "image" && data?.url) {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "message ai";

        wrapper.innerHTML = `

            <div class="avatar">
                AP
            </div>

            <div class="message-body">

                <strong>Generated Image</strong>

                <br><br>

                <div class="image-container">

                    <img
                        src="${data.url}"
                        class="generated-image"
                        alt="Generated by AP Synapse"
                    >

                    <div class="image-actions">

                        <button class="openImage">
                            ?? View Full
                        </button>

                        <button class="downloadImage">
                            ? Download
                        </button>

                    </div>

                </div>

            </div>
        `;

        chatWindow.appendChild(wrapper);

        const image =
            wrapper.querySelector(".generated-image");

        wrapper
            .querySelector(".openImage")
            .onclick = () => {

                window.open(
                    image.src,
                    "_blank"
                );

            };

        wrapper
            .querySelector(".downloadImage")
            .onclick = () => {

                const link =
                    document.createElement("a");

                link.href = image.src;

                link.download =
                    `AP-Synapse-${Date.now()}.png`;

                document.body.appendChild(link);

                link.click();

                document.body.removeChild(link);

            };

        scrollChatToBottom();

        return;
    }

    // =====================================
    // SERVER ERROR
    // =====================================

    if (data?.type === "error") {

        addMessage(
            "ai-message",
            `?? **Image generation failed**\n\n${data.error}`
        );

        return;

    }

}

        // =====================================
        // NORMAL AI STREAM
        // =====================================

        let reader =
            response.body.getReader();

        let decoder =
            new TextDecoder();

        let apActiveHostURL =
            response.url || "";

        let apHostRecoveryCount =
            0;

        let apHostResumePending =
            false;

        let apHostResumeBuffer =
            "";


        const wrapper =
            document.createElement("div");

        wrapper.className =
            "message ai";

        wrapper.innerHTML = `

            <div class="avatar">
                AP
            </div>

            <div class="message-body"></div>

        `;

        chatWindow.appendChild(wrapper);


        const aiMessage =
            wrapper.querySelector(".message-body");

        aiMessage.dataset.raw = "";


        // =====================================
// READ STREAM ï¿½ OPTIMIZED
// =====================================

let rawText = "";
let renderScheduled = false;
let streamFinished = false;

// ============================================================
// AP SYNAPSE ï¿½ STRUCTURED WEB SOURCES
// ============================================================

let apSynapseSources = [];

const SOURCE_START =
    "__AP_SYNapse_SOURCES__";

const SOURCE_END =
    "__AP_SYNapse_SOURCES_END__";

const renderAIMessage = () => {

    renderScheduled = false;

    const rendered =
        renderLinks(rawText);

    aiMessage.innerHTML =
        marked.parse(rendered) +
        '<span class="typingCursor">?</span>';

    // Make every rendered source URL visibly clickable.
    aiMessage
        .querySelectorAll("a[href]")
        .forEach(link => {

            link.classList.add("ap-source-link");

            link.target = "_blank";
            link.rel = "noopener noreferrer";

        });

    scrollChatToBottom();

};

const scheduleRender = () => {

    if (renderScheduled) return;

    renderScheduled = true;

    requestAnimationFrame(renderAIMessage);

};

while (true) {

    let apReadResult;

    try {

        apReadResult =
            await reader.read();

    }
    catch (streamError) {

        if (
            streamError?.name ===
            "AbortError"
        ) {
            throw streamError;
        }


        if (
            apHostRecoveryCount >= 2
        ) {
            throw streamError;
        }


        apHostRecoveryCount++;


        console.warn(
            "AP HOST STREAM INTERRUPTED:",
            apActiveHostURL,
            streamError?.message ||
                streamError
        );


        if (
            typeof showToast ===
            "function"
        ) {

            showToast(
                "Continuing through backup server..."
            );

        }


        const recoveryURL =
            apAlternateHostChatURL(
                apActiveHostURL
            );


        const originalSessionId =
            (
                window.apLiveRoomId
                    ? `live:${window.apLiveRoomId}`
                    : getSessionId()
            );


        const recoverySessionId =
            originalSessionId +
            ":host-recovery:" +
            Date.now();


        const personalizationToken =
            window.AP_PERSONALIZATION
                ?.getToken?.();


        const recoveryResponse =
            await fetch(
                recoveryURL,
                {
                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "x-personalization-id":
                            window.AP_PERSONALIZATION
                                ?.getGuestId?.() ||
                            localStorage.getItem(
                                "apSynapsePersonalizationGuestId"
                            ) ||
                            "",

                        ...(personalizationToken
                            ? {
                                "Authorization":
                                    `Bearer ${personalizationToken}`
                            }
                            : {}),

                        "x-session-id":
                            recoverySessionId
                    },

                    body:
                        JSON.stringify({

                            message:
                                apBuildHostRecoveryMessage(
                                    message,
                                    rawText
                                ),

                            document: window.currentDocument ?? "",

                            web:
                                window.webMode,

                            deep:
                                window.deepThinking
                        }),

                    signal:
                        controller.signal
                }
            );


        if (
            !recoveryResponse.ok ||
            !recoveryResponse.body
        ) {

            const recoveryError =
                new Error(
                    "Backup backend continuation failed."
                );

            recoveryError.status =
                recoveryResponse.status;

            throw recoveryError;
        }


        console.log(
            "AP HOST CONTINUATION ACTIVE:",
            recoveryResponse.url ||
                recoveryURL
        );


        apActiveHostURL =
            recoveryResponse.url ||
            recoveryURL;


        reader =
            recoveryResponse.body.getReader();


        decoder =
            new TextDecoder();


        apHostResumePending =
            true;

        apHostResumeBuffer =
            "";


        continue;
    }


    const {
        done,
        value
    } = apReadResult;

    if (done) {

        if (
            apHostResumePending &&
            apHostResumeBuffer
        ) {

            const finalRecoveryText =
                apRemoveHostResumeOverlap(
                    rawText,
                    apHostResumeBuffer
                );


            if (finalRecoveryText) {

                rawText +=
                    finalRecoveryText;

                aiMessage.dataset.raw =
                    rawText;

                lastAIResponse =
                    rawText;

                scheduleRender();

            }


            apHostResumeBuffer =
                "";

            apHostResumePending =
                false;

        }

        streamFinished = true;
        break;
    }

    let chunk =
        decoder.decode(
            value,
            { stream: true }
        );

    if (!chunk) continue;

    // ========================================================
    // AP_HOST_STREAM_RECOVERY_V2 — RESUME ALIGNMENT
    // ========================================================

    if (apHostResumePending) {

        apHostResumeBuffer +=
            chunk;


        /*
         * Brief buffer gives overlap removal enough context
         * without visibly delaying a resumed answer.
         */
        if (
            apHostResumeBuffer.length <
                160 &&
            !apHostResumeBuffer.includes(
                "\n"
            )
        ) {
            continue;
        }


        chunk =
            apRemoveHostResumeOverlap(
                rawText,
                apHostResumeBuffer
            );


        apHostResumeBuffer =
            "";

        apHostResumePending =
            false;


        if (!chunk) {
            continue;
        }

    }


    rawText += chunk;

// ============================================================
// EXTRACT STRUCTURED AP SYNAPSE SOURCES
// ============================================================

const sourceStart =
    rawText.indexOf(SOURCE_START);

const sourceEnd =
    rawText.indexOf(
        SOURCE_END,
        sourceStart + SOURCE_START.length
    );

if (
    sourceStart !== -1 &&
    sourceEnd !== -1
) {

    try {

        const sourceJSON =
            rawText.slice(
                sourceStart + SOURCE_START.length,
                sourceEnd
            );

        const parsedSources =
            JSON.parse(sourceJSON);

        if (Array.isArray(parsedSources)) {

            apSynapseSources =
                parsedSources
                    .filter(
                        source =>
                            source &&
                            typeof source.url === "string" &&
                            source.url.trim()
                    )
                    .slice(0, 5);

            console.log(
                "?? AP SYNAPSE SOURCES RECEIVED:",
                apSynapseSources.length
            );

        }

    } catch (sourceError) {

        console.warn(
            "?? Source payload parsing failed:",
            sourceError
        );

    }

    // Remove internal payload from visible AI response.
    rawText =
        rawText.slice(0, sourceStart) +
        rawText.slice(
            sourceEnd + SOURCE_END.length
        );

}

aiMessage.dataset.raw = rawText;

lastAIResponse = rawText;

scheduleRender();
}

// Flush any decoder remainder.
const finalChunk =
    decoder.decode();

if (finalChunk) {

    rawText += finalChunk;

    aiMessage.dataset.raw =
        rawText;

    lastAIResponse =
        rawText;
}

// =====================================
// AP SYNAPSE ï¿½ FINAL RESPONSE RENDER
// =====================================

function renderLinks(text) {

    return String(text || "").replace(
        /https?:\/\/[^\s<>"')]+/g,
        (url) => {

            const cleanUrl =
                url.replace(/[.,;!?]+$/, "");

            return `
                <a
                    href="${cleanUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ap-source-link"
                >
                    <span class="ap-source-link-icon">?</span>
                    <span class="ap-source-link-text">
                        ${cleanUrl}
                    </span>
                </a>
            `;
        }
    );
}

// ============================================================
// AP SYNAPSE ï¿½ PREMIUM WEB SOURCE CARDS
// ============================================================

function renderAPSynapseSources(sources) {

    if (
        !Array.isArray(sources) ||
        sources.length === 0
    ) {
        return "";
    }

    const cards =
        sources
            .slice(0, 5)
            .map((source, index) => {

                const title =
                    escapeHTML(
                        source.title ||
                        "Web source"
                    );

                const url =
                    String(
                        source.url || ""
                    ).trim();

                const domain =
                    escapeHTML(
                        source.domain ||
                        getSourceDomain(url)
                    );

                const snippet =
                    escapeHTML(
                        source.snippet || ""
                    );

                if (!url) return "";

                return `
                    <a
                        class="ap-premium-source"
                        href="${escapeAttribute(url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >

                        <span class="ap-source-number">
                            ${index + 1}
                        </span>

                        <span class="ap-source-content">

                            <span class="ap-source-title">
                                ${title}
                            </span>

                            <span class="ap-source-domain">
                                ${domain}
                                <span class="ap-source-arrow">
                                    ?
                                </span>
                            </span>

                            ${
                                snippet
                                    ? `
                                    <span class="ap-source-snippet">
                                        ${snippet}
                                    </span>
                                    `
                                    : ""
                            }

                        </span>

                    </a>
                `;

            })
            .join("");

    if (!cards.trim()) {
        return "";
    }

    return `
        <section class="ap-sources-panel">

            <div class="ap-sources-heading">
                <span class="ap-sources-heading-mark">
                    ?
                </span>

                <span>
                    Sources & Further Reading
                </span>
            </div>

            <div class="ap-sources-list">
                ${cards}
            </div>

        </section>
    `;
}

function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function getSourceDomain(url) {

    try {

        return new URL(url)
            .hostname
            .replace(/^www\./, "");

    } catch {

        return "";

    }

}

const renderedResponse =
    renderLinks(rawText);

aiMessage.innerHTML =
    marked.parse(renderedResponse) +
    renderAPSynapseSources(
        apSynapseSources
    );

// Style every actual hyperlink.
aiMessage
    .querySelectorAll("a[href]")
    .forEach(link => {

        link.classList.add("ap-source-link");

        link.target = "_blank";
        link.rel = "noopener noreferrer";

    });

// Highlight code ONLY ONCE.
if (window.hljs) {

    aiMessage
        .querySelectorAll("pre code")
        .forEach(block => {

            hljs.highlightElement(block);

        });

}

scrollChatToBottom(true);


        // =====================================
        // SAVE COMPLETE AI RESPONSE ï¿½ ONCE
        // =====================================

        const completeAIResponse =
            aiMessage.dataset.raw.trim();


        if (completeAIResponse) {

            saveHistoryMessage(
                currentConversationId,
                "assistant",
                completeAIResponse
            );


            lastAIResponse =
                completeAIResponse;


            if (window.renderHistory) {

                window.renderHistory();

            }

        }

    }


    // =====================================
    // ERROR
    // =====================================

    catch (error) {

        // AP_USER_ABORT_RECOVERY_V1
        if (
            error?.name === "AbortError"
        ) {

            clearInterval(
                thinkingInterval
            );

            document
                .getElementById(
                    "thinking"
                )
                ?.remove();

            return;
        }

        console.error("?? FULL AP SYNAPSE ERROR:", error);
        console.error("?? ERROR NAME:", error?.name);
        console.error("?? ERROR MESSAGE:", error?.message);
        console.error("?? ERROR STACK:", error?.stack);

        console.error(
            "AP SYNAPSE ERROR:",
            error
        );


        clearInterval(thinkingInterval);

        document
           .getElementById("thinking")
           ?.remove();

        console.log("?? CHAT ERROR RESPONSE:", error?.status || "unknown");

        addMessage(
            "ai-message",
            "AP Synapse is restoring the connection. Your request remains preserved in this conversation."
        );

    }

}

console.log("STEP 8");
// AP_STABLE_SEND_DELEGATION_V1
document.addEventListener(
    "click",
    event => {
        const button =
            event.target instanceof Element
                ? event.target.closest("#sendBtn")
                : null;

        if (!button || button.disabled) {
            return;
        }

        sendMessage();
    },
    false
);

stopBtn.addEventListener("click", () => {

    if (controller) {

        controller.abort();

        showToast("Generation Stopped");

    }

});

input.addEventListener("keydown", (event) => {

    if(event.key==="Enter"){

        console.log("ENTER PRESSED");

        sendMessage();

    }

});

projectCards.forEach(card => {

    if(card.textContent.trim() === "Create Project"){

        card.addEventListener("click", () => {

            projectModal.style.display = "flex";

        });

    }

});

cancelProjectBtn.addEventListener("click", () => {

    projectModal.style.display = "none";

});

createProjectBtn.addEventListener("click", () => {

    const name =
        document.getElementById("projectName").value.trim();

        saveProject({

             id: Date.now(),

             name,

             created: new Date().toISOString()

});

    if(!name){

        alert("Please enter a project name.");

        return;

    }

    projectModal.style.display = "none";

    heroScreen.style.display = "none";

    chatWindow.style.display = "flex";

    addMessage(

        "ai-message",

        `# ${name}

Project created successfully.

What would you like to do first?

ï¿½ Plan the project
ï¿½ Research
ï¿½ Write code
ï¿½ Create documentation
ï¿½ Build a roadmap`

    );

});

// ===============================
// Voice Input
// ===============================

// ===============================
// Voice Assistant
// ===============================

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

if (SpeechRecognition && voiceBtn) {

    const recognition = new SpeechRecognition();

    recognition.lang="en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceBtn.addEventListener("click", () => {

        voiceBtn.innerHTML = "???";

        recognition.start();

        showToast("Listening...");

    });

    recognition.onresult = (event) => {

        input.value = event.results[0][0].transcript;

    };

    recognition.onend = () => {

        voiceBtn.innerHTML = "??";

        if (input.value.trim()) {

            sendMessage();

        }

    };

    recognition.onerror = () => {

        voiceBtn.innerHTML = "??";

        showToast("Voice recognition failed.");

    };

} else {

    console.log("Speech Recognition not supported.");

}

if (imageUpload) {

    imageUpload.addEventListener("change", (e) => {

        const file = e.target.files[0];

        if (!file) return;

        const url = URL.createObjectURL(file);

addMessage(
"user-message",
`?? **${file.name}**

<img src="${url}" style="max-width:250px;border-radius:12px;margin-top:10px;">`
);

    });

}

function showToast(text){

const toast=document.createElement("div");

toast.className="toast";

toast.innerText=text;

document.body.appendChild(toast);

setTimeout(()=>{

toast.remove();

},2000);

}

imageGenBtn.addEventListener("click",()=>{

    document.querySelectorAll(".code-toolbar button").forEach(btn=>{

btn.addEventListener("click",()=>{

showToast(btn.innerText+" feature coming in AP Synapse v1.1");

});

});

addMessage(

"ai-message",

`?? Image generation is ready.

Type something like:

ï¿½ Create a futuristic city

ï¿½ Draw a solar system

ï¿½ Generate a medical diagram

ï¿½ Create an AI logo`

);

});

deepThinkBtn.addEventListener("click",()=>{

window.deepThinking=!window.deepThinking;

deepThinkBtn.classList.toggle("active");

showToast(

window.deepThinking

?

"Deep Think Enabled"

:

"Deep Think Disabled"

);

});

webBtn.addEventListener("click", () => {

    window.webMode = !window.webMode;

    webBtn.classList.toggle("active");

    showToast(
        window.webMode
            ? "?? Web Search Enabled"
            : "?? Web Search Disabled"
    );

});

// ===============================
// Download Generated Image
// ===============================

function downloadImage(url){

    const link = document.createElement("a");

    link.href = url;

    link.download = "AP-Synapse-Image.png";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

}

// ============================================================
// AP SYNAPSE ï¿½ PREMIUM UPLOADED FILE MESSAGE
// ============================================================

function getUploadType(file) {

    const type = file?.type || "";
    const name = file?.name || "";

    if (type.startsWith("image/")) {
        return "image";
    }

    if (
        type === "application/pdf" ||
        /\.pdf$/i.test(name)
    ) {
        return "PDF";
    }

    return "document";
}


function createUploadedFileMessage(file) {

    const type = getUploadType(file);

    const wrapper = document.createElement("div");

    wrapper.className =
        "message user ap-upload-message";

    wrapper.dataset.messageId =
        `ap-upload-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

    const avatar =
        document.createElement("div");

    avatar.className = "avatar";
    avatar.textContent = "U";


    const body =
        document.createElement("div");

    body.className =
        "message-body ap-upload-body";


    // ========================================================
    // IMAGE
    // ========================================================

    if (type === "image") {

        const objectUrl =
            URL.createObjectURL(file);

        body.innerHTML = `

            <div class="ap-upload-card ap-upload-image-card">

                <div class="ap-upload-header">

                    <div class="ap-upload-icon">
                        ?
                    </div>

                    <div class="ap-upload-title-group">

                        <div class="ap-upload-title">
                            Image
                        </div>

                        <div class="ap-upload-status">
                            Uploaded successfully
                        </div>

                    </div>

                </div>

                <div class="ap-upload-preview">

                    <img
                        src="${objectUrl}"
                        alt="Uploaded image"
                        class="ap-upload-image"
                    >

                </div>

                <div class="ap-upload-footer">

                    <span>
                        Ready for analysis
                    </span>

                    <span class="ap-upload-check">
                        ?
                    </span>

                </div>

            </div>

        `;

        // Keep object URL alive while the message exists.
        body
            .querySelector(".ap-upload-image")
            ?.addEventListener("load", () => {
                // Intentionally retained for chat preview.
            });

    }

    // ========================================================
    // PDF
    // ========================================================

    else if (type === "PDF") {

        body.innerHTML = `

            <div class="ap-upload-card ap-upload-document-card">

                <div class="ap-upload-document-icon">
                    PDF
                </div>

                <div class="ap-upload-document-content">

                    <div class="ap-upload-title">
                        PDF
                    </div>

                    <div class="ap-upload-status">
                        Uploaded successfully
                    </div>

                    <div class="ap-upload-ready">
                        Ready for analysis
                    </div>

                </div>

                <div class="ap-upload-check">
                    ?
                </div>

            </div>

        `;

    }

    // ========================================================
    // DOCUMENT
    // ========================================================

    else {

        body.innerHTML = `

            <div class="ap-upload-card ap-upload-document-card">

                <div class="ap-upload-document-icon">
                    DOC
                </div>

                <div class="ap-upload-document-content">

                    <div class="ap-upload-title">
                        Document
                    </div>

                    <div class="ap-upload-status">
                        Uploaded successfully
                    </div>

                    <div class="ap-upload-ready">
                        Ready for analysis
                    </div>

                </div>

                <div class="ap-upload-check">
                    ?
                </div>

            </div>

        `;

    }


    wrapper.appendChild(avatar);
    wrapper.appendChild(body);

    chatWindow.appendChild(wrapper);

    requestAnimationFrame(() => {

        scrollChatToBottom(true);
        refreshConversationNavigator();

    });

    return wrapper;
}

// ============================================================
// AP SYNAPSE ï¿½ PREMIUM FILE UPLOAD
// ============================================================

console.log("ABOUT TO REGISTER FILE EVENT");

fileInput.addEventListener("change", async (event) => {

    console.log("? FILE SELECTED");

    const file =
        event.target.files[0];

    console.log(
        "Selected File:",
        file
    );

    if (!file) return;

    // AP_DIRECT_ATTACHMENT_RESET_V4
    // The newly selected file immediately replaces old attachment context.
    window.currentDocument = "";
    window.currentDocumentImage = "";


    const uploadType =
        getUploadType(file);


    try {

        // ====================================================
        // ENTER CHAT MODE
        // ====================================================

        document.body.classList.add(
            "chat-active"
        );


        if (heroScreen) {

            heroScreen.style.setProperty(
                "display",
                "none",
                "important"
            );

            heroScreen.style.visibility =
                "hidden";

            heroScreen.style.pointerEvents =
                "none";

        }


        if (chatWindow) {

            chatWindow.style.setProperty(
                "display",
                "flex",
                "important"
            );

            chatWindow.style.visibility =
                "visible";

            chatWindow.style.pointerEvents =
                "auto";

        }


        // ====================================================
        // SHOW PREMIUM ATTACHMENT
        // ====================================================

        createUploadedFileMessage(file);


        // ====================================================
        // UPLOAD TO BACKEND
        // ====================================================

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );


        const response =
            await fetch(
                "https://api.ap-synapse.com/upload",
                {
                    method: "POST",

                    headers: {
                        "x-session-id": (window.apLiveRoomId ? `live:${window.apLiveRoomId}` : getSessionId())
                    },

                    body: formData
                }
            );


        if (!response.ok) {

            throw new Error(
                "Upload failed"
            );

        }


        const data =
            await response.json();


        console.log(
            "?? UPLOAD RESPONSE:",
            data
        );


        // ====================================================
        // STORE DOCUMENT CONTENT
        // ====================================================

        window.currentDocument =
            data.content || "";


        window.currentDocumentImage =
            "";


        // ====================================================
        // STORE OPTIMIZED IMAGE
        // ====================================================

        if (

            data.content &&

            typeof data.content ===
                "object" &&

            data.content.type ===
                "image" &&

            data.content.dataUrl

        ) {

            window.currentDocumentImage =
                data.content.dataUrl;


            console.log(
                "??? Optimized image data stored."
            );

        }


        console.log(
            "?? Document stored."
        );


        // ====================================================
        // CLEAN PREMIUM CONFIRMATION
        // ====================================================

        let confirmation =
            "Document uploaded successfully.";


        if (uploadType === "image") {

            confirmation =
                "Image uploaded successfully.";

        }

        else if (uploadType === "PDF") {

            confirmation =
                "PDF uploaded successfully.";

        }


        addMessage(
            "ai-message",
            `? **${confirmation}**

You can ask me anything about it.`
        );


        // ====================================================
        // INPUT STATE
        // ====================================================

        if (input) {

            input.placeholder =
                uploadType === "image"
                    ? "Ask anything about this image..."
                    : uploadType === "PDF"
                        ? "Ask anything about this PDF..."
                        : "Ask anything about this document...";


            input.focus();

        }


        // ====================================================
        // RESET FILE INPUT
        // ====================================================

        fileInput.value = "";


    }

    catch (err) {

        console.error(
            "?? UPLOAD ERROR:",
            err
        );


        addMessage(
            "ai-message",
            `? **Upload failed.**

${err.message || "Unable to upload the file."}`
        );


        fileInput.value = "";

    }

});

// ===============================
// AP SYNAPSE â€” READ / PAUSE
// ===============================

if (speakBtn) {

    speakBtn.addEventListener("click", () => {

        const synth =
            window.speechSynthesis;


        /*
         * SECOND TAP WHILE READING:
         * PAUSE. Do not cancel. Do not restart.
         */

        if (
            synth.speaking &&
            !synth.paused
        ) {

            synth.pause();

            speakBtn.classList.add(
                "active"
            );

            speakBtn.setAttribute(
                "title",
                "Reading paused"
            );

            speakBtn.setAttribute(
                "aria-label",
                "Reading paused"
            );

            console.log(
                "â¸ AP SYNAPSE â€” READING PAUSED"
            );

            return;
        }


        /*
         * If an older paused utterance exists and the user
         * deliberately taps again later, clear it before
         * beginning a fresh read.
         */

        if (synth.paused) {

            synth.cancel();
        }


        if (!lastAIResponse) {

            alert(
                "No AP Synapse response available."
            );

            return;
        }


        const text =
            window.APcleanSpeech
                ?
                window.APcleanSpeech(
                    lastAIResponse
                )
                :
                lastAIResponse;


        if (
            !text ||
            !String(text).trim()
        ) {

            return;
        }


        const utterance =
            new SpeechSynthesisUtterance(
                text
            );


        utterance.lang =
            "en-US";

        utterance.rate =
            1;

        utterance.pitch =
            1;

        utterance.volume =
            1;


        utterance.onstart =
            () => {

                speakBtn.classList.add(
                    "active"
                );

                speakBtn.setAttribute(
                    "title",
                    "Pause reading"
                );

                speakBtn.setAttribute(
                    "aria-label",
                    "Pause reading"
                );

                console.log(
                    "â–¶ AP SYNAPSE â€” READING STARTED"
                );
            };


        utterance.onend =
            () => {

                speakBtn.classList.remove(
                    "active"
                );

                speakBtn.setAttribute(
                    "title",
                    "Read response"
                );

                speakBtn.setAttribute(
                    "aria-label",
                    "Read response"
                );

                console.log(
                    "âœ… AP SYNAPSE â€” READING FINISHED"
                );
            };


        utterance.onerror =
            () => {

                speakBtn.classList.remove(
                    "active"
                );

                speakBtn.setAttribute(
                    "title",
                    "Read response"
                );

                speakBtn.setAttribute(
                    "aria-label",
                    "Read response"
                );
            };


        /*
         * Start cleanly.
         */

        synth.cancel();

        synth.speak(
            utterance
        );

    });

}
// ======================
// Stop Speaking
// ======================

if(stopBtn){

    stopBtn.style.display="inline-flex";

    stopBtn.addEventListener("click",()=>{

        speechSynthesis.cancel();

    });

}

// ======================
// New Conversation
// ======================

if(newChatBtn){

newChatBtn.addEventListener("click",()=>{

speechSynthesis.cancel();

lastAIResponse="";

currentConversationId = null;

window.currentDocument="";

chatWindow.innerHTML="";

input.value="";

chatWindow.style.display="none";

heroScreen.style.display="flex";

});

}

// ==============================
// SETTINGS
// ==============================

const settingsBtn = document.querySelectorAll(".top-icon")[1];

if (settingsBtn) {

settingsBtn.addEventListener("click",()=>{

const dark =
document.body.classList.toggle("light-mode");

showToast(
dark
? "? Light Mode Enabled"
: "?? Dark Mode Enabled"
);

});

}

// ==============================
// NOTIFICATION BUTTON
// ==============================

const notificationBtn =
document.querySelectorAll(".top-icon")[0];

if(notificationBtn){

notificationBtn.addEventListener("click",()=>{

showToast("No new notifications");

});

}

// ==============================
// NEW CONVERSATION
// ==============================

if(newChatBtn){

newChatBtn.addEventListener("click",()=>{

chatWindow.innerHTML="";

heroScreen.style.display="flex";

chatWindow.style.display="none";

input.value="";

window.currentDocument="";

showToast("New conversation started");

});

}

// ==============================
// PROFILE
// ==============================

const profileBtn=
document.querySelector(".profile-button");

if(profileBtn){

profileBtn.addEventListener("click",()=>{

alert(`
AP Synapse

Creator:
Anuprit Patil

Version 1.0

Status:
Online
`);

});

}

document.addEventListener("click",(e)=>{

if(!e.target.classList.contains("copyBtn")) return;

const text=e.target
.closest(".message-body")
.innerText
.replace("?? Copy","")
.replace("?? Read Aloud","");

navigator.clipboard.writeText(text);

showToast("Copied");

});

const language=document.getElementById("languageSelect");

if(language){

language.addEventListener("change",()=>{

showToast(

"Language: "+language.value

);

});

}

/* =========================================================
   AP SYNAPSE ï¿½ PREMIUM MESSAGE CONTROLS
   Copy ï¿½ Share ï¿½ Regenerate ï¿½ Timestamps ï¿½ Tooltips
   ========================================================= */

(() => {

    function formatAPTime(date = new Date()) {

        return new Intl.DateTimeFormat(undefined, {
            hour: "numeric",
            minute: "2-digit"
        }).format(date);

    }


    function addUserTimestamp(messageElement) {

        if (!messageElement) return;

        if (
            messageElement.querySelector(
                ".ap-message-time"
            )
        ) return;

        const body =
            messageElement.querySelector(".message-body") ||
            messageElement;

        const time =
            document.createElement("div");

        time.className =
            "ap-message-time";

        time.textContent =
            formatAPTime();

        body.appendChild(time);

    }


    async function copyAPResponse(button, body) {

        const clone =
            body.cloneNode(true);

        clone
            .querySelectorAll(
                ".ap-response-actions, .ap-message-time"
            )
            .forEach(el => el.remove());

        const text =
            clone.innerText.trim();

        try {

            await navigator.clipboard.writeText(text);

            const old =
                button.innerHTML;

            button.innerHTML =
                `<span class="ap-action-icon">?</span>
                 <span>Copied</span>`;

            setTimeout(() => {
                button.innerHTML = old;
            }, 1400);

        } catch {

            const range =
                document.createRange();

            range.selectNodeContents(clone);

            const selection =
                window.getSelection();

            selection.removeAllRanges();
            selection.addRange(range);

            document.execCommand("copy");

            selection.removeAllRanges();

        }

    }


    async function shareAPResponse(button, body) {

        const clone =
            body.cloneNode(true);

        clone
            .querySelectorAll(
                ".ap-response-actions, .ap-message-time"
            )
            .forEach(el => el.remove());

        const text =
            clone.innerText.trim();

        if (navigator.share) {

            try {

                await navigator.share({
                    title: "AP Synapse",
                    text
                });

            } catch {

                // User cancelled share.

            }

            return;

        }

        await navigator.clipboard.writeText(text);

        const old =
            button.innerHTML;

        button.innerHTML =
            `<span class="ap-action-icon">?</span>
             <span>Copied</span>`;

        setTimeout(() => {
            button.innerHTML = old;
        }, 1400);

    }


    function createResponseActions(messageElement) {

        if (!messageElement) return;

        if (
            messageElement.querySelector(
                ".ap-response-actions"
            )
        ) return;

        const body =
            messageElement.querySelector(
                ".message-body"
            );

        if (!body) return;


        const actions =
            document.createElement("div");

        actions.className =
            "ap-response-actions";


        actions.innerHTML = `

            <button
                type="button"
                class="ap-response-action"
                data-action="copy"
                title="Copy response"
                aria-label="Copy response"
            >
                <span class="ap-action-icon">?</span>
                <span class="ap-action-label">Copy</span>
            </button>


            <button
                type="button"
                class="ap-response-action"
                data-action="share"
                title="Share response"
                aria-label="Share response"
            >
                <span class="ap-action-icon">?</span>
                <span class="ap-action-label">Share</span>
            </button>

        `;


        body.after(actions);


        const copyButton =
            actions.querySelector(
                '[data-action="copy"]'
            );

        const shareButton =
            actions.querySelector(
                '[data-action="share"]'
            );


        copyButton.addEventListener(
            "click",
            () => copyAPResponse(
                copyButton,
                body
            )
        );


        shareButton.addEventListener(
            "click",
            () => shareAPResponse(
                shareButton,
                body
            )
        );

    }


    function enhanceMessages() {

        /* User timestamps */

        document
            .querySelectorAll(
                ".user-message, .message.user"
            )
            .forEach(addUserTimestamp);


        /* AP response controls */

        document
            .querySelectorAll(
                ".message.ai"
            )
            .forEach(createResponseActions);

    }


    /* Watch the chat continuously.
       This automatically handles:
       - new messages
       - streamed responses
       - restored conversations
       - regenerated responses
    */

    const observer =
        new MutationObserver(() => {

            enhanceMessages();

        });


    function startAPMessageObserver() {

        const chat =
            document.querySelector(
                "#chatWindow"
            ) ||
            document.querySelector(
                ".chat-window"
            ) ||
            document.querySelector(
                "[class*='chat-window']"
            );

        if (!chat) {

            setTimeout(
                startAPMessageObserver,
                500
            );

            return;

        }


        observer.observe(chat, {
            childList: true,
            subtree: true
        });


        enhanceMessages();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            startAPMessageObserver
        );

    } else {

        startAPMessageObserver();

    }

})();

// ============================================================
// AP SYNAPSE ï¿½ CONVERSATION NAVIGATOR
// ============================================================

function getConversationMessages() {

    return Array.from(
        chatWindow.querySelectorAll(
            ".message.user, .message.ai, .user-message"
        )
    );
}


function getMessageLabel(message, index) {

    const body =
        message.querySelector(".message-body");

    if (!body) {
        return `Message ${index + 1}`;
    }

    const text =
        body.innerText
            .replace(/\s+/g, " ")
            .trim();

    if (!text) {
        return `Message ${index + 1}`;
    }

    return text.length > 52
        ? `${text.slice(0, 52)}ï¿½`
        : text;
}


function refreshConversationNavigator() {

    const list =
        document.getElementById(
            "conversationNavigatorList"
        );

    const count =
        document.getElementById(
            "conversationCount"
        );

    if (!list) return;

    const messages =
        getConversationMessages();

    list.innerHTML = "";

    if (count) {
        count.textContent =
            messages.length;
    }

    messages.forEach((message, index) => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "conversation-nav-item";

        button.dataset.target =
            message.dataset.messageId || "";

        button.innerHTML = `
            <span class="conversation-nav-index">
                ${String(index + 1).padStart(2, "0")}
            </span>

            <span class="conversation-nav-label">
                ${escapeHTML(
                    getMessageLabel(message, index)
                )}
            </span>
        `;

        button.addEventListener(
            "click",
            () => {

                message.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }
        );

        list.appendChild(button);

    });

    updateConversationNavigatorActiveState();
}


function updateConversationNavigatorActiveState() {

    const messages =
        getConversationMessages();

    const items =
        document.querySelectorAll(
            ".conversation-nav-item"
        );

    if (!messages.length) return;

    let closestIndex = 0;
    let closestDistance = Infinity;

    messages.forEach((message, index) => {

        const rect =
            message.getBoundingClientRect();

        const distance =
            Math.abs(
                rect.top -
                window.innerHeight * 0.35
            );

        if (distance < closestDistance) {

            closestDistance = distance;
            closestIndex = index;

        }

    });

    items.forEach((item, index) => {

        item.classList.toggle(
            "active",
            index === closestIndex
        );

    });
}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// ============================================================
// AP SYNAPSE ï¿½ JUMP TO LATEST
// ============================================================

const jumpToLatestBtn =
    document.getElementById(
        "jumpToLatestBtn"
    );


function isChatNearBottom() {

    const threshold = 180;

    return (
        chatWindow.scrollHeight -
        chatWindow.scrollTop -
        chatWindow.clientHeight
    ) < threshold;

}


function updateJumpToLatest() {

    if (!jumpToLatestBtn) return;

    jumpToLatestBtn.classList.toggle(
        "visible",
        !isChatNearBottom()
    );

}


chatWindow.addEventListener(
    "scroll",
    () => {

        updateJumpToLatest();
        updateConversationNavigatorActiveState();

    },
    { passive: true }
);


jumpToLatestBtn?.addEventListener(
    "click",
    () => {

        chatWindow.scrollTo({
            top: chatWindow.scrollHeight,
            behavior: "smooth"
        });

    }
);



/* ============================================================
   AP_COMPOSER_DOM_RESILIENCE_V1
   Keeps command-bar actions alive if UI code replaces buttons.
   ============================================================ */

const AP_ORIGINAL_COMPOSER_BUTTONS = new Map([
    ["sendBtn", sendBtn],
    ["attachBtn", attachBtn],
    ["imageGenBtn", imageGenBtn],
    ["voiceBtn", voiceBtn],
    ["speakBtn", speakBtn],
    ["webBtn", webBtn],
    ["deepThinkBtn", deepThinkBtn],
    ["stopBtn", stopBtn]
].filter(([, button]) => button));

document.addEventListener(
    "click",
    event => {
        if (!(event.target instanceof Element)) {
            return;
        }

        const liveButton = event.target.closest(
            "#sendBtn,#attachBtn,#imageGenBtn,#voiceBtn,#speakBtn,#webBtn,#deepThinkBtn,#stopBtn"
        );

        if (!liveButton) {
            return;
        }

        const original =
            AP_ORIGINAL_COMPOSER_BUTTONS.get(
                liveButton.id
            );

        /*
         * If this is still the original button,
         * its normal chat.js listener already owns it.
         */
        if (
            !original ||
            original === liveButton
        ) {
            return;
        }

        /*
         * Forward the action to the original DOM node,
         * which still owns AP Synapse's real listeners.
         */
        original.click();

        /*
         * Keep live toggle visuals synchronized.
         */
        if (
            liveButton.id === "webBtn" ||
            liveButton.id === "deepThinkBtn"
        ) {
            liveButton.classList.toggle(
                "active",
                original.classList.contains("active")
            );
        }

        /*
         * Voice button icon/status may be modified
         * by the original recognition handler.
         */
        if (liveButton.id === "voiceBtn") {
            liveButton.innerHTML =
                original.innerHTML;
        }
    },
    false
);

console.log(
    "âœ… AP SYNAPSE â€” COMPOSER DOM RESILIENCE ACTIVE"
);


/* ============================================================
   AP SYNAPSE â€” COMPOSER ACTION SURVIVAL
   Keeps all primary composer actions alive after DOM replacement.
   ============================================================ */
// AP_COMPOSER_ACTION_SURVIVAL_V1

const AP_COMPOSER_ACTION_ANCHORS = Object.freeze({
    input,
    sendBtn,
    attachBtn,
    voiceBtn,
    speakBtn,
    webBtn,
    deepThinkBtn,
    imageGenBtn,
    stopBtn
});

function apRefreshComposerActionRefs() {

    input =
        document.getElementById("userInput") ||
        input;

    sendBtn =
        document.getElementById("sendBtn") ||
        sendBtn;

    attachBtn =
        document.getElementById("attachBtn") ||
        attachBtn;

    voiceBtn =
        document.getElementById("voiceBtn") ||
        voiceBtn;

    speakBtn =
        document.getElementById("speakBtn") ||
        speakBtn;

    webBtn =
        document.getElementById("webBtn") ||
        webBtn;

    deepThinkBtn =
        document.getElementById("deepThinkBtn") ||
        deepThinkBtn;

    imageGenBtn =
        document.getElementById("imageGenBtn") ||
        imageGenBtn;

    stopBtn =
        document.getElementById("stopBtn") ||
        stopBtn;
}

document.addEventListener(
    "click",
    event => {

        if (!(event.target instanceof Element)) {
            return;
        }

        const button =
            event.target.closest(
                "#sendBtn," +
                "#attachBtn," +
                "#voiceBtn," +
                "#speakBtn," +
                "#webBtn," +
                "#deepThinkBtn," +
                "#imageGenBtn," +
                "#stopBtn"
            );

        if (!button || button.disabled) {
            return;
        }

        const anchor =
            AP_COMPOSER_ACTION_ANCHORS[
                button.id
            ];

        /*
         * If this is still the original element,
         * its normal chat.js handler already runs.
         */
        if (button === anchor) {
            return;
        }

        apRefreshComposerActionRefs();

        if (button.id === "sendBtn") {
            void sendMessage();
            return;
        }

        /*
         * Original detached element retains the proven
         * chat.js handler. Relay to it while refreshed
         * variables point at the current live controls.
         */
        if (anchor) {
            anchor.click();
        }
    },
    false
);


/*
 * Enter / mobile keyboard Send also survives input replacement.
 */
document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Enter" ||
            event.shiftKey ||
            event.isComposing
        ) {
            return;
        }

        const liveInput =
            event.target instanceof Element
                ? event.target.closest("#userInput")
                : null;

        if (!liveInput) {
            return;
        }

        if (
            liveInput ===
            AP_COMPOSER_ACTION_ANCHORS.input
        ) {
            return;
        }

        event.preventDefault();

        apRefreshComposerActionRefs();

        void sendMessage();
    },
    false
);

console.log(
    "âœ… AP SYNAPSE â€” COMPOSER ACTION SURVIVAL ACTIVE"
);


/* ============================================================
   AP_DYNAMIC_COMPOSER_BRIDGE_V1
   Keeps the complete composer functional if later UI code
   replaces its buttons and strips their original listeners.
   ============================================================ */

(() => {
    "use strict";

    const originals = {
        sendBtn,
        attachBtn,
        imageGenBtn,
        voiceBtn,
        speakBtn,
        webBtn,
        deepThinkBtn,
        stopBtn
    };

    const selector = [
        "#sendBtn",
        "#attachBtn",
        "#imageGenBtn",
        "#voiceBtn",
        "#speakBtn",
        "#webBtn",
        "#deepThinkBtn",
        "#stopBtn"
    ].join(",");

    document.addEventListener(
        "click",
        event => {
            const target =
                event.target instanceof Element
                    ? event.target.closest(selector)
                    : null;

            if (!target) return;

            const original =
                originals[target.id];

            if (
                !original ||
                target === original
            ) {
                return;
            }

            /*
             * The detached original element still owns the
             * real chat.js listener. Triggering it preserves
             * all existing AP Synapse behaviour without
             * duplicating business logic.
             */
            original.click();
        },
        false
    );

    console.log(
        "âœ… AP SYNAPSE â€” DYNAMIC COMPOSER BRIDGE READY"
    );
})();


/* ============================================================
   AP_COMPOSER_SELF_HEAL_V1
   Keep original chat controls + event handlers alive even when
   later responsive/UI controllers recreate composer elements.
   ============================================================ */

const AP_COMPOSER_ORIGINALS = new Map([
    ["userInput", input],
    ["sendBtn", sendBtn],
    ["voiceBtn", voiceBtn],
    ["speakBtn", speakBtn],
    ["attachBtn", attachBtn],
    ["imageGenBtn", imageGenBtn],
    ["deepThinkBtn", deepThinkBtn],
    ["webBtn", webBtn],
    ["stopBtn", stopBtn],
    ["fileInput", fileInput]
].filter(([, element]) => element));

let apComposerRepairQueued = false;

function apRepairComposerControls() {

    apComposerRepairQueued = false;

    for (const [id, original] of AP_COMPOSER_ORIGINALS) {

        const live =
            document.getElementById(id);

        if (
            !live ||
            live === original
        ) {
            continue;
        }

        const wasFocused =
            document.activeElement === live;

        if (
            "value" in live &&
            "value" in original
        ) {
            original.value = live.value;
        }

        for (
            const className of
            live.classList
        ) {
            original.classList.add(
                className
            );
        }

        if (
            "disabled" in live &&
            "disabled" in original
        ) {
            original.disabled =
                live.disabled;
        }

        live.replaceWith(
            original
        );

        if (
            wasFocused &&
            typeof original.focus === "function"
        ) {
            original.focus({
                preventScroll: true
            });

            if (
                typeof original.setSelectionRange ===
                    "function"
            ) {
                const end =
                    String(
                        original.value || ""
                    ).length;

                try {
                    original.setSelectionRange(
                        end,
                        end
                    );
                }
                catch {}
            }
        }

        console.log(
            "â™»ï¸ AP composer restored:",
            id
        );
    }
}

function apQueueComposerRepair() {

    if (apComposerRepairQueued) {
        return;
    }

    apComposerRepairQueued = true;

    queueMicrotask(
        apRepairComposerControls
    );
}

const apComposerObserver =
    new MutationObserver(
        apQueueComposerRepair
    );

function apStartComposerSelfHeal() {

    apRepairComposerControls();

    if (document.body) {

        apComposerObserver.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }

    setTimeout(
        apRepairComposerControls,
        100
    );

    setTimeout(
        apRepairComposerControls,
        500
    );

    setTimeout(
        apRepairComposerControls,
        1500
    );

    console.log(
        "âœ… AP SYNAPSE â€” COMPOSER SELF-HEAL ACTIVE"
    );
}

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        apStartComposerSelfHeal,
        {
            once: true
        }
    );

}
else {

    apStartComposerSelfHeal();
}


/* ============================================================
   AP_COMPOSER_DOM_REPLACEMENT_BRIDGE_V1
   Keeps the entire composer functional even if later UI
   controllers replace its DOM buttons.
   ============================================================ */

document.addEventListener(
    "click",
    event => {

        const liveButton =
            event.target instanceof Element
                ? event.target.closest(
                    "#sendBtn," +
                    "#attachBtn," +
                    "#imageGenBtn," +
                    "#voiceBtn," +
                    "#speakBtn," +
                    "#webBtn," +
                    "#deepThinkBtn," +
                    "#stopBtn"
                )
                : null;

        if (
            !liveButton ||
            !liveButton.isConnected
        ) {
            return;
        }

        const originals = {
            sendBtn,
            attachBtn,
            imageGenBtn,
            voiceBtn,
            speakBtn,
            webBtn,
            deepThinkBtn,
            stopBtn
        };

        const original =
            originals[liveButton.id];

        /*
         * Same element = its normal chat.js
         * listener still exists. Do nothing.
         */
        if (
            !original ||
            original === liveButton
        ) {
            return;
        }

        /*
         * Replacement detected.
         * Fire the original control whose real
         * AP Synapse logic is still attached.
         */
        original.click();

        /*
         * Keep visible active state synchronized.
         */
        queueMicrotask(() => {

            liveButton.classList.toggle(
                "active",
                original.classList.contains("active")
            );

            if (
                original.hasAttribute("aria-pressed")
            ) {
                liveButton.setAttribute(
                    "aria-pressed",
                    original.getAttribute("aria-pressed")
                );
            }
        });
    },
    true
);

console.log(
    "âœ… AP SYNAPSE â€” COMPOSER DOM RESILIENCE ACTIVE"
);
