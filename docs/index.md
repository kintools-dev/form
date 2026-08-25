---
layout: home
# Opts out of VPHomeContent's `.vp-doc` prose wrapper (link underlines,
# paragraph spacing, table display, etc.) — this page's markdown supplies
# all its own styling via style.css.
markdownStyles: false
---

<Home>

<Hero title="Kin Form" lede="Build your field components once. Reuse them everywhere." description="A framework-agnostic form state library for TypeScript.">
  <Button href="/form/guide/getting-started">Get Started</Button>
  <Button href="https://github.com/kintools-dev/form" variant="secondary" external>View on GitHub</Button>
</Hero>

<Section>
<SectionHeader>The payoff</SectionHeader>
<Lede>Forms read like composition, not wiring.</Lede>

<CodeGroup>

<CodeGroupItem label="React">

```tsx
<form onSubmit={form.handleSubmit}>
  <TextField api={form.field("email")} label="Email" />
  <AddressField api={form.field("shipping")} />
  <AddressField api={form.field("billing")} />
  <ItemsField api={form.field("items")} />
  <SubmitButton api={form}>Place order</SubmitButton>
</form>;
```

</CodeGroupItem>

<CodeGroupItem label="Lit">

```lit
html`
  <form @submit=${form.handleSubmit}>
    <text-field .api=${form.field("email")} label="Email"></text-field>
    <address-field .api=${form.field("shipping")}></address-field>
    <address-field .api=${form.field("billing")}></address-field>
    <items-field .api=${form.field("items")}></items-field>
    <submit-button .api=${form}>Place order</submit-button>
  </form>
`;
```

</CodeGroupItem>

</CodeGroup>

<Prose>Each component receives a resolved <code>FieldApi</code>, not a path or
form context. Define the UI and behavior once, then mount it anywhere its value
type fits. Kin Form keeps that component independently subscribed, so a change
only updates the part of the form that depends on it.</Prose>

<p><Cta href="/form/guide/form-composition">Build reusable field components →</Cta></p>
</Section>

<Section>
<SectionHeader>Why it exists</SectionHeader>
<Prose>Reusable field components <Cta href="/form/comparison/react-hook-form#nested-group-field">become awkward</Cta> when a library treats the form as the only stateful object and fields as proxies into it. Nested objects, arrays, and shared validation then need their own special mechanisms.</Prose>
<Prose>Kin Form treats a form as a tree where every node (leaf, group, or the form itself) is the same thing, with its own state, configuration, and subscribers. That is why one component pattern works at every level.</Prose>
<Prose>Nothing forces one shape on a given value. Same <code>\{ email, address: \{ line1, line2 \} \}</code>, three valid trees:</Prose>
<Grid cols={3} divided>

<div className="flex flex-col gap-3">
<TreeDiagram viewBox="0 0 232 100" titleId="tree-one-title" title="Form with two fields: email, and address as a single leaf.">
  <TreeEdge d="M60,50 H74 V30 H88" />
  <TreeEdge d="M60,50 H74 V70 H88" />
  <TreeNode x={6} y={39} width={54} height={22} label="form" labelX={33} labelY={50} />
  <TreeNode x={88} y={19} width={54} height={22} label="email" labelX={115} labelY={30} />
  <TreeNode x={88} y={59} width={54} height={22} label="address" labelX={115} labelY={70} />
</TreeDiagram>
<TreeCaption><strong>Leaf.</strong> Any path in the value shape can be treated as a single leaf field. Here, <code>address</code> is.</TreeCaption>
</div>

<div className="flex flex-col gap-3">
<TreeDiagram viewBox="0 0 232 100" titleId="tree-two-title" title="Form with three flat fields: email, address.line1, and address.line2, all direct children of the form.">
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
<TreeDiagram viewBox="0 0 232 100" titleId="tree-three-title" title="Form with email as a leaf and address as a group, with line1 and line2 registered underneath it.">
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

</Grid>
</Section>

<Section>
  <SectionHeader>What it does differently</SectionHeader>
  <Card>
  <Grid cols={2} divided>
    <Principle title="One state machine, not two">A nested group and a leaf field are the same class, not a special case bolted onto it.</Principle>
    <Principle title="Type-safe paths"><code>field("items.0.code")</code> type-checks against your value type, so a typo'd path is a compile error.</Principle>
    <Principle title="No special-case array API">Push, insert, move, swap, and remove live on the same class every field already has, not a separate <code>useFieldArray</code> hook.</Principle>
    <Principle title="Declarative cross-field rules">List <code>dependents</code> on a field to re-validate siblings, instead of wiring a manual subscription.</Principle>
    <Principle title="Selective re-rendering">A change propagates only to the nodes it affects, so each subscriber re-renders only when the field, or selected state, it's watching actually changed.</Principle>
    <Principle title="Composable fields">Your reusable <code>TextField</code>, <code>AddressField</code>, and <code>SubmitButton</code> each take a <code>FieldApi</code>, so they work the same way whether bound to a leaf, a subtree, or the whole form.</Principle>
  </Grid>
  </Card>
</Section>

