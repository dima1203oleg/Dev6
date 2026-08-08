-- PREDATOR RDP Database Schema
-- MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- EXECUTION TRACKING
-- ============================================

CREATE TABLE ingestion_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE,
    environment VARCHAR(50) NOT NULL,
    network_ip VARCHAR(50),
    network_country VARCHAR(50),
    source VARCHAR(255) NOT NULL,
    datasets_discovered INTEGER DEFAULT 0,
    resources_discovered INTEGER DEFAULT 0,
    datasets_relevant INTEGER DEFAULT 0,
    resources_ingested INTEGER DEFAULT 0,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,
    duplicates INTEGER DEFAULT 0,
    entities_created INTEGER DEFAULT 0,
    facts_created INTEGER DEFAULT 0,
    evidence_created INTEGER DEFAULT 0,
    cards_created INTEGER DEFAULT 0,
    cards_passed INTEGER DEFAULT 0,
    cards_warning INTEGER DEFAULT 0,
    cards_no_data INTEGER DEFAULT 0,
    cards_failed INTEGER DEFAULT 0,
    truth_tests INTEGER DEFAULT 0,
    truth_passed INTEGER DEFAULT 0,
    truth_failed INTEGER DEFAULT 0,
    production_ready BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ingestion_runs_run_id ON ingestion_runs(run_id);
CREATE INDEX idx_ingestion_runs_started_at ON ingestion_runs(started_at);

-- ============================================
-- SOURCE TRACKING
-- ============================================

CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    last_checked TIMESTAMP WITH TIME ZONE,
    last_successful TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sources_source_id ON sources(source_id);
CREATE INDEX idx_sources_status ON sources(status);

-- ============================================
-- DATASET TRACKING
-- ============================================

CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id VARCHAR(255) UNIQUE NOT NULL,
    source_id VARCHAR(255) NOT NULL REFERENCES sources(source_id),
    name VARCHAR(255) NOT NULL,
    title VARCHAR(1024),
    description TEXT,
    organization VARCHAR(255),
    metadata_created TIMESTAMP WITH TIME ZONE,
    metadata_modified TIMESTAMP WITH TIME ZONE,
    state VARCHAR(50),
    relevance_score INTEGER,
    priority VARCHAR(20),
    domains JSONB,
    reasons JSONB,
    resources_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_datasets_dataset_id ON datasets(dataset_id);
CREATE INDEX idx_datasets_source_id ON datasets(source_id);
CREATE INDEX idx_datasets_priority ON datasets(priority);
CREATE INDEX idx_datasets_relevance_score ON datasets(relevance_score);

-- ============================================
-- RESOURCE TRACKING
-- ============================================

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id VARCHAR(255) UNIQUE NOT NULL,
    dataset_id VARCHAR(255) NOT NULL REFERENCES datasets(dataset_id),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    format VARCHAR(50),
    size BIGINT,
    datastore_active BOOLEAN DEFAULT false,
    last_modified TIMESTAMP WITH TIME ZONE,
    etag VARCHAR(255),
    sha256 VARCHAR(64),
    ingestion_status VARCHAR(50),
    ingestion_started TIMESTAMP WITH TIME ZONE,
    ingestion_finished TIMESTAMP WITH TIME ZONE,
    rows_processed INTEGER DEFAULT 0,
    rows_failed INTEGER DEFAULT 0,
    rows_skipped INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resources_resource_id ON resources(resource_id);
CREATE INDEX idx_resources_dataset_id ON resources(dataset_id);
CREATE INDEX idx_resources_ingestion_status ON resources(ingestion_status);

-- ============================================
-- RAW RECORDS
-- ============================================

CREATE TABLE raw_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_record_id VARCHAR(255) UNIQUE NOT NULL,
    resource_id VARCHAR(255) NOT NULL REFERENCES resources(resource_id),
    run_id VARCHAR(255) NOT NULL REFERENCES ingestion_runs(run_id),
    raw_data JSONB NOT NULL,
    raw_hash VARCHAR(64) NOT NULL,
    row_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_raw_records_raw_record_id ON raw_records(raw_record_id);
CREATE INDEX idx_raw_records_resource_id ON raw_records(resource_id);
CREATE INDEX idx_raw_records_run_id ON raw_records(run_id);
CREATE INDEX idx_raw_records_raw_hash ON raw_records(raw_hash);

