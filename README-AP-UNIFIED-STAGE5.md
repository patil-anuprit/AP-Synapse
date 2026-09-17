# AP Unified Intelligence Stage 5

Stage 5 is the first feature-flagged integration into the real AP Synapse AI router.

## Behavior

When `AP_UNIFIED_INTELLIGENCE_ENABLED` is false or absent, the existing router behavior remains the default.

When enabled, only callers whose `requestContext.surface` is included in `AP_UNIFIED_INTELLIGENCE_SURFACES` may use AP Integrated Intelligence.

The default surface allowlist is:

`chat`

This means Aprisha Android and Aprisha Desktop remain on their existing router behavior during Stage 5.

## Normal chat

The `/chat` route now passes `surface: "chat"` to `createAIStream`.

The server has already assembled conversation memory and personalization into the outgoing messages, so Stage 5 disables duplicate memory/personalization lookups at the integrated-service boundary.

The existing parallel Tavily source flow remains unchanged and still supplies the structured frontend source payload.

## Fallback

If AP Integrated Intelligence fails before returning its stream, Stage 5 logs the failure and falls through to the existing normal-text provider chain.

The existing vision route and image-generation route execute before the Stage 5 normal-text primary path, so their behavior is not replaced.

## Local proof model

Stage 5 validation uses the local Ollama proof model with commercial-provider environment keys removed from the validation process.

This proves routing independence for the tested local text path. It does not claim the entire deployed AP Synapse application is independent of all external services.

## Current streaming limitation

AP Integrated Intelligence currently completes its council/verification/synthesis cycle before exposing its synthetic OpenAI-style stream. That means Stage 5 prioritizes correctness and safe router integration over first-token latency.

A later stage should add native progressive streaming without weakening verification or fallback behavior.
