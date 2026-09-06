---
description: "Binding shadcn/ui's controlled components (Input, Textarea, Checkbox, Select, Switch, RadioGroup) to @kintools/form-react: compose shadcn's UI-only Field/FieldLabel/FieldError primitives and feed them state from useWatch."
---

# shadcn/ui

<Container type="info">

React only. This guide uses `@kintools/form-react` throughout.

</Container>

shadcn/ui components are controlled and forward their props to the underlying
element, so binding one to a Kin Form field is the same `useWatch` call as a
plain `<input>`. No adapter, no `Controller`.

<Button variant="text" external href="https://stackblitz.com/github/kintools-dev/form/tree/main/examples/shadcn-ui">
  Try it live on StackBlitz →
</Button>

## Setup

```sh
npx shadcn add field input textarea label checkbox select button
```

`field` gives you `Field`, `FieldLabel`, `FieldError`, `FieldContent`, ...:
layout and styling only, no form-library dependency. A wrapper reads the field
with `useWatch` and feeds the result in:

- `data-invalid` on `Field`
- `aria-invalid` / `aria-describedby` on the control
- the message into `FieldError`

## Text inputs

```tsx
import { useId } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

import { Field, FieldError, FieldLabel } from "./ui/field.tsx";
import { Input } from "./ui/input.tsx";

export type TextFieldProps<TParentValue> = {
  api: FieldApi<string, TParentValue>;
  label: string;
  type?: string;
};

export function TextField<TParentValue>(
  { api, label, type = "text" }: TextFieldProps<TParentValue>,
): ReactNode {
  const field = useWatch(api);
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = field.touched && field.invalid;
  const message = invalid ? field.error ?? field.schemaError : undefined;

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        value={field.value}
        disabled={field.disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={message ? errorId : undefined}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      <FieldError id={errorId}>{message}</FieldError>
    </Field>
  );
}
```

