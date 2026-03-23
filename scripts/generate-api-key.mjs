#!/usr/bin/env node
/**
 * Genera una API key para una empresa.
 * Uso: node scripts/generate-api-key.mjs <company_id>
 *
 * Requiere: .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([^#=]+)=(.+)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }
}
import { createHash, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

const KEY_PREFIX = "neura_";
const KEY_PREFIX_LENGTH = 8;

function hashKey(key) {
  return createHash("sha256").update(key).digest("hex");
}

async function main() {
  const companyId = process.argv[2];
  if (!companyId) {
    console.error("Uso: node scripts/generate-api-key.mjs <company_id>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  const rawKey = KEY_PREFIX + randomBytes(24).toString("base64url");
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, KEY_PREFIX_LENGTH);

  const { error } = await supabase.from("api_keys").insert({
    company_id: companyId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name: "API Key generada por script",
    is_active: true,
  });

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log("\n=== API KEY GENERADA ===\n");
  console.log("Clave (guárdala, no se volverá a mostrar):");
  console.log(rawKey);
  console.log("\nUsa en headers: X-API-Key: " + rawKey);
  console.log("\n========================\n");
}

main();
