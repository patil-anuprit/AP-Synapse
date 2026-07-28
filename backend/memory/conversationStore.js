const conversations = new Map();

const MAX_HISTORY = 20;

export function getConversation(sessionId) {

    if (!conversations.has(sessionId)) {
        conversations.set(sessionId, []);
    }

    return [...conversations.get(sessionId)];

}

export function addConversationMessage(sessionId, role, content) {

    if (!conversations.has(sessionId)) {

        conversations.set(sessionId, []);

    }

    const history = conversations.get(sessionId);

    history.push({

    role,
    content

});

    while (history.length > MAX_HISTORY) {

        history.shift();

    }

}

export function clearConversation(sessionId) {

    conversations.delete(sessionId);

}