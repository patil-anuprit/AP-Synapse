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

    let data = null;

    try {
        data = JSON.parse(text);
    }
    catch {
        data = {
            detail: text
        };
    }

    return data;
}


export async function generateFlux2ProImage(prompt) {

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

    console.log(
        "AP SYNAPSE IMAGE ENGINE -> FLUX.2 PRO"
    );

    console.log(
        "Prompt:",
        cleanPrompt
    );


    // -------------------------------------------------
    // Create generation
    // -------------------------------------------------

    const response =
        await fetch(
            ENDPOINT,
            {
                method: "POST",

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
                        input: {
                            prompt:
                                cleanPrompt,

                            resolution:
                                "1 MP",

                            aspect_ratio:
                                "1:1",

                            output_format:
                                "png",

                            output_quality:
                                100,

                            safety_tolerance:
                                2
                        }
                    })
            }
        );


    const initial =
        await readJson(response);


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


    // -------------------------------------------------
    // Poll only if Replicate didn't finish synchronously
    // -------------------------------------------------

    for (
        let attempt = 0;
        attempt < 30 &&
        prediction?.status !== "succeeded";
        attempt++
    ) {

        if (
            prediction?.status === "failed" ||
            prediction?.status === "canceled"
        ) {

            throw new Error(
                prediction?.error ||
                `FLUX.2 Pro generation ${prediction?.status}.`
            );
        }


        const statusUrl =
            prediction?.urls?.get;

        if (!statusUrl) {
            break;
        }


        await sleep(2000);


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
        prediction?.status !== "succeeded"
    ) {

        throw new Error(
            "FLUX.2 Pro generation did not complete in time."
        );
    }


    // -------------------------------------------------
    // Download generated image
    // -------------------------------------------------

    const output =
        Array.isArray(prediction.output)
            ? prediction.output[0]
            : prediction.output;


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


    console.log(
        "FLUX.2 PRO IMAGE GENERATED"
    );

    console.log(
        "Buffer size:",
        buffer.length
    );


    return {
        buffer,

        mimeType:
            imageResponse.headers.get(
                "content-type"
            ) ||
            "image/png",

        engine:
            "flux-2-pro"
    };
}
