export function saveProject(project){

    const projects =
        JSON.parse(localStorage.getItem("projects")) || [];

    projects.unshift(project);

    localStorage.setItem(
        "projects",
        JSON.stringify(projects)
    );

}

export function loadProjects(){

    return JSON.parse(

        localStorage.getItem("projects")

    ) || [];

}