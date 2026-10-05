/**
 * A Messages-protocol endpoint that records what the Harness sends the model.
 *
 * It stands where `DEEPSEEK_BASE_URL` points during a test, and exists for two
 * questions only a real request can answer:
 *
 * - **Which tools does the agent actually receive?** The composition gate reads
 *   the `tools` array of the request the host built — not the configuration that
 *   was supposed to produce it.
 * - **What does a host cost in memory while it works?** The load test needs
 *   hosts that run real turns, real tool calls through the gateway and real
 *   session writes; only the model's words are scripted, because 200 people's
 *   conversations cannot be bought from a provider to measure a process.
 *
 * Every reply is a protocol-correct streamed Messages response. A script may
 * ask for one `tool_use` per turn before the closing text, so a turn exercises
 * the tool path end to end.
 */

export interface RecordedRequest {
  path: string;
  model: string | undefined;
  toolNames: string[];
  system: string;
  messageCount: number;
  /** Text of every `tool_result` block in the last message: what the tools answered. */
  toolResults: string[];
  /** What the person last wrote: the latest user message that is not a tool result. */
  userText: string;
  /** Every tool result since that message, in order: this turn's steps so far. */
  turnResults: string[];
  receivedAt: number;
}

export interface RecorderScript {
  /**
   * The tool call to make on this model step, or `null` to close the turn with
   * text. Asked on every step: `turnResults` says how far the turn has got, so
   * a script can search first and then open what the search found — and must
   * return `null` once it has what it wanted, or the turn never ends.
   */
  toolCall?: (request: RecordedRequest) => { name: string; input: Record<string, unknown> } | null;
  /** The closing text of a turn. */
  text?: (request: RecordedRequest) => string;
}

export interface MessagesRecorder {
  url: string;
  requests: RecordedRequest[];
  stop(): void;
}

type Json = Record<string, unknown>;

function sse(events: Array<[string, Json]>): string {
  return events.map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join("");
}

function systemText(system: unknown): string {
  if (typeof system === "string") return system;
  if (Array.isArray(system)) {
    return system
      .map((block) => (block && typeof block === "object" && "text" in block ? String(block.text) : ""))
      .join("\n");
  }
  return "";
}

function resultTexts(message: Json | undefined): string[] {
  if (!message || !Array.isArray(message.content)) return [];
  return (message.content as Json[])
    .filter((block) => block?.type === "tool_result")
    .map((block) => {
      const content = block.content;
      if (typeof content === "string") return content;
      if (Array.isArray(content)) return (content as Json[]).map((part) => String(part.text ?? "")).join("");
      return "";
    });
}

/** The person's latest words, and every tool result after them. */
function currentTurn(messages: unknown): { userText: string; turnResults: string[] } {
  if (!Array.isArray(messages)) return { userText: "", turnResults: [] };
  const turnResults: string[] = [];
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index] as Json;
    if (message?.role !== "user") continue;
    const results = resultTexts(message);
    if (results.length > 0) {
      turnResults.unshift(...results);
      continue;
    }
    const content = message.content;
    const userText =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? (content as Json[]).map((block) => (block?.type === "text" ? String(block.text ?? "") : "")).join("\n")
          : "";
    return { userText, turnResults };
  }
  return { userText: "", turnResults };
}

function lastToolResults(messages: unknown): string[] {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  const last = messages[messages.length - 1] as Json;
  if (!Array.isArray(last?.content)) return [];
  return (last.content as Json[])
    .filter((block) => block?.type === "tool_result")
    .map((block) => {
      const content = block.content;
      if (typeof content === "string") return content;
      if (Array.isArray(content)) return (content as Json[]).map((part) => String(part.text ?? "")).join("");
      return "";
    });
}

export function startMessagesRecorder(port = 0, script: RecorderScript = {}): MessagesRecorder {
  const requests: RecordedRequest[] = [];
  let sequence = 0;

  const server = Bun.serve({
    port,
    hostname: "127.0.0.1",
    async fetch(request) {
      const url = new URL(request.url);
      if (request.method !== "POST" || !url.pathname.endsWith("/messages")) {
        return Response.json({ type: "error", error: { type: "not_found_error", message: url.pathname } }, { status: 404 });
      }
      const body = (await request.json()) as Json;
      const recorded: RecordedRequest = {
        path: url.pathname,
        model: typeof body.model === "string" ? body.model : undefined,
        toolNames: Array.isArray(body.tools)
          ? (body.tools as Json[]).map((tool) => String(tool.name)).sort()
          : [],
        system: systemText(body.system),
        messageCount: Array.isArray(body.messages) ? body.messages.length : 0,
        toolResults: lastToolResults(body.messages),
        ...currentTurn(body.messages),
        receivedAt: Date.now(),
      };
      requests.push(recorded);

      const id = `msg_recorded_${++sequence}`;
      const call = script.toolCall?.(recorded) ?? null;
      const content: Json[] = call
        ? [{ type: "tool_use", id: `toolu_recorded_${sequence}`, name: call.name, input: call.input }]
        : [{ type: "text", text: script.text?.(recorded) ?? "Recorded." }];
      const stopReason = call ? "tool_use" : "end_turn";
      const usage = { input_tokens: 1, output_tokens: 1 };

      if (body.stream !== true) {
        return Response.json({
          id,
          type: "message",
          role: "assistant",
          model: recorded.model ?? "recorded",
          content,
          stop_reason: stopReason,
          stop_sequence: null,
          usage,
        });
      }

      const events: Array<[string, Json]> = [
        [
          "message_start",
          {
            type: "message_start",
            message: {
              id,
              type: "message",
              role: "assistant",
              model: recorded.model ?? "recorded",
              content: [],
              stop_reason: null,
              stop_sequence: null,
              usage,
            },
          },
        ],
      ];
      content.forEach((block, index) => {
        if (block.type === "tool_use") {
          events.push([
            "content_block_start",
            { type: "content_block_start", index, content_block: { ...block, input: {} } },
          ]);
          events.push([
            "content_block_delta",
            {
              type: "content_block_delta",
              index,
              delta: { type: "input_json_delta", partial_json: JSON.stringify(block.input) },
            },
          ]);
        } else {
          events.push([
            "content_block_start",
            { type: "content_block_start", index, content_block: { type: "text", text: "" } },
          ]);
          events.push([
            "content_block_delta",
            { type: "content_block_delta", index, delta: { type: "text_delta", text: block.text } },
          ]);
        }
        events.push(["content_block_stop", { type: "content_block_stop", index }]);
      });
      events.push([
        "message_delta",
        { type: "message_delta", delta: { stop_reason: stopReason, stop_sequence: null }, usage },
      ]);
      events.push(["message_stop", { type: "message_stop" }]);

      return new Response(sse(events), {
        headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
      });
    },
  });

  return {
    url: `http://127.0.0.1:${server.port}`,
    requests,
    stop: () => server.stop(true),
  };
}
