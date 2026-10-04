# CLAUDE.md — AI Assistant Guide for businessappwithai.github.io

## Project Overview

This is the **AppWithAI** marketing website — a static site for an AI-powered business application
generator. A business is described as **one YAML model file** (`*.eml.yaml`); the generator compiles it
into a **Loco.rs (Rust) backend crate** and a **TanStack Start + Astryx front end**. The site is deployed
via GitHub Pages with no build step required.

It lives inside `cedm-specification`, beside the platform it describes (`app-with-ai-rust`), the
reporting platform (`enterprise-reporting-rust`) and the orchestrator (`app-and-report-with-ai-rust`).
Every JavaScript bundle the site serves is **built** from `app-with-ai-rust` by
`scripts/sites/build-site-bundles.ts` there — never edited here. See **Where the bundles come from**.

## Repository Structure

```
businessappwithairust/
├── .github/workflows/
│   ├── tests.yml             # The checks — see CI/CD Pipeline
│   └── static.yml            # Deploy to GitHub Pages on push to main
├── assets/
│   ├── css/
│   │   ├── assistant.css     # Scoped styles for assistant.html (`.aia-` prefix)
│   │   ├── style.css         # Main stylesheet (Lunaris Design System)
│   │   ├── guide.css         # Documentation layer for the "Build a CRM" guide
│   │   ├── guide-demo.css    # Scoped styles for the interactive chapters
│   │   └── dark-theme.css    # Dark Precision — loaded last on every page
│   ├── js/
│   │   ├── main.js               # Scroll animations, nav, forms, [data-url], [data-copy]
│   │   ├── analytics.js          # PostHog: the funnel, the opt-outs, window.awTrack
│   │   ├── guide.js              # Guide chapter nav and screenshot lightbox
│   │   ├── run-in-browser.js     # Controller for chapter 09
│   │   ├── validator.js          # Controller for chapter 11
│   │   ├── assistant.js          # Controller for assistant.html — the ONLY file here
│   │   │                         #   that sends a reader's model off this origin
│   │   ├── zip.js                # Dependency-free ZIP writer (the deployable download)
│   │   ├── appwithai-model.js    # BUILT: read, validate and compile a model for the browser
│   │   ├── appwithai-wasm.js     # VENDORED + PATCHED: the in-tab application generator
│   │   └── appwithai-loco.js     # BUILT: the platform's Loco pipeline over an in-memory fs
│   └── vendor/
│       ├── loco-assets.json      # BUILT: templates, language definition, CEDM spec for appwithai-loco.js
│       ├── posthog/              # posthog-js, the no-external build
│       └── pglite/               # PostgreSQL compiled to WebAssembly (~18MB)
├── guide/                    # "Build a CRM" guide (chapters 00–11); every <figure>
│                             # puts its <figcaption> *before* the <img>
│   ├── index.html            # 00 · Overview
│   ├── 01-…08-reference.html # Chapters 01–08
│   ├── run-in-browser.html   # 09 · Run it in your browser
│   ├── run-real-stack.html   # 10 · Run the real stack (on your machine)
│   ├── 11-check-a-model.html # 11 · Check a model
│   ├── model-yaml.js         # BUILT: the published validator and fixer (ES module)
│   ├── check-model.mjs       # Authored here: the three-pass validation runner
│   ├── audit-model.mjs       # Authored here: the 22-point checklist audit
│   ├── check-model-standalone.mjs # Generated: all three of the above in one file
│   ├── source/               # Generated: the same three carried INSIDE pages, base64 + sha256
│   ├── img/                  # Screenshots used by the chapters
│   ├── models/               # The six published models (*.eml.yaml)
│   └── wasm-app/sw.js        # Service Worker that hosts the in-tab application
├── viewers/                  # The model viewer — appwithai.org/viewers
│   ├── index.html            # Authored here: the page, in the site's chrome
│   ├── appwithai-model.js    # BUILT: the generator's own reader (inspectModel, formatReport)
│   ├── canvas.js · layout.js · erd-viewer.js · workflow-viewer.js
│   ├── rules-viewer.js · decision-table.js · model-viewer.js
│   └── viewers.css           # Scoped to `.awv-root`; light and dark palettes
├── llms-full.txt             # The YAML model language, for language models — authored here
├── llmdetailed.txt           # The whole system and §10's interactive protocol — a copy
├── llmtextenhancement.txt    # llms-full.txt with §1 replaced: enhance an existing model. DERIVED
├── llmdetailedenhancement.txt# llmdetailed.txt with §10 replaced, with approval gates. DERIVED
├── scripts/
│   ├── check-spec.mjs        # Every claim the four protocol documents make, re-tested
│   ├── website-e2e.mjs       # Every figure a page states, against the model and the generator
│   ├── check-model.mjs       # A forwarder to guide/audit-model.mjs
│   ├── build-standalone-checker.mjs     # Builds guide/check-model-standalone.mjs (`--check`)
│   ├── build-validator-source-page.mjs  # Builds guide/source/ (`--check`)
│   ├── check-validator-source-pages.mjs # Decodes guide/source/ back and runs the result
│   ├── build-llmtext-enhancement.mjs    # Derives the two enhancement editions (`--check`)
│   └── llmtext/              # The sources it composes — the ONLY hand-edited part
├── favicon.svg · favicon.ico # The `.logo-mark`, restated as an icon
├── index.html · justification.html · try-it-yourself.html · features.html
├── how-it-works.html · technology.html · pricing.html · contact.html
├── privacy.html · todo.html · assistant.html
└── CLAUDE.md                 # This file
```

## Technology Stack

**Pure static site — no build tools, no package manager, no framework.**

- HTML5 (semantic markup)
- CSS3 with custom properties (CSS variables)
- Vanilla JavaScript (ES6+)
- GitHub Actions for CI/CD deployment to GitHub Pages

No package manager, bundler or framework, and no `package.json`. The checks are dependency-free Node scripts, and the JavaScript bundles the pages import are built in `app-with-ai-rust` and committed here.

## Development Workflow

### Local Development

Open any `.html` file directly in a browser. No server required for basic viewing.

