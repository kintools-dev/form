---
description: "Builds a login form by binding inputs with Watch/watch directly, then promotes that into reusable TextField and SubmitButton components backed by useWatch/WatchController, for both React and Lit."
---

# Basic

[Concepts](/form/guide/concepts) covered the state machine in the abstract; this
page builds an actual form with it, starting with the simplest way to bind an
input, then promoting that into a reusable `TextField`. The rest of these guides
assume a component like it exists.

## A login form

<CodeGroup>

<CodeGroupItem label="React">

```tsx
import { useForm, Watch } from "@kintools/form-react";

function LoginForm() {
  const form = useForm({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => {
      await login(form.value);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <Watch api={form.field("email")}>
        {(field) => (
          <input
            value={field.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </Watch>

      <Watch api={form.field("password")}>
        {(field) => (
          <input
            type="password"
            value={field.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </Watch>

      <Watch api={form} select={(f) => f.submitting}>
        {(_form, submitting) => (
          <button type="submit" disabled={submitting}>
            Log in
          </button>
        )}
      </Watch>
    </form>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { FormApi, watch } from "@kintools/form-lit";

@customElement("login-form")
class LoginForm extends LitElement {
  #form = new FormApi({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => {
      await login(form.value);
    },
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        ${watch(
          this.#form.field("email"),
          (field) =>
            html`
              <input
                .value=${field.value}
                @blur=${field.handleBlur}
                @input=${(e: Event) =>
                  field.handleChange((e.target as HTMLInputElement).value)}
              >
            `,
        )}

        ${watch(
          this.#form.field("password"),
          (field) =>
            html`
              <input
                type="password"
                .value=${field.value}
                @blur=${field.handleBlur}
                @input=${(e: Event) =>
                  field.handleChange((e.target as HTMLInputElement).value)}
              >
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

</CodeGroupItem>

</CodeGroup>

<Container type="tip" title="Highlight">

Selective subscription and re-rendering is explicit.

<FrameworkText>
<FrameworkSlot name="react">

Each `Watch` only re-renders when the state it reads changes. It's the **same
mechanism** whether rendering an input or a submit button.

</FrameworkSlot>
<FrameworkSlot name="lit">

Each `watch` call only re-renders the part it's bound to when the state it reads
changes. It's the **same mechanism** whether rendering an input or a submit
button.

</FrameworkSlot>
</FrameworkText>

</Container>

