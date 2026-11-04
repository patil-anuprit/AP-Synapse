import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedCreationUser,reserveVerifiedCreation} from '../authQuota.mjs';
const good = ()=>({authenticated:true,identityId:'user:abc',googleId:'abc'});
const req = ()=>({headers:{authorization:'Bearer valid.mock.token'},user:null});
test('rejects unsigned/guest requests',()=>{
  assert.throws(()=>verifiedCreationUser({headers:{}},good),{message:'CREATION_LOGIN_REQUIRED'});
  assert.throws(()=>verifiedCreationUser(req(),()=>({authenticated:false,googleId:'abc',identityId:'user:abc'})),{message:'CREATION_LOGIN_REQUIRED'});
});
test('rejects forged account IDs',()=>{
  assert.throws(()=>verifiedCreationUser(req(),()=>({authenticated:true,googleId:'abc',identityId:'user:other'})),{message:'CREATION_LOGIN_REQUIRED'});
});
test('accepts only verified signed account identity',()=>{
  assert.equal(verifiedCreationUser(req(),good),'user:abc');
});
test('no quota reservation when database missing',async()=>{
  const saved=process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  await assert.rejects(reserveVerifiedCreation(req(),{resolve:good,db:{query:async()=>({rows:[{}]})}}),{message:'CREATION_DATABASE_REQUIRED'});
  if(saved===undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL=saved;
});

test('denies over-quota requests using atomic database result',async()=>{
  const saved=process.env.DATABASE_URL;
  process.env.DATABASE_URL='postgres://mock-host/db';
  let count=0;
  const db={query:async sql=>{
    if(sql.includes('CREATE TABLE'))return {rows:[]};
    count++;return {rows:count===1?[{requests:1}]:[]};
  }};
  await reserveVerifiedCreation(req(),{resolve:good,db});
  await assert.rejects(reserveVerifiedCreation(req(),{resolve:good,db}),{message:'CREATION_HOURLY_LIMIT'});
  if(saved===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=saved;
});
