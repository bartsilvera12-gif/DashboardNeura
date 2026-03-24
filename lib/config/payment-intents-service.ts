import { dbFrom } from "@/lib/db/schema";
/**
 * Payment intents para la API pública.
 * Preparado para integración con PagoPar, Bancard, etc.
 *
 * Flujo actual (sin pasarela real):
 * - Crea intent con status "pending" en payment_intents.
 * - Devuelve paymentLink = URL para consultar estado.
 * - Frontend puede hacer polling a payment-status?ref=PAY-xxx.
 *
 * Futura integración PagoPar:
 * - Cambiar provider a "pagopar" y poblar payment_link con URL real del checkout.
 * - Webhook o callback para actualizar status del intent y payment_status del order.
 */

import { randomBytes } from "crypto";
import { getApiBaseUrl } from "@/lib/constants/api";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export interface CreatePaymentIntentResult {
  ok: boolean;
  error?: string;
  reference?: string;
  paymentLink?: string;
}

/**
 * Crea un intento de pago para un pedido.
 * Devuelve reference y paymentLink.
 * Cuando se integre PagoPar/Bancard, paymentLink será la URL real del gateway.
 */
export async function createPaymentIntent(
  orderId: string,
  companyId: string,
  provider = "pendiente"
): Promise<CreatePaymentIntentResult> {
  const supabase = getSupabaseAdminClient();

  const { data } = await dbFrom(supabase, "orders")
    .select("id, total, order_number, payment_status, order_status")
    .eq("id", orderId)
    .eq("company_id", companyId)
    .single();

  const order = data as { total: number; order_number: string; payment_status: string; order_status: string } | null;
  if (!order) {
    return { ok: false, error: "Pedido no encontrado" };
  }

  if (order.payment_status === "validado") {
    return { ok: false, error: "El pedido ya está pagado" };
  }

  if (order.order_status === "rechazado" || order.order_status === "cancelado") {
    return { ok: false, error: "El pedido no puede ser pagado" };
  }

  const reference = `PAY-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;
  const amount = Number(order.total) ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await dbFrom(supabase as any, "payment_intents").insert({
    order_id: orderId,
    company_id: companyId,
    reference,
    provider,
    amount,
    status: "pending",
    payment_link: null,
    metadata: { order_number: order.order_number },
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[createPaymentIntent]:", error);
    }
    return { ok: false, error: error.message };
  }

  const appBase = getApiBaseUrl();
  if (!appBase) {
    return {
      ok: false,
      error:
        "Falta NEXT_PUBLIC_APP_URL (URL pública de esta app) para generar el enlace de consulta de pago.",
    };
  }

  // Payment link: cuando se integre PagoPar, será la URL del checkout.
  const paymentLink = `${appBase}/api/public/orders/${orderId}/payment-status?ref=${reference}`;

  return {
    ok: true,
    reference,
    paymentLink,
  };
}
