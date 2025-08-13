-- Add missing loan fields

alter table public.loans
  add column if not exists fixation_years integer,
  add column if not exists insurance text,
  add column if not exists maturity_years integer,
  add column if not exists monthly_payment numeric,
  add column if not exists property_value numeric,
  add column if not exists interest_rate numeric;
