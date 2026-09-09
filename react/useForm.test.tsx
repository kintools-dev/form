import "./_test-setup.ts";
import { assertEquals, assertStrictEquals } from "@std/assert";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import type { FormApi } from "@kintools/form-core";
import { useForm } from "./useForm.ts";
import { useWatch } from "./useWatch.ts";

Deno.test("useForm", async (t) => {
  await t.step(
    "creates the FormApi once and keeps the same instance across re-renders",
    () => {
      try {
        const { result, rerender } = renderHook(
          (initialValue: string) =>
            useForm({ initialValue: { name: initialValue } }),
          { initialProps: "a" },
        );

        const form = result.current;
        assertEquals(form.value, { name: "a" });

        rerender("b");
        assertStrictEquals(result.current, form);
        // `initialValue` from the latest render is synced via `updateOptions`,
        // but shouldn't retroactively overwrite the live `value`.
        assertEquals(form.value, { name: "a" });
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "keeps onSubmit/onSubmitInvalid closures fresh across re-renders",
    async () => {
      try {
        let calls = 0;
        const { result, rerender } = renderHook(
          (n: number) =>
            useForm({
              initialValue: { name: "a" },
              onSubmit: () => {
                calls = n;
              },
            }),
          { initialProps: 1 },
        );

        rerender(2);

        await act(async () => {
          await result.current.handleSubmit();
        });

        assertEquals(calls, 2);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "handleSubmit calls onSubmitInvalid when the form is invalid",
    async () => {
      try {
        let invalidCalls = 0;
        const { result } = renderHook(() =>
          useForm({
            initialValue: { name: "" },
            onSubmitInvalid: () => {
              invalidCalls++;
            },
          })
        );

        result.current.field("name", {
          validators: [(f) => (f.value ? null : "Required")],
        });
        await result.current.waitForValidation();

        await act(async () => {
          await result.current.handleSubmit();
        });

        assertEquals(invalidCalls, 1);
        assertEquals(result.current.touched, true);
      } finally {
        cleanup();
      }
    },
  );

  await t.step(
    "setErrors from onSubmit renders on the field and clears on the next edit",
    async () => {
      try {
        let form!: FormApi<{ email: string }>;

        const EmailField = () => {
          const field = useWatch(form.field("email"));
          return (
            <>
              <input
                data-testid="email"
                value={field.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.touched && field.error && (
                <span data-testid="email-error">{field.error}</span>
              )}
            </>
          );
        };

        const TestForm = () => {
          form = useForm<{ email: string }>({
            initialValue: { email: "taken@example.com" },
            onSubmit: (f) => {
              f.setErrors({ email: "Already registered" });
            },
          });
          return (
            <form onSubmit={form.handleSubmit}>
              <EmailField />
            </form>
          );
        };

        render(<TestForm />);
        assertEquals(screen.queryByTestId("email-error"), null);

        await act(async () => {
          await form.handleSubmit();
        });
        assertEquals(
          screen.getByTestId("email-error").textContent,
          "Already registered",
        );

        fireEvent.change(screen.getByTestId("email"), {
          target: { value: "new@example.com" },
        });
        assertEquals(screen.queryByTestId("email-error"), null);
      } finally {
        cleanup();
      }
    },
  );
});
