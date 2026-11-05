// AP Synapse chat-first media engine: no Canvas dependency, UI change or new studio.
import {randomUUID,createHash} from 'node:crypto';
import {Router} from 'express';
import {pool} from '../../database/db.js';
import {reserveVerifiedCreation,verifiedCreationUser} from '../ap-creation/authQuota.mjs';
import {mediaIntent,composePrompt,safeText} from './intent.mjs';
import {createImage,createVideo,startMeshy,startMeshyImage,startMeshyRetexture,pollMeshy,verifiedMeshyLink} from './providers.mjs';

const schema=`CREATE TABLE IF NOT EXISTS ap_media_jobs (
  id UUID PRIMARY KEY, owner_id TEXT NOT NULL, session_key TEXT NOT NULL,
  kind TEXT NOT NULL, request_text TEXT NOT NULL, prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', phase TEXT NOT NULL DEFAULT '',
  provider_ref TEXT, mime_type TEXT, file_name TEXT,
  content BYTEA, external_url TEXT, error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);CREATE INDEX IF NOT EXISTS ap_media_jobs_history ON ap_media_jobs(owner_id,session_key,created_at DESC);
CREATE TABLE IF NOT EXISTS ap_media_chat_turns(
  id BIGSERIAL PRIMARY KEY,owner_id TEXT NOT NULL,session_key TEXT NOT NULL,
  message TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);CREATE INDEX IF NOT EXISTS ap_media_chat_history ON ap_media_chat_turns(owner_id,session_key,id DESC);`;
