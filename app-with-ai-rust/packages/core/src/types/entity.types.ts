export interface EntityAttribute {
  name: string;
  type: "string" | "integer" | "decimal" | "boolean" | "date" | "datetime" | "text" | "json";
  required: boolean;
  /**
   * Help text for the column, written as the attribute's `help` in the model.
   *
   * It becomes `sys_column.description`, which the generated form renders under
   * the control and the Application Dictionary shows beside the column — the
   * one place a modeller can explain a field to whoever fills it in.
   */
  description?: string;
  /**
   * The type the modeller actually wrote, when it was one of the five aliases
   * that carry a meaning the canonical type cannot: `email`, `url`, `phone`,
   * `password`, `color`. All five normalise to `string` for SQL and TypeScript,
   * and the difference between them is the whole of what the Application
   * Dictionary needs to choose a control — so the word is kept rather than the
   * column being guessed at by name later on.
   */
  semanticType?: "email" | "url" | "phone" | "password" | "color";
  unique?: boolean;
  default?: unknown;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  isForeignKey?: boolean;
  /**
   * The entity a foreign key points at, where its name does not say: a CEDM
   * reference such as `deliveryLocation → Location`, stored in the column
   * `delivery_location_id`. Absent for a column whose name resolves to its
   * target by the usual rule — which is every column a model written without
   * CEDM has — so the stored target is written only where it is needed.
   */
  references?: string;
  /**
   * Foreign-key columns of the same entity that narrow this lookup's choices,
   * most specific first: a state is narrowed by `country_id`, a city by
   * `state_province_id` then `country_id`. The lookup offers only the target rows
   * that belong to the values the record holds, and a write naming any other is
   * refused. See `specification/reference-data.yaml`.
   */
  narrowedBy?: string[];
  /** Name of the enum this column is bound to, by the attribute's `enum` key. */
  enumRef?: string;
  /** The enum's values, in declaration order. */
  enumValues?: string[];
  /**
   * sys_reference_id allocated to this column's enum. Ids from 1000 up are the
   * per-model list references — the generated forms already render anything at
   * or above 1000 as a dropdown fed by /sys/ref-list, so binding the column to
   * one is what turns a modelled enum into a select instead of a text box.
   */
  enumReferenceId?: number;
}

/** An enum the model declares, with the reference id it was given. */
export interface EntityEnum {
  name: string;
  values: string[];
  /** Allocated from 1000 up, stable for a given set of enum names. */
  referenceId: number;
  /**
   * The enumeration has a business table, an entity of the same name. Its rows
   * are the values, and the dropdown reads the table rather than a fixed list.
   */
  table?: boolean;
  /** A short label per value; absent values read as the value split into words. */
  labels?: Record<string, string>;
  /** What each value means to the business. */
  descriptions?: Record<string, string>;
}

/**
 * An index the model asked for explicitly, in the entity's `indexes`.
 *
 * Separate from the single-column indexes derived from `UK` and from a column
 * called `name`: those are conventions the generator applies, this is a request
 * the author wrote down, and it is the only way to express a composite one.
 */
export interface EntityIndex {
  /** Columns in the order given, which is the order the index is useful in. */
  columns: string[];
  unique: boolean;
}

export interface Entity {
  name: string;
  tableName: string;
  description?: string;
  attributes: EntityAttribute[];
  primaryKey: string;
  timestamps: boolean;
  /** The entity's explicit `indexes`. */
  indexes?: EntityIndex[];
  /**
   * The entity this one is a line item of, from its `parent`.
   *
   * A child is not a thing you navigate to. It has no window of its own and no
   * card on the dashboard; it appears as a tab inside its parent's window,
   * linked on the foreign key it already declared. An invoice line away from
   * its invoice is not a record anyone wants a list of.
   */
  parentEntity?: string;
  /** The child's foreign key back to `parentEntity`, resolved at parse time. */
  parentLinkColumn?: string;
  /**
   * The icon this entity is drawn with, from its `icon`.
   *
   * A lucide icon name (https://lucide.dev/icons). PascalCase, kebab-case and
   * snake_case all resolve to the same icon, so `LayoutGrid`, `layout-grid` and
   * `layout_grid` are one. A name lucide does not have is deliberately **not** a
   * diagnostic — the checker does not carry lucide's catalogue — and renders a
   * placeholder instead; `icon: flask` is the common trap, because lucide has
   * `flask-conical` and no `flask`.
   *
   * Compiled to `sys_table.icon`, which the dashboard card, the window heading
   * and the navigation all draw. An administrator may override it afterwards
   * through Table and Column, including by uploading an image — the same column
   * holds both — so the model sets the starting point, not the final answer.
   */
  icon?: string;
  /**
   * How concurrent edits of one record are reconciled, from its `concurrency`.
   *
   * Absent means `optimistic`: a save must name the version it was read at
   * (`If-Match`), and one made against a replaced version is refused with the
   * record as it now stands. `last-write-wins` accepts a save that names no
   * version. Compiled to `sys_table.concurrency_mode`, and only when declared,
   * because the column's default is `optimistic`.
   */
  concurrency?: "optimistic" | "last-write-wins";
  /**
   * Rows the application ships with (`data` of the entity document). Keys are
   * physical columns; a foreign key column holds the natural key of its target
   * row, and `key` names the column that is this entity's own natural key.
   */
  data?: { key: string; rows: Array<Record<string, string | number | boolean | null>> };
}

export interface Relationship {
  name: string;
  sourceEntity: string;
  targetEntity: string;
  cardinality: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
  foreignKey?: string;
  inverseForeignKey?: string;
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT";
  onUpdate?: "CASCADE" | "SET NULL" | "RESTRICT";
}

// EntityDefinition is an alias for Entity for service layer compatibility
export type EntityDefinition = Entity;

// Zod schema for entity validation
import { z } from "zod";

export const EntityAttributeSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "integer", "decimal", "boolean", "date", "datetime", "text", "json"]),
  required: z.boolean(),
  /** Help text for the column, from the attribute's `help`. */
  description: z.string().optional(),
  /** The alias the modeller wrote, when it decides the reference type. */
  semanticType: z.enum(["email", "url", "phone", "password", "color"]).optional(),
  unique: z.boolean().optional(),
  default: z.any().optional(),
  maxLength: z.number().optional(),
  minLength: z.number().optional(),
  pattern: z.string().optional(),
  references: z.string().optional(),
  narrowedBy: z.array(z.string()).optional(),
});

export const EntitySchema = z.object({
  name: z.string(),
  tableName: z.string(),
  description: z.string().optional(),
  attributes: z.array(EntityAttributeSchema),
  primaryKey: z.string(),
  timestamps: z.boolean(),
});