For a local dev server (avoids CORS issues with relative links):
```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

### Deployment

Deployment is fully automatic:
- Push to `main` branch → GitHub Actions runs → site deploys to GitHub Pages
- No manual steps required
- The workflow uploads the entire repository as the static artifact

### Branching

- `main` — production branch, triggers auto-deployment
- `master` — legacy branch (do not use)
- Feature branches follow the `claude/...` naming convention for AI-assisted work

## Pages and Their Purpose

| File | Purpose |
|------|---------|
| `index.html` | Landing page: hero (with the **experimental-software notice** and the GitHub source link), stats, problem/solution, feature previews, the **Try It Yourself** section, the live in-browser demo, and the CRM guide preview |
| `features.html` | Detailed feature breakdown (AI modeling, forms, workflows, security, analytics) |
| `how-it-works.html` | Step-by-step AI pipeline with multi-agent architecture diagram |
| `technology.html` | The generated stack: the TanStack Start + Astryx front end, the Loco.rs backend, the AI and generation engine, the Application Dictionary |
| `pricing.html` | Pricing tiers, cost comparison vs. traditional development, ROI metrics |
| `contact.html` | Demo request and contact form |
| `justification.html` | Position paper — the structural gap AppWithAI addresses, and why engineering standards belong in the platform. In the primary nav as "Why AppWithAI", and linked from the home page, Features, How It Works, Pricing and every footer. |
| `try-it-yourself.html` | The conversion path with room to explain itself: the three steps, the prompt block, a complete worked `.eml.yaml` and what each of its lines does, the four habits §3.7 turns into diagnostics, and both ways to run the validator. In the nav directly after "Why AppWithAI". |
| `todo.html` | The short list, and deliberately short. **Before 1.0.0**: comprehensive test coverage, security assessment, complete product documentation, DeepSeek harness integration, the reporting application (`enterprise_reporting_rust`). **After it**: completely agentic workflows on the DeepSeek Harness. The five before 1.0.0 are one line each — the detail lives in `docs/ROADMAP.md` in `app-with-ai-rust`, which the page links. The after-1.0.0 item is the one exception to that brevity: it carries a six-card brief on *how* it would be built, because the harness is new and the item is meaningless without it. Each card maps a step of the AppWithAI pipeline onto a mechanism the harness actually documents — Cordis plugins and bundles, `ctx.tools`, `ask_user_question`, the `ctx.subagents` seam and `ralph`, the sandboxed filesystem/subprocess providers, and the `web`/`headless`/`sdk` profiles with their durable session log. Those come from the harness's own `docs/` (architecture, agent-lifecycle, capability-seams, tool-catalog), which the page cites — **check them before editing a claim there**, since the harness is in developer preview and expects breaking changes. Linked from every footer's Product column and from both experimental-software notices on the home page. Deliberately **not** in the primary nav: it is at its seven-item ceiling |
| `privacy.html` | What analytics collect, event by event; what session recordings blank out; the three opt-outs; and the Model Assistant's own section on the key. Linked from every footer, from chapter 09's note and from `assistant.html` |
| `assistant.html` | **The Model Assistant.** Bring an OpenAI or Claude key, load a model, say what to change, and the browser calls the provider directly. The result goes through `guide/model-yaml.js` before a download is offered. Linked from `try-it-yourself.html#enhance` and every footer's Product column — **not** in the nav, which is at its seven-item ceiling |
| `guide/index.html` | "Build a CRM" guide overview, chapters 00–11 |
| `guide/run-in-browser.html` | Chapter 09: generates and runs a full application in the visitor's browser |
| `guide/run-real-stack.html` | Chapter 10: runs the real generated application — the Loco.rs crate and the front end — on your machine, with Docker or with cargo and bun |
| `guide/11-check-a-model.html` | Chapter 11: the authoring protocol, and the published validator running live |
| `viewers/index.html` | The model viewer: an `.eml.yaml` drawn in full — entities, state machines, sagas, business rules and access — by the generator's own reader. Linked from the home page, `try-it-yourself.html#enterprise-prompt`, chapter 11 and every footer |
| `llms-full.txt` | The YAML model language specification language models are pointed at — the language only, deliberately not the generator or the framework |
| `llmdetailed.txt` | The same language, plus the generator, the templates and the generated application — and an *interactive* authoring protocol in §10. The professional/enterprise path, linked from `try-it-yourself.html#enterprise-prompt` and the home page |
| `llmtextenhancement.txt` | `llms-full.txt` with its §1 replaced by the **enhancement** protocol: load the user's existing `.eml.yaml`, change what they asked for, keep everything else, and prove it. Derived, not authored — see **The enhancement editions** below. Linked from `try-it-yourself.html#enhance` and the home page |
| `llmdetailedenhancement.txt` | `llmdetailed.txt` with its §10 replaced by the **interactive** enhancement protocol — the same seven-phase, gated walkthrough, applied to a model that already exists. Derived. Linked from `try-it-yourself.html#enterprise-enhance-prompt` |

## Design System (Lunaris)

The CSS is organized as a complete design system. Use existing classes — do not invent new ones.

### Color Variables

```css
--primary-500    /* main blue */
--secondary-500  /* main purple */
--accent-500     /* main orange */
--success-500
--warning-500
--error-500
--gray-*         /* 50–900 scale — the neutral ramp is spelled `gray`, not `neutral` */
```

> There is no `--neutral-*`. This file said there was, and a rule written against
> it renders with the property dropped and no error anywhere. Check the token
> exists in `style.css` before using it.

> **A heading in a gradient hero needs `color: white` on the heading itself.**
> `h1, h2, h3, h4, h5, h6` carry an explicit `color: var(--gray-900)`, and an
> explicit rule beats inheritance — so `color: white` on the surrounding section
> does nothing for the heading, which renders near-black on a dark gradient. It
> is a contrast failure a DOM check cannot see, because the text is still there
> and still reads correctly; only looking at the page catches it.

### Key Component Classes

**Buttons:** `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-accent`, `.btn-lg`, `.btn-sm`

**Cards:** `.card`, `.card-icon`, `.card-header`, `.feature-card`, `.feature-icon`, `.stat-card`, `.pricing-card`

**Layout:** `.grid-2`, `.grid-3`, `.grid-4`, `.section`, `.section-white`, `.section-gray`, `.section-header`

**Forms:** `.form-group`, `.form-label`, `.form-input`, `.form-select`, `.form-textarea`

**Navigation:** `.header`, `.nav`, `.nav-link`, `.logo`, `.menu-toggle`

> **The logo is CSS, not an image.** `.logo` is the home link on every page and
> contains `.logo-mark` (the gradient tile carrying the brand initial) and
> `.logo-word` (`App` · `.logo-word-dim` · `.logo-word-ai`). There is no
> `image.png` and no `.logo-img` — the wordmark follows the theme's tokens,
> stays crisp at any density and costs no request. `.logo::after` is the
> **HOME** pill that appears on hover and on keyboard focus; it is positioned
> out of flow on purpose, because the header is at its width ceiling at 1024px
> and the home link must not grow by a pixel to say what it is.
>
> **Height is the only axis with room.** The wordmark replaced a 76px image —
> `60875c5` had just doubled it — so the tile is deliberately large (48px) while
> the type beside it keeps a 1.1875rem measure. Growing the *type* is what
> overflows the nav: at 1.5rem the last button ran 12px past the container at
> 1440px, measured. The mark and the type both step down in the 1024–1279px
> query. Re-measure at 1024 **and** 1440 after any change here.

**Badges and stats:** `.hero-badge`, `.stats-grid`, `.stat-card`, `.stat-value`, `.stat-label`

**Hero:** `.hero`, `.hero-content`, `.hero-badge`, `.hero-subtitle`, `.hero-cta`,
`.hero-notice` — the amber "experimental software, not fully tested" panel under
the headline on `index.html`. It is deliberately *above* the fold and above every
"production-ready" claim on the page; the same caveat also closes the footer.
Both carry the GitHub source link.

**Grids:** `.features-grid` (auto-fit feature cards), `.grid` + `.grid-2/3/4`

**Timeline:** `.timeline`, `.timeline-item`

**Comparison:** `.comparison-table` with `.check` / `.cross` marker classes

**Pricing:** `.pricing-card`, `.pricing-card.popular`, `.pricing-badge`, `.pricing-features`

**Utilities:** `.mt-1` through `.mt-5`, `.mb-1` through `.mb-5`,
`.text-xs` / `.text-sm` / `.text-base`, `.text-center` / `.text-left` / `.text-right`,
`.text-muted`, `.text-gradient`, `.container-narrow`, `.container-wide`

> The font-size utilities were used across the marketing pages long before they were
> defined, so they silently did nothing. They are defined now — if you change them,
> six pages change with them.

### Responsive Breakpoints

| Query | What it governs |
|---|---|
| `min-width: 768px` | Desktop type scale and multi-column grids |
| `min-width: 1024px` | The full navigation appears; the menu toggle is hidden |
| `1024px–1279px` | Narrow desktops: the nav gap and type size tighten so seven items plus two buttons still fit |
| `max-width: 1023px` | Navigation collapses behind the menu toggle |
| `max-width: 767px` | Single-column layouts, full-width buttons, scrollable comparison tables |

Design is desktop-first with mobile overrides. Test any new section at **767px** and
any navigation change at **1024px**. **767px is not narrow enough on its own** — a
real phone is 360–390px, and the overflow below was invisible at 767 and obvious at
390. Check a new section at **390px** too.

