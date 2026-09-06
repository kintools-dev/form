import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @deno/vite-plugin only resolves under `deno task dev`; standalone/StackBlitz
// npm installs never have it (or its @jsr/* transitive deps) at all.
export default defineConfig(async () => ({
  plugins: [
    "Deno" in globalThis
      ? (await import(/* @vite-ignore */ "@deno/vite-plugin")).default()
      : null,
    react(),
    tailwindcss(),
  ],
}));
