export function buildReasoning(intent, message) {

    const reasoning = {

        intent,

        originalMessage: message,

        timestamp: Date.now(),

        confidence: 1.0,

        difficulty: "normal",

        responseStyle: "balanced",

        useMemory: true,

        useIdentity: true,

        useResearch: false,

        useCodeFormatting: false,

        useTeaching: false

    };

    switch (intent) {

        case "coding":

            reasoning.useCodeFormatting = true;
            reasoning.responseStyle = "technical";
            break;

        case "learning":

            reasoning.useTeaching = true;
            reasoning.responseStyle = "teacher";
            break;

        case "research":

            reasoning.useResearch = true;
            reasoning.responseStyle = "research";
            break;

        case "identity":

            reasoning.useIdentity = true;
            reasoning.responseStyle = "identity";
            break;

        case "planning":

            reasoning.responseStyle = "planner";
            break;

    }

    return reasoning;

}