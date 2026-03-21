import Link from "next/link";

const modules = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/stock", label: "Stock" },
  { href: "/usuarios", label: "Usuarios" },
  { href: "/empresas", label: "Empresas" },
];

export default function SaasLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto flex max-w-7xl">
        <aside className="w-64 border-r border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">DashboardNeura</h2>
          <p className="mt-1 text-sm text-zinc-500">Panel de administración</p>
          <nav className="mt-6 space-y-2">
            {modules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                {module.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="flex-1 p-6">{children}</section>
      </div>
    </div>
  );
}
