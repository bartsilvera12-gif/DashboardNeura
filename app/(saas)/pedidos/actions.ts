"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  createOrder,
  getOrdersPendingConfirmation,
  getOrdersConfirmed,
  getOrdersRejected,
  getOrdersForKanban,
  getOrderById,
  getOrderStats,
  getOrderHistory,
  confirmOrderPayment,
  rejectOrder,
  cancelOrder,
  updateOrderStatus,
} from "@/lib/config/orders-service";
import type { CreateOrderInput } from "@/lib/config/orders-service";

export async function createOrderAction(
  input: CreateOrderInput
): Promise<{ ok: boolean; error?: string; orderId?: string }> {
  const session = await getSession();
  const userId = session.user?.id ?? null;
  if (!session.activeCompanyId && session.companies.length !== 1) {
    return { ok: false, error: "Selecciona una empresa" };
  }
  const companyId = session.activeCompanyId ?? session.companies[0]?.id;
  if (!companyId) return { ok: false, error: "Empresa no encontrada" };

  const result = await createOrder({
    ...input,
    companyId,
    createdBy: userId,
  });

  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/pedidos");
  revalidatePath("/dashboard");
  return { ok: true, orderId: result.order?.id };
}

export async function confirmOrderPaymentAction(
  orderId: string,
  companyId: string,
  paymentData?: { amountReceived?: number; receivedAt?: string }
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  const userId = session.user?.id;
  if (!userId) return { ok: false, error: "Debes iniciar sesión" };

  const result = await confirmOrderPayment(orderId, companyId, userId, paymentData);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/pedidos");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function rejectOrderAction(
  orderId: string,
  companyId: string,
  reason?: string | null,
  notes?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const result = await rejectOrder(orderId, companyId, reason, notes);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/pedidos");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function cancelOrderAction(
  orderId: string,
  companyId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  const userId = session.user?.id;
  if (!userId) return { ok: false, error: "Debes iniciar sesión" };

  const result = await cancelOrder(orderId, companyId, userId);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/pedidos");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateOrderStatusAction(
  orderId: string,
  companyId: string,
  newStatus: string,
  notes?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  const userId = session.user?.id ?? null;

  const result = await updateOrderStatus(orderId, companyId, newStatus, userId, notes);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/pedidos");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function getOrdersPendingConfirmationAction(companyId: string) {
  return getOrdersPendingConfirmation(companyId);
}

export async function getOrdersConfirmedAction(companyId: string) {
  return getOrdersConfirmed(companyId);
}

export async function getOrdersRejectedAction(companyId: string) {
  return getOrdersRejected(companyId);
}

export async function getOrdersForKanbanAction(companyId: string) {
  return getOrdersForKanban(companyId);
}

export async function getOrderByIdAction(orderId: string, companyId: string) {
  return getOrderById(orderId, companyId);
}

export async function getOrderStatsAction(companyId: string) {
  return getOrderStats(companyId);
}

export async function getOrderHistoryAction(orderId: string, companyId: string) {
  return getOrderHistory(orderId, companyId);
}
