# Vendored Mermaid readers

The repository reads models as YAML only. These two files are the exception,
and they exist for one command: `bun run convert:stored-models`, which converts
what an installation stored before YAML (see `../index.ts`).

They are the readers as they were at commit **18f5792** ("Check the model
document itself, not its Mermaid view"), the last commit that read Mermaid,
bundled with `build.ts` so that nothing is resolved at run time:

| File | What it is | SHA-256 |
|---|---|---|
| `eml.js` | `emlToModelDocument`: a Mermaid (EML) model → the model document of that time, with the issues and uncarried lines it reported | `be59701e8691580e8f6b156c47e2dc44f7a20aa1a44c44332aaeaca0f90b6a57` |
| `automation.js` | `parseAutomation` / `serializeAutomation`: the automations screen's Mermaid dialect | `6d09b9a3b174b39971d1eacd81004453426707ad556a30b1d7a5fc78c157c56c` |

`eml.js` carries the language definition of 18f5792 inline. The loaders of that
time found `language/appwithai-language.json` by walking up from the module,
and one of them quietly fell back to a built-in vocabulary when it found
nothing — a `text` column then came out a plain string. `build.ts` patches that
loader to read the embedded copy and fails if the patch does not apply.

Nothing else in the repository may import these files. Do not edit them: a
change is made in the old source and rebuilt, or not at all.

## Rebuilding and verifying

```bash
git worktree add /tmp/appwithai-18f5792 18f5792
(cd /tmp/appwithai-18f5792 && bun install --frozen-lockfile)
bun packages/web/src/lib/server/stored-models/legacy/build.ts /tmp/appwithai-18f5792 --check
```

`--check` rebuilds in memory and fails if either file differs; without it the
files are rewritten. The build runs from inside the worktree, so its output is
the same wherever it is started. `../__tests__/convert.test.ts` holds the files
to the digests above, and reads the corpus through them.
