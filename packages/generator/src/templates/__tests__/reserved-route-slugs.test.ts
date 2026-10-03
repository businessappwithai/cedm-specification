import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { describe, expect, it } from "vitest";
import {
  TanStackStartFrontendGenerator,
  isReservedRouteSlug,
  templateRouteNames,
} from "../../generators/tanstack-astryx-loco/tanstack-start-frontend.generator";

const routesDir = path.join(__dirname, "../../../templates/tanstack-astryx-loco/frontend/src/routes");

describe("reserved route slugs", () => {
  it("follows the router's file convention without a list to extend", async () => {
    const names = await templateRouteNames(routesDir);
    for (const slug of ["route", "index", "__root", "lazy", "_layout", "-ignored", "(group)", "a.b"]) {
      expect(isReservedRouteSlug(slug, names)).toBe(true);
    }
    expect(isReservedRouteSlug("compound", names)).toBe(false);
  });

  it("reads every top-level route the template ships", async () => {
    const names = await templateRouteNames(routesDir);
    for (const slug of ["admin", "auth", "api", "ask", "dashboard", "reports"]) {
      expect(names.has(slug)).toBe(true);
      expect(isReservedRouteSlug(slug, names)).toBe(true);
    }
  });

  it("removes only its own stale per-entity files", async () => {
    const out = await fs.mkdtemp(path.join(os.tmpdir(), "stale-routes-"));
    const routes = path.join(out, "src/routes");
    await fs.mkdir(routes, { recursive: true });
    const marked = "// Generated thin wrapper — replace\n";
    await fs.writeFile(path.join(routes, "route.tsx"), marked);
    await fs.writeFile(path.join(routes, "route.$id.tsx"), marked);
    await fs.writeFile(path.join(routes, "gone.tsx"), marked);
    await fs.writeFile(path.join(routes, "kept.tsx"), marked);
    await fs.writeFile(path.join(routes, "handmade.tsx"), "// mine\n");
    const generator = new TanStackStartFrontendGenerator({} as any);
    await (generator as any).removeStaleEntityRoutes(out, { entities: [{ name: "Kept" }] });
    expect((await fs.readdir(routes)).sort()).toEqual(["handmade.tsx", "kept.tsx"]);
  });
});
