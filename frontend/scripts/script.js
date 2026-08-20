const stars = document.querySelector(".stars");

if (stars) {
    for (let i = 0; i < 250; i++) {
        const star = document.createElement("div");

        star.className = "star";
        star.style.left = Math.random() * 100 + "%";
        star.style.top = Math.random() * 100 + "%";
        star.style.animationDelay = Math.random() * 5 + "s";

        stars.appendChild(star);
    }
}

const input = document.getElementById("userInput");
const button = document.getElementById("sendBtn");
const chat = document.getElementById("chatWindow");

const BACKEND_URL =
    "https://api.ap-synapse.com";

async function sendMessage() {

    const text = input.value.trim();

    if (!text) return;

    chat.innerHTML += `
        <div class="message user">
            ${escapeHtml(text)}
        </div>
    `;

    input.value = "";

    const aiMessage = document.createElement("div");
    aiMessage.className = "message ai";
    aiMessage.textContent = "";

    chat.appendChild(aiMessage);

    chat.scrollTop = chat.scrollHeight;

    try {

        const response = await fetch(
            `${BACKEND_URL}/chat`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: text,
                    web: true
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }

        if (!response.body) {
            throw new Error(
                "Streaming response is unavailable."
            );
        }

        const reader =
            response.body.getReader();

        const decoder =
            new TextDecoder("utf-8");

        let fullText = "";

        while (true) {

            const {
                value,
                done
            } = await reader.read();

            if (done) break;

            const chunk =
                decoder.decode(
                    value,
                    { stream: true }
                );

            fullText += chunk;

            aiMessage.innerHTML =
                formatResponse(fullText);

            chat.scrollTop =
                chat.scrollHeight;
        }

        const remaining =
            decoder.decode();

        if (remaining) {

            fullText += remaining;

            aiMessage.innerHTML =
                formatResponse(fullText);
        }

    }

    catch (error) {

        console.error(
            "AP Synapse request failed:",
            error
        );

        aiMessage.innerHTML = `
            <strong>AP Synapse</strong><br>
            Unable to connect to the intelligence engine.
            Please try again.
        `;
    }

    chat.scrollTop =
        chat.scrollHeight;
}

function formatResponse(text) {

    // Escape HTML first for safety.
    let safe =
        escapeHtml(text);

    // Convert URLs into clickable links.
    safe =
        safe.replace(
            /(https?:\/\/[^\s<]+)/g,
            url => {

                const cleanUrl =
                    url.replace(
                        /[),.;]+$/,
                        ""
                    );

                return `
                    <a
                        href="${cleanUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${cleanUrl}
                    </a>
                `;
            }
        );

    // Preserve line breaks.
    safe =
        safe.replace(
            /\n/g,
            "<br>"
        );

    return safe;
}

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

button.onclick =
    sendMessage;

input.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);

/* ============================================================
   AP SYNAPSE — PREMIUM SIDEBAR CONTROLLER
   Desktop + Mobile + PWA Install
   ============================================================ */

