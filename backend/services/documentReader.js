import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs/promises";

export async function readDocument(file) {

    const extension =
        file.originalname
            .split(".")
            .pop()
            .toLowerCase();

    // =====================
    // PDF
    // =====================

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

    // =====================
    // TXT
    // =====================

    if (extension === "txt") {

        return await fs.readFile(
            file.path,
            "utf8"
        );

    }

    return "Unsupported document type.";

}