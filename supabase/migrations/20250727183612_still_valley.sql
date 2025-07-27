```sql
-- supabase/migrations/20250727183552_add_housing_type_to_clients.sql

-- Přidání sloupců pro typ bydlení žadatele a spolužadatele do tabulky 'clients'

-- Add applicant_housing_type to clients table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'applicant_housing_type') THEN
    ALTER TABLE clients ADD COLUMN applicant_housing_type text;
  END IF;
END $$;

-- Add co_applicant_housing_type to clients table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'co_applicant_housing_type') THEN
    ALTER TABLE clients ADD COLUMN co_applicant_housing_type text;
  END IF;
END $$;

-- Poznámka: Triggery pro updated_at a RLS politiky pro tabulku clients
-- by měly být již definovány v předchozích migracích (např. 20250726172211_holy_prism.sql).
-- Tato migrace pouze přidává nové sloupce.
```