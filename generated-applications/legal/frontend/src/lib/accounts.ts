/**
 * The accounts API (`/api/accounts`), as the administration screens use it.
 *
 * An account is a credential row and a dictionary identity written together by
 * the backend, so these screens never touch `/sys/users` — that endpoint writes
 * one half and cannot hash a password. Everything here is master-role only; a
 * caller without the role gets a 403 and the screens say so.
 */
import { apiClient, getErrorMessage, isApiError } from "@/lib/api-client";

export interface AccountRole {
  id: string;
  name: string;
  isMaster: boolean;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isLocked: boolean;
  /** Built in: it can be deactivated but never deleted. */
  isSystemUser: boolean;
  /** Has a credential row — a person can actually sign in as this account. */
  canSignIn: boolean;
  lastLogin: string | null;
  createdAt: string | null;
  roles: AccountRole[];
}

export interface AccountPage {
  data: Account[];
  total: number;
  limit: number;
  offset: number;
}

export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  isMasterRole: boolean;
  isActive: boolean;
  userCount: number;
}

export interface AccountInput {
  name: string;
  email: string;
  password?: string;
  roleIds: string[];
  isActive: boolean;
  isLocked?: boolean;
}

export const PAGE_SIZE = 25;
export const MIN_PASSWORD_LENGTH = 8;

export const accountKeys = {
  all: ["admin", "accounts"] as const,
  list: (search: string, offset: number) => ["admin", "accounts", "list", search, offset] as const,
  roles: ["admin", "accounts", "roles"] as const,
  me: ["admin", "accounts", "me"] as const,
};

export function fetchAccounts(search: string, offset: number): Promise<AccountPage> {
  return apiClient.get<AccountPage>("/accounts", {
    search: search.trim() || undefined,
    limit: PAGE_SIZE,
    offset,
  });
}

export async function fetchRoles(): Promise<RoleRecord[]> {
  const result = await apiClient.get<{ data: RoleRecord[] }>("/accounts/roles");
  return result.data;
}

/** The signed-in person's own `sys_user_id`, so the screen can protect it. */
export async function fetchOwnAccountId(): Promise<string | null> {
  const result = await apiClient.get<{ user?: { sysUserId?: string } }>("/auth/me");
  return result.user?.sysUserId ?? null;
}

export function createAccount(input: AccountInput): Promise<Account> {
  return apiClient.post<Account>("/accounts", input);
}

export function updateAccount(id: string, input: Partial<AccountInput>): Promise<Account> {
  return apiClient.patch<Account>(`/accounts/${id}`, input);
}

export function resetPassword(id: string, password: string): Promise<{ success: boolean }> {
  return apiClient.post<{ success: boolean }>(`/accounts/${id}/reset-password`, { password });
}

export function deleteAccount(id: string): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/accounts/${id}`);
}

export function createRole(input: {
  name: string;
  description?: string;
  isMasterRole: boolean;
  isActive: boolean;
}): Promise<RoleRecord> {
  return apiClient.post<RoleRecord>("/accounts/roles", input);
}

export function updateRole(
  id: string,
  input: Partial<{ name: string; description: string; isMasterRole: boolean; isActive: boolean }>
): Promise<RoleRecord> {
  return apiClient.patch<RoleRecord>(`/accounts/roles/${id}`, input);
}

/**
 * Every reason a request was refused, one per line.
 *
 * A validation failure carries a list (`errors`), and showing only the
 * "Validation failed" headline would hide what the person has to fix.
 */
export function reasons(error: unknown): string[] {
  if (isApiError(error)) {
    const list: unknown = error.errors;
    if (Array.isArray(list) && list.length > 0) {
      return list.map(String);
    }
  }
  return [getErrorMessage(error)];
}

/** `2 minutes ago` is noise on an audit-style table; the date and time are not. */
export function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}
