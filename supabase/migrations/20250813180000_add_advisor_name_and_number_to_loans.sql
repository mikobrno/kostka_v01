-- Migration: Add advisor_name and advisor_agency_number to loans table
-- Safe for re-runs (IF NOT EXISTS guards)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'advisor_name'
  ) THEN
    ALTER TABLE public.loans ADD COLUMN advisor_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'advisor_agency_number'
  ) THEN
    ALTER TABLE public.loans ADD COLUMN advisor_agency_number text;
  END IF;
END $$;
