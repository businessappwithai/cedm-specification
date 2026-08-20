# CLAUDE.md

Guidance for Claude Code and other AI assistants working in this repository.

## Repository status: empty scaffold

**As of the latest commit, this repository contains no code, specification text,
build tooling, tests, or CI configuration.** The full contents are:

```
README.md    # 2 lines: the repo name, twice
CLAUDE.md    # this file
```

History is a single commit (`f49a8d1`, "Initial commit"). There are no open or
closed pull requests and no issues.

This matters more than it might seem. Everything below is either a verified fact
about the repo as it stands or an explicitly marked gap. There are no
established conventions here yet, because there is nothing to have established
them.

## Instructions for AI assistants

1. **Do not infer conventions that do not exist.** Do not assume a language,
   framework, directory layout, test runner, or spec format. Nothing in this
   repository implies any of them yet.
2. **Verify before asserting.** Before describing repository structure to the
   user, list the files. This document may lag behind the actual state; the
   working tree is the source of truth.
3. **Ask when the answer would change the work.** The intended scope of this
   specification is not recorded anywhere in-repo (see "Open questions"). If a
   task depends on it, ask rather than guessing.
4. **Keep this file current.** When real structure lands — a directory layout, a
   build command, a spec document format — replace the corresponding "not yet
   established" section with the actual facts. A stale CLAUDE.md is worse than a
   short one.

## Verified facts

| | |
|---|---|
| Remote | `https://github.com/businessappwithai/cedm-specification` |
| Default branch | `main` |
| Commits | 1 |
| Tracked files | `README.md` |
| CI / workflows | none (no `.github/`) |
| Package manifest | none |
| License file | none |

## Open questions

These are unanswered by anything in the repository. They should be resolved and
recorded here (or in the README) before substantial work begins.

- **What does "CEDM" stand for, and what does the specification cover?** The
  acronym is not expanded anywhere in-repo. Do not guess at an expansion — it
  will end up quoted back as fact.
- **What form should the specification take?** Markdown documents, a schema
  language (JSON Schema, OpenAPI, Protobuf, XSD), a formal grammar, or prose
  plus reference implementation — all imply different tooling and review flows.
- **Is there a reference implementation, or is this documents only?** Determines
  whether build, test, and lint tooling is needed at all.
- **Versioning and stability policy.** Specifications need a stated approach to
  versioning and breaking changes; none is defined.

## Development workflow

Not yet established. There is no build system, dependency manifest, test suite,
linter, or formatter configuration, so there are no commands to document. Add
them here as they are introduced, with the exact invocation.

Git practice observed so far is limited to the default branch `main`. Feature
branches from Claude Code sessions in this repo have used a `claude/<slug>`
naming pattern; that is a harness convention, not necessarily a project one.

## Repository structure

Not yet established. Populate this section once directories exist, describing
what belongs in each one and why — not just a file listing, which `ls` already
provides.

## Conventions

Not yet established. Document terminology, document naming, heading structure,
normative language (e.g. RFC 2119 keywords such as MUST/SHOULD/MAY), and
citation style here once the specification's form is decided.
