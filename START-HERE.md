# AP Synapse — Conversation-Native Universal Media Engine

**Scope:** A backend and small existing-chat result renderer, NOT a studio. Canvas, editor, sidebar, page design, voice, existing document providers and regular chat are not replaced. The existing PDF/DOCX/PPTX creator remains responsible for documents.

**Status:** Source package, offline provider-mock tests, fail-closed GitHub installer. **Not yet live-tested with real API keys, provider billing, your exact Render backend, or your exact frontend.** No live deploy happened while producing this package.

## Real creation capabilities

| Chat request | Engine/provider | File/output |
|---|---|---|
| Create/design an image | Gemini native image model, standard / premium; conversational reference editing | PNG/JPEG/WebP |
| Animate the earlier image, make video, revise that video | Gemini Omni Flash Interactions API; carries interaction ID for editing | MP4 with controls and downloadable file |
| Make a 3D model from text | Meshy Text to 3D preview | GLB mesh (preview, normally untextured) |
| Turn the last generated image into 3D | Meshy Image to 3D, textured and PBR | GLB model |
| Change the model's texture | Meshy Retexture task using original task ID | Revised GLB |
| PDF, Word, slides | Existing AP creation engine, unchanged | PDF/DOCX/PPTX |
| Ordinary questions | Existing AP chatbot | Normal answer |

The server stores created-media metadata, prior image bytes, video provider interaction IDs and job states in **PostgreSQL scoped by verified account + conversation**; it also remembers intervening ordinary **user** messages. Optional pre-existing assistant replies require a verified owner-scoped integration (`AP_MEDIA_TRUST_EXISTING_CHAT_HISTORY=true`) after a security review. It does not accept client-submitted conversation history as authoritative.

Limitations: not literally any possible file type, no real-time 3D viewer, no arbitrary editing of 3D geometry, not a text-to-music/audio engine yet. Model quality, service availability, regional eligibility, storage and provider spend cannot be guaranteed. If a video/image worker restarts while running, it may be marked failed; **a durable background queue is needed for production-scale reliability**. Generated images and videos are stored in PostgreSQL BYTEA up to a configured per-file size (defaults to 22 MB); large-scale service should switch to object storage. Meshy signed download links expire; for permanent asset retention add your own storage.

## Install without terminal or VS Code

1. Extract the ZIP on your computer.
2. In GitHub, open `https://github.com/patil-anuprit/AP-Synapse` on `main`. Upload the **contents** of this folder using **Add file → Upload files**. Verify these are all NEW paths; do **NOT** overwrite existing `server.js`, `chat.js`, `engine.mjs` or Canvas files during this stage:
   - `.github/workflows/ap-media-pr.yml`
   - `backend/services/ap-media/engine.mjs`
   - `backend/services/ap-media/intent.mjs`
   - `backend/services/ap-media/providers.mjs`
   - `frontend/scripts/renderMediaJob.js`
   - `scripts/ap-media-install.py`
   - `tests/ap-media-intent.test.mjs` and `tests/ap-media-provider.test.mjs`
3. Commit **new files only** to `main`. They do not activate the feature.
4. **Actions → AP Synapse - Stage Chat Native Universal Media Engine → Run workflow**. It syntax-checks/tests the files and makes an `ap-media-<run-id>` branch modifying ONLY `backend/server.js` and `frontend/scripts/chat.js`.
5. Go to **Branches**, create a PR from that branch, inspect **Files changed**. It must have two existing files changed and no Canvas files. Merge only after reviewing the actual diff. If the action says `STOP:` do not force it. If GitHub cannot push the branch, enable Actions workflow read/write permissions or apply the two changes manually after review.
6. Render has auto-deploy OFF; choose **Manual Deploy → Deploy latest commit**. If you use Railway failover, deploy the matching code and environment to Railway as well. Make sure `DATABASE_URL` refers to the same PostgreSQL instance on both.
7. Enable image-only first with the environment flags below. Test regular chat, Canvas, PDF/DOCX/PPTX and the new image flow before enabling costlier video or 3D.

### Render and Railway environment flags

