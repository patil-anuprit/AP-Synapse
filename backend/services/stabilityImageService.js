import dotenv from "dotenv";

dotenv.config();

export async function generateStabilityImage(prompt) {

    if (!process.env.STABILITY_API_KEY) {
        throw new Error("Missing STABILITY_API_KEY");
    }

    if (!prompt || typeof prompt !== "string") {
        throw new Error("Image prompt is required.");
    }

    console.log("🟠 AP SYNAPSE IMAGE ENGINE → STABILITY AI");

    const form = new FormData();

    form.append("prompt", prompt);
    form.append("output_format", "png");
    form.append("aspect_ratio", "1:1");
    form.append("style_preset", "cinematic");

    const response = await fetch(
        "https://api.stability.ai/v2beta/stable-image/generate/core",
        {
            method: "POST",

            headers: {
                "authorization":
                    `Bearer ${process.env.STABILITY_API_KEY}`,

                "accept": "image/*"
            },

            body: form
        }
    );

    if (!response.ok) {

        let errorText = "";

        try {
            errorText = await response.text();
        } catch {}

        throw new Error(
            `Stability AI ${response.status}: ${errorText}`
        );
    }

    const buffer =
        Buffer.from(
            await response.arrayBuffer()
        );

    console.log("✅ STABILITY AI IMAGE GENERATED");
    console.log("Buffer size:", buffer.length);

    return {
        buffer,
        mimeType:
            response.headers.get("content-type") ||
            "image/png"
    };
}