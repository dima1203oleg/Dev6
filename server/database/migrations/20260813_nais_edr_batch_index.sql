-- NAIS EDR XML local batch index
-- Apply this migration to existing PostgreSQL deployments before invoking the
-- NAIS importer. New deployments receive the same tables from schema.sql.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS nais_edr_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_id VARCHAR(255) UNIQUE NOT NULL,
    source_type VARCHAR(10) NOT NULL CHECK (source_type IN ('FOP', 'UO')),
    source_url VARCHAR(2048) NOT NULL,
    archive_path TEXT NOT NULL,
    archive_sha256 VARCHAR(64) NOT NULL,
    archive_size BIGINT NOT NULL,
    xml_entry_name VARCHAR(1024) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('RUNNING', 'SUCCEEDED', 'FAILED')),
    records_seen BIGINT NOT NULL DEFAULT 0,
    records_indexed BIGINT NOT NULL DEFAULT 0,
    records_skipped BIGINT NOT NULL DEFAULT 0,
    records_failed BIGINT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nais_edr_imports_source_status
    ON nais_edr_imports(source_type, status, finished_at DESC);

CREATE TABLE IF NOT EXISTS nais_edr_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR(10) NOT NULL CHECK (source_type IN ('FOP', 'UO')),
    record_number VARCHAR(255) NOT NULL,
    lookup_identifier VARCHAR(20),
    edrpou VARCHAR(20),
    full_name VARCHAR(1024) NOT NULL,
    short_name VARCHAR(512),
    status VARCHAR(255),
    registration TEXT,
    raw_data JSONB NOT NULL,
    raw_hash VARCHAR(64) NOT NULL,
    source_url VARCHAR(2048) NOT NULL,
    source_archive_sha256 VARCHAR(64) NOT NULL,
    import_id VARCHAR(255) NOT NULL REFERENCES nais_edr_imports(import_id),
    is_current BOOLEAN NOT NULL DEFAULT true,
    imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(source_type, record_number, import_id)
);

CREATE INDEX IF NOT EXISTS idx_nais_edr_records_edrpou_current
    ON nais_edr_records(edrpou) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_nais_edr_records_lookup_identifier_current
    ON nais_edr_records(lookup_identifier) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_nais_edr_records_source_current
    ON nais_edr_records(source_type, is_current);
