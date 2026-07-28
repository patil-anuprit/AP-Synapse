export function detectIntent(message) {

    const text = message.toLowerCase();

    if (
        text.includes("who created you") ||
        text.includes("who made you") ||
        text.includes("owner") ||
        text.includes("developer") ||
        text.includes("founder")
    ) {

        return "identity";

    }

    if (
        text.includes("code") ||
        text.includes("javascript") ||
        text.includes("python") ||
        text.includes("html") ||
        text.includes("css")
    ) {

        return "coding";

    }

    if (
        text.includes("study") ||
        text.includes("science") ||
        text.includes("math") ||
        text.includes("physics") ||
        text.includes("chemistry")
    ) {

        return "learning";

    }

    if (
        text.includes("plan") ||
        text.includes("roadmap") ||
        text.includes("strategy")
    ) {

        return "planning";

    }

    return "general";

}