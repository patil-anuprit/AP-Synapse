(() => {
    "use strict";

    window.__AP_APRISHA_ALLOW_VOICE_START = false;

    const NativeSpeech =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!NativeSpeech || window.__AP_APRISHA_GOVERNOR_ACTIVE) return;

    window.__AP_APRISHA_GOVERNOR_ACTIVE = true;

    function GovernedSpeechRecognition() {
        const instance = new NativeSpeech();
        const nativeStart = instance.start.bind(instance);

        instance.start = function () {
            if (window.__AP_APRISHA_ALLOW_VOICE_START === true) {
                return nativeStart();
            }

            console.warn(
                "[AP Synapse] Blocked legacy/background Aprisha microphone start."
            );
        };

        return instance;
    }

    GovernedSpeechRecognition.prototype = NativeSpeech.prototype;

    window.SpeechRecognition = GovernedSpeechRecognition;
    window.webkitSpeechRecognition = GovernedSpeechRecognition;

    function removeLegacyWakeBars() {
        const textTargets = [
            "Enable Hey Aprisha",
            "Allow microphone once",
            "Hey Aprisha is listening",
            "Desktop Wake",
            "Wake Mode"
        ];

        document.querySelectorAll("body *").forEach((node) => {
            const text = String(node.textContent || "");

            if (!textTargets.some((target) => text.includes(target))) return;

            const box =
                node.closest(".ap-auto-setup") ||
                node.closest(".ap-desktop-wake-panel") ||
                node.closest("#ap-desktop-wake-panel") ||
                node.closest("#ap-wake-mode-setup") ||
                node.closest("#ap-android-installer-panel") ||
                node.closest("div");

            if (box && box !== document.body) {
                box.remove();
            }
        });
    }

    window.addEventListener("DOMContentLoaded", () => {
        removeLegacyWakeBars();
        setInterval(removeLegacyWakeBars, 1200);
    });
})();
