import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifiedCreationUser} from '../authQuota.mjs';

test('creation account identity uses verified authentication',()=>{
  assert.equal(typeof verifiedCreationUser,'function');

  const server=readFileSync(
    new URL('../../../server.js',import.meta.url),
    'utf8'
  );

  const start=server.indexOf(
    'const apUniversalCreator = createUniversalEngine({'
  );

  const end=server.indexOf(
    "app.post('/ap/create'",start
  );

  assert.ok(start>=0 && end>start);

  const block=server.slice(start,end);

  const verified=block.match(
    /accountId:\s*verifiedCreationUser\(req\)/g
  )||[];

  assert.equal(
    verified.length,3,
    'Every artifact account lookup must be verified'
  );

  assert.doesNotMatch(block,/req\.user\?\.id/);
});

test('verified creation identity rejects unsigned requests',()=>{
  assert.throws(
    ()=>verifiedCreationUser({}),
    /.+/
  );
});
