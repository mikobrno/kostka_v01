/*
  # Client Data Management System Enhancements

  This migration implements the comprehensive system enhancements including:
  1. Document management enhancement (multiple documents)
  2. Personal data expansion (maiden name, citizenship)
  3. Income section implementation
  4. Business section implementation
  5. Enhanced indexing for performance

  ## Changes Made:
  - Multiple documents per client
  - Enhanced personal data fields
  - Complete income tracking system
  - Business information management
  - Search optimization indexes
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DOCUMENT MANAGEMENT ENHANCEMENT
-- Drop existing single document fields and create new documents table
CREATE TABLE IF NOT EXISTS client_documents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('občanský průkaz', 'pas', 'řidičský průkaz')),
  document_number text NOT NULL,
  issue_date date NOT NULL,
  valid_until date NOT NULL,
  issuing_authority text NOT NULL,
  place_of_birth text NOT NULL,
  control_number text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. PERSONAL DATA EXPANSION
-- Add new personal data fields to existing clients table
DO $$
BEGIN
  -- Add maiden name fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'applicant_maiden_name') THEN
    ALTER TABLE clients ADD COLUMN applicant_maiden_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'co_applicant_maiden_name') THEN
    ALTER TABLE clients ADD COLUMN co_applicant_maiden_name text;
  END IF;
  
  -- Add citizenship fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'applicant_citizenship') THEN
    ALTER TABLE clients ADD COLUMN applicant_citizenship text DEFAULT 'Česká republika';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'co_applicant_citizenship') THEN
    ALTER TABLE clients ADD COLUMN co_applicant_citizenship text DEFAULT 'Česká republika';
  END IF;
END $$;

-- 3. INCOME SECTION IMPLEMENTATION
CREATE TABLE IF NOT EXISTS client_income (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  person_type text CHECK (person_type IN ('applicant', 'co_applicant')) NOT NULL,
  
  -- Employment Income
  gross_salary numeric(12,2),
  net_salary numeric(12,2),
  employment_type text CHECK (employment_type IN ('permanent', 'temporary', 'self_employed', 'unemployed')),
  employment_duration_months integer,
  employer_name text,
  position text,
  
  -- Additional Income Sources
  rental_income numeric(12,2) DEFAULT 0,
  investment_income numeric(12,2) DEFAULT 0,
  pension_income numeric(12,2) DEFAULT 0,
  social_benefits numeric(12,2) DEFAULT 0,
  other_income numeric(12,2) DEFAULT 0,
  other_income_description text,
  
  -- Deductions
  tax_deductions numeric(12,2) DEFAULT 0,
  social_insurance numeric(12,2) DEFAULT 0,
  health_insurance numeric(12,2) DEFAULT 0,
  union_fees numeric(12,2) DEFAULT 0,
  
  -- Total Calculations
  total_gross_income numeric(12,2) GENERATED ALWAYS AS (
    COALESCE(gross_salary, 0) + 
    COALESCE(rental_income, 0) + 
    COALESCE(investment_income, 0) + 
    COALESCE(pension_income, 0) + 
    COALESCE(social_benefits, 0) + 
    COALESCE(other_income, 0)
  ) STORED,
  
  total_deductions numeric(12,2) GENERATED ALWAYS AS (
    COALESCE(tax_deductions, 0) + 
    COALESCE(social_insurance, 0) + 
    COALESCE(health_insurance, 0) + 
    COALESCE(union_fees, 0)
  ) STORED,
  
  net_disposable_income numeric(12,2) GENERATED ALWAYS AS (
    COALESCE(gross_salary, 0) + 
    COALESCE(rental_income, 0) + 
    COALESCE(investment_income, 0) + 
    COALESCE(pension_income, 0) + 
    COALESCE(social_benefits, 0) + 
    COALESCE(other_income, 0) -
    COALESCE(tax_deductions, 0) - 
    COALESCE(social_insurance, 0) - 
    COALESCE(health_insurance, 0) - 
    COALESCE(union_fees, 0)
  ) STORED,
  
  -- Documentation
  income_proof_type text CHECK (income_proof_type IN ('payslip', 'tax_return', 'bank_statement', 'employer_confirmation', 'other')),
  verification_date date,
  verified_by text,
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. BUSINESS SECTION IMPLEMENTATION
CREATE TABLE IF NOT EXISTS client_businesses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Business Information
  ico text NOT NULL, -- Czech Business ID
  company_name text NOT NULL,
  legal_form text, -- s.r.o., a.s., OSVČ, etc.
  registration_date date,
  business_address text,
  business_activity text,
  nace_code text, -- Economic activity classification
  
  -- Financial Information
  annual_revenue numeric(15,2),
  employee_count integer,
  share_percentage numeric(5,2), -- Client's ownership percentage
  position_in_company text, -- CEO, Owner, Partner, etc.
  
  -- Contact Information
  business_phone text,
  business_email text,
  website text,
  
  -- Registry Integration
  registry_data jsonb, -- Store full API response from Business Registry
  last_sync_date timestamptz,
  sync_status text DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'manual')),
  sync_error text,
  
  -- Status
  is_active boolean DEFAULT true,
  business_status text DEFAULT 'active' CHECK (business_status IN ('active', 'inactive', 'dissolved', 'bankruptcy')),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. ENHANCED ADDRESS HANDLING
-- Add map link generation capability
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'applicant_address_coordinates') THEN
    ALTER TABLE clients ADD COLUMN applicant_address_coordinates point;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'co_applicant_address_coordinates') THEN
    ALTER TABLE clients ADD COLUMN co_applicant_address_coordinates point;
  END IF;
END $$;

-- Add coordinates to properties table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'coordinates') THEN
    ALTER TABLE properties ADD COLUMN coordinates point;
  END IF;
END $$;

-- 6. INDEXES FOR PERFORMANCE OPTIMIZATION
-- Document search indexes
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_type ON client_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_client_documents_number ON client_documents(document_number);

-- Income search indexes
CREATE INDEX IF NOT EXISTS idx_client_income_client_id ON client_income(client_id);
CREATE INDEX IF NOT EXISTS idx_client_income_person_type ON client_income(person_type);
CREATE INDEX IF NOT EXISTS idx_client_income_employment_type ON client_income(employment_type);

-- Business search indexes
CREATE INDEX IF NOT EXISTS idx_client_businesses_client_id ON client_businesses(client_id);
CREATE INDEX IF NOT EXISTS idx_client_businesses_ico ON client_businesses(ico);
CREATE INDEX IF NOT EXISTS idx_client_businesses_company_name ON client_businesses USING gin(company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_client_businesses_status ON client_businesses(business_status);

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 7. ROW LEVEL SECURITY POLICIES
-- Documents policies
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage documents of their clients" ON client_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_documents.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Income policies
ALTER TABLE client_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage income of their clients" ON client_income
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_income.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Business policies
ALTER TABLE client_businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage businesses of their clients" ON client_businesses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_businesses.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- 8. TRIGGERS FOR AUTOMATIC UPDATES
-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
CREATE TRIGGER update_client_documents_updated_at 
  BEFORE UPDATE ON client_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_income_updated_at 
  BEFORE UPDATE ON client_income
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_businesses_updated_at 
  BEFORE UPDATE ON client_businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. DATA MIGRATION FROM EXISTING STRUCTURE
-- Migrate existing document data to new documents table
INSERT INTO client_documents (
  client_id,
  document_type,
  document_number,
  issue_date,
  valid_until,
  issuing_authority,
  place_of_birth,
  control_number,
  is_primary
)
SELECT 
  id as client_id,
  COALESCE(applicant_document_type, 'občanský průkaz') as document_type,
  COALESCE(applicant_document_number, '') as document_number,
  COALESCE(applicant_document_issue_date, CURRENT_DATE) as issue_date,
  COALESCE(applicant_document_valid_until, CURRENT_DATE + INTERVAL '10 years') as valid_until,
  'Magistrát' as issuing_authority, -- Default value, should be updated
  'Praha' as place_of_birth, -- Default value, should be updated
  '' as control_number, -- Will need to be filled manually
  true as is_primary
FROM clients 
WHERE applicant_document_number IS NOT NULL
ON CONFLICT DO NOTHING;

-- Add co-applicant documents if they exist
INSERT INTO client_documents (
  client_id,
  document_type,
  document_number,
  issue_date,
  valid_until,
  issuing_authority,
  place_of_birth,
  control_number,
  is_primary
)
SELECT 
  id as client_id,
  COALESCE(co_applicant_document_type, 'občanský průkaz') as document_type,
  COALESCE(co_applicant_document_number, '') as document_number,
  COALESCE(co_applicant_document_issue_date, CURRENT_DATE) as issue_date,
  COALESCE(co_applicant_document_valid_until, CURRENT_DATE + INTERVAL '10 years') as valid_until,
  'Magistrát' as issuing_authority, -- Default value, should be updated
  'Praha' as place_of_birth, -- Default value, should be updated
  '' as control_number, -- Will need to be filled manually
  false as is_primary
FROM clients 
WHERE co_applicant_document_number IS NOT NULL
ON CONFLICT DO NOTHING;

-- 10. VIEWS FOR EASY DATA ACCESS
-- Complete client view with all related data
CREATE OR REPLACE VIEW client_complete_view AS
SELECT 
  c.*,
  -- Document count
  (SELECT COUNT(*) FROM client_documents cd WHERE cd.client_id = c.id) as document_count,
  -- Income information
  (SELECT ci.net_disposable_income FROM client_income ci WHERE ci.client_id = c.id AND ci.person_type = 'applicant' LIMIT 1) as applicant_income,
  (SELECT ci.net_disposable_income FROM client_income ci WHERE ci.client_id = c.id AND ci.person_type = 'co_applicant' LIMIT 1) as co_applicant_income,
  -- Business count
  (SELECT COUNT(*) FROM client_businesses cb WHERE cb.client_id = c.id AND cb.is_active = true) as active_business_count,
  -- Property information
  p.address as property_address,
  p.price as property_price
FROM clients c
LEFT JOIN properties p ON p.client_id = c.id;

-- Business search view
CREATE OR REPLACE VIEW business_search_view AS
SELECT 
  cb.*,
  c.applicant_first_name,
  c.applicant_last_name,
  c.applicant_email,
  c.applicant_phone
FROM client_businesses cb
JOIN clients c ON c.id = cb.client_id
WHERE cb.is_active = true;