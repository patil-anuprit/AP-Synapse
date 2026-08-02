const notificationBtn =
document.getElementById("notificationBtn");

const settingsBtn =
document.getElementById("settingsBtn");

const popup =
document.getElementById("popupPanel");

const title =
document.getElementById("popupTitle");

const content =
document.getElementById("popupContent");

const close =
document.getElementById("closePopup");

function openPopup(t,c){

title.innerText=t;

content.innerHTML=c;

popup.style.display="block";

}

notificationBtn.addEventListener("click",()=>{

openPopup(

"Notifications",

`

✅ Voice Assistant Added<br><br>

✅ Read Aloud Added<br><br>

✅ Search Working<br><br>

🚀 AP Synapse Ready for Demo

`

);

});

settingsBtn.addEventListener("click", () => {

    openPopup(
        "Settings",

        `
        <div class="settings-panel">

            <div class="settings-section">

                <div class="settings-section-title">
                    AP SYNAPSE PREFERENCES
                </div>

                <div class="settings-row">

                    <div>
                        <strong>Appearance</strong>
                        <small>Choose your workspace theme</small>
                    </div>

                    <button
                        id="themeToggle"
                        class="setting-control"
                        type="button"
                    >
                        Dark
                    </button>

                </div>

                <div class="settings-row">

                    <div>
                        <strong>AI Intelligence</strong>
                        <small>Response reasoning mode</small>
                    </div>

                    <button
                        id="aiModeToggle"
                        class="setting-control"
                        type="button"
                    >
                        Smart
                    </button>

                </div>

                <div class="settings-row">

                    <div>
                        <strong>Voice Assistant</strong>
                        <small>Voice input availability</small>
                    </div>

                    <button
                        id="voiceToggle"
                        class="setting-control active"
                        type="button"
                    >
                        Enabled
                    </button>

                </div>

                <div class="settings-row">

                    <div>
                        <strong>Read Aloud</strong>
                        <small>Speak AI responses</small>
                    </div>

                    <button
                        id="readToggle"
                        class="setting-control active"
                        type="button"
                    >
                        Enabled
                    </button>

                </div>

                <div class="settings-row">

                    <div>
                        <strong>Web Intelligence</strong>
                        <small>Allow web-powered research</small>
                    </div>

                    <button
                        id="webToggle"
                        class="setting-control"
                        type="button"
                    >
                        Disabled
                    </button>

                </div>

            </div>

        </div>
        `
    );


    // ============================
    // THEME
    // ============================

    document
        .getElementById("themeToggle")
        ?.addEventListener("click", () => {

            const light =
                document.body.classList.toggle("light-mode");

            const button =
                document.getElementById("themeToggle");

            button.textContent =
                light ? "Light" : "Dark";

            showToast(
                light
                    ? "☀ Light Mode Enabled"
                    : "🌙 Dark Mode Enabled"
            );

        });


    // ============================
    // AI MODE
    // ============================

    document
        .getElementById("aiModeToggle")
        ?.addEventListener("click", () => {

            window.deepThinking =
                !window.deepThinking;

            const button =
                document.getElementById("aiModeToggle");

            button.textContent =
                window.deepThinking
                    ? "Deep"
                    : "Smart";

            showToast(
                window.deepThinking
                    ? "🧠 Deep Intelligence Enabled"
                    : "⚡ Smart Intelligence Enabled"
            );

        });


    // ============================
    // VOICE
    // ============================

    document
        .getElementById("voiceToggle")
        ?.addEventListener("click", () => {

            const button =
                document.getElementById("voiceToggle");

            const enabled =
                button.classList.toggle("active");

            button.textContent =
                enabled
                    ? "Enabled"
                    : "Disabled";

            showToast(
                enabled
                    ? "🎤 Voice Assistant Enabled"
                    : "🎤 Voice Assistant Disabled"
            );

        });


    // ============================
    // READ ALOUD
    // ============================

    document
        .getElementById("readToggle")
        ?.addEventListener("click", () => {

            const button =
                document.getElementById("readToggle");

            const enabled =
                button.classList.toggle("active");

            button.textContent =
                enabled
                    ? "Enabled"
                    : "Disabled";

            showToast(
                enabled
                    ? "🔊 Read Aloud Enabled"
                    : "🔇 Read Aloud Disabled"
            );

        });


    // ============================
    // WEB INTELLIGENCE
    // ============================

    document
        .getElementById("webToggle")
        ?.addEventListener("click", () => {

            window.webMode =
                !window.webMode;

            const button =
                document.getElementById("webToggle");

            button.textContent =
                window.webMode
                    ? "Enabled"
                    : "Disabled";

            button.classList.toggle(
                "active",
                window.webMode
            );

            showToast(
                window.webMode
                    ? "🌐 Web Intelligence Enabled"
                    : "🌐 Web Intelligence Disabled"
            );

        });

});

close.addEventListener("click",()=>{

popup.style.display="none";

});

const profileBtn =
document.getElementById("profileBtn");

const profileCard =
document.getElementById("profileCard");

const closeProfile =
document.getElementById("closeProfile");

if(profileBtn){

profileBtn.onclick=()=>{

profileCard.style.display="block";

};

}

if(closeProfile){

closeProfile.onclick=()=>{

profileCard.style.display="none";

};

}

// ======================================================
// AP SYNAPSE — SIDEBAR SETTINGS & PROFILE
// ======================================================

const sidebarSettingsBtn =
    document.getElementById("sidebarSettingsBtn");

const sidebarProfileBtn =
    document.getElementById("sidebarProfileBtn");


// SIDEBAR SETTINGS

if (sidebarSettingsBtn) {

    sidebarSettingsBtn.addEventListener("click", (event) => {

        event.preventDefault();

        openPopup(
            "Settings",
            `
            <div class="settings-panel">

                <div class="settings-row">
                    <span>Appearance</span>
                    <strong>Dark</strong>
                </div>

                <div class="settings-row">
                    <span>AI Mode</span>
                    <strong>Smart</strong>
                </div>

                <div class="settings-row">
                    <span>Voice Assistant</span>
                    <strong>Enabled</strong>
                </div>

                <div class="settings-row">
                    <span>Read Aloud</span>
                    <strong>Enabled</strong>
                </div>

                <div class="settings-row">
                    <span>Web Search</span>
                    <strong>Available</strong>
                </div>

                <div class="settings-row">
                    <span>AP Synapse</span>
                    <strong>v1.0</strong>
                </div>

            </div>
            `
        );

    });

}


// SIDEBAR PROFILE

if (sidebarProfileBtn) {

    sidebarProfileBtn.addEventListener("click", (event) => {

        event.preventDefault();

        if (profileCard) {

            profileCard.style.display = "block";

        }

    });

}