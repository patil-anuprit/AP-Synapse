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

console.log("✅ chat.js loaded");
console.log("PAGE LOADED:", Date.now());
console.log("STEP 1");
const input = document.getElementById("userInput");
console.log("STEP 2");
const sendBtn = document.getElementById("sendBtn");
console.log("STEP 3");
const voiceBtn = document.getElementById("voiceBtn");
const speakBtn = document.getElementById("speakBtn");
let lastAIResponse = "";

window.currentDocumentImage = "";

let currentConversationId =
    window.currentConversationId || null;
    window.setActiveConversation = function (id) {

    currentConversationId = id;

    window.currentConversationId = id;

    console.log(
        "🔄 Active conversation:",
        currentConversationId
    );

};
const fileInput = document.getElementById("fileInput");
const attachBtn = document.getElementById("attachBtn");

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
        "📚 Active conversation:",
        currentConversationId
    );

    return currentConversationId;
}

console.log("File Input:", fileInput);
const imageUpload=document.getElementById("imageUpload");
console.log("Image Upload:", imageUpload);
const stopBtn=document.getElementById("stopBtn");
let controller = null;
const chatWindow = document.getElementById("chatWindow");
chatWindow.style.display = "none";
console.log("STEP 4");
const heroScreen = document.getElementById("heroScreen");
const projectModal = document.getElementById("projectModal");
const createProjectBtn = document.getElementById("createProject");
const cancelProjectBtn = document.getElementById("cancelProject");
const projectCards = document.querySelectorAll(".prompt-chip");
const imageGenBtn =
document.getElementById("imageGenBtn");
const deepThinkBtn =
document.getElementById("deepThinkBtn");

window.deepThinking=false;
const webBtn =
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

    if (!chatWindow) return;

    const distance =
        chatWindow.scrollHeight -
        chatWindow.scrollTop -
        chatWindow.clientHeight;

    // Don't pull the user down while they are
    // reading older messages.
    if (!force && distance > 180) {
        return;
    }

    chatWindow.scrollTop =
        chatWindow.scrollHeight;
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
// AP SYNAPSE — USER MESSAGE ACTIONS
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
            ⧉
        </button>

        <button
            type="button"
            class="ap-message-mini-action"
            data-action="edit"
            aria-label="Edit message"
            title="Edit"
        >
            ✎
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
            "Edit message — press Enter to regenerate"
        );

    });
}

// =====================================
// SEND MESSAGE
// =====================================

