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

    console.log("🎨 AP SYNAPSE IMAGE ENGINE → Gemini 3.1 Flash Image");

    const response = await ai.models.generateContent({

        model:
            process.env.GEMINI_IMAGE_MODEL ||
            "gemini-3.1-flash-image",

        contents: prompt,

        config: {
            responseModalities: ["IMAGE"]
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
        throw new Error(
            "Gemini image generation returned no image."
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

    return {
        buffer: imageBuffer,
        mimeType
    };
}