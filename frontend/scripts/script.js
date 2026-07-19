const stars=document.querySelector(".stars");

for(let i=0;i<250;i++){

const star=document.createElement("div");

star.className="star";

star.style.left=Math.random()*100+"%";

star.style.top=Math.random()*100+"%";

star.style.animationDelay=Math.random()*5+"s";

stars.appendChild(star);

}

const input=document.getElementById("userInput");

const button=document.getElementById("sendBtn");

const chat=document.getElementById("chatWindow");

button.onclick=function(){

const text=input.value.trim();

if(text==="") return;

chat.innerHTML+=`
<div class="message user">
${text}
</div>
`;

chat.innerHTML+=`
<div class="message ai">
This is a demo response.
Soon a real AI model will answer here.
</div>
`;

input.value="";

chat.scrollTop=chat.scrollHeight;

}