-- ============================================
-- CANONICAL ENTITIES
-- ============================================

CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    canonical_data JSONB NOT NULL,
    confidence DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_entities_entity_id ON entities(entity_id);
CREATE INDEX idx_entities_entity_type ON entities(entity_type);
CREATE INDEX idx_entities_confidence ON entities(confidence);

-- ============================================
-- PERSON ENTITIES
-- ============================================

CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    ipn VARCHAR(20),
    passport VARCHAR(50),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    middle_name VARCHAR(255),
    full_name VARCHAR(1024),
    date_of_birth DATE,
    place_of_birth VARCHAR(255),
    gender VARCHAR(10),
    citizenship VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_persons_entity_id ON persons(entity_id);
CREATE INDEX idx_persons_ipn ON persons(ipn);
CREATE INDEX idx_persons_passport ON persons(passport);

-- ============================================
-- COMPANY ENTITIES
-- ============================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    edrpou VARCHAR(20),
    company_name VARCHAR(1024),
    short_name VARCHAR(512),
    legal_form VARCHAR(100),
    registration_date DATE,
    status VARCHAR(50),
    address_id UUID,
    tax_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_companies_entity_id ON companies(entity_id);
CREATE INDEX idx_companies_edrpou ON companies(edrpou);
CREATE INDEX idx_companies_company_name ON companies(company_name);

-- ============================================
-- FOP ENTITIES
-- ============================================

CREATE TABLE fops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    ipn VARCHAR(20),
    full_name VARCHAR(1024),
    registration_date DATE,
    status VARCHAR(50),
    activity_types JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fops_entity_id ON fops(entity_id);
CREATE INDEX idx_fops_ipn ON fops(ipn);

-- ============================================
-- ADDRESSES
-- ============================================

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    country VARCHAR(100),
    region VARCHAR(255),
    city VARCHAR(255),
    street VARCHAR(512),
    building VARCHAR(50),
    apartment VARCHAR(50),
    postal_code VARCHAR(20),
    full_address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_addresses_entity_id ON addresses(entity_id);

-- ============================================
-- PHONES
-- ============================================

CREATE TABLE phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) NOT NULL REFERENCES entities(entity_id),
    phone_number VARCHAR(50) NOT NULL,
    phone_type VARCHAR(20),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_phones_entity_id ON phones(entity_id);
CREATE INDEX idx_phones_phone_number ON phones(phone_number);

-- ============================================
-- EMAILS
-- ============================================

CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) NOT NULL REFERENCES entities(entity_id),
    email_address VARCHAR(255) NOT NULL,
    email_type VARCHAR(20),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_emails_entity_id ON emails(entity_id);
CREATE INDEX idx_emails_email_address ON emails(email_address);

-- ============================================
-- DOCUMENTS
-- ============================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    document_type VARCHAR(50),
    document_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    issuing_authority VARCHAR(255),
    document_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_entity_id ON documents(entity_id);
CREATE INDEX idx_documents_document_number ON documents(document_number);

-- ============================================
-- RELATIVES
-- ============================================

CREATE TABLE relatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    relationship_type VARCHAR(50) NOT NULL,
    related_to_entity_id VARCHAR(255) REFERENCES entities(entity_id),
    degree_of_kinship VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_relatives_entity_id ON relatives(entity_id);
CREATE INDEX idx_relatives_related_to_entity_id ON relatives(related_to_entity_id);

-- ============================================
-- COURT CASES
-- ============================================

CREATE TABLE court_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    case_number VARCHAR(255) NOT NULL,
    court_name VARCHAR(255),
    case_type VARCHAR(100),
    case_status VARCHAR(50),
    filing_date DATE,
    decision_date DATE,
    case_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_court_cases_entity_id ON court_cases(entity_id);
CREATE INDEX idx_court_cases_case_number ON court_cases(case_number);

-- ============================================
-- SANCTIONS
-- ============================================

CREATE TABLE sanctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    sanction_type VARCHAR(100) NOT NULL,
    sanctioning_authority VARCHAR(255),
    imposition_date DATE,
    expiration_date DATE,
    reason TEXT,
    sanction_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sanctions_entity_id ON sanctions(entity_id);
