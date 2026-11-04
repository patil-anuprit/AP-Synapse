// AP_CREATION_VERIFIED_ACCOUNT_QUOTA_V1
// AP Synapse's existing signed personalization token is the identity authority.
// Never use an x-session-id, browser-provided account ID, or guest cookie as authentication.
import {resolvePersonalizationIdentity} from '../personalizationService.js';
import {pool} from '../../database/db.js';

const quotaSetup = {ready: null};
const MAX_HOURLY = Math.max(1, Math.min(20, Number(process.env.AP_CREATION_HOURLY_LIMIT) || 5));

function error(message,status){return Object.assign(new Error(message),{status});}

export function verifiedCreationUser(req, resolve = resolvePersonalizationIdentity){
  const authorization = String(req.headers?.authorization || '');
  if(!/^Bearer\s+\S+$/i.test(authorization) || authorization.length > 4096)
    throw error('CREATION_LOGIN_REQUIRED',401);
  let identity;
  try { identity = resolve(req,'ap-creation'); }
  catch { throw error('CREATION_LOGIN_REQUIRED',401); }
  const id = String(identity?.googleId || '');
  if(!identity || identity.authenticated !== true || !id || identity.identityId !== `user:${id}`)
    throw error('CREATION_LOGIN_REQUIRED',401);
  return identity.identityId;
}

async function ensureQuotaTable(db){
  if(!quotaSetup.ready){
    quotaSetup.ready=db.query(`
      CREATE TABLE IF NOT EXISTS ap_creation_hourly_usage (
        account_id TEXT NOT NULL,
        hour_start TIMESTAMPTZ NOT NULL,
        requests INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (account_id, hour_start)
      )
    `).catch(e=>{quotaSetup.ready=null;throw e;});
  }
  await quotaSetup.ready;
}

// Atomic Postgres UPSERT prevents bypass through Render+Railway replicas.
// Production requires BOTH backends to share the same PostgreSQL database.
export async function reserveVerifiedCreation(req,{db=pool,resolve=resolvePersonalizationIdentity}={}){
  const account = verifiedCreationUser(req,resolve);
  if(!process.env.DATABASE_URL) throw error('CREATION_DATABASE_REQUIRED',503);
  try{
    await ensureQuotaTable(db);
    const result = await db.query(`
      INSERT INTO ap_creation_hourly_usage(account_id,hour_start,requests)
      VALUES($1,date_trunc('hour',now()),1)
      ON CONFLICT(account_id,hour_start)
      DO UPDATE SET requests=ap_creation_hourly_usage.requests+1
      WHERE ap_creation_hourly_usage.requests < $2
      RETURNING requests
    `,[account,MAX_HOURLY]);
    if(!result.rows?.length) throw error('CREATION_HOURLY_LIMIT',429);
  } catch(e){
    if(e.status===429)throw e;
    throw error('CREATION_DATABASE_UNAVAILABLE',503); // fail CLOSED, never free unlimited generation
  }
  // Only verified identities may be used for cost attribution.
  req.user={...(typeof req.user==='object'&&req.user?req.user:{}),id:account};
  return account;
}
