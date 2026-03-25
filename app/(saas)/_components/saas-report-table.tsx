import type { ReactNode } from "react";

/**
 * Tablas tipo “reporte” oscuras (alineadas con API keys / dashboards pulcros).
 * El contenedor va dentro de secciones claras existentes.
 */
export const sr = {
  shell:
    "overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
  scroll: "overflow-x-auto",
  table: "w-full border-collapse text-sm",
  theadTr: "border-b border-zinc-800",
  th: "px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.07em] text-zinc-500",
  thRight:
    "px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.07em] text-zinc-500",
  tr: "border-b border-zinc-800/70 transition-colors hover:bg-zinc-900/55",
  td: "px-4 py-3.5 text-sm text-zinc-400",
  tdLead: "px-4 py-3.5 text-sm font-semibold text-zinc-100",
  tdMono: "px-4 py-3.5 font-mono text-sm text-zinc-500",
  tdRight: "px-4 py-3.5 text-right text-sm text-zinc-400",
  tdRightStrong: "px-4 py-3.5 text-right text-sm font-semibold text-zinc-100",
  actions: "px-4 py-3.5 text-right",
  actionsInner: "flex flex-wrap items-center justify-end gap-x-4 gap-y-1",
  actionPrimary:
    "text-sm font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-50",
  actionMuted:
    "text-sm font-medium text-zinc-400 hover:text-zinc-200 disabled:opacity-50",
  actionDanger:
    "text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50",
  actionSuccess:
    "text-sm font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50",
  empty: "px-4 py-12 text-center text-sm text-zinc-500",
  emptyBox:
    "rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-10 text-center text-sm text-zinc-500",
} as const;

const badgeBase =
  "inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1";

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
