// ===========================================
// AP Synapse Projects Engine v10.1
// ===========================================

const STORAGE_KEY = "ap_synapse_projects";

let projects = [];

function loadProjects() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
        projects = JSON.parse(saved);
    } else {
        projects = [];
    }

    console.log("Projects Loaded:", projects);
}

function saveProjects() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(projects)
    );

    console.log("Projects Saved");
}

export function getProjects() {
    return projects;
}

export function createProject(project) {

    project.id = Date.now();

    project.created = new Date().toISOString();

    projects.unshift(project);

    saveProjects();

}

export function deleteProject(id) {

    projects = projects.filter(
        p => p.id !== id
    );

    saveProjects();

}

loadProjects();