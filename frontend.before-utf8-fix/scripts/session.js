const STORAGE_KEY = "ap_synapse_session";

function generateSessionId() {

    if (window.crypto?.randomUUID) {

        return crypto.randomUUID();

    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2)
    );

}

export function getSessionId() {

    let id =
        localStorage.getItem(STORAGE_KEY);

    if (!id) {

        id = generateSessionId();

        localStorage.setItem(
            STORAGE_KEY,
            id
        );

    }

    return id;

}