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
// AP SYNAPSE — SIDEBAR SETTINGS BUTTON
// Wait for dynamically rendered sidebar
// ============================================

function initializeSidebarSettingsButton() {

    const sidebarSettingsButton =
        document.getElementById(
            "sidebarSettingsBtn"
        );

    if (!sidebarSettingsButton) {
        return false;
    }

    /* Prevent duplicate listeners */
    if (
        sidebarSettingsButton.dataset
            .apSynapseSettingsReady === "true"
    ) {
        return true;
    }

    sidebarSettingsButton.dataset
        .apSynapseSettingsReady = "true";

    sidebarSettingsButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();

            openSettingsPage();

        }
    );

    console.log(
        "⚙️ AP SYNAPSE — Sidebar Settings button ready"
    );

    return true;
}


/* Try immediately */

if (!initializeSidebarSettingsButton()) {

    let attempts = 0;

    const settingsButtonTimer =
        setInterval(() => {

            attempts++;

            if (
                initializeSidebarSettingsButton()
            ) {

                clearInterval(
                    settingsButtonTimer
                );

                return;
            }

            if (attempts >= 40) {

                clearInterval(
                    settingsButtonTimer
                );

                console.info(
                    "ℹ️ AP SYNAPSE — Sidebar Settings button is not present on this page."
                );

            }

        }, 250);

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

// =====================================================
// AP SYNAPSE — SETTINGS CONTROLS
// =====================================================

const themeSettingsBtn =
    document.getElementById("themeSettingsBtn");

const smartModeBtn =
    document.getElementById("smartModeBtn");

const voiceSettingsBtn =
    document.getElementById("voiceSettingsBtn");

const readAloudSettingsBtn =
    document.getElementById("readAloudSettingsBtn");

const languageSelect =
    document.getElementById("settingsLanguage");

const accountSettingsBtn =
    document.getElementById("accountSettingsBtn");


// Appearance
themeSettingsBtn?.addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    const light =
        document.body.classList.contains("light-mode");

    themeSettingsBtn.textContent =
        light
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";

});


// Intelligence mode
smartModeBtn?.addEventListener("click", () => {

    window.apSynapseSmartMode =
        !window.apSynapseSmartMode;

    smartModeBtn.textContent =
        window.apSynapseSmartMode
            ? "🧠 Smart Mode · Active"
            : "🧠 Smart Mode";

});


// Voice
voiceSettingsBtn?.addEventListener("click", () => {

    window.apSynapseVoiceEnabled =
        !window.apSynapseVoiceEnabled;

    voiceSettingsBtn.textContent =
        window.apSynapseVoiceEnabled
            ? "🎤 Voice Enabled"
            : "🔇 Voice Disabled";

});


// Read Aloud
readAloudSettingsBtn?.addEventListener("click", () => {

    window.apSynapseReadAloud =
        !window.apSynapseReadAloud;

    readAloudSettingsBtn.textContent =
        window.apSynapseReadAloud
            ? "🔊 Read Aloud Enabled"
            : "🔇 Read Aloud Disabled";

});


// Language
languageSelect?.addEventListener("change", () => {

    const language =
        languageSelect.value;

    if (typeof showToast === "function") {

        showToast(
            `Language selected: ${language}`
        );

    }

});


// Account
accountSettingsBtn?.addEventListener("click", () => {

    const profileCard =
        document.getElementById("profileCard");

    if (profileCard) {

        profileCard.classList.add("active");

    }

});

// =====================================================
// AP SYNAPSE — PREMIUM INTELLIGENCE CONTROL CENTER
// =====================================================

const AP_SETTINGS = {
    reasoning: "balanced",
    response: "balanced",
    creativity: 0.7,
    memory: true,
    autoModel: true,
    fallback: true,
    webResearch: true,
    citations: true,
    readAloud: true,
    voice: true,
    animations: true,
    reducedMotion: false,
    compactMode: false,
    autoScroll: true,
    timestamps: false,
    markdown: true,
    codeHighlight: true,
    documentContext: true,
    imageUnderstanding: true,
    deepResearch: false,
    notifications: true
};

