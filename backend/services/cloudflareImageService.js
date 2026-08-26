import "dotenv/config";

const ACCOUNT_ID =
    process.env.CLOUDFLARE_ACCOUNT_ID || "";

const TOKEN =
    process.env.CLOUDFLARE_API_TOKEN || "";

const MODEL =
    "@cf/black-forest-labs/flux-1-schnell";

export async function generateCloudflareImage(prompt) {

    if (!ACCOUNT_ID || !TOKEN) {
        throw new Error(
            "Cloudflare image provider is not configured."
        );
    }

    const cleanPrompt =
        String(prompt || "").trim();

    if (!cleanPrompt) {
        throw new Error(
            "Image prompt is required."
        );
    }

    console.log(
        "AP SYNAPSE IMAGE ENGINE -> CLOUDFLARE FLUX.1 SCHNELL"
    );

    const response =
        await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`,
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${TOKEN}`,
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        prompt: cleanPrompt,
                        steps: 4
                    })
            }
        );

    const data =
        await response.json()
            .catch(() => null);

    if (
        !response.ok ||
        data?.success !== true ||
        !data?.result?.image
    ) {
        throw new Error(
            "Cloudflare image generation is temporarily unavailable."
        );
    }

    const buffer =
        Buffer.from(
            data.result.image,
            "base64"
        );

    if (!buffer.length) {
        throw new Error(
            "Cloudflare returned an empty image."
        );
    }

    return {
        buffer,
        mimeType: "image/jpeg",
        engine: "cloudflare-flux-1-schnell"
    };
}
