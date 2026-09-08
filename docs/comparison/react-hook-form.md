---
description: "A side-by-side code comparison of Kin Form against react-hook-form@7.81.0 across field binding, per-node validation and debouncing, schema validation, cross-field validation, dirty tracking, submission handling, async initial values, reactivity, form composition, and multistep forms."
---

# vs React Hook Form

React Hook Form is the most widely used of the three (by a wide and growing
margin), so it's the one worth the deepest comparison. This page works through
the same topics the [guide](/form/guide/) covers, one at a time, against
`react-hook-form@7.81.0`.

## Field registration & binding model

### Native input

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {15}
import { useForm, Watch } from "@kintools/form-react";
import { required } from "@kintools/form-validators";

type LoginValues = { email: string };

function LoginForm() {
  const form = useForm<LoginValues>({
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

<CodeGroupItem label="React Hook Form">

```tsx {15}
import { useForm } from "react-hook-form";

type LoginValues = { email: string };

function LoginForm() {
  const {
    register,
    handleSubmit,
    // Form-wide, not scoped to email; re-renders on any field's state change.
    formState: { errors },
  } = useForm<LoginValues>({ defaultValues: { email: "" } });

  return (
    <form onSubmit={handleSubmit(login)}>
      <input {...register("email", { required: "Required" })} />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit">Log in</button>
    </form>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                      | Kin Form                                    | React Hook Form                            |
| -------------------- | ------------------------------------------- | ------------------------------------------ |
| Binding model        | controlled (`value` / `handleChange`)       | uncontrolled (`register` + ref) by default |
| One-off native input | `<Watch>` render prop, more inline ceremony | `{...register(name)}`, one line            |

For a handful of native inputs each used once, `register` genuinely produces
less code. Kin Form's bet is the opposite: build the field components once (see
[Form composition](#form-composition)), and every call site collapses to one
line too, typed against the form's shape. That pays off across many forms or a
shared field library; for a single one-off form, `<Watch>` inline is fine.

This is the only section using a bare `<input>`/`register`, since wrapping one
in `Controller` just to force it controlled wouldn't prove anything. Everywhere
else, both sides bind to a controlled `<TextInput>` component, so
`Controller`/`useController` only shows up where it's actually earning its keep.

### Non-native input

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {14}
import { useForm, Watch } from "@kintools/form-react";
import { required } from "@kintools/form-validators";

type ProfileValues = { country: string };

function ProfileForm() {
  const form = useForm<ProfileValues>({
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

<CodeGroupItem label="React Hook Form">

```tsx {13-15}
import { Controller, useForm } from "react-hook-form";

type ProfileValues = { country: string };

function ProfileForm() {
  const { control, handleSubmit } = useForm<ProfileValues>({
    defaultValues: { country: "" },
  });

  return (
    <form onSubmit={handleSubmit(save)}>
      <Controller
        control={control}
        name="country"
        rules={{ required: "Required" }}
        render={({ field, fieldState }) => (
          <>
            <CountrySelect value={field.value} onChange={field.onChange} />
            {fieldState.error && <span>{fieldState.error.message}</span>}
          </>
        )}
      />

      <button type="submit">Save</button>
    </form>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                   | Kin Form                        | React Hook Form                        |
| ----------------- | ------------------------------- | -------------------------------------- |
| Non-native inputs | same `Watch` as any other field | needs `Controller`, a second primitive |

Nested groups and arrays are `FieldApi` nodes too, not a separate hook or a
special case; see [Array field](#array-field) and [Group field](#group-field)
under [Form composition](#form-composition) below for the full comparison, shown
as reusable components rather than inlined in one form.

## Reusable field component

Real forms bind through reusable field components, not a render prop re-inlined
at every call site. Every section below uses one `TextField` per library, built
once here.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {4,16-17,23}
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

<CodeGroupItem label="React Hook Form">

```tsx {11,24,30-32}
import { useController } from "react-hook-form";
import type {
  FieldPathByValue,
  FieldValues,
  UseControllerProps,
} from "react-hook-form";

function TextField<T extends FieldValues>(
  { label, ...controllerProps }:
    // FieldPathByValue<T, string>: every path whose value is a string.
    & UseControllerProps<T, FieldPathByValue<T, string>>
    & { label: string },
) {
  const { field, fieldState } = useController(controllerProps);

  return (
    <label>
      {label}
      <TextInput
        value={field.value}
        onBlur={field.onBlur}
        onChange={field.onChange}
      />
      {fieldState.invalid && <span>{fieldState.error?.message}</span>}
    </label>
  );
}

<TextField
  control={control}
  name="email"
  rules={{ required: "Required" }}
  label="Email"
/>;
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                   | Kin Form                            | React Hook Form                                          |
| ----------------- | ----------------------------------- | -------------------------------------------------------- |
| Prop bag          | `api: FieldApi<...>` prop           | `control` + `name` + rules (`UseControllerProps`)        |
| Type parameter    | `TParentValue`, inert               | `T extends FieldValues`, the whole form type             |
| Field-path typing | resolved once at `form.field(name)` | `FieldPath<T>` / `FieldPathByValue<T, V>`, per call site |

Both `TextField`s are generic and reused unchanged across forms. The difference
is that Kin Form's `TParentValue` carries no information (the component's real
contract is `FieldApi<TValue>`), while React Hook Form's `T` is the whole form
type: `name` is checked against it, nested paths need casts (see
[Group field](#group-field)), and `Control<any>` is the only way out of the
generic.

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

<CodeGroupItem label="React Hook Form">

```tsx {7,10-19}
import { useForm } from "react-hook-form";
import { useMemo } from "react";
import debounce from "lodash/debounce";

function SignupForm() {
  const { control } = useForm<{ username: string }>({
    mode: "onChange", // Form-wide; every field revalidates on every change.
  });

  // Hand-rolled; no built-in debounce.
  const debouncedCheck = useMemo(
    () =>
      debounce(
        async (value: string) =>
          (await checkUsernameTaken(value)) ? "Username taken" : true,
        300,
      ),
    [],
  );

  return (
    <TextField
      control={control}
      name="username"
      rules={{ validate: debouncedCheck }}
      label="Username"
    />
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                      | Kin Form                                                      | React Hook Form                            |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| When validation runs | sync `validators` on every change; `asyncValidator` debounced | form-wide `mode` / `reValidateMode`        |
| Debouncing           | `validationDebounceMs` (async only)                           | hand-rolled inside `validate`, no built-in |
| Rule composition     | `validators` array, first truthy wins                         | multiple rules via `register` options      |

When a field also falls under a [schema](#schema-validation), its per-node
message takes precedence: `field.error` shows that first and the field's schema
error only as a fallback.

## Schema validation

Both need a thin adapter from a separate package to plug a schema in:

- Kin Form: `toSchemaValidator()` from `@kintools/form-validators`
- React Hook Form: `standardSchemaResolver` from `@hookform/resolvers`

Both adapters can be used with any Standard Schema library: zod, valibot, ...

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {14}
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

<CodeGroupItem label="React Hook Form">

```tsx {14}
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
type Signup = z.infer<typeof signupSchema>;

function SignupForm() {
  const { control, handleSubmit } = useForm<Signup>({
    defaultValues: { email: "", password: "" },
    resolver: standardSchemaResolver(signupSchema),
  });

  // A `rules.validate` on these fields would silently never run; the
  // resolver has taken over.
  return (
    <form onSubmit={handleSubmit(signUp)}>
      <TextField control={control} name="email" label="Email" />
      <TextField control={control} name="password" label="Password" />
      <button type="submit">Sign up</button>
    </form>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                          | Kin Form                                             | React Hook Form                                          |
| ------------------------ | ---------------------------------------------------- | -------------------------------------------------------- |
| Schema scope             | any node (field, group, or form)                     | one `resolver`, whole form only                          |
| Schema + per-field rules | both run; per-node message wins in `error`           | `resolver` overrides `register`'s rules                  |
| Where schema issues land | `schemaErrorMap`, surfaced per-field through `error` | same `errors`; schema output replaces the per-field ones |

## Cross-field validation

Both support it, but from opposite ends of the relationship, and with different
amounts of wiring.

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

<CodeGroupItem label="React Hook Form">

```tsx {19-21,30-31}
function SignupForm() {
  const { control, trigger, getValues } = useForm<Signup>({
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  return (
    <>
      {
        /* The source field can't hide behind `TextField`: it needs a manual
          refire in its own `onChange`. */
      }
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextInput
            type="password"
            value={field.value}
            onChange={(value) => {
              field.onChange(value);
              trigger("confirmPassword");
            }}
          />
        )}
      />
      <TextField
        control={control}
        name="confirmPassword"
        rules={{
          validate: (value) =>
            value === getValues("password") || "Passwords must match",
        }}
        label="Confirm password"
      />
    </>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                     | Kin Form                                      | React Hook Form                                            |
| ------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| Where it's declared | declarative, `dependents` on the source field | manual `trigger()` on the source field                     |
| Wiring              | nothing extra                                 | `getValues()` to read, `trigger()` in `onChange` to refire |
| Multiple dependents | one `dependents` array covers all             | one `trigger()` call per dependent, by hand                |

## Dirty tracking & reset

Both track dirtiness at both levels (whole form and per field), but differently.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {14,20}
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
            {/* Field level dirty */}
            {field.dirty && <span>Edited</span>}
          </>
        )}
      </Watch>

      {/* Form level dirty */}
      <Watch api={form} select={(f) => f.dirty}>
        {(f, dirty) => (
          <button disabled={!dirty} onClick={f.reset}>
            Discard changes
          </button>
        )}
      </Watch>
    </form>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="React Hook Form">

```tsx {6,20-25}
function ProfileForm() {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm({
    defaultValues: { firstName: "", lastName: "" },
  });

  return (
    <form onSubmit={handleSubmit(save)}>
      <Controller
        control={control}
        name="firstName"
        render={({ field }) => (
          <TextInput value={field.value} onChange={field.onChange} />
        )}
      />
      {
        /* Looks scoped to firstName, but the subscription (established when
          dirtyFields was pulled off formState above) is to the whole object:
          this re-renders when ANY field becomes dirty, not just firstName. */
      }
      {dirtyFields.firstName && <span>Edited</span>}

      <button disabled={!isDirty} onClick={reset}>
        Discard changes
      </button>
    </form>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                  | Kin Form                                 | React Hook Form                                                                    |
| ---------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| Whole-form dirty | `form.dirty`                             | `formState.isDirty`                                                                |
| Per-field dirty  | `field.dirty`                            | `formState.dirtyFields`; reading `.firstName` still subscribes to the whole object |
| Reset            | `form.reset(value?)`, moves the baseline | `reset(values?, keepStateOptions)`                                                 |
| Reset one field  | `form.resetField(name, value?)`          | `resetField(name, options?)`                                                       |

## Submission handling

Both separate "the form failed validation" from "submission itself succeeded,"
but only one also separates "submission itself failed."

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
    form.touched = true; // reveal errors on never-blurred fields
  },
  onSubmitError: (form, error) => {
    toast.error("Sign up failed"); // called automatically, no wrapper needed
  },
});

// handleSubmit itself calls preventDefault when given an event.
<form onSubmit={form.handleSubmit}>
```

</CodeGroupItem>

<CodeGroupItem label="React Hook Form">

```tsx {9-12}
const { handleSubmit } = useForm<Signup>({
  defaultValues: { email: "", password: "" },
});

<form onSubmit={handleSubmit(
  async (values) => {
    try {
      await signUp(values);
    } catch {
      // Must be wrapped manually; no dedicated "submission failed" callback.
      toast.error("Sign up failed");
    }
  },
  (errors) => {
    // Validation failed.
  },
)}>
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                          | Kin Form                                                | React Hook Form                               |
| ------------------------ | ------------------------------------------------------- | --------------------------------------------- |
| Validation failed        | `onSubmitInvalid`                                       | `onInvalid`, the 2nd arg to `handleSubmit`    |
| `onSubmit` itself throws | `onSubmitError`, automatic                              | rethrown after state update; no callback      |
| Binding to `<form>`      | `onSubmit={form.handleSubmit}`                          | `onSubmit={handleSubmit(onValid, onInvalid)}` |
| Preventing page reload   | automatic; event arg optional (works from RN `onPress`) | automatic, inside `handleSubmit`              |

## Async initial values

React Hook Form accepts an async function for `defaultValues` and exposes its
pending state as `formState.isLoading`. Kin Form takes only a synchronous
`initialValue`, by design: fetching data is the app's job, and apps do it in
different ways (a query hook, a router loader, a server component, a plain
`fetch`). The form only needs the value once it exists, so the usual pattern is
to keep it unmounted until then.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {7-8}
function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  if (isLoading) return <p>Loading...</p>;
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

<CodeGroupItem label="React Hook Form">

```tsx {3}
function ProfilePage() {
  const { register, handleSubmit, formState: { isLoading } } = useForm({
    defaultValues: fetchProfile, // resolved automatically
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit(save)}>
      {/* ... */}
    </form>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

## Reactivity & selective re-rendering

**Kin Form**: `FieldApi` carries its own state (`value`, `error`, `touched`,
`dirty`, ...) all on the same object, so `useWatch`, via `select`, subscribes to
any of it, or several pieces together, in one call.

**React Hook Form** splits _value_ from the rest of a field's state into
separate hooks instead: `useWatch` only watches values, so reading a field's
error or touched status means also subscribing to `useFormState`.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {6-9}
import { type FieldApi, useWatch } from "@kintools/form-react";

function Field<TParentValue>({ api }: { api: FieldApi<string, TParentValue> }) {
  // One hook covers all field state (including value).
  // An optional selector can be provided for selective re-rendering.
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

<CodeGroupItem label="React Hook Form">

```tsx {8-9,12-14}
import { useFormState, useWatch } from "react-hook-form";
import type { FieldValues, UseControllerProps } from "react-hook-form";

function Field<T extends FieldValues>(
  { control, name }: UseControllerProps<T>,
) {
  // Value and other field state are two separate subscriptions.
  const value = useWatch({ control, name });
  const { errors, touchedFields } = useFormState({ control, name });

  // Casts needed: T is generic, so `name` can't be narrowed to a literal key.
  const touched = (touchedFields as Record<string, boolean>)[name];
  const error = touched &&
    (errors as Record<string, { message?: string }>)[name]?.message;

  return (
    <label>
      <input value={value} />
      {error && <span>{error}</span>}
    </label>
  );
}

<Field control={control} name="email" />;
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                      | Kin Form                                | React Hook Form                                     |
| -------------------- | --------------------------------------- | --------------------------------------------------- |
| Default subscription | `useWatch(api)`, per field/form         | `useWatch({ control, name })`, per value            |
| Deriving a value     | `select: (f) => ...`, shallow-deduped   | `compute: (value) => ...`, deep-deduped, value only |
| Value vs field state | one `useWatch(api, select)` covers both | `useWatch` + `useFormState`, combined by hand       |

## Form composition

[`TextField`](#reusable-field-component) above is the leaf case. Groups and
arrays add more: a group needs child-path addressing, an array also needs stable
item identity across a reorder. In Kin Form, each stays one typed prop. In React
Hook Form, each needs `Control<TFieldValues>` threaded through, plus a
path-prefix convention and casts.

React Hook Form also has an official addon for this gap,
[`@hookform/lenses`](https://github.com/react-hook-form/lenses). A
`Lens<TValue>` prop looks like `FieldApi<TValue, TParentValue>` on the surface,
but it's another abstraction layer wrapping the same `register`/`useController`/
`useFieldArray` underneath, not a change to them. The comparison below is
against core React Hook Form, without this addon.

### Group field

A reusable component for a nested object (e.g. an address, reused for both
shipping and billing):

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

<CodeGroupItem label="React Hook Form">

```tsx {10,18,23}
import type {
  FieldPathByValue,
  FieldValues,
  UseControllerProps,
} from "react-hook-form";

type Address = { line1: string; city: string };

function AddressField<T extends FieldValues>(
  { control, name }: UseControllerProps<T, FieldPathByValue<T, Address>>,
) {
  return (
    <fieldset>
      <TextField
        control={control}
        // Cast needed: TypeScript can't prove a concatenated string is
        // a member of FieldPathByValue<T, string>.
        name={`${name}.line1` as FieldPathByValue<T, string>}
        label="Line 1"
      />
      <TextField
        control={control}
        name={`${name}.city` as FieldPathByValue<T, string>}
        label="City"
      />
    </fieldset>
  );
}

<AddressField control={control} name="shipping" />
<AddressField control={control} name="billing" />
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                              | Kin Form                                                        | React Hook Form                                             |
| ---------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| Reusable nested-group prop   | resolved `api: FieldApi<Address, TParentValue>`, like any field | `control` + `name`, a path prefix                           |
| Type-safety at the call site | automatic from `FieldApi<Address, TParentValue>`                | `FieldPathByValue<T, Address>`, a rarely-used escape hatch  |
| Building child paths         | `api.field("line1")`, relative                                  | template-string concat (`` `${name}.line1` ``)              |
| Type-safety on children      | via `DeepKey<Address>`, no cast                                 | needs a cast; TS can't prove the concatenated path is valid |

### Array field

An array (unlike the [group above](#group-field)) also needs stable item
identity across a reorder, plus its own mutation helpers:

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {4,11,13}
import { type FieldApi, useForm, useWatch } from "@kintools/form-react";

function ItemsField<TParentValue>(
  { api }: { api: FieldApi<string[], TParentValue> },
) {
  const value = useWatch(api, (f) => f.value);

  return (
    <>
      {value.map((_, i) => {
        const field = api.field(`${i}`);
        return (
          <div key={field.id}>
            <TextInput
              value={field.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
            />
            <button
              disabled={i === 0}
              onClick={() => api.moveItem("", i, i - 1)}
            >
              Move up
            </button>
            <button
              disabled={i === value.length - 1}
              onClick={() => api.moveItem("", i, i + 1)}
            >
              Move down
            </button>
            <button onClick={() => api.removeItem("", i)}>Remove</button>
          </div>
        );
      })}
      {api.error && <span>{api.error}</span>}
      <button onClick={() => api.pushItem("", "")}>Add</button>
    </>
  );
}

function Form() {
  const form = useForm<{ items: string[] }>({
    initialValue: { items: [] },
  });

  <ItemsField
    api={form.field("items", {
      validators: (g) => (g.value.length > 0 ? null : "Add at least one item"),
    })}
  />;
}
```

</CodeGroupItem>

<CodeGroupItem label="React Hook Form">

```tsx {20-21,32,35-38}
import {
  Controller,
  useFieldArray,
  useForm,
  useFormState,
} from "react-hook-form";
import type {
  FieldArrayPath,
  FieldPathByValue,
  FieldValues,
  Path,
  UseFieldArrayProps,
} from "react-hook-form";

function ItemsField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues> & FieldArrayPath<TFieldValues>,
>(props: UseFieldArrayProps<TFieldValues, TName>) {
  // Two separate hooks for logic and state.
  const { fields, append, move, remove } = useFieldArray(props);
  const { errors } = useFormState(props);

  // Cast needed: TName is generic, so it can't be narrowed to a literal key.
  const rootError = errors[props.name]?.root as
    | { message?: string }
    | undefined;

  return (
    <>
      {fields.map((f, i) => (
        <div key={f.id}>
          <Controller
            control={props.control}
            // Cast needed, for the same reason as AddressField's children.
            name={`${props.name}.${i}.value` as FieldPathByValue<
              TFieldValues,
              string
            >}
            render={({ field }) => (
              <TextInput
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
              />
            )}
          />
          <button disabled={i === 0} onClick={() => move(i, i - 1)}>
            Move up
          </button>
          <button
            disabled={i === fields.length - 1}
            onClick={() => move(i, i + 1)}
          >
            Move down
          </button>
          <button onClick={() => remove(i)}>Remove</button>
        </div>
      ))}
      {rootError?.message && <span>{rootError.message}</span>}
      <button onClick={() => append({ value: "" } as never)}>Add</button>
    </>
  );
}

function Form() {
  const { control } = useForm<{ items: { value: string }[] }>({
    defaultValues: { items: [] },
  });

  <ItemsField
    control={control}
    name="items"
    rules={{
      validate: (value) => value.length > 0 || "Add at least one item",
    }}
  />;
}
```

</CodeGroupItem>

</CodeGroup>

</SideBySide>

**What's different:**

|                          | Kin Form                          | React Hook Form                                     |
| ------------------------ | --------------------------------- | --------------------------------------------------- |
| What holds the array     | `FieldApi`; the array _is_ a node | `useFieldArray` for logic, `useFormState` for state |
| Array-level validation   | the field's own `validators`      | `useFieldArray`'s own `rules`, a separate API       |
| Item identity on reorder | follows the item via re-keying    | `fields[i].id` from the hook                        |
| Per-item input binding   | `api.field(i).value`, read inline | a `<Controller>` boundary per input                 |
| Reusable component       | pass a resolved `FieldApi` down   | pass `control` + `name` down (or `useFormContext`)  |
| Type-safety              | `DeepKey<T>` needs no cast        | casts needed; `TFieldValues` / `TName` are generic  |

Both item UIs are inlined here.

**Kin Form**: a bare `<TextInput>` works because the row just reads
`field.value` and calls stable methods, no subscription of its own; the parent's
`useWatch` re-renders the list. If a row needs its own reactivity, swap in the
reusable [`<TextField>`](#reusable-field-component) (it subscribes to `api`
internally). A dedicated component is only needed to render something custom.

**React Hook Form**: each input needs its own `<Controller>` render prop (or
`register`, uncontrolled), there's no inline read of a field's value. Only the
hook form, `useController`, forces a separate component.

## Multistep forms

Neither ships an official multi-step/wizard _component_. Kin Form ships a
dedicated hook instead, [`useMultistep`](/form/guide/multistep); React Hook
Form's docs demonstrate the hand-rolled version.

<SideBySide>

<CodeGroup>

<CodeGroupItem label="Kin Form">

```tsx {16-20,30-31,35}
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

  // `stepField` is the FieldApi for the current step.
  // `next` checks if the current step is valid before advancing.
  const { stepName, stepField, isLastStep, next } = useMultistep(
    form,
    // Step names, matching form's value shape.
    ["credentials", "address"] as const,
  );

  return (
    <form onSubmit={form.handleSubmit}>
      {stepName === "credentials" && (
        <>
          {
            /* Field names are relative to the current step,
           so it's easy to extract a step's UI into a reusable component. */
          }
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

<CodeGroupItem label="React Hook Form">

```tsx {10-13,23,27,38,43,51-53}
import { useState } from "react";
import { useForm } from "react-hook-form";

type Signup = {
  credentials: { email: string; password: string };
  address: { line1: string };
};

// Must list all fields of each step.
const stepFields = [
  ["credentials.email", "credentials.password"],
  ["address.line1"],
] as const;

function SignupWizard() {
  const { control, trigger, handleSubmit } = useForm<Signup>({
    defaultValues: {
      credentials: { email: "", password: "" },
      address: { line1: "" },
    },
  });
  const [step, setStep] = useState(0);
  const isLastStep = step === stepFields.length - 1;

  const next = async () => {
    // Manually validate this step's fields.
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  };

  return (
    <form onSubmit={handleSubmit(signUp)}>
      {step === 0 && (
        <>
          <TextField
            control={control}
            {/* Field names are absolute. */}
            name="credentials.email"
            label="Email"
          />
          <TextField
            control={control}
            name="credentials.password"
            label="Password"
          />
        </>
      )}
      {step === 1 && (
        <TextField control={control} name="address.line1" label="Line 1" />
      )}
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

|                          | Kin Form                                 | React Hook Form                                |
| ------------------------ | ---------------------------------------- | ---------------------------------------------- |
| Step-validation ceremony | `next()`: touch, wait, gate, built in    | hand-rolled per wizard (`trigger([...names])`) |
| Step to field mapping    | each step _is_ a `FieldApi`              | a field-name list you maintain per step        |
| Branching / redirecting  | `onBeforeNext` returns a step to jump to | custom `step` state logic                      |
