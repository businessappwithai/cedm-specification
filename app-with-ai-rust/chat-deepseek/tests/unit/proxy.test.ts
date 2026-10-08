import { describe, expect, it } from "bun:test";
import { checkMuxFrame, refuseRemote } from "../../gateway/proxy";

describe("the Remote allowlist", () => {
  it("lets the chat's own namespaces through", () => {
    for (const path of ["/api/session/create", "/api/session/prompt", "/api/skills/list", "/api/commands/list", "/api/workspace/follow"]) {
      expect(refuseRemote("POST", path)).toBeNull();
    }
    expect(refuseRemote("GET", "/api/remote.mux")).toBeNull();
    expect(refuseRemote("GET", "/api/session.export")).toBeNull();
  });

  it("refuses the route that reads any file on the host", () => {
    expect(refuseRemote("GET", "/api/file")).not.toBeNull();
  });

  it("refuses making an arbitrary directory a workspace", () => {
    expect(refuseRemote("POST", "/api/workspace/create")).not.toBeNull();
  });

  it("refuses every namespace it does not name", () => {
    for (const path of ["/api/terminal/open", "/api/directoryPicker/list", "/api/workspaceFiles/read", "/api/pluginManager/install", "/api/settings/write", "/api/llm/catalog", "/api/agentPresets/save"]) {
      expect(refuseRemote("POST", path)).not.toBeNull();
    }
  });

  it("leaves non-API paths (the client's assets) alone", () => {
    expect(refuseRemote("GET", "/")).toBeNull();
    expect(refuseRemote("GET", "/assets/index.js")).toBeNull();
  });
});

describe("settings: read, never write", () => {
  it("lets the client read its display preferences", () => {
    expect(refuseRemote("POST", "/api/settings/describe")).toBeNull();
  });

  it("refuses every write, which could repoint the model endpoint the server's key is sent to", () => {
    for (const name of ["mutate", "update", "replace", "prepareDocument", "reset"]) {
      expect(refuseRemote("POST", `/api/settings/${name}`)).not.toBeNull();
    }
  });
});

describe("the WebSocket mux holds the same allowlist", () => {
  const open = (endpoint: string, streamId = "s1") =>
    JSON.stringify({ type: "open", streamId, endpoint, payload: { args: {} } });

  it("opens the streams the chat uses", () => {
    const streams = new Set<string>();
    for (const [i, endpoint] of ["$events", "session/follow", "session/control", "workspace/follow"].entries()) {
      expect(checkMuxFrame(open(endpoint, `s${i}`), streams)).toEqual({ forward: true });
    }
    expect(streams.size).toBe(4);
  });

  it("answers an open the HTTP route would refuse with the protocol's own error, and forwards nothing", () => {
    for (const endpoint of ["workspace/create", "terminal/open", "settings/mutate", "pluginManager/install", "../file"]) {
      const streams = new Set<string>();
      const verdict = checkMuxFrame(open(endpoint), streams);
      expect(verdict.forward).toBe(false);
      if (verdict.forward) continue;
      const reply = JSON.parse(verdict.reply ?? "{}");
      expect(reply).toMatchObject({ type: "error", streamId: "s1", error: { code: "FORBIDDEN" } });
      expect(Object.keys(reply.error).sort()).toEqual(["code", "details", "message"]);
      expect(streams.size).toBe(0);
    }
  });

  it("forwards stream traffic only for a stream it allowed", () => {
    const streams = new Set<string>();
    checkMuxFrame(open("terminal/open", "denied"), streams);
    expect(checkMuxFrame(JSON.stringify({ type: "item", streamId: "denied", value: "ls" }), streams)).toEqual({ forward: false });
    checkMuxFrame(open("session/follow", "ok"), streams);
    expect(checkMuxFrame(JSON.stringify({ type: "item", streamId: "ok", value: 1 }), streams)).toEqual({ forward: true });
    expect(checkMuxFrame(JSON.stringify({ type: "end", streamId: "ok" }), streams)).toEqual({ forward: true });
    expect(checkMuxFrame(JSON.stringify({ type: "item", streamId: "ok" }), streams)).toEqual({ forward: false });
  });

  it("closes the socket on anything outside the protocol", () => {
    const streams = new Set<string>();
    for (const frame of ["not json", JSON.stringify({ type: "call", streamId: "x" }), JSON.stringify({ type: "open" })]) {
      const verdict = checkMuxFrame(frame, streams);
      expect(verdict.forward).toBe(false);
      expect(verdict.forward === false && verdict.close).toBeTruthy();
    }
    expect(checkMuxFrame(new Uint8Array([1, 2]), streams)).toMatchObject({ forward: false, close: expect.any(String) });
  });
});
