/**
 * Lee URLs de imágenes del FormData.
 * Preferimos `images_json` (un solo campo, estable con Server Actions); fallback a `images` repetido.
 */
export function applyProductImagesFromFormData(
  formData: FormData,
  row: Record<string, unknown>
): void {
  let fromMulti: string[] = [];
  const jsonRaw = formData.get("images_json");
  if (jsonRaw != null && String(jsonRaw).trim() !== "") {
    try {
      const parsed = JSON.parse(String(jsonRaw)) as unknown;
      if (Array.isArray(parsed)) {
        fromMulti = parsed.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      /* ignorar JSON inválido */
    }
  }
  if (fromMulti.length === 0) {
    fromMulti = formData
      .getAll("images")
      .map((v) => String(v).trim())
      .filter(Boolean);
  }
  const legacy = formData.get("image");
  if (fromMulti.length > 0) {
    row.images = fromMulti;
    row.image = fromMulti[0];
  } else if (legacy != null && String(legacy).trim() !== "") {
    const s = String(legacy).trim();
    row.images = [s];
    row.image = s;
  } else {
    row.images = [];
    row.image = null;
  }
}
