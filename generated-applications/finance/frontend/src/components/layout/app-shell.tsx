/**
 * The application shell: one sidebar and one header, on every screen that has
 * chrome at all.
 *
 * `AppLayout`, `Sidebar` and `Header` have been generated into every
 * application and rendered by none of them — `app-layout.tsx` imported
 * `Sidebar`, and nothing imported `app-layout`. The sidebar's own source said
 * so in a comment. This is what mounts them.
 *
 * **It decides by route, not by auth state.** A shell that waited for a session
 * would flash its chrome around the sign-in page on every cold load, and an
 * unauthenticated visitor to a deep link would see a sidebar full of nothing
 * while the redirect resolved. `CHROMELESS` names the prefixes that are their
 * own full-page experience; everything else gets the shell.
 *
 * It deliberately does **not** guard the routes. `AppLayout` did — it redirected
 * to `/auth/login` when `useAuth()` reported no session — and mounting that at
 * the root would have put a second, competing redirect behind every page that
 * already does its own. One guard per screen, where the screen can say what it
 * needs.
 */
import { type ReactNode, useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { VStack } from "@/components/ui/layout";
import { isEmbedded } from "@/lib/embed";

/**
 * Route prefixes that render without chrome.
 *
 * Sign-in and sign-up are their own page. `/manual.html` is not here because it
 * is a static file the server hands over rather than a route in this router.
 */
const CHROMELESS = ["/auth"];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname, searchStr } = useLocation();
  // A screen the chat opened (`?embed=1`) is a card in a conversation, not an
  // application: no sidebar, no header. The query string decides on the first
  // render, which the server renders too; `isEmbedded()` then keeps the frame
  // chromeless as it navigates (a create lands on the record it made, a URL
  // without the flag).
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    setEmbedded(isEmbedded());
  }, [pathname]);
  const bare =
    embedded ||
    new URLSearchParams(searchStr).get("embed") === "1" ||
    CHROMELESS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (bare) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <VStack grow className="overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </VStack>
    </div>
  );
}