> **`.grid > * { min-width: 0 }` and `pre { overflow-wrap: anywhere }` are load-bearing.**
> A grid item defaults to `min-width: auto`, which floors its track at the item's
> *min-content* width — so `grid-template-columns: 1fr` is not actually free to
> shrink. Where that item held a `<pre>` with a URL in it, and a URL offers no
> break opportunity, the column came out wider than a phone screen and every line
> in the card rendered outside the card's own box. Both rules are needed: the item
> has to be allowed to shrink, *and* the long token needs somewhere to break.
>
> `overflow-wrap` only affects a block that already wraps, so a `<pre>` left at the
> default `white-space: pre` still scrolls inside its own `overflow-x: auto` box —
> which is what the worked model listing and the `curl` command want. That is why
> the rule is `anywhere` on `pre` rather than `word-break: break-all`, and why
> adding `white-space: pre-wrap` to a code block is a decision about whether its
> lines may be broken, not a formatting detail.

## JavaScript Conventions

`assets/js/main.js` is loaded on every page. Key behaviors:

- **Mobile menu:** Hamburger toggle with animated icon transform
- **Scroll animations:** Intersection Observer triggers `fadeInUp` on `.card`, `.feature-card`, `.timeline-item`
- **Nav highlighting:** Active link detection by matching `href` to current page filename
- **Form validation:** Red border on empty required fields on blur; blue border on focus
- **Stats counter:** Animated number increment on scroll into view
- **External links:** Automatically get `target="_blank"` + `rel="noopener noreferrer"`
- **`[data-url]`:** The element's text is replaced with `data-url` resolved against
  `window.location`. Use it for any absolute URL shown to a reader — the site is
  written as `appwithai.org` but must also be correct on a fork, a staging host or a
  local server. Never hard-code the production hostname in visible text.
- **`[data-copy]`:** A button copies the text of the element whose id it names.
  It reads the live DOM, so it picks up the resolved `[data-url]` values rather than
  the placeholder in the source. Falls back to selecting the text where the clipboard
  API is refused (private windows, plain `http://`).

`assets/js/analytics.js` is loaded on every page, immediately **before** `main.js`,
and defines `window.awTrack(event, properties)` synchronously — see **Analytics**
below.

Utility functions available globally via the `utils` object:
```js
utils.debounce(func, wait)
utils.throttle(func, limit)
utils.getCookie(name)
utils.setCookie(name, value, days)
```

## HTML Conventions

- Use semantic elements: `<header>`, `<nav>`, `<section>`, `<footer>`, `<main>`
- Maintain heading hierarchy (one `<h1>` per page)
- Add `aria-label` to interactive elements without visible text
- All external links: include `target="_blank"` and `rel="noopener noreferrer"`
- Meta tags required on every page: `charset`, `viewport`, `description`, `keywords`
- Keep navigation consistent across all pages (copy from an existing page)
- **Every page declares the icon twice**, immediately above its first stylesheet:
  `favicon.svg` (`type="image/svg+xml"`) and `favicon.ico` (`sizes="48x48"`). Both
  hrefs are **relative** — `favicon.svg` at the root, `../favicon.svg` under
  `guide/` and `viewers/` — for the same reason `[data-url]` exists: the site has
  to be right on a fork, a staging host and `python3 -m http.server`. The `.ico`
  is not redundant. A browser asks for `/favicon.ico` on its own, and before these
  files existed every page load on the live site answered that with a 404
- **Do not skip a heading level.** `h4` directly under an `h2` is a level a screen
  reader reports as missing. Inside a card the right tag is `h3`, which is what
  `.card h3` and `.feature-card h3` already style — an `h4` there is both a
  hierarchy break and a size the rest of the site does not use. The footer's
  column headings are `h3` for the same reason, pinned by `.footer h3` to the
  size they rendered at as `h4`

## Navigation and the Live Demo

The primary nav carries seven items plus two buttons and fits on one line down to
1024px, below which it collapses behind the menu toggle. `.nav-link` is
`white-space: nowrap` so a two-word label never breaks mid-item; the narrow-desktop
media query (1024–1279px) tightens the gap and type size instead. **Seven is the
ceiling** — an eighth item overflows the header at every desktop width, measured.
"Try It Yourself" was added by dropping "Home": the logo links home from every
page, which is where a reader looks for it anyway. **Adding another item means
removing one** — check at 1024px before you do.

**"Live Demo" points at `guide/run-in-browser.html`**, the in-browser CRM. It is
same-origin, so it carries no `target="_blank"`. There was formerly an externally
hosted Hospital Management System demo at a raw IP over plain `http://`; it has
been removed site-wide and the CRM is the one worked example the whole site uses.
Do not reintroduce a demo the site cannot serve itself.

## "Try It Yourself" — the conversion path

The section on the home page (`index.html#try-it-yourself`) is the site's main call to
action, and `try-it-yourself.html` is the same path with room to explain itself — the
nav points at the page, the home page keeps the short version and links to it. Between
them the path spans five files. If you change one, check the others. There are now
**two prompts, not one** — see item 6.

1. **The prompt block** carries the specification URL inside a `[data-url]` span, so a
   visitor copies a link to the host they are actually on. The copy button is
   `[data-copy]` pointing at `#research-prompt`. Both are handled by `main.js`.
2. **`llms-full.txt`** is what that prompt tells the model to read. Its §1 is the
   authoring protocol; the three steps on the page are a plain-English retelling of it.
   If §1 changes, the three cards should change with it — and so should the section
   number quoted in the prompt block.
3. **`guide/run-in-browser.html#upload`** is where the reader lands with their model.
   The hash is honoured in `run-in-browser.js`: it selects the upload choice and scrolls
   the dropzone into view instead of showing the CRM example.
4. **`how-it-works.html`** carries a pointer section that links to `try-it-yourself.html`
   rather than duplicating the steps. Keep it a pointer.
5. **`try-it-yourself.html`** repeats the three cards and the prompt block, and then goes
   further than the home page can: a complete `Field Service` model with every line
   explained, the four dictionary habits, and both ways to run the validator. **Its example
   model validates clean** — `node guide/check-model.mjs` it after any edit, the same way
   `llms-full.txt`'s examples are held to.
