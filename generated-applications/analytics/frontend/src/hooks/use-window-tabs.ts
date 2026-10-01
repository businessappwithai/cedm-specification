import {
  type SysTabRow as SysTab,
  type SysWindowRow as SysWindow,
  useSysTables,
  useSysTabs,
  useSysWindows,
} from "@/hooks/use-dictionary-lists";

interface WindowAndTabsResult {
  window: SysWindow | null;
  tabs: SysTab[];
  isLoading: boolean;
}

export function useWindowAndTabs(tableName: string): WindowAndTabsResult {
  // All three lists are the dictionary's own and identical for every caller,
  // so they are shared queries rather than a bundle keyed by `tableName`. This
  // used to be one query per table that fetched the whole window and tab lists
  // each time; see `hooks/use-dictionary-lists.ts`.
  const { data: tables, isLoading: tablesLoading } = useSysTables();
  const { data: windows, isLoading: windowsLoading } = useSysWindows();
  const { data: tabs, isLoading: tabsLoading } = useSysTabs();

  const isLoading = tablesLoading || windowsLoading || tabsLoading;

  if (isLoading || !tableName) {
    return { window: null, tabs: [], isLoading };
  }

  const table = tables?.find((t) => t.table_name === tableName);
  if (!table?.sys_table_id) {
    return { window: null, tabs: [], isLoading: false };
  }

  const allTabs = tabs ?? [];
  const tableTabs = allTabs.filter((t) => t.sys_table_id === table.sys_table_id);
  const windowId = tableTabs[0]?.sys_window_id;
  const win = windows?.find((w) => w.sys_window_id === windowId) ?? null;
  const windowTabs = windowId
    ? allTabs.filter((t) => t.sys_window_id === windowId)
    : tableTabs;

  return { window: win, tabs: windowTabs, isLoading: false };
}

export function groupFieldsByTab(fields: any[], tabs: SysTab[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();
  for (const tab of tabs) {
    groups.set(tab.sys_tab_id, []);
  }
  for (const field of fields) {
    const tabId = field.sys_tab_id;
    if (groups.has(tabId)) {
      groups.get(tabId)?.push(field);
    }
  }
  return groups;
}

export function sortTabsBySequence(tabs: SysTab[]): SysTab[] {
  return [...tabs].sort((a, b) => (a.seq_no || 0) - (b.seq_no || 0));
}

export function getTabById(tabs: SysTab[], tabId: string): SysTab | undefined {
  return tabs.find((t) => t.sys_tab_id === tabId);
}
