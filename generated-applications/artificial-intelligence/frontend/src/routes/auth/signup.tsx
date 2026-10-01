/**
 * Signup Page - Swiss Clean Design
 *
 * User registration with email, password, and name
 *
 * Generated: 2026-10-01T15:42:33.456Z
 * Project: artificial-intelligence
 */

import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { signIn, signUp } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, AlertCircle, Mail, Lock, User, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Box, HStack, Heading, Text } from "@/components/ui/layout";

export const Route = createFileRoute('/auth/signup')({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsPending(true);

    if (!validateForm()) {
      setIsPending(false);
      return;
    }

    try {
      const { data, error: signUpError } = await signUp(email, password, name);

      if (signUpError || !data) {
        const msg = signUpError || 'Failed to create account';
        setError(msg);
        toast.error('Sign up failed', {
          description: msg,
        });
        setIsPending(false);
        return;
      }

      // Registering does not sign you in — the backend returns the created
      // user and no token. Without this the redirect below lands on a
      // dashboard with no session and bounces straight back to the login page.
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setSuccess(true);
        toast.success('Account created', {
          description: 'Please sign in with your new account.',
        });
        setTimeout(() => {
          navigate({ to: '/auth/login' });
        }, 1500);
        return;
      }

      setSuccess(true);
      toast.success('Account created successfully!', {
        description: 'Redirecting to dashboard...',
      });

      // A full navigation, matching sign-in: the auth context reads the session
      // once on mount, so a client-side transition would render as signed out.
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      const errorMessage = err?.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast.error('Sign up failed', {
        description: errorMessage,
      });
      setIsPending(false);
    }
  };

  if (success) {
    return (
      <HStack align="center" justify="center" padding={4} className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Box width="full" maxWidth="md">
          <Box padding={8} border="default" className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-lg text-center">
            <Box radius="full" marginBottom={6} className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600">
              <CheckCircle2 size={40} />
            </Box>
            <Heading level={1} color="primary" className="text-2xl mb-2">Account Created!</Heading>
            <Text color="secondary" block className="mb-6">
              Your account has been successfully created. Redirecting you to the dashboard...
            </Text>
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          </Box>
        </Box>
      </HStack>
    );
  }

  return (
    <HStack align="center" justify="center" padding={4} className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Box width="full" maxWidth="md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg mb-6">
            <Shield size={40} />
          </div>
          <Heading level={1} color="primary" className="text-3xl mb-2">Create Account</Heading>
          <Text color="secondary" block>Join artificial-intelligence</Text>
        </div>

        {/* Signup Form Card */}
        <Box padding={8} border="default" className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <HStack align="start" gap={3} padding={4} className="rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <Text size="sm" color="danger" weight="medium" block>Sign up failed</Text>
                  <Text size="sm" block className="text-destructive/80 mt-1">{error}</Text>
                </div>
              </HStack>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-background/80 backdrop-blur-sm border-border/60"
                  disabled={isPending}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  required
                />
              </div>
              <Text size="xs" color="secondary" block>Must be at least 8 characters long</Text>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-background/80 backdrop-blur-sm border-border/60"
                  disabled={isPending}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full shadow-md shadow-primary/20"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
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
                Already have an account?
              </Text>
            </HStack>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Sign in to your account
              <UserPlus className="ml-1 h-4 w-4" />
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
