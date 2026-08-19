# CI/CD & GITOPS GAP ANALYSIS

## Current State
- `Dockerfile` exists.
- `docker-compose.yml` exists.
- Scripts in `package.json` exist.

## Missing/Incomplete
1. **GitHub Actions:** Comprehensive pipeline (Test -> Security -> Image -> Registry -> Helm -> ArgoCD).
2. **Kubernetes:** Manifests/Helm charts are basic or optional.
3. **ArgoCD / GitOps:** No actual declarative deployment mechanism enforced.
4. **Argo Rollouts:** Missing canary, automatic rollback, and promotion.
