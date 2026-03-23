"use client";

import { useRouter } from "next/navigation";
import { setActiveCompanyAction } from "./actions";

interface CompanySelectorProps {
  companies: Array<{ id: string; name: string; slug: string }>;
  activeCompanyId: string | null;
  isSuperAdmin: boolean;
}

export function CompanySelector({
  companies,
  activeCompanyId,
  isSuperAdmin,
}: CompanySelectorProps) {
  const router = useRouter();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    await setActiveCompanyAction(value || null);
    router.refresh();
  };

  if (companies.length === 0) return null;

  return (
    <div>
      <label
        htmlFor="company-select"
        className="block text-xs font-medium text-zinc-500"
      >
        Empresa activa
      </label>
      <select
        id="company-select"
        value={activeCompanyId ?? ""}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
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
