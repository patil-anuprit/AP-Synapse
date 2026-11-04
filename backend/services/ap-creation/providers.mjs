import {cleanText} from './intent.mjs';
const API = 'https://generativelanguage.googleapis.com/v1beta/models/';
function getKey(){const k=process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY; if(!k) throw new Error('CREATION_PROVIDER_NOT_CONFIGURED');return k;}
export class ProviderError extends Error { constructor(message,status=502){super(message);this.name='ProviderError';this.status=status;} }
async function generate(model,body,timeoutMs=70000){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const r=await fetch(`${API}${encodeURIComponent(model)}:generateContent`,{
      method:'POST',headers:{'content-type':'application/json','x-goog-api-key':getKey()},
      body:JSON.stringify(body),signal:controller.signal
    });
    const out=await r.json().catch(()=>null);
    if(!r.ok){throw new ProviderError(`MODEL_HTTP_${r.status}`,r.status);}
    return out;
  }catch(e){if(e.name==='AbortError')throw new ProviderError('MODEL_TIMEOUT',504);throw e;}
  finally{clearTimeout(timer);}
}
function textFrom(res){return(res?.candidates||[]).flatMap(c=>c.content?.parts||[]).map(p=>p.text||'').join('\n').trim();}
export async function geminiPlan(prompt){
  const model=process.env.AP_CREATION_TEXT_MODEL || 'gemini-3.1-flash-lite';
  const r=await generate(model,{contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0.4,maxOutputTokens:8192}},65000);
  let t=textFrom(r);t=t.replace(/^```(?:json)?\s*|\s*```$/g,'');
  try{return JSON.parse(t);}catch{throw new ProviderError('MODEL_INVALID_JSON');}
}
export async function geminiImage({prompt,referenceImages=[],aspectRatio='1:1',quality='standard'}){
  // Model names are stable Google API identifiers as of Nov 2026. Availability and billing depend on account.
  const models=quality==='high'
    ? [process.env.AP_CREATION_IMAGE_PRO_MODEL||'gemini-3-pro-image',process.env.AP_CREATION_IMAGE_MODEL||'gemini-3.1-flash-image']
    : [process.env.AP_CREATION_IMAGE_MODEL||'gemini-3.1-flash-image',process.env.AP_CREATION_IMAGE_FALLBACK||'gemini-3.1-flash-lite-image'];
  const parts=[{text:cleanText(prompt,14000)}];
  for (const item of referenceImages.slice(0,3)){
    if(!/^image\/(png|jpeg|webp)$/.test(item.mimeType)||!/^[-A-Za-z0-9+/=]+$/.test(item.base64))continue;
    if(item.base64.length>5_500_000)continue;
    parts.push({inlineData:{mimeType:item.mimeType,data:item.base64}});
  }
  let last=null;
  for(let i=0;i<models.length;i++){
    try{
      const model=models[i];
      const body={contents:[{role:'user',parts}],generationConfig:{responseModalities:['TEXT','IMAGE'],imageConfig:{aspectRatio,...(model.includes('lite')?{}:{imageSize:quality==='high'?'2K':'1K'})}}};
      const response=await generate(model,body,90000);
      for(const p of (response.candidates||[]).flatMap(c=>c.content?.parts||[])){
        const data=p.inlineData?.data, mime=p.inlineData?.mimeType;
        if(typeof data==='string' && /^image\/(png|jpeg|webp)$/.test(mime||''))return {buffer:Buffer.from(data,'base64'),mimeType:mime,model};
      }
      throw new ProviderError('MODEL_NO_IMAGE',502);
    }catch(e){last=e; if(![429,500,502,503,504].includes(e.status))break;}
  }
  throw last||new ProviderError('MODEL_NO_IMAGE');
}
