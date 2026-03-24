"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ResolvedProductColumn } from "@/lib/config/product-column-types";
import type { Product } from "@/lib/types/product";
import type { CompanyCategory } from "@/lib/config/company-categories-service";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "../actions";
import { CategorySelect } from "./category-select";
import { ProductImagesUrlsField } from "./product-images-urls-field";
import { normalizeProductImageUrls } from "@/lib/utils/product-images";
import { sr, SaasStatusBadge } from "../../_components/saas-report-table";

interface CatalogoSectionProps {
  companyId: string;
  products: Product[];
  columns: ResolvedProductColumn[];
  stockColumns?: ResolvedProductColumn[];
  categories: CompanyCategory[];
  openFormOnMount?: boolean;
  onOpenFormChange?: (open: boolean) => void;
  onSwitchToCategories?: () => void;
}

/** Caracteres visibles en la tabla para descripción (el resto va en tooltip). */
const DESCRIPTION_LIST_MAX_CHARS = 100;

function formatValue(val: unknown, key?: string): string {
  if (val == null) return "—";
  if (key === "images" && Array.isArray(val)) {
    const n = val.length;
    if (n === 0) return "—";
    return `${n} imagen${n === 1 ? "" : "es"}`;
  }
  if (typeof val === "boolean") return val ? "Sí" : "No";
  if (typeof val === "number") return String(val);
  return String(val);
}

function renderCatalogListCell(p: Product, col: ResolvedProductColumn): ReactNode {
  if (col.key === "description") {
    const raw = p[col.key];
    if (raw == null || String(raw).trim() === "") {
      return <span className="text-zinc-600">—</span>;
    }
    const full = String(raw).trim();
    if (full.length <= DESCRIPTION_LIST_MAX_CHARS) {
      return <span className="block max-w-md text-zinc-300">{full}</span>;
    }
    const short =
      full.slice(0, DESCRIPTION_LIST_MAX_CHARS).trimEnd() + "…";
    return (
      <span
        className="block max-w-md leading-snug text-zinc-300"
        title={full}
      >
        {short}
      </span>
    );
  }
  if (col.key === "status") {
    const raw = p[col.key];
    if (raw == null || String(raw).trim() === "") {
      return <span className="text-zinc-600">—</span>;
    }
    const t = String(raw).trim();
    const lower = t.toLowerCase();
    let variant: "active" | "inactive" | "neutral" = "neutral";
    if (/dispon|activ|ok|vigente|publicad/.test(lower)) variant = "active";
    else if (/inactiv|no dispon|agotado|paus/.test(lower)) {
      variant = "inactive";
    }
    return <SaasStatusBadge variant={variant}>{t}</SaasStatusBadge>;
  }
  if (col.key === "featured") {
    const v = p[col.key] as unknown;
    if (v === true || v === "true" || v === "1") {
      return <SaasStatusBadge variant="active">Sí</SaasStatusBadge>;
    }
    return <SaasStatusBadge variant="inactive">No</SaasStatusBadge>;
  }
  return formatValue(p[col.key], col.key);
}

const PRODUCT_TYPE_OPTIONS = [
  { value: "ecommerce", label: "E-commerce (con stock)" },
  { value: "servicios", label: "Servicios (sin stock)" },
  { value: "inmobiliaria", label: "Inmobiliaria" },
];

const STOCK_DEPENDENT_KEYS = ["stock", "min_stock", "max_stock", "reorder_point"];

