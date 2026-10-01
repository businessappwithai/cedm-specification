/**
 * The header every screen shares.
 *
 * It carries the controls that have to be reachable from anywhere: the
 * assistant, the manual, the account and the way out. Before the shell was
 * mounted only the dashboard drew a header, so opening a record lost you the
 * account menu and the log-out until you navigated back — the sidebar is the
 * visible half of mounting the shell, and this is the half that was missing
 * where it mattered.
 *
 * **The search box that used to be here is gone.** It was a form whose only
 * handler was `preventDefault()`, over an input bound to no state, placeholdered
 * `Search... (Ctrl+K)` for a shortcut nothing wired up. The dashboard has a
 * search that genuinely works — it filters the cards in front of you — and it
 * stays on the dashboard, where it reads as what it is. There is no endpoint a
 * global search could call.
 */

import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, BookOpen, LogOut, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { Box, HStack, Text } from "@/components/ui/layout";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/auth/login" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 ${className || ""}`}
    >
      {/* Nothing on the left: the sidebar carries the navigation and the page
          carries its own title. The spacer keeps the actions to the right. */}
      <div className="flex-1" />

      {/* Actions */}
      <HStack align="center" gap={2}>
        {/* Ask. The only entry point to `/ask` there is — it used to live in
            the dashboard's own header, which meant it was unreachable from
            every other screen. Always shown: when the add-on is unconfigured
            the backend answers 503 and the page says so in a sentence, which is
            more use than a link that is not there. */}
        <Link
          to="/ask"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Ask a question about your data"
          aria-label="Ask a question about your data"
        >
          <Sparkles size={16} />
        </Link>

        {/* The generated manual: what this application keeps, who may see it,
            and what it decides. A plain anchor rather than a Link, because it is
            a static file the server hands over, not a route in this router. */}
        <a
          href="/manual.html"
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Manual"
          aria-label="Manual"
        >
          <BookOpen size={16} />
        </a>

        {/* Notifications */}
        <DropdownMenu>
          {/* The trigger carries content, not a button. Astryx's DropdownMenu
              renders the trigger button itself, so a `<Button>` here would put
              one button inside another — which the HTML parser refuses to keep,
              taking the hydration of every page with it. The positioning span
              is what the unread dot is anchored to, now that the button around
              it belongs to Astryx. */}
          <DropdownMenuTrigger aria-label="Notifications">
            <span className="relative inline-flex">
              <Bell size={20} />
              <span className="absolute -right-1 -top-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Box paddingInline={2} paddingBlock={1.5} className="text-sm text-muted-foreground">No new notifications</Box>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Account">
            <Avatar className="h-9 w-9">
              <AvatarImage src="" alt={user?.name || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <Text size="sm" weight="medium" block className="leading-none">{user?.name}</Text>
                <Text size="xs" color="secondary" block className="leading-none">{user?.email}</Text>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </HStack>
    </header>
  );
}
