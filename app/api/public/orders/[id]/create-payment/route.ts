import { NextRequest } from "next/server";
import { getCompanyFromApiKey, jsonResponse } from "@/lib/api/public-api";
import { createPaymentIntent } from "@/lib/config/payment-intents-service";
import { logApiRequest } from "@/lib/config/api-logs-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const endpoint = `/api/public/orders/${orderId ?? "[id]"}/create-payment`;
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

  if (!orderId) {
    logApiRequest({
      companyId: auth.companyId,
      endpoint,
      method: "POST",
      statusCode: 400,
      success: false,
      errorMessage: "ID de pedido requerido",
    });
    return jsonResponse(
      { error: "ID de pedido requerido" },
      400
    );
  }

  const result = await createPaymentIntent(orderId, auth.companyId);

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
    reference: result.reference,
    paymentLink: result.paymentLink,
  });
}