`message` reads `field.error` before `field.schemaError`, so a per-node
validator wins over a [schema](/form/guide/schema-validation) result. `useId()`
(not `field.id`) keeps the DOM id
[SSR-safe](/form/guide/ssr#field-id-in-server-rendered-markup). `Textarea` is
the same wrapper with the element swapped.

## Checkbox and Switch

`Checkbox` and `Switch` are controlled by `checked` / `onCheckedChange`, which
returns the next state directly (no event). Radix's `checked` is
`boolean | "indeterminate"`, so binding a `FieldApi<boolean | "indeterminate">`
needs no mapping; the generic below also accepts a plain `FieldApi<boolean>`.
`orientation="horizontal"` puts the box beside the label; `FieldContent` keeps
the error below.

```tsx
import { Field, FieldContent, FieldError, FieldLabel } from "./ui/field.tsx";
import { Checkbox } from "./ui/checkbox.tsx";

type CheckedValue = boolean | "indeterminate";

export type CheckboxFieldProps<TValue extends CheckedValue, TParentValue> = {
  api: FieldApi<TValue, TParentValue>;
  label: string;
};

export function CheckboxField<TValue extends CheckedValue, TParentValue>(
  { api, label }: CheckboxFieldProps<TValue, TParentValue>,
): ReactNode {
  const field = useWatch(api);
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = field.touched && field.invalid;
  const message = invalid ? field.error ?? field.schemaError : undefined;

  return (
    <Field orientation="horizontal" data-invalid={invalid || undefined}>
      <Checkbox
        id={id}
        checked={field.value}
        disabled={field.disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={message ? errorId : undefined}
        onBlur={field.handleBlur}
        // Radix only emits "indeterminate" when `checked` was already
        // "indeterminate", so `next` never widens past what the field allows.
        onCheckedChange={(next) => field.handleChange(next as TValue)}
      />
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldError id={errorId}>{message}</FieldError>
      </FieldContent>
    </Field>
  );
}
```

`Switch` is the same without `"indeterminate"`.

## Select

`Select` is controlled by `value` / `onValueChange` (a bare string). Its trigger
has no `onBlur`, so call `handleBlur` from `onOpenChange`. `id` / `aria-*` go on
`SelectTrigger`. The items come in as `children` (not an `options` prop):
`Select` is a composition API, and this way `SelectGroup` / `SelectSeparator` /
disabled items just work.

```tsx
import { Field, FieldError, FieldLabel } from "./ui/field.tsx";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "./ui/select.tsx";

export type SelectFieldProps<TParentValue> = {
  api: FieldApi<string, TParentValue>;
  label: string;
  placeholder?: string;
  children: ReactNode;
};

export function SelectField<TParentValue>(
  { api, label, placeholder, children }: SelectFieldProps<TParentValue>,
): ReactNode {
  const field = useWatch(api);
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = field.touched && field.invalid;
  const message = invalid ? field.error ?? field.schemaError : undefined;

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={field.value}
        disabled={field.disabled}
        onValueChange={field.handleChange}
        onOpenChange={(open) => {
          if (!open) field.handleBlur();
        }}
      >
        <SelectTrigger
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={message ? errorId : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      <FieldError id={errorId}>{message}</FieldError>
    </Field>
  );
}
```

The caller passes `SelectItem`s as children (see the
[full example](#full-example)). `RadioGroup` is identical, with the wiring on
`RadioGroup` itself.

## Error styling

shadcn components style off `aria-invalid`, and `Field` reddens its label off
`data-invalid`. Passing both from `invalid` is all it takes.

## Factor out the repetition

Every wrapper repeats the same `useWatch` / `useId` / `invalid` / `message` head
and `Field` frame. So, it may make sense to extract a render-prop component.
Call it `FieldWrapper`, since shadcn owns `Field`.

```tsx
import { type ReactNode, useId } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";
import { Field, FieldContent, FieldError, FieldLabel } from "./ui/field.tsx";

export type FieldWrapperChildProps = {
  id: string;
  "aria-invalid": boolean | undefined;
  "aria-describedby": string | undefined;
};

export type FieldWrapperProps<TValue, TParentValue> = {
  api: FieldApi<TValue, TParentValue>;
  label: string;
  orientation?: "vertical" | "horizontal";
  children: (
    field: FieldApi<TValue, TParentValue>,
    props: FieldWrapperChildProps,
  ) => ReactNode;
};

export function FieldWrapper<TValue, TParentValue>(
  { api, label, orientation = "vertical", children }: FieldWrapperProps<
    TValue,
    TParentValue
  >,
): ReactNode {
  const field = useWatch(api);
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = field.touched && field.invalid;
  const message = invalid ? field.error ?? field.schemaError : undefined;

  const control = children(field, {
    id,
    "aria-invalid": invalid || undefined,
    "aria-describedby": message ? errorId : undefined,
  });

  return (
    <Field orientation={orientation} data-invalid={invalid || undefined}>
      {orientation === "horizontal"
        ? (
          <>
            {control}
            <FieldContent>
              <FieldLabel htmlFor={id}>{label}</FieldLabel>
              <FieldError id={errorId}>{message}</FieldError>
            </FieldContent>
          </>
        )
        : (
          <>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {control}
            <FieldError id={errorId}>{message}</FieldError>
          </>
        )}
    </Field>
  );
}
```

```tsx
export function TextField<TParentValue>(
  { api, label, type = "text" }: TextFieldProps<TParentValue>,
): ReactNode {
  return (
    <FieldWrapper api={api} label={label}>
      {(field, props) => (
        <Input
          {...props}
          type={type}
          value={field.value}
          disabled={field.disabled}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )}
    </FieldWrapper>
  );
}
```

The runnable example ships both forms in each wrapper file, the direct one live
and this one commented.

## Submit button

`useWatch` must not run in the component that calls `useForm`, or the whole form
re-renders on every keystroke (see
[Common Pitfalls](/form/guide/common-pitfalls#watching-in-the-same-component-that-owns-the-form)).
Form-level state like `submitting` belongs in its own component.

```tsx
import { type FormApi, useWatch } from "@kintools/form-react";
import { Button } from "./ui/button.tsx";

export type SubmitButtonProps<TValue> = {
  api: FormApi<TValue>;
  pendingLabel: ReactNode;
  children: ReactNode;
};

export function SubmitButton<TValue>(
  { api, pendingLabel, children }: SubmitButtonProps<TValue>,
): ReactNode {
  const [invalid, validating, submitting] = useWatch(
    api,
    (f) => [f.invalid, f.validating, f.submitting] as const,
  );

  return (
    <Button type="submit" disabled={invalid || validating || submitting}>
      {submitting ? pendingLabel : children}
    </Button>
  );
}
```

## Full example

```tsx
import type { ReactNode } from "react";
import { useForm } from "@kintools/form-react";
import { email, required } from "@kintools/form-validators";

import { CheckboxField } from "./components/CheckboxField.tsx";
import { SelectField } from "./components/SelectField.tsx";
import { SubmitButton } from "./components/SubmitButton.tsx";
import { TextField } from "./components/TextField.tsx";
import { SelectItem } from "./components/ui/select.tsx";

export function SignUpForm(): ReactNode {
  const form = useForm({
    initialValue: { email: "", role: "", acceptTerms: false },
    onSubmit: async (form) => {
      await createAccount(form.value);
    },
  });

  return (
    <form onSubmit={form.handleSubmit} className="grid gap-4" noValidate>
      <TextField
        api={form.field("email", { validators: [required(), email()] })}
        type="email"
        label="Email"
      />

      <SelectField
        api={form.field("role", { validators: required("Pick a role") })}
        label="Role"
        placeholder="Select a role"
      >
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="member">Member</SelectItem>
      </SelectField>

      <CheckboxField
        api={form.field("acceptTerms", {
          validators: (f) => (f.value ? null : "You must accept the terms"),
        })}
        label="I accept the terms"
      />

      <SubmitButton api={form} pendingLabel="Creating…">
        Create account
      </SubmitButton>
    </form>
  );
}
```

Each wrapper takes a resolved `api` and nothing else, so the form body reads as
configuration and shadcn's component names stay contained to the wrapper files.

## Runnable example

[`examples/shadcn-ui`](https://github.com/kintools-dev/form/tree/main/examples/shadcn-ui)
is this form wired up, with the shadcn primitives as `npx shadcn add` emits them
and the theme tokens in `src/index.css`.

<Button variant="text" external href="https://stackblitz.com/github/kintools-dev/form/tree/main/examples/shadcn-ui">
  Try it live on StackBlitz →
</Button>

## What's next

- [Basic](/form/guide/basic) — where `TextField` and the resolved-`api` contract
  come from
- [Form Composition](/form/guide/form-composition) — reusable components for
  nested groups and arrays
- [Reactivity](/form/guide/reactivity) — `useWatch`/`Watch` and `select` in
  depth
- [SSR](/form/guide/ssr) — why the wrappers use `useId()` for DOM ids
