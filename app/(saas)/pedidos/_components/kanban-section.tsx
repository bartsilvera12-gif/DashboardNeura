"use client";

import { useState } from "react";
import type { Order } from "@/lib/types/order";
import type { OrderStats } from "./pedidos-tabs";
import {
  KANBAN_COLUMNS,
  ORDER_STATUS_LABELS,
  SOURCE_CHANNEL_LABELS,
} from "@/lib/constants/orders";
import { updateOrderStatusAction } from "../actions";
import { OrderDetailDrawer } from "./order-detail-drawer";
import { useRouter } from "next/navigation";

interface KanbanSectionProps {
  companyId: string;
  orders: Order[];
  stats: OrderStats;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(n);
}

export function KanbanSection({
  companyId,
  orders,
  stats,
}: KanbanSectionProps) {
  const router = useRouter();
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const ordersByStatus = new Map<string, Order[]>();
  for (const col of KANBAN_COLUMNS) {
    ordersByStatus.set(col, []);
  }
  for (const o of orders) {
    const col = o.order_status as string;
    if (ordersByStatus.has(col)) {
      ordersByStatus.get(col)!.push(o);
    }
  }

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    setDraggedOrder(order);
    e.dataTransfer.setData("orderId", order.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedOrder(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(status);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDropTarget(null);
    const orderId = e.dataTransfer.getData("orderId");
    if (!orderId) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.order_status === newStatus) return;
    const result = await updateOrderStatusAction(orderId, companyId, newStatus);
    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mini dashboard */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">
            Pedidos hoy
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {stats.pedidosHoy}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">
            Confirmados hoy
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {stats.confirmadosHoy}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">
            En preparación
          </p>
          <p className="mt-1 text-2xl font-semibold text-violet-600">
            {stats.enPreparacion}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">
            En camino
          </p>
          <p className="mt-1 text-2xl font-semibold text-sky-600">
            {stats.enCamino}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">
            Entregados
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {stats.entregados}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">
            Rechazados
          </p>
          <p className="mt-1 text-2xl font-semibold text-red-600">
            {stats.rechazados}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">
            Total vendido
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900">
            {formatMoney(stats.totalVendido)}
          </p>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => {
          const columnOrders = ordersByStatus.get(status) ?? [];
          const isDropTarget = dropTarget === status;
          return (
            <div
              key={status}
              className={`flex min-w-[280px] flex-1 flex-col rounded-lg border-2 bg-zinc-50/50 p-4 transition-colors ${
                isDropTarget
                  ? "border-zinc-400 bg-zinc-100"
                  : "border-zinc-200"
              }`}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                {ORDER_STATUS_LABELS[status]}
                <span className="ml-1.5 rounded bg-zinc-200 px-2 py-0.5 text-xs font-normal">
                  {columnOrders.length}
                </span>
              </h3>
              <div className="flex flex-1 flex-col gap-2">
                {columnOrders.map((order) => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, order)}
                    onDragEnd={handleDragEnd}
                    className={`cursor-grab rounded-lg border border-zinc-200 bg-white p-3 shadow-sm hover:shadow active:cursor-grabbing ${
                      draggedOrder?.id === order.id ? "opacity-50" : ""
                    }`}
                  >
                    <p className="font-medium text-zinc-900">
                      {order.customer_name || order.customer_email || "Sin nombre"}
                    </p>
                    <p className="mt-0.5 text-lg font-semibold text-zinc-900">
                      {formatMoney(Number(order.total) || 0)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {order.order_number} ·{" "}
                      {SOURCE_CHANNEL_LABELS[order.source_channel ?? ""] ??
                        order.source_channel ??
                        "—"}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailOrder(order);
                      }}
                      className="mt-2 w-full rounded bg-zinc-100 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                    >
                      Ver detalle
                    </button>
                  </div>
                ))}
                {columnOrders.length === 0 && (
                  <p className="py-4 text-center text-xs text-zinc-400">
                    Arrastra pedidos aquí
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <OrderDetailDrawer
        order={detailOrder}
        companyId={companyId}
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
      />
    </div>
  );
}
