/**
 * Creación de pedidos desde la API pública.
 * Valida productos y calcula totales en backend. NO confiar en el frontend.
 */

import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createOrder } from "@/lib/config/orders-service";

export interface ApiOrderItemInput {
  productId: string;
  quantity: number;
}

export interface ApiOrderCustomerInput {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface ApiCreateOrderInput {
  items: ApiOrderItemInput[];
  customer?: ApiOrderCustomerInput | null;
  notes?: string | null;
}

export interface ApiCreateOrderResult {
  ok: boolean;
  error?: string;
  orderId?: string;
  orderNumber?: string;
  total?: number;
}

/**
 * Crea pedido desde API.
 * - Valida que todos los productos existan y pertenezcan a la empresa
 * - Recalcula precios y totales (ignora datos del frontend)
 * - source_channel = "web"
 */
export async function createOrderFromApi(
  companyId: string,
  input: ApiCreateOrderInput
): Promise<ApiCreateOrderResult> {
  if (!input.items?.length) {
    return { ok: false, error: "El pedido debe tener al menos un producto" };
  }

  const supabase = getSupabaseAdminClient();

  const validatedItems: Array<{
    productId: string;
    productNameSnapshot: string;
    skuSnapshot: string | null;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    inventorySource: string;
  }> = [];

  let subtotal = 0;

  for (const item of input.items) {
    const qty = Math.max(1, Math.round(item.quantity));
    const productId = item.productId?.trim();
    if (!productId) {
      return { ok: false, error: "productId inválido en item" };
    }

    const { data } = await supabase
      .from("products")
      .select("id, name, price, sku, company_id, is_active")
      .eq("id", productId)
      .single();

    const product = data as { id: string; name: string; price: number; sku: string; company_id: string; is_active: boolean } | null;
    if (!product) {
      return { ok: false, error: `Producto no encontrado: ${productId}` };
    }

    if (product.company_id !== companyId) {
      return { ok: false, error: `Producto no disponible: ${productId}` };
    }

    if (product.is_active !== true) {
      return { ok: false, error: `Producto no disponible: ${product.name ?? productId}` };
    }

    const unitPrice = Number(product.price) ?? 0;
    const lineTotal = qty * unitPrice;
    subtotal += lineTotal;

    validatedItems.push({
      productId: product.id,
      productNameSnapshot: product.name ?? "Producto",
      skuSnapshot: product.sku ?? null,
      quantity: qty,
      unitPrice,
      discountAmount: 0,
      inventorySource: "propio",
    });
  }

  const customer = input.customer ?? {};

  const result = await createOrder(
    {
      companyId,
      sourceChannel: "web",
    sourcePlatform: "api",
    customerName: customer.name ?? null,
    customerEmail: customer.email ?? null,
    customerPhone: customer.phone ?? null,
    notes: input.notes ?? null,
    items: validatedItems,
    subtotal,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 0,
      createdBy: null,
    },
    supabase
  );

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    orderId: result.order?.id,
    orderNumber: result.order?.order_number,
    total: result.order ? Number(result.order.total) : subtotal,
  };
}
