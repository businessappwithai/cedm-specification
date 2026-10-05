/**
 * A screen of this platform shown inside the chat generated beside an
 * application.
 *
 * The chat opens a report in a frame on the same origin (`/report/…` beside
 * `/chat`), with `?embed=1`. That flag does two things and nothing else:
 * - the page renders without the platform's sidebar and header, and without
 *   links that would navigate the frame away from the report it was opened on;
 * - `src/server.ts` lets that one page be framed by its own origin
 *   (`frame-ancestors 'self'`). Every other page keeps `'none'`.
 *
 * Signing in is not this file's business: the chat's gateway already opened a
 * session here for the same person (`POST /api/auth/assertion`), so the frame
 * passes the ordinary session guard.
 */

/** Pages the chat may frame, by path without the URL prefix. */
const EMBEDDABLE = [/^\/reports\/[^/]+\/viewer\/?$/, /^\/charts\/viewer\/[^/]+\/?$/];

/** True for a request the server may let this origin frame. */
export function isEmbeddableRequest(pathname: string, search: string): boolean {
  return (
    new URLSearchParams(search).get("embed") === "1" &&
    EMBEDDABLE.some((pattern) => pattern.test(pathname))
  );
}

/** True when the page was opened for the chat (`?embed=1`). */
export function isEmbedSearch(search: string): boolean {
  return new URLSearchParams(search).get("embed") === "1";
}
