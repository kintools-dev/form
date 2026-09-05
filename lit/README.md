# @kintools/form-lit

[![JSR @kintools/form-lit](https://jsr.io/badges/@kintools/form-lit)](https://jsr.io/@kintools/form-lit)
![License: MIT](https://img.shields.io/badge/License-MIT-166534?style=flat)
![100% type-safe](https://img.shields.io/badge/100%25%20type--safe-166534?style=flat)

Lit bindings for Kin Form:

- `watch` directive to subscribe just one part of a template to a field
- `WatchController` to subscribe a whole component's `render()`
- `MultistepController` for wizard-style forms.

Depends on and re-exports everything from `@kintools/form-core`, so no need to
install it separately.

## Documentation

See [kintools.dev/form](https://kintools.dev/form).

## Install

```sh [npm]
npm add @kintools/form-lit
```

```sh [pnpm]
pnpm add @kintools/form-lit
```

```sh [deno]
deno add jsr:@kintools/form-lit
```

## Quick start

```ts
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { FormApi, watch } from "@kintools/form-lit";
import { required } from "@kintools/form-validators";

@customElement("login-form")
class LoginForm extends LitElement {
  #form = new FormApi({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => await login(form.value),
    onSubmitError: () => toast.error("Failed to log in"),
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        ${watch(
          this.#form.field("email", {
            validators: required("Email is required"),
          }),
          (field) =>
            html`
              <input
                .value=${field.value}
                @blur=${field.handleBlur}
                @input=${(e: Event) =>
                  field.handleChange((e.target as HTMLInputElement).value)}
              >
              ${field.invalid && field.touched
                ? html`<span>${field.error}</span>`
                : ""}
            `,
        )}

        ${watch(
          this.#form,
          (f) => f.submitting,
          (_form, submitting) =>
            html`
              <button type="submit" ?disabled=${submitting}>Log in</button>
            `,
        )}
      </form>
    `;
  }
}
```

With reusable components:

```ts
html`
  <form @submit=${form.handleSubmit}>
    <text-field
      .api=${form.field("email", { validators: required("Email is required") })}
      label="Email"
    ></text-field>
    <submit-button .api=${form}>Log in</submit-button>
  </form>
`;
```

See [Form Composition](https://kintools.dev/form/guide/form-composition) for
building `text-field`, `submit-button`, and so on.
