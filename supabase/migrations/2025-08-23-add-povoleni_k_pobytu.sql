-- Migration: přidat nový list_type 'povoleni_k_pobytu' do admin_lists CHECK a vložit výchozí položku
-- Datum: 2025-08-23
-- Poznámka: Spusťte v Supabase SQL editoru. Doporučená záloha DB před provedením.

BEGIN;

-- Ujistíme se, že rozšíření pro UUID existuje (nemělo by to nic zlomit pokud již existuje)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Odstraníme starý constraint (IF EXISTS) a nahradíme ho rozšířenou verzí
ALTER TABLE admin_lists
  DROP CONSTRAINT IF EXISTS admin_lists_list_type_check;

ALTER TABLE admin_lists
  ADD CONSTRAINT admin_lists_list_type_check
  CHECK (list_type IN (
    'titles',
    'marital_statuses',
    'document_types',
    'banks',
    'institutions',
    'liability_types',
    'povoleni_k_pobytu'
  ));

-- Vložíme počáteční řádek pro nový seznam, pokud ještě neexistuje
INSERT INTO admin_lists (list_type, items, updated_at)
SELECT 'povoleni_k_pobytu', '["povolení k pobytu"]'::jsonb, now()
WHERE NOT EXISTS (SELECT 1 FROM admin_lists WHERE list_type = 'povoleni_k_pobytu');

COMMIT;

-- End of migration
