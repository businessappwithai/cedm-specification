/**
 * The business entities this application contains, and their fields.
 *
 * Read by anything that has to offer a choice of entity or of column — the
 * rule editors and the report designer today. It was written for the rule
 * screens and named after them; the second caller is what makes the name
 * wrong rather than the code, so the module moved and the code did not.
 *
 * Read from the Application Dictionary, not from a list in the source. The
 * previous version of the rule screens shipped a hard-coded array — `Account`,
 * `Contact`, `Opportunity`, `bus_patient` — left over from the CRM and clinic
 * models the templates were first written against. Every generated app
 * inherited it, so a drug-discovery app offered rules on *Patient* and
 * *Opportunity* and offered none on *Compound* or *Experiment*. The dictionary
 * is the only thing that knows what a given app actually contains.
 *
 * `/sys/*` reads are open, so these work before the caller has any particular
 * permission — the dictionary describes the data, it is not the data.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface DictionaryEntity {
  /** Physical table, e.g. `bus_compound`. What the rule is stored against. */
  value: string;
  /** Display name from the dictionary, e.g. `Compound`. */
  label: string;
  table: string;
}

interface TableRow {
  table_name: string;
  name?: string;
  is_active?: boolean;
}

interface ColumnRow {
  column_name: string;
  name?: string;
  seq_no?: number;
}

/** Rows out of a response that may be a bare array or `{ data: [...] }`. */
function rows<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const data = (payload as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}

/** Every business entity in this application, alphabetical by display name. */
export function useDictionaryEntities() {
  return useQuery<DictionaryEntity[]>({
    queryKey: ["dictionary-entities"],
    queryFn: async () => {
      const response = await apiClient.get<unknown>("/sys/tables", { limit: 500 });
      return rows<TableRow>(response)
        .filter((table) => table.table_name?.startsWith("bus_") && table.is_active !== false)
        .map((table) => ({
          value: table.table_name,
          label: table.name || table.table_name.replace(/^bus_/, ""),
          table: table.table_name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    // The dictionary changes when the model is regenerated, not while someone
    // is writing a rule.
    staleTime: 30 * 60 * 1000,
  });
}

/** The column names of one entity, in dictionary order. */
export function useDictionaryEntityFields(table: string | undefined) {
  return useQuery<string[]>({
    queryKey: ["dictionary-entity-fields", table],
    queryFn: async () => {
      const response = await apiClient.get<unknown>("/sys/columns", {
        table: table as string,
        limit: 500,
      });
      const seen = new Set<string>();
      return rows<ColumnRow>(response)
        .sort((a, b) => (a.seq_no ?? 0) - (b.seq_no ?? 0))
        .map((column) => column.column_name)
        .filter((name) => {
          // `/sys/columns` can return a column twice when a field is on more
          // than one tab; a duplicate in a field picker looks like a bug.
          if (!name || seen.has(name)) return false;
          seen.add(name);
          return true;
        });
    },
    enabled: !!table,
    staleTime: 30 * 60 * 1000,
  });
}