CREATE INDEX idx_sanctions_sanction_type ON sanctions(sanction_type);

-- ============================================
-- LICENSES
-- ============================================

CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    license_type VARCHAR(100) NOT NULL,
    license_number VARCHAR(255),
    issuing_authority VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    license_status VARCHAR(50),
    license_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_licenses_entity_id ON licenses(entity_id);
CREATE INDEX idx_licenses_license_number ON licenses(license_number);

-- ============================================
-- DECLARATIONS
-- ============================================

CREATE TABLE declarations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    declaration_type VARCHAR(100) NOT NULL,
    declaration_year INTEGER,
    submission_date DATE,
    income DECIMAL(20,2),
    assets_value DECIMAL(20,2),
    declaration_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_declarations_entity_id ON declarations(entity_id);
CREATE INDEX idx_declarations_declaration_year ON declarations(declaration_year);

-- ============================================
-- TAX STATUS
-- ============================================

CREATE TABLE tax_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    tax_id VARCHAR(50),
    tax_status VARCHAR(50),
    tax_debt DECIMAL(20,2),
    last_payment_date DATE,
    tax_authority VARCHAR(255),
    tax_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tax_status_entity_id ON tax_status(entity_id);
CREATE INDEX idx_tax_status_tax_id ON tax_status(tax_id);

-- ============================================
-- DEBTS
-- ============================================

CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    debt_type VARCHAR(100) NOT NULL,
    creditor VARCHAR(255),
    amount DECIMAL(20,2),
    currency VARCHAR(10),
    due_date DATE,
    debt_status VARCHAR(50),
    debt_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_debts_entity_id ON debts(entity_id);
CREATE INDEX idx_debts_debt_status ON debts(debt_status);

-- ============================================
-- ASSETS
-- ============================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    asset_type VARCHAR(100) NOT NULL,
    asset_description TEXT,
    value DECIMAL(20,2),
    currency VARCHAR(10),
    acquisition_date DATE,
    location VARCHAR(255),
    asset_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assets_entity_id ON assets(entity_id);
CREATE INDEX idx_assets_asset_type ON assets(asset_type);

-- ============================================
-- TENDERS
-- ============================================

CREATE TABLE tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    tender_id VARCHAR(255) NOT NULL,
    tender_title TEXT,
    procuring_entity VARCHAR(255),
    tender_value DECIMAL(20,2),
    currency VARCHAR(10),
    award_date DATE,
    tender_status VARCHAR(50),
    tender_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tenders_entity_id ON tenders(entity_id);
CREATE INDEX idx_tenders_tender_id ON tenders(tender_id);

-- ============================================
-- EXECUTIVE CASES
-- ============================================

CREATE TABLE executive_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    executive_proceeding_number VARCHAR(255) NOT NULL,
    executive_authority VARCHAR(255),
    proceeding_type VARCHAR(100),
    proceeding_status VARCHAR(50),
    initiation_date DATE,
    debt_amount DECIMAL(20,2),
    executive_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_executive_cases_entity_id ON executive_cases(entity_id);
CREATE INDEX idx_executive_cases_proceeding_number ON executive_cases(executive_proceeding_number);

-- ============================================
-- RELATIONSHIPS
-- ============================================

CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_entity_id VARCHAR(255) NOT NULL REFERENCES entities(entity_id),
    to_entity_id VARCHAR(255) NOT NULL REFERENCES entities(entity_id),
    relationship_type VARCHAR(50) NOT NULL,
    relationship_data JSONB,
    confidence DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_relationships_from_entity_id ON relationships(from_entity_id);
CREATE INDEX idx_relationships_to_entity_id ON relationships(to_entity_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);

-- ============================================
-- FACTS
-- ============================================

CREATE TABLE facts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fact_id VARCHAR(255) UNIQUE NOT NULL,
    entity_id VARCHAR(255) NOT NULL REFERENCES entities(entity_id),
    fact_type VARCHAR(100) NOT NULL,
    fact_value TEXT NOT NULL,
    fact_data JSONB,
    confidence DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_facts_fact_id ON facts(fact_id);
CREATE INDEX idx_facts_entity_id ON facts(entity_id);
CREATE INDEX idx_facts_fact_type ON facts(fact_type);

