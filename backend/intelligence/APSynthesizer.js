import { completeWithRole } from "../models/APModelClient.js";

export async function synthesizeAnswer(messages, candidates, verification, intent) {
    const valid = candidates.filter(item => item.ok && item.text?.trim());

    if (valid.length === 1 && intent?.complexity <= 2) {
        return valid[0].text.trim();
    }

    const compactCandidates = valid.map((candidate, index) => ({
        index,
        specialty: candidate.role,
        answer: candidate.text,
    }));

    const system =
        "You are the AP Synapse synthesis layer. Produce the single best final answer to the user. " +
        "Use the strongest reasoning from the candidate analyses, correct contradictions, and omit weak or unsupported claims. " +
        "Do not mention candidates, internal models, providers, routing, judging, or synthesis. " +
        "Answer naturally as AP Synapse. Do not claim facts that the supplied analyses do not support.";

    const user =
        "Original conversation:\n" +
        JSON.stringify(messages) +
        "\n\nInternal candidate analyses:\n" +
        JSON.stringify(compactCandidates) +
        "\n\nVerifier result:\n" +
        JSON.stringify({
            selectedCandidate: verification?.winnerIndex,
            confidence: verification?.confidence,
            issues: verification?.issues,
        });

    try {
        return await completeWithRole(
            "synthesis",
            [
                { role: "system", content: system },
                { role: "user", content: user },
            ],
            {
                temperature: intent?.category === "creative" ? 0.7 : 0.2,
            }
        );
    } catch {
        return verification?.winner?.text || valid[0]?.text || "";
    }
}
