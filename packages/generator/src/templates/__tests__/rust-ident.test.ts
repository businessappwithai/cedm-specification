/**
 * A column named with a Rust keyword is written as a raw identifier.
 *
 * `HandlingUnit.type` rendered `pub type: String` in the inventory application's
 * SeaORM entity, which is a syntax error: the crate did not compile, and
 * rustfmt could not format it either. `rust_ident` in
 * crates/appwithai-gen/src/templates.rs must agree; the parity corpus carries
 * inventory to hold the two together.
 */

import Handlebars from "handlebars";
import { describe, expect, it } from "vitest";
import { TemplateLoader } from "../loader";

describe("rustIdent", () => {
  new TemplateLoader(".");
  const render = (name: string) => Handlebars.compile("{{rustIdent n}}")({ n: name });

  it("raw-quotes reserved words and leaves every other name alone", () => {
    expect(render("type")).toBe("r#type");
    expect(render("match")).toBe("r#match");
    expect(render("async")).toBe("r#async");
    expect(render("name")).toBe("name");
    expect(render("type_code")).toBe("type_code");
  });
});
