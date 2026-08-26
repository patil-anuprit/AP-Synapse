import "dotenv/config";

const TOKEN =
    process.env.REPLICATE_API_TOKEN || "";

const sleep =
    ms => new Promise(resolve => setTimeout(resolve, ms));


// =========================================================
// AP VISUAL PROVIDER HEALTH V1
// =========================================================

let replicateBlockedUntil = 0;
let replicateLastReason = "";

const COOLDOWN_MS =
    10 * 60 * 1000;


function providerUnavailableMessage() {
    return "Visual generation is temporarily at capacity.";
}


function detectCapacityFailure(message) {

    return /insufficient credit|billing|payment|required|quota|rate limit|429|402/i.test(
        String(message || "")
    );
}


function markReplicateUnavailable(reason) {

    replicateBlockedUntil =
        Date.now() + COOLDOWN_MS;

    replicateLastReason =
        String(reason || "");

    console.warn(
        "AP VISUAL MESH -> Replicate cooldown enabled for 10 minutes."
    );
}


export function isReplicateAvailable() {

    return Date.now() >=
        replicateBlockedUntil;
}


export function getReplicateHealth() {

    return {
        available:
            isReplicateAvailable(),

        retryAfterMs:
            Math.max(
                0,
                replicateBlockedUntil - Date.now()
            )
    };
}


async function parseResponse(response) {

    const text =
        await response.text();

    try {
        return JSON.parse(text);
    }
    catch {
        return {
            detail: text
        };
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
            "Visual generation is temporarily unavailable."
        );
    }


    // =====================================================
    // FAST FAIL WHILE PROVIDER IS KNOWN TO BE UNAVAILABLE
    // =====================================================

    if (!isReplicateAvailable()) {

        console.warn(
            "AP VISUAL MESH -> Replicate skipped due to active cooldown."
        );

        const error =
            new Error(
                providerUnavailableMessage()
            );

        error.code =
            "PROVIDER_COOLDOWN";

        throw error;
    }


    const endpoint =
        `https://api.replicate.com/v1/models/${model}/predictions`;


    try {

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
            await parseResponse(
                response
            );


        if (!response.ok) {

            const reason =
                prediction?.detail ||
                prediction?.error ||
                `${model} returned HTTP ${response.status}`;


            if (
                detectCapacityFailure(
                    reason
                )
            ) {

                markReplicateUnavailable(
                    reason
                );

                const error =
                    new Error(
                        providerUnavailableMessage()
                    );

                error.code =
                    "PROVIDER_CAPACITY";

                throw error;
            }


            throw new Error(
                reason
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

                const reason =
                    prediction?.error ||
                    `${model} ${prediction?.status}`;


                if (
                    detectCapacityFailure(
                        reason
                    )
                ) {

                    markReplicateUnavailable(
                        reason
                    );

                    const error =
                        new Error(
                            providerUnavailableMessage()
                        );

                    error.code =
                        "PROVIDER_CAPACITY";

                    throw error;
                }


                throw new Error(
                    reason
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


            await sleep(
                pollMs
            );


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
                    `${model} polling failed.`
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
                prediction.id ||
                null
        };

    }
    catch (error) {

        const message =
            String(
                error?.message ||
                error ||
                ""
            );


        if (
            detectCapacityFailure(
                message
            )
        ) {

            markReplicateUnavailable(
                message
            );

            const clean =
                new Error(
                    providerUnavailableMessage()
                );

            clean.code =
                "PROVIDER_CAPACITY";

            throw clean;
        }


        throw error;
    }
}
