/**
 * Vite config for technology.
 *
 * This replaces the Vinxi `app.config.ts` the project used to carry.
 * `@tanstack/start` was renamed to `@tanstack/react-start` and moved off Vinxi
 * onto Vite; the old package's last release was 1.120.20 and every one of its
 * `@tanstack/*` dependencies is a caret range, so they drifted past breaking
 * changes independently and no consistent set of versions resolves any more.
 * There was no pin that fixed it — only this migration.
 *
 * `client.tsx` and `ssr.tsx` are gone with it: the `tanstackStart()` plugin
 * generates both entry points now, so hand-written ones would shadow it.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 3001,
    proxy: {
      // The Loco backend is a separate process on its own port. Proxying keeps
      // the browser on one origin in development, so cookies and CORS behave
      // the same way they will in production behind a reverse proxy.
      "/api": {
        // `BACKEND_URL`, not `VITE_API_URL`. The two are different jobs and
        // sharing one name broke the browser: `VITE_API_URL` is baked into the
        // client bundle as its API base, so setting it made every fetch go
        // straight to the backend origin — bypassing this proxy and failing
        // CORS preflight. Un-prefixed, this one never reaches the client.
        target: process.env.BACKEND_URL || "http://localhost:3000",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("error", (_err, req, res) => {
            // `res` is `ServerResponse | Socket`: a failed websocket upgrade
            // hands back the raw socket, which has no status line to write.
            // Narrowing on `writeHead` is what makes the branch below sound —
            // calling it blind would throw inside an error handler.
            if (!("writeHead" in res) || res.headersSent) return;

            // A dead backend should not look like a logged-in session. Auth
            // probes get an explicit "nobody is signed in" rather than a
            // network error the client would surface as a crash; everything
            // else gets a plain 503.
            if (req.url?.includes("/auth/")) {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ user: null, session: null }));
            } else {
              res.writeHead(503, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Backend unavailable" }));
            }
          });
        },
      },
    },
  },

  // `vite preview` is this application's production server — the Dockerfile
  // and the `start` script both run it — so its host check is the one a
  // deployed app gets. Vite's default admits only localhost, and behind a
  // reverse proxy under any real domain every page answered 403 "Blocked
  // request. This host is not allowed": the proxy passes the public Host
  // through. The proxy in front owns that decision, so every host is admitted
  // unless ALLOWED_HOSTS (comma-separated) narrows it.
  preview: {
    allowedHosts:
      process.env.ALLOWED_HOSTS?.split(",")
        .map((host) => host.trim())
        .filter(Boolean) ?? true,
  },

  ssr: {
    // Astryx's theme packages ship `dist/built.js` with extensionless relative
    // imports (`./icons`). A bundler resolves those; Node's ESM loader — which
    // is what Vite SSR externals go through — does not, and the render dies
    // with ERR_MODULE_NOT_FOUND. Bundling them instead of externalising fixes
    // it, and costs nothing: they are small token objects.
    noExternal: [/^@astryxdesign\//],
  },

  optimizeDeps: {
    // Native/WASM modules Vite must not pre-bundle.
    exclude: ["@electric-sql/pglite", "@electric-sql/pglite-sync"],
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  plugins: [
    // Tailwind v4 runs as a Vite plugin, not a PostCSS step. It is still here
    // during the Astryx migration because `components/admin/*` has not been
    // ported off utility classes yet — Phase C removes it.
    tailwindcss(),
    // No options: `tsr` was not one, and passing it did nothing. The plugin
    // takes `srcDirectory` at the top level and `routesDirectory` /
    // `generatedRouteTree` under `router` — and its defaults (`src`,
    // `src/routes`, `src/routeTree.gen.ts`) are already exactly this layout,
    // so the correct config here is none at all.
    tanstackStart(),
    viteReact(),
  ],
});
