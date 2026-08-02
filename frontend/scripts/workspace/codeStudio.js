import {showPage} from "./workspaceManager.js";

const btn=document.getElementById("codeStudioBtn");

if(btn){

btn.addEventListener("click",(e)=>{

e.preventDefault();

showPage("codeStudioPage");

});

}