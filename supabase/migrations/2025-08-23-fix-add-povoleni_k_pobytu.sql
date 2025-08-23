-- Opravená migrace: rozšíření CHECK constraint o všechny existující list_type
-- včetně přidání 'povoleni_k_pobytu'
-- Datum: 2025-08-23
-- Poznámka: Spusťte v Supabase SQL editoru. Zachovává všechna existující data.

BEGIN;

-- Ujistíme se, že rozšíření pro UUID existuje
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Odstraníme starý constraint a nahradíme ho rozšířenou verzí
-- která zahrnuje všechny aktuálně existující list_type hodnoty
ALTER TABLE admin_lists
  DROP CONSTRAINT IF EXISTS admin_lists_list_type_check;

ALTER TABLE admin_lists
  ADD CONSTRAINT admin_lists_list_type_check
  CHECK (list_type IN (
    -- Původní povolené hodnoty
    'titles',
    'marital_statuses',
    'document_types', 
    'banks',
    'institutions',
    'liability_types',
    -- Existující hodnoty v DB které nebyly v původním CHECK
    'advisors',
    'citizenships',
    'housing_types',
    -- Nová hodnota kterou chceme přidat
    'povoleni_k_pobytu'
  ));

-- Vložíme počáteční řádek pro nový seznam, pokud ještě neexistuje
INSERT INTO admin_lists (list_type, items, updated_at)
SELECT 'povoleni_k_pobytu', '["povolení k pobytu"]'::jsonb, now()
WHERE NOT EXISTS (SELECT 1 FROM admin_lists WHERE list_type = 'povoleni_k_pobytu');

COMMIT;

-- End of migration
