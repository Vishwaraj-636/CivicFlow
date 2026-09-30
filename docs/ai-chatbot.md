# Grounded AI Copilot

The copilot exposes `GET /api/ai/health` and authenticated `POST /api/ai/query`. Live incident context is loaded from MongoDB; project-created procedure and responsibility documents are retrieved locally and passed through a LangChain prompt chain. When `LLM_API_KEY` is absent or the provider fails, the endpoint returns a grounded fallback and CivicFlow operations continue normally.

Set `LLM_PROVIDER=gemini`, `LLM_API_KEY`, and optionally `LLM_MODEL` to enable the low-cost Gemini provider. Responses include retrieved source filenames. The included knowledge files are illustrative project documents, not official government policy.