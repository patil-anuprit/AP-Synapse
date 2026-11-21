import {createHmac,randomUUID} from 'node:crypto';
import {pool} from '../../database/db.js';
import {reserveVerifiedCreation} from './authQuota.mjs';

const initialized=new WeakMap();
const fail=(code,status)=>
  Object.assign(new Error(code),{status});

async function ensureTable(db){
  if(!initialized.has(db)){
    const ready=db.query(`
      CREATE TABLE IF NOT EXISTS ap_creation_guest_usage (
        scope TEXT NOT NULL,
        window_start TIMESTAMPTZ NOT NULL,
        calls INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY(scope,window_start)
      )
    `).catch(e=>{
      initialized.delete(db);
      throw e;
    });
    initialized.set(db,ready);
  }
  await initialized.get(db);
}

export async function reserveCreationAccess(req,{
  db=pool,
  env=process.env,
  reserveSigned=reserveVerifiedCreation
}={}){
  // A supplied invalid bearer token must never become a guest.
  if(Object.hasOwn(req.headers||{},'authorization')){
    req._apCreationGuest=false;
    return reserveSigned(req);
  }

  if(env.AP_CREATION_GUEST_ENABLED!=='true')
    throw fail('CREATION_LOGIN_REQUIRED',401);

  if(!env.DATABASE_URL || typeof db?.connect!=='function')
    throw fail('CREATION_DATABASE_REQUIRED',503);

  const pepper=String(env.AP_CREATION_GUEST_PEPPER||'');

  if(pepper.length<32)
    throw fail('CREATION_GUEST_NOT_CONFIGURED',503);

  // Use only Express's configured IP, never a user-supplied
  // account ID, session ID or raw x-forwarded-for header.
  const ip=String(req.ip||'').trim();

  if(!ip || ip.length>150)
    throw fail('CREATION_GUEST_NETWORK_REQUIRED',403);

  const hash=createHmac('sha256',pepper)
    .update(ip).digest('hex');

  try{
    await ensureTable(db);
  }catch{
    throw fail('CREATION_DATABASE_UNAVAILABLE',503);
  }

  let client;

  try{
    client=await db.connect();
    await client.query('BEGIN');

    const policies=[
      [`lifetime:${hash}`,'lifetime',15],
      [`hour:${hash}`,'hour',15],
      [`day:${hash}`,'day',15],
      ['global:guest','day',60]
    ];

    for(const [scope,window,max] of policies){
      const period=window==='lifetime'
        ? "TIMESTAMPTZ '2000-01-01 00:00:00+00'"
        : `date_trunc('${window}',now())`;
      const result=await client.query(`
        INSERT INTO ap_creation_guest_usage(
          scope,window_start,calls
        )
        VALUES($1,${period},1)
        ON CONFLICT(scope,window_start)
        DO UPDATE SET
          calls=ap_creation_guest_usage.calls+1
        WHERE ap_creation_guest_usage.calls < $2
        RETURNING calls
      `,[scope,max]);

      if(!result.rows?.length)
        throw fail(
          window==='lifetime'
            ? 'CREATION_GUEST_SIGNIN_REQUIRED'
            : 'CREATION_GUEST_LIMIT',
          429
        );
    }

    await client.query('COMMIT');

  }catch(error){
    if(client){
      try{await client.query('ROLLBACK');}catch{}
    }
    if(error.status===429)throw error;
    throw fail('CREATION_DATABASE_UNAVAILABLE',503);
  }finally{
    client?.release();
  }

  // Every guest generation gets an ephemeral server-owned ID.
  // No browser-provided guest identity is trusted.
  const id='guest:'+randomUUID();

  req._apCreationGuest=true;
  req.user={id};

  return id;
}
