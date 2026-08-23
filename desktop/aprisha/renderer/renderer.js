const PLAN_URL="https://ap-synapse-backend.onrender.com/aprisha-desktop/plan";
const CHAT_URL="https://ap-synapse-backend.onrender.com/chat";
const input=document.getElementById("prompt"),send=document.getElementById("send"),mic=document.getElementById("mic"),
close=document.getElementById("close"),openAP=document.getElementById("openAP"),state=document.getElementById("state"),
response=document.getElementById("response"),progress=document.getElementById("progress"),shortcut=document.getElementById("shortcut");
let running=false,context=[];

function st(n,t){document.body.dataset.state=n;state.textContent=t;}
function resp(t){response.textContent=String(t||"");}
function chips(items=[]){progress.innerHTML="";for(const x of items){const s=document.createElement("span");s.className="progress-chip";s.textContent=x;progress.appendChild(s);}}
function remember(role,content){const x=String(content||"").trim();if(!x)return;context.push({role,content:x.slice(0,500)});context=context.slice(-8);}
async function plan(message){
  const r=await fetch(PLAN_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,context,source:"aprisha-desktop-v2"})});
  if(!r.ok)throw new Error("Desktop planner unavailable.");return r.json();
}
async function chat(message){
  const r=await fetch(CHAT_URL,{method:"POST",headers:{"Content-Type":"application/json","x-session-id":"aprisha-desktop-v2"},body:JSON.stringify({message,source:"aprisha-desktop-v2"})});
  if(!r.ok)throw new Error("AP Synapse could not answer.");
  if(!r.body)return r.text();const rd=r.body.getReader(),dec=new TextDecoder();let full="";
  while(true){const {value,done}=await rd.read();if(done)break;full+=dec.decode(value,{stream:true});resp(full);}
  return (full+dec.decode()).trim();
}
async function clipboardTask(message){
  const n=message.toLowerCase();
  if(!["summarize clipboard","summarise clipboard","explain clipboard","what is on my clipboard"].some(x=>n.startsWith(x)))return null;
  const text=await window.aprishaDesktop.readClipboard();if(!String(text||"").trim())return"Your clipboard does not contain readable text.";
  return chat("The user explicitly asked Aprisha to analyze this clipboard text. Answer only from it:\n\n"+text);
}
async function run(message,voice=false){
  if(running)return;const clean=String(message||"").trim();if(!clean)return;
  running=true;send.disabled=mic.disabled=true;chips([]);resp(clean);st("thinking","Understanding");remember("user",clean);
  try{
    const clip=await clipboardTask(clean);
    if(clip!==null){st("done","Ready");resp(clip);remember("assistant",clip);return;}
    let p;try{p=await plan(clean);}catch{p={type:"chat"};}
    if(p?.type==="desktop_plan"&&Array.isArray(p.actions)&&p.actions.length){
      st("executing","Executing");resp(p.summary||"Working on it.");chips(p.actions.map(a=>a.label||a.type));
      const x=await window.aprishaDesktop.executePlan(p);if(!x?.ok)throw new Error(x?.message||"I couldn't complete that.");
      const reply=x.message||p.success_reply||"Done.";st("done","Done");resp(reply);remember("assistant",(p.summary||reply)+" Completed: "+(x.completed||[]).join(", "));return;
    }
    st("thinking","Thinking");resp("");const answer=await chat(clean);st("done","Ready");resp(answer||"Done.");remember("assistant",answer||"Done.");
  }catch(e){st("error","Something went wrong");resp(e?.message||"I couldn't complete that.");}
  finally{running=false;send.disabled=mic.disabled=false;input.value="";input.focus();}
}
async function listen(){
  if(running)return;st("listening","Listening");resp("I'm listening…");mic.disabled=true;
  try{const r=await window.aprishaDesktop.listenOnce();if(!r?.ok){st("idle","Ready");resp(r?.error||"I didn't catch that.");return;}
    resp(r.text);await run(r.text,true);
  }catch{st("error","Voice unavailable");resp("Windows speech recognition could not start. You can still type or use Ctrl+Shift+Space.");}
  finally{mic.disabled=false;}
}
send.addEventListener("click",()=>run(input.value));
mic.addEventListener("click",listen);
close.addEventListener("click",()=>window.aprishaDesktop.hide());
openAP.addEventListener("click",()=>window.aprishaDesktop.openAP());
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();run(input.value);}if(e.key==="Escape")window.aprishaDesktop.hide();});
window.addEventListener("keydown",e=>{if(e.key==="Escape")window.aprishaDesktop.hide();});
window.aprishaDesktop.onFocus(()=>input.focus());
window.aprishaDesktop.onWake(()=>{st("wake","Aprisha");resp("Yes?");setTimeout(listen,180);});
window.aprishaDesktop.onWakeStatus(p=>{if(p?.status==="ready"&&!running)st("idle","Hey Aprisha · Ready");if(p?.status==="error"&&!running)st("idle","Wake unavailable · Shortcut ready");});
(async()=>{try{const m=await window.aprishaDesktop.meta();shortcut.textContent=m.shortcut||"Ctrl+Shift+Space";}catch{}input.focus();})();
