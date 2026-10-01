/**
 * The navigation this caller may actually open.
 *
 * `/api/me/dashboard` answers the whole front page in one request, scoped to
 * the caller: the categories with the entities inside them, the admin windows
 * it may open, its role and its master flag. It answers from the same rows
 * `/api/bus/*` is guarded by, so what a screen offers is what opens.
 *
 * It lives here rather than inside the dashboard route because **two** surfaces
 * draw that navigation now — the dashboard's cards and the sidebar. One query
 * key means the sidebar costs no request of its own: whichever renders first
 * fetches, the other reads the cache, and every later screen keeps the sidebar
 * without asking again.
 *
 * That sharing is also what stops the sidebar drifting. It used to carry its
 * own hardcoded lists — a `navItems` array with the entities interpolated at
 * generation time and their icons guessed from their names, and an `adminItems`
 * array naming six admin screens, one of which (`/admin/dictionary`) does not
 * exist in the generated application at all. A menu is a claim about what the
 * application has; deriving it from the dictionary is what makes the claim
 * true, and RBAC-scoped into the bargain.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface DashboardTable {
  sys_table_id: string;
  table_name: string;
  name: string;
  description?: string;
  icon?: string | null;
  is_active: boolean;
}

/** A dictionary category with the entities assigned to it. */
export interface DashboardCategory {
  sys_category_id: string | null;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  entities: DashboardTable[];
}

export interface DashboardWindow {
  sys_window_id: string;
  name: string;
  /** Where clicking it goes — `sys_window.description` for an admin screen. */
  route: string | null;
  /** A lucide icon id from `sys_window.icon`. Null when the row names none. */
  icon: string | null;
  category: "admin" | "business";
  is_read_only: boolean;
}

export interface DashboardResponse {
  data: DashboardCategory[];
  windows: DashboardWindow[];
  role: string;
  isMaster: boolean;
}

export function useDashboard() {
  return useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: () => apiClient.get<DashboardResponse>("/me/dashboard"),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Where an entity's screen lives.
 *
 * Derived from the display name rather than from `table_name`, because that is
 * what the route tree was built against: `Chemical Inventory` is
 * `/chemical-inventory`, where stripping `bus_` would give
 * `/chemical_inventory` and 404. One helper so the dashboard's cards and the
 * sidebar's links cannot disagree about it.
 */
export function entityHref(table: Pick<DashboardTable, "name">): string {
  return `/${table.name.toLowerCase().replace(/\s+/g, "-")}`;
}

/** The admin windows this caller may open, in the order the dictionary gives. */
export function adminWindows(
  dashboard: DashboardResponse | undefined
): Array<DashboardWindow & { route: string }> {
  return (dashboard?.windows ?? []).filter(
    (window): window is DashboardWindow & { route: string } =>
      window.category === "admin" &&
      typeof window.route === "string" &&
      window.route.length > 0
  );
}
