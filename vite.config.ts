import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

// CSG ships as a STATIC site — no runtime server, no Cloudflare, no Supabase.
// TanStack Start in SPA mode + prerender: content pages (home, /about, the
// state landings) are prerendered to static HTML at build time for SEO; the
// rest is a client SPA. The user's data never leaves the browser — generated
// client-side, nothing stored, sent, or logged (program-wide privacy floor).
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      // SPA shell for client routes; prerender crawls links from the shell to
      // emit static HTML for every internally-linked content page.
      spa: { enabled: true },
      prerender: { enabled: true, crawlLinks: true },
    }),
    viteReact(),
  ],
});
