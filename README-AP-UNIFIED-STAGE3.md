# AP Unified Intelligence Stage 3

Stage 3 extends the isolated AP Unified Intelligence Core with local context infrastructure:

- local knowledge ingestion and retrieval
- identity-scoped persistent memory
- transient document context retrieval
- deterministic safe calculator tooling
- unified context assembly before council inference

The retrieval layer is deliberately dependency-light and provider-independent for local development. It uses lexical ranking so the architecture can be tested without an embedding API.

This does not replace AP Synapse's existing production database, document parser, web search, or Aprisha integration yet. It creates the isolated intelligence-side interfaces that those systems can connect to later.

Production router, Render, Vercel, Android, and Aprisha production code remain untouched during this stage.
