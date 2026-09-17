import { solveAP } from "./APIntelligenceCore.js";
import { textToOpenAIStream } from "./APUtils.js";

export async function createAPUnifiedStream(messages, options = {}) {
    const result = await solveAP(messages, options);
    return textToOpenAIStream(result.answer);
}
