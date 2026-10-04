/**
 * Sign-in: one password, three sessions.
 *
 * The chat has no password store of its own. A person signs in with their
 * account in the generated application; the application checks the password
 * and answers with its token. The gateway then:
 *
 * 1. creates the chat's own Better Auth session (`chat.session_token`), which
 *    is what every chat request is authenticated by;
 * 2. keeps the application token, sealed, keyed by that session, so tools can
 *    act as the person — and relays the application's own cookie to the
 *    browser, narrowed to the application's path, so embedded screens are
 *    signed in;
 * 3. signs the person in to the reporting platform with a sixty-second,
 *    single-use Ed25519 assertion, keeps that session sealed too, and relays its
 *    cookie narrowed to the reporting path.
 *
 * Roles are not copied anywhere they could go stale: the application and the
 * reporting platform read them per request. Signing out ends all three.
 */

import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { getMigrations } from "better-auth/db/migration";
import type { Kysely } from "kysely";
import type pg from "pg";
import * as z from "zod";
import { ApplicationClient, ApplicationError } from "./application";
import type { GatewayConfig } from "./config";
import { deriveKey, open, seal, signAssertion } from "./crypto";
import type { ChatDatabase } from "./db";
import type { ReportingClient } from "./reporting";

/** Set by the gateway on every request it hands to Better Auth; overwritten if a client sends it. */
export const CLIENT_IP_HEADER = "x-chat-client-ip";

export interface SessionCredentials {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  roles: string[];
  isMaster: boolean;
  appToken: string;
  reportSession: string | null;
}

interface AuthDependencies {
  config: GatewayConfig;
  pool: pg.Pool;
  db: Kysely<ChatDatabase>;
  application: ApplicationClient;
  reporting: ReportingClient | null;
}

interface CookieParts {
  name: string;
  value: string;
  maxAge: number | undefined;
}

/** Name, value and lifetime of the first cookie in a `Set-Cookie` header. */
/**
 * Split one upstream `Set-Cookie` into what `ctx.setCookie` takes.
 *
 * The value is decoded once, because `ctx.setCookie` encodes it: the reporting
 * platform's signed cookie is already percent-encoded (`…%3D`), and relayed as
 * it came it reached the browser as `…%253D` — a cookie the platform could no
 * longer verify, so every embedded report page redirected to its sign-in.
 */
export function parseSetCookie(header: string): CookieParts | null {
  const [pair, ...attributes] = header.split(";");
  const at = pair?.indexOf("=") ?? -1;
  if (!pair || at <= 0) return null;
  const maxAge = attributes
    .map((part) => part.trim())
    .find((part) => /^max-age=/i.test(part))
    ?.split("=")[1];
  const raw = pair.slice(at + 1).trim();
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    // Not percent-encoded after all (a bare `%`): relay it as written.
  }
  return {
    name: pair.slice(0, at).trim(),
    value,
    maxAge: maxAge === undefined ? undefined : Number(maxAge),
  };
}

