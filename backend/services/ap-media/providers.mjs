import {safeText} from './intent.mjs';
import {geminiKeys, temporaryProviderFailure} from './geminiKeys.mjs';
const GEMINI='https://generativelanguage.googleapis.com/v1beta';
const MESHY='https://api.meshy.ai/openapi/v2/text-to-3d';
export class MediaProviderError extends Error {
  constructor(code,status=502){super(code);this.status=status;}
}
async function httpJSON(url, init, timeout=180000) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try {
    const r=await fetch(url,{...init,signal:controller.signal});
    const json=await r.json().catch(()=>null);
    if(!r.ok) throw new MediaProviderError(`PROVIDER_HTTP_${r.status}`,[401,403,429,503].includes(r.status)?r.status:502);
    return json;
  } catch(e) {
    if(e?.name==='AbortError')throw new MediaProviderError('PROVIDER_TIMEOUT',504);
    throw e;
  } finally {clearTimeout(timer);}
}
export async function createImage({prompt,previousImage,aspectRatio='1:1',quality='standard',referenceImages=[]}) {
  const keys=geminiKeys();
  if(!keys.length)throw new MediaProviderError('GEMINI_API_KEY_REQUIRED',503);
  const primary=quality==='high'?(process.env.AP_MEDIA_IMAGE_PRO_MODEL||'gemini-3-pro-image'):
    (process.env.AP_MEDIA_IMAGE_MODEL||'gemini-3.1-flash-image');
  const fallbacks=quality==='high'?[process.env.AP_MEDIA_IMAGE_MODEL||'gemini-3.1-flash-image']:
    [process.env.AP_MEDIA_IMAGE_FALLBACK||'gemini-3.1-flash-lite-image'];
  const refs=referenceImages.length?referenceImages:(previousImage?[previousImage]:[]);
  const parts=[{text:safeText(prompt,13500)}];
  for(const item of refs.slice(0,3)) {
    if(!['image/png','image/jpeg','image/webp'].includes(item?.mimeType)||
      typeof item.base64!=='string'||item.base64.length>5_500_000||!/^[A-Za-z0-9+/=]+$/.test(item.base64))continue;
    parts.push({inlineData:{mimeType:item.mimeType,data:item.base64}});
  }
  let last;
  // At most 3 authorized key attempts per generation, and only on transient provider failures.
  // A project-quota (429) or billing/access (401/403) error stops immediately.
  for (const key of keys.slice(0,3)) {
    let shouldTryNextKey=false;
    for(const model of [primary,...fallbacks]) {
      try {
        const body={contents:[{role:'user',parts}],generationConfig:{responseModalities:['TEXT','IMAGE'],
          imageConfig:{aspectRatio,imageSize:quality==='high'?'2K':'1K'}}};
        const r=await httpJSON(`${GEMINI}/models/${encodeURIComponent(model)}:generateContent`,{
          method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body)},120000);
        for(const c of (r?.candidates||[]))for(const p of (c.content?.parts||[])){
          if(['image/png','image/jpeg','image/webp'].includes(p.inlineData?.mimeType)&&typeof p.inlineData.data==='string'){
            return {buffer:Buffer.from(p.inlineData.data,'base64'),mimeType:p.inlineData.mimeType,provider:model};
          }
        }
        throw new MediaProviderError('IMAGE_PROVIDER_NO_OUTPUT',502);
      }catch(e){
        last=e;
        if(e.status===401||e.status===403||e.status===429)throw e;
        if(temporaryProviderFailure(e)) {shouldTryNextKey=true;break;}
        // For model-not-found and non-quota invalid-model errors, try model fallback
        // under the SAME authorized key (not another account).
      }
    }
    if(!shouldTryNextKey)break;
  }
  throw last||new MediaProviderError('IMAGE_PROVIDER_FAILED',502);
}

