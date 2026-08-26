import "dotenv/config";

import {
    runReplicateModel
} from "./replicateVisualRunner.js";


const MODEL =
    "tencent/hunyuan-3d-3.1";


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


function find3DUrl(output) {

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
                find3DUrl(value);

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
            "glb",
            "gltf",
            "model",
            "model_url",
            "model_file",
            "mesh",
            "url",
            "file",
            "output"
        ];


        for (const key of keys) {

            if (output[key]) {

                const found =
                    find3DUrl(
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


export async function generateAP3D({
    prompt = "",
    imageUrl = null,
    faceCount = 500000
} = {}) {

    const cleanPrompt =
        String(prompt || "")
            .trim();

    const cleanImageUrl =
        imageUrl
            ? String(imageUrl).trim()
            : "";


    if (
        !cleanPrompt &&
        !cleanImageUrl
    ) {

        throw new Error(
            "A 3D prompt or image is required."
        );
    }


    const safeFaceCount =
        Math.round(
            clamp(
                faceCount,
                40000,
                1500000,
                500000
            )
        );


    const input = {

        enable_pbr:
            true,

        face_count:
            safeFaceCount,

        generate_type:
            "Normal"
    };


    if (cleanImageUrl) {

        input.image =
            cleanImageUrl;

    }
    else {

        input.prompt =
            cleanPrompt;
    }


    console.log(
        "AP VISUAL MESH -> HUNYUAN 3D 3.1"
    );


    try {

        const result =
            await runReplicateModel(
                MODEL,
                input,
                {
                    timeoutMs:
                        300000,

                    pollMs:
                        2000
                }
            );


        const url =
            find3DUrl(
                result?.output
            );


        if (!url) {
            throw new Error(
                "No 3D output."
            );
        }


        return {
            success: true,

            type:
                "3d",

            status:
                "completed",

            engine:
                "hunyuan-3d-3.1",

            format:
                "3d-model",

            url,

            requestId:
                result?.requestId ||
                null
        };

    }
    catch (error) {

        console.error(
            "AP 3D ENGINE FAILED:",
            error?.code ||
            "PROVIDER_UNAVAILABLE"
        );


        const clean =
            new Error(
                "3D generation is temporarily unavailable. Please try again later."
            );

        clean.code =
            "3D_GENERATION_UNAVAILABLE";

        throw clean;
    }
}
