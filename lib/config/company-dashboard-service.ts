/**
 * Servicio para configurar widgets del dashboard por empresa.
 */

import { getSupabaseClient } from "@/lib/supabase";
import type { DashboardWidget } from "@/lib/types/database";

export interface CompanyWidgetConfig {
  widget_id: string;
  is_enabled: boolean;
  config?: Record<string, unknown>;
  sort_order: number;
}

export async function getAllDashboardWidgets(): Promise<DashboardWidget[]> {
  try {
    const supabase = await getSupabaseClient();
    const { data } = await supabase
      .from("dashboard_widgets")
      .select("*")
      .order("sort_order");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getCompanyDashboardWidgetsConfig(companyId: string): Promise<
  Map<string, { is_enabled: boolean; config: Record<string, unknown>; sort_order: number }>
> {
  try {
    const supabase = await getSupabaseClient();
    const { data } = await supabase
      .from("company_dashboard_widgets")
      .select("widget_id, is_enabled, config, sort_order")
      .eq("company_id", companyId);

    const map = new Map<string, { is_enabled: boolean; config: Record<string, unknown>; sort_order: number }>();
    for (const row of data ?? []) {
      map.set(row.widget_id, {
        is_enabled: row.is_enabled,
        config: (row.config as Record<string, unknown>) ?? {},
        sort_order: row.sort_order,
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

export async function setCompanyDashboardWidgets(
  companyId: string,
  configs: CompanyWidgetConfig[]
): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient();
    await supabase.from("company_dashboard_widgets").delete().eq("company_id", companyId);

    if (configs.length > 0) {
      const rows = configs.map((c) => ({
        company_id: companyId,
        widget_id: c.widget_id,
        is_enabled: c.is_enabled,
        config: c.config ?? {},
        sort_order: c.sort_order,
      }));
      const { error } = await supabase.from("company_dashboard_widgets").insert(rows);
      if (error) {
        console.error("setCompanyDashboardWidgets error:", error);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.error("setCompanyDashboardWidgets:", e);
    return false;
  }
}
