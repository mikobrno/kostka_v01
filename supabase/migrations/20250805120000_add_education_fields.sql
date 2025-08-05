-- Přidání polí pro nejvyšší dosažené vzdělání žadatele a spolužadatele
ALTER TABLE clients 
ADD COLUMN applicant_education VARCHAR,
ADD COLUMN co_applicant_education VARCHAR;