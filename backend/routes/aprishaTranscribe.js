// AP_APRISHA_STT_STAGING_V1 - never deploy openly to production.
import express from 'express';
import multer from 'multer';
import Groq, { toFile } from 'groq-sdk';
import { resolvePersonalizationIdentity } from '../services/personalizationService.js';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

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
// AP_APRISHA_GUEST_V6 — anonymous voice-only access (Preview opt-in).
// Origin validation helps block drive-by websites, but is not authentication:
// clients outside browsers can spoof Origin, so also enforce bounded issuance,
// request bursts, uploads and total service concurrency / provider capacity.
const GUEST_TTL_MS = 10 * 60 * 1000;
const guestSigningSecret = String(process.env.AP_APRISHA_STT_GUEST_SECRET || '');
const guestAllowedOrigins = new Set(
  String(process.env.AP_APRISHA_STT_ALLOWED_ORIGIN || '')
    .split(',').map(origin => origin.trim().replace(/\/+$/, '')).filter(Boolean)
);
const guestEnabled = process.env.AP_APRISHA_STT_GUEST_ENABLED === '1';
const mintCounters = new Map();
const usageCounters = new Map();

function validGuestConfig() {
  return guestEnabled && guestSigningSecret.length >= 32 && guestAllowedOrigins.size > 0;
}
function permittedOrigin(req) {
  const origin = String(req.get('origin') || '').replace(/\/+$/, '');
  return origin.length > 0 && guestAllowedOrigins.has(origin);
}
function visitorKey(req) {
  // req.ip uses Express' configured trusted proxies, never a raw user-supplied header.
  return String(req.ip || req.socket?.remoteAddress || 'unavailable').slice(0, 128);
}
function takeBurst(map, key, maximum, windowMs = 60_000) {
  const now = Date.now();
  if (map.size > 10000) {
    for (const [id, state] of map) {
      if (now >= state.reset) map.delete(id);
    }
    if (map.size > 10000) return false;
  }
  const old = map.get(key);
  const current = !old || now >= old.reset ? { reset: now + windowMs, count: 0 } : old;
  if (current.count >= maximum) return false;
  current.count += 1;
  map.set(key, current);
  return true;
}
function makeGuestProof() {
  const payload = Buffer.from(JSON.stringify({
    v: 1, n: randomBytes(16).toString('hex'), e: Date.now() + GUEST_TTL_MS
  })).toString('base64url');
  const signature = createHmac('sha256', guestSigningSecret)
    .update('aprisha-guest-v6.' + payload).digest('base64url');
  return 'guest.' + payload + '.' + signature;
}
function guestId(token) {
  if (!validGuestConfig() || token.length > 600 || !/^guest\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  const parts = token.split('.');
  try {
    const expected = createHmac('sha256', guestSigningSecret)
      .update('aprisha-guest-v6.' + parts[1]).digest();
    const given = Buffer.from(parts[2], 'base64url');
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (payload.v !== 1 || !/^[a-f0-9]{32}$/.test(payload.n) ||
        !Number.isFinite(payload.e) || payload.e <= Date.now() ||
        payload.e > Date.now() + GUEST_TTL_MS) return null;
    return 'guest:' + payload.n;
  } catch { return null; }
}
function verifiedUser(req) {
  const authorization = String(req.headers.authorization || '');
  if (authorization.length > 800 || !/^Bearer\s+\S+$/i.test(authorization)) return null;
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (token.startsWith('guest.')) {
    if (!permittedOrigin(req)) return null;
    return guestId(token);
  }
  try {
    const identity = resolvePersonalizationIdentity(req, 'aprisha-whisper');
    const id = String(identity?.googleId || '');
    if (identity?.authenticated !== true || !id ||
        identity.identityId !== `user:${id}`) return null;
    return 'user:' + id;
  } catch { return null; }
}

// Note: guest proof issuance is NOT sufficient for high-risk public deployment.
// At scale use a shared store, abuse prevention and an enforced provider spend budget.
router.post('/session', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!validGuestConfig())
    return res.status(503).json({ok:false,error:'Guest voice is not enabled on this server'});
  if (!permittedOrigin(req))
    return res.status(403).json({ok:false,error:'Voice origin not allowed'});
  if (!takeBurst(mintCounters, visitorKey(req), 30))
    return res.status(429).json({ok:false,error:'Voice service temporarily busy'});
  if (!process.env.GROQ_API_KEY)
    return res.status(503).json({ok:false,error:'Speech provider unavailable'});
  return res.json({ok:true,token:makeGuestProof(),expiresAt:Date.now() + GUEST_TTL_MS});
});

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
  // Guest abuse controls: no *daily* conversation cap, but protect provider spend.
  if (verifiedId.startsWith('guest:')) {
    if (!takeBurst(usageCounters, 'visitor:' + visitorKey(req), 24) ||
        !takeBurst(usageCounters, 'instance', 120)) {
      return res.status(429).json({ok:false,error:'Voice service temporarily busy'});
    }
  }
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
