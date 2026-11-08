// AP_APRISHA_STT_STAGING_V1 - never deploy openly to production.
import express from 'express';
import multer from 'multer';
import Groq, { toFile } from 'groq-sdk';
import { resolvePersonalizationIdentity } from '../services/personalizationService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^audio\/(webm|ogg|mp4|wav|mpeg|x-m4a)(;|$)/i.test(file.mimetype));
  }
}).single('audio');

// AP_APRISHA_SIGNED_AUTH_V5 — verified signed-in users, no daily/minute quotas.
// Keep limited *simultaneous* requests to avoid memory/provider overload.
// Production scale-out needs distributed concurrency controls and cost monitoring.
function verifiedUser(req) {
  const authorization = String(req.headers.authorization || '');
  if (authorization.length > 500 || !/^Bearer\s+\S+$/i.test(authorization)) return null;
  try {
    const identity = resolvePersonalizationIdentity(req, 'aprisha-whisper');
    const id = String(identity?.googleId || '');
    if (identity?.authenticated !== true || !id ||
        identity.identityId !== `user:${id}`) return null;
    return id;
  } catch { return null; }
}

const concurrentByUser = new Map();
let concurrentGlobal = 0;
const GLOBAL_CONCURRENCY = Math.max(4, Math.min(48,
  Number.parseInt(process.env.AP_APRISHA_STT_MAX_CONCURRENT || '24', 10) || 24));
const USER_CONCURRENCY = 2;

function acquireRequest(id, res) {
  const current = concurrentByUser.get(id) || 0;
  if (concurrentGlobal >= GLOBAL_CONCURRENCY || current >= USER_CONCURRENCY) return false;
  concurrentGlobal += 1;
  concurrentByUser.set(id, current + 1);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    concurrentGlobal = Math.max(0, concurrentGlobal - 1);
    const remaining = (concurrentByUser.get(id) || 1) - 1;
    if (remaining > 0) concurrentByUser.set(id, remaining);
    else concurrentByUser.delete(id);
  };
  res.once('finish', release);
  res.once('close', release);
  return true;
}

router.post('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const verifiedId = verifiedUser(req);
  if (!verifiedId) return res.status(401).json({ok:false,error:'Not authorized'});
  if (!acquireRequest(verifiedId, res)) return res.status(503).json({ok:false,error:'Voice service temporarily busy'});
  if (!process.env.GROQ_API_KEY) return res.status(503).json({ok:false,error:'Groq not configured'});

  upload(req, res, async err => {
    if (err) return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
      .json({ok:false,error:'Invalid or oversized audio upload'});
    if (!req.file || req.file.size < 500)
      return res.status(400).json({ok:false,error:'Missing or empty audio'});
    try {
      const ext = req.file.mimetype.includes('mp4') ? 'm4a'
        : req.file.mimetype.includes('ogg') ? 'ogg'
        : req.file.mimetype.includes('wav') ? 'wav'
        : req.file.mimetype.includes('mpeg') ? 'mp3' : 'webm';
      const lang = ['en', 'hi'].includes(req.body?.language) ? req.body.language : undefined;
      const client = new Groq({apiKey:process.env.GROQ_API_KEY});
      const result = await client.audio.transcriptions.create({
        model: 'whisper-large-v3-turbo',
        file: await toFile(req.file.buffer, `speech.${ext}`, {type:req.file.mimetype}),
        ...(lang ? {language:lang} : {}),
        response_format: 'json'
      }, {timeout:30_000});
      return res.json({ok:true,text:String(result.text || '').trim()});
    } catch (error) {
      console.error('aprisha.stt.failed', {status:error.status || 502});
      return res.status(error.status === 429 ? 429 : 502)
        .json({ok:false,error:'Transcription service unavailable'});
    }
  });
});
export default router;
