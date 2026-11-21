import test from 'node:test';
import assert from 'node:assert/strict';
import {Pool} from 'pg';

import {saveArtifact} from '../artifactVault.mjs';

import {
  ensureArtifactPlanColumn,
  loadArtifactPlan,
  loadLatestArtifactPlan
} from '../artifactPlanStore.mjs';

test('atomic Vault file and editable plan',{
  skip:!process.env.AP_ATOMIC_PLAN_TEST_URL
},async t=>{
  const url=new URL(process.env.AP_ATOMIC_PLAN_TEST_URL);

  assert.equal(url.hostname,'127.0.0.1');
  assert.equal(url.pathname,'/ap_memory_disposable');

  const db=new Pool({
    connectionString:url.toString(),
    max:5,
    connectionTimeoutMillis:5000
  });

  t.after(()=>db.end());

  const account='user:atomicA';

  const base={
    accountId:account,
    sessionId:'conversation-one',
    kind:'pdf',
    mimeType:'application/pdf',
    fileName:'cedar.pdf',
    userMessage:'Create Cedar report',
    buffer:Buffer.from(
      '%PDF-1.4\n1 0 obj <<>> endobj\n%%EOF\n'
    ),
    db
  };

  // Original behavior must work before migration.
  const original=await saveArtifact(base);

  assert.ok(original.id);
  assert.ok(original.rootId);

  console.log('PASS: Original Vault without plan column.');

  // This migration touches the disposable test DB only.
  await ensureArtifactPlanColumn({db});

  const plan={
    title:'Cedar Revised Report',
    sections:[
      {heading:'Budget',text:'INR 4500'},
      {heading:'Timeline',text:'Four milestones'}
    ]
  };

  const revised=await saveArtifact({
    ...base,
    sessionId:'conversation-two',
    rootId:original.rootId,
    fileName:'cedar-revised.pdf',
    userMessage:'Revise previous report',
    creationPlan:plan
  });

  assert.notEqual(revised.id,original.id);
  assert.equal(revised.rootId,original.rootId);

  const raw=await db.query(`
    SELECT account_id, root_id,
           parent_version_id,
           creation_plan
    FROM ap_creation_vault_versions
    WHERE id=$1
  `,[revised.id]);

  assert.equal(raw.rows.length,1);
  assert.equal(raw.rows[0].account_id,account);
  assert.equal(raw.rows[0].root_id,original.rootId);
  assert.equal(raw.rows[0].parent_version_id,original.id);
  assert.deepEqual(raw.rows[0].creation_plan,plan);

  console.log('PASS: File and plan saved in same INSERT.');
  console.log('PASS: Parent version linked correctly.');

  const loaded=await loadArtifactPlan({
    accountId:account,
    versionId:revised.id,
    db
  });

  assert.ok(loaded);
  assert.deepEqual(loaded.plan,plan);

  const forbidden=await loadArtifactPlan({
    accountId:'user:anotherAccount',
    versionId:revised.id,
    db
  });

  assert.equal(forbidden,null);

  const latest=await loadLatestArtifactPlan({
    accountId:account,
    kind:'pdf',
    db
  });

  assert.equal(latest.versionId,revised.id);

  console.log('PASS: Cross-account access blocked.');

  // Force an actual SQL INSERT error to test rollback.
  await db.query(`
    ALTER TABLE ap_creation_vault_versions
    ADD CONSTRAINT ap_test_reject_plan
    CHECK (
      (creation_plan->>'title')
      IS DISTINCT FROM 'BLOCK_THIS_INSERT'
    )
  `);

  const before=await db.query(`
    SELECT COUNT(*)::int AS total
    FROM ap_creation_vault_versions
    WHERE account_id=$1
  `,[account]);

  await assert.rejects(
    saveArtifact({
      ...base,
      rootId:original.rootId,
      creationPlan:{
        title:'BLOCK_THIS_INSERT'
      }
    }),
    error=>error?.code==='23514'
  );

  const after=await db.query(`
    SELECT COUNT(*)::int AS total
    FROM ap_creation_vault_versions
    WHERE account_id=$1
  `,[account]);

  assert.equal(
    after.rows[0].total,
    before.rows[0].total
  );

  console.log('PASS: Failed transaction rolled back.');
});
