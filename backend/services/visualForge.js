import "dotenv/config";
import { fal } from "@fal-ai/client";

const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
    console.warn(
        "âš ï¸ FAL_KEY is not configured. Visual Forge generation will be unavailable."
    );
}

fal.config({
    credentials: FAL_KEY
});

const IMAGE_MODEL =
    "fal-ai/nano-banana-2";

const VIDEO_MODEL =
    "fal-ai/kling-video/v3/pro/image-to-video";


function requireFalKey() {

    if (!FAL_KEY) {
        throw new Error(
            "Visual Forge is not configured: FAL_KEY is missing."
        );
    }

}


function normalizePrompt(prompt) {

    return String(prompt || "")
        .trim();

}


function premiumImagePrompt(prompt) {

    return `
Create an exceptional, premium-quality image based on the user's request.

USER REQUEST:
${prompt}

VISUAL DIRECTION:
- highly accurate interpretation of the request
- sophisticated composition
- strong visual hierarchy
- natural and coherent lighting
- realistic materials and textures where appropriate
- excellent depth and spatial consistency
- clean details
- believable proportions
- refined color harmony
- cinematic visual quality where appropriate
- professional production finish
- no unnecessary objects
- no accidental text
- no watermarks
- no malformed anatomy
- no visual artifacts

Prioritize the actual user's intent over generic decoration.
The final image should look deliberately art-directed rather than randomly generated.
`.trim();

}


function premiumVideoPrompt(prompt) {

    return `
Create a premium cinematic video based on the user's request.

USER REQUEST:
${prompt}

MOTION DIRECTION:
- natural physically coherent movement
- smooth cinematic camera motion
- stable subject identity
- consistent geometry and environment
- realistic lighting changes
- convincing depth and parallax
- elegant pacing
- refined professional cinematography
- avoid unnecessary camera shake
- avoid sudden unwanted object changes
- avoid visual artifacts
- preserve the important visual characteristics of the source image

The movement should enhance the original visual rather than transform it into an unrelated scene.
`.trim();

}


/**
 * AP Synapse Visual Forge
 * Premium image generation
 */
export async function generateVisualImage(prompt) {

    requireFalKey();

    const cleanPrompt =
        normalizePrompt(prompt);

    if (!cleanPrompt) {
        throw new Error(
            "An image prompt is required."
        );
    }

    console.log(
        "ðŸŽ¨ Visual Forge â†’ Nano Banana 2"
    );

    const result =
        await fal.subscribe(
            IMAGE_MODEL,
            {
                input: {
                    prompt: premiumImagePrompt(cleanPrompt),

                    // AP SYNAPSE VISUAL FORGE V2
                    // Balanced production quality + speed
                    resolution: "2K",
                    aspect_ratio: "auto",
                    output_format: "png",
                    num_images: 1,
                    safety_tolerance: "4",
                    limit_generations: true
                },
                logs: true
            }
        );

    const image =
        result?.data?.images?.[0];

    const url =
        image?.url;

    if (!url) {
        console.error(
            "Visual Forge image response:",
            result?.data
        );

        throw new Error(
            "Visual Forge returned no image."
        );
    }

    return {
        type: "image",
        status: "completed",
        engine: "fal-nano-banana-2",
        url,
        width: image?.width || null,
        height: image?.height || null,
        requestId:
            result?.requestId || null
    };

}


/**
 * AP Synapse Visual Forge
 * Premium image â†’ video generation
 */
export async function generateVisualVideo(
    prompt,
    imageUrl
) {

    requireFalKey();

    const cleanPrompt =
        normalizePrompt(prompt);

    if (!imageUrl) {
        throw new Error(
            "An image URL is required for Visual Forge video generation."
        );
    }

    console.log(
        "ðŸŽ¬ Visual Forge â†’ Kling 3.0 Pro"
    );

    const result =
        await fal.subscribe(
            VIDEO_MODEL,
            {
                input: {
                    prompt:
                        premiumVideoPrompt(
                            cleanPrompt
                        ),

                    image_url:
                        imageUrl,

                    duration:
                        "5",

                    generate_audio:
                        true,

                    negative_prompt:
                        "blur, distortion, flickering, warped objects, unstable identity, malformed details, low quality"
                },

                logs: true,

                onQueueUpdate:
                    update => {

                        if (
                            update?.status ===
                            "IN_PROGRESS"
                        ) {

                            console.log(
                                "ðŸŽ¬ Visual Forge video generation in progress..."
                            );

                        }

                    }
            }
        );

    const video =
        result?.data?.video;

    const url =
        video?.url;

    if (!url) {

        console.error(
            "Visual Forge video response:",
            result?.data
        );

        throw new Error(
            "Visual Forge returned no video."
        );

    }

    return {

        type: "video",

        status: "completed",

        engine:
            "fal-kling-3.0-pro",

        url,

        contentType:
            video?.content_type ||
            "video/mp4",

        fileName:
            video?.file_name ||
            "ap-synapse-visual-forge.mp4",

        fileSize:
            video?.file_size ||
            null,

        requestId:
            result?.requestId ||
            null

    };

}


/**
 * Unified Visual Forge entry point
 */
export async function generateVisual({
    type = "image",
    prompt = "",
    imageUrl = null
} = {}) {

    if (type === "image") {

        return generateVisualImage(
            prompt
        );

    }

    if (
        type === "video" ||
        type === "image-to-video"
    ) {

        return generateVisualVideo(
            prompt,
            imageUrl
        );

    }

    throw new Error(
        `Unsupported Visual Forge type: ${type}`
    );

}

