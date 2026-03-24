import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const oauthAuthError =
    sp.error === "auth"
      ? "No se pudo completar el inicio de sesión (enlace OAuth o código inválido). Vuelve a intentarlo."
      : null;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">DashboardNeura</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Inicia sesión para acceder al panel
        </p>
        <LoginForm initialAuthError={oauthAuthError} />
      </div>
    </main>
  );
}