6. **The second prompt — `try-it-yourself.html#enterprise-prompt`.** Same card layout, a
   `<pre id="enterprise-research-prompt">` and its own `[data-copy]` button, and a
   `[data-url]` span naming `llmdetailed.txt`. **Everything below its first line is the
   first prompt word for word** — which is exactly what the page claims, and the claim
   is scoped that way on purpose. The *first* line carries all four differences: the
   document, the section number, the word "interactive", and one sentence the batch
   protocol has no use for ("Do not skip a phase, and do not cross a gate I have not
   approved"), because `llms-full.txt` §1 has no gates and `llmdetailed.txt` §10 is
   seven phases separated by them. If you edit one prompt below its first line, edit
   the other, or the claim on the page stops being true. The home page carries a
   one-line pointer to it and nothing more.
7. **The enhancement pair — `try-it-yourself.html#enhance`.** Two more prompt
   cards and a four-way table, in a section of their own after the two above.
   They point at `llmtextenhancement.txt` and `llmdetailedenhancement.txt`, and
   they exist because the two prompts above **rewrite** any model you point them
   at — they are written to produce a model from a description, so given one they
   produce a second one. The enhancement prompts attach the user's `.eml.yaml`
   instead, and ask for the whole file back with before-and-after counts. The
   same word-for-word rule binds this pair as binds the first, and
   `website-e2e.mjs` enforces both. The home page carries a one-line pointer.

## Key Conventions for AI Assistants

1. **No build step** — changes to HTML/CSS/JS are applied directly. Do not introduce npm, bundlers, or frameworks.
2. **Reuse existing CSS classes** — the design system is comprehensive. Avoid adding new CSS unless absolutely necessary.
3. **Keep pages consistent** — navigation, footer, and meta structure must match existing pages exactly.
4. **No external JS dependencies** — do not add CDN script tags or npm packages.
   Third-party code that genuinely has to be here is *vendored* into
   `assets/vendor/` and served from this origin, with a `README.md` beside it
   naming the exact published version and the command that fetched it. posthog-js
   is there on those terms; PGlite is the published `@electric-sql/pglite` build.
5. **Preserve the design system** — CSS variable names and spacing scale are intentional; do not rename or restructure them.
6. **Static only** — there is no backend, no API, no database. Forms do not submit to a server by default.
   This is what shapes `assistant.html`: CopilotKit's runtime and Mastra are both servers and neither
   can run here, so that page calls the provider from the browser with the reader's own key. Do not
   add a server-side dependency to this repository without moving it off Pages first.
7. **Deployment is automatic** — merging to `main` deploys to production. Test locally before merging.
8. **Mobile-first content** — ensure any new sections are responsive and tested at 767px width.
9. **Animations via CSS + IntersectionObserver** — follow the existing pattern in `main.js` for scroll-triggered effects; do not use JS animation libraries.
10. **Accessible markup** — maintain ARIA labels, semantic structure, and sufficient color contrast (design system colors are pre-validated).
11. **`todo.html` is the caveat's other half, and it is a summary.**
    The home page says this is early software; that page says what specifically
    is missing — in five lines, because a reader deciding whether to trust this
    wants the list, not the essay. **The detail belongs in `docs/ROADMAP.md` in
    `app-with-ai-rust`**, not here: that is where each item's *Done when*
    lives, and **an item is not marked done until that sentence is true**. The
    wording exists so finishing is verifiable rather than declarable — quietly
    softening a *Done when* defeats it. If the two lists disagree, the
    repository is right and this page is stale.

    The page states that the release which is genuinely production grade will be
    **1.0.0**, counting from zero, and says plainly that the repository reads
    5.1.1 today (`VERSION` in `app-with-ai-rust`; its root `package.json`
    still says 5.1.0). That is a deliberate renumbering *down*, on the grounds
    that the old number counted releases rather than readiness — so if the
    version in that repository changes, this page is one of the places that has
    to change with it, and the reasoning is what to preserve, not the digits.
12. **Say what the software actually is.** The pages carry marketing claims —
    "production-ready", "enterprise features out of the box", "90% faster". The
    project is young and not fully tested, and `index.html` says so in the hero
    (`.hero-notice`) and again in the footer, both linking the source on GitHub.
    Do not quietly soften, move or delete either one: a reader deciding whether
    to trust this needs the caveat before the claims, not after them.
13. **Security is what the generated backend enforces, and nothing else is claimed.**
    Sign-in in the generated application is **email and password** on the Loco.rs
    backend: argon2 password hashes and a signed JWT, carried in an HttpOnly cookie
    or a bearer header. There is no social sign-in, no second factor and no SSO;
    read `backend/src/controllers/auth.rs.hbs` and `models/users.rs.hbs` in the
    platform's templates before writing otherwise. Everything else the pages call
    security is *authorization* — `sys_access` on windows and tables, the model's
    `rbac` operation rules, transition rules on every state machine, and the
    hash-chained audit log — derived from the model and enforced in the generated
    API, which is real and may be described as such. Field-level and row-level
    security are **not** generated; do not claim them.

    `features.html` used to carry a four-card grid reading **SOX Ready · GDPR
    Compliant · ISO 27001 Aligned**, and several pages claimed OAuth and
    "MFA-ready flows". None of it had been assessed or was implemented. **Do not
    reintroduce a compliance badge.** A compliance programme audits an
    organization, not a code generator; the access control and the audit trail are
    evidence a reader would bring to one, and saying more than that is the same
    failure convention 12 exists to prevent.

## The In-Browser Demo (Chapter 09)

`guide/run-in-browser.html` compiles a YAML model into a complete application and runs it in the
visitor's tab. It is the only page on the site with moving parts, so it has its own rules.

**How it works**

1. `assets/js/run-in-browser.js` (an ES module) reads a model from `guide/models/`, or from a file the
   visitor picks, and reads, validates and compiles it with `assets/js/appwithai-model.js` —
   `compileForBrowser`, the platform's own reader. A model that does not validate stops there, with
   every finding at its YAML line, and `fix` repairs what the validator can repair.
2. The compiled model goes to `generateFromModel` in `assets/js/appwithai-wasm.js`, which writes the
   in-tab application: one `model.json`, one schema file and a runtime that is the same bytes for
   every model.
3. The generated files are posted to the Service Worker at `guide/wasm-app/sw.js`, which serves them
   from Cache Storage under `guide/wasm-app/run/` and forwards that app's `/api` calls to a worker thread.
4. PostgreSQL is PGlite, served from `assets/vendor/pglite/` on this origin, and the database lives in
   the visitor's IndexedDB. **The chapter makes no request to any other host.**

That last sentence is scoped to this chapter and is still true of it. `assistant.html`
is the one page that does reach another host, because sending the model to a provider
is the whole of what it is for; it is a separate page and nothing here reaches it. The
note in the chapter and `privacy.html` both say so rather than leaving the blanket
claim to be read as covering the site.

**Two applications from one model, and the page says which is which.** The frame runs the
*in-tab* application: its interface is a port of the generated one, reading the same Application
Dictionary through the same API shape, because the real front end needs Vite and the real backend
needs cargo, and a tab has neither. *Download the deployable app (.zip)* writes the *real* one — see
below — and chapter 10 runs it.

**Roles — what the reader is meant to notice**

The generated application seeds one account per functional role the model declares, and its sign-in
screen lists every one with the number of entities that role can see. The CRM declares **seven**
functional roles: signing in as `support.agent@…` gives you five entities of seventeen, and the
administrator all of them. None of that logic is on this site — `guide/models/crm.eml.yaml` declares
the roles with `rbac` `read` entries and the bundle does the rest.

Count roles as the roles the model *declares*. The reader also reports `Administrator` and `User`,
which no model writes, so a count taken off its role total is two high; `scripts/website-e2e.mjs`
counts the roles marked as declared by `rbac`, the only number that means the same thing for every
model.

**The second sign-in — what the reader is meant to try**

The dashboard carries an **Enterprise Reporting** section, and clicking it asks for a different
password. One model generates two applications and that is the other one — the reporting platform's
reports, charts and dashboard over the same data, behind its own accounts. A role in the application
decides what you may *do* to a record; a reporting role decides which tables your queries may
*read*. The names line up (one reporting account per `rbac` role) and the addresses do not:
`support.agent@crm.reports.example.com` against `support.agent@crm.example.com`, deliberately.

**In the browser it is a preview, drawn in the platform's own layout, and the page says so.** The
deployed platform is `enterprise_reporting_rust`, a Loco.rs server, so the frame shows the same
reports, roles and accounts in its layout with a strip on every screen saying it is a preview. Its
**Administration** section works; what needs the platform's servers opens a page naming where the
real one is. The figures chapter 09 states about it — five of seventeen tables, 36 of 116 reports —
are asserted by `scripts/website-e2e.mjs` against the pack the served bundle derives.

**Delete all records** — the in-tab application's dashboard carries an administrator-only control
that empties every business table. It is two-step rather than a `confirm()`, because the app runs in
an iframe, where a modal dialog is not guaranteed to appear.

**Sample data — the `#sample-records` control.** Ten rows per entity by default, because an
application whose every list says *No entries* is one nobody can look at. Which value a column gets
is decided by the Application Dictionary, in the bundle — a column's reference type first, its name
second — so an `EMAIL` holds an address, an enum-bound column one of its declared values, and a
`TABLE_DIRECT` the id of a row that exists. **No sample-data logic lives on this site**; the seed is
the application's name, so two readers see the same records; `0` (*None*) is honoured; and
"Start over with a fresh database" re-seeds.

**Download as files** writes the in-tab application out as one readable shell script that recreates
every file in a directory of its own. It serves from anywhere static over `http://` (`bunx serve`);
the application looks for PGlite beside itself, then at this site's copy.

**The deployable zip — `#download-stack`**

*Download the deployable app (.zip)* writes the real application: the Loco.rs (Rust) backend crate,
the TanStack Start + Astryx front end, the cargo and bun test suites, the CEDM specification bundle,
`model/model.eml.yaml`, a `docker-compose.yml` and a README — 526 files for the CRM.

- **It is the platform's own pipeline, not a copy of it.** `assets/js/appwithai-loco.js` is
  `generateApplication` — the function the `appwithai` command line calls — bundled for the browser
  over an in-memory filesystem, and `assets/vendor/loco-assets.json` is the templates, the language
  definition and the CEDM specification it mounts. Both are built by
  `app-with-ai-rust/scripts/sites/loco-generator.ts`, and the platform's verification generates every
  published model both ways and requires the same files, byte for byte, executables included. The
  command line adds only `cargo fmt` over the backend, when cargo is installed.
- **Both are imported lazily, on the click.** A reader who came for the in-tab application should not
  pay for nearly a megabyte of generator and three of templates.
- **`assets/js/zip.js` is the archive writer, and it has no dependency.** Compression is
  `CompressionStream("deflate-raw")`; where that is missing an entry is stored uncompressed. Runner
  scripts are marked executable in the archive.

**The generated manual.** The in-tab application's dashboard carries a **Manual** button pointing at
`manual.html`, written by the same generation run: a section per entity with every field, its
control, constraints, enum values and help text, then its relationships, state machine, rules and
roles. **Its prose is the model's `help` and nothing else** — the CRM carries help on every entity and
every column, which is why its manual reads as one.

**Constraints to respect**

- The page must be served over `http://` or `https://` — a Service Worker cannot register from `file://`.
- **`#<key>` in the URL opens the chapter with that model chosen**, for any key of `BUILT_IN` —
  `#crm`, `#drug`, `#hospital`, `#dance`, `#investment`, `#education` — plus `#upload`, which selects
  the upload choice. An unknown hash falls back to the CRM. **A model added to `BUILT_IN` needs its
  card on `try-it-yourself.html` too**, and `website-e2e.mjs` fails until it has one.
- Paths in `run-in-browser.js` are resolved against the page URL (`models/…`, `wasm-app/…`), so the
  page, `guide/models/` and `guide/wasm-app/` must stay siblings.
- `guide-demo.css` is scoped entirely to `.guide-demo`, and its palette is a token bridge onto the
  design system variables — change the bridge, not the rules. `dark-theme.css` re-points that bridge
  rather than restyling the demo.

## Chapter 10 — the real stack, on your machine

`guide/run-real-stack.html` runs the actual generated application, which a browser cannot: the
backend is a Rust crate and building it needs cargo. The chapter therefore runs nothing in the tab.
It gives two ways to get the same source — the chapter 09 download, or
`bun run generate:tanstack -- -i guide/models/crm.eml.yaml -o crm -n crm` in a checkout of
`app-with-ai-rust` — and two ways to run it: `docker compose` (which refuses to start without
`DB_PASSWORD`, `ADMIN_PASSWORD` and `JWT_SECRET`), or cargo, bun and PostgreSQL directly. The API
answers on `:3000` and describes itself at `/openapi.json`, `/redoc` and `/scalar`; the front end is on
`:3001`. Its last step is the application's own two suites: `LOCO_ENV=test cargo test --test app` and
`bun run test` in `tests/`.

Every command on that page is the generated README's. **When a template changes how the application
is started, change this chapter in the same commit** — nothing here can run it to notice.

## Chapter 11 — the published validator

`guide/model-yaml.js` is the ES module that §1.3 and §8 of `llms-full.txt` tell language models to
import, at exactly `https://www.appwithai.org/guide/model-yaml.js`. **Do not move or rename it.** It
exports `validate(text)` → `{ ok, document?, diagnostics }`, `fix(text)` → `{ text, applied,
diagnostics, ok }`, `checkAndFix` and `LANGUAGE_VERSION`; every diagnostic carries a `severity`, a
`code`, a `message`, a document `path`, a `hint`, and the YAML `line` and `column` it points at.

It is built in `app-with-ai-rust` by `scripts/sites/build-site-bundles.ts` from
`language/browser/model-yaml.entry.ts` — YAML, the JSON Schema, the full checker — and it is the same
code the CLI runs. `assets/js/validator.js` is only a front end for it: never add validation logic to
it, or a model could pass here and fail in the generator.

`guide/check-model.mjs` is the command-line way in, **authored here**: a runner that locates
`model-yaml.js` (beside itself, the working directory, `./guide/`, then the published site), performs
§1.3's three passes, prints the report with the verdict as its **last line**, and exits 0 / 1 / 2. It
exists because Node removed network imports, so a language model with a shell needs four lines where
Bun and Deno need one. Keep it a runner: no diagnostic may originate in it.

`guide/audit-model.mjs` is the **second** runner, and it answers the other question. The validator
says whether the generator would refuse a model; nothing in it requires a model to *have* anything —
one entity with a key and a name is a valid model with no lifecycle, no rule, no `rbac` entry and no
help. The audit is twenty-two checks over §1.2's file contract and §10's checklist, its last line is
the score (`22 passed, 0 failed`), and it exits 0/1/2. A bare model passes `check-model.mjs` and
**fails the audit nine ways** — `tests.yml` asserts exactly that. `scripts/check-model.mjs` is a
forwarder to it; keep it one.

Both runners accept `--base` as a directory or a URL. Anything without a scheme is resolved to a
`file:` URL, because `fetch` and a bare `import()` both reject a relative path with *"Failed to parse
URL"* — which reads as the site being unreachable while the module sits in the next directory.

The page's front end offers **"Download as .eml.yaml" only when a run has no errors**, named from the
model's `name` (lower-cased, hyphenated). Handing someone a file the generator would refuse is the
failure this page exists to catch.

**`guide/check-model-standalone.mjs` — the whole validator as one file.** Built by
`scripts/build-standalone-checker.mjs`, which brotli-compresses `model-yaml.js`, `check-model.mjs` and
`audit-model.mjs` and embeds them base64; on run it inflates them into a temp directory and executes
the published runner against them (`--audit` picks the second). It reimplements nothing. It exists
for one case — a shell that resolves no host, whose only channel in is pasted text — and the files
apart are smaller than this is together, so every ladder rung that names it says to prefer them.

**`guide/source/` — the validator carried inside pages**, for a fetch layer that reads `text/html`
and refuses `application/javascript`. Each page carries one file **base64-encoded** — no HTML-special
character, whitespace-insensitive, so a reflow or a Markdown conversion cannot corrupt it — plus the
**SHA-256 of the real file**. It is a transport of last resort and every page names the direct URL
first.

**A rebuilt `model-yaml.js` is three rebuilds.** The standalone file and `guide/source/` carry its
bytes, and `tests.yml` fails until both are rebuilt: `node scripts/build-standalone-checker.mjs` and
`node scripts/build-validator-source-page.mjs`.

## The Model Assistant — `assistant.html`

The one page here that sends a reader's model to another company, and the one that asks for a
credential. Both are deliberate and both are stated on the page above the field.

**Why it is shaped this way.** CopilotKit's runtime and Mastra are both servers, and this site is
GitHub Pages with no backend at all (convention 6). The only shape a static site can offer is the
visitor's key, held in their browser, on a request that goes straight to the provider. **Do not
"upgrade" this to a runtime without moving the site off Pages first.**

- **It runs the ENHANCEMENT protocol**, `llmtextenhancement.txt`, as the system prompt — not
  `llms-full.txt`, whose authoring protocol pointed at an existing model writes a second model under
  the first one's name. `website-e2e.mjs` §8 pins `PROTOCOL_URL`.
- **The key never reaches this origin**, because there is no origin to reach. It is `localStorage`,
  opt in, with a *Forget it* button. The amber panel sits **above** the key field and points at the
  chat-window route for anyone who would rather not; §8 asserts that ordering.
- **The step that justifies the page is the check.** The reply is stripped to its YAML, run through
  `validate` from `guide/model-yaml.js` and repaired with `fix`, and a download is offered **only**
  when `ok` is true — chapter 11's rule, applied here.
- **Four events, and `privacy.html` lists all four.** None carries the key, the model or the
  instruction.
- **The provider list is the whole egress surface.** §8 greps every `https://` host out of the
  controller and fails on anything that is not the two API hosts and their two consoles.
- `assistant.css` is scoped to `.aia-root` and prefixed `aia-`, with a palette bridged onto the
  Lunaris tokens.

## The model viewer — `/viewers/`

`viewers/index.html` draws a model in full: the entity diagram, every rule's decision graph and
table, every state machine, saga and hook, and who may do what. It is what a reader opens to *see* a
YAML file they are writing.

**Nothing on this site reads a model.** `viewers/appwithai-model.js` is the platform's reader —
`inspectModel` and `formatReport` — built from `language/browser/browser-generator.entry.ts`. The
eight modules beside it decide how a column, a state or a step *looks*, never what it is. Adding a
rule about a model to any of them is the same mistake as adding sample-data logic to
`run-in-browser.js`: the page showing something the generator would not.

- **`index.html` is authored here** — the site's chrome around the viewer markup, plus
  `data-awv-theme="dark"` on the root, because the site serves one theme to everybody.
- **`viewers.css` is scoped to `.awv-root` and prefixed `awv-`**, palette stated once as custom
  properties at the top.
- **Watching a file needs the File System Access API**, so the button is hidden where it is missing.
  Opening and pasting work everywhere.
- **`llmdetailed.txt` §10 sends readers here** at several phases; `check-spec.mjs` holds its
  instructions to this page.
- **Session replay is off here.** The one event is `model_viewed`, carrying counts only.

## Where the bundles come from

Every module the pages import is either **built** from `app-with-ai-rust` or **vendored and patched**
there, and none is edited here. Rebuild from that checkout:

```bash
cd ../app-with-ai-rust
bun scripts/sites/build-site-bundles.ts           # write every bundle, both sites
bun scripts/sites/build-site-bundles.ts --check   # fail if a committed copy is stale
bun scripts/sites/patch-vendored-generators.ts --check
```

| Here | Built from | What it is |
|---|---|---|
| `guide/model-yaml.js` | `language/browser/model-yaml.entry.ts` | The validator and fixer |
| `assets/js/appwithai-model.js`, `viewers/appwithai-model.js` | `language/browser/browser-generator.entry.ts` | Read, validate and compile a model for the browser |
| `assets/js/appwithai-loco.js`, `assets/vendor/loco-assets.json` | `scripts/sites/loco-generator.ts` | The Loco pipeline over an in-memory filesystem, and what it mounts |
| `assets/js/appwithai-wasm.js` | vendored, then `scripts/sites/patch-vendored-generators.ts` | The in-tab generator, taking a compiled model (`generateFromModel`) |

**A change to the language definition is a rebuild of all four.** Each bundle embeds
`appwithai-language.json`; a definition changed in the platform and not rebuilt here leaves chapter
09, chapter 11 and the viewer disagreeing about one model.

**The six published models are the site's own**, and the orchestrator's `common/html/models/` holds
the same bytes. The platform's `language/yaml/examples/` and `html/models/` are its own corpus and may
differ in comments and scope; do not overwrite one set from the other without running both sites'
checks. Every model here validates with 0 errors and 0 warnings and scores 22/22.

Two site-only edits live in `run-in-browser.js` and are greppable: the PGlite probe and shim
(`findVendoredPglite`), and `window.awTrack?.(…)` at each funnel step. The theme passed to the frame
(`?theme=dark`) is the third: the site serves one theme to everybody, and an application that follows
the reader's machine would render light inside a dark page.

## Analytics — the funnel, and where each event lives

The whole of it is `assets/js/analytics.js`, loaded on every page before
`main.js`. It vendors posthog-js (`assets/vendor/posthog/`, see the README
there), and it is the only file that decides anything about measurement.

**The key is set, and measurement is live.** `POSTHOG.key` at the top of
`analytics.js` carries the project token for AppWithAI, project 578899 on US
Cloud. This paragraph said the field was empty for as long as it was, and a
reader who trusted that would conclude no request leaves the page and nothing is
collected — neither of which is true now. A `phc_` project API key is
write-only and publish-safe and belongs in client source; `phx_` (personal) and
`phs_` (project secret) read private data and do not. Emptying the key is still
the switch it always was: with no key the library is never fetched and nothing
is collected. Change `POSTHOG.host` to `https://eu.i.posthog.com` for an
EU-cloud project.

**What is being measured is a funnel, not a page count.** The path this site
exists to move people along runs:

```
try_it_viewed → prompt_copied → model_uploaded → checker_passed
              → generate_succeeded → app_ready → app_interaction
```

Every step except the first two is a real function in `run-in-browser.js` or
`validator.js`, so it is recorded **where the step happens**, with the real
numbers that step produced — `generation_time_ms` is measured around the
compile, not guessed from a click. `privacy.html` lists every event and every
property, and it is reader-facing, so **an event added here is added there too**.

**`window.awTrack(event, properties)` is the whole interface.** It is defined
synchronously, queues until PostHog loads, and is a safe no-op when analytics
are off, absent, blocked or unconfigured — which is why the two vendored files
call it unconditionally and neither of them contains a decision. Keep it that
way: a rule about *what* an event means goes in `analytics.js`.

**Session replay is on three pages** — `try-it-yourself.html` and guide chapters
09 and 11 — and off everywhere else, because the free allowance is five
thousand recordings a month and the home page would spend it on bounces.
Widening `REPLAY_SURFACES` means budgeting for it.

**A recording blanks out the reader's model.** Someone pasting their own
business model into this site is handing over entity names, field names and the
shape of their company. `maskAllInputs`, a `maskTextSelector` covering every
`textarea`, `pre` and `code`, and `blockSelector: "iframe"` for the generated
application. No event carries a line of a model, an entity name or a validator
*message* either — only diagnostic codes. Do not relax any of that to make a
report prettier.

**Three opt-outs, checked before the library is fetched**: Global Privacy
Control, Do Not Track, and `?analytics=off` (remembered; `?analytics=on`
forgets it). PostHog's own bot filter drops anything reporting
`navigator.webdriver`, which is worth knowing before concluding that events are
not being sent — a headless browser will never produce one.

**What `disable_external_dependency_loading` does and does not buy.** It stops
the recorder, surveys and toolbar being pulled from PostHog's CDN. It does not
mean no request: a page load still asks `us-assets.i.posthog.com` for the
project config and `api_host` for flags, before any event. The README beside the
bundle tabulates all three, and `privacy.html` is written to match. Neither
claim is guesswork — both were read off the network in a browser.

## The enhancement editions — derived, never hand-written

There are **four** published protocol documents, not two, and they divide on two
questions: does the reader start from a description or from a `.eml.yaml` they
already have, and do they want one answer or a conversation.

| | Start from a brief | Start from an existing `.eml.yaml` |
|---|---|---|
| **One pass** | `llms-full.txt` §1 | `llmtextenhancement.txt` §1 |
| **Phased, with approval gates** | `llmdetailed.txt` §10 | `llmdetailedenhancement.txt` §10 |

**The enhancement pair is derived from the pair above it.** Each is its base
with one section swapped — the authoring protocol becomes the enhancement
protocol — and *everything else carried across byte for byte*. Rebuild them with:

```bash
node scripts/build-llmtext-enhancement.mjs          # rebuild both
node scripts/build-llmtext-enhancement.mjs --check  # what CI runs
```

**Do not edit `llmtextenhancement.txt` or `llmdetailedenhancement.txt` by
hand.** They are build outputs. The four files under `scripts/llmtext/` are the
sources — one protocol and one header per edition — and a hand edit to the
output is lost the next time anyone runs the builder, silently, because the
output is checked in and looks like an ordinary document.

**Why derive rather than write two more specifications.** Four documents
describing one language, each maintained separately, is four answers to "what
does `rbac` do", and three of them go stale in the direction nobody notices.
Here the language half cannot drift: it is copied, and `check-spec.mjs` asserts
byte-for-byte that it still matches the base. That is the same reasoning behind
`check:models` upstream, applied to prose.

Two properties of the deriver are load-bearing:

- **A section ends at the next *numbered* `## ` heading**, never at a bare one.
  Both base documents quote a markdown dossier inside a fenced block whose own
  headings are `## Fields` and `## Enums`, so a bare match stops inside the
  fence and strands the tail of the old protocol after the new one. That is not
  a crash: the result checks clean and reads as a document with an extra entity
  dossier bolted to the end. A dossier fence in the protocol is what caught it.
- **The interactive edition splices the base's own `#### The tools` block**
  rather than restating it. Every claim about the validator — its flags, its three
  exit codes, the offline ladder, the rule that an unreachable GitHub is not an
  unreachable validator — is therefore the real one, and stays true for free.

**The section numbers move with the shape.** The protocol sources use a `{{N}}`
token rather than a literal number, because the same protocol sits at §1 in this
site's language-only edition and at §10 in the product repositories' system
edition. For the same reason a source must never quote another document's
section number: `llms-full.txt` §1 here is `llms-full.txt` §10 there. Refer to
"its authoring protocol", not to a digit.

**What makes an enhancement protocol different, and what the checks hold it to.**
Authoring has one way to fail — model the business badly. Enhancement has three,
and only the first has a diagnostic:

1. answering with prose about the model instead of the model, which the
   validator refuses before reading an entity;
2. answering with only the part that changed, so the user performs the merge by
   hand into a document they did not write;
3. handing back a model that checks clean and is **quietly smaller** than the one
   that came in — four `reports` gone, an entity's help text gone,
   two `rbac` entries gone. A smaller model is a valid model, so nothing
   complains.

Both editions therefore ask for the user's file before anything else, refuse to
reconstruct a model from a summary or the conversation, inventory the model
*before* editing it, and close by comparing the result against that inventory.
`check-spec.mjs` and `website-e2e.mjs` §7 assert each of those.

**Four prompts, and two pairs that must stay word-for-word.** `try-it-yourself.html`
carries all four. Within each pair everything below the first line is identical,
and the first line carries every difference — the document, the section number,
and (for the gated forms) the sentence about not crossing a gate. `website-e2e.mjs`
holds both pairs to that, so editing one prompt without the other fails CI rather
than quietly sending a reader through the wrong protocol.

## What the published validator hands back

Every diagnostic is located at the YAML line and column it concerns, and carries its repair:

```
warn  EML152:4:5  Entity "Thing" has no help.
      → Add  help:  — what this record is for in the business, when one is created, …
```

A line number alone makes the reader count lines, and the reader here is usually a language model
holding the document in a context window rather than open in an editor. It miscounts, edits the
wrong line, and reports a fix that was never applied.

**None of this is authored here.** It is the platform's `language/browser/model-yaml.entry.ts`,
rebuilt with `build-site-bundles.ts`. Two properties worth not breaking:

- **The verdict is the final line** — `OK — 0 errors, 0 warnings, 0 notes (EML 2.0.0)`.
  `check-spec.mjs` reads the runner's last line, and §8.2 tells readers to do the same.
- **Each diagnostic is two lines**, the finding and its `→` repair. `validator.js` renders the report
  inside a `<pre>`; anything that assumes one line per issue does not.

## The published host is written in full — `https://www.appwithai.org`

Every mention of the host in all four protocol documents is the absolute URL,
scheme and `www.` included. This is not a style preference. A model following
the specification reported a failed validator fetch as

```
Validator retrieval failed for [www.appwithai.org](https://www.appwithai.org)
and appwithai.org: container requests returned DNS-resolution failures
```

— a Markdown link whose *text* is a bare host, beside a second bare host. The
documents taught it that: they named the host without a scheme in prose, and the
copies in the product repositories used the apex for most URLs while the
published ones used `www`. Three things follow, and each has been seen:

- **A bare host is not a URL.** A runtime handed `appwithai.org/guide/model-yaml.js`
  either refuses it or guesses a scheme.
- **A Markdown link around a bare host is worse, because it looks right.** These
  files are read by language models, not rendered — the link text is what gets
  parsed out and resolved.
- **The apex is not canonical.** It serves the same files and redirects, but an
  environment that resolves one and not the other is common.

The rule lives in each document's validation section and says all of this, plus
how to report a failure: name the exact request and the exact error, not a
prettified version of the host.

**`check-spec.mjs` §8 holds it**, over all four documents and over `index.html`
and `try-it-yourself.html`. Two details of that check are load-bearing:

- **It strips the canonical form before scanning**, rather than filtering lines
  that contain it. A naive `grep -v https://www.appwithai.org` passes a line that
  holds a good URL *and* a bare host — which is exactly the line that survived
  the first sweep of this work, in the enhancement header, and was caught only
  once the check existed.
- **It holds the counter-examples out of the scan and then asserts they are
  still there.** The rule teaches by showing what not to write; a checker that
  "corrects" those three lines leaves three bullets all displaying the right URL
  and explaining nothing.

**Where the rule lives depends on the document's shape**, and getting it wrong is
silent. In the language-only edition it is in §8, outside the protocol, so the
batch enhancement edition inherits it. In the system edition it is in §10.6 —
*inside* the authoring protocol, which the interactive enhancement edition
replaces wholesale — so that edition gets it only because its protocol splices
the base's own tools block. Anchoring the rule anywhere else puts it in the bases
and in neither companion, with every other check still green; `check-spec.mjs`
§8 runs over all four documents for exactly that reason.

## `llms-full.txt` is authored here

It is **the YAML model language and nothing else**, because the only thing a language model has to
produce is a model file. The platform's own edition (`website/llmtext/llms-full.txt` in
`app-with-ai-rust`) documents the whole system; this one does not, and must not be overwritten from it.
Take language changes across by hand, with the platform's `language/appwithai-language.json` and
`language/yaml/eml.schema.json` as the authority.

