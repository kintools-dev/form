import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

// @deno/vite-plugin only resolves under `deno task dev`; standalone/StackBlitz
// npm installs never have it (or its @jsr/* transitive deps) at all.
const isDeno = "Deno" in globalThis;

// Under Deno, resolve the @kintools/* specifiers to this repo's own workspace
// source so the examples exercise unreleased local changes. Without this, Vite
// resolves them to the published npm packages in package.json (via the
// node_modules symlinks), pre-bundles those into node_modules/.vite, and never
// sees an edit to core/lit/... again. Standalone (no Deno) keeps the
// package.json deps, so StackBlitz still works.
const src = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const workspaceAlias = {
  "@kintools/form-core": src("../../core/index.ts"),
  "@kintools/form-lit": src("../../lit/index.ts"),
  "@kintools/form-validators": src("../../validators/index.ts"),
};

export default defineConfig(async () => ({
  plugins: [
    isDeno
      ? (await import(/* @vite-ignore */ "@deno/vite-plugin")).default()
      : null,
    tailwindcss(),
  ],
  ...(isDeno
    ? {
      resolve: { alias: workspaceAlias },
      optimizeDeps: { exclude: Object.keys(workspaceAlias) },
    }
    : {}),
}));
