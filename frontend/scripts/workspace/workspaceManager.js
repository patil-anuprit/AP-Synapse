import { getSessionId } from "../session.js";
import { openAssistant } from "./assistant.js";

function showToast(text) {
    const toast = document.createElement("div");

    toast.className = "toast";
    toast.textContent = text;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
}

export function showPage(pageId) {

const pages=document.querySelectorAll(".projects-page,.assistant-page,.conversation");

pages.forEach(page=>{
page.style.display="none";
});

const page=document.getElementById(pageId);

if(page){

page.style.display="block";

}

}

// ==========================================
// AP SYNAPSE KNOWLEDGE BASE
// ==========================================

const knowledgeInput =
    document.getElementById("knowledgeInput");

const saveKnowledgeBtn =
    document.getElementById("saveKnowledgeBtn");

const knowledgeGrid =
    document.getElementById("knowledgeGrid");

let knowledgeItems =
    JSON.parse(
        localStorage.getItem("apSynapseKnowledge") || "[]"
    );

function renderKnowledge() {

    if (!knowledgeGrid) return;

    knowledgeGrid.innerHTML = "";

    if (knowledgeItems.length === 0) {

        knowledgeGrid.innerHTML = `
            <div class="project-card">
                <h2>📚 Knowledge Library</h2>
                <p>
                    Your saved knowledge will appear here.
                </p>
            </div>
        `;

        return;
    }

    knowledgeItems.forEach((item, index) => {

        const card =
            document.createElement("div");

        card.className = "project-card";

        card.innerHTML = `
            <h2>${item.title}</h2>

            <p>${item.content}</p>

            <small>
                ${new Date(item.created).toLocaleString()}
            </small>

            <br><br>

            <button
                class="delete-knowledge"
                data-index="${index}">
                🗑 Delete
            </button>
        `;

        knowledgeGrid.appendChild(card);

    });

}

if (saveKnowledgeBtn) {

    saveKnowledgeBtn.addEventListener("click", () => {

        const content =
            knowledgeInput.value.trim();

        if (!content) {

            showToast("Write something first.");

            return;

        }

        knowledgeItems.unshift({

            title:
                `Knowledge ${knowledgeItems.length + 1}`,

            content: content,

            created:
                new Date().toISOString()

        });

        localStorage.setItem(
            "apSynapseKnowledge",
            JSON.stringify(knowledgeItems)
        );

        knowledgeInput.value = "";

        renderKnowledge();

        showToast("📚 Knowledge saved");

    });

}

if (knowledgeGrid) {

    knowledgeGrid.addEventListener("click", (event) => {

        if (
            !event.target.classList.contains(
                "delete-knowledge"
            )
        ) return;

        const index =
            Number(event.target.dataset.index);

        knowledgeItems.splice(index, 1);

        localStorage.setItem(
            "apSynapseKnowledge",
            JSON.stringify(knowledgeItems)
        );

        renderKnowledge();

        showToast("Knowledge removed.");

    });

}

renderKnowledge();

// ==========================================
// AP SYNAPSE AUTOMATION
// ==========================================

const runAutomationBtn =
    document.getElementById("runAutomationBtn");

if (runAutomationBtn) {

    runAutomationBtn.addEventListener(
        "click",
        async () => {

            const automationInput =
                document.getElementById(
                    "automationInput"
                );

            const automationResult =
                document.getElementById(
                    "automationResult"
                );

            const task =
                automationInput?.value.trim();

            if (!task) {

                showToast(
                    "Enter an automation task first."
                );

                return;

            }

            automationResult.textContent =
                "⚡ AP Synapse is running the workflow...";

            try {

                const response =
                    await fetch(
                        "https://ap-synapse-backend.onrender.com/chat",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "x-session-id":
                                    getSessionId()

                            },

                            body: JSON.stringify({

                                message:
`You are AP Synapse Automation.

Execute and reason through this workflow:

${task}

Give the user the result clearly and concisely.`,

                                web: false,

                                deep: true

                            })

                        }
                    );

                if (!response.ok) {

                    throw new Error(
                        "Automation request failed."
                    );

                }

                const result =
                    await response.text();

                automationResult.textContent =
                    result ||
                    "✅ Workflow completed.";

                showToast(
                    "⚡ Automation completed"
                );

            }

            catch (error) {

                console.error("AUTOMATION ERROR:", error);

                automationResult.textContent =
                    `⚠️ Automation failed.

            ${error.message}

            Please check the browser console for details.`;

                showToast("⚠️ Automation failed");

          }

        }
    );

}

