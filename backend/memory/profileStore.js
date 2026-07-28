const profiles = new Map();

export function getProfile(sessionId) {

    if (!profiles.has(sessionId)) {

        profiles.set(sessionId, {
            preferences: {},
            savedMemory: []
        });

    }

    return profiles.get(sessionId);

}

export function savePreference(sessionId, key, value) {

    const profile = getProfile(sessionId);

    profile.preferences[key] = value;

}

export function forgetPreference(sessionId, key) {

    const profile = getProfile(sessionId);

    delete profile.preferences[key];

}