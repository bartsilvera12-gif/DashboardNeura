import Link from "next/link";

export default function Home() {
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
          El siguiente paso es conectar Supabase Auth y definir permisos por
          empresa.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-200 px-4 py-3 font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/empresas"
            className="rounded-lg border border-zinc-200 px-4 py-3 font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Ver Empresas
          </Link>
        </div>
      </div>
    </main>
  );
}
