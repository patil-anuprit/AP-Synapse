import "dotenv/config";

import {
    Client,
    handle_file
} from "@gradio/client";

import {
    generateCloudflareImage
} from "./cloudflareImageService.js";


const SPACE =
    "stabilityai/TripoSR";


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

        if (
            typeof value.url === "string" &&
            value.url
        ) {
            return value.url;
        }

        for (const item of Object.values(value)) {

            const url =
                findUrl(item);

            if (url) return url;
        }
    }

    return "";
}


async function getReferenceImage(
    prompt,
    imageUrl
) {

    if (imageUrl) {

        const response =
            await fetch(imageUrl);

        if (!response.ok) {
            throw new Error(
                "Unable to read reference image."
            );
        }

        return Buffer.from(
            await response.arrayBuffer()
        );
    }


    const optimizedPrompt = `
Create a clean 3D reconstruction reference image of:
${prompt}

Requirements:
single isolated object,
entire object fully visible,
centered composition,
neutral plain background,
clear silhouette,
realistic materials,
balanced studio lighting,
no text,
no watermark,
no extra objects.
`.trim();


    const image =
        await generateCloudflareImage(
            optimizedPrompt
        );


    return image.buffer;
}


const AP_3D_TIMEOUT_V1 = 150000;

function with3DTimeout(promise, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(
                () => reject(
                    new Error(`${label} timed out`)
                ),
                AP_3D_TIMEOUT_V1
            )
        )
    ]);
}

export async function generateAP3D({
    prompt = "",
    imageUrl = null,
    faceCount = 256000
} = {}) {

    const cleanPrompt =
        String(prompt || "").trim();

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


    console.log(
        "AP VISUAL MESH -> FREE TRIPOSR 3D"
    );


    try {

        console.log("AP 3D -> Creating reference image");

        const referenceBuffer =
            await getReferenceImage(
                cleanPrompt,
                cleanImageUrl
            );

        console.log(
            "AP 3D -> Reference image ready:",
            referenceBuffer.length,
            "bytes"
        );


        const options =
            process.env.HF_TOKEN
                ? { token: process.env.HF_TOKEN }
                : {};


        console.log("AP 3D -> Connecting to TripoSR");

        const app =
            await with3DTimeout(
                Client.connect(
                    SPACE,
                    {
                        ...options,
                        events: ["data", "status"]
                    }
                ),
                "TripoSR connection"
            );

        console.log("AP 3D -> TripoSR connected");


        // -----------------------------------------------
        // Preprocess/reference cleanup
        // -----------------------------------------------

        console.log("AP 3D -> Preprocessing reference");

        const preprocess =
            await with3DTimeout(
                app.predict(
                    "/preprocess",
                    [
                        handle_file(referenceBuffer),
                        true,
                        0.85
                    ]
                ),
                "TripoSR preprocessing"
            );

        console.log("AP 3D -> Preprocessing complete");


        const processed =
            preprocess?.data?.[0];

        const processedUrl =
            findUrl(processed);


        // If the intermediate URL cannot be resolved,
        // safely reuse the original image buffer.
        const finalImage =
            processedUrl
                ? handle_file(processedUrl)
                : handle_file(referenceBuffer);


        // -----------------------------------------------
        // Generate OBJ + GLB
        // -----------------------------------------------

        console.log(
            "AP 3D -> Joining free ZeroGPU queue"
        );

        const submission =
            app.submit(
                "/generate",
                [
                    finalImage,
                    128
                ]
            );

        let generated = null;
        let queueTimedOut = false;

        const queueTimer =
            setTimeout(
                () => {

                    queueTimedOut = true;

                    try {
                        submission.cancel();
                    }
                    catch {}

                },
                AP_3D_TIMEOUT_V1
            );

        try {

            for await (const event of submission) {

                if (event?.type === "status") {

                    const position =
                        Number.isFinite(event.position)
                            ? event.position
                            : "?";

                    const eta =
                        Number.isFinite(event.eta)
                            ? `${Math.max(0, Math.round(event.eta))}s`
                            : "?";

                    console.log(
                        `AP 3D QUEUE -> ${event.stage || "pending"} | position ${position} | ETA ${eta}`
                    );
                }

                if (event?.type === "data") {

                    generated = {
                        data: event.data
                    };
                }
            }

        }
        finally {

            clearTimeout(queueTimer);
        }

        if (queueTimedOut) {
            throw new Error(
                "Free 3D GPU queue timed out."
            );
        }

        if (!generated?.data) {
            throw new Error(
                "TripoSR queue completed without model output."
            );
        }

        console.log(
            "AP 3D -> Mesh generation complete"
        );


        const obj =
            generated?.data?.[0];

        const glb =
            generated?.data?.[1];


        // Prefer GLB.
        const glbUrl =
            findUrl(glb);

        const objUrl =
            findUrl(obj);

        const url =
            glbUrl ||
            objUrl;


        if (!url) {

            console.error(
                "TRIPOSR raw result:",
                JSON.stringify(generated?.data)
            );

            throw new Error(
                "No 3D model URL returned."
            );
        }


        console.log(
            "AP FREE 3D -> SUCCESS"
        );


        return {
            success: true,
            type: "3d",
            status: "completed",
            engine: "hf-triposr-free",
            format:
                glbUrl
                    ? "glb"
                    : "obj",
            url
        };

    }
    catch (error) {

        console.error(
            "FREE 3D FAILED:",
            error?.message || error
        );


        const clean =
            new Error(
                "3D generation is temporarily busy. Please try again shortly."
            );

        clean.code =
            "3D_FREE_CAPACITY";

        throw clean;
    }
}
