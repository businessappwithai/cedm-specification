#!/usr/bin/env bun
/**
 * Set scalars on one attribute of an entity.
 *
 *     bun tools/attr-set.ts BankLoan status default=APPLICATION
 *     bun tools/attr-set.ts Invoice number maxLength=40 required=true
 *
 * A value is read as YAML, so `maxLength=40` is a number, `required=true` a
 * boolean and `default=APPLICATION` text; quote it (`default='40'`) for text
 * that would read as something else. Only scalars: a mapping or a list is
 * refused, because this tool edits one field and nothing nested.
 */

import "./lib/cli";
import { parse } from "yaml";
import { fail, itemNamed, openEntityByName } from "./lib/edit";
import { writeDocument } from "./lib/yaml";

const [name, attribute, ...pairs] = process.argv.slice(2);
if (!name || !attribute || !pairs.length)
  fail("usage: bun tools/attr-set.ts Entity attribute key=value ...");

const { path, document, entity } = openEntityByName(name);
const attr = itemNamed(entity, "attributes", attribute);
if (!attr) fail(`${name} has no attribute ${attribute}`);
for (const pair of pairs) {
  const at = pair.indexOf("=");
  if (at < 1) fail(`${pair}: expected key=value`);
  const key = pair.slice(0, at);
  const value = parse(pair.slice(at + 1));
  if (value !== null && typeof value === "object") fail(`${pair}: only a scalar can be set`);
  attr.set(key, value);
}
writeDocument(path, document);
console.log(`${name}.${attribute}: ${pairs.join(" ")}`);
