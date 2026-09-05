---
description: "Why Kin Form treats every node in a form (leaf, nested group, or the form itself) as the same `FieldApi` class, decoupling a field's value type from its parent's shape so components like `TextField` reuse across forms, and how that compares to React Hook Form, Formik, and TanStack Form."
---

# Why Kin Form?

Kin Form starts from one premise: **a form is a tree, and every node in that
tree (leaf field, nested group, or the form itself) is the same kind of thing.**
Most form libraries make the form object the sole owner of state: register a
field and you get a proxy into that one store, not an object with its own
value/error/validators. Nested objects, dynamic arrays, and cross-field rules
end up routed through a second mechanism instead of being a plain field. Kin
Form builds on the tree idea directly instead.

## Build field components once, then reuse them

Kin Form is designed around reusable form UI, not one-off bindings. A
`TextField`, `AddressField`, `ItemsField`, or `SubmitButton` takes the resolved
`FieldApi` it needs and nothing else: no dotted path, form context, or bespoke
callback plumbing. The same component can render a field wherever its value type
fits, across forms and applications.

Because a leaf, a nested group, an array, and the form root share the same state
model, the component pattern never changes as a form grows. See
[Form Composition](/form/guide/form-composition) for the complete pattern.

That reuse crosses form boundaries, not just within one form's own subtree.
`FieldApi<TValue, TParentValue = never>` decouples a field's own value type from
its parent form's shape:

```ts
function TextField<TParentValue>(
  { api }: { api: FieldApi<string, TParentValue> },
) {
  // Only ever needs TValue to be `string`.
}
```

`TParentValue` is an opaque type parameter `TextField` never inspects, not the
whole form's value type, so the exact same `TextField` works unmodified across a
login form, a checkout form, and a settings form with completely unrelated
shapes, with no `any` and no per-form variant. A field type parameterized by the
whole form (React Hook Form, TanStack Form) can't be reused this way without
leaking generics through every component's signature or dropping to
loosely-typed props;
[see how the alternatives compare](#how-other-form-libraries-handle-this).

## One state machine, one shape

Every node (leaf input, nested object/array, or the form itself) is a
`FieldApi`: `value`, `error`, `touched`, `validating`, `dirty`, validators
(sync, async, and schema), plus a lazily-populated registry of its own child
fields. The root is a `FormApi`, a `FieldApi` subclass that adds submission and
reset logic on top; every other node is a plain `FieldApi`.

Whether an object/array-valued field is treated as one atomic leaf or decomposed
into children is up to you, not the engine.

That means the same mental model applies everywhere:

- Setting a node's `value` bubbles up into the parent's value.
- Setting a node's `value` cascades down into every registered child.
- `touched`/`invalid`/`validating` aggregate from children automatically: a node
  is `invalid` if it or any registered child is.
- Every node can be subscribed to independently. A node's own change never
  notifies unrelated siblings, and `react/`'s `useWatch`/`Watch` (or `lit/`'s
  `watch`/`WatchController`) add selector-based diffing on top, so a subscriber
  updates only when what it computes changes.

Nothing here is a separate array-field abstraction or a separate
whole-form-state abstraction. It's the same properties, all the way down.

### Type-safe paths, not string soup

```ts
const form = new FormApi({
  initialValue: {
    email: "",
    address: {
      line1: "",
    },
    items: [
      { id: 1 },
    ],
  },
});

form.field("email").value; // string
form.field("address.line1").value; // string
form.field("items.0.id").value; // number
```

`DeepKey<T>` computes every dot-joined path into `T` (through objects and arrays
alike) as a literal string union; `DeepValue<T, Key>` resolves the value type at
that path. A typo'd path is a compile error, not a silent `undefined` at
runtime: `field(name, options)` type-checks against your form's actual value
type, no manual generics needed.

### Validation that doesn't fight you

Kin Form supports flexible validation strategies: sync or async, per-node or
per-subtree.

- **`validators`**: plain sync functions on any node (field, group, or form):
  `(field) => result`, run in order immediately, no debounce; first truthy
  result wins.
