import { runReplicateModel }
from "./replicateVisualRunner.js";

const MODEL =
    "tencent/hunyuan-3d-3.1";


export async function generateAP3D(
    {
        prompt = "",
        imageUrl = null,
        faceCount = 500000
    } = {}
) {

    const clean =
        String(prompt || "").trim();


    if (!clean && !imageUrl) {
        throw new Error(
            "A 3D prompt or reference image is required."
        );
    }


    if (clean && imageUrl) {
        throw new Error(
            "Use either a prompt or image for 3D generation, not both."
        );
    }


    console.log(
        "AP VISUAL MESH -> HUNYUAN 3D 3.1"
    );


    const input = {

        enable_pbr:
            true,

        face_count:
            Math.max(
                40000,
                Math.min(
                    1500000,
                    Number(faceCount) || 500000
                )
            ),

        generate_type:
            "Normal"
    };


    if (imageUrl) {
        input.image =
            imageUrl;
    }
    else {
        input.prompt =
            clean;
    }


    const result =
        await runReplicateModel(
            MODEL,
            input,
            {
                timeoutMs:
                    300000
            }
        );


    const url =
        Array.isArray(result.output)
            ? result.output[0]
            : result.output;


    return {
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
            result.requestId
    };
}
