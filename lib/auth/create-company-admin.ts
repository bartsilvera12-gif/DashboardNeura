import { dbFrom } from "@/lib/db/schema";
/**
 * Crea un usuario admin principal para una empresa.
 * Usa Supabase Auth Admin API (requiere Service Role Key).
 * Incluye rollback de Auth si falla profile o user_company_roles.
 */

import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { deleteAuthUser } from "./rollback-auth-user";

export interface CreateCompanyAdminInput {
  email: string;
  password: string;
  fullName: string;
  companyId: string;
}

export type CreateCompanyAdminErrorCode =
  | "VALIDATION"
  | "AUTH_USER_EXISTS"
  | "AUTH_FAILED"
  | "PROFILE_FAILED"
  | "ROLE_NOT_FOUND"
  | "UCR_FAILED";

export interface CreateCompanyAdminResult {
  ok: boolean;
  userId?: string;
  error?: string;
  errorCode?: CreateCompanyAdminErrorCode;
}

/**
 * Crea el usuario en Auth, perfil y asigna company_admin.
 * Si falla después de crear el usuario en Auth, lo elimina (rollback).
 */
export async function createCompanyAdmin(
  input: CreateCompanyAdminInput
): Promise<CreateCompanyAdminResult> {
  const { email, password, fullName, companyId } = input;

  const emailTrimmed = email.trim().toLowerCase();
  if (!emailTrimmed || !password) {
    return {
      ok: false,
      error: "Email y contraseña son requeridos",
      errorCode: "VALIDATION",
    };
  }

  if (password.length < 6) {
    return {
      ok: false,
      error: "La contraseña debe tener al menos 6 caracteres",
      errorCode: "VALIDATION",
    };
  }

  let userId: string | null = null;

  try {
    const supabase = getSupabaseAdminClient();
    console.log("[ONBOARDING] createCompanyAdmin: Creando usuario Auth", { email: emailTrimmed });

    // 1. Crear usuario en Auth (email confirmado para que pueda iniciar sesión)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: emailTrimmed,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
      },
    });

    if (authError) {
      const authMsg = authError?.message ?? "";
      if (
        authMsg.includes("already been registered") ||
        authMsg.includes("already exists")
      ) {
        return {
          ok: false,
          error: "Ya existe un usuario con ese correo",
          errorCode: "AUTH_USER_EXISTS",
        };
      }
      console.error("createCompanyAdmin auth error:", authError);
      return {
        ok: false,
        error: "No se pudo crear el usuario. Verifica que el correo sea válido.",
        errorCode: "AUTH_FAILED",
      };
    }

    userId = authData.user?.id ?? null;
    if (!userId) {
      return {
        ok: false,
        error: "No se pudo crear el usuario",
        errorCode: "AUTH_FAILED",
      };
    }
    console.log("[ONBOARDING] createCompanyAdmin: Usuario Auth creado", { userId });

    // 2. Crear o actualizar perfil
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (dbFrom(supabase, "profiles") as any).upsert(
      {
        id: userId,
        email: emailTrimmed,
        full_name: fullName.trim(),
        is_super_admin: false,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("[ONBOARDING ERROR] createCompanyAdmin profile:", profileError);
      await deleteAuthUser(userId);
      return {
        ok: false,
        error: "Error al crear el perfil del administrador",
        errorCode: "PROFILE_FAILED",
      };
    }

    // 3. Obtener role_id de company_admin (crear si no existe - fail-safe)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: role } = await (dbFrom(supabase, "roles") as any).select("id").eq("code", "company_admin").single();

    if (!role) {
      console.log("[ONBOARDING] createCompanyAdmin: rol company_admin no encontrado, intentando crearlo...");
      const { data: newRole, error: insertRoleError } = await (dbFrom(supabase, "roles") as any)
        .insert({ code: "company_admin", name: "Administrador de empresa" })
        .select("id")
        .single();
      if (insertRoleError || !newRole) {
        console.error("[ONBOARDING ERROR] createCompanyAdmin: no se pudo crear rol:", insertRoleError);
        await deleteAuthUser(userId);
        return {
          ok: false,
          error: "Rol company_admin no configurado. Ejecuta: npm run db:migrate-roles",
          errorCode: "ROLE_NOT_FOUND",
        };
      }
      role = newRole;
      console.log("[ONBOARDING] createCompanyAdmin: rol company_admin creado automáticamente");
    }

    // 4. Asignar user_company_roles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: ucrError } = await (dbFrom(supabase, "user_company_roles") as any).insert({
      user_id: userId,
      company_id: companyId,
      role_id: role.id,
    });

    if (ucrError) {
      console.error("[ONBOARDING ERROR] createCompanyAdmin user_company_roles:", ucrError);
      await deleteAuthUser(userId);
      return {
        ok: false,
        error: "Error al asignar el rol al administrador",
        errorCode: "UCR_FAILED",
      };
    }

    console.log("[ONBOARDING] createCompanyAdmin: OK - perfil y roles asignados");
    return { ok: true, userId };
  } catch (e) {
    console.error("[ONBOARDING ERROR] createCompanyAdmin excepción:", e);
    if (userId) {
      await deleteAuthUser(userId);
    }
    const errMsg = e instanceof Error ? e.message : e != null ? String(e) : "Error al crear el administrador";
    return {
      ok: false,
      error: errMsg,
    };
  }
}
