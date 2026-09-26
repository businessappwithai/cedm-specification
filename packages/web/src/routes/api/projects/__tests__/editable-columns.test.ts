/**
 * A PATCH must not be able to write whatever it likes.
 *
 * The handler spread the request body straight into the UPDATE, so a caller
 * with write access could set `owner_user_id` and take the project, or set
 * `is_deleted` and remove it from every listing.
 */

import { describe, expect, it } from "vitest";
import { editableProjectColumns, EDITABLE_PROJECT_COLUMNS } from "../$id/index";

describe("editableProjectColumns", () => {
  it("drops a column that is not on the list", () => {
    const update = editableProjectColumns({
      name: "Renamed",
      owner_user_id: "attacker",
      ownerId: "attacker",
      is_deleted: true,
      id: "another-project",
    });
    expect(update).toEqual({ name: "Renamed" });
  });

  it("maps camelCase to the database's column name", () => {
    // The client sends `generatedPath`; the column is `generated_path`. A
    // spread wrote a key no column matched, so the write was a silent no-op.
    expect(editableProjectColumns({ generatedPath: "/tmp/out" })).toEqual({
      generated_path: "/tmp/out",
    });
  });

  it("accepts a caller already speaking snake_case", () => {
    expect(editableProjectColumns({ deployment_status: "completed" })).toEqual({
      deployment_status: "completed",
    });
  });

  it("returns nothing for a body with no editable field", () => {
    expect(editableProjectColumns({ nonsense: 1 })).toEqual({});
  });

  it("never lists ownership or deletion as editable", () => {
    const columns = Object.values(EDITABLE_PROJECT_COLUMNS);
    for (const forbidden of ["id", "owner_user_id", "is_deleted", "created_at"]) {
      expect(columns).not.toContain(forbidden);
    }
  });
});
