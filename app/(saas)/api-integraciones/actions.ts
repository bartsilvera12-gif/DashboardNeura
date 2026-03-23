"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  createApiKey,
  toggleApiKey,
  deleteApiKey,
} from "@/lib/config/api-keys-service";
import { getCompanies } from "@/lib/config/company-config";

export async function createApiKeyAction(formData: FormData): Promise<
  | { ok: true; key: string; prefix: string; companyName: string }
  | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session.profile?.is_super_admin) {
    return { ok: false, error: "Sin permisos" };
  }

  const companyId = formData.get("company_id") as string;
  const name = (formData.get("name") as string)?.trim() || null;

  if (!companyId) {
    return { ok: false, error: "Selecciona una empresa" };
  }

  const result = await createApiKey(companyId, name);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const companies = await getCompanies();
  const company = companies.find((c) => c.id === companyId);
  const companyName = company?.name ?? "Empresa";

  revalidatePath("/api-integraciones");
  return { ok: true, key: result.key, prefix: result.prefix, companyName };
}

export async function toggleApiKeyAction(id: string, isActive: boolean): Promise<{
  ok: boolean;
  error?: string;
}> {
  const session = await getSession();
  if (!session.profile?.is_super_admin) {
    return { ok: false, error: "Sin permisos" };
  }

  const result = await toggleApiKey(id, isActive);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  revalidatePath("/api-integraciones");
  return { ok: true };
}

export async function deleteApiKeyAction(id: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const session = await getSession();
  if (!session.profile?.is_super_admin) {
    return { ok: false, error: "Sin permisos" };
  }

  const result = await deleteApiKey(id);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  revalidatePath("/api-integraciones");
  return { ok: true };
}
