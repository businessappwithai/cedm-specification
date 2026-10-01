import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Users, ArrowLeft, Shield, Loader2, AlertCircle } from 'lucide-react';
import { HStack, Heading, Text } from "@/components/ui/layout";

export const Route = createFileRoute('/admin/users')({
  component: UsersPage,
});

interface SysUser {
  sys_user_id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  roles?: string[];
}

function UsersPage() {
  const { data, isLoading, error } = useQuery<{ data: SysUser[] }>({
    queryKey: ['admin', 'sys-users'],
    queryFn: () => apiClient.get('/sys/users'),
  });

  const users = data?.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container-swiss">
          <HStack align="center" gap={3} className="h-14">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={16} />
            </Link>
            <Users className="w-4 h-4 text-primary" />
            <Heading level={1} className="font-display">User Management</Heading>
          </HStack>
        </div>
      </header>

      <main className="container-swiss py-8">
        {isLoading && (
          <div className="swiss-card p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="swiss-alert-error p-8 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
            <p>Failed to load users</p>
          </div>
        )}
        {!isLoading && !error && (
          <div className="swiss-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Roles</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.sys_user_id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.roles?.length ? (
                        <HStack gap={1} wrap>
                          {u.roles.map((r) => (
                            <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              <Shield size={12} />{r}
                            </span>
                          ))}
                        </HStack>
                      ) : (
                        <Text color="secondary" size="xs">No roles</Text>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
