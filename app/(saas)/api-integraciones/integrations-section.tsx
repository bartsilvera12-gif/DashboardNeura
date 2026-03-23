const INTEGRATIONS = [
  { code: "lovable", name: "Lovable", status: "previsto" },
  { code: "pagopar", name: "PagoPar", status: "previsto" },
  { code: "bancard", name: "Bancard", status: "previsto" },
  { code: "shopify", name: "Shopify", status: "previsto" },
  { code: "dropi", name: "Dropi", status: "previsto" },
] as const;

export function IntegrationsSection() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Integraciones</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Espacio preparado para futuras integraciones con plataformas externas.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((int) => (
          <div
            key={int.code}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/50 p-4"
          >
            <span className="font-medium text-zinc-900">{int.name}</span>
            <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600">
              {int.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
