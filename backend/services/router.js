import { createStream as groq } from "./groqService.js";
import { createStream as gemini } from "./geminiService.js";
import { createStream as openrouter } from "./openrouterService.js";
import { createStream as deepseek } from "./deepseekService.js";

const FORCE_PROVIDER = process.env.FORCE_PROVIDER || "";


export async function createAIStream(messages) {

        // TEMPORARY PROVIDER TEST
    if (FORCE_PROVIDER === "deepseek") {

        console.log(
            "🧪 FORCE_PROVIDER → DeepSeek"
        );

        return await deepseek(messages);

    }

    if (!Array.isArray(messages)) {
        throw new Error("Messages must be an array.");
    }


    // ==========================================
    // DETECT IMAGE / VISION REQUEST
    // ==========================================

    const hasImage =
        messages.some(
            message =>
                Array.isArray(message?.content) &&
                message.content.some(
                    item =>
                        item?.type === "image_url" &&
                        item?.image_url?.url
                )
        );


    // ==========================================
    // IMAGE → GEMINI → OPENROUTER
    // ==========================================

    if (hasImage) {

        console.log(
            "🖼️ Vision request detected."
        );


        try {

            console.log(
                "🔵 Vision → Gemini"
            );

            return await gemini(messages);

        }

        catch (error) {

            console.error(
                "⚠️ Gemini Vision failed."
            );

            console.error(error);

        }


        try {

            console.log(
                "🟣 Vision → OpenRouter fallback"
            );

            return await openrouter(messages);

        }

        catch (error) {

            console.error(
                "⚠️ OpenRouter Vision failed."
            );

            console.error(error);

        }


        throw new Error(
            "All vision providers are unavailable."
        );

    }


    // ==========================================
    // NORMAL TEXT
    // GROQ → GEMINI → DEEPSEEK → OPENROUTER
    // ==========================================

    try {

        console.log(
            "🟢 Text → Groq"
        );

        return await groq(messages);

    }

    catch (error) {

        console.error(
            "⚠️ Groq failed."
        );

        console.error(error);

    }


    try {

        console.log(
            "🔵 Text → Gemini fallback"
        );

        return await gemini(messages);

    }

    catch (error) {

        console.error(
            "⚠️ Gemini text failed."
        );

        console.error(error);

    }


    try {

        console.log(
            "🟠 Text → DeepSeek fallback"
        );

        return await deepseek(messages);

    }

    catch (error) {

        console.error(
            "⚠️ DeepSeek failed."
        );

        console.error(error);

    }


    try {

        console.log(
            "🟣 Text → OpenRouter final fallback"
        );

        return await openrouter(messages);

    }

    catch (error) {

        console.error(
            "⚠️ OpenRouter failed."
        );

        console.error(error);

    }


    throw new Error(
        "All AI providers are unavailable."
    );

}