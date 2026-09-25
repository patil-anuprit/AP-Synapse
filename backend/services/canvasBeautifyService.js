import "dotenv/config";

import { fal } from "@fal-ai/client";

import {
    generateCloudflareImageEdit
} from "./cloudflareImageEditService.js";

import {
    generateFlux2ProImage
} from "./flux2ProImageService.js";

const FAL_KEY =
    process.env.FAL_KEY || "";

const FAL_EDIT_MODEL =
    "fal-ai/nano-banana-2/edit";

if (FAL_KEY) {
    fal.config({
        credentials: FAL_KEY
    });
}

const STYLE_DIRECTIONS =
    Object.freeze({
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

function clean(
    value,
    max = 1200
) {
    return String(
        value || ""
    )
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
        clean(
            description,
            1200
        );

    return `
You are AP Synapse Canvas Intelligence.

Transform the supplied rough hand-drawn sketch into a beautiful, colourful,
professional finished artwork.

SOURCE PRESERVATION:
- treat the sketch as the visual blueprint
- preserve the main subject and recognizable composition
- preserve relative placement, silhouette and key objects
- understand rough or imperfect lines intelligently
- do not replace the drawing with an unrelated scene
- preserve the user's idea while dramatically improving execution
- do not add text, labels, signatures, logos or watermarks unless requested

BEAUTIFICATION:
- convert rough lines into coherent finished forms
- add appropriate colours, materials, textures and refined details
- create attractive lighting and dimensional depth
- add a suitable environment only when it improves the result
- improve proportions without losing the original concept
- create polished professional visual quality
- avoid malformed objects, duplicate objects, warped geometry and artifacts
- output one finished image

STYLE:
${STYLE_DIRECTIONS[styleKey]}

USER DESCRIPTION:
${userDescription || "No extra description. Infer the intended subject from the sketch and beautify it intelligently."}

The finished image must clearly feel like the user's own rough sketch transformed
into a beautiful final artwork.
`.trim();
}

function bufferToDataUrl(
    buffer,
    mimeType = "image/jpeg"
) {
    if (!Buffer.isBuffer(buffer)) {
        throw new Error(
            "Image provider returned no image buffer."
        );
    }

    return (
        "data:" +
        mimeType +
        ";base64," +
        buffer.toString("base64")
    );
}

async function beautifyWithCloudflare({
    sketchDataUrl,
    prompt
}) {
    console.log(
        "AP Canvas -> Cloudflare image edit"
    );

    const result =
        await generateCloudflareImageEdit(
            prompt,
            [
                sketchDataUrl
            ]
        );

    return {
        ok: true,
        type: "image",
        status: "completed",
        engine:
            result?.engine ||
            "cloudflare-image-edit",
        imageUrl:
            bufferToDataUrl(
                result?.buffer,
                result?.mimeType ||
                    "image/jpeg"
            ),
        width: null,
        height: null,
        description: "",
        requestId: null
    };
}

async function beautifyWithFlux({
    sketchDataUrl,
    prompt
}) {
    console.log(
        "AP Canvas -> FLUX.2 Pro image edit"
    );

    const result =
        await generateFlux2ProImage(
            prompt,
            [
                sketchDataUrl
            ]
        );

    return {
        ok: true,
        type: "image",
        status: "completed",
        engine:
            result?.engine ||
            "flux-2-pro",
        imageUrl:
            bufferToDataUrl(
                result?.buffer,
                result?.mimeType ||
                    "image/jpeg"
            ),
        width: null,
        height: null,
        description: "",
        requestId: null
    };
}

async function beautifyWithFal({
    sketchDataUrl,
    prompt
}) {
    if (!FAL_KEY) {
        throw new Error(
            "fal.ai fallback is not configured."
        );
    }

    console.log(
        "AP Canvas -> Nano Banana 2 Edit"
    );

    const result =
        await fal.subscribe(
            FAL_EDIT_MODEL,
            {
                input: {
                    prompt,
                    image_urls: [
                        sketchDataUrl
                    ],
                    num_images: 1,
                    aspect_ratio:
                        "auto",
                    output_format:
                        "png",
                    resolution:
                        "1K",
                    limit_generations:
                        true
                },
                logs: false
            }
        );

    const image =
        result?.data?.images?.[0];

    const imageUrl =
        image?.url;

    if (!imageUrl) {
        throw new Error(
            "fal.ai returned no edited image."
        );
    }

    return {
        ok: true,
        type: "image",
        status: "completed",
        engine:
            "fal-nano-banana-2-edit",
        imageUrl,
        width:
            image?.width || null,
        height:
            image?.height || null,
        description:
            result?.data?.description ||
            "",
        requestId:
            result?.requestId || null
    };
}

function compactError(error) {
    return String(
        error?.message ||
        error?.name ||
        "failed"
    )
        .replace(/\s+/g, " ")
        .slice(0, 220);
}

export async function beautifyCanvasSketch({
    sketchDataUrl,
    style = "auto",
    description = ""
} = {}) {
    if (
        typeof sketchDataUrl !==
            "string" ||
        !/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(
            sketchDataUrl
        )
    ) {
        throw new Error(
            "A valid sketch image is required."
        );
    }

    const prompt =
        buildBeautifyPrompt({
            style,
            description
        });

    const failures = [];

    try {
        return await beautifyWithCloudflare({
            sketchDataUrl,
            prompt
        });
    }
    catch (error) {
        failures.push(
            "cloudflare=" +
            compactError(error)
        );

        console.warn(
            "AP Canvas Cloudflare failed:",
            compactError(error)
        );
    }

    try {
        return await beautifyWithFlux({
            sketchDataUrl,
            prompt
        });
    }
    catch (error) {
        failures.push(
            "flux=" +
            compactError(error)
        );

        console.warn(
            "AP Canvas FLUX.2 Pro failed:",
            compactError(error)
        );
    }

    try {
        return await beautifyWithFal({
            sketchDataUrl,
            prompt
        });
    }
    catch (error) {
        failures.push(
            "fal=" +
            compactError(error)
        );

        console.warn(
            "AP Canvas Nano Banana failed:",
            compactError(error)
        );
    }

    console.error(
        "AP Canvas all providers failed:",
        failures.join(" | ")
    );

    throw new Error(
        "AP Synapse could not transform this sketch right now. Please try again."
    );
}