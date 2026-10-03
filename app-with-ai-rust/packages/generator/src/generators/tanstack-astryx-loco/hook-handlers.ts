/**
 * `%%hook` directives → Rust lifecycle handlers in the generated Loco backend.
 *
 * The directives were parsed, validated, documented in the manual and drawn on
 * the model graph, and then dropped: nothing emitted them into the backend, so
 * a model could declare `beforeCreate generateInchiKey on Compound` and the
 * generated application would silently do nothing. That is the same class of
 * failure the dictionary seed and the `%%rbac` grants each hit once — a
 * directive the checker accepts and the generator throws away.
 *
 * Three kinds of file come out of here, and the split is the whole design:
 *
 * - `src/hooks/handlers/<entity>.rs` — one function per declared hook, with a
 *   documented no-op body. **Written once and then never touched**, because the
 *   bodies are the developer's. Regenerating a project must not delete an
 *   implementation someone wrote.
 * - `src/hooks/handlers/mod.rs` and `src/hooks/mod.rs` — pure wiring, rewritten
 *   on every run, so a hook added to the model after the first generation is
 *   always picked up.
 *
 * That asymmetry is why the registry cannot live in the handler files: if the
 * two were one file it would have to be either always overwritten (losing
 * implementations) or never overwritten (never picking up a new hook).
 *
 * Both generators build these strings, so the two must agree byte for byte —
 * `crates/appwithai-gen/src/hooks.rs` is the mirror, and `bun run parity` is
 * the gate. Keep the two in step in the same commit.
 */

import type { CompiledHook, HookType } from "../../hooks";
import { hooksByEntity } from "../../hooks";
import { snakeCase } from "@appwithai/core/utils";

/**
 * What each hook type looks like in Rust.
 *
 * `params` is the parameter list a handler declares, `call` is how the registry
 * passes them through, and `returns` is the type. They are separate because the
 * registry has to forward exactly what it was handed — writing the call site by
 * reformatting the parameter list is how the two drift apart.
 *
 * Everything returns `AppResult`, so a hook can refuse a request: an
 * `AppError::Validation` from `customValidate` is the 400 a caller expects, and
 * `beforeDelete` returning `Ok(false)` blocks the delete without an error.
 */
export interface HookRustContract {
  /** The handler's parameter list, as written in its signature. */
  params: string;
  /** The argument list the registry forwards. */
  call: string;
  /** The return type inside `AppResult<...>`. */
  returns: string;
  /** The body of a freshly generated stub. */
  body: string;
  /** One line for the handler's doc comment. */
  summary: string;
}

export const HOOK_RUST_CONTRACTS: Record<HookType, HookRustContract> = {
  beforeCreate: {
    params: "data: &mut Map<String, Value>",
    call: "data",
    returns: "()",
    body: "    let _ = data;\n    Ok(())",
    summary: "Runs before the insert. Mutate `data` to change what is written.",
  },
  afterCreate: {
    params: "record: &Value",
    call: "record",
    returns: "()",
    body: "    let _ = record;\n    Ok(())",
    summary: "Runs after the insert, on the stored row. Side effects only.",
  },
  beforeUpdate: {
    params: "id: Uuid, data: &mut Map<String, Value>",
    call: "id, data",
    returns: "()",
    body: "    let _ = (id, data);\n    Ok(())",
    summary: "Runs before the update. Mutate `data` to change what is written.",
  },
  afterUpdate: {
    params: "record: &Value",
    call: "record",
    returns: "()",
    body: "    let _ = record;\n    Ok(())",
    summary: "Runs after the update, on the stored row. Side effects only.",
  },
  beforeDelete: {
    params: "id: Uuid",
    call: "id",
    returns: "bool",
    body: "    let _ = id;\n    Ok(true)",
    summary: "Runs before the delete. Return `Ok(false)` to block it.",
  },
  afterDelete: {
    params: "record: &Value",
    call: "record",
    returns: "()",
    body: "    let _ = record;\n    Ok(())",
    summary: "Runs after the delete, on the row as it was. Clean up related state.",
  },
  beforeRead: {
    params: "id: Uuid",
    call: "id",
    returns: "()",
    body: "    let _ = id;\n    Ok(())",
    summary: "Runs before a single record is fetched. Return an error to refuse.",
  },
  afterRead: {
    params: "record: &mut Value",
    call: "record",
    returns: "()",
    body: "    let _ = record;\n    Ok(())",
    summary: "Runs after a single record is fetched. Mutate it to shape the response.",
  },
  beforeQuery: {
    params: "params: &mut HashMap<String, String>",
    call: "params",
    returns: "()",
    body: "    let _ = params;\n    Ok(())",
    summary: "Runs before the list query. Mutate `params` to scope or filter it.",
  },
  afterQuery: {
    params: "rows: &mut Vec<Value>",
    call: "rows",
    returns: "()",
    body: "    let _ = rows;\n    Ok(())",
    summary: "Runs on the rows the list query returned, before `afterList`.",
  },
  beforeList: {
    params: "params: &HashMap<String, String>",
    call: "params",
    returns: "()",
    body: "    let _ = params;\n    Ok(())",
    summary: "Runs before the list query, after `beforeQuery`. Return an error to refuse.",
  },
  afterList: {
    params: "rows: &mut Vec<Value>",
    call: "rows",
    returns: "()",
    body: "    let _ = rows;\n    Ok(())",
    summary: "Runs on the page of rows about to be returned.",
  },
  customValidate: {
    params: "data: &Map<String, Value>",
    call: "data",
    returns: "()",
    body: "    let _ = data;\n    Ok(())",
    summary: "Runs on create and on update. Return an `AppError::Validation` to refuse.",
  },
};

