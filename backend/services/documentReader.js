import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs/promises";
import mammoth from "mammoth";
import path from "path";

export async function readDocument(file) {

    const extension =
        path.extname(file.originalname)
            .toLowerCase();

    // ==========================
    // PDF
    // ==========================

    if (extension === ".pdf") {

        const buffer =
            await fs.readFile(file.path);

        const pdf =
            await pdfjsLib.getDocument({
                data: new Uint8Array(buffer)
            }).promise;

        let text = "";

        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {

            const page =
                await pdf.getPage(pageNumber);

            const content =
                await page.getTextContent();

            const pageText =
                content.items
                    .map(item => item.str || "")
                    .join(" ");

            text += pageText;
            text += "\n\n";

        }

        return text.trim();

    }

    // ==========================
    // TXT
    // ==========================

    if (extension === ".txt") {

        return (
            await fs.readFile(
                file.path,
                "utf8"
            )
        ).trim();

    }

    // ==========================
    // DOCX
    // ==========================

    if (extension === ".docx") {

        const result =
            await mammoth.extractRawText({
                path: file.path
            });

        return result.value.trim();

    }

    // ==========================
    // CSV
    // ==========================

    if (extension === ".csv") {

        return (
            await fs.readFile(
                file.path,
                "utf8"
            )
        ).trim();

    }

    // ==========================
    // XLS / XLSX
    // ==========================

    if (
        extension === ".xls" ||
        extension === ".xlsx"
    ) {

        try {

            const XLSX =
                await import("xlsx");

            const workbook =
                XLSX.readFile(file.path);

            let output = "";

            for (
                const sheetName
                of workbook.SheetNames
            ) {

                const sheet =
                    workbook.Sheets[sheetName];

                output +=
                    `\n\n=== Sheet: ${sheetName} ===\n\n`;

                output +=
                    XLSX.utils.sheet_to_csv(sheet);

            }

            return output.trim();

        } catch (error) {

            throw new Error(
                `Spreadsheet reading failed: ${error.message}`
            );

        }

    }

    // ==========================
    // IMAGES
    // ==========================

    if (
        extension === ".png" ||
        extension === ".jpg" ||
        extension === ".jpeg" ||
        extension === ".webp"
    ) {

        return "[IMAGE_FILE]";

    }

    // ==========================
    // Unsupported
    // ==========================

    throw new Error(
        `Unsupported document type: ${extension}`
    );

}