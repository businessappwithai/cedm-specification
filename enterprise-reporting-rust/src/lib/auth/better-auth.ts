/**
 * Better Auth — the single authentication authority for this application.
 *
 * This replaced a hand-rolled HS256 JWT (`jose`) that carried the whole user,
 * their roles and their permissions inside the cookie. Two properties of that
 * design are worth remembering, because moving to Better Auth is what fixes
 * them:
 *
 *   - A JWT is a bearer claim, not a lookup. Roles and permissions were frozen
 *     into the token at sign-in, so revoking a role left the old token granting
 *     it for up to 30 days. Better Auth stores a session row and resolves RBAC
 *     per request, so a revoked role takes effect on the next request.
 *   - There was no way to end a session server-side. Now there is a row to
 *     delete.
 *
 * ── The user table is the EXISTING one ──────────────────────────────────────
 *
 * `roles`, `user_roles`, `resource_permissions`, `ds_user_roles` and the audit
 * log all key on `users.id`. Letting Better Auth create its own `user` table
 * would have orphaned every one of them, so the `user` model is mapped onto
 * `users` instead and only the columns Better Auth needs were added. RBAC is
 * untouched by this migration, which is the point.
 *
 * ── Passwords stay bcrypt ───────────────────────────────────────────────────
 *
 * Better Auth hashes with scrypt by default. Every existing password in this
 * installation is a bcrypt hash, and there is no way to convert one without the
 * plaintext — so the `hash`/`verify` hooks below keep bcryptjs as the algorithm.
 * Existing users keep signing in with the passwords they have. Swapping to
 * scrypt later means a rehash-on-next-sign-in shim, not a config change.
 */

import { betterAuth } from "better-auth";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/config";
import { BCRYPT_COST } from "./bcrypt-cost";

const authSecret = process.env.AUTH_SECRET;
if (!authSecret || authSecret.length < 32) {
  throw new Error(
    "[FATAL] AUTH_SECRET env var is missing or too short (minimum 32 characters). " +
      "Set a secure random string: openssl rand -base64 32"
  );
}

/**
 * The cookie prefix is deliberately distinct from the generated application's
 * (`<project>_app`). Both are served from one origin behind nginx — /report and
 * /app — and Better Auth cookies are path `/`, so a shared prefix would have
 * the two applications overwriting each other's session on every sign-in.
 */
export const COOKIE_PREFIX = "ers";

function buildAuth() {
  return betterAuth({
    // `type` matters: without it Better Auth guesses a dialect and emits SQL
    // Postgres answers with nothing rather than an error — a sign-in that fails
    // as "invalid credentials" against a row that is sitting right there.
    database: { db: getDb() as never, type: "postgres" },
    secret: authSecret,
    baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:4050",
    basePath: "/api/auth",

    /*
     * The localhost origins are development conveniences, so they are only
     * trusted in development.
     *
     * They used to be listed unconditionally. On a deployed installation that
     * means the server accepts requests claiming a localhost origin, which is
     * a slice of CSRF surface with nothing to pay for it — nobody signs into
     * production from `http://localhost:4050`. A production deployment names
     * its real origin in CORS_ORIGIN, which is where the list should come from.
     */
    trustedOrigins: [
      ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()) : []),
      ...(process.env.NODE_ENV === "production"
        ? []
        : ["http://localhost:4050", "http://127.0.0.1:4050", "http://localhost:3000"]),
    ].filter(Boolean),

    /*
     * Rate limiting, which was not configured at all.
     *
     * Nothing in this application throttled anything: no limiter, no lockout,
     * and Better Auth's own `rateLimit` left at its default. Combined with the
     * credentials `bootstrapSchema` seeds — `admin@admin.com` / `admin` and
     * `nlquery@nlquery.com` / `nlquery` — an installation that had not changed
     * them could be entered by guessing, at whatever rate the network allowed.
     *
     * The window is deliberately tighter on the credential endpoints than on
     * the rest of the auth surface: signing in is the operation worth guessing
     * at, and a legitimate person does it once.
     */
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 3 },
        "/forget-password": { window: 60, max: 3 },
        "/reset-password": { window: 60, max: 5 },
      },
    },

    emailAndPassword: {
      enabled: true,
      /*
       * No self-registration. Accounts are created by an administrator
       * (`createUser`, or the bootstrap seed). Without this, Better Auth's own
       * `POST /api/auth/sign-up/email` was live: anyone who could reach the
       * server created an active account and got a session back
       * (rust/MIGRATION_PLAN.md §9, D-34).
       */
      disableSignUp: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      // See the header: bcrypt, so existing hashes keep verifying.
      /*
       * bcrypt, so existing hashes keep verifying — see the header.
       *
       * The cost is 12 rather than the 10 it was. `bcrypt.compare` reads the
       * cost out of the hash it is given, so every password stored at 10 keeps
       * working and only new or changed ones are written at 12; there is no
       * migration and nothing to coordinate. 10 has been the library default
       * since 2010 and is low for 2026 hardware.
       *
       * BCRYPT_COST exists because the right number depends on the machine,
       * and because a test suite that hashes a password per fixture should not
       * pay for production's margin.
       */
      password: {
        hash: async (password: string) => bcrypt.hash(password, BCRYPT_COST),
        verify: async ({ hash, password }: { hash: string; password: string }) =>
          bcrypt.compare(password, hash),
      },
    },

    // Mapped onto the existing `users` table — see the header.
    user: {
      modelName: "users",
      fields: {
        name: "display_name",
        image: "avatar_url",
        emailVerified: "email_verified",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      additionalFields: {
        is_active: { type: "boolean", required: false, defaultValue: true, input: false },
      },
    },

    session: {
      modelName: "auth_sessions",
      fields: {
        userId: "user_id",
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
      },
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },

    account: {
      modelName: "auth_accounts",
      fields: {
        userId: "user_id",
        accountId: "account_id",
        providerId: "provider_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },

    verification: {
      modelName: "auth_verifications",
      fields: {
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },

    advanced: {
      cookiePrefix: COOKIE_PREFIX,
      crossSubDomainCookies: { enabled: false },
    },
  });
}

// Typed off `buildAuth` rather than off `betterAuth`: the instance type is
// generic in the exact options object, so a `ReturnType<typeof betterAuth>`
// annotation is a different, incompatible type and the assignment is rejected.
let authInstance: ReturnType<typeof buildAuth> | null = null;

export function getAuth(): ReturnType<typeof buildAuth> {
  if (!authInstance) {
    authInstance = buildAuth();
  }
  return authInstance;
}

/** The cookie the browser actually carries, for the few places that read it directly. */
export const SESSION_COOKIE_NAME = `${COOKIE_PREFIX}.session_token`;
