import {randomUUID, createHash} from 'node:crypto';

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_ACCOUNT_BYTES = 64 * 1024 * 1024;
const ready = new WeakMap();

const MIME = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  slides: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  image: ['image/png', 'image/jpeg', 'image/webp']
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function failure(code, status = 400) {
  return Object.assign(new Error(code), {status});
}

function ownerId(value) {
  if (typeof value !== 'string' ||
      !/^user:[A-Za-z0-9_.:-]{1,200}$/.test(value)) {
    throw failure('VERIFIED_OWNER_REQUIRED', 401);
  }
  return value;
}

function checkedUuid(value) {
  if (typeof value !== 'string' || !UUID.test(value))
    throw failure('INVALID_ARTIFACT_ID');
  return value;
}

async function connection(db) {
  if (db) return db;
  const {pool} = await import('../../database/db.js');
  return pool;
}

async function schema(db) {
  let pending = ready.get(db);

  if (!pending) {
    pending = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS ap_creation_vault_usage (
          account_id TEXT PRIMARY KEY,
          used_bytes BIGINT NOT NULL DEFAULT 0
            CHECK (used_bytes >= 0)
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS ap_creation_vault_versions (
          id UUID PRIMARY KEY,
          root_id UUID NOT NULL,
          account_id TEXT NOT NULL,
          parent_version_id UUID,
          session_id TEXT NOT NULL DEFAULT '',
          kind TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          file_name TEXT NOT NULL,
          request_text TEXT NOT NULL DEFAULT '',
          size_bytes INTEGER NOT NULL
            CHECK (size_bytes > 0 AND size_bytes <= 4194304),
          sha256 TEXT NOT NULL,
          file_data BYTEA NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS
          idx_ap_creation_vault_owner_root
        ON ap_creation_vault_versions
          (account_id, root_id, created_at DESC)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS
          idx_ap_creation_vault_owner_time
        ON ap_creation_vault_versions
          (account_id, created_at DESC)
      `);
    })().catch(error => {
      ready.delete(db);
      throw error;
    });

    ready.set(db, pending);
  }

  await pending;
}

export async function saveArtifact({
  accountId, sessionId = '', kind, mimeType, fileName,
  userMessage = '', buffer, rootId = null,
    creationPlan = null, db
} = {}) {
  const account = ownerId(accountId);

    // AP_CREATION_ATOMIC_PLAN_V4
    // Validate the editable plan before any Vault transaction.
    // Null preserves compatibility with the original schema.
    let creationPlanJson = null;

    if (creationPlan !== null) {
      if (!creationPlan ||
          typeof creationPlan !== 'object' ||
          Array.isArray(creationPlan)) {
        throw failure('INVALID_CREATION_PLAN', 400);
      }

      try {
        creationPlanJson = JSON.stringify(creationPlan);
      } catch {
        throw failure('INVALID_CREATION_PLAN', 400);
      }

      if (!creationPlanJson ||
          Buffer.byteLength(creationPlanJson, 'utf8') > 262144) {
        throw failure('CREATION_PLAN_TOO_LARGE', 413);
      }
    }


  if (!Object.hasOwn(MIME, kind) ||
      !MIME[kind].includes(mimeType))
    throw failure('UNSUPPORTED_ARTIFACT_TYPE');

  if (!Buffer.isBuffer(buffer) ||
      buffer.length === 0 ||
      buffer.length > MAX_FILE_BYTES)
    throw failure('ARTIFACT_SIZE_NOT_SUPPORTED', 413);

  if (rootId !== null) checkedUuid(rootId);

  const cleanName = String(fileName ?? 'artifact')
    .replace(/[\\/\r\n\x00-\x1f\x7f]/g, '_')
    .slice(0,120) || 'artifact';

  const id = randomUUID();
  const root = rootId || id;

  const checksum = createHash('sha256')
    .update(buffer).digest('hex');

  const pool = await connection(db);
  await schema(pool);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let parentId = null;

    if (rootId) {
      const owned = await client.query(
        `SELECT id FROM ap_creation_vault_versions
         WHERE account_id=$1 AND root_id=$2
         ORDER BY created_at DESC, id DESC LIMIT 1`,
        [account, root]
      );

      if (!owned.rows.length)
        throw failure('ARTIFACT_NOT_FOUND', 404);

      parentId = owned.rows[0].id;
    }

    await client.query(
      `INSERT INTO ap_creation_vault_usage
        (account_id, used_bytes)
       VALUES($1,0) ON CONFLICT DO NOTHING`,
      [account]
    );

    const reservation = await client.query(
      `UPDATE ap_creation_vault_usage
       SET used_bytes = used_bytes + $2
       WHERE account_id=$1 AND used_bytes + $2 <= $3
       RETURNING used_bytes`,
      [account, buffer.length, MAX_ACCOUNT_BYTES]
    );

    if (!reservation.rows.length)
      throw failure('ARTIFACT_STORAGE_QUOTA', 507);

    await client.query(
      `INSERT INTO ap_creation_vault_versions
       (id,root_id,account_id,parent_version_id,
        session_id,kind,mime_type,file_name,request_text,
        size_bytes,sha256,file_data${creationPlanJson === null ? '' : ',creation_plan'})
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12${creationPlanJson === null ? '' : ',$13::jsonb'})`,
      [
        id, root, account, parentId,
        String(sessionId).slice(0,150),
        kind, mimeType, cleanName,
        String(userMessage).slice(0,2000),
        buffer.length, checksum, buffer,
          ...(creationPlanJson === null ? [] : [creationPlanJson])
      ]
    );

    await client.query('COMMIT');

    return {
      id, rootId:root, kind, mimeType,
      fileName:cleanName, bytes:buffer.length,
      sha256:checksum
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    throw error;
  } finally {
    client.release();
  }
}

export async function listArtifacts({accountId, db} = {}) {
  const account = ownerId(accountId);
  const pool = await connection(db);

  await schema(pool);

  const result = await pool.query(
    `SELECT id, root_id, kind, mime_type, file_name,
      size_bytes, sha256, created_at
     FROM ap_creation_vault_versions
     WHERE account_id=$1
     ORDER BY created_at DESC, id DESC
     LIMIT 50`,
    [account]
  );

  return result.rows || [];
}

export async function loadArtifact({accountId, id, db} = {}) {
  const account = ownerId(accountId);
  checkedUuid(id);

  const pool = await connection(db);
  await schema(pool);

  const result = await pool.query(
    `SELECT id, root_id, kind, mime_type, file_name,
      size_bytes, sha256, file_data
     FROM ap_creation_vault_versions
     WHERE id=$1 AND account_id=$2
     LIMIT 1`,
    [id, account]
  );

  const row = result.rows?.[0];

  if (!row)
    throw failure('ARTIFACT_NOT_FOUND', 404);

  return {
    id:row.id,
    rootId:row.root_id,
    mimeType:row.mime_type,
    fileName:row.file_name,
    bytes:row.size_bytes,
    buffer:Buffer.from(row.file_data)
  };
}

export async function deleteArtifact({accountId, id, db} = {}) {
  const account = ownerId(accountId);
  checkedUuid(id);

  const pool = await connection(db);
  await schema(pool);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const removed = await client.query(
      `DELETE FROM ap_creation_vault_versions
       WHERE id=$1 AND account_id=$2
       RETURNING size_bytes`,
      [id, account]
    );

    if (!removed.rows.length)
      throw failure('ARTIFACT_NOT_FOUND', 404);

    await client.query(
      `UPDATE ap_creation_vault_usage
       SET used_bytes=GREATEST(0,used_bytes-$2)
       WHERE account_id=$1`,
      [account, Number(removed.rows[0].size_bytes)]
    );

    await client.query('COMMIT');

    return {deleted:true};
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    throw error;
  } finally {
    client.release();
  }
}