```ini
# Set 'true' ONLY after merge, deploy, and session-ownership/security checks.
AP_MEDIA_ENABLED=false
AP_MEDIA_VIDEO_ENABLED=false
AP_MEDIA_3D_ENABLED=false
AP_MEDIA_TRUST_EXISTING_CHAT_HISTORY=false
# Existing GEMINI_API_KEY=... already on Render; do not put the secret in GitHub.
# Video is paid-tier Gemini Omni Flash:
AP_MEDIA_VIDEO_MODEL=gemini-omni-1.1-flash
# Image: current name, configurable; confirm availability for your project.
AP_MEDIA_IMAGE_MODEL=gemini-nano-banana-2.1
AP_MEDIA_IMAGE_PRO_MODEL=gemini-3-pro-image
AP_MEDIA_IMAGE_FALLBACK=gemini-3.1-flash-lite-image
# Required only when 3D is enabled:
# MESHY_API_KEY=your_secret_here
AP_MEDIA_IMAGE_DAILY_LIMIT=20
AP_MEDIA_VIDEO_DAILY_LIMIT=1
AP_MEDIA_3D_DAILY_LIMIT=2
AP_MEDIA_MAX_BYTES=22000000
# Keep old image intercept OFF. This upgrade handles images independently.
AP_CREATION_IMAGE_CHAT=false
```

To smoke-test: set only `AP_MEDIA_ENABLED=true`; keep video and 3D OFF. Test image creation from a fresh signed-in conversation. Then configure a paid Gemini video project and optionally enable video; configure a valid paid Meshy API key before enabling 3D. Don't enable these on public, high-traffic production until you verify billing limits, existing session ownership and resource cleanup.

### Conversation examples

1. `Create a realistic image of a gold-and-graphite futuristic motorcycle helmet.`
2. `Make the helmet's visor darker, keep everything else the same.`
3. `What is the physics of motorcycle aerodynamics?` (ordinary chat, recorded in scoped context)
4. `Animate that helmet in a cinematic 9:16 video with soft studio lighting.`
5. `Make a realistic downloadable 3D model from that earlier image.`
6. `Give the 3D model brushed gold materials.`
7. `Create an editable Word report about the design.` (existing Word engine)

### Storage, safety and production review

- Only the verified bearer-token account can submit, read job status, or download stored image/video files. A client-supplied user ID is never accepted as proof of ownership. Session IDs are hashed together with the authenticated identity.
- Each new job applies existing shared hourly creation quota + account/media/day quotas. These reservations can be consumed by failed attempts; this is a guardrail, not a complete billing ledger.
- New DB tables: `ap_media_jobs`, `ap_media_chat_turns`, `ap_media_daily_usage`. They are created at first use if your PostgreSQL account has permission. Plan retention/cleanup for large amounts of media and chat history; do not leave media bytes unbounded in production.
- Media generated in a process can survive Render/Railway failover AFTER it finishes and reaches PostgreSQL. In-flight image/video execution does NOT yet resume after a process crash (the provider operation may still be chargeable). Meshy jobs survive because status is polled directly from Meshy using the stored provider task ID.
- The automatic server integration's existing `buildConversation(sessionId)` bridge is OFF by default because session-ID-only lookup needs user ownership verification. Account-scoped chat user messages and media artifacts still supply context. After verifying your existing memory store enforces account ownership, enable `AP_MEDIA_TRUST_EXISTING_CHAT_HISTORY=true` for assistant-answer context.
- The download link from Meshy is short-lived and provider-hosted. Use an account-scoped object store for long-term, reliable downloads, especially for 3D.
- API keys never go to the browser. No Canvas source file is edited or imported. The only frontend addition is a media result component inside the chat response handler.

### Rollback

In Render and Railway set `AP_MEDIA_ENABLED=false`, save and deploy. Chat reverts to the existing routes while all other AP Synapse features continue. To fully remove, revert the tiny integration PR; the four new source files can be left unused.

### Automated checks

The package contains offline intent and simulated provider tests. Run `node --test tests/*.test.mjs` from repo root. GitHub Action runs them automatically before preparing a PR. Provider mocks are not live API tests.

### Provider sources verified November 5, 2026

- Gemini Omni Flash Interactions API: https://ai.google.dev/gemini-api/docs/omni
- Google API video status and Veo 3.1 Preview sunset: https://ai.google.dev/gemini-api/docs/video
- Gemini pricing (video is billable): https://ai.google.dev/gemini-api/docs/pricing
- Meshy text, image and retexturing API: https://docs.meshy.ai/en/api/text-to-3d , https://docs.meshy.ai/en/api/image-to-3d , https://docs.meshy.ai/en/api/retexture
