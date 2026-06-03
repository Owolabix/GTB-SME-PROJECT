// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import mkcert from "vite-plugin-mkcert";
import { nitro } from "nitro/vite";
// in plugins: [mkcert(...), nitro(), ...]  // mkcert only for local dev

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  // Trusted local HTTPS (green padlock). First `npm run dev` may prompt to install mkcert CA (admin once).
  plugins: [mkcert({ hosts: ["localhost", "127.0.0.1"] }), nitro()],
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    build: {
      // Analytics (recharts) and main vendor chunk exceed 500 kB; routes are still code-split.
      chunkSizeWarningLimit: 700,
    },
  },
});
