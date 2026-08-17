# Security Architecture

## Principles
- **Zero Trust**: No component trusts another by default.
- **Least Privilege**: Services (like ARDP) only have write access to their specific schemas.

## Components
1. **HashiCorp Vault**: Stores all API keys, database credentials, and upstream tokens.
2. **OIDC / Keycloak**: Identity provider for user access.
3. **RBAC**: Strict role-based access control. End-users cannot see audit logs or trigger manual ingestions.
4. **Audit Logging**: Every search, view, and export is logged. Logs are immutable and stored in a separate table.
5. **TLS**: End-to-end encryption.
6. **WAF**: Web Application Firewall to block malicious payloads.
