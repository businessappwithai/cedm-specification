/**
 * The page that generates and runs an application without a server.
 *
 * Three moving parts, in order:
 *
 *   1. A model is read — from `models/*.eml.yaml` beside this page, or from a
 *      file the reader picks. Reading a picked file never leaves the tab.
 *   2. `appwithai-model.js` reads, validates and compiles it — the language's
 *      own reader and compiler, bundled — and `appwithai-wasm.js` generates
 *      the application from the compiled model.
 *   3. The files are posted to a Service Worker, which serves them as if they
 *      had come off a web server, and an iframe is pointed at the result.
 *
 * The third step is the one worth explaining. The obvious shortcut is to write
 * the application into a blob URL and skip the worker — but then the app's own
 * `fetch("/api/…")` calls have no origin to go to, and the whole property being
 * demonstrated (that this is a server the front end is talking to, not a library
 * it is calling) quietly stops being true. Going through the Service Worker
 * keeps the generated application byte-identical to the one you would deploy.
 */

// The language's own reader, checker, fixer and compiler, bundled for the
// browser by app-with-ai-rust's scripts/sites/build-site-bundles.ts — the same
// engine as `guide/model-yaml.js`, the validator the protocol documents tell a
// model to run its output past, so the page and the protocol cannot disagree
// about whether a document is acceptable.
import { compileForBrowser, fix } from "./appwithai-model.js";
import { generateFromModel } from "./appwithai-wasm.js";
import { createZip } from "./zip.js";

const BASE = new URL("wasm-app/run/", window.location.href).pathname;
const SW_URL = new URL("wasm-app/sw.js", window.location.href).pathname;
const SW_SCOPE = new URL("wasm-app/", window.location.href).pathname;

const BUILT_IN = {
  crm: { path: "models/crm.eml.yaml", label: "crm.eml.yaml", name: "Acme CRM" },
  drug: {
    path: "models/drug-discovery.eml.yaml",
    label: "drug-discovery.eml.yaml",
    name: "Drug Discovery",
  },
  hospital: {
    path: "models/hospital-management-system.eml.yaml",
    label: "hospital-management-system.eml.yaml",
    name: "Hospital Management System",
  },
  dance: {
    path: "models/dance-studio.eml.yaml",
    label: "dance-studio.eml.yaml",
    name: "Acme Dance Studio",
  },
  investment: {
    path: "models/investment-planning-wealth-management-system.eml.yaml",
    label: "investment-planning-wealth-management-system.eml.yaml",
    name: "Investment Planning and Wealth Management",
  },
  education: {
    path: "models/education-management-system.eml.yaml",
    label: "education-management-system.eml.yaml",
    name: "Education Management System",
  },
};

const $ = (id) => document.getElementById(id);

const state = {
  source: "",
  label: "",
  files: null,
  summary: null,
  registration: null,
  review: null,
  pgliteUrl: null,
  // Analytics only: "built_in" or "upload". See assets/js/analytics.js.
  origin: "",
};

/* ---------------------------------------------------------------- progress */

/**
 * The build, as a bar.
 *
 * Six phases, weighted by how long they actually take rather than evenly: the
 * first four together are a fraction of a second on any model this page will be
 * given, and booting Postgres is ten seconds or more. An evenly divided bar
 * would sit at 66% for the entire wait, which is worse than no bar — it would be
 * reporting the number of steps rather than the progress through them.
 *
 * The weights come from measuring the CRM model, and they are honest about
 * being estimates for everything except `boot`, which reports its own sub-steps
 * from inside the frame and is the only phase long enough for that to matter.
 */
const PHASES = [
  { id: "model", label: "Read the model", weight: 4 },
  { id: "check", label: "Check it", weight: 8 },
  { id: "compile", label: "Compile the application", weight: 12 },
  { id: "mount", label: "Serve the files", weight: 6 },
  { id: "boot", label: "Start Postgres and the server", weight: 62 },
  { id: "ready", label: "Application running", weight: 8 },
];

const TOTAL_WEIGHT = PHASES.reduce((sum, phase) => sum + phase.weight, 0);

const build = {
  /** phase id -> "pending" | "active" | "done" | "failed" */
  status: Object.fromEntries(PHASES.map((phase) => [phase.id, "pending"])),
  /** Fraction 0..1 through the phase currently active. */
  within: 0,

  reset() {
    for (const phase of PHASES) this.status[phase.id] = "pending";
    this.within = 0;
    $("build").hidden = false;
    $("build-detail").textContent = "";
    this.paint();
  },

  /** Mark a phase started; everything before it is finished by definition. */
  start(id, detail = "") {
    const index = PHASES.findIndex((phase) => phase.id === id);
    PHASES.forEach((phase, position) => {
      if (position < index && this.status[phase.id] !== "failed") this.status[phase.id] = "done";
    });
    this.status[id] = "active";
    this.within = 0;
    if (detail) $("build-detail").textContent = detail;
    this.paint();
  },

  /** Progress within the active phase, for the one phase long enough to need it. */
  advance(fraction, detail = "") {
    this.within = Math.max(0, Math.min(1, fraction));
    if (detail) $("build-detail").textContent = detail;
    this.paint();
  },

  done(id, detail = "") {
    this.status[id] = "done";
    this.within = 0;
    if (detail) $("build-detail").textContent = detail;
    this.paint();
  },

  fail(id, detail) {
    this.status[id] = "failed";
    if (detail) $("build-detail").textContent = detail;
    this.paint();
  },

  paint() {
    let earned = 0;
    for (const phase of PHASES) {
      const status = this.status[phase.id];
      if (status === "done") earned += phase.weight;
      else if (status === "active") earned += phase.weight * this.within;
    }
    const pct = Math.round((earned / TOTAL_WEIGHT) * 100);
    const failed = PHASES.some((phase) => this.status[phase.id] === "failed");
    const active = PHASES.find((phase) => this.status[phase.id] === "active");
    const complete = PHASES.every((phase) => this.status[phase.id] === "done");

    $("build-fill").style.width = `${pct}%`;
    $("build").dataset.state = failed ? "failed" : complete ? "done" : "running";
    $("build-pct").textContent = failed ? "stopped" : `${pct}%`;
    $("build-label").textContent = failed
      ? "Build stopped"
      : complete
        ? "Application running"
        : (active?.label ?? "Ready to build");

    const bar = $("build-bar");
    bar.setAttribute("aria-valuenow", String(pct));

    $("build-phases").innerHTML = PHASES.map(
      (phase) =>
        `<li class="build__phase" data-phase="${phase.id}" data-state="${this.status[phase.id]}">` +
        `<span class="build__tick"></span>${escapeHtml(phase.label)}</li>`
    ).join("");
  },
};