// ==========================================
// AP SYNAPSE CODE STUDIO
// ==========================================

const codeGenerateBtn =
    document.getElementById(
        "codeGenerateBtn"
    );

if (codeGenerateBtn) {

    codeGenerateBtn.addEventListener(
        "click",
        async () => {

            const codeInput =
                document.getElementById(
                    "codeStudioInput"
                );

            const codeOutput =
                document.getElementById(
                    "codeStudioOutput"
                );

            const request =
                codeInput?.value.trim();

            if (!request) {

                showToast(
                    "Enter code or a coding request."
                );

                return;

            }

            codeOutput.textContent =
                "💻 AP Synapse Code Studio is thinking...";

            try {

                const response =
                    await fetch(
                        "https://ap-synapse-backend.onrender.com/chat",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "x-session-id":
                                    getSessionId()

                            },

                            body: JSON.stringify({

                                message:
`You are AP Synapse Code Studio.

Analyze the user's coding request.

Provide:

1. What the code/request is doing
2. Bugs or problems
3. Improvements
4. Better approach
5. Final working code when appropriate

Be technically accurate and practical.

USER REQUEST / CODE:

${request}`,

                                web: false,

                                deep: true

                            })

                        }
                    );

                if (!response.ok) {

                    throw new Error(
                        "Code Studio request failed."
                    );

                }

                const result =
                    await response.text();

                codeOutput.textContent =
                    result ||
                    "No result returned.";

                showToast(
                    "💻 Code Studio completed"
                );

            }

            catch (error) {

                console.error("CODE STUDIO ERROR:", error);

                codeOutput.textContent =
                    `⚠️ Code Studio failed.

            ${error.message}

            Please check the browser console for details.`;

                showToast("⚠️ Code Studio failed");

            }

        }
    );

}

document.getElementById("automationBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showPage("automationPage");
});

document.getElementById("codeStudioBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showPage("codeStudioPage");
});

document.getElementById("projectsBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showPage("projectsPage");
});

document.getElementById("knowledgeBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showPage("knowledgePage");
});

document.getElementById("documentsBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showPage("documentsPage");
});

document.getElementById("canvasBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showPage("canvasPage");
});

document.getElementById("assistantBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showPage("assistantPage");
});

// ==========================================================
// AP SYNAPSE — PROJECTS / DOCUMENTS / PROFILE
// ==========================================================

const PROJECT_STORAGE_KEY = "apSynapseProjects";

let dashboardProjects = JSON.parse(
    localStorage.getItem(PROJECT_STORAGE_KEY) || "[]"
);


// ==========================================================
// PROJECT MANAGER
// ==========================================================

const realProjectsGrid =
    document.getElementById("realProjectsGrid");

const projectSearchInput =
    document.getElementById("projectSearchInput");

const projectFilter =
    document.getElementById("projectFilter");

const createProjectDashboardBtn =
    document.getElementById("createProjectDashboardBtn");


function saveDashboardProjects() {

    localStorage.setItem(
        PROJECT_STORAGE_KEY,
        JSON.stringify(dashboardProjects)
    );

}


function updateProjectStats() {

    const count =
        document.getElementById("projectCount");

    const active =
        document.getElementById("activeProjectCount");

    const completed =
        document.getElementById("completedProjectCount");

    if (count)
        count.textContent = dashboardProjects.length;

    if (active)
        active.textContent =
            dashboardProjects.filter(
                p => p.status === "active"
            ).length;

    if (completed)
        completed.textContent =
            dashboardProjects.filter(
                p => p.status === "completed"
            ).length;

}