-- ============================================
-- EVIDENCE
-- ============================================

CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evidence_id VARCHAR(255) UNIQUE NOT NULL,
    fact_id VARCHAR(255) NOT NULL REFERENCES facts(fact_id),
    source VARCHAR(255) NOT NULL,
    dataset_id VARCHAR(255) NOT NULL REFERENCES datasets(dataset_id),
    resource_id VARCHAR(255) NOT NULL REFERENCES resources(resource_id),
    raw_record_id VARCHAR(255) NOT NULL REFERENCES raw_records(raw_record_id),
    raw_hash VARCHAR(64) NOT NULL,
    parser_version VARCHAR(50),
    mapping_version VARCHAR(50),
    normalizer_version VARCHAR(50),
    entity_resolution_version VARCHAR(50),
    card_contract_version VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_evidence_evidence_id ON evidence(evidence_id);
CREATE INDEX idx_evidence_fact_id ON evidence(fact_id);
CREATE INDEX idx_evidence_raw_record_id ON evidence(raw_record_id);

-- ============================================
-- ENTITY MATCHES
-- ============================================

CREATE TABLE entity_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) NOT NULL REFERENCES entities(entity_id),
    source_record_id VARCHAR(255) NOT NULL,
    match_score DECIMAL(5,4) NOT NULL,
    match_reasons JSONB NOT NULL,
    confidence DECIMAL(5,4),
    evidence_ids JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_entity_matches_entity_id ON entity_matches(entity_id);
CREATE INDEX idx_entity_matches_source_record_id ON entity_matches(source_record_id);

-- ============================================
-- CARD INSTANCES
-- ============================================

CREATE TABLE card_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id VARCHAR(255) UNIQUE NOT NULL,
    entity_id VARCHAR(255) NOT NULL REFERENCES entities(entity_id),
    card_type VARCHAR(50) NOT NULL,
    card_data JSONB NOT NULL,
    status VARCHAR(50) NOT NULL,
    minimum_confidence DECIMAL(5,4),
    actual_confidence DECIMAL(5,4),
    empty_allowed BOOLEAN DEFAULT false,
    empty_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_card_instances_card_id ON card_instances(card_id);
CREATE INDEX idx_card_instances_entity_id ON card_instances(entity_id);
CREATE INDEX idx_card_instances_status ON card_instances(status);

-- ============================================
-- CARD FIELDS
-- ============================================

CREATE TABLE card_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id VARCHAR(255) NOT NULL REFERENCES card_instances(card_id),
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    field_status VARCHAR(50) NOT NULL,
    field_confidence DECIMAL(5,4),
    evidence_id VARCHAR(255) REFERENCES evidence(evidence_id),
    validation_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_card_fields_card_id ON card_fields(card_id);
CREATE INDEX idx_card_fields_field_name ON card_fields(field_name);
CREATE INDEX idx_card_fields_field_status ON card_fields(field_status);

-- ============================================
-- VALIDATION RESULTS
-- ============================================

CREATE TABLE validation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation_id VARCHAR(255) UNIQUE NOT NULL,
    card_id VARCHAR(255) NOT NULL REFERENCES card_instances(card_id),
    validation_type VARCHAR(50) NOT NULL,
    validation_status VARCHAR(50) NOT NULL,
    validation_data JSONB,
    tested_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_validation_results_card_id ON validation_results(card_id);
CREATE INDEX idx_validation_results_validation_type ON validation_results(validation_type);

-- ============================================
-- INCIDENTS
-- ============================================

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(255) UNIQUE NOT NULL,
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    affected_card_id VARCHAR(255) REFERENCES card_instances(card_id),
    affected_entity_id VARCHAR(255) REFERENCES entities(entity_id),
    affected_resource_id VARCHAR(255) REFERENCES resources(resource_id),
    diagnostic_data JSONB,
    remediation_attempts INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_incidents_incident_id ON incidents(incident_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_ingestion_runs_updated_at BEFORE UPDATE ON ingestion_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON datasets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fops_updated_at BEFORE UPDATE ON fops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_phones_updated_at BEFORE UPDATE ON phones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facts_updated_at BEFORE UPDATE ON facts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_card_instances_updated_at BEFORE UPDATE ON card_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_card_fields_updated_at BEFORE UPDATE ON card_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