/* ------------------------------------------------------------------ step 1 */

const choices = [
  [$("choice-crm"), "crm"],
  [$("choice-drug"), "drug"],
  [$("choice-hospital"), "hospital"],
  [$("choice-dance"), "dance"],
  [$("choice-investment"), "investment"],
  [$("choice-education"), "education"],
  [$("choice-upload"), "upload"],
];

for (const [button, kind] of choices) {
  button.addEventListener("click", () => selectChoice(kind));
}

async function selectChoice(kind) {
  for (const [button, candidate] of choices) {
    button.setAttribute("aria-pressed", String(candidate === kind));
  }
  /* Nothing to show or hide: the dropzone is part of the "Upload your own"
     card now, so it is on screen from the start. It used to be a separate box
     revealed only once that card was pressed, which put the one control a
     reader arriving with their own model came here to use behind a click they
     had no reason to make. */

  if (kind === "upload") {
    state.origin = "upload";
    window.awTrack?.("upload_started");
    setModel("", "");
    return;
  }

  state.origin = "built_in";
  const built = BUILT_IN[kind];
  setModel("", "");
  try {
    const response = await fetch(built.path, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    setModel(await response.text(), built.label);
    $("app-name").value = built.name;
  } catch (error) {
    fail(
      `Could not read <code>${built.path}</code> (${error.message}). ` +
        "This page has to be opened over http:// — from a file:// URL the browser refuses to read " +
        "the model beside it. Try <code>bun run wasm serve html</code>."
    );
  }
}

const dropzone = $("dropzone");
$("file").addEventListener("change", (event) => {
  const input = event.target;
  const file = input.files?.[0];
  if (file) readFile(file);
  // Clearing the value is what makes "fix it and choose it again" work. A file
  // input fires no `change` when the same filename is picked twice, so a reader
  // who edited the file the checker just refused and re-selected it would sit
  // looking at the stale findings with nothing having happened.
  input.value = "";
});
/* Listen on the whole card, highlight the panel inside it. The drop target a
   reader aims at is the card; the dashed panel is only what tells them so. */
const uploadCard = $("choice-upload");
for (const type of ["dragenter", "dragover"]) {
  uploadCard.addEventListener(type, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-over");
  });
}
for (const type of ["dragleave", "drop"]) {
  uploadCard.addEventListener(type, (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-over");
    if (type === "drop" && event.dataTransfer.files[0]) readFile(event.dataTransfer.files[0]);
  });
}

async function readFile(file) {
  state.origin = "upload";
  const text = await file.text();
  setModel(text, file.name);
  const guessed = file.name.replace(/\.(eml|cedm)\.ya?ml$|\.ya?ml$|\.md$|\.txt$/i, "").replace(/[-_]+/g, " ");
  if (guessed.trim()) $("app-name").value = titleCase(guessed.trim());
}

function setModel(source, label) {
  state.source = source;
  state.label = label;
  state.files = null;
  state.summary = null;
  state.review = null;

  $("download").disabled = true;
  $("download-stack").disabled = true;
  $("result").className = "result";
  $("result").innerHTML = "";
  $("diagnostics").hidden = true;

  const summary = $("model-summary");
  const preview = $("preview");

  if (!source) {
    summary.hidden = true;
    preview.hidden = true;
    $("build").hidden = true;
    setStep("step-generate", "idle");
    setStep("step-run", "idle");
    return;
  }

  build.reset();
  build.start("model", `Reading ${label}`);

  summary.hidden = false;
  summary.innerHTML =
    `<code>${escapeHtml(label)}</code> · ${source.split("\n").length.toLocaleString()} lines · ` +
    `${(new Blob([source]).size / 1024).toFixed(0)}KB`;

  preview.hidden = false;
  preview.open = false;
  $("preview-code").textContent = source;

  setStep("step-model", "done");
  build.done("model");

  window.awTrack?.("model_uploaded", {
    model_name: label,
    model_size: new Blob([source]).size,
    model_lines: source.split("\n").length,
    model_source: state.origin || "built_in",
  });

  // Checked here rather than at the point of generating, because this is the
  // moment the reader is looking at the model — and because a model with an
  // error is not going to become a working application by pressing Generate.
  build.start("check", "Checking the model against the EML language definition");
  window.awTrack?.("checker_started", { model_name: label });
  const checkedAt = performance.now();
  const review = checkModel(source);
  const checkedIn = Math.round(performance.now() - checkedAt);
  const verdict = {
    model_name: label,
    checker_error_count: review.counts.errors,
    checker_warning_count: review.counts.warnings,
    checker_info_count: review.counts.infos,
    fixes_applied: review.fixes.filter((fix) => fix.applied).length,
    check_time_ms: checkedIn,
  };
  if (!review.ok) {
    window.awTrack?.("checker_failed", {
      ...verdict,
      // The codes, not the messages: a message can carry the reader's own
      // entity names, and a code is what a report would group by anyway.
      codes: [...new Set(review.issues.filter((i) => i.severity === "error").map((i) => i.code))],
    });
    build.fail("check", `${review.counts.errors} error(s) — nothing was generated`);
    setStep("step-generate", "idle");
    setStep("step-run", "idle");
    return;
  }
  window.awTrack?.("checker_passed", verdict);
  build.done("check", describeReview(review));

  setStep("step-generate", "active");
  setStep("step-run", "idle");
}

