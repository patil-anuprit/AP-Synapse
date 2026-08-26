import "dotenv/config";

import {
    runReplicateModel
} from "./replicateVisualRunner.js";


const MODEL =
    "wan-video/wan-2.7-t2v";


function clamp(
    value,
    min,
    max,
    fallback
) {

    const n =
        Number(value);

    if (!Number.isFinite(n)) {
        return fallback;
    }

    return Math.min(
        max,
        Math.max(min, n)
    );
}


function findVideoUrl(output) {

    if (!output) {
        return "";
    }

    if (
        typeof output === "string"
    ) {
        return output;
    }

    if (
        Array.isArray(output)
    ) {

        for (const value of output) {

            const found =
                findVideoUrl(value);

            if (found) {
                return found;
            }
        }

        return "";
    }


    if (
        typeof output === "object"
    ) {

        const keys = [
            "url",
            "video",
            "video_url",
            "file",
            "output"
        ];

        for (const key of keys) {

            if (output[key]) {

                const found =
                    findVideoUrl(
                        output[key]
                    );

                if (found) {
                    return found;
                }
            }
        }
    }

    return "";
}


export async function generateAPVideo(
    prompt,
    {
        duration = 5,
        resolution = "1080p",
        aspectRatio = "16:9"
    } = {}
) {

    const cleanPrompt =
        String(prompt || "")
            .trim();

    if (!cleanPrompt) {
        throw new Error(
            "Video prompt is required."
        );
    }


    const safeDuration =
        clamp(
            duration,
            2,
            15,
            5
        );


    console.log(
        "AP VISUAL MESH -> WAN 2.7 VIDEO"
    );


    try {

        const result =
            await runReplicateModel(
                MODEL,
                {
                    prompt:
                        cleanPrompt,

                    duration:
                        safeDuration,

                    resolution:
                        String(
                            resolution ||
                            "1080p"
                        ),

                    aspect_ratio:
                        String(
                            aspectRatio ||
                            "16:9"
                        ),

                    negative_prompt:
                        "low quality, blurry, distorted, malformed, artifacts, flicker, watermark, text",

                    enable_prompt_expansion:
                        true
                },
                {
                    timeoutMs:
                        300000,

                    pollMs:
                        2000
                }
            );


        const url =
            findVideoUrl(
                result?.output
            );


        if (!url) {
            throw new Error(
                "No video output."
            );
        }


        return {
            success: true,

            type:
                "video",

            status:
                "completed",

            engine:
                "wan-2.7",

            url,

            requestId:
                result?.requestId ||
                null
        };

    }
    catch (error) {

        console.error(
            "AP VIDEO ENGINE FAILED:",
            error?.code ||
            "PROVIDER_UNAVAILABLE"
        );


        const clean =
            new Error(
                "Video generation is temporarily unavailable. Please try again later."
            );

        clean.code =
            "VIDEO_GENERATION_UNAVAILABLE";

        throw clean;
    }
}
