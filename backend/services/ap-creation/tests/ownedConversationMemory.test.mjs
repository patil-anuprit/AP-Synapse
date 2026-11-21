import test from 'node:test';
import assert from 'node:assert/strict';
import {Pool} from 'pg';

import {
  recordOwnedConversationTurn,
  findOwnedConversationContext,
  deleteOwnedConversationHistory
} from '../ownedConversationMemory.mjs';

const url=process.env.AP_CREATION_MEMORY_TEST_URL;

test('requires verified account identity',async()=>{
  await assert.rejects(
    recordOwnedConversationTurn({
      accountId:'guest',
      content:'private message'
    }),
    /VERIFIED_ACCOUNT_REQUIRED/
  );

  await assert.rejects(
    findOwnedConversationContext({
      accountId:'session-123',
      query:'private'
    }),
    /VERIFIED_ACCOUNT_REQUIRED/
  );
});

test('real PostgreSQL chat memory isolation and deletion',{
  skip:!url
},async t=>{
  const target=new URL(url);

  assert.equal(target.hostname,'127.0.0.1');
  assert.equal(
    target.pathname,'/ap_memory_disposable'
  );

  const db=new Pool({
    connectionString:url,
    max:5,
    connectionTimeoutMillis:5000
  });

  t.after(()=>db.end());

  await recordOwnedConversationTurn({
    accountId:'user:accountA',
    sessionId:'first-chat',
    content:'Kestrel initiative budget is 2400 rupees',
    db
  });

  await recordOwnedConversationTurn({
    accountId:'user:accountA',
    sessionId:'second-chat',
    content:'Kestrel launch includes four milestones',
    db
  });

  await recordOwnedConversationTurn({
    accountId:'user:accountB',
    sessionId:'first-chat',
    content:'Kestrel confidential account B message',
    db
  });

  const a=await findOwnedConversationContext({
    accountId:'user:accountA',
    query:'Create a Kestrel project report',
    db
  });

  assert.equal(a.length,2);
  assert.ok(
    a.some(item=>item.content.includes('2400'))
  );
  assert.ok(
    a.some(item=>item.content.includes('milestones'))
  );
  assert.ok(
    a.every(item=>!item.content.includes('account B'))
  );

  const b=await findOwnedConversationContext({
    accountId:'user:accountB',
    query:'Kestrel',
    db
  });

  assert.equal(b.length,1);
  assert.match(b[0].content,/account B/);

  await deleteOwnedConversationHistory({
    accountId:'user:accountA',db
  });

  const empty=await findOwnedConversationContext({
    accountId:'user:accountA',
    query:'Kestrel',db
  });

  assert.equal(empty.length,0);

  const retained=await findOwnedConversationContext({
    accountId:'user:accountB',
    query:'Kestrel',db
  });

  assert.equal(retained.length,1);

  console.log(
    'PASS: Account-owned cross-session context.'
  );
  console.log(
    'PASS: Cross-account privacy preserved.'
  );
  console.log(
    'PASS: Account deletion isolated.'
  );
});