/* -------------------------------------------------- checker + fixer feedback */

/**
 * Run the checker over the model and show what it found.
 *
 * This is the same engine as `appwithai validate`, and the same repairs —
 * bundled, not reimplemented. A model that passes says
 * nothing beyond a line in the build detail; a model that does not gets every
 * finding with its code, line and hint, because "generation failed" on its own
 * leaves the reader with a file and no idea which line of it is wrong.
 *
 * The repaired source replaces the loaded one when the fixer applied anything,
 * so what gets compiled is what the reader is being shown findings about.
 */
function checkModel(source) {
  let review;
  try {
    // `fix` repairs what is mechanically repairable, keeping the author's
    // comments, and then re-checks, so the findings shown are the ones that
    // survive the repair rather than the ones that arrived.
    const result = fix(source);
    const count = (severity) => result.diagnostics.filter((d) => d.severity === severity).length;
    review = {
      ok: result.ok,
      repaired: result.applied.length > 0,
      source: result.text,
      fixes: result.applied.map((applied) => ({ ...applied, applied: true })),
      counts: { errors: count("error"), warnings: count("warning"), infos: count("info") },
      issues: result.diagnostics,
    };
  } catch (error) {
    // A document the reader cannot read at all — not a finding, a refusal.
    review = {
      ok: false,
      repaired: false,
      source,
      fixes: [],
      counts: { errors: 1, warnings: 0, infos: 0 },
      issues: [
        {
          severity: "error",
          code: "YAML",
          message: `This file could not be read as a model: ${error.message}`,
          hint: "A model is a YAML document (*.eml.yaml) that opens with `eml: \"1.0\"`.",
        },
      ],
    };
  }

  state.review = review;
  if (review.repaired) {
    state.source = review.source;
    $("preview-code").textContent = review.source;
  }
  renderDiagnostics(review);
  return review;
}

function describeReview(review) {
  const { errors } = review.counts;
  return [`${errors} error${errors === 1 ? "" : "s"}`, ...describeRest(review)].join(" · ");
}

/**
 * The counts other than errors.
 *
 * Split out because the diagnostics header already states the error count in its
 * own sentence, and repeating it in the sub-line read as "refused this model —
 * 1 error · 1 error".
 */
function describeRest(review) {
  const { warnings, infos } = review.counts;
  const applied = review.fixes.filter((fix) => fix.applied).length;
  const parts = [];
  if (applied) parts.push(`${applied} auto-fix${applied === 1 ? "" : "es"} applied`);
  if (warnings) parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
  if (infos) parts.push(`${infos} info`);
  return parts;
}

const SEVERITY_LABEL = { error: "error", warning: "warning", info: "info" };

function renderDiagnostics(review) {
  const box = $("diagnostics");
  const applied = review.fixes.filter((fix) => fix.applied);
  // Infos are the generator announcing its own inferences — a foreign key it
  // will add anyway. Shown, but folded away, so the two lines that stop the
  // build are not buried under thirty that do not.
  const loud = review.issues.filter((issue) => issue.severity !== "info");
  const quiet = review.issues.filter((issue) => issue.severity === "info");

  if (!applied.length && !loud.length && !quiet.length) {
    box.hidden = true;
    return;
  }

  const issueRow = (issue) => `
    <li class="diag diag--${issue.severity}">
      <span class="diag__sev">${SEVERITY_LABEL[issue.severity]}</span>
      <span class="diag__code">${escapeHtml(issue.code)}</span>
      ${issue.line ? `<span class="diag__line">line ${issue.line}</span>` : ""}
      <span class="diag__msg">${escapeHtml(issue.message)}</span>
      ${issue.hint ? `<span class="diag__hint">${escapeHtml(issue.hint)}</span>` : ""}
    </li>`;

  box.hidden = false;
  box.dataset.state = review.ok ? "ok" : "failed";
  box.innerHTML = `
    <div class="diag__head">
      <b>${
        review.ok
          ? "The checker accepted this model"
          : `The checker refused this model — ${review.counts.errors} error${review.counts.errors === 1 ? "" : "s"}`
      }</b>
      <span>${escapeHtml(describeRest(review).join(" · "))}</span>
    </div>
    ${
      applied.length
        ? `<ul class="diags">${applied
            .map(
              (fix) => `<li class="diag diag--fixed">
                 <span class="diag__sev">fixed</span>
                 <span class="diag__code">${escapeHtml(fix.code)}</span>
                 <span class="diag__msg">${escapeHtml(fix.description)}</span>
               </li>`
            )
            .join("")}</ul>`
        : ""
    }
    ${loud.length ? `<ul class="diags">${loud.map(issueRow).join("")}</ul>` : ""}
    ${
      quiet.length
        ? `<details class="diag__more"><summary>${quiet.length} informational finding${quiet.length === 1 ? "" : "s"}</summary>
             <ul class="diags">${quiet.map(issueRow).join("")}</ul></details>`
        : ""
    }
    ${
      review.ok
        ? ""
        : `<p class="diag__foot"><b>Nothing was generated.</b> Fix the ${
            review.counts.errors === 1 ? "line above" : "lines above"
          } in your
             <code>.eml.yaml</code> file, save it, and choose it again — this page re-checks every
             time a model is loaded, so you can correct and re-submit until it passes. The
             command-line tool stops here too: <code>appwithai-wasm generate</code> refuses a
             model with errors unless you pass <code>--skip-check</code>.</p>`
    }`;
}

