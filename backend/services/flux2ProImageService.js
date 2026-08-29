import "dotenv/config";

const TOKEN =
    process.env.REPLICATE_API_TOKEN || "";

const ENDPOINT =
    "https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions";


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function readJson(response) {

    const text =
        await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    }
    catch {
        return {
            detail: text
        };
    }
}


function normalizeInputImages(value) {

    const list =
        Array.isArray(value)
            ? value
            : value
                ? [value]
                : [];

    return list
        .map(item =>
            String(item || "").trim()
        )
        .filter(item =>
            /^data:image\//i.test(item) ||
            /^https?:\/\//i.test(item)
        )
        .slice(0, 8);
}


// ============================================================
// AP_FLUX2_IMAGE_EDIT_V21
// ============================================================

export async function generateFlux2ProImage(
    prompt,
    inputImages = []
) {

    if (!TOKEN) {
        throw new Error(
            "REPLICATE_API_TOKEN is not configured."
        );
    }


    const cleanPrompt =
        String(prompt || "").trim();

    if (!cleanPrompt) {
        throw new Error(
            "FLUX.2 Pro image prompt is required."
        );
    }


    const images =
        normalizeInputImages(
            inputImages
        );

    const isEdit =
        images.length > 0;


    console.log(
        isEdit
            ? "AP SYNAPSE IMAGE ENGINE -> FLUX.2 PRO EDIT"
            : "AP SYNAPSE IMAGE ENGINE -> FLUX.2 PRO GENERATE"
    );


    const input = {
        prompt:
            cleanPrompt,

        aspect_ratio:
            isEdit
                ? "match_input_image"
                : "1:1",

        resolution:
            "1 MP",

        output_format:
            "jpg",

        output_quality:
            92,

        safety_tolerance:
            2
    };


    if (isEdit) {
        input.input_images =
            images;
    }


    const response =
        await fetch(
            ENDPOINT,
            {
                method:
                    "POST",

                headers: {
                    Authorization:
                        `Bearer ${TOKEN}`,

                    "Content-Type":
                        "application/json",

                    Prefer:
                        "wait=60"
                },

                body:
                    JSON.stringify({
                        input
                    })
            }
        );


    const initial =
        await readJson(
            response
        );


    if (!response.ok) {
        throw new Error(
            `FLUX.2 Pro ${response.status}: ${
                initial?.detail ||
                initial?.error ||
                JSON.stringify(initial)
            }`
        );
    }


    let prediction =
        initial;

    const deadline =
        Date.now() + 120000;


    while (
        prediction &&
        prediction.status !== "succeeded" &&
        prediction.status !== "failed" &&
        prediction.status !== "canceled" &&
        !prediction.output &&
        Date.now() < deadline
    ) {

        const statusUrl =
            prediction?.urls?.get;

        if (!statusUrl) {
            break;
        }

        await sleep(1500);

        const statusResponse =
            await fetch(
                statusUrl,
                {
                    headers: {
                        Authorization:
                            `Bearer ${TOKEN}`
                    }
                }
            );


        prediction =
            await readJson(
                statusResponse
            );


        if (!statusResponse.ok) {
            throw new Error(
                `FLUX.2 Pro status ${statusResponse.status}`
            );
        }
    }


    if (
        prediction?.status === "failed" ||
        prediction?.status === "canceled"
    ) {
        throw new Error(
            prediction?.error ||
            `FLUX.2 Pro ${prediction.status}.`
        );
    }


    const output =
        Array.isArray(prediction?.output)
            ? prediction.output[0]
            : prediction?.output;


    if (!output) {
        throw new Error(
            "FLUX.2 Pro returned no image URL."
        );
    }


    const imageResponse =
        await fetch(output);


    if (!imageResponse.ok) {
        throw new Error(
            `Unable to retrieve FLUX.2 Pro image: ${imageResponse.status}`
        );
    }


    const buffer =
        Buffer.from(
            await imageResponse.arrayBuffer()
        );


    if (!buffer.length) {
        throw new Error(
            "FLUX.2 Pro returned an empty image."
        );
    }


    return {
        buffer,

        mimeType:
            imageResponse.headers.get(
                "content-type"
            ) ||
            "image/jpeg",

        engine:
            "flux-2-pro",

        edited:
            isEdit
    };
}