export function createAuth(deps: AuthDependencies) {
  const { config, db, application, reporting } = deps;
  const credentialKey = deriveKey(config.authSecret, "stored-credential");

  const applicationSignIn = {
    id: "application-sign-in",
    endpoints: {
      signInApplication: createAuthEndpoint(
        "/sign-in/application",
        {
          method: "POST",
          body: z.object({
            email: z.string().min(3).max(320),
            password: z.string().min(1).max(1024),
          }),
        },
        async (ctx) => {
          const { email, password } = ctx.body;
          let signedIn;
          try {
            signedIn = await application.signIn(email.trim(), password);
          } catch (error) {
            if (error instanceof ApplicationError && error.status === 401) {
              throw APIError.from("UNAUTHORIZED", {
                code: "INVALID_EMAIL_OR_PASSWORD",
                message: "The email or password was not accepted by the application.",
              });
            }
            throw APIError.from("SERVICE_UNAVAILABLE", {
              code: "APPLICATION_UNAVAILABLE",
              message: error instanceof Error ? error.message : "The application could not be reached.",
            });
          }
          const dashboard = await application.dashboard(signedIn.token);
          const roles = [signedIn.user.role ?? dashboard.role].filter((role): role is string => Boolean(role));

          const normalisedEmail = signedIn.user.email.toLowerCase();
          const adapter = ctx.context.internalAdapter;
          const existing = await adapter.findUserByEmail(normalisedEmail);
          const user =
            existing?.user ??
            (await adapter.createUser({
              email: normalisedEmail,
              name: signedIn.user.name,
              emailVerified: true,
            }));
          if (!user) {
            throw APIError.from("INTERNAL_SERVER_ERROR", { code: "USER_NOT_CREATED", message: "The chat could not record the account." });
          }
          const session = await adapter.createSession(user.id, false);
          if (!session) {
            throw APIError.from("INTERNAL_SERVER_ERROR", { code: "SESSION_NOT_CREATED", message: "The chat could not start a session." });
          }

          let reportSession: string | null = null;
          if (reporting && config.ssoSigningKey) {
            try {
              const assertion = signAssertion(config.ssoSigningKey, {
                email: normalisedEmail,
                name: signedIn.user.name,
                roles,
                master: dashboard.isMaster,
              });
              const report = await reporting.signInWithAssertion(assertion);
              reportSession = report.cookie;
              const parts = parseSetCookie(report.setCookie);
              if (parts) {
                ctx.setCookie(parts.name, parts.value, {
                  httpOnly: true,
                  secure: config.secureCookies,
                  sameSite: "lax",
                  path: config.reportPublicPath || "/",
                  ...(parts.maxAge === undefined ? {} : { maxAge: parts.maxAge }),
                });
              }
            } catch (error) {
              // The reporting platform being down must not keep someone out of
              // the application; the report tools say it is unavailable.
              ctx.context.logger.warn("reporting sign-in failed", { error: (error as Error).message });
            }
          }

          if (signedIn.setCookie) {
            const parts = parseSetCookie(signedIn.setCookie);
            if (parts) {
              ctx.setCookie(parts.name, parts.value, {
                httpOnly: true,
                secure: config.secureCookies,
                sameSite: "lax",
                path: config.appPublicPath || "/",
                ...(parts.maxAge === undefined ? {} : { maxAge: parts.maxAge }),
              });
            }
          }

          await db
            .insertInto("credentials")
            .values({
              session_id: session.id,
              user_id: user.id,
              email: normalisedEmail,
              name: signedIn.user.name,
              roles,
              is_master: dashboard.isMaster,
              app_token: seal(credentialKey, signedIn.token, `session:${session.id}`),
              report_token: reportSession === null ? null : seal(credentialKey, reportSession, `session:${session.id}`),
              expires_at: session.expiresAt,
            })
            .onConflict((oc) => oc.column("session_id").doNothing())
            .execute();

          await setSessionCookie(ctx, { session, user });
          return ctx.json({ user: { email: normalisedEmail, name: signedIn.user.name }, reporting: reportSession !== null });
        }
      ),
    },
    rateLimit: [{ pathMatcher: (path: string) => path === "/sign-in/application", window: 60, max: 5 }],
  } satisfies BetterAuthPlugin;

  const auth = betterAuth({
    appName: "Business chat",
    secret: config.authSecret,
    baseURL: config.publicOrigin,
    basePath: `${config.basePath}/_/auth`,
    database: deps.pool,
    trustedOrigins: [config.publicOrigin],
    emailAndPassword: { enabled: false },
    session: { expiresIn: 60 * 60 * 12, updateAge: 60 * 60 },
    advanced: {
      // The gateway writes this header itself on every request (server.ts), from
      // the socket or from a trusted proxy's X-Forwarded-For — never from the
      // client — so the sign-in rate limit counts real addresses.
      ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
      cookiePrefix: "chat",
      useSecureCookies: config.secureCookies,
      defaultCookieAttributes: { path: config.basePath || "/", sameSite: "lax", httpOnly: true },
    },
    rateLimit: { enabled: true, window: 60, max: 120, storage: "memory" },
    plugins: [applicationSignIn],
  });

  async function migrate(): Promise<void> {
    const { runMigrations } = await getMigrations(auth.options);
    await runMigrations();
  }

  /** The signed-in person behind a request, with their sealed credentials opened; null when signed out. */
  async function credentialsFor(request: Request): Promise<SessionCredentials | null> {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return null;
    return credentialsForSession(session.session.id);
  }

  async function credentialsForSession(sessionId: string): Promise<SessionCredentials | null> {
    const row = await db.selectFrom("credentials").selectAll().where("session_id", "=", sessionId).executeTakeFirst();
    if (!row || row.expires_at.getTime() < Date.now()) return null;
    const appToken = open(credentialKey, row.app_token, `session:${sessionId}`);
    if (appToken === null) return null;
    return {
      sessionId,
      userId: row.user_id,
      email: row.email,
      name: row.name,
      roles: row.roles,
      isMaster: row.is_master,
      appToken,
      reportSession: row.report_token === null ? null : open(credentialKey, row.report_token, `session:${sessionId}`),
    };
  }

  /** The newest live credentials of a person — what a host's tool call acts with. */
  async function latestCredentialsForUser(userId: string): Promise<SessionCredentials | null> {
    const row = await db
      .selectFrom("credentials")
      .select("session_id")
      .where("user_id", "=", userId)
      .where("expires_at", ">", new Date())
      .orderBy("created_at", "desc")
      .executeTakeFirst();
    return row ? credentialsForSession(row.session_id) : null;
  }

  /** End the chat session and the two it opened. Returns the `Set-Cookie` headers that clear them. */
  async function signOutEverywhere(request: Request): Promise<string[]> {
    const credentials = await credentialsFor(request);
    const cleared: string[] = [];
    const secure = config.secureCookies ? "; Secure" : "";
    if (credentials) {
      if (credentials.reportSession && reporting) await reporting.signOut(credentials.reportSession).catch(() => undefined);
      await db.deleteFrom("credentials").where("session_id", "=", credentials.sessionId).execute();
      const reportName = credentials.reportSession?.split("=")[0];
      if (reportName) cleared.push(`${reportName}=; Path=${config.reportPublicPath || "/"}; Max-Age=0; HttpOnly; SameSite=Lax${secure}`);
    }
    cleared.push(`token=; Path=${config.appPublicPath || "/"}; Max-Age=0; HttpOnly; SameSite=Lax${secure}`);
    const response = await auth.api.signOut({ headers: request.headers, asResponse: true });
    for (const header of response.headers.getSetCookie()) cleared.push(header);
    return cleared;
  }

  return { auth, migrate, credentialsFor, credentialsForSession, latestCredentialsForUser, signOutEverywhere };
}

export type GatewayAuth = ReturnType<typeof createAuth>;
