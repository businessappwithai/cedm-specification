/**
 * BpmnCanvas — bpmn-js modeler wrapper for React
 *
 * Mounts bpmn-js imperatively on a div ref, exposes getXml/importXml
 * via useImperativeHandle, and renders a sidebar properties panel
 * when a ServiceTask is selected.
 *
 * Custom node type encoding:
 *   extensionElements > appwithai:properties > appwithai:property[@name, text]
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  STEP_PURPOSE,
  STEP_TYPES,
  type StepType,
} from "@/lib/workflow/step-types";
import { useDictionaryEntities } from "./use-dictionary-entities";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { Grid, HStack, Text, VStack } from "@/components/ui/layout";
import {
  AutomationChain,
  STEP_CATALOGUE,
  type ChainNodeType,
  type ChainStep,
} from "./automation-chain";
import { buildSmartValueGroups, SmartValuePicker } from "./smart-value-picker";

// bpmn-js types (runtime import)
type BpmnModelerInstance = any;

export interface BpmnCanvasHandle {
  getXml: () => Promise<string>;
  importXml: (xml: string) => Promise<void>;
}

interface SelectedTask {
  id: string;
  name: string;
  nodeType: string;
  properties: Record<string, string>;
}

/**
 * The palette, from `lib/workflow/step-types` — generated out of the EML
 * language definition, which is what the backend's executor is written
 * against.
 *
 * It used to be the hard-coded list below this comment, and it had drifted
 * from the executor in both directions: it offered `Agent`, which the
 * executor rejects with a 400 (deliberately — skipping it reported success
 * for business outcomes that never happened), so a workflow built with one
 * failed every time it ran; and it did not offer `Decision`, which the
 * executor gained and nothing in the designer could reach.
 */
const NODE_TYPES = STEP_TYPES;
type NodeType = StepType;

const NODE_TYPE_ICONS: Record<string, string> = {
  UpdateEntity: "✏️",
  CreateEntity: "➕",
  DeleteEntity: "🗑️",
  Decision: "🔀",
  Formula: "🔢",
  REST: "🌐",
};

const NODE_TYPE_DESC: Record<string, string> = {
  UpdateEntity: "Update a field on an entity record",
  CreateEntity: "Insert a new entity record",
  DeleteEntity: "Remove an entity record (soft unless hard)",
  Decision: "Run a decision table and publish what it decides",
  Formula: "Compute a value and store in vars",
  REST: "Call an external HTTP endpoint",
};

/** Falls back to the language's own `purpose` for a type added later. */
function nodeTypeDescription(type: string): string {
  return NODE_TYPE_DESC[type] ?? STEP_PURPOSE[type as StepType] ?? "";
}

/**
 * Properties a node cannot run without. The executor skips a node that is
 * missing these and records why, but a step that silently does nothing is a bad
 * thing to discover in production — so the canvas refuses to apply it.
 */
function missingRequiredProps(nodeType: NodeType, props: Record<string, string>): string[] {
  const has = (k: string) => (props[k] ?? "").trim().length > 0;
  const missing: string[] = [];

  if (nodeType === "UpdateEntity") {
    if (!has("field")) missing.push("Field to update");
    if (!has("source") && !has("value")) missing.push("a source key or a literal value");
    // Targeting another table by row id needs to say which row.
    if (has("entity") && !has("targetSource") && (props.targetField ?? "id").trim() === "id") {
      missing.push("a context key to match against (cross-entity update)");
    }
  }

  if (nodeType === "DeleteEntity") {
    if (!has("entity")) missing.push("Entity table to delete from");
  }

  if (nodeType === "CreateEntity") {
    if (!has("entity")) missing.push("Entity table to insert into");
    let fieldCount = 0;
    try {
      fieldCount = Object.keys(JSON.parse(props.fields || "{}")).length;
    } catch {
      missing.push("a valid JSON field map");
    }
    if (fieldCount === 0) missing.push("at least one field to set");
  }

  if (nodeType === "Formula") {
    if (!has("target")) missing.push("Target variable name");
    // `set` stages a literal, so it is the one operation with nothing to read
    // and nothing to apply. Demanding a source for it would make a constant
    // impossible to express.
    if ((props.operation ?? "") === "set") {
      if (!has("value")) missing.push("a literal value to set");
    } else {
      if (!has("source")) missing.push("Source key");
      if (!has("operand")) missing.push("Operand");
    }
  }

  if (nodeType === "REST") {
    if (!has("url")) missing.push("URL");
  }

  return missing;
}

const EMPTY_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:appwithai="http://appwithai.io/schema/1.0"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start"/>
    <bpmn:endEvent id="EndEvent_1" name="End"/>
    <bpmn:sequenceFlow id="Flow_end" sourceRef="StartEvent_1" targetRef="EndEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="172" y="82" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="432" y="82" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_end_di" bpmnElement="Flow_end">
        <di:waypoint x="208" y="100"/>
        <di:waypoint x="432" y="100"/>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

