import { NextRequest } from "next/server";
import {
  getCompanyFromApiKey,
  jsonResponse,
  optionsResponse,
} from "@/lib/api/public-api";
import { getPublicProducts } from "@/lib/config/public-api-products-service";
import { createProductPublic } from "@/lib/config/public-api-products-mutations";
import { logApiRequest } from "@/lib/config/api-logs-service";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  const endpoint = "/api/public/products";
  const auth = await getCompanyFromApiKey(request);
  if (!auth.ok) {
    logApiRequest({
      companyId: null,
      endpoint,
      method: "GET",
      statusCode: auth.status,
      success: false,
      errorMessage: auth.body?.error,
    });
    return jsonResponse(auth.body, auth.status);
  }

  try {
    const products = await getPublicProducts(auth.companyId);
    logApiRequest({
      companyId: auth.companyId,
      endpoint,
      method: "GET",
      statusCode: 200,
      success: true,
    });
    return jsonResponse({ products });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al obtener productos";
    if (process.env.NODE_ENV === "development") {
      console.error("[API public/products]:", err);
    }
    logApiRequest({
      companyId: auth.companyId,
      endpoint,
      method: "GET",
      statusCode: 500,
      success: false,
      errorMessage: msg,
    });
    return jsonResponse(
      { error: "Error al obtener productos" },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  const endpoint = "/api/public/products";
  const auth = await getCompanyFromApiKey(request);
  if (!auth.ok) {
    logApiRequest({
      companyId: null,
      endpoint,
      method: "POST",
      statusCode: auth.status,
      success: false,
      errorMessage: auth.body?.error,
    });
    return jsonResponse(auth.body, auth.status);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    logApiRequest({
      companyId: auth.companyId,
      endpoint,
      method: "POST",
      statusCode: 400,
      success: false,
      errorMessage: "JSON inválido",
    });
    return jsonResponse({ error: "Cuerpo JSON inválido" }, 400);
  }

  const result = await createProductPublic(auth.companyId, body);
  if (!result.ok) {
    logApiRequest({
      companyId: auth.companyId,
      endpoint,
      method: "POST",
      statusCode: result.status,
      success: false,
      errorMessage: result.error,
    });
    return jsonResponse({ error: result.error }, result.status);
  }

  logApiRequest({
    companyId: auth.companyId,
    endpoint,
    method: "POST",
    statusCode: 201,
    success: true,
  });
  return jsonResponse({ ok: true, product: result.product }, 201);
}
