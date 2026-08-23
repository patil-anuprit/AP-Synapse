import express from "express";
import { createAIStream } from "./router.js";

const router = express.Router();
const TYPES = new Set(["OPEN_APP","OPEN_AP","OPEN_URL","WEB_SEARCH","OPEN_FOLDER","OPEN_SETTING","SHOW_DESKTOP","COPY_TEXT"]);
const APPS = new Set(["notepad","calculator","explorer","settings","browser","vscode","paint","taskmanager"]);
const FOLDERS = new Set(["desktop","documents","downloads","pictures"]);
const SETTINGS = new Set(["bluetooth","wifi","display","sound","notifications"]);

const PROMPT = `
You are Aprisha's Windows desktop action planner inside AP Synapse.
Return JSON only, never markdown.
For normal questions return {"type":"chat"}.
For supported Windows actions return:
{"type":"desktop_plan","summary":"short","actions":[{"type":"OPEN_APP","value":"notepad","label":"Open Notepad"}],"success_reply":"Done."}

Allowed:
OPEN_APP: notepad, calculator, explorer, settings, browser, vscode, paint, taskmanager
OPEN_AP
OPEN_URL: http/https only
WEB_SEARCH
OPEN_FOLDER: desktop, documents, downloads, pictures
OPEN_SETTING: bluetooth, wifi, display, sound, notifications
SHOW_DESKTOP
COPY_TEXT

Maximum 6 actions. Context may resolve follow-ups.
Never output shell commands, PowerShell, cmd, scripts, registry actions, installers,
deletions, file modification, account/security changes, purchases, surveillance,
permission bypasses, or arbitrary process names. If unsupported, return chat.
`;

function strip(v){return String(v||"").trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"").trim();}
async function text(messages){
  const stream=await createAIStream(messages); let out="";
  for await(const chunk of stream){out+=chunk?.choices?.[0]?.delta?.content||"";}
  return out.trim();
}
function action(a){
  const type=String(a?.type||"").trim().toUpperCase();
  const value=String(a?.value||"").trim();
  if(!TYPES.has(type)) return null;
  if(type==="OPEN_APP"&&!APPS.has(value.toLowerCase())) return null;
  if(type==="OPEN_FOLDER"&&!FOLDERS.has(value.toLowerCase())) return null;
  if(type==="OPEN_SETTING"&&!SETTINGS.has(value.toLowerCase())) return null;
  if(type==="OPEN_URL"){try{const u=new URL(value);if(!["http:","https:"].includes(u.protocol))return null;}catch{return null;}}
  if(["WEB_SEARCH","COPY_TEXT"].includes(type)&&!value) return null;
  return {type,value:value.slice(0,4000),label:String(a?.label||type).slice(0,120)};
}

router.post("/plan",async(req,res)=>{
  const message=String(req.body?.message||"").trim();
  if(!message) return res.status(400).json({type:"chat",error:"Message required."});
  try{
    const ctx=Array.isArray(req.body?.context)?req.body.context.slice(-8):[];
    const messages=[{role:"system",content:PROMPT}];
    if(ctx.length) messages.push({role:"system",content:"Recent desktop context:\n"+ctx.map(x=>`${x.role||"user"}: ${String(x.content||"").slice(0,500)}`).join("\n")});
    messages.push({role:"user",content:message});
    let parsed;
    try{parsed=JSON.parse(strip(await text(messages)));}catch{return res.json({type:"chat"});}
    if(parsed?.type!=="desktop_plan"||!Array.isArray(parsed.actions)) return res.json({type:"chat"});
    const actions=parsed.actions.map(action).filter(Boolean).slice(0,6);
    if(!actions.length) return res.json({type:"chat"});
    return res.json({
      type:"desktop_plan",
      summary:String(parsed.summary||"Working on it.").slice(0,240),
      actions,
      success_reply:String(parsed.success_reply||"Done.").slice(0,160)
    });
  }catch(e){
    console.error("APRISHA DESKTOP V2 PLAN ERROR:",e);
    return res.json({type:"chat"});
  }
});

export default router;
