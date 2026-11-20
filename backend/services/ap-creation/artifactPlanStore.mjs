/*
 * AP Synapse: persistent creation plans.
 *
 * Stored on the existing Vault version row.
 * No separate Vault or frontend interface.
 *
 * IMPORTANT:
 * Only server code may supply accountId, after
 * verifying the authenticated request.
 */

const UUID =
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

const MAX_PLAN_BYTES = 256 * 1024;

function owner(value) {
  if (
    typeof value !== 'string' ||
    !/^user:[A-Za-z0-9_.:-]{1,200}$/.test(value)
  ) {
    throw new Error('VERIFIED_ACCOUNT_REQUIRED');
  }
  return value;
}

function version(value) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new Error('INVALID_ARTIFACT_VERSION');
  }
  return value;
}

function connection(db) {
  if (!db || typeof db.query !== 'function') {
    throw new Error('DATABASE_REQUIRED');
  }
  return db;
}

function serializePlan(plan) {
  if (
    !plan ||
    typeof plan !== 'object' ||
    Array.isArray(plan)
  ) {
    throw new Error('INVALID_CREATION_PLAN');
  }

  const json = JSON.stringify(plan);

  if (
    typeof json !== 'string' ||
    Buffer.byteLength(json, 'utf8') > MAX_PLAN_BYTES
  ) {
    throw new Error('CREATION_PLAN_TOO_LARGE');
  }

  return json;
}

/*
 * Run only as an explicit, reviewed database
 * migration. Never automatically on HTTP requests.
 */
export async function ensureArtifactPlanColumn({db} = {}) {
  const database = connection(db);

  await database.query(`
    ALTER TABLE ap_creation_vault_versions
    ADD COLUMN IF NOT EXISTS creation_plan JSONB
  `);

  const check = await database.query(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = $1
      AND column_name = $2
  `, [
    'ap_creation_vault_versions',
    'creation_plan'
  ]);

  if (check.rows[0]?.data_type !== 'jsonb') {
    throw new Error('ARTIFACT_PLAN_SCHEMA_MISMATCH');
  }

  return true;
}

export async function saveArtifactPlan({
  accountId,
  versionId,
  plan,
  db
} = {}) {
  const account = owner(accountId);
  const id = version(versionId);
  const json = serializePlan(plan);
  const database = connection(db);

  const result = await database.query(`
    UPDATE ap_creation_vault_versions
    SET creation_plan = $3::jsonb
    WHERE account_id = $1
      AND id = $2
      AND creation_plan IS NULL
    RETURNING id, root_id, kind, parent_version_id
  `, [account, id, json]);

  const row = result.rows[0];

  if (!row) {
    throw new Error(
      'ARTIFACT_VERSION_NOT_OWNED_OR_ALREADY_SAVED'
    );
  }

  return {
    versionId: row.id,
    rootId: row.root_id,
    kind: row.kind,
    parentVersionId: row.parent_version_id
  };
}

export async function loadArtifactPlan({
  accountId,
  versionId,
  db
} = {}) {
  const account = owner(accountId);
  const id = version(versionId);
  const database = connection(db);

  const result = await database.query(`
    SELECT id, root_id, kind, parent_version_id,
           creation_plan
    FROM ap_creation_vault_versions
    WHERE account_id = $1
      AND id = $2
      AND creation_plan IS NOT NULL
    LIMIT 1
  `, [account, id]);

  const row = result.rows[0];

  if (!row) return null;

  return {
    versionId: row.id,
    rootId: row.root_id,
    kind: row.kind,
    parentVersionId: row.parent_version_id,
    plan: row.creation_plan
  };
}

export async function loadLatestArtifactPlan({
  accountId,
  kind,
  db
} = {}) {
  const account = owner(accountId);
  const database = connection(db);

  if (
    kind !== undefined &&
    !['pdf','docx','slides','xlsx','image'].includes(kind)
  ) {
    throw new Error('INVALID_ARTIFACT_KIND');
  }

  const parameters = [account];

  let condition = '';

  if (kind) {
    parameters.push(kind);
    condition = ' AND kind = $2';
  }

  const result = await database.query(`
    SELECT id, root_id, kind, parent_version_id,
           creation_plan
    FROM ap_creation_vault_versions
    WHERE account_id = $1
      AND creation_plan IS NOT NULL
      ${condition}
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `, parameters);

  const row = result.rows[0];

  if (!row) return null;

  return {
    versionId: row.id,
    rootId: row.root_id,
    kind: row.kind,
    parentVersionId: row.parent_version_id,
    plan: row.creation_plan
  };
}
