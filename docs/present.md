---
layout: false
title: Kin Form — Presentation
description: Kin Form, one section per screen.
head:
  - - meta
    - name: robots
      content: noindex
---

<a class="present-exit" href="/form/" title="Exit presentation">✕</a>

<div class="home present">

<section class="hero">
  <h1 class="section-header">Kin Form</h1>
  <Lede>Build your field components once. Reuse them everywhere.</Lede>
  <div class="actions">
    <a class="btn-primary" href="/form/guide/getting-started">Get Started</a>
    <a class="btn-secondary" href="https://github.com/kintools-dev/form">View on GitHub</a>
  </div>
  <p class="present-byline">Man Hoang (Kin)</p>
</section>

<section class="reuse">
<h2 class="section-header">The payoff</h2>
<Lede>Forms read like composition, not wiring.</Lede>

```tsx
<form onSubmit={form.handleSubmit}>
  <TextField api={form.field("email")} label="Email" />
  <AddressField api={form.field("shipping")} />
  <AddressField api={form.field("billing")} />
  <ItemsField api={form.field("items")} />
  <SubmitButton api={form}>Place order</SubmitButton>
</form>;
```

<Prose>Each component receives a resolved <code>FieldApi</code>, not a path or
form context, so it mounts anywhere its value type fits and stays independently
subscribed.</Prose>

<p class="reuse-cta"><a href="/form/guide/form-composition">Build reusable field components →</a></p>
</section>

<section class="why">
<h2 class="section-header">Why it exists</h2>
<Prose>Kin Form treats a form as a tree: every node (leaf, group, or the form itself) is the same thing.</Prose>
<Prose>Kin Form is flexible: same <code>\{ email, address: \{ line1, line2 \} \}</code>, three valid trees:</Prose>
<div class="why-trees">

<div className="flex flex-col gap-3">
<TreeDiagram viewBox="0 0 232 100" titleId="tree-one-title-p" title="Form with two fields: email, and address as a single leaf.">
  <TreeEdge d="M60,50 H74 V30 H88" />
  <TreeEdge d="M60,50 H74 V70 H88" />
  <TreeNode x={6} y={39} width={54} height={22} label="form" labelX={33} labelY={50} />
  <TreeNode x={88} y={19} width={54} height={22} label="email" labelX={115} labelY={30} />
  <TreeNode x={88} y={59} width={54} height={22} label="address" labelX={115} labelY={70} />
</TreeDiagram>
<TreeCaption><strong>Leaf.</strong> Any path in the value shape can be treated as a single leaf field. Here, <code>address</code> is.</TreeCaption>
</div>

<div className="flex flex-col gap-3">
<TreeDiagram viewBox="0 0 232 100" titleId="tree-two-title-p" title="Form with three flat fields: email, address.line1, and address.line2, all direct children of the form.">
  <TreeEdge d="M60,50 H74 V20 H88" />
  <TreeEdge d="M60,50 H74 V50 H88" />
  <TreeEdge d="M60,50 H74 V80 H88" />
  <TreeNode x={6} y={39} width={54} height={22} label="form" labelX={33} labelY={50} />
  <TreeNode x={88} y={9} width={54} height={22} label="email" labelX={115} labelY={20} />
  <TreeNode x={88} y={39} width={110} height={22} label="address.line1" labelX={143} labelY={50} />
  <TreeNode x={88} y={69} width={110} height={22} label="address.line2" labelX={143} labelY={80} />
</TreeDiagram>
<TreeCaption><strong>Flat.</strong> Every scalar is its own field, addressed by its full path.</TreeCaption>
</div>

<div className="flex flex-col gap-3">
<TreeDiagram viewBox="0 0 232 100" titleId="tree-three-title-p" title="Form with email as a leaf and address as a group, with line1 and line2 registered underneath it.">
  <TreeEdge d="M60,42 H74 V20 H88" />
  <TreeEdge d="M60,42 H74 V65 H88" />
  <TreeEdge d="M142,65 H156 V50 H170" />
  <TreeEdge d="M142,65 H156 V80 H170" />
  <TreeNode x={6} y={31} width={54} height={22} label="form" labelX={33} labelY={42} />
  <TreeNode x={88} y={9} width={54} height={22} label="email" labelX={115} labelY={20} />
  <TreeNode x={88} y={54} width={54} height={22} label="address" labelX={115} labelY={65} />
  <TreeNode x={170} y={39} width={54} height={22} label="line1" labelX={197} labelY={50} />
  <TreeNode x={170} y={69} width={54} height={22} label="line2" labelX={197} labelY={80} />
</TreeDiagram>
<TreeCaption><strong>Grouped.</strong> <code>address</code> becomes an intermediate node, with <code>line1</code>/<code>line2</code> registered underneath it.</TreeCaption>
</div>

</div>
</section>

<section class="system">
  <h2 class="section-header">What it does differently</h2>
  <div class="system-card principle-grid">
    <Principle title="One state machine, not two">A nested group and a leaf field are the same class, not a special case bolted onto it.</Principle>
    <Principle title="Type-safe paths"><code>field("items.0.code")</code> type-checks against your value type, so a typo'd path is a compile error.</Principle>
    <Principle title="No special-case array API">Push, insert, move, swap, and remove live on the same class every field already has, not a separate <code>useFieldArray</code> hook.</Principle>
    <Principle title="Declarative cross-field rules">List <code>dependents</code> on a field to re-validate siblings, instead of wiring a manual subscription.</Principle>
    <Principle title="Selective re-rendering">A change propagates only to the nodes it affects, so each subscriber re-renders only when the field, or selected state, it's watching actually changed.</Principle>
    <Principle title="Composable fields">Your reusable <code>TextField</code>, <code>AddressField</code>, and <code>SubmitButton</code> each take a <code>FieldApi</code>, so they work the same way whether bound to a leaf, a subtree, or the whole form.</Principle>
  </div>
