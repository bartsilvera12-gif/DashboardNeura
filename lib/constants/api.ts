/**
 * URL base de la API pública.
 * Usado en documentación, payment links, etc.
 */
export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "https://tu-dominio.com"
  );
}
