/**
 * Lee URLs de imágenes del FormData (multi-input `images` + campo legacy `image`).
 * Rellena `images` (array) y `image` (primera URL) para compatibilidad con API/columna legacy.
 */
export function applyProductImagesFromFormData(
  formData: FormData,
  row: Record<string, unknown>
): void {
  const fromMulti = formData
    .getAll("images")
    .map((v) => String(v).trim())
    .filter(Boolean);
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
