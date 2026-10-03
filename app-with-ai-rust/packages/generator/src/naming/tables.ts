/**
 * What an entity's table is called — for the reporting pack.
 *
 * The pack writes SQL against the generated application's `bus_` tables, so it
 * has to name them exactly as the Loco backend's `m0002_bus_tables` migration
 * creates them. That migration renders `BusEntity.tableName`, which
 * `entityToBusEntity` derives from the parser's `entity.tableName`; this
 * delegates to the same function rather than restating the rule, because a
 * second snake-casing is how a report comes to query `bus_k_y_c_record` while
 * the database holds `bus_kyc_record`.
 *
 * The sibling (`app-with-ai-tanstack`) keeps its own copy of this rule here,
 * shared with its browser stack. That stack does not exist in this repository,
 * so the one reader that matters is the migration, and the answer is taken
 * from where the migration takes it.
 */

import { type Entity, entityToBusEntity } from "@appwithai/core/types";

/** `Order` -> `bus_order`, leaving an already-prefixed name alone. */
export function tableNameFor(entity: Entity): string {
  if (entity.tableName?.startsWith("sys_")) return entity.tableName;
  return entityToBusEntity(entity).tableName;
}