function createAdvancedSettings() {

    const settingsPage =
        document.getElementById("settingsPage");

    if (!settingsPage) return;

    if (document.getElementById("advancedSettings")) return;

    const panel = document.createElement("div");

    panel.id = "advancedSettings";

    panel.innerHTML = `

    <div class="advanced-settings-header">

        <span class="workspace-badge">
            AP SYNAPSE INTELLIGENCE CONTROL
        </span>

        <h2>Advanced Intelligence</h2>

        <p>
            Configure how AP Synapse thinks, responds,
            researches, speaks and works.
        </p>

    </div>

    <div class="advanced-settings-grid">

        <!-- INTELLIGENCE -->

        <div class="advanced-settings-card">

            <h3>🧠 Intelligence</h3>

            <label>
                Reasoning Effort

                <select data-setting="reasoning">
                    <option value="fast">Fast</option>
                    <option value="balanced" selected>Balanced</option>
                    <option value="deep">Deep</option>
                    <option value="maximum">Maximum</option>
                </select>

            </label>

            <label>
                Response Style

                <select data-setting="response">
                    <option value="concise">Concise</option>
                    <option value="balanced" selected>Balanced</option>
                    <option value="detailed">Detailed</option>
                    <option value="expert">Expert</option>
                </select>

            </label>

            <label>
                Creativity

                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value="0.7"
                    data-setting="creativity"
                >

            </label>

            <button data-toggle="memory">
                🧠 Conversation Memory
            </button>

            <button data-toggle="autoModel">
                ⚡ Automatic Intelligence Selection
            </button>

            <button data-toggle="fallback">
                🛡️ Fallback Protection
            </button>

        </div>


        <!-- RESEARCH -->

        <div class="advanced-settings-card">

            <h3>🌐 Research</h3>

            <button data-toggle="webResearch">
                🌐 Web Research
            </button>

            <button data-toggle="citations">
                📚 Source Citations
            </button>

            <button data-toggle="deepResearch">
                🔬 Deep Research
            </button>

        </div>


        <!-- VOICE -->

        <div class="advanced-settings-card">

            <h3>🎙️ Voice & Speech</h3>

            <button data-toggle="voice">
                🎤 Voice Assistant
            </button>

            <button data-toggle="readAloud">
                🔊 Read Aloud
            </button>

            <label>
                Speech Speed

                <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value="1"
                    id="speechSpeedSetting"
                >

            </label>

        </div>


        <!-- DOCUMENTS -->

        <div class="advanced-settings-card">

            <h3>📄 Documents & Vision</h3>

            <button data-toggle="documentContext">
                📄 Document Context
            </button>

            <button data-toggle="imageUnderstanding">
                👁️ Image Understanding
            </button>

            <button data-toggle="codeHighlight">
                💻 Code Highlighting
            </button>

        </div>


        <!-- CONVERSATION -->

        <div class="advanced-settings-card">

            <h3>💬 Conversation</h3>

            <button data-toggle="autoScroll">
                ↕️ Automatic Scrolling
            </button>

            <button data-toggle="timestamps">
                🕒 Message Timestamps
            </button>

            <button data-toggle="markdown">
                ✨ Markdown Rendering
            </button>

        </div>


        <!-- EXPERIENCE -->

        <div class="advanced-settings-card">

            <h3>✨ Experience</h3>

            <button data-toggle="animations">
                ✨ Intelligence Animations
            </button>

            <button data-toggle="reducedMotion">
                ♿ Reduced Motion
            </button>

            <button data-toggle="compactMode">
                📐 Compact Workspace
            </button>

            <button data-toggle="notifications">
                🔔 Notifications
            </button>

        </div>

    </div>

    <div class="advanced-settings-footer">

        <button id="resetAdvancedSettings">
            Reset Advanced Settings
        </button>

        <span>
            AP Synapse Intelligence Engine · v1.0
        </span>

    </div>

    `;

    settingsPage.appendChild(panel);


    // -----------------------------
    // Toggle controls
    // -----------------------------

    panel.querySelectorAll("[data-toggle]")
        .forEach(button => {

            const key =
                button.dataset.toggle;

            updateToggle(button, AP_SETTINGS[key]);

            button.addEventListener("click", () => {

                AP_SETTINGS[key] =
                    !AP_SETTINGS[key];

                updateToggle(
                    button,
                    AP_SETTINGS[key]
                );

                applySetting(
                    key,
                    AP_SETTINGS[key]
                );

            });

        });


    // -----------------------------
    // Select controls
    // -----------------------------

    panel.querySelectorAll("[data-setting]")
        .forEach(control => {

            const key =
                control.dataset.setting;

            control.value =
                AP_SETTINGS[key];

            control.addEventListener("change", () => {

                AP_SETTINGS[key] =
                    control.value;

                applySetting(
                    key,
                    control.value
                );

            });

        });


    // -----------------------------
    // Creativity
    // -----------------------------

    const creativity =
        panel.querySelector(
            '[data-setting="creativity"]'
        );

    creativity?.addEventListener("input", () => {

        AP_SETTINGS.creativity =
            Number(creativity.value);

    });


    // -----------------------------
    // Speech speed
    // -----------------------------

    const speechSpeed =
        document.getElementById(
            "speechSpeedSetting"
        );

    speechSpeed?.addEventListener("input", () => {

        window.apSynapseSpeechRate =
            Number(speechSpeed.value);

    });


    // -----------------------------
    // Reset
    // -----------------------------

    document
        .getElementById("resetAdvancedSettings")
        ?.addEventListener("click", () => {

            Object.assign(
                AP_SETTINGS,
                {
                    reasoning: "balanced",
                    response: "balanced",
                    creativity: 0.7,
                    memory: true,
                    autoModel: true,
                    fallback: true,
                    webResearch: true,
                    citations: true,
                    readAloud: true,
                    voice: true,
                    animations: true,
                    reducedMotion: false,
                    compactMode: false,
                    autoScroll: true,
                    timestamps: false,
                    markdown: true,
                    codeHighlight: true,
                    documentContext: true,
                    imageUnderstanding: true,
                    deepResearch: false,
                    notifications: true
                }
            );

            panel
                .querySelectorAll("[data-toggle]")
                .forEach(button => {

                    const key =
                        button.dataset.toggle;

                    updateToggle(
                        button,
                        AP_SETTINGS[key]
                    );

                });

            showToast?.(
                "Advanced settings reset"
            );

        });

}


