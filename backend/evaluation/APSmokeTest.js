import { solveAP } from "../intelligence/APIntelligenceCore.js";

const result = await solveAP([
    {
        role: "user",
        content: "Reply with exactly: AP Unified Intelligence is online"
    }
]);

console.log(result.answer);
console.log(JSON.stringify({
    confidence: result.confidence,
    intent: result.intent,
    route: result.route,
    telemetry: result.telemetry,
}, null, 2));
