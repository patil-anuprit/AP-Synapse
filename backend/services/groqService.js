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

        const stream = await groq.chat.completions.create({

            model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",

            messages: messages,

            stream: true

        });

        console.log("✅ Groq request accepted.");

        return stream;

    } catch (error) {

        console.error("❌ GROQ ERROR");
        console.error(error);

        throw error;

    }

}