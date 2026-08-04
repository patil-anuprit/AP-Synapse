import { getSessionId } from "./session.js";
import {
    saveProject
} from "./projects.js";
import {
    getConversations,
    createConversation,
    addMessage as saveHistoryMessage
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

    wrapper.className =
        `message ${type === "user-message" ? "user" : "ai"}`;

    wrapper.innerHTML = `
        <div class="avatar">
            ${type === "user-message" ? "U" : "AP"}
        </div>

        <div class="message-body">
            ${marked.parse(String(text ?? ""))}
        </div>
    `;

    chatWindow.appendChild(wrapper);

    requestAnimationFrame(() => {
    scrollChatToBottom(true);
    });
}


// =====================================
// SEND MESSAGE
// =====================================

async function sendMessage() {

    const message = input.value.trim();

    if (!message) return;

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

    const normalizedMessage = message.toLowerCase();

    const isImageRequest =
    normalizedMessage.includes("create an image") ||
    normalizedMessage.includes("create image") ||
    normalizedMessage.includes("generate an image") ||
    normalizedMessage.includes("generate image") ||
    normalizedMessage.startsWith("draw ") ||
    normalizedMessage.startsWith("paint ") ||
    normalizedMessage.startsWith("illustrate ") ||
    normalizedMessage.includes("make an image of");

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

    thinking.innerHTML =
        "🧠 AP Synapse is thinking...";

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
                       window.currentDocument || "",

                   documentImage:
                       window.currentDocumentImage || "",

                   web: window.webMode,

                   deep: window.deepThinking

               }),

                signal: controller.signal
            }
        );


        if (!response.ok) {
            throw new Error("Server Error");
        }


        document
            .getElementById("thinking")
            ?.remove();


        // =====================================
        // IMAGE RESPONSE
        // =====================================

        if (isImageRequest) {

            const data =
                await response.json();

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
                        >

                        <div class="image-actions">

                            <button class="openImage">
                                🔍 View Full
                            </button>

                            <button class="downloadImage">
                                ⬇ Download
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
                .onclick = async () => {

                    const imageResponse =
                        await fetch(image.src);

                    const blob =
                        await imageResponse.blob();

                    const url =
                        URL.createObjectURL(blob);

                    const a =
                        document.createElement("a");

                    a.href = url;

                    a.download =
                        `AP-Synapse-${Date.now()}.png`;

                    a.click();

                    URL.revokeObjectURL(url);

                };


            scrollChatToBottom();

            return;

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
        // READ STREAM
        // =====================================

        while (true) {

            const {
                done,
                value
            } = await reader.read();


            if (done) {
                break;
            }


            const chunk =
                decoder.decode(
                    value,
                    { stream: true }
                );


            aiMessage.dataset.raw +=
                chunk;


            lastAIResponse =
                aiMessage.dataset.raw;


            aiMessage.innerHTML =
                marked.parse(
                    aiMessage.dataset.raw
                ) +
                '<span class="typingCursor">▋</span>';


            if (window.hljs) {

                aiMessage
                    .querySelectorAll("pre code")
                    .forEach(block => {

                        hljs.highlightElement(
                            block
                        );

                    });

            }

        }


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

        console.error(
            "AP SYNAPSE ERROR:",
            error
        );


        document
            .getElementById("thinking")
            ?.remove();


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

    window.currentDocument = data.content || "";

window.currentDocumentImage = "";

if (
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/webp"
) {

    const imageData = await new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = reject;

        reader.readAsDataURL(file);

    });

    window.currentDocumentImage = imageData;

    console.log("🖼️ Image data stored.");

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
