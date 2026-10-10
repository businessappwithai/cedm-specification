/** How a tool reports a failure it did not expect: one line naming it, exit 2. */

/**
 * Exit 2 with the first line of `error`'s message; 1 is reserved for "findings".
 * It takes the error alone, so it can be handed to `process.on` as it is (the
 * listener's second argument is the event's origin, not anything to print).
 */
export function reportFailure(error: unknown): never {
  const tool = process.argv[1]?.split("/").pop() ?? "tool";
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${tool}: ${message.split("\n")[0]}`);
  process.exit(2);
}
