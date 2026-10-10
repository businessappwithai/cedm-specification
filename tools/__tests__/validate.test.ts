/**
 * The validator against the library as it is, and against copies of it with
 * one defect planted each — every rule is shown to fire on the defect it names.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { type Scratch, scratch } from "./scratch";

/** One validation of the whole library takes several seconds. */
const SLOW = 60_000;
const ACCOUNT = "domain/entities/account.yaml";
const FEE = "domain/entities/fee.yaml";

describe("tools/validate.ts", () => {
  let lib: Scratch;
  beforeAll(() => {
    lib = scratch();
  });
  afterAll(() => lib.remove());

  /** Plant a defect, validate, put the file back. */
  const withDefect = (file: string, from: string, to: string) => {
    const original = lib.read(file);
    lib.edit(file, from, to);
    try {
      return lib.run("tools/validate.ts");
    } finally {
      lib.write(file, original);
    }
  };

  test(
    "the library as it is passes with no warnings",
    () => {
      const { code, out } = lib.run("tools/validate.ts");
      expect(out).toContain("PASSED: 0 errors, 0 warning(s)");
      expect(code).toBe(0);
    },
    SLOW
  );

  const cases: Array<[rule: string, file: string, from: string, to: string, expected: string]> = [
    [
      "DICT-001 unknown icon",
      ACCOUNT,
      "icon: landmark",
      "icon: flask",
      "DICT-001 ui.icon 'flask' is not a lucide 0.312 icon",
    ],
    [
      "DICT-004 unknown help key",
      ACCOUNT,
      "  help:\n    summary:",
      "  help:\n    bogusKey: x\n    summary:",
      "DICT-004 unknown help key 'bogusKey'",
    ],
    [
      "BL-003 transition to an undeclared state",
      ACCOUNT,
      "{from: ACTIVE, to: INACTIVE, action: deactivate}",
      "{from: ACTIVE, to: NOWHERE, action: deactivate}",
      "BL-003 transition ACTIVE→NOWHERE",
    ],
    [
      "BL-004 terminal state with a way out",
      ACCOUNT,
      "      - {from: INACTIVE, to: RETIRED, action: retire}",
      "      - {from: INACTIVE, to: RETIRED, action: retire}\n      - {from: RETIRED, to: ACTIVE, action: reopen}",
      "BL-004 terminal state RETIRED has an outgoing transition",
    ],
    [
      "BL-008 unknown column in violatedWhen",
      ACCOUNT,
      "      rule: account hierarchy must not contain cycles.",
      '      rule: account hierarchy must not contain cycles.\n    - {id: ACCOUNT-T1, rule: r, violatedWhen: "no_such_column != null", message: m}',
      "BL-008 violatedWhen names 'no_such_column'",
    ],
    [
      "BL-013 workflow sets a column the target lacks",
      FEE,
      '              priority: "NORMAL"',
      '              priority: "NORMAL"\n              colour: "RED"',
      "BL-013 sets 'colour', which is not a column of Task",
    ],
    [
      "BL-013 workflow sets an enum to a value it does not have",
      FEE,
      '              priority: "NORMAL"',
      '              priority: "URGENT"',
      "BL-013 sets Task.priority to 'URGENT'",
    ],
    [
      "BL-013 workflow reads a column the record lacks",
      FEE,
      "Fee {{id}} is now {{status}}.",
      "Fee {{id}} is now {{state}}.",
      "BL-013 description reads {{state}}",
    ],
    [
      "BL-013 when names a column the record lacks",
      FEE,
      "status != _previous_status",
      "status != _previous_stage",
      "BL-013 when names '_previous_stage'",
    ],
    [
      "BL-013 unknown step type",
      FEE,
      "          type: CreateEntity",
      "          type: SendEmail",
      "BL-013 step type 'SendEmail'",
    ],
    [
      "self-reference with no acyclic invariant",
      ACCOUNT,
      "      rule: account hierarchy must not contain cycles.",
      "      rule: account hierarchy is managed by finance.",
      "Account.parentAccount: self-reference needs an invariant",
    ],
    [
      "text split at a comma by a flow mapping",
      ACCOUNT,
      "  invariants:\n",
      "  invariants:\n    - {id: ACCOUNT-T2, rule: one, two, three}\n",
      "has text split at a comma",
    ],
    [
      "duplicate key",
      ACCOUNT,
      "  ui:\n    icon: landmark",
      "  ui:\n    icon: landmark\n    icon: table",
      "invalid YAML",
    ],
    [
      "REF-001 a reference row repeated",
      "domain/reference-data/currency.yaml",
      '    - {"code": "AED"',
      '    - {"code": "AFN"',
      "REF-001 code 'AFN' appears twice",
    ],
  ];
  for (const [rule, file, from, to, expected] of cases) {
    test(
      rule,
      () => {
        const { code, out } = withDefect(file, from, to);
        expect(out).toContain(expected);
        expect(code).toBe(1);
      },
      SLOW
    );
  }

  test(
    "BL-014: an application that records transactions runs a workflow",
    () => {
      const file = "domain/entities/meter-reading.yaml";
      const original = lib.read(file);
      lib.write(file, original.replace(/\n {2}workflows:\n[\s\S]*?(?=\n {2}help:)/, ""));
      try {
        const { out } = lib.run("tools/validate.ts");
        expect(out).toContain("energy: BL-014 records transactions (MeterReading)");
      } finally {
        lib.write(file, original);
      }
    },
    SLOW
  );

  test(
    "an entity file is named for its entity",
    () => {
      const original = lib.read(ACCOUNT);
      lib.write("domain/entities/ledger-account.yaml", original);
      lib.write(ACCOUNT, "");
      try {
        const { out } = lib.run("tools/validate.ts");
        expect(out).toContain(
          "Account: file is ledger-account.yaml; an entity named Account lives in account.yaml"
        );
      } finally {
        Bun.spawnSync(["rm", "-f", `${lib.root}/domain/entities/ledger-account.yaml`]);
        lib.write(ACCOUNT, original);
      }
    },
    SLOW
  );

  test(
    "the registry and the files agree",
    () => {
      const { out } = withDefect(
        "domain/entities/index.yaml",
        "    - Account\n",
        "    - Account\n    - PhantomEntity\n"
      );
      expect(out).toContain("Registry entity has no entity file: PhantomEntity");
    },
    SLOW
  );

  test(
    "ENUM-002: a stale enumeration registry",
    () => {
      const { out } = withDefect("domain/enumerations/index.yaml", "  count: ", "  count: 1");
      expect(out).toContain("ENUM-002 domain/enumerations/index.yaml is stale");
    },
    SLOW
  );
});
