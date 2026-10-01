import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import path from 'path'
import { isRustRoute } from './src/lib/api/rust-routes'

/*
 * ERS_RUST_API_URL (e.g. http://localhost:5150) sends every route the Rust
 * backend serves — exactly the ones listed in rust/routes.json — to it, and
 * leaves everything else (sign-in included) on this server. Unset, nothing
 * changes. This is the dev-server form of the per-area nginx cut-over in
 * rust/MIGRATION_PLAN.md; a response from Rust carries `x-ers-backend: loco-rs`.
 */
function rustApiProxy() {
  const target = process.env.ERS_RUST_API_URL
  if (!target) return undefined
  return {
    '/api': {
      target,
      // Return the URL to skip the proxy and fall through to this server.
      bypass: (req: { method?: string; url?: string }) => {
        const pathname = (req.url ?? '').split('?')[0]
        return isRustRoute(req.method ?? 'GET', pathname) ? undefined : req.url
      },
    },
  }
}

export default defineConfig({
  plugins: [
    tanstackStart(),
    viteReact(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  server: {
    port: 4050,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    // rust/ is the Loco backend port. A `cargo build` writes ~11k files under
    // rust/target, and watching them stalled the dev server outright.
    watch: {
      ignored: ['**/rust/**'],
    },
    proxy: rustApiProxy(),
  },
  ssr: {
    noExternal: ['@tanstack/react-router', '@tanstack/react-start', /^@radix-ui/],
    // better-auth must NOT be bundled into the server build.
    //
    // It depends on zod ^4, this application on zod ^3, and both are installed
    // — v4 nested under better-auth, v3 hoisted. Node's resolution gets that
    // right; the bundler flattens it and hands better-auth the hoisted v3,
    // which fails at runtime on `z.looseObject is not a function` — a 500 on
    // every sign-in, from a build that succeeded and a typecheck that passed.
    // Leaving it external keeps the nested resolution that works.
    external: ['better-auth'],
  },
})
