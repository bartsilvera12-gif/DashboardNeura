-- Logs de uso de la API pública (supervisión super admin)

CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_logs_company ON api_logs(company_id);
CREATE INDEX idx_api_logs_created ON api_logs(created_at DESC);

-- RLS: solo super admin puede leer; escritura vía service role (API routes)
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_logs_super_admin_read" ON api_logs
  FOR SELECT USING (public.is_super_admin());

-- No hay política INSERT: solo service_role puede insertar desde los route handlers.

NOTIFY pgrst, 'reload schema';
