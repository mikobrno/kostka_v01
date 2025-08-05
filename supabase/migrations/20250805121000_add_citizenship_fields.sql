-- Přidání polí pro občanství žadatele a spolužadatele
ALTER TABLE clients 
ADD COLUMN applicant_citizenship VARCHAR,
ADD COLUMN co_applicant_citizenship VARCHAR;