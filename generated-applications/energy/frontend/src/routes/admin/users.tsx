import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, ArrowLeft, Shield, Loader2, AlertCircle, Plus, Search } from 'lucide-react';
import { HStack, Heading, Text } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmDialog } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { PasswordDialog, UserDialog } from "@/components/admin/account-dialogs";
import {
  PAGE_SIZE,
  accountKeys,
  deleteAccount,
  fetchAccounts,
  fetchOwnAccountId,
  fetchRoles,
  formatWhen,
  reasons,
  type Account,
} from "@/lib/accounts";

export const Route = createFileRoute('/admin/users')({
  component: UsersPage,
});

type Dialog =
  | { kind: 'edit'; account: Account | null }
  | { kind: 'password'; account: Account }
  | { kind: 'delete'; account: Account };

function StatusBadge({ account }: { account: Account }) {
  const [label, tone] = account.isLocked
    ? ['Locked', 'bg-red-100 text-red-700']
    : !account.isActive
      ? ['Inactive', 'bg-muted text-muted-foreground']
      : ['Active', 'bg-green-100 text-green-700'];
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${tone}`}>{label}</span>;
}

function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [offset, setOffset] = useState(0);
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const accounts = useQuery({
    queryKey: accountKeys.list(term, offset),
    queryFn: () => fetchAccounts(term, offset),
    placeholderData: keepPreviousData,
  });
  const roles = useQuery({ queryKey: accountKeys.roles, queryFn: fetchRoles });
  const me = useQuery({ queryKey: accountKeys.me, queryFn: fetchOwnAccountId, staleTime: Infinity });

  const remove = useMutation({
    mutationFn: (account: Account) => deleteAccount(account.id),
    onSuccess: (_result, account) => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
      toast.success(`Deleted ${account.email}`);
      // Deleting the last row of a page leaves that page empty.
      if (rows.length === 1 && offset > 0) setOffset(Math.max(0, offset - PAGE_SIZE));
    },
    onError: (error) => toast.error(reasons(error).join(' ')),
  });

  const rows = accounts.data?.data ?? [];
  const total = accounts.data?.total ?? 0;
  const forbidden = accounts.error && (accounts.error as { statusCode?: number }).statusCode === 403;

  function runSearch() {
    setOffset(0);
    setTerm(search);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container-swiss">
          <HStack align="center" gap={3} className="h-14">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground" aria-label="Back to the dashboard">
              <ArrowLeft size={16} />
            </Link>
            <Users className="w-4 h-4 text-primary" />
            <Heading level={1} className="font-display">User Management</Heading>
            <div className="ml-auto">
              <Button onClick={() => setDialog({ kind: 'edit', account: null })}>
                <Plus size={14} /> New user
              </Button>
            </div>
          </HStack>
        </div>
      </header>

      <main className="container-swiss py-8 space-y-4">
        <form
          className="flex gap-2 max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            runSearch();
          }}
        >
          <Input aria-label="Search users" placeholder="Search by name or email" value={search}
            onChange={(event) => setSearch(event.target.value)} />
          <Button type="submit" variant="outline"><Search size={14} /> Search</Button>
        </form>

        {accounts.isLoading && (
          <div className="swiss-card p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          </div>
        )}
        {accounts.error && (
          <div className="swiss-alert-error p-8 text-center" role="alert">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
            <p>{forbidden ? 'Managing users requires the administrator role.' : 'Failed to load users'}</p>
          </div>
        )}
        {!accounts.isLoading && !accounts.error && (
          <div className="swiss-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Roles</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last sign-in</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((account) => {
                  const isSelf = me.data === account.id;
                  return (
                    <tr key={account.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        {account.name}
                        {isSelf ? <span className="ml-2 text-xs text-muted-foreground">(you)</span> : null}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{account.email}</td>
                      <td className="px-4 py-3">
                        {account.roles.length ? (
                          <HStack gap={1} wrap>
                            {account.roles.map((role) => (
                              <span key={role.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <Shield size={12} />{role.name}
                              </span>
                            ))}
                          </HStack>
                        ) : (
                          <Text color="secondary" size="xs">No roles</Text>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge account={account} />
                        {!account.canSignIn ? (
                          <Text color="secondary" size="xs">No sign-in</Text>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatWhen(account.lastLogin)}</td>
                      <td className="px-4 py-3">
                        <HStack gap={1} justify="end">
                          <Button size="sm" variant="outline" aria-label={`Edit ${account.name}`}
                            onClick={() => setDialog({ kind: 'edit', account })}>Edit</Button>
                          <Button size="sm" variant="outline" aria-label={`Reset password for ${account.name}`}
                            disabled={!account.canSignIn}
                            onClick={() => setDialog({ kind: 'password', account })}>Password</Button>
                          <Button size="sm" variant="outline" aria-label={`Delete ${account.name}`}
                            disabled={isSelf || account.isSystemUser}
                            title={isSelf ? 'You cannot delete your own account' : account.isSystemUser ? 'Built-in accounts can only be deactivated' : undefined}
                            onClick={() => setDialog({ kind: 'delete', account })}>Delete</Button>
                        </HStack>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      {term ? 'No users match that search' : 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <HStack align="center" justify="between">
            <Text color="secondary" size="sm">
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </Text>
            <HStack gap={2}>
              <Button size="sm" variant="outline" disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>Previous</Button>
              <Button size="sm" variant="outline" disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}>Next</Button>
            </HStack>
          </HStack>
        )}
      </main>

      {dialog?.kind === 'edit' && (
        <UserDialog
          key={dialog.account?.id ?? 'new'}
          account={dialog.account}
          roles={roles.data ?? []}
          isSelf={dialog.account !== null && me.data === dialog.account.id}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'password' && (
        <PasswordDialog key={dialog.account.id} account={dialog.account} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'delete' && (
        <DeleteConfirmDialog
          open
          onOpenChange={(open) => { if (!open) setDialog(null); }}
          title="Delete user"
          description={`Delete ${dialog.account.name} (${dialog.account.email})? They will no longer be able to sign in. Deactivate the account instead to keep it on record.`}
          isConfirming={remove.isPending}
          onConfirm={() => remove.mutate(dialog.account)}
        />
      )}
    </div>
  );
}
