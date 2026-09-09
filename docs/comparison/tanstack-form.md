---
description: "A side-by-side comparison of Kin Form and TanStack Form: field binding, validation, dirty tracking, submission, reactivity, composition, multistep."
---

# vs TanStack Form

Of the libraries compared here, TanStack Form is the closest to Kin Form's
mental model: a framework-agnostic core, controlled binding, type-safe field
paths, and selective re-rendering through selectors. So the comparison is less
about whether a given feature exists and more about how large the API surface
is, how many distinct primitives you assemble to build a form, and where the
type-safety and ergonomics diverge. Like the
[React Hook Form page](/form/comparison/react-hook-form), this one works through
the same topics the [guide](/form/guide/) covers, one at a time, against
`@tanstack/react-form@1.33.5`.

## Field registration & binding model

### Native input

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {11,13,17,20}
import { useForm, Watch } from "@kintools/form-react";
import { required } from "@kintools/form-validators";

function LoginForm() {
  const form = useForm({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {/* Only re-renders when the email field changes. */}
      <Watch api={form.field("email", { validators: required("Required") })}>
        {(field) => (
          <>
            <input
              value={field.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.touched && field.invalid && <span>{field.error}</span>}
          </>
        )}
      </Watch>

      <button type="submit">Log in</button>
    </form>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {11-14,16-21,25,28-29}
import { useForm } from "@tanstack/react-form";

function LoginForm() {
  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: ({ value }) => login(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => (value ? undefined : "Required"),
        }}
      >
        {(field) => (
          <>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors[0] && (
              <span>{field.state.meta.errors[0]}</span>
            )}
          </>
        )}
      </form.Field>

      <button type="submit">Log in</button>
    </form>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                   | Kin Form                                          | TanStack Form                                     |
| ----------------- | ------------------------------------------------- | ------------------------------------------------- |
| Binding model     | controlled (`value` / `handleChange`)             | controlled (`field.state.value` / `handleChange`) |
| Field primitive   | resolve then watch: `form.field(...)` + `<Watch>` | one `<form.Field name>`, bound to `form`          |
| Submit wiring     | `onSubmit={form.handleSubmit}`                    | handler does `preventDefault` + `handleSubmit()`  |
| Reading the error | `field.error`, a `string \| null`                 | `field.state.meta.errors`, an array               |

Both bind controlled, and the field primitives are about the same size:
`<Watch api={form.field("email", ...)}>` versus `<form.Field name="email" ...>`.
TanStack Form fuses resolving a field and watching it into one `form`-bound
primitive; Kin Form keeps them separate (`form.field` to resolve, `<Watch>` /
`useWatch` to watch). That split is what keeps the core lean and composition
simple: a resolved `FieldApi` is just a value, so it drops straight into a
reusable component with a one-line call site (see
[Form composition](#form-composition)), with no `form`-bound component type to
thread through.

This is the only section using a bare `<input>`. Everywhere else both sides bind
to a controlled `<TextInput>` (or `<CountrySelect>`), since that is the case
worth comparing.

### Non-native input

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {12}
import { useForm, Watch } from "@kintools/form-react";
import { required } from "@kintools/form-validators";

function ProfileForm() {
  const form = useForm({
    initialValue: { country: "" },
    onSubmit: (form) => save(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <Watch api={form.field("country", { validators: required("Required") })}>
        {(field) => (
          <>
            <CountrySelect value={field.value} onChange={field.handleChange} />
            {field.error && <span>{field.error}</span>}
          </>
        )}
      </Watch>

      <button type="submit">Save</button>
    </form>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {16-21}
import { useForm } from "@tanstack/react-form";

function ProfileForm() {
  const form = useForm({
    defaultValues: { country: "" },
    onSubmit: ({ value }) => save(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="country"
        validators={{
          onChange: ({ value }) => (value ? undefined : "Required"),
        }}
      >
        {(field) => (
          <>
            <CountrySelect
              value={field.state.value}
              onChange={field.handleChange}
            />
            {field.state.meta.errors[0] && (
              <span>{field.state.meta.errors[0]}</span>
            )}
          </>
        )}
      </form.Field>

      <button type="submit">Save</button>
    </form>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                   | Kin Form                          | TanStack Form                          |
| ----------------- | --------------------------------- | -------------------------------------- |
| Non-native inputs | Same `<Watch>` as any other field | Same `<form.Field>` as any other field |

Both treat a custom-component field exactly like a native one: no extra
primitive. Groups and arrays are where they diverge (see
[Form composition](#form-composition)): a TanStack Form `FieldGroupApi` is a
separate type, a Kin Form group is just a `FieldApi` whose value is an object.

## Reusable field component

Real forms bind through reusable field components. This is where the two
libraries diverge most: in Kin Form, the call site collapses to one typed
element; in TanStack Form, a typed reusable field needs the full
`createFormHook` apparatus and still does not collapse the call site. So the
sections below use a `<TextField>` on the Kin Form side and inline
`<form.Field>` on the TanStack Form side, the idiomatic shape for each.

<Container type="info">

To build one reusable, type-safe text field and reuse it across forms, the
concepts you learn are:

- Kin Form: `FieldApi`, `useWatch`
- Tanstack Form: `createFormHookContexts`, `createFormHook`, `fieldContext`,
  `useAppForm`, `form.AppField`, `useFieldContext`, and for groups
  `withFieldGroup` / `FieldGroupApi` and the `fields` mapping

The [API surface matrix](/form/comparison/#api-surface) sets these side by side
with the other libraries.

</Container>

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {4,16-17}
import { type FieldApi, useWatch } from "@kintools/form-react";

function TextField<TParentValue>(
  { api, label }: { api: FieldApi<string, TParentValue>; label: string },
) {
  const field = useWatch(api);

  return (
    <label>
      {label}
      <TextInput
        value={field.value}
        onBlur={field.handleBlur}
        onChange={field.handleChange}
      />
      {field.invalid && field.touched &&
        <span>{field.error}</span>}
    </label>
  );
}

<TextField
  api={form.field("email", { validators: required() })}
  label="Email"
/>;
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {4,8,18-20,36}
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

// One-time setup, shared across the app.
const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

function TextField({ label }: { label: string }) {
  // Pulls the field off context; only valid inside `form.AppField`.
  const field = useFieldContext<string>();

  return (
    <label>
      {label}
      <TextInput
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={field.handleChange}
      />
      {field.state.meta.isTouched && field.state.meta.errors[0] && (
        <span>{field.state.meta.errors[0]}</span>
      )}
    </label>
  );
}

// `createFormHook` also returns `withForm`, `withFieldGroup`, ...; the group
// section below uses `withFieldGroup`.
const { useAppForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: {},
});

// At the call site:
const form = useAppForm({ defaultValues: { email: "" } });
<form.AppField name="email">
  {(field) => <field.TextField label="Email" />}
</form.AppField>;
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                             | Kin Form                                            | TanStack Form                                                             |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| What the component receives | resolved `api: FieldApi<string, TParentValue>` prop | field off React context (`useFieldContext`), only inside `form.AppField`  |
| One-time setup              | none                                                | `createFormHookContexts()` + `createFormHook({...})` → `useAppForm`       |
| Value-type safety           | `FieldApi<string, TParentValue>` checks it          | `useFieldContext<string>()`: you assert it, or lose it with `AnyFieldApi` |
| Call site                   | `<TextField api={form.field(...)} />`               | `<form.AppField name>{(field) => <field.TextField/>}</form.AppField>`     |
| Cross-form reuse            | plain import, passed a prop                         | registered in one `createFormHook`, used via its `useAppForm` forms       |

Kin Form: resolve the field, pass the `FieldApi` down. No setup, and it is the
same `FieldApi` every other field uses.

TanStack Form: first build the wiring (`createFormHookContexts`,
`createFormHook`, a component registry), then read the field from context inside
the component. Several APIs to learn before the first typed field renders, and
the call site still needs the `form.AppField` wrapper. The lighter route,
passing the field object down directly, skips the wiring but types it as
`AnyFieldApi` (23 `any` parameters), so the value type is gone.

## Per-node validation

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {11-13}
import { useForm } from "@kintools/form-react";

function SignupForm() {
  const form = useForm<{ username: string }>({
    initialValue: { username: "" },
  });

  return (
    <TextField
      api={form.field("username", {
        asyncValidator: async (field) =>
          (await checkUsernameTaken(field.value)) ? "Username taken" : null,
        validationDebounceMs: 300,
      })}
      label="Username"
    />
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {9}
import { useForm } from "@tanstack/react-form";

function SignupForm() {
  const form = useForm({ defaultValues: { username: "" } });

  return (
    <form.Field
      name="username"
      asyncDebounceMs={300}
      validators={{
        onChangeAsync: async ({ value }) =>
          (await checkUsernameTaken(value)) ? "Username taken" : undefined,
      }}
    >
      {(field) => (
        <TextInput
          value={field.state.value}
          onChange={field.handleChange}
        />
      )}
    </form.Field>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

This is a place the two are close. Both ship a built-in async-validation
debounce (`validationDebounceMs` on Kin Form, `asyncDebounceMs` on TanStack
Form), so neither needs the hand-rolled `lodash/debounce` the React Hook Form
page shows. Both also run async validation only after the synchronous rules for
that field have passed, so an expensive check never fires for a value already
known bad.

**What's different:**

|                  | Kin Form                                  | TanStack Form                                      |
| ---------------- | ----------------------------------------- | -------------------------------------------------- |
| Sync validation  | one `validators` array, first truthy wins | `validators.onChange` / `.onBlur`, one fn per hook |
| Async validation | one `asyncValidator` slot                 | `validators.onChangeAsync` / `.onBlurAsync`        |
| Debounce         | `validationDebounceMs`                    | `asyncDebounceMs`, plus per-hook overrides         |
| Config shape     | one array + one async slot + one number   | a `validators` object keyed by event               |

Same coverage, different shape. Kin Form: one `validators` array, one async
slot, one debounce number. TanStack Form: a `validators` object keyed by timing
(change, blur, submit; sync and async), so "validate on blur only" is a one-key
change. Kin Form always runs sync `validators` on change and leaves blur-only
display to the render (`field.touched`).

## Schema validation

This is a bundling tradeoff, not a clear win for either side: TanStack Form
builds Standard Schema support into core, Kin Form keeps it in a separately
versioned package for a lean core.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {14,18-19}
import { useForm } from "@kintools/form-react";
import { toSchemaValidator } from "@kintools/form-validators";
import { z } from "zod";

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
type Signup = z.infer<typeof signupSchema>;

function SignupForm() {
  const form = useForm<Signup>({
    initialValue: { email: "", password: "" },
    schemaValidator: toSchemaValidator(signupSchema),
    onSubmit: (form) => signUp(form.value),
  });

  // A field's own `validators` still run alongside the schema when present;
  // `field.error` prefers a field's own message, falling back to its slice
  // of the schema result.
  return (
    <form onSubmit={form.handleSubmit}>
      <TextField api={form.field("email")} label="Email" />
      <TextField api={form.field("password")} label="Password" />
      <button type="submit">Sign up</button>
    </form>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {14}
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
type Signup = z.infer<typeof signupSchema>;

function SignupForm() {
  const form = useForm({
    defaultValues: { email: "", password: "" } as Signup,
    // A Standard Schema is a validator as-is. No adapter package.
    validators: { onChange: signupSchema },
    onSubmit: ({ value }) => signUp(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="email">
        {(field) => (
          <>
            <TextInput
              value={field.state.value}
              onChange={field.handleChange}
            />
            {/* A schema validator yields issue objects, not strings. */}
            {field.state.meta.errors[0] && (
              <span>{field.state.meta.errors[0].message}</span>
            )}
          </>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <>
            <TextInput
              type="password"
              value={field.state.value}
              onChange={field.handleChange}
            />
            {field.state.meta.errors[0] && (
              <span>{field.state.meta.errors[0].message}</span>
            )}
          </>
        )}
      </form.Field>
      <button type="submit">Sign up</button>
    </form>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                             | Kin Form                                               | TanStack Form                                                    |
| --------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| Adapter package             | `toSchemaValidator()` from `@kintools/form-validators` | none; a Standard Schema is a validator itself                    |
| Where a schema attaches     | any node, via its own `schemaValidator`                | field or form `validators.onChange`                              |
| Schema + hand-written rules | coexist; `error` prefers the field's own message       | merge into one `errors`; a field's rules replace the form schema |
| Standard Schema libraries   | any (zod, valibot, arktype, ...)                       | any (zod, valibot, arktype, effect, ...)                         |

Kin Form's edge is scope and separation, not ergonomics: a schema can sit on any
node, and its output is tracked apart from a field's own `validators`-produced
message under the hood, so a field can carry both without one overwriting the
other; `field.error` surfaces whichever exists, preferring the field's own. On
TanStack Form a field-level `validators` entry replaces the form schema for that
field instead of running alongside it.

## Cross-field validation

Both are declarative here, unlike React Hook Form's manual `trigger()`. They
declare the link from opposite ends of the relationship.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {9,14-15}
function SignupForm() {
  const form = useForm<Signup>({
    initialValue: { email: "", password: "", confirmPassword: "" },
  });

  return (
    <>
      <TextField
        api={form.field("password", { dependents: ["confirmPassword"] })}
        label="Password"
      />
      <TextField
        api={form.field("confirmPassword", {
          validators: (field) =>
            field.value !== form.value.password ? "Passwords must match" : null,
        })}
        label="Confirm password"
      />
    </>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {20-26}
function SignupForm() {
  const form = useForm({
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  return (
    <>
      <form.Field name="password">
        {(field) => (
          <TextInput
            type="password"
            value={field.state.value}
            onChange={field.handleChange}
          />
        )}
      </form.Field>

      <form.Field
        name="confirmPassword"
        validators={{
          onChangeListenTo: ["password"],
          onChange: ({ value, fieldApi }) =>
            value !== fieldApi.form.getFieldValue("password")
              ? "Passwords must match"
              : undefined,
        }}
      >
        {(field) => (
          <>
            <TextInput
              type="password"
              value={field.state.value}
              onChange={field.handleChange}
            />
            {field.state.meta.errors[0] && (
              <span>{field.state.meta.errors[0]}</span>
            )}
          </>
        )}
      </form.Field>
    </>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                         | Kin Form                                  | TanStack Form                                    |
| ----------------------- | ----------------------------------------- | ------------------------------------------------ |
| Which field declares    | the source field lists `dependents`       | the dependent field lists `onChangeListenTo`     |
| Reading the other value | `form.value.password`                     | `fieldApi.form.getFieldValue("password")`        |
| Trigger granularity     | `dependents`, re-runs on any value change | `onChangeListenTo` / `onBlurListenTo`, per event |
| Fan-out                 | one array on the source covers all        | one array per dependent field                    |

Same spirit, opposite ends. Kin Form puts the wiring on the field being watched,
so adding a dependent is an edit to the source field's `dependents`. TanStack
Form puts it on the field doing the watching, so the field that owns the rule
also declares what re-triggers it. Both avoid a manual refire call.

The tradeoff is fan-out versus locality: one source feeding many dependents is a
single array in Kin Form (one `onChangeListenTo` per dependent in TanStack
Form), while co-locating each dependent's rule with its triggers means removing
the dependent takes its wiring with it, where a Kin Form source can be left with
a stale `dependents` entry.

Kin Form's side also needs no per-dependent subscription: the source's own
value-change callback, which fires anyway, does the revalidation, so nothing
registers or tears down as fields mount and unmount.

## Dirty tracking & reset

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {13,18}
function ProfileForm() {
  const form = useForm({
    initialValue: { firstName: "", lastName: "" },
    onSubmit: (form) => save(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <Watch api={form.field("firstName")}>
        {(field) => (
          <>
            <TextInput value={field.value} onChange={field.handleChange} />
            {field.dirty && <span>Edited</span>}
          </>
        )}
      </Watch>

      <Watch api={form} select={(f) => f.dirty}>
        {(f, dirty) => (
          <button disabled={!dirty} onClick={() => f.reset()}>
            Discard changes
          </button>
        )}
      </Watch>
    </form>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {25,30}
function ProfileForm() {
  const form = useForm({
    defaultValues: { firstName: "", lastName: "" },
    onSubmit: ({ value }) => save(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="firstName">
        {(field) => (
          <>
            <TextInput
              value={field.state.value}
              onChange={field.handleChange}
            />
            {
              /* `isDirty` stays true after a revert; `!isDefaultValue`
              is the "differs from the default right now" check. */
            }
            {!field.state.meta.isDefaultValue && <span>Edited</span>}
          </>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => s.isDirty}>
        {(isDirty) => (
          <button disabled={!isDirty} onClick={() => form.reset()}>
            Discard changes
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                          | Kin Form                                 | TanStack Form                                    |
| ------------------------ | ---------------------------------------- | ------------------------------------------------ |
| Whole-form dirty         | `form.dirty`, flips back on revert       | `form.state.isDirty`, stays set after a revert   |
| Differs from default now | `field.dirty`                            | `!field.state.meta.isDefaultValue`               |
| Per-field subscription   | `field.dirty` in a scoped `Watch`        | `field.state.meta.isDirty`, from the store slice |
| Reset                    | `form.reset(value?)`, moves the baseline | `form.reset(values?, opts?)`                     |
| Reset one field          | `form.resetField(name, value?)`          | `form.resetField(name)`                          |

The models differ. Kin Form's `dirty` is a live `deepEqual` against the
baseline, so typing a character then deleting it leaves the field clean.
TanStack Form's `meta.isDirty` means "edited at some point" and stays set after
a revert; `!meta.isDefaultValue` is the check that matches Kin Form's `dirty`.

## Submission handling

Both name a callback for "the form failed validation," separate from the success
path. Only Kin Form also has one for "the submit function itself threw."

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {6-11}
const form = useForm<Signup>({
  initialValue: { email: "", password: "" },
  onSubmit: async (form) => {
    await signUp(form.value);
  },
  onSubmitInvalid: (form) => {
    form.touched = true; // Reveal errors on never-blurred fields.
  },
  onSubmitError: (form, error) => {
    toast.error("Sign up failed"); // Called automatically, no wrapper needed.
  },
});

// handleSubmit itself calls preventDefault when given an event.
<form onSubmit={form.handleSubmit}>;
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {3-13}
const form = useForm({
  defaultValues: { email: "", password: "" },
  onSubmit: async ({ value }) => {
    // A throw here lands in form state and blocks `canSubmit`;
    // wrap it yourself to surface a message.
    try {
      await signUp(value);
    } catch {
      toast.error("Sign up failed");
    }
  },
  onSubmitInvalid: ({ value, formApi }) => {
    // Validation failed.
  },
});

<form
  onSubmit={(e) => {
    e.preventDefault();
    form.handleSubmit();
  }}
>;
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                          | Kin Form                       | TanStack Form                                            |
| ------------------------ | ------------------------------ | -------------------------------------------------------- |
| Validation failed        | `onSubmitInvalid`              | `onSubmitInvalid`                                        |
| `onSubmit` itself throws | `onSubmitError`, automatic     | no callback; `canSubmit` goes `false`, catch it yourself |
| Binding to `<form>`      | `onSubmit={form.handleSubmit}` | handler does `preventDefault` + `handleSubmit()`         |
| Submit-in-progress state | `form.submitting`              | `form.state.isSubmitting` / `.canSubmit`                 |

`onSubmitInvalid` is parity. The gap: TanStack Form has no callback for "the
submit function threw," so a failed request inside `onSubmit` is yours to catch,
and an uncaught throw flips `canSubmit` to `false` until an input changes. Kin
Form's `onSubmitError` fires automatically and leaves the form submittable.

### Server-side validation errors

A submit that fails a check only the server can run comes back with per-field
messages to surface on the form.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {5}
const form = useForm<Signup>({
  initialValue: { email: "", password: "" },
  onSubmit: async (form) => {
    const res = await signUp(form.value);
    if (res.fieldErrors) form.setErrors(res.fieldErrors); // { email: "Taken" }
  },
});
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {6-10}
const form = useForm({
  defaultValues: { email: "", password: "" },
  onSubmit: async ({ value, formApi }) => {
    const res = await signUp(value);
    if (res.fieldErrors) {
      formApi.setErrorMap({
        onSubmit: { form: res.formError, fields: res.fieldErrors },
      });
    }
  },
});
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                              | Kin Form                                          | TanStack Form                                                                                                 |
| ---------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Applying a set               | `form.setErrors(map)`                             | `formApi.setErrorMap({ onSubmit: { form, fields } })`, or return that shape from a `validators.onSubmitAsync` |
| Message shape                | flat dotted-path → message map (same as a schema) | `{ form?, fields? }` nested under an `onSubmit` key                                                           |
| Scope                        | any node                                          | the form                                                                                                      |
| Clearing                     | automatic, on each field's next value change      | on next submit                                                                                                |
| Progressive-enhancement flow | none: the same call                               | `createServerValidate` + `mergeForm` + `useTransform`, in per-framework packages                              |

Both surface the response imperatively in `onSubmit`; the call is what differs.
Kin Form's `setErrors` takes a flat path → message map (the same shape a
[`schemaValidator`](/form/guide/schema-validation) produces), works on any node,
and clears each message once that field is edited. TanStack Form's `setErrorMap`
writes a `{ form, fields }` object under the `onSubmit` error-map key,
form-only, cleared on the next submit.

For no-JS progressive enhancement TanStack Form adds a separate
`createServerValidate`/`mergeForm` apparatus in per-framework packages; Kin Form
has no equivalent, and no need for one, the `setErrors` call is the same either
way.

## Async initial values

Neither accepts an async `defaultValues` the way React Hook Form does, so this
is closer to a wash. Both lean on an external data hook.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {7-8}
function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  if (isLoading || !data) return <p>Loading...</p>;
  return <ProfileForm initialValue={data} />;
}

function ProfileForm({ initialValue }: { initialValue: Profile }) {
  const form = useForm({
    initialValue,
    onSubmit: (form) => save(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {7-8}
function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  if (isLoading || !data) return <p>Loading...</p>;
  return <ProfileForm defaultValues={data} />;
}

function ProfileForm({ defaultValues }: { defaultValues: Profile }) {
  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => save(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      {/* ... */}
    </form>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                          | Kin Form                          | TanStack Form                  |
| ------------------------ | --------------------------------- | ------------------------------ |
| Async defaults           | `initialValue` is synchronous     | `defaultValues` is synchronous |
| Loading state            | from your data-fetching hook      | same                           |
| Populating once loaded   | mount the form after data arrives | same                           |
| Resetting to loaded data | `form.reset(data)`                | `form.reset(data)`             |

Both keep the form unmounted until the data is present, then pass it straight in
as the initial value, so there is nothing to reconcile afterwards. TanStack
Form's docs also show a keep-mounted variant (feed `data?.field ?? ""`, then
call `form.reset(data)` in an effect when it lands); either works.

## Reactivity & selective re-rendering

Both support selective re-rendering; the subscription model is what differs.

**Kin Form**: each `FieldApi` node has its own subscribers, so a notification
reaches only the subscribers of the nodes that changed (and any ancestor group
being watched). State (`value`, `error`, `touched`, `dirty`, ...) lives on one
object, so a single `useWatch` `select` can subscribe to any slice of it.

**TanStack Form**: `FieldApi`, `FieldGroupApi`, and `FormApi` all read from one
shared `@tanstack/store`, so any change notifies **every** subscriber, each of
which runs its selector to decide whether to re-render. The selectors keep the
re-renders precise; the cost is only the notify-all fan-out, negligible for
typical form sizes.

The [feature matrix](/form/comparison/#feature-matrix) tracks this difference as
the "Localized subscription" row.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {5-8}
import { type FieldApi, useWatch } from "@kintools/form-react";

function Field<TParentValue>({ api }: { api: FieldApi<string, TParentValue> }) {
  // One hook covers all field state (including value).
  const [value, error] = useWatch(
    api,
    (f) => [f.value, f.touched ? f.error : null] as const,
  );

  return (
    <label>
      <input value={value} />
      {error && <span>{error}</span>}
    </label>
  );
}

<Field api={form.field("email")} />;
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {6-9}
import { useStore } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";

function Field({ field }: { field: AnyFieldApi }) {
  // One store, one selector; every form mutation runs this selector.
  const { value, error } = useStore(field.store, (s) => ({
    value: s.value,
    error: s.meta.isTouched ? s.meta.errors[0] : null,
  }));

  return (
    <label>
      <input value={value} />
      {error && <span>{error}</span>}
    </label>
  );
}

<form.Field name="email">
  {(field) => <Field field={field} />}
</form.Field>;
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

## Form composition

[`TextField`](#reusable-field-component) above is the leaf case. Groups and
arrays add more: a group needs child-path addressing, an array also needs stable
item identity across a reorder. In Kin Form each stays one typed `FieldApi`
prop; in TanStack Form each is a distinct primitive (`withFieldGroup` /
`FieldGroupApi`, `form.Field` with `mode="array"`).

### Group field

A reusable component for a nested object (e.g. an address, reused for shipping
and billing):

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {6}
import { type FieldApi } from "@kintools/form-react";

type Address = { line1: string; city: string };

function AddressField<TParentValue>(
  { api }: { api: FieldApi<Address, TParentValue> },
) {
  return (
    <fieldset>
      <TextField api={api.field("line1")} label="Line 1" />
      <TextField api={api.field("city")} label="City" />
    </fieldset>
  );
}

<AddressField api={form.field("shipping")} />
<AddressField api={form.field("billing")} />
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {5,21-22}
type Address = { line1: string; city: string };

// `withFieldGroup` is the one destructured from the `createFormHook` call in
// the Reusable field component section above, next to `useAppForm`.
const AddressGroup = withFieldGroup({
  defaultValues: { line1: "", city: "" } as Address,
  render: function Render({ group }) {
    return (
      <fieldset>
        <group.AppField name="line1">
          {(field) => <field.TextField label="Line 1" />}
        </group.AppField>
        <group.AppField name="city">
          {(field) => <field.TextField label="City" />}
        </group.AppField>
      </fieldset>
    );
  },
});

<AddressGroup form={form} fields="shipping" />
<AddressGroup form={form} fields="billing" />
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                            | Kin Form                                            | TanStack Form                                                                   |
| -------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| Reusable-group primitive   | same `FieldApi<Address, TParentValue>` as any field | `withFieldGroup({ defaultValues, render })`, a distinct HOC                     |
| Binding it to a location   | `form.field("shipping")`, a resolved field          | `fields="shipping"` prop (path string or key-to-path map)                       |
| Building child paths       | `api.field("line1")`, relative                      | `group.AppField name="line1"`, via the `fields` mapping                         |
| The group's own value type | `FieldApi<Address, TParentValue>`: right there      | `defaultValues` stands in for the shape (type only)                             |
| Group-level validation     | `validators` on the group's `FieldApi`              | none on `withFieldGroup`; a whole-group rule must live on the form              |
| Distinct concepts to learn | one (`FieldApi`)                                    | `withFieldGroup`, `FieldGroupApi`, `group.AppField`, `fields`, `createFieldMap` |

Kin Form uses one concept: a group is a `FieldApi` whose value is an object, and
`api.field("line1")` reads into it like any other field.

TanStack Form uses `withFieldGroup`, a separate wrapper with its own `group`
object (a `FieldGroupApi`, which is neither `FormApi` nor `FieldApi`). You bind
it to a place in the form with a `fields` prop: a path string, or a map from
group key to form path. It is capable, and the map even lets the group's shape
differ from the form's, but it is one more model to learn, and it takes no
`validators`, so a whole-group rule has to live on the form instead of in the
component.

### Array field

The per-item mechanics line up almost exactly. Two gaps: Kin Form keeps a stable
React key across a reorder and TanStack Form does not, and making the array
component reusable is one typed prop in Kin Form versus a choice between three
imperfect options in TanStack Form.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {4,11,13}
import { type FieldApi, useWatch } from "@kintools/form-react";

function ItemsField<TParentValue>(
  { api }: { api: FieldApi<string[], TParentValue> },
) {
  const value = useWatch(api, (g) => g.value);

  return (
    <>
      {value.map((_, i) => {
        const field = api.field(`${i}`);
        return (
          <div key={field.id}>
            <TextInput value={field.value} onChange={field.handleChange} />
            <button type="button" onClick={() => api.moveItem("", i, i - 1)}>
              Move up
            </button>
            <button type="button" onClick={() => api.removeItem("", i)}>
              Remove
            </button>
          </div>
        );
      })}
      {api.error && <span>{api.error}</span>}
      <button type="button" onClick={() => api.pushItem("", "")}>Add</button>
    </>
  );
}

<ItemsField
  api={form.field("items", {
    validators: (g) => (g.value.length ? null : "Add at least one item"),
  })}
/>;
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {18-22,25,31,62-65}
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

// One-time setup, shared across the app (same wiring as the
// Reusable field component section).
const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});

// `withFieldGroup` decouples the component from the form: `defaultValues`
// describes only the group's own shape and `fields` binds it into any form.
// A caller-supplied `validators` bag has to be a forwarded render prop, its
// type hand-rolled: TanStack Form's `FieldValidators` has 12 type params.
const ItemsField = withFieldGroup({
  defaultValues: { items: [] as string[] },
  props: {
    validators: {} as {
      onChange?: (p: { value: string[] }) => string | undefined;
    },
  },
  render: function Render({ group, validators }) {
    return (
      <group.Field name="items" mode="array" validators={validators}>
        {(field) => (
          <>
            {field.state.value.map((_, i) => (
              // No built-in stable id per row; index is the usual key.
              <div key={i}>
                <group.Field name={`items[${i}]`}>
                  {(sub) => (
                    <TextInput
                      value={sub.state.value}
                      onChange={sub.handleChange}
                    />
                  )}
                </group.Field>
                <button type="button" onClick={() => field.moveValue(i, i - 1)}>
                  Move up
                </button>
                <button type="button" onClick={() => field.removeValue(i)}>
                  Remove
                </button>
              </div>
            ))}
            {field.state.meta.errors[0] && (
              <span>{field.state.meta.errors[0]}</span>
            )}
            <button type="button" onClick={() => field.pushValue("")}>
              Add
            </button>
          </>
        )}
      </group.Field>
    );
  },
});

<ItemsField
  form={checkoutForm}
  fields="shipping"
  validators={{
    onChange: ({ value }) => value.length ? undefined : "Add at least one item",
  }}
/>;
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                           | Kin Form                          | TanStack Form                            |
| ------------------------- | --------------------------------- | ---------------------------------------- |
| What holds the array      | the array _is_ a `FieldApi`       | `<form.Field mode="array">`, a mode flag |
| Mutation helpers          | a six-method family on the field  | the same six, `*Value` names             |
| Array-level validation    | the field's own `validators`      | `validators` on the array field          |
| Stable key across reorder | `field.id` follows the item       | none built in; key by index              |
| Reusable component        | one typed prop, generic, no setup | three trade-offs (below)                 |

Making the array component reusable is where TanStack Form has no clean answer.
Three routes, each conceding something:

- **`withFieldGroup` + a `fields` prop** (above): generic and fully typed, but
  adds the `createFormHook` setup, a third API object (`group`), and every
  caller option re-declared as a render prop.
- **Pass the whole `form` to `form.Field`**: typed and setup-free, but pinned to
  one form's exact shape (`ReactFormExtendedApi` is invariant over its 12 type
  args), so one extra field breaks it.
- **A `{ form, name }` pair with `<Field>` / `useField`** (React Hook Form's
  `Controller` style): generic and setup-free, but drops to `AnyFormApi` / casts
  and an `any` value.

Kin Form's resolved `FieldApi<string[], TParentValue>` prop is all three at
once: generic, typed, no setup, because `TParentValue` is an opaque pass-through
and validators go on `form.field(name, { validators })` at the call site.

## Multistep forms

Neither ships an official multi-step or wizard component. Kin Form ships a
dedicated hook, [`useMultistep`](/form/guide/multistep). TanStack Form does not;
its official multi-step example hand-rolls step state.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {16-19,25-26}
import { useForm, useMultistep } from "@kintools/form-react";

type Signup = {
  credentials: { email: string; password: string };
  address: { line1: string };
};

function SignupWizard() {
  const form = useForm<Signup>({
    initialValue: signupDefaults,
    onSubmit: signUp,
  });

  // Each step name is the DeepKey of that step's own FieldApi.
  // `next()` touches, waits for validation, and gates the advance.
  const { stepName, stepField, isLastStep, next } = useMultistep(
    form,
    ["credentials", "address"] as const,
  );

  return (
    <form onSubmit={form.handleSubmit}>
      {stepName === "credentials" && (
        <>
          <TextField api={stepField.field("email")} label="Email" />
          <TextField api={stepField.field("password")} label="Password" />
        </>
      )}
      {stepName === "address" && (
        <TextField api={stepField.field("line1")} label="Line 1" />
      )}
      {isLastStep
        ? <button type="submit">Sign up</button>
        : <button type="button" onClick={next}>Next</button>}
    </form>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {14-17,24-30}
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";

// One input renderer, reused per step (field markup is not the point here).
const renderText = (field: AnyFieldApi) => (
  <input
    value={field.state.value}
    onChange={(e) => field.handleChange(e.target.value)}
  />
);

// Maintained by hand, one field-name list per step.
const stepFields = [
  ["credentials.email", "credentials.password"],
  ["address.line1"],
] as const;

function SignupWizard() {
  const form = useForm({ defaultValues: signupDefaults, onSubmit: signUp });
  const [step, setStep] = useState(0);
  const isLastStep = step === stepFields.length - 1;

  const next = async () => {
    // Validate this step's fields by hand.
    const results = await Promise.all(
      stepFields[step].map((name) => form.validateField(name, "change")),
    );
    if (results.every((errs) => errs.length === 0)) setStep((s) => s + 1);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      {step === 0 && (
        <>
          <form.Field name="credentials.email">{renderText}</form.Field>
          <form.Field name="credentials.password">{renderText}</form.Field>
        </>
      )}
      {step === 1 && <form.Field name="address.line1">{renderText}</form.Field>}
      {isLastStep
        ? <button type="submit">Sign up</button>
        : <button type="button" onClick={next}>Next</button>}
    </form>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                          | Kin Form                                    | TanStack Form                                |
| ------------------------ | ------------------------------------------- | -------------------------------------------- |
| Dedicated wizard API     | `useMultistep` hook                         | none; hand-rolled with `useState`            |
| Step-validation ceremony | `next()`: touch, wait, gate, built in       | `form.validateField(...)` per field, by hand |
| Step to field mapping    | each step name is a `DeepKey` (`stepField`) | a field-name list you maintain per step      |
| Branching / redirecting  | `onBeforeNext` returns a step to jump to    | custom `step` state logic                    |
| Unvalidated navigation   | `back()`, `jump(index or name)`             | custom `setStep` calls                       |

Neither ships a wizard component, but Kin Form has `useMultistep` and TanStack
Form does not. TanStack Form's
[Form Groups](https://tanstack.com/form/latest/docs/framework/react/guides/form-groups)
narrow the gap (a group per step, advancing on `onGroupSubmit`), but there is no
equivalent to `next()` doing touch, wait, and gate in one call, or
`onBeforeNext` redirecting to another step.