/* ------------------------------------------------------------------ step 2 */

$("generate").addEventListener("click", () => {
  if (!state.source) {
    fail("Choose a model first.");
    return;
  }

  if (state.review && !state.review.ok) {
    fail("This model has errors the checker refused. Fix them and load it again.");
    return;
  }

  const button = $("generate");
  button.disabled = true;
  button.innerHTML = '<span class="working"></span>Generating';
  build.start("compile", "Compiling the model into an application");

  window.awTrack?.("generate_started", {
    model_name: state.label,
    sample_records: sampleRecords(),
  });
  const generatingSince = performance.now();

  // A frame so the button's state paints before the compiler blocks the thread.
  // Generation is milliseconds on a small model and long enough to notice on a
  // large one, and a button that never showed it was pressed reads as broken.
  requestAnimationFrame(() => {
    try {
      const compiled = compileForBrowser(state.source);
      if (!compiled.ok) {
        const error = new Error("The model has errors.");
        error.review = checkModel(state.source);
        throw error;
      }
      const result = generateFromModel({
        model: compiled.model,
        modelText: state.source,
        name: $("app-name").value.trim() || "Generated App",
        adminEmail: $("admin-email").value.trim() || "admin@admin.com",
        adminPassword: $("admin-password").value || "admin",
        adminName: ($("admin-email").value.split("@")[0] || "admin").trim(),
        pgliteUrl: state.pgliteUrl,
        sampleRecords: sampleRecords(),
        /* The seed is the application's name, so two readers who leave the
           field alone see the same records and can talk about row four. */
        sampleSeed: $("app-name").value.trim() || "Generated App",
      });

      state.files = result.files;
      state.summary = result.summary;
      window.awTrack?.("generate_succeeded", {
        model_name: state.label,
        generation_time_ms: Math.round(performance.now() - generatingSince),
        file_count: result.summary.fileCount,
        bytes: result.summary.bytes,
        entity_count: result.summary.entities.length,
        sample_rows: result.summary.sampleRows ?? 0,
      });
      showResult(result);
      $("download").disabled = false;
      $("download-stack").disabled = false;
      setStep("step-generate", "done");
      setStep("step-run", "active");
      build.done(
        "compile",
        `${result.summary.fileCount} files · ${(result.summary.bytes / 1024).toFixed(0)}KB` +
          (result.summary.sampleRows ? ` · ${result.summary.sampleRows} sample rows` : "")
      );
    } catch (error) {
      // A ModelCheckError carries the findings; anything else is a compiler
      // failure, which is a different thing and should not be dressed as one.
      window.awTrack?.("generate_failed", {
        model_name: state.label,
        generation_time_ms: Math.round(performance.now() - generatingSince),
        reason: error.review ? "checker" : "compiler",
        checker_error_count: error.review?.counts.errors ?? 0,
        message: error.review ? undefined : String(error.message).slice(0, 200),
      });
      if (error.review) {
        state.review = error.review;
        renderDiagnostics(error.review);
        build.fail("check", `${error.review.counts.errors} error(s) — nothing was generated`);
        fail("The checker refused this model. The findings are with the model above.");
      } else {
        build.fail("compile", error.message);
        fail(escapeHtml(error.message));
      }
      setStep("step-run", "idle");
    } finally {
      button.disabled = false;
      button.textContent = "Generate";
    }
  });
});

/**
 * How many rows per entity the reader asked for.
 *
 * Ten by default, and the default is the point: an application whose lists are
 * all empty cannot be looked at, which is the one thing this page exists to let
 * someone do. `None` is offered because a reader who brought their own model may
 * want to see the schema rather than a demonstration — the generator's own
 * default is zero, so that choice costs nothing to honour.
 */
function sampleRecords() {
  const chosen = Number.parseInt($("sample-records").value, 10);
  return Number.isFinite(chosen) && chosen >= 0 ? chosen : 10;
}

