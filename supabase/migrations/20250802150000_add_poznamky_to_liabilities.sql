-- Přidání sloupce poznamky do tabulky liabilities
ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS poznamky TEXT;

-- Přidání rodné příjmení pokud ještě neexistuje
ALTER TABLE clients ADD COLUMN IF NOT EXISTS applicant_maiden_name VARCHAR;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS co_applicant_maiden_name VARCHAR;
