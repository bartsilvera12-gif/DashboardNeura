"use client";

import { useRouter } from "next/navigation";
import { setActiveCompanyAction } from "./actions";

interface CompanySelectorProps {
  companies: Array<{ id: string; name: string; slug: string }>;
  activeCompanyId: string | null;
  isSuperAdmin: boolean;
  /** Tema del panel (sidebar oscuro en SaaS). */
  variant?: "light" | "dark";
}

export function CompanySelector({
  companies,
  activeCompanyId,
  isSuperAdmin,
  variant = "light",
}: CompanySelectorProps) {
  const router = useRouter();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    await setActiveCompanyAction(value || null);
    router.refresh();
  };

  if (companies.length === 0) return null;

  const isDark = variant === "dark";

  return (
    <div>
      <label
        htmlFor="company-select"
        className={`block text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
      >
        Empresa activa
      </label>
      <select
        id="company-select"
        value={activeCompanyId ?? ""}
        onChange={handleChange}
        className={
          isDark
            ? "mt-1 block w-full min-w-0 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 sm:px-3 sm:py-2 sm:text-sm"
            : "mt-1 block w-full min-w-0 rounded-md border border-zinc-300 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
        }
      >
        <option value="">{isSuperAdmin ? "Todas (vista general)" : "Seleccionar..."}</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
