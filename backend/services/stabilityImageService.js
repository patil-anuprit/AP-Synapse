import dotenv from "dotenv";

dotenv.config();

function cleanImagePrompt(prompt) {

    return String(prompt || "")
        .replace(
            /^(please\s+)?(create|generate|make|draw|design|render|paint|illustrate)\s+(an?\s+)?(image|picture|photo|artwork|illustration)\s+(of\s+)?/i,
            ""
        )
        .trim();
}


function buildStabilityPrompt(prompt) {

    const clean = cleanImagePrompt(prompt);

    return `
Create exactly what the user requested.

SUBJECT:
${clean}

IMPORTANT:
- preserve the requested subject exactly
- do not replace the requested subject with a human
- do not invent unrelated people or objects
- match the requested visual style
- keep the main subject clearly recognizable
- use a clean, coherent composition
- high-quality professional rendering
- accurate anatomy and geometry where applicable
- no watermark
- no accidental text
- no unrelated scene

If the request is for a character, creature, illustration, cartoon or fictional subject,
keep the result character-focused rather than turning it into a cinematic human portrait.
`.trim();
}


function chooseStylePreset(prompt) {

    const p =
        String(prompt || "").toLowerCase();

    if (
        /\b(photo|photorealistic|realistic|cinematic|film|movie|camera|portrait photography)\b/.test(p)
    ) {
        return "cinematic";
    }

    if (
        /\b(anime|manga)\b/.test(p)
    ) {
        return "anime";
    }

    if (
        /\b(comic|cartoon)\b/.test(p)
    ) {
        return "comic-book";
    }

    if (
        /\b(digital art|concept art|illustration|fantasy art)\b/.test(p)
    ) {
        return "digital-art";
    }

    return null;
}


export async function generateStabilityImage(prompt) {

    if (!process.env.STABILITY_API_KEY) {
        throw new Error("Missing STABILITY_API_KEY");
    }

    if (!prompt || typeof prompt !== "string") {
        throw new Error("Image prompt is required.");
    }

    const finalPrompt =
        buildStabilityPrompt(prompt);

    const stylePreset =
        chooseStylePreset(prompt);

    console.log(
        "AP SYNAPSE IMAGE ENGINE -> STABILITY AI"
    );

    console.log(
        "Image subject:",
        cleanImagePrompt(prompt)
    );

    console.log(
        "Style:",
        stylePreset || "automatic"
    );

    const form =
        new FormData();

    form.append(
        "prompt",
        finalPrompt
    );

    form.append(
        "output_format",
        "png"
    );

    form.append(
        "aspect_ratio",
        "1:1"
    );

    if (stylePreset) {
        form.append(
            "style_preset",
            stylePreset
        );
    }

    const response =
        await fetch(
            "https://api.stability.ai/v2beta/stable-image/generate/core",
            {
                method: "POST",

                headers: {
                    authorization:
                        `Bearer ${process.env.STABILITY_API_KEY}`,

                    accept:
                        "image/*"
                },

                body: form
            }
        );

    if (!response.ok) {

        let errorText = "";

        try {
            errorText =
                await response.text();
        }
        catch {}

        throw new Error(
            `Stability AI ${response.status}: ${errorText}`
        );
    }

    const buffer =
        Buffer.from(
            await response.arrayBuffer()
        );

    if (!buffer.length) {
        throw new Error(
            "Stability AI returned an empty image."
        );
    }

    console.log(
        "STABILITY AI IMAGE GENERATED"
    );

    console.log(
        "Buffer size:",
        buffer.length
    );

    return {
        buffer,

        mimeType:
            response.headers.get(
                "content-type"
            ) ||
            "image/png"
    };
}
