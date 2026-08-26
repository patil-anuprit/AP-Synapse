import "dotenv/config";

const TOKEN =
    process.env.REPLICATE_API_TOKEN || "";

const sleep =
    ms => new Promise(resolve => setTimeout(resolve, ms));


async function parseResponse(response) {

    const text =
        await response.text();

    try {
        return JSON.parse(text);
    }
    catch {
        return { detail: text };
    }
}


export async function runReplicateModel(
    model,
    input,
    {
        timeoutMs = 240000,
        pollMs = 2000
    } = {}
) {

    if (!TOKEN) {
        throw new Error(
            "REPLICATE_API_TOKEN is not configured."
        );
    }

    const endpoint =
        `https://api.replicate.com/v1/models/${model}/predictions`;

    const response =
        await fetch(
            endpoint,
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
                        input
                    })
            }
        );

    let prediction =
        await parseResponse(response);


    if (!response.ok) {

        throw new Error(
            prediction?.detail ||
            prediction?.error ||
            `${model} returned HTTP ${response.status}`
        );
    }


    const started =
        Date.now();


    while (
        prediction?.status !== "succeeded"
    ) {

        if (
            prediction?.status === "failed" ||
            prediction?.status === "canceled"
        ) {

            throw new Error(
                prediction?.error ||
                `${model} ${prediction?.status}`
            );
        }


        if (
            Date.now() - started >
            timeoutMs
        ) {

            throw new Error(
                `${model} timed out.`
            );
        }


        const statusUrl =
            prediction?.urls?.get;

        if (!statusUrl) {

            throw new Error(
                `${model} returned no polling URL.`
            );
        }


        await sleep(pollMs);


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
            await parseResponse(
                statusResponse
            );


        if (!statusResponse.ok) {

            throw new Error(
                `${model} polling failed: ${statusResponse.status}`
            );
        }
    }


    if (!prediction?.output) {

        throw new Error(
            `${model} returned no output.`
        );
    }


    return {
        output:
            prediction.output,

        requestId:
            prediction.id || null
    };
}
