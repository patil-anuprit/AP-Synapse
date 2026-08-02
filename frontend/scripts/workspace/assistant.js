export function openAssistant() {

    const assistant =
        document.getElementById("assistantPage");

    const hero =
        document.getElementById("heroScreen");

    const chat =
        document.getElementById("chatWindow");

    if (assistant)
        assistant.style.display = "block";

    if (hero)
        hero.style.display = "flex";

    if (chat)
        chat.style.display = "none";

    console.log("Assistant Ready");

}