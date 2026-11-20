import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';

import {
  ensureArtifactPlanColumn,
  saveArtifactPlan,
  loadArtifactPlan,
  loadLatestArtifactPlan
} from '../artifactPlanStore.mjs';

test('rejects unverified owners and invalid versions',async()=>{
  await assert.rejects(
    loadArtifactPlan({
      accountId:'guest',
      versionId:randomUUID()
    }),
    /VERIFIED_ACCOUNT_REQUIRED/
  );

  await assert.rejects(
    loadArtifactPlan({
      accountId:'user:testA',
      versionId:'not-a-uuid'
    }),
    /INVALID_ARTIFACT_VERSION/
  );
});

test('existing Vault stores private editable plans',{
  skip:!process.env.AP_PLAN_DB_TEST_URL
},async t=>{
  const url=new URL(process.env.AP_PLAN_DB_TEST_URL);

  assert.equal(url.hostname,'127.0.0.1');
  assert.equal(url.pathname,'/ap_memory_disposable');

  const db=new Pool({
    connectionString:url.toString(),
    max:4
  });

  t.after(()=>db.end());

  // Minimal disposable mirror of Vault version identity.
  await db.query(`
    CREATE TABLE ap_creation_vault_versions (
      id UUID PRIMARY KEY,
      root_id UUID NOT NULL,
      account_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      parent_version_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await ensureArtifactPlanColumn({db});

  const a=randomUUID();
  const b=randomUUID();

  await db.query(`
    INSERT INTO ap_creation_vault_versions
    (id,root_id,account_id,kind)
    VALUES
    ($1,$1,'user:testA','slides'),
    ($2,$2,'user:testB','slides')
  `,[a,b]);

  const originalPlan={
    title:'Cedar Project',
    slides:[
      {title:'Budget',budget:4500},
      {title:'Milestones',count:4}
    ]
  };

  const saved=await saveArtifactPlan({
    accountId:'user:testA',
    versionId:a,
    plan:originalPlan,
    db
  });

  assert.equal(saved.versionId,a);

  const owned=await loadArtifactPlan({
    accountId:'user:testA',
    versionId:a,
    db
  });

  assert.deepEqual(owned.plan,originalPlan);

  const forbidden=await loadArtifactPlan({
    accountId:'user:testB',
    versionId:a,
    db
  });

  assert.equal(forbidden,null);

  const recent=await loadLatestArtifactPlan({
    accountId:'user:testA',
    kind:'slides',
    db
  });

  assert.equal(recent.versionId,a);

  await assert.rejects(
    saveArtifactPlan({
      accountId:'user:testA',
      versionId:a,
      plan:{title:'Overwrite original'},
      db
    }),
    /ALREADY_SAVED/
  );

  await db.query(`
    DELETE FROM ap_creation_vault_versions
    WHERE account_id=$1 AND id=$2
  `,['user:testA',a]);

  assert.equal(
    await loadArtifactPlan({
      accountId:'user:testA',
      versionId:a,
      db
    }),
    null
  );

  console.log('PASS: Original creation plan persisted.');
  console.log('PASS: Version ownership enforced.');
  console.log('PASS: Cross-account reading blocked.');
  console.log('PASS: Original version cannot be overwritten.');
  console.log('PASS: Plan removed with deleted artifact.');
});
