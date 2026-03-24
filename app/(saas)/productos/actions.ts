"use server";

import { revalidatePath } from "next/cache";
import {
  createProduct,
  updateProduct,
  softDeleteProduct,
} from "@/lib/config/products-service";
import {
  recordStockMovement,
  recordStockInicial,
  getStockMovementsWithCreators,
} from "@/lib/config/stock-movements-service";
import { createCompanyCategory } from "@/lib/config/company-categories-service";
import { translateSupabaseError } from "@/lib/utils/supabase-error-messages";
import { applyProductImagesFromFormData } from "@/lib/utils/product-form-images";
import { getSession } from "@/lib/auth/session";

export async function createProductAction(
  companyId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const row: Record<string, unknown> = {};
  const keys = [
    "product_type",
    "name",
    "description",
    "sku",
    "barcode",
    "category",
    "brand",
    "price",
    "cost_price",
    "status",
    "featured",
    "stock",
    "min_stock",
    "max_stock",
    "reorder_point",
    "track_stock",
    "allow_backorder",
    "unit_type",
  ];
  const boolKeys = ["featured", "track_stock", "allow_backorder"];
  for (const k of keys) {
    const v = formData.get(k);
    if (boolKeys.includes(k)) {
      row[k] = v === "true" || v === "1" || v === "on";
    } else if (v == null || v === "") continue;
    else if (k === "price" || k === "cost_price" || k === "stock" || k === "min_stock" || k === "max_stock" || k === "reorder_point") {
      const n = Number(v);
      row[k] = isNaN(n) ? null : n;
    } else {
      row[k] = String(v).trim() || null;
    }
  }
  row.description = (row.description as string) ?? "";
  if (row.product_type === "servicios" && row.track_stock === undefined) {
    row.track_stock = false;
  }
  applyProductImagesFromFormData(formData, row);
  try {
    const product = await createProduct(companyId, row);
    if (!product) return { ok: false, error: "No se pudo crear el producto" };
    const initialStock = Number(product.stock ?? 0);
    if (initialStock > 0 && product.track_stock !== false) {
      const session = await getSession();
      await recordStockInicial(
        product.id,
        companyId,
        initialStock,
        session.user?.id
      );
    }
    revalidatePath("/productos");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    const userMsg = translateSupabaseError(err);
    if (process.env.NODE_ENV === "development") {
      console.error("[createProductAction] Error real:", err);
    }
    return { ok: false, error: userMsg };
  }
}

export async function updateProductAction(
  id: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const row: Record<string, unknown> = {};
  const keys = [
    "product_type",
    "name",
    "description",
    "sku",
    "barcode",
    "category",
    "brand",
    "price",
    "cost_price",
    "status",
    "featured",
    "stock",
    "min_stock",
    "max_stock",
    "reorder_point",
    "track_stock",
    "allow_backorder",
    "unit_type",
  ];
  const boolKeys = ["featured", "track_stock", "allow_backorder"];
  for (const k of keys) {
    const v = formData.get(k);
    if (boolKeys.includes(k)) {
      row[k] = v === "true" || v === "1" || v === "on";
    } else if (v == null || v === "") continue;
    else if (k === "price" || k === "cost_price" || k === "stock" || k === "min_stock" || k === "max_stock" || k === "reorder_point") {
      const n = Number(v);
      row[k] = isNaN(n) ? null : n;
    } else {
      row[k] = String(v).trim() || null;
    }
  }
  if (typeof row.description === "string") row.description = row.description || "";
  if (row.product_type === "servicios" && row.track_stock === undefined) {
    row.track_stock = false;
  }
  applyProductImagesFromFormData(formData, row);
  try {
    const product = await updateProduct(id, row);
    if (!product) return { ok: false, error: "No se pudo actualizar el producto" };
    revalidatePath("/productos");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    const userMsg = translateSupabaseError(err);
    if (process.env.NODE_ENV === "development") console.error("[updateProductAction]:", err);
    return { ok: false, error: userMsg };
  }
}

export async function deleteProductAction(
  productId: string,
  companyId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session.user) {
    return { ok: false, error: "Debes iniciar sesión" };
  }
  const canAccess =
    session.profile?.is_super_admin === true ||
    session.companies.some((c) => c.id === companyId);
  if (!canAccess) {
    return { ok: false, error: "No tienes permiso para esta empresa" };
  }
  try {
    await softDeleteProduct(productId, companyId);
    revalidatePath("/productos");
    revalidatePath("/dashboard");
    revalidatePath("/pedidos");
    return { ok: true };
  } catch (err) {
    const userMsg = translateSupabaseError(err);
    if (process.env.NODE_ENV === "development") {
      console.error("[deleteProductAction]:", err);
    }
    return { ok: false, error: userMsg };
  }
}

export type StockMovementType =
  | "stock_inicial"
  | "entrada"
  | "salida"
  | "ajuste"
  | "devolucion";

export interface RecordStockMovementInput {
  productId: string;
  companyId: string;
  movementType: StockMovementType;
  quantity: number;
  reason?: string | null;
  notes?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
}

export async function recordStockMovementAction(
  input: RecordStockMovementInput
): Promise<{ ok: boolean; error?: string }> {
  const {
    productId,
    companyId,
    movementType,
    quantity,
    reason,
    notes,
    referenceType,
    referenceId,
  } = input;
  const qty = Math.round(quantity);
  if (movementType === "ajuste") {
    if (qty === 0) return { ok: false, error: "Cantidad inválida" };
  } else if (movementType !== "stock_inicial" && Math.abs(qty) <= 0) {
    return { ok: false, error: "Cantidad inválida" };
  }
  const session = await getSession();
  const userId = session.user?.id ?? null;
  if (!userId) {
    return { ok: false, error: "Debes iniciar sesión para registrar movimientos de stock" };
  }
  const result = await recordStockMovement({
    productId,
    companyId,
    movementType,
    quantity: movementType === "ajuste" ? qty : Math.abs(qty),
    reason: reason ?? null,
    notes: notes ?? null,
    referenceType: referenceType ?? null,
    referenceId: referenceId ?? null,
    createdBy: userId,
    origin: "manual",
  });
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/productos");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function getStockMovementsAction(
  productId: string,
  limit = 50,
  companyId?: string
): Promise<{ movements: Array<Record<string, unknown>> }> {
  const movements = await getStockMovementsWithCreators(productId, limit, companyId);
  return {
    movements: movements.map((m) => ({
      id: m.id,
      product_id: m.product_id,
      movement_type: m.movement_type,
      quantity: m.quantity,
      previous_stock: m.previous_stock,
      new_stock: m.new_stock,
      reason: m.reason,
      notes: m.notes,
      created_at: m.created_at,
      created_by: m.created_by,
      created_by_email: m.created_by_email,
      created_by_name: m.created_by_name,
      origin: m.origin,
    })),
  };
}

export async function createCategoryAction(
  companyId: string,
  name: string
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "El nombre de la categoría es obligatorio" };
  try {
    await createCompanyCategory(companyId, trimmed);
    revalidatePath("/productos");
    return { ok: true };
  } catch (err) {
    const userMsg = translateSupabaseError(err);
    if (process.env.NODE_ENV === "development") console.error("[createCategoryAction]:", err);
    return { ok: false, error: userMsg };
  }
}
