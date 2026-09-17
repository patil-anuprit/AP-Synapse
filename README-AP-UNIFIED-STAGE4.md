# AP Unified Intelligence Stage 4

Stage 4 connects the isolated AP intelligence architecture to the existing AP Synapse application services without changing production routing.

## Existing AP Synapse systems adapted

- PostgreSQL-backed conversation store through `getConversation`
- PostgreSQL-backed personalization context through `getPersonalizationContext`
- existing uploaded-document/session-memory shape
- existing Tavily web source engine through `searchWebSources`
- existing `readDocument` service contract
- AP Unified Intelligence Stage 3 documents, tools, verifier, and quality gates

## Important safety boundary

Stage 4 does not modify `backend/services/router.js`.

It adds `apIntegratedIntelligenceService.js` as a tested service boundary only. The current Groq/Gemini/DeepSeek/OpenRouter failover chain remains unchanged.

A later integration stage can place the AP integrated service behind an explicit feature flag and preserve the current router as fallback.

## Aprisha

Aprisha Android and desktop planners already use `createAIStream`. Stage 4 does not modify their action schemas, allowlists, consequential-action rules, or closed-loop controller.

This prevents intelligence integration from weakening Aprisha's existing execution safety boundaries.
