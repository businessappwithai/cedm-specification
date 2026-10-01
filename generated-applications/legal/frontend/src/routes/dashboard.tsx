import { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  type DashboardTable,
  adminWindows,
  entityHref,
  useDashboard,
} from '@/hooks/use-dashboard';
import { useAuth } from '@/contexts/auth-context';
import {
  ArrowRight,
  FileText,
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  Database,
  BookOpen,
  LayoutGrid,
  X,
} from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { Box, Grid, HStack, Heading, Text } from "@/components/ui/layout";

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function Dashlet({
  name,
  description,
  icon,
  href,
}: {
  name: string;
  /** Optional: an admin window that is not read-only has nothing to say here. */
  description?: string;
  /*
   * A lucide icon id from the dictionary — `sys_table.icon` for an entity,
   * `sys_window.icon` for an admin screen. Null when the row names none, and
   * then a default is drawn: a card is never withheld for want of an icon.
   *
   * It used to be `any`, because admin cards passed an imported React component
   * while entity cards passed a name. Both sides read the dictionary now, so
   * there is one kind of value and `Icon` is the only thing that has to
   * understand it.
   */
  icon?: string | null;
  href: string;
}) {
  return (
    <Link to={href} className="block group">
      <Box padding={5} fullHeight className="swiss-card hover:border-primary/50 transition-all">
        <HStack align="start" justify="between" gap={3}>
          <HStack align="center" gap={3} className="min-w-0">
            <HStack align="center" justify="center" className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              {icon ? (
                <Icon name={icon} size={20} className="text-primary" />
              ) : (
                <FileText size={20} />
              )}
            </HStack>
            <div className="min-w-0">
              <Heading level={3} color="primary" truncate className="group-hover:text-primary transition-colors">
                {name}
              </Heading>
            </div>
          </HStack>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
        </HStack>
        {description && (
          <Text size="xs" color="secondary" block className="mt-3 line-clamp-2 leading-relaxed">
            {description}
          </Text>
        )}
      </Box>
    </Link>
  );
}

function DashboardPage() {
  const { data: dashboard, isLoading, error } = useDashboard();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: '/auth/login' });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const query = searchQuery.toLowerCase().trim();
  const matches = (table: DashboardTable) =>
    table.name.toLowerCase().includes(query) ||
    table.table_name.toLowerCase().includes(query) ||
    (table.description?.toLowerCase().includes(query) ?? false);

  // The admin cards are the dictionary's own, through the same helper the
  // sidebar uses — a map written here was keyed by window *name*, and a window
  // it did not know about was dropped, which is how `User Administration`,
  // `Role Administration` and `System Configuration` came to be granted,
  // routed and absent from this screen.
  const admin = adminWindows(dashboard);

  const filteredAdmin = query
    ? admin.filter((window) => window.name.toLowerCase().includes(query))
    : admin;

  // Entities grouped by category, in the order the server sent them. The search
  // box filters within each group and drops groups that end up empty.
  const categoryGroups = (dashboard?.data ?? [])
    .map((group) => ({
      ...group,
      entities: query ? group.entities.filter(matches) : group.entities,
    }))
    .filter((group) => group.entities.length > 0);

  const groupedEntityCount = categoryGroups.reduce((sum, g) => sum + g.entities.length, 0);

  return (
    <div className="bg-background">
      {/* The page's own heading and its filter. The account chip, the log-out,
          the assistant and the manual used to live in a header drawn right
          here, which is why they were reachable from the dashboard and from
          nowhere else — `AppShell` carries them on every screen now.

          The search stays, because it is not navigation: it filters the cards
          below it. */}
      <Box className="container-swiss pt-8">
        <HStack align="center" justify="between" gap={4} className="mb-6">
          <Heading level={1} color="primary" className="font-display">legal</Heading>
          <Box className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter this dashboard"
              className="swiss-input h-9 w-full pl-9 pr-8 text-sm sm:w-56"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear the filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </Box>
        </HStack>
      </Box>

      <main className="container-swiss py-8 space-y-10">
        {/* Loading */}
        {isLoading && (
          <div className="swiss-card p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <Text color="secondary" size="sm" block className="mt-4">Loading entities...</Text>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="swiss-alert-error p-12 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" />
            <Text weight="semibold" block>Failed to load entities</Text>
            <Text size="sm" color="secondary" block className="mt-1">
              Unable to fetch entity list from Application Dictionary
            </Text>
          </div>
        )}

        {/* The entities this caller may read, grouped by category in the order
            the dictionary gives them. Each group is introduced by its name
            above a separating rule; anything nobody has filed arrives in a
            trailing `Uncategorised` group rather than being left out. */}
        {!isLoading && !error && groupedEntityCount > 0 && (
          <section data-testid="dashboard-categories">
            {categoryGroups.map((group) => (
              <div
                key={group.code}
                className="mb-10 last:mb-0"
                data-testid={`category-group-${group.code}`}
              >
                {/* Category name sits above the line that separates this group */}
                <HStack gap={2} className="items-baseline mb-2">
                  {group.icon ? (
                    <Icon
                      name={group.icon}
                      size={16}
                      className="text-primary self-center"
                      style={group.color ? { color: group.color } : undefined}
                    />
                  ) : (
                    <Database className="w-4 h-4 text-primary self-center" />
                  )}
                  <h2
                    className="section-header mb-0"
                    style={group.color ? { color: group.color } : undefined}
                    data-testid={`category-name-${group.code}`}
                  >
                    {group.name}
                  </h2>
                  <Text color="secondary" className="font-mono-display">
                    ({group.entities.length})
                  </Text>
                </HStack>

                <hr className="border-t border-border mb-5" />

                {group.description && (
                  <Text size="sm" color="secondary" block className="-mt-3 mb-5">{group.description}</Text>
                )}

                <Grid columns={1} gap={4}>
                  {group.entities.map((table) => (
                    <Dashlet
                      key={table.table_name}
                      name={table.name}
                      description={table.description || `Manage ${table.name} records`}
                      icon={table.icon}
                      href={entityHref(table)}
                    />
                  ))}
                </Grid>
              </div>
            ))}
          </section>
        )}

        {/* Admin / Dictionary */}
        {filteredAdmin.length > 0 && (
          <section>
            <HStack align="center" gap={2} className="mb-5">
              <LayoutGrid className="w-4 h-4 text-primary" />
              <h2 className="section-header mb-0">
                Application Dictionary
              </h2>
              <Text color="secondary" className="font-mono-display">({filteredAdmin.length})</Text>
            </HStack>
            <Grid columns={1} gap={4}>
              {filteredAdmin.map((window) => (
                <Dashlet
                  key={window.sys_window_id}
                  name={window.name}
                  description={window.is_read_only ? 'View only' : undefined}
                  icon={window.icon}
                  href={window.route}
                />
              ))}
            </Grid>
          </section>
        )}

        {/* Empty search */}
        {!isLoading && !error && groupedEntityCount === 0 && filteredAdmin.length === 0 && (
          <div className="swiss-card p-12 text-center">
            <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <Text weight="semibold" block>No results for &ldquo;{searchQuery}&rdquo;</Text>
            <Text size="sm" color="secondary" block className="mt-1">Try a different search term</Text>
          </div>
        )}
      </main>
    </div>
  );
}
