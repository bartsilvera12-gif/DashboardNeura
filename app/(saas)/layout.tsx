import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getCompanyModules } from "@/lib/config/company-config";
import { getCompanyBranding } from "@/lib/config/company-config";
import { SaasSidebar } from "./saas-sidebar";

export default async function SaasLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!session.user) {
    redirect("/login");
  }

  if (!session.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
        <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-amber-900">
            Perfil no encontrado
          </h2>
          <p className="mt-2 text-sm text-amber-800">
            Tu usuario no tiene un perfil en el sistema. Contacta al
            administrador para que ejecute la migración de perfiles.
          </p>
          <p className="mt-4 text-xs text-amber-700">
            Usuario: {session.user.email}
          </p>
        </div>
      </div>
    );
  }

  const companyId =
    session.activeCompanyId ??
    (session.companies.length === 1 ? session.companies[0].id : null);
  const { modules } = await getCompanyModules(companyId);
  const branding = await getCompanyBranding(companyId);

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="flex min-h-screen w-full min-w-0">
        <SaasSidebar
          modules={modules}
          session={session}
          branding={branding}
        />
        <section className="min-w-0 flex-1 px-2 py-3 sm:px-3 sm:py-4">
          {children}
        </section>
      </div>
    </div>
  );
}
