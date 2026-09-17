function endsAbruptly(text) {
    const value = String(text || "").trim();

    if (!value || value.length < 24) {
        return true;
    }

    return /(?:\b(and|or|because|therefore|which|that|the|a|an|to|of|for|with|by|from|in|on|at|is|are|was|were)|[,;:-])$/i
        .test(value);
}

function suspiciousMetaTalk(text) {
    return /\b(as an ai|language model|internal model|candidate answer|verifier result|system prompt|hidden instruction)\b/i
        .test(String(text || ""));
}

function unwrapExactTarget(value) {
    let text = String(value || "").trim();

    const pairs = [
        ['"', '"'],
        ["'", "'"],
        ["`", "`"]
    ];

    for (const [left, right] of pairs) {
        if (
            text.startsWith(left) &&
            text.endsWith(right) &&
            text.length >= 2
        ) {
            text = text.slice(
                left.length,
                text.length - right.length
            ).trim();
            break;
        }
    }

    return text;
}

function exactRequestedText(prompt) {
    const source = String(prompt || "").trim();

    const patterns = [
        /\b(?:reply|respond|answer)\b[\s\S]*?\bexactly\b[\s\S]*?:\s*(.+)$/i,
        /\b(?:reply|respond|answer)\b[\s\S]*?\bonly\b[\s\S]*?:\s*(.+)$/i
    ];

    for (const pattern of patterns) {
        const match = source.match(pattern);

        if (match && match[1]) {
            return unwrapExactTarget(match[1]);
        }
    }

    return "";
}

export function evaluateAnswerQuality(
    answer,
    intent = {},
    prompt = ""
) {
    const text = String(answer || "").trim();
    const issues = [];

    const exactTarget =
        exactRequestedText(prompt);

    if (
        exactTarget &&
        text === exactTarget
    ) {
        return {
            pass: true,
            issues: [],
            score: 1,
            exactInstruction: true
        };
    }

    if (!text) {
        issues.push("empty-answer");
    }

    if (text.length < 24) {
        issues.push("too-short");
    }

    if (endsAbruptly(text)) {
        issues.push("possibly-truncated");
    }

    if (suspiciousMetaTalk(text)) {
        issues.push("internal-meta-talk");
    }

    if (
        intent &&
        intent.category === "code" &&
        !/[`{}();=]|\b(function|const|let|class|def|return)\b/.test(text)
    ) {
        issues.push(
            "code-request-without-code"
        );
    }

    if (
        intent &&
        intent.flags &&
        intent.flags.math &&
        !/\d/.test(text)
    ) {
        issues.push(
            "math-request-without-numeric-content"
        );
    }

    return {
        pass: issues.length === 0,
        issues,
        score:
            Math.max(
                0,
                1 - issues.length * 0.2
            ),
        exactInstruction: false
    };
}
