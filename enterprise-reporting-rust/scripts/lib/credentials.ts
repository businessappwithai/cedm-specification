/**
 * Credential helpers for the diagnostic scripts.
 *
 * Since the move to Better Auth the live password is `auth_accounts.password`
 * for provider `credential`, not `users.password_hash`. A script still reading
 * the old column does not fail — it reads a stale hash and reports a confident,
 * wrong answer about whether a password works.
 */

import bcrypt from "bcryptjs";
import type { Kysely } from "kysely";
import type { Database } from "../../src/lib/db/kysely-db";
import { BCRYPT_COST } from "@/lib/auth/bcrypt-cost";

export async function getCredential(db: Kysely<Database>, userId: string) {
  return db
    .selectFrom("auth_accounts")
    .select(["id", "password"])
    .where("user_id", "=", userId)
    .where("provider_id", "=", "credential")
    .executeTakeFirst();
}

/** Does `password` sign this user in? Answers against what Better Auth reads. */
export async function checkPassword(
  db: Kysely<Database>,
  userId: string,
  password: string
): Promise<boolean> {
  const credential = await getCredential(db, userId);
  if (!credential?.password) return false;
  return bcrypt.compare(password, credential.password);
}

/** Set (or create) the credential Better Auth will verify against. */
export async function setPassword(
  db: Kysely<Database>,
  userId: string,
  password: string
): Promise<void> {
  // bcrypt to match the hash/verify hooks in src/lib/auth/better-auth.ts.
  const hash = await bcrypt.hash(password, BCRYPT_COST);
  const existing = await getCredential(db, userId);

  if (existing) {
    await db
      .updateTable("auth_accounts")
      .set({ password: hash, updated_at: new Date() })
      .where("id", "=", existing.id)
      .execute();
    return;
  }

  await db
    .insertInto("auth_accounts")
    .values({
      id: `cred_${userId}`.slice(0, 255),
      user_id: userId,
      account_id: userId,
      provider_id: "credential",
      password: hash,
      access_token: null,
      refresh_token: null,
      id_token: null,
      access_token_expires_at: null,
      refresh_token_expires_at: null,
      scope: null,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .execute();
}
