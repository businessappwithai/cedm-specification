# Documentation websites — one Docusaurus site per application

**Scope.** `website/<domain>/` for all 47 generated applications, plus the shared
`website/application-dictionary/` manual. Pages are written by
`packages/generator/src/website` from each application's model; screenshots come
from the running application through gstack's `$B` browser
(`bash scripts/website/build-all.sh`).

## Result

- 48 of 48 application sites captured (`static/.captured`): 103–259 screenshots
  each, 4 skipped in total across the run (quality 1, sales 1, sustainability 2;
  a screenshot that fails is simply not linked). A page links a screenshot only if the file exists.
- Docusaurus builds verified: `sales` (a typical app), `procurement` (the
  largest, 259 shots) and `application-dictionary`. All succeed.
- Each site: home (application and domain), getting started, one page per
  business entity (list, new, record, every field by its label, relationships,
  lifecycle, rules, access), reference-data pages, and an Administration section
  (lifecycles, processes, business rules per entity, roles and access, reports,
  the dictionary), linking the shared manual.

## Defects found by documenting from a running application

Fixed in templates, all 47 applications regenerated:

- Table/Window/Tab child lists passed `tableId`/`windowId`/`tabId`, which
  `/api/sys` ignores, so a table's Columns tab listed every column. An unknown
  filter key is skipped on purpose, so a misspelt filter fails open.
- The Audit Log named entities by table (`bus_*`); now by window label.
- A banner mentioned CRM and `sys_*` names.

## Process findings

- The capture loop only advances while the session is active: the container was
  suspended whenever the session sat idle, and every wake-up showed uptime 0.
  Holding a foreground wait loop kept it up.
- A wedged browser daemon ("Daemon busy") is recovered by `capture.ts`.

## Gaps left open

- Role and user administration screens are read-only; documented as such.
- Several dictionary settings are stored but not applied to screens
  (`application-dictionary/docs/what-is-applied.md` lists them).
- Many CEDM library descriptions are stubs, so some entity pages are thin on
  business explanation until the library is enriched.
