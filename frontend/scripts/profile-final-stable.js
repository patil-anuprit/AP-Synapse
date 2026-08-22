/* ============================================================
   AP SYNAPSE — STABLE FINAL PROFILE
   Event-driven only. No MutationObserver loops.
   ============================================================ */

(() => {
    "use strict";

    const normalize = value =>
        String(value || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();


    function visible(el) {
        if (!el) return false;

        const s = getComputedStyle(el);

        return (
            s.display !== "none" &&
            s.visibility !== "hidden"
        );
    }


    function findTitle(profile) {
        return [...profile.querySelectorAll("h1,h2,h3")]
            .find(el =>
                normalize(el.textContent)
                    .includes("your profile")
            ) || profile.querySelector("h1,h2,h3");
    }


    function signedOut(profile) {
        const text = normalize(profile.innerText);

        return (
            text.includes("not signed in") ||
            text.includes("not authenticated")
        );
    }


    function findGoogle(profile, slot) {

        const gis =
            [...profile.querySelectorAll(".g_id_signin")]
            .find(el =>
                el !== slot &&
                !slot.contains(el) &&
                !el.contains(slot)
            );

        if (gis) return gis;


        const iframe =
            [...profile.querySelectorAll("iframe")]
            .find(frame => {

                const src =
                    frame.getAttribute("src") || "";

                return (
                    src.includes("accounts.google.com") ||
                    src.includes("/gsi/")
                );
            });

        if (iframe) {

            const wrapper =
                iframe.closest(".g_id_signin");

            return wrapper || iframe.parentElement || iframe;
        }


        return null;
    }


    function ensureFallback(slot) {

        let button =
            slot.querySelector(
                ".ap-profile-stable-google"
            );

        if (button) return;


        button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "ap-profile-stable-google";

        button.innerHTML = `
            <span class="ap-profile-stable-g">G</span>
            <span>Sign in with Google</span>
        `;


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                if (
                    window.google?.accounts?.id?.prompt
                ) {
                    window.google.accounts.id.prompt();
                    return;
                }

                const real =
                    document.querySelector(".g_id_signin");

                real?.click?.();
            }
        );


        slot.appendChild(button);
    }


    function restoreState(profile) {

        profile
            .querySelectorAll(
                ".ap-profile-stable-hidden"
            )
            .forEach(el =>
                el.classList.remove(
                    "ap-profile-stable-hidden"
                )
            );
    }


    function cleanSignedOut(profile) {

        const hide = new Set([
            "anuprit patil",
            "not signed in",
            "not authenticated",
            "google identity",
            "connected account",
            "not connected google authentication",
            "verified"
        ]);


        [...profile.querySelectorAll("*")]
            .forEach(el => {

                if (el.children.length) return;

                if (
                    hide.has(
                        normalize(el.textContent)
                    )
                ) {
                    el.classList.add(
                        "ap-profile-stable-hidden"
                    );
                }
            });


        [...profile.querySelectorAll("button")]
            .forEach(button => {

                const text =
                    normalize(button.textContent);

                if (
                    text === "sign out" ||
                    text === "switch account"
                ) {
                    button.classList.add(
                        "ap-profile-stable-hidden"
                    );
                }
            });
    }


    function repairProfile() {

        if (window.innerWidth > 760) return;

        const profile =
            document.getElementById("profileCard");

        if (!visible(profile)) return;


        restoreState(profile);


        const title =
            findTitle(profile);

        if (!title) return;


        let slot =
            profile.querySelector(
                ".ap-profile-stable-auth"
            );


        if (!slot) {

            slot =
                document.createElement("div");

            slot.className =
                "ap-profile-stable-auth";
        }


        if (
            title.nextElementSibling !== slot
        ) {

            title.insertAdjacentElement(
                "afterend",
                slot
            );
        }


        if (signedOut(profile)) {

            slot.hidden = false;

            const google =
                findGoogle(profile, slot);


            if (
                google &&
                google !== slot &&
                !slot.contains(google) &&
                !google.contains(slot)
            ) {

                slot.appendChild(google);

                slot
                    .querySelector(
                        ".ap-profile-stable-google"
                    )
                    ?.remove();

            } else if (
                !slot.querySelector(".g_id_signin") &&
                !slot.querySelector("iframe")
            ) {

                ensureFallback(slot);
            }


            cleanSignedOut(profile);

        } else {

            slot.hidden = true;
        }
    }


    function scheduleProfileRepair() {

        requestAnimationFrame(() => {
            repairProfile();
        });

        setTimeout(
            repairProfile,
            180
        );
    }


    document.addEventListener(
        "click",
        scheduleProfileRepair,
        true
    );


    window.addEventListener(
        "resize",
        repairProfile,
        { passive: true }
    );


    document.addEventListener(
        "DOMContentLoaded",
        repairProfile
    );


    console.log(
        "✅ AP SYNAPSE — STABLE PROFILE READY"
    );

})();
