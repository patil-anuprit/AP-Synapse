import sharp from "sharp";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs/promises";
import mammoth from "mammoth";

export async function readDocument(file) {

    const extension =
        file.originalname
            .split(".")
            .pop()
            .toLowerCase();

    // ==========================
    // PDF
    // ==========================

    if (extension === "pdf") {

        const buffer = await fs.readFile(file.path);

        const pdf = await pdfjsLib.getDocument({
            data: new Uint8Array(buffer)
        }).promise;

        let text = "";

        for (let page = 1; page <= pdf.numPages; page++) {

            const p = await pdf.getPage(page);

            const content =
                await p.getTextContent();

            text += content.items
                .map(item => item.str)
                .join(" ");

            text += "\n\n";
        }

        return text;
    }

    // ==========================
    // TXT
    // ==========================

    if (extension === "txt") {

        return await fs.readFile(
            file.path,
            "utf8"
        );
    }

    // ==========================
    // DOCX
    // ==========================

    if (extension === "docx") {

        const result =
            await mammoth.extractRawText({
                path: file.path
            });

        return result.value;
    }

    // ==========================
    // IMAGES
    // ==========================

    if (
    extension === "png" ||
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "webp"
) {

    const optimizedBuffer = await sharp(file.path)
        .resize({
            width: 1600,
            height: 1600,
            fit: "inside",
            withoutEnlargement: true
        })
        .jpeg({
            quality: 80,
            mozjpeg: true
        })
        .toBuffer();

    return {
        type: "image",
        mimeType: "image/jpeg",
        dataUrl:
            `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`
    };
}

    throw new Error(
        `Unsupported document type: ${extension}`
    );
}