function renderDashboardProjects() {

    if (!realProjectsGrid) return;

    const search =
        projectSearchInput?.value
            .toLowerCase()
            .trim() || "";

    const filter =
        projectFilter?.value || "all";

    const filtered =
        dashboardProjects.filter(project => {

            const matchesSearch =
                project.name
                    .toLowerCase()
                    .includes(search) ||
                project.description
                    .toLowerCase()
                    .includes(search);

            const matchesFilter =
                filter === "all" ||
                project.status === filter;

            return matchesSearch && matchesFilter;

        });

    realProjectsGrid.innerHTML = "";

    if (!filtered.length) {

        realProjectsGrid.innerHTML = `
            <div class="project-card">
                <h2>✨ No projects yet</h2>

                <p>
                    Create your first project and turn an idea
                    into an organized workspace.
                </p>

                <button
                    class="create-project-btn"
                    id="emptyCreateProjectBtn"
                >
                    + Create Project
                </button>
            </div>
        `;

        document
            .getElementById("emptyCreateProjectBtn")
            ?.addEventListener(
                "click",
                createDashboardProject
            );

        updateProjectStats();

        return;

    }


    filtered.forEach(project => {

        const card =
            document.createElement("div");

        card.className = "project-card";

        card.innerHTML = `

            <div class="project-card-top">

                <span class="project-status ${project.status}">
                    ${project.status === "completed"
                        ? "Completed"
                        : "Active"}
                </span>

                <button
                    class="delete-dashboard-project"
                    data-id="${project.id}"
                    type="button"
                >
                    ×
                </button>

            </div>

            <h2>${escapeHTML(project.name)}</h2>

            <p>
                ${escapeHTML(project.description || "No description")}
            </p>

            <small>
                Created ${new Date(project.created).toLocaleDateString()}
            </small>

            <div class="project-card-actions">

                <button
                    class="open-dashboard-project"
                    data-id="${project.id}"
                >
                    Open
                </button>

                <button
                    class="toggle-dashboard-project"
                    data-id="${project.id}"
                >
                    ${
                        project.status === "completed"
                        ? "Reopen"
                        : "Complete"
                    }
                </button>

            </div>

        `;

        realProjectsGrid.appendChild(card);

    });

    updateProjectStats();

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function createDashboardProject() {

    const name =
        prompt("Project name:");

    if (!name?.trim()) return;

    const description =
        prompt("What is this project about?") || "";

    dashboardProjects.unshift({

        id: Date.now(),

        name: name.trim(),

        description:
            description.trim(),

        status: "active",

        created:
            new Date().toISOString()

    });

    saveDashboardProjects();

    renderDashboardProjects();

    showToast("✨ Project created");

}


createProjectDashboardBtn?.addEventListener(
    "click",
    createDashboardProject
);


projectSearchInput?.addEventListener(
    "input",
    renderDashboardProjects
);


projectFilter?.addEventListener(
    "change",
    renderDashboardProjects
);


realProjectsGrid?.addEventListener(
    "click",
    event => {

        const id =
            Number(
                event.target.dataset.id
            );

        if (!id) return;


        if (
            event.target.classList.contains(
                "delete-dashboard-project"
            )
        ) {

            dashboardProjects =
                dashboardProjects.filter(
                    project =>
                        project.id !== id
                );

            saveDashboardProjects();

            renderDashboardProjects();

            showToast("Project deleted");

            return;

        }


        if (
            event.target.classList.contains(
                "toggle-dashboard-project"
            )
        ) {

            const project =
                dashboardProjects.find(
                    p => p.id === id
                );

            if (!project) return;

            project.status =
                project.status === "completed"
                ? "active"
                : "completed";

            saveDashboardProjects();

            renderDashboardProjects();

            showToast(
                project.status === "completed"
                ? "✅ Project completed"
                : "Project reopened"
            );

            return;

        }


        if (
            event.target.classList.contains(
                "open-dashboard-project"
            )
        ) {

            const project =
                dashboardProjects.find(
                    p => p.id === id
                );

            if (!project) return;

            openAssistant?.();

            const input =
                document.getElementById(
                    "userInput"
                );

            if (input) {

                input.value =
                    `Open project "${project.name}" and help me continue working on it.`;

                input.focus();

            }

        }

    }
);


renderDashboardProjects();


// ==========================================================
// DOCUMENT MANAGER
// ==========================================================

const documentUploadBtn =
    document.getElementById("documentUploadBtn");

const documentUploadZone =
    document.getElementById("documentUploadZone");

const documentsGrid =
    document.getElementById("documentsGrid");

const documentSearchInput =
    document.getElementById("documentSearchInput");

const documentAskBtn =
    document.getElementById("documentAskBtn");


let storedDocuments =
    JSON.parse(
        localStorage.getItem("apSynapseDocuments") || "[]"
    );


function saveDocuments() {

    localStorage.setItem(
        "apSynapseDocuments",
        JSON.stringify(storedDocuments)
    );

}


function renderDocuments() {

    if (!documentsGrid) return;

    const search =
        documentSearchInput?.value
            .toLowerCase()
            .trim() || "";

    const filtered =
        storedDocuments.filter(
            doc =>
                doc.name
                    .toLowerCase()
                    .includes(search)
        );

    documentsGrid.innerHTML = "";

    if (!filtered.length) {

        documentsGrid.innerHTML = `
            <div class="project-card">
                <h2>📄 Your document library is empty</h2>

                <p>
                    Upload a document to begin working with it
                    using AP Synapse.
                </p>
            </div>
        `;

        updateProfileStats();

        return;

    }


    filtered.forEach(doc => {

        const card =
            document.createElement("div");

        card.className = "project-card";

        card.innerHTML = `

            <h2>📄 ${escapeHTML(doc.name)}</h2>

            <p>
                ${escapeHTML(doc.type || "Document")}
            </p>

            <small>
                Uploaded
                ${new Date(doc.created).toLocaleString()}
            </small>

            <br><br>

            <button
                class="ask-document"
                data-name="${escapeHTML(doc.name)}"
            >
                Ask AP Synapse
            </button>

            <button
                class="remove-document"
                data-id="${doc.id}"
            >
                Remove
            </button>

        `;

        documentsGrid.appendChild(card);

    });

    updateProfileStats();

}


async function uploadDocument(file) {

    if (!file) return;

    showToast("📤 Uploading " + file.name + "...");

    try {

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );


        const response =
            await fetch(
                "https://ap-synapse-backend.onrender.com/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!response.ok) {

            throw new Error(
                "Upload failed."
            );

        }


        const data =
            await response.json();


        window.currentDocument =
            data.content || "";


        storedDocuments.unshift({

            id: Date.now(),

            name:
                data.original ||
                file.name,

            type:
                file.type ||
                "Document",

            created:
                new Date().toISOString()

        });


        saveDocuments();

        renderDocuments();

        showToast(
            "✅ Document ready for AP Synapse"
        );


    }
    catch (error) {

        console.error(
            "DOCUMENT UPLOAD ERROR:",
            error
        );

        showToast(
            "❌ Document upload failed"
        );

    }

}


