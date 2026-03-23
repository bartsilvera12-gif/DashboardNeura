-- Fix: Crear tabla company_branding si no existe
-- Soluciona: "Error al configurar el branding de la empresa" en onboarding

CREATE TABLE IF NOT EXISTS company_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  display_name TEXT,
  logo_url TEXT,
  primary_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS company_branding_updated_at ON company_branding;
CREATE TRIGGER company_branding_updated_at
  BEFORE UPDATE ON company_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

NOTIFY pgrst, 'reload schema';
