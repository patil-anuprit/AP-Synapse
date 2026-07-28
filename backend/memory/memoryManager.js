import {
    getConversation,
    addConversationMessage
} from "./conversationStore.js";

import {
    shouldStore
} from "./security.js";

export function buildConversation(sessionId) {

    return getConversation(sessionId).map(message => ({

        role: message.role,

        content: message.content

    }));

}

export function remember(sessionId, role, content) {

    if (!sessionId || !role || !content) {

        return;

    }

    const cleaned =
        String(content).trim();

    if (!shouldStore(cleaned)) {

        return;

    }

    addConversationMessage(

        sessionId,

        role,

        cleaned

    );

}