"use client";

import { useState } from "react";
import type { Product } from "@/lib/types/product";
import { INVENTORY_SOURCE_LABELS } from "@/lib/constants/orders";
import { createOrderAction } from "../actions";

interface CreateOrderDrawerProps {
  companyId: string;
  products: Product[];
  open: boolean;
  onClose: () => void;
}

interface OrderItemRow {
  productId: string | null;
  productNameSnapshot: string;
  skuSnapshot: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  inventorySource: "propio" | "dropi" | "shopify" | "externo";
}

export function CreateOrderDrawer({
  companyId,
  products,
  open,
  onClose,
}: CreateOrderDrawerProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [items, setItems] = useState<OrderItemRow[]>([
    {
      productId: null,
      productNameSnapshot: "",
      skuSnapshot: null,
      quantity: 1,
      unitPrice: 0,
      discountAmount: 0,
      inventorySource: "propio" as const,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: null,
        productNameSnapshot: "",
        skuSnapshot: null,
        quantity: 1,
        unitPrice: 0,
        discountAmount: 0,
        inventorySource: "propio" as const,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof OrderItemRow, value: unknown) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    );
  };

  const selectProduct = (idx: number, product: Product | null) => {
    if (!product) {
      updateItem(idx, "productId", null);
      updateItem(idx, "productNameSnapshot", "");
      updateItem(idx, "skuSnapshot", null);
      updateItem(idx, "unitPrice", 0);
      return;
    }
    updateItem(idx, "productId", product.id);
    updateItem(idx, "productNameSnapshot", product.name ?? "");
    updateItem(idx, "skuSnapshot", product.sku ?? null);
    updateItem(idx, "unitPrice", Number(product.price) ?? 0);
  };

  let subtotal = 0;
  for (const it of items) {
    const lineTotal = Math.max(
      0,
      it.quantity * it.unitPrice - it.discountAmount
    );
    subtotal += lineTotal;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validItems = items.filter(
      (it) => it.productId && it.productNameSnapshot && it.quantity > 0
    );
    if (validItems.length === 0) {
      setError("Agrega al menos un producto con cantidad.");
      return;
    }

    setLoading(true);
    const result = await createOrderAction({
      companyId,
      sourceChannel: "manual",
      customerName: customerName.trim() || null,
      customerPhone: customerPhone.trim() || null,
      customerEmail: customerEmail.trim() || null,
      notes: notes.trim() || null,
      paymentMethod: paymentMethod.trim() || null,
      items: validItems.map((it) => ({
        productId: it.productId!,
        productNameSnapshot: it.productNameSnapshot,
        skuSnapshot: it.skuSnapshot,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountAmount: it.discountAmount,
        inventorySource: it.inventorySource ?? "propio",
      })),
      subtotal,
      discountTotal: 0,
      shippingTotal: 0,
      taxTotal: 0,
    });

    setLoading(false);
    if (result.ok) {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setNotes("");
      setPaymentMethod("");
      setItems([
        {
          productId: null,
          productNameSnapshot: "",
          skuSnapshot: null,
          quantity: 1,
          unitPrice: 0,
          discountAmount: 0,
          inventorySource: "propio",
        },
      ]);
      onClose();
    } else {
      setError(result.error ?? "Error al crear pedido");
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-zinc-900/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-xl"
        role="dialog"
        aria-labelledby="create-order-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 id="create-order-title" className="text-lg font-semibold text-zinc-900">
            Nuevo pedido manual
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Teléfono"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Método de pago
              </label>
              <input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="Ej: Transferencia, Efectivo"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Notas del pedido"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700">
                  Productos
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                >
                  + Agregar
                </button>
              </div>
              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-6 lg:grid-cols-7">
                      <div className="sm:col-span-2">
                        <select
                          value={it.productId ?? ""}
                          onChange={(e) => {
                            const p = products.find((x) => x.id === e.target.value);
                            selectProduct(idx, p ?? null);
                          }}
                          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                        >
                          <option value="">Seleccionar producto</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name ?? p.sku ?? p.id}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          min={1}
                          value={it.quantity || ""}
                          onChange={(e) =>
                            updateItem(idx, "quantity", parseInt(e.target.value, 10) || 0)
                          }
                          placeholder="Cant"
                          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={it.unitPrice || ""}
                          onChange={(e) =>
                            updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Precio"
                          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={it.discountAmount || ""}
                          onChange={(e) =>
                            updateItem(idx, "discountAmount", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Desc"
                          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <select
                          value={it.inventorySource}
                          onChange={(e) =>
                            updateItem(idx, "inventorySource", e.target.value as OrderItemRow["inventorySource"])
                          }
                          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                          title="Solo 'propio' descuenta stock interno"
                        >
                          {(["propio", "dropi", "shopify", "externo"] as const).map((src) => (
                            <option key={src} value={src}>
                              {INVENTORY_SOURCE_LABELS[src]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-700">
                Subtotal:{" "}
                {new Intl.NumberFormat("es-PY", {
                  style: "currency",
                  currency: "PYG",
                }).format(subtotal)}
              </p>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          <div className="border-t border-zinc-200 p-4 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? "Creando…" : "Crear pedido"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
