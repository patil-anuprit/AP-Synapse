// ======================================================
// AP SYNAPSE — HISTORY ENGINE v1
// ======================================================

const HISTORY_KEY = "ap_synapse_history";

function getHistory() {

    try {

        const saved =
            localStorage.getItem(HISTORY_KEY);

        return saved
            ? JSON.parse(saved)
            : [];

    } catch (error) {

        console.error(
            "History load error:",
            error
        );

        return [];

    }

}

function saveHistory(history) {

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
    );

}


// ======================================================
// CREATE CONVERSATION
// ======================================================

export function createConversation(title = "New Conversation") {

    const history = getHistory();

    const conversation = {

        id:
            Date.now().toString(),

        title,

        messages: [],

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };

    history.unshift(conversation);

    saveHistory(history);

    console.log(
        "✅ Conversation created:",
        conversation
    );

    return conversation;

}


// ======================================================
// GET ALL CONVERSATIONS
// ======================================================

export function getConversations() {

    return getHistory();

}


// ======================================================
// GET ONE CONVERSATION
// ======================================================

export function getConversation(id) {

    const history = getHistory();

    return history.find(
        conversation =>
            conversation.id === id
    );

}


// ======================================================
// ADD MESSAGE
// ======================================================

export function addMessage(
    conversationId,
    role,
    content
) {

    const history = getHistory();

    const conversation =
        history.find(
            item =>
                item.id === conversationId
        );

    if (!conversation) {

        console.warn(
            "Conversation not found:",
            conversationId
        );

        return null;

    }

    conversation.messages.push({

        role,

        content,

        timestamp:
            new Date().toISOString()

    });

    conversation.updatedAt =
        new Date().toISOString();

    saveHistory(history);

    return conversation;

}


// ======================================================
// DELETE CONVERSATION
// ======================================================

export function deleteConversation(id) {

    const history = getHistory();

    const updated =
        history.filter(
            conversation =>
                conversation.id !== id
        );

    saveHistory(updated);

    console.log(
        "🗑 Conversation deleted:",
        id
    );

}


// ======================================================
// SEARCH HISTORY
// ======================================================

export function searchHistory(query) {

    const history = getHistory();

    const search =
        query
            .trim()
            .toLowerCase();

    if (!search) {

        return history;

    }

    return history.filter(
        conversation => {

            const title =
                conversation.title
                    .toLowerCase();

            const messages =
                (conversation.messages || [])
                    .filter(message => message && typeof message === "object")
                    .map(message => message.content || "")
                    .join(" ")
                    .toLowerCase();

            return (
                title.includes(search) ||
                messages.includes(search)
            );

        }
    );

}

// ======================================================
// EDIT / TRUNCATE CONVERSATION
// ======================================================

export function truncateConversation(
    conversationId,
    messageIndex
) {

    const history = getHistory();

    const conversation =
        history.find(
            item =>
                item.id === conversationId
        );

    if (!conversation) {

        console.warn(
            "Conversation not found:",
            conversationId
        );

        return null;

    }

    if (
        !Array.isArray(conversation.messages) ||
        messageIndex < 0
    ) {

        return null;

    }

    // Keep everything BEFORE the edited message.
    conversation.messages =
        conversation.messages.slice(
            0,
            messageIndex
        );

    conversation.updatedAt =
        new Date().toISOString();

    saveHistory(history);

    console.log(
        "✏️ Conversation truncated:",
        conversationId,
        "before message:",
        messageIndex
    );

    return conversation;

}