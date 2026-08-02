// ============================================
// AP SYNAPSE — SETTINGS WORKSPACE
// ============================================

console.log("✅ settings.js loaded");


// ============================================
// OPEN SETTINGS PAGE
// ============================================

function openSettingsPage() {

    // Hide conversation
    document
        .querySelectorAll(".conversation")
        .forEach(page => {
            page.style.display = "none";
        });

    // Hide other workspace pages
    document
        .querySelectorAll(".projects-page")
        .forEach(page => {
            page.style.display = "none";
        });

    // Show Settings
    const settingsPage =
        document.getElementById("settingsPage");

    if (settingsPage) {

        settingsPage.style.display = "block";

    } else {

        console.error("❌ settingsPage not found");

    }

    // Page state
    document.body.dataset.page = "settings";

    // Active sidebar state
    document
        .querySelectorAll(".sidebar nav a")
        .forEach(link => {
            link.classList.remove("active");
        });

    const settingsButton =
        document.getElementById("sidebarSettingsBtn");

    if (settingsButton) {
        settingsButton.classList.add("active");
    }

    console.log("⚙️ Settings page opened");
}


// ============================================
// SIDEBAR SETTINGS BUTTON
// ============================================

const sidebarSettingsButton =
    document.getElementById("sidebarSettingsBtn");

if (sidebarSettingsButton) {

    sidebarSettingsButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            openSettingsPage();

        }
    );

} else {

    console.error(
        "❌ sidebarSettingsBtn not found"
    );

}


// ============================================
// THEME CONTROL
// ============================================

const themeSettingButton =
    document.getElementById("themeSettingBtn");

if (themeSettingButton) {

    themeSettingButton.addEventListener(
        "click",
        function () {

            document.body.classList.toggle(
                "light-mode"
            );

            const isLight =
                document.body.classList.contains(
                    "light-mode"
                );

            localStorage.setItem(
                "apSynapseTheme",
                isLight ? "light" : "dark"
            );

            showToast(
                isLight
                    ? "☀️ Light Mode Enabled"
                    : "🌙 Dark Mode Enabled"
            );

        }
    );

}


// ============================================
// RESTORE THEME
// ============================================

const savedTheme =
    localStorage.getItem("apSynapseTheme");

if (savedTheme === "light") {

    document.body.classList.add("light-mode");

}

console.log("✅ Settings system ready");