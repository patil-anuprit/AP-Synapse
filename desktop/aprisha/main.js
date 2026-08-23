const {app,BrowserWindow,globalShortcut,ipcMain,shell,clipboard,Tray,Menu,nativeImage,screen}=require("electron");
const path=require("path"), os=require("os");
const {spawn}=require("child_process");

const AP_URL="https://ap-synapse.vercel.app/";
let win=null,tray=null,wake=null,restart=null,voiceBusy=false;

const APP={
  notepad:["notepad.exe",[]],calculator:["calc.exe",[]],explorer:["explorer.exe",[]],
  vscode:["code",[]],paint:["mspaint.exe",[]],taskmanager:["taskmgr.exe",[]]
};
const FOLDER={
  desktop:path.join(os.homedir(),"Desktop"),documents:path.join(os.homedir(),"Documents"),
  downloads:path.join(os.homedir(),"Downloads"),pictures:path.join(os.homedir(),"Pictures")
};
const SETTING={
  settings:"ms-settings:",bluetooth:"ms-settings:bluetooth",wifi:"ms-settings:network-wifi",
  display:"ms-settings:display",sound:"ms-settings:sound",notifications:"ms-settings:notifications"
};

function ps(file){
  return spawn("powershell.exe",["-NoLogo","-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",file],
    {windowsHide:true,stdio:["ignore","pipe","pipe"]});
}
function position(){
  const d=screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
  const width=Math.min(720,d.width-32),height=278;
  win.setBounds({x:Math.round(d.x+(d.width-width)/2),y:Math.round(d.y+d.height-height-38),width,height},false);
}
function show(reason="shortcut"){
  if(!win)return; position(); win.show(); win.moveTop(); win.focus(); win.webContents.send("aprisha:focus",reason);
}
function stopWake(){if(restart){clearTimeout(restart);restart=null;}if(wake){try{wake.kill();}catch{}wake=null;}}
function schedule(ms=900){if(restart)clearTimeout(restart);restart=setTimeout(()=>{restart=null;startWake();},ms);}
function startWake(){
  if(voiceBusy||wake)return;
  try{
    const child=ps(path.join(__dirname,"windows","wake-listener.ps1")); wake=child; let buf="";
    child.stdout.on("data",c=>{
      buf+=c.toString(); const lines=buf.split(/\r?\n/); buf=lines.pop()||"";
      for(const raw of lines){
        const line=raw.trim();
        if(line==="APRISHA_WAKE_READY") win?.webContents.send("aprisha:wake-status",{status:"ready"});
        if(line==="APRISHA_WAKE"){
          stopWake(); show("wake"); win?.webContents.send("aprisha:wake");
        }
        if(line.startsWith("APRISHA_WAKE_ERROR::")) win?.webContents.send("aprisha:wake-status",{status:"error",detail:line.slice(20)});
      }
    });
    child.on("exit",()=>{if(wake===child)wake=null;if(!voiceBusy)schedule(1800);});
  }catch(e){win?.webContents.send("aprisha:wake-status",{status:"error",detail:e.message});}
}
function listenOnce(){
  return new Promise(resolve=>{
    voiceBusy=true;stopWake();let out="";
    const child=ps(path.join(__dirname,"windows","listen-once.ps1"));
    child.stdout.on("data",c=>out+=c.toString());
    child.on("exit",()=>{
      voiceBusy=false;schedule(1000);
      const lines=out.split(/\r?\n/);
      const err=lines.find(x=>x.startsWith("APRISHA_LISTEN_ERROR::"));
      const hit=lines.find(x=>x.startsWith("APRISHA_TEXT::"));
      if(err)return resolve({ok:false,text:"",error:err.slice(23)});
      const text=hit?hit.slice(14).trim():"";
      resolve({ok:!!text,text,error:text?"":"I didn't catch that."});
    });
  });
}
function createWindow(){
  win=new BrowserWindow({
    width:720,height:278,show:false,frame:false,transparent:true,resizable:false,
    maximizable:false,fullscreenable:false,alwaysOnTop:true,skipTaskbar:true,
    backgroundColor:"#00000000",
    webPreferences:{preload:path.join(__dirname,"preload.js"),contextIsolation:true,nodeIntegration:false,sandbox:true}
  });
  win.setAlwaysOnTop(true,"pop-up-menu");
  win.loadFile(path.join(__dirname,"renderer","index.html"));
  win.on("close",e=>{if(!app.isQuitting){e.preventDefault();win.hide();}});
}
function icon(){
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="9" fill="#111214"/><circle cx="16" cy="16" r="10" fill="none" stroke="#b99a58" stroke-width="1.5"/><text x="16" y="20" font-family="Segoe UI" font-size="11" text-anchor="middle" fill="#f2eee6">AP</text></svg>';
  return nativeImage.createFromDataURL("data:image/svg+xml;base64,"+Buffer.from(svg).toString("base64"));
}
function createTray(){
  tray=new Tray(icon()); tray.setToolTip("Aprisha — AP Synapse");
  tray.setContextMenu(Menu.buildFromTemplate([
    {label:"Open Aprisha",click:()=>show("tray")},
    {label:"Open AP Synapse",click:()=>shell.openExternal(AP_URL)},
    {type:"separator"},
    {label:"Start with Windows",type:"checkbox",checked:app.getLoginItemSettings().openAtLogin,
      click:i=>app.setLoginItemSettings({openAtLogin:i.checked,args:["--hidden"]})},
    {type:"separator"},{label:"Quit Aprisha",click:()=>{app.isQuitting=true;app.quit();}}
  ]));
  tray.on("double-click",()=>show("tray"));
}
async function execAction(a){
  const t=String(a?.type||"").toUpperCase(),v=String(a?.value||"").trim().toLowerCase();
  if(t==="OPEN_APP"){
    if(v==="browser"){await shell.openExternal("https://www.google.com/");return{ok:true};}
    if(v==="settings"){await shell.openExternal("ms-settings:");return{ok:true};}
    const spec=APP[v];if(!spec)return{ok:false,message:"That app is not in Aprisha's safe list."};
    try{const c=spawn(spec[0],spec[1],{detached:true,stdio:"ignore",windowsHide:true});c.unref();return{ok:true};}catch{return{ok:false,message:"I couldn't open that app."};}
  }
  if(t==="OPEN_AP"){await shell.openExternal(AP_URL);return{ok:true};}
  if(t==="OPEN_FOLDER"){const f=FOLDER[v];if(!f)return{ok:false,message:"Unknown folder."};const e=await shell.openPath(f);return e?{ok:false,message:e}:{ok:true};}
  if(t==="OPEN_SETTING"){const u=SETTING[v];if(!u)return{ok:false,message:"Unknown setting."};await shell.openExternal(u);return{ok:true};}
  if(t==="WEB_SEARCH"){await shell.openExternal("https://www.google.com/search?q="+encodeURIComponent(a.value||""));return{ok:true};}
  if(t==="OPEN_URL"){try{const u=new URL(a.value);if(!["http:","https:"].includes(u.protocol))throw 0;await shell.openExternal(u.toString());return{ok:true};}catch{return{ok:false,message:"Invalid web link."};}}
  if(t==="COPY_TEXT"){clipboard.writeText(String(a.value||""));return{ok:true};}
  if(t==="SHOW_DESKTOP"){
    try{const c=spawn("powershell.exe",["-NoProfile","-NonInteractive","-Command","$s=New-Object -ComObject Shell.Application;$s.ToggleDesktop()"],{detached:true,stdio:"ignore",windowsHide:true});c.unref();return{ok:true};}
    catch{return{ok:false,message:"I couldn't show the desktop."};}
  }
  return{ok:false,message:"Unsupported desktop action."};
}
async function execPlan(plan){
  const completed=[];
  for(const a of (Array.isArray(plan?.actions)?plan.actions.slice(0,6):[])){
    const r=await execAction(a);if(!r.ok)return{ok:false,completed,message:r.message};completed.push(a.label||a.type);
  }
  return{ok:true,completed,message:String(plan?.success_reply||"Done.")};
}

if(!app.requestSingleInstanceLock())app.quit();
else{
  app.on("second-instance",()=>show("second-instance"));
  app.whenReady().then(()=>{
    createWindow();createTray();
    globalShortcut.register("CommandOrControl+Shift+Space",()=>win?.isVisible()?win.hide():show("shortcut"));
    schedule(700);
    if(!process.argv.includes("--hidden"))show("startup");
  });
}

ipcMain.handle("aprisha:hide",()=>{win?.hide();return true;});
ipcMain.handle("aprisha:open-ap",async()=>{await shell.openExternal(AP_URL);return true;});
ipcMain.handle("aprisha:execute-plan",(_e,p)=>execPlan(p));
ipcMain.handle("aprisha:listen-once",()=>listenOnce());
ipcMain.handle("aprisha:clipboard-read",()=>clipboard.readText());
ipcMain.handle("aprisha:meta",()=>({version:app.getVersion(),shortcut:"Ctrl+Shift+Space"}));

app.on("will-quit",()=>{stopWake();globalShortcut.unregisterAll();});
app.on("window-all-closed",e=>e?.preventDefault?.());
