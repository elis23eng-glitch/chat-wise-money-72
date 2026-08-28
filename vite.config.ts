// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        filename: "sw.js",
        devOptions: { enabled: false },
        workbox: {
          cacheId: "wise-money-v4",
          cleanupOutdatedCaches: true,
          navigateFallback: null,
          importScripts: ["/sw-version.js?v=v4"],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "wise-money-v4-paginas",
                networkTimeoutSeconds: 4,
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === self.location.origin &&
                (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")),
              handler: "CacheFirst",
              options: { cacheName: "wise-money-v4-recursos" },
            },
          ],
          navigateFallbackDenylist: [/^\/~oauth/],
        },
      }),
    ],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
