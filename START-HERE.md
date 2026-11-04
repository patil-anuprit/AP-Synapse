# AP Synapse Secure Creation Activation — browser-only GitHub upgrade

## Purpose
Your Gemini API key already exists. DO NOT paste it anywhere. This upgrade secures the creation engine before activation, with verified AP Synapse signed account tokens and atomic hourly quotas stored in the existing PostgreSQL database. Normal chat, old image editor and Canvas remain untouched.

## Github only
1. Download the ZIP and extract it on Windows.
2. Open https://github.com/patil-anuprit/AP-Synapse/tree/main
3. **Add file → Upload files**: upload the CONTENTS of the extracted directory, preserving `.github/workflows`, `scripts` and `backend/services/ap-creation/...` paths. GitHub browser upload must show FOUR added files: workflow YAML, Python script, authQuota.mjs, test file, plus START-HERE.md if desired. Do not upload the ZIP itself. Do not overwrite existing files.
4. Commit the new files to `main`.
5. In GitHub **Actions**, choose `AP Synapse - Secure Creation Engine PR` → **Run workflow**.
6. If the run creates a review branch and cannot create a pull request (GitHub permission), use `Compare & pull request` for the branch printed in the Actions logs.
7. Review PR **Files changed**: expected **only** `backend/server.js` and `backend/services/ap-creation/engine.mjs`. No Canvas changes. Check tests before merging.
8. After merging, deploy the latest commit to Render; repeat for Railway if using it. Keep `AP_CREATION_ENABLED`, `AP_CREATION_CHAT_ENABLED`, `AP_CREATION_IMAGE_CHAT` false during smoke tests. Confirm normal chat and Canvas.
9. Ensure the production account identity resolver works, `DATABASE_URL` is present, and BOTH Render and Railway access the SAME PostgreSQL DB. The new table is created automatically when a verified user first generates a file.
10. Then enable `AP_CREATION_ENABLED=true` and `AP_CREATION_CHAT_ENABLED=true`, with `AP_CREATION_IMAGE_CHAT=false` at first. Optional `AP_CREATION_HOURLY_LIMIT=5` (allowed 1..20). Redeploy the service and test from a **signed-in** AP Synapse account: `Create a 3-slide presentation about the solar system.` Expected downloadable PowerPoint; `Make a PDF from the same information.` Expected PDF. Normal chat should still answer normally. Guest creation requires login, by design.
11. Only after image-edit behavior is tested should you consider `AP_CREATION_IMAGE_CHAT=true`; doing so may override the older image generator. Keep it false unless replacing that pipeline is intentional.

## Notes
This script deliberately refuses to patch altered source anchors. If Actions fails, check exact `STOP:` line; DO NOT force the edit. The module's database quota protects against abuse but does not set vendor API budget or cost alerts; configure those separately. Text/PDF/slide content may still need visual QA. Generated binaries are NOT durable shared storage, and image edit state is per backend process.
