import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export async function createStream(messages) {

    if (!Array.isArray(messages)) {
        throw new Error("Messages must be an array.");
    }

    try {

        console.log("📤 Sending request to Groq...");

        const requestStart = performance.now();

        const stream = await groq.chat.completions.create({

            model:
                process.env.GROQ_MODEL ||
                "llama-3.3-70b-versatile",

            messages,

            stream: true

        });

        const requestAccepted =
            performance.now();

        console.log(
            `⚡ Groq stream accepted in ${
                (requestAccepted - requestStart).toFixed(0)
            } ms`
        );

        return stream;

    } catch (error) {

        console.error("❌ GROQ ERROR");
        console.error(error);

        throw error;

    }

}