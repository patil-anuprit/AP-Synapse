const pages = {};

export function registerPage(name, id) {
    const element = document.getElementById(id);

    if (!element) {
        console.warn(`Missing page: ${id}`);
        return;
    }

    pages[name] = element;
}

export function openPage(name) {

    Object.entries(pages).forEach(([pageName, element]) => {

        element.style.display =
            pageName === name ? "block" : "none";

    });

    // Assistant-specific elements must disappear
    // whenever we leave Assistant.
    const hero = document.getElementById("heroScreen");
    const chat = document.getElementById("chatWindow");
    const thinking = document.getElementById("thinking");

    if (hero) {
        hero.style.display =
            name === "assistant" ? "flex" : "none";
    }

    if (chat) {
        chat.style.display =
            name === "assistant" ? "" : "none";
    }

    if (thinking) {
        thinking.style.display =
            name === "assistant" ? "" : "none";
    }

    const page = pages[name];

    if (page) {
        page.scrollTop = 0;
    }

    console.log("Opened workspace:", name);
}