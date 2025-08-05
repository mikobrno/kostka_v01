-- Přidání tabulky documents pro správu dokladů totožnosti
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    parent_type VARCHAR NOT NULL CHECK (parent_type IN ('applicant', 'co_applicant')),
    document_type VARCHAR,
    document_number VARCHAR,
    document_issue_date DATE,
    document_valid_until DATE,
    issuing_authority VARCHAR,
    place_of_birth VARCHAR,
    control_number VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vytvoření indexu pro lepší výkon
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);

-- Přidání RLS politik pro bezpečnost
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Vytvoření RLS politik
CREATE POLICY "Users can manage documents through clients"
    ON documents FOR ALL
    USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = documents.client_id
        AND clients.user_id = auth.uid()
    ));