documentUploadBtn?.addEventListener(
    "click",
    () => {

        const fileInput =
            document.getElementById(
                "fileInput"
            );

        fileInput?.click();

    }
);


documentUploadZone?.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        documentUploadZone.classList.add(
            "dragover"
        );

    }
);


documentUploadZone?.addEventListener(
    "dragleave",
    () => {

        documentUploadZone.classList.remove(
            "dragover"
        );

    }
);


documentUploadZone?.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        documentUploadZone.classList.remove(
            "dragover"
        );

        const file =
            event.dataTransfer.files[0];

        uploadDocument(file);

    }
);


documentSearchInput?.addEventListener(
    "input",
    renderDocuments
);


documentsGrid?.addEventListener(
    "click",
    event => {

        const name =
            event.target.dataset.name;

        if (
            event.target.classList.contains(
                "ask-document"
            )
        ) {

            const input =
                document.getElementById(
                    "userInput"
                );

            if (input) {

                input.value =
                    `Tell me everything important from "${name}".`;

                input.focus();

            }

            showToast(
                "📄 Document loaded into Assistant"
            );

            return;

        }


        if (
            event.target.classList.contains(
                "remove-document"
            )
        ) {

            const id =
                Number(
                    event.target.dataset.id
                );

            storedDocuments =
                storedDocuments.filter(
                    doc =>
                        doc.id !== id
                );

            saveDocuments();

            renderDocuments();

            showToast(
                "Document removed"
            );

        }

    }
);


