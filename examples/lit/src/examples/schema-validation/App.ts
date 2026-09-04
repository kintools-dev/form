import { html } from "lit";
import { FormApi } from "@kintools/form-lit";
import { toSchemaValidator } from "@kintools/form-validators";
import { z } from "zod";
import "./components/SubmitButton.ts";
import "./components/TextField.ts";

type Signup = {
  email: string;
  password: string;
  confirmPassword: string;
};

// One Zod schema validates the whole group at once via `toSchemaValidator()`,
// including `refine`'s password/confirmPassword comparison, which no single
// field's own validators could express. Per-node validators (`required`,
// `email`, ...) can still be layered on top of a schema validator for
// anything the schema doesn't cover; this example just keeps everything in
// the schema so the two aren't interleaved.
const signupSchema = z
  .object({
    email: z.email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function App(): unknown {
  const form = new FormApi<Signup>({
    initialValue: { email: "", password: "", confirmPassword: "" },
    schemaValidator: toSchemaValidator(signupSchema),
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert(`Welcome, ${form.value.email}!`);
    },
  });

  return html`
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 class="text-xl font-semibold text-gray-900">Create account</h1>
      <p class="mt-1 text-sm text-gray-500">
        Every field is validated by one Zod schema via
        <code>toSchemaValidator()</code>, including
        <code>confirmPassword</code>'s cross-field <code>refine()</code>
        check. Per-node validators can still be layered on top for anything a
        schema alone can't cover.
      </p>

      <form class="mt-6 space-y-4" @submit=${form.handleSubmit} novalidate>
        <schema-validation-text-field
          .api=${form.field("email")}
          type="email"
          label="Email"
          required
          autocomplete="email"
        ></schema-validation-text-field>
        <schema-validation-text-field
          .api=${form.field("password")}
          type="password"
          label="Password"
          required
          autocomplete="new-password"
        ></schema-validation-text-field>
        <schema-validation-text-field
          .api=${form.field("confirmPassword")}
          type="password"
          label="Confirm password"
          required
          autocomplete="new-password"
        ></schema-validation-text-field>

        <schema-validation-submit-button
          .api=${form}
          button-class="w-full"
          pending-label="Creating…"
          label="Create account"
        ></schema-validation-submit-button>
      </form>
    </div>
  `;
}
