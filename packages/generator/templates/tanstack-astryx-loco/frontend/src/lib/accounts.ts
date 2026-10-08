/**
 * Shapes and error text shared by the account and role screens.
 *
 * Both screens talk to `/api/accounts`, whose writes refuse for reasons a
 * person has to read — "this would leave no active administrator", "you cannot
 * deactivate your own account" — so the error text is the backend's own rather
 * than a generic "something went wrong".
 */
import { getErrorMessage, isApiError } from "@/lib/api-client";

/** A role as `/api/accounts/roles` reports it. */
export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isMasterRole: boolean;
  isActive: boolean;
  userCount: number;
}

/** A role as it appears on an account. */
export interface AccountRole {
  id: string;
  name: string;
  isMasterRole: boolean;
}

/**
 * The message a refusal carries, with its validation list when it has one.
 *
 * A 400 from the backend says `Validation failed` and puts the reasons in
 * `errors`; showing only the first would tell the person nothing they can fix.
 */
export function describeError(error: unknown): string {
  const message = getErrorMessage(error);
  const errors = isApiError(error) ? (error as { errors?: unknown }).errors : undefined;
  if (Array.isArray(errors) && errors.length > 0) {
    return `${message}: ${errors.join("; ")}`;
  }
  return message;
}