function showResult(result) {
  const { summary, warnings } = result;
  const box = $("result");

  box.innerHTML = `
    <div class="tally">
      ${cell(summary.entities.length, "Entities")}
      ${cell(summary.relationships, "Relationships")}
      ${cell(summary.rules.length, "Rules")}
      ${cell(summary.workflows.length + summary.sagas.length, "Processes")}
      ${cell(summary.hooks, "Hooks")}
      ${cell(summary.accessRules, "Access rules")}
      ${cell(summary.fileCount, "Files")}
      ${cell(`${(summary.bytes / 1024).toFixed(0)}KB`, "Size")}
      ${cell(summary.sampleRows, "Sample rows")}
    </div>

    <h4>Entities</h4>
    <div class="chips">${summary.entities.map((name) => chip(name)).join("")}</div>

    ${summary.categories.length ? `<h4>Groups</h4><div class="chips">${summary.categories.map((name) => chip(name)).join("")}</div>` : ""}
    ${summary.rules.length ? `<h4>Rules</h4><div class="chips">${summary.rules.map((name) => chip(name, "rule")).join("")}</div>` : ""}
    ${
      summary.workflows.length || summary.sagas.length
        ? `<h4>Processes</h4><div class="chips">${[...summary.workflows, ...summary.sagas]
            .map((name) => chip(name, "flow"))
            .join("")}</div>`
        : ""
    }

    ${
      warnings.length
        ? `<div class="warnings"><b>${warnings.length} thing${warnings.length === 1 ? "" : "s"} the compiler skipped</b>
             <ul>${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul></div>`
        : ""
    }

    <details class="preview"><summary>All ${summary.fileCount} files</summary>
      <div class="filelist">
        ${Object.entries(state.files)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(
            ([name, contents]) =>
              `<div><span>${escapeHtml(name)}</span><span>${(contents.length / 1024).toFixed(1)}KB</span></div>`
          )
          .join("")}
      </div>
    </details>`;

  box.classList.add("is-shown");
}

const cell = (value, label) =>
  `<div class="tally__cell"><span class="tally__value">${value}</span><span class="tally__label">${label}</span></div>`;
const chip = (name, kind = "") =>
  `<span class="chip${kind ? ` chip--${kind}` : ""}">${escapeHtml(name)}</span>`;

function fail(html) {
  const box = $("result");
  box.innerHTML = `<div class="failure">${html}</div>`;
  box.classList.add("is-shown");
}

/**
 * Hand the reader the generated application.
 *
 * A zip would be nicer and would mean shipping a zip encoder to a page whose
 * whole point is that it has no dependencies. A single self-extracting shell
 * script is the honest trade: it is readable before it is run, which a zip is
 * not.
 */
$("download").addEventListener("click", () => {
  if (!state.files) return;
  window.awTrack?.("app_downloaded", {
    model_name: state.label,
    file_count: state.summary?.fileCount,
  });
  const name = ($("app-name").value.trim() || "generated-app")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const script = [
    "#!/bin/sh",
    `# Generated by APPWITHAI (browser stack). Writes the application into ./${name}`,
    "# Read it before you run it; every file below is plain text.",
    "set -e",
    `mkdir -p "${name}"`,
    `cd "${name}"`,
    "",
    ...Object.entries(state.files).flatMap(([path, contents]) => [
      `mkdir -p "$(dirname "${path}")"`,
      `cat > "${path}" <<'APPWITHAI_EOF'`,
      contents.replace(/\r/g, ""),
      "APPWITHAI_EOF",
      "",
    ]),
    `echo "Wrote ${Object.keys(state.files).length} files into ${name}/"`,
    `echo "Serve it over http (a Service Worker cannot start from file://):"`,
    `echo "  bunx serve ${name}"`,
    "",
  ].join("\n");

  const url = URL.createObjectURL(new Blob([script], { type: "text/x-shellscript" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.sh`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* --------------------------------------------- the deployable application */

/*
 * Chapter 09 runs the browser stack — a runtime that is the same bytes for
 * every model, reading a compiled `model.json`. That is what makes it boot in a
 * tab, and it is also the thing a reader cannot deploy or open in an editor:
 * there is no controller and no service per entity to read.
 *
 * The command-line generator writes the other one: the Loco.rs (Rust) backend
 * crate, the TanStack Start + Astryx front end and their test suites — the
 * application you would actually run. Here it is written in the tab by that same
 * pipeline (`appwithai-loco.js` is `generateApplication` over an in-memory
 * filesystem), so the archive is what `appwithai generate --skip-cli-scaffold`
 * writes for this model, file for file.
 *
 * Both halves are lazy on purpose. The generator is close to a megabyte and its
 * templates three and a half, and a reader who came to look at the browser
 * application should not pay for either.
 */
const LOCO_ASSETS_URL = new URL("../vendor/loco-assets.json", import.meta.url).href;

/** Loaded once per page, because both are large and neither changes. */
const stackCache = { module: null, assets: null };

$("download-stack").addEventListener("click", async () => {
  if (!state.source) return;
  window.awTrack?.("stack_download_started", { model_name: state.label });
  const assemblingSince = performance.now();

  const button = $("download-stack");
  const original = button.textContent;
  button.disabled = true;
  button.innerHTML = '<span class="working"></span>Assembling';

  const name =
    ($("app-name").value.trim() || "generated-app")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "generated-app";

  try {
    if (!stackCache.module) {
      button.innerHTML = '<span class="working"></span>Fetching the generator';
      stackCache.module = await import("./appwithai-loco.js");
    }
    if (!stackCache.assets) {
      button.innerHTML = '<span class="working"></span>Fetching the templates';
      const response = await fetch(LOCO_ASSETS_URL);
      if (!response.ok) throw new Error(`The templates did not download (HTTP ${response.status}).`);
      stackCache.assets = await response.json();
    }

    button.innerHTML = '<span class="working"></span>Writing the application source';
    const compiled = compileForBrowser(state.source);
    if (!compiled.ok || !compiled.document) throw new Error("The model has errors; check it in step 1.");
    const { files, executables } = await stackCache.module.generateLocoApplication({
      document: compiled.document,
      modelText: state.source,
      name,
      assets: stackCache.assets,
    });

    button.innerHTML = '<span class="working"></span>Packing the archive';
    /* Prefixed with the project name so unzipping into a downloads folder
       produces one directory rather than five hundred loose files. */
    const zip = await createZip(
      Object.fromEntries([...files].map(([path, body]) => [`${name}/${path}`, body])),
      { executable: new Set([...executables].map((path) => `${name}/${path}`)) }
    );

    const url = URL.createObjectURL(zip);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    window.awTrack?.("stack_downloaded", {
      model_name: state.label,
      file_count: files.size,
      bytes: zip.size,
      assemble_time_ms: Math.round(performance.now() - assemblingSince),
    });

    $("download-stack-hint").innerHTML =
      `<b>${files.size} files</b>, ${(zip.size / 1024 / 1024).toFixed(1)}MB — the Loco.rs API, the ` +
      `TanStack Start front end and their test suites. Unzip it, set <code>DB_PASSWORD</code>, ` +
      `<code>JWT_SECRET</code> and <code>ADMIN_PASSWORD</code>, and in <code>${escapeHtml(name)}/</code> run ` +
      `<code>docker compose build</code>, <code>docker compose run --rm backend db migrate</code>, ` +
      `<code>docker compose run --rm backend db seed</code> and <code>docker compose up</code>. ` +
      `Everything is served on one origin, <code>http://localhost:8080</code>: the application at ` +
      `<code>/</code> and its chat at <code>/chat/</code>, which opens the application's own screens ` +
      `inside the conversation. The chat also needs <code>DEEPSEEK_API_KEY</code> and ` +
      `<code>CHAT_AUTH_SECRET</code>; without them the application runs and the chat does not. ` +
      `<a href="run-real-stack.html">Chapter 10</a> has the steps, and how to run it without Docker.`;
    $("download-stack-hint").classList.add("hint--done");
  } catch (error) {
    /* A checker failure here would already have stopped step 2, so anything
       reaching this is the assembly itself — usually templates that did not
       download. Say which, rather than "failed". */
    window.awTrack?.("stack_download_failed", {
      model_name: state.label,
      message: String(error.message ?? "").slice(0, 200),
    });
    $("download-stack-hint").innerHTML =
      `<b>The deployable application could not be assembled.</b> ${escapeHtml(error.message)}`;
    $("download-stack-hint").classList.add("hint--bad");
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
});

/* ------------------------------------------------- storage, and asking first */

/*
 * Every run of the generated application keeps a real PostgreSQL in IndexedDB,
 * and nothing has ever cleared it. That is deliberate — the page promises a
 * reload picks up where you left off — but it compounds: each model, each run,
 * another ten megabytes, until the origin hits its quota and PGlite aborts
 * inside `callMain` with a message about WebAssembly that has nothing to do
 * with what went wrong.
 *
 * So the page now says what it is holding and asks before it clears it. Asked,
 * not assumed: a reader who came back for the data they entered last time
 * should not lose it because the page decided to tidy up.
 */

const PGLITE_DB = /^\/pglite\//;

/** What this origin is holding, or null when it cannot be known or is empty. */
async function surveyStorage() {
  try {
    if (typeof indexedDB.databases !== "function") return null;
    const names = (await indexedDB.databases())
      .map((entry) => entry.name)
      .filter((name) => typeof name === "string" && PGLITE_DB.test(name));
    if (!names.length) return null;

    let bytes = 0;
    try {
      bytes = (await navigator.storage.estimate()).usage || 0;
    } catch {
      // A number we cannot get is one we simply do not show.
    }
    return { names, bytes };
  } catch {
    return null;
  }
}

async function dropDatabases(names) {
  await Promise.all(
    names.map(
      (name) =>
        new Promise((resolve) => {
          const request = indexedDB.deleteDatabase(name);
          request.onsuccess = request.onerror = request.onblocked = () => resolve();
        })
    )
  );
}

/**
 * Ask whether to clear the databases earlier runs left behind.
 *
 * Returns only after the reader has answered. Declining is a first-class
 * answer and simply starts the application on top of what is already there,
 * which is what every run before this one did.
 */
async function askToReclaimStorage() {
  const held = await surveyStorage();
  if (!held) return;

  const dialog = $("storage-ask");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const megabytes = held.bytes ? (held.bytes / 1048576).toFixed(0) : null;
  const count = held.names.length;

  $("storage-ask-detail").textContent =
    `${count} database${count === 1 ? "" : "s"} from earlier runs ${count === 1 ? "is" : "are"} ` +
    `stored in this browser${megabytes ? `, using about ${megabytes} MB` : ""}. ` +
    "Clearing them frees the space and starts this application with empty tables. " +
    "Keeping them leaves any records you entered before exactly where they were.";

  const answer = await new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue), { once: true });
    dialog.showModal();
  });

  if (answer !== "clear") {
    window.awTrack?.("storage_kept", { databases: count, bytes: held.bytes });
    return;
  }

  await dropDatabases(held.names);
  window.awTrack?.("storage_cleared", { databases: count, bytes: held.bytes });
  say(
    `Cleared ${count} database${count === 1 ? "" : "s"}` +
      (megabytes ? `, freeing about ${megabytes} MB` : ""),
    "ok"
  );
}