// Read appwithai:property elements from a business object
function readProperties(element: any): Record<string, string> {
  const props: Record<string, string> = {};
  const exts = element?.businessObject?.extensionElements?.values ?? [];
  for (const ext of exts) {
    if (ext.$type === "appwithai:Properties") {
      for (const p of ext.values ?? []) {
        if (p.name) props[p.name] = p.value ?? "";
      }
    }
  }
  return props;
}

/**
 * Insert `taskShape` at the end of the diagram's main sequence flow.
 *
 * Walks Start -> … to find the last element before the end event (or the last
 * element in the chain if there is no end event), then re-points that link
 * through the new task. Falls back to connecting from the tail element when
 * there is nothing to splice, and does nothing if the diagram has no start
 * event — a user who deleted it is building something custom by hand.
 */
function chainOntoFlow(modeling: any, elementRegistry: any, taskShape: any): void {
  const start = elementRegistry.filter((el: any) => el.type === "bpmn:StartEvent")[0];
  if (!start) return;

  // Follow outgoing flows to the tail, skipping the task we just created.
  let tail = start;
  const visited = new Set<string>([taskShape.id]);
  while (true) {
    if (visited.has(tail.id)) break;
    visited.add(tail.id);
    const next = (tail.outgoing ?? []).find(
      (flow: any) =>
        flow.target && !visited.has(flow.target.id) && flow.target.type !== "bpmn:EndEvent"
    );
    if (!next) break;
    tail = next.target;
  }

  // If the tail still runs straight into an end event, splice in front of it.
  const toEnd = (tail.outgoing ?? []).find((flow: any) => flow.target?.type === "bpmn:EndEvent");
  if (toEnd) {
    const endEvent = toEnd.target;
    modeling.removeConnection(toEnd);
    modeling.connect(tail, taskShape);
    modeling.connect(taskShape, endEvent);
    return;
  }

  if (tail.id !== taskShape.id) modeling.connect(tail, taskShape);
}

/**
 * The service tasks in execution order.
 *
 * Deliberately the same walk the backend does (`workflow.rs::order_tasks`):
 * start from the task nothing points at and follow the outgoing flows, falling
 * back to registry order when the flows do not form a chain. The chain view
 * must show the order that will actually run, not the order the diagram was
 * drawn in — a list that disagrees with the executor is worse than no list.
 */
function readChain(elementRegistry: any): ChainStep[] {
  const tasks: any[] = elementRegistry.filter((el: any) => el.type === "bpmn:ServiceTask");
  if (tasks.length === 0) return [];

  const toStep = (el: any): ChainStep => {
    const { nodeType = "UpdateEntity", ...properties } = readProperties(el);
    return {
      id: el.id,
      nodeType,
      name: el.businessObject?.name ?? "",
      properties,
    };
  };

  const targeted = new Set<string>();
  for (const task of tasks) {
    for (const flow of task.outgoing ?? []) {
      if (flow.target) targeted.add(flow.target.id);
    }
  }

  const head = tasks.find((task) => !targeted.has(task.id));
  if (!head) return tasks.map(toStep);

  const ordered: ChainStep[] = [];
  const seen = new Set<string>();
  let cursor: any = head;
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    if (cursor.type === "bpmn:ServiceTask") ordered.push(toStep(cursor));
    const next = (cursor.outgoing ?? []).find(
      (flow: any) => flow.target && flow.target.type === "bpmn:ServiceTask"
    );
    cursor = next?.target;
  }

  // Anything the walk missed still runs, so it still belongs on the list.
  for (const task of tasks) {
    if (!seen.has(task.id)) ordered.push(toStep(task));
  }
  return ordered;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Help scenarios ────────────────────────────────────────────────────────────

interface ScenarioExample {
  title: string;
  description: string;
  nodeType: NodeType;
  props: Record<string, string>;
}

const HELP_SCENARIOS: ScenarioExample[] = [
  // UpdateEntity
  {
    nodeType: "UpdateEntity",
    title: "Qualify a Lead",
    description:
      "When a lead is saved, set its status to Qualified. Leave entity blank to update the triggering record.",
    props: { field: "status", value: "Qualified" },
  },
  {
    nodeType: "UpdateEntity",
    title: "Mark Opportunity as Won",
    description: "Update a related opportunity's stage to Won using the same record ID.",
    props: { entity: "bus_opportunity", field: "stage", value: "Won" },
  },
  {
    nodeType: "UpdateEntity",
    title: "Write computed score to notes",
    description: "After a Formula node stores lead_score in vars, write it to the notes field.",
    props: { field: "notes", source: "lead_score" },
  },
  // CreateEntity
  {
    nodeType: "CreateEntity",
    title: "Create Follow-up Call activity",
    description: "Insert a new bus_activity row each time a lead is saved.",
    props: {
      entity: "bus_activity",
      fields: '{"type":"Call","subject":"Follow up","status":"Planned"}',
    },
  },
  {
    nodeType: "CreateEntity",
    title: "Create a Contact from Lead data",
    description: "Auto-create a contact record using {{name}} / {{email}} template keys.",
    props: { entity: "bus_contact", fields: '{"name":"{{name}}","email":"{{email}}"}' },
  },
  // Formula
  {
    nodeType: "Formula",
    title: "Lead score = version × 10",
    description:
      "Multiply the version field by 10 and store the result in lead_score for use by the next node.",
    props: { source: "version", operation: "multiply", operand: "10", target: "lead_score" },
  },
  {
    nodeType: "Formula",
    title: "Discount % = amount ÷ 100",
    description: "Divide the amount field by 100 and store the result in discount_pct.",
    props: { source: "amount", operation: "divide", operand: "100", target: "discount_pct" },
  },
  // REST
  {
    nodeType: "REST",
    title: "Notify webhook on Lead save",
    description:
      "POST lead id, name and status to an external webhook URL each time a lead is saved.",
    props: {
      method: "POST",
      url: "https://hooks.example.com/crm-lead",
      bodyTemplate: '{"id":"{{id}}","name":"{{name}}","status":"{{status}}"}',
    },
  },
  {
    nodeType: "REST",
    title: "Sync to external CRM",
    description: "Push lead details to a third-party CRM via their REST API.",
    props: {
      method: "POST",
      url: "https://api.yourcrm.com/leads",
      bodyTemplate: '{"leadId":"{{id}}","company":"{{name}}","contact":"{{email}}"}',
    },
  },
];

