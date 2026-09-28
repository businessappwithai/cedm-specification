# @appwithai/yamltecture

Architecture graphs, queries and model context for AppWithAI, in TypeScript.
It began as a port of [YAMLtecture](https://github.com/UnitVectorY-Labs/YAMLtecture)'s
graph concepts and extends them with what the modelling tool needs to give its
assistant an exact, bounded view of a model.

It generates nothing and changes nothing. A model is a YAML document
(`*.eml.yaml`, see `language/yaml/README.md`); this package reads that document
and answers questions about it.

## What it provides

| Module | |
|---|---|
| `core/model.ts` | nodes, links and parent hierarchy; deterministic link ids and ordering |
| `core/validate.ts`, `schema/zod.ts` | graph validation — dangling links, parent cycles |
| `core/merge.ts` | merging graphs |
| `query/` | YAMLtecture's query operators (`equals`, `ancestorOf`, `descendantOf`, …) |
| `yaml.ts` | graphs to and from YAML |
| `git/history.ts` | reading earlier projections through a host-supplied Git port |
| `model/context.ts` | a model document as a graph, its canonical projection, and the context for a question |

## Model context

```ts
import { readModelDocument, projectModel, selectModelContext } from "@appwithai/yamltecture";

const document = readModelDocument(text);          // YAML + schema, or ModelProjectionError
const projection = projectModel(document);          // canonical text
const context = selectModelContext(document, "which rules fire on Experiment?");
context.yaml;          // a smaller model document: Experiment, its neighbours, and
                       // every hook, rule, state machine, saga, report and access
                       // rule that concerns them — each item whole
context.entityNames;   // what was included
context.truncated;     // whether anything was left out to stay under budget
```

**The projection is the canonical document.** A model is already YAML, so the
assistant reads the model itself, not a second format derived from it. Canonical
form still earns its place: two saves that differ only in comments, key order or
layout give the same bytes, so the project history can tell an edit to the model
from an edit to how it is written. The web tool stores it as
`.appwithai/model.ai.yaml` beside `model/model.eml.yaml`, the author's text.

**Narrowing never edits.** An entity the question names is selected with every
entity one relationship away. Over the character budget, whole declarations are
dropped — behaviour furthest from the entity shapes first, then entities from
the end of the order — never a cut in the middle of an item.

## Commands

```bash
bun --filter @appwithai/yamltecture test
bun --filter @appwithai/yamltecture typecheck
bun packages/yamltecture/scripts/project-model.ts examples/drug-discovery.eml.yaml
bun packages/yamltecture/scripts/model-context.ts examples/drug-discovery.eml.yaml "Compound"
```

Git helpers take a host-supplied port; they cannot initialise or commit a
repository themselves. The web application's project repository service supplies
access checks, locking, recovery and commits.
