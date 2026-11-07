// AP_APRISHA_STT_STAGING_V1 - never deploy openly to production.
import express from 'express';
import multer from 'multer';
import Groq, { toFile } from 'groq-sdk';
import { timingSafeEqual } from 'node:crypto';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^audio\/(webm|ogg|mp4|wav|mpeg|x-m4a)(;|$)/i.test(file.mimetype));
  }
}).single('audio');

function authorized(req) {
  const expected = process.env.AP_APRISHA_STT_TEST_TOKEN || '';
  const given = req.get('x-ap-stt-test-token') || '';
  if (expected.length < 24 || given.length > 256 || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

let windowStarted = Date.now();
let requestCount = 0;
router.post('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!authorized(req)) return res.status(401).json({ok:false,error:'Not authorized'});
  const now = Date.now();
  if (now - windowStarted >= 60_000) {
    windowStarted = now;
    requestCount = 0;
  }
  if (++requestCount > 10) return res.status(429).json({ok:false,error:'Test rate limit reached'});
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
