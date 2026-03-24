/**
 * Ejecuta la migración 20250321120000_fix_companies_company_type.sql
 * Añade company_type, description, contact_name, contact_phone a companies.
 *
 * REQUISITO: SUPABASE_DB_URL en .env.local
 * Supabase Dashboard > Project Settings > Database > Connection string (URI)
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cargar .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }
}

const BUSINESS_SCHEMA =
  process.env.NEXT_PUBLIC_BUSINESS_SCHEMA || "tradexpar";

const MIGRATION_SQL = `
ALTER TABLE ${BUSINESS_SCHEMA}.companies ADD COLUMN IF NOT EXISTS company_type TEXT NOT NULL DEFAULT 'personalizado';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_company_type_check'
  ) THEN
    ALTER TABLE ${BUSINESS_SCHEMA}.companies ADD CONSTRAINT companies_company_type_check
      CHECK (company_type IN ('ecommerce', 'inmobiliaria', 'servicios', 'personalizado'));
  END IF;
END $$;

ALTER TABLE ${BUSINESS_SCHEMA}.companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ${BUSINESS_SCHEMA}.companies ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE ${BUSINESS_SCHEMA}.companies ADD COLUMN IF NOT EXISTS contact_phone TEXT;

NOTIFY pgrst, 'reload schema';
`;

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error(`
ERROR: Falta SUPABASE_DB_URL en .env.local

1. Ve a Supabase Dashboard > Project Settings > Database
2. Copia la "Connection string" (URI) - modo Session o Transaction
3. Añade a .env.local:
   SUPABASE_DB_URL=postgresql://postgres:TU_PASSWORD@tu-host:5432/postgres

4. Ejecuta: node scripts/run-migration-fix-companies.mjs
`);
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    console.log("Conectado a Supabase. Ejecutando migración...");
    await client.query(MIGRATION_SQL);
    console.log("OK: Migración 20250321120000 aplicada correctamente.");

    // Verificar columnas
    const res = await client.query(
      `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = 'companies'
      ORDER BY ordinal_position
    `,
      [BUSINESS_SCHEMA]
    );
    console.log("\nColumnas de companies:");
    for (const r of res.rows) {
      console.log(`  - ${r.column_name}: ${r.data_type} ${r.is_nullable === "YES" ? "NULL" : "NOT NULL"}`);
    }

    const hasCompanyType = res.rows.some((r) => r.column_name === "company_type");
    if (!hasCompanyType) {
      console.error("\nERROR: company_type no se añadió. Revisa la migración.");
      process.exit(1);
    }
    console.log("\nValidación OK. Tabla companies lista para onboarding.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
