(() => {
    "use strict";

    if (window.__AP_APRISHA_EVERYWHERE_V3__) return;
    window.__AP_APRISHA_EVERYWHERE_V3__ = true;

    const CARD_ID = "apAprishaEverywhereCardV3";
    const MODAL_ID = "apAprishaEverywhereModalV3";
    const STYLE_ID = "apAprishaEverywhereStylesV3";
    const SEEN_KEY = "ap_aprisha_everywhere_seen_v3";

    const ua = String(navigator.userAgent || "");
    const referrer = String(document.referrer || "");

    const isAndroid = /Android/i.test(ua);
    // AP_APRISHA_EVERYWHERE_AUTODISMISS_V41
    const INLINE_DISMISS_MS =
        isAndroid ? 12000 : 6500;

    let inlineDismissed = false;
    let inlineDismissTimer = null;
    const isAndroidApp = referrer.startsWith("android-app://");

    function runtimeState() {
        return {
            version: "3.0.0",
            android: isAndroid,
            androidApp: isAndroidApp,
            webAprishaReady: !!window.APAprisha || !!window.Aprisha,
            nativeAssistantBridgeReady: !!window.AprishaAssistantRuntime
        };
    }

    function addStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #${CARD_ID},
            #${MODAL_ID} .ap3-shell {
                color:#f7f3eb;
                font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
            }

            #${CARD_ID} {
                position:relative;
                overflow:hidden;
                width:min(760px,calc(100% - 28px));
                margin:16px auto;
                padding:22px;
                border-radius:22px;
                border:1px solid rgba(229,200,117,.22);
                background:
                    radial-gradient(circle at 8% 0%,rgba(229,200,117,.12),transparent 34%),
                    radial-gradient(circle at 95% 10%,rgba(121,207,255,.07),transparent 30%),
                    linear-gradient(145deg,rgba(23,24,28,.98),rgba(10,11,13,.99));
                box-shadow:
                    0 24px 70px rgba(0,0,0,.32),
                    inset 0 1px 0 rgba(255,255,255,.04);
            }

            #${CARD_ID}::after,
            #${MODAL_ID} .ap3-shell::after {
                content:"";
                position:absolute;
                left:9%;
                right:9%;
                bottom:0;
                height:1px;
                background:linear-gradient(90deg,transparent,#79cfff,#aa91ff,#e5c875,transparent);
                filter:drop-shadow(0 0 10px rgba(170,145,255,.32));
                animation:ap3alive 3.4s ease-in-out infinite;
            }

            .ap3-top {
                display:flex;
                align-items:center;
                gap:16px;
            }

            .ap3-orb {
                width:56px;
                height:56px;
                flex:0 0 56px;
                display:grid;
                place-items:center;
                border-radius:50%;
                color:#fbf8f1;
                font-weight:650;
                letter-spacing:-.05em;
                border:1px solid rgba(255,255,255,.13);
                background:
                    radial-gradient(circle at 34% 28%,rgba(255,255,255,.20),rgba(121,207,255,.12) 24%,rgba(170,145,255,.11) 44%,rgba(15,15,18,.96) 78%);
                box-shadow:
                    0 0 0 1px rgba(229,200,117,.08),
                    0 0 26px rgba(121,207,255,.11),
                    0 13px 32px rgba(0,0,0,.38);
            }

            .ap3-copy { min-width:0; flex:1; }

            .ap3-kicker {
                margin:0 0 5px;
                color:rgba(229,200,117,.92);
                font-size:10px;
                font-weight:700;
                letter-spacing:.18em;
                text-transform:uppercase;
            }

            .ap3-title {
                margin:0;
                color:#fbf8f1;
                font-size:clamp(20px,3vw,28px);
                line-height:1.08;
                font-weight:600;
                letter-spacing:-.035em;
            }

            .ap3-sub {
                margin:7px 0 0;
                max-width:610px;
                color:rgba(248,245,238,.60);
                font-size:13px;
                line-height:1.55;
            }

            .ap3-actions {
                display:flex;
                flex-wrap:wrap;
                gap:10px;
                margin-top:18px;
            }

            .ap3-primary,
            .ap3-secondary {
                min-height:44px;
                padding:0 17px;
                border-radius:14px;
                font:inherit;
                font-size:13px;
                font-weight:650;
                cursor:pointer;
            }

            .ap3-primary {
                border:0;
                color:#151514;
                background:linear-gradient(135deg,#f2df9f,#d8b760);
                box-shadow:0 10px 28px rgba(216,183,96,.16);
            }

            .ap3-primary:disabled {
                cursor:default;
                opacity:.68;
            }

            .ap3-secondary {
                color:rgba(248,245,238,.76);
                background:rgba(255,255,255,.045);
                border:1px solid rgba(255,255,255,.075);
            }

            .ap3-status {
                margin:13px 0 0;
                color:rgba(248,245,238,.50);
                font-size:12px;
                line-height:1.5;
            }

            #${MODAL_ID} {
                position:fixed;
                inset:0;
                z-index:2147483000;
                display:grid;
                place-items:center;
                padding:22px;
                opacity:0;
                visibility:hidden;
                pointer-events:none;
                background:rgba(5,6,8,.61);
                backdrop-filter:blur(18px) saturate(.86);
                -webkit-backdrop-filter:blur(18px) saturate(.86);
                transition:opacity .2s ease,visibility .2s ease;
            }

            #${MODAL_ID}.open {
                opacity:1;
                visibility:visible;
                pointer-events:auto;
            }

            #${MODAL_ID} .ap3-shell {
                position:relative;
                overflow:hidden;
                width:min(620px,94vw);
                padding:26px;
                border-radius:24px;
                border:1px solid rgba(229,200,117,.22);
                background:
                    radial-gradient(circle at 10% 0%,rgba(229,200,117,.12),transparent 36%),
                    linear-gradient(145deg,#151619,#0b0c0e);
                box-shadow:0 36px 110px rgba(0,0,0,.50);
            }

            @keyframes ap3alive {
                0%,100% { opacity:.34; transform:scaleX(.74); }
                50% { opacity:1; transform:scaleX(1); }
            }

            @media (max-width:640px) {
                #${CARD_ID} {
                    width:calc(100% - 22px);
                    margin:11px auto;
                    padding:18px;
                    border-radius:19px;
                }

                .ap3-top { align-items:flex-start; }

                .ap3-orb {
                    width:48px;
                    height:48px;
                    flex-basis:48px;
                }

                .ap3-primary,
                .ap3-secondary {
                    flex:1 1 100%;
                }
            }

            @media (prefers-reduced-motion:reduce) {
                #${CARD_ID}::after,
                #${MODAL_ID} .ap3-shell::after {
                    animation:none;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function copyForPlatform() {
        if (isAndroidApp) {
            return {
                button: "Enable Aprisha Everywhere",
                description:
                    "One Android confirmation makes AP Synapse your device assistant so Aprisha can remain available across supported apps and screens.",
                status:
                    "Web Aprisha is already active. Everywhere mode uses Android's user-approved Assistant role."
            };
        }

        if (isAndroid) {
            return {
                button: "Enable Aprisha Everywhere",
                description:
                    "Aprisha already works here with zero installation. If the AP Synapse Android app is installed, one tap opens Android's secure assistant confirmation.",
                status:
                    "No separate Aprisha app is required."
            };
        }

        return {
            button: "Aprisha is active here",
            description:
                "Aprisha works immediately while AP Synapse is open. System-wide operation requires a supported native AP Synapse integration because browsers cannot keep unrestricted microphone access across unrelated apps.",
            status:
                "Web mode is ready now — no download is required."
        };
    }

    function activateAndroid(button, status) {
        button.disabled = true;
        button.textContent = "Opening Android confirmation…";
        status.textContent =
            "Handing off to AP Synapse's native Android assistant setup.";

        try {
            document.dispatchEvent(
                new CustomEvent(
                    "ap:aprisha-everywhere-enable",
                    {
                        detail: {
                            platform: "android",
                            source: isAndroidApp ? "android-app" : "web"
                        }
                    }
                )
            );

            if (
                window.AprishaAssistantRuntime &&
                typeof window.AprishaAssistantRuntime.activate === "function"
            ) {
                window.AprishaAssistantRuntime.activate();
            } else {
                location.href = "apsynapse://assistant/activate";
            }

            try {
                localStorage.setItem(SEEN_KEY, "1");
            } catch {}

            setTimeout(() => {
                if (document.visibilityState !== "visible") return;

                button.disabled = false;
                button.textContent = "Enable Aprisha Everywhere";
                status.textContent =
                    "Aprisha remains active here. Approve Android's Assistant confirmation to enable Everywhere mode.";
            }, 1800);
        } catch (error) {
            button.disabled = false;
            button.textContent = "Enable Aprisha Everywhere";
            status.textContent =
                "Aprisha remains active in web mode. Android system-wide setup could not be opened on this device.";

            console.warn(
                "Aprisha Everywhere activation failed:",
                error
            );
        }
    }

    function createShell(modal) {
        const shell = document.createElement("section");

        if (modal) {
            shell.className = "ap3-shell";
        } else {
            shell.id = CARD_ID;
        }

        const copy = copyForPlatform();

        shell.innerHTML = `
            <div class="ap3-top">
                <div class="ap3-orb" aria-hidden="true">AP</div>

                <div class="ap3-copy">
                    <p class="ap3-kicker">Aprisha Presence</p>
                    <h2 class="ap3-title">Enable Aprisha Everywhere</h2>
                    <p class="ap3-sub">${copy.description}</p>
                </div>
            </div>

            <div class="ap3-actions">
                <button
                    type="button"
                    class="ap3-primary"
                    data-ap3-enable
                >
                    ${copy.button}
                </button>

                ${
                    modal
                        ? `
                            <button
                                type="button"
                                class="ap3-secondary"
                                data-ap3-close
                            >
                                Not now
                            </button>
                        `
                        : ""
                }
            </div>

            <p class="ap3-status" data-ap3-status>
                ${copy.status}
            </p>
        `;

        const button =
            shell.querySelector("[data-ap3-enable]");

        const status =
            shell.querySelector("[data-ap3-status]");

        if (isAndroid) {
            button.addEventListener(
                "click",
                () => activateAndroid(button, status)
            );
        } else {
            button.disabled = true;
        }

        shell
            .querySelector("[data-ap3-close]")
            ?.addEventListener(
                "click",
                closeModal
            );

        return shell;
    }

    function findHost() {
        return (
            document.getElementById("assistantPage") ||
            document.querySelector('[data-page="assistant"]') ||
            document.querySelector(".assistant-page")
        );
    }


    function dismissInlineCard() {
        if (inlineDismissed) return;

        const card =
            document.getElementById(CARD_ID);

        if (!card) {
            inlineDismissed = true;
            return;
        }

        inlineDismissed = true;

        card.style.transition =
            "opacity .42s ease, transform .42s ease, filter .42s ease";

        card.style.opacity = "0";
        card.style.transform =
            "translateY(-10px) scale(.985)";
        card.style.filter = "blur(2px)";

        setTimeout(
            () => card.remove(),
            450
        );
    }

    function scheduleInlineDismiss() {
        if (inlineDismissed) return;

        clearTimeout(inlineDismissTimer);

        inlineDismissTimer =
            setTimeout(
                dismissInlineCard,
                INLINE_DISMISS_MS
            );
    }

    function mountCard() {
        if (inlineDismissed) return;
        if (document.getElementById(CARD_ID)) return;

        const host = findHost();
        if (!host) return;

        const card =
            createShell(false);

        card.style.opacity = "0";
        card.style.transform =
            "translateY(-6px) scale(.992)";

        host.prepend(card);

        requestAnimationFrame(
            () => {
                card.style.transition =
                    "opacity .32s ease, transform .32s ease";

                card.style.opacity = "1";
                card.style.transform =
                    "translateY(0) scale(1)";
            }
        );

        scheduleInlineDismiss();
    }

    function ensureModal() {
        let modal =
            document.getElementById(MODAL_ID);

        if (modal) return modal;

        modal = document.createElement("div");
        modal.id = MODAL_ID;
        modal.setAttribute("aria-hidden", "true");
        modal.appendChild(createShell(true));

        modal.addEventListener(
            "click",
            event => {
                if (event.target === modal) {
                    closeModal();
                }
            }
        );

        document.body.appendChild(modal);
        return modal;
    }

    function openModal() {
        const modal = ensureModal();
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
        const modal =
            document.getElementById(MODAL_ID);

        modal?.classList.remove("open");
        modal?.setAttribute("aria-hidden", "true");

        try {
            localStorage.setItem(SEEN_KEY, "1");
        } catch {}
    }

    function boot() {
        addStyles();
        mountCard();

        let seen = false;

        try {
            seen =
                localStorage.getItem(SEEN_KEY) === "1";
        } catch {}

        if (!seen && isAndroid) {
            setTimeout(openModal, 1100);
        }

        new MutationObserver(mountCard).observe(
            document.documentElement,
            {
                childList: true,
                subtree: true
            }
        );

        window.APAprishaEverywhere = {
            open: openModal,
            close: closeModal,
            status: runtimeState,
            enable() {
                openModal();

                requestAnimationFrame(() => {
                    document
                        .querySelector(
                            `#${MODAL_ID} [data-ap3-enable]`
                        )
                        ?.click();
                });
            }
        };

        console.log(
            "APRISHA EVERYWHERE V3 READY",
            runtimeState()
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            boot,
            { once: true }
        );
    } else {
        boot();
    }
})();
