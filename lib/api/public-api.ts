/**
 * Utilidades para la API pública.
 * Validación de API key y respuestas consistentes.
 */

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/config/api-keys-service";

export const API_KEY_HEADER = "x-api-key";

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
    },
  });
}
