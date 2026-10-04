import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { AppShell } from "@/components/layout/app-shell";
import { sessionFromRust } from "@/lib/api/backend";
import { getSessionFromHeaders } from "@/lib/auth/session";
import { isEmbedSearch } from "@/lib/embed/embed";

// Resolved from the request's headers rather than by matching a cookie name:
// the name is Better Auth's business (`ers.session_token`, and `__Secure-`
// prefixed once served over HTTPS), and this guard decides whether anyone sees
// the application at all.
const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const forwarded = await sessionFromRust();
  if (forwarded !== undefined) return forwarded;
  const request = getRequest();
  if (!request) return null;
  return getSessionFromHeaders(request.headers);
});

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const session = await getSessionFn();
    if (!session) throw redirect({ to: "/login" });
    return { session };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { session } = Route.useRouteContext();
  const { searchStr } = useLocation();
  // Opened inside the chat: the page alone, no sidebar or header.
  if (isEmbedSearch(searchStr)) {
    return (
      <main className="min-h-screen bg-tremor-background-muted p-4">
        <Outlet />
      </main>
    );
  }
  return (
    <AppShell user={session.user}>
      <Outlet />
    </AppShell>
  );
}