documentAskBtn?.addEventListener(
    "click",
    () => {

        const input =
            document.getElementById(
                "userInput"
            );

        if (!input) return;

        input.value =
            "What can you help me understand from my uploaded documents?";

        input.focus();

        showToast(
            "📚 Ready to work with your documents"
        );

    }
);


renderDocuments();


// ==========================================================
// PROFILE
// ==========================================================

function updateProfileStats() {

    const projectCount =
        document.getElementById(
            "profileProjectCount"
        );

    const documentCount =
        document.getElementById(
            "profileDocumentCount"
        );

    const language =
        document.getElementById(
            "profileLanguage"
        );

    if (projectCount)
        projectCount.textContent =
            dashboardProjects.length;

    if (documentCount)
        documentCount.textContent =
            storedDocuments.length;

    const selectedLanguage =
        localStorage.getItem(
            "apSynapseLanguage"
        ) || "English";

    if (language)
        language.textContent =
            selectedLanguage;

}


const settingsLanguage =
    document.getElementById(
        "settingsLanguage"
    );


settingsLanguage?.addEventListener(
    "change",
    () => {

        localStorage.setItem(
            "apSynapseLanguage",
            settingsLanguage.value
        );

        updateProfileStats();

        showToast(
            "Language preference saved"
        );

    }
);


updateProfileStats();

// ==========================================================
// SIDEBAR NAVIGATION
// ==========================================================

document
    .getElementById("projectsBtn")
    ?.addEventListener("click", event => {

        event.preventDefault();

        showPage("projectsPage");

        renderDashboardProjects();

    });


document
    .getElementById("documentsBtn")
    ?.addEventListener("click", event => {

        event.preventDefault();

        showPage("documentsPage");

        renderDocuments();

    });


document
    .getElementById("profileSidebarBtn")
    ?.addEventListener("click", event => {

        event.preventDefault();

        const profile =
            document.getElementById(
                "profileCard"
            );

        if (profile) {

            profile.classList.add("active");

            profile.style.display = "block";

        }

        updateProfileStats();

    });

    // ==========================================
// AP SYNAPSE — DOCUMENTS UPLOAD BRIDGE
// ==========================================

const documentsUploadCard =
    document.querySelector("#documentsPage .project-card");

const documentsFileInput =
    document.getElementById("fileInput");

if (documentsUploadCard && documentsFileInput) {

    documentsUploadCard.style.cursor = "pointer";

    documentsUploadCard.addEventListener("click", (event) => {

        if (event.target.closest("button")) return;

        documentsFileInput.value = "";

        if (documentsFileInput.showPicker) {
            documentsFileInput.showPicker();
        } else {
            documentsFileInput.click();
        }

    });

}

// ==========================================
// SHOW SELECTED FILE IN DOCUMENTS PAGE
// ==========================================

if (documentsFileInput) {

    documentsFileInput.addEventListener("change", (event) => {

        const file = event.target.files?.[0];

        if (!file) return;

        const documentsPage =
            document.getElementById("documentsPage");

        if (!documentsPage) return;

        let fileStatus =
            document.getElementById("documentUploadStatus");

        if (!fileStatus) {

            fileStatus =
                document.createElement("div");

            fileStatus.id =
                "documentUploadStatus";

            fileStatus.className =
                "project-card";

            documentsPage
                .querySelector(".projects-grid")
                ?.appendChild(fileStatus);

        }

        fileStatus.innerHTML = `
            <h2>📄 ${file.name}</h2>

            <p>
                ${(file.size / 1024 / 1024).toFixed(2)} MB
                · ${file.type || "Unknown file type"}
            </p>

            <p>
                ⏳ Uploading to AP Synapse...
            </p>
        `;

        // chat.js already owns the actual upload request.
        // This bridge only makes the selected file visible
        // inside Documents.
    });

}

