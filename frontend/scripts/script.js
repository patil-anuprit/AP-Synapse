const stars = document.querySelector(".stars");

if (stars) {
    for (let i = 0; i < 250; i++) {
        const star = document.createElement("div");

        star.className = "star";
        star.style.left = Math.random() * 100 + "%";
        star.style.top = Math.random() * 100 + "%";
        star.style.animationDelay = Math.random() * 5 + "s";

        stars.appendChild(star);
    }
}

const input = document.getElementById("userInput");
const button = document.getElementById("sendBtn");
const chat = document.getElementById("chatWindow");

const BACKEND_URL =
    "https://ap-synapse-backend.onrender.com";

async function sendMessage() {

    const text = input.value.trim();

    if (!text) return;

    chat.innerHTML += `
        <div class="message user">
            ${escapeHtml(text)}
        </div>
    `;

    input.value = "";

    const aiMessage = document.createElement("div");
    aiMessage.className = "message ai";
    aiMessage.textContent = "";

    chat.appendChild(aiMessage);

    chat.scrollTop = chat.scrollHeight;

    try {

        const response = await fetch(
            `${BACKEND_URL}/chat`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: text,
                    web: true
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }

        if (!response.body) {
            throw new Error(
                "Streaming response is unavailable."
            );
        }

        const reader =
            response.body.getReader();

        const decoder =
            new TextDecoder("utf-8");

        let fullText = "";

        while (true) {

            const {
                value,
                done
            } = await reader.read();

            if (done) break;

            const chunk =
                decoder.decode(
                    value,
                    { stream: true }
                );

            fullText += chunk;

            aiMessage.innerHTML =
                formatResponse(fullText);

            chat.scrollTop =
                chat.scrollHeight;
        }

        const remaining =
            decoder.decode();

        if (remaining) {

            fullText += remaining;

            aiMessage.innerHTML =
                formatResponse(fullText);
        }

    }

    catch (error) {

        console.error(
            "AP Synapse request failed:",
            error
        );

        aiMessage.innerHTML = `
            <strong>AP Synapse</strong><br>
            Unable to connect to the intelligence engine.
            Please try again.
        `;
    }

    chat.scrollTop =
        chat.scrollHeight;
}

function formatResponse(text) {

    // Escape HTML first for safety.
    let safe =
        escapeHtml(text);

    // Convert URLs into clickable links.
    safe =
        safe.replace(
            /(https?:\/\/[^\s<]+)/g,
            url => {

                const cleanUrl =
                    url.replace(
                        /[),.;]+$/,
                        ""
                    );

                return `
                    <a
                        href="${cleanUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${cleanUrl}
                    </a>
                `;
            }
        );

    // Preserve line breaks.
    safe =
        safe.replace(
            /\n/g,
            "<br>"
        );

    return safe;
}

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

button.onclick =
    sendMessage;

input.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);