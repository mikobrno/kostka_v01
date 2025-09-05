-- Přidání status sloupce do clients tabulky
ALTER TABLE clients 
ADD COLUMN status VARCHAR DEFAULT 'waiting' CHECK (status IN ('waiting', 'inquiry', 'offer', 'completion', 'signing', 'drawdown', 'completed'));

-- Vytvoření indexu pro lepší výkon při filtrování
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Aktualizace existujících klientů na výchozí stav
UPDATE clients SET status = 'inquiry' WHERE status IS NULL;
