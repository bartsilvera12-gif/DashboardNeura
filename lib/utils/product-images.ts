import type { Product } from "@/lib/types/product";

/** Normaliza URLs de imágenes desde fila de producto (jsonb, legacy `image`, etc.). */
export function normalizeProductImageUrls(p: Product): string[] {
  const raw = p.images;
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (raw && typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>)
      .map((x) => String(x).trim())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      /* ignore */
    }
  }
  if (p.image != null && String(p.image).trim() !== "") {
    return [String(p.image).trim()];
  }
  return [];
}
