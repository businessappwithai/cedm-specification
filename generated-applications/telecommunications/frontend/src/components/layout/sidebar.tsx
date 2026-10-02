'use client';

/**
 * Sidebar Navigation
 *
 * **Every entry comes from the Application Dictionary**, through the same
 * `/api/me/dashboard` query the dashboard's cards are built from. That is one
 * fetch for both — whichever renders first pays for it and the other reads the
 * cache — and it means the menu offers exactly what this caller may open,
 * because that endpoint answers from the rows `/api/bus/*` is guarded by.
 *
 * It used to carry three hardcoded lists instead, and mounting it would have
 * shipped all three defects:
 *
 * - `navItems` interpolated the entities at generation time and gave each one
 *   an icon guessed from its name, while the dashboard drew `sys_table.icon`.
 *   Two derivations of the same picture, free to disagree.
 * - `adminItems` named six admin screens. One of them, `/admin/dictionary`,
 *   does not exist in the generated application — a dead link in the menu that
 *   exists to say what the application has.
 * - Neither list was scoped to the caller, so the menu offered entities the API
 *   would refuse.
 *
 * Generated: 2026-10-02T16:37:08.641Z
 */

import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  FileBarChart,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Icon } from '@/components/ui/icon';
import { adminWindows, entityHref, useDashboard } from '@/hooks/use-dashboard';
import { Box, HStack, Text } from '@/components/ui/layout';

interface SidebarProps {
  className?: string;
}

/** One link, as the sidebar needs it: a label, a route, and a way to draw it. */
interface NavEntry {
  title: string;
  href: string;
  /** A lucide id from the dictionary. Null falls back to the section default. */
  icon?: string | null;
}

/** Icons for the entries every application has, whatever its model. */
const FIXED_ICONS: Record<string, typeof LayoutDashboard> = {
  '/dashboard': LayoutDashboard,
  '/ask': Sparkles,
  '/reports': FileBarChart,
};

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: dashboard } = useDashboard();

  const entities: NavEntry[] = (dashboard?.data ?? []).flatMap((group) =>
    group.entities.map((table) => ({
      title: table.window_name,
      href: entityHref(table),
      icon: table.window_icon ?? null,
    }))
  );

  const admin: NavEntry[] = adminWindows(dashboard).map((window) => ({
    title: window.name,
    href: window.route,
    icon: window.icon,
  }));

  // Always listed. The page itself explains that the add-on is off when the
  // backend answers 503, which is more use than a missing menu entry.
  const fixed: NavEntry[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Ask', href: '/ask' },
    { title: 'Reports', href: '/reports' },
  ];

  return (
    <div
      className={cn(
        'relative flex flex-col border-r bg-background',
        isCollapsed ? 'w-16' : 'w-64',
        'transition-all duration-300',
        className
      )}
    >
      <HStack align="center" justify="between" paddingInline={4} className="h-16 border-b">
        {!isCollapsed && (
          <HStack align="center" gap={2} className="min-w-0">
            <HStack align="center" justify="center" className="h-8 w-8 rounded-lg bg-primary flex-shrink-0">
              <Database className="h-4 w-4 text-primary-foreground" />
            </HStack>
            <Text weight="semibold" truncate>telecommunications</Text>
          </HStack>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 flex-shrink-0"
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </HStack>

      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-6">
          <div className="space-y-1">
            {fixed.map((entry) => (
              <NavLink
                key={entry.href}
                entry={entry}
                fallback={FIXED_ICONS[entry.href] ?? LayoutDashboard}
                isActive={pathname === entry.href || pathname.startsWith(`${entry.href}/`)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>

          {entities.length > 0 && (
            <div className="space-y-1">
              {!isCollapsed && (
                <Box paddingInline={2}>
                  <Text size="xs" weight="semibold" color="secondary" block className="mb-2 px-2">
                    Entities
                  </Text>
                </Box>
              )}
              {entities.map((entry) => (
                <NavLink
                  key={entry.href}
                  entry={entry}
                  fallback={Database}
                  isActive={pathname === entry.href || pathname.startsWith(`${entry.href}/`)}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          )}

          {admin.length > 0 && (
            <div className="space-y-1">
              {!isCollapsed && (
                <Box paddingInline={2}>
                  <Text size="xs" weight="semibold" color="secondary" block className="mb-2 px-2">
                    Application Dictionary
                  </Text>
                </Box>
              )}
              {admin.map((entry) => (
                <NavLink
                  key={entry.href}
                  entry={entry}
                  fallback={Database}
                  isActive={pathname === entry.href || pathname.startsWith(`${entry.href}/`)}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}

interface NavLinkProps {
  entry: NavEntry;
  /** Drawn when the dictionary row names no icon. */
  fallback: React.ElementType;
  isActive: boolean;
  isCollapsed: boolean;
}

function NavLink({ entry, fallback: Fallback, isActive, isCollapsed }: NavLinkProps) {
  // A real anchor rather than a button with `navigate()`: the browser's own
  // middle-click, open-in-new-tab and copy-link all work on a link and none of
  // them work on a click handler, and a menu is the one place people use them.
  const link = (
    <Link
      to={entry.href}
      aria-current={isActive ? 'page' : undefined}
      aria-label={entry.title}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-secondary text-secondary-foreground font-medium'
          : 'text-foreground hover:bg-muted',
        isCollapsed && 'justify-center px-2'
      )}
    >
      {entry.icon ? (
        <Icon name={entry.icon} size={16} />
      ) : (
        <Fallback className="h-4 w-4" />
      )}
      {!isCollapsed && <span className="flex-1 truncate text-left">{entry.title}</span>}
    </Link>
  );

  if (!isCollapsed) return link;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{entry.title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
