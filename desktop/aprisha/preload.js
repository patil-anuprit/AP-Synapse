const {contextBridge,ipcRenderer}=require("electron");
contextBridge.exposeInMainWorld("aprishaDesktop",{
  hide:()=>ipcRenderer.invoke("aprisha:hide"),
  openAP:()=>ipcRenderer.invoke("aprisha:open-ap"),
  executePlan:p=>ipcRenderer.invoke("aprisha:execute-plan",p),
  listenOnce:()=>ipcRenderer.invoke("aprisha:listen-once"),
  readClipboard:()=>ipcRenderer.invoke("aprisha:clipboard-read"),
  meta:()=>ipcRenderer.invoke("aprisha:meta"),
  onFocus:cb=>ipcRenderer.on("aprisha:focus",(_e,r)=>cb(r)),
  onWake:cb=>ipcRenderer.on("aprisha:wake",()=>cb()),
  onWakeStatus:cb=>ipcRenderer.on("aprisha:wake-status",(_e,p)=>cb(p))
});
