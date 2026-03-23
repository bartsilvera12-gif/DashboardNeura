"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction } from "../actions";
import type { CompanyCategory } from "@/lib/config/company-categories-service";

interface CategoriesSectionProps {
  companyId: string;
  categories: CompanyCategory[];
  fromProducto?: boolean;
  onReturnToProductForm?: () => void;
}

export function CategoriesSection({ companyId, categories, fromProducto = false, onReturnToProductForm }: CategoriesSectionProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createCategoryAction(companyId, name);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Error");
      return;
    }
    setName("");
    if (fromProducto && onReturnToProductForm) {
      onReturnToProductForm();
      router.refresh();
    } else {
      router.refresh();
    }
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-900">Categorías</h2>
      </div>
      <p className="mb-4 text-sm text-zinc-600">
        Crea categorías para organizar tus productos. Las categorías son reutilizables y evitan
        duplicados. Los productos deben seleccionar una categoría existente.
        {fromProducto && (
          <span className="mt-1 block font-medium text-amber-700">
            Después de crear, volverás al formulario de producto para elegir la categoría.
          </span>
        )}
      </p>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la categoría"
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Guardando…" : "Crear"}
        </button>
      </form>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[300px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="px-3 py-2 text-left font-medium text-zinc-600">Nombre</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-zinc-500">
                  No hay categorías. Crea la primera para poder asignar productos.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-3 py-2">{c.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
