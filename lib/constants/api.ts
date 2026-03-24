/**
 * URL base de la app (links de pago, documentación API).
 * En producción define NEXT_PUBLIC_APP_URL (Hostinger / dominio público).
 */
export function getApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return "";
}
