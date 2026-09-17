export function normalizeText(value = "") {
    return String(value)
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export function tokenize(value = "") {
    return normalizeText(value)
        .toLowerCase()
        .match(/[a-z0-9][a-z0-9_-]*/g) || [];
}

export function chunkText(
    text,
    {
        maxChars = 1200,
        overlapChars = 180
    } = {}
) {
    const clean = normalizeText(text);

    if (!clean) {
        return [];
    }

    const paragraphs =
        clean
            .split(/\n{2,}/)
            .map(part => part.trim())
            .filter(Boolean);

    const chunks = [];
    let current = "";

    const flush = () => {
        const value = current.trim();

        if (!value) {
            return;
        }

        chunks.push(value);

        const overlap =
            value.slice(
                Math.max(
                    0,
                    value.length - overlapChars
                )
            );

        current = overlap;
    };

    for (const paragraph of paragraphs) {
        if (
            current &&
            current.length +
                paragraph.length +
                2 >
                maxChars
        ) {
            flush();
        }

        if (
            paragraph.length >
            maxChars
        ) {
            let cursor = 0;

            while (
                cursor <
                paragraph.length
            ) {
                const piece =
                    paragraph.slice(
                        cursor,
                        cursor + maxChars
                    );

                if (current) {
                    flush();
                }

                chunks.push(
                    piece.trim()
                );

                cursor +=
                    Math.max(
                        1,
                        maxChars -
                            overlapChars
                    );
            }

            current = "";
            continue;
        }

        current +=
            (current ? "\n\n" : "") +
            paragraph;
    }

    if (current.trim()) {
        chunks.push(
            current.trim()
        );
    }

    return chunks.filter(Boolean);
}
