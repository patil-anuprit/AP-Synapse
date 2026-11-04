# AP Synapse — Direct GitHub Browser Installation

**No VS Code. No terminal. No Canvas changes.**

This is a **source installer**, not a live deployment. It adds the creation engine as new files, then uses a manually started GitHub Actions workflow to prepare a small pull request modifying the existing backend and chat.

## Part A — Upload using only the GitHub website

1. Download **AP-Synapse-GitHub-Installer.zip** and right-click → **Extract All** on Windows.
2. Sign in to GitHub and open **your AP Synapse repository** on its default branch (`main` if that is its default branch).
3. Select **Add file → Upload files**. **Drag the CONTENTS of the extracted folder** into the GitHub upload page. Include the `.github` folder. **Do not upload the ZIP itself**: GitHub will not extract a ZIP automatically.
4. Confirm the preview contains paths such as `.github/workflows/ap-synapse-creation-pr.yml`, `scripts/ap-creation-install.py` and `backend/services/ap-creation/engine.mjs`. Commit **only these NEW files** to the default branch. If GitHub proposes overwriting `backend/server.js` or `frontend/scripts/chat.js` at this stage, **STOP**; this package must not overwrite them during initial upload.

GitHub supports browser uploads of files/folders: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository

## Part B — Ask GitHub to prepare the integration (no copy/paste)

5. Open **Actions** in that repo.
6. In the left workflow list choose **AP Synapse - Prepare Universal Engine PR**.
7. Choose **Run workflow → Run workflow** (the default branch).
8. Watch the checks. If all pass, the action creates a **pull request** named `AP Synapse: integrate context-aware creation engine (disabled by default)`.
9. Review its **Files changed**. Expected existing files changed: `backend/server.js`, `frontend/scripts/chat.js`, `backend/package.json`, and `backend/package-lock.json` (or newly created lockfile). No Canvas files should be changed. Merge only after review.

### If GitHub says it cannot create the pull request

In **Settings → Actions → General**, GitHub may require repository owner permission for the GitHub Actions token to have read/write access and to create pull requests. Enable those capabilities **only if you want this automation to create the PR**. Alternatively, the workflow will have pushed a branch named `ap-universal-creation-<run-id>`; you can use **Compare & pull request** to create the PR manually.

### If the workflow stops with "STOP: ..."

**Do not guess or force the patch.** Your currently deployed `server.js` or `chat.js` is different from the earlier AP Synapse source notes. The installer deliberately does not patch unexpected source. Open the failed Actions job and share the exact `STOP:` error and the relevant source excerpt for a targeted adjustment.

## Part C — Activate cautiously *after* deployment and testing

By default, the PR's new functionality is **OFF**. Your normal chat, Canvas, and existing image editor continue unchanged.

Set **backend environment variables in both Render and Railway** (not in frontend, not committed to GitHub):

- `AP_CREATION_ENABLED=true`
- `AP_CREATION_CHAT_ENABLED=true`
- `AP_CREATION_IMAGE_CHAT=false` **initially** (leave existing image editor untouched)
- `GEMINI_API_KEY=...` **only if your existing Gemini key is not already set**, or connect an existing generation provider in the `providers.mjs` integration.

Redeploy as needed in both backends. Test in AP Synapse's existing chat:

- `Create a 3-slide presentation about the solar system.` → downloadable `.pptx`
- `Make a PDF from the same information.` → downloadable `.pdf`
- `Create a Word document with the previous content.` → downloadable `.docx`
- `Hi, how are you?` → normal chat, not artifact generation
- Verify your existing image generation and editing, attachments, voice, Canvas, plus Render ↔ Railway failover still work.

**Never put Gemini keys or any provider secrets in repository code or an Actions log.** Models have rate limits and may incur costs; no provider is unlimited. Do not switch on the new chat path until all tests and security checks pass.

## What this installer cannot promise automatically

- **Live compatibility**: your current GitHub source is not available to this installer before it runs. Therefore it uses strict source anchors and stops if they do not match.
- **Complete memory**: it reads current conversation history using `memory/memoryManager.js` (if available), but cross-instance long-term context and binary artifact continuity still require your shared authenticated store.
- **Perfect files**: PDF, DOCX and PPTX rendering is text-forward; complex charts, scanned PDFs, graphical slide design, large assets and meticulous reference-image editing need further dedicated work.
- **Free unlimited generations**: API costs and quotas apply. A small per-process rate guard is not a substitute for shared authentication, billing quotas and distributed rate limiting.
- **No surprise deployment**: adding unused files to the default branch may trigger CI/deploy; the actual `/chat` patch is made in a pull request and never merged automatically. The new code is off by default even after merging.

## Files included

- `.github/workflows/ap-synapse-creation-pr.yml` — manual GitHub Actions installer workflow
- `scripts/ap-creation-install.py` — fail-closed targeted patch to the existing backend/chat/package manifest
- `backend/services/ap-creation/*.mjs` — image provider adapter, creation router, context assembly, document renderers
- `backend/services/ap-creation/tests/*.mjs` — unit tests and render smoke checks
- `frontend/scripts/renderCreationResult.js` — downloadable artifact in the original chat; no new UI

**Quality status:** six isolated engine tests and installer mock-repository syntax check passed. GitHub Actions and provider generation have not been run on the real AP Synapse repository, and a live installation has not been performed.
