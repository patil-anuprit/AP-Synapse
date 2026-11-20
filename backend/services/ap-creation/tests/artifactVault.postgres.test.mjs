import test from 'node:test';
import assert from 'node:assert/strict';
import {Pool} from 'pg';
import express from 'express';
import {createServer} from 'node:http';

import {
  saveArtifact,
  listArtifacts,
  loadArtifact,
  deleteArtifact
} from '../artifactVault.mjs';

import {createArtifactVaultRouter} from '../artifactVaultRoutes.mjs';

const uri=process.env.AP_VAULT_TEST_DATABASE_URL;

const pdf=(content)=>Buffer.from(
  `%PDF-1.4\n${content}\n%%EOF`
);

function isStatus(code){
  return error=>error?.status===code;
}

test('real PostgreSQL vault storage, identity, versions and quotas',{
  skip:!uri
},async t=>{
  // Never allow this test to use a cloud or production database.
  const target=new URL(uri);

  assert.equal(target.hostname,'127.0.0.1');
  assert.equal(target.pathname,'/ap_vault_disposable');

  const db=new Pool({
    connectionString:uri,
    max:8,
    connectionTimeoutMillis:5000
  });

  t.after(async()=>{await db.end();});

  await db.query('SELECT 1');

  console.log('PASS: Connected to disposable PostgreSQL.');

  const firstBytes=pdf('Private report version one');
  const secondBytes=pdf('Private report version two');

  const first=await saveArtifact({
    accountId:'user:accountA',
    sessionId:'session-001',
    kind:'pdf',
    mimeType:'application/pdf',
    fileName:'private-report-v1.pdf',
    userMessage:'Create my report',
    buffer:firstBytes,
    db
  });

  assert.ok(first.id);
  assert.equal(first.rootId,first.id);

  const second=await saveArtifact({
    accountId:'user:accountA',
    sessionId:'session-002',
    rootId:first.rootId,
    kind:'pdf',
    mimeType:'application/pdf',
    fileName:'private-report-v2.pdf',
    userMessage:'Revise my report',
    buffer:secondBytes,
    db
  });

  assert.equal(second.rootId,first.rootId);
  assert.notEqual(second.id,first.id);

  console.log('PASS: File saved with two separate versions.');

  const own=await listArtifacts({
    accountId:'user:accountA',db
  });

  const other=await listArtifacts({
    accountId:'user:accountB',db
  });

  assert.equal(own.length,2);
  assert.equal(other.length,0);

  await assert.rejects(
    loadArtifact({
      accountId:'user:accountB',
      id:first.id,db
    }),
    isStatus(404)
  );

  await assert.rejects(
    saveArtifact({
      accountId:'user:accountB',
      rootId:first.rootId,
      kind:'pdf',
      mimeType:'application/pdf',
      fileName:'stolen-version.pdf',
      buffer:pdf('Attempted unauthorized revision'),
      db
    }),
    isStatus(404)
  );

  console.log('PASS: Cross-account read and revision blocked.');

  const reopenedPool=new Pool({
    connectionString:uri,
    max:2
  });

  try{
    const recovered=await loadArtifact({
      accountId:'user:accountA',
      id:second.id,
      db:reopenedPool
    });

    assert.deepEqual(recovered.buffer,secondBytes);
  }finally{
    await reopenedPool.end();
  }

  console.log('PASS: File recovered through a new DB connection.');

  const app=express();

  app.use('/ap/artifacts',createArtifactVaultRouter({
    enabled:()=>true,
    verify(req){
      const token=req.get('authorization');

      if(token==='Bearer accountA')return 'user:accountA';
      if(token==='Bearer accountB')return 'user:accountB';

      throw Object.assign(
        new Error('CREATION_LOGIN_REQUIRED'),
        {status:401}
      );
    },
    store:{
      listArtifacts:({accountId})=>listArtifacts({accountId,db}),
      loadArtifact:({accountId,id})=>loadArtifact({accountId,id,db}),
      deleteArtifact:({accountId,id})=>deleteArtifact({accountId,id,db})
    }
  }));

  const server=createServer(app);

  await new Promise(resolve=>
    server.listen(0,'127.0.0.1',resolve)
  );

  t.after(async()=>{
    server.closeAllConnections?.();
    await new Promise(resolve=>server.close(resolve));
  });

  const base=`http://127.0.0.1:${server.address().port}/ap/artifacts`;

  const request=(path,token,method='GET')=>fetch(
    base+path,{
      method,
      headers:token?{authorization:`Bearer ${token}`}:{}
    }
  );

  const guest=await request('/');
  assert.equal(guest.status,401);

  const forbidden=await request('/'+second.id,'accountB');
  assert.equal(forbidden.status,404);

  const download=await request('/'+second.id,'accountA');
  assert.equal(download.status,200);

  assert.deepEqual(
    Buffer.from(await download.arrayBuffer()),
    secondBytes
  );

  const wrongDelete=await request(
    '/'+second.id,'accountB','DELETE'
  );

  assert.equal(wrongDelete.status,404);

  console.log('PASS: Real HTTP private download and ownership.');

  const deleted=await request(
    '/'+first.id,'accountA','DELETE'
  );

  assert.equal(deleted.status,204);

  const remaining=await listArtifacts({
    accountId:'user:accountA',db
  });

  assert.equal(remaining.length,1);

  const usage=await db.query(
    `SELECT used_bytes
     FROM ap_creation_vault_usage
     WHERE account_id=$1`,
    ['user:accountA']
  );

  assert.equal(
    Number(usage.rows[0].used_bytes),
    secondBytes.length
  );

  console.log('PASS: Deletion correctly reclaims usage.');

  // Simulate a full account without inserting 64 MB of files.
  const CAP=64*1024*1024;

  await db.query(
    `INSERT INTO ap_creation_vault_usage(account_id,used_bytes)
     VALUES($1,$2)`,
    ['user:quota',CAP-2]
  );

  await assert.rejects(
    saveArtifact({
      accountId:'user:quota',
      kind:'pdf',
      mimeType:'application/pdf',
      fileName:'too-much.pdf',
      buffer:pdf('quota test'),
      db
    }),
    isStatus(507)
  );

  console.log('PASS: Storage limit enforced.');

  // Both writes contend for the last four bytes.
  await db.query(
    `INSERT INTO ap_creation_vault_usage(account_id,used_bytes)
     VALUES($1,$2)`,
    ['user:parallel',CAP-4]
  );

  const attempts=await Promise.allSettled([
    saveArtifact({
      accountId:'user:parallel',
      kind:'pdf',
      mimeType:'application/pdf',
      fileName:'first.pdf',
      buffer:Buffer.from('abc'),
      db
    }),
    saveArtifact({
      accountId:'user:parallel',
      kind:'pdf',
      mimeType:'application/pdf',
      fileName:'second.pdf',
      buffer:Buffer.from('xyz'),
      db
    })
  ]);

  assert.equal(
    attempts.filter(x=>x.status==='fulfilled').length,1
  );

  assert.equal(
    attempts.filter(x=>x.status==='rejected').length,1
  );

  const parallelUsage=await db.query(
    `SELECT used_bytes FROM ap_creation_vault_usage
     WHERE account_id=$1`,
    ['user:parallel']
  );

  assert.equal(
    Number(parallelUsage.rows[0].used_bytes),CAP-1
  );

  console.log('PASS: Concurrent writes cannot exceed quota.');
  console.log('RESULT: REAL POSTGRESQL VAULT TEST PASSED');
});
