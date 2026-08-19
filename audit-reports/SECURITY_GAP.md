# SECURITY GAP ANALYSIS

## Current Weaknesses
1. **Secrets:** `.env` usage for production secrets instead of Vault integration.
2. **Auth:** Needs strict role-based access control verification (anonymous -> 401, wrong role -> 403).
3. **API Protection:** Missing robust rate limiting, request body limits, SSRF protection for connectors.
4. **Supply Chain:** Lack of Trivy/Hadolint, SBOM, and image signing.
5. **AI Prompt Injection:** Risks in Gemini integration paths.
