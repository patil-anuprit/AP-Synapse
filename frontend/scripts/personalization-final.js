(() => {

    "use strict";


    if (
        window.__AP_PERSONALIZATION_FINAL__
    ) {
        return;
    }


    window.__AP_PERSONALIZATION_FINAL__ =
        true;


    const API =
        "https://api.ap-synapse.com";


    const TOKEN_KEY =
        "apSynapsePersonalizationToken";


    const GUEST_KEY =
        "apSynapsePersonalizationGuestId";


    const DEFAULTS = {

        enabled: true,

        memoryEnabled: true,

        preferredName: "",

        occupation: "",

        professionalRole: "",

        industry: "",

        educationLevel: "",

        expertise: "",

        interests: "",

        goals: "",

        preferredLanguage: "Auto",

        responseDepth: "Balanced",

        responseStyle: "Adaptive",

        customInstructions: ""

    };


    let state = {
        ...DEFAULTS
    };


    let authenticated =
        false;


    let panel = null;

    let memoryVisible =
        false;


    /* ========================================================
       IDENTITY
       ======================================================== */


    function createId() {

        if (
            crypto?.randomUUID
        ) {
            return crypto.randomUUID();
        }


        return (
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .slice(2) +
            "-" +
            Math.random()
                .toString(36)
                .slice(2)
        );

    }


    function guestId() {

        let value =
            localStorage.getItem(
                GUEST_KEY
            );


        if (!value) {

            value =
                "browser-" +
                createId();


            localStorage.setItem(
                GUEST_KEY,
                value
            );

        }


        return value;

    }


    function token() {

        return (
            localStorage.getItem(
                TOKEN_KEY
            ) ||
            ""
        );

    }


    function setToken(
        value
    ) {

        const safe =
            String(
                value || ""
            )
            .trim();


        if (safe) {

            localStorage.setItem(
                TOKEN_KEY,
                safe
            );

        }
        else {

            localStorage.removeItem(
                TOKEN_KEY
            );

        }


        window.dispatchEvent(
            new CustomEvent(
                "ap-personalization-auth-changed"
            )
        );

    }


    function authHeaders(
        extra = {}
    ) {

        const headers =
            new Headers(
                extra || {}
            );


        headers.set(
            "x-personalization-id",
            guestId()
        );


        const authToken =
            token();


        if (authToken) {

            headers.set(
                "Authorization",
                `Bearer ${authToken}`
            );

        }


        return headers;

    }


    /* ========================================================
       GLOBAL API IDENTITY BRIDGE
       --------------------------------------------------------
       Existing chat.js does not need to be rewritten.
       Every runtime fetch to AP Synapse receives identity.
       ======================================================== */


    const nativeFetch =
        window.fetch.bind(
            window
        );


    window.fetch =
        async function (
            input,
            init = {}
        ) {

            const url =

                input instanceof Request

                    ? input.url

                    : String(
                        input
                    );


            const isAPRequest =
                url.startsWith(
                    API
                ) ||
                url.startsWith(
                    "/chat"
                ) ||
                url.startsWith(
                    "/personalization"
                );


            let finalInput =
                input;


            let finalInit = {
                ...init
            };


            if (isAPRequest) {

                const sourceHeaders =

                    input instanceof Request

                        ? input.headers

                        : init.headers;


                const headers =
                    authHeaders(
                        sourceHeaders
                    );


                finalInit.headers =
                    headers;


                if (
                    input instanceof Request
                ) {

                    finalInput =
                        new Request(
                            input,
                            finalInit
                        );


                    finalInit =
                        undefined;

                }

            }


            const response =
                await nativeFetch(
                    finalInput,
                    finalInit
                );


            /*
             * Google Sign-In returns a signed
             * personalization token.
             *
             * Capture it without changing the existing
             * Google/Profile implementation.
             */
            if (
                url.includes(
                    "/auth/google"
                )
            ) {

                response
                    .clone()
                    .json()
                    .then(
                        data => {

                            if (
                                data?.success &&
                                data?.personalizationToken
                            ) {

                                setToken(
                                    data.personalizationToken
                                );

                                setTimeout(
                                    loadProfile,
                                    100
                                );

                            }

                        }
                    )
                    .catch(
                        () => {}
                    );

            }


            return response;

        };


    /* ========================================================
       SIGN-OUT BRIDGE
       ======================================================== */


    document.addEventListener(
        "click",
        event => {

            const target =
                event.target
                    ?.closest?.(
                        "#synapseSignOutBtn," +
                        "[data-account-action='signout']"
                    );


            if (!target) {
                return;
            }


            setToken(
                ""
            );


            authenticated =
                false;


            setTimeout(
                loadProfile,
                150
            );

        },
        true
    );


    /* ========================================================
       API
       ======================================================== */


    async function api(
        path,
        options = {}
    ) {

        const response =
            await nativeFetch(
                API + path,
                {
                    ...options,

                    headers:
                        authHeaders({
                            "Content-Type":
                                "application/json",

                            ...(options.headers || {})
                        })
                }
            );


        let data = null;


        try {

            data =
                await response.json();

        }
        catch {}


        if (
            !response.ok
        ) {

            throw new Error(
                data?.error ||
                "Personalization request failed."
            );

        }


        return (
            data ||
            {}
        );

    }


    /* ========================================================
       SAFE TEXT
       ======================================================== */


    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

    }


    /* ========================================================
       UI
       ======================================================== */


    function buildPanel() {

        if (
            document.getElementById(
                "apPersonalizationPanel"
            )
        ) {

            panel =
                document.getElementById(
                    "apPersonalizationPanel"
                );

            return panel;

        }


        const profile =
            document.getElementById(
                "profileCard"
            );


        if (!profile) {
            return null;
        }


        panel =
            document.createElement(
                "section"
            );


        panel.id =
            "apPersonalizationPanel";


        panel.innerHTML = `
<div class="ap-personalization-shell">

    <div class="ap-personalization-head">

        <div>

            <div class="ap-personalization-kicker">
                AP Intelligence Profile
            </div>

            <h3 class="ap-personalization-title">
                Personalization
            </h3>

            <p class="ap-personalization-description">
                Shape how AP Synapse understands you.
                Relevant profile details and memories are used
                quietly across future conversations.
            </p>

        </div>

        <div
            id="apPersonalizationSync"
            class="ap-personalization-sync">
            This browser
        </div>

    </div>


    <div class="ap-personalization-controls">

        <div class="ap-personalization-switch">

            <div class="ap-personalization-switch-copy">

                <strong>
                    Personalization
                </strong>

                <span>
                    Adapt responses to your profile.
                </span>

            </div>

            <button
                id="apPersonalizationEnabled"
                class="ap-personalization-toggle"
                type="button"
                aria-label="Toggle personalization"
                data-on="true">
            </button>

        </div>


        <div class="ap-personalization-switch">

            <div class="ap-personalization-switch-copy">

                <strong>
                    Memory
                </strong>

                <span>
                    Keep useful context across conversations.
                </span>

            </div>

            <button
                id="apMemoryEnabled"
                class="ap-personalization-toggle"
                type="button"
                aria-label="Toggle memory"
                data-on="true">
            </button>

        </div>

    </div>


    <div class="ap-personalization-body">

        <div class="ap-personalization-section-title">
            About you
        </div>


        <div class="ap-personalization-grid">


            <div class="ap-personalization-field">

                <label for="apPreferredName">
                    What should AP Synapse call you?
                </label>

                <input
                    id="apPreferredName"
                    class="ap-personalization-input"
                    maxlength="80"
                    autocomplete="name"
                    placeholder="Preferred name">

            </div>


            <div class="ap-personalization-field">

                <label for="apOccupation">
                    Occupation
                </label>

                <input
                    id="apOccupation"
                    class="ap-personalization-input"
                    maxlength="120"
                    placeholder="e.g. Doctor, Student, Engineer">

            </div>


            <div class="ap-personalization-field">

                <label for="apProfessionalRole">
                    Role / specialization
                </label>

                <input
                    id="apProfessionalRole"
                    class="ap-personalization-input"
                    maxlength="120"
                    placeholder="e.g. General Physician">

            </div>


            <div class="ap-personalization-field">

                <label for="apIndustry">
                    Field / industry
                </label>

                <input
                    id="apIndustry"
                    class="ap-personalization-input"
                    maxlength="120"
                    placeholder="e.g. Healthcare">

            </div>


            <div class="ap-personalization-field">

                <label for="apEducationLevel">
                    Education / learning level
                </label>

                <input
                    id="apEducationLevel"
                    class="ap-personalization-input"
                    maxlength="160"
                    placeholder="e.g. Medical professional">

            </div>


            <div class="ap-personalization-field">

                <label for="apPreferredLanguage">
                    Preferred language
                </label>

                <select
                    id="apPreferredLanguage"
                    class="ap-personalization-select">

                    <option value="Auto">
                        Automatic
                    </option>

                    <option value="English">
                        English
                    </option>

                    <option value="Hindi">
                        Hindi
                    </option>

                    <option value="Marathi">
                        Marathi
                    </option>

                </select>

            </div>


            <div class="ap-personalization-field ap-wide">

                <label for="apExpertise">
                    Expertise
                </label>

                <textarea
                    id="apExpertise"
                    class="ap-personalization-textarea"
                    maxlength="700"
                    placeholder="Subjects, skills or areas where you already have strong knowledge"></textarea>

            </div>


            <div class="ap-personalization-field ap-wide">

                <label for="apInterests">
                    Interests
                </label>

                <textarea
                    id="apInterests"
                    class="ap-personalization-textarea"
                    maxlength="1200"
                    placeholder="Topics and areas you care about"></textarea>

            </div>


            <div class="ap-personalization-field ap-wide">

                <label for="apGoals">
                    Goals
                </label>

                <textarea
                    id="apGoals"
                    class="ap-personalization-textarea"
                    maxlength="1200"
                    placeholder="What are you working toward?"></textarea>

            </div>


            <div class="ap-personalization-field">

                <label for="apResponseDepth">
                    Response depth
                </label>

                <select
                    id="apResponseDepth"
                    class="ap-personalization-select">

                    <option value="Concise">
                        Concise
                    </option>

                    <option value="Balanced">
                        Balanced
                    </option>

                    <option value="Detailed">
                        Detailed
                    </option>

                    <option value="Expert">
                        Expert
                    </option>

                </select>

            </div>


            <div class="ap-personalization-field">

                <label for="apResponseStyle">
                    Response style
                </label>

                <select
                    id="apResponseStyle"
                    class="ap-personalization-select">

                    <option value="Adaptive">
                        Adaptive
                    </option>

                    <option value="Professional">
                        Professional
                    </option>

                    <option value="Direct">
                        Direct
                    </option>

                    <option value="Explanatory">
                        Explanatory
                    </option>

                    <option value="Technical">
                        Technical
                    </option>

                    <option value="Simple">
                        Simple
                    </option>

                </select>

            </div>


            <div class="ap-personalization-field ap-wide">

                <label for="apCustomInstructions">
                    Custom instructions
                </label>

                <textarea
                    id="apCustomInstructions"
                    class="ap-personalization-textarea ap-large"
                    maxlength="2400"
                    placeholder="Anything else AP Synapse should keep in mind when answering you"></textarea>

                <div class="ap-personalization-hint">
                    Personalization is applied only when relevant.
                    Do not enter passwords, API keys or other secrets.
                </div>

            </div>

        </div>


        <div class="ap-personalization-actions">

            <button
                id="apSavePersonalization"
                class="ap-personalization-button ap-primary"
                type="button">
                Save personalization
            </button>

            <button
                id="apViewMemory"
                class="ap-personalization-button"
                type="button">
                View memory
            </button>

            <span
                id="apPersonalizationSaveState"
                class="ap-personalization-save-state">
            </span>

        </div>


        <div
            id="apPersonalizationMemory"
            class="ap-personalization-memory"
            hidden>

            <div class="ap-personalization-memory-head">

                <div>

                    <div class="ap-personalization-memory-title">
                        Memory
                    </div>

                    <div
                        id="apMemorySubtitle"
                        class="ap-personalization-memory-subtitle">
                        Useful details AP Synapse remembers.
                    </div>

                </div>

                <button
                    id="apClearMemory"
                    class="ap-personalization-button ap-danger"
                    type="button">
                    Clear memory
                </button>

            </div>


            <div
                id="apMemoryList"
                class="ap-personalization-memory-list">
            </div>


            <div class="ap-personalization-add-memory">

                <input
                    id="apManualMemory"
                    class="ap-personalization-input"
                    maxlength="1000"
                    placeholder="Add something useful to remember">

                <button
                    id="apAddMemory"
                    class="ap-personalization-button"
                    type="button">
                    Remember
                </button>

            </div>

        </div>

    </div>

</div>
`;


        const accountSection =
            profile.querySelector(
                ".profile-account-section"
            );


        const capabilities =
            profile.querySelector(
                ".profile-capabilities"
            );


        if (accountSection) {

            accountSection
                .parentNode
                .insertBefore(
                    panel,
                    accountSection
                );

        }
        else if (capabilities) {

            capabilities
                .insertAdjacentElement(
                    "afterend",
                    panel
                );

        }
        else {

            profile.appendChild(
                panel
            );

        }


        bindPanel();


        return panel;

    }


    /* ========================================================
       FORM HELPERS
       ======================================================== */


    const fields = {

        preferredName:
            "apPreferredName",

        occupation:
            "apOccupation",

        professionalRole:
            "apProfessionalRole",

        industry:
            "apIndustry",

        educationLevel:
            "apEducationLevel",

        expertise:
            "apExpertise",

        interests:
            "apInterests",

        goals:
            "apGoals",

        preferredLanguage:
            "apPreferredLanguage",

        responseDepth:
            "apResponseDepth",

        responseStyle:
            "apResponseStyle",

        customInstructions:
            "apCustomInstructions"

    };


    function element(
        id
    ) {

        return document.getElementById(
            id
        );

    }


    function setStatus(
        text,
        error = false
    ) {

        const output =
            element(
                "apPersonalizationSaveState"
            );


        if (!output) {
            return;
        }


        output.textContent =
            text || "";


        output.style.color =
            error

                ? "rgba(255,155,155,.86)"

                : "";

    }


    function readForm() {

        const result = {
            ...state
        };


        for (
            const [
                key,
                id
            ]
            of Object.entries(
                fields
            )
        ) {

            result[key] =
                element(id)
                    ?.value
                    ?.trim?.() ??
                "";

        }


        result.enabled =
            element(
                "apPersonalizationEnabled"
            )
            ?.dataset
            ?.on === "true";


        result.memoryEnabled =
            element(
                "apMemoryEnabled"
            )
            ?.dataset
            ?.on === "true";


        return result;

    }


    function renderForm() {

        if (!panel) {
            return;
        }


        for (
            const [
                key,
                id
            ]
            of Object.entries(
                fields
            )
        ) {

            const control =
                element(id);


            if (!control) {
                continue;
            }


            control.value =
                state[key] ??
                DEFAULTS[key] ??
                "";

        }


        const enabled =
            element(
                "apPersonalizationEnabled"
            );


        const memory =
            element(
                "apMemoryEnabled"
            );


        if (enabled) {

            enabled.dataset.on =
                String(
                    state.enabled !== false
                );

        }


        if (memory) {

            memory.dataset.on =
                String(
                    state.memoryEnabled !== false
                );

        }


        const sync =
            element(
                "apPersonalizationSync"
            );


        if (sync) {

            sync.textContent =
                authenticated

                    ? "Account synced"

                    : "This browser";

        }

    }


    /* ========================================================
       PROFILE LOAD / SAVE
       ======================================================== */


    async function loadProfile() {

        try {

            buildPanel();


            const data =
                await api(
                    "/personalization/profile"
                );


            authenticated =
                data.authenticated === true;


            state = {
                ...DEFAULTS,
                ...(data.profile || {})
            };


            renderForm();


            setStatus(
                ""
            );


            if (
                memoryVisible
            ) {

                await loadMemories();

            }

        }
        catch (error) {

            console.warn(
                "AP Personalization load:",
                error?.message ||
                error
            );


            setStatus(
                "Unable to load",
                true
            );

        }

    }


    async function saveProfile() {

        try {

            setStatus(
                "Saving..."
            );


            const payload =
                readForm();


            const data =
                await api(
                    "/personalization/profile",
                    {
                        method:
                            "PUT",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            state = {
                ...DEFAULTS,
                ...(data.profile || payload)
            };


            authenticated =
                data.authenticated === true;


            renderForm();


            setStatus(
                "Saved"
            );


            setTimeout(
                () => {

                    if (
                        element(
                            "apPersonalizationSaveState"
                        )
                        ?.textContent ===
                        "Saved"
                    ) {

                        setStatus(
                            ""
                        );

                    }

                },
                2200
            );

        }
        catch (error) {

            console.error(
                "AP Personalization save:",
                error
            );


            setStatus(
                "Save failed",
                true
            );

        }

    }


    /* ========================================================
       MEMORY
       ======================================================== */


    async function loadMemories() {

        const list =
            element(
                "apMemoryList"
            );


        if (!list) {
            return;
        }


        list.innerHTML =
            `
            <div class="ap-personalization-empty">
                Loading memory...
            </div>
            `;


        try {

            const data =
                await api(
                    "/personalization/memories?limit=100"
                );


            const memories =
                Array.isArray(
                    data.memories
                )
                    ? data.memories
                    : [];


            const subtitle =
                element(
                    "apMemorySubtitle"
                );


            if (subtitle) {

                subtitle.textContent =
                    memories.length

                        ? `${memories.length} saved ${
                            memories.length === 1
                                ? "memory"
                                : "memories"
                        }`

                        : "No saved memories yet.";

            }


            if (!memories.length) {

                list.innerHTML =
                    `
                    <div class="ap-personalization-empty">
                        AP Synapse has not saved any long-term
                        memories yet. Useful context can appear here
                        naturally as you continue using it.
                    </div>
                    `;

                return;
            }


            list.innerHTML =
                memories
                    .map(
                        memory => `

<div
    class="ap-personalization-memory-item"
    data-memory-id="${Number(memory.id)}">

    <div>

        <span class="ap-personalization-memory-category">
            ${escapeHtml(memory.category || "context")}
        </span>

        <div class="ap-personalization-memory-content">
            ${escapeHtml(memory.content || "")}
        </div>

    </div>

    <button
        class="ap-personalization-memory-delete"
        type="button"
        data-forget-memory="${Number(memory.id)}"
        aria-label="Forget this memory"
        title="Forget">
        ×
    </button>

</div>
`
                    )
                    .join(
                        ""
                    );

        }
        catch (error) {

            list.innerHTML =
                `
                <div class="ap-personalization-empty">
                    Unable to load memory right now.
                </div>
                `;

        }

    }


    async function forgetMemory(
        id
    ) {

        if (!id) {
            return;
        }


        try {

            await api(
                `/personalization/memories/${encodeURIComponent(id)}`,
                {
                    method:
                        "DELETE"
                }
            );


            await loadMemories();

        }
        catch (error) {

            console.error(
                "Forget memory failed:",
                error
            );

        }

    }


    async function clearMemory() {

        const confirmed =
            window.confirm(
                "Clear all AP Synapse memory? Your personalization profile will remain, but saved memories and cross-conversation context will be removed."
            );


        if (!confirmed) {
            return;
        }


        try {

            await api(
                "/personalization/memories",
                {
                    method:
                        "DELETE"
                }
            );


            await loadMemories();


            setStatus(
                "Memory cleared"
            );

        }
        catch (error) {

            setStatus(
                "Unable to clear memory",
                true
            );

        }

    }


    async function addMemory() {

        const input =
            element(
                "apManualMemory"
            );


        const content =
            String(
                input?.value ||
                ""
            )
            .trim();


        if (!content) {
            return;
        }


        try {

            await api(
                "/personalization/memories",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify({
                            category:
                                "user-saved",

                            content,

                            importance:
                                8
                        })
                }
            );


            input.value =
                "";


            await loadMemories();

        }
        catch (error) {

            setStatus(
                "Unable to save memory",
                true
            );

        }

    }


    /* ========================================================
       EVENTS
       ======================================================== */


    function toggleButton(
        button
    ) {

        if (!button) {
            return;
        }


        button.dataset.on =
            button.dataset.on === "true"

                ? "false"

                : "true";

    }


    function bindPanel() {

        if (
            !panel ||
            panel.dataset.bound ===
            "true"
        ) {

            return;

        }


        panel.dataset.bound =
            "true";


        element(
            "apPersonalizationEnabled"
        )
        ?.addEventListener(
            "click",
            event => {

                toggleButton(
                    event.currentTarget
                );

            }
        );


        element(
            "apMemoryEnabled"
        )
        ?.addEventListener(
            "click",
            event => {

                toggleButton(
                    event.currentTarget
                );

            }
        );


        element(
            "apSavePersonalization"
        )
        ?.addEventListener(
            "click",
            saveProfile
        );


        element(
            "apViewMemory"
        )
        ?.addEventListener(
            "click",
            async () => {

                memoryVisible =
                    !memoryVisible;


                const area =
                    element(
                        "apPersonalizationMemory"
                    );


                if (!area) {
                    return;
                }


                area.hidden =
                    !memoryVisible;


                element(
                    "apViewMemory"
                ).textContent =
                    memoryVisible

                        ? "Hide memory"

                        : "View memory";


                if (
                    memoryVisible
                ) {

                    await loadMemories();

                }

            }
        );


        element(
            "apClearMemory"
        )
        ?.addEventListener(
            "click",
            clearMemory
        );


        element(
            "apAddMemory"
        )
        ?.addEventListener(
            "click",
            addMemory
        );


        element(
            "apManualMemory"
        )
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    addMemory();

                }

            }
        );


        element(
            "apMemoryList"
        )
        ?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-forget-memory]"
                    );


                if (!button) {
                    return;
                }


                forgetMemory(
                    button.dataset
                        .forgetMemory
                );

            }
        );

    }


    /* ========================================================
       PROFILE OPEN DETECTION
       ======================================================== */


    function profileVisible() {

        const profile =
            document.getElementById(
                "profileCard"
            );


        if (!profile) {
            return false;
        }


        const style =
            getComputedStyle(
                profile
            );


        return (
            style.display !==
                "none" &&
            style.visibility !==
                "hidden"
        );

    }


    let lastProfileVisible =
        false;


    function watchProfile() {

        const visible =
            profileVisible();


        if (
            visible &&
            !lastProfileVisible
        ) {

            buildPanel();

            loadProfile();

        }


        lastProfileVisible =
            visible;

    }


    const observer =
        new MutationObserver(
            watchProfile
        );


    observer.observe(
        document.documentElement,
        {
            subtree:
                true,

            attributes:
                true,

            attributeFilter: [
                "class",
                "style"
            ]
        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "#profileBtn," +
                    "#profileSidebarBtn," +
                    "#apRailProfile," +
                    "[data-action='profile']"
                )
            ) {

                setTimeout(
                    () => {

                        buildPanel();

                        loadProfile();

                    },
                    80
                );

            }

        },
        true
    );


    window.addEventListener(
        "ap-personalization-auth-changed",
        () => {

            setTimeout(
                loadProfile,
                80
            );

        }
    );


    /* ========================================================
       PUBLIC BRIDGE
       ======================================================== */


    window.AP_PERSONALIZATION = {

        load:
            loadProfile,

        save:
            saveProfile,

        memories:
            loadMemories,

        getToken:
            token,

        getGuestId:
            guestId

    };


    /*
     * Create browser identity immediately so every later
     * chat request has stable guest continuity.
     */
    guestId();


    /*
     * Build immediately if profile already exists.
     */
    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => {

                buildPanel();

                watchProfile();

            },
            {
                once: true
            }
        );

    }
    else {

        buildPanel();

        watchProfile();

    }


    console.log(
        "AP SYNAPSE PERSONALIZATION -> FINAL ACTIVE"
    );

})();
