/**
 * SmartValuePicker — insert a `{{placeholder}}` into any workflow property.
 *
 * The executor interpolates `{{key}}` against one flat namespace, resolved
 * decision -> vars -> triggering record (`WorkflowContext::resolve`). This
 * picker groups the offered keys by where they come from, because that is what
 * makes them legible, but it always inserts the **bare** key the engine
 * actually looks up. A dotted `{{record.smiles}}` would read better and resolve
 * to nothing.
 */

import { Braces } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Text, VStack } from "@/components/ui/layout";

export interface SmartValueGroup {
  /** Where these values come from, e.g. "Triggering record". */
  label: string;
  /** Why a reader should reach for this group. */
  hint?: string;
  values: Array<{ key: string; description?: string }>;
}

/**
 * The standard groups for a workflow triggered by `entityName`.
 *
 * Ordered to match the engine's resolution precedence, so a name that appears
 * twice is listed first under the source that actually wins.
 */
export function buildSmartValueGroups(
  columns: Array<{ column_name: string; name?: string }>,
  variableNames: string[]
): SmartValueGroup[] {
  const groups: SmartValueGroup[] = [];

  if (variableNames.length > 0) {
    groups.push({
      label: "Variables",
      hint: "Computed by an earlier Set a value step",
      values: variableNames.map((key) => ({ key })),
    });
  }

  groups.push({
    label: "Rule decision",
    hint: "Output columns of the rule that started this automation",
    values: [
      { key: "action", description: "What the rule decided" },
      { key: "message", description: "The rule's message" },
    ],
  });

  if (columns.length > 0) {
    groups.push({
      label: "Triggering record",
      hint: "Fields of the record that set this off",
      values: columns.map((column) => ({
        key: column.column_name,
        description: column.name,
      })),
    });
  }

  return groups;
}

/**
 * A `{{ }}` button that opens a searchable list and calls `onInsert` with the
 * placeholder text. The caller decides where it lands — appending to a value,
 * or replacing a selection.
 */
export function SmartValuePicker({
  groups,
  onInsert,
  label = "Insert a value",
}: {
  groups: SmartValueGroup[];
  onInsert: (placeholder: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const filtered = groups
    .map((group) => ({
      ...group,
      values: group.values.filter(
        (value) =>
          !needle ||
          value.key.toLowerCase().includes(needle) ||
          (value.description ?? "").toLowerCase().includes(needle)
      ),
    }))
    .filter((group) => group.values.length > 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        title={label}
        aria-label={label}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded border border-gray-300 px-1.5 py-0.5 text-[10px] text-gray-500 transition-colors hover:border-teal-400 hover:text-teal-600"
      >
        <Braces size={11} />
        <span className="hidden sm:inline">Value</span>
      </button>

      {open && (
        <>
          {/* Click-away. A picker that can only be closed by the button it was
              opened with is a trap on touch, where there is no Escape key. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 max-h-80 w-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-lg">
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search values…"
              className="mb-2 h-7 text-xs"
            />

            {filtered.length === 0 && (
              <Text size="xs" color="secondary" block className="px-1 py-2">
                Nothing matches “{query}”.
              </Text>
            )}

            {filtered.map((group) => (
              <VStack key={group.label} gap={0} className="mb-2">
                <Text size="xs" weight="semibold" className="px-1 text-gray-700">
                  {group.label}
                </Text>
                {group.hint && (
                  <Text size="xs" color="secondary" block className="px-1 pb-1">
                    {group.hint}
                  </Text>
                )}
                {group.values.map((value) => (
                  <button
                    key={`${group.label}-${value.key}`}
                    type="button"
                    onClick={() => {
                      onInsert(`{{${value.key}}}`);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="w-full rounded px-1 py-1 text-left hover:bg-teal-50"
                  >
                    <code className="text-[11px] text-teal-700">{`{{${value.key}}}`}</code>
                    {value.description && value.description !== value.key && (
                      <Text size="xs" color="secondary" block className="truncate">
                        {value.description}
                      </Text>
                    )}
                  </button>
                ))}
              </VStack>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Render a property value with its placeholders highlighted, for card summaries.
 *
 * Returns plain React nodes rather than HTML so a value containing `<` cannot
 * become markup.
 */
export function HighlightedValue({ value }: { value: string }) {
  if (!value) return null;
  const parts = value.split(/(\{\{[^}]*\}\})/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("{{") && part.endsWith("}}") ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: fragments of one split string, positional by construction and never reordered
          <code key={index} className="rounded bg-teal-50 px-1 text-[11px] text-teal-700">
            {part}
          </code>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: fragments of one split string, positional by construction and never reordered
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

export default SmartValuePicker;
