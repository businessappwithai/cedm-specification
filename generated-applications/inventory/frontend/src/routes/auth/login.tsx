/**
 * Login Page - Swiss Clean Design
 *
 * User authentication with email and password
 *
 * Generated: 2026-10-02T03:47:01.103Z
 * Project: inventory
 */

import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { signIn } from '@/lib/auth';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn, AlertCircle, Mail, Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Box, HStack, Heading, Text } from "@/components/ui/layout";

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPending(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsPending(false);
      return;
    }

    try {
      const { data, error: signInError } = await signIn(email, password);

      if (signInError || !data) {
        const msg = signInError || 'Invalid email or password';
        setError(msg);
        toast.error('Sign in failed', {
          description: msg,
        });
        setIsPending(false);
        return;
      }

      // Persist token so api-client can send Authorization header after hard nav
      const token = (data as Record<string, unknown>)?.token as string | undefined;
      if (token) sessionStorage.setItem('auth_token', token);

      // Full navigation so auth-context re-initializes with the new session cookie
      window.location.href = '/dashboard';
    } catch (err: any) {
      const errorMessage = err?.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast.error('Sign in failed', {
        description: errorMessage,
      });
      setIsPending(false);
    }
  };

  return (
    <HStack align="center" justify="center" padding={4} className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Box width="full" maxWidth="md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg mb-6">
            <Shield size={40} />
          </div>
          <Heading level={1} color="primary" className="text-3xl mb-2">Welcome Back</Heading>
          <Text color="secondary" block>Sign in to access inventory</Text>
        </div>

        {/* Login Form Card */}
        <Box padding={8} border="default" className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <HStack align="start" gap={3} padding={4} className="rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <Text size="sm" color="danger" weight="medium" block>Sign in failed</Text>
                  <Text size="sm" block className="text-destructive/80 mt-1">{error}</Text>
                </div>
              </HStack>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background/80 backdrop-blur-sm border-border/60"
                  disabled={isPending}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background/80 backdrop-blur-sm border-border/60"
                  disabled={isPending}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <HStack align="center" justify="between">
              <HStack align="center" className="space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isPending}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal text-muted-foreground cursor-pointer"
                >
                  Remember me
                </Label>
              </HStack>
              <a
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot password?
              </a>
            </HStack>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full shadow-md shadow-primary/20"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <HStack align="center" className="absolute inset-0">
              <Box width="full" border="default" borderSide="top" className="border-border/40" />
            </HStack>
            <HStack justify="center" className="relative text-sm">
              <Text color="secondary" className="px-2 bg-card bg-gradient-to-r from-card via-card to-card">
                Don&apos;t have an account?
              </Text>
            </HStack>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <Link
              to="/auth/signup"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Create a new account
              <LogIn className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </Box>

        {/* Footer */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </Box>
    </HStack>
  );
}
