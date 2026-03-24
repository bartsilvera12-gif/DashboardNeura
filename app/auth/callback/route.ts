import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";
  const origin = request.nextUrl.origin;

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const target = next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(new URL(target, origin).toString());
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[auth/callback] exchangeCodeForSession:", error.message);
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin).toString());
}
