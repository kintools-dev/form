# Kin Form + shadcn/ui example

A single-page Vite + React app pairing `@kintools/form-react` state with
[shadcn/ui](https://ui.shadcn.com) components, no adapter layer in between.

The legacy `form.tsx` helpers (`Form` / `FormField` / `useFormField`) are
hardwired to react-hook-form, so this example skips them. shadcn's newer
`field.tsx` primitives are not, and are used directly.

- `src/components/ui/` holds the shadcn primitives verbatim (the output of
  `npx shadcn add` for button, input, textarea, label, checkbox, select, field,
  and separator), plus `src/lib/utils.ts` and the theme tokens in
  `src/index.css`.
- `src/components/{TextField,SelectField,CheckboxField}.tsx` bind a resolved
  `FieldApi` to the components. Each composes shadcn's `Field` / `FieldLabel` /
  `FieldError` primitives directly (they are UI only; `useWatch` supplies the
  state), and carries a commented-out second version built on the optional
  `FieldWrapper` helper so both approaches are visible in one file.
- `src/components/FieldWrapper.tsx` is that helper: a render-prop component
  collapsing the shared `useWatch` + `useId` + `data-invalid` / `aria-*` wiring
  into one place. Named `FieldWrapper` because shadcn's own primitive owns
  `Field`.
- `src/components/SubmitButton.tsx` reads `invalid` / `validating` /
  `submitting` off the form to disable itself.

See the [shadcn/ui guide](https://kintools.dev/form/guide/shadcn-ui) for the
walkthrough.

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
the monorepo's live source:

```bash
$ npm install
$ npm run dev
```
