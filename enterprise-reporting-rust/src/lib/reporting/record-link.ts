/**
 * Record links — traversing from a report row to that record in another
 * application.
 *
 * A report definition may carry one of these. When it does, the read-only
 * record view grows a button that opens the same record somewhere else: the
 * generated application it was reported on, or any other system that can
 * address a record by id.
 *
 * ── Why this file exists rather than a template string at the call site ─────
 *
 * The URL is supplied by an administrator and ends up in an `href`. That is an
 * injection sink: `javascript:alert(1)` in an anchor runs on click, and
 * `data:text/html,…` opens an attacker-controlled document that the browser
 * treats as same-origin-ish for some purposes. An administrator is trusted, but
 * "trusted" is not the same as "should be able to store a stored-XSS payload
 * that fires for every viewer of the report" — the button is shown to ordinary
 * users, not just to the administrator who configured it.
 *
 * So the scheme is allow-listed here, once, and both the writer (validation on
 * save) and the reader (building the href) go through it.
 */

/** What a report definition stores. */
export interface RecordLinkConfig {
  enabled: boolean;
  /** The column in the report's result set holding the record's id. */
  idColumn: string;
  /**
   * Where to go. `{id}` is replaced with the row's id, URL-encoded.
   *
   * Site-relative (`/app/bus_account/{id}`) or absolute http/https
   * (`https://crm.example.com/record/{id}`). Nothing else.
   */
  urlTemplate: string;
  /** Button label. Defaults to "Open in application". */
  label?: string;
  /** Open in a new browser tab. Defaults to true. */
  openInNewTab?: boolean;
}

export const RECORD_LINK_PLACEHOLDER = "{id}";
export const DEFAULT_RECORD_LINK_LABEL = "Open in application";

/**
 * Schemes an absolute template may use.
 *
 * Deliberately not a denylist of `javascript:` and friends: a denylist has to
 * anticipate every scheme a browser will ever honour, and it only takes one
 * (`vbscript:`, `data:`, a future addition) to be wrong. An allowlist is wrong
 * only in the safe direction.
 */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export interface RecordLinkValidation {
  ok: boolean;
  error?: string;
}

/**
 * Is this template safe and usable?
 *
 * Called on save so a bad template is refused where the administrator can see
 * why, rather than silently producing a dead button later.
 */
/**
 * The template as a browser will read it. The URL parser deletes every tab,
 * CR and LF before resolving, so `"/\t/evil.example/{id}"` — which the `//`
 * check below would pass — opens `https://evil.example/…`. Checking the
 * normalised string closes that; building from it keeps what was checked
 * and what is rendered the same thing.
 */
function normalizeTemplate(template: string): string {
  return template.replace(/[\t\n\r]/g, "").trim();
}

/** Any C0 control character or DEL left after normalising. */
function hasControlCharacter(value: string): boolean {
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

export function validateUrlTemplate(template: string): RecordLinkValidation {
  const trimmed = normalizeTemplate(template);

  if (hasControlCharacter(trimmed)) {
    return { ok: false, error: "The URL contains control characters." };
  }

  if (!trimmed) {
    return { ok: false, error: "Enter a URL." };
  }

  if (!trimmed.includes(RECORD_LINK_PLACEHOLDER)) {
    return {
      ok: false,
      error: `The URL must contain ${RECORD_LINK_PLACEHOLDER}, which is replaced with the record's id.`,
    };
  }

  /*
   * Site-relative. `//host` is protocol-relative — an absolute URL to another
   * origin wearing a relative URL's clothes — so it is not accepted here.
   *
   * `/\host` is the same thing spelled differently, and it used to pass. The
   * WHATWG URL parser treats a backslash as a forward slash for special
   * schemes, so a browser resolves `/\evil.example` against this origin as
   * `https://evil.example` — verified. A check that tests only for `//` reads
   * as complete and is not, which is exactly the shape of bug an allowlist is
   * supposed to avoid.
   *
   * So the second character is checked rather than the second slash: anything
   * that is not a plain path segment separator is refused.
   */
  if (trimmed.startsWith("/")) {
    const second = trimmed[1];
    if (second === "/" || second === "\\") {
      return {
        ok: false,
        error:
          "A URL starting with // or /\\ points at another site. Write it in full, with https://.",
      };
    }
    return { ok: true };
  }

  let parsed: URL;
  try {
    // A placeholder is not valid URL syntax everywhere, so parse a specimen
    // with it substituted rather than the template itself.
    parsed = new URL(trimmed.replaceAll(RECORD_LINK_PLACEHOLDER, "1"));
  } catch {
    return { ok: false, error: "That is not a valid URL." };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      ok: false,
      error: `Only http:// and https:// links are allowed (got ${parsed.protocol.replace(":", "")}).`,
    };
  }

  return { ok: true };
}

/**
 * Build the href for one record, or null when it cannot be built.
 *
 * Returns null rather than a broken string so a caller renders no button at
 * all: a button that navigates nowhere is worse than an absent one, because it
 * looks like the feature is broken rather than not configured.
 */
export function buildRecordUrl(config: RecordLinkConfig, id: unknown): string | null {
  if (!config.enabled) return null;
  if (id === null || id === undefined || id === "") return null;

  // Re-validated on read, not just on save. The row could have been written
  // before this validation existed, or by something other than the UI.
  if (!validateUrlTemplate(config.urlTemplate).ok) return null;

  return normalizeTemplate(config.urlTemplate).replaceAll(
    RECORD_LINK_PLACEHOLDER,
    encodeURIComponent(String(id))
  );
}

/**
 * Read the stored JSON.
 *
 * Anything unparseable or the wrong shape reads as "no link configured".
 * A malformed config must not break the record view it is attached to.
 */
export function parseRecordLinkConfig(raw: string | null | undefined): RecordLinkConfig | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<RecordLinkConfig>;
    if (typeof parsed?.urlTemplate !== "string" || typeof parsed?.idColumn !== "string") {
      return null;
    }
    return {
      enabled: parsed.enabled === true,
      idColumn: parsed.idColumn,
      urlTemplate: parsed.urlTemplate,
      label: typeof parsed.label === "string" && parsed.label.trim() ? parsed.label : undefined,
      openInNewTab: parsed.openInNewTab !== false,
    };
  } catch {
    return null;
  }
}

export function serializeRecordLinkConfig(config: RecordLinkConfig): string {
  return JSON.stringify({
    enabled: config.enabled,
    idColumn: config.idColumn.trim(),
    urlTemplate: normalizeTemplate(config.urlTemplate),
    label: config.label?.trim() || undefined,
    openInNewTab: config.openInNewTab !== false,
  });
}
