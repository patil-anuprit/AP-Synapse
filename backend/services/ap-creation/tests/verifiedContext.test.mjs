import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadVerifiedArtifactHistory,
  recordVerifiedArtifact
} from '../verifiedContext.mjs';

test('artifact memory is isolated by authenticated account', async () => {
  const records = [];

  const db = {
    async query(sql, args = []) {
      if (sql.includes('INSERT INTO ap_creation_verified_context')) {
        records.push({
          id: records.length + 1,
          account_id: args[0],
          session_id: args[1],
          request_text: args[2],
          artifact_description: args[3]
        });
        return {rows:[]};
      }

      if (sql.includes('SELECT request_text')) {
        return {
          rows: records
            .filter(r => r.account_id === args[0])
            .sort((a,b) => b.id - a.id)
            .slice(0,9)
        };
      }

      return {rows:[]};
    }
  };

  await recordVerifiedArtifact({
    accountId:'user:accountA',
    sessionId:'same-session-id',
    userMessage:'Private budget for A',
    artifact:'Created xlsx: budget-a.xlsx',
    db
  });

  await recordVerifiedArtifact({
    accountId:'user:accountB',
    sessionId:'same-session-id',
    userMessage:'Private proposal for B',
    artifact:'Created pdf: proposal-b.pdf',
    db
  });

  const a = await loadVerifiedArtifactHistory({
    accountId:'user:accountA', db
  });

  const b = await loadVerifiedArtifactHistory({
    accountId:'user:accountB', db
  });

  assert.match(JSON.stringify(a), /budget-a/);
  assert.doesNotMatch(JSON.stringify(a), /proposal-b/);

  assert.match(JSON.stringify(b), /proposal-b/);
  assert.doesNotMatch(JSON.stringify(b), /budget-a/);

  await assert.rejects(
    loadVerifiedArtifactHistory({
      accountId:'', db
    }),
    /VERIFIED_ACCOUNT_REQUIRED/
  );
});