function updateToggle(button, enabled) {

    button.classList.toggle(
        "setting-enabled",
        enabled
    );

    button.dataset.state =
        enabled
            ? "ON"
            : "OFF";

}


function applySetting(key, value) {

    // Global AP Synapse state

    window.AP_SYNapse_SETTINGS =
        AP_SETTINGS;

    // Reduced motion

    if (key === "reducedMotion") {

        document.body.classList.toggle(
            "reduced-motion",
            value
        );

    }

    // Compact workspace

    if (key === "compactMode") {

        document.body.classList.toggle(
            "compact-mode",
            value
        );

    }

    // Animations

    if (key === "animations") {

        document.body.classList.toggle(
            "animations-disabled",
            !value
        );

    }

    // Read aloud

    if (key === "readAloud") {

        window.apSynapseReadAloud =
            value;

    }

    // Voice

    if (key === "voice") {

        window.apSynapseVoiceEnabled =
            value;

    }

    // Web

    if (key === "webResearch") {

        window.webMode =
            value;

    }

    // Deep research

    if (key === "deepResearch") {

        window.deepResearch =
            value;

    }

    // Memory

    if (key === "memory") {

        window.apSynapseMemory =
            value;

    }

}


// Start after DOM is ready

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        createAdvancedSettings
    );

} else {

    createAdvancedSettings();

}

// =====================================================
// AP SYNAPSE — ULTIMATE CONTROL CENTER
// =====================================================

