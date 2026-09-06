/**
 * Builds an npm-compatible package for one @kintools/form-* workspace member,
 * using dnt to transpile its Deno/TypeScript source into an ESM-only npm
 * package (no CommonJS build; see the `scriptModule: false` below). Run from
 * the repo root:
 *
 *   deno task --cwd scripts build-npm core
 *
 * (`scripts/` has its own deno.json rather than being a workspace member, so
 * it can pull in dnt without polluting the workspace's own dependency
 * graph.) Type-checking and tests already run separately via `deno check`
 * and `deno test` elsewhere in CI, so both are skipped here to keep this
 * step focused on producing the npm artifact.
 */

import { build, emptyDir } from "@deno/dnt";

interface Mapping {
  name: string;
  version: string;
  peerDependency?: boolean;
}

const coreVersion = JSON.parse(
  await Deno.readTextFile("../core/deno.json"),
).version;

const CORE: Record<string, Mapping> = {
  "@kintools/form-core": {
    name: "@kintools/form-core",
    version: `^${coreVersion}`,
  },
};

// External dependencies.
const MAPPINGS: Record<string, Record<string, Mapping>> = {
  react: {
    ...CORE,
    react: { name: "react", version: "^19.2.7", peerDependency: true },
  },
  "devtools-react": {
    ...CORE,
    react: { name: "react", version: "^19.2.7", peerDependency: true },
  },
  lit: {
    ...CORE,
    lit: { name: "lit", version: "^3.3.3", peerDependency: true },
  },
  validators: {
    ...CORE,
    "@standard-schema/spec": {
      name: "@standard-schema/spec",
      version: "^1.1.0",
    },
  },
};

// Only devtools-react ships .tsx source (a rendered inspector panel); the
// other packages' shipped code is plain .ts, so they need no JSX transform.
const JSX_PACKAGES = new Set(["devtools-react"]);

const pkg = Deno.args[0];
if (!pkg) {
  console.error("Usage: deno task --cwd scripts build-npm <package>");
  Deno.exit(1);
}

const pkgDir = `../${pkg}`;
const outDir = `${pkgDir}/npm`;
const denoJson = JSON.parse(await Deno.readTextFile(`${pkgDir}/deno.json`));

await emptyDir(outDir);

await build({
  entryPoints: [`${pkgDir}/index.ts`],
  outDir,
  shims: {},
  test: false,
  typeCheck: false,
  scriptModule: false,
  mappings: MAPPINGS[pkg],
  compilerOptions: JSX_PACKAGES.has(pkg)
    ? { jsx: "react-jsx", jsxImportSource: "react" }
    : undefined,
  package: {
    name: denoJson.name,
    version: denoJson.version,
    description: denoJson.description,
    license: denoJson.license,
    repository: {
      type: "git",
      url: "git+https://github.com/kintools-dev/form.git",
      directory: pkg,
    },
    bugs: { url: "https://github.com/kintools-dev/form/issues" },
    homepage: "https://kintools.dev/form",
    sideEffects: false,
  },
  postBuild() {
    Deno.copyFileSync("../LICENSE", `${outDir}/LICENSE`);
    Deno.copyFileSync(`${pkgDir}/README.md`, `${outDir}/README.md`);
  },
});
