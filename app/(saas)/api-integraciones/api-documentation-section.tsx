import { getApiBaseUrl } from "@/lib/constants/api";
import { CopyButton } from "./_components/copy-button";

export function ApiDocumentationSection() {
  const baseUrl = getApiBaseUrl();

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">
        Documentación técnica
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Guía para integrar el frontend externo (Lovable, etc.) con la API del ERP.
      </p>

      <div className="mt-6 space-y-6 text-sm">
        <div>
          <h3 className="font-medium text-zinc-900">URL base</h3>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-zinc-100 px-3 py-2 font-mono text-zinc-800">
              {baseUrl}
            </code>
            <CopyButton text={baseUrl} label="Copiar" />
          </div>
        </div>

        <div>
          <h3 className="font-medium text-zinc-900">Autenticación</h3>
          <p className="mt-1 text-zinc-600">
            Todas las peticiones deben incluir la API key en uno de estos formatos:
          </p>
          <ul className="mt-2 space-y-1 text-zinc-600">
            <li>
              <strong>Header recomendado:</strong>{" "}
              <code className="rounded bg-zinc-100 px-1">x-api-key: neura_xxx...</code>
            </li>
            <li>
              <strong>Alternativo:</strong>{" "}
              <code className="rounded bg-zinc-100 px-1">Authorization: Bearer neura_xxx...</code>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-zinc-900">Flujo recomendado</h3>
          <ol className="mt-2 list-inside list-decimal space-y-2 text-zinc-600">
            <li>Obtener productos: GET /api/public/products</li>
            <li>Crear pedido: POST /api/public/orders con items y customer</li>
            <li>Crear intento de pago: POST /api/public/orders/:id/create-payment</li>
            <li>Consultar estado: GET /api/public/orders/:id/payment-status?ref=PAY-xxx</li>
          </ol>
        </div>

        <div>
          <h3 className="font-medium text-zinc-900">Ejemplo: Productos</h3>
          <div className="mt-2 space-y-2">
            <div>
              <p className="text-xs text-zinc-500">Request</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-100">
{`fetch("${baseUrl}/api/public/products", {
  headers: { "x-api-key": "neura_TU_API_KEY" }
})
.then(r => r.json())
.then(data => console.log(data.products));`}
              </pre>
              <CopyButton
                text={`fetch("${baseUrl}/api/public/products", {
  headers: { "x-api-key": "neura_TU_API_KEY" }
})
.then(r => r.json())
.then(data => console.log(data.products));`}
                label="Copiar"
                className="mt-2 rounded border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-200 hover:bg-zinc-700"
              />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Response 200</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-800">
{`{
  "products": [
    {
      "id": "uuid",
      "name": "Producto",
      "price": 1000,
      "stock": 10,
      "image": "url",
      "sku": "SKU-001",
      "description": "...",
      "category": "Categoría"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-zinc-900">Ejemplo: Crear pedido</h3>
          <div className="mt-2 space-y-2">
            <div>
              <p className="text-xs text-zinc-500">Request</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-100">
{`fetch("${baseUrl}/api/public/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "neura_TU_API_KEY"
  },
  body: JSON.stringify({
    items: [{ productId: "uuid-producto", quantity: 2 }],
    customer: { name: "Cliente", email: "cliente@mail.com" }
  })
})
.then(r => r.json());`}
              </pre>
              <CopyButton
                text={`fetch("${baseUrl}/api/public/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "neura_TU_API_KEY"
  },
  body: JSON.stringify({
    items: [{ productId: "uuid-producto", quantity: 2 }],
    customer: { name: "Cliente", email: "cliente@mail.com" }
  })
})
.then(r => r.json());`}
                label="Copiar"
                className="mt-2 rounded border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-200 hover:bg-zinc-700"
              />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Response 200</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-800">
{`{
  "ok": true,
  "orderId": "uuid",
  "orderNumber": "ORD-20250321-00001",
  "total": 2000
}`}
              </pre>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-zinc-900">Ejemplo: Crear pago (sin pasarela real)</h3>
          <p className="mt-1 text-zinc-600">
            Por ahora devuelve <code className="rounded bg-zinc-100 px-1">paymentLink</code> para
            consultar estado. Luego se integrará PagoPar.
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-100">
{`// POST /api/public/orders/:orderId/create-payment
// Response: { ok: true, reference: "PAY-xxx", paymentLink: "..." }
// GET paymentLink (o payment-status?ref=PAY-xxx) para ver estado`}
          </pre>
        </div>
      </div>
    </section>
  );
}
