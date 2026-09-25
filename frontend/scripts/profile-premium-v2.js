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