- **`asyncValidator`**: a separate, singular option alongside `validators`, for
  a check that needs to hit a server. Debounced, and only fires once every
  `validators` entry already passes.
- **`schemaValidator`**: one schema (zod, valibot, ...) validating a whole
  subtree's value in one pass, instead of a rule per field. Runs alongside
  `validators`/`asyncValidator`, not instead of them.

Whichever combination is running:

- **Coalesced**: concurrent or redundant `validate()` calls join a single
  in-flight run instead of stacking up duplicate work.
- **Stale-safe**: if a newer run supersedes an older one, the older result is
  discarded when it resolves, so it can never clobber a fresher answer.

Cross-field rules are declarative, not manual subscriptions:

```ts
form.field("password", {
  dependents: ["confirmPassword"],
  validators: required("Password is required"),
});

form.field("confirmPassword", {
  validators: (f) =>
    f.value !== form.value.password ? "Passwords must match" : null,
});
```

Whenever `password` changes, `confirmPassword` re-validates automatically, with
no manual wiring and no re-render-everything.

### Stable array item identity

`pushItem`/`insertItem`/`moveItem`/`swapItems`/`removeItem` update the immutable
value and re-key the field registry together, so a field's identity follows its
item through a reorder, not whatever value now sits at its old index. Every
field also carries a stable `id`, independent of `name`, that survives the same
reorders. It's the right list key (`key={field.id}` in React, or `lit-html`'s
`repeat` directive keyed on `field.id` in Lit) instead of the index.

### Opt-in complexity

`@kintools/form-core` has no UI framework dependency: it's just the state
machine.

`@kintools/form-react` adds hooks and render-prop components on top;

`@kintools/form-lit` adds a `watch` directive and `ReactiveController`s.

`@kintools/form-validators` defines common per-node validators (`required`,
`minLength`, `maxLength`, `password`, ...) as well as a Standard Schema adapter
for zod, valibot, ...

## How other form libraries handle this

The tree model isn't the only way to build a form library, and each of the
alternatives below is a real, popular, well-built library. Here's specifically
where they diverge from the premise above.

### React Hook Form

- Arrays need a separate hook, `useFieldArray`: no group node for a nested
  object at all.
- Reusable group/array components need manual casts to stay type-safe: the
  compile-time path check doesn't survive a generic wrapper.
- No selective subscription: a component re-renders on any change to a
  field-state key it touches, not on whether the value it computes from those
  keys changed.
- Inefficient by design: dirty/subscriber bookkeeping runs across every
  registered field on every update, not just the one that changed, regardless of
  how many components actually re-render.
- Heavier: 13.7 KB gzip.

See [vs React Hook Form](/form/comparison/react-hook-form) for the full
comparison.

### Formik

- No type safety: `name` is a plain string with no compile-time path check, and
  neither a field's value nor a group/array's items are typed; a typo'd path
  fails silently at runtime instead of at compile time.
- Its Context re-renders every consumer on any change, by design.
- Heavier: 13.9 KB gzip.

### TanStack Form

- Validation is ceremony-heavy: named validator slots per event, and cross-field
  rules are awkward to wire up.
- Heaviest bundle of the three: 18.5 KB.
- The slowest of the three in Kin Form's own benchmark; see
  [the full numbers](/form/comparison/) before taking that at face value.

## What's next

- [Getting Started](/form/guide/getting-started) — install and build your first
  form
- [Concepts](/form/guide/concepts) — the tree model, shared state, and typed
  paths
- [Basic](/form/guide/basic) — building `TextField` from a one-off subscription,
  the pattern the rest of these guides lean on
- [Per-node Validation](/form/guide/per-node-validation) and
  [Schema Validation](/form/guide/schema-validation)
- [Nested Objects](/form/guide/nested-objects) and
  [Dynamic Arrays](/form/guide/dynamic-arrays)
- [Linked Fields](/form/guide/linked-fields) and
  [Listeners](/form/guide/listeners) — reacting to a value changing