<Section>
<SectionHeader>Is Kin Form a fit?</SectionHeader>
<Card>
<Grid cols={2}>
<div>
<Lede as="h3">Use it when forms become reusable UI</Lede>
<ul className="list-disc pl-5 [&>li+li]:mt-2">
  <li>You maintain field components across forms or apps</li>
  <li>Your forms have nested groups, dynamic arrays, or multiple steps</li>
  <li>You need stable array item identity and narrowly scoped re-renders</li>
  <li>You want typed field paths without a separate array API</li>
  <li>You need sync or async validation, scoped per field or subtree</li>
  <li>Field state must survive UI unmounts and remounts, such as rows in a virtual list</li>
</ul>
</div>
<div>
<Lede as="h3">Skip it when the simple thing is enough</Lede>
<ul className="list-disc pl-5 [&>li+li]:mt-2">
  <li>The form is a small, one-off contact or login form</li>
  <li>Component-local state is already simpler</li>
  <li>Your team has a form-library standard that is working well and no pain worth migrating for</li>
</ul>
</div>
</Grid>
</Card>
</Section>

<Section>
  <SectionHeader>How it compares</SectionHeader>
  <FeatureMatrix full />
  <Grid cols={2} className="mt-10">
    <Card>
      <BundleSizeChart title="Bundle size (React usage, gzip)" />
    </Card>
    <Card>
      <PerformanceHighlight title="Flat field update burst (800×)" />
    </Card>
  </Grid>
  <p className="mt-6">Full comparison, including where Kin Form isn't the right fit: <Cta href="/form/comparison/">see the details →</Cta></p>
</Section>

<Section>
  <SectionHeader>See it for yourself</SectionHeader>

<Lede step="01">A login form</Lede>

<CodeGroup>

<CodeGroupItem label="React">

```tsx {5,14,29}
import { useForm, Watch } from "@kintools/form-react";
import { required } from "@kintools/form-validators";

function LoginForm() {
  const form = useForm({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {/* Watch is great for one-off UI or prototyping. */}
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

<CodeGroupItem label="Lit">

```lit {8,20,31-32, 40}
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { FormApi, watch } from "@kintools/form-lit";
import { required } from "@kintools/form-validators";

@customElement("login-form")
class LoginForm extends LitElement {
  #form = new FormApi({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>

        <!-- watch is great for one-off UI or prototyping. -->
        <!-- Only re-render this part when the email field changes. -->
        ${watch(
          this.#form.field("email", { validators: required("Required") }),
          (field) => html`
            <label>
              Email
              <input
                .value=${field.value}
                @blur=${field.handleBlur}
                @input=${(e: Event) =>
                  field.handleChange((e.target as HTMLInputElement).value)}
              >
            </label>
            ${field.touched && field.error
              ? html`<span>${field.error}</span>`
              : ""}
          `,
        )}

        <!-- Only re-render this part when form.submitting flips. -->
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
<br/>
<Lede step="02">Reusable TextField</Lede>

<CodeGroup>

<CodeGroupItem label="React">

```tsx {5,14}
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

<CodeGroupItem label="Lit">

```lit {8,14}
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FieldApi, WatchController } from "@kintools/form-lit";

@customElement("text-field")
export class TextField extends LitElement {
  @property({ attribute: false })
  accessor api!: FieldApi<string, unknown>;

  @property()
  accessor label = "";

  // Re-renders when the api's state changes.
  #watch = new WatchController(this, () => this.api);

  override render() {
    const field = this.#watch.value;
    return html`
      <label>
        ${this.label}
        <input
          .value=${field.value}
          @blur=${field.handleBlur}
          @input=${(e: Event) =>
            field.handleChange((e.target as HTMLInputElement).value)}
        >
      </label>
      ${field.touched && field.invalid
        // Per-node validation and schema validation can co-exist.
        ? html`<span>${field.error ?? field.schemaError}</span>`
        : ""}
    `;
  }
}
```

</CodeGroupItem>

</CodeGroup>
<br/>
<Lede step="03">Reusable SubmitButton</Lede>

<CodeGroup>

<CodeGroupItem label="React">

```tsx {5,13}
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

<CodeGroupItem label="Lit">

```lit {8,11}
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FormApi, WatchController } from "@kintools/form-lit";

@customElement("submit-button")
export class SubmitButton extends LitElement {
  @property({ attribute: false })
  accessor api!: FormApi<unknown>; // Subclass of FieldApi.

  // Re-render only when submitting flips.
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
<br/>
<Lede step="04">Form with reusable components</Lede>

<CodeGroup>

<CodeGroupItem label="React">

```tsx {14-17,19}
import { useForm } from "@kintools/form-react";
import { required } from "@kintools/form-validators";
import { TextField } from "./TextField.tsx";
import { SubmitButton } from "./SubmitButton.tsx";

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

<CodeGroupItem label="Lit">

```lit {18-23,25}
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { FormApi } from "@kintools/form-lit";
import { required } from "@kintools/form-validators";
import "./text-field.ts";
import "./submit-button.ts";

@customElement("login-form")
class LoginForm extends LitElement {
  #form = new FormApi({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        <text-field
          .api=${this.#form.field("email", {
            validators: required("Required"),
          })}
          label="Email"
        ></text-field>

        <submit-button .api=${this.#form}>Log in</submit-button>
      </form>
    `;
  }
}
```

</CodeGroupItem>

</CodeGroup>

</Section>

</Home>
