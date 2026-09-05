# Kin Form examples

One Vite app, 12 patterns — pick one from the sidebar. Each example's form code
lives in its own file under `src/examples/<slug>/`, self-contained (including
any local components), so it can be copy-pasted out as a starting point on its
own.

## Running

Inside the [kintools/form](https://github.com/kintools-dev/form) monorepo, you
need Deno v2.0.0 or later. Start a dev server:

```bash
$ deno task dev
```

Build production assets:

```bash
$ deno task build
```

## Standalone / StackBlitz

This folder also works on its own, against the published npm packages instead of
the monorepo's live source. That's how
[StackBlitz](https://stackblitz.com/github/kintools-dev/form/tree/main/examples/react)
runs it, and given just this folder, plain npm works too:

```bash
$ npm install
$ npm run dev
```
