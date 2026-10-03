# Documentation websites

One [Docusaurus](https://docusaurus.io) site per generated application, plus one shared manual.

| Folder | What it is |
| --- | --- |
| `website/<application>/` | The manual of one application: its home page and domain, every entity with its screens, forms and fields, the lifecycles, business rules, processes, access and reports. Generated from the application's model and its screenshots. |
| `website/application-dictionary/` | The Application Dictionary help and manual, common to every application: concepts, every administrator window, and how-to recipes. Written by hand, with screenshots from the `common` application. |
| `website/llmtext/` | The language text bundle for language models. |

## Build one

```bash
cd website/sales
bun install
bun run start      # http://localhost:3000/sales/
bun run build      # writes build/
```

Each site pins `webpack` to 5.99.9: Docusaurus 3.9 rejects the ProgressPlugin options of newer webpack releases and fails before compiling.

## Regenerate

The pages are written from the model, so do not edit `website/<application>/docs/` by hand; change the generator (`packages/generator/src/website/`) or the model and rebuild:

```bash
bun scripts/build-website.ts sales          # rewrites docs/ from the model; keeps static/
```

Screenshots are taken from the running application with gstack's headless browser:

```bash
bash scripts/website/build-all.sh sales      # start it, capture, write the site, stop it
FORCE=1 bash scripts/website/build-all.sh sales
bash scripts/serve-application.sh common && bun scripts/website/capture-dictionary.ts   # the shared manual's screens
```

A page links a screenshot only if the file exists, so a capture that failed leaves a page without its picture rather than a broken site.
