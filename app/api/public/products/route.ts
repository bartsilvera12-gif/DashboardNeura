import { NextRequest } from "next/server";
import { getCompanyFromApiKey, jsonResponse } from "@/lib/api/public-api";
import { getPublicProducts } from "@/lib/config/public-api-products-service";
import { logApiRequest } from "@/lib/config/api-logs-service";

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
