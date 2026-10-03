/**
 * An automation definition arriving in a request: accepted only once it reads
 * as an automation document. A stored row that cannot be opened is worse than
 * a refused request — the screen would show it empty, and saving that would
 * overwrite whatever it was meant to hold.
 */

import { AutomationDocumentError, automationFromYaml } from "./yaml";

/** The definition if it reads, otherwise the response refusing it, naming why. */
export async function readDefinition(definition: unknown): Promise<string | Response> {
  const refuse = (error: string, status: number) =>
    new Response(JSON.stringify({ error }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  if (typeof definition !== "string" || !definition.trim())
    return refuse("An automation needs its YAML document (`definition`).", 400);
  try {
    automationFromYaml(definition);
    return definition;
  } catch (error) {
    if (error instanceof AutomationDocumentError) return refuse(error.message, 422);
    throw error;
  }
}
