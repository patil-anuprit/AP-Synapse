#!/usr/bin/env python3
"""Fail-closed installer. NEVER touches Canvas, design files or preexisting creation code."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
SERVER=ROOT/'backend/server.js'
CHAT=ROOT/'frontend/scripts/chat.js'
MARK='AP_MEDIA_CHAT_ENGINE_V1'
if not SERVER.is_file() or not CHAT.is_file():
    raise SystemExit('STOP: backend/server.js or frontend/scripts/chat.js not found')
server=SERVER.read_text(encoding='utf8')
chat=CHAT.read_text(encoding='utf8')
if MARK in server or MARK in chat:
    raise SystemExit('STOP: installer already run; review existing integration first')
anchor=re.compile(r"app\.post\(\s*(['\"])\/chat\1\s*,\s*apUniversalCreator\.chatMiddleware\s*\)\s*;",re.M)
found=list(anchor.finditer(server))
if len(found)!=1:
    raise SystemExit('STOP: existing apUniversalCreator chat middleware anchor not uniquely found; do NOT guess')
if 'express.json' not in server[:found[0].start()]:
    raise SystemExit('STOP: express JSON middleware not found before chat')
json_hook=re.compile(r'if\s*\(\s*renderCreationResult\s*\(\s*data\s*,\s*chatWindow\s*\)\s*\)\s*return\s*;',re.M)
spots=list(json_hook.finditer(chat))
if len(spots)!=1:
    raise SystemExit('STOP: creation-result renderer call not uniquely found in chat; review manually')
if "from './renderCreationResult.js'" not in chat and 'from "./renderCreationResult.js"' not in chat:
    raise SystemExit('STOP: expected existing renderer import missing')
block='''// AP_MEDIA_CHAT_ENGINE_V1: media creation uses original chat, no Canvas hooks.
const apMediaEngine = createMediaEngine({
  getContext: async (req, {sessionId}) => {
    // Account-scoped user chat is persisted by the new engine automatically.
    // Reuse existing assistant replies ONLY after verifying session owner access.
    if(process.env.AP_MEDIA_TRUST_EXISTING_CHAT_HISTORY!=='true')return {history:[]};
    const {buildConversation} = await import('./memory/memoryManager.js');
    const turns = typeof buildConversation === 'function'
      ? await buildConversation(String(sessionId || '')) : [];
    return {history: Array.isArray(turns) ? turns : []};
  }
});
app.use('/ap/media', apMediaEngine.router);
app.post('/chat', apMediaEngine.captureChat);
app.post('/chat', apMediaEngine.chatMiddleware);

'''
server='import {createMediaEngine} from \'./services/ap-media/engine.mjs\';\n'+server[:found[0].start()]+block+server[found[0].start():]
chat="import {renderMediaJob} from './renderMediaJob.js';\n"+chat
match=json_hook.search(chat)
chat=chat[:match.end()]+"\n// AP_MEDIA_CHAT_ENGINE_V1: async media card inside the existing conversation.\nif (renderMediaJob(data,chatWindow)) return;"+chat[match.end():]
# Only write after all anchors and validations pass.
SERVER.write_text(server,encoding='utf8')
CHAT.write_text(chat,encoding='utf8')
print('PASS: only backend/server.js and frontend/scripts/chat.js modified.')
