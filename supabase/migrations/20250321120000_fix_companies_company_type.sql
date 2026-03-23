-- Fix: Añadir columnas faltantes a companies para onboarding
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_type TEXT NOT NULL DEFAULT 'personalizado';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'companies_company_type_check'
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT companies_company_type_check
      CHECK (company_type IN ('ecommerce', 'inmobiliaria', 'servicios', 'personalizado'));
  END IF;
END $$;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_phone TEXT;

NOTIFY pgrst, 'reload schema';