const AP_ULTIMATE_SETTINGS = {

    // Intelligence
    adaptiveReasoning: true,
    selfCheck: true,
    answerVerification: true,
    contextAwareness: true,
    continuity: true,
    longContext: true,
    precisionMode: true,

    // Memory
    conversationMemory: true,
    projectMemory: true,
    workspaceMemory: true,
    persistentPreferences: true,

    // Research
    webResearch: true,
    deepResearch: false,
    multiSourceResearch: true,
    factVerification: true,
    contradictionDetection: true,
    citations: true,

    // Code
    codeGeneration: true,
    debugging: true,
    codeExplanation: true,
    refactoring: true,
    codeOptimization: true,
    securityReview: true,
    testGeneration: true,

    // Documents / Vision
    documentAnalysis: true,
    multiFileContext: true,
    crossDocumentComparison: true,
    imageUnderstanding: true,

    // Creation
    imageGeneration: true,
    diagramCreation: true,
    creativeMode: true,

    // Reliability
    automaticRecovery: true,
    retryFailedRequests: true,
    connectionDiagnostics: true,
    sessionRecovery: true,

    // Experience
    focusMode: false,
    fullScreenMode: false,
    intelligenceField: true,
    animations: true,

    // Notifications
    notifications: true
};


// -----------------------------------------------------
// Create Ultimate Settings UI
// -----------------------------------------------------

