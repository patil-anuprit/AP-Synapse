import dotenv from "dotenv";

dotenv.config();

function cleanPrompt(prompt) {

    return String(prompt || "")
        .replace(
            /^(please\s+)?(create|generate|make|draw|design|render|paint|illustrate)\s+(an?\s+)?(image|picture|photo|artwork|illustration)\s+(of\s+)?/i,
            ""
        )
        .trim();
}


export async function generateStabilityImage(prompt) {

    if (!process.env.STABILITY_API_KEY) {
        throw new Error("Missing STABILITY_API_KEY");
    }

    const subject = cleanPrompt(prompt);

    if (!subject) {
        throw new Error("Image prompt is required.");
    }

    console.log("AP SYNAPSE IMAGE ENGINE -> STABILITY ULTRA");
    console.log("Exact requested subject:", subject);

    const form = new FormData();

    form.append(
        "prompt",
        `
${subject}

Create an image that directly and clearly represents exactly the requested subject above.
The requested subject must be the dominant focus.
Do not substitute it with an unrelated person, robot, object, interface or scene.
Respect the user's requested style if one is specified.
High visual quality, coherent composition and accurate subject representation.
        `.trim()
    );

    form.append(
        "negative_prompt",
        "unrelated subject, unrelated person, random human portrait, robot unless requested, software interface, 3D modelling interface, UI screenshot, watermark, accidental text, malformed subject"
    );

    form.append("output_format", "png");
    form.append("aspect_ratio", "1:1");

    const response = await fetch(
        "https://api.stability.ai/v2beta/stable-image/generate/ultra",
        {
            method: "POST",

            headers: {
                authorization:
                    `Bearer ${process.env.STABILITY_API_KEY}`,
                accept: "image/*"
            },

            body: form
        }
    );

    if (!response.ok) {

        const errorText =
            await response.text().catch(() => "");

        throw new Error(
            `Stability Ultra ${response.status}: ${errorText}`
        );
    }

    const buffer =
        Buffer.from(
            await response.arrayBuffer()
        );

    if (!buffer.length) {
        throw new Error(
            "Stability Ultra returned an empty image."
        );
    }

    console.log(
        "STABILITY ULTRA IMAGE GENERATED:",
        buffer.length,
        "bytes"
    );

    return {
        buffer,

        mimeType:
            response.headers.get("content-type") ||
            "image/png"
    };
}
