const palette=document.getElementById("commandPalette");
const search=document.getElementById("commandSearch");

document.addEventListener("keydown",(e)=>{

if(e.ctrlKey&&e.key==="k"){

e.preventDefault();

palette.style.display="flex";

search.focus();

}

if(e.key==="Escape"){

palette.style.display="none";

}

});

document.querySelectorAll(".command-item").forEach(item=>{

item.onclick=()=>{

const cmd=item.dataset.command;

palette.style.display="none";

switch(cmd){

case "new":

location.reload();

break;

case "project":

document.getElementById("createProject").click();

break;

case "search":

document.getElementById("webBtn").click();

break;

case "voice":

document.getElementById("voiceBtn").click();

break;

case "theme":

document.body.classList.toggle("light");

break;

case "about":

document.getElementById("aboutBtn").click();

break;

}

};

});