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
      className="flex w-[10.5rem] shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 px-2 py-3 sm:w-48 sm:px-2.5 sm:py-4"
      style={{ "--brand-color": primaryColor } as React.CSSProperties}
    >
      <div className="flex min-w-0 items-center gap-2">
        {branding?.logo_url ? (
          <img
            src={branding.logo_url}
            alt="Logo"
            className="h-7 w-auto shrink-0 object-contain sm:h-8"
          />
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold leading-tight text-zinc-50 sm:text-lg">
            {displayName}
          </h2>
          <p className="text-[10px] text-zinc-500 sm:text-xs">
            {session.profile?.is_super_admin ? "Super Admin" : "Panel"}
          </p>
        </div>
      </div>

      {(session.companies.length > 1 || session.profile?.is_super_admin) &&
      session.companies.length > 0 ? (
        <div className="mt-3 sm:mt-4">
          <CompanySelector
            companies={session.companies}
            activeCompanyId={
              session.activeCompanyId ??
              (session.companies.length === 1 ? session.companies[0].id : null)
            }
            isSuperAdmin={session.profile?.is_super_admin ?? false}
            variant="dark"
          />
        </div>
      ) : null}

      <nav className="mt-4 space-y-0.5 sm:mt-5 sm:space-y-1">
        {modules.map((module) => (
          <Link
            key={module.id}
            href={module.path}
            className="block rounded-md px-2 py-1.5 text-[13px] font-medium leading-snug text-zinc-300 hover:bg-zinc-800/90 hover:text-white sm:px-2.5 sm:py-2 sm:text-sm"
          >
            {module.name}
          </Link>
        ))}
        {session.profile?.is_super_admin ? (
          <Link
            href="/api-integraciones"
            className="block rounded-md px-2 py-1.5 text-[13px] font-medium leading-snug text-zinc-300 hover:bg-zinc-800/90 hover:text-white sm:px-2.5 sm:py-2 sm:text-sm"
          >
            API e Integraciones
          </Link>
        ) : null}
      </nav>

      <div className="mt-auto border-t border-zinc-800 pt-4 sm:pt-5">
        <p className="truncate text-xs text-zinc-500">{session.user?.email}</p>
        <form action={signOutAction} className="mt-2">
          <button
            type="submit"
            className="text-sm font-medium text-zinc-400 hover:text-white"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
