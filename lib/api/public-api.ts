/**
 * Utilidades para la API pública.
 * Validación de API key y respuestas consistentes.
 */

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/config/api-keys-service";

export const API_KEY_HEADER = "x-api-key";
const CORS_ALLOWED_HEADERS = "Content-Type, Authorization, x-api-key";

function buildCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": CORS_ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

export async function getCompanyFromApiKey(
  request: NextRequest
): Promise<
  | { ok: true; companyId: string }
  | { ok: false; status: number; body: { error: string } }
> {
  const apiKey =
    request.headers.get(API_KEY_HEADER) ??
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ??
    null;

  const result = await validateApiKey(apiKey);

  if (result.ok) {
    return { ok: true, companyId: result.companyId };
  }

  return {
    ok: false,
    status: 401,
    body: { error: result.error },
  };
}

export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...buildCorsHeaders(),
    },
  });
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(),
  });
}
