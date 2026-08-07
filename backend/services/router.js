import { createStream as groq } from "./groqService.js";
import { createStream as gemini } from "./geminiService.js";
import { createStream as openrouter } from "./openrouterService.js";
import { createStream as deepseek } from "./deepseekService.js";


function getErrorStatus(error) {

    const message =
        error?.message ||
        String(error || "");

    const match =
        message.match(/\b(400|401|402|403|404|408|409|413|429|500|502|503|504)\b/);

    return match
        ? Number(match[1])
        : null;

}


function describeProviderError(error) {

    const status =
        getErrorStatus(error);

    if (status === 401) {
        return "authentication failed";
    }

    if (status === 402) {
        return "insufficient balance / payment required";
    }

    if (status === 403) {
        return "access forbidden";
    }

    if (status === 404) {
        return "model or endpoint unavailable";
    }

    if (status === 408) {
        return "request timeout";
    }

    if (status === 413) {
        return "request too large";
    }

    if (status === 429) {
        return "rate limit reached";
    }

    if (status >= 500) {
        return `provider server error (${status})`;
    }

    return error?.message || "unknown provider error";

}


async function tryProvider(
    providerName,
    providerFunction,
    messages
) {

    try {

        console.log(
            `🔄 Trying ${providerName}...`
        );

        const stream =
            await providerFunction(messages);

        console.log(
            `✅ ${providerName} accepted the request.`
        );

        return stream;

    }

    catch (error) {

        console.error(
            `⚠️ ${providerName} unavailable:`,
            describeProviderError(error)
        );

        return null;

    }

}


export async function createAIStream(messages) {

    if (!Array.isArray(messages)) {

        throw new Error(
            "Messages must be an array."
        );

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
    // VISION ROUTING
    // GEMINI → OPENROUTER
    // ==========================================

    if (hasImage) {

        console.log(
            "🖼️ Vision request detected."
        );


        const geminiStream =
            await tryProvider(
                "Gemini Vision",
                gemini,
                messages
            );

        if (geminiStream) {
            return geminiStream;
        }


        const openrouterStream =
            await tryProvider(
                "OpenRouter Vision",
                openrouter,
                messages
            );

        if (openrouterStream) {
            return openrouterStream;
        }


        throw new Error(
            "All vision providers are currently unavailable."
        );

    }


    // ==========================================
    // TEXT ROUTING
    // GROQ → GEMINI → DEEPSEEK → OPENROUTER
    // ==========================================

    console.log(
        "💬 Text request detected."
    );


    const groqStream =
        await tryProvider(
            "Groq",
            groq,
            messages
        );

    if (groqStream) {
        return groqStream;
    }


    const geminiStream =
        await tryProvider(
            "Gemini",
            gemini,
            messages
        );

    if (geminiStream) {
        return geminiStream;
    }


    const deepseekStream =
        await tryProvider(
            "DeepSeek",
            deepseek,
            messages
        );

    if (deepseekStream) {
        return deepseekStream;
    }


    const openrouterStream =
        await tryProvider(
            "OpenRouter",
            openrouter,
            messages
        );

    if (openrouterStream) {
        return openrouterStream;
    }


    throw new Error(
        "All AP Synapse AI providers are currently unavailable."
    );

}