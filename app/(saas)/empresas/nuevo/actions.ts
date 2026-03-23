"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { executeOnboarding } from "@/lib/config/onboarding-service";
import type { OnboardingInput } from "@/lib/config/onboarding-service";

export async function onboardingAction(payload: {
  company: {
    name: string;
    slug: string;
    company_type: string;
    description?: string;
    is_active: boolean;
    contact_name?: string;
    contact_phone?: string;
    modules: Array<{ module_id: string; is_enabled: boolean; sort_order: number }>;
    sections: Array<{
      module_section_id: string;
      is_enabled: boolean;
      sort_order: number;
    }>;
    widgets: Array<{
      widget_id: string;
      is_enabled: boolean;
      sort_order: number;
    }>;
    branding: {
      display_name: string | null;
      primary_color: string | null;
      logo_url: string | null;
    };
  };
  admin: {
    email: string;
    password: string;
    full_name: string;
  };
}) {
  // Solo Super Admin puede ejecutar onboarding
  const session = await getSession();
  if (!session.profile?.is_super_admin) {
    return {
      ok: false,
      error: "No tienes permisos para dar de alta clientes. Solo Super Admin.",
    };
  }

  const validTypes = ["ecommerce", "inmobiliaria", "servicios", "personalizado"];
  const companyType = validTypes.includes(payload.company.company_type)
    ? (payload.company.company_type as OnboardingInput["company"]["company_type"])
    : "personalizado";

  const input: OnboardingInput = {
    company: {
      name: payload.company.name.trim(),
      slug: payload.company.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      company_type: companyType,
      description: payload.company.description?.trim() || null,
      is_active: payload.company.is_active,
      contact_name: payload.company.contact_name?.trim() || "",
      contact_phone: payload.company.contact_phone?.trim() || "",
    },
    admin: {
      email: payload.admin.email.trim().toLowerCase(),
      password: payload.admin.password,
      full_name: payload.admin.full_name.trim(),
    },
    modules: {
      modules: payload.company.modules,
      sections: payload.company.sections,
    },
    widgets: {
      widgets: payload.company.widgets,
    },
    branding: payload.company.branding,
  };

  const result = await executeOnboarding(input);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/empresas");
  redirect(`/empresas/${result.companyId}/configurar`);
}
