---
description: "How handleSubmit validates before onSubmit/onSubmitError, surfacing server errors with setErrors, gating a button on submitting/dirty, and cascading disabled."
---

# Submission Handling

<CodeGroup>

<CodeGroupItem label="React">

```tsx
function LoginForm() {
  const form = useForm({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => {
      await login(form.value);
    },
    onSubmitError: (form, error) => {
      toast.error("Failed to log in");
    },
  });

  return <form onSubmit={form.handleSubmit}>{/* ... */}</form>;
}
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
@customElement("login-form")
class LoginForm extends LitElement {
  #form = new FormApi({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => {
      await login(form.value);
    },
    onSubmitError: (form, error) => {
      toast.error("Failed to log in");
    },
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        <!-- ... -->
      </form>
    `;
  }
}
```

</CodeGroupItem>

</CodeGroup>

`handleSubmit`:

1. Waits out any pending validation.
2. If the form is invalid, marks it `touched` (so errors on never-blurred fields
   become visible) and calls `onSubmitInvalid`, then returns.
3. Otherwise sets `submitting` to `true`, calls `onSubmit`, and falls back to
   `onSubmitError` if it throws/rejects.

A no-op on a re-entrant call while already `submitting`. The `event` parameter
is optional and used only for `preventDefault()`, so the same call works from a
React Native `onPress`, any caller with no event, or a web `<form onSubmit>` as
shown above.

## Server-side validation errors

Some checks only run on the server: uniqueness, cross-record rules, anything
needing data the client doesn't have. When `onSubmit`'s request comes back with
per-field errors (an HTTP 422, typically), hand them to `form.setErrors`:

<CodeGroup>

<CodeGroupItem label="React">

```tsx
const form = useForm({
  initialValue: { email: "", password: "" },
  onSubmit: async (form) => {
    const res = await fetch("/api/sign-up", {
      method: "POST",
      body: JSON.stringify(form.value),
    });
    if (res.status === 422) {
      const { errors } = await res.json(); // { email: "Already registered" }
      form.setErrors(errors);
    }
  },
});
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
#form = new FormApi({
  initialValue: { email: "", password: "" },
  onSubmit: async (form) => {
    const res = await fetch("/api/sign-up", {
      method: "POST",
      body: JSON.stringify(form.value),
    });
    if (res.status === 422) {
      const { errors } = await res.json();
      form.setErrors(errors);
    }
  },
});
```

</CodeGroupItem>

</CodeGroup>

`setErrors` takes a flat, dot-joined path-to-message map, the same shape a
[`schemaValidator`](/form/guide/schema-validation) produces: `"email"`,
`"address.city"`, or `""` for a message about the form as a whole. It's on every
node, so `form.setErrors(...)` addresses the whole tree while
`form.field("address").setErrors(...)` scopes to a subtree.

Each message:

- Lands only on a field already created with `field()`; a path with no field is
  ignored.
- Marks that field `touched`, so it shows even if the user never focused it.
- Outranks a `schemaValidator` error on the same field, and clears the next time
  that field's value changes. Re-submitting is what refreshes it.

None of this is SSR-specific: it's the same call whether the form is
server-rendered or a plain client-side SPA. For a live "is this taken?" check
that runs while the user types rather than at submit, use
[`asyncValidator`](/form/guide/per-node-validation) instead.

## Disabling the submit button while submitting

`submitting` (and `dirty`, for a "nothing to save" state) are ordinary reactive
state, so gate the button like any other field property:

<CodeGroup>

<CodeGroupItem label="React">

```tsx
<Watch api={form} select={(f) => [f.submitting, f.dirty] as const}>
  {(form, [submitting, dirty]) => (
    <button type="submit" disabled={submitting || !dirty}>
      Save
    </button>
  )}
</Watch>;
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
watch(
  form,
  (f) => [f.submitting, f.dirty] as const,
  (_form, [submitting, dirty]) =>
    html`
      <button type="submit" ?disabled=${submitting || !dirty}>Save</button>
    `,
);
```

</CodeGroupItem>

</CodeGroup>

## Disabling the whole form while submitting

Set `form.disabled = true` around `onSubmit`'s work.
[`disabled`](https://jsr.io/@kintools/form-core/doc/index.ts/~/FieldApi.disabled)
cascades from a field down through every already-registered descendant, so
`form.disabled = true` reaches every field in the tree without watching
`submitting` anywhere:

<CodeGroup>

<CodeGroupItem label="React">

```tsx
const form = useForm({
  initialValue: { email: "", password: "" },
  onSubmit: async (form) => {
    form.disabled = true;
    try {
      await login(form.value);
    } finally {
      form.disabled = false;
    }
  },
});
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
#form = new FormApi({
  initialValue: { email: "", password: "" },
  onSubmit: async (form) => {
    form.disabled = true;
    try {
      await login(form.value);
    } finally {
      form.disabled = false;
    }
  },
});
```

</CodeGroupItem>

</CodeGroup>

<FrameworkText>
<FrameworkSlot name="react">

`disabled` on its own only skips validation; it doesn't reach the DOM by itself.
For it to actually disable an input, the component rendering that input has to
read its own field's `disabled` and fold it into whatever `disabled` prop the
caller passed in, the same way `TextField` does (see
[Basic](/form/guide/basic)):

</FrameworkSlot>
<FrameworkSlot name="lit">

`disabled` on its own only skips validation; it doesn't reach the DOM by itself.
For it to actually disable an input, the component rendering that input has to
read its own field's `disabled` and fold it into whatever `disabled` property
the caller set, the same way `text-field` does (see [Basic](/form/guide/basic)):

</FrameworkSlot>
</FrameworkText>

<CodeGroup>

<CodeGroupItem label="React">

```tsx
const isDisabled = disabled || field.disabled;
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
const isDisabled = this.disabled || field.disabled;
```

</CodeGroupItem>

</CodeGroup>

<FrameworkText>
<FrameworkSlot name="react">

Each `TextField` is already subscribed to just its own field via `useWatch`, so
disabling a 50-field form during submit re-renders only the fields whose
`disabled` actually flipped, not `LoginForm` itself.

</FrameworkSlot>
<FrameworkSlot name="lit">

Each `text-field` is already subscribed to just its own field via
`WatchController`, so disabling a 50-field form during submit updates only the
fields whose `disabled` actually flipped, not `login-form` itself.

</FrameworkSlot>
</FrameworkText>

## What's next

- [`FormApi`](https://jsr.io/@kintools/form-core/doc/index.ts/~/FormApi) — full
  reference on JSR