export function CatalogoSection({ companyId, products, columns, stockColumns = [], categories, openFormOnMount, onOpenFormChange, onSwitchToCategories }: CatalogoSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [productType, setProductType] = useState<string>("ecommerce");
  const [trackStock, setTrackStock] = useState(true);

  useEffect(() => {
    if (openFormOnMount) {
      setShowForm(true);
      setEditing(null);
      onOpenFormChange?.(false);
    }
  }, [openFormOnMount, onOpenFormChange]);

  useEffect(() => {
    if (editing) {
      setProductType(String(editing.product_type ?? "ecommerce"));
      setTrackStock(editing.track_stock ?? true);
    } else {
      setProductType("ecommerce");
      setTrackStock(true);
    }
  }, [editing]);

  const formCols = columns.filter((c) => c.show_in_form);
  const stockFormCols = stockColumns.filter((c) => c.show_in_form);
  const listCols = columns.filter((c) => c.show_in_list);
  const showStockSection = stockFormCols.length > 0 && productType !== "servicios";
  const showStockDependentFields = showStockSection && trackStock;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    try {
      const fd = new FormData(form);
      const result = editing
        ? await updateProductAction(editing.id, fd)
        : await createProductAction(companyId, fd);
      if (!result.ok) {
        setError(result.error ?? "Error");
        return;
      }
      setShowForm(false);
      setEditing(null);
      form.reset();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string, productName: string | null) => {
    const label = productName?.trim() || "este producto";
    if (!window.confirm(`¿Eliminar ${label}? No aparecerá en el catálogo ni en la API pública.`)) {
      return;
    }
    setError(null);
    setDeletingId(productId);
    try {
      const result = await deleteProductAction(productId, companyId);
      if (!result.ok) {
        setError(result.error ?? "No se pudo eliminar");
        return;
      }
      if (editing?.id === productId) {
        setShowForm(false);
        setEditing(null);
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar. Intenta de nuevo."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (p: Product) => {
    setError(null);
    setEditing(p);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setError(null);
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-900">Catálogo</h2>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true); setError(null); }}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Nuevo producto
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">{editing ? "Editar producto" : "Nuevo producto"}</h3>
            <button type="button" onClick={closeForm} className="text-sm text-zinc-500 hover:text-zinc-700">
              Cerrar
            </button>
          </div>
          {stockFormCols.length > 0 && (
            <div className="mb-4">
              <label className="text-xs font-medium text-zinc-600">Tipo de producto</label>
              <select
                name="product_type"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="mt-1 block w-full max-w-xs rounded border border-zinc-300 px-2 py-1.5 text-sm"
              >
                {PRODUCT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <h4 className="mb-2 text-sm font-medium text-zinc-700">Catálogo</h4>
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {formCols.map((col) => {
              const val = editing ? (editing[col.key] ?? "") : "";
              const isCheckbox = col.type === "boolean";
              const isCategorySelect = col.type === "category_select";
              return (
                <div key={col.key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600">
                    {col.label} {col.required ? "*" : ""}
                  </label>
                  {isCategorySelect ? (
                    <>
                      {categories.length === 0 ? (
                        <div className="rounded border border-amber-200 bg-amber-50 px-2 py-2 text-sm text-amber-800">
                          No hay categorías.{" "}
                          <button
                            type="button"
                            onClick={() => onSwitchToCategories?.()}
                            className="cursor-pointer font-medium underline hover:no-underline"
                          >
                            Crea categorías primero
                          </button>
                          {" "}y volverás aquí para elegir una.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <CategorySelect
                            key={`${col.key}-${editing?.id ?? "new"}`}
                            name={col.key}
                            categories={categories}
                            defaultValue={String(val ?? "")}
                            required={col.required}
                            disabled={!col.editable}
                            placeholder="Buscar o elegir categoría"
                          />
                          <button
                            type="button"
                            onClick={() => onSwitchToCategories?.()}
                            className="cursor-pointer text-xs text-zinc-500 underline hover:text-zinc-700"
                          >
                            + Añadir nueva categoría
                          </button>
                        </div>
                      )}
                    </>
                  ) : col.type === "image_urls_multi" ? (
                    <ProductImagesUrlsField
                      key={`images-${editing?.id ?? "new"}`}
                      defaultUrls={editing ? normalizeProductImageUrls(editing) : []}
                      disabled={!col.editable}
                    />
                  ) : isCheckbox ? (
                    <input
                      type="checkbox"
                      name={col.key}
                      defaultChecked={val === true || val === "true" || val === "1"}
                      value="true"
                      disabled={!col.editable}
                      className="h-4 w-4"
                    />
                  ) : col.type === "textarea" ? (
                    <textarea
                      name={col.key}
                      defaultValue={String(val ?? "")}
                      required={col.required}
                      disabled={!col.editable}
                      rows={2}
                      className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  ) : (
                    <input
                      type={col.type === "number" ? "number" : "text"}
                      name={col.key}
                      defaultValue={String(val ?? "")}
                      required={col.required}
                      disabled={!col.editable}
                      step={col.type === "number" ? "any" : undefined}
                      className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {showStockSection && (
            <>
              <h4 className="mb-2 text-sm font-medium text-zinc-700">Stock</h4>
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                {stockFormCols
                  .filter((col) => !(STOCK_DEPENDENT_KEYS.includes(col.key) && !showStockDependentFields))
                  .map((col) => {
                  const isCheckbox = col.type === "boolean";
                  const numDefault =
                    editing ? (editing[col.key] ?? (col.key === "stock" ? 0 : "")) : (col.key === "stock" ? 0 : "");
                  return (
                    <div key={col.key} className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-zinc-600">
                        {col.label} {col.required ? "*" : ""}
                      </label>
                      {isCheckbox ? (
                        <div className="flex items-center gap-2">
                          {col.key === "track_stock" ? (
                            <>
                              <input
                                type="checkbox"
                                checked={trackStock}
                                onChange={(e) => setTrackStock(e.target.checked)}
                                disabled={!col.editable}
                                className="h-4 w-4"
                              />
                              <input type="hidden" name={col.key} value={trackStock ? "true" : "false"} readOnly />
                            </>
                          ) : (
                            <input
                              type="checkbox"
                              name={col.key}
                              defaultChecked={
                                editing ? (editing[col.key] === true || editing[col.key] === "true") : false
                              }
                              value="true"
                              disabled={!col.editable}
                              className="h-4 w-4"
                            />
                          )}
                        </div>
                      ) : (
                        <input
                          type="number"
                          name={col.key}
                          defaultValue={String(numDefault ?? "")}
                          required={col.required}
                          disabled={!col.editable}
                          step="any"
                          min={0}
                          className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? "Guardando…" : editing ? "Actualizar" : "Crear"}
            </button>
            <button type="button" onClick={closeForm} className="rounded border border-zinc-300 px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className={sr.shell}>
        <div className={sr.scroll}>
          <table className={`${sr.table} min-w-[600px]`}>
            <thead>
              <tr className={sr.theadTr}>
                {listCols.map((c) => (
                  <th key={c.key} className={sr.th}>
                    {c.label}
                  </th>
                ))}
                <th className={sr.thRight}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={listCols.length + 1}
                    className={sr.empty}
                  >
                    No hay productos. Crea uno para comenzar.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className={sr.tr}>
                    {listCols.map((c) => (
                      <td
                        key={c.key}
                        className={`max-w-[min(20rem,35vw)] align-top ${
                          c.key === "name" ? sr.tdLead : sr.td
                        }`}
                      >
                        {renderCatalogListCell(p, c)}
                      </td>
                    ))}
                    <td className={sr.actions}>
                      <div className={sr.actionsInner}>
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className={sr.actionPrimary}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deletingId === p.id}
                          className={sr.actionDanger}
                        >
                          {deletingId === p.id ? "Eliminando…" : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
