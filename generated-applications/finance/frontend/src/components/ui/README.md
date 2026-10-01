# `components/ui` — Astryx adapters (frontend Phase B, complete)

These files replace the shadcn/Radix primitives of the `tanstackjs-nestjs`
stack. They deliberately **keep the shadcn prop surface** and re-implement it on
top of `@astryxdesign/core`, rather than exposing Astryx's own API directly.

Every primitive is converted — nothing under `src/` imports `@radix-ui/*` any
more, so the generated `package.json` no longer ships it (nor
`class-variance-authority`, which only existed to build shadcn variant strings).
`lucide-react` stays: `icon.tsx` resolves the arbitrary icon *names* the
Application Dictionary stores in `sys_table.icon` and `sys_category.icon`, which
Astryx's 26 semantic names cannot cover.

That choice is what makes Phase B incremental. `components/admin/*`,
`components/forms/*` and `components/tables/*` — roughly 2,300 `className`
sites across 138 files — import from `@/components/ui/*` and pass shadcn props.
Swapping the implementation behind those import paths means none of them have to
change in the same commit. Astryx's own API is the better long-term target, and
Phase C is where callers move to it directly; until then these adapters absorb
the difference.

The differences they absorb are not cosmetic:

| shadcn | Astryx |
|---|---|
| `disabled` | `isDisabled` |
| children as content | `label` prop (`Badge`, `Button`, `TextInput`) |
| `onChange(event)` | `onChange(value, event)` |
| uncontrolled by default | `value` is required on inputs |
| `className` for styling | design tokens; `className` is accepted and forwarded but styles come from the theme |

Four adapters carry a difference worth knowing about before you touch them:

- **`toast.tsx`** — shadcn's `toast()` is callable from anywhere; Astryx's
  `useToast()` is a hook. A module-level queue bridges them, and `<Toaster>`
  drains it. Astryx has two toast types (`info`, `error`) against shadcn's five
  variants, so the variant's icon is prepended to the body to keep *success* and
  *warning* distinguishable.
- **`scroll-area.tsx`** — native overflow, not a component. Astryx has no
  ScrollArea because `scrollbar-width` / `scrollbar-color` made Radix's
  custom-scrollbar approach unnecessary; the native scroller also respects the
  OS "always show scrollbars" setting, which a drawn one cannot.
- **`icon.tsx`** — lucide resolves the name, Astryx renders the glyph, so colour
  and size come from the theme while dictionary-supplied names keep working.
- **`table.tsx`** — uses Astryx's composable table *parts*, not its data-driven
  `Table`, because the shadcn surface is a composition and the admin grids
  interleave their own cells and row actions.

Anything still importing `cn()` keeps working during Phase B because the
Tailwind bridge in `styles/globals.css` maps Astryx tokens onto Tailwind utility
names. Phase C removes both, and moves `components/admin/*` onto Astryx's own
API directly.
