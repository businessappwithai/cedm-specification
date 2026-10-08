import { describe, expect, it } from "bun:test";
import { parseSetCookie } from "../../gateway/auth";

describe("relaying an upstream Set-Cookie", () => {
  it("decodes the value once, because setCookie encodes it again", () => {
    // The reporting platform's session cookie: `<token>.<base64 HMAC>`, percent-encoded.
    const parts = parseSetCookie("ers.session_token=abc.def%2Bg%3D; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax");
    expect(parts).toEqual({ name: "ers.session_token", value: "abc.def+g=", maxAge: 604800 });
    expect(encodeURIComponent(parts!.value)).toBe("abc.def%2Bg%3D");
  });

  it("relays a value that is not percent-encoded as written", () => {
    expect(parseSetCookie("token=eyJ.a.b; Path=/")?.value).toBe("eyJ.a.b");
    expect(parseSetCookie("odd=100%; Path=/")?.value).toBe("100%");
  });

  it("refuses a header with no name", () => {
    expect(parseSetCookie("=x; Path=/")).toBeNull();
  });
});
