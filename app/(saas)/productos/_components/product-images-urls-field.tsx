"use client";

import { useState } from "react";

interface ProductImagesUrlsFieldProps {
  name: string;
  defaultUrls: string[];
  disabled?: boolean;
}

/**
 * Lista de URLs de imágenes; cada input envía el mismo `name` para FormData.getAll().
 * Usa `key` en el padre al cambiar de producto para reiniciar estado.
 */
export function ProductImagesUrlsField({
  name,
  defaultUrls,
  disabled,
}: ProductImagesUrlsFieldProps) {
  const initial = defaultUrls.length > 0 ? defaultUrls : [""];
  const [urls, setUrls] = useState<string[]>(initial);

  const add = () => setUrls((prev) => [...prev, ""]);
  const remove = (i: number) =>
    setUrls((prev) => (prev.length <= 1 ? [""] : prev.filter((_, j) => j !== i)));
  const change = (i: number, v: string) =>
    setUrls((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });

  return (
    <div className="space-y-2">
      {urls.map((u, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            name={name}
            value={u}
            onChange={(e) => change(i, e.target.value)}
            placeholder="https://…"
            disabled={disabled}
            autoComplete="off"
            className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={disabled || urls.length <= 1}
            className="shrink-0 rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
          >
            Quitar
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        className="text-sm font-medium text-zinc-700 underline hover:text-zinc-900"
      >
        + Añadir imagen
      </button>
      <p className="text-xs text-zinc-500">
        La primera URL se usa como imagen principal en integraciones que solo leen un campo.
      </p>
    </div>
  );
}