function createUltimateSettings() {

    const page =
        document.getElementById("settingsPage");

    if (!page) return;

    if (document.getElementById("ultimateSettings")) {
        return;
    }

    const wrapper =
        document.createElement("div");

    wrapper.id = "ultimateSettings";

    wrapper.innerHTML = `

    <div class="ultimate-settings-heading">

        <span class="workspace-badge">
            AP SYNAPSE · CONTROL CENTER
        </span>

        <h2>Intelligence Control Center</h2>

        <p>
            Configure the intelligence, memory, research,
            creation and workspace behaviour of AP Synapse.
        </p>

    </div>


    <!-- =============================================
         INTELLIGENCE
    ============================================== -->

    <section class="ultimate-settings-section">

        <div class="ultimate-section-title">
            <span>🧠</span>

            <div>
                <h3>Intelligence Core</h3>
                <p>Control how AP Synapse reasons and responds.</p>
            </div>
        </div>

        <div class="ultimate-settings-grid">

            ${ultimateToggle(
                "adaptiveReasoning",
                "Adaptive Reasoning",
                "Automatically adapt reasoning depth to the task."
            )}

            ${ultimateToggle(
                "selfCheck",
                "Self Check",
                "Review generated responses before presenting them."
            )}

            ${ultimateToggle(
                "answerVerification",
                "Answer Verification",
                "Perform additional consistency checks."
            )}

            ${ultimateToggle(
                "contextAwareness",
                "Context Awareness",
                "Use relevant conversation context automatically."
            )}

            ${ultimateToggle(
                "continuity",
                "Conversation Continuity",
                "Preserve the current conversation flow."
            )}

            ${ultimateToggle(
                "longContext",
                "Long Context",
                "Prioritize larger amounts of relevant context."
            )}

            ${ultimateToggle(
                "precisionMode",
                "Precision Mode",
                "Prioritize accuracy and instruction following."
            )}

        </div>

    </section>


    <!-- =============================================
         MEMORY
    ============================================== -->

    <section class="ultimate-settings-section">

        <div class="ultimate-section-title">
            <span>🧬</span>

            <div>
                <h3>Memory Architecture</h3>
                <p>Control what AP Synapse remembers within your workspace.</p>
            </div>
        </div>

        <div class="ultimate-settings-grid">

            ${ultimateToggle(
                "conversationMemory",
                "Conversation Memory",
                "Retain useful context during a conversation."
            )}

            ${ultimateToggle(
                "projectMemory",
                "Project Memory",
                "Keep project-related context together."
            )}

            ${ultimateToggle(
                "workspaceMemory",
                "Workspace Memory",
                "Maintain useful workspace state."
            )}

            ${ultimateToggle(
                "persistentPreferences",
                "Persistent Preferences",
                "Remember supported interface preferences."
            )}

        </div>

    </section>


    <!-- =============================================
         RESEARCH
    ============================================== -->

    <section class="ultimate-settings-section">

        <div class="ultimate-section-title">
            <span>🔬</span>

            <div>
                <h3>Research Engine</h3>
                <p>Configure research and verification behaviour.</p>
            </div>
        </div>

        <div class="ultimate-settings-grid">

            ${ultimateToggle(
                "webResearch",
                "Web Research",
                "Allow web-enabled research when available."
            )}

            ${ultimateToggle(
                "deepResearch",
                "Deep Research",
                "Use deeper research workflows when supported."
            )}

            ${ultimateToggle(
                "multiSourceResearch",
                "Multi-Source Research",
                "Compare information across multiple sources."
            )}

            ${ultimateToggle(
                "factVerification",
                "Fact Verification",
                "Prioritize verification of important claims."
            )}

            ${ultimateToggle(
                "contradictionDetection",
                "Contradiction Detection",
                "Flag conflicting information."
            )}

            ${ultimateToggle(
                "citations",
                "Citations",
                "Show available source references."
            )}

        </div>

    </section>


    <!-- =============================================
         CODE
    ============================================== -->

    <section class="ultimate-settings-section">

        <div class="ultimate-section-title">
            <span>💻</span>

            <div>
                <h3>Code Intelligence</h3>
                <p>Configure AP Synapse for software development.</p>
            </div>
        </div>

        <div class="ultimate-settings-grid">

            ${ultimateToggle(
                "codeGeneration",
                "Code Generation",
                "Generate code and implementation suggestions."
            )}

            ${ultimateToggle(
                "debugging",
                "Debugging",
                "Analyze errors and potential bugs."
            )}

            ${ultimateToggle(
                "codeExplanation",
                "Code Explanation",
                "Explain complex code."
            )}

            ${ultimateToggle(
                "refactoring",
                "Refactoring",
                "Improve structure and maintainability."
            )}

            ${ultimateToggle(
                "codeOptimization",
                "Optimization",
                "Look for performance improvements."
            )}

            ${ultimateToggle(
                "securityReview",
                "Security Review",
                "Review code for common security concerns."
            )}

            ${ultimateToggle(
                "testGeneration",
                "Test Generation",
                "Generate test suggestions."
            )}

        </div>

    </section>


    <!-- =============================================
         DOCUMENTS
    ============================================== -->

    <section class="ultimate-settings-section">

        <div class="ultimate-section-title">
            <span>📄</span>

            <div>
                <h3>Documents & Vision</h3>
                <p>Configure file and visual intelligence.</p>
            </div>
        </div>

        <div class="ultimate-settings-grid">

            ${ultimateToggle(
                "documentAnalysis",
                "Document Analysis",
                "Analyze supported uploaded documents."
            )}

            ${ultimateToggle(
                "multiFileContext",
                "Multi-File Context",
                "Use multiple supported files together."
            )}

            ${ultimateToggle(
                "crossDocumentComparison",
                "Cross-Document Comparison",
                "Compare information across documents."
            )}

            ${ultimateToggle(
                "imageUnderstanding",
                "Image Understanding",
                "Interpret supported visual content."
            )}

        </div>

    </section>


    <!-- =============================================
         CREATION
    ============================================== -->

    <section class="ultimate-settings-section">

        <div class="ultimate-section-title">
            <span>🎨</span>

            <div>
                <h3>Creative Engine</h3>
                <p>Control supported creative capabilities.</p>
            </div>
        </div>

        <div class="ultimate-settings-grid">

            ${ultimateToggle(
                "imageGeneration",
                "Image Generation",
                "Enable image-generation workflows when available."
            )}

            ${ultimateToggle(
                "diagramCreation",
                "Diagram Creation",
                "Enable diagram and visual-thinking workflows."
            )}

            ${ultimateToggle(
                "creativeMode",
                "Creative Mode",
                "Prioritize creative exploration."
            )}

        </div>

    </section>


    <!-- =============================================
         RELIABILITY
    ============================================== -->

    <section class="ultimate-settings-section">

        <div class="ultimate-section-title">
            <span>🛡️</span>

            <div>
                <h3>Reliability & Recovery</h3>
                <p>Configure client-side recovery behaviour.</p>
            </div>
        </div>

        <div class="ultimate-settings-grid">

            ${ultimateToggle(
                "automaticRecovery",
                "Automatic Recovery",
                "Attempt recovery from supported transient failures."
            )}

            ${ultimateToggle(
                "retryFailedRequests",
                "Retry Failed Requests",
                "Retry supported transient requests."
            )}

            ${ultimateToggle(
                "connectionDiagnostics",
                "Connection Diagnostics",
                "Expose connection-state diagnostics."
            )}

            ${ultimateToggle(
                "sessionRecovery",
                "Session Recovery",
                "Preserve recoverable session state."
            )}

        </div>

    </section>


    <!-- =============================================
         EXPERIENCE
    ============================================== -->

    <section class="ultimate-settings-section">

        <div class="ultimate-section-title">
            <span>✨</span>

            <div>
                <h3>Workspace Experience</h3>
                <p>Personalize your AP Synapse environment.</p>
            </div>
        </div>

        <div class="ultimate-settings-grid">

            ${ultimateToggle(
                "focusMode",
                "Focus Mode",
                "Reduce workspace distractions."
            )}

            ${ultimateToggle(
                "fullScreenMode",
                "Full Screen",
                "Expand the workspace."
            )}

            ${ultimateToggle(
                "intelligenceField",
                "Intelligence Field",
                "Show the animated intelligence environment."
            )}

            ${ultimateToggle(
                "animations",
                "Interface Animations",
                "Enable interface motion."
            )}

            ${ultimateToggle(
                "notifications",
                "Notifications",
                "Enable interface notifications."
            )}

        </div>

    </section>


    <div class="ultimate-settings-actions">

        <button id="exportSynapseSettings">
            Export Settings
        </button>

        <button id="resetUltimateSettings">
            Reset All Settings
        </button>

    </div>

    `;

    page.appendChild(wrapper);


    // ---------------------------------------------
    // Toggle events
    // ---------------------------------------------

    wrapper
        .querySelectorAll("[data-ultimate-setting]")
        .forEach(button => {

            const key =
                button.dataset.ultimateSetting;

            refreshUltimateToggle(
                button,
                AP_ULTIMATE_SETTINGS[key]
            );

            button.addEventListener("click", () => {

                AP_ULTIMATE_SETTINGS[key] =
                    !AP_ULTIMATE_SETTINGS[key];

                refreshUltimateToggle(
                    button,
                    AP_ULTIMATE_SETTINGS[key]
                );

                applyUltimateSetting(
                    key,
                    AP_ULTIMATE_SETTINGS[key]
                );

            });

        });


    // ---------------------------------------------
    // Export
    // ---------------------------------------------

    document
        .getElementById("exportSynapseSettings")
        ?.addEventListener("click", () => {

            const data =
                JSON.stringify(
                    AP_ULTIMATE_SETTINGS,
                    null,
                    2
                );

            const blob =
                new Blob(
                    [data],
                    { type: "application/json" }
                );

            const url =
                URL.createObjectURL(blob);

            const a =
                document.createElement("a");

            a.href = url;
            a.download = "ap-synapse-settings.json";

            a.click();

            URL.revokeObjectURL(url);

            window.showToast?.(
                "Settings exported"
            );

        });


    // ---------------------------------------------
    // Reset
    // ---------------------------------------------

    document
        .getElementById("resetUltimateSettings")
        ?.addEventListener("click", () => {

            Object.keys(AP_ULTIMATE_SETTINGS)
                .forEach(key => {

                    AP_ULTIMATE_SETTINGS[key] =
                        defaultUltimateValue(key);

                });

            wrapper
                .querySelectorAll("[data-ultimate-setting]")
                .forEach(button => {

                    const key =
                        button.dataset.ultimateSetting;

                    refreshUltimateToggle(
                        button,
                        AP_ULTIMATE_SETTINGS[key]
                    );

                });

            window.showToast?.(
                "AP Synapse settings restored"
            );

        });


    // Make available to other modules

    window.AP_SYNAPSE_SETTINGS =
        AP_ULTIMATE_SETTINGS;

}


