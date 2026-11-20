import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  saveCompletedAssistantReply
} from '../completedReplyMemory.mjs';

test('assistant memory is disabled by default',async()=>{
  let writes=0;

  const result=await saveCompletedAssistantReply({
    text:'Private assistant reply',
    verifiedOwner:()=> 'user:A',
    record:async()=>{writes++;}
  });

  assert.equal(result.stored,false);
  assert.equal(writes,0);
});

test('only a verified account receives assistant reply',async()=>{
  const saved=[];

  const result=await saveCompletedAssistantReply({
    enabled:true,
    req:{get:()=> 'session-one'},
    text:'Project budget confirmed at INR 4500',
    verifiedOwner:()=> 'user:accountA',
    record:async value=>saved.push(value)
  });

  assert.equal(result.stored,true);

  assert.deepEqual(saved,[{
    accountId:'user:accountA',
    sessionId:'session-one',
    role:'assistant',
    content:'Project budget confirmed at INR 4500'
  }]);
});

test('unsigned and invalid identities cannot store replies',async()=>{
  let writes=0;

  for(const verifiedOwner of [
    ()=>{throw new Error('Unauthorized');},
    ()=> 'guest',
    ()=> ''
  ]){
    const result=await saveCompletedAssistantReply({
      enabled:true,
      req:{get:()=> 'untrusted-session'},
      text:'Private reply',
      verifiedOwner,
      record:async()=>{writes++;}
    });

    assert.equal(result.stored,false);
  }

  assert.equal(writes,0);
});

test('database errors do not break the chat response',async()=>{
  const result=await saveCompletedAssistantReply({
    enabled:true,
    req:{get:()=> 'session-one'},
    text:'A valid completed answer',
    verifiedOwner:()=> 'user:accountA',
    record:async()=>{
      throw new Error('DATABASE_UNAVAILABLE');
    }
  });

  assert.equal(result.stored,false);
  assert.equal(result.reason,'unavailable');
});

test('empty answers are never persisted',async()=>{
  const result=await saveCompletedAssistantReply({
    enabled:true,
    text:'   ',
    verifiedOwner:()=> 'user:accountA',
    record:async()=>{
      throw new Error('Should not be called');
    }
  });

  assert.equal(result.stored,false);
});

test('hook runs only after successful response end',()=>{
  const server=readFileSync(
    new URL('../../../server.js',import.meta.url),
    'utf8'
  );

  const begin=server.indexOf(
    'const finalResponse = fullReply;'
  );

  const end=server.indexOf('res.end();',begin);

  const hook=server.indexOf(
    'AP_CREATION_ASSISTANT_REPLY_MEMORY_V1',
    begin
  );

  assert.ok(begin>=0);
  assert.ok(end>begin);
  assert.ok(hook>end);
  assert.ok(hook-end<300);
});
