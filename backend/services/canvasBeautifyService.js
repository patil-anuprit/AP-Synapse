import "dotenv/config";
import { fal } from "@fal-ai/client";

const FAL_KEY = process.env.FAL_KEY;

const EDIT_MODEL =
    "fal-ai/nano-banana-2/edit";

if (FAL_KEY) {
    fal.config({
        credentials: FAL_KEY
    });
}

const STYLE_DIRECTIONS = Object.freeze({
    auto: `
Choose the most visually appropriate professional style for the subject.
Make it colourful, polished, coherent, detailed and aesthetically exceptional.
`,
    realistic: `
Create a photorealistic, believable, beautifully lit interpretation with
natural materials, refined colours, depth, texture and professional detail.
`,
    storybook: `
Create a warm, colourful, premium storybook illustration with charming detail,
beautiful lighting, expressive shapes, refined colour harmony and a magical finish.
`,
    architecture: `
Create a sophisticated architectural visualization. Preserve the building idea,
improve proportions and details, and add premium materials, landscaping, light and depth.
`,
    "3d": `
Create a polished premium 3D-rendered interpretation with excellent materials,
soft global illumination, dimensional depth, refined geometry and rich colour.
`,
    watercolor: `
Create an elegant colourful watercolor artwork with expressive brushwork,
beautiful pigments, soft atmospheric depth and a refined hand-painted finish.
`,
    cartoon: `
Create a clean, colourful, highly polished cartoon illustration with appealing
forms, strong composition, expressive detail and professional visual finish.
`,
    fantasy: `
Create a spectacular fantasy interpretation with rich colour, cinematic light,
imaginative detail, atmospheric depth and premium concept-art quality.
`
});

function requireFal() {
    if (!FAL_KEY) {
        throw new Error(
            "Visual Forge is unavailable because FAL_KEY is not configured."
        );
    }
}

function clean(value, max = 1200) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);
}

function buildBeautifyPrompt({
    style = "auto",
    description = ""
} = {}) {
    const styleKey =
        Object.prototype.hasOwnProperty.call(
            STYLE_DIRECTIONS,
            style
        )
            ? style
            : "auto";

    const userDescription =
        clean(description, 1200);

    return `
You are AP Synapse Canvas Intelligence.

Transform the provided rough hand-drawn sketch into a beautiful, colourful,
professional finished artwork.

CRITICAL SOURCE-PRESERVATION RULES:
- use the supplied sketch as the structural source and visual blueprint
- preserve the main subject, recognizable composition, relative placement,
  silhouette and key objects from the sketch
- understand imperfect rough lines intelligently instead of copying their defects
- do not turn the drawing into an unrelated scene
- do not add text, labels, logos, signatures or watermarks unless explicitly requested
- preserve the user's idea while dramatically improving execution

BEAUTIFICATION:
- convert rough lines into coherent finished forms
- add appropriate colours, materials, textures and refined details
- create excellent lighting and depth
- add a suitable background/environment only when it improves the scene
- use attractive but believable proportions
- create strong visual hierarchy and balanced composition
- make the result feel deliberately art-directed
- avoid malformed objects, warped geometry, duplicate objects and visual artifacts
- output one polished final image

STYLE DIRECTION:
${STYLE_DIRECTIONS[styleKey]}

USER DESCRIPTION:
${userDescription || "No extra description. Infer the intended subject from the sketch and beautify it intelligently."}

The final result should clearly feel like the user's original sketch transformed
into a finished premium artwork rather than replaced by a different idea.
`.trim();
}

export async function beautifyCanvasSketch({
    sketchDataUrl,
    style = "auto",
    description = ""
} = {}) {
    requireFal();

    if (
        typeof sketchDataUrl !== "string" ||
        !/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(
            sketchDataUrl
        )
    ) {
        throw new Error(
            "A valid sketch image data URL is required."
        );
    }

    const prompt =
        buildBeautifyPrompt({
            style,
            description
        });

    console.log(
        "AP Canvas Make Beautiful -> Nano Banana 2 Edit"
    );

    const result =
        await fal.subscribe(
            EDIT_MODEL,
            {
                input: {
                    prompt,
                    image_urls: [
                        sketchDataUrl
                    ],
                    num_images: 1,
                    aspect_ratio: "auto",
                    output_format: "png",
                    resolution: "1K",
                    limit_generations: true
                },
                logs: false
            }
        );

    const image =
        result?.data?.images?.[0];

    const imageUrl =
        image?.url;

    if (!imageUrl) {
        console.error(
            "Canvas beautify response:",
            result?.data
        );

        throw new Error(
            "Canvas Intelligence returned no image."
        );
    }

    return {
        ok: true,
        type: "image",
        status: "completed",
        engine: "fal-nano-banana-2-edit",
        imageUrl,
        width: image?.width || null,
        height: image?.height || null,
        description:
            result?.data?.description || "",
        requestId:
            result?.requestId || null
    };
}