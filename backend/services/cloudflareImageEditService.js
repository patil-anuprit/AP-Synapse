import "dotenv/config";

// AP_CLOUDFLARE_IMAGE_EDIT_V1

const ACCOUNT_ID =
    String(process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();

const TOKEN =
    String(process.env.CLOUDFLARE_API_TOKEN || "").trim();

const MODEL =
    "@cf/runwayml/stable-diffusion-v1-5-img2img";


function getBase64(image) {

    const value =
        String(image || "").trim();

    const match =
        value.match(
            /^data:image\/[^;]+;base64,([\s\S]+)$/i
        );

    return (
        match
            ? match[1]
            : value
    ).replace(/\s+/g, "");
}


export async function generateCloudflareImageEdit(
    prompt,
    inputImages = []
) {

    if (!ACCOUNT_ID || !TOKEN) {
        throw new Error(
            "Cloudflare Workers AI credentials are not configured."
        );
    }

    const source =
        Array.isArray(inputImages)
            ? inputImages[0]
            : inputImages;

    const image_b64 =
        getBase64(source);

    if (!image_b64) {
        throw new Error(
            "Source image is required for Cloudflare editing."
        );
    }

    const cleanPrompt =
        String(prompt || "").trim();

    if (!cleanPrompt) {
        throw new Error(
            "Image edit instruction is required."
        );
    }

    console.log(
        "AP SYNAPSE IMAGE ENGINE -> CLOUDFLARE IMG2IMG"
    );

    const url =
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;

    const response =
        await fetch(
            url,
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
                        prompt:
                            cleanPrompt,

                        image_b64,

                        strength:
                            0.55,

                        guidance:
                            7.5,

                        num_steps:
                            20,

                        negative_prompt:
                            "Do not change the person's identity, face, body, pose, clothing, lighting, camera angle, background or other details unless explicitly requested."
                    })
            }
        );

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    const raw =
        Buffer.from(
            await response.arrayBuffer()
        );

    if (!response.ok) {

        throw new Error(
            `Cloudflare img2img ${response.status}: ${raw
                .toString("utf8")
                .slice(0, 1000)}`
        );
    }

    /*
     * Workers AI image models may return either
     * image bytes or a JSON/base64 envelope.
     */
    if (
        contentType.includes(
            "application/json"
        )
    ) {

        const data =
            JSON.parse(
                raw.toString("utf8")
            );

        let base64 =
            data?.result?.image ??
            data?.result;

        if (
            typeof base64 === "string"
        ) {

            base64 =
                base64.replace(
                    /^data:image\/[^;]+;base64,/i,
                    ""
                );

            return {
                buffer:
                    Buffer.from(
                        base64,
                        "base64"
                    ),

                mimeType:
                    "image/png",

                engine:
                    "cloudflare-sd15-img2img",

                edited:
                    true
            };
        }

        throw new Error(
            "Cloudflare returned no edited image."
        );
    }

    if (!raw.length) {
        throw new Error(
            "Cloudflare returned an empty image."
        );
    }

    return {
        buffer:
            raw,

        mimeType:
            contentType.startsWith("image/")
                ? contentType.split(";")[0]
                : "image/png",

        engine:
            "cloudflare-sd15-img2img",

        edited:
            true
    };
}
