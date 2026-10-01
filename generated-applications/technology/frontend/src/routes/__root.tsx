import { Box, HStack, Heading, Text } from "@/components/ui/layout";
// `HeadContent` and `Scripts` live on the router now, not the framework
// package — they moved there when `@tanstack/start` became
// `@tanstack/react-start`.
import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'
import { Providers } from '../providers'
import { AppShell } from '@/components/layout/app-shell'
import { ThemeSelector } from '@/components/theme-selector'
import { Toaster } from 'sonner'
import globalsCssUrl from '../styles/globals.css?url'

function RootErrorComponent({ error }: { error: Error }) {
  return (
    <html lang="en">
      <head>
        <title>Error - technology</title>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <HStack align="center" justify="center" padding={4} className="min-h-screen bg-background">
          <Box padding={8} maxWidth="md" width="full" className="swiss-card text-center space-y-4">
            <HStack align="center" justify="center" className="h-16 w-16 rounded-full bg-destructive/20 mx-auto">
              <Text weight="bold" color="danger" className="text-2xl">!</Text>
            </HStack>
            <Heading level={2} color="primary" className="font-display">
              Something went wrong
            </Heading>
            <Text size="sm" color="secondary" block>{error?.message || 'An unexpected error occurred'}</Text>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline font-medium"
            >
              Reload page
            </button>
          </Box>
        </HStack>
        <Scripts />
      </body>
    </html>
  )
}

function RootNotFoundComponent() {
  return (
    <html lang="en">
      <head>
        <title>Not Found - technology</title>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <HStack align="center" justify="center" padding={4} className="min-h-screen bg-background">
          <Box padding={8} maxWidth="md" width="full" className="swiss-card text-center space-y-4">
            <Text weight="bold" block className="font-display text-6xl text-muted-foreground/30">404</Text>
            <Heading level={2} color="primary" className="font-display">Page not found</Heading>
            <Text size="sm" color="secondary" block>
              The page you are looking for does not exist.
            </Text>
            <Link to="/dashboard" className="text-sm text-primary hover:underline font-medium">
              Go to Dashboard
            </Link>
          </Box>
        </HStack>
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    links: [
      { rel: 'stylesheet', href: globalsCssUrl },
      { rel: 'icon', href: '/favicon.ico' },
      // Webfonts are served from public/fonts, not a font CDN: a third-party
      // stylesheet in the critical path means the app renders wrong wherever
      // that host is unreachable — corporate proxy, air-gapped site, CI.
      { rel: 'stylesheet', href: '/fonts/fonts.css' },
    ],
  }),
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
  component: RootLayout,
})

function RootLayout() {
  return (
    <html lang="en">
      <head>
        <title>technology</title>
        <meta name="description" content="Generated application" />
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {/* One sidebar and one header for every screen that has chrome;
              `AppShell` decides which those are, and renders the page bare on
              the rest. Before this, `__root` wrapped everything in a plain
              `<main>`, the dashboard drew its own header, and entity screens
              drew none — so opening a record lost the account menu and the way
              out until you navigated back. */}
          <AppShell>
            <Outlet />
          </AppShell>
          {/* Inside Providers because it reads the Astryx theme context, and
              floating because the shell's header is fixed-height chrome that
              every screen shares — a control docked into it would have to be
              rebuilt for the sign-in page, which has no header at all. */}
          <ThemeSelector variant="floating" />
        </Providers>
        <Toaster richColors position="top-right" />
        <Scripts />
      </body>
    </html>
  )
}
