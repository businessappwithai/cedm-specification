/**
 * The dialogs the user and role administration screens open.
 *
 * Each is mounted only while it is in use (`{editing ? <UserDialog … /> : null}`)
 * so its fields start from the account being edited every time, with no
 * "reset on open" effect to get wrong.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import {
  accountKeys,
  createAccount,
  createRole,
  MIN_PASSWORD_LENGTH,
  reasons,
  resetPassword,
  updateAccount,
  updateRole,
  type Account,
  type RoleRecord,
} from "@/lib/accounts";

function Problems({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <ul role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive space-y-1">
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Toggle({ id, label, hint, checked, disabled, onChange }: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch id={id} aria-label={label} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

export interface UserDialogProps {
  /** `null` creates a new account. */
  account: Account | null;
  roles: RoleRecord[];
  /** The caller's own account: it may not be deactivated or locked from here. */
  isSelf: boolean;
  onClose: () => void;
}

export function UserDialog({ account, roles, isSelf, onClose }: UserDialogProps) {
  const queryClient = useQueryClient();
  const creating = account === null;
  const [name, setName] = useState(account?.name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(account?.isActive ?? true);
  const [isLocked, setIsLocked] = useState(account?.isLocked ?? false);
  const [roleIds, setRoleIds] = useState<string[]>(account?.roles.map((role) => role.id) ?? []);
  const [problems, setProblems] = useState<string[]>([]);

  const save = useMutation({
    mutationFn: () =>
      creating
        ? createAccount({ name: name.trim(), email: email.trim(), password, roleIds, isActive })
        : updateAccount(account.id, {
            name: name.trim(),
            email: email.trim(),
            roleIds,
            isActive,
            isLocked,
          }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
      toast.success(creating ? `Created ${email.trim()}` : `Saved ${email.trim()}`);
      onClose();
    },
    onError: (error) => setProblems(reasons(error)),
  });

  function submit() {
    const found: string[] = [];
    if (name.trim() === "") found.push("Name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.push("Enter a valid email address.");
    if (creating && password.length < MIN_PASSWORD_LENGTH) {
      found.push(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    setProblems(found);
    if (found.length === 0) save.mutate();
  }

  const toggleRole = (id: string, on: boolean) =>
    setRoleIds((current) => (on ? [...current, id] : current.filter((existing) => existing !== id)));
  // An inactive role can still be removed from an account, but not newly given.
  const assignable = roles.filter((role) => role.isActive || roleIds.includes(role.id));

  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{creating ? "New user" : `Edit ${account.name}`}</DialogTitle>
          <DialogDescription>
            {creating
              ? "Creates a sign-in and gives it the roles you choose. Without a role the person can sign in and reach nothing."
              : "Changes apply to the person's next request, including a session that is already open."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field id="account-name" label="Name">
            <Input id="account-name" aria-label="Name" value={name} maxLength={100} autoFocus
              onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field id="account-email" label="Email" hint="They sign in with this address.">
            <Input id="account-email" aria-label="Email" type="email" value={email} autoComplete="off"
              onChange={(event) => setEmail(event.target.value)} />
          </Field>
          {creating ? (
            <Field id="account-password" label="Password" hint={`At least ${MIN_PASSWORD_LENGTH} characters. Share it securely; they can change it after signing in.`}>
              <Input id="account-password" aria-label="Password" type="password" value={password} autoComplete="new-password"
                onChange={(event) => setPassword(event.target.value)} />
            </Field>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Roles</legend>
            {assignable.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles are defined yet.</p>
            ) : (
              assignable.map((role) => (
                <div key={role.id} className="flex items-center gap-2 text-sm">
                  <Checkbox aria-label={role.name} checked={roleIds.includes(role.id)}
                    onCheckedChange={(on) => toggleRole(role.id, on)} />
                  <span>{role.name}</span>
                  {role.isMasterRole ? <span className="text-xs text-muted-foreground">(administrator)</span> : null}
                  {!role.isActive ? <span className="text-xs text-muted-foreground">(inactive)</span> : null}
                </div>
              ))
            )}
          </fieldset>

          <Toggle id="account-active" label="Active" checked={isActive} disabled={isSelf}
            hint={isSelf ? "You cannot deactivate your own account." : "An inactive account cannot sign in."}
            onChange={setIsActive} />
          {!creating ? (
            <Toggle id="account-locked" label="Locked" checked={isLocked} disabled={isSelf}
              hint={isSelf ? "You cannot lock your own account." : "Locked accounts are refused until someone unlocks them here."}
              onChange={setIsLocked} />
          ) : null}

          <Problems messages={problems} />
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={save.isPending} disabled={save.isPending}>
            {creating ? "Create user" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PasswordDialog({ account, onClose }: { account: Account; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [problems, setProblems] = useState<string[]>([]);

  const reset = useMutation({
    mutationFn: () => resetPassword(account.id, password),
    onSuccess: () => {
      toast.success(`Password changed for ${account.email}`);
      onClose();
    },
    onError: (error) => setProblems(reasons(error)),
  });

  function submit() {
    const found: string[] = [];
    if (password.length < MIN_PASSWORD_LENGTH) {
      found.push(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (password !== confirm) found.push("The two passwords do not match.");
    setProblems(found);
    if (found.length === 0) reset.mutate();
  }

  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password for {account.name}</DialogTitle>
          <DialogDescription>
            Replaces their password immediately. Sessions already signed in stay signed in.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field id="reset-password" label="New password">
            <Input id="reset-password" aria-label="New password" type="password" value={password} autoFocus
              autoComplete="new-password" onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field id="reset-confirm" label="Confirm new password">
            <Input id="reset-confirm" aria-label="Confirm new password" type="password" value={confirm}
              autoComplete="new-password" onChange={(event) => setConfirm(event.target.value)} />
          </Field>
          <Problems messages={problems} />
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={reset.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={reset.isPending} disabled={reset.isPending}>
            Reset password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RoleDialog({ role, onClose }: { role: RoleRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const creating = role === null;
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [isMasterRole, setIsMasterRole] = useState(role?.isMasterRole ?? false);
  const [isActive, setIsActive] = useState(role?.isActive ?? true);
  const [problems, setProblems] = useState<string[]>([]);

  const save = useMutation({
    mutationFn: () =>
      creating
        ? createRole({ name: name.trim(), description: description.trim() || undefined, isMasterRole, isActive })
        : updateRole(role.id, { name: name.trim(), description: description.trim(), isMasterRole, isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
      toast.success(creating ? `Created ${name.trim()}` : `Saved ${name.trim()}`);
      onClose();
    },
    onError: (error) => setProblems(reasons(error)),
  });

  function submit() {
    if (name.trim() === "") {
      setProblems(["Name is required."]);
      return;
    }
    setProblems([]);
    save.mutate();
  }

  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{creating ? "New role" : `Edit ${role.name}`}</DialogTitle>
          <DialogDescription>
            A role holds no access of its own. Grant it windows in the Application Dictionary; until then its
            members reach nothing.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field id="role-name" label="Name">
            <Input id="role-name" aria-label="Name" value={name} maxLength={100} autoFocus
              onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field id="role-description" label="Description">
            <Input id="role-description" aria-label="Description" value={description}
              onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <Toggle id="role-master" label="Administrator role" checked={isMasterRole}
            hint="Members bypass every access rule and can manage accounts and the dictionary."
            onChange={setIsMasterRole} />
          <Toggle id="role-active" label="Active" checked={isActive}
            hint="An inactive role grants nothing to the people who hold it." onChange={setIsActive} />
          <Problems messages={problems} />
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={save.isPending} disabled={save.isPending}>
            {creating ? "Create role" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
