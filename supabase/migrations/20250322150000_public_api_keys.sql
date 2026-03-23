-- API Keys para tiendas frontend (Lovable, etc.)
-- Cada API_KEY se asocia a una empresa (company_id)

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_company ON api_keys(company_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- Payment intents: intentos de pago para órdenes (preparado para PagoPar/Bancard)
CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  provider TEXT,
  amount DECIMAL(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_link TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_payment_intents_reference ON payment_intents(reference);
CREATE INDEX idx_payment_intents_order ON payment_intents(order_id);
CREATE INDEX idx_payment_intents_company ON payment_intents(company_id);

-- RLS: api_keys y payment_intents solo accesibles con service role (usado en API pública)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- Usuarios con acceso a empresa pueden gestionar sus api_keys desde el ERP
CREATE POLICY "api_keys_company_admin" ON api_keys
  FOR ALL USING (
    company_id IS NOT NULL AND public.usuario_tiene_acceso_empresa(company_id)
  );

CREATE POLICY "payment_intents_company_admin" ON payment_intents
  FOR ALL USING (
    company_id IS NOT NULL AND public.usuario_tiene_acceso_empresa(company_id)
  );

NOTIFY pgrst, 'reload schema';
