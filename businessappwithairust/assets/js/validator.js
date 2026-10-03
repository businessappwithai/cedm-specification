/**
 * The published model validator, wired to a page.
 *
 * `guide/model-yaml.js` is the file the specification tells a language model to
 * import before handing a model to anyone. It is bundled from the language's own
 * reader — YAML syntax, the JSON Schema, the full checker, every finding at the
 * YAML line and column that caused it — the same engine the command line runs,
 * not a lighter web edition, and this file is only a front end for it: it reads
 * a document, calls `validate` or `fix`, and renders what comes back.
 *
 * That distinction matters more than it looks. If this page implemented its own
 * validation, a model could pass here and fail in the generator, and a reader
 * would have no way to tell which one was lying. Everything below goes through
 * the published module, at the published URL, so what this page says is what
 * `appwithai` will say.
 */

import { validate, fix, LANGUAGE_VERSION } from "../../guide/model-yaml.js";

const EXAMPLES = {
  crm: { path: "models/crm.eml.yaml", label: "crm.eml.yaml" },
  drug: { path: "models/drug-discovery.eml.yaml", label: "drug-discovery.eml.yaml" },
  hospital: {
    path: "models/hospital-management-system.eml.yaml",
    label: "hospital-management-system.eml.yaml",
  },
  dance: { path: "models/dance-studio.eml.yaml", label: "dance-studio.eml.yaml" },
  investment: {
    path: "models/investment-planning-wealth-management-system.eml.yaml",
    label: "investment-planning-wealth-management-system.eml.yaml",
  },
};

/**
 * A small document with four faults in it, so the failure path can be seen
 * without having to break an 1,100-line model by hand.
 *
 * One error the fixer cannot touch — an index on a column nobody declared,
 * which needs a person to say whether the index or the column was the mistake —
 * and three warnings it can: no model name, a foreign key that does not end in
 * `_id`, and an entity with no primary key. Pressing Check and then Check and
 * repair shows both halves of the contract: what gets repaired, and what is
 * handed back untouched because guessing would be worse.
 */
const BROKEN = `eml: "1.0"
enums:
  - name: OrderStatus
    values: [draft, placed, shipped]
entities:
  - name: Customer
    help: Somebody who buys from the shop, identified by the address they sign in with.
    attributes:
      - { name: id, type: uuid, pk: true, help: The customer's key. }
      - { name: email, type: email, help: The address the customer signs in with and is written to at. }
      - { name: name, type: string, help: The name to address the customer by. }
  - name: Order
    help: One purchase, from the moment it is drafted to the moment it ships.
    attributes:
      - { name: id, type: uuid, pk: true, help: The order's key. }
      - { name: customer, type: uuid, fk: true, help: Who placed the order. }
      - { name: status, type: string, enum: OrderStatus, help: Where the order has got to. }
      - { name: total, type: decimal, help: "What the customer pays, tax included." }
    indexes:
      - columns: [shipment_id]
  - name: OrderLine
    help: One product on an order, and how many of it.
    attributes:
      - { name: order_id, type: uuid, fk: true, help: The order this line belongs to. }
      - { name: sku, type: string, help: The product's stock-keeping unit. }
      - { name: quantity, type: integer, help: How many of the product were ordered. }
relationships:
  - { from: Customer, fromCardinality: exactly-one, to: Order, toCardinality: zero-or-more, label: places }
  - { from: Order, fromCardinality: exactly-one, to: OrderLine, toCardinality: zero-or-more, label: contains }
`;

const $ = (id) => document.getElementById(id);
const state = { label: "crm.eml.yaml" };

/** Severity counts, as the tally and the analytics read them. */
const countsOf = (diagnostics) => ({
  errors: diagnostics.filter((d) => d.severity === "error").length,
  warnings: diagnostics.filter((d) => d.severity === "warning").length,
  infos: diagnostics.filter((d) => d.severity === "info").length,
});

/*
 * Analytics — see assets/js/analytics.js, which owns every decision about what
 * these mean. `window.awTrack` is a no-op when analytics are off or absent, so
 * these lines are unconditional. The codes travel; the messages do not, because
 * a message carries the reader's own entity names.
 */
const verdictOf = (diagnostics, extra) => {
  const counts = countsOf(diagnostics);
  return {
    model_name: state.label,
    checker_error_count: counts.errors,
    checker_warning_count: counts.warnings,
    checker_info_count: counts.infos,
    codes: [...new Set(diagnostics.filter((d) => d.severity === "error").map((d) => d.code))],
    ...extra,
  };
};

/* --------------------------------------------------------------- the model */

