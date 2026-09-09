import { useForm, Watch } from "@kintools/form-react";
import { useFormDevtools } from "@kintools/form-devtools-react";
import { email, minLength, required } from "@kintools/form-validators";
import { SubmitButton } from "./components/SubmitButton.tsx";
import { TextField } from "./components/TextField.tsx";

type Signup = { email: string; password: string };

type SignupResult =
  | { ok: true }
  | { ok: false; errors: Partial<Record<"" | keyof Signup, string>> };

// Stands in for a POST to a real endpoint. Whatever the client can't know
// (is this email taken? is this password in a breach list?) is decided here
// and comes back as a flat path -> message map: the shape `form.setErrors`
// takes, and the same shape a whole-form schema would produce.
async function signUp(value: Signup): Promise<SignupResult> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  const errors: Partial<Record<"" | keyof Signup, string>> = {};
  if (value.email === "taken@example.com") {
    errors.email = "That email is already registered";
  }
  if (value.password === "password1") {
    errors[""] = "That password has appeared in a data breach; pick another";
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true };
}

export default function App() {
  const form = useForm<Signup>({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => {
      const res = await signUp(form.value);
      if (!res.ok) {
        // One call for the whole map. Each message lands on its field (and
        // marks it touched); the `""` entry lands on the form itself; every
        // one clears again the moment that field's value changes.
        form.setErrors(res.errors);
        return;
      }
      alert(`Welcome, ${form.value.email}!`);
    },
  });

  useFormDevtools(form);

  return (
    <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
      <p className="mt-2 text-sm text-gray-500">
        Submitting <code>taken@example.com</code>{" "}
        fails on the email field; the password <code>password1</code>{" "}
        fails at the form level. Both come back from the (simulated) server on
        submit, not from a client-side rule.
      </p>

      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit} noValidate>
        <TextField
          api={form.field("email", {
            validators: [
              required("Email is required"),
              email("Enter a valid email address"),
            ],
          })}
          type="email"
          label="Email"
          required
          autoComplete="email"
        />
        <TextField
          api={form.field("password", {
            validators: [
              required("Password is required"),
              minLength(8, "At least 8 characters"),
            ],
          })}
          type="password"
          label="Password"
          required
          autoComplete="new-password"
        />

        {/* Its own `Watch`, not a `useWatch` in this component, so a keystroke doesn't re-render the whole form. */}
        <Watch api={form} select={(f) => (f.touched ? f.error : null)}>
          {(_form, formError) =>
            formError
              ? (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              )
              : null}
        </Watch>

        <SubmitButton api={form} className="w-full" pendingLabel="Creating…">
          Create account
        </SubmitButton>
      </form>
    </div>
  );
}
