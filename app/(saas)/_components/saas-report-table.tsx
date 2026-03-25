import type { ReactNode } from "react";

/**
 * Tablas tipo “reporte” oscuras (alineadas con API keys / dashboards pulcros).
 * El contenedor va dentro de secciones claras existentes.
 */
export const sr = {
  shell:
    "min-w-0 overflow-hidden rounded-lg border border-zinc-800/90 bg-zinc-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
  scroll:
    "min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]",
  table: "w-full border-collapse text-xs leading-snug",
  theadTr: "border-b border-zinc-800",
  th: "px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-500",
  thRight:
    "px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-500",
  tr: "border-b border-zinc-800/70 transition-colors hover:bg-zinc-900/55",
  td: "px-2 py-2 text-xs text-zinc-400",
  tdLead: "px-2 py-2 text-xs font-semibold text-zinc-100",
  tdMono: "px-2 py-2 font-mono text-xs text-zinc-500",
  tdRight: "px-2 py-2 text-right text-xs text-zinc-400",
  tdRightStrong: "px-2 py-2 text-right text-xs font-semibold text-zinc-100",
  actions: "px-2 py-2 text-right align-top",
  actionsInner: "flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5",
  /** Botones apilados (catálogo estrecho). */
  actionsInnerStack: "flex flex-col items-end gap-1",
  actionPrimary:
    "text-xs font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-50",
  actionMuted:
    "text-xs font-medium text-zinc-400 hover:text-zinc-200 disabled:opacity-50",
  actionDanger:
    "text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50",
  actionSuccess:
    "text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50",
  empty: "px-4 py-10 text-center text-xs text-zinc-500",
  emptyBox:
    "rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-10 text-center text-sm text-zinc-500",
} as const;

/** Última columna (acciones / copiar): fija al hacer scroll horizontal. Usar con `group` en `<tr>`. */
export const srSticky = {
  thActions:
    "sticky right-0 z-20 border-l border-zinc-800 bg-zinc-950",
  tdActions:
    "sticky right-0 z-10 border-l border-zinc-800/90 bg-zinc-950 shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.45)] group-hover:bg-zinc-900/55",
} as const;

const badgeBase =
  "inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight ring-1";

export function SaasStatusBadge({
  variant,
  children,
}: {
  variant: "active" | "inactive" | "success" | "error" | "neutral" | "warning";
  children: ReactNode;
}) {
  const map = {
    active: `${badgeBase} bg-emerald-500/15 text-emerald-400 ring-emerald-500/25`,
    inactive: `${badgeBase} bg-zinc-500/15 text-zinc-400 ring-zinc-500/25`,
    success: `${badgeBase} bg-emerald-500/15 text-emerald-400 ring-emerald-500/25`,
    error: `${badgeBase} bg-red-500/15 text-red-400 ring-red-500/25`,
    warning: `${badgeBase} bg-amber-500/15 text-amber-300 ring-amber-500/25`,
    neutral: `${badgeBase} bg-zinc-500/15 text-zinc-400 ring-zinc-500/20`,
  };
  return <span className={map[variant]}>{children}</span>;
}

export function SaasMethodBadge({ method }: { method: string }) {
  const isGet = method === "GET";
  return (
    <span
      className={`${badgeBase} ${
        isGet
          ? "bg-sky-500/15 text-sky-300 ring-sky-500/25"
          : "bg-amber-500/15 text-amber-300 ring-amber-500/25"
      }`}
    >
      {method}
    </span>
  );
}
