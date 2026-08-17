# Disaster Recovery Plan

## Backup Strategy
- **PostgreSQL**: Continuous archiving (WAL) via pgBackRest. Full backup daily.
- **MinIO (Evidence)**: Cross-region replication enabled.
- **Configuration**: All config is stored in Git (GitOps).

## Restore Scenarios
### 1. Database Corruption
- Restore from the latest WAL archive.
- Re-run the HYDRA pipeline for any searches lost during the RPO window.

### 2. Complete Cluster Loss
- Provision new Kubernetes cluster.
- Apply ArgoCD manifests to bootstrap infrastructure.
- ArgoCD syncs the desired state from the GitOps repository.
- Attach to replicated MinIO and restored PostgreSQL instance.
- **RTO Goal**: < 4 hours.