(() => {
    "use strict";

    const MOBILE_BREAKPOINT = 767;

    const sidebar =
        document.querySelector(".sidebar");

    const collapseButton =
        document.getElementById("apSidebarCollapse");

    const mobileMenu =
        document.getElementById("apMobileMenu");

    const overlay =
        document.getElementById("apSidebarOverlay");

    const rail =
        document.getElementById("apCollapsedRail");

    const railOpen =
        document.getElementById("apRailOpen");

    const railNewChat =
        document.getElementById("apRailNewChat");

    const railRecent =
        document.getElementById("apRailRecent");

    const railSettings =
        document.getElementById("apRailSettings");

    const railProfile =
        document.getElementById("apRailProfile");

    const installButton =
        document.getElementById("apInstallBtn");


    if (!sidebar) {
        console.warn(
            "AP Synapse sidebar controller: sidebar not found."
        );

        return;
    }


    /* ============================================================
       HELPERS
       ============================================================ */

    function isMobile() {

        return (
            window.innerWidth <=
            MOBILE_BREAKPOINT
        );

    }


    function openMobileSidebar() {

        if (!isMobile()) return;

        sidebar.classList.add(
            "ap-sidebar-open"
        );

        overlay?.classList.add(
            "ap-visible"
        );

        mobileMenu?.setAttribute(
            "aria-expanded",
            "true"
        );

        document.body.classList.add(
            "ap-mobile-sidebar-open"
        );

    }


    function closeMobileSidebar() {

        sidebar.classList.remove(
            "ap-sidebar-open"
        );

        overlay?.classList.remove(
            "ap-visible"
        );

        mobileMenu?.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.classList.remove(
            "ap-mobile-sidebar-open"
        );

    }


    function toggleMobileSidebar() {

        if (!isMobile()) return;

        if (
            sidebar.classList.contains(
                "ap-sidebar-open"
            )
        ) {

            closeMobileSidebar();

        } else {

            openMobileSidebar();

        }

    }


    function collapseDesktopSidebar() {

        if (isMobile()) return;

        document.body.classList.add(
            "ap-sidebar-collapsed"
        );

    }


    function expandDesktopSidebar() {

        if (isMobile()) return;

        document.body.classList.remove(
            "ap-sidebar-collapsed"
        );

    }


    /* ============================================================
       DESKTOP COLLAPSE
       ============================================================ */


    railOpen?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            expandDesktopSidebar();

        }
    );


    /* ============================================================
       MOBILE MENU
       ============================================================ */

    mobileMenu?.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            toggleMobileSidebar();

        }
    );


    overlay?.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                closeMobileSidebar();

            }

        }
    );


    /* ============================================================
       NEW CHAT
       ============================================================ */

    railNewChat?.addEventListener(
        "click",
        () => {

            const newChat =
                document.querySelector(
                    ".new-chat-btn"
                );

            if (newChat) {

                newChat.click();

            } else {

                window.location.reload();

            }

        }
    );


    /* ============================================================
       RECENTS
       ============================================================ */

    railRecent?.addEventListener(
        "click",
        () => {

            expandDesktopSidebar();

            const recent =
                document.querySelector(
                    ".recent-group"
                );

            if (recent) {

                recent.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        }
    );


    /* ============================================================
       SETTINGS
       ============================================================ */

    railSettings?.addEventListener(
        "click",
        () => {

            const settings =
                document.getElementById(
                    "sidebarSettingsBtn"
                );

            if (settings) {

                settings.click();

            }

        }
    );


    /* ============================================================
       PROFILE
       ============================================================ */

    railProfile?.addEventListener(
        "click",
        () => {

            const profile =
                document.getElementById(
                    "profileSidebarBtn"
                );

            if (profile) {

                profile.click();

            }

        }
    );


    /* ============================================================
       SIDEBAR NAVIGATION
       Mobile closes after selection.
       Desktop stays open.
       ============================================================ */

    sidebar.addEventListener(
        "click",
        event => {

            const item =
                event.target.closest(
                    "a, button"
                );

            if (!item) return;

            if (
                isMobile() &&
                !item.closest(
                    "#apMobileMenu"
                )
            ) {

                setTimeout(
                    closeMobileSidebar,
                    100
                );

            }

        },
        true
    );


    /* ============================================================
       ESCAPE
       ============================================================ */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                isMobile()
            ) {

                closeMobileSidebar();

            }

        }
    );


    /* ============================================================
       RESPONSIVE STATE
       ============================================================ */

    window.addEventListener(
        "resize",
        () => {

            if (isMobile()) {

                document.body.classList.remove(
                    "ap-sidebar-collapsed"
                );

            } else {

                closeMobileSidebar();

            }

        },
        {
            passive: true
        }
    );


    /* ============================================================
       PWA INSTALL
       ============================================================ */

    let deferredInstallPrompt = null;


    window.addEventListener(
        "beforeinstallprompt",
        event => {

            event.preventDefault();

            deferredInstallPrompt =
                event;

            if (installButton) {

                installButton.style.display =
                    "flex";

            }

        }
    );


    installButton?.addEventListener(
        "click",
        async () => {

            if (
                deferredInstallPrompt
            ) {

                deferredInstallPrompt.prompt();

                const choice =
                    await deferredInstallPrompt.userChoice;

                console.log(
                    "AP Synapse install result:",
                    choice.outcome
                );

                deferredInstallPrompt =
                    null;

                return;

            }


            /*
             * Browser does not currently expose
             * the install prompt.
             */

            if (
                window.matchMedia(
                    "(display-mode: standalone)"
                ).matches
            ) {

                alert(
                    "AP Synapse is already installed."
                );

                return;

            }


            alert(
                "To install AP Synapse, open your browser menu and choose “Install AP Synapse” or “Add to Home screen”."
            );

        }
    );


    window.addEventListener(
        "appinstalled",
        () => {

            deferredInstallPrompt =
                null;

            console.log(
                "✅ AP Synapse installed successfully."
            );

        }
    );


    /* ============================================================
       INITIAL STATE
       ============================================================ */

    if (isMobile()) {

        closeMobileSidebar();

    } else {

        document.body.classList.remove(
            "ap-sidebar-collapsed"
        );

    }


    console.log(
        "✅ AP SYNAPSE PREMIUM SIDEBAR SYSTEM ACTIVE"
    );

})();
