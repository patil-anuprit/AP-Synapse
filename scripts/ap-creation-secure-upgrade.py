#!/usr/bin/env python3
"""Fail-closed additive AP Synapse creation auth upgrade. No Canvas edits."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
server=ROOT/'backend/server.js'
engine=ROOT/'backend/services/ap-creation/engine.mjs'
auth=ROOT/'backend/services/ap-creation/authQuota.mjs'
for p in [server,engine,auth,ROOT/'backend/services/personalizationService.js',ROOT/'backend/database/db.js']:
    if not p.exists():raise SystemExit(f'STOP: required file missing: {p.relative_to(ROOT)}')
s=server.read_text(encoding='utf8')
e=engine.read_text(encoding='utf8')
marker='AP_CREATION_VERIFIED_QUOTA_INTEGRATION_V1'
if marker in s or marker in e:raise SystemExit('STOP: secure integration already applied; no modifications')
if 'AP_UNIVERSAL_CREATION_CHAT_V1' not in s:raise SystemExit('STOP: existing creation integration not found')
if len(re.findall(r'\bconst apUniversalCreator\s*=\s*createUniversalEngine\s*\(',s))!=1:
    raise SystemExit('STOP: ambiguous AP Synapse creation engine initialization')
if len(re.findall(r'\bconst apUniversalCreator\s*=\s*createUniversalEngine\s*\(',s))!=1:
    raise SystemExit('STOP: cannot find creation engine')
# Require exact expected option structure; change only this engine call.
anchor='const apUniversalCreator = createUniversalEngine({'
if s.count(anchor)!=1:raise SystemExit('STOP: unexpected creation engine initializer')
s=s.replace(anchor,anchor+'\n    // '+marker+'\n    beforeCreate: async(req) => {\n        const {reserveVerifiedCreation} = await import(\'./services/ap-creation/authQuota.mjs\');\n        return reserveVerifiedCreation(req);\n    },',1)
# The active engine must invoke beforeCreate after intent routing and before context/provider calls.
needle='allowImageIntercept=false,chatEnabled=false}={})'
if e.count(needle)!=1:raise SystemExit('STOP: engine options signature changed')
e=e.replace(needle,'allowImageIntercept=false,chatEnabled=false,beforeCreate=async()=>{}}={})',1)
location='    const userKey=keyFor(req,identify);'
if e.count(location)!=1:raise SystemExit('STOP: cannot locate creation identity attribution')
e=e.replace(location, '    // '+marker+': verify signed account and reserve shared quota before accessing session artifacts or provider.\n    await beforeCreate(req);\n'+location,1)
# Conservative: fail if removal of code or edits to unexpected lines would be required.
server.write_text(s,encoding='utf8')
engine.write_text(e,encoding='utf8')
print('PASS: pre-generation signed account verification + atomic shared Postgres quota installed')
print('No frontend, Canvas, model router, existing image editor or other routes changed.')
