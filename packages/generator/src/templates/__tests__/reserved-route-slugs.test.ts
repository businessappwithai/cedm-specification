import { describe, expect, it } from "vitest";
import { RESERVED_ROUTE_SLUGS } from "../../generators/tanstack-astryx-loco/tanstack-start-frontend.generator";

describe("reserved route slugs", () => {
  it("covers the file names TanStack Router treats specially", () => {
    for (const slug of ["route", "index", "__root", "lazy"]) {
      expect(RESERVED_ROUTE_SLUGS.has(slug)).toBe(true);
    }
  });
});
