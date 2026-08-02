import { openAssistant } from "./assistant.js";
export function showPage(pageId){

const pages=document.querySelectorAll(".projects-page,.assistant-page,.conversation");

pages.forEach(page=>{
page.style.display="none";
});

const page=document.getElementById(pageId);

if(page){

page.style.display="block";

}

}