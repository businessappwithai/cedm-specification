/**
 * Where a generated application listens, and how the tool hands ports out.
 *
 * A generated app binds two ports: the Loco backend on the project's `port`,
 * and the TanStack frontend on `port + 1`. That derivation lives in the
 * generator — `generate-application.ts` passes `frontendPort: settings
 * .frontendPort ?? port + 1` — and `__tests__/generated-ports.test.ts` pins the
 * constant below to it, so the pair cannot drift apart silently.
 *
 * The base is 4000 rather than the generator's own default of 3000 because the
 * modelling tool occupies 3000, and its Mastra service 4111. A generated app
 * started from the CLI can have 3000; one this tool assigns a port to must not.
 *
 * These are restated here rather than imported because this module is used by
 * client components and `@appwithai/generator` is server-only in this app's
 * bundling setup.
 */

/**
 * The project's `port`: what the Loco backend binds, and the base of the pair.
 *
 * Named for the backend rather than "the app" because that is what the
 * generator does with it — a project on 4000 serves its API there, and the
 * screen someone opens is the frontend on 4001. The two were named the other
 * way round here for one commit, which is precisely the kind of lie that
 * produces a wrong URL in a document six months later.
 */
export const DEFAULT_BACKEND_PORT = 4000;

/** `port + 1`: the TanStack frontend, and the address someone opens. */
export const DEFAULT_FRONTEND_PORT = 4001;

/**
 * Every project needs two adjacent ports, not one.
 *
 * Allocating one port per project and letting the API take `port + 1` meant
 * consecutive projects overlapped: project A's API and project B's app were
 * both 4002, and whichever started second failed to bind. Stepping by two
 * hands each project a pair it owns outright.
 */
export const PORTS_PER_PROJECT = 2;

/**
 * The next free backend port, given the ports already handed out.
 *
 * Returns the project's `port` — what the backend binds. The frontend is that
 * plus one, and both are reserved.
 */
export function nextAvailableBackendPort(usedPorts: Array<number | undefined | null>): number {
  const taken = new Set(usedPorts.filter((port): port is number => typeof port === "number"));
  let candidate = DEFAULT_BACKEND_PORT;
  // A project already on 4000 also occupies 4001, so a pair is free only when
  // neither of its ports has been claimed by an earlier project.
  while (taken.has(candidate) || taken.has(candidate + 1)) {
    candidate += PORTS_PER_PROJECT;
  }
  return candidate;
}
