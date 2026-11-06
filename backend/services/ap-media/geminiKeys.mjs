// Backend-only, authorized Gemini credential availability manager.
// Limits and billing are enforced by Google per project; this manager never
// interprets a 429, access denial, or billing failure as a reason to switch accounts.
import {createHash} from 'node:crypto';

const state = new Map();
let globalPauseUntil = 0;
const maxEntries = 128;
const now = () => Date.now();
const fingerprint = (value) => createHash('sha256').update(value).digest('hex').slice(0,16);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));

export function configuredGeminiKeys() {
  const entries = [
    ['GEMINI_API_KEY',process.env.GEMINI_API_KEY],
    ['GOOGLE_API_KEY',process.env.GOOGLE_API_KEY]
  ];
  if(process.env.AP_MEDIA_MULTI_KEY_ENABLED === 'true') {
    for(let i=1;i<=10;i++) {
      const label = `AP_MEDIA_GEMINI_KEY_${String(i).padStart(2,'0')}`;
      entries.push([label,process.env[label]]);
    }
  }
  const used = new Set();
  return entries.flatMap(([name,value]) => {
    if(typeof value !== 'string' || !value.trim()) return [];
    const key = value.trim();
    const id = fingerprint(key);
    if(used.has(id)) return [];
    used.add(id);
    return [{name,key,id}];
  });
}

// Backwards-compatible exports used by the existing media provider.
export function geminiKeys() {return configuredGeminiKeys().map(k=>k.key);}
export function hasGeminiKeys() {return configuredGeminiKeys().length > 0;}
export function temporaryProviderFailure(error) {
  return error?.message === 'PROVIDER_TIMEOUT' || error?.name === 'AbortError' ||
    /^(?:PROVIDER|MODEL)_HTTP_(500|502|503|504)$/.test(String(error?.message || '')) ||
    [500,502,503,504].includes(Number(error?.status));
}

function currentStatus(entry) {
  const record = state.get(entry.id);
  if(!record || (record.until && record.until <= now())){
    if(record) state.delete(entry.id);
    return {status:'healthy',until:0,failures:0};
  }
  return record;
}
function remember(entry, status, durationMs, previous) {
  const failures = (previous?.failures || 0) + 1;
  state.set(entry.id,{status,until: durationMs ? now()+durationMs : 0,failures,name:entry.name});
  while(state.size>maxEntries) state.delete(state.keys().next().value);
}

// No raw keys, hashes, owner identifiers or project names in status output.
export function geminiKeyHealth() {
  return configuredGeminiKeys().map(entry => {
    const info = currentStatus(entry);
    return {name:entry.name,status:info.status,retryAt:info.until||null,failures:info.failures};
  });
}

// Compatible with media, Canvas, and document planning calls.
// At most N independent credential attempts on *transient* 5xx/timeout errors.
// Quota (429) and access/billing errors are terminal for this operation.
export async function withGeminiFailover(call,{maxAttempts}={}){
  if(typeof call!=='function') throw new TypeError('Gemini callback required');
  if(globalPauseUntil > now())throw Object.assign(new Error('PROVIDER_QUOTA_OR_ACCESS_PAUSED'),{status:429});
  const credentials = configuredGeminiKeys();
  if(!credentials.length) throw Object.assign(new Error('GEMINI_API_KEY_REQUIRED'),{status:503});
  const limit = clamp(Number(maxAttempts ?? process.env.AP_MEDIA_MAX_FAILOVER_KEYS ?? 3),1,10);
  const eligible = credentials.filter(k=>currentStatus(k).status==='healthy');
  if(!eligible.length)throw Object.assign(new Error('PROVIDER_TEMPORARILY_UNAVAILABLE'),{status:503});
  // Stable primary-first ordering; backup credentials are for transient faults only.
  const ordered = eligible.slice(0,limit);
  let lastError;
  for(const entry of ordered){
    try{
      const result = await call(entry.key,{name:entry.name});
      state.delete(entry.id);
      return result;
    }catch(e){
      lastError = e;
      if(e?.status===429 || /(?:QUOTA|RATE_LIMIT|RESOURCE_EXHAUSTED)/i.test(String(e?.message||''))){
        // Never attempt a different account to evade a rate/project quota.
        remember(entry,'rate-limited',60_000,currentStatus(entry));
        globalPauseUntil=now()+60_000;
        throw e;
      }
      if([401,403].includes(e?.status)){
        remember(entry,'access-denied',15*60_000,currentStatus(entry));
        globalPauseUntil=now()+15*60_000;
        throw e;
      }
      if(!temporaryProviderFailure(e))throw e;
      const previous = currentStatus(entry);
      const delay = clamp(30_000 * 2**Math.min(previous.failures,4),30_000,15*60_000);
      remember(entry,'cooldown',delay,previous);
      // Continue only for transient provider/network failures.
    }
  }
  throw lastError || Object.assign(new Error('PROVIDER_TEMPORARILY_UNAVAILABLE'),{status:503});
}

// Test helper: resets runtime state without exposing secrets. Do not call from HTTP routes.
export function __resetGeminiKeyHealthForTests(){state.clear();globalPauseUntil=0;}
