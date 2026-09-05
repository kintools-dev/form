# @kintools/form-react

[![JSR @kintools/form-react](https://jsr.io/badges/@kintools/form-react)](https://jsr.io/@kintools/form-react)
![License: MIT](https://img.shields.io/badge/License-MIT-166534?style=flat)
![100% type-safe](https://img.shields.io/badge/100%25%20type--safe-166534?style=flat)

React bindings for Kin Form:

- `useForm` to create a form
- `Watch`/`useWatch` to subscribe a component to a field
- `useMultistep` for wizard-style forms.

Depends on and re-exports everything from `@kintools/form-core`, so no need to
install it separately.

## Documentation

See [kintools.dev/form](https://kintools.dev/form).

## Install

```sh [npm]
npm add @kintools/form-react
```

```sh [pnpm]
pnpm add @kintools/form-react
```

```sh [deno]
deno add jsr:@kintools/form-react
```

## Quick start

```tsx
import { useForm, Watch } from "@kintools/form-react";
import { required } from "@kintools/form-validators";

function LoginForm() {
  const form = useForm({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => await login(form.value),
    onSubmitError: () => toast.error("Failed to log in"),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <Watch
        api={form.field("email", { validators: required("Email is required") })}
      >
        {(field) => (
          <>
            <input
              value={field.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.invalid && field.touched && <span>{field.error}</span>}
          </>
        )}
      </Watch>

      <Watch api={form} select={(f) => f.submitting}>
        {(_form, submitting) => (
          <button type="submit" disabled={submitting}>Log in</button>
        )}
      </Watch>
    </form>
  );
}
```

With reusable components:

```tsx
<form onSubmit={form.handleSubmit}>
  <TextField
    api={form.field("email", { validators: required("Email is required") })}
    label="Email"
  />
  <SubmitButton api={form}>Log in</SubmitButton>
</form>;
```

See [Form Composition](https://kintools.dev/form/guide/form-composition) for
building `TextField`, `SubmitButton`, and so on.
