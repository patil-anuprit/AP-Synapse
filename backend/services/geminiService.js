import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

export async function createStream(messages) {

    if (!Array.isArray(messages)) {
        throw new Error("Messages must be an array.");
    }

    console.log("🔵 Gemini request started.");

    const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-3.6-flash"
    });

    /*
     * Convert AP Synapse messages into Gemini contents.
     * Text-only messages remain normal text.
     * Image messages are preserved as actual image data.
     */

    const contents = [];

    for (const message of messages) {

        if (!message || !message.content) {
            continue;
        }

        const role =
            message.role === "assistant" ||
            message.role === "model"
                ? "model"
                : "user";

        const parts = [];

        // -----------------------------
        // NORMAL TEXT MESSAGE
        // -----------------------------

        if (typeof message.content === "string") {

            parts.push({
                text: message.content
            });

        }

        // -----------------------------
        // MULTIMODAL MESSAGE
        // -----------------------------

        else if (Array.isArray(message.content)) {

            for (const item of message.content) {

                if (
                    item?.type === "text" &&
                    typeof item.text === "string"
                ) {

                    parts.push({
                        text: item.text
                    });

                }

                else if (
                    item?.type === "image_url" &&
                    item.image_url?.url
                ) {

                    const imageUrl =
                        item.image_url.url;

                    /*
                     * Supports:
                     * data:image/png;base64,...
                     * data:image/jpeg;base64,...
                     * etc.
                     */

                    if (
                        imageUrl.startsWith(
                            "data:image/"
                        )
                    ) {

                        const match =
                            imageUrl.match(
                                /^data:(image\/[^;]+);base64,(.+)$/
                            );

                        if (!match) {
                            throw new Error(
                                "Invalid image data."
                            );
                        }

                        const mimeType =
                            match[1];

                        const base64Data =
                            match[2];

                        parts.push({

                            inlineData: {

                                mimeType,

                                data: base64Data

                            }

                        });

                        console.log(
                            `🖼️ Gemini vision image attached: ${mimeType}`
                        );

                    }

                    else {

                        /*
                         * If the frontend supplies an
                         * ordinary URL instead of a data URL,
                         * fetch it and convert it to base64.
                         */

                        const response =
                            await fetch(imageUrl);

                        if (!response.ok) {

                            throw new Error(
                                `Unable to fetch image: ${response.status}`
                            );

                        }

                        const contentType =
                            response.headers.get(
                                "content-type"
                            ) || "image/jpeg";

                        const arrayBuffer =
                            await response.arrayBuffer();

                        const base64Data =
                            Buffer
                                .from(arrayBuffer)
                                .toString("base64");

                        parts.push({

                            inlineData: {

                                mimeType:
                                    contentType,

                                data:
                                    base64Data

                            }

                        });

                        console.log(
                            `🖼️ Gemini vision URL image attached: ${contentType}`
                        );

                    }

                }

            }

        }

        if (parts.length > 0) {

            contents.push({

                role,

                parts

            });

        }

    }

    if (contents.length === 0) {

        throw new Error(
            "No valid Gemini message content."
        );

    }

    console.log(
        `📤 Sending ${contents.length} message(s) to Gemini...`
    );

    const result =
        await model.generateContent({
            contents
        });

    const text =
        result.response.text();

    console.log(
        "✅ Gemini request completed."
    );

    async function* stream() {

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

    return stream();

}