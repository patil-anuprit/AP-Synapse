const ready = new WeakMap();

function verifiedAccount(id) {
  if (typeof id !== 'string' ||
      !/^user:[A-Za-z0-9_.:-]{1,200}$/.test(id)) {
    throw Object.assign(
      new Error('VERIFIED_ACCOUNT_REQUIRED'),
      {status:401}
    );
  }
  return id;
}

async function database(db) {
  if (db) return db;
  const {pool} = await import('../../database/db.js');
  return pool;
}

async function ensureSchema(db) {
  let pending = ready.get(db);

  if (!pending) {
    pending = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS
        ap_creation_verified_context (
          id BIGSERIAL PRIMARY KEY,
          account_id TEXT NOT NULL,
          session_id TEXT NOT NULL DEFAULT '',
          request_text TEXT NOT NULL,
          artifact_description TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await db.query(`
        CREATE INDEX IF NOT EXISTS
        idx_ap_creation_verified_context_account
        ON ap_creation_verified_context
        (account_id, id DESC)
      `);
    })();

    ready.set(db, pending);
    pending.catch(() => {
      if (ready.get(db) === pending) ready.delete(db);
    });
  }

  await pending;
}

export async function loadVerifiedArtifactHistory({
  accountId, db
}) {
  const account = verifiedAccount(accountId);
  const connection = await database(db);
  await ensureSchema(connection);

  const result = await connection.query(`
    SELECT request_text, artifact_description
    FROM ap_creation_verified_context
    WHERE account_id = $1
    ORDER BY id DESC
    LIMIT 9
  `, [account]);

  return (result.rows || []).reverse().flatMap(row => [
    {role:'user', content:String(row.request_text || '')},
    {role:'assistant', content:String(row.artifact_description || '')}
  ]);
}

export async function recordVerifiedArtifact({
  accountId, sessionId = '', userMessage = '',
  artifact = '', db
}) {
  const account = verifiedAccount(accountId);
  const connection = await database(db);
  await ensureSchema(connection);

  await connection.query(`
    INSERT INTO ap_creation_verified_context
    (account_id, session_id, request_text, artifact_description)
    VALUES ($1, $2, $3, $4)
  `, [
    account,
    String(sessionId).slice(0,150),
    String(userMessage).slice(0,2000),
    String(artifact).slice(0,250)
  ]);
}
