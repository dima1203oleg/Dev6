# Production Certification Matrix

Before any release is promoted to production, it MUST pass the following gates without exceptions.

## CI/CD Pipeline Gates
- [ ] TypeScript Typecheck (0 errors)
- [ ] ESLint (0 errors)
- [ ] Build (Exit 0)
- [ ] Unit Tests Pass
- [ ] Integration Tests Pass
- [ ] Security Scan (Trivy/Falco) - 0 Critical/High Vulns

## Data Integrity Gates
- [ ] Real Data Only (No mocks)
- [ ] Provenance Attached to All Facts
- [ ] Evidence Stored and Hash-Verified
- [ ] Entity Resolution Correctness >= 99%

## UX / Responsive Gates (Device Capability Matrix)
- [ ] iPhone 15 Pro Max (Safari, Portrait, Safe Areas intact)
- [ ] iPhone 15 Pro Max (Safari, Landscape)
- [ ] Android Phone (Chrome)
- [ ] iPad / Tablet (Split View Layout)
- [ ] Laptop / Desktop Viewport (Multi-column)
- [ ] Ultrawide Viewport

## E2E Certification
- [ ] Real search execution for IPN `3111724753` completes successfully, mapping to real upstream sources.