// =====================================================
// AP SYNAPSE DOCUMENT INTELLIGENCE
// =====================================================

const documentsUploadBtn =
    document.getElementById("documentsUploadBtn");

const documentStatus =
    document.getElementById("documentStatus");

const currentDocumentCard =
    document.getElementById("currentDocumentCard");

const documentFileName =
    document.getElementById("documentFileName");

const documentFileStatus =
    document.getElementById("documentFileStatus");

const removeDocumentBtn =
    document.getElementById("removeDocumentBtn");

const documentAskArea =
    document.getElementById("documentAskArea");

const documentQuestionInput =
    document.getElementById("documentQuestionInput");

const askDocumentBtn =
    document.getElementById("askDocumentBtn");

const documentAnswerCard =
    document.getElementById("documentAnswerCard");

const documentAnswer =
    document.getElementById("documentAnswer");

const clearDocumentAnswerBtn =
    document.getElementById("clearDocumentAnswerBtn");


// -----------------------------------------------------
// Select file
// -----------------------------------------------------

if (documentsUploadBtn && documentsFileInput) {

    documentsUploadBtn.addEventListener("click", () => {

        documentsFileInput.value = "";

        documentsFileInput.click();

    });

}


// -----------------------------------------------------
// Upload document
// -----------------------------------------------------

if (documentsFileInput) {

    documentsFileInput.addEventListener(
        "change",
        async (event) => {

            const file =
                event.target.files?.[0];

            if (!file) return;


            // Show immediately

            if (documentStatus) {

                documentStatus.textContent =
                    `Uploading ${file.name}...`;

            }


            if (currentDocumentCard) {

                currentDocumentCard.style.display =
                    "flex";

            }


            if (documentFileName) {

                documentFileName.textContent =
                    file.name;

            }


            if (documentFileStatus) {

                documentFileStatus.textContent =
                    "Uploading...";

            }


            if (documentAskArea) {

                documentAskArea.style.display =
                    "none";

            }


            if (documentAnswerCard) {

                documentAnswerCard.style.display =
                    "none";

            }


            try {

                const formData =
                    new FormData();

                formData.append(
                    "file",
                    file
                );


                const response =
                    await fetch(
                        "https://ap-synapse-backend.onrender.com/upload",
                        {
                            method: "POST",

                            headers: {
                               "x-session-id":
                                   getSessionId()
                            },

                            body: formData
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        `Upload failed (${response.status})`
                    );

                }


                const data =
                    await response.json();


                // IMPORTANT:
                // Make document available to AP Synapse

                window.currentDocument =
                    data.content || "";


                window.currentDocumentName =
                    data.original ||
                    file.name;


                // Success UI

                if (documentStatus) {

                    documentStatus.textContent =
                        `✓ ${window.currentDocumentName} is ready`;

                }


                if (documentFileName) {

                    documentFileName.textContent =
                        window.currentDocumentName;

                }


                if (documentFileStatus) {

                    documentFileStatus.textContent =
                        "✓ Ready for questions";

                }


                if (documentAskArea) {

                    documentAskArea.style.display =
                        "block";

                }


                showDocumentToast(
                    "Document ready — you can now ask questions."
                );


            }

            catch (error) {

                console.error(
                    "DOCUMENT UPLOAD ERROR:",
                    error
                );


                window.currentDocument = "";


                if (documentFileStatus) {

                    documentFileStatus.textContent =
                        "Upload failed";

                }


                if (documentStatus) {

                    documentStatus.textContent =
                        "❌ Document upload failed";

                }


                showDocumentToast(
                    "Document upload failed."
                );

            }

        }
    );

}


