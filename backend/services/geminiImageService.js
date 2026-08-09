import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export async function generateImage(prompt) {

    if (!prompt || typeof prompt !== "string") {
        throw new Error("Image prompt is required.");
    }

    console.log("🎨 AP SYNAPSE → GEMINI 3.1 FLASH IMAGE");
    console.log("📝 Prompt:", prompt);

    const response = await ai.models.generateContent({

        model:
            process.env.GEMINI_IMAGE_MODEL ||
            "gemini-3.1-flash-image",

        contents: prompt,

        config: {

            responseModalities: ["IMAGE"],

            responseFormat: {
                image: {
                    aspectRatio: "16:9",
                    imageSize: "2K"
                }
            },

            thinkingConfig: {
                thinkingLevel: "high"
            }

        }

    });

    const parts =
        response?.candidates?.[0]?.content?.parts || [];

    const imagePart =
        parts.find(
            part =>
                part?.inlineData?.data
        );

    if (!imagePart) {

        console.error(
            "❌ Gemini returned no image."
        );

        console.error(
            JSON.stringify(response, null, 2)
        );

        throw new Error(
            "Gemini returned no image data."
        );
    }

    const mimeType =
        imagePart.inlineData.mimeType ||
        "image/png";

    const imageBuffer =
        Buffer.from(
            imagePart.inlineData.data,
            "base64"
        );

    console.log("✅ GEMINI IMAGE GENERATED");
    console.log("Mime type:", mimeType);
    console.log(
        "Buffer size:",
        imageBuffer.length
    );

    return {
        buffer: imageBuffer,
        mimeType
    };
}