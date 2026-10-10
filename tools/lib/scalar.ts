/**
 * Writing one YAML scalar into a file by hand.
 *
 * A text is written plain only when every reader takes it back as that same
 * text: YAML 1.2 (the generators) must parse it to itself, and it must not be
 * one of the words YAML 1.1 readers turn into a boolean or a null (`ON`, `no`,
 * `~`), nor carry a character that starts or ends a token in a flow collection.
 * Anything else is quoted.
 */

import { parse } from "yaml";

const YAML11_SPECIAL =
  /^(?:y|Y|yes|Yes|YES|n|N|no|No|NO|true|True|TRUE|false|False|FALSE|on|On|ON|off|Off|OFF|null|Null|NULL|~)$/;
const FLOW_UNSAFE = /[,[\]{}#&*!|>'"%@`]|: |^[-?:]|\s$|^\s|^$/;
const NUMERIC_OR_DATE =
  /^[-+]?(?:\d[\d_]*(?:\.\d*)?(?:[eE][-+]?\d+)?|\.\d+|0[xob][\da-fA-F_]+|\d+(?::[0-5]?\d)+(?:\.\d*)?|\d{4}-\d\d?-\d\d?.*)$/;

export function isPlainSafe(text: string): boolean {
  if (YAML11_SPECIAL.test(text) || FLOW_UNSAFE.test(text) || NUMERIC_OR_DATE.test(text))
    return false;
  try {
    return parse(text) === text;
  } catch {
    return false;
  }
}

/** The text as a flow-context scalar: plain when safe, single-quoted otherwise. */
export function flowScalar(text: string): string {
  return isPlainSafe(text) ? text : `'${text.replaceAll("'", "''")}'`;
}

/**
 * Whether a text can stand plain as a block-mapping value. Commas and brackets
 * are ordinary characters there; what is not: a `: ` or ` #` inside it, and
 * anything a YAML 1.1 or 1.2 reader would take for another type.
 */
export function isBlockPlainSafe(text: string): boolean {
  if (YAML11_SPECIAL.test(text) || NUMERIC_OR_DATE.test(text)) return false;
  if (text.includes(": ") || text.includes(" #") || /^\s|\s$/.test(text)) return false;
  try {
    return parse(text) === text;
  } catch {
    return false;
  }
}
