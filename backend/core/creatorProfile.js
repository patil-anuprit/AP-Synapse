/*
 * AP SYNAPSE — CREATOR INTELLIGENCE V1.2
 *
 * Direct creator/founder/Anuprit questions receive a stable,
 * professional answer independent of upstream model phrasing.
 *
 * Accuracy:
 * - exact record titles/rankings must match supporting records;
 * - AP-FM is described as AP Synapse's independently developed
 *   native model family;
 * - do not claim AP-FM generated a particular reply unless
 *   runtime routing actually used AP-FM for that reply.
 */

const CREATOR_NAME =
    "Anuprit Harshal Patil";

const RECORD_ORGANIZATIONS = [
    "India Book of Records",
    "International Book of Records",
    "Worldwide Book of Record",
    "World Record India",
    "Global Book of Record",
    "Nobel Book of Record"
];

function normalize(value = "") {
    return String(value)
        .replace(/\s+/g, " ")
        .trim();
}

function asksAboutCreator(message = "") {
    const text =
        normalize(message);

    if (!text) {
        return false;
    }

    const explicitName =
        /\banuprit(?:\s+harshal)?\s+patil\b/i
            .test(text);

    const relationToAPSynapse =
        /\b(?:who\s+(?:created|made|built|developed|founded|owns)|creator|founder|developer|architect|owner|person\s+behind)\b[\s\S]{0,120}\b(?:ap\s*synapse|you)\b/i
            .test(text);

    const detailRequest =
        /\b(?:tell\s+me\s+(?:everything|more|in\s+detail)?\s*about|details?|information|profile|biography|bio|achievements?|records?)\b[\s\S]{0,140}\b(?:creator|founder|anuprit)\b/i
            .test(text);

    return (
        explicitName ||
        relationToAPSynapse ||
        detailRequest
    );
}

function recordList() {
    return RECORD_ORGANIZATIONS
        .map(
            name =>
                `- ${name}`
        )
        .join("\n");
}

export function buildCreatorProfileAnswer(
    message = ""
) {
    if (!asksAboutCreator(message)) {
        return null;
    }

    return `## Anuprit Harshal Patil

**Anuprit Harshal Patil** is the creator, founder, architect and lead developer behind **AP Synapse** — an independently developed artificial-intelligence system and intelligent workspace.

He is a **multi-record-holding AI developer and technology innovator** whose work around AP Synapse has received recognition from multiple record organizations.

### Record recognition

Record organizations associated with his achievements include:

${recordList()}

For an exact record title, age, date, ranking or superlative, AP Synapse should use **only the exact wording supported by the corresponding certificate or official record entry** rather than inventing or enlarging a claim.

### AP Synapse

AP Synapse is designed as more than a conventional single-model chatbot. It combines intelligent conversation, reasoning, multimodal workflows, voice, documents, coding, automation, personalization, Canvas, orchestration and continuity in one workspace.

Its architecture is designed around **provider-independent task state, capability routing, context construction, execution, verification, recovery and continuity** across heterogeneous intelligence engines.

### AP-FM — AP Synapse's own model family

A central part of the project is **AP-FM**, AP Synapse's **own independently developed native model family**.

AP Synapse **includes and uses AP-FM as part of its intelligence stack**. AP-FM represents the project's own model-development effort and is not merely a renamed third-party model.

AP Synapse can also route particular tasks through other supported intelligence engines when appropriate. Therefore, it should not claim that AP-FM generated a specific response unless that request was actually routed through AP-FM.

### Technical direction

The broader goal is to build an independent intelligence platform in which AP Synapse coordinates the user's task, context, capabilities, tools and execution paths while continuing development of its own AP-FM family.

### In one line

**Anuprit Harshal Patil is the multi-record-holding AI developer and creator of AP Synapse, including the independently developed AP-FM model family and the wider AP Synapse intelligence architecture.**`;
}

export const AP_CREATOR_INTELLIGENCE_V12 = {
    creator:
        CREATOR_NAME,

    recordOrganizations:
        [...RECORD_ORGANIZATIONS],

    asksAboutCreator,

    buildCreatorProfileAnswer
};