function ultimateToggle(
    key,
    title,
    description
) {

    return `

        <button
            type="button"
            class="ultimate-setting"
            data-ultimate-setting="${key}"
        >

            <span class="ultimate-setting-main">

                <strong>${title}</strong>

                <small>${description}</small>

            </span>

            <span class="ultimate-switch">
                OFF
            </span>

        </button>

    `;

}


function refreshUltimateToggle(
    button,
    enabled
) {

    button.classList.toggle(
        "enabled",
        Boolean(enabled)
    );

    const indicator =
        button.querySelector(
            ".ultimate-switch"
        );

    if (indicator) {

        indicator.textContent =
            enabled
                ? "ON"
                : "OFF";

    }

}


function defaultUltimateValue(key) {

    const defaults = {

        adaptiveReasoning: true,
        selfCheck: true,
        answerVerification: true,
        contextAwareness: true,
        continuity: true,
        longContext: true,
        precisionMode: true,

        conversationMemory: true,
        projectMemory: true,
        workspaceMemory: true,
        persistentPreferences: true,

        webResearch: true,
        deepResearch: false,
        multiSourceResearch: true,
        factVerification: true,
        contradictionDetection: true,
        citations: true,

        codeGeneration: true,
        debugging: true,
        codeExplanation: true,
        refactoring: true,
        codeOptimization: true,
        securityReview: true,
        testGeneration: true,

        documentAnalysis: true,
        multiFileContext: true,
        crossDocumentComparison: true,
        imageUnderstanding: true,

        imageGeneration: true,
        diagramCreation: true,
        creativeMode: true,

        automaticRecovery: true,
        retryFailedRequests: true,
        connectionDiagnostics: true,
        sessionRecovery: true,

        focusMode: false,
        fullScreenMode: false,
        intelligenceField: true,
        animations: true,
        notifications: true

    };

    return defaults[key] ?? false;

}


