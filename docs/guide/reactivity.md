---
description: "How Kin Form's pub/sub model works under the hood (subscribe/notify, batched notifications) and how to subscribe from React (useWatch, Watch) or Lit (watch, WatchController), including narrowing re-renders with select."
---

# Reactivity

Every node in the tree (field, group, or form) is a pub/sub primitive under the
hood: `subscribe(cb)` registers a callback, and any state change (`value`,
`error`, `touched`, `validating`, ...) calls `notify()`, invoking every
subscriber.

```ts
const unsubscribe = field.subscribe(() => {
  console.log(field.name, field.value);
});

// Later, when no longer needed:
unsubscribe();
```

<Container type="info">

Registering or unregistering a child field doesn't notify through this channel;
that's `onChildrenChanged`, meant for introspection tooling like devtools.

</Container>

## Batching

A single logical change can touch more than one node: setting a field's `value`
also updates the parent group's aggregate state. These are coalesced: within one
synchronous operation, each affected node notifies its subscribers **once**, not
once per intermediate mutation. Batching is scoped per tree, so mutating two
unrelated forms in the same call never coalesces one form's notifications with
the other's.

Call `batch` on any node in the tree: it always coalesces across the whole tree,
not just the node you called it on. For example, updating two sub-paths of
`form.value` directly with `setIn`:

```ts
let notifications = 0;
form.subscribe(() => ++notifications);

form.batch(() => {
  form.field("email").value = "";
  form.field("password").value = "";
});

console.log(notifications); // 1, not 2.
```

Without `batch`, the same two assignments would notify `form`'s subscribers
twice, once per `value` set.

## Subscribing from your UI layer

<FrameworkText>
<FrameworkSlot name="react">

`useWatch` (or `Watch`, its render-prop form) subscribes the calling component
via `useSyncExternalStore`, re-rendering on every notify by default:

</FrameworkSlot>
<FrameworkSlot name="lit">

`watch` (a directive, for one-off use inline in a template) or `WatchController`
(a `ReactiveController`, for a whole component's `render()`) subscribes to
`api`, requesting an update on every notify by default:

</FrameworkSlot>
</FrameworkText>

<CodeGroup>

<CodeGroupItem label="React">

```tsx
const field = useWatch(parent.field("email"));
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
#watch = new WatchController(this, () => parent.field("email"));

override render() {
  const field = this.#watch.value;
  // ...
}
```

</CodeGroupItem>

</CodeGroup>

### Don't subscribe in the component that owns the form

<FrameworkText>
<FrameworkSlot name="react">

`useForm` deliberately doesn't subscribe the calling component (see
[Basic](/form/guide/basic)) so that typing into one field doesn't re-render the
whole form. Calling `useWatch` in that same component undoes that: the component
now re-renders on every notify anyway, just like it would if `useForm`
subscribed by itself. If you catch yourself reaching for `useWatch` right next
to a `useForm` call, extract that `useWatch` call and the UI it drives into
their own component (`TextField`, `SubmitButton`, ...), and pass the
already-resolved `FieldApi`/`FormApi` down as a prop instead.

</FrameworkSlot>
<FrameworkSlot name="lit">

Don't create a `FormApi` and a `WatchController` in the same component: the
`WatchController` requests an update on every notify, so the whole form
re-renders on every change. Extract that `WatchController` and the UI it drives
into their own custom element (`text-field`, `submit-button`, ...), and pass the
already-resolved `FieldApi`/`FormApi` down as a property instead.

</FrameworkSlot>
</FrameworkText>

### Narrowing what runs

Pass `select` to re-render only when the properties you actually read change:

<CodeGroup>

<CodeGroupItem label="React">

```tsx
const [value, invalid, touched] = useWatch(
  parent.field("email"),
  (f) => [f.value, f.invalid, f.touched] as const,
);
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
#watch = new WatchController(
  this,
  () => parent.field("email"),
  (f) => [f.value, f.invalid, f.touched] as const,
);

// this.#watch.value is [value, invalid, touched]
```

</CodeGroupItem>

</CodeGroup>

`select`'s result is compared shallowly by default (own keys for a record,
index-by-index for an array/tuple), so returning a fresh literal like the tuple
above doesn't force a re-render on every notify.

### Selecting a derived value

<FrameworkText>
<FrameworkSlot name="react">

`Watch` is a general-purpose subscription component for any already-resolved
`FieldApi`/`FormApi`, without writing a custom component around `useWatch`.
`children` always receives the field/form as its first argument; pass `select`
to narrow the subscription to a selected value, passed as `children`'s second
argument.

</FrameworkSlot>
<FrameworkSlot name="lit">

`watch` is a general-purpose subscription directive for any already-resolved
`FieldApi`/`FormApi`, for one-off use inline in a template without writing a
custom component. `render` always receives the field/form as its first argument;
pass `select` between `api` and `render` to narrow the subscription to a
selected value, passed as `render`'s second argument.

</FrameworkSlot>
</FrameworkText>

<CodeGroup>

<CodeGroupItem label="React">

```tsx
// Re-render only when `submitting || !dirty` changes.
<Watch api={form} select={(f) => f.submitting || !f.dirty}>
  {(form, disabled) => (
    <button type="submit" disabled={disabled}>
      Save
    </button>
  )}
</Watch>

// Re-render only when the selected value changes.
<Watch api={itemsGroup} select={(g) => g.value.length}>
  {(_group, count) => <span>{count} items</span>}
</Watch>
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
// Re-render only when `submitting || !dirty` changes.
watch(
  form,
  (f) => f.submitting || !f.dirty,
  (_form, disabled) =>
    html`
      <button type="submit" ?disabled=${disabled}>Save</button>
    `,
);

// Re-render only when the selected value changes.
watch(
  itemsGroup,
  (g) => g.value.length,
  (_group, count) => html`<span>${count} items</span>`,
);
```

</CodeGroupItem>

</CodeGroup>

<FrameworkText>
<FrameworkSlot name="react">

`useWatch` is the hook `Watch` is built on — use it directly to build reusable
components such as `TextField`, `AddressField`, `SubmitButton`, and so on.

</FrameworkSlot>
<FrameworkSlot name="lit">

`WatchController` is the reusable-component equivalent of `watch` — use it
directly to build reusable components such as `TextField`, `AddressField`,
`SubmitButton`, and so on.

</FrameworkSlot>
</FrameworkText>

## What's next

- [Listeners](/form/guide/listeners) — `onValueChanged`, the value-specific case
  built on top of this
