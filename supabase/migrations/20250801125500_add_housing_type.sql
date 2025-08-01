-- Add housing type column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS applicant_housing_type text;

-- Add housing type column for co-applicant as well for consistency
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS co_applicant_housing_type text;
