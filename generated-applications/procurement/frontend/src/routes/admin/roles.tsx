import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { UserCog, ArrowLeft, Loader2, AlertCircle, Plus, Star } from 'lucide-react';
import { HStack, Heading, Text } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { RoleDialog } from "@/components/admin/account-dialogs";
import { accountKeys, fetchRoles, type RoleRecord } from "@/lib/accounts";

export const Route = createFileRoute('/admin/roles')({
  component: RolesPage,
});

function RolesPage() {
  const [editing, setEditing] = useState<{ role: RoleRecord | null } | null>(null);
  const roles = useQuery({ queryKey: accountKeys.roles, queryFn: fetchRoles });
  const rows = roles.data ?? [];
  const forbidden = roles.error && (roles.error as { statusCode?: number }).statusCode === 403;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container-swiss">
          <HStack align="center" gap={3} className="h-14">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground" aria-label="Back to the dashboard">
              <ArrowLeft size={16} />
            </Link>
            <UserCog className="w-4 h-4 text-primary" />
            <Heading level={1} className="font-display">Role Management</Heading>
            <div className="ml-auto">
              <Button onClick={() => setEditing({ role: null })}>
                <Plus size={14} /> New role
              </Button>
            </div>
          </HStack>
        </div>
      </header>

      <main className="container-swiss py-8">
        {roles.isLoading && (
          <div className="swiss-card p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          </div>
        )}
        {roles.error && (
          <div className="swiss-alert-error p-8 text-center" role="alert">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
            <p>{forbidden ? 'Managing roles requires the administrator role.' : 'Failed to load roles'}</p>
          </div>
        )}
        {!roles.isLoading && !roles.error && (
          <div className="swiss-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Members</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((role) => (
                  <tr key={role.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">
                      <HStack gap={2} align="center">
                        {role.isMasterRole && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                        {role.name}
                      </HStack>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{role.description ?? '—'}</td>
                    <td className="px-4 py-3">
                      {role.isMasterRole ? (
                        <Text size="xs" weight="medium" className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Administrator</Text>
                      ) : (
                        <Text size="xs" weight="medium" color="secondary" className="inline-block px-2 py-0.5 rounded-full bg-muted">Standard</Text>
                      )}
                    </td>
                    <td className="px-4 py-3">{role.userCount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${role.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <HStack justify="end">
                        <Button size="sm" variant="outline" aria-label={`Edit ${role.name}`}
                          onClick={() => setEditing({ role })}>Edit</Button>
                      </HStack>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No roles found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {editing && (
        <RoleDialog key={editing.role?.id ?? 'new'} role={editing.role} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