/* ------------------------------------------------------------------ step 3 */

$("run").addEventListener("click", () => run(false));
$("reset").addEventListener("click", () => run(true));

/* When the current run began, so `app_ready` can say how long booting took. */
let runningSince = 0;

async function run(fresh) {
  if (!state.files) {
    fail("Generate the application first.");
    return;
  }

  const button = $("run");
  button.disabled = true;
  button.innerHTML = '<span class="working"></span>Starting';

  window.awTrack?.("run_started", { model_name: state.label, fresh: Boolean(fresh) });
  runningSince = performance.now();

  const log = $("log");
  log.hidden = false;
  log.innerHTML = "";
  // Before anything is mounted, because this is the last moment the answer is
  // cheap: once PGlite has opened a data directory, clearing it out from under
  // the running application is not a thing the reader can be offered.
  await askToReclaimStorage();

  build.start("mount", "Handing the files to the Service Worker");

  try {
    say("Registering the HTTP layer");
    const registration = await ensureServiceWorker();
    say("Service Worker active", "ok");

    /*
     * The application's first candidate for PGlite is `vendor/pglite/index.js`
     * beside itself, which the CLI writes there with `--vendor-pglite` and a
     * browser build cannot: eighteen megabytes will not travel through a
     * postMessage. Serving a re-export at that path costs one line and spares
     * every run a 404 on a file that is, in substance, present.
     *
     * Added to what is mounted rather than to `state.files`, so the file count
     * and the download stay the generator's output rather than ours.
     */
    const files = state.pgliteUrl
      ? { ...state.files, "vendor/pglite/index.js": `export * from ${JSON.stringify(state.pgliteUrl)};\n` }
      : state.files;

    say(`Mounting ${Object.keys(state.files).length} files at ${BASE}`);
    const mounted = await ask(registration.active, {
      type: "mount",
      basePath: BASE,
      files,
    });
    if (!mounted.ok) throw new Error(mounted.error || "the Service Worker refused the files");
    say(`Mounted ${mounted.files} files`, "ok");
    build.done("mount", `${mounted.files} files served from ${BASE}`);
    build.start("boot", "Starting the application");

    say(
      "Starting the application — Postgres is about ten megabytes of WebAssembly, so give it a moment"
    );

    const frame = $("frame");
    /*
     * `?theme=dark` on the frame's URL, and the reason is the reason
     * `viewers/index.html` carries `data-awv-theme="dark"`.
     *
     * This site serves one theme to everybody: `dark-theme.css` is loaded last on
     * every page and the stage around this frame is near-black. The generated
     * application defaults to following the reader's machine, so on a light
     * machine a light application rendered inside a dark page — the only part of
     * the chapter that did not match it.
     *
     * A parent page cannot reach into the frame to set a theme, so the generated
     * application reads `?theme=` as its *default*: a reader who picks a theme in
     * the application's own control keeps it, and this only decides what they meet
     * first. Upstream honours it in the pre-paint script, so there is no flash.
     */
    // `ephemeral=` rather than a bare `?ephemeral`: `boot.js` reads it with
    // `URLSearchParams.has`, which is true for either spelling.
    const query = fresh ? "?theme=dark&ephemeral=" : "?theme=dark";
    const url = `${BASE}index.html${query}`;
    frame.src = "about:blank";
    // A frame so the blank navigation commits first; assigning twice in one
    // task leaves the iframe on the old document with the new URL in its bar.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    frame.src = url;

    $("stage").classList.add("is-shown");
    $("stage-url").textContent = new URL(url, window.location.href).href;
    $("reset").hidden = false;

    $("credentials").hidden = false;
    $("credentials").innerHTML =
      `Sign in as <b>${escapeHtml($("admin-email").value.trim() || "admin@admin.com")}</b> ` +
      `with the password <b>${escapeHtml($("admin-password").value || "admin")}</b>. ` +
      (fresh
        ? "This run uses a fresh in-memory database."
        : "The database persists in this browser, so a reload picks up where you left off.") +
      (state.summary?.sampleRows
        ? ` It opens with ${state.summary.sampleRows} sample records already in it.`
        : "");

    setStep("step-run", "done");
    $("stage").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    build.fail("mount", error.message);
    say(error.message, "bad");
    /*
     * The hint has to earn its place, the same way boot.js's does. This used to
     * print the file:// advice after every failure — on a page plainly served
     * over https, which sends the reader to a problem they do not have and away
     * from the one they do. A Service Worker that will not register on http(s)
     * is nearly always the browser refusing it, not the protocol.
     */
    say(
      window.location.protocol === "file:"
        ? "This page needs to be served over http:// or https:// — a Service Worker cannot be " +
            "registered from a file:// URL."
        : "The browser refused to register the Service Worker that serves this application. A " +
            "private window, a storage-blocking setting or an enterprise policy will all do it; " +
            "reloading the page clears a worker left in a bad state.",
      "bad"
    );
  } finally {
    button.disabled = false;
    button.textContent = "Run the application";
  }
}

