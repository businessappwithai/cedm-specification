/**
 * The Application Dictionary's own lists, fetched once per session.
 *
 * `sys_table`, `sys_window` and `sys_tab` describe the application rather than
 * its data: they change when an administrator edits the dictionary, not when
 * somebody creates a record. Three hooks used to fetch them under keys scoped
 * to the *entity being viewed* — `["sys-window-for-entity", entityName]`,
 * `["window-tabs", tableName]`, `entityKeys.table(entity)` — so opening
 * Compound, then Experiment, then Sample re-fetched the whole table list three
 * times and the whole window list twice, for three identical answers.
 *
 * Keyed by the list itself, the second reader is a cache hit and so is the next
 * screen. That is the only thing these hooks do: a caller that wants the row
 * for one entity filters the list it already has, because the alternative is a
 * request per entity for data that is the same for all of them.
 *
 * `LIST_LIMIT` is one number on purpose. Callers used 500, 200, 100 and the
 * server's own default of 200, and a hook that asked for fewer rows than
 * another got a different answer to the same question — a dictionary of 250
 * tables would have resolved an entity on one screen and not on the next. The
 * server clamps at 1000 (`MAX_LIMIT` in `controllers/sys.rs`), so an
 * application with more dictionary rows than this needs paging here rather
 * than a larger constant.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient, type PaginatedResponse } from "@/lib/api-client";

export const LIST_LIMIT = 500;

/** Long, because the dictionary changes on an admin's edit, not on a write. */
const DICTIONARY_STALE_TIME = 30 * 60 * 1000;

export const dictionaryKeys = {
  tables: ["dictionary", "tables"] as const,
  windows: ["dictionary", "windows"] as const,
  tabs: ["dictionary", "tabs"] as const,
};

export interface SysTableRow {
  sys_table_id: string;
  table_name: string;
  name: string;
  description?: string;
  icon?: string | null;
  [key: string]: unknown;
}

export interface SysWindowRow {
  sys_window_id: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface SysTabRow {
  sys_tab_id: string;
  sys_window_id: string;
  sys_table_id: string;
  name: string;
  description?: string;
  tab_level: number;
  seq_no: number;
  is_active: boolean;
  [key: string]: unknown;
}

async function list<T>(segment: string): Promise<T[]> {
  const response = await apiClient.get<PaginatedResponse<T>>(`/sys/${segment}`, {
    limit: LIST_LIMIT,
  });
  return response?.data ?? [];
}

export function useSysTables() {
  return useQuery({
    queryKey: dictionaryKeys.tables,
    queryFn: () => list<SysTableRow>("tables"),
    staleTime: DICTIONARY_STALE_TIME,
  });
}

export function useSysWindows() {
  return useQuery({
    queryKey: dictionaryKeys.windows,
    queryFn: () => list<SysWindowRow>("windows"),
    staleTime: DICTIONARY_STALE_TIME,
  });
}

export function useSysTabs() {
  return useQuery({
    queryKey: dictionaryKeys.tabs,
    queryFn: () => list<SysTabRow>("tabs"),
    staleTime: DICTIONARY_STALE_TIME,
  });
}

/**
 * What a person calls an entity: the name of the window it opens in.
 *
 * A table's own `name` is the dictionary's, not the screen's. The window an
 * entity opens in is found through its top tab (`tab_level` 0), and its name —
 * or, for a line item that has no window of its own, its tab's — is what every
 * picker, heading and list draws. Returns `undefined` until the lists load, so a
 * caller shows nothing rather than a table name in the meantime.
 */
export function useEntityLabel(): (table: { sys_table_id: string }) => string | undefined {
  const { data: windows } = useSysWindows();
  const { data: tabs } = useSysTabs();
  return (table) => {
    const tab = (tabs ?? [])
      .filter((candidate) => candidate.sys_table_id === table.sys_table_id)
      .sort((a, b) => a.tab_level - b.tab_level || a.seq_no - b.seq_no)[0];
    if (!tab) return undefined;
    const window = (windows ?? []).find((w) => w.sys_window_id === tab.sys_window_id);
    return tab.tab_level === 0 ? (window?.name ?? tab.name) : tab.name;
  };
}

/**
 * The `sys_table` row for a `bus_` entity slug.
 *
 * Accepts both spellings a route can carry: `sales-order` and `sales_order`
 * both name `bus_sales_order`.
 */
export function findTableForEntity(
  tables: SysTableRow[] | undefined,
  entityName: string
): SysTableRow | undefined {
  if (!tables) return undefined;
  const candidates = [`bus_${entityName}`, `bus_${entityName.replace(/-/g, "_")}`];
  return tables.find((table) => candidates.includes(table.table_name));
}
