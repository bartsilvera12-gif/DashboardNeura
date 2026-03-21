"use server";

import { revalidatePath } from "next/cache";
import { createCompany, updateCompany, setCompanyActive } from "@/lib/config/companies-service";

export async function createCompanyAction(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  if (!name?.trim() || !slug?.trim()) {
    return { ok: false, error: "Nombre y slug son requeridos" };
  }

  const company = await createCompany({ name: name.trim(), slug: slug.trim() });
  if (!company) {
    return { ok: false, error: "No se pudo crear la empresa" };
  }

  revalidatePath("/empresas");
  return { ok: true, company };
}

export async function updateCompanyAction(
  id: string,
  formData: FormData
) {
  const name = formData.get("name") as string | null;
  const slug = formData.get("slug") as string | null;

  const input: { name?: string; slug?: string } = {};
  if (name != null) input.name = name.trim();
  if (slug != null) input.slug = slug.trim();

  const company = await updateCompany(id, input);
  if (!company) {
    return { ok: false, error: "No se pudo actualizar la empresa" };
  }

  revalidatePath("/empresas");
  revalidatePath(`/empresas/${id}`);
  return { ok: true, company };
}

export async function toggleCompanyActiveAction(id: string, isActive: boolean): Promise<void> {
  await setCompanyActive(id, isActive);
  revalidatePath("/empresas");
  revalidatePath(`/empresas/${id}`);
}
