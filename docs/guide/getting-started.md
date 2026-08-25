---
description: "Install commands for @kintools/form-react, @kintools/form-lit, and the optional @kintools/form-validators package via npm, pnpm, yarn, or deno, plus links to the next guide pages."
---

# Getting Started

## Install

<CodeGroup>

<CodeGroupItem label="React">

```sh
npm  add @kintools/form-react
pnpm add @kintools/form-react
yarn add @kintools/form-react
deno add jsr:@kintools/form-react
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```sh
npm  add @kintools/form-lit
pnpm add @kintools/form-lit
yarn add @kintools/form-lit
deno add jsr:@kintools/form-lit
```

</CodeGroupItem>

</CodeGroup>

`@kintools/form-react` and `@kintools/form-lit` re-export `@kintools/form-core`.

To add common validators or the schema validation adapter:

<CodeGroup>

<CodeGroupItem label="npm">

```sh
npm add @kintools/form-validators
```

</CodeGroupItem>

<CodeGroupItem label="pnpm">

```sh
pnpm add @kintools/form-validators
```

</CodeGroupItem>

<CodeGroupItem label="yarn">

```sh
yarn add @kintools/form-validators
```

</CodeGroupItem>

<CodeGroupItem label="deno">

```sh
deno add jsr:@kintools/form-validators
```

</CodeGroupItem>

</CodeGroup>

## What's next

- [Concepts](/form/guide/concepts) — the tree model, shared state, and typed
  paths
- [Basic](/form/guide/basic) — building `TextField` from `Watch`, the pattern
  the rest of these guides lean on
- [Per-node Validation](/form/guide/per-node-validation) — validators,
  debouncing, and running validation explicitly
- [Nested Objects](/form/guide/nested-objects) and
  [Dynamic Arrays](/form/guide/dynamic-arrays)
- [Validators](/form/validators/) — `required`, `email`, `minLength`, a
  `toSchemaValidator()` adapter for zod/valibot, and more
