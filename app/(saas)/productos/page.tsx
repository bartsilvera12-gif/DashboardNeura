export default function ProductosPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Productos</h1>
      <p className="mt-2 text-zinc-600">
        Área principal de administración operativa. Centraliza la gestión de
        productos e inventario en un solo lugar.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-zinc-900">
            Catálogo de productos
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Gestiona el listado, precios y datos de tus productos.
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-zinc-900">
            Stock e inventario
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Control de existencias y niveles de inventario por tienda.
          </p>
        </section>
      </div>
    </main>
  );
}