let schemaPromise;
async function ensure(db){
  if(!schemaPromise) schemaPromise=db.query(schema).catch(e=>{schemaPromise=null;throw e;});
  await schemaPromise;
}
function err(code,status=400){return Object.assign(new Error(code),{status});}
function scoped(owner,req){
  const session=safeText(req.get?.('x-session-id')||req.headers?.['x-session-id'],150);
  if(!session||session.length<8)throw err('MEDIA_SESSION_REQUIRED',400);
  return createHash('sha256').update(`${owner}\0${session}`).digest('hex');
}
function compact3dPrompt(message,previous){
  const base=safeText(message,450);
  if(!/\b(it|this|that|same|previous|earlier)\b/i.test(message))return base;
  const prior=previous?.[0]?.request_text;
  return safeText(`${base}. Reference subject: ${safeText(prior,140)}`,600);
}
function niceName(kind){return `ap-synapse-${kind==='model3d'?'3d-model':kind}-${Date.now()}`;}
function mimeAllowed(mime){return ['image/png','image/jpeg','image/webp','video/mp4'].includes(mime);}
function imageOptions(message){
  const ratio=/\b(9:16|3:4|16:9|4:3|1:1)\b/.exec(message)?.[0];
  return {aspectRatio:ratio||(/\b(vertical|portrait|reel)\b/i.test(message)?'9:16':(/\b(wide|landscape|cinematic)\b/i.test(message)?'16:9':'1:1')),
    quality:/\b(high quality|high resolution|premium|2k|4k)\b/i.test(message)?'high':'standard'};
}
function errorToUser(e){
  if(/_REQUIRED|NOT_ENABLED|MEDIA_SESSION_REQUIRED/.test(e?.message||''))return e.message;
  if(e?.status===429)return 'MEDIA_RATE_LIMIT';
  return 'MEDIA_GENERATION_FAILED';
}
const MAX_BYTES=Number(process.env.AP_MEDIA_MAX_BYTES||22_000_000);
const DAILY_LIMITS={image:'AP_MEDIA_IMAGE_DAILY_LIMIT',video:'AP_MEDIA_VIDEO_DAILY_LIMIT',model3d:'AP_MEDIA_3D_DAILY_LIMIT'};
const DAILY_DEFAULTS={image:20,video:1,model3d:2};
const MAX_STORED_BYTES=Number.isFinite(MAX_BYTES)?Math.max(1_000_000,Math.min(45_000_000,MAX_BYTES)):22_000_000;
export function createMediaEngine({db=pool,getContext=async()=>({history:[]}),
  authorize=verifiedCreationUser,reserve=reserveVerifiedCreation,
  providers={createImage,createVideo,startMeshy,startMeshyImage,startMeshyRetexture,pollMeshy}}={}) {
  const router=Router();
  async function captureChat(req,res,next){
    if(process.env.AP_MEDIA_ENABLED!=='true')return next();
    const message=safeText(req.body?.message,2500);
    if(!message)return next();
    try{
      const owner=authorize(req),session=scoped(owner,req);
      await ensure(db);
      await db.query('INSERT INTO ap_media_chat_turns(owner_id,session_key,message) VALUES($1,$2,$3)',[owner,session,message]);
    }catch{/* Chat must not fail due to media memory capture. */}
    return next();
  }
  async function recent(owner,session){
    const r=await db.query(`SELECT id,kind,request_text,prompt,phase,status,provider_ref,mime_type,
      CASE WHEN kind='image' THEN content ELSE NULL END AS content
      FROM ap_media_jobs WHERE owner_id=$1 AND session_key=$2 AND status='ready'
      ORDER BY created_at DESC LIMIT 8`,[owner,session]);
    return r.rows||[];
  }
  async function reserveDaily(owner,kind){
    await db.query(`CREATE TABLE IF NOT EXISTS ap_media_daily_usage(
      owner_id TEXT NOT NULL,kind TEXT NOT NULL,day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
      used INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(owner_id,kind,day))`);
    const max=Math.max(0,Math.min(100,Number(process.env[DAILY_LIMITS[kind]]??DAILY_DEFAULTS[kind])||0));
    if(!max)throw err('MEDIA_DAILY_DISABLED',429);
    const r=await db.query(`INSERT INTO ap_media_daily_usage(owner_id,kind,day,used)
      VALUES($1,$2,(now() AT TIME ZONE 'UTC')::date,1)
      ON CONFLICT(owner_id,kind,day) DO UPDATE SET used=ap_media_daily_usage.used+1
      WHERE ap_media_daily_usage.used < $3 RETURNING used`,[owner,kind,max]);
    if(!r.rows?.length)throw err('MEDIA_DAILY_LIMIT',429);
  }
  async function saveJob(job) {
    await db.query(`INSERT INTO ap_media_jobs(id,owner_id,session_key,kind,request_text,prompt,status,phase)
      VALUES($1,$2,$3,$4,$5,$6,'queued','')`,
      [job.id,job.owner,job.session,job.kind,job.message,job.prompt]);
  }
  async function update(id,params) {
    const entries=Object.entries(params);
    const assignments=entries.map(([field],i)=>`${field}=$${i+2}`).join(',');
    await db.query(`UPDATE ap_media_jobs SET ${assignments},updated_at=now() WHERE id=$1`,[id,...entries.map(x=>x[1])]);
  }
  async function jobProcess(job) {
    const {id,kind,prompt,previous,options}=job;
    try {
      await update(id,{status:'running'});
      if(kind==='image'){
        const source=previous.find(p=>p.kind==='image'&&p.content&&p.mime_type);
        const previousImage=source?{base64:Buffer.from(source.content).toString('base64'),mimeType:source.mime_type}:null;
        const needsPrevious=/\b(it|this|same|previous|earlier|last|edit|change|modify|revise|refine|recolor)\b/i.test(job.message);
        const result=await providers.createImage({prompt,previousImage:needsPrevious?previousImage:null,...options});
        if(!mimeAllowed(result.mimeType)||result.mimeType==='video/mp4'||!Buffer.isBuffer(result.buffer)||!result.buffer.length||result.buffer.length>MAX_STORED_BYTES)throw err('MEDIA_FILE_UNSUPPORTED_OR_TOO_LARGE',413);
        await update(id,{status:'ready',mime_type:result.mimeType,file_name:`${niceName(kind)}.${result.mimeType==='image/jpeg'?'jpg':result.mimeType==='image/webp'?'webp':'png'}`,content:result.buffer});
      } else if(kind==='video') {
        const priorVideo=previous.find(p=>p.kind==='video'&&p.provider_ref);
        const priorImage=previous.find(p=>p.kind==='image'&&p.content&&p.mime_type);
        const wantsEdit=/\b(edit|change|adjust|revise|replace|modify|extend|refine|same video)\b/i.test(job.message);
        const wantsImage=/\b(image|photo|picture|animate|from this|from it|turn it|turn this)\b/i.test(job.message);
        const videoPrompt=safeText(prompt,13000);
        const result=await providers.createVideo({prompt:videoPrompt,
          previousInteractionId:wantsEdit?priorVideo?.provider_ref:null,
          referenceImage:!wantsEdit&&wantsImage&&priorImage?{base64:Buffer.from(priorImage.content).toString('base64'),mimeType:priorImage.mime_type}:null,
          aspectRatio:options.aspectRatio==='9:16'?'9:16':'16:9',onReference:async ref=>update(id,{provider_ref:ref})});
        if(result.mimeType!=='video/mp4'||!Buffer.isBuffer(result.buffer)||!result.buffer.length||result.buffer.length>MAX_STORED_BYTES)throw err('MEDIA_FILE_UNSUPPORTED_OR_TOO_LARGE',413);
        await update(id,{status:'ready',mime_type:'video/mp4',file_name:`${niceName(kind)}.mp4`,content:result.buffer,provider_ref:result.interactionId||null});
      } else if(kind==='model3d') {
        const prevModel=previous.find(p=>p.kind==='model3d'&&p.provider_ref&&p.phase!=='retexture');
        const wantsTexture=/\b(texture|texturize|colour|color|materials|pbr|refine mesh)\b/i.test(job.message);
        const prevImage=previous.find(p=>p.kind==='image'&&p.content&&p.mime_type);
        const useImage=Boolean(prevImage&&['image/jpeg','image/png'].includes(prevImage.mime_type)&&/\b(image|picture|photo|this|it|that)\b/i.test(job.message)&&!wantsTexture);
        const lowPoly=/\b(low.poly|game.ready|low polygon)\b/i.test(job.message);
        const useRetexture=Boolean(wantsTexture&&prevModel?.provider_ref);
        const taskId=useRetexture
          ? await providers.startMeshyRetexture({taskId:prevModel.provider_ref,prompt:compact3dPrompt(job.message,previous)})
          : useImage
            ? await providers.startMeshyImage({image:{mimeType:prevImage.mime_type,base64:Buffer.from(prevImage.content).toString('base64')},lowPoly})
            : await providers.startMeshy({prompt:compact3dPrompt(job.message,previous),lowPoly});
        await update(id,{status:'provider_pending',provider_ref:taskId,phase:useRetexture?'retexture':useImage?'image':'preview',mime_type:'model/gltf-binary',file_name:`${niceName(kind)}.glb`});
      }
    }catch(e){
      await update(id,{status:'failed',error_code:errorToUser(e)}).catch(()=>{});
    }
  }
  async function fetchJob(id,owner,includeBytes=false) {
    const cols=includeBytes?'*':'id,owner_id,session_key,kind,request_text,prompt,status,phase,provider_ref,mime_type,file_name,external_url,error_code,created_at,updated_at';
    const r=await db.query(`SELECT ${cols} FROM ap_media_jobs WHERE id=$1 AND owner_id=$2 LIMIT 1`,[id,owner]);
    return r.rows?.[0]||null;
  }
  async function refreshMeshy(job) {
    if(job.kind!=='model3d'||job.status!=='provider_pending'||!job.provider_ref)return job;
    // Provider is polled on GET, so 3D jobs survive Render/Railway restarts.
    const s=await providers.pollMeshy(job.provider_ref,job.phase);
    if(s.status==='SUCCEEDED'){
      const link=verifiedMeshyLink(s.model_urls?.glb);
      if(!link)throw err('3D_NO_GLTF_RESULT',502);
      await update(job.id,{status:'ready',external_url:link});
      return {...job,status:'ready',external_url:link};
    }
    if(['FAILED','CANCELED'].includes(s.status)){
      await update(job.id,{status:'failed',error_code:'3D_PROVIDER_FAILED'});
      return {...job,status:'failed',error_code:'3D_PROVIDER_FAILED'};
    }
    return job;
  }
  async function submit(req,res,next) {
    if(process.env.AP_MEDIA_ENABLED!=='true')return next();
    const message=safeText(req.body?.message,8000);
    if(!message)return next();
    let owner,session,previous;
    try {
      // Do not inspect media history for unauthenticated callers.
      // General /chat remains available to guests.
      if(!/\b(image|video|photo|picture|poster|logo|3d|mesh|animate|modify|edit|change|refine|render|make it|turn it|create|generate)\b/i.test(message))return next();
      owner=authorize(req);
      session=scoped(owner,req);
      await ensure(db);
      previous=await recent(owner,session);
    } catch(e) {
      // Only explicitly media-like requests are subject to media authentication.
      const candidate=mediaIntent(message);
      if(!candidate)return next();
      return res.status(e.status||503).json({error:errorToUser(e)});
    }
    const hint=previous?.[0]?{kind:previous[0].kind}:null;
    const intent=mediaIntent(message,hint);
    if(!intent)return next();
    if(intent.kind==='video'&&process.env.AP_MEDIA_VIDEO_ENABLED!=='true')return res.status(503).json({error:'VIDEO_NOT_ENABLED'});
    if(intent.kind==='model3d'&&process.env.AP_MEDIA_3D_ENABLED!=='true')return res.status(503).json({error:'3D_NOT_ENABLED'});
    if(intent.kind==='video'&&!process.env.GEMINI_API_KEY&&!process.env.GOOGLE_API_KEY)return res.status(503).json({error:'GEMINI_API_KEY_REQUIRED'});
    if(intent.kind==='model3d'&&!process.env.MESHY_API_KEY)return res.status(503).json({error:'MESHY_API_KEY_REQUIRED'});
    try {
      const memory=await db.query(`SELECT message FROM ap_media_chat_turns WHERE owner_id=$1 AND session_key=$2
        ORDER BY id DESC LIMIT 20`,[owner,session]);
      // This account-scoped record includes intervening ordinary user messages.
      const ownedTurns=(memory.rows||[]).reverse().map(r=>({role:'user',content:r.message}));
      const context=await getContext(req,{owner,sessionId:safeText(req.get('x-session-id'),150)});
      // Optional existing assistant history must be ownership-verified by the integration.
      const trusted=Array.isArray(context?.history)?context.history:[];
      const prompt=composePrompt({message,history:[...trusted,...ownedTurns],previous:previous.map(p=>({kind:p.kind,prompt:p.prompt})),kind:intent.kind});
      // A duplicate click cannot launch a second costly generation while one is active.
      const pending=await db.query(`SELECT id,kind,status FROM ap_media_jobs WHERE owner_id=$1 AND session_key=$2
        AND status IN ('queued','running','provider_pending') ORDER BY created_at DESC LIMIT 1`,[owner,session]);
      if(pending.rows?.length)return res.status(202).json({type:'ap_media_job',success:true,
        jobId:pending.rows[0].id,kind:pending.rows[0].kind,status:pending.rows[0].status,message:'Creation already in progress'});
      await reserveDaily(owner,intent.kind);
      await reserve(req); // Existing verified-account atomic PostgreSQL hourly quota.
      const job={id:randomUUID(),owner,session,kind:intent.kind,message,prompt,previous,options:imageOptions(message)};
      await saveJob(job);
      setImmediate(()=>jobProcess(job).catch(()=>{}));
      res.set('Cache-Control','no-store');
      return res.status(202).json({type:'ap_media_job',success:true,kind:job.kind,jobId:job.id,status:'queued',message:`Creating ${job.kind==='model3d'?'3D model':job.kind}...`});
    } catch(e) {
      return res.status(e.status>=400&&e.status<600?e.status:503).json({error:errorToUser(e)});
    }
  }
  const gate=(req,res,next)=>{
    if(process.env.AP_MEDIA_ENABLED!=='true')return res.sendStatus(404);
    try {req.apMediaOwner=authorize(req);return next();} catch(e){return res.status(e.status||401).json({error:'MEDIA_LOGIN_REQUIRED'});}
  };
  router.get('/jobs/:id',gate,async(req,res)=>{
    try {
      if(!/^[0-9a-f-]{36}$/i.test(req.params.id))return res.sendStatus(404);
      let job=await fetchJob(req.params.id,req.apMediaOwner);
      if(!job)return res.sendStatus(404);
      if(job.kind==='model3d'&&job.status==='provider_pending'){
        try{job=await refreshMeshy(job);}catch(e){return res.status(503).json({error:errorToUser(e)});}
      }
      if(job.status==='running'&&Date.now()-new Date(job.updated_at).getTime()>20*60_000){
        await update(job.id,{status:'failed',error_code:'WORKER_INTERRUPTED'});
        job.status='failed';job.error_code='WORKER_INTERRUPTED';
      }
      return res.set('Cache-Control','no-store').json({type:'ap_media_status',jobId:job.id,kind:job.kind,
        status:job.status,error:job.error_code||null,fileName:job.status==='ready'?job.file_name:null,
        mimeType:job.status==='ready'?job.mime_type:null,
        externalUrl:job.status==='ready'&&job.kind==='model3d'?job.external_url:null});
    }catch{return res.status(503).json({error:'MEDIA_STATUS_UNAVAILABLE'});}
  });
  router.get('/jobs/:id/file',gate,async(req,res)=>{
    try {
      if(!/^[0-9a-f-]{36}$/i.test(req.params.id))return res.sendStatus(404);
      const job=await fetchJob(req.params.id,req.apMediaOwner,true);
      if(!job||job.status!=='ready')return res.sendStatus(404);
      res.set('Cache-Control','private, no-store');
      if(job.kind==='model3d'){
        const url=verifiedMeshyLink(job.external_url);if(!url)return res.sendStatus(404);
        return res.redirect(302,url);
      }
      if(!mimeAllowed(job.mime_type)||!job.content)return res.sendStatus(404);
      res.set('Content-Type',job.mime_type);
      res.set('X-Content-Type-Options','nosniff');
      res.set('Content-Disposition',`attachment; filename="${String(job.file_name||'ap-synapse').replace(/[^a-z0-9_.-]/gi,'_')}"`);
      return res.status(200).send(job.content);
    }catch{return res.status(503).json({error:'MEDIA_DOWNLOAD_UNAVAILABLE'});}
  });
  return {captureChat,chatMiddleware:submit,router};
}
