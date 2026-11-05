// Chat bubble only. No buttons, modes, overlays, Canvas hooks, or design changes.
const API_ROOT='https://api.ap-synapse.com';
function token(){return window.AP_PERSONALIZATION?.getToken?.()||'';}
function headers(){return {Authorization:`Bearer ${token()}`,'x-session-id':localStorage.getItem('ap_synapse_session')||''};}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function uiEl(name,text){const el=document.createElement(name);el.textContent=text||'';return el;}
export function renderMediaJob(data,chatWindow){
  if(data?.type!=='ap_media_job'||!data.jobId||!chatWindow||!/^[0-9a-f-]{36}$/i.test(data.jobId))return false;
  const root=uiEl('div');root.className='ap-creation-chat-result';
  root.style.cssText='margin:12px 0;padding:14px 16px;border:1px solid rgba(191,157,92,.34);border-radius:14px;background:rgba(22,22,22,.82);color:#f4efe4;max-width:580px;';
  const status=uiEl('div',data.message||'Creating…');status.style.cssText='font-size:14px;margin-bottom:8px;';root.append(status);
  chatWindow.append(root);chatWindow.scrollTop=chatWindow.scrollHeight;
  let active=true;
  const obs=new MutationObserver(()=>{if(!root.isConnected){active=false;obs.disconnect();}});
  obs.observe(chatWindow,{childList:true,subtree:true});
  async function ready(info){
    if(!active)return;
    status.textContent=`${info.kind==='model3d'?'3D model':info.kind} ready`;
    if(info.kind==='model3d'){
      const a=uiEl('a','Download 3D model (GLB)');a.href=info.externalUrl||'#';a.target='_blank';a.rel='noopener noreferrer';
      a.style.cssText='color:#d9bb79;text-decoration:underline;';root.append(a);return;
    }
    const response=await fetch(`${API_ROOT}/ap/media/jobs/${encodeURIComponent(data.jobId)}/file`,{headers:headers()});
    if(!response.ok)throw Error('File download failed');
    const blob=await response.blob();const url=URL.createObjectURL(blob);
    if(!active){URL.revokeObjectURL(url);return;}
    const link=uiEl('a',`Download ${info.kind==='video'?'video (MP4)':'image'}`);
    link.href=url;link.download=String(info.fileName||'ap-synapse-creation').replace(/[\\/]/g,'_');link.style.cssText='color:#d9bb79;font-weight:600;text-decoration:underline;';
    if(info.kind==='image'){
      const img=document.createElement('img');img.src=url;img.alt='Generated image';img.style.cssText='display:block;width:100%;max-height:380px;object-fit:contain;margin:8px 0;border-radius:8px;';root.append(img);
    }
    if(info.kind==='video'){
      const video=document.createElement('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.src=url;video.style.cssText='display:block;width:100%;max-height:380px;margin:8px 0;border-radius:8px;';root.append(video);
    }
    root.append(link);
    const release=new MutationObserver(()=>{if(!root.isConnected){URL.revokeObjectURL(url);release.disconnect();}});
    release.observe(chatWindow,{childList:true,subtree:true});
  }
  (async()=>{
    // Poll lasts up to 10 min; generated files are stored server-side for later retrieval.
    for(let n=0;n<120 && active;n++){
      await sleep(n===0?1200:5000);
      if(!active)return;
      if(!token()){status.textContent='Sign in again to retrieve your creation.';return;}
      const r=await fetch(`${API_ROOT}/ap/media/jobs/${encodeURIComponent(data.jobId)}`,{headers:headers()});
      if(!r.ok)throw Error(`Status request failed (${r.status})`);
      const info=await r.json();
      if(info.status==='ready'){await ready(info);return;}
      if(info.status==='failed'){status.textContent=`Creation could not complete: ${info.error||'provider error'}`;return;}
      status.textContent=`Creating ${data.kind==='model3d'?'3D model':data.kind}… ${n>8?'This may take several minutes.':''}`;
    }
    if(active)status.textContent='Still processing. Reopen this conversation later to check the job.';
  })().catch(()=>{if(active)status.textContent='Unable to check creation status. Please retry from a stable connection.';});
  return true;
}
