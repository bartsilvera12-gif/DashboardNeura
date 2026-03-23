"use server";

import { cookies } from "next/headers";

export async function setActiveCompanyAction(companyId: string | null): Promise<void> {
  const cookieStore = await cookies();
  if (companyId) {
    cookieStore.set("saas-active-company", companyId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  } else {
    cookieStore.delete("saas-active-company");
  }
}
