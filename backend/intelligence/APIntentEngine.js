import { hasImageInput, lastUserText } from "./APUtils.js";

const patterns = {
    code: /\b(code|coding|javascript|typescript|python|java|node|npm|debug|bug|function|class|api|sql|html|css|react|git|powershell|terminal|compiler|repository)\b/i,
    math: /\b(calculate|equation|algebra|geometry|trigonometry|probability|derivative|integral|matrix|factor|solve|math|mathematics)\b/i,
    research: /\b(research|compare|investigate|evidence|sources|study|paper|analysis|report|market|latest|current)\b/i,
    planning: /\b(plan|strategy|roadmap|architecture|design|steps|build|implement|project|schedule)\b/i,
    summarization: /\b(summarize|summary|condense|extract|key points|tl;dr)\b/i,
    creative: /\b(write|story|poem|creative|caption|script|brainstorm|ideas)\b/i,
};

export function classifyIntent(messages = []) {
    const text = lastUserText(messages);
    const length = text.length;

    const flags = Object.fromEntries(
        Object.entries(patterns).map(([key, pattern]) => [key, pattern.test(text)])
    );

    const image = hasImageInput(messages);

    let category = "general";
    if (image) category = "vision";
    else if (flags.code) category = "code";
    else if (flags.math) category = "reasoning";
    else if (flags.research) category = "research";
    else if (flags.planning) category = "planning";
    else if (flags.summarization) category = "summarization";
    else if (flags.creative) category = "creative";

    let complexity = 1;
    if (length > 280) complexity++;
    if (length > 1000) complexity++;
    if (/\b(explain|why|prove|deep|detailed|comprehensive|all of|architecture|tradeoff)\b/i.test(text)) complexity++;
    if (flags.code || flags.math || flags.research || flags.planning) complexity++;
    if (image) complexity++;
    complexity = Math.min(5, complexity);

    return {
        category,
        complexity,
        image,
        flags,
        textLength: length,
        needsCouncil: complexity >= 3,
        needsVerification: complexity >= 3 || flags.math || flags.code || flags.research,
    };
}
