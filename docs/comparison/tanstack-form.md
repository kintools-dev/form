---
description: "A side-by-side code comparison of Kin Form against @tanstack/react-form@1.33.5 across field binding, per-node validation and debouncing, schema validation, cross-field validation, dirty tracking, submission handling, async initial values, reactivity, form composition, and multistep forms."
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

```tsx {13}
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
            {field.error && <span>{field.error}</span>}
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

```tsx {17}
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

|                   | Kin Form                                                               | TanStack Form                                                                          |
| ----------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Binding model     | Controlled everywhere (`value`/`handleChange`)                         | Controlled everywhere (`field.state.value`/`field.handleChange`)                       |
| Field primitive   | `<Watch api={form.field(name, opts)}>`: resolve a field, then watch it | `<form.Field name={name}>{(field) => ...}</form.Field>`, one component bound to `form` |
| Submit wiring     | `onSubmit={form.handleSubmit}`, bind directly                          | Handler calls `e.preventDefault()`, then `form.handleSubmit()`                         |
| Reading the error | `field.error` (a `string \| null`)                                     | `field.state.meta.errors` (an array)                                                   |

Both bind controlled, and the shapes are close. The main structural difference
is that `form.Field` is a single primitive bound to the form, whereas Kin splits
"resolve a field" (`form.field(name, opts)`) from "watch it" (`<Watch>` /
`useWatch`). For a one-off field, `form.Field` inline is a touch less ceremony.
Kin's split is what lets an already-resolved `FieldApi` be handed to a reusable
component (see [Form composition](#form-composition) below), where every call
site collapses to one line too.

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

```tsx {12}
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

Both treat a custom-component field exactly like a native one, with no extra
primitive. This is the `Controller` tax React Hook Form pays and neither of
these does. Nested groups and arrays are covered under
[Form composition](#form-composition); there the two diverge, because a TanStack
`FieldGroupApi` is a separate type from `FieldApi`, whereas a Kin group is just
a `FieldApi` whose value is an object.

## Per-node validation: when it runs, and debouncing

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {13}
import { useForm, Watch } from "@kintools/form-react";

function SignupForm() {
  const form = useForm<{ username: string }>({
    initialValue: { username: "" },
  });

  return (
    <Watch
      api={form.field("username", {
        asyncValidator: async (field) =>
          (await checkUsernameTaken(field.value)) ? "Username taken" : null,
        validationDebounceMs: 300,
      })}
    >
      {(field) => (
        <TextInput value={field.value} onChange={field.handleChange} />
      )}
    </Watch>
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
debounce (`validationDebounceMs` on Kin, `asyncDebounceMs` on TanStack), so
neither needs the hand-rolled `lodash/debounce` the React Hook Form page shows.
Both also run async validation only after the synchronous rules for that field
have passed, so an expensive check never fires for a value already known bad.

**What's different:**

|                  | Kin Form                                                                    | TanStack Form                                                                                                |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Sync validation  | `validators` array, run in order on every value change, first truthy wins   | `validators.onChange` / `.onBlur`, one function per event hook                                               |
| Async validation | One `asyncValidator` slot, runs after every sync `validators` entry passes  | `validators.onChangeAsync` / `.onBlurAsync`, separate per event hook                                         |
| Debounce         | `validationDebounceMs`, applies to `asyncValidator` (and `schemaValidator`) | `asyncDebounceMs`, overridable per hook via `onChangeAsyncDebounceMs` / `onBlurAsyncDebounceMs`              |
| Config shape     | One `validators` array plus one `asyncValidator` plus one debounce number   | A `validators` object keyed by event (`onChange`, `onBlur`, `onChangeAsync`, `onBlurAsync`, `onSubmit`, ...) |

The functional coverage is the same. The difference is Kin's single `validators`
array plus a separate async slot, versus TanStack's `validators` object where
each timing (change, blur, submit; sync and async) is its own key. TanStack's
model makes "validate only on blur" a one-key change. Kin runs sync `validators`
on every change always, and leaves blur-only display to the render
(`field.touched`).

## Schema validation

This is a place TanStack Form is genuinely nicer.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {13}
import { useForm, Watch } from "@kintools/form-react";
import { required, toSchemaValidator } from "@kintools/form-validators";
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
  });

  return (
    <Watch api={form.field("email", { validators: required("Required") })}>
      {(field) => {
        // Both channels are live at once, not one overriding the other.
        const error = field.error ?? field.schemaError;
        return (
          <>
            <TextInput value={field.value} onChange={field.handleChange} />
            {error && <span>{error}</span>}
          </>
        );
      }}
    </Watch>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="TanStack Form">

```tsx {13}
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
  });

  return (
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
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

TanStack Form has native [Standard Schema](https://standardschema.dev) support:
a schema is a validator, passed straight to `validators.onChange` at the field
or form level, with no `@hookform/resolvers`-style package and no
`toSchemaValidator()`. Any Standard Schema library works (zod, valibot, arktype,
effect). Kin needs the `toSchemaValidator()` adapter from
`@kintools/form-validators` for the same thing.

**What's different:**

|                                | Kin Form                                                                                                           | TanStack Form                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Adapter package                | `toSchemaValidator()` from `@kintools/form-validators`                                                             | None; a Standard Schema is a validator as-is                                                                           |
| Where a schema attaches        | Any node (field, group, or form) via its own `schemaValidator`; the nearest one wins beneath it                    | Field-level `validators.onChange`, or form-level `validators`; a field's own entry overrides the form's for that field |
| Schema plus hand-written rules | Coexist: `schemaError` is separate from `error`, neither overwrites the other (`field.error ?? field.schemaError`) | Merge into one `field.state.meta.errors`; a field's own `validators` replaces the form schema's result for that field  |
| Standard Schema libraries      | zod, valibot, arktype, ... (any)                                                                                   | zod, valibot, arktype, effect, ... (any)                                                                               |

Kin's counter is scope and separation, not ergonomics: a schema can sit on any
node (not just the whole form), and its output lands in a field's own
`schemaError`, kept apart from the `error` its own `validators` produce, so a
field can carry both at once and decide how to combine them. On TanStack, a
field-level `validators` entry overrides the form-level schema for that field
rather than running alongside it.

## Cross-field validation

Both are declarative here, unlike React Hook Form's manual `trigger()`. They
declare the link from opposite ends of the relationship.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {8,18-20}
function SignupForm() {
  const form = useForm<Signup>({
    initialValue: { email: "", password: "", confirmPassword: "" },
  });

  return (
    <>
      <Watch api={form.field("password", { dependents: ["confirmPassword"] })}>
        {(field) => (
          <TextInput
            type="password"
            value={field.value}
            onChange={field.handleChange}
          />
        )}
      </Watch>

      <Watch
        api={form.field("confirmPassword", {
          validators: (field) =>
            field.value !== form.value.password ? "Passwords must match" : null,
        })}
      >
        {(field) => (
          <>
            <TextInput
              type="password"
              value={field.value}
              onChange={field.handleChange}
            />
            {field.error && <span>{field.error}</span>}
          </>
        )}
      </Watch>
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

|                               | Kin Form                                                         | TanStack Form                                                    |
| ----------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Which field declares the link | The source field (`password`) lists its `dependents`             | The dependent field (`confirmPassword`) lists `onChangeListenTo` |
| Reading the other value       | `form.value.password` inside the validator                       | `fieldApi.form.getFieldValue("password")` inside the validator   |
| Trigger granularity           | `dependents` re-runs the target's validators on any value change | `onChangeListenTo` / `onBlurListenTo`, separate arrays per event |
| Fan-out                       | One `dependents` array on the source covers every dependent      | One `onChangeListenTo` array per dependent field                 |

Same spirit, opposite ends. Kin puts the wiring on the field being watched, so
adding a dependent is an edit to the source field's `dependents`. TanStack puts
it on the field doing the watching, so the field that owns the rule also
declares what re-triggers it. Both avoid a manual refire call.

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

|                                      | Kin Form                                                                     | TanStack Form                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Whole-form dirty                     | `form.dirty`: `!deepEqual(value, baseline)`, flips back to `false` on revert | `form.state.isDirty`: `true` once any field changed, stays `true` after a revert    |
| "Differs from the default right now" | `field.dirty`: same `deepEqual`-against-baseline model                       | `!field.state.meta.isDefaultValue`: `isDirty` alone will not flip back              |
| Per-field dirty subscription         | `field.dirty` inside a `Watch`/`useWatch` scoped to that field               | `field.state.meta.isDirty` / `.isDefaultValue`, from the field's slice of the store |
| Reset                                | `form.reset(value?)`, moves the baseline too                                 | `form.reset(values?, opts?)`                                                        |
| Reset one field                      | `form.resetField(name, value?)`                                              | `form.resetField(name)`                                                             |

The models differ. Kin's `dirty` is a live `deepEqual` against the baseline, so
typing a character and deleting it again leaves the field clean. TanStack's
`meta.isDirty` is a "has ever been edited" flag that stays set after a revert by
design; for Kin's semantics you read `!meta.isDefaultValue` instead. TanStack
exposes both flags so you pick; Kin gives you the one behavior.

## Submission handling

Both name a callback for "the form failed validation," separate from the success
path. Only Kin also has one for "the submit function itself threw."

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

|                          | Kin Form                                                                                             | TanStack Form                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Validation failed        | `onSubmitInvalid`                                                                                    | `onSubmitInvalid`                                                                                                             |
| `onSubmit` itself throws | `onSubmitError`, invoked automatically; the form stays submittable                                   | No dedicated callback; the error lands in form state and `canSubmit` goes `false`, so wrap `onSubmit` in `try/catch` yourself |
| Binding to `<form>`      | `onSubmit={form.handleSubmit}`, event optional, so the same call works from a React Native `onPress` | Handler calls `e.preventDefault()`, then `form.handleSubmit()`                                                                |
| Submit-in-progress state | `form.submitting`                                                                                    | `form.state.isSubmitting`, `form.state.canSubmit`                                                                             |

`onSubmitInvalid` is parity, and unlike React Hook Form's positional second
argument, both give it a name. The gap is the same one React Hook Form has: no
callback for "the submit function threw," so a failed request inside `onSubmit`
is yours to catch. TanStack additionally flips `canSubmit` to `false` after an
uncaught submit error, so a bare re-click will not retry until an input changes.
Kin's `onSubmitError` fires automatically and leaves the form submittable.

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

|                          | Kin Form                                                                        | TanStack Form                                                                  |
| ------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Async defaults           | `initialValue` is synchronous, read once at construction                        | `defaultValues` is synchronous; docs recommend pairing with TanStack Query     |
| Loading state            | From your data-fetching hook (e.g. `useQuery`'s `isLoading`)                    | Same, from your data-fetching hook                                             |
| Populating once loaded   | `ProfileForm` mounts only after data arrives, so `initialValue` is already real | Same: `ProfileForm` mounts only after data arrives, so `defaultValues` is real |
| Resetting to loaded data | `form.reset(data)` if the form is already mounted when it arrives               | `form.reset(data)` likewise, in the keep-mounted variant                       |

Both keep the form unmounted until the data is present, then pass it straight in
as the initial value, so there is nothing to reconcile afterwards. TanStack's
docs also show a keep-mounted variant (feed `data?.field ?? ""`, then call
`form.reset(data)` in an effect when it lands); either works.

## Reactivity & selective re-rendering

**Kin Form**: `FieldApi` carries all of its state (`value`, `error`, `touched`,
`dirty`, ...) on one object, so `useWatch`, via `select`, subscribes to any of
it (or several pieces together) in one call, isolated to that node.

**TanStack Form**: `FieldApi`, `FieldGroupApi`, and `FormApi` all read from one
shared `@tanstack/store`. Every mutation notifies every subscriber, and each
subscriber runs its own selector to decide whether to re-render. Selectors do
prevent re-renders effectively, the same way React Hook Form's do; the
difference is the notify-everyone-then-filter model versus Kin's targeted notify
(this is the "Localized subscription" row in the
[feature matrix](/form/comparison/#feature-matrix)).

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

**What's different:**

|                        | Kin Form                                                   | TanStack Form                                                                              |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Notify model           | Targeted: a mutation notifies only that node's subscribers | One shared store: every mutation notifies every subscriber, each filters with its selector |
| Value vs field state   | One `useWatch(api, select)` covers both                    | `field.state` / `useStore(field.store, selector)` cover both, from the same store          |
| In-render subscription | `<Watch api={...} select={...}>`, a render-prop `useWatch` | `<form.Subscribe selector={...}>{...}</form.Subscribe>`, does not re-render the parent     |
| Deriving a value       | `select: (f) => ...`, deduped (shallow by default)         | `selector: (s) => ...`, deduped by the store                                               |

The end results are similar: both let a component subscribe to exactly the slice
it cares about. Kin routes a notification only to the nodes that changed.
TanStack runs every selector on every change and relies on the selector's return
value staying equal to skip the re-render.

## Form composition

Both let you build a reusable field component (leaf, group, or array) instead of
repeating markup at every call site. The type-parameter shape and the number of
named primitives are where they diverge.

- **Kin Form**: `FieldApi<TValue, TParentValue = never>` decouples a field's own
  value type from its parent form's shape, so a component only ever needs to
  know `TValue`. `TParentValue` stays an opaque pass-through it never inspects.
- **TanStack Form**: reusable, typed components go through `createFormHook`
  (`createFormHookContexts` + `createFormHook` giving `useAppForm`, `withForm`,
  `withFieldGroup`), plus `form.AppField` / `form.AppForm`, plus `formOptions`
  for shared config, plus `FieldGroupApi` for reusable groups. The lighter route
  (pass the field object down directly) types it as `AnyFieldApi`, which is
  `FieldApi` with 23 `any` type parameters, so the value type is gone.

<Container type="info">

To build one reusable, type-safe text field and reuse it across forms, the
concepts you learn are: `FieldApi` (Kin) versus `createFormHookContexts`,
`createFormHook`, `fieldContext`, `useAppForm`, `form.AppField`,
`useFieldContext`, and for groups `withFieldGroup` / `FieldGroupApi` and the
`fields` mapping (TanStack). The
[API surface matrix](/form/comparison/#api-surface) lists the full set.

</Container>

### Leaf field

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {4}
import { type FieldApi, useWatch } from "@kintools/form-react";

function TextField<TParent>(
  { api, label }: { api: FieldApi<string, TParent>; label: string },
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
      {field.invalid && field.touched && <span>{field.error}</span>}
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

```tsx {4,8,34}
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

const { useAppForm } = createFormHook({
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

|                             | Kin Form                                                               | TanStack Form                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| What the component receives | An already-resolved `api: FieldApi<string, TParent>`, passed as a prop | The field, pulled off React context via `useFieldContext<string>()`, valid only inside `form.AppField`                          |
| One-time setup              | None                                                                   | `createFormHookContexts()` plus `createFormHook({ fieldContext, formContext, fieldComponents, formComponents })` → `useAppForm` |
| Value-type safety           | `FieldApi<string, TParent>`: only a string field type-checks           | `useFieldContext<string>()`: you assert the type, or pass the field as `AnyFieldApi` and lose it                                |
| Call site                   | `<TextField api={form.field("email", ...)} label="Email" />`           | `<form.AppField name="email">{(field) => <field.TextField label="Email" />}</form.AppField>`                                    |
| Cross-form reuse            | Same component, unmodified; `TParent` is never inspected               | Registered once in `fieldComponents`, reused via any `useAppForm` from the same hook                                            |

TanStack's typed-reusable-component story is `createFormHook`: a one-time wiring
step that produces `useAppForm`, plus components registered in `fieldComponents`
that read the field off context inside `form.AppField`. It works well once set
up, and pre-binding keeps call sites terse (`<field.TextField label=... />`).
Kin's is a plain prop: resolve the field, pass the `FieldApi` down, no context
and no registration.

### Nested group field

A reusable component for a nested object (an address, reused for shipping and
billing):

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
// `withFieldGroup` is returned by `createFormHook()`, alongside the `useAppForm`
// from the leaf field above.
type Address = { line1: string; city: string };

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

|                                 | Kin Form                                                        | TanStack Form                                                                                              |
| ------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Reusable-group primitive        | Same `FieldApi<Address, TParent>` as any field, passed as `api` | `withFieldGroup({ defaultValues, render })`, a distinct HOC separate from `withForm` and from `form.Field` |
| Binding the group to a location | `form.field("shipping")`, a resolved child field                | `fields="shipping"` prop (a path string, a key-to-path map, or `createFieldMap`)                           |
| Building child paths            | `api.field("line1")`, relative, same call as a top-level field  | `group.AppField name="line1"`, relative names resolved through the `fields` mapping                        |
| The group's own value type      | `FieldApi<Address, TParent>`: `Address` is right there          | `defaultValues` on the HOC stands in for the shape (runtime-unused, type only)                             |
| Distinct concepts to learn      | One (`FieldApi`)                                                | `withFieldGroup`, `FieldGroupApi`, `group.AppField`, the `fields` mapping, `createFieldMap`                |

Kin reuses one concept: a group is a `FieldApi` whose value happens to be an
object, and `api.field("line1")` addresses into it exactly like a top-level
field. TanStack's reusable-group path is `withFieldGroup`, a higher-order
component with its own `group` object (`FieldGroupApi`, which is neither
`FormApi` nor `FieldApi`), bound to a spot in the form through a `fields` prop
that is a path string or an explicit key-to-path map. It is genuinely capable
(the `fields` map even lets a group's internal shape differ from the form's),
but it is another primitive with its own model.

### Array field

An array also needs stable item identity across a reorder, plus its own mutation
helpers:

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {4,11,13}
import { type FieldApi, useWatch } from "@kintools/form-react";

function ItemsField<TParent>(
  { api }: { api: FieldApi<string[], TParent> },
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

```tsx {14,24,25}
import { useForm } from "@tanstack/react-form";

function ItemsForm() {
  // TanStack keeps an array field inline in the form component; there is no
  // resolved-node prop to hand to a child, the way Kin passes a `FieldApi`.
  const form = useForm({
    defaultValues: { items: [] as string[] },
    onSubmit: ({ value }) => save(value),
  });

  return (
    <form.Field
      name="items"
      mode="array"
      validators={{
        onChange: ({ value }) =>
          value.length ? undefined : "Add at least one item",
      }}
    >
      {(field) => (
        <>
          {field.state.value.map((_, i) => (
            // No built-in stable id per row; index is the usual key.
            <div key={i}>
              <form.Field name={`items[${i}]`}>
                {(sub) => (
                  <TextInput
                    value={sub.state.value}
                    onChange={sub.handleChange}
                  />
                )}
              </form.Field>
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
          <button type="button" onClick={() => field.pushValue("")}>Add</button>
        </>
      )}
    </form.Field>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                                 | Kin Form                                                                           | TanStack Form                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| What holds the array            | `FieldApi` whose value is an array, the same node type as any field                | `<form.Field mode="array">`, a mode flag on the field component                                                    |
| Mutation helpers                | `api.pushItem`, `insertItem`, `removeItem`, `moveItem`, `swapItems`, `replaceItem` | `field.pushValue`, `insertValue`, `removeValue`, `moveValue`, `swapValues`, `replaceValue`                         |
| Array-level validation          | The field's own `validators`                                                       | `validators` on the array `form.Field`                                                                             |
| Stable item identity on reorder | `field.id` stays with the item as indices shift, so it works as a React `key`      | No built-in per-item id; key by index or derive your own                                                           |
| Reusable component              | Pass a resolved `FieldApi<string[], TParent>` down                                 | No resolved-node prop; the array field lives inline in the form component (or share the whole form via `withForm`) |

The mutation helpers line up almost one to one (`pushItem` / `pushValue`,
`moveItem` / `moveValue`). Two differences stand out. Kin's array is the same
`FieldApi` as everything else, so array-level validation is just `validators` on
that node, where TanStack switches the field into `mode="array"`. And Kin
re-keys child fields on every mutation so `field.id` is a stable React key
across a reorder, which TanStack does not provide; its docs key rows by index.

The Kin snippet is also a reusable `ItemsField` taking a resolved `FieldApi`,
the same pattern as the leaf and group fields above. TanStack's array docs keep
the field inline in the form component: there is no resolved array node to hand
down, only the whole `form`.

## Multistep forms

Neither ships an official multi-step or wizard component. Kin ships a dedicated
hook, [`useMultistep`](/form/guide/multistep). TanStack does not; its official
multi-step example hand-rolls step state.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {12-16,26-28}
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

|                          | Kin Form                                                                    | TanStack Form                                                                     |
| ------------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Dedicated wizard API     | `useMultistep` hook                                                         | None; hand-rolled with `useState` (the official example does this)                |
| Step-validation ceremony | `next()`: touch, wait for validation to settle, gate the advance            | `await form.validateField(name, "change")` per field in the step, checked by hand |
| Step ↔ field mapping     | Each step name is the `DeepKey` of that step's own `FieldApi` (`stepField`) | A field-name list you maintain per step (or a `FieldGroup` per step)              |
| Branching / redirecting  | `onBeforeNext` returns a step name to jump to                               | Custom `step` state logic                                                         |
| Unvalidated navigation   | `back()`, `jump(index or name)`                                             | Custom `setStep` calls                                                            |

Same as React Hook Form, neither has a wizard component, but Kin ships
`useMultistep` and TanStack does not. TanStack's
[Form Groups](https://tanstack.com/form/latest/docs/framework/react/guides/form-groups)
narrow the gap a little (a group per step, advancing on its `onGroupSubmit` when
the group validates), but there is no equivalent to `useMultistep`'s `next()`
doing touch, wait, and gate in one call, or `onBeforeNext` returning a step to
redirect to.
