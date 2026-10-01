/**
 * Table — shadcn surface over Astryx's table parts.
 *
 * Astryx ships two tables: a data-driven `Table` that takes `columns` + `data`
 * and renders everything itself, and the composable parts it builds that from.
 * This uses the parts, because the shadcn surface *is* a composition —
 * `<Table><TableHeader><TableRow><TableHead>` — and the admin screens that call
 * it interleave their own cells, checkboxes and row actions. Routing them
 * through the data-driven component would mean rewriting every call site.
 *
 * The parts are a near-exact match: `TableHeaderCell` is `TableHead` under a
 * different name, and the rest line up one to one.
 *
 * `Table` supplies `TableContext` so density, dividers, striping and hover come
 * from the theme rather than from Tailwind classes. Astryx's parts tolerate a
 * missing context and fall back to bare elements, so the provider is what
 * actually buys the styling.
 */
import { forwardRef, type ReactNode } from "react";
import {
  TableBody as AstryxBody,
  TableCell as AstryxCell,
  TableFooter as AstryxFooter,
  TableHeader as AstryxHeader,
  TableHeaderCell as AstryxHeaderCell,
  TableRow as AstryxRow,
  TableContext,
} from "@astryxdesign/core/Table";

/** Matches the defaults of Astryx's own `Table`. */
const TABLE_CONTEXT = {
  density: "balanced",
  dividers: "rows",
  isStriped: false,
  // The shadcn table hovers rows; keeping that on preserves the affordance the
  // admin grids rely on to show a row is clickable.
  hasHover: true,
  verticalAlign: "middle",
  textOverflow: "wrap",
} as const;

interface PartProps {
  children?: ReactNode;
  className?: string;
}

// Style objects live at module scope rather than inline in JSX. An inline
// style prop opens with two braces, which Handlebars reads as the start of an
// expression and refuses to render — so this is a hard constraint on every
// template in this directory, not a preference. They are constants, so module
// scope is where they belong anyway.
const SCROLL_WRAPPER: React.CSSProperties = { width: "100%", overflowX: "auto" };
const FULL_WIDTH: React.CSSProperties = { width: "100%" };
/**
 * `colSpan` for a header cell.
 *
 * Astryx's `TableHeaderCellProps` extends `HTMLAttributes`, which omits the
 * table-cell-only attributes, so `colSpan` is not in the type — but the
 * component spreads its rest props straight onto the `<th>`, so it works at
 * runtime. This is where that gap is bridged, once and visibly, rather than
 * with a cast at each call site or by dropping a spanning header on the floor.
 */
function spanAttrs(colSpan?: number): Record<string, unknown> {
  return colSpan === undefined ? {} : { colSpan };
}

/** A sortable header reads as its cell, not as a button. */
const SORT_TRIGGER: React.CSSProperties = {
  all: "unset",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
};

export const Table = forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, children, ...props }, ref) => (
    <TableContext.Provider value={TABLE_CONTEXT}>
      {/* Wide grids must scroll inside the table, not push the page sideways. */}
      <div style={SCROLL_WRAPPER}>
        <table ref={ref} className={className} style={FULL_WIDTH} {...props}>
          {children}
        </table>
      </div>
    </TableContext.Provider>
  )
);
Table.displayName = "Table";

export function TableHeader({ children, className }: PartProps) {
  return <AstryxHeader className={className}>{children}</AstryxHeader>;
}

export function TableBody({ children, className }: PartProps) {
  return <AstryxBody className={className}>{children}</AstryxBody>;
}

export function TableFooter({ children, className }: PartProps) {
  return <AstryxFooter className={className}>{children}</AstryxFooter>;
}

export interface TableRowProps extends PartProps {
  onClick?: () => void;
  /**
   * Radix's selected marker. Typed to include `false` because the call sites
   * write `data-state={isSelected && "selected"}` — a falsy value is how they
   * say "not selected", and React omits the attribute for it.
   */
  "data-state"?: string | false;
}

export function TableRow({ children, className, ...props }: TableRowProps) {
  return (
    <AstryxRow className={className} {...props}>
      {children}
    </AstryxRow>
  );
}

/**
 * shadcn's `TableHead` is Astryx's `TableHeaderCell`.
 *
 * `onClick` is accepted because the sortable grids attach it to header cells,
 * but Astryx's props do not include it, so it is applied to a wrapper rather
 * than spread onto the cell — spreading it would not typecheck, and dropping
 * it would silently break column sorting.
 */
export function TableHead({
  children,
  className,
  colSpan,
  scope = "col",
  onClick,
}: PartProps & { colSpan?: number; scope?: "col" | "row"; onClick?: () => void }) {
  return (
    <AstryxHeaderCell className={className} scope={scope} {...spanAttrs(colSpan)}>
      {onClick ? (
        <button type="button" onClick={onClick} style={SORT_TRIGGER}>
          {children}
        </button>
      ) : (
        children
      )}
    </AstryxHeaderCell>
  );
}

export function TableCell({
  children,
  className,
  colSpan,
  rowSpan,
  ...props
}: PartProps & { colSpan?: number; rowSpan?: number }) {
  return (
    <AstryxCell className={className} colSpan={colSpan} rowSpan={rowSpan} {...props}>
      {children}
    </AstryxCell>
  );
}

/** shadcn exports a `<caption>` helper; Astryx has no equivalent part. */
export function TableCaption({ children, className }: PartProps) {
  return <caption className={className}>{children}</caption>;
}

export default Table;
