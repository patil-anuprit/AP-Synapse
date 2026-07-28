const notificationBtn =
document.getElementById("notificationBtn");

const settingsBtn =
document.getElementById("settingsBtn");

const popup =
document.getElementById("popupPanel");

const title =
document.getElementById("popupTitle");

const content =
document.getElementById("popupContent");

const close =
document.getElementById("closePopup");

function openPopup(t,c){

title.innerText=t;

content.innerHTML=c;

popup.style.display="block";

}

notificationBtn.addEventListener("click",()=>{

openPopup(

"Notifications",

`

✅ Voice Assistant Added<br><br>

✅ Read Aloud Added<br><br>

✅ Search Working<br><br>

🚀 AP Synapse Ready for Demo

`

);

});

settingsBtn.addEventListener("click",()=>{

openPopup(

"Settings",

`

🌙 Theme : Dark<br><br>

🧠 AI Mode : Smart<br><br>

🎤 Voice : Enabled<br><br>

🔊 Read Aloud : Enabled

`

);

});

close.addEventListener("click",()=>{

popup.style.display="none";

});

const profileBtn =
document.getElementById("profileBtn");

const profileCard =
document.getElementById("profileCard");

const closeProfile =
document.getElementById("closeProfile");

if(profileBtn){

profileBtn.onclick=()=>{

profileCard.style.display="block";

};

}

if(closeProfile){

closeProfile.onclick=()=>{

profileCard.style.display="none";

};

}