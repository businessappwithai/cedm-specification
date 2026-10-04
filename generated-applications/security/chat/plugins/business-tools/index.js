// @ts-check
/**
 * The business chat's tools — the only tools its agent is given.
 *
 * Two kinds, and the split is the design:
 *
 * - **Reads** (`search_records`, `get_record_summary`, `search_reports`,
 *   `run_approved_report`) answer questions. They go through the gateway, which
 *   calls the application and the reporting platform *as the signed-in person*,
 *   so each read passes the same authorisation gates the person's own screens
 *   do. A report runs only if it is a saved report the person may run; there is
 *   no free-form SQL anywhere in this surface.
 * - **Opens** (`open_record`, `open_create_form`, `open_update_form`,
 *   `request_approval`) never change anything. They mint a short-lived view id
 *   and the chat renders the application's own screen for it, embedded in the
 *   conversation. The person edits and saves there, under the application's
 *   validation, rules and optimistic locking; the agent learns that a save
 *   happened only from the durable `record-saved` event that follows.
 *
 * The model therefore cannot write a record, cannot see a credential, a URL
 * carrying a record id, or SQL, and cannot reach a table the person could not.
 * Record identifiers it sees are opaque references the gateway issued for this
 * person and resolves again on the way back in.
 *
 * @module @appwithai/chat-business-tools
 */

import { defineTool } from "@deepseek-ai/dsh-tools";
import { callGateway, GatewayRefusal } from "./gateway-client.js";

export const name = "chat-business-tools";
export const inject = ["tools"];

/** The tool names this plugin registers; the composition gate holds the agent to exactly these. */
export const TOOL_NAMES = /** @type {const} */ ([
  "search_records",
  "get_record_summary",
  "open_record",
  "open_create_form",
  "open_update_form",
  "request_approval",
  "search_reports",
  "run_approved_report",
]);

const STATUS = /** @type {const} */ ({
  type: "object",
  additionalProperties: false,
  properties: {
    field: { type: "string", required: true },
    value: { type: "string", required: true },
    label: { type: "string", required: true },
    isFinal: { type: "boolean", required: true },
  },
});

const VIEW = /** @type {const} */ ({
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["business-application"], required: true },
    applicationViewId: { type: "string", required: true },
    title: { type: "string", required: true },
    operation: { type: "string", enum: ["view", "create", "update", "transition"], required: true },
    entity: { type: "string", required: true },
    expiresAt: { type: "string", required: true },
  },
});

/**
 * Say a refusal in words. The person asked for something; "403" is not an
 * answer, and a permission is not an error.
 * @param {unknown} error
 * @returns {never}
 */
function rethrow(error) {
  if (error instanceof GatewayRefusal) {
    if (error.status === 403) {
      throw new Error(`Not permitted: ${error.message} This is a permission, not a fault — say so.`);
    }
    if (error.status === 404) throw new Error(`Not found: ${error.message}`);
    if (error.status === 410) throw new Error(`Expired: ${error.message}`);
  }
  throw error;
}

/**
 * The text the model reads after an open: what is on the screen, and that
 * nothing has happened yet.
 * @param {{ title: string, operation: string }} view
 */
function openedText(view) {
  const verb =
    view.operation === "create"
      ? "a new-record form"
      : view.operation === "update"
        ? "the edit form"
        : view.operation === "transition"
          ? "the record at its workflow step, with the transition ready to confirm"
          : "the record";
  return (
    `Showing ${verb} for ${view.title} in the conversation. Nothing has been saved: ` +
    "the person acts in the application's own screen, and a save is reported to you as a " +
    "record-saved event. Do not say it was saved until that event arrives."
  );
}

