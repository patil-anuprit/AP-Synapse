import { detectIntent } from "./requestRouter.js";

export function analyze(message) {

    const intent = detectIntent(message);

    return {

        intent,

        timestamp: new Date().toISOString(),

        priority: "normal",

        workspace: "general"

    };

}