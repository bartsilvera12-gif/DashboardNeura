"use client";

import { useMemo, useState } from "react";

interface ProductImagesUrlsFieldProps {
  defaultUrls: string[];
  disabled?: boolean;
}

/**
 * URLs en estado local; se envía un único `images_json` (array JSON) para evitar problemas
 * con FormData + Server Actions al repetir el mismo `name`.
 */
export function ProductImagesUrlsField({
  defaultUrls,
  disabled,
}: ProductImagesUrlsFieldProps) {
  const initial = defaultUrls.length > 0 ? defaultUrls : [""];
  const [urls, setUrls] = useState<string[]>(initial);

  const serialized = useMemo(
    () => JSON.stringify(urls.map((s) => s.trim()).filter(Boolean)),
    [urls]
  );

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
    <div className="min-w-0 space-y-2">
      <input type="hidden" name="images_json" value={serialized} readOnly />
      {urls.map((u, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
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
