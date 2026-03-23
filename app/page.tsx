import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
          DashboardNeura
        </span>
        <h1 className="mt-4 text-3xl font-bold text-zinc-900">
          Plataforma SaaS para e-commerce y gestión empresarial
        </h1>
        <p className="mt-3 text-zinc-600">
          Base inicial con módulos de Dashboard, Stock, Usuarios y Empresas.
          Inicia sesión para acceder al panel.
        </p>

        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-800"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