// -----------------------------------------------------
// Ask AP Synapse about document
// -----------------------------------------------------

if (askDocumentBtn) {

    askDocumentBtn.addEventListener(
        "click",
        askDocumentQuestion
    );

}


if (documentQuestionInput) {

    documentQuestionInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                askDocumentQuestion();

            }

        }
    );

}


async function askDocumentQuestion() {

    const question =
        documentQuestionInput?.value.trim();


    if (!question) {

        showDocumentToast(
            "Write a question first."
        );

        return;

    }


    if (!window.currentDocument) {

        showDocumentToast(
            "Upload a document first."
        );

        return;

    }


    askDocumentBtn.disabled = true;

    askDocumentBtn.textContent =
        "Thinking...";


    if (documentAnswerCard) {

        documentAnswerCard.style.display =
            "block";

    }


    if (documentAnswer) {

        documentAnswer.innerHTML =
            "<p>AP Synapse is analysing the document...</p>";

    }


    try {

        const response =
            await fetch(
                "https://ap-synapse-backend.onrender.com/chat",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "x-session-id":
                            getSessionId()

                    },

                    body: JSON.stringify({

                        message:
                    `Answer the user's question using the uploaded document as the primary source.

                    USER QUESTION:
                    ${question}

                    Rules:
                    - Base the answer on the uploaded document.
                    - If the document does not contain enough information, say so clearly.
                    - Do not invent information.
                    - Give a useful, well-structured answer.`,

                       web: false,

                       deep: true

                    })

                }
            );


        if (!response.ok) {

            throw new Error(
                `AP Synapse request failed (${response.status})`
            );

        }


        const result =
            await response.text();


        if (documentAnswer) {

            if (window.marked) {

                documentAnswer.innerHTML =
                    marked.parse(
                        result ||
                        "No answer returned."
                    );

            } else {

                documentAnswer.textContent =
                    result ||
                    "No answer returned.";

            }

        }


        documentQuestionInput.value = "";


    }

    catch (error) {

        console.error(
            "DOCUMENT QUESTION ERROR:",
            error
        );


        if (documentAnswer) {

            documentAnswer.innerHTML = `
                <p>
                    ⚠️ AP Synapse could not answer this question.
                </p>
                <small>
                    Please check your connection and try again.
                </small>
            `;

        }

    }

    finally {

        askDocumentBtn.disabled =
            false;

        askDocumentBtn.textContent =
            "Ask AP Synapse →";

    }

}


// -----------------------------------------------------
// Remove document
// -----------------------------------------------------

if (removeDocumentBtn) {

    removeDocumentBtn.addEventListener(
        "click",
        () => {

            window.currentDocument = "";

            window.currentDocumentName = "";


            if (documentsFileInput) {

                documentsFileInput.value = "";

            }


            if (currentDocumentCard) {

                currentDocumentCard.style.display =
                    "none";

            }


            if (documentAskArea) {

                documentAskArea.style.display =
                    "none";

            }


            if (documentAnswerCard) {

                documentAnswerCard.style.display =
                    "none";

            }


            if (documentStatus) {

                documentStatus.textContent =
                    "No document selected";

            }


            showDocumentToast(
                "Document removed."
            );

        }
    );

}


// -----------------------------------------------------
// Clear answer
// -----------------------------------------------------

if (clearDocumentAnswerBtn) {

    clearDocumentAnswerBtn.addEventListener(
        "click",
        () => {

            if (documentAnswer) {

                documentAnswer.innerHTML = "";

            }

            if (documentAnswerCard) {

                documentAnswerCard.style.display =
                    "none";

            }

        }
    );

}


// -----------------------------------------------------
// Small local toast
// -----------------------------------------------------

function showDocumentToast(message) {

    const toast =
        document.createElement("div");

    toast.className =
        "toast";

    toast.textContent =
        message;

    document.body.appendChild(toast);


    setTimeout(() => {

        toast.remove();

    }, 2500);

}