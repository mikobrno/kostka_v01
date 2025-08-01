-- Vytvoření tabulky clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Žadatel
    applicant_title VARCHAR,
    applicant_first_name VARCHAR,
    applicant_last_name VARCHAR,
    applicant_birth_number VARCHAR,
    applicant_housing_type VARCHAR,
    applicant_age INTEGER,
    applicant_birth_year INTEGER,
    applicant_birth_date DATE,
    applicant_marital_status VARCHAR,
    applicant_permanent_address JSONB,
    applicant_contact_address JSONB,
    applicant_document_type VARCHAR,
    applicant_document_number VARCHAR,
    applicant_document_issue_date DATE,
    applicant_document_valid_until DATE,
    applicant_phone VARCHAR,
    applicant_email VARCHAR,
    applicant_bank VARCHAR,
    -- Spolužadatel
    co_applicant_title VARCHAR,
    co_applicant_first_name VARCHAR,
    co_applicant_last_name VARCHAR,
    co_applicant_birth_number VARCHAR,
    co_applicant_age INTEGER,
    co_applicant_birth_year INTEGER,
    co_applicant_birth_date DATE,
    co_applicant_marital_status VARCHAR,
    co_applicant_permanent_address JSONB,
    co_applicant_contact_address JSONB,
    co_applicant_document_type VARCHAR,
    co_applicant_document_number VARCHAR,
    co_applicant_document_issue_date DATE,
    co_applicant_document_valid_until DATE,
    co_applicant_phone VARCHAR,
    co_applicant_email VARCHAR,
    co_applicant_bank VARCHAR
);

-- Vytvoření tabulky employers
CREATE TABLE IF NOT EXISTS employers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    employer_type VARCHAR NOT NULL CHECK (employer_type IN ('applicant', 'co_applicant')),
    ico VARCHAR,
    company_name VARCHAR,
    company_address JSONB,
    net_income DECIMAL,
    job_position VARCHAR,
    employed_since DATE,
    contract_type VARCHAR,
    contract_from_date DATE,
    contract_to_date DATE,
    contract_extended BOOLEAN
);

-- Vytvoření tabulky properties
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    address JSONB,
    price DECIMAL
);

-- Vytvoření tabulky children
CREATE TABLE IF NOT EXISTS children (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    parent_type VARCHAR NOT NULL CHECK (parent_type IN ('applicant', 'co_applicant')),
    name VARCHAR,
    birth_date DATE,
    age INTEGER
);

-- Vytvoření tabulky liabilities
CREATE TABLE IF NOT EXISTS liabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    institution VARCHAR,
    type VARCHAR,
    amount DECIMAL,
    payment DECIMAL,
    balance DECIMAL
);

-- Vytvoření indexů pro lepší výkon
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_employers_client_id ON employers(client_id);
CREATE INDEX IF NOT EXISTS idx_properties_client_id ON properties(client_id);
CREATE INDEX IF NOT EXISTS idx_children_client_id ON children(client_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_client_id ON liabilities(client_id);

-- Přidání RLS politik pro bezpečnost
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;

-- Vytvoření RLS politik
CREATE POLICY "Users can view their own clients"
    ON clients FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
    ON clients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
    ON clients FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
    ON clients FOR DELETE
    USING (auth.uid() = user_id);

-- Politiky pro související tabulky
CREATE POLICY "Users can manage employers through clients"
    ON employers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = employers.client_id
        AND clients.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage properties through clients"
    ON properties FOR ALL
    USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = properties.client_id
        AND clients.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage children through clients"
    ON children FOR ALL
    USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = children.client_id
        AND clients.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage liabilities through clients"
    ON liabilities FOR ALL
    USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = liabilities.client_id
        AND clients.user_id = auth.uid()
    ));
