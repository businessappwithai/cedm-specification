/**
 * Better Auth's own HTTP surface — sign-in, sign-out, session, and everything
 * else the library routes itself.
 *
 * `basePath` in src/lib/auth/better-auth.ts is `/api/auth`, so this splat has
 * to live at exactly that path or the library's generated URLs point at a 404.
 */
import { createFileRoute } from "@tanstack/react-router";
import { getAuth } from "@/lib/auth/better-auth";

const handler = ({ request }: { request: Request }) => getAuth().handler(request);

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});