`form.field(name, options)` resolves (creating on first call) the `FieldApi`
registered on `form` — see [Concepts](/form/guide/concepts#getting-a-field) for
what that resolution does.

<FrameworkText>
<FrameworkSlot name="react">

Safe to call inline in JSX on every render: `options` gets applied to an
already-registered field the same way every time, so re-calling it doesn't
re-create anything. `Watch` then subscribes the calling component to whatever
`api` it's given.

</FrameworkSlot>
<FrameworkSlot name="lit">

Safe to call inline in a template on every render: `options` gets applied to an
already-registered field the same way every time, so re-calling it doesn't
re-create anything. `watch` then subscribes just that part of the template to
whatever `api` it's given.

</FrameworkSlot>
</FrameworkText>

## Promoting to a reusable `TextField`

The `email`/`password` fields above are nearly identical: only the field name
and `type` differ. That repetition is the signal to extract a component:

<CodeGroup>

<CodeGroupItem label="React">

```tsx
import type { ReactNode } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

export type TextFieldProps<TParentValue> = {
  api: FieldApi<string, TParentValue>;
  label: string;
  type?: string;
  disabled?: boolean;
};

export function TextField<TParentValue>(
  { api, label, type = "text", disabled }: TextFieldProps<TParentValue>,
): ReactNode {
  const field = useWatch(api);
  const isDisabled = disabled || field.disabled;

  return (
    <label>
      {label}
      <input
        type={type}
        value={field.value}
        disabled={isDisabled}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.touched && field.invalid && (
        <span>{field.error ?? field.schemaError}</span>
      )}
    </label>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FieldApi, WatchController } from "@kintools/form-lit";

@customElement("text-field")
export class TextField extends LitElement {
  @property({ attribute: false })
  accessor api!: FieldApi<string, unknown>;

  @property()
  accessor label = "";

  @property()
  accessor type = "text";

  @property({ type: Boolean })
  accessor disabled = false;

  #watch = new WatchController(this, () => this.api);

  override render() {
    const field = this.#watch.value;
    const isDisabled = this.disabled || field.disabled;
    return html`
      <label>
        ${this.label}
        <input
          type=${this.type}
          .value=${field.value}
          ?disabled=${isDisabled}
          @blur=${field.handleBlur}
          @input=${(e: Event) =>
            field.handleChange((e.target as HTMLInputElement).value)}
        >
      </label>
      ${field.touched && field.invalid
        ? html`<span>${field.error ?? field.schemaError}</span>`
        : ""}
    `;
  }
}
```

</CodeGroupItem>

</CodeGroup>

<FrameworkText>
<FrameworkSlot name="react">

Note the swap from `Watch` to `useWatch`. That's the general rule, not specific
to this example: `Watch` is for a shape that appears once; once it's a named,
reused component, call the hook directly instead of wrapping a render prop
around it.

`TextField` also takes an already-resolved `api` rather than `parent`+`name`:
the caller resolves the field (and its options) once, at the call site, the same
way it already does for `Watch` above. `TextField` only needs to know it's
rendering _some_ `FieldApi<string, TParentValue>`, not where in the tree it
lives or how it was configured.

`disabled` is `disabled || field.disabled`, not just one or the other: the prop
lets a caller disable this one field on its own (e.g. a field that's read-only
until some other condition is met), while `field.disabled` picks up a value
cascaded down from an ancestor (e.g. the whole form disabled while submitting,
see [Submission Handling](/form/guide/submission-handling)) without the caller
doing anything at all.

</FrameworkSlot>
<FrameworkSlot name="lit">

Note the swap from `watch` to `WatchController`. That's the general rule, not
specific to this example: `watch` is for a shape that appears once, inline in a
template; once it's a named, reused component, subscribe its own `render()` via
`WatchController` instead of wrapping it in `watch`.

`TextField` also takes an already-resolved `.api` property rather than
`parent`+`name`: the caller resolves the field (and its options) once, at the
call site, the same way it already does for `watch` above. `TextField` only
needs to know it's rendering _some_ `FieldApi<string, unknown>`, not where in
the tree it lives or how it was configured.

`disabled` is `this.disabled || field.disabled`, not just one or the other: the
property lets a caller disable this one field on its own (e.g. a field that's
read-only until some other condition is met), while `field.disabled` picks up a
value cascaded down from an ancestor (e.g. the whole form disabled while
submitting, see [Submission Handling](/form/guide/submission-handling)) without
the caller doing anything at all.

</FrameworkSlot>
</FrameworkText>

## Promoting to a reusable `SubmitButton`

<FrameworkText>
<FrameworkSlot name="react">

The submit button's `Watch` follows the same shape as the fields above. Pull it
into a component that calls `useWatch` directly, and every form in the app
agrees on when submission is disabled:

</FrameworkSlot>
<FrameworkSlot name="lit">

The submit button's `watch` follows the same shape as the fields above. Pull it
into a component that subscribes via `WatchController` directly, and every form
in the app agrees on when submission is disabled:

</FrameworkSlot>
</FrameworkText>

<CodeGroup>

<CodeGroupItem label="React">

```tsx
import type { ReactNode } from "react";
import { type FormApi, useWatch } from "@kintools/form-react";

export type SubmitButtonProps<TValue> = {
  api: FormApi<TValue>;
  children: ReactNode;
};

export function SubmitButton<TValue>(
  { api, children }: SubmitButtonProps<TValue>,
): ReactNode {
  const submitting = useWatch(api, (f) => f.submitting);

  return (
    <button type="submit" disabled={submitting}>
      {children}
    </button>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FormApi, WatchController } from "@kintools/form-lit";

@customElement("submit-button")
export class SubmitButton extends LitElement {
  @property({ attribute: false })
  accessor api!: FormApi<unknown>;

  #watch = new WatchController(this, () => this.api, (f) => f.submitting);

  override render() {
    const submitting = this.#watch.value;
    return html`
      <button type="submit" ?disabled=${submitting}>
        <slot></slot>
      </button>
    `;
  }
}
```

</CodeGroupItem>

</CodeGroup>

## The same form with reusable components

With the new `TextField` and `SubmitButton`, `LoginForm` collapses to:

<CodeGroup>

<CodeGroupItem label="React">

```tsx
function LoginForm() {
  const form = useForm({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => await login(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <TextField api={form.field("email")} label="Email" />

      <TextField
        api={form.field("password")}
        label="Password"
        type="password"
      />

      <SubmitButton api={form}>Log in</SubmitButton>
    </form>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { FormApi } from "@kintools/form-lit";
import "./text-field.ts";
import "./submit-button.ts";

@customElement("login-form")
class LoginForm extends LitElement {
  #form = new FormApi({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => await login(form.value),
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        <text-field
          .api=${this.#form.field("email")}
          label="Email"
        ></text-field>

        <text-field
          .api=${this.#form.field("password")}
          label="Password"
          type="password"
        ></text-field>

        <submit-button .api=${this.#form}>Log in</submit-button>
      </form>
    `;
  }
}
```

</CodeGroupItem>

</CodeGroup>

<FrameworkText>
<FrameworkSlot name="react">

In the same way, a `SelectField`, `AddressField`, `ItemsField`, or a wrapper
around any third-party input all follow this shape: an already-resolved `api`
in, `useWatch` to subscribe, whatever markup and value-parsing that input needs
in between. Write each one once per app and every call site collapses to a
single component call, typed against whatever value shape it's mounted on.

</FrameworkSlot>
<FrameworkSlot name="lit">

In the same way, a `SelectField`, `AddressField`, `ItemsField`, or a wrapper
around any third-party input all follow this shape: an already-resolved `.api`
in, `WatchController` to subscribe, whatever markup and value-parsing that input
needs in between. Write each one once per app and every call site collapses to a
single custom element, typed against whatever value shape it's mounted on.

</FrameworkSlot>
</FrameworkText>

## What's next

- [Per-node Validation](/form/guide/per-node-validation) — validators,
  debouncing, running validation explicitly
- [Schema Validation](/form/guide/schema-validation) — validating a whole
  group/form with a Standard Schema library (zod, valibot, ...) instead
- [Form Composition](/form/guide/form-composition) — `AddressField`,
  `ItemsField`: reusable components for a nested group/array that owns its own
  state, building on `TextField`/`SubmitButton` from this page
- [Reactivity](/form/guide/reactivity) — `useWatch`/`Watch` in depth, including
  `select` for controlling re-renders
