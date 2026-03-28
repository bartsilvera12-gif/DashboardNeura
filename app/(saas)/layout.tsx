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

  const companyId =
    session.activeCompanyId ??
    (session.companies.length === 1 ? session.companies[0].id : null);
  const { modules } = await getCompanyModules(companyId);
  const branding = await getCompanyBranding(companyId);

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto flex max-w-7xl">
        <SaasSidebar
          modules={modules}
          session={session}
          branding={branding}
        />
        <section className="flex-1 p-6">{children}</section>
      </div>
    </div>
  );
}
