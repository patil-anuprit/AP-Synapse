import { createStream as groq } from "./groqService.js";
import { createStream as gemini } from "./geminiService.js";

export async function createAIStream(messages) {

    if (!Array.isArray(messages)) {
        throw new Error("Messages must be an array.");
    }

    // ==========================================
    // AP SYNAPSE — DETECT MULTIMODAL REQUEST
    // ==========================================

    const hasImage = messages.some(
        message =>
            Array.isArray(message?.content) &&
            message.content.some(
                item =>
                    item?.type === "image_url" &&
                    item?.image_url?.url
            )
    );

    // ==========================================
    // IMAGE → GEMINI VISION
    // ==========================================

    if (hasImage) {

        console.log(
            "🖼️ Vision request detected — using Gemini."
        );

        try {

            return await gemini(messages);

        }

        catch (error) {

            console.error(
                "❌ Gemini Vision Failed:"
            );

            console.error(error);

            throw error;

        }

    }

    // ==========================================
    // NORMAL TEXT → GROQ
    // ==========================================

    try {

        console.log(
            "🟢 Text request — using Groq."
        );

        return await groq(messages);

    }

    catch (error) {

        console.error(
            "⚠️ Groq Failed — switching to Gemini."
        );

        console.error(error);

    }

    // ==========================================
    // TEXT FALLBACK → GEMINI
    // ==========================================

    try {

        console.log(
            "🔵 Gemini text fallback."
        );

        return await gemini(messages);

    }

    catch (error) {

        console.error(
            "❌ Gemini Failed:"
        );

        console.error(error);

    }

    throw new Error(
        "All AI providers are unavailable."
    );

}