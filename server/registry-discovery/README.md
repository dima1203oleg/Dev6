# Registry Discovery Platform (RDP)

## Overview

Autonomous platform for discovering, analyzing, classifying, connecting, and maintaining all open government registries without manual intervention.

## Core Principle

**Don't build connectors. Build a system that builds connectors.**

## Architecture

```
Registry Discovery Platform
         Scheduler
             │
┌────────────┼────────────┐
│            │            │
Discovery   Registry    API Analyzer
Engine      Scanner
│            │            │
└────────────┴────────────┘
             │
    Connector Generator
             │
    Schema Analyzer
             │
   Mapping Generator
             │
   Validation Engine
             │
  Data Quality Engine
             │
  Entity Resolution
             │
  Graph Integration
             │
 Production Registry
```

## Modules

1. **Registry Discovery Engine** - Universal catalog discovery
2. **CKAN Discovery Adapter** - Full CKAN API support
3. **Intelligent Dataset Scanner** - Format detection
4. **Automatic Resource Downloader** - Optimal download selection
5. **Automatic Connector Generator** - Zero-code connector generation
6. **Smart Schema Analyzer** - Drift detection and auto-correction
7. **Registry Intelligence** - Registry passports
8. **Registry Quality Engine** - Quality metrics
9. **Autonomous Scheduler** - Automated cycles
10. **Data Storage Architecture** - Structured storage
11. **Production Artifacts** - Automated report generation

## Storage Structure

```
/catalog
/raw
/processed
/normalized
/evidence
/logs
/registry-passports
/schema-history
/connectors
/mappings
```

## Production Artifacts

- catalog.json
- registry_passports.json
- download_queue.json
- connector_registry.json
- schema_history.json
- health_report.json
- quality_report.json
- discovery_report.md
- production_status.json

## Acceptance Criteria

System is production-ready when:

- ✅ Automatically discovers new government datasets without human intervention
- ✅ Fully supports official CKAN Data API (package_list, package_search, package_show, resource_show, datastore_search, datastore_search_sql)
- ✅ Automatically detects datastore_active and selects optimal data retrieval method
- ✅ Supports pagination (limit/offset), filtering, and SQL queries to DataStore
- ✅ Automatically generates connectors and mappings
- ✅ Detects schema drift and self-corrects
- ✅ Performs automatic regression after each change
- ✅ Stores raw data, normalized data, metadata, and change history
- ✅ Integrates new sources into PREDATOR Analytics without manual programming
- ✅ Maintains continuous Discover → Analyze → Generate → Validate → Integrate → Monitor cycle
