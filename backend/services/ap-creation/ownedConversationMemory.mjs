import {pool} from '../../database/db.js';

const initialized=new WeakMap();
const MAX_TEXT=8000;
const MAX_ROWS=1000;
const RETENTION_DAYS=180;

function verifiedOwner(accountId){
  if(typeof accountId!=='string' ||
     !/^user:[A-Za-z0-9_.:-]{1,200}$/.test(accountId)){
    throw new Error('VERIFIED_ACCOUNT_REQUIRED');
  }
  return accountId;
}

async function schema(db){
  let pending=initialized.get(db);

  if(!pending){
    pending=(async()=>{
      await db.query(`
        CREATE TABLE IF NOT EXISTS
        ap_creation_owned_chat (
          id BIGSERIAL PRIMARY KEY,
          account_id TEXT NOT NULL,
          session_id TEXT NOT NULL DEFAULT '',
          role TEXT NOT NULL
            CHECK(role IN ('user','assistant')),
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL
            DEFAULT (NOW()+INTERVAL '180 days')
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS
        ap_creation_owned_chat_owner_time
        ON ap_creation_owned_chat(account_id,id DESC)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS
        ap_creation_owned_chat_search
        ON ap_creation_owned_chat
        USING GIN(to_tsvector('simple',content))
      `);
    })().catch(error=>{
      initialized.delete(db);
      throw error;
    });

    initialized.set(db,pending);
  }

  await pending;
}

export async function recordOwnedConversationTurn({
  accountId,sessionId='',role='user',
  content,db=pool
}={}){
  const owner=verifiedOwner(accountId);

  if(!['user','assistant'].includes(role))
    throw new Error('INVALID_CONVERSATION_ROLE');

  if(typeof content!=='string'||!content.trim())
    return null;

  const text=content.trim().slice(0,MAX_TEXT);
  const session=String(sessionId).slice(0,150);

  await schema(db);

  const client=await db.connect();

  try{
    await client.query('BEGIN');

    // Serialize writes and account-size pruning.
    await client.query(
      'SELECT pg_advisory_xact_lock(hashtext($1)::bigint)',
      [owner]
    );

    await client.query(
      `DELETE FROM ap_creation_owned_chat
       WHERE account_id=$1 AND expires_at<=NOW()`,
      [owner]
    );

    const result=await client.query(
      `INSERT INTO ap_creation_owned_chat
       (account_id,session_id,role,content)
       VALUES($1,$2,$3,$4)
       RETURNING id`,
      [owner,session,role,text]
    );

    await client.query(
      `DELETE FROM ap_creation_owned_chat
       WHERE account_id=$1 AND id NOT IN (
         SELECT id FROM ap_creation_owned_chat
         WHERE account_id=$1
         ORDER BY id DESC LIMIT ${MAX_ROWS}
       )`,
      [owner]
    );

    await client.query('COMMIT');
    return result.rows[0].id;
  }catch(error){
    try{await client.query('ROLLBACK');}catch{}
    throw error;
  }finally{
    client.release();
  }
}

const STOPWORDS=new Set([
  'create','make','generate','from','with',
  'the','and','our','that','this','previous',
  'conversation','history','about','please',
  'using','document','presentation','slides',
  'pdf','xlsx','word','file','files','into'
]);

export async function findOwnedConversationContext({
  accountId,query='',db=pool
}={}){
  const owner=verifiedOwner(accountId);
  await schema(db);

  const terms=[
    ...new Set(
      (String(query).toLowerCase()
        .match(/[a-z0-9]{3,}/g)||[])
        .filter(word=>!STOPWORDS.has(word))
    )
  ].slice(0,8);

  let rows=[];

  if(terms.length){
    const expression=terms.join(' | ');

    const result=await db.query(
      `SELECT id,role,content
       FROM ap_creation_owned_chat
       WHERE account_id=$1
         AND expires_at>NOW()
         AND to_tsvector('simple',content)
             @@ to_tsquery('simple',$2)
       ORDER BY
         ts_rank(
           to_tsvector('simple',content),
           to_tsquery('simple',$2)
         ) DESC,
         id DESC
       LIMIT 12`,
      [owner,expression]
    );

    rows=result.rows;
  }

  // Recent fallback when keyword retrieval has no matches.
  if(!rows.length && !terms.length){
    const result=await db.query(
      `SELECT id,role,content
       FROM ap_creation_owned_chat
       WHERE account_id=$1 AND expires_at>NOW()
       ORDER BY id DESC
       LIMIT 6`,
      [owner]
    );

    rows=result.rows;
  }

  let used=0;
  const selected=[];

  for(const row of rows){
    const available=6500-used;
    if(available<=0)break;

    const content=String(row.content||'')
      .slice(0,Math.min(1500,available));

    if(!content)continue;

    selected.push({
      id:Number(row.id),
      role:row.role,
      content
    });

    used+=content.length;
  }

  return selected
    .sort((a,b)=>a.id-b.id)
    .map(({role,content})=>({role,content}));
}

export async function deleteOwnedConversationHistory({
  accountId,db=pool
}={}){
  const owner=verifiedOwner(accountId);
  await schema(db);

  const result=await db.query(
    `DELETE FROM ap_creation_owned_chat
     WHERE account_id=$1`,
    [owner]
  );

  return {deleted:result.rowCount};
}

export const OWNED_MEMORY_LIMITS=Object.freeze({
  maxText:MAX_TEXT,
  maxRows:MAX_ROWS,
  retentionDays:RETENTION_DAYS
});
