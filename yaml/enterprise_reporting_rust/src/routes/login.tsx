import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader, getRequestHeader } from "@tanstack/react-start/server";
import { BarChart3, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forwardAuthToRust } from "@/lib/api/backend";
import { getAuth } from "@/lib/auth/better-auth";
import { loadRolesAndPermissions } from "@/lib/auth/session";
import { createLogger } from "@/lib/logging/logger";
import { AUDIT_ACTIONS } from "@/types/actions";
import { LOG_COMPONENTS } from "@/types/components";

if (import.meta.hot) {
  import.meta.hot.decline();
}

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const logger = createLogger({ component: LOG_COMPONENTS.Authentication });
    const timestamp = new Date().toISOString();
    const userAgent = getRequestHeader("user-agent") || "unknown";

    try {
      logger.info("Login attempt", {
        email: data.email,
        action: AUDIT_ACTIONS.AUTH.LOGIN_ATTEMPT,
        timestamp,
        userAgent,
      });

      // Better Auth issues the session and returns the Set-Cookie header on its
      // own response; `asResponse` is what makes those headers reachable so
      // they can be forwarded to the browser. Without it the call succeeds, no
      // cookie is set, and the very next request is anonymous — a sign-in that
      // reports success and lands the user back on the login page.
      // With the Rust backend configured, sign-in is its HTTP route — which,
      // unlike this in-process call, is rate-limited (MIGRATION_PLAN.md §9, D-29).
      const authResponse =
        (await forwardAuthToRust(
          "/api/auth/sign-in/email",
          { email: data.email, password: data.password },
          { withCookie: false }
        )) ??
        (await getAuth().api.signInEmail({
          body: { email: data.email, password: data.password },
          asResponse: true,
        }));

      if (authResponse.status === 429) {
        logger.warn("Login rate-limited", {
          email: data.email,
          action: AUDIT_ACTIONS.AUTH.LOGIN_FAILURE,
          timestamp,
          userAgent,
        });
        throw new Error("Too many requests. Please try again later.");
      }

      if (!authResponse.ok) {
        logger.warn("Failed login attempt - invalid credentials", {
          email: data.email,
          action: AUDIT_ACTIONS.AUTH.LOGIN_FAILURE,
          timestamp,
          // Deliberately not distinguishing "no such account" from "wrong
          // password": a different answer for each is an account-enumeration
          // oracle, and the E2E suite asserts they stay identical.
          reason: "Invalid email or password",
          userAgent,
        });
        throw new Error("Invalid credentials");
      }

      for (const cookie of authResponse.headers.getSetCookie()) {
        setResponseHeader("Set-Cookie", cookie);
      }

      const body = (await authResponse.json()) as {
        user?: { id: string; email: string; name?: string };
      };
      const user = body.user;
      const { roles } = user ? await loadRolesAndPermissions(user.id) : { roles: [] };

      logger.info("Login successful", {
        userId: user?.id,
        email: user?.email ?? data.email,
        userName: user?.name,
        action: AUDIT_ACTIONS.AUTH.LOGIN_SUCCESS,
        roles,
        timestamp,
        userAgent,
      });

      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Login error", error instanceof Error ? error : new Error(errorMessage), {
        email: data.email,
        timestamp,
        errorMessage,
        userAgent,
      });
      throw error;
    }
  });

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function doLogin() {
    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";
    if (!email || !password) return;

    setServerError("");
    setIsSubmitting(true);
    try {
      await loginFn({ data: { email, password } });
      queryClient.clear();
      await navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") doLogin();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary p-3">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="font-semibold text-2xl text-tremor-content-strong">
            Welcome back
          </CardTitle>
          <CardDescription>Sign in to your Enterprise Reporting account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              ref={emailRef}
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
              disabled={isSubmitting}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              ref={passwordRef}
              type="password"
              autoComplete="current-password"
              required
              disabled={isSubmitting}
              onKeyDown={handleKeyDown}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button type="button" className="w-full" disabled={isSubmitting} onClick={doLogin}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