/**
 * The order the registry runs hook types in, and the order the dispatch
 * functions are emitted.
 *
 * `beforeQuery` before `beforeList` and `afterQuery` before `afterList` because
 * this stack's list endpoint *is* its query: one generic handler reads the
 * filter parameters and returns the page. Running the query pair around the
 * fetch and the list pair around the response is what keeps both meaningful
 * rather than making one of them a synonym that never fires.
 */
export const HOOK_DISPATCH_ORDER: HookType[] = [
  "beforeCreate",
  "afterCreate",
  "beforeUpdate",
  "afterUpdate",
  "beforeDelete",
  "afterDelete",
  "beforeRead",
  "afterRead",
  "beforeQuery",
  "afterQuery",
  "beforeList",
  "afterList",
  "customValidate",
];

/** `beforeCreate` → `before_create`. The dispatch function's name. */
export function dispatchName(type: HookType): string {
  return type.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** The module a given entity's handlers live in: `DeviationReport` → `deviation_report`. */
export function handlerModule(entity: string): string {
  return snakeCase(entity);
}

/** One handler function: a documented no-op with the right shape. */
function renderHandler(entity: string, hook: CompiledHook): string {
  const contract = HOOK_RUST_CONTRACTS[hook.type];
  const scope = hook.field ? `\n/// Scoped by the model to \`${hook.field}\`.` : "";
  return (
    `/// \`${hook.type}\` on ${entity} — declared by the model.\n` +
    `///\n` +
    `/// ${contract.summary}${scope}\n` +
    `pub async fn ${snakeCase(hook.handler)}(${contract.params}) -> AppResult<${contract.returns}> {\n` +
    `${contract.body}\n` +
    `}\n`
  );
}

/**
 * One entity's handler module.
 *
 * Written once. The header says so, because the file's whole contract is that
 * the next generation run will not touch it.
 */
export function buildHookHandlerModule(entity: string, hooks: CompiledHook[]): string {
  const ordered = [...hooks].sort((a, b) => a.order - b.order);
  const header =
    `//! Lifecycle handlers for ${entity}.\n` +
    `//!\n` +
    `//! Declared by the model's \`%%hook\` directives and wired up in\n` +
    `//! \`crate::hooks\`. **The bodies are yours.** This file is written\n` +
    `//! once and then left alone, so regenerating the project will not overwrite\n` +
    `//! what you put here; a hook added to the model later arrives as a new stub\n` +
    `//! appended below.\n` +
    `//!\n` +
    `//! Each returns \`AppResult\`, so returning an error refuses the request.\n\n` +
    `use crate::errors::AppResult;\n` +
    `#[allow(unused_imports)]\n` +
    `use serde_json::{Map, Value};\n` +
    `#[allow(unused_imports)]\n` +
    `use std::collections::HashMap;\n` +
    `#[allow(unused_imports)]\n` +
    `use uuid::Uuid;\n\n`;

  return header + ordered.map((hook) => renderHandler(entity, hook)).join("\n");
}

/**
 * Stubs for hooks a handler module does not define yet.
 *
 * A hook declared after the project was first generated has to arrive
 * somehow, and rewriting the module would take the implementations with it.
 * Returns `null` when the module already defines everything.
 */
export function appendMissingHandlers(
  entity: string,
  hooks: CompiledHook[],
  existing: string
): string | null {
  const missing = [...hooks]
    .sort((a, b) => a.order - b.order)
    .filter((hook) => !new RegExp(`\\bfn\\s+${snakeCase(hook.handler)}\\s*\\(`).test(existing));
  if (missing.length === 0) return null;

  return (
    `${existing.trimEnd()}\n\n` +
    `// --- Added by a later generation run ---\n\n` +
    missing.map((hook) => renderHandler(entity, hook)).join("\n")
  );
}

/** `handlers/mod.rs` — one `pub mod` per entity that declares a hook. */
export function buildHookHandlersMod(entities: string[]): string {
  const header =
    `//! Per-entity lifecycle handler modules.\n` +
    `//!\n` +
    `//! Generated wiring — rewritten on every run. The modules it names are not.\n\n`;

  if (entities.length === 0) {
    return `${header}// No \`%%hook\` directive in this model.\n`;
  }

  return (
    header +
    [...entities]
      .sort()
      .map((entity) => `pub mod ${handlerModule(entity)};\n`)
      .join("")
  );
}

/**
 * `src/hooks/mod.rs` — the registry.
 *
 * One dispatch function per hook type, each matching on the entity. Pure
 * wiring, rewritten on every run.
 *
 * The identifier reaching the bus controller is whatever the caller used: the
 * REST route sends `bus_compound`, the frontend sends the entity name, the
 * model calls it `Compound`. Matching on any one spelling would mean hooks
 * that fire from one route and not another, so the key is normalised first.
 */
export function buildHookRegistry(hooks: CompiledHook[]): string {
  const grouped = hooksByEntity(hooks);
  const entities = [...grouped.keys()].sort();

  let out =
    `//! The hook registry: which handler runs on which entity, for each event.\n` +
    `//!\n` +
    `//! Generated wiring — rewritten on every run, so a \`%%hook\` added to the\n` +
    `//! model is always picked up. The handler bodies in \`handlers/\` are not\n` +
    `//! rewritten; see that module's header.\n` +
    `//!\n` +
    `//! A dispatch function with no arm for an entity is a no-op, which is what\n` +
    `//! makes it safe for the generic bus controller to call all of these\n` +
    `//! unconditionally on every request.\n\n` +
    `pub mod handlers;\n\n` +
    `use crate::errors::AppResult;\n` +
    `#[allow(unused_imports)]\n` +
    `use serde_json::{Map, Value};\n` +
    `#[allow(unused_imports)]\n` +
    `use std::collections::HashMap;\n` +
    `#[allow(unused_imports)]\n` +
    `use uuid::Uuid;\n\n` +
    `/// Normalise whatever spelling the caller used to the model's entity name.\n` +
    `///\n` +
    `/// \`bus_compound\`, \`compound\`, \`Compound\` and \`chemical-inventory\` all have\n` +
    `/// to reach the same handlers, or a hook would fire from one route and not\n` +
    `/// another.\n` +
    `fn key(entity: &str) -> String {\n` +
    `    let trimmed = entity.strip_prefix("bus_").unwrap_or(entity);\n` +
    `    trimmed\n` +
    `        .chars()\n` +
    `        .filter(|c| c.is_ascii_alphanumeric())\n` +
    `        .map(|c| c.to_ascii_lowercase())\n` +
    `        .collect()\n` +
    `}\n`;

  for (const type of HOOK_DISPATCH_ORDER) {
    const contract = HOOK_RUST_CONTRACTS[type];
    const fn = dispatchName(type);

    // Only entities that actually declare this event get an arm. `indent` is
    // the body's indentation, which differs between the `match` and the `if`
    // that a single arm collapses to — see below.
    const declaring = entities
      .map((entity) => {
        const forEvent = (grouped.get(entity) ?? [])
          .filter((hook) => hook.type === type)
          .sort((a, b) => a.order - b.order);
        return forEvent.length === 0 ? null : ({ entity, forEvent } as const);
      })
      .filter((e): e is { entity: string; forEvent: CompiledHook[] } => e !== null);

    const callsFor = (entity: string, forEvent: CompiledHook[], indent: string): string =>
      forEvent
        .map((hook) => {
          const path = `handlers::${handlerModule(entity)}::${snakeCase(hook.handler)}`;
          return contract.returns === "bool"
            ? `${indent}if !${path}(${contract.call}).await? {\n` +
                `${indent}    return Ok(false);\n` +
                `${indent}}\n`
            : `${indent}${path}(${contract.call}).await?;\n`;
        })
        .join("");

    const ok = contract.returns === "bool" ? "Ok(true)" : "Ok(())";

    out +=
      `\n/// \`${type}\` — ${contract.summary}\n` +
      `pub async fn ${fn}(entity: &str, ${contract.params}) -> AppResult<${contract.returns}> {\n`;

    if (declaring.length === 0) {
      // No entity declares this event. Naming the parameters keeps the
      // signature identical to the populated form, so the controller's call
      // sites do not change shape with the model.
      out += `    let _ = (entity, ${contract.call});\n` + `    ${ok}\n` + `}\n`;
    } else if (declaring.length === 1) {
      // Exactly one entity. A `match` with one arm and a `_ => {}` is what
      // clippy's `single_match` rejects, and the generated backend is expected
      // to be clippy-clean with `-D warnings` — so this shape is not cosmetic,
      // it is the difference between a crate that builds in CI and one that
      // does not. How many entities declare an event is a property of the
      // model, so both shapes have to be emitted from the same builder.
      const only = declaring[0] as { entity: string; forEvent: CompiledHook[] };
      out +=
        `    if key(entity) == "${key(only.entity)}" {\n` +
        callsFor(only.entity, only.forEvent, "        ") +
        `    }\n` +
        `    ${ok}\n` +
        `}\n`;
    } else {
      out +=
        `    match key(entity).as_str() {\n` +
        declaring
          .map(
            ({ entity, forEvent }) =>
              `        "${key(entity)}" => {\n${callsFor(entity, forEvent, "            ")}        }\n`
          )
          .join("") +
        `        _ => {}\n` +
        `    }\n` +
        `    ${ok}\n` +
        `}\n`;
    }
  }

  return out;
}

/** The same normalisation the generated `key()` performs, for building match arms. */
function key(entity: string): string {
  const trimmed = entity.startsWith("bus_") ? entity.slice(4) : entity;
  return trimmed.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}
