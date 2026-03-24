import { dbFrom } from "@/lib/db/schema";
import { NextRequest } from "next/server";
import { getCompanyFromApiKey, jsonResponse } from "@/lib/api/public-api";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { logApiRequest } from "@/lib/config/api-logs-service";

/**
 * GET /api/public/orders/:id/payment-status?ref=PAY-xxx
 * Consulta estado de un pago.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const endpoint = `/api/public/orders/${orderId ?? "[id]"}/payment-status`;
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

  const ref = request.nextUrl.searchParams.get("ref");

  if (!orderId || !ref) {
    logApiRequest({
      companyId: auth.companyId,
      endpoint,
      method: "GET",
      statusCode: 400,
      success: false,
      errorMessage: "orderId y ref requeridos",
    });
    return jsonResponse(
      { error: "orderId y ref requeridos" },
      400
    );
  }

  const supabase = getSupabaseAdminClient();

  const { data } = await dbFrom(supabase, "payment_intents")
    .select("id, status, amount, reference")
    .eq("order_id", orderId)
    .eq("reference", ref)
    .eq("company_id", auth.companyId)
    .single();

  if (!data) {
    logApiRequest({
      companyId: auth.companyId,
      endpoint,
      method: "GET",
      statusCode: 404,
      success: false,
      errorMessage: "Pago no encontrado",
    });
    return jsonResponse(
      { error: "Pago no encontrado" },
      404
    );
  }

  logApiRequest({
    companyId: auth.companyId,
    endpoint,
    method: "GET",
    statusCode: 200,
    success: true,
  });
  const intent = data as { reference: string; status: string; amount: number };
  return jsonResponse({
    reference: intent.reference,
    status: intent.status,
    amount: intent.amount,
    orderId,
  });
}
