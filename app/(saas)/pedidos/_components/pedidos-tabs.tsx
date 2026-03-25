"use client";

import { useState } from "react";
import type { Order } from "@/lib/types/order";
import type { Product } from "@/lib/types/product";
import { PorConfirmarSection } from "./por-confirmar-section";
import { ConfirmadasSection } from "./confirmadas-section";
import { KanbanSection } from "./kanban-section";
import { RechazadosSection } from "./rechazados-section";

export interface OrderStats {
  pedidosHoy: number;
  confirmadosHoy: number;
  enPreparacion: number;
  enCamino: number;
  entregados: number;
  rechazados: number;
  totalVendido: number;
}

interface PedidosTabsProps {
  companyId: string;
  pendingOrders: Order[];
  confirmedOrders: Order[];
  rejectedOrders: Order[];
  kanbanOrders: Order[];
  stats: OrderStats;
  products: Product[];
}

export function PedidosTabs({
  companyId,
  pendingOrders,
  confirmedOrders,
  rejectedOrders,
  kanbanOrders,
  stats,
  products,
}: PedidosTabsProps) {
  const [tab, setTab] = useState<
    "por_confirmar" | "confirmadas" | "kanban" | "rechazados"
  >("por_confirmar");

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setTab("por_confirmar")}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "por_confirmar"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Por confirmar
          {pendingOrders.length > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              {pendingOrders.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("confirmadas")}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "confirmadas"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Ventas confirmadas
        </button>
        <button
          type="button"
          onClick={() => setTab("kanban")}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "kanban"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Estado del pedido (Kanban)
        </button>
        <button
          type="button"
          onClick={() => setTab("rechazados")}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "rechazados"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Rechazados
        </button>
      </div>

      {tab === "por_confirmar" && (
        <PorConfirmarSection
          companyId={companyId}
          orders={pendingOrders}
          products={products}
        />
      )}
      {tab === "confirmadas" && (
        <ConfirmadasSection
          companyId={companyId}
          orders={confirmedOrders}
          onSwitchToKanban={() => setTab("kanban")}
        />
      )}
      {tab === "kanban" && (
        <KanbanSection
          companyId={companyId}
          orders={kanbanOrders}
          stats={stats}
        />
      )}
      {tab === "rechazados" && (
        <RechazadosSection companyId={companyId} orders={rejectedOrders} />
      )}
    </div>
  );
}
