import type { ReactNode } from "react";
import { useForm } from "@kintools/form-react";
import { useFormDevtools } from "@kintools/form-devtools-react";
import { email, required } from "@kintools/form-validators";

import { CheckboxField } from "./components/CheckboxField.tsx";
import { SelectField } from "./components/SelectField.tsx";
import { SubmitButton } from "./components/SubmitButton.tsx";
import { TextField } from "./components/TextField.tsx";
import { SelectItem } from "./components/ui/select.tsx";

export default function App(): ReactNode {
  const form = useForm({
    initialValue: { email: "", role: "", bio: "", acceptTerms: false },
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert(`Account created for ${form.value.email}`);
    },
  });

  useFormDevtools(form);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Kin Form &times; shadcn/ui
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kin Form state, shadcn/ui components, and no adapter in between. Every
          wrapper takes an already-resolved <code>api</code>.
        </p>
      </header>

      <form
        className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm"
        onSubmit={form.handleSubmit}
        noValidate
      >
        <div className="grid gap-4">
          <TextField
            api={form.field("email", {
              validators: [
                required("Email is required"),
                email("Enter a valid email address"),
              ],
            })}
            type="email"
            label="Email"
            autoComplete="email"
            placeholder="you@example.com"
          />

          <SelectField
            api={form.field("role", { validators: required("Pick a role") })}
            label="Role"
            placeholder="Select a role"
          >
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectField>

          <TextField
            api={form.field("bio")}
            label="Short bio"
            multiline
            placeholder="Optional"
          />

          <CheckboxField
            api={form.field("acceptTerms", {
              validators: (f) => (f.value ? null : "You must accept the terms"),
            })}
            label="I accept the terms of service"
          />

          <SubmitButton
            api={form}
            className="mt-2 w-full"
            pendingLabel="Creating…"
          >
            Create account
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
