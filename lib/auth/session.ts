import { dbFrom } from "@/lib/db/schema";
/**
 * Utilidades de sesión y usuario para el SaaS.
 * Obtiene usuario autenticado, perfil y empresa activa.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export interface SessionUser {
  id: string;
  email: string | null;
}

export interface SessionProfile extends Profile {
  is_super_admin: boolean;
}

export interface SessionData {
  user: SessionUser | null;
  profile: SessionProfile | null;
  activeCompanyId: string | null;
  companies: Array<{ id: string; name: string; slug: string }>;
}

/**
 * Obtiene la sesión completa: usuario, perfil y empresa activa.
 * La empresa activa se lee de la cookie 'saas-active-company'.
 */
export async function getSession(): Promise<SessionData> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      activeCompanyId: null,
      companies: [],
    };
  }

  const { data: profile } = await dbFrom(supabase, "profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const companies = await getCompaniesForUser(supabase, user.id, profile?.is_super_admin ?? false);

  const activeCompanyId = await getActiveCompanyId();

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: profile ?? null,
    activeCompanyId,
    companies: companies.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
  };
}

/**
 * Obtiene las empresas a las que el usuario tiene acceso.
 * Super Admin: todas. Otros: solo las que tienen en user_company_roles.
 */
async function getCompaniesForUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  isSuperAdmin: boolean
) {
  try {
    if (isSuperAdmin) {
      const { data } = await dbFrom(supabase, "companies")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      return data ?? [];
    }

    const { data } = await dbFrom(supabase, "user_company_roles")
      .select("company_id")
      .eq("user_id", userId);

    const companyIds = [...new Set((data ?? []).map((r) => r.company_id))];
    if (companyIds.length === 0) return [];

    const { data: companies } = await dbFrom(supabase, "companies")
      .select("id, name, slug")
      .in("id", companyIds)
      .eq("is_active", true)
      .order("name");

    return companies ?? [];
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getCompaniesForUser]", e);
    }
    return [];
  }
}

/**
 * Lee la empresa activa desde la cookie.
 * Se usa en el servidor; la cookie se establece desde el cliente.
 */
async function getActiveCompanyId(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const value = cookieStore.get("saas-active-company")?.value;
  return value || null;
}
