const sidebar = document.querySelector(".sidebar");

const projectsBtn = document.getElementById("projectsBtn");

console.log(projectsBtn);

const historyItems = document.querySelectorAll(".history-item");

const workspaceItems = document.querySelectorAll(".sidebar nav a");

const newChatBtn = document.querySelector(".new-chat-btn");

historyItems.forEach(item=>{

item.addEventListener("click",()=>{

historyItems.forEach(i=>i.classList.remove("active"));

item.classList.add("active");

});

});

workspaceItems.forEach(item=>{

item.addEventListener("mouseenter",()=>{

item.style.transform="translateX(6px)";

});

item.addEventListener("mouseleave",()=>{

item.style.transform="translateX(0px)";

});

});

newChatBtn.addEventListener("click", () => {

    const chatWindow = document.getElementById("chatWindow");
    const hero = document.getElementById("heroScreen");
    const input = document.getElementById("userInput");

    // Clear all previous messages
    chatWindow.innerHTML = "";

    // Hide chat
    chatWindow.style.display = "none";

    // Show hero screen again
    hero.style.display = "flex";
    hero.style.opacity = "1";
    hero.style.transform = "translateY(0)";

    // Clear input
    input.value = "";

    // Focus cursor
    input.focus();

});

// ===============================
// Projects Page
// ===============================

const assistantBtn = document.getElementById("assistantBtn");

const conversation = document.querySelector(".conversation");

const projectsPage = document.getElementById("projectsPage");

console.log("Conversation:", conversation);
console.log("Projects Page:", projectsPage);

projectsBtn.addEventListener("click", (e) => {

    e.preventDefault();

    conversation.style.display = "none";

    projectsPage.style.display = "block";

});

assistantBtn.addEventListener("click", (e) => {

    e.preventDefault();

    projectsPage.style.display = "none";

    conversation.style.display = "flex";

});

const workspacePage =
document.getElementById("workspacePage");

const workspaceTitle =
document.getElementById("workspaceTitle");

const workspaceDescription =
document.getElementById("workspaceDescription");

function openWorkspace(title){

conversation.style.display="none";

projectsPage.style.display="none";

workspacePage.style.display="block";

workspaceTitle.innerText=title;

workspaceDescription.innerText=
title+" workspace is coming soon.";

}

document.querySelectorAll(".sidebar nav a").forEach(link=>{

link.addEventListener("click",(e)=>{

const text=link.innerText.trim();

if(

text==="Knowledge"||

text==="Documents"||

text==="Automation"||

text==="Code Studio"||

text==="Canvas"

){

e.preventDefault();

openWorkspace(text);

}

});

});