async function sendMessage() {

    const message =
        input.value.trim();

    if (!message) return;

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
            "✏️ Regenerating from edited message:",
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
    // SAVE USER MESSAGE — EXACTLY ONCE
    // =====================================

    saveHistoryMessage(
        currentConversationId,
        "user",
        message
    );


    // =====================================
    // SHOW USER MESSAGE — EXACTLY ONCE
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

    console.log(
        "🖼️ Frontend image request detected:",
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


        const response = await fetch(
            "https://ap-synapse-backend.onrender.com/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-session-id": getSessionId()
                },

                body: JSON.stringify({
                    message,

                    document:
                        typeof window.currentDocument === "string"
                            ? window.currentDocument
                            : "",

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

        const reader =
            response.body.getReader();

        const decoder =
            new TextDecoder();


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
// READ STREAM — OPTIMIZED
// =====================================

let rawText = "";
let renderScheduled = false;
let streamFinished = false;

// ============================================================
// AP SYNAPSE — STRUCTURED WEB SOURCES
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
        '<span class="typingCursor">▋</span>';

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

    const {
        done,
        value
    } = await reader.read();

    if (done) {
        streamFinished = true;
        break;
    }

    const chunk =
        decoder.decode(
            value,
            { stream: true }
        );

    if (!chunk) continue;

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
                "🔗 AP SYNAPSE SOURCES RECEIVED:",
                apSynapseSources.length
            );

        }

    } catch (sourceError) {

        console.warn(
            "⚠️ Source payload parsing failed:",
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
// AP SYNAPSE — FINAL RESPONSE RENDER
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
                    <span class="ap-source-link-icon">↗</span>
                    <span class="ap-source-link-text">
                        ${cleanUrl}
                    </span>
                </a>
            `;
        }
    );
}

// ============================================================
// AP SYNAPSE — PREMIUM WEB SOURCE CARDS
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
                                    ↗
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
                    ◈
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
        // SAVE COMPLETE AI RESPONSE — ONCE
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

        console.error("🔥 FULL AP SYNAPSE ERROR:", error);
        console.error("🔥 ERROR NAME:", error?.name);
        console.error("🔥 ERROR MESSAGE:", error?.message);
        console.error("🔥 ERROR STACK:", error?.stack);

        console.error(
            "AP SYNAPSE ERROR:",
            error
        );


        clearInterval(thinkingInterval);

        document
           .getElementById("thinking")
           ?.remove();

        console.log("?? CHAT RESPONSE:", response.status, response.headers.get("content-type"));

        addMessage(
            "ai-message",
            "⚠️ Unable to connect to AP Synapse."
        );

    }

}

console.log("STEP 8");
sendBtn.addEventListener("click", sendMessage);

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

• Plan the project
• Research
• Write code
• Create documentation
• Build a roadmap`

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

        voiceBtn.innerHTML = "🎙️";

        recognition.start();

        showToast("Listening...");

    });

    recognition.onresult = (event) => {

        input.value = event.results[0][0].transcript;

    };

    recognition.onend = () => {

        voiceBtn.innerHTML = "🎤";

        if (input.value.trim()) {

            sendMessage();

        }

    };

    recognition.onerror = () => {

        voiceBtn.innerHTML = "🎤";

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
`📷 **${file.name}**

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

`🎨 Image generation is ready.

Type something like:

• Create a futuristic city

• Draw a solar system

• Generate a medical diagram

• Create an AI logo`

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
            ? "🌐 Web Search Enabled"
            : "🌐 Web Search Disabled"
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

console.log("ABOUT TO REGISTER FILE EVENT");

fileInput.addEventListener("change", async (event) => {

    console.log("✅ FILE SELECTED");

    const file = event.target.files[0];

    console.log("Selected File:", file);

    if (!file) return;

try {

    addMessage(
        "user-message",
        `📎 Uploading **${file.name}**...`
    );

    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
    "https://ap-synapse-backend.onrender.com/upload",
    {
        method: "POST",

        headers: {
            "x-session-id": getSessionId()
        },

        body: formData
    }
);

    if (!response.ok) {

        throw new Error("Upload failed");

    }

    const data = await response.json();

    console.log("?? IMAGE DATA:", data);

    window.currentDocument = data.content || "";

window.currentDocumentImage = "";

if (
    data.content &&
    typeof data.content === "object" &&
    data.content.type === "image" &&
    data.content.dataUrl
) {

    window.currentDocumentImage =
        data.content.dataUrl;

    console.log(
        "🖼️ Optimized image data stored from backend."
    );

}

console.log("Document stored.");
console.log(window.currentDocument);

    addMessage(
        "ai-message",
        `✅ **${data.original}** uploaded successfully.

You can now ask me anything about this document.`
    );

}
catch(err){

    console.error("UPLOAD ERROR:", err);

    alert("UPLOAD ERROR:\n\n" + err.message);

    addMessage(
        "ai-message",
        "❌ Document upload failed.\n\n" + err.message
    );

}

});

// ===============================
// Read Aloud
// ===============================

document.addEventListener("click", (e) => {

    if (!e.target.classList.contains("speakBtn")) return;

    const text =
        e.target
        .closest(".message-body")
        .innerText
        .replace("🔊 Read Aloud","");

    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.rate = 1;

    speech.pitch = 1;

    speech.volume = 1;

    speech.lang = "en-US";

    speechSynthesis.speak(speech);

});

speakBtn.addEventListener("click", () => {

    if (!lastAIResponse) {

        alert("No AI response available.");

        return;

    }

    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(lastAIResponse);

    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;

    speechSynthesis.speak(speech);

});

// =====================================
// AP Synapse Read Aloud
// =====================================

if (speakBtn) {

    speakBtn.addEventListener("click", () => {

        if (!lastAIResponse) {

            alert("No AI response available.");

            return;

        }

        speechSynthesis.cancel();

        const speech = new SpeechSynthesisUtterance(lastAIResponse);

        speech.lang = "en-US";
        speech.rate = 1;
        speech.pitch = 1;
        speech.volume = 1;

        speechSynthesis.speak(speech);

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
? "☀ Light Mode Enabled"
: "🌙 Dark Mode Enabled"
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
.replace("📋 Copy","")
.replace("🔊 Read Aloud","");

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
   AP SYNAPSE — PREMIUM MESSAGE CONTROLS
   Copy • Share • Regenerate • Timestamps • Tooltips
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
                `<span class="ap-action-icon">✓</span>
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
            `<span class="ap-action-icon">✓</span>
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
                <span class="ap-action-icon">⧉</span>
                <span class="ap-action-label">Copy</span>
            </button>


            <button
                type="button"
                class="ap-response-action"
                data-action="share"
                title="Share response"
                aria-label="Share response"
            >
                <span class="ap-action-icon">↗</span>
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
// AP SYNAPSE — CONVERSATION NAVIGATOR
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
        ? `${text.slice(0, 52)}…`
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
// AP SYNAPSE — JUMP TO LATEST
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