// ── Dictionary hooks ──────────────────────────────────────────────────────────

interface TableRow {
  table_name: string;
  name: string;
}
interface ColumnRow {
  column_name: string;
  name: string;
}

/**
 * The entities a step can name, labelled by the window each opens in — never by
 * the dictionary table's own name.
 */
function useBusTables(): TableRow[] {
  const { data } = useDictionaryEntities();
  return (data ?? []).map((entity) => ({ table_name: entity.table, name: entity.label }));
}

const SKIP_COLS = new Set([
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "version",
  "workflow_status",
  "workflow_run_id",
  "doc_status",
  "doc_status_message",
  "is_active",
]);

function useBusColumns(tableName: string): ColumnRow[] {
  const [columns, setColumns] = useState<ColumnRow[]>([]);
  useEffect(() => {
    if (!tableName) {
      setColumns([]);
      return;
    }
    fetch(`/api/sys/columns/direct?tableName=${encodeURIComponent(tableName)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => {
        const rows = (Array.isArray(d) ? d : (d?.data ?? [])) as any[];
        setColumns(
          rows
            .filter((c) => !SKIP_COLS.has(c.column_name))
            // The field's name is the label; the column name is only the key.
            .map((c) => ({ column_name: c.column_name, name: c.name ?? "" }))
        );
      })
      .catch(() => {});
  }, [tableName]);
  return columns;
}

// ── Main component ────────────────────────────────────────────────────────────

const BpmnCanvas = forwardRef<
  BpmnCanvasHandle,
  {
    className?: string;
    /** Table this workflow is triggered by — used to populate the field pickers
     *  for nodes that act on the triggering record. */
    entityName?: string;
    /** CREATE | UPDATE | DELETE | ALL, for the chain's WHEN card. */
    triggerOperation?: string;
    /**
     * Conditions of the rule that fires this workflow, shown read-only on the
     * chain's IF card. They live in the rule's decision table, not in this
     * diagram, so the chain reports them rather than editing them.
     */
    conditions?: Array<{ field: string; operator: string; value: string }>;
  }
>(({ className, entityName, triggerOperation, conditions }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModelerInstance>(null);
  const modelerInitRef = useRef(false);
  const pendingXmlRef = useRef<string | null>(null);
  const pendingScenarioRef = useRef<ScenarioExample | null>(null);
  const [selected, setSelected] = useState<SelectedTask | null>(null);
  const [localProps, setLocalProps] = useState<Record<string, string>>({});
  const [localNodeType, setLocalNodeType] = useState<NodeType>("UpdateEntity");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  // Chain first. The diagram is the model; the chain is how you read and write
  // it without having to think about BPMN.
  const [view, setView] = useState<"chain" | "diagram">("chain");
  const [chain, setChain] = useState<ChainStep[]>([]);

  /** Names written by `Formula` steps, which later steps can read back. */
  const variableNames = useMemo(
    () =>
      chain
        .filter((step) => step.nodeType === "Formula")
        .map((step) => (step.properties.target ?? "").trim())
        .filter(Boolean),
    [chain]
  );

  // Mount bpmn-js modeler
  useEffect(() => {
    // Guard against React StrictMode double-invocation creating two modeler instances
    if (modelerInitRef.current) return;
    modelerInitRef.current = true;
    let modeler: BpmnModelerInstance;

    (async () => {
      const { default: BpmnModeler } = await import("bpmn-js/lib/Modeler");

      // The import above is awaited, so the component can have unmounted by
      // the time this runs; the ref is then null and BpmnModeler would attach
      // to nothing.
      const container = containerRef.current;
      if (!container) return;

      modeler = new BpmnModeler({
        container,
        additionalModules: [],
        moddleExtensions: {
          appwithai: {
            name: "AppWithAI",
            uri: "http://appwithai.io/schema/1.0",
            prefix: "appwithai",
            xml: { tagAlias: "lowerCase" },
            types: [
              {
                name: "Properties",
                superClass: ["Element"],
                meta: { allowedIn: ["bpmn:BaseElement"] },
                properties: [{ name: "values", type: "Property", isMany: true, isBody: false }],
              },
              {
                name: "Property",
                superClass: ["Element"],
                properties: [
                  { name: "name", isAttr: true, type: "String" },
                  { name: "value", isAttr: true, type: "String" },
                ],
              },
            ],
          },
        },
      });

      modelerRef.current = modeler;

      const xmlToLoad = pendingXmlRef.current ?? EMPTY_BPMN;
      pendingXmlRef.current = null;
      try {
        await modeler.importXML(xmlToLoad);
      } catch (e) {
        console.error("BPMN import error", e);
      }

      const eventBus = modeler.get("eventBus");

      // One subscription for every way the model can change. Recomputing the
      // whole chain is cheap (a handful of shapes) and means the list cannot
      // fall behind an edit made on the diagram tab.
      const refreshChain = () => setChain(readChain(modeler.get("elementRegistry")));
      eventBus.on(["import.done", "elements.changed", "shape.removed"], refreshChain);
      refreshChain();

      eventBus.on("selection.changed", ({ newSelection }: any) => {
        const el = newSelection[0];
        if (el?.type === "bpmn:ServiceTask") {
          const existingProps = readProperties(el);
          const nodeType = (existingProps.nodeType as NodeType) ?? "UpdateEntity";
          const { nodeType: _nt, ...rest } = existingProps;
          setSelected({
            id: el.id,
            name: el.businessObject.name ?? "",
            nodeType,
            properties: rest,
          });
          // If a scenario was queued (from load in empty state), apply it now
          if (pendingScenarioRef.current) {
            const s = pendingScenarioRef.current;
            pendingScenarioRef.current = null;
            setLocalNodeType(s.nodeType);
            setLocalProps(s.props);
            setApplyError(null);
          } else {
            setLocalNodeType(nodeType);
            setLocalProps(rest);
            setApplyError(null);
          }
        } else {
          setSelected(null);
        }
      });
    })();

    return () => {
      modeler?.destroy();
    };
  }, []);

  const getXml = useCallback(async (): Promise<string> => {
    if (!modelerRef.current) throw new Error("Modeler not initialized");
    const { xml } = await modelerRef.current.saveXML({ format: true });
    return xml;
  }, []);

  const importXml = useCallback(async (xml: string): Promise<void> => {
    if (!modelerRef.current) {
      pendingXmlRef.current = xml;
      return;
    }
    setImportError(null);
    try {
      await modelerRef.current.importXML(xml);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setImportError(msg);
      console.error("BPMN import error", e);
    }
  }, []);

  useImperativeHandle(ref, () => ({ getXml, importXml }), [getXml, importXml]);

  // Programmatically add a ServiceTask node to the diagram
  const addNodeType = useCallback((nodeType: NodeType) => {
    const modeler = modelerRef.current;
    if (!modeler) return;

    const modeling = modeler.get("modeling");
    const elementRegistry = modeler.get("elementRegistry");
    const moddle = modeler.get("moddle");
    const canvas = modeler.get("canvas");
    const rootElement = canvas.getRootElement();

    // Position: centre of the current viewport
    const viewbox = canvas.viewbox();
    const cx = viewbox.x + viewbox.width / 2;
    const cy = viewbox.y + viewbox.height / 2;
    // Offset right if other tasks already exist, so nodes don't stack
    const existingTasks = elementRegistry.filter((el: any) => el.type === "bpmn:ServiceTask");
    const x = cx + existingTasks.length * 120 - 50;
    const y = cy - 40;

    // Create the shape
    const taskShape = modeling.createShape(
      { type: "bpmn:ServiceTask" },
      { x, y, width: 100, height: 80 },
      rootElement
    );

    // Pre-set the nodeType property
    const propObjects = [
      moddle.create("appwithai:Property", { name: "nodeType", value: nodeType }),
    ];
    const propsContainer = moddle.create("appwithai:Properties", { values: propObjects });
    const extensionElements = moddle.create("bpmn:ExtensionElements", { values: [propsContainer] });
    modeling.updateProperties(taskShape, { name: nodeType, extensionElements });

    // Splice the new task into the existing Start -> … -> End chain so the
    // diagram states the execution order. Adding a node from the palette used
    // to drop it on the canvas unconnected, which meant a user building a
    // multi-step flow had to hand-draw every arrow, and the saved order was
    // whatever the serializer happened to emit.
    chainOntoFlow(modeling, elementRegistry, taskShape);

    // Select it so the properties panel opens, then fit viewport so it's visible
    modeler.get("selection").select(taskShape);
    setTimeout(() => canvas.zoom("fit-viewport"), 100);
  }, []);


  /** Select a step from the chain — the same selection the diagram uses. */
  const selectStep = useCallback((id: string) => {
    const modeler = modelerRef.current;
    if (!modeler) return;
    const element = modeler.get("elementRegistry").get(id);
    if (element) modeler.get("selection").select(element);
  }, []);

  /**
   * Delete a step and heal the chain behind it.
   *
   * `removeElements` drops the task's flows with it, which would leave the
   * steps on either side unconnected — and an unconnected task is one the
   * executor's flow walk stops at, so deleting a middle step would silently
   * strand everything after it. Reconnecting first keeps the order intact.
   */
  const deleteStep = useCallback((id: string) => {
    const modeler = modelerRef.current;
    if (!modeler) return;
    const modeling = modeler.get("modeling");
    const elementRegistry = modeler.get("elementRegistry");
    const element = elementRegistry.get(id);
    if (!element) return;

    const before = (element.incoming ?? [])[0]?.source;
    const after = (element.outgoing ?? [])[0]?.target;

    modeling.removeElements([element]);
    if (before && after && before.id !== after.id) {
      modeling.connect(before, after);
    }
    setSelected((prev) => (prev?.id === id ? null : prev));
  }, []);

  const loadScenario = useCallback(
    (scenario: ScenarioExample) => {
      setHelpOpen(false);
      if (selected) {
        setLocalNodeType(scenario.nodeType);
        setLocalProps(scenario.props);
      } else {
        pendingScenarioRef.current = scenario;
        addNodeType(scenario.nodeType);
      }
    },
    [selected, addNodeType]
  );

  // Apply edited properties back to the selected diagram element
  const applyProperties = useCallback(() => {
    if (!selected || !modelerRef.current) return;

    const missing = missingRequiredProps(localNodeType, localProps);
    if (missing.length > 0) {
      setApplyError(`${localNodeType} still needs: ${missing.join(", ")}.`);
      return;
    }
    setApplyError(null);

    const modeling = modelerRef.current.get("modeling");
    const elementRegistry = modelerRef.current.get("elementRegistry");
    const moddle = modelerRef.current.get("moddle");
    const element = elementRegistry.get(selected.id);
    if (!element) return;

    const allProps = { nodeType: localNodeType, ...localProps };
    const propObjects = Object.entries(allProps).map(([k, v]) =>
      moddle.create("appwithai:Property", { name: k, value: v })
    );

    const propsContainer = moddle.create("appwithai:Properties", { values: propObjects });
    const extensionElements = moddle.create("bpmn:ExtensionElements", { values: [propsContainer] });

    modeling.updateProperties(element, {
      name: localProps.name || selected.name || localNodeType,
      extensionElements,
    });

    setSelected((prev) =>
      prev ? { ...prev, nodeType: localNodeType, properties: localProps } : prev
    );
  }, [selected, localNodeType, localProps]);

  return (
    <div className={`flex gap-4 h-full ${className ?? ""}`}>
      {/* Chain and diagram are two readings of one model. */}
      <div className="flex-1 relative border rounded-lg overflow-hidden bg-white flex flex-col">
        <div className="flex items-center gap-1 border-b bg-gray-50 px-2 py-1.5">
          <div className="flex gap-0.5 rounded-md bg-gray-100 p-0.5">
            {(["chain", "diagram"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setView(tab)}
                aria-pressed={view === tab}
                className={`rounded px-3 py-1 text-xs capitalize transition-colors ${
                  view === tab
                    ? "bg-white font-medium text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <Text size="xs" color="secondary" className="ml-2">
            {view === "chain"
              ? "Steps run top to bottom"
              : "Drag from the palette, connect with arrows"}
          </Text>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {/* The bpmn-js container is never unmounted: the modeler attaches to
              this node imperatively, so tearing it down on a tab switch would
              take the model with it. Hidden, not removed. */}
          <div
            className={`absolute inset-0 ${view === "diagram" ? "" : "invisible pointer-events-none"}`}
          >
            <div ref={containerRef} className="w-full h-full" />
            <div className="absolute bottom-2 left-2 text-xs text-gray-400 pointer-events-none">
              Click a node button → or drag ServiceTask from palette → connect with arrows → select
              to configure
            </div>
          </div>

          {view === "chain" && (
            <div className="absolute inset-0 overflow-y-auto bg-gray-50">
              <AutomationChain
                steps={chain}
                triggerEntity={entityName}
                triggerOperation={triggerOperation}
                conditions={conditions}
                selectedId={selected?.id ?? null}
                onSelect={selectStep}
                onInsert={(nodeType) => addNodeType(nodeType as NodeType)}
                onDelete={deleteStep}
              />
            </div>
          )}
        </div>

        {importError && (
          <div className="absolute top-12 left-2 right-2 bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
            {importError}
          </div>
        )}
      </div>

      {/* Properties / node palette panel */}
      <div className="w-72 flex-shrink-0 border rounded-lg bg-gray-50 overflow-y-auto flex flex-col relative">
        <HelpDrawer
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          onLoad={loadScenario}
          currentNodeType={selected ? localNodeType : undefined}
        />
        {selected ? (
          <div className="p-4 space-y-4">
            <HStack align="center" gap={2}>
              <Badge variant="outline" className="text-xs">
                {selected.id}
              </Badge>
              <Text size="sm" weight="medium" truncate className="flex-1">
                {STEP_CATALOGUE[localNodeType as ChainNodeType]?.label ??
                  selected.name ??
                  "ServiceTask"}
              </Text>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors whitespace-nowrap"
                title="View workflow examples"
              >
                ? Help
              </button>
            </HStack>
            <Separator />

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-600">NODE TYPE</Label>
              <Select
                value={localNodeType}
                onValueChange={(v) => {
                  setLocalNodeType(v as NodeType);
                  setLocalProps({});
                  setApplyError(null);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NODE_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {NODE_TYPE_ICONS[t]} {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Text size="xs" color="secondary" block>{nodeTypeDescription(localNodeType)}</Text>
            </div>

            <Separator />
            <PropertyFields
              nodeType={localNodeType}
              props={localProps}
              onChange={setLocalProps}
              triggeringEntity={entityName}
              variableNames={variableNames}
            />

            {applyError && (
              <Text size="xs" color="danger" block role="alert">
                {applyError}
              </Text>
            )}
            <Button size="sm" className="w-full" onClick={applyProperties}>
              Apply to Diagram
            </Button>
          </div>
        ) : (
          <VStack padding={4} className="h-full">
            <HStack align="center" justify="between" className="mb-3">
              <div className="text-xs font-semibold text-gray-500">Add a node to the diagram:</div>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
                title="View workflow examples"
              >
                ? Help
              </button>
            </HStack>
            <div className="space-y-1.5">
              {NODE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addNodeType(t)}
                  className="w-full text-left text-xs px-3 py-2 rounded-md bg-white border border-gray-200 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-colors flex items-start gap-2 shadow-sm"
                >
                  <span className="mt-px">{NODE_TYPE_ICONS[t]}</span>
                  <span>
                    <Text weight="medium">{t}</Text>
                    <Text color="secondary" className="block text-[10px] leading-tight mt-0.5">
                      {nodeTypeDescription(t)}
                    </Text>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-auto pt-4 text-[10px] text-gray-400 text-center">
              Or drag from the bpmn palette • Select a task to configure
            </div>
          </VStack>
        )}
      </div>
    </div>
  );
});

BpmnCanvas.displayName = "BpmnCanvas";
export default BpmnCanvas;

// ── Property fields per node type ──────────────────────────────────────────

function PropertyFields({
  nodeType,
  props,
  onChange,
  triggeringEntity,
  variableNames = [],
}: {
  nodeType: NodeType;
  props: Record<string, string>;
  onChange: (p: Record<string, string>) => void;
  triggeringEntity?: string;
  /** Names written by earlier `Formula` steps, offered as `{{placeholders}}`. */
  variableNames?: string[];
}) {
  const set = (k: string, v: string) => onChange({ ...props, [k]: v });

  const tables = useBusTables();
  const entityValue = props.entity ?? "";
  // The workflow's own Entity picker stores a display name ("Appointment"),
  // while node properties store table names ("bus_appointment"), so resolve
  // through the dictionary before asking for columns.
  const triggeringTable = triggeringEntity
    ? (tables.find((t) => t.table_name === triggeringEntity || t.name === triggeringEntity)
        ?.table_name ?? "")
    : "";
  // Leaving the entity blank means "the record that triggered this workflow",
  // so fall back to that table's columns rather than offering nothing.
  const columns = useBusColumns(entityValue || triggeringTable);

  // The placeholders this step can reference. The triggering record's columns
  // are the right list even when this node targets another entity: the engine
  // interpolates against the run's context, which is the record that started
  // it, not the row being written.
  const triggerColumns = useBusColumns(triggeringTable);
  const smartValueGroups = useMemo(
    () => buildSmartValueGroups(triggerColumns.length > 0 ? triggerColumns : columns, variableNames),
    [triggerColumns, columns, variableNames]
  );

  // Shared entity picker (used by UpdateEntity + CreateEntity)
  const EntitySelect = ({ label = "Entity table" }: { label?: string }) => (
    <div className="space-y-1">
      <Label className="text-xs text-gray-600">{label}</Label>
      {tables.length > 0 ? (
        <Select value={entityValue} onValueChange={(v) => set("entity", v)}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Select entity…" />
          </SelectTrigger>
          <SelectContent>
            {tables.map((t) => (
              <SelectItem key={t.table_name} value={t.table_name} className="text-xs">
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          className="h-7 text-xs"
          value={entityValue}
          placeholder="bus_account"
          onChange={(e) => set("entity", e.target.value)}
        />
      )}
    </div>
  );

  // Field picker — populates from columns of the selected entity
  const FieldSelect = ({
    label = "Field to update",
    propKey = "field",
    // 'id' is hidden from the column list because you never *write* to it, but
    // it is the usual column to *match* a parent row on, so row-targeting
    // pickers need it back.
    includeId = false,
  }: {
    label?: string;
    propKey?: string;
    includeId?: boolean;
  }) => {
    const options = includeId ? [{ column_name: "id", name: "Row id" }, ...columns] : columns;
    return (
      <div className="space-y-1">
        <Label className="text-xs text-gray-600">{label}</Label>
        {options.length > 0 ? (
          <Select value={props[propKey] ?? ""} onValueChange={(v) => set(propKey, v)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Select field…" />
            </SelectTrigger>
            <SelectContent>
              {options.map((c) => (
                <SelectItem key={c.column_name} value={c.column_name} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            className="h-7 text-xs"
            value={props[propKey] ?? ""}
            placeholder={entityValue ? "Loading columns…" : "Select entity first"}
            onChange={(e) => set(propKey, e.target.value)}
          />
        )}
      </div>
    );
  };

  const TextField = ({
    label,
    k,
    placeholder,
  }: {
    label: string;
    k: string;
    placeholder?: string;
  }) => (
    <div className="space-y-1">
      <HStack align="center" gap={2} className="justify-between">
        <Label className="text-xs text-gray-600">{label}</Label>
        <SmartValuePicker
          groups={smartValueGroups}
          onInsert={(placeholderText) => set(k, `${props[k] ?? ""}${placeholderText}`)}
        />
      </HStack>
      <Input
        className="h-7 text-xs"
        value={props[k] ?? ""}
        placeholder={placeholder}
        onChange={(e) => set(k, e.target.value)}
      />
    </div>
  );

  if (nodeType === "UpdateEntity") {
    return (
      <div className="space-y-3">
        <EntitySelect label="Entity table (blank = triggering entity)" />
        <FieldSelect label="Field to update" propKey="field" />
        <TextField
          label="Source key from decision/vars context"
          k="source"
          placeholder="lead_score"
        />
        <TextField label="Literal value (if no source)" k="value" placeholder="Qualified" />
        <div className="pt-2 border-t space-y-3">
          <Text size="xs" color="secondary" block>
            Which rows? Leave blank to update the record that triggered the workflow. To update a{" "}
            <em>related</em> entity, say how the two are linked.
          </Text>
          <FieldSelect label="Match on column (default: id)" propKey="targetField" includeId />
          <TextField label="…against this context key" k="targetSource" placeholder="patient_id" />
        </div>
      </div>
    );
  }

  if (nodeType === "CreateEntity") {
    return (
      <div className="space-y-3">
        <EntitySelect label="Entity table to insert into" />
        <CreateEntityFields
          tableName={entityValue}
          columns={columns}
          value={props.fields ?? ""}
          onChange={(v) => set("fields", v)}
        />
        <TextField
          label="Remember the new record's id as (optional)"
          k="as"
          placeholder="newCapaId"
        />
      </div>
    );
  }

  if (nodeType === "DeleteEntity") {
    return (
      <div className="space-y-3">
        <EntitySelect label="Entity table to delete from" />
        <div className="pt-2 border-t space-y-3">
          <Text size="xs" color="secondary" block>
            Which row? Leave blank to delete the record that triggered the workflow — usually you
            want a context key naming something an earlier step created.
          </Text>
          <FieldSelect label="Match on column (default: id)" propKey="targetField" includeId />
          <TextField label="…against this context key" k="targetSource" placeholder="newCapaId" />
        </div>
        <TextField
          label="Hard delete? (true removes the row rather than flagging it)"
          k="hard"
          placeholder="false"
        />
      </div>
    );
  }

  if (nodeType === "Formula") {
    return (
      <div className="space-y-3">
        <TextField label="Target variable name" k="target" placeholder="lead_score" />
        <TextField
          label="Source key (number from entityData/vars)"
          k="source"
          placeholder="version"
        />
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Operation</Label>
          <Select
            value={props.operation ?? "multiply"}
            onValueChange={(v) => set("operation", v)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["multiply", "divide", "add", "subtract"].map((o) => (
                <SelectItem key={o} value={o} className="text-xs">
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TextField label="Operand" k="operand" placeholder="10" />
      </div>
    );
  }

  if (nodeType === "REST") {
    return (
      <div className="space-y-3">
        <TextField label="URL" k="url" placeholder="https://hooks.example.com/notify" />
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Method</Label>
          <Select value={props.method ?? "POST"} onValueChange={(v) => set("method", v)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["POST", "PUT", "PATCH", "GET"].map((m) => (
                <SelectItem key={m} value={m} className="text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Body template (use {"{{key}}"})</Label>
          <textarea
            className="w-full h-20 text-xs border rounded p-1 font-mono resize-none"
            value={props.bodyTemplate ?? ""}
            placeholder={'{"id":"{{id}}","name":"{{name}}"}'}
            onChange={(e) => set("bodyTemplate", e.target.value)}
          />
        </div>
      </div>
    );
  }


  return null;
}

// ── CreateEntity field-map builder ────────────────────────────────────────────

interface FieldRow {
  field: string;
  source: string;
}

function parseFieldsJson(json: string): FieldRow[] {
  try {
    const obj = JSON.parse(json || "{}") as Record<string, string>;
    return Object.entries(obj).map(([field, source]) => ({ field, source }));
  } catch {
    return [];
  }
}

function serializeRows(rows: FieldRow[]): string {
  const obj: Record<string, string> = {};
  for (const r of rows) {
    if (r.field) obj[r.field] = r.source;
  }
  return JSON.stringify(obj, null, 2);
}

function CreateEntityFields({
  tableName,
  columns,
  value,
  onChange,
}: {
  tableName: string;
  columns: ColumnRow[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [rows, setRows] = useState<FieldRow[]>(
    () => parseFieldsJson(value) || [{ field: "", source: "" }]
  );
  const [showRaw, setShowRaw] = useState(false);

  const updateRows = (next: FieldRow[]) => {
    setRows(next);
    onChange(serializeRows(next));
  };

  const addRow = () => updateRows([...rows, { field: "", source: "" }]);
  const removeRow = (i: number) => updateRows(rows.filter((_, idx) => idx !== i));
  const setRow = (i: number, patch: Partial<FieldRow>) =>
    updateRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2">
      <HStack align="center" justify="between">
        <Label className="text-xs text-gray-600">Fields to set</Label>
        <button
          type="button"
          className="text-[10px] text-gray-400 hover:text-gray-600"
          onClick={() => setShowRaw((v) => !v)}
        >
          {showRaw ? "Builder" : "Raw JSON"}
        </button>
      </HStack>

      {showRaw ? (
        <textarea
          className="w-full h-24 text-xs border rounded p-1 font-mono resize-none"
          value={value}
          placeholder={'{\n  "status": "Active",\n  "type": "Call"\n}'}
          onChange={(e) => {
            onChange(e.target.value);
            setRows(parseFieldsJson(e.target.value));
          }}
        />
      ) : (
        <div className="space-y-1.5">
          <Grid columns={2} gap={1} paddingInline={1} className="text-[10px] text-gray-400">
            <span>Column</span>
            <span>Value / source key</span>
          </Grid>
          {rows.map((row, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are addressed by position — every edit is setRow(i, …), so the index is the identity
            <div key={i} className="flex gap-1 items-center">
              {columns.length > 0 ? (
                <Select value={row.field} onValueChange={(v) => setRow(i, { field: v })}>
                  <SelectTrigger className="h-6 text-xs flex-1 min-w-0">
                    <SelectValue placeholder="column…" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((c) => (
                      <SelectItem key={c.column_name} value={c.column_name} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-6 text-xs flex-1 min-w-0"
                  value={row.field}
                  placeholder="column"
                  onChange={(e) => setRow(i, { field: e.target.value })}
                />
              )}
              <Input
                className="h-6 text-xs flex-1 min-w-0"
                value={row.source}
                placeholder="value or key"
                onChange={(e) => setRow(i, { source: e.target.value })}
              />
              <button
                type="button"
                className="text-gray-300 hover:text-red-400 text-xs px-0.5"
                onClick={() => removeRow(i)}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs text-teal-600 hover:text-teal-800 mt-1"
            onClick={addRow}
          >
            + Add field
          </button>
        </div>
      )}
    </div>
  );
}

// ── Help Drawer ───────────────────────────────────────────────────────────────

function HelpDrawer({
  open,
  onClose,
  onLoad,
  currentNodeType,
}: {
  open: boolean;
  onClose: () => void;
  onLoad: (s: ScenarioExample) => void;
  currentNodeType?: NodeType;
}) {
  if (!open) return null;

  const grouped = NODE_TYPES.reduce<Record<string, ScenarioExample[]>>(
    (acc, t) => {
      acc[t] = HELP_SCENARIOS.filter(
        (s) => s.nodeType === t && (!currentNodeType || s.nodeType === currentNodeType)
      );
      return acc;
    },
    {} as Record<string, ScenarioExample[]>
  );

  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col rounded-lg border border-teal-200 shadow-xl">
      <HStack align="center" justify="between" paddingInline={3} className="py-2.5 border-b bg-teal-50 rounded-t-lg">
        <Text size="sm" weight="semibold" className="text-teal-800">📖 Workflow Examples</Text>
        <button
          type="button"
          onClick={onClose}
          className="text-teal-500 hover:text-teal-800 text-base leading-none px-1"
        >
          ✕
        </button>
      </HStack>
      <div className="overflow-y-auto flex-1 p-3 space-y-5">
        {currentNodeType && (
          <Text color="secondary" block className="text-[10px] italic">
            Showing examples for <strong>{currentNodeType}</strong> — change node type to see
            others.
          </Text>
        )}
        {NODE_TYPES.map((t) => {
          const scenarios = grouped[t];
          if (!scenarios?.length) return null;
          return (
            <div key={t}>
              <HStack align="center" gap={1.5} className="mb-2">
                <Text size="sm">{NODE_TYPE_ICONS[t]}</Text>
                <Text size="xs" weight="semibold" color="primary">{t}</Text>
              </HStack>
              <div className="space-y-2">
                {scenarios.map((s) => (
                  <div
                    key={s.title}
                    className="bg-gray-50 rounded-md p-2.5 border border-gray-100 hover:border-teal-200 transition-colors"
                  >
                    <div className="text-xs font-medium text-gray-800 mb-0.5">{s.title}</div>
                    <div className="text-[10px] text-gray-500 mb-2 leading-relaxed">
                      {s.description}
                    </div>
                    <button
                      type="button"
                      onClick={() => onLoad(s)}
                      className="text-[10px] px-2 py-0.5 rounded bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                    >
                      Load →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-3 py-2 border-t text-[10px] text-gray-400 text-center rounded-b-lg bg-gray-50">
        After loading, click <strong>Apply to Diagram</strong> to save changes to the canvas
      </div>
    </div>
  );
}
