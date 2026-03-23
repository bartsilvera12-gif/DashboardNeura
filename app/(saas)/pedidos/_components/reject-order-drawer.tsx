"use client";

import { useState } from "react";
import type { Order } from "@/lib/types/order";
import { rejectOrderAction } from "../actions";

interface RejectOrderDrawerProps {
  order: Order | null;
  companyId: string;
  open: boolean;
  onClose: () => void;
}

export function RejectOrderDrawer({
  order,
  companyId,
  open,
  onClose,
}: RejectOrderDrawerProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setLoading(true);
    const result = await rejectOrderAction(
      order.id,
      companyId,
      reason.trim() || null,
      notes.trim() || null
    );
    setLoading(false);
    if (result.ok) {
      setReason("");
      setNotes("");
      onClose();
    } else {
      alert(result.error);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-zinc-900/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        role="dialog"
        aria-labelledby="reject-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 id="reject-title" className="text-lg font-semibold text-zinc-900">
            Rechazar pedido
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

        {order && (
          <div className="border-b border-zinc-100 px-6 py-3">
            <p className="text-sm font-medium text-zinc-900">{order.order_number}</p>
            <p className="text-sm text-zinc-600">
              {order.customer_name || order.customer_email || "—"} ·{" "}
              {new Intl.NumberFormat("es-PY", {
                style: "currency",
                currency: "PYG",
              }).format(Number(order.total) || 0)}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Motivo del rechazo
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Pago no verificado"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Observaciones (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Detalle adicional"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Rechazando…" : "Confirmar rechazo"}
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