/* -------------------------------------------------------------- boot phases */

/**
 * The sub-steps the application announces while it starts.
 *
 * Booting is sixty per cent of the bar, and the marks below are where its
 * sub-steps fall. The application already narrates them on its own boot screen;
 * `boot.js` posts the same lines to whoever embedded it, so this bar can move
 * through the wait instead of sitting still until the frame paints.
 *
 * The fractions come from measuring, and they were badly wrong. Opening
 * Postgres and running the DDL took 6 of the 251 seconds a thirty-entity model
 * spent booting, and seeding took the other 245 — yet the marks gave the first
 * two 70% of the bar and seeding a tenth. That ratio is structural rather than
 * a property of the machine: opening PGlite and running DDL is a fixed cost,
 * while seeding inserts a row at a time and grows with the model. So seeding
 * now owns most of the bar.
 *
 * Matching on the status text is a soft coupling, and deliberately so: an
 * unrecognised status still shows in the detail line and simply does not advance
 * the bar. The alternative — a numbered protocol between the page and the
 * runtime — buys nothing that a stalled bar does not already communicate.
 */
const BOOT_MARKS = [
  [/http layer|service worker/i, 0.05],
  [/backend worker|node-api/i, 0.1],
  [/request pipe/i, 0.15],
  [/postgres/i, 0.25],
  [/migrat|schema/i, 0.45],
  [/seed/i, 0.6],
  [/interface/i, 0.98],
];

/**
 * Seeding, reported as a fraction rather than as a single mark.
 *
 * The marks above are milestones, and one of them was hiding almost the whole
 * wait: `seed` put the bar at 85% and nothing moved it again until the frame
 * was ready. Measured on the thirty-entity hospital model, that was 246 of the
 * 253 seconds the boot took — a bar sitting still for 97% of the wait, which is
 * what the phase weighting exists to prevent. It is not a slow-machine problem;
 * a faster machine shortens the same frozen stretch.
 *
 * `migrate.js` in the runtime now counts the rows it seeds and says so. This
 * reads that count and spreads it across the band between the `seed` mark and
 * the one after it, so the bar moves for the part of the boot that actually
 * takes the time. A runtime that does not report a count still matches
 * `/seed/i` above and behaves exactly as before.
 */
