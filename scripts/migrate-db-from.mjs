/**
 * Reemplaza accesos .from( por dbFrom(...) — uso único de migración.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const skipDirs = new Set(["node_modules", ".next", "dist"]);

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (skipDirs.has(name.name)) continue;
      walk(p, files);
    } else if (/\.(ts|tsx|mjs)$/.test(name.name) && !name.name.endsWith(".d.ts")) {
      files.push(p);
    }
  }
  return files;
}

function transform(content) {
  let s = content;
  s = s.replace(/\(supabase as any\)\.from\(/g, "dbFrom(supabase as any, ");
  s = s.replace(/getSupabaseAdminClient\(\)\.from\(/g, "dbFrom(getSupabaseAdminClient(), ");
  s = s.replace(/\bsupabase\s*\n\s*\.from\(/g, "dbFrom(supabase, ");
  s = s.replace(/\bclient\s*\n\s*\.from\(/g, "dbFrom(client, ");
  s = s.replace(/\bsupabase\.from\(/g, "dbFrom(supabase, ");
  s = s.replace(/\bclient\.from\(/g, "dbFrom(client, ");
  return s;
}

function ensureImport(content) {
  if (!content.includes("dbFrom(")) return content;
  if (content.includes("@/lib/db/schema") || content.includes("lib/db/schema")) return content;
  const insert = 'import { dbFrom } from "@/lib/db/schema";\n';
  if (content.startsWith('"use server"') || content.startsWith("'use server'")) {
    const lineEnd = content.indexOf("\n");
    return content.slice(0, lineEnd + 1) + insert + content.slice(lineEnd + 1);
  }
  return insert + content;
}

const files = walk(path.join(root, "lib")).concat(walk(path.join(root, "app")));

for (const file of files) {
  if (file.endsWith("schema.ts") && file.includes(`${path.sep}db${path.sep}`)) continue;
  const raw = fs.readFileSync(file, "utf8");
  const next = transform(raw);
  if (next === raw) continue;
  const out = ensureImport(next);
  fs.writeFileSync(file, out, "utf8");
  console.log("updated:", path.relative(root, file));
}

console.log("done");
