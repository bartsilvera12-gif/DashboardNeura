/**
 * Script para generar el reporte completo de la base de datos Supabase.
 * Lee el esquema real desde information_schema y genera docs/BASE_DATOS_COMPLETA.md
 *
 * REQUISITO: Añade a tu .env.local la variable:
 *   SUPABASE_DB_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
 *
 * La obtienes en: Supabase Dashboard > Project Settings > Database > Connection string (URI)
 * Usa el modo "Session" o "Transaction".
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cargar SUPABASE_DB_URL desde .env.local si existe
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

async function main() {
  const REPORT_SCHEMA =
    process.env.NEXT_PUBLIC_BUSINESS_SCHEMA || "tradexpar";

  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error(`
ERROR: Falta SUPABASE_DB_URL en el entorno.

1. Ve a Supabase Dashboard > Project Settings > Database
2. Copia la "Connection string" (URI) en modo Session
3. Añade a .env.local:
   SUPABASE_DB_URL=postgresql://postgres.xxx:TU_PASSWORD@aws-0-xx.pooler.supabase.com:6543/postgres

4. Ejecuta:
   node --env-file=.env.local scripts/generar-reporte-supabase.mjs

   O en PowerShell:
   $env:SUPABASE_DB_URL="tu-connection-string"; node scripts/generar-reporte-supabase.mjs
`);
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    // 1. Tablas del schema de negocio (NEXT_PUBLIC_BUSINESS_SCHEMA, por defecto tradexpar)
    const tablesRes = await client.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `,
      [REPORT_SCHEMA]
    );
    const tables = tablesRes.rows.map((r) => r.table_name);

    // 2. Columnas de cada tabla
    const columnsRes = await client.query(
      `
      SELECT
        c.table_name,
        c.column_name,
        c.data_type,
        c.udt_name,
        c.is_nullable,
        c.column_default,
        c.ordinal_position
      FROM information_schema.columns c
      WHERE c.table_schema = $1
      ORDER BY c.table_name, c.ordinal_position
    `,
      [REPORT_SCHEMA]
    );

    // 3. Claves foráneas
    const fkRes = await client.query(
      `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1
      ORDER BY tc.table_name, kcu.column_name
    `,
      [REPORT_SCHEMA]
    );

    // 4. RLS: tablas con RLS habilitado
    const rlsRes = await client.query(
      `
      SELECT relname AS table_name, relrowsecurity AS rls_enabled
      FROM pg_class
      WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = $1)
        AND relkind = 'r'
      ORDER BY relname
    `,
      [REPORT_SCHEMA]
    );

    // 5. Políticas RLS
    const policiesRes = await client.query(
      `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = $1
      ORDER BY tablename, policyname
    `,
      [REPORT_SCHEMA]
    );

    // 6. Índices
    const idxRes = await client.query(
      `
      SELECT
        t.relname AS table_name,
        i.relname AS index_name,
        a.attname AS column_name,
        ix.indisunique,
        ix.indisprimary
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey) AND a.attisdropped = false
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname = $1 AND t.relkind = 'r'
      ORDER BY t.relname, i.relname
    `,
      [REPORT_SCHEMA]
    );

    // Construir reporte
    const byTable = {};
    for (const r of columnsRes.rows) {
      if (!byTable[r.table_name]) byTable[r.table_name] = [];
      byTable[r.table_name].push(r);
    }

    const fkByTable = {};
    for (const r of fkRes.rows) {
      if (!fkByTable[r.table_name]) fkByTable[r.table_name] = [];
      fkByTable[r.table_name].push(r);
    }

    const rlsByTable = {};
    for (const r of rlsRes.rows) {
      rlsByTable[r.table_name] = r.rls_enabled;
    }

    const policiesByTable = {};
    for (const r of policiesRes.rows) {
      if (!policiesByTable[r.tablename]) policiesByTable[r.tablename] = [];
      policiesByTable[r.tablename].push(r);
    }

    const idxByTable = {};
    for (const r of idxRes.rows) {
      if (!idxByTable[r.table_name]) idxByTable[r.table_name] = [];
      idxByTable[r.table_name].push(r);
    }

    let md = `# Base de Datos Completa - Proyecto "paginas web neura"

**Generado automáticamente** el ${new Date().toISOString().split("T")[0]}  
**Objetivo:** Entender exactamente qué existe en Supabase, para qué sirve, qué afecta qué.

---

# INVENTARIO DE TABLAS (${tables.length} tablas)

`;

    for (const table of tables) {
      const cols = byTable[table] || [];
      const fks = fkByTable[table] || [];
      const rls = rlsByTable[table];
      const policies = policiesByTable[table] || [];
      const indexes = idxByTable[table] || [];

      md += `## Tabla: \`${table}\`

### Columnas

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
`;
      for (const c of cols) {
        const nullable = c.is_nullable === "YES" ? "SÍ" : "NO";
        const def = (c.column_default || "-").toString().slice(0, 50);
        md += `| ${c.column_name} | ${c.udt_name} | ${nullable} | ${def} |\n`;
      }

      if (fks.length > 0) {
        md += `\n### Claves foráneas\n\n`;
        for (const fk of fks) {
          md += `- \`${fk.column_name}\` → \`${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`;
        }
      }

      md += `\n### RLS\n\n`;
      md += `- **Habilitado:** ${rls ? "Sí" : "No"}\n`;
      if (policies.length > 0) {
        md += `- **Políticas:**\n`;
        for (const p of policies) {
          md += `  - \`${p.policyname}\` (${p.cmd || "ALL"}): ${(p.qual || "").slice(0, 80)}...\n`;
        }
      }

      if (indexes.length > 0) {
        const uniqueIndexes = [...new Set(indexes.map((i) => i.index_name))];
        md += `\n### Índices\n\n`;
        for (const iname of uniqueIndexes) {
          const idx = indexes.find((i) => i.index_name === iname);
          const cols = indexes.filter((i) => i.index_name === iname).map((i) => i.column_name);
          const flags = [];
          if (idx?.indisprimary) flags.push("PK");
          if (idx?.indisunique) flags.push("UNIQUE");
          md += `- \`${iname}\` (${cols.join(", ")}) ${flags.length ? `[${flags.join(", ")}]` : ""}\n`;
        }
      }

      md += `\n---\n\n`;
    }

    md += `# RESUMEN

- **Tablas:** ${tables.length}
- **Con RLS:** ${Object.values(rlsByTable).filter(Boolean).length}
- **Políticas RLS totales:** ${policiesRes.rows.length}
`;

    const outPath = path.join(__dirname, "..", "docs", "BASE_DATOS_COMPLETA.md");
    fs.writeFileSync(outPath, md, "utf-8");
    console.log(`Reporte generado: ${outPath}`);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