const SEED_COUNT = /seeding\s*[—-]\s*(\d+)\s+of\s+(\d+)/i;
const SEED_BAND = [0.6, 0.97];

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message?.source !== "appwithai-boot") return;

  if (message.type === "status" || message.type === "log") {
    const text = message.status ?? message.message ?? "";
    if (message.type === "log") say(`  ${text}`);
    else say(text);
    const counted = SEED_COUNT.exec(text);
    if (counted) {
      const done = Number(counted[1]);
      const total = Number(counted[2]);
      if (total > 0) {
        const [from, to] = SEED_BAND;
        build.advance(from + (to - from) * Math.min(1, done / total), text);
        return;
      }
    }

    for (const [pattern, fraction] of BOOT_MARKS) {
      if (pattern.test(text)) build.advance(fraction, text);
    }
    return;
  }

  if (message.type === "running") {
    window.awTrack?.("app_ready", {
      model_name: state.label,
      run_time_ms: runningSince ? Math.round(performance.now() - runningSince) : undefined,
      sample_rows: state.summary?.sampleRows ?? 0,
    });
    build.done("boot", "The server is answering requests");
    build.start("ready");
    build.done("ready", `${message.project?.name ?? "The application"} is running`);
    say("The application is running", "ok");
    return;
  }

  if (message.type === "failed") {
    window.awTrack?.("run_failed", {
      model_name: state.label,
      run_time_ms: runningSince ? Math.round(performance.now() - runningSince) : undefined,
      message: String(message.message ?? "").slice(0, 200),
    });
    build.fail("boot", message.message);
    say(message.message, "bad");
  }
});

/**
 * Register the worker and wait for it to be genuinely active.
 *
 * `navigator.serviceWorker.ready` is the usual way and is wrong here: it
 * resolves with the registration controlling *this* page, and this page sits
 * outside the worker's scope on purpose — the worker serves the generated
 * application, not the guide around it. So the activation is watched directly.
 */
async function ensureServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "This browser has no Service Worker support, which is what serves the application."
    );
  }

  const registration =
    state.registration || (await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE }));
  state.registration = registration;

  if (registration.active) return registration;

  const pending = registration.installing || registration.waiting;
  if (!pending) throw new Error("The Service Worker registered but never started");

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("The Service Worker did not activate")), 15000);
    pending.addEventListener("statechange", () => {
      if (pending.state === "activated") {
        clearTimeout(timer);
        resolve();
      }
      if (pending.state === "redundant") {
        clearTimeout(timer);
        reject(new Error("The Service Worker was discarded before it activated"));
      }
    });
  });

  return registration;
}

/** postMessage with an answer, over a one-shot channel. */
function ask(worker, message, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(
      () => reject(new Error("The Service Worker did not answer")),
      timeoutMs
    );
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      resolve(event.data);
    };
    worker.postMessage(message, [channel.port2]);
  });
}

$("open-tab").addEventListener("click", () => {
  window.open($("stage-url").textContent, "_blank", "noopener");
});

/* -------------------------------------------------------------------- bits */

function setStep(id, value) {
  $(id).dataset.state = value;
}

function say(message, tone = "") {
  const log = $("log");
  const line = document.createElement("div");
  line.className = tone;
  line.innerHTML = tone === "ok" ? `<b>${escapeHtml(message)}</b>` : escapeHtml(message);
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]
  );
}

const titleCase = (value) => value.replace(/\b\w/g, (character) => character.toUpperCase());

/**
 * Find the PostgreSQL build this site ships.
 *
 * The generated application looks for PGlite in three places, in order: beside
 * itself, at whatever URL it was generated with, and finally jsDelivr. This site
 * vendors its own copy under `assets/vendor/pglite/`, so the first two are made
 * to hit that and the CDN is never reached — the chapter works on a network that
 * blocks third-party hosts, and it keeps working if jsDelivr does not.
 *
 * Probed rather than assumed: if the copy is ever missing the page still runs,
 * it just falls back the way upstream does.
 */
async function findVendoredPglite() {
  try {
    const url = new URL("../assets/vendor/pglite/index.js", window.location.href).href;
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) state.pgliteUrl = url;
  } catch {
    // Left unset: the generated application falls back to the CDN on its own.
  }
}

await findVendoredPglite();

/*
 * `#upload` opens this page ready for a file.
 *
 * The home page sends a reader here after they have had a model written for
 * them elsewhere, and telling someone to "upload your file" and then landing
 * them on a page showing the CRM example is a small broken promise. The hash
 * selects the upload choice and scrolls the dropzone into view instead.
 *
 * Every other key of BUILT_IN works the same way — `#investment`, `#hospital` —
 * so `try-it-yourself.html` can send a reader straight to the example that
 * looks like their business rather than to the CRM and a list to scroll.
 * An unknown hash falls back to the CRM rather than to an empty page.
 */
const requested = window.location.hash.replace(/^#/, "");
const wantsUpload = requested === "upload";
const choice = wantsUpload || requested in BUILT_IN ? requested : "crm";
await selectChoice(choice);
if (wantsUpload) {
  $("dropzone").scrollIntoView({ block: "center", behavior: "smooth" });
} else if (choice !== "crm") {
  $("step-model").scrollIntoView({ block: "start", behavior: "smooth" });
}
