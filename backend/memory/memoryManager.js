
import {
    getConversation,
    addConversationMessage
} from "./conversationStore.js";

import {
    shouldStore
} from "./security.js";


export async function buildConversation(
    sessionId
) {

    const history =
        await getConversation(
            sessionId
        );

    return history.map(
        message => ({

            role:
                message.role,

            content:
                message.content

        })
    );
}


export async function remember(
    sessionId,
    role,
    content
) {

    if (
        !sessionId ||
        !role ||
        !content
    ) {
        return;
    }

    /*
     * Preserve image/document objects.
     */

    if (
        typeof content ===
        "object"
    ) {

        await addConversationMessage(
            sessionId,
            role,
            content
        );

        return;
    }

    const cleaned =
        String(content)
            .trim();

    if (!cleaned) {
        return;
    }

    if (
        !shouldStore(
            cleaned
        )
    ) {
        return;
    }

    await addConversationMessage(
        sessionId,
        role,
        cleaned
    );
}