- **§1 is the authoring protocol** — what a model does to answer "build me an app for X". The home
  page's and `try-it-yourself.html`'s prompt blocks quote that section number.
- **§1.0 states the deliverable**: exactly one file, `<business-name>.eml.yaml`, one YAML document
  opening with `eml: "1.0"` and declaring `name` and `entities`. The observed failure is a model
  answering with an *enhanced specification* — headings, glossary, lifecycle prose — and never writing
  the model; the validator refuses such a document (`SCHEMA document must be object`) before it reads
  a single entity. §1.0, §1.2 (the file contract), §1.3 (validate the file's bytes) and §10 (the
  checklist) all carry that rule. Do not soften them.
- **§1.4 says what a surface that can only produce a document must do instead** — open the document
  with the whole model in its first fenced `yaml` block.
- **Four places mirror §1 and change together**: `guide/11-check-a-model.html#protocol`, the home
  page's prompt block, the three "Try It Yourself" cards, and `try-it-yourself.html`.
- **§3.7 is the Application Dictionary**: what `sys_table`, `sys_column`, `sys_window`, `sys_tab` and
  `sys_field` the generator writes from a model, which reference type a column gets (and so which
  control), and which column identifies a record in a lookup. Three habits are **mandatory and
  checked** — `fk: true` on every reference (`EML119`), an `enum` on every closed vocabulary
  (`EML146`), and `help` that says something on every entity and column (`EML151`–`EML153`). They are
  *warnings* only because the generator does not refuse them, so §3.7 says plainly that they must be
  cleared, and `audit-model.mjs` fails while any stands.
