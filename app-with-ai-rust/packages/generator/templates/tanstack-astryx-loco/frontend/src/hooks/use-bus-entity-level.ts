import { useQueries } from "@tanstack/react-query";
import type { ADLevel } from "@/components/admin/ad-window-configs";
import {
  findTableForEntity,
  useSysTables,
  useSysWindows,
} from "@/hooks/use-dictionary-lists";
import type { FieldMetadata } from "@/hooks/use-entities";
import { apiClient } from "@/lib/api-client";

/**
 * Builds an ADLevel entirely from Application Dictionary metadata fetched
 * from the backend.  No field lists or display names are hardcoded.
 *
 * entityName: the bus_ entity name without prefix, e.g. 'account', 'contact'
 */
export function useBusEntityLevel(entityName: string) {
  // Only the two field lists are per-entity. The dictionary's own lists are
  // the same for every entity, so they come from the shared hooks and the
  // second entity page reads them out of the cache — see
  // `hooks/use-dictionary-lists.ts` for what that replaced.
  const results = useQueries({
    queries: [
      {
        queryKey: ["bus-form-fields", entityName],
        queryFn: () => apiClient.get<FieldMetadata[]>(`/bus/${entityName}/fields/form`),
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ["bus-grid-fields", entityName],
        queryFn: () => apiClient.get<FieldMetadata[]>(`/bus/${entityName}/fields/grid`),
        staleTime: 5 * 60 * 1000,
      },
    ],
  });

  const { data: tables, isLoading: tablesLoading } = useSysTables();
  const { data: windows, isLoading: windowsLoading } = useSysWindows();

  const [formQuery, gridQuery] = results;
  const isLoading =
    formQuery.isLoading || gridQuery.isLoading || tablesLoading || windowsLoading;

  const table = findTableForEntity(tables, entityName);
  const windowName = table?.name ?? entityName;
  // Match a window by its display name, or by the slug derived from that name.
  const win = windows?.find(
    (w) =>
      w.name.toLowerCase() === windowName.toLowerCase() ||
      w.name.toLowerCase().replace(/\s+/g, "-") === entityName
  );
  const windowMeta = {
    label: win?.name ?? table?.name ?? entityName,
    windowId: win?.sys_window_id,
    windowSlug: win?.name.toLowerCase().replace(/\s+/g, "-") ?? entityName,
  };

  const formFields: FieldMetadata[] = (formQuery.data as FieldMetadata[]) ?? [];
  const gridFields: FieldMetadata[] = (gridQuery.data as FieldMetadata[]) ?? [];
  const label = windowMeta.label;
  const windowSlug = windowMeta.windowSlug;

  // Derive the name field — first non-id identifier field, then common name fallbacks
  const NAME_FALLBACKS = ["name", "title", "first_name", "description", "type"];
  const nameField =
    formFields.find((f) => (f as any).is_identifier && f.column_name !== "id")?.column_name ??
    NAME_FALLBACKS.find((candidate) => formFields.some((f) => f.column_name === candidate)) ??
    "name";

  const level: ADLevel | null = isLoading
    ? null
    : {
        id: entityName,
        label,
        endpoint: `/bus/${entityName}`,
        idField: "id",
        nameField,
        searchField: nameField,
        formFields,
        gridFields,
        // Route path derived from Window name in Application Dictionary (kebab-case slug)
        baseRoutePath: `/${windowSlug}`,
      };

  return { level, isLoading };
}
