import { createStream as groq } from "./groqService.js";
import { createStream as gemini } from "./geminiService.js";

export async function createAIStream(messages){

    try{

        console.log("🟢 Using Groq");

        return await groq(messages);

    }

    catch(error){

        console.log("⚠ Groq Failed");

    }

    try{

        console.log("🔵 Switching to Gemini");

        return await gemini(messages);

    }

    catch(error){

        console.log("⚠ Gemini Failed");

    }

    throw new Error("All AI providers are unavailable.");

}