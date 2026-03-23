"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCompany, updateCompany, setCompanyActive } from "@/lib/config/companies-service";
import type { CompanyType } from "@/lib/types/database";

const VALID_TYPES: CompanyType[] = ["ecommerce", "inmobiliaria", "servicios", "personalizado"];

export async function createCompanyAction(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const companyType = (formData.get("company_type") as string) || "personalizado";
  const description = formData.get("description") as string | null;
  const isActive = formData.get("is_active") !== "false";

  if (!name?.trim() || !slug?.trim()) {
    return { ok: false, error: "Nombre y slug son requeridos" };
  }

  const slugNormalized = slug.trim().toLowerCase().replace(/\s+/g, "-");
  if (!/^[a-z0-9-]+$/.test(slugNormalized)) {
    return { ok: false, error: "El slug solo puede contener letras minúsculas, números y guiones" };
  }

  const type = VALID_TYPES.includes(companyType as CompanyType)
    ? (companyType as CompanyType)
    : "personalizado";

  try {
    const company = await createCompany({
      name: name.trim(),
      slug: slugNormalized,
      company_type: type,
      description: description?.trim() || null,
      is_active: isActive,
    });
    if (!company) {
      return { ok: false, error: "No se pudo crear la empresa." };
    }
    revalidatePath("/empresas");
    redirect(`/empresas/${company.id}/configurar`);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}

export async function updateCompanyAction(
  id: string,
  formData: FormData
) {
  const name = formData.get("name") as string | null;
  const slug = formData.get("slug") as string | null;
  const companyType = formData.get("company_type") as string | null;
  const description = formData.get("description") as string | null;
  const isActive = formData.get("is_active");

  const input: Parameters<typeof updateCompany>[1] = {};
  if (name != null) input.name = name.trim();
  if (slug != null) input.slug = slug.trim();
  if (companyType != null && VALID_TYPES.includes(companyType as CompanyType)) {
    input.company_type = companyType as CompanyType;
  }
  if (description !== undefined) input.description = description?.trim() || null;
  if (isActive !== undefined && isActive !== null) {
    input.is_active = isActive !== "false";
  }

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
