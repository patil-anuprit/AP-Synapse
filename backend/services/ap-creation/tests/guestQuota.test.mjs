import test from 'node:test';
import assert from 'node:assert/strict';
import {reserveCreationAccess} from '../guestQuota.mjs';

const env={
  AP_CREATION_GUEST_ENABLED:'true',
  DATABASE_URL:'staging',
  AP_CREATION_GUEST_PEPPER:'x'.repeat(64)
};

function mockDb(empty=false){
  const queries=[];
  const client={
    async query(sql,args){
      queries.push({sql,args});
      if(sql.includes('RETURNING calls'))
        return {rows:empty?[]:[{calls:1}]};
      return {rows:[]};
    },
    release(){}
  };
  return {
    queries,
    db:{
      async query(){return {rows:[]};},
      async connect(){return client;}
    }
  };
}

test('guests disabled unless enabled explicitly',async()=>{
  await assert.rejects(
    reserveCreationAccess(
      {headers:{},ip:'192.0.2.10'},
      {env:{...env,AP_CREATION_GUEST_ENABLED:'false'}}
    ),
    e=>e.status===401
  );
});

test('guest requires private server secret',async()=>{
  await assert.rejects(
    reserveCreationAccess(
      {headers:{},ip:'192.0.2.10'},
      {env:{...env,AP_CREATION_GUEST_PEPPER:''}}
    ),
    e=>e.status===503
  );
});

test('guest gets private ephemeral identity and quotas',async()=>{
  const {db,queries}=mockDb();
  const req={
    headers:{'x-session-id':'user-controlled'},
    ip:'192.0.2.10'
  };
  const id=await reserveCreationAccess(req,{db,env});

  assert.match(id,/^guest:[0-9a-f-]{36}$/i);
  assert.equal(req._apCreationGuest,true);
  assert.equal(req.user.id,id);
  assert.equal(
    queries.filter(q=>q.sql.includes('RETURNING calls')).length,
    3
  );
  assert.ok(queries.some(q=>q.sql==='COMMIT'));
});

test('quota exhaustion fails closed',async()=>{
  const {db,queries}=mockDb(true);
  await assert.rejects(
    reserveCreationAccess(
      {headers:{},ip:'192.0.2.10'},
      {db,env}
    ),
    e=>e.status===429
  );
  assert.ok(queries.some(q=>q.sql==='ROLLBACK'));
});

test('invalid bearer cannot bypass signed account verification',async()=>{
  const req={
    headers:{authorization:'Bearer invalid'},
    ip:'192.0.2.10'
  };
  await assert.rejects(
    reserveCreationAccess(req,{
      env,
      reserveSigned:async()=>{
        throw Object.assign(new Error('invalid'),{status:401});
      }
    }),
    e=>e.status===401
  );
  assert.notEqual(req._apCreationGuest,true);
});

test('signed-in accounts keep existing authentication',async()=>{
  const req={
    headers:{authorization:'Bearer valid'},
    ip:'192.0.2.10'
  };
  const id=await reserveCreationAccess(req,{
    env,
    reserveSigned:async()=> 'user:verified'
  });
  assert.equal(id,'user:verified');
  assert.equal(req._apCreationGuest,false);
});
