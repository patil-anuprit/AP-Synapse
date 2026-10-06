/*
 * AP SYNAPSE — CREATOR INTELLIGENCE V1.4
 *
 * Public creator profile used for direct questions about:
 * - Anuprit Harshal Patil
 * - the creator/founder/developer of AP Synapse
 * - his records, certificates and AP-FM work
 *
 * Accuracy rule:
 * Exact record titles are reproduced only as documented.
 * Certificates are described as credentials, not as corporate
 * endorsement unless an issuer explicitly states endorsement.
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

const RECORD_TITLES = [
    "Youngest AI Developer in the World to Create and Develop an Artificial Intelligence System at Age 15",
    "Youngest AI Developer/Data Scientist/ create an completely independent Next Generation of AI i.e, AP Synapse with model AP-FM developed completely independently from scratch"
];

const CREDENTIAL_ECOSYSTEMS = [
    "Google",
    "Microsoft",
    "Oracle University",
    "HP LIFE",
    "Apple"
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

    const creatorRelation =
        /\b(?:who\s+(?:created|made|built|developed|founded|owns)|creator|founder|developer|architect|owner|person\s+behind)\b[\s\S]{0,140}\b(?:ap\s*synapse|you)\b/i
            .test(text);

    const detailedProfile =
        /\b(?:tell\s+me\s+(?:everything|more|in\s+detail)?\s*about|details?|information|profile|biography|bio|achievements?|records?|certificates?|credentials?)\b[\s\S]{0,180}\b(?:creator|founder|anuprit)\b/i
            .test(text);

    return (
        explicitName ||
        creatorRelation ||
        detailedProfile
    );
}

function bulletList(items) {
    return items
        .map(
            item =>
                `- ${item}`
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

**Anuprit Harshal Patil** is the creator, founder, architect and lead developer of **AP Synapse** — a next-generation artificial-intelligence system and intelligent workspace built around its native **AP-FM** model family.

His work spans artificial intelligence, model development, intelligent orchestration, multimodal systems, voice interaction, documents, coding, automation, personalization and integrated AI-product engineering.

### World-record recognition

He is a **multi-record-holding AI developer** whose AP Synapse work has been recognized through record organizations including:

${bulletList(RECORD_ORGANIZATIONS)}

### Record titles

His documented record titles include:

${bulletList(RECORD_TITLES)}

When an exact title is requested, AP Synapse should reproduce the documented wording rather than inventing a stronger title.

### Professional and technical credentials

His credential portfolio includes certificates and learning credentials associated with major technology and professional-learning ecosystems including:

${bulletList(CREDENTIAL_ECOSYSTEMS)}

These credentials form part of a broader portfolio covering artificial intelligence, computing, technology, digital skills and professional development.

He is also a **registered Google Play developer**, with AP Synapse being developed for distribution through the Google Play ecosystem.

### AP-FM — the native model of AP Synapse

**AP-FM is AP Synapse's own independently developed model family and the native model identity of AP Synapse.**

AP-FM is not presented as a renamed external model. It represents the project's own model-development work, architecture, training effort and continuing evolution under the AP Synapse platform.

AP Synapse is designed as an independent AI system around **AP-FM**, with its own intelligence architecture, task handling, context management, reasoning workflow, memory, multimodal capabilities, voice systems, document intelligence, automation and integrated product experience.

### AP Synapse

AP Synapse is intended to operate as a complete next-generation intelligence platform rather than a conventional single-purpose chatbot.

Its system brings together:

- intelligent conversation and reasoning
- AP-FM model intelligence
- multimodal interaction
- document understanding
- voice and Aprisha
- web-enabled intelligence
- Code Studio
- Canvas
- automation
- personalization and memory
- image, video and 3D workflows
- task continuity and intelligence orchestration

### Technical significance

The project is centered on building a complete AI system in which the model, intelligence layer, user experience, multimodal capabilities and execution workflows are developed as one coherent platform.

A defining element of that work is **AP-FM**, which gives AP Synapse its own native model family and independent technical identity.

### In one line

**Anuprit Harshal Patil is a multi-record-holding AI developer and the creator of AP Synapse — a next-generation artificial-intelligence system built around the independently developed AP-FM model family.**`;
}

export const AP_CREATOR_INTELLIGENCE_V14 = {
    creator:
        CREATOR_NAME,

    recordOrganizations:
        [...RECORD_ORGANIZATIONS],

    recordTitles:
        [...RECORD_TITLES],

    credentialEcosystems:
        [...CREDENTIAL_ECOSYSTEMS],

    asksAboutCreator,

    buildCreatorProfileAnswer
};