async function load(key) {
  for (const id of ["choice-crm", "choice-drug", "choice-hospital", "choice-dance", "choice-investment", "choice-broken", "choice-paste"]) {
    $(id).setAttribute("aria-pressed", String(id === `choice-${key}`));
  }

  if (key === "paste") {
    state.label = "your model";
    $("model").value = "";
    $("model").focus();
    reset();
    return;
  }

  if (key === "broken") {
    state.label = "tiny-shop.eml.yaml";
    $("model").value = BROKEN;
    reset();
    return;
  }

  const example = EXAMPLES[key];
  state.label = example.label;
  $("model").value = "Loading…";
  reset();
  try {
    const response = await fetch(example.path, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    $("model").value = await response.text();
  } catch (error) {
    $("model").value = "";
    report(`<div class="failure">Could not load ${example.label}: ${escapeHtml(error.message)}</div>`);
  }
}

function reset() {
  $("check-result").classList.remove("is-shown");
  $("check-result").innerHTML = "";
  $("download-fixed").hidden = true;
}

/* ------------------------------------------------------------------ render */

function report(html) {
  $("check-result").innerHTML = html;
  $("check-result").classList.add("is-shown");
}

const cell = (value, label) =>
  `<div class="tally__cell"><span class="tally__value">${value}</span><span class="tally__label">${label}</span></div>`;

function tally(counts, extra = "") {
  return `<div class="tally">
    ${cell(counts.errors, "Errors")}
    ${cell(counts.warnings, "Warnings")}
    ${cell(counts.infos, "Infos")}
    ${extra}
  </div>`;
}

/**
 * One diagnostic per row, worst first, because the first line of a report
 * should be the thing that stops the generator rather than the thing that
 * happened to be on an earlier line.
 */
const RANK = { error: 0, warning: 1, info: 2 };

function diagnostics(list) {
  if (!list.length) return "";
  const issues = [...list].sort((a, b) => RANK[a.severity] - RANK[b.severity] || a.line - b.line);
  return `<h4>Diagnostics</h4><ul class="diags">${issues
    .map(
      (issue) => `<li class="diag diag--${issue.severity}">
        <span class="diag__sev">${issue.severity}</span>
        <span class="diag__code">${escapeHtml(issue.code)}</span>
        ${issue.line ? `<span class="diag__line">line ${issue.line}:${issue.column}</span>` : ""}
        <span class="diag__msg">${escapeHtml(issue.message)}</span>
        ${issue.hint ? `<span class="diag__hint">${escapeHtml(issue.hint)}</span>` : ""}
      </li>`
    )
    .join("")}</ul>`;
}

/**
 * A schema failure at the top of the document is the one finding that is
 * usually not about the model at all.
 *
 * It is what an *enhanced specification* scores — the document a language model
 * writes about the application it would build, instead of the model the
 * specification asks for. The reader is right and its message is accurate, but
 * "document must be object" reads as a puzzle when the thing in the box is four
 * hundred lines long, so this says what it means in the reader's terms. Nothing
 * here decides anything: it renders only when the published reader has already
 * reported the document itself — not one of its keys — as the wrong shape.
 */
function notAModel(list) {
  const aboutTheDocument = list.some(
    (d) => (d.code === "SCHEMA" || d.code === "YAML") && (!d.path || d.path.length === 0)
  );
  if (!aboutTheDocument) return "";
  return `<p class="result__note"><b>This looks like a document about a model, not a model.</b>
    A model is one YAML document that opens on <code>eml: "1.0"</code> and declares its
    <code>entities</code> — headings and bullet lists describing entities are prose to the reader,
    however thorough they are. If a language model answered you with a specification, ask it again
    for the file itself: one <code>.eml.yaml</code>, as
    <a href="../llms-full.txt">the specification</a> requires. If it answered with a report that
    contains the model in a fenced block, paste the contents of that block here instead.</p>`;
}

function textReport(list, ok) {
  const counts = countsOf(list);
  const lines = [...list]
    .sort((a, b) => RANK[a.severity] - RANK[b.severity] || a.line - b.line)
    .map((d) => {
      const tag = d.severity === "error" ? "error" : d.severity === "warning" ? "warn " : "info ";
      return `${tag} ${d.code}:${d.line}:${d.column}  ${d.message}${d.hint ? `\n      → ${d.hint}` : ""}`;
    });
  lines.push(
    `${ok ? "OK" : "FAILED"} — ${counts.errors} errors, ${counts.warnings} warnings, ${counts.infos} notes (EML ${LANGUAGE_VERSION})`
  );
  return lines.join("\n");
}

function verdict(ok, counts) {
  if (ok && !counts.warnings) return `<div class="verdict verdict--ok">Clean. <code>appwithai generate</code> will accept this model.</div>`;
  if (ok) return `<div class="verdict verdict--warn">No errors, but ${counts.warnings} warning(s). Warnings describe something the generator accepts and quietly gets wrong — clear them, or be able to say why you left them.</div>`;
  return `<div class="verdict verdict--bad">${counts.errors} error(s). The generator would refuse this model; do not hand it over in this state.</div>`;
}

/* ---------------------------------------------------------------- the runs */

$("check").addEventListener("click", () => {
  const source = $("model").value;
  if (!source.trim()) return report(`<div class="failure">There is no model to check.</div>`);

  window.awTrack?.("checker_started", { model_name: state.label, mode: "check" });
  const startedAt = performance.now();
  const result = validate(source);
  const counts = countsOf(result.diagnostics);
  window.awTrack?.(
    result.ok ? "checker_passed" : "checker_failed",
    verdictOf(result.diagnostics, {
      mode: "check",
      model_size: new Blob([source]).size,
      check_time_ms: Math.round(performance.now() - startedAt),
    })
  );
  $("download-fixed").hidden = !result.ok;
  report(
    verdict(result.ok, counts) +
      tally(counts) +
      notAModel(result.diagnostics) +
      diagnostics(result.diagnostics) +
      `<h4>As text</h4><pre class="report"><code>${escapeHtml(textReport(result.diagnostics, result.ok))}</code></pre>`
  );
});

$("fix").addEventListener("click", () => {
  const source = $("model").value;
  if (!source.trim()) return report(`<div class="failure">There is no model to repair.</div>`);

  window.awTrack?.("checker_started", { model_name: state.label, mode: "fix" });
  const startedAt = performance.now();
  const result = fix(source);
  $("model").value = result.text;
  const counts = countsOf(result.diagnostics);

  window.awTrack?.(
    result.ok ? "checker_passed" : "checker_failed",
    verdictOf(result.diagnostics, {
      mode: "fix",
      model_size: new Blob([source]).size,
      fixes_applied: result.applied.length,
      check_time_ms: Math.round(performance.now() - startedAt),
    })
  );
  const extra = cell(result.applied.length, "Repairs");

  report(
    verdict(result.ok, counts) +
      tally(counts, extra) +
      (result.applied.length
        ? `<h4>What was repaired</h4><ul class="diags">${result.applied
            .map(
              (repair) =>
                `<li class="diag diag--fixed"><span class="diag__sev">fixed</span>` +
                `<span class="diag__code">${escapeHtml(repair.code)}</span>` +
                `<span class="diag__msg">${escapeHtml(repair.description)}</span></li>`
            )
            .join("")}</ul>`
        : `<p class="result__note">Nothing was repairable mechanically. Everything left needs a person
           or a model to decide what was meant; the fixer keeps your comments and never guesses.</p>`) +
      notAModel(result.diagnostics) +
      diagnostics(result.diagnostics)
  );

  $("download-fixed").hidden = !result.ok;
});

/**
 * Hand the document back as a file — but only a document the generator would
 * accept. The button appears when a run comes back with no errors, whether it
 * needed repairs or not, and stays hidden when errors remain: handing someone a
 * file that `appwithai generate` will refuse is the failure this page exists to
 * catch, not a convenience.
 *
 *
 * The specification asks for a file rather than a fenced block someone has to
 * copy out of a chat log, and the same courtesy applies here — including to the
 * reader whose model arrived as a fenced block in a report and was pasted into
 * this box. The name follows the file contract: the model's `name`, lower-cased
 * and hyphenated, then `.eml.yaml`, so what lands in the downloads folder is
 * what the specification asked the model to deliver in the first place.
 */
function fileName(source) {
  const declared = validate(source).document?.name?.trim();
  const slug = declared
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug) return `${slug}.eml.yaml`;
  return state.label.endsWith(".eml.yaml") ? state.label : "model.eml.yaml";
}

