import {
    tokenize
} from "./APTextChunker.js";

function frequencies(tokens) {
    const map =
        new Map();

    for (const token of tokens) {
        map.set(
            token,
            (map.get(token) || 0) + 1
        );
    }

    return map;
}

export function lexicalScore(
    query,
    text
) {
    const qTokens =
        tokenize(query);

    const tTokens =
        tokenize(text);

    if (
        !qTokens.length ||
        !tTokens.length
    ) {
        return 0;
    }

    const qFreq =
        frequencies(qTokens);

    const tFreq =
        frequencies(tTokens);

    let overlap = 0;
    let coverage = 0;

    for (
        const [token, count]
        of qFreq.entries()
    ) {
        const found =
            tFreq.get(token) || 0;

        if (found > 0) {
            coverage += 1;

            overlap +=
                Math.min(
                    count,
                    found
                );
        }
    }

    const coverageScore =
        coverage /
        qFreq.size;

    const densityScore =
        overlap /
        Math.max(
            1,
            qTokens.length
        );

    const phraseBonus =
        String(text)
            .toLowerCase()
            .includes(
                String(query)
                    .trim()
                    .toLowerCase()
            )
            ? 0.35
            : 0;

    return (
        coverageScore * 0.7 +
        densityScore * 0.3 +
        phraseBonus
    );
}

export function rankTextItems(
    query,
    items,
    {
        topK = 5,
        getText =
            item =>
                item.text || ""
    } = {}
) {
    return items
        .map(item => ({
            ...item,
            retrievalScore:
                lexicalScore(
                    query,
                    getText(item)
                )
        }))
        .filter(
            item =>
                item.retrievalScore >
                0
        )
        .sort(
            (a, b) =>
                b.retrievalScore -
                a.retrievalScore
        )
        .slice(
            0,
            Math.max(
                1,
                topK
            )
        );
}
