/**
 * EML saga compiler — a parsed saga to an executable BPMN process.
 *
 * The parsing lives in `language/sagas.ts`, because reading the language is
 * the language package's job and the checker and CLI need it too. What is left
 * here is the part that belongs to the generator: turning a saga into the BPMN
 * the backend executor runs and the Workflow Designer edits, and into the seed
 * that installs it.
 */

export * from "./sagas";

import type { SagaWorkflow } from "./sagas";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** A BPMN-safe id. Node ids come from the model, so they are not trusted. */
function safeId(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9_-]/g, "_");
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `n_${cleaned}`;
}

/** Diagram geometry. A saga is a straight line, so the layout is one row. */
const LAYOUT = {
  rowY: 140,
  eventSize: 36,
  taskWidth: 140,
  taskHeight: 80,
  startX: 160,
  gap: 60,
} as const;

/**
 * The `bpmndi` section for a linear process.
 *
 * bpmn-js does *not* lay out a diagram that carries no `BPMNDiagram`: it
 * rejects the import with "no diagram to display", so a model-declared saga
 * opened in the Workflow Designer rendered nothing at all — no shapes, no step
 * cards, no way to read or edit what the model declared. Coordinates are
 * emitted here instead. They cost nothing on a re-save, because the designer
 * exports its own DI from whatever the user has arranged.
 */
function buildDiagram(processId: string, sequence: string[], flowIds: string[]): string {
  const { rowY, eventSize, taskWidth, taskHeight, startX, gap } = LAYOUT;

  // Bounds per node, left to right: event, tasks…, event.
  const bounds = sequence.map((id, index) => {
    const isEvent = index === 0 || index === sequence.length - 1;
    const width = isEvent ? eventSize : taskWidth;
    const height = isEvent ? eventSize : taskHeight;
    // Every preceding node contributes its own width plus one gap.
    const x =
      startX +
      sequence.slice(0, index).reduce((total, _node, position) => {
        const precedingIsEvent = position === 0 || position === sequence.length - 1;
        return total + (precedingIsEvent ? eventSize : taskWidth) + gap;
      }, 0);
    return { id, x, y: rowY - height / 2, width, height };
  });

  const shapes = bounds
    .map(
      (node) =>
        `      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"/>
      </bpmndi:BPMNShape>`
    )
    .join("\n");

  const edges = flowIds
    .map((flowId, index) => {
      const from = bounds[index]!;
      const to = bounds[index + 1]!;
      return `      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${from.x + from.width}" y="${rowY}"/>
        <di:waypoint x="${to.x}" y="${rowY}"/>
      </bpmndi:BPMNEdge>`;
    })
    .join("\n");

  return `  <bpmndi:BPMNDiagram id="BPMNDiagram_${processId}">
    <bpmndi:BPMNPlane id="BPMNPlane_${processId}" bpmnElement="${processId}">
${shapes}
${edges}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>`;
}

/**
 * Compile a saga to BPMN.
 *
 * Properties ride as `appwithai:property` extension elements — the encoding the
 * designer reads and the executor parses. Emitting anything else here would
 * produce a diagram that runs but cannot be edited, or the reverse.
 */
export function buildSagaBpmn(saga: SagaWorkflow): string {
  const processId = `Process_${safeId(saga.name)}`;
  const startId = `${processId}_start`;
  const endId = `${processId}_end`;

  const taskIds = saga.steps.map((step) => `${processId}_${safeId(step.nodeId)}`);
  const sequence = [startId, ...taskIds, endId];

  const tasks = saga.steps
    .map((step, index) => {
      const properties = Object.entries(step.properties)
        .map(
          ([key, value]) =>
            `        <appwithai:property name="${escapeXml(key)}" value="${escapeXml(value)}"/>`
        )
        .join("\n");

      return `    <bpmn:serviceTask id="${taskIds[index]}" name="${escapeXml(step.label)}">
      <bpmn:extensionElements>
        <appwithai:properties>
        <appwithai:property name="nodeType" value="${escapeXml(step.nodeType)}"/>
${properties}
        </appwithai:properties>
      </bpmn:extensionElements>
    </bpmn:serviceTask>`;
    })
    .join("\n");

  const flowIds = sequence.slice(0, -1).map((_from, index) => `${processId}_flow_${index}`);
  const flows = sequence
    .slice(0, -1)
    .map(
      (from, index) =>
        `    <bpmn:sequenceFlow id="${flowIds[index]}" sourceRef="${from}" targetRef="${sequence[index + 1]}"/>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:appwithai="http://appwithai.io/schema/1.0"
  id="Definitions_${safeId(saga.name)}"
  targetNamespace="http://appwithai.io/bpmn">
  <bpmn:process id="${processId}" isExecutable="true">
    <bpmn:startEvent id="${startId}"/>
${tasks}
    <bpmn:endEvent id="${endId}"/>
${flows}
  </bpmn:process>
${buildDiagram(processId, sequence, flowIds)}
</bpmn:definitions>`;
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Seed SQL for every saga in the model.
 *
 * Upserted by name, so regenerating a model updates the definition it owns.
 * `is_model_managed` marks these as belonging to the model: the designer shows
 * them read-only rather than letting an edit be silently overwritten by the
 * next generation — the alternative was losing someone's work with no warning.
 */
export function buildWorkflowSeedSql(saga: SagaWorkflow[], projectName: string): string {
  const header = `-- Model-declared workflows for ${projectName}.
--
-- Generated by @appwithai/generator from the model's \`kind: saga\` sections —
-- do not edit by hand; change the model and regenerate.
--
-- Upserted by name: these definitions belong to the model, and the designer
-- presents them read-only so a regeneration cannot quietly discard an edit
-- someone made in the UI.
`;

  if (saga.length === 0) {
    return `${header}
-- The model declares no sagas.
`;
  }

  const statements = saga.map((workflow) => {
    const bpmn = buildSagaBpmn(workflow);
    const description = workflow.description
      ? sqlString(workflow.description)
      : sqlString(`Declared in the model as a ${workflow.trigger}-triggered saga.`);

    return `INSERT INTO sys_workflow_definitions
  (name, entity_name, operation, trigger_type, bpmn_xml, description, is_active, is_model_managed, created_at, updated_at)
VALUES (${sqlString(workflow.name)}, ${sqlString(workflow.entity)}, ${sqlString(workflow.operation)},
        ${sqlString(workflow.trigger)}, ${sqlString(bpmn)}, ${description}, TRUE, TRUE, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  entity_name      = EXCLUDED.entity_name,
  operation        = EXCLUDED.operation,
  trigger_type     = EXCLUDED.trigger_type,
  bpmn_xml         = EXCLUDED.bpmn_xml,
  description      = EXCLUDED.description,
  is_model_managed = TRUE,
  updated_at       = NOW();`;
  });

  return `${header}\n${statements.join("\n\n")}\n`;
}
