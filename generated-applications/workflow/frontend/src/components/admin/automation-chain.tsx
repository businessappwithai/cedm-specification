/**
 * AutomationChain — the WHEN / IF / THEN reading of a workflow.
 *
 * The BPMN diagram is the truth and stays the truth: this renders the *same*
 * bpmn-js model as a vertical chain of cards, and every edit goes back through
 * `modeling`, so the two views cannot drift. Switching tabs is a change of
 * reading, not a change of document.
 *
 * Why bother, when there is already a canvas: a diagram is the right surface
 * for a shape you are exploring and the wrong one for a rule you are writing.
 * The executor runs service tasks in a straight line
 * (`workflow.rs::order_tasks`), so the shape is always a list — and a canvas
 * that can draw anything, backing an engine that runs one thing, invites
 * diagrams that look right and do nothing.
 *
 * What this deliberately does NOT offer: branches. Jira's automation rules have
 * them; this executor has no gateway support at all, so a "for each related
 * record" card would be a promise the engine cannot keep. Conditions live one
 * level up, in the rule that decides whether the automation runs.
 */

import {
  ArrowDown,
  Ban,
  Calculator,
  ChevronRight,
  Clock,
  Globe,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { HStack, Text, VStack } from "@/components/ui/layout";
import { HighlightedValue } from "./smart-value-picker";

/** The node types the executor actually dispatches on. */
export const CHAIN_NODE_TYPES = [
  "UpdateEntity",
  "CreateEntity",
  "DeleteEntity",
  "Formula",
  "REST",
] as const;
export type ChainNodeType = (typeof CHAIN_NODE_TYPES)[number];

export interface ChainStep {
  id: string;
  nodeType: string;
  name: string;
  properties: Record<string, string>;
}

/**
 * How each step is offered in the palette and described on its card.
 *
 * The labels are verbs in the second person, the way Jira writes them: a step
 * is a thing the automation does, not a class of node. "UpdateEntity" is what
 * it is; "Update a record" is what it does.
 */
export const STEP_CATALOGUE: Record<
  ChainNodeType,
  { label: string; blurb: string; icon: typeof Zap; group: "Records" | "Data" }
> = {
  UpdateEntity: {
    label: "Update a record",
    blurb: "Set a field on this record, or on one it points at",
    icon: ChevronRight,
    group: "Records",
  },
  CreateEntity: {
    label: "Create a record",
    blurb: "Insert a row in another entity, carrying values across",
    icon: Plus,
    group: "Records",
  },
  DeleteEntity: {
    label: "Delete a record",
    blurb: "Remove a row — soft, unless you ask for hard",
    icon: Trash2,
    group: "Records",
  },
  Formula: {
    label: "Set a value",
    blurb: "Compute something once and reuse it in later steps",
    icon: Calculator,
    group: "Data",
  },
  REST: {
    label: "Call an endpoint",
    blurb: "Send an HTTP request to another system",
    icon: Globe,
    group: "Data",
  },
};

/**
 * A one-line, human reading of what a step will do.
 *
 * This is the whole point of the chain view: someone should be able to scan the
 * rule without opening a single card. When a step is not configured enough to
 * say anything true, it says so rather than inventing a confident summary.
 */
export function describeStep(step: ChainStep): string {
  const property = (key: string) => (step.properties[key] ?? "").trim();
  const entity = property("entity");
  const target = entity ? prettyTable(entity) : "the triggering record";

  switch (step.nodeType) {
    case "UpdateEntity": {
      const field = property("field");
      const value = property("value") || property("source");
      if (!field) return `Update ${target} — no field chosen yet`;
      return value
        ? `Set ${field} on ${target} to ${value}`
        : `Set ${field} on ${target} — no value yet`;
    }
    case "CreateEntity": {
      const fields = property("fields") || property("data");
      const count = countJsonKeys(fields);
      if (!entity) return "Create a record — no entity chosen yet";
      return count > 0
        ? `Create a ${prettyTable(entity)} with ${count} field${count === 1 ? "" : "s"}`
        : `Create a ${prettyTable(entity)} — no fields set`;
    }
    case "DeleteEntity":
      return `Delete ${target}`;
    case "Formula": {
      const targetVar = property("target");
      const value = property("value") || property("source") || property("operation");
      if (!targetVar) return "Set a value — no variable name yet";
      return value ? `Set {{${targetVar}}} to ${value}` : `Set {{${targetVar}}} — no value yet`;
    }
    case "REST": {
      const method = property("method") || "GET";
      const url = property("url");
      return url ? `${method} ${url}` : `${method} request — no URL yet`;
    }
    default:
      return step.nodeType;
  }
}

/** `bus_stability_pull` -> `Stability Pull`. */
function prettyTable(table: string): string {
  return table
    .replace(/^bus_/, "")
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function countJsonKeys(raw: string): number {
  if (!raw.trim()) return 0;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? Object.keys(parsed).length : 0;
  } catch {
    // Half-typed JSON is the normal state of a field being edited; a summary
    // is not the place to complain about it.
    return 0;
  }
}

/** Steps that cannot run as configured, so the card can say so before saving. */
export function stepProblems(step: ChainStep): string[] {
  const has = (key: string) => (step.properties[key] ?? "").trim().length > 0;
  switch (step.nodeType) {
    case "UpdateEntity":
      return [
        !has("field") ? "needs a field" : "",
        !has("value") && !has("source") ? "needs a value" : "",
      ].filter(Boolean);
    case "CreateEntity":
      return [
        !has("entity") ? "needs an entity" : "",
        !has("fields") && !has("data") ? "needs at least one field" : "",
      ].filter(Boolean);
    case "Formula":
      return [!has("target") ? "needs a variable name" : ""].filter(Boolean);
    case "REST":
      return [!has("url") ? "needs a URL" : ""].filter(Boolean);
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Chain
// ---------------------------------------------------------------------------

export interface AutomationChainProps {
  /** Steps in execution order, as read from the BPMN model. */
  steps: ChainStep[];
  /** The entity whose writes start this automation. */
  triggerEntity?: string;
  /** CREATE | UPDATE | DELETE | ALL. */
  triggerOperation?: string;
  /** Conditions from the rule that fires this automation, if any. */
  conditions?: Array<{ field: string; operator: string; value: string }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onInsert: (nodeType: ChainNodeType, afterId: string | null) => void;
  onDelete: (id: string) => void;
  onEditTrigger?: () => void;
}

export function AutomationChain({
  steps,
  triggerEntity,
  triggerOperation = "ALL",
  conditions = [],
  selectedId,
  onSelect,
  onInsert,
  onDelete,
  onEditTrigger,
}: AutomationChainProps) {
  const [insertAfter, setInsertAfter] = useState<string | null | undefined>(undefined);

  const triggerLabel = useMemo(() => {
    // "record", not "a record": the article is added once, below. Carrying it
    // in the fallback produced "a a record is created" the moment no entity was
    // chosen — which is exactly the state a new workflow starts in.
    const entity = triggerEntity ? prettyTable(triggerEntity) : "record";
    switch (triggerOperation) {
      case "CREATE":
        return `a ${entity} is created`;
      case "UPDATE":
        return `a ${entity} is updated`;
      case "DELETE":
        return `a ${entity} is deleted`;
      default:
        return `a ${entity} is created, updated or deleted`;
    }
  }, [triggerEntity, triggerOperation]);

  const closePalette = useCallback(() => setInsertAfter(undefined), []);

  // Escape closes the palette. Without it the only way out is the toggle that
  // opened it, which is not where the hand is after scanning a list.
  useEffect(() => {
    if (insertAfter === undefined) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePalette();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [insertAfter, closePalette]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      {/* WHEN */}
      <ChainLabel icon={Zap} tone="trigger">
        When
      </ChainLabel>
      <button
        type="button"
        onClick={onEditTrigger}
        disabled={!onEditTrigger}
        className={`w-full rounded-lg border border-gray-300 bg-white p-4 text-left transition-colors ${
          onEditTrigger ? "hover:border-teal-400" : "cursor-default"
        }`}
      >
        <Text weight="medium">{triggerLabel}</Text>
        {triggerEntity && (
          <Text size="xs" color="secondary" block className="mt-0.5">
            {triggerEntity}
          </Text>
        )}
      </button>

      {/* IF — conditions belong to the rule, not to this diagram, so they are
          shown read-only here rather than pretending to be editable steps. */}
      {conditions.length > 0 && (
        <>
          <Rail />
          <ChainLabel icon={Ban} tone="condition">
            If
          </ChainLabel>
          <div className="rounded-lg border border-gray-300 bg-white p-4">
            <VStack gap={1}>
              {conditions.map((condition, index) => (
                <HStack key={`${condition.field}-${index}`} gap={2} align="center">
                  {index > 0 && (
                    <Text size="xs" color="secondary" className="uppercase">
                      and
                    </Text>
                  )}
                  <Text size="sm" weight="medium">
                    {condition.field}
                  </Text>
                  <Text size="sm" color="secondary">
                    {condition.operator}
                  </Text>
                  <Text size="sm" weight="medium">
                    {condition.value}
                  </Text>
                </HStack>
              ))}
            </VStack>
            <Text size="xs" color="secondary" block className="mt-2">
              Set on the rule that starts this automation.
            </Text>
          </div>
        </>
      )}

      {/* THEN */}
      <Rail />
      <ChainLabel icon={ArrowDown} tone="action">
        Then
      </ChainLabel>

      {steps.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <Text size="sm" color="secondary" block>
            Nothing happens yet. Add the first step.
          </Text>
        </div>
      )}

      {steps.map((step, index) => {
        const meta = STEP_CATALOGUE[step.nodeType as ChainNodeType];
        const Icon = meta?.icon ?? Clock;
        const problems = stepProblems(step);
        const isSelected = step.id === selectedId;

        return (
          <div key={step.id}>
            {index > 0 && <Rail />}
            <div
              className={`group relative rounded-lg border bg-white transition-colors ${
                isSelected ? "border-teal-500 ring-1 ring-teal-500" : "border-gray-300"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                className="flex w-full items-start gap-3 p-4 text-left"
              >
                <span className="mt-0.5 rounded bg-gray-100 p-1.5 text-gray-600">
                  <Icon size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <Text weight="medium" block truncate>
                    {meta?.label ?? step.nodeType}
                  </Text>
                  <Text size="sm" color="secondary" block className="mt-0.5">
                    <HighlightedValue value={describeStep(step)} />
                  </Text>
                  {problems.length > 0 && (
                    <Badge variant="outline" className="mt-2 text-[10px] text-amber-700">
                      {problems.join(" · ")}
                    </Badge>
                  )}
                </span>
                <Text size="xs" color="secondary" className="shrink-0">
                  {index + 1}
                </Text>
              </button>

              <button
                type="button"
                onClick={() => onDelete(step.id)}
                aria-label={`Delete step ${index + 1}`}
                title="Delete this step"
                className="absolute right-2 top-2 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <InsertPoint
              open={insertAfter === step.id}
              onToggle={() => setInsertAfter(insertAfter === step.id ? undefined : step.id)}
              onPick={(nodeType) => {
                onInsert(nodeType, step.id);
                closePalette();
              }}
            />
          </div>
        );
      })}

      {steps.length === 0 && (
        <InsertPoint
          open={insertAfter === null}
          onToggle={() => setInsertAfter(insertAfter === null ? undefined : null)}
          onPick={(nodeType) => {
            onInsert(nodeType, null);
            closePalette();
          }}
        />
      )}
    </div>
  );
}

function Rail() {
  return <div className="ml-6 h-4 w-px bg-gray-300" aria-hidden />;
}

function ChainLabel({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof Zap;
  tone: "trigger" | "condition" | "action";
  children: React.ReactNode;
}) {
  const tones = {
    trigger: "text-amber-600",
    condition: "text-violet-600",
    action: "text-teal-600",
  } as const;
  return (
    <HStack gap={1.5} align="center" className={`mb-1.5 ${tones[tone]}`}>
      <Icon size={13} />
      <Text size="xs" weight="semibold" className="uppercase tracking-wide">
        {children}
      </Text>
    </HStack>
  );
}

/**
 * The `+` between two cards, and the palette it opens.
 *
 * Always rendered rather than revealed on hover: hover is not a thing on touch,
 * and "how do I add a step" should never be a question.
 */
function InsertPoint({
  open,
  onToggle,
  onPick,
}: {
  open: boolean;
  onToggle: () => void;
  onPick: (nodeType: ChainNodeType) => void;
}) {
  const groups = useMemo<Array<[string, ChainNodeType[]]>>(() => {
    const byGroup = new Map<string, ChainNodeType[]>();
    for (const nodeType of CHAIN_NODE_TYPES) {
      const group = STEP_CATALOGUE[nodeType].group;
      byGroup.set(group, [...(byGroup.get(group) ?? []), nodeType]);
    }
    // `Array.from`, not spread: the tsconfig target does not allow iterating a
    // Map directly, and the spread compiles only with --downlevelIteration.
    return Array.from(byGroup.entries());
  }, []);

  return (
    <div className="relative">
      <div className="ml-6 h-3 w-px bg-gray-300" aria-hidden />
      <HStack gap={2} align="center" className="-ml-0.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 transition-colors hover:border-teal-400 hover:text-teal-600"
          title="Add a step here"
          aria-label="Add a step here"
        >
          <Plus size={13} />
        </button>
        <Text size="xs" color="secondary">
          Add a step
        </Text>
      </HStack>
      <div className="ml-6 h-3 w-px bg-gray-300" aria-hidden />

      {open && (
        <div className="mb-2 ml-6 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          {groups.map(([group, nodeTypes]) => (
            <VStack key={group} gap={0} className="mb-1">
              <Text size="xs" weight="semibold" className="px-1 py-1 text-gray-700">
                {group}
              </Text>
              {nodeTypes.map((nodeType: ChainNodeType) => {
                const meta = STEP_CATALOGUE[nodeType];
                const Icon = meta.icon;
                return (
                  <button
                    key={nodeType}
                    type="button"
                    onClick={() => onPick(nodeType)}
                    className="flex w-full items-start gap-2 rounded px-1 py-1.5 text-left hover:bg-teal-50"
                  >
                    <span className="mt-0.5 text-gray-500">
                      <Icon size={13} />
                    </span>
                    <span className="min-w-0">
                      <Text size="sm" weight="medium" block>
                        {meta.label}
                      </Text>
                      <Text size="xs" color="secondary" block>
                        {meta.blurb}
                      </Text>
                    </span>
                  </button>
                );
              })}
            </VStack>
          ))}
        </div>
      )}
    </div>
  );
}

export default AutomationChain;