- **§3.7's derivations are checked against the generator that builds the application.**
  `check-spec.mjs` generates probe models with `assets/js/appwithai-loco.js` and reads
  `backend/seed/dictionary.sql` — the rows the running application reads — so the reference and
  identifier tables in §3.7 are checked promises, not prose.
- **§5.2 says a drawn transition is the only legal move.** The generated backend refuses a status
  write along an edge the state machine never drew, for every caller including the administrator,
  and `sys_transition_access` decides which roles may take each drawn edge.
- **§6 is access control**: name the roles a business has, then give every entity an `rbac` `read`
  entry naming the roles that work with it. `read` is the only operation that changes what a role
  *sees*; every other one refuses a write.
- **§7 documents `reports`**, which the validator checks (`EML290`–`EML296`, a single read-only
  statement) and the reporting pack turns into saved queries, reports and charts.
- **§8 is the validator contract**: the module's URL and API, the severities and code bands, the
  **eight** auto-repairs (the set `fix` applies — `check-spec.mjs` parses it out of the bundle and
  fails on any difference), the running ladder (§8.4), and the audit (§8.5).
- **Every complete model in a fenced `yaml` block validates with zero errors and zero warnings.** The
  file's header claims it, so it has to stay true.
- **Verify after every edit with `node scripts/check-spec.mjs`.** It validates every complete-model
  fence in all four documents, re-tests every claim the prose makes — types, flags, cardinalities,
  hook events, actions, step types, state-machine codes, `rbac`, enums and indexes — against
  `model-yaml.js`, checks §3.7 against the Loco generator, runs both runners for their exit codes and
  verdict line, and checks the enhancement editions and the host spelling. It exits non-zero on any
  contradiction. No dependencies; Node only.

