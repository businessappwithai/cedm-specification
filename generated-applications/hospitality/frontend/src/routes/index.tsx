/**
 * Home Page - Redirect to Dashboard
 *
 * Automatically redirects to the main dashboard page.
 *
 * Generated: 2026-10-01T04:34:21.746Z
 */

import { createFileRoute, redirect } from '@tanstack/react-router';
import { Box, HStack } from "@/components/ui/layout";

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
  component: () => (
    <HStack align="center" justify="center" className="min-h-screen">
      <Box radius="full" border="strong" borderSide="bottom" className="animate-spin h-8 w-8 border-gray-900" />
    </HStack>
  ),
});
