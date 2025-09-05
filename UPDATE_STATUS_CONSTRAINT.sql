-- Aktualizace CHECK constraint pro přidání stavu "archived"
-- Spusť tento SQL příkaz v Supabase Dashboard → SQL Editor

-- 1. Nejdříve odstraň starý constraint (pokud existuje)
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;

-- 2. Přidej nový constraint s "archived"
ALTER TABLE clients ADD CONSTRAINT clients_status_check 
CHECK (status IN ('waiting', 'inquiry', 'offer', 'completion', 'signing', 'drawdown', 'completed', 'archived'));

-- 3. Ověř, že vše funguje
SELECT DISTINCT status FROM clients ORDER BY status;
