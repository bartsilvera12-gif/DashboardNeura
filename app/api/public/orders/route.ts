import { NextRequest } from "next/server";
import { getCompanyFromApiKey, jsonResponse } from "@/lib/api/public-api";
import { createOrderFromApi } from "@/lib/config/public-api-orders-service";
import { logApiRequest } from "@/lib/config/api-logs-service";

export async function POST(request: NextRequest) {
  const endpoint = "/api/public/orders";
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logApiRequest({
      companyId: auth.companyId,
      endpoint,
      method: "POST",
      statusCode: 400,
      success: false,
      errorMessage: "Cuerpo JSON inválido",
    });
    return jsonResponse(
      { error: "Cuerpo JSON inválido" },
      400
    );
  }

  const { items, customer, notes } = body as {
    items?: Array<{ productId: string; quantity: number }>;
    customer?: { name?: string; email?: string; phone?: string };
    notes?: string;
  };

  const result = await createOrderFromApi(auth.companyId, {
    items: items ?? [],
    customer: customer ?? null,
    notes: notes ?? null,
  });

  if (!result.ok) {
    logApiRequest({
      companyId: auth.companyId,
      endpoint,
      method: "POST",
      statusCode: 400,
      success: false,
      errorMessage: result.error,
    });
    return jsonResponse(
      { error: result.error },
      400
    );
  }

  logApiRequest({
    companyId: auth.companyId,
    endpoint,
    method: "POST",
    statusCode: 200,
    success: true,
  });
  return jsonResponse({
    ok: true,
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    total: result.total,
  });
}