$("download-fixed").addEventListener("click", () => {
  window.awTrack?.("model_downloaded", { model_name: state.label });
  const blob = new Blob([$("model").value], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName($("model").value);
  link.click();
  URL.revokeObjectURL(url);
});

/* ------------------------------------------------------------------- input */

$("choice-crm").addEventListener("click", () => load("crm"));
$("choice-drug").addEventListener("click", () => load("drug"));
$("choice-hospital").addEventListener("click", () => load("hospital"));
$("choice-dance").addEventListener("click", () => load("dance"));
$("choice-investment").addEventListener("click", () => load("investment"));
$("choice-broken").addEventListener("click", () => load("broken"));
$("choice-paste").addEventListener("click", () => {
  window.awTrack?.("upload_started", { method: "paste" });
  load("paste");
});

$("file").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  state.label = file.name;
  $("model").value = await file.text();
  window.awTrack?.("model_uploaded", {
    model_name: file.name,
    model_size: file.size,
    model_source: "upload",
  });
  for (const id of ["choice-crm", "choice-drug", "choice-hospital", "choice-dance", "choice-investment", "choice-broken", "choice-paste"]) {
    $(id).setAttribute("aria-pressed", "false");
  }
  reset();
});

$("model").addEventListener("input", reset);

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]
  );
}

/* Stamp the language version the published module was built against, so the
   page cannot claim a version it is not actually running. */
for (const node of document.querySelectorAll("[data-eml-version]")) {
  node.textContent = LANGUAGE_VERSION;
}

/*
 * Stamp the real URL of the published module.
 *
 * The specification quotes them under appwithai.org, and the page is written
 * that way because that is what §8 says. But a reader looking at a staging
 * host, a fork's github.io address or a local server would be copying a URL that
 * does not serve them the file in front of them. So each one is resolved against
 * this document's own origin and written in — the text always names the host
 * that is actually answering.
 */
for (const node of document.querySelectorAll("[data-url]")) {
  node.textContent = new URL(node.dataset.url, window.location.href).href;
}

await load("crm");
