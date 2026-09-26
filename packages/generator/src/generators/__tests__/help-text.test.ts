/**
 * Regression: the model's own help text never reached the running application.
 *
 * `%%entity <E> help:` and `%%field <E>.<c> help:` are the only place a model
 * says what something is *for* rather than what shape it is, and the parser has
 * hung both on the entity and the attribute since the directives were read.
 * Only one of them landed. `sys_table.description` carried the entity's
 * sentence; `sys_column.description` was never written at all, and
 * `sys_field.help` — which is what the generated form renders under the control
 * — was composed *entirely* from the column's shape.
 *
 * So a model with a paragraph on every column produced an application that
 * said "The Member of this Booking. Required — the record cannot be saved while
 * this is empty." over a column the author had described in a sentence about
 * the studio's insurance.
 *
 * It was invisible from the generator: the manual renders from the parsed model
 * directly and read perfectly, while the application it shipped beside carried
 * none of the same prose.
 *
 * The composed facts are kept — "required" and "must be unique" are things the
 * author's sentence does not carry — so what is held here is that the author's
 * words come first and the derived *sentence* gives way to them.
 */

import { declaredEntityNames, entityToBusEntity } from "@appwithai/core/types";
import { describe, expect, it } from "vitest";
import { parseModel } from "../../pipeline/parse-model";
import { buildDictionaryHelp } from "../dictionary-help";

const MODEL = `
%%meta name: Acme Dance Studio
%%meta description: Bookings, class packs and waitlists for a single dance studio.
erDiagram
    Member {
        string id PK
        string full_name
        string email
    }
    Booking {
        string id PK
        string member_id FK
        string status
    }
    Member ||--o{ Booking : "holds"

%%entity Booking help: One member's place in one session.
%%field Booking.member_id help: Who holds the place. A booking may not be transferred between members; the studio's insurance names the attendee.
%%field Booking.status help: Where the place is in its life: held, attended, cancelled or forfeited.
`;

function help() {
  const model = parseModel(MODEL);
  const declared = declaredEntityNames(model.entities);
  return {
    model,
    dictionary: buildDictionaryHelp(model.entities.map((e) => entityToBusEntity(e, declared))),
  };
}

describe("the model's own help text", () => {
  it("reaches the attribute the parser hung it on", () => {
    const { model } = help();
    const booking = model.entities.find((e) => e.name === "Booking");
    const member = booking?.attributes.find((a) => a.name === "member_id");
    expect(member?.description).toContain("the studio's insurance names the attendee");
    expect(booking?.description).toBe("One member's place in one session.");
  });

  it("is what sys_field.help leads with, not the composed sentence", () => {
    const fields = help().dictionary.bus_booking?.fields ?? {};
    expect(fields.member_id?.startsWith("Who holds the place.")).toBe(true);
    // The derived sentence for a lookup is dropped rather than appended after
    // the author's, which would restate the column's shape underneath it.
    expect(fields.member_id).not.toContain("Links this Booking to");
  });

  it("keeps the facts the author's sentence does not carry", () => {
    const fields = help().dictionary.bus_booking?.fields ?? {};
    expect(fields.member_id).toContain("Required");
  });

  it("leaves a column the model says nothing about composed as before", () => {
    const fields = help().dictionary.bus_member?.fields ?? {};
    expect(fields.full_name).toBeTruthy();
    expect(fields.full_name).not.toContain("undefined");
  });

  it("reads %%meta description: off the document", () => {
    expect(help().model.description).toBe(
      "Bookings, class packs and waitlists for a single dance studio."
    );
  });
});
