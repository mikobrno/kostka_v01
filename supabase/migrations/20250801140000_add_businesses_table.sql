-- Přidání tabulky businesses pro správu informací o podnikání
CREATE TABLE IF NOT EXISTS businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    parent_type VARCHAR NOT NULL CHECK (parent_type IN ('applicant', 'co_applicant')),
    ico VARCHAR,
    company_name VARCHAR,
    company_address JSONB,
    business_start_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vytvoření indexu pro lepší výkon
CREATE INDEX IF NOT EXISTS idx_businesses_client_id ON businesses(client_id);

-- Přidání RLS politik pro bezpečnost
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Vytvoření RLS politik
CREATE POLICY "Users can manage businesses through clients"
    ON businesses FOR ALL
    USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = businesses.client_id
        AND clients.user_id = auth.uid()
    ));
