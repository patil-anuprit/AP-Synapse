import { runReplicateModel }
from "./replicateVisualRunner.js";

const MODEL =
    "wan-video/wan-2.7-t2v";


export async function generateAPVideo(
    prompt,
    {
        duration = 5,
        resolution = "1080p",
        aspectRatio = "16:9"
    } = {}
) {

    const clean =
        String(prompt || "").trim();

    if (!clean) {
        throw new Error(
            "Video prompt is required."
        );
    }

    console.log(
        "AP VISUAL MESH -> WAN 2.7 VIDEO"
    );

    const result =
        await runReplicateModel(
            MODEL,
            {
                prompt:
                    clean,

                duration:
                    Math.max(
                        2,
                        Math.min(15, Number(duration) || 5)
                    ),

                resolution,

                aspect_ratio:
                    aspectRatio,

                negative_prompt:
                    "blur, flicker, distorted geometry, malformed objects, unwanted text, watermark",

                enable_prompt_expansion:
                    true
            }
        );


    const url =
        Array.isArray(result.output)
            ? result.output[0]
            : result.output;


    return {
        type:
            "video",

        status:
            "completed",

        engine:
            "wan-2.7",

        url,

        requestId:
            result.requestId
    };
}
