#!/usr/bin/env bun
/**
 * Run the Messages recorder as a process, for a gateway under test.
 *
 *   bun tests/support/recorder-cli.ts --port 3997 [--call '{"name":"search_records","input":{"entity":"Account"}}']
 *
 * Every turn's first step makes the scripted tool call (when given); the step
 * after its result closes the turn with a short text. Each request is printed
 * as one JSON line on stdout.
 */
import { startMessagesRecorder } from "./messages-recorder";

const arg = (name: string) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 ? process.argv[at + 1] : undefined;
};
const port = Number(arg("port") ?? "3997");
const call = arg("call") ? (JSON.parse(arg("call")!) as { name: string; input: Record<string, unknown> }) : null;

const recorder = startMessagesRecorder(port, {
  // One call per turn: the first step makes it, the step after its result closes.
  toolCall: (request) =>
    request.toolNames.length > 0 && call && request.turnResults.length === 0 ? call : null,
  text: (request) => (request.toolResults.length > 0 ? `Tool answered: ${request.toolResults[0]!.slice(0, 200)}` : "Recorded."),
});
const seen = new Set<object>();
setInterval(() => {
  for (const request of recorder.requests) {
    if (seen.has(request)) continue;
    seen.add(request);
    console.log(JSON.stringify(request));
  }
}, 200);
console.error(`messages recorder on ${recorder.url}`);
