import dotenv from "dotenv";

dotenv.config();

if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY");
}

export async function createStream(messages) {

    if (!Array.isArray(messages)) {
        throw new Error("Messages must be an array.");
    }

    console.log("🟠 Sending request to DeepSeek...");

    const response = await fetch(
        "https://api.deepseek.com/chat/completions",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization":
                    `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },

            body: JSON.stringify({
                model:
                    process.env.DEEPSEEK_MODEL ||
                    "deepseek-chat",

                messages,

                stream: true
            })
        }
    );

    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `DeepSeek ${response.status}: ${errorText}`
        );

    }

    if (!response.body) {

        throw new Error(
            "DeepSeek returned no response body."
        );

    }

    console.log(
        "✅ DeepSeek request accepted."
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
                            trimmed
                                .slice(5)
                                .trim()
                        );

                    const text =
                        data.choices?.[0]
                            ?.delta?.content;

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
                        "⚠️ DeepSeek stream parse error:",
                        error
                    );

                }

            }

        }

    }

    return stream();

}