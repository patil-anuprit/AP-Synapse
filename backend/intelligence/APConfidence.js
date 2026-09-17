import { clamp } from "./APUtils.js";

export function calculateConfidence({
    intent,
    candidates,
    verification,
    answer,
}) {
    const valid = candidates.filter(item => item.ok && item.text?.trim()).length;
    const failed = candidates.length - valid;

    let score = Number(verification?.confidence ?? 0.55);

    if (valid >= 2) score += 0.05;
    if (valid >= 3) score += 0.03;
    if (failed) score -= failed * 0.08;
    if (!answer || answer.trim().length < 20) score -= 0.25;
    if (intent?.complexity >= 4) score -= 0.04;

    return clamp(score, 0.05, 0.98);
}