</section>

<section class="fit">
<h2 class="section-header">Is Kin Form a fit?</h2>
<div class="fit-card">
<div>
<Lede as="h3">Use it when forms become reusable UI.</Lede>
<ul className="list-disc pl-5 [&>li+li]:mt-2">
  <li>You maintain field components across forms or apps.</li>
  <li>Your forms have nested groups, repeatable rows, or multiple steps.</li>
  <li>You need stable array item identity and narrowly scoped re-renders.</li>
  <li>Field state must survive UI unmounts and remounts, such as rows in a virtual list.</li>
  <li>You want typed field paths without a separate array API.</li>
  <li>You need sync or async validation, scoped per field or subtree.</li>
</ul>
</div>
<div>
<Lede as="h3">Skip it when the simple thing is enough.</Lede>
<ul className="list-disc pl-5 [&>li+li]:mt-2">
  <li>The form is a small, one-off contact or login form.</li>
  <li>Component-local state is already simpler.</li>
  <li>Your team has a form-library standard that is working well and no pain worth migrating for.</li>
</ul>
</div>
</div>
</section>

<section class="numbers">
  <h2 class="section-header">How it compares</h2>
  <FeatureMatrix full />
  <div class="numbers-grid">
    <div class="system-card">
      <BundleSizeChart title="Bundle size (React usage, gzip)" />
    </div>
    <div class="system-card">
      <PerformanceHighlight title="Flat field update burst (800×)" />
    </div>
  </div>
  <p className="pt-3">Full comparison, including where Kin Form isn't the right fit: <Cta href="/form/comparison/">see the details →</Cta></p>
</section>

<section class="demo">
  <h2 class="section-header">See it for yourself</h2>

<CodeGroup>

<CodeGroupItem label="1. Form with Watch">

```tsx {12-13,28-29}
import { useForm, Watch } from "@kintools/form-react";
import { required } from "@kintools/form-validators";

function LoginForm() {
  const form = useForm({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {/* Only re-render when the email field changes. */}
      <Watch api={form.field("email", { validators: required("Required") })}>
        {(field) => (
          <label>
            Email
            <input
              value={field.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.touched && field.error && <span>{field.error}</span>}
          </label>
        )}
      </Watch>

      {/* Only re-render when `form.submitting` flips. */}
      <Watch api={form} select={(f) => f.submitting}>
        {(_form, submitting) => (
          <button type="submit" disabled={submitting}>Log in</button>
        )}
      </Watch>
    </form>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="2. Reusable TextField">

```tsx {13}
import type { ReactNode } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

export type TextFieldProps<TParentValue> = {
  api: FieldApi<string, TParentValue>;
  label: string;
  type?: string;
};

export function TextField<TParentValue>(
  { api, label, type = "text" }: TextFieldProps<TParentValue>,
): ReactNode {
  // Re-renders when the api's state changes.
  const field = useWatch(api);

  return (
    <label>
      {label}
      <input
        type={type}
        value={field.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.touched && field.invalid && (
        // Per-node validation and schema validation can co-exist.
        <span>{field.error ?? field.schemaError}</span>
      )}
    </label>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="3. Reusable SubmitButton">

```tsx {12}
import type { ReactNode } from "react";
import { type FormApi, useWatch } from "@kintools/form-react";

export type SubmitButtonProps<TValue> = {
  api: FormApi<TValue>; // Subclass of FieldApi.
  children: ReactNode;
};

export function SubmitButton<TValue>(
  { api, children }: SubmitButtonProps<TValue>,
): ReactNode {
  // Re-render only when submitting flips.
  const submitting = useWatch(api, (f) => f.submitting);

  return (
    <button type="submit" disabled={submitting}>
      {children}
    </button>
  );
}
```

</CodeGroupItem>

<CodeGroupItem label="4. Form with reusable components">

```tsx {11-15}
import { required } from "@kintools/form-validators";

function LoginForm() {
  const form = useForm({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <TextField
        api={form.field("email", { validators: required("Required") })}
        label="Email"
      />
      <SubmitButton api={form}>Log in</SubmitButton>
    </form>
  );
}
```

</CodeGroupItem>

</CodeGroup>

</section>

</div>

<style scoped>
/* Turns the homepage's own section flow into one fullscreen slide per
   section, scroll-snapped, without redeclaring any of the typography,
   color, or spacing rules `style.css` already gives these same classes
   on the regular homepage. */
.present \{
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
\}

.present > section \{
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  overflow-y: auto;
  padding: 3rem 1rem 0;
\}
  .present > section:first-child \{
    justify-content: center;
  \}
  .present > section:last-child \{
    padding-top: 1rem;
  \}

.present-exit \{
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--code-bg);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1;
\}

.present-exit:hover \{
  color: var(--text);
  border-color: var(--text);
\}

.present-byline \{
  margin: 24px 0 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-muted);
\}
</style>
