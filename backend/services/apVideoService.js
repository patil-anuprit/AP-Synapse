import "dotenv/config";
import { Client } from "@gradio/client";

const SPACE =
    "OpenKing/wan2-video-generation";

function findUrl(value) {

    if (!value) return "";

    if (
        typeof value === "string" &&
        /^https?:\/\//i.test(value)
    ) {
        return value;
    }

    if (Array.isArray(value)) {

        for (const item of value) {

            const url =
                findUrl(item);

            if (url) return url;
        }

        return "";
    }

    if (typeof value === "object") {

        const preferred = [
            "url",
            "video",
            "path",
            "file"
        ];

        for (const key of preferred) {

            if (value[key]) {

                const url =
                    findUrl(value[key]);

                if (url) return url;
            }
        }

        for (const item of Object.values(value)) {

            const url =
                findUrl(item);

            if (url) return url;
        }
    }

    return "";
}


export async function generateAPVideo(
    prompt,
    {
        duration = 3,
        resolution = "720p",
        aspectRatio = "16:9"
    } = {}
) {

    const cleanPrompt =
        String(prompt || "").trim();

    if (!cleanPrompt) {
        throw new Error(
            "Video prompt is required."
        );
    }

    console.log(
        "AP VISUAL MESH -> FREE HUGGING FACE WAN VIDEO"
    );

    try {

        const options =
            process.env.HF_TOKEN
                ? { token: process.env.HF_TOKEN }
                : {};

        const app =
            await Client.connect(
                SPACE,
                options
            );


        // Space supports 512-1920 width / 512-1080 height.
        const landscape =
            !String(aspectRatio).includes("9:16");

        const width =
            landscape
                ? 1280
                : 704;

        const height =
            landscape
                ? 704
                : 1080;


        // 73 frames ~= short clip.
        const result =
            await app.predict(
                "/generate_video",
                {
                    prompt:
                        cleanPrompt,

                    image:
                        null,

                    width,

                    height,

                    num_frames:
                        73,

                    // Minimum allowed by this Space = 20.
                    // Fastest sensible free setting.
                    num_inference_steps:
                        20,

                    guidance_scale:
                        5,

                    seed:
                        -1
                }
            );


        const videoResult =
            result?.data?.[0];

        const url =
            findUrl(videoResult);


        if (!url) {

            console.error(
                "WAN raw result:",
                JSON.stringify(result?.data)
            );

            throw new Error(
                "No video URL returned."
            );
        }


        console.log(
            "AP FREE VIDEO -> SUCCESS"
        );


        return {
            success: true,
            type: "video",
            status: "completed",
            engine: "hf-wan-free",
            url
        };

    }
    catch (error) {

        console.error(
            "FREE VIDEO FAILED:",
            error?.message || error
        );

        const clean =
            new Error(
                "Video generation is temporarily busy. Please try again shortly."
            );

        clean.code =
            "VIDEO_FREE_CAPACITY";

        throw clean;
    }
}