## `llmdetailed.txt` — the enterprise path, and it *is* a copy

It is a **straight copy of `website/llmtext/llmdetailed.txt`** in `app-with-ai-rust`, which is built
there from the platform's sources. Re-copy it when it changes; do not edit it here.

- **It is the whole system**: the model language, the generator, the templates and the generated
  Loco.rs application. That is deliberate — its reader is a model that will be asked about the
  system, not only asked to emit a file.
- **§10 is why the site publishes it**: the *interactive* authoring protocol — seven phases separated
  by approval gates, the entities walked one at a time, the `.eml.yaml` built on disk as the
  walkthrough runs. `llms-full.txt` §1 is the batch one. **The page must quote §10, not §1.**
- **`check-spec.mjs` audits its tooling claims**: every `EML` code §10 cites is one the validator
  emits, the auto-repair table matches `fix` exactly, the runners' flags and exit codes are real,
  every rung of its ladder names a file this site serves, and its instructions match the viewer.
- **`guide/models/dance-studio.eml.yaml` is §10's worked example** — nine entities, two state
  machines, a saga that promotes a waitlisted member; 0 errors, 0 warnings, 22/22. The hospital model
  is the larger one. **Run the audit on a model before publishing it**, not only the validator.

## CI/CD Pipeline

Two workflows. `tests.yml` gates a pull request; `static.yml` deploys `main`.

