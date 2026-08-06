import { createStream as groq } from "./groqService.js";
import { createStream as gemini } from "./geminiService.js";
import { createStream as openrouter } from "./openrouterService.js";


export async function createAIStream(messages) {


    if (!Array.isArray(messages)) {

        throw new Error(
            "Messages must be an array."
        );

    }


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


    // =================================
    // IMAGE / VISION REQUEST
    // =================================

    if (hasImage) {


        console.log(
            "🖼️ Vision request detected."
        );


        // PRIMARY: GEMINI VISION

        try {

            console.log(
                "🔵 Vision → Gemini"
            );

            return await gemini(messages);


        }

        catch(error) {

            console.error(
                "⚠ Gemini Vision failed."
            );

            console.error(error);

        }



        // FALLBACK: OPENROUTER

        try {

            console.log(
                "🟣 Vision → OpenRouter fallback"
            );

            return await openrouter(messages);


        }

        catch(error) {

            console.error(
                "⚠ OpenRouter Vision failed."
            );

            console.error(error);

        }


        throw new Error(
            "All vision providers unavailable."
        );


    }



    // =================================
    // TEXT REQUEST
    // =================================


    try {


        console.log(
            "🟢 Text → Groq"
        );


        return await groq(messages);



    }

    catch(error) {


        console.error(
            "⚠ Groq failed."
        );

        console.error(error);


    }



    try {


        console.log(
            "🔵 Text → Gemini fallback"
        );


        return await gemini(messages);



    }

    catch(error) {


        console.error(
            "⚠ Gemini text failed."
        );

        console.error(error);


    }



    try {


        console.log(
            "🟣 Text → OpenRouter fallback"
        );


        return await openrouter(messages);



    }

    catch(error) {


        console.error(
            "⚠ OpenRouter failed."
        );

        console.error(error);


    }



    throw new Error(
        "All AI providers are unavailable."
    );


}