/** @param {{ tools: { register(tool: unknown): unknown } }} ctx */
export function apply(ctx) {
  ctx.tools.register(
    defineTool({
      name: "search_records",
      description:
        "Find records of one entity of the business application, as the signed-in person sees them. " +
        "Name the entity as the application does (for example 'Account' or 'Sales Order'). " +
        "Use text for a free-text match, filters for exact column values. Returns opaque refs to use " +
        "with the other tools; never invent a ref.",
      parameters: {
        entity: { type: "string", required: true, description: "Entity name or its window label." },
        text: { type: "string", description: "Free-text search across the entity's text columns." },
        filters: {
          type: "object",
          additionalProperties: true,
          description: "Exact matches by column name, e.g. { \"status\": \"open\" }.",
        },
        page: { type: "integer", description: "1-based page, default 1." },
        pageSize: { type: "integer", description: "Rows per page, 1–50, default 20." },
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            entity: { type: "string", required: true },
            label: { type: "string", required: true },
            total: { type: "integer", required: true },
            page: { type: "integer", required: true },
            rows: {
              type: "array",
              required: true,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  ref: { type: "string", required: true },
                  label: { type: "string", required: true },
                  fields: { type: "json", required: true },
                  status: { oneOf: [STATUS, { type: "null" }] },
                },
              },
            },
          },
        },
        render: (_args, value) => [
          {
            type: "text",
            text:
              `${value.total} ${value.label} record(s) match; page ${value.page} shows ${value.rows.length}.\n` +
              JSON.stringify(value.rows),
          },
        ],
      },
      execute: (args, exec) =>
        callGateway("search_records", args, exec.signal).catch(rethrow),
      presentCall: (args) => ({
        card: "generic",
        title: `Search ${args.entity}`,
        kind: "search",
        rawInput: args,
      }),
    })
  );

  ctx.tools.register(
    defineTool({
      name: "get_record_summary",
      description:
        "Read one record by its ref: its fields, its status and whether that status is final " +
        "(a final record is a completed transaction and cannot be changed), and the workflow moves " +
        "the signed-in person may make from here.",
      parameters: { ref: { type: "string", required: true, description: "A ref from search_records." } },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            ref: { type: "string", required: true },
            entity: { type: "string", required: true },
            label: { type: "string", required: true },
            fields: { type: "json", required: true },
            status: { oneOf: [STATUS, { type: "null" }], required: true },
            transitions: {
              type: "array",
              required: true,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  to: { type: "string", required: true },
                  label: { type: "string", required: true },
                },
              },
            },
          },
        },
        render: (_args, value) => [{ type: "text", text: JSON.stringify(value) }],
      },
      execute: (args, exec) =>
        callGateway("get_record_summary", args, exec.signal).catch(rethrow),
    })
  );

  /**
   * One "open" tool: all four share the descriptor and the rendering.
   * @param {"open_record" | "open_create_form" | "open_update_form" | "request_approval"} toolName
   * @param {string} description
   * @param {Record<string, any>} parameters
   * @param {(args: any) => string} title
   */
  const registerOpen = (toolName, description, parameters, title) =>
    ctx.tools.register(
      defineTool({
        name: toolName,
        description,
        parameters,
        output: {
          schema: VIEW,
          render: (_args, view) => [{ type: "text", text: openedText(view) }],
          presentationMeta: (_args, view) => view,
        },
        execute: (args, exec) => callGateway(toolName, args, exec.signal).catch(rethrow),
        presentCall: (args) => ({ card: "generic", title: title(args), kind: "other", rawInput: args }),
      })
    );

  registerOpen(
    "open_record",
    "Show one record in the application's own screen, inside the conversation.",
    { ref: { type: "string", required: true } },
    () => "Open record"
  );
  registerOpen(
    "open_create_form",
    "Show the application's new-record form for an entity, inside the conversation. The person " +
      "fills it in and saves; you never create the record yourself.",
    { entity: { type: "string", required: true } },
    (args) => `New ${args.entity}`
  );
  registerOpen(
    "open_update_form",
    "Show the application's edit form for a record, inside the conversation. The person changes " +
      "and saves it; if someone else saved first, the application asks them to refresh or overwrite.",
    { ref: { type: "string", required: true } },
    () => "Edit record"
  );
  registerOpen(
    "request_approval",
    "Show a record at its workflow step with one move selected — approve, reject, submit and so " +
      "on. The person confirms it in the application. Use only a move get_record_summary listed.",
    {
      ref: { type: "string", required: true },
      transition: { type: "string", required: true, description: "The target state, as listed." },
    },
    (args) => `Move to ${args.transition}`
  );

  ctx.tools.register(
    defineTool({
      name: "search_reports",
      description:
        "List the saved reports the signed-in person may run on the reporting platform, optionally " +
        "narrowed by words in their title or description. Prefer a report over many record searches " +
        "for a question across many records.",
      parameters: { text: { type: "string" } },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reports: {
              type: "array",
              required: true,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  reportId: { type: "string", required: true },
                  title: { type: "string", required: true },
                  description: { type: "string", required: true },
                },
              },
            },
          },
        },
        render: (_args, value) => [{ type: "text", text: JSON.stringify(value.reports) }],
      },
      execute: (args, exec) => callGateway("search_reports", args, exec.signal).catch(rethrow),
    })
  );

  ctx.tools.register(
    defineTool({
      name: "run_approved_report",
      description:
        "Run one saved report by id, as the signed-in person, and show it in the conversation as a " +
        "table (and a chart when the report has one). You receive the columns, the row count and the " +
        "first rows; the person can page through the rest and download it.",
      parameters: {
        reportId: { type: "string", required: true },
        params: { type: "object", additionalProperties: true, description: "Report filter values." },
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { type: "string", enum: ["enterprise-report"], required: true },
            reportViewId: { type: "string", required: true },
            title: { type: "string", required: true },
            columns: { type: "array", items: { type: "string" }, required: true },
            rowCount: { type: "integer", required: true },
            preview: { type: "array", items: { type: "json" }, required: true },
            hasChart: { type: "boolean", required: true },
            expiresAt: { type: "string", required: true },
          },
        },
        render: (_args, value) => [
          {
            type: "text",
            text:
              `${value.title}: ${value.rowCount} row(s), columns ${value.columns.join(", ")}. ` +
              `First rows: ${JSON.stringify(value.preview)}`,
          },
        ],
        presentationMeta: (_args, value) => ({
          type: value.type,
          reportViewId: value.reportViewId,
          title: value.title,
          hasChart: value.hasChart,
          expiresAt: value.expiresAt,
        }),
      },
      execute: (args, exec) =>
        callGateway("run_approved_report", args, exec.signal).catch(rethrow),
    })
  );
}
