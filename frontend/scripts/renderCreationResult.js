// A minimal renderer to insert INSIDE the existing chat's JSON-response branch.
// It adds only a file download bubble; no new studio, tab, or Canvas changes.
export function renderCreationResult(data,chatWindow){
  if(data?.type!=='ap_creation'||!data.artifact||!chatWindow)return false;
  const a=data.artifact;
  if(!/^(image\/(png|jpeg|webp)|application\/(pdf|vnd\.(openxmlformats-officedocument\.(wordprocessingml\.document|presentationml\.presentation))))$/.test(a.mimeType||''))return false;
  if(typeof a.base64!=='string'||a.base64.length>22_000_000)return false;
  const binary=atob(a.base64), bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  const url=URL.createObjectURL(new Blob([bytes],{type:a.mimeType}));
  const node=document.createElement('div');node.className='ap-creation-chat-result';
  node.style.cssText='margin:10px 0;padding:14px 16px;border:1px solid rgba(191,157,92,.34);border-radius:14px;background:rgba(22,22,22,.82);color:#f4efe4;max-width:540px;';
  const heading=document.createElement('div');heading.textContent=data.message||'Creation complete';heading.style.cssText='font-size:14px;margin-bottom:10px;';node.append(heading);
  if(a.kind==='image'){
    const img=document.createElement('img');img.src=url;img.alt='AP Synapse generated image';img.style.cssText='display:block;width:100%;max-height:400px;object-fit:contain;border-radius:8px;margin:8px 0;';node.append(img);
  }
  const link=document.createElement('a');link.href=url;link.download=String(a.fileName||'ap-creation').replace(/[\\/]/g,'_');link.textContent='Download '+(a.kind==='slides'?'presentation':a.kind.toUpperCase());
  link.style.cssText='color:#d9bb79;font-weight:600;text-decoration:underline;';node.append(link);
  chatWindow.append(node);
  // Link lifetime: revoked when the message is removed, not during an active download.
  const obs=new MutationObserver(()=>{if(!node.isConnected){URL.revokeObjectURL(url);obs.disconnect();}});
  obs.observe(chatWindow,{childList:true,subtree:true});
  return true;
}