### `.github/workflows/tests.yml` — the checks

Node only, no install step: this repository has no `package.json` and its scripts have no
dependencies.

| Step | What it holds |
|---|---|
| `node scripts/check-spec.mjs` | The four protocol documents, against `model-yaml.js` and the Loco generator |
| `node guide/check-model.mjs` on each model | Every published model, through the runner §8.4 tells a language model to use |
| `node guide/audit-model.mjs` on each model | The same six through the checklist audit — every one scores 22/22 |
| the audit on a bare model | It has to still bite: a bare entity passes the validator and must fail the audit |
| `node scripts/build-standalone-checker.mjs --check`, and a standalone run | The one-file validator is current, runs alone, and agrees with the runners it carries |
| `node scripts/build-validator-source-page.mjs --check` | The page-carried copies match the files they carry |
| `node scripts/check-validator-source-pages.mjs` | …and decode back to those bytes, hash correctly, and *run* |
| `node scripts/website-e2e.mjs` | **The website end-to-end tests** — below |

**`scripts/website-e2e.mjs` exists because pages drifted from the things they describe.** A page
claimed the hospital model had 28 entities when it had 30; the home page said the CRM generates 403
files when it generates 526. It asserts nothing by hand: every figure is measured with the bundles
this site serves, so a disagreement means the page is stale.

1. every published model validates clean through `guide/model-yaml.js`;
2. every figure a page states about a model equals the model's — entities, state machines, sagas,
   rules, hooks, declared roles, access restrictions and reports;
3. every example a page offers is one chapter 09 can select, and every `BUILT_IN` key has a card;
4. the deployable application: `appwithai-loco.js` with `loco-assets.json` writes the whole project
   from the CRM — `backend/Cargo.toml` and `Cargo.lock`, the front end, compose, README, the model
   byte for byte, executable runner scripts, line items kept off the dashboard — and the file counts
   on the home page and in chapter 04 equal what it writes;
5. every published model explains itself and puts its line items where they belong;
6. the reporting side chapter 09 shows: the tables each role reads and the reports it is offered,
   against the pack the served bundle derives, and every table the pack names exists in the
   generated migration;
7. the four prompts on `try-it-yourself.html` — each pair identical below its first line, each first
   line naming the document and section it should;
8. the Model Assistant's promises about the key, the protocol and its egress.

Run it locally with `node scripts/website-e2e.mjs`, or `--verbose` for every assertion.

### `.github/workflows/static.yml` — the deploy

On push to `main` (or manual dispatch): checkout, configure-pages, upload the repository as the
artifact, deploy-pages. Concurrency is `group: pages` with **`cancel-in-progress: false`** — a running
deploy finishes, and only the most recent queued run follows it.

## Product Context

**AppWithAI** generates full-stack business applications from a description, through a pipeline:

1. Domain Analysis Agent (Mastra.ai, on any OpenAI-compatible model endpoint)
2. Human-in-the-Loop review of the proposed entities and relationships
3. The approved model written as one YAML document, and validated
4. Application Dictionary generation (`sys_*` tables)
5. Code generation (Handlebars templates, in TypeScript and in Rust, held byte for byte equal)

**The generated application:** a Loco.rs (Rust) backend crate — Axum, SeaORM and sqlx, JWT sign-in
with argon2 password hashes, GoRules zen-engine for rules, three authorization gates, an OpenAPI
document — and a TanStack Start + Astryx front end (React 19), over PostgreSQL. It ships cargo and
bun test suites, Docker configuration, and the model it came from.

**Its reporting twin:** `enterprise_reporting_rust`, a Loco.rs backend with a TanStack Start front
end, loaded with a reporting pack derived from the same model — one reporting role per `rbac` role.
