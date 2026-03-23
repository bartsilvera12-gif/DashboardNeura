import Link from "next/link";
import type { SessionData } from "@/lib/auth/session";
import type { CompanyBranding } from "@/lib/types/database";
import type { CompanyModulesConfig } from "@/lib/config/company-config";
import { CompanySelector } from "./company-selector";
import { signOutAction } from "./auth-actions";

interface SaasSidebarProps {
  modules: CompanyModulesConfig["modules"];
  session: SessionData;
  branding: CompanyBranding | null;
}

export function SaasSidebar({ modules, session, branding }: SaasSidebarProps) {
  const displayName = branding?.display_name ?? "DashboardNeura";
  const primaryColor = branding?.primary_color ?? "#18181b";

  return (
    <aside
      className="w-64 border-r border-zinc-200 bg-white p-6"
      style={{ "--brand-color": primaryColor } as React.CSSProperties}
    >
      <div className="flex items-center gap-3">
        {branding?.logo_url ? (
          <img
            src={branding.logo_url}
            alt="Logo"
            className="h-8 w-auto object-contain"
          />
        ) : null}
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{displayName}</h2>
          <p className="text-xs text-zinc-500">
            {session.profile?.is_super_admin ? "Super Admin" : "Panel"}
          </p>
        </div>
      </div>

      {(session.companies.length > 1 || session.profile?.is_super_admin) &&
      session.companies.length > 0 ? (
        <div className="mt-4">
          <CompanySelector
            companies={session.companies}
            activeCompanyId={
              session.activeCompanyId ??
              (session.companies.length === 1 ? session.companies[0].id : null)
            }
            isSuperAdmin={session.profile?.is_super_admin ?? false}
          />
        </div>
      ) : null}

      <nav className="mt-6 space-y-2">
        {modules.map((module) => (
          <Link
            key={module.id}
            href={module.path}
            className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {module.name}
          </Link>
        ))}
        {session.profile?.is_super_admin ? (
          <Link
            href="/api-integraciones"
            className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            API e Integraciones
          </Link>
        ) : null}
      </nav>

      <div className="mt-auto border-t border-zinc-200 pt-6">
        <p className="truncate text-xs text-zinc-500">{session.user?.email}</p>
        <form action={signOutAction} className="mt-2">
          <button
            type="submit"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
