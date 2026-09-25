(() => {
    "use strict";

    if (
        window.__AP_PROFILE_PREMIUM_V2__
    ) {
        return;
    }

    window.__AP_PROFILE_PREMIUM_V2__ =
        true;

    function cleanText(
        value
    ) {
        return String(
            value ||
            ""
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    function initialsFromName(
        name
    ) {
        const words =
            cleanText(
                name
            )
                .split(" ")
                .filter(Boolean);

        if (!words.length) {
            return "AP";
        }

        if (words.length === 1) {
            return words[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return (
            words[0][0] +
            words[
                words.length - 1
            ][0]
        )
            .toUpperCase();
    }

    function decorateProfile() {
        const card =
            document.getElementById(
                "profileCard"
            );

        if (!card) {
            return false;
        }

        card.classList.add(
            "ap-profile-premium-v2"
        );

        const kicker =
            card.querySelector(
                ".popup-kicker"
            );

        if (kicker) {
            kicker.textContent =
                "AP SYNAPSE · IDENTITY";
        }

        const title =
            card.querySelector(
                ".popup-header h2"
            );

        if (title) {
            title.textContent =
                "Identity";
        }

        const profileName =
            document.getElementById(
                "profileName"
            );

        const avatar =
            document.getElementById(
                "profileAvatar"
            );

        if (
            profileName &&
            avatar
        ) {
            const name =
                cleanText(
                    profileName
                        .textContent
                );

            if (name) {
                avatar.textContent =
                    initialsFromName(
                        name
                    );

                avatar.setAttribute(
                    "aria-label",
                    `${name} profile`
                );
            }
        }

        const auth =
            document.getElementById(
                "authenticatedStatus"
            );

        if (auth) {
            const text =
                cleanText(
                    auth.textContent
                )
                    .toLowerCase();

            const connected =
                !(
                    text.includes(
                        "not authenticated"
                    ) ||
                    text.includes(
                        "not signed"
                    ) ||
                    text.includes(
                        "signed out"
                    )
                );

            auth.dataset.authState =
                connected
                    ? "connected"
                    : "disconnected";
        }

        const googleStatus =
            document.getElementById(
                "googleConnectionStatus"
            );

        if (googleStatus) {
            const state =
                cleanText(
                    googleStatus
                        .textContent
                )
                    .toLowerCase();

            card.dataset.googleState =
                state.includes(
                    "not connected"
                )
                    ? "disconnected"
                    : "connected";
        }

        const googleCopy =
            card.querySelector(
                ".google-identity-copy"
            );

        if (googleCopy) {
            const heading =
                googleCopy.querySelector(
                    "h4"
                );

            const paragraph =
                googleCopy.querySelector(
                    "p"
                );

            if (heading) {
                heading.textContent =
                    "Google account";
            }

            if (paragraph) {
                paragraph.textContent =
                    "Secure sign-in for your AP Synapse identity.";
            }
        }

        return true;
    }

    function scheduleDecorate() {
        requestAnimationFrame(
            () => {
                decorateProfile();
            }
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            scheduleDecorate,
            {
                once: true
            }
        );
    }
    else {
        scheduleDecorate();
    }

    document.addEventListener(
        "click",
        event => {
            const opener =
                event.target
                    ?.closest?.(
                        "#profileBtn, #apRailProfile, [aria-label='Profile'], [data-tooltip='Profile']"
                    );

            if (opener) {
                setTimeout(
                    decorateProfile,
                    0
                );

                setTimeout(
                    decorateProfile,
                    180
                );
            }
        },
        true
    );

    window.APProfilePremiumV2 = {
        version:
            "2.0.0",

        refresh:
            decorateProfile,

        status() {
            const card =
                document.getElementById(
                    "profileCard"
                );

            return {
                ready:
                    Boolean(card),
                active:
                    Boolean(
                        card?.classList
                            .contains(
                                "ap-profile-premium-v2"
                            )
                    ),
                googleState:
                    card?.dataset
                        ?.googleState ||
                    "unknown"
            };
        }
    };

    console.log(
        "✦ AP SYNAPSE PREMIUM IDENTITY PROFILE V2 READY"
    );
})();
// ============================================================
// AP_PROFILE_GUEST_GOOGLE_V21
// Professional signed-out identity + automatic Google identity.
// ============================================================

(() => {
    "use strict";

    if (window.__AP_PROFILE_GUEST_GOOGLE_V21__) {
        return;
    }

    window.__AP_PROFILE_GUEST_GOOGLE_V21__ = true;

    let lastMode = "";
    let timer = null;

    function clean(value) {
        return String(value || "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function hasRealEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(clean(value));
    }

    function authenticated(card) {
        const auth =
            document.getElementById(
                "authenticatedStatus"
            );

        const email =
            document.getElementById(
                "profileEmail"
            );

        const google =
            document.getElementById(
                "googleConnectionStatus"
            );

        const authText =
            clean(auth?.textContent)
                .toLowerCase();

        const googleText =
            clean(google?.textContent)
                .toLowerCase();

        let stored = false;

        try {
            stored =
                localStorage.getItem(
                    "apSynapseAuthenticated"
                ) === "true";
        }
        catch (_) {}

        const positiveAuthText =
            authText === "authenticated" ||
            authText.includes("google verified") ||
            authText.includes("verified account");

        const positiveGoogle =
            Boolean(googleText) &&
            !googleText.includes("not connected") &&
            !googleText.includes("disconnected");

        return Boolean(
            stored ||
            positiveAuthText ||
            positiveGoogle ||
            hasRealEmail(
                email?.textContent
            )
        );
    }

    function initials(name) {
        const parts =
            clean(name)
                .split(" ")
                .filter(Boolean);

        if (!parts.length) {
            return "U";
        }

        if (parts.length === 1) {
            return parts[0][0]
                .toUpperCase();
        }

        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }

    function moveGoogleButtonBelowIdentity(card) {
        const hero =
            card.querySelector(
                ".profile-hero"
            );

        const signIn =
            card.querySelector(
                ".google-signin-section"
            );

        if (
            hero &&
            signIn &&
            hero.nextElementSibling !== signIn
        ) {
            hero.insertAdjacentElement(
                "afterend",
                signIn
            );
        }
    }

    function applySignedOut(card) {
        const name =
            document.getElementById(
                "profileName"
            );

        const email =
            document.getElementById(
                "profileEmail"
            );

        const avatar =
            document.getElementById(
                "profileAvatar"
            );

        const signIn =
            card.querySelector(
                ".google-signin-section"
            );

        card.classList.add(
            "ap-profile-signed-out-v21"
        );

        card.classList.remove(
            "ap-profile-signed-in-v21"
        );

        if (
            name &&
            clean(name.textContent) !== "User"
        ) {
            name.textContent =
                "User";
        }

        if (email) {
            const copy =
                "Sign in with Google to personalize your AP Synapse identity.";

            if (
                clean(email.textContent) !==
                copy
            ) {
                email.textContent =
                    copy;
            }
        }

        if (avatar) {
            if (
                avatar.tagName !== "IMG"
            ) {
                if (
                    clean(avatar.textContent) !== "U"
                ) {
                    avatar.textContent =
                        "U";
                }
            }

            avatar.setAttribute(
                "aria-label",
                "User profile"
            );
        }

        if (signIn) {
            signIn.style.removeProperty(
                "display"
            );
        }

        moveGoogleButtonBelowIdentity(
            card
        );
    }

    function applySignedIn(card) {
        const name =
            document.getElementById(
                "profileName"
            );

        const avatar =
            document.getElementById(
                "profileAvatar"
            );

        card.classList.remove(
            "ap-profile-signed-out-v21"
        );

        card.classList.add(
            "ap-profile-signed-in-v21"
        );

        /*
         * Do NOT write name/email here.
         * Existing Google authentication owns those fields and
         * updates them from the signed-in account automatically.
         */
        if (
            name &&
            avatar &&
            avatar.tagName !== "IMG"
        ) {
            const realName =
                clean(
                    name.textContent
                );

            if (
                realName &&
                realName !== "User"
            ) {
                avatar.textContent =
                    initials(
                        realName
                    );

                avatar.setAttribute(
                    "aria-label",
                    `${realName} profile`
                );
            }
        }
    }

    function sync() {
        const card =
            document.getElementById(
                "profileCard"
            );

        if (!card) {
            return;
        }

        const signedIn =
            authenticated(card);

        const mode =
            signedIn
                ? "signed-in"
                : "signed-out";

        if (
            mode === "signed-out"
        ) {
            applySignedOut(card);
        }
        else {
            applySignedIn(card);
        }

        if (mode !== lastMode) {
            lastMode = mode;

            console.log(
                `AP Profile identity mode: ${mode}`
            );
        }
    }

    function boot() {
        sync();

        /*
         * Low-frequency sync only. No MutationObserver.
         * Existing Google sign-in code updates the real profile
         * fields; this simply reflects the new state.
         */
        if (!timer) {
            timer =
                setInterval(
                    sync,
                    900
                );
        }
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            boot,
            {
                once: true
            }
        );
    }
    else {
        boot();
    }

    document.addEventListener(
        "click",
        event => {
            if (
                event.target?.closest?.(
                    "#profileBtn, #apRailProfile, .profile-button, [aria-label='Profile'], [data-tooltip='Profile']"
                )
            ) {
                setTimeout(
                    sync,
                    0
                );

                setTimeout(
                    sync,
                    180
                );
            }
        },
        true
    );

    window.APProfileIdentityV21 = {
        version:
            "2.1.0",

        refresh:
            sync,

        status() {
            const card =
                document.getElementById(
                    "profileCard"
                );

            return {
                ready:
                    Boolean(card),

                mode:
                    card?.classList
                        .contains(
                            "ap-profile-signed-in-v21"
                        )
                        ? "signed-in"
                        : "signed-out"
            };
        }
    };

    console.log(
        "✦ AP SYNAPSE PROFILE IDENTITY V2.1 READY"
    );
})();