function videoBytes(res) {
  const step=(res?.steps||[]).filter(s=>s.type==='model_output');
  for (const s of step) for (const c of (s.content||[])) {
    if(c.type==='video'&&c.mime_type==='video/mp4'&&typeof c.data==='string') {
      return Buffer.from(c.data,'base64');
    }
  }
  return null;
}
export async function createVideo({prompt,previousInteractionId,referenceImage,aspectRatio='16:9',onReference=async()=>{}}) {
  const key=geminiKeys()[0];
  if(!key)throw new MediaProviderError('GEMINI_API_KEY_REQUIRED',503);
  const body={model:process.env.AP_MEDIA_VIDEO_MODEL||'gemini-omni-1.1-flash',
    input:referenceImage?[{type:'image',data:referenceImage.base64,mime_type:referenceImage.mimeType},{type:'text',text:prompt}]:prompt,
    response_format:{type:'video',aspect_ratio:aspectRatio==='9:16'?'9:16':'16:9',resolution:'720p'}};
  if(previousInteractionId) {
    body.previous_interaction_id=previousInteractionId;
    body.input=prompt; // Stateful editing uses the original video stored by Google.
  }
  let r=await httpJSON(`${GEMINI}/interactions`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body)},230000);
  if(r?.id)await onReference(r.id);
  for(let i=0;i<32;i++) {
    if(r?.status==='failed')throw new MediaProviderError('VIDEO_GENERATION_FAILED',502);
    const bytes=videoBytes(r);
    if(bytes?.length)return {buffer:bytes,mimeType:'video/mp4',provider:body.model,interactionId:r.id};
    if(!r?.id || r?.status==='completed')break;
    await new Promise(resolve=>setTimeout(resolve,12000));
    r=await httpJSON(`${GEMINI}/interactions/${encodeURIComponent(r.id)}`,{headers:{'x-goog-api-key':key}},30000);
  }
  throw new MediaProviderError('VIDEO_NO_RESULT_OR_TIMEOUT',504);
}
export async function startMeshy({prompt,previewTaskId,lowPoly=false}) {
  const key=process.env.MESHY_API_KEY;
  if(!key)throw new MediaProviderError('MESHY_API_KEY_REQUIRED',503);
  const body=previewTaskId
    ? {mode:'refine',preview_task_id:previewTaskId,ai_model:'latest',enable_pbr:true,target_formats:['glb','obj','fbx','stl']}
    : {mode:'preview',prompt:safeText(prompt,600),model_type:lowPoly?'lowpoly':'standard',ai_model:'latest',target_formats:['glb','obj','fbx','stl']};
  const r=await httpJSON(MESHY,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(body)},45000);
  if(!r?.result||typeof r.result!=='string')throw new MediaProviderError('3D_NO_TASK_ID',502);
  return r.result;
}
export async function startMeshyImage({image,lowPoly=false}) {
  const key=process.env.MESHY_API_KEY;
  if(!key)throw new MediaProviderError('MESHY_API_KEY_REQUIRED',503);
  if(!image||!['image/png','image/jpeg'].includes(image.mimeType)||typeof image.base64!=='string'||image.base64.length>5_500_000)throw new MediaProviderError('3D_IMAGE_INVALID',400);
  const body={image_url:`data:${image.mimeType};base64,${image.base64}`,
    model_type:lowPoly?'smart-topology':'standard',
    ...(lowPoly?{ai_model:'meshy-t2'}:{ai_model:'latest'}),
    should_texture:true,enable_pbr:true,target_formats:['glb','obj','fbx','stl']};
  const r=await httpJSON('https://api.meshy.ai/openapi/v1/image-to-3d',{method:'POST',
    headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(body)},45000);
  if(!r?.result||typeof r.result!=='string')throw new MediaProviderError('3D_NO_TASK_ID',502);
  return r.result;
}
export async function startMeshyRetexture({taskId,prompt}) {
  const key=process.env.MESHY_API_KEY;
  if(!key)throw new MediaProviderError('MESHY_API_KEY_REQUIRED',503);
  if(!/^[a-z0-9-]{8,80}$/i.test(taskId))throw new MediaProviderError('BAD_3D_TASK',400);
  const body={input_task_id:taskId,text_style_prompt:safeText(prompt,600),
    enable_original_uv:true,enable_pbr:true,ai_model:'latest',target_formats:['glb','obj','fbx','stl']};
  const r=await httpJSON('https://api.meshy.ai/openapi/v1/retexture',{method:'POST',
    headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(body)},45000);
  if(!r?.result||typeof r.result!=='string')throw new MediaProviderError('3D_NO_TASK_ID',502);
  return r.result;
}
export async function pollMeshy(taskId,phase='preview') {
  if(!/^[a-z0-9-]{8,80}$/i.test(taskId))throw new MediaProviderError('BAD_3D_TASK',400);
  const key=process.env.MESHY_API_KEY;
  if(!key)throw new MediaProviderError('MESHY_API_KEY_REQUIRED',503);
  const endpoint=phase==='image'?'https://api.meshy.ai/openapi/v1/image-to-3d':
    phase==='retexture'?'https://api.meshy.ai/openapi/v1/retexture':MESHY;
  return httpJSON(`${endpoint}/${taskId}`,{headers:{Authorization:`Bearer ${key}`}},30000);
}
export function verifiedMeshyLink(raw) {
  try {const u=new URL(raw);return u.protocol==='https:'&&(u.hostname==='assets.meshy.ai'||u.hostname.endsWith('.assets.meshy.ai'))?u.toString():null;}catch{return null;}
}
