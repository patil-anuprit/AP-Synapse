import dotenv from "dotenv";

dotenv.config();

if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY");
}

export async function createStream(messages) {

    if (!Array.isArray(messages)) {
        throw new Error("Messages must be an array.");
    }

    console.log("🟣 Sending request to OpenRouter...");

    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization":
                    `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer":
                    "https://ap-synapse.vercel.app",
                "X-Title":
                    "AP Synapse"
            },

            body: JSON.stringify({
                model: "openrouter/free",
                messages,
                stream: true
            })
        }
    );

    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `OpenRouter ${response.status}: ${errorText}`
        );

    }

    if (!response.body) {
        throw new Error(
            "OpenRouter returned no response body."
        );
    }

    console.log(
        "✅ OpenRouter request accepted."
    );

    async function* stream() {

        const reader =
            response.body.getReader();

        const decoder =
            new TextDecoder();

        let buffer = "";

        while (true) {

            const { value, done } =
                await reader.read();

            if (done) break;

            buffer +=
                decoder.decode(
                    value,
                    { stream: true }
                );

            const lines =
                buffer.split("\n");

            buffer =
                lines.pop() || "";

            for (const line of lines) {

                const trimmed =
                    line.trim();

                if (
                    !trimmed ||
                    trimmed === "data: [DONE]"
                ) {
                    continue;
                }

                if (!trimmed.startsWith("data:")) {
                    continue;
                }

                try {

                    const data =
                        JSON.parse(
                            trimmed.slice(5).trim()
                        );

                    const text =
                        data.choices?.[0]?.delta?.content;

                    if (!text) continue;

                    yield {
                        choices: [
                            {
                                delta: {
                                    content: text
                                }
                            }
                        ]
                    };

                }

                catch (error) {

                    console.error(
                        "⚠️ OpenRouter stream parse error:",
                        error
                    );

                }

            }

        }

    }

    return stream();

}