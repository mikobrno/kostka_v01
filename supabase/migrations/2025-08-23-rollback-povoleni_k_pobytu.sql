-- Rollback: odebrat 'povoleni_k_pobytu' z admin_lists a obnovit původní CHECK
-- Datum: 2025-08-23
-- Poznámka: Spusťte pouze pokud chcete vrátit změnu z migration souboru.

BEGIN;

-- Smažeme záznam pokud existuje
DELETE FROM admin_lists WHERE list_type = 'povoleni_k_pobytu';

-- Obnovíme CHECK constraint bez 'povoleni_k_pobytu'
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
    'liability_types'
  ));

COMMIT;

-- End of rollback
