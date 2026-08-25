---
description: "Frequently asked questions and honest non-goals: production-readiness, framework support beyond React and Lit, schema validation, SSR, DevTools, and where migration guides currently stand."
---

# FAQ & Non-Goals

## Frequently asked questions

### Is Kin Form production-ready?

Both packages are still pre-1.0 (`@kintools/form-core` at 0.1.6,
`@kintools/form-react` at 0.1.7), and every publish runs through CI with
Codecov-tracked test coverage. Weigh that alongside a small community and a
short track record as real inputs to your own risk assessment, not something the
docs will talk you out of.

### Does it work outside React?

`@kintools/form-core` has no framework dependency at all, just a value plus a
pub/sub protocol. `@kintools/form-react` and `@kintools/form-lit` are both
officially shipped, published bindings today, not a roadmap promise.

### Is there Vue, Svelte, or Solid support?

Not yet. Nothing about `core` is React- or Lit-specific, so another binding is
realistic future work, but it isn't scheduled ahead of someone actually needing
it, not to keep the package list growing. Open an issue if you'd use one.

### Does it support Zod, Valibot, or ArkType validation?

`toSchemaValidator()` (from `@kintools/form-validators`) adapts any
[Standard Schema](https://standardschema.dev)-compliant library, Zod, Valibot,
ArkType, and others, into a `schemaValidator` that checks a whole group's or the
whole form's value in one pass, populating `schemaErrorMap` and each field's own
`schemaError`. It's a separate option from hand-written per-field `validators`,
and the two coexist without either overwriting the other, so a field can carry
both a validator's `error` and a schema's `schemaError` at once. See
[Schema Validation](/form/guide/schema-validation).

### Does it work with SSR or Next.js?

Yes. The [SSR guide](/form/guide/ssr) covers the two things that actually
change: don't use `field.id` as a DOM element id (React's `useId()` already
solves that and avoids server/client mismatches), and pass server-loaded data
straight into `initialValue` rather than constructing the form empty and calling
`reset()` once data arrives.

### Is there a DevTools integration?

Yes, for React: `@kintools/form-devtools-react` connects a
`DevtoolsProvider`/`useFormDevtools` inspector panel to a form's live tree,
showing every registered field's `value`, `error`, `touched`, and `validating`
as they change. It's React-only today; there's no Lit equivalent yet.

### How does it compare to React Hook Form, Formik, or TanStack Form?

The [comparison pages](/form/comparison/) carry the actual feature matrix,
API-surface matrix, bundle-size chart, and wall-clock performance numbers, plus
a
[detailed, code-by-code comparison against React Hook Form](/form/comparison/react-hook-form).
One caveat worth stating directly: the current performance numbers are measured
in Happy DOM, not a real browser yet, reproducing them in an actual browser is
still on the roadmap.

### What's the bundle size?

`@kintools/form-core` is 4.4 KB gzipped, `@kintools/form-react`'s bindings add
0.8 KB on top, and `@kintools/form-validators` is 0.7 KB, each measured
independently (bundled and minified with rolldown) since you only pay for what
you actually import. Core plus React together comes to about 5.0 KB gzipped.

### Where do I ask a question or report a bug?

[GitHub Discussions](https://github.com/kintools-dev/form/discussions) for
questions and design feedback,
[Issues](https://github.com/kintools-dev/form/issues) for bugs.

## Non-goals

Chasing benchmark wins isn't the pitch here, and neither is copying every
feature a competing library ships. The comparison pages exist to name real
tradeoffs directly, not to win a spec sheet.

Kin Form doesn't validate anything on its own terms the way a schema library
does. `toSchemaValidator()` is an adapter onto Zod, Valibot, ArkType, or any
other Standard Schema implementation, not a competing validation engine, and the
built-in `@kintools/form-validators` factories (`required`, `email`, `pattern`,
and the rest) are deliberately small, common-case helpers rather than a
general-purpose rules system.

Framework support stops at React and Lit for now. Nothing in `core` rules out
Vue or Solid bindings later, but neither is being built ahead of someone
actually needing it, and the same restraint applies to devtools: only
`@kintools/form-devtools-react` exists, with no Lit inspector yet.

Migration guides from React Hook Form and Formik aren't published yet either:
they're listed as in-progress work, not finished, so don't expect a drop-in
codemod or a guide walking through an existing RHF form today. The
[React Hook Form comparison](/form/comparison/react-hook-form) is the closest
thing available in the meantime.
