/**
 * One business rule, as a decision table — the same editor the generated admin
 * application uses for its rules, so both surfaces look and behave alike.
 *
 * A rule declared as a table or as actions is edited here as its table; a rule
 * declared as a decision graph is not a table, so it is described here and
 * edited in the model's YAML, where the viewer draws it.
 */

import { AlertCircle, Code2, Network } from "lucide-react";
import { useMemo, useState } from "react";
import { stringify } from "yaml";
import { RuleTableEditor } from "@/components/model/RuleTableEditor";
import { validateDecisionTable } from "@/lib/model/decision-table";
import { type EditableRule, RULE_EVENTS, slugifyRuleName, writeRules } from "@/lib/model/rules";

export interface RuleEditorProps {
  rule: EditableRule;
  entities: Array<{ name: string; attributes: string[] }>;
  onChange: (patch: Partial<EditableRule>) => void;
  /** Show a graph rule where the model draws it. */
  onShowGraph?: (rule: EditableRule) => void;
}

const KIND_NOTE: Record<EditableRule["kind"], string> = {
  table: "Declared as a decision table.",
  actions:
    "Declared as actions. It is shown as the decision table they compile to, and saved back as actions.",
  graph: "Declared as a decision graph.",
};

export function RuleEditor({ rule, entities, onChange, onShowGraph }: RuleEditorProps) {
  const [showSource, setShowSource] = useState(false);
  const entityFields = useMemo(
    () => entities.find((e) => e.name === rule.entity)?.attributes ?? [],
    [entities, rule.entity]
  );
  const problems = useMemo(
    () => (rule.kind === "graph" ? [] : validateDecisionTable(rule.table)),
    [rule.kind, rule.table]
  );
  const source = useMemo(() => stringify(writeRules([rule])[0], { lineWidth: 0 }), [rule]);

  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Name</span>
          <input
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
            value={rule.title ?? rule.name}
            onChange={(event) =>
              onChange({ title: event.target.value, name: slugifyRuleName(event.target.value) })
            }
            placeholder="Sample expiry guard"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium">Entity</span>
          <select
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
            value={rule.entity}
            onChange={(event) => onChange({ entity: event.target.value })}
          >
            <option value="">Choose…</option>
            {entities.map((entity) => (
              <option key={entity.name} value={entity.name}>
                {entity.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium">Runs on</span>
          <select
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
            value={rule.event}
            onChange={(event) => onChange({ event: event.target.value })}
          >
            {RULE_EVENTS.map((event) => (
              <option key={event} value={event}>
                {event}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium">Priority</span>
          <input
            type="number"
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
            value={rule.priority ?? 100}
            onChange={(event) => onChange({ priority: Number(event.target.value) || 0 })}
          />
        </label>
      </div>

      <p className="mb-2 text-xs text-muted-foreground">{KIND_NOTE[rule.kind]}</p>

      {rule.kind === "graph" ? (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <p>
            This rule decides with a graph of {rule.source?.nodes.length ?? 0} nodes and{" "}
            {rule.source?.edges.length ?? 0} edges, which is not a table. Its name, entity, event
            and priority are edited here; its graph is edited in the model's YAML.
          </p>
          {onShowGraph && (
            <button
              type="button"
              onClick={() => onShowGraph(rule)}
              className="mt-2 flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium"
            >
              <Network className="h-3.5 w-3.5" />
              Show the graph in the model
            </button>
          )}
        </div>
      ) : (
        <RuleTableEditor
          name={slugifyRuleName(rule.title ?? rule.name)}
          table={rule.table}
          onChange={(next) => onChange({ table: next })}
          entityFields={entityFields}
        />
      )}

      {problems.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {problems.map((problem) => (
            <li key={problem} className="flex items-start gap-1.5">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              {problem}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setShowSource((current) => !current)}
        className="mt-3 flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium"
      >
        <Code2 className="h-3.5 w-3.5" />
        {showSource ? "Hide" : "Show"} YAML
      </button>

      {showSource && (
        <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
          {source}
        </pre>
      )}
    </>
  );
}
