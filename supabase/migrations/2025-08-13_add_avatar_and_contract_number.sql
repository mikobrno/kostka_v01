-- Migration: add avatar_url to clients, contract_number/signature_date to loans
-- and create storage bucket + policies for client avatars.

-- 1) Clients: avatar_url
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2) Loans: create table if missing + contract_number and signature_date (if not present)
-- Ensure uuid generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  bank text,
  contract_number text,
  signature_date date,
  advisor text,
  loan_amount numeric,
  loan_amount_words text,
  fixation_years integer,
  interest_rate numeric,
  insurance text,
  property_value numeric,
  monthly_payment numeric,
  maturity_years integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- optional: one loan per client (aligns with upsert semantics)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'loans_client_id_unique'
  ) THEN
    CREATE UNIQUE INDEX loans_client_id_unique ON public.loans (client_id);
  END IF;
END $$;

-- Add columns in case table existed already without them
ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS contract_number text;

-- Prefer a date column for signature date; if a text column already exists, keep it as-is
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'signature_date'
  ) THEN
    ALTER TABLE public.loans ADD COLUMN signature_date date;
  END IF;
END $$;

-- 3) Policies for loans (insert/update only for owners of the client row)
-- Guarded by existence checks to avoid duplicates
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'loans' AND policyname = 'app_loans_insert_own_clients'
  ) THEN
    CREATE POLICY "app_loans_insert_own_clients" ON public.loans
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = client_id AND c.user_id = auth.uid()
      )
    );
  END IF;
  
  IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'loans' AND policyname = 'app_loans_update_own_clients'
  ) THEN
    CREATE POLICY "app_loans_update_own_clients" ON public.loans
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = client_id AND c.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = client_id AND c.user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'loans' AND policyname = 'app_loans_select_own_clients'
  ) THEN
    CREATE POLICY "app_loans_select_own_clients" ON public.loans
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = client_id AND c.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 4) Clients update policy for avatar (optional: here we allow update when user owns the client)
DO $$
BEGIN
  IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'app_clients_update_own'
  ) THEN
    CREATE POLICY "app_clients_update_own" ON public.clients
    FOR UPDATE TO authenticated
    USING ( user_id = auth.uid() )
    WITH CHECK ( user_id = auth.uid() );
  END IF;
END $$;

-- 5) Storage bucket for client files (avatars) + public read
-- Create bucket if not exists
DO $$
BEGIN
  PERFORM 1 FROM storage.buckets WHERE id = 'client-files';
  IF NOT FOUND THEN
    PERFORM storage.create_bucket('client-files', public => true);
  END IF;
END $$;

-- Storage policies: public read, authenticated insert (guarded by bucket_id)
DO $$
BEGIN
  IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'app_storage_client_files_public_read'
  ) THEN
    CREATE POLICY "app_storage_client_files_public_read" ON storage.objects
    FOR SELECT TO public
    USING ( bucket_id = 'client-files' );
  END IF;

  IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'app_storage_client_files_insert_auth'
  ) THEN
    CREATE POLICY "app_storage_client_files_insert_auth" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK ( bucket_id = 'client-files' );
  END IF;
END $$;
