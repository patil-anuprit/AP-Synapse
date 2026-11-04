#!/usr/bin/env python3
"""AP Synapse GitHub-browser installer: fail closed if expected source anchors differ.

Makes a small, reviewable patch. It DOES NOT touch Canvas, push changes or deploy.
Run in a GitHub Action; see .github/workflows/ap-synapse-creation-pr.yml.
"""
from pathlib import Path
import re
import json

ROOT = Path(__file__).resolve().parents[1]
SERVER = ROOT / 'backend/server.js'
CHAT = ROOT / 'frontend/scripts/chat.js'
PKG = ROOT / 'backend/package.json'
MARKER = 'AP_UNIVERSAL_CREATION_CHAT_V1'

for p in (SERVER, CHAT, PKG, ROOT/'backend/memory/memoryManager.js'):
    if not p.is_file():
        raise SystemExit(f'STOP: expected file missing: {p.relative_to(ROOT)}')

server = SERVER.read_text(encoding='utf-8')
chat = CHAT.read_text(encoding='utf-8')
package = json.loads(PKG.read_text(encoding='utf-8'))

if MARKER in server or MARKER in chat:
    raise SystemExit('STOP: creation integration marker already exists; review before rerunning')

if not re.search(r'\bimport\s+.*?\bfrom\s+[\'\"]', server):
    raise SystemExit('STOP: backend/server.js does not look like ES module source')

# Route insertion: match just the existing POST /chat entry, not other paths.
existing_chat = list(re.finditer(r'\bapp\.post\s*\(\s*([\'\"])/chat\1\s*,', server))
if len(existing_chat) != 1:
    raise SystemExit(f'STOP: expected exactly 1 POST /chat route, found {len(existing_chat)}')
route_at = existing_chat[0].start()
if 'express.json' not in server[:route_at]:
    raise SystemExit('STOP: JSON body middleware not found before the chat route')

# Frontend branch: require the currently known response parsing structure.
json_branch = list(re.finditer(r'if\s*\(\s*contentType\.includes\s*\(\s*([\'\"])application/json\1\s*\)\s*\)\s*\{',chat))
if len(json_branch) != 1:
    raise SystemExit(f'STOP: expected 1 JSON contentType chat branch, found {len(json_branch)}')
branch = json_branch[0]
remaining = chat[branch.end(): branch.end()+2500]
parse_match = re.search(r'\bconst\s+data\s*=\s*await\s+response\.json\s*\(\s*\)\s*;', remaining)
if parse_match is None:
    raise SystemExit('STOP: JSON response parse anchor differs from known AP Synapse source')
if not re.search(r'\bchatWindow\b',chat):
    raise SystemExit('STOP: expected chatWindow DOM reference not found in frontend script')

# Avoid automatically intercepting images: existing image editor stays authoritative by default.
patch = '''
// AP_UNIVERSAL_CREATION_CHAT_V1 (feature flag: OFF unless enabled in backend environment)
const apUniversalCreator = createUniversalEngine({
    getContext: async (req, { sessionId }) => {
        // Use AP Synapse's EXISTING conversation memory rather than client-submitted history.
        const { buildConversation } = await import('./memory/memoryManager.js');
        const turns = typeof buildConversation === 'function'
            ? await buildConversation(String(sessionId || ''))
            : [];
        return {
            history: Array.isArray(turns) ? turns : [],
            documentText: typeof req.body?.document === 'string' ? req.body.document : ''
        };
    },
    onCreated: async (req, artifact) => {
        // Keep generated-artifact metadata in the same conversation context.
        // Add user-scoped durable binary storage separately before promising persistence.
        const sessionId = String(req.get('x-session-id') || '');
        if (!sessionId) return;
        const { remember } = await import('./memory/memoryManager.js');
        if (typeof remember === 'function') {
            await remember(sessionId, 'user', String(req.body?.message || '').slice(0,2000));
            await remember(sessionId, 'assistant', 'Created ' +
                artifact.kind + ': ' + artifact.fileName);
        }
    },
    chatEnabled: process.env.AP_CREATION_ENABLED === 'true' &&
        process.env.AP_CREATION_CHAT_ENABLED === 'true',
    allowImageIntercept: process.env.AP_CREATION_IMAGE_CHAT === 'true'
});
app.post('/ap/create', (req, res, next) => {
    if (process.env.AP_CREATION_ENABLED !== 'true') return res.sendStatus(404);
    return next();
}, apUniversalCreator.handler);
app.post('/chat', apUniversalCreator.chatMiddleware);

'''
server = "import { createUniversalEngine } from './services/ap-creation/engine.mjs';\n" + server[:route_at] + patch + server[route_at:]

# Integrate the return type into the existing chat response; no Canvas or UI rewrite.
parse_end = branch.end() + parse_match.end()
chat = "import { renderCreationResult } from './renderCreationResult.js';\n" + chat[:parse_end] + '''

// AP_UNIVERSAL_CREATION_CHAT_V1: render downloadable files inside the existing chat.
if (renderCreationResult(data, chatWindow)) return;
''' + chat[parse_end:]

# Change only three dependency versions, never replace the existing package.json.
package.setdefault('dependencies',{})
for name, version in {'pdfkit':'^0.17.0', 'docx':'^9.0.0', 'pptxgenjs':'^3.12.0'}.items():
    package['dependencies'].setdefault(name,version)

# Write only after ALL anchors and conditions have been checked.
SERVER.write_text(server,encoding='utf-8')
CHAT.write_text(chat,encoding='utf-8')
PKG.write_text(json.dumps(package,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('PASS: backend route + context adapter + chat result handler + dependencies staged.')
print('Canvas was not touched. All generation paths remain OFF until environment flags are set.')