function applyUltimateSetting(
    key,
    value
) {

    window.AP_SYNAPSE_SETTINGS =
        AP_ULTIMATE_SETTINGS;


    if (key === "webResearch") {
        window.webMode = value;
    }

    if (key === "deepResearch") {
        window.deepResearch = value;
    }

    if (key === "conversationMemory") {
        window.apSynapseMemory = value;
    }

    if (key === "imageUnderstanding") {
        window.apSynapseVision = value;
    }

    if (key === "imageGeneration") {
        window.apSynapseImageGeneration = value;
    }

    if (key === "automaticRecovery") {
        window.apSynapseAutoRecovery = value;
    }

    if (key === "retryFailedRequests") {
        window.apSynapseRetry = value;
    }

    if (key === "focusMode") {
        document.body.classList.toggle(
            "focus-mode",
            value
        );
    }

    if (key === "fullScreenMode") {

        if (value) {

            document.documentElement
                .requestFullscreen?.();

        } else if (document.fullscreenElement) {

            document.exitFullscreen?.();

        }

    }

    if (key === "intelligenceField") {

        const field =
            document.getElementById(
                "intelligence-field"
            );

        if (field) {

            field.style.display =
                value
                    ? ""
                    : "none";

        }

    }

    if (key === "animations") {

        document.body.classList.toggle(
            "animations-disabled",
            !value
        );

    }

    if (key === "notifications") {

        window.apSynapseNotifications =
            value;

    }

}


if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        createUltimateSettings
    );

} else {

    createUltimateSettings();

}