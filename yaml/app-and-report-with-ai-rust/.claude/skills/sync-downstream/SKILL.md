---
name: sync-downstream
description: Carry a new commit of businessappwithai/app-with-ai-tanstack into the two published sites that live under yaml/ in cedm-specification — the orchestrator's guide (yaml/app-and-report-with-ai-rust/common) and the website (yaml/businessappwithairust). Use when the upstream in-browser generator (appwithai-wasm.js), its runtime or its templates change, or when a language change has landed at the root and the sites' bundles, models or protocol documents need to follow. Triggers: "update the other repos", "sync the downstream repos", "app-with-ai-tanstack has changed", "re-vendor the browser generator".
---

# Syncing the published sites

The orchestrator and the website are directories of `cedm-specification` now,
under `yaml/`. Nothing is pinned and nothing is checked out: the language, the
generator and both products are in the one tree. What still arrives from
outside is small, and this is the order that works.

Paths are from the root of `cedm-specification`. `$A` is a checkout of
`app-with-ai-tanstack`; `$O` is `yaml/app-and-report-with-ai-rust`; `$W` is
`yaml/businessappwithairust`.

---

## 0. Decide which of the two kinds of change it is

- **A language change** — the schema, the definition, the checker, the model
  reader, a construct. That is not carried here. It lands at the root first,
  through the root's own ledger (`docs/SYNC-HISTORY.md`), and reaches the
  sites by rebuilding their bundles (§2). Never edit a bundle, a model or a
  protocol document under `yaml/` to "carry" a language change the root does
  not have.
- **A browser-generator change** — `html/assets/appwithai-wasm.js` upstream,
  or the runtime it writes. That is the one file still vendored (§1).

```bash
cd $A && git log --oneline <last-carried>..HEAD -- html/assets/appwithai-wasm.js packages/generator/templates/wasm
```

---

## 1. Re-vendor the browser generator, then patch it

Both sites carry the same bundle:

```bash
cp $A/html/assets/appwithai-wasm.js $W/assets/js/appwithai-wasm.js
cp $A/html/assets/appwithai-wasm.js $O/common/html/assets/appwithai-wasm.js
bun scripts/patch-vendored-generators.ts
bun scripts/patch-vendored-generators.ts --check
```

The upstream bundle compiles a Mermaid model itself. The patch adds
`generateFromModel`, which takes the model `appwithai-model.js` compiled from
YAML, removes the Mermaid entry points from the export list, and makes the
generated application ship `model/model.eml.yaml`. It refuses to run when a
patch point has moved — read the error, find the new shape upstream, and update
`REPLACEMENTS` in the script rather than hand-editing the bundle.

## 2. Rebuild everything built from the root

```bash
bun scripts/build-site-bundles.ts
bun scripts/build-site-bundles.ts --check
```

That writes, for each site, `model-yaml.js` (the published validator),
`appwithai-model.js` (what the in-browser generator is fed) and
`viewers/appwithai-model.js` (what the model viewers read). All three are
built from `language/browser/`; none is copied from upstream.

## 3. Prove the sites still agree with the language

```bash
cd $O/common && bun run check          # models, types, lint, bundles, stacks, CLIs, pack
cd $W && node scripts/check-spec.mjs && node scripts/website-e2e.mjs
```

and generate a published model in each browser page (`$O/common/html/run-in-browser.html`,
`$W/guide/run-in-browser.html`) — a bundle that loads is not a bundle that
generates.

## 4. The protocol documents

The orchestrator's four protocol documents are the root's YAML-first editions
(`website/llmtext/`) with the orchestrator's own material spliced in —
§1a (the orchestrator), §4.1.2 (the `enterprise-reporting` target) and two
answering rules at the end of §11 — identically in each base and its derived
enhancement edition, so each pair stays derived. When the root's editions
change, rebuild the orchestrator's from them the same way, and confirm that
each base and its enhancement edition received identical additions.

`llms-reporting.txt` is the orchestrator's own and has no root counterpart.

## 5. Commit

One commit per concern: the re-vendored bundle with its patch, the rebuilt
bundles, the documents. Say which upstream commit the generator bundle came
from — it is the only upstream ref this repository records, and the commit